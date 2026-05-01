# PQC Transaction Pipeline — Debug Fixes

This document describes all changes made to fix the PQC (Falcon-512) transaction pipeline after the initial integration (documented in `PQC_CHANGES.md`). The initial implementation handled transaction construction, wire format, RPC ingestion, and signature verification, but the PQC transaction was not reaching confirmation. These fixes address four distinct issues discovered during end-to-end testing with `pqc-demo`.

**Result:** After all fixes, a Falcon-512 signed SOL transfer successfully confirms on `solana-test-validator`.

---

## Debugging Timeline

| # | Symptom | Root Cause | Fix |
|---|---------|-----------|-----|
| 1 | PQC tx silently dropped after RPC — never reaches sigverify | QUIC stream size limit (1232 B) < PQC tx wire size (1721 B) | Increase QUIC stream limits to 4096 B |
| 2 | `index out of bounds: the len is 0 but the index is 0` panic in banking stage | `SVMTransaction::signature()` calls `signatures()[0]` but PQC tx has 0 Ed25519 sigs | Store proxy signature in `ResolvedTransactionView`, return it from `SVMTransaction` |
| 3 | `MaxLoadedAccountsDataSizeExceeded` transaction error | V1 tx config defaults `loaded_accounts_data_size_limit` to 0 when bit 3 not set | Default to `MAX_LOADED_ACCOUNTS_DATA_SIZE_BYTES` (64 MiB) |
| 4 | `ComputationalBudgetExceeded` at instruction 0 | V1 tx config defaults `compute_unit_limit` to 0 when bit 2 not set | Default to `MAX_COMPUTE_UNIT_LIMIT` (1,400,000 CU) |

---

## Fix 1: QUIC Stream Size Limit

### Problem

PQC V1 transactions are 1721 bytes on the wire. The QUIC streamer's `max_stream_data_bytes` and `stream_receive_window_size` were both set to `PACKET_DATA_SIZE` (1232 bytes). When a 1721-byte PQC transaction arrived over QUIC, the `handle_chunks` function in the non-blocking QUIC handler silently rejected it with a `debug!`-level log, incrementing `invalid_stream_size` but providing no visible indication at `warn` level.

The transaction flow stopped at:
```
RPC → SendTransactionService → QUIC channel → [DROPPED HERE] → sigverify (never reached)
```

### Changes

#### File: `agave/streamer/src/quic.rs`

**1a. New constant for V1/PQC-capable stream size:**

```rust
/// Maximum wire size for V1/PQC transactions (matches V1_MAX_TRANSACTION_SIZE in RPC).
const MAX_STREAM_DATA_BYTES: u32 = 4096;
```

**1b. Updated `QuicStreamerConfig::default()`:**

Before:
```rust
stream_receive_window_size: PACKET_DATA_SIZE as u32,  // 1232
max_stream_data_bytes: PACKET_DATA_SIZE as u32,        // 1232
```

After:
```rust
stream_receive_window_size: MAX_STREAM_DATA_BYTES,     // 4096
max_stream_data_bytes: MAX_STREAM_DATA_BYTES,           // 4096
```

**1c. Removed unused import:**

```rust
// Removed: solana_packet::PACKET_DATA_SIZE
```

#### File: `agave/streamer/src/nonblocking/quic.rs`

**1d. Improved logging for stream rejection:**

Before:
```rust
debug!("stream error: truncated");
```

After:
```rust
warn!(
    "[PQC-TRACE] QUIC stream rejected: size {} > max {}",
    accum.meta.size, max_stream_data_bytes
);
```

Changed from `debug!` to `warn!` so stream rejections are visible in standard validator logs.

---

## Fix 2: Proxy Signature for PQC Transactions

### Problem

After fixing the QUIC layer, PQC transactions reached the banking stage but caused a panic:

```
thread 'solana-banking-stage-...' panicked at 'index out of bounds:
the len is 0 but the index is 0', resolved_transaction_view.rs:243
```

PQC transactions have **zero Ed25519 signatures** — the Falcon-512 signature is stored in the PQC blob, not in the standard `SignatureFrame`. The `SVMTransaction::signature()` implementation for `ResolvedTransactionView` directly accessed `self.view.signatures()[0]`, which panicked on the empty Ed25519 signatures array.

The banking stage, PoH, and status cache all require a 64-byte `Signature` for transaction identification. For PQC transactions, this is the **proxy signature**: `SHA-256(falcon_sig) || SHA-256(falcon_pubkey)`, computed deterministically from the Falcon key material.

### Changes

#### File: `agave/transaction-view/Cargo.toml`

**2a. Added dependency:**

```toml
solana-pqc = { workspace = true }
```

#### File: `agave/transaction-view/src/resolved_transaction_view.rs`

**2b. New import:**

```rust
use solana_pqc::{FalconPublicKey, FalconSignature};
```

**2c. New field on `ResolvedTransactionView`:**

```rust
pub struct ResolvedTransactionView<D: TransactionData> {
    view: TransactionView<true, D>,
    resolved_addresses: Option<LoadedAddresses>,
    writable_cache: [bool; 256],
    /// For PQC transactions: the deterministic proxy signature used as txid.
    pqc_proxy_signature: Option<Signature>,
}
```

**2d. Proxy signature computation in `try_new()`:**

```rust
let pqc_proxy_signature = if view.has_pqc() {
    Self::compute_proxy_signature(&view)
} else {
    None
};

Ok(Self {
    view,
    resolved_addresses,
    writable_cache,
    pqc_proxy_signature,
})
```

**2e. New helper method:**

```rust
fn compute_proxy_signature(view: &TransactionView<true, D>) -> Option<Signature> {
    let pk_bytes = view.pqc_pubkey_bytes()?;
    let sig_bytes = view.pqc_signature_bytes()?;
    let falcon_pk = FalconPublicKey::from_bytes(pk_bytes)?;
    let falcon_sig = FalconSignature::from_bytes(sig_bytes)?;
    Some(falcon_sig.to_proxy_signature(&falcon_pk))
}
```

**2f. Modified `SVMTransaction` implementation:**

Before:
```rust
impl<D: TransactionData> SVMTransaction for ResolvedTransactionView<D> {
    fn signature(&self) -> &Signature {
        &self.view.signatures()[0]  // PANICS when signatures is empty!
    }

    fn signatures(&self) -> &[Signature] {
        self.view.signatures()      // Returns empty slice for PQC
    }
}
```

After:
```rust
impl<D: TransactionData> SVMTransaction for ResolvedTransactionView<D> {
    fn signature(&self) -> &Signature {
        if let Some(ref proxy) = self.pqc_proxy_signature {
            proxy
        } else {
            &self.view.signatures()[0]
        }
    }

    fn signatures(&self) -> &[Signature] {
        if let Some(ref proxy) = self.pqc_proxy_signature {
            core::slice::from_ref(proxy)
        } else {
            self.view.signatures()
        }
    }
}
```

For PQC transactions, `signature()` returns a reference to the stored proxy signature, and `signatures()` returns it as a single-element slice. For standard transactions, behavior is unchanged.

---

## Fix 3: V1 Loaded Accounts Data Size Default

### Problem

After the proxy signature fix, PQC transactions progressed further but failed with:

```
transaction error: "MaxLoadedAccountsDataSizeExceeded"
```

This occurred on a simple SOL transfer that loads only ~192 bytes of account data (three accounts × 64 bytes base size).

V1 transactions pull their configuration from an embedded config mask (SIMD-0385). The PQC demo sets bit 5 (PQC flag) but **not bit 3** (loaded accounts data size limit). When bit 3 is absent, `loaded_accounts_data_size_limit()` returns `None`.

The code used `unwrap_or(0)`, giving an effective limit of **0 bytes**. Any account load immediately exceeds a 0-byte limit. By contrast, legacy/v0 transactions default to `MAX_LOADED_ACCOUNTS_DATA_SIZE_BYTES` (64 MiB) when no `SetLoadedAccountsDataSizeLimit` compute-budget instruction is present.

### Changes

Two files handle V1 transaction config — one for the `TransactionView` pipeline (TPU ingestion), one for the SDK `SanitizedVersionedTransaction` pipeline (RPC/replay).

#### File: `agave/runtime-transaction/src/runtime_transaction/transaction_view.rs`

**3a. New import:**

```rust
use solana_compute_budget::compute_budget_limits::MAX_LOADED_ACCOUNTS_DATA_SIZE_BYTES;
```

**3b. Changed default:**

Before:
```rust
loaded_accounts_data_size_limit: transaction_config_view
    .loaded_accounts_data_size_limit()
    .unwrap_or(0),
```

After:
```rust
loaded_accounts_data_size_limit: transaction_config_view
    .loaded_accounts_data_size_limit()
    .unwrap_or(MAX_LOADED_ACCOUNTS_DATA_SIZE_BYTES.get()),
```

#### File: `agave/runtime-transaction/src/runtime_transaction/sdk_transactions.rs`

**3c. New import:**

```rust
use solana_compute_budget::compute_budget_limits::MAX_LOADED_ACCOUNTS_DATA_SIZE_BYTES;
```

**3d. Changed default:**

Before:
```rust
loaded_accounts_data_size_limit: msg
    .config
    .loaded_accounts_data_size_limit
    .unwrap_or(0),
```

After:
```rust
loaded_accounts_data_size_limit: msg
    .config
    .loaded_accounts_data_size_limit
    .unwrap_or(MAX_LOADED_ACCOUNTS_DATA_SIZE_BYTES.get()),
```

---

## Fix 4: V1 Compute Unit Limit Default

### Problem

After fixing the loaded accounts limit, PQC transactions failed with:

```
transaction error: {"InstructionError":[0,"ComputationalBudgetExceeded"]}
```

Same root cause as Fix 3 — the PQC demo does not set bit 2 (compute unit limit) in the V1 config mask. The code used `unwrap_or(0)`, giving an effective compute budget of **0 CU**. The system program Transfer instruction requires ~150 CU, immediately exceeding a 0 CU budget.

Legacy/v0 transactions default to `MAX_COMPUTE_UNIT_LIMIT` (1,400,000 CU).

### Changes

#### File: `agave/runtime-transaction/src/runtime_transaction/transaction_view.rs`

**4a. Extended import:**

```rust
use solana_compute_budget::compute_budget_limits::{
    MAX_COMPUTE_UNIT_LIMIT, MAX_LOADED_ACCOUNTS_DATA_SIZE_BYTES,
};
```

**4b. Changed default:**

Before:
```rust
compute_unit_limit: transaction_config_view.compute_unit_limit().unwrap_or(0),
```

After:
```rust
compute_unit_limit: transaction_config_view.compute_unit_limit().unwrap_or(MAX_COMPUTE_UNIT_LIMIT),
```

#### File: `agave/runtime-transaction/src/runtime_transaction/sdk_transactions.rs`

**4c. Extended import:**

```rust
use solana_compute_budget::compute_budget_limits::{
    MAX_COMPUTE_UNIT_LIMIT, MAX_LOADED_ACCOUNTS_DATA_SIZE_BYTES,
};
```

**4d. Changed default:**

Before:
```rust
compute_unit_limit: msg.config.compute_unit_limit.unwrap_or(0),
```

After:
```rust
compute_unit_limit: msg.config.compute_unit_limit.unwrap_or(MAX_COMPUTE_UNIT_LIMIT),
```

---

## Diagnostic Addition

### File: `agave/runtime-transaction/src/runtime_transaction/transaction_view.rs`

Added diagnostic output in `as_sanitized_transaction()` to aid debugging of any future `SanitizeFailure` errors during conversion from `RuntimeTransaction<ResolvedTransactionView>` to `SanitizedTransaction`:

```rust
let result = SanitizedTransaction::try_new_from_fields(
    message,
    *self.message_hash(),
    self.is_simple_vote_transaction(),
    signatures,
);

if let Err(ref e) = result {
    eprintln!(
        "[PQC-TRACE] as_sanitized_transaction FAILED: {:?}, \
         version={:?}, num_required_sigs={}, num_static_keys={}, \
         num_sigs_provided={}, has_pqc={}",
        e,
        self.version(),
        self.num_required_signatures(),
        self.static_account_keys().len(),
        <Self as SVMTransaction>::signatures(self).len(),
        self.transaction.has_pqc(),
    );
}

Cow::Owned(result.expect("transaction view is sanitized"))
```

Also required adding:
```rust
use solana_svm_transaction::{svm_message::SVMMessage, svm_transaction::SVMTransaction};
```

---

## Summary of All Files Changed

| # | File | Change | Fix # |
|---|------|--------|-------|
| 1 | `agave/streamer/src/quic.rs` | New `MAX_STREAM_DATA_BYTES = 4096` constant; updated `QuicStreamerConfig::default()` to use it for `stream_receive_window_size` and `max_stream_data_bytes`; removed unused `PACKET_DATA_SIZE` import | 1 |
| 2 | `agave/streamer/src/nonblocking/quic.rs` | Changed stream rejection log from `debug!` to `warn!` with descriptive PQC-TRACE message | 1 |
| 3 | `agave/transaction-view/Cargo.toml` | Added `solana-pqc = { workspace = true }` dependency | 2 |
| 4 | `agave/transaction-view/src/resolved_transaction_view.rs` | Added `pqc_proxy_signature` field; `compute_proxy_signature()` helper; modified `SVMTransaction::signature()` and `signatures()` for PQC | 2 |
| 5 | `agave/runtime-transaction/src/runtime_transaction/transaction_view.rs` | Imported `MAX_COMPUTE_UNIT_LIMIT`, `MAX_LOADED_ACCOUNTS_DATA_SIZE_BYTES`; changed V1 defaults from `unwrap_or(0)` to max values; added `as_sanitized_transaction` diagnostic | 3, 4 |
| 6 | `agave/runtime-transaction/src/runtime_transaction/sdk_transactions.rs` | Imported `MAX_COMPUTE_UNIT_LIMIT`, `MAX_LOADED_ACCOUNTS_DATA_SIZE_BYTES`; changed V1 defaults from `unwrap_or(0)` to max values | 3, 4 |

**Total: 6 files modified across 4 fixes.**

---

## Verification

After all fixes, `pqc-demo` output:

```
=== Solana PQC (Falcon-512) Transaction Demo ===

Generating Falcon-512 keypair...
  Falcon pubkey:    09722c2192e600c1206c8349f15ba3b4... (897 bytes)
  Solana address:   FxCKfkjnuommkb5QL4BNLkYQNR5EcoVZ8dBg6VACYNsZ
  Receiver address: 6Uu44jk34kVnFi2Ggc7HD19igDMF36JiT7zTqeLEhs7Y

Requesting airdrop (5 SOL)...
  Airdrop tx: 52Zv5pb...
  Waiting for confirmation...
  Balance: 5 SOL

Building V1 PQC transfer (1 SOL)...
  Blockhash: 8ECLTacPRsCwVr82SJKEn6pVGSQkzNenT6fZQX7CyW1S
  V1 body size: 155 bytes

Signing with Falcon-512...
  Falcon sig: 39f2826c91ae790516e65f7ef1baabba... (655 bytes)
  Local verification: PASSED
  Wire transaction: 1721 bytes
  Proxy sig (txid): 2VUbjiBdNntgnd8YbxEN6kHJdE8kGbK9XmYuHKJfELSUPg8YGrAW...

Base64 payload: 2296 chars
Sending PQC transaction to RPC...
  RPC returned: 2VUbjiBdNntgnd8YbxEN6kHJdE8kGbK9XmYuHKJfELSUPg8YGrAW...

Waiting for confirmation...
  Transaction CONFIRMED!
  Receiver balance: 1 SOL

=== Demo complete ===
```

Validator log shows the full pipeline:
```
RPC send_transaction → PQC V1 detected (1721 bytes)
  → SendTransactionService → QUIC channel
  → SigVerifyStage → Falcon + Ed25519 verification SUCCESS
  → Banking stage → Bank → Transaction CONFIRMED
```
