# Enabling V1 Transactions: All Changes

This document describes every change made to the Agave validator, the `@solana/kit` TypeScript client library, and the `solana-transaction` Rust crate to enable end-to-end V1 transaction support.

V1 transactions (SIMD-0385) use a **messageFirst** wire format (`[0x81 | message | signatures]`), unlike V0/Legacy which use **signaturesFirst** (`[signatures | message]`). This architecture is critical for future PQC (Post-Quantum Cryptography) integration, as it allows larger signatures without breaking the message parsing.

---

## 1. Agave Validator Changes

### 1.1. Removed V1 block in TPU signature verification

**File:** `agave/perf/src/sigverify.rs`

The TPU (Transaction Processing Unit) pipeline had a hard block that rejected any V1 transaction before even attempting signature verification.

**Removed code:**
```rust
if matches!(view.version(), TransactionVersion::V1) {
    return false;
}
```

**Current state:** V1 transactions are now parsed and verified like any other version. Debug logging was added to trace V1 transactions through the pipeline:

```rust
let Ok(view) = SanitizedTransactionView::try_new_sanitized(data, true) else {
    if data.first() == Some(&0x81) {
        warn!("[PQC-DEBUG] V1 tx sanitization FAILED, data len={}, first bytes={:02x?}",
            data.len(), &data[..data.len().min(8)]);
    }
    return false;
};

if matches!(view.version(), TransactionVersion::V1) {
    let msg = view.message_data();
    warn!("[PQC-DEBUG] V1 tx parsed OK: data_len={}, msg_len={}, sigs={}, keys={}",
        data.len(), msg.len(), view.signatures().len(), view.static_account_keys().len());
}

// ... signature verification ...

if matches!(view.version(), TransactionVersion::V1) {
    warn!("[PQC-DEBUG] V1 sig verify result: {}", verified);
}
```

---

### 1.2. Removed V1 block in Banking Stage transaction checks

**File:** `agave/runtime/src/bank/check_transactions.rs`

The `check_transactions_with_processed_slots` function called `filter_v1_transactions`, which unconditionally returned `TransactionError::UnsupportedVersion` for any V1 transaction.

**Removed call (was between `check_age` and `check_status_cache`):**
```rust
let lock_results = self.filter_v1_transactions(sanitized_txs, &lock_results);
```

**Current state:** The `filter_v1_transactions` function still exists in the file (used by tests) but is no longer called in the processing pipeline. The flow now goes directly:

```rust
pub fn check_transactions_with_processed_slots<Tx: TransactionWithMeta>(...) {
    let lock_results = lock_results.to_vec();
    let lock_results = self.check_age_and_compute_budget_limits(
        sanitized_txs, &lock_results, max_age, error_counters,
    );
    // filter_v1_transactions call was HERE — removed
    self.check_status_cache(sanitized_txs, lock_results, collect_processed_slots, error_counters)
}
```

The `filter_v1_transactions` function that was being called:
```rust
fn filter_v1_transactions<Tx: TransactionWithMeta>(
    &self,
    sanitized_txs: &[impl core::borrow::Borrow<Tx>],
    lock_results: &[TransactionResult<()>],
) -> Vec<TransactionResult<()>> {
    // Discard v1 transactions until support is added.
    sanitized_txs.iter().zip(lock_results).map(|(tx, lock_result)| match lock_result {
        Err(err) => Err(err.clone()),
        Ok(()) if tx.borrow().version() == TransactionVersion::Number(1) => {
            Err(TransactionError::UnsupportedVersion)
        }
        Ok(()) => Ok(()),
    }).collect()
}
```

---

### 1.3. Removed V1 block in RPC preflight verification

**File:** `agave/runtime/src/bank.rs`

Two functions — `verify_transaction` and `verify_transaction_with_serialized_message` — had explicit checks that returned `UnsupportedVersion` for V1 transactions. These are used in the RPC preflight path when a client sends a transaction.

**Removed code (from both functions):**
```rust
if tx.version() == TransactionVersion::Number(1) {
    return Err(TransactionError::UnsupportedVersion);
}
```

**Current state:** Both functions now process V1 transactions the same way as V0 and Legacy.

---

### 1.4. Patched `solana-transaction` crate — fixed V1 signature verification

**File:** `agave/solana-transaction-patched/src/sanitized.rs`

This is the most critical fix. The `SanitizedTransaction::message_data()` method returns the bytes that signatures are verified against. For V1, it was calling `v1::serialize()` which serializes the message body **without** the `0x81` version prefix. However, the JS client signs the message **with** the `0x81` prefix (via `VersionedMessage::V1(...).serialize()`). This mismatch caused signature verification to always fail during RPC preflight.

**Before (bug):**
```rust
#[cfg(feature = "verify")]
fn message_data(&self) -> Vec<u8> {
    match &self.message {
        SanitizedMessage::Legacy(legacy_message) => legacy_message.message.serialize(),
        SanitizedMessage::V0(loaded_msg) => loaded_msg.message.serialize(),
        SanitizedMessage::V1(cached_msg) => v1::serialize(&cached_msg.message),
    }
}
```

**After (fix):**
```rust
#[cfg(feature = "verify")]
fn message_data(&self) -> Vec<u8> {
    match &self.message {
        SanitizedMessage::Legacy(legacy_message) => legacy_message.message.serialize(),
        SanitizedMessage::V0(loaded_msg) => loaded_msg.message.serialize(),
        SanitizedMessage::V1(cached_msg) => {
            VersionedMessage::V1(cached_msg.message.clone().into_owned()).serialize()
        }
    }
}
```

The fix wraps the V1 message in `VersionedMessage::V1(...)` before serializing, which includes the `0x81` version prefix — matching exactly what the client signed.

**Patching mechanism:** Since `solana-transaction` is an external crate (from crates.io), it was copied locally and patched. The workspace `Cargo.toml` uses `[patch.crates-io]` to redirect:

**File:** `agave/Cargo.toml`
```toml
[patch.crates-io]
crossbeam-epoch = { git = "https://github.com/anza-xyz/crossbeam", rev = "fd279d707025f0e60951e429bf778b4813d1b6bf" }
solana-transaction = { path = "solana-transaction-patched" }
```

---

### 1.5. Debug trace logging across the pipeline

To trace V1 transactions through the entire validator pipeline, `[PQC-TRACE]` log messages were added at every stage. These use `log::warn!` level and are visible when running the validator with `RUST_LOG=warn`.

| File | Location | What it logs |
|------|----------|-------------|
| `agave/rpc/src/rpc.rs` | `send_transaction` (~line 3865) | Wire length, first byte, skip_preflight flag, version |
| `agave/rpc/src/rpc.rs` | `send_transaction` (~line 3985) | Preflight passed, signature |
| `agave/rpc/src/rpc.rs` | `_send_transaction` (~line 2737) | Enqueue to SendTransactionService |
| `agave/send-transaction-service/src/send_transaction_service.rs` | `receive_txn_thread` (~line 234) | Transaction received from RPC channel |
| `agave/send-transaction-service/src/send_transaction_service.rs` | `receive_txn_thread` (~line 269) | Batch being sent to TPU via QUIC |
| `agave/send-transaction-service/src/transaction_client.rs` | `send_transactions_in_batch` (~line 212) | QUIC send attempt and result |
| `agave/core/src/sigverify_stage.rs` | `verifier` (~line 238) | Batch received with V1 tx |
| `agave/core/src/sigverify_stage.rs` | `verifier` (~line 274) | After dedup: unique/discarded counts |
| `agave/core/src/sigverify.rs` | `verify_and_send_packets` (~line 80) | Before ed25519_verify |
| `agave/core/src/sigverify.rs` | `verify_and_send_packets` (~line 91) | After ed25519_verify, valid packet count |
| `agave/perf/src/sigverify.rs` | `verify_packet` (~line 71) | V1 tx parsed OK: data/msg lengths |
| `agave/perf/src/sigverify.rs` | `verify_packet` (~line 90) | V1 sig verify result: true/false |

---

### 1.6. Build toolchain fix

**File:** `agave/.cargo/config.toml`

On macOS with Homebrew LLVM installed, the `CC`/`CXX` environment variables pointed to LLVM 21 (`/opt/homebrew/opt/llvm/bin/clang`), while system tools (`ar`, `ranlib`, `ld`) were Apple LLVM 15. This mismatch caused build failures in native dependencies (`ring`, `protobuf-src`).

```toml
[env]
CC = { value = "/usr/bin/cc", force = true }
CXX = { value = "/usr/bin/c++", force = true }
AR = { value = "/usr/bin/ar", force = true }
```

---

## 2. Solana Kit (TypeScript Client) Changes

### 2.1. Removed type-level V1 restriction

**File:** `kit/packages/transaction-messages/src/create-transaction-message.ts`

The `createTransactionMessage` function had a type alias that excluded version `1` from the allowed versions:

**Before:**
```typescript
type SupportedTransactionVersion = Exclude<TransactionVersion, 1>;

export function createTransactionMessage<TVersion extends SupportedTransactionVersion>(
    config: TransactionConfig<TVersion>,
): EmptyTransactionMessage<TVersion> { ... }
```

**After:**
```typescript
export function createTransactionMessage<TVersion extends TransactionVersion>(
    config: TransactionConfig<TVersion>,
): EmptyTransactionMessage<TVersion> { ... }
```

Now `createTransactionMessage({ version: 1 })` compiles without errors.

---

### 2.2. Updated type tests for V1

**File:** `kit/packages/transaction-messages/src/__typetests__/create-transaction-message-typetest.ts`

Added type test confirming V1 transaction message creation works:

```typescript
type V1TransactionMessage = Extract<TransactionMessage, { version: 1 }>;

// It creates v1 transaction messages.
{
    const message = createTransactionMessage({ version: 1 });
    message satisfies V1TransactionMessage;
}
```

Previously, this file had `@ts-expect-error` annotations for V1 that were removed.

---

### 2.3. Exported `setTransactionMessageConfig`

**File:** `kit/packages/transaction-messages/src/index.ts`

The `setTransactionMessageConfig` function (and related V1 config types) were defined in `v1-transaction-config.ts` but not exported from the package.

**Added:**
```typescript
export * from './v1-transaction-config';
```

This makes `setTransactionMessageConfig`, `V1TransactionConfig`, and related utilities available through `@solana/transaction-messages` and by extension `@solana/kit`.

---

### 2.4. Removed `@ts-expect-error` annotations in transaction tests

**Files:**
- `kit/packages/transactions/src/__tests__/transaction-size-test.ts`
- `kit/packages/transactions/src/__tests__/transaction-message-size-test.ts`

These test files had `@ts-expect-error` comments on lines that created V1 transaction messages, since V1 was previously disallowed at the type level. These annotations were removed to allow V1 test cases to compile.

---

## 3. Demo Application

**File:** `demo-app/demo.ts`

A working demo that sends a V1 SOL transfer on a local test validator:

```typescript
// Create V1 transaction message
const txMessage = createTransactionMessage({ version: 1 });

// Set V1-specific config (compute limits, loaded accounts data size)
// Without this, the validator defaults these to 0 and rejects the tx
let transactionMessage = setTransactionMessageConfig({
    computeUnitLimit: 200_000,
    loadedAccountsDataSizeLimit: 64 * 1024,
}, txMessage);

// Standard message building
transactionMessage = setTransactionMessageFeePayer(sender.address, transactionMessage);
transactionMessage = setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, transactionMessage);
transactionMessage = appendTransactionMessageInstruction(transferInstruction, transactionMessage);

// Sign and send (preflight enabled — works thanks to the solana-transaction patch)
const signedTx = await signTransactionMessageWithSigners(transactionMessage);
const sendAndConfirm = sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions });
await sendAndConfirm(signedTx, { commitment: 'confirmed' });
```

Key detail: `setTransactionMessageConfig` is required for V1 because unlike V0, V1 `TransactionConfig` fields default to `0` in the validator if not explicitly set. Without `loadedAccountsDataSizeLimit`, even a simple transfer fails with "Transaction exceeded max loaded accounts data size cap".

---

## Summary of Changes

| # | Component | File | Change | Type |
|---|-----------|------|--------|------|
| 1 | Agave | `perf/src/sigverify.rs` | Removed V1 rejection in TPU sig verify | Stub removal |
| 2 | Agave | `runtime/src/bank/check_transactions.rs` | Removed `filter_v1_transactions` call | Stub removal |
| 3 | Agave | `runtime/src/bank.rs` | Removed V1 rejection in `verify_transaction` | Stub removal |
| 4 | Agave | `solana-transaction-patched/src/sanitized.rs` | Fixed `message_data()` to include `0x81` prefix for V1 | Bug fix |
| 5 | Agave | `Cargo.toml` | Added `[patch.crates-io]` for solana-transaction | Patching |
| 6 | Agave | `.cargo/config.toml` | Fixed macOS build toolchain | Build fix |
| 7 | Agave | Multiple files (rpc, sigverify, send-tx-service) | Added `[PQC-TRACE]` debug logging | Debug |
| 8 | Kit | `create-transaction-message.ts` | Removed `Exclude<TransactionVersion, 1>` | Type fix |
| 9 | Kit | `index.ts` | Exported `v1-transaction-config` | Export fix |
| 10 | Kit | Type tests and unit tests | Removed `@ts-expect-error` for V1 | Test fix |

**Total: 3 stub removals + 1 bug fix + 1 type restriction removal = 5 functional changes to enable V1 end-to-end.**
