# PQC Transaction Pipeline: RPC → TPU

This document describes the complete path a **Falcon-512 PQC V1 transaction** takes
through the Solana RPC node before reaching the TPU. It covers the wire format,
deserialization, sanitization, signature verification, simulation, and forwarding.

---

## 1. Wire Format (bytes on the wire)

### Standard Ed25519 V1 Transaction

```
┌─────────────────────────────────────────────────────────┐
│ Version byte: 0x81 (1 byte)                             │  V1 prefix
├─────────────────────────────────────────────────────────┤
│ V1 Message Body:                                        │
│   ├─ MessageHeader (3 bytes)                            │  num_required_sigs, num_ro_signed, num_ro_unsigned
│   ├─ TransactionConfigMask (4 bytes, u32 LE)            │  bits 0-4: config fields
│   ├─ Blockhash (32 bytes)                               │  lifetime specifier
│   ├─ NumInstructions (1 byte)                           │
│   ├─ NumAddresses (1 byte)                              │
│   ├─ Addresses (NumAddresses × 32 bytes)                │
│   ├─ ConfigValues (variable, based on mask bits 0-4)    │
│   ├─ InstructionHeaders (NumInstructions × 4 bytes)     │
│   └─ InstructionPayloads (variable)                     │
├─────────────────────────────────────────────────────────┤
│ Signatures (num_required_sigs × 64 bytes)               │  Ed25519 signatures
└─────────────────────────────────────────────────────────┘
  Total: ~164–4096 bytes
```

### PQC Falcon-512 V1 Transaction

```
┌─────────────────────────────────────────────────────────┐
│ Version byte: 0x81 (1 byte)                             │  V1 prefix
├─────────────────────────────────────────────────────────┤
│ V1 Message Body:                                        │
│   ├─ MessageHeader (3 bytes)                            │
│   ├─ TransactionConfigMask (4 bytes, u32 LE)            │  bit 5 SET = PQC flag
│   ├─ Blockhash (32 bytes)                               │
│   ├─ NumInstructions (1 byte)                           │
│   ├─ NumAddresses (1 byte)                              │
│   ├─ Addresses (NumAddresses × 32 bytes)                │  [0] = SHA256(falcon_pubkey)[0..32]
│   ├─ ConfigValues (variable)                            │  PQC bit adds NO config bytes
│   ├─ InstructionHeaders + Payloads                      │
├─────────────────────────────────────────────────────────┤
│ Signatures (1 × 64 bytes)                               │  Proxy signature:
│                                                         │    SHA256(falcon_sig)[0..32] ||
│                                                         │    SHA256(falcon_pubkey)[0..32]
├─────────────────────────────────────────────────────────┤
│ PQC Falcon Trailer:                                     │
│   ├─ sig_len (2 bytes, u16 LE)                          │  actual Falcon sig length (≤666)
│   ├─ falcon_pubkey (897 bytes)                          │  Falcon-512 public key
│   └─ falcon_sig_padded (666 bytes)                      │  Falcon sig, zero-padded
└─────────────────────────────────────────────────────────┘
  Total: ~1729–1785 bytes
```

**Key difference**: bit 5 in `TransactionConfigMask` and the 1565-byte Falcon trailer
after signatures.

### TransactionConfigMask bit layout

| Bits  | Field                          | Config bytes |
|-------|--------------------------------|--------------|
| 0-1   | Priority fee (both bits = u64) | 8 bytes      |
| 2     | Compute unit limit (u32)       | 4 bytes      |
| 3     | Loaded accounts data size (u32)| 4 bytes      |
| 4     | Heap size (u32)                | 4 bytes      |
| **5** | **PQC flag (pure flag)**       | **0 bytes**  |
| 6-31  | Reserved / unknown             | —            |

---

## 2. RPC Entry Point

**File**: `agave/rpc/src/rpc.rs`, function `send_transaction()`

```
Client (base64 JSON-RPC) ──► send_transaction()
```

### Step 2.1: Decode wire bytes

```rust
let wire_transaction = decode_wire_bytes(&data, binary_encoding)?;
```

Decodes the base64 (or base58) string into raw bytes. Supports V1 sizes up to 4096 bytes.

### Step 2.2: Deserialize into VersionedTransaction

```rust
let unsanitized_tx: VersionedTransaction =
    wincode::deserialize(&wire_transaction)?;
```

This calls `VersionedTransaction::SchemaRead::read()` in `solana-transaction-patched`.

---

## 3. Deserialization (`SchemaRead`)

**File**: `solana-transaction-patched/src/versioned/mod.rs`

### Step 3.1: Version dispatch

```rust
let discriminator = reader.take_byte()?;  // 0x81 for V1
```

- `discriminator & 0x80 == 0` → Legacy/V0 path (unchanged)
- `discriminator == 0x81` → **V1 path**

### Step 3.2: Read V1 Message

```rust
let message = <VersionedMessage as SchemaReadContext<C, _>>::get_with_context(
    discriminator, reader.by_ref(),
)?;
```

Inside `solana-message-patched`, the V1 message `SchemaRead` does:

1. Reads `MessageHeader` (3 bytes)
2. Reads `TransactionConfigMask` (4 bytes) → `config_mask`
3. Reads blockhash (32 bytes)
4. Reads addresses, config values (based on bits 0-4), instructions
5. **Sets `config.pqc = config_mask.has_pqc()`** ← our patch

### Step 3.3: Read signatures

```rust
let num_signatures = message.header().num_required_signatures as usize; // 1
let signatures = <Vec<Signature>>::get_with_context(
    context::Len(num_signatures), reader.by_ref(),
)?;
```

Reads 1 × 64-byte signature (the proxy signature for PQC).

### Step 3.4: Read PQC Falcon trailer (conditional)

```rust
let is_pqc = match &message {
    VersionedMessage::V1(m) => m.config.pqc,  // checks bit 5
    _ => return Err(...)
};

let falcon_signer = if is_pqc {
    let sig_len = u16::from_le_bytes(reader.take_array()?);     // 2 bytes
    let pubkey = reader.take_borrowed(897)?.to_vec();            // 897 bytes
    let sig_padded = reader.take_borrowed(666)?;                 // 666 bytes
    Some(FalconSigner {
        pubkey,
        signature: sig_padded[..sig_len as usize].to_vec(),      // trim padding
    })
} else {
    None
};
```

**For standard transactions**: `is_pqc = false`, no trailer read, `falcon_signer = None`.

### Step 3.5: Construct result

```rust
VersionedTransaction { signatures, message, falcon_signer }
```

### Resulting struct

```rust
pub struct VersionedTransaction {
    pub signatures: Vec<Signature>,          // [proxy_sig]  (64 bytes)
    pub message: VersionedMessage,           // V1 message with config.pqc = true
    pub falcon_signer: Option<FalconSigner>, // Some({ pubkey: 897B, signature: ≤666B })
}
```

---

## 4. Sanitization

**File**: `rpc.rs` → `sanitize_transaction()` → `RuntimeTransaction::try_create()`

### Step 4.1: SanitizedVersionedTransaction

**File**: `solana-transaction-patched/src/versioned/sanitized.rs`

```rust
pub fn try_new(tx: VersionedTransaction) -> Result<Self, SanitizeError> {
    tx.sanitize_signatures()?;  // checks num_sigs == num_required_sigs (1 == 1 ✓)
    Ok(Self {
        signatures: tx.signatures,
        message: SanitizedVersionedMessage::try_from(tx.message)?,
        falcon_signer: tx.falcon_signer,  // propagated
    })
}
```

### Step 4.2: SanitizedTransaction

**File**: `solana-transaction-patched/src/sanitized.rs`

```rust
pub fn try_new(tx: SanitizedVersionedTransaction, ...) -> TransactionResult<Self> {
    // ... resolves message variant, loads addresses for V0 ...
    Ok(Self {
        message,
        message_hash,
        is_simple_vote_tx,
        signatures,
        falcon_signer,  // propagated from SanitizedVersionedTransaction
    })
}
```

### Data extraction from sanitized tx

```rust
let blockhash = *transaction.message().recent_blockhash();
let message_hash = *transaction.message_hash();
let signature = *transaction.signature();  // proxy sig = txid
```

---

## 5. Preflight: Signature Verification

**File**: `rpc.rs` line 3910 → `transaction.verify()`

**File**: `solana-transaction-patched/src/sanitized.rs`

```rust
pub fn verify(&self) -> TransactionResult<()> {
    let message_bytes = self.message_data();  // serialized V1 message body

    for (i, (signature, pubkey)) in self.signatures.iter()
        .zip(self.message.account_keys().iter())
        .enumerate()
    {
        let verified = if i == 0 {
            if let Some(falcon) = &self.falcon_signer {
                // PQC path: Falcon-512 verification
                AuthScheme::Falcon {
                    pubkey: &falcon.pubkey,
                    signature: &falcon.signature,
                }.verify_signer(signature, &account_pubkey, &message_bytes)
            } else {
                // Standard path: Ed25519
                signature.verify(pubkey.as_ref(), &message_bytes)
            }
        } else {
            // Additional signers always Ed25519
            signature.verify(pubkey.as_ref(), &message_bytes)
        };

        if !verified {
            return Err(TransactionError::SignatureFailure);
        }
    }
    Ok(())
}
```

### AuthScheme::verify_signer (Falcon path)

**File**: `agave/pqc/src/lib.rs`

Three checks performed:

| # | Check | What it verifies |
|---|-------|-----------------|
| 1 | `falcon_pk.derive_address() == account_key` | Falcon pubkey → SHA256 → matches `static_account_keys[0]` |
| 2 | `falcon_sig.verify(&falcon_pk, message)` | Falcon-512 cryptographic signature is valid over message bytes |
| 3 | `falcon_sig.to_proxy_signature(&falcon_pk) == hash_signature` | `SHA256(falcon_sig)[0..32] \|\| SHA256(falcon_pubkey)[0..32]` matches `signatures[0]` |

If any check fails → `TransactionError::SignatureFailure` → returned to client.

---

## 6. Preflight: Transaction Simulation

**File**: `rpc.rs` line 3936 → `preflight_bank.simulate_transaction()`

**File**: `runtime/src/bank.rs`

```rust
pub fn simulate_transaction(&self, transaction: &impl TransactionWithMeta, ...) {
    let batch = self.prepare_unlocked_batch_from_single_tx(transaction);
    self.load_and_execute_transactions(&batch, ...)  // runs via SVM, does NOT commit
}
```

This executes the transaction instructions against the current bank state:
- Loads accounts (sender, receiver, system program)
- Executes System Program `transfer` instruction
- Checks sender has sufficient balance
- Computes fee
- Returns result **without** committing state changes

For PQC transactions this is completely transparent — simulation only cares about
the message instructions and account keys, not the signature type.

---

## 7. Forward to TPU

**File**: `rpc.rs` → `_send_transaction()`

```rust
_send_transaction(
    meta,
    message_hash,
    signature,        // proxy sig = txid
    blockhash,
    wire_transaction, // ORIGINAL wire bytes (including Falcon trailer)
    last_valid_block_height,
    durable_nonce_info,
    max_retries,
)
```

Packs metadata into `TransactionInfo` and sends via `meta.transaction_sender`
to the TPU client, which forwards the **original wire bytes** to the leader's TPU port.

---

## 8. Complete Flow Diagram

```
Client
  │
  ▼
send_transaction(base64_string)
  │
  ├─► decode_wire_bytes()              → Vec<u8> (1785 bytes)
  │
  ├─► wincode::deserialize()           → VersionedTransaction
  │     │                                  .signatures = [proxy_sig]
  │     │                                  .message = V1 { config.pqc = true, ... }
  │     │                                  .falcon_signer = Some(FalconSigner)
  │     │
  │     └─► SchemaRead: version byte → V1 message → signatures → PQC trailer
  │
  ├─► sanitize_transaction()           → RuntimeTransaction<SanitizedTransaction>
  │     │                                  .falcon_signer preserved through chain
  │     │
  │     ├─► SanitizedVersionedTransaction::try_new()
  │     │     └─ sanitize_signatures (num_sigs == num_required_sigs)
  │     │
  │     └─► SanitizedTransaction::try_new()
  │           └─ resolves message, computes hash
  │
  ├─► transaction.verify()             → Ok(())
  │     │
  │     └─► i==0, falcon_signer.is_some()
  │           └─► AuthScheme::Falcon::verify_signer()
  │                 ├─ derive_address() == account_key     ✓
  │                 ├─ falcon_sig.verify(pk, msg)          ✓
  │                 └─ proxy_sig == expected_proxy          ✓
  │
  ├─► simulate_transaction()           → Ok (units=150, fee=5000)
  │     └─ load_and_execute_transactions (no commit)
  │
  └─► _send_transaction()             → wire_bytes → TPU
        └─ TransactionInfo { signature, blockhash, message_hash, wire_transaction }
```
