# PQC Transaction Pipeline: Banking Stage → PoH → Block

This document describes the complete path a **Falcon-512 PQC V1 transaction** takes
from the moment `sigverify` sends it into the banking stage, through scheduling,
SVM execution, and PoH recording into a block entry. It is the continuation of
`tpu-pqc-sigverify-pipeline.md` (which covers QUIC → SigVerify → `send()`).

At this stage the Falcon signature has **already been verified**. The focus here
is on how PQC data is preserved as the transaction moves through type
transformations, execution, and eventually into the block.

---

## 1. Overview

```
sigverify.rs:84  banking_stage_sender.send(BankingPacketBatch)
  │
  │ [crossbeam channel via BankingTracer]
  ▼
[1] TransactionViewReceiveAndBuffer       → receive packets from channel
  │   ├─ translate_to_runtime_view()      → SanitizedTransactionView → RuntimeTransaction
  │   ├─ TransactionState::new()          → priority + cost + max_age
  │   └─ push into priority queue         → TransactionViewStateContainer
  │
  ▼
[2] SchedulerController::process_transactions()
  │   └─ scheduler.schedule()             → ConsumeWork sent to worker thread
  │
  ▼
[3] ConsumeWorker::consume()
  │   └─ consumer.process_and_record_aged_transactions()
  │       ├─ bank.load_and_execute_transactions()     ← SVM execution
  │       └─ transaction_recorder.record_transactions()
  │           ├─ hash_transactions()                  → PoH mixin hash
  │           └─ self.record()                        → Record to PohRecorder
  │
  ▼
[4] PohRecorder::record()
  │   ├─ poh.record_batches(&mixins)      → mix hash into PoH chain
  │   └─ working_bank_sender.send(Entry)  → into block
  │
  ▼
[5] Entry { num_hashes, hash, transactions: Vec<VersionedTransaction> }
    → Blockstore → Shreds → Turbine broadcast
```

---

## 2. Type Transformation Chain

This is the core of this document — tracking exactly how a PQC transaction's
type evolves and where PQC data lives at each stage.

```
Vec<PacketBatch>                                      ← raw UDP packets (sigverified)
  │
  │ Arc::new(batches)
  ▼
BankingPacketBatch = Arc<Vec<PacketBatch>>             ← in channel
  │
  │ receiver.recv() → packet.data() → &[u8]
  ▼
SharedBytes                                           ← raw wire bytes of one packet
  │
  │ SanitizedTransactionView::try_new_sanitized()
  ▼
SanitizedTransactionView<SharedBytes>                 ← zero-copy parsed view
  │                                                      has_pqc(), pqc_pubkey_bytes(), pqc_signature_bytes()
  │ RuntimeTransaction::try_new(view, MessageHash::Compute, None)
  ▼
RuntimeTransaction<SanitizedTransactionView<_>>       ← + message hash, + vote detection
  │
  │ RuntimeTransaction::try_new(view, loaded_addresses, reserved_keys)
  ▼
RuntimeTransaction<ResolvedTransactionView<_>>        ← + ALT-resolved accounts
  │                                                      PQC data still accessible via Deref chain
  │ TransactionState::new(view, max_age, priority, cost)
  ▼
TransactionState { transaction, max_age, priority, cost }  ← in priority container
  │
  │ scheduler.schedule() → extract into ConsumeWork
  ▼
ConsumeWork<RuntimeTransaction<ResolvedTransactionView<SharedBytes>>>
  │   .transactions: Vec<Tx>
  │   .max_ages: Vec<MaxAge>
  │   .ids: Vec<TransactionId>
  │
  │ consumer.process_and_record_aged_transactions()
  │ → bank.load_and_execute_transactions()             ← SVM (PQC-agnostic)
  │ → tx.to_versioned_transaction()
  ▼
Vec<VersionedTransaction>                              ← converted for recording
  │   .falcon_signer = Some(FalconSigner)
  │
  │ hash_transactions() → Hash
  │ record_sender.try_send(Record { mixins, transaction_batches, bank_id })
  ▼
Record → PohRecorder::record()
  │
  │ poh.record_batches(&mixins) → Entry
  ▼
Entry { num_hashes, hash, transactions }               ← into block
```

---

## 3. Receive and Buffer (packet → RuntimeTransaction)

### Step 3.1: Channel receive

**File**: `core/src/banking_stage/transaction_scheduler/receive_and_buffer.rs`, line 108

```rust
impl ReceiveAndBuffer for TransactionViewReceiveAndBuffer {
    type Transaction = RuntimeTransaction<ResolvedTransactionView<SharedBytes>>;
    type Container = TransactionViewStateContainer;

    fn receive_and_buffer_packets(
        &mut self, container: &mut Self::Container, decision: &BufferedPacketsDecision,
    ) -> Result<ReceivingStats, DisconnectedError> {
        // ...
        match self.receiver.recv_timeout(TIMEOUT) {
            Ok(packet_batch_message) => {                         // line 154
                stats.accumulate(self.handle_packet_batch_message(
                    container, decision, &root_bank, &working_bank,
                    packet_batch_message,                         // BankingPacketBatch
                ));
            }
        }
    }
}
```

### Step 3.2: Per-packet handling

**File**: `receive_and_buffer.rs`, line 323

```rust
for packet_batch in packet_batch_message.iter() {
    for packet in packet_batch.iter() {
        let Some(packet_data) = packet.data(..) else { continue };

        // Copy bytes into container, run sanitization + ALT resolution
        container.try_insert_map_only_with_data(packet_data, |bytes| {
            Self::try_handle_packet(
                bytes, root_bank, working_bank,
                transaction_account_lock_limit, enable_instruction_accounts_limit,
            )
        })
    }
}
```

### Step 3.3: try_handle_packet → translate_to_runtime_view

**File**: `receive_and_buffer.rs`, line 398

```rust
fn try_handle_packet(bytes: SharedBytes, ...) -> Result<TransactionViewState, ...> {
    let (view, deactivation_slot) = translate_to_runtime_view(
        bytes, root_bank, transaction_account_lock_limit, enable_instruction_accounts_limit,
    )?;
    // ... compute budget, priority, cost ...
    Ok(TransactionState::new(view, max_age, priority, cost))
}
```

### Step 3.4: translate_to_runtime_view (three-phase construction)

**File**: `receive_and_buffer.rs`, line 429

```rust
pub fn translate_to_runtime_view<D: TransactionData>(data: D, bank: &Bank, ...)
    -> Result<(RuntimeTransaction<ResolvedTransactionView<D>>, u64), PacketHandlingError>
{
    // Phase 1: Parse + sanitize wire bytes (same TransactionFrame as sigverify)
    let view = SanitizedTransactionView::try_new_sanitized(data, ...)?;

    // Phase 2: Wrap with runtime metadata (message hash, vote detection)
    let view = RuntimeTransaction::<SanitizedTransactionView<_>>::try_new(
        view, MessageHash::Compute, None,
    )?;

    // Phase 3: Resolve ALT addresses → final form
    let (loaded_addresses, deactivation_slot) = load_addresses_for_view(&view, bank)?;
    let view = RuntimeTransaction::<ResolvedTransactionView<_>>::try_new(
        view, loaded_addresses, bank.get_reserved_account_keys(),
    )?;

    Ok((view, deactivation_slot))
}
```

**PQC throughout this chain**: the `TransactionView` retains `PqcFrame` offsets
into the underlying `SharedBytes`. The `RuntimeTransaction` wraps it generically.
At every level, `self.has_pqc()`, `self.pqc_pubkey_bytes()`, `self.pqc_signature_bytes()`
remain accessible via the Deref chain:

```
RuntimeTransaction<ResolvedTransactionView<SharedBytes>>
    └─ Deref → ResolvedTransactionView<SharedBytes>
        └─ Deref → TransactionView<true, SharedBytes>
            ├─ has_pqc()            → self.frame.pqc_frame().present
            ├─ pqc_pubkey_bytes()   → &bytes[pubkey_offset..pubkey_offset + 897]
            └─ pqc_signature_bytes() → &bytes[sig_offset..sig_offset + actual_len]
```

No PQC-specific logic is needed in this phase — the data rides along for free
inside the zero-copy view over the original packet bytes.

---

## 4. Scheduling

### Step 4.1: SchedulerController main loop

**File**: `core/src/banking_stage/transaction_scheduler/scheduler_controller.rs`, line 191

```rust
self.receive_completed()?;                                     // line 191
let scheduled = self.process_transactions(&decision, ...)?;    // line 192
self.receive_and_buffer_packets(&decision)?;                   // line 199
```

### Step 4.2: process_transactions → scheduler.schedule()

**File**: `scheduler_controller.rs`, line 229

```rust
BufferedPacketsDecision::Consume(bank) => {
    let scheduling_budget = cost_pacer.scheduling_budget(now);
    self.scheduler.schedule(
        &mut self.container,
        scheduling_budget,
        |txs, results| Self::pre_graph_filter(txs, results, bank, ...),
        |_| PreLockFilterAction::AttemptToSchedule,
    )?
}
```

The scheduler (PrioGraph or Greedy) pops transactions from the priority queue by
priority, resolves account lock conflicts, and sends batches to worker threads:

### Step 4.3: ConsumeWork message

**File**: `core/src/banking_stage/scheduler_messages.rs`, line 41

```rust
pub struct ConsumeWork<Tx> {
    pub batch_id: TransactionBatchId,
    pub ids: Vec<TransactionId>,
    pub transactions: Vec<Tx>,      // Vec<RuntimeTransaction<ResolvedTransactionView<SharedBytes>>>
    pub max_ages: Vec<MaxAge>,
}
```

Sent via `consume_work_senders[thread_id]` to the assigned `ConsumeWorker`.

**PQC**: completely transparent. The scheduler sees only `priority`, `cost`, and
account lock sets. Signature type is invisible.

---

## 5. Execution (SVM)

### Step 5.1: ConsumeWorker

**File**: `core/src/banking_stage/consume_worker.rs`, line 120

```rust
let output = self.consumer.process_and_record_aged_transactions(
    bank,
    &work.transactions,     // &[RuntimeTransaction<ResolvedTransactionView<SharedBytes>>]
    &work.max_ages,
    ExecutionFlags { drop_on_failure: false, all_or_nothing: false },
);
```

### Step 5.2: Age re-check

**File**: `core/src/banking_stage/consumer.rs`, line 171

```rust
pub fn process_and_record_aged_transactions(&self, bank: &Bank,
    txs: &[impl TransactionWithMeta], max_ages: &[MaxAge], flags: ExecutionFlags,
) -> ProcessTransactionBatchOutput {
    let pre_results = txs.iter().zip(max_ages).map(|(tx, max_age)| {
        bank.resanitize_transaction_minimally(
            tx, max_age.sanitized_epoch, max_age.alt_invalidation_slot,
        )
    });
    self.process_and_record_transactions_with_pre_results(bank, txs, pre_results, flags)
}
```

### Step 5.3: QoS selection + account locking

**File**: `consumer.rs`, line 198

```rust
let (transaction_qos_cost_results, cost_model_throttled_transactions_count) =
    QosService::select_and_accumulate_transaction_costs(bank, txs, pre_results);

let batch = bank.prepare_sanitized_batch_with_results(txs, /* ... */);
```

### Step 5.4: SVM execution

**File**: `consumer.rs`, line 319

```rust
let load_and_execute_transactions_output = bank.load_and_execute_transactions(
    batch,
    bank.max_processing_age(),
    &mut execute_and_commit_timings.execute_timings,
    &mut error_counters,
    TransactionProcessingConfig {
        account_overrides: None,
        log_messages_bytes_limit: self.log_messages_bytes_limit,
        limit_to_load_programs: true,
        recording_config: ExecutionRecordingConfig::new_single_setting(
            transaction_status_sender_enabled
        ),
        drop_on_failure: flags.drop_on_failure,
        all_or_nothing: flags.all_or_nothing,
    }
);
```

Returns `LoadAndExecuteTransactionsOutput { processing_results, processed_counts, balance_collector }`.

**PQC**: the SVM is completely unaware of signature type. It sees account keys,
instructions, and balance changes. The PQC address (`SHA256(falcon_pubkey || bump)`)
is just a 32-byte Pubkey like any other.

---

## 6. Recording into PoH

### Step 6.1: Convert to VersionedTransaction

**File**: `consumer.rs`, line 353

```rust
let processed_transactions = processing_results.iter()
    .zip(batch.sanitized_transactions())
    .filter_map(|(processing_result, tx)| {
        if processing_result.was_processed() {
            Some(tx.to_versioned_transaction())    // ← type conversion happens here
        } else {
            None
        }
    })
    .collect_vec();
```

This is where the type changes from `RuntimeTransaction<ResolvedTransactionView<SharedBytes>>`
to `VersionedTransaction`.

### Step 6.2: TransactionRecorder

**File**: `poh/src/transaction_recorder.rs`, line 52

```rust
pub fn record_transactions(&self, bank_id: BankId,
    transactions: Vec<VersionedTransaction>,
) -> RecordTransactionsSummary {
    let hash = hash_transactions(&transactions);   // PoH mixin
    self.record(bank_id, vec![hash], vec![transactions])
}
```

### Step 6.3: hash_transactions (PoH mixin)

**File**: `entry/src/entry.rs`

```rust
pub fn hash_transactions(transactions: &[VersionedTransaction]) -> Hash {
    let hash_inputs: Vec<&[u8]> = transactions
        .iter()
        .flat_map(|tx| tx.signatures.iter().map(|sig| sig.as_ref()))
        .collect();
    let merkle_tree = MerkleTree::new(&hash_inputs);
    merkle_tree.get_root().copied().unwrap_or_default()
}
```

For PQC transactions, `signatures[0]` is the proxy signature
(`SHA256(falcon_sig)[0:32] || SHA256(falcon_pk)[0:32]`), which already
cryptographically commits to the Falcon material. Including the raw Falcon
data in the Merkle tree would be redundant — the proxy signature provides
the same tamper-evidence guarantee.

### Step 6.4: PohRecorder::record

**File**: `poh/src/poh_recorder.rs`, line 328

```rust
pub fn record(&mut self, bank_id: BankId, mixins: Vec<Hash>,
    transaction_batches: Vec<Vec<VersionedTransaction>>,
) -> Result<RecordSummary> {
    loop {
        poh_lock.record_batches(&mixins, &mut self.entries);

        if mixed_in {
            for (entry, transactions) in self.entries.drain(..).zip(transaction_batches) {
                self.working_bank_sender.send((
                    working_bank.bank.clone(),
                    (
                        Entry {
                            num_hashes: entry.num_hashes,
                            hash: entry.hash,
                            transactions,              // Vec<VersionedTransaction>
                        }.into(),
                        tick_height,
                    ),
                ))
            }
        }
    }
}
```

The `Entry.transactions` field is `Vec<VersionedTransaction>`, serialized with
wincode. The wincode `SchemaWrite` for V1 `VersionedTransaction` writes the Falcon
trailer when `falcon_signer.is_some()`, so the block contains the full PQC data.

---

## 7. Replay Verification

When another validator receives this block and replays it, the entry's transactions
are deserialized and verified.

### Step 7.1: Entry deserialization

Wincode `SchemaRead` for `VersionedTransaction` reads the PQC trailer when the V1
config mask has bit 5 set, populating `falcon_signer: Some(FalconSigner { ... })`.

### Step 7.2: validate_and_hash_entry_transactions

**File**: `entry/src/entry.rs`, line 350

```rust
fn validate_and_hash_entry_transactions<Tx, F>(entry: Entry, verify: &F,
    unverified_signatures: &mut UnverifiedSignatures,
) -> Result<EntryType<Tx>> {
    entry.transactions.into_iter().map(|versioned_tx| {
        let signatures = versioned_tx.signatures.iter().copied().collect();
        let signer_pubkeys = static_account_keys[..num_signers].iter().copied().collect();
        let serialized_message = versioned_tx.message.serialize();
        let falcon_signer = versioned_tx.falcon_signer.clone();   // ← preserved
        let verified_transaction = verify(versioned_tx, &serialized_message)?;
        unverified_signatures.signatures.push(TxVerificationData {
            is_simple_vote: verified_transaction.is_simple_vote_transaction(),
            signatures,
            serialized_message,
            signer_pubkeys,
            falcon_signer,                                         // ← preserved
        });
        Ok(verified_transaction)
    }).collect()
}
```

### Step 7.3: UnverifiedSignatures::verify

```rust
pub fn verify(&self) -> Result<()> {
    self.signatures.par_iter().try_for_each(|tx_signatures| {
        let all_ok = tx_signatures.signatures.iter()
            .zip(tx_signatures.signer_pubkeys.iter())
            .enumerate()
            .all(|(i, (signature, pubkey))| {
                if i == 0 {
                    if let Some(ref falcon) = tx_signatures.falcon_signer {
                        // PQC path: Falcon-512 verification
                        let auth = solana_pqc::AuthScheme::Falcon {
                            pubkey: &falcon.pubkey,
                            signature: &falcon.signature,
                        };
                        return auth.verify_signer(
                            signature,
                            &Pubkey::from(*pubkey.as_ref()),
                            &tx_signatures.serialized_message,
                        );
                    }
                }
                // Ed25519 path (standard)
                signature.verify(pubkey.as_ref(), &tx_signatures.serialized_message)
            });
        if all_ok { Ok(()) } else { Err(TransactionError::SignatureFailure) }
    })
}
```

---

## 8. Storage (Protobuf)

Historical transactions stored via the `TransactionStatusService` use protobuf.

### Step 8.1: Proto schema

**File**: `storage-proto/proto/confirmed_block.proto`

```protobuf
message Transaction {
    repeated bytes signatures = 1;
    Message message = 2;
    optional FalconSigner falcon_signer = 3;   // ← new field
}

message FalconSigner {
    bytes pubkey = 1;                           // 897 bytes (Falcon-512)
    bytes signature = 2;                        // ≤666 bytes (actual length)
}
```

### Step 8.2: Rust conversion

**File**: `storage-proto/src/convert.rs`

```rust
impl From<VersionedTransaction> for generated::Transaction {
    fn from(value: VersionedTransaction) -> Self {
        Self {
            signatures: /* ... */,
            message: Some(value.message.into()),
            falcon_signer: value.falcon_signer.map(|fs| generated::FalconSigner {
                pubkey: fs.pubkey,
                signature: fs.signature,
            }),
        }
    }
}

impl From<generated::Transaction> for VersionedTransaction {
    fn from(value: generated::Transaction) -> Self {
        Self {
            signatures: /* ... */,
            message: /* ... */,
            falcon_signer: value.falcon_signer.map(|fs| FalconSigner {
                pubkey: fs.pubkey,
                signature: fs.signature,
            }),
        }
    }
}
```

---

## 9. Complete Call Chain

```
sigverify.rs:84   banking_stage_sender.send(BankingPacketBatch)
  │                 Arc<Vec<PacketBatch>> — raw verified packets
  │
  │ [crossbeam channel via BankingTracer]
  ▼
banking_stage.rs:509   TransactionViewReceiveAndBuffer { receiver }
  │
  │ [thread: solBnkTxSched]
  ▼
scheduler_controller.rs:199  receive_and_buffer_packets()
  └─ receive_and_buffer.rs:108  receive_and_buffer_packets()
       └─ receive_and_buffer.rs:227  handle_packet_batch_message()
            │
            │  for each packet:
            ├─ receive_and_buffer.rs:337  container.try_insert_map_only_with_data(bytes, ...)
            │    └─ receive_and_buffer.rs:398  try_handle_packet(bytes)
            │         └─ receive_and_buffer.rs:429  translate_to_runtime_view()
            │              ├─ SanitizedTransactionView::try_new_sanitized(data)
            │              │    └─ TransactionFrame::try_new_as_v1()
            │              │         └─ if has_pqc → PqcFrame { offsets into SharedBytes }
            │              ├─ RuntimeTransaction<SanitizedTransactionView>::try_new()
            │              │    └─ computes message_hash, detects vote tx
            │              └─ RuntimeTransaction<ResolvedTransactionView>::try_new()
            │                   └─ resolves ALT addresses
            │
            └─ TransactionState::new(view, max_age, priority, cost)
                 └─ push into TransactionViewStateContainer priority queue
  │
  ▼
scheduler_controller.rs:192  process_transactions()
  └─ scheduler.schedule(&mut container, budget, ...)
       └─ pops by priority, resolves lock conflicts
       └─ sends ConsumeWork { transactions, max_ages, ids } to worker
  │
  │ [crossbeam channel to solCoWorker00]
  ▼
consume_worker.rs:120  consumer.process_and_record_aged_transactions(bank, &txs, &max_ages)
  │
  ├─ consumer.rs:181  resanitize_transaction_minimally()         ← age re-check
  ├─ consumer.rs:198  QosService::select_and_accumulate()        ← cost throttling
  ├─ consumer.rs:210  bank.prepare_sanitized_batch_with_results()← lock accounts
  │
  ├─ consumer.rs:319  bank.load_and_execute_transactions(batch)  ← SVM execution
  │                     → LoadAndExecuteTransactionsOutput
  │
  ├─ consumer.rs:353  tx.to_versioned_transaction()              ← type conversion
  │                     RuntimeTransaction<ResolvedTransactionView> → VersionedTransaction
  │                     falcon_signer: extracted from PqcFrame
  │
  ├─ consumer.rs:377  transaction_recorder.record_transactions(bank_id, processed_txs)
  │    │
  │    ├─ transaction_recorder.rs:61  hash_transactions(&transactions)
  │    │    └─ Merkle(signatures)  — proxy_sig already commits to Falcon data
  │    │
  │    └─ transaction_recorder.rs:65  self.record(bank_id, vec![hash], vec![txs])
  │         └─ record_sender.try_send(Record { mixins, transaction_batches, bank_id })
  │
  │ [crossbeam channel to PohRecorder]
  ▼
poh_recorder.rs:365  poh_lock.record_batches(&mixins, &mut entries)
  │                    └─ SHA256 chain: prev_hash → mix transaction hash → new PoH hash
  │
  └─ poh_recorder.rs:378  working_bank_sender.send(Entry { num_hashes, hash, transactions })
       │                     transactions: Vec<VersionedTransaction> with falcon_signer intact
       │
       │ [channel to blockstore/broadcast]
       ▼
       Entry serialized via wincode → Shreds → Turbine → other validators
```

---

## 10. PQC Awareness by Pipeline Stage

| Stage | PQC-aware? | What it knows |
|-------|-----------|---------------|
| `sigverify` (before this pipeline) | **Yes** | Verifies Falcon signature via `AuthScheme::Falcon` |
| `TransactionFrame` (parsing) | **Yes** | Parses `PqcFrame` with offsets into wire bytes |
| `TransactionView` | **Yes** | Exposes `has_pqc()`, `pqc_pubkey_bytes()`, `pqc_signature_bytes()` |
| `translate_to_runtime_view()` | No | Calls generic `try_new_sanitized()` — PQC is transparent |
| `RuntimeTransaction` | No | Generic wrapper — PQC data accessible via Deref |
| `SchedulerController` / `schedule()` | No | Sees only priority, cost, account locks |
| `ConsumeWorker` / `Consumer` | No | Passes through to SVM |
| `bank.load_and_execute_transactions()` (SVM) | No | Executes instructions, unaware of signature type |
| **`to_versioned_transaction()`** | **Yes** | Extracts PQC data from `TransactionView` → `FalconSigner` |
| `hash_transactions()` | No | Hashes `tx.signatures` only — proxy_sig already commits to Falcon data |
| `TransactionRecorder` / `PohRecorder` | No | Passes through `VersionedTransaction` and hash |
| `Entry` serialization (wincode) | **Yes** | `SchemaWrite` writes PQC trailer when `falcon_signer.is_some()` |
| **Replay `UnverifiedSignatures::verify()`** | **Yes** | Dispatches to `AuthScheme::Falcon` for PQC |
| **Storage (protobuf)** | **Yes** | `FalconSigner` proto message preserves PQC data |

