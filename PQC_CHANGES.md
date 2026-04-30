# PQC (Post-Quantum Cryptography) Integration: All Changes

This document describes every change made to the Agave validator and the new crates/demo to enable Falcon-512 post-quantum signature support in Solana V1 transactions.

The integration uses the existing SIMD-0385 V1 `messageFirst` wire format (`[0x81 | message | signatures]`) and extends it with a PQC signer blob appended after the message body. Falcon-512 public keys (897 bytes) and signatures (variable, up to 666 bytes) are too large for Solana's native 32-byte `Pubkey` / 64-byte `Signature` types, so the design introduces address derivation via SHA-256 and a proxy signature mechanism for compatibility.

---

## Architecture Overview

### PQC Transaction Wire Format

```
[0x81][V1 message body][PQC blob]
```

Where the V1 message body is standard SIMD-0385 format with **bit 5** set in the `TransactionConfigMask`, and the PQC blob is:

```
[2B actual_sig_len LE][897B falcon_pubkey][666B falcon_sig zero-padded]
```

Total PQC blob size: 1565 bytes (fixed).

### Key Design Decisions

| Problem | Solution |
|---------|----------|
| Falcon pubkey is 897 bytes, Solana expects 32 bytes | Solana address = `SHA-256(falcon_pubkey || bump)` off-curve |
| Falcon signature is ~650 bytes, Solana expects 64 bytes | Proxy signature = `SHA-256(sig) \|\| SHA-256(pk)` for PoH/txid |
| Standard deserializer doesn't know about PQC format | Bit 5 in V1 `TransactionConfigMask` signals PQC presence |
| Bit 5 is not in upstream `solana-message` KNOWN_BITS | Bit 5 is a *pure flag* — no associated 4-byte config value |
| `falcon-sign` JS lib incompatible with `pqcrypto-falcon` Rust | Demo written entirely in Rust with `pqcrypto-falcon` |

---

## Phase 1: New `solana-pqc` Crate

### 1.1. Workspace integration

**File:** `agave/Cargo.toml`

Added `pqc` to workspace members and new workspace-level dependencies:

```toml
# In [workspace.members]:
    "pqc",

# In [workspace.dependencies]:
pqcrypto-falcon = "0.3.0"
pqcrypto-traits = "0.3.5"
sha2 = "0.10"
hex = "0.4.3"
solana-pqc = { path = "pqc", version = "=4.1.0-alpha.0", features = ["agave-unstable-api"] }
```

---

### 1.2. Crate definition

**File:** `agave/pqc/Cargo.toml` (new)

```toml
[package]
name = "solana-pqc"
description = "Post-Quantum Cryptography support for Solana (Falcon-512)"

[dependencies]
pqcrypto-falcon = { workspace = true }
pqcrypto-traits = { workspace = true }
sha2 = { workspace = true }
solana-pubkey = { workspace = true, default-features = false }
solana-signature = { workspace = true }
hex = { workspace = true }
```

---

### 1.3. Core implementation

**File:** `agave/pqc/src/lib.rs` (new, 333 lines)

Provides the following public API:

**Constants:**
- `FALCON512_PUBKEY_LEN = 897` — Falcon-512 public key size
- `FALCON512_SIG_MAX_LEN = 666` — maximum detached signature size
- `FALCON512_WIRE_LEN = 1565` — total PQC blob on the wire (2 + 897 + 666)
- `PQC_CONFIG_MASK_BIT = 5` — bit index in V1 `TransactionConfigMask`
- `FALCON512_ALGORITHM_ID = 0` — implicit algorithm identifier

**Types:**

```rust
pub struct FalconPublicKey([u8; 897]);

impl FalconPublicKey {
    pub fn from_bytes(bytes: &[u8]) -> Option<Self>;
    pub fn as_bytes(&self) -> &[u8; 897];
    pub fn derive_address(&self) -> Pubkey; // SHA-256(self.0 || bump) off-curve
}
```

```rust
pub struct FalconSignature { buf: [u8; 666], len: usize }

impl FalconSignature {
    pub fn from_bytes(bytes: &[u8]) -> Option<Self>;
    pub fn from_wire(wire: &[u8]) -> Option<Self>;     // parse [2B len][666B padded]
    pub fn verify(&self, pubkey: &FalconPublicKey, message: &[u8]) -> bool;
    pub fn to_proxy_signature(&self, pubkey: &FalconPublicKey) -> Signature;
    pub fn to_wire(&self) -> [u8; 668];                // serialize to wire
}
```

**Functions:**
```rust
pub fn generate_falcon_keypair() -> (FalconPublicKey, Vec<u8>);
pub fn falcon_sign(message: &[u8], secret_key: &[u8]) -> Option<FalconSignature>;
pub fn is_pqc_config_mask(mask: u32) -> bool;
```

**Tests:** 8 unit tests covering keypair generation, sign/verify, proxy signature determinism, wire roundtrip, address derivation, boundary lengths, and config mask checking.

---

## Phase 2: Transaction Config Mask — PQC Bit 5

### 2.1. Extended allowed mask

**File:** `agave/transaction-view/src/transaction_config_frame.rs`

**Before:**
```rust
const ALLOWED_TRANSACTION_CONFIG_MASK: u32 = 0b1_1111; // bits 0-4
```

**After:**
```rust
const ALLOWED_TRANSACTION_CONFIG_MASK: u32 = 0b11_1111; // bits 0-5
```

This allows bit 5 to pass `sanitize_mask()` without error.

---

### 2.2. Pure flag semantics — bit 5 has no config value

The upstream `solana-message` crate treats each set bit in the config mask as having an associated 4-byte config value. Since bit 5 is not in the upstream `KNOWN_BITS`, the deserializer would not consume any bytes for it, causing misalignment.

**Solution:** Bit 5 is treated as a *pure flag* — it appears in the mask but has no associated config value on the wire.

**Key changes:**

```rust
// New constant — bits that carry 4-byte config values (excludes bit 5)
const CONFIG_VALUE_BITS: u32 = 0b1_1111;

// num_values counts only value-carrying bits
let num_values = (mask & Self::CONFIG_VALUE_BITS).count_ones() as u8;

// word_index_for_bit returns None for non-value bits
pub(crate) fn word_index_for_bit(&self, bit: u8) -> Option<u8> {
    if !Self::has_bit(Self::CONFIG_VALUE_BITS, bit) {
        return None;
    }
    // ...
}
```

**New accessor:**
```rust
pub fn has_pqc(&self) -> bool {
    self.mask & (1u32 << 5) != 0
}

pub fn pqc_algorithm_id(&self) -> Option<u32> {
    if self.transaction_config_frame.has_pqc() { Some(0) } else { None }
}
```

**Tests added:** `test_pqc_bit_only`, `test_pqc_with_other_fields`, `test_has_pqc_false_when_unset`, updated `test_unknown_bits_rejected`.

---

## Phase 3: Transaction Frame — PQC Wire Parsing

### 3.1. PqcFrame struct

**File:** `agave/transaction-view/src/transaction_frame.rs`

New struct added to `TransactionFrame`:

```rust
#[derive(Debug, Default, Clone, Copy)]
pub(crate) struct PqcFrame {
    pub(crate) sig_len_offset: u16,   // offset of 2-byte actual-sig-length prefix
    pub(crate) pubkey_offset: u16,    // offset of 897-byte Falcon pubkey
    pub(crate) sig_offset: u16,       // offset of 666-byte padded Falcon sig
    pub(crate) present: bool,
}
```

---

### 3.2. V1 parser extended for PQC

**File:** `agave/transaction-view/src/transaction_frame.rs` — `try_new_as_v1()`

After parsing instructions, the parser checks `has_pqc()` on the config frame:

```rust
if has_pqc {
    const PQC_WIRE_LEN: usize = 2 + 897 + 666; // = 1565
    check_remaining(bytes, offset, PQC_WIRE_LEN)?;
    // Record offsets for pubkey and signature
    pqc_frame = PqcFrame { sig_len_offset, pubkey_offset, sig_offset, present: true };
    offset += PQC_WIRE_LEN;

    // Ed25519 co-signers follow the PQC blob (count = num_required_signatures - 1)
    if num_required_signatures > 1 {
        advance_offset_for_array::<Signature>(bytes, &mut offset, num_required_signatures - 1)?;
    }
} else {
    // Standard: all signatures are Ed25519
    advance_offset_for_array::<Signature>(bytes, &mut offset, num_required_signatures)?;
}
```

The `SignatureFrame` for downstream consumers (PoH, txid) points to the Ed25519 co-signers, not the PQC blob.

---

### 3.3. Accessor methods

```rust
// TransactionFrame
pub(crate) fn pqc_frame(&self) -> &PqcFrame;
pub(crate) unsafe fn pqc_pubkey_bytes<'a>(&self, bytes: &'a [u8]) -> Option<&'a [u8]>;
pub(crate) unsafe fn pqc_signature_bytes<'a>(&self, bytes: &'a [u8]) -> Option<&'a [u8]>;
```

`pqc_signature_bytes` reads the 2-byte length prefix and returns only the actual signature bytes (not the zero-padded remainder).

---

### 3.4. Message range adjusted

```rust
pub(crate) fn message_range(&self) -> (u16, u16) {
    let end = match self.version() {
        TransactionVersion::V1 if self.pqc_frame.present => {
            self.pqc_frame.sig_len_offset // message ends where PQC blob starts
        }
        TransactionVersion::V1 => self.signature.offset,
        _ => self.data_len,
    };
    (self.message_header.offset, end)
}
```

---

## Phase 4: TransactionView — PQC Public API

**File:** `agave/transaction-view/src/transaction_view.rs`

Three new public methods on `TransactionView<SANITIZED, D>`:

```rust
pub fn has_pqc(&self) -> bool;
pub fn pqc_pubkey_bytes(&self) -> Option<&[u8]>;
pub fn pqc_signature_bytes(&self) -> Option<&[u8]>;
```

These delegate to the underlying `TransactionFrame`.

---

## Phase 4b: Signature Count Sanitization

**File:** `agave/transaction-view/src/sanitize.rs`

Updated `sanitize_signatures` to account for PQC signer:

```rust
fn sanitize_signatures(view: &UnsanitizedTransactionView<impl TransactionData>) -> Result<()> {
    let total_signers = if view.has_pqc() {
        // PQC signer 0 is not in the Ed25519 signatures array
        view.num_signatures().wrapping_add(1)
    } else {
        view.num_signatures()
    };

    if total_signers != view.num_required_signatures() {
        return Err(TransactionViewError::SanitizeError);
    }
    // ...
    if view.num_static_account_keys() < total_signers {
        return Err(TransactionViewError::SanitizeError);
    }
    // ...
}
```

---

## Phase 5: TPU Signature Verification — PQC Path

### 5.1. Dependencies

**File:** `agave/perf/Cargo.toml`

Added:
```toml
pqcrypto-falcon = { workspace = true }
solana-pqc = { workspace = true }
```

---

### 5.2. PQC verification in `verify_packet`

**File:** `agave/perf/src/sigverify.rs`

The `verify_packet` function now branches on `view.has_pqc()`:

```rust
let verified = if view.has_pqc() {
    verify_pqc_transaction(&view, message, static_account_keys)
} else {
    // Standard Ed25519 path
    signatures.iter().zip(static_account_keys.iter())
        .all(|(signature, pubkey)| signature.verify(pubkey.as_ref(), message))
};
```

---

### 5.3. New `verify_pqc_transaction` function

```rust
fn verify_pqc_transaction<D: TransactionData>(
    view: &SanitizedTransactionView<D>,
    message: &[u8],
    static_account_keys: &[Pubkey],
) -> bool {
    // 1. Extract Falcon pubkey and signature from wire
    let falcon_pk = FalconPublicKey::from_bytes(view.pqc_pubkey_bytes()?)?;
    let falcon_sig = FalconSignature::from_bytes(view.pqc_signature_bytes()?)?;

    // 2. Verify address binding: SHA-256(falcon_pubkey) == account_keys[0]
    if falcon_pk.derive_address() != static_account_keys[0] { return false; }

    // 3. Verify Falcon-512 signature against message bytes
    if !falcon_sig.verify(&falcon_pk, message) { return false; }

    // 4. Verify remaining Ed25519 co-signers (if any)
    ed25519_signatures.iter()
        .zip(static_account_keys[1..].iter())
        .all(|(sig, pk)| sig.verify(pk.as_ref(), message))
}
```

---

## Phase 5b: RPC Path — PQC Transaction Handling

### 5b.1. Dependencies

**File:** `agave/rpc/Cargo.toml`

Added:
```toml
solana-pqc = { workspace = true }
agave-transaction-view = { workspace = true }
```

---

### 5b.2. Version-aware size limits

**File:** `agave/rpc/src/rpc.rs`

New constants for V1 transactions (up to 4096 bytes wire):

```rust
const V1_MAX_TRANSACTION_SIZE: usize = 4096;
const V1_MAX_BASE58_SIZE: usize = 5654;
const V1_MAX_BASE64_SIZE: usize = 5464;
```

---

### 5b.3. New helper: `decode_wire_bytes`

Replaces the size-check logic inside `decode_and_deserialize`. Uses version-aware limits — if the encoded string exceeds legacy limits, it checks against V1 limits before rejecting. After decoding, inspects the first byte to decide the decoded-size cap (1232 for legacy/V0, 4096 for V1).

```rust
fn decode_wire_bytes(encoded: &str, encoding: TransactionBinaryEncoding) -> Result<Vec<u8>> {
    let is_v1_possible = encoded.len() > MAX_BASE64_SIZE.max(MAX_BASE58_SIZE);
    // ... decode with adaptive limits ...
    let max_decoded = if wire_output[0] & 0x80 != 0 { 4096 } else { 1232 };
    // ...
}
```

---

### 5b.4. New helper: `is_pqc_v1_wire`

Peeks at raw bytes to detect PQC V1 transactions without full deserialization:

```rust
fn is_pqc_v1_wire(bytes: &[u8]) -> bool {
    bytes.len() >= 8
        && bytes[0] == 0x81              // V1 prefix
        && u32::from_le_bytes(bytes[4..8]) & (1 << 5) != 0  // bit 5 set
}
```

---

### 5b.5. New helper: `parse_pqc_wire_transaction`

Uses `UnsanitizedTransactionView` to parse PQC wire bytes and extract metadata needed for TPU forwarding:

```rust
fn parse_pqc_wire_transaction(wire: &[u8]) -> Result<(Signature, Hash, Hash)> {
    let view = UnsanitizedTransactionView::try_new_unsanitized(wire)?;
    let falcon_pk = FalconPublicKey::from_bytes(view.pqc_pubkey_bytes()?)?;
    let falcon_sig = FalconSignature::from_bytes(view.pqc_signature_bytes()?)?;
    let proxy_signature = falcon_sig.to_proxy_signature(&falcon_pk);
    let blockhash = *view.recent_blockhash();
    let message_hash = Hash::new(&Sha256::digest(view.message_data()));
    Ok((proxy_signature, blockhash, message_hash))
}
```

---

### 5b.6. Modified `send_transaction` — PQC fast path

The `send_transaction` RPC handler now:

1. Decodes wire bytes with `decode_wire_bytes` (V1-aware limits)
2. Checks `is_pqc_v1_wire()` — if true:
   - Calls `parse_pqc_wire_transaction()` to get proxy signature, blockhash, message hash
   - Skips preflight (standard `wincode::deserialize` would fail on PQC format)
   - Forwards raw wire bytes directly to TPU via `_send_transaction()`
3. If not PQC — proceeds with standard `wincode::deserialize::<VersionedTransaction>` + preflight

---

## Phases 6–7: Entry Replay & PoH

### Phase 6: Entry Replay

Skipped for the local single-validator prototype. Entry replay verification is mostly disabled when running `solana-test-validator`. Documented as future work.

### Phase 7: PoH Proxy Signature

Already handled by the proxy signature mechanism:

- `proxy = SHA-256(falcon_sig) || SHA-256(falcon_pubkey)` → 64 bytes
- This fits into `solana_signature::Signature([u8; 64])` used by PoH hashing and transaction ID
- Generated via `FalconSignature::to_proxy_signature()` in `solana-pqc`
- The `TransactionFrame` stores Ed25519 co-signer signatures at `SignatureFrame.offset`, which is what PoH and downstream consumers access via `view.signatures()`

---

## Phase 8: Rust PQC Demo

### 8.1. Crate structure

**Directory:** `pqc-demo/` (standalone crate, outside agave workspace)

**File:** `pqc-demo/Cargo.toml`

```toml
[dependencies]
solana-pqc = { path = "../agave/pqc" }
base64 = "0.22"
bs58 = "0.5"
hex = "0.4"
sha2 = "0.10"
serde_json = "1.0"
ureq = { version = "2", features = ["json"] }
```

Uses the same `pqcrypto-falcon` implementation as the validator (via `solana-pqc`), guaranteeing cryptographic compatibility.

---

### 8.2. Demo implementation

**File:** `pqc-demo/src/falcon_demo.rs` (326 lines)

The demo performs the following end-to-end flow:

1. **Generate Falcon-512 keypair** via `solana_pqc::generate_falcon_keypair()`
2. **Derive Solana address** via `FalconPublicKey::derive_address()` (SHA-256)
3. **Request airdrop** (5 SOL) to the derived address via JSON-RPC
4. **Build V1 message body** manually — header, config mask with bit 5 set, blockhash, addresses, system program Transfer instruction
5. **Sign with Falcon-512** via `solana_pqc::falcon_sign()` — signs `[0x81 || v1_body]`
6. **Local verification** — `FalconSignature::verify()` before sending
7. **Assemble PQC wire** — `[0x81][v1_body][2B sig_len][897B pubkey][666B padded sig]`
8. **Send via RPC** as base64-encoded `sendTransaction` call
9. **Wait for confirmation** by polling `getSignatureStatuses`

**Dry-run mode:** `cargo run -- --dry-run` skips all RPC calls and demonstrates keypair generation, signing, verification, and wire format assembly offline.

**Sample dry-run output:**
```
=== Solana PQC (Falcon-512) Transaction Demo ===
  (dry-run mode — no RPC calls)

Generating Falcon-512 keypair...
  Falcon pubkey:    0913fab4249916273a1c6df3fc623c86... (897 bytes)
  Solana address:   DvQjUSGChdLt41zLsC7KQpwN8369GCNXSCcMrCS89o6p
  Receiver address: 6Uu44jk34kVnFi2Ggc7HD19igDMF36JiT7zTqeLEhs7Y

Building V1 PQC transfer (1 SOL)...
  Blockhash: 6AcPSgzRCQXUcS2u1wB6D4uxYLG8JA9L3Fr5yAzAXzuy (dummy)
  V1 body size: 155 bytes

Signing with Falcon-512...
  Falcon sig: 39a6d21da980ecd44c8eeab8a22961f4... (653 bytes)
  Local verification: PASSED
  Wire transaction: 1721 bytes
  Proxy sig (txid): 3irgtfmJL8KBFaAhF6ftzqvCPJYRnbbNnFdswbg2LqsN...

Base64 payload: 2296 chars

  [dry-run] Skipping RPC send. Wire format built successfully.

=== Demo complete ===
```

---

## Summary of All Changes

| # | Phase | Component | File | Change | Type |
|---|-------|-----------|------|--------|------|
| 1 | 1 | Agave | `Cargo.toml` | Added `pqc` workspace member + `pqcrypto-falcon`, `pqcrypto-traits`, `sha2`, `hex`, `solana-pqc` deps | Config |
| 2 | 1 | Agave | `pqc/Cargo.toml` | New crate `solana-pqc` | New crate |
| 3 | 1 | Agave | `pqc/src/lib.rs` | `FalconPublicKey`, `FalconSignature`, `generate_falcon_keypair`, `falcon_sign`, proxy sig, off-curve address derivation, constants, 9 tests | New code |
| 4 | 2 | Agave | `transaction-view/src/transaction_config_frame.rs` | Extended `ALLOWED_MASK` to 6 bits, added `CONFIG_VALUE_BITS`, `has_pqc()`, `pqc_algorithm_id()`, pure-flag semantics for bit 5, 3 new tests | Feature |
| 5 | 3 | Agave | `transaction-view/src/transaction_frame.rs` | Added `PqcFrame` struct, PQC wire parsing in `try_new_as_v1`, `pqc_pubkey_bytes()`, `pqc_signature_bytes()`, adjusted `message_range()` | Feature |
| 6 | 4 | Agave | `transaction-view/src/transaction_view.rs` | Added `has_pqc()`, `pqc_pubkey_bytes()`, `pqc_signature_bytes()` public methods | Feature |
| 7 | 4b | Agave | `transaction-view/src/sanitize.rs` | Updated `sanitize_signatures` to account for PQC signer (total = ed25519 + 1) | Fix |
| 8 | 5 | Agave | `perf/Cargo.toml` | Added `pqcrypto-falcon`, `solana-pqc` deps | Config |
| 9 | 5 | Agave | `perf/src/sigverify.rs` | Added `verify_pqc_transaction()`, PQC branch in `verify_packet()` | Feature |
| 10 | 5b | Agave | `rpc/Cargo.toml` | Added `solana-pqc`, `agave-transaction-view` deps | Config |
| 11 | 5b | Agave | `rpc/src/rpc.rs` | V1 size limits, `decode_wire_bytes()`, `is_pqc_v1_wire()`, `parse_pqc_wire_transaction()`, PQC fast path in `send_transaction` | Feature |
| 12 | 8 | Demo | `pqc-demo/Cargo.toml` | New standalone crate for PQC demo | New crate |
| 13 | 8 | Demo | `pqc-demo/src/falcon_demo.rs` | Full end-to-end demo: keygen, address, airdrop, V1 message build, Falcon sign, wire assembly, RPC send | New code |

**Total: 2 new crates + 7 modified files = 9 functional changes to enable PQC Falcon-512 in Solana V1 transactions.**
