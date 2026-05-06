# PQC Transaction Pipeline: TPU → Banking Stage

This document describes the complete path a **Falcon-512 PQC V1 transaction** takes
on the **leader node** from the moment it arrives on the TPU QUIC port through
signature verification and into the banking stage scheduler. It is the continuation
of `rpc-pqc-transaction-pipeline.md` (which covers Client → RPC → TPU send).

Both pipelines operate on the **same wire bytes**, but the leader uses a completely
different code path — **zero-copy `transaction-view`** instead of
`wincode::deserialize`.

---

## 1. Overview

```
QUIC wire bytes (~1785 bytes for PQC)
  │
  ▼
[1] QUIC Server (streamer)        → PacketBatch::Single(BytesPacket)
  │                                  crossbeam channel (bounded, 50K)
  ▼
[2] SigVerifyStage                → dedup + verify_packet()
  │                                  per-packet on rayon thread pool
  │                                  → BankingPacketBatch = Arc<Vec<PacketBatch>>
  ▼
[3] BankingStage                  → receive_and_buffer_packets()
  │   ├─ translate_to_runtime_view()  → SanitizedTransactionView → RuntimeTransaction
  │   ├─ check_transactions()         → age/blockhash check
  │   └─ scheduler → workers          → load accounts, run SVM, commit, PoH record
  ▼
[4] Block / PoH
```

---

## 2. QUIC Packet Reception

**File**: `core/src/tpu.rs`

### Step 2.1: Channel creation

```rust
const TPU_CHANNEL_SIZE: usize = 50_000;                       // line 89
let (packet_sender, packet_receiver) = bounded(TPU_CHANNEL_SIZE);  // line 164
```

Bounded crossbeam channel of 50K `PacketBatch` items bridges the QUIC server
thread to the SigVerify thread.

### Step 2.2: QUIC server spawn

```rust
spawn_stake_weighted_qos_server(                               // lines 225-236
    "solQuicTpu",
    "quic_streamer_tpu",
    transactions_quic_sockets,
    keypair,
    packet_sender,       // ← writes into the bounded channel
    staked_nodes.clone(),
    tpu_quic_server_config.quic_streamer_config,
    tpu_quic_server_config.qos_config,
    cancel.clone(),
)
```

**File**: `streamer/src/quic.rs` → `streamer/src/nonblocking/quic.rs`

When a QUIC stream finishes, `handle_chunks()` (line ~720) assembles bytes:

```rust
let packet = BytesPacket::new(bytes, meta);                    // line ~770
let packet_batch = PacketBatch::Single(packet);                // line ~790
packet_sender.try_send(packet_batch)                           // line ~796
```

**For PQC**: the ~1785 raw wire bytes (V1 message + proxy signature + Falcon trailer)
arrive as a single `BytesPacket`. No parsing happens at this stage.

---

## 3. SigVerifyStage

**File**: `core/src/tpu.rs`, lines 271–278

```rust
let sigverify_stage = {
    let verifier = TransactionSigVerifier::new(
        sigverify_threadpool.clone(),
        non_vote_sender,                    // → banking stage channel
        enable_block_production_forwarding.then(|| forward_stage_sender.clone()),
    );
    SigVerifyStage::new(packet_receiver, verifier, "solSigVerTpu", "tpu-verifier")
};
```

### Step 3.1: Verifier service loop

**File**: `core/src/sigverify_stage.rs`

`verifier_service()` (line 288) spawns thread `solSigVerTpu` with a main loop:

```rust
loop {                                                         // line 305
    // Reset deduplicator if saturated
    deduper.maybe_reset(...);                                  // line 306
    // Call verifier()
    Self::verifier(&deduper, &packet_receiver, &mut verifier, ...);  // line 309
}
```

### Step 3.2: Receive + dedup + verify

`verifier()` (line 222):

```rust
// Receive up to 5000 packets from channel
let (mut batches, num_packets, recv_duration) =
    streamer::recv_packet_batches(recvr, SOFT_RECEIVE_CAP)?;  // line 230-231

// Deduplicate packets (bloom filter)
let discard_or_dedup_fail =
    deduper::dedup_packets_and_count_discards(deduper, &mut batches);  // line 258-259

// Verify signatures and send to banking
verifier.verify_and_send_packets(batches, num_packets_to_verify, ...)?;  // line 264-270
```

### Step 3.3: TransactionSigVerifier::verify_and_send_packets

**File**: `core/src/sigverify.rs`, lines 60–106

```rust
self.thread_pool.spawn(move || {
    // Verify all packet signatures in parallel via rayon
    sigverify::verify_transactions(                            // line 78
        &thread_pool, &mut batches, reject_non_vote, valid_packets
    );

    // Wrap verified batches and send to banking stage
    let banking_packet_batch = BankingPacketBatch::new(batches);  // line 82
    banking_stage_sender.send(banking_packet_batch)?;             // line 84
});
```

---

## 4. Signature Verification (the hot path)

**File**: `perf/src/sigverify.rs`

### Step 4.1: verify_transactions (parallel dispatch)

```rust
pub fn verify_transactions(                                    // line 195
    thread_pool: &rayon::ThreadPool,
    batches: &mut [PacketBatch],
    reject_non_vote: bool,
    packet_count: usize,
) {
    thread_pool.install(|| {
        batches.par_iter_mut().flatten().for_each(|mut packet| {
            if !packet.meta().discard()
                && !verify_packet(&mut packet, reject_non_vote)
            {
                packet.meta_mut().set_discard(true);           // mark invalid
            }
        });
    });
}
```

Each packet is verified independently in parallel on the rayon thread pool.

### Step 4.2: verify_packet (per-packet, where PQC lives)

```rust
fn verify_packet(packet: &mut PacketRefMut, reject_non_vote: bool) -> bool {
    let data = packet.data(..)?;                               // raw wire bytes

    // Zero-copy parse: TransactionFrame + sanitization checks
    let view = SanitizedTransactionView::try_new_sanitized(data, true)?;

    let message = view.message_data();
    let signatures = view.signatures();
    let static_account_keys = view.static_account_keys();

    // Determine auth scheme for signer 0
    let auth = if view.has_pqc() {
        // PQC path: read Falcon material from trailer via zero-copy offsets
        let pk = view.pqc_pubkey_bytes()?;    // &[u8; 897] from PqcFrame offset
        let sig = view.pqc_signature_bytes()?; // &[u8; ≤666] from PqcFrame offset
        AuthScheme::Falcon { pubkey: pk, signature: sig }
    } else {
        AuthScheme::Ed25519
    };

    // Verify signer 0 (fee payer)
    let signer0_ok = auth.verify_signer(
        &signatures[0], &static_account_keys[0], message
    );

    // Verify co-signers 1..N (always Ed25519)
    let cosigners_ok = signatures[1..].iter()
        .zip(static_account_keys[1..].iter())
        .all(|(sig, pk)| sig.verify(pk.as_ref(), message));

    signer0_ok && cosigners_ok
}
```

---

## 5. Zero-Copy Parsing (transaction-view)

Unlike the RPC path which uses `wincode::deserialize` → `VersionedTransaction` (heap
allocation), the leader path uses **zero-copy `TransactionFrame`** that stores byte
offsets into the original packet buffer.

### Step 5.1: TransactionFrame::try_new_as_v1

**File**: `transaction-view/src/transaction_frame.rs`, lines 115–231

Parses the V1 wire format incrementally:

```
offset 0:   Version byte (0x81)
offset 1:   MessageHeader (3 bytes: num_required_sigs, num_ro_signed, num_ro_unsigned)
offset 4:   TransactionConfigMask (4 bytes, u32 LE)
offset 8:   Blockhash (32 bytes)
offset 40:  NumInstructions (1 byte)
offset 41:  NumAddresses (1 byte)
offset 42:  Addresses (NumAddresses × 32 bytes)
offset ?:   ConfigValues (based on bits 0-4 of mask)
offset ?:   InstructionHeaders + Payloads
offset ?:   Signatures (num_required_sigs × 64 bytes)
offset ?:   [PQC Trailer if bit 5 set: 2 + 897 + 666 = 1565 bytes]
```

### Step 5.2: PQC trailer parsing

```rust
let has_pqc = transaction_config_frame.has_pqc();              // line 180
let mut pqc_frame = PqcFrame::default();

if has_pqc {
    const PQC_WIRE_LEN: usize = 2 + 897 + 666;  // = 1565    // line 184
    check_remaining(bytes, offset, PQC_WIRE_LEN)?;             // line 185

    pqc_frame = PqcFrame {
        sig_len_offset: offset as u16,                         // 2B sig length
        pubkey_offset: (offset + 2) as u16,                    // 897B Falcon pubkey
        sig_offset: (offset + 2 + 897) as u16,                // 666B Falcon sig
        present: true,
    };
    offset = offset.wrapping_add(PQC_WIRE_LEN);               // line 193
}

// Verify entire transaction was consumed
if offset != bytes.len() {
    return Err(TransactionViewError::ParseError);
}
```

### Step 5.3: PqcFrame struct

**File**: `transaction-view/src/transaction_frame.rs`, lines 43–60

```rust
pub(crate) struct PqcFrame {
    pub(crate) sig_len_offset: u16,   // offset of 2-byte LE actual-sig-length
    pub(crate) pubkey_offset: u16,    // offset of 897-byte Falcon public key
    pub(crate) sig_offset: u16,       // offset of 666-byte Falcon signature (padded)
    pub(crate) present: bool,         // whether PQC data exists
}
```

All fields are **byte offsets** into the original packet buffer — no copies, no
allocations. Accessed via:

```rust
// Returns &[u8] slice into packet buffer — zero-copy
view.pqc_pubkey_bytes()     → &bytes[pubkey_offset..pubkey_offset + 897]
view.pqc_signature_bytes()  → &bytes[sig_offset..sig_offset + actual_len]
```

### Step 5.4: TransactionConfigFrame::has_pqc

**File**: `transaction-view/src/transaction_config_frame.rs`, lines 63–65

```rust
pub(crate) const fn has_pqc(&self) -> bool {
    self.mask & (1u32 << 5) != 0      // bit 5 of TransactionConfigMask
}
```

### Step 5.5: message_data() for V1

**File**: `transaction-view/src/transaction_frame.rs`, lines 306–312

```rust
pub(crate) fn message_range(&self) -> (u16, u16) {
    let end = match self.version() {
        TransactionVersion::V1 => self.signature.offset,  // message ends where sigs begin
        _ => self.data_len,
    };
    (self.message_header.offset, end)
}
```

For V1, the message body is `bytes[0..signatures_offset]` — everything before the
signatures section. This is the data that gets signed and verified.

---

## 6. AuthScheme::verify_signer (Falcon path)

**File**: `pqc/src/lib.rs`, lines 260–299

Identical logic to the RPC path — three checks:

| # | Check | What it verifies |
|---|-------|-----------------|
| 1 | `FalconPublicKey::derive_address() == account_key` | `SHA256(falcon_pk \|\| bump)` matches `static_account_keys[0]` (off-curve) |
| 2 | `FalconSignature::verify(&pk, message)` | Falcon-512 cryptographic signature is valid over message bytes |
| 3 | `proxy_sig == falcon_sig.to_proxy_signature(&pk)` | `SHA256(falcon_sig)[0..32] \|\| SHA256(falcon_pk)[0..32]` matches `signatures[0]` |

If any check fails → `verify_packet` returns `false` → `packet.meta().set_discard(true)`.

---

## 7. Into Banking Stage

After `verify_transactions` completes, verified batches are sent as
`BankingPacketBatch = Arc<Vec<PacketBatch>>` to the banking stage.

### Step 7.1: SchedulerController::run

**File**: `core/src/banking_stage/transaction_scheduler/scheduler_controller.rs`, line 125

```rust
while !self.exit.load(Ordering::Relaxed) {
    self.receive_completed()?;                                 // line 191
    self.process_transactions(&decision, ...)?;                // line 192
    self.receive_and_buffer_packets(&decision)?;               // line 199
}
```

### Step 7.2: TransactionViewReceiveAndBuffer

**File**: `core/src/banking_stage.rs`, lines 509–512

```rust
let receive_and_buffer = TransactionViewReceiveAndBuffer {
    receiver: self.non_vote_receiver.clone(),   // ← from sigverify
    sharable_banks: sharable_banks.clone(),
};
```

### Step 7.3: receive_and_buffer_packets → translate_to_runtime_view

**File**: `core/src/banking_stage/transaction_scheduler/receive_and_buffer.rs`

`receive_and_buffer_packets()` (line 108) → `handle_packet_batch_message()` (line 227)
→ per-packet `try_handle_packet()` (line 398) → `translate_to_runtime_view()` (line 429):

```rust
pub fn translate_to_runtime_view<D: TransactionData>(data: D, bank: &Bank, ...)
    -> Result<(RuntimeTransaction<ResolvedTransactionView<D>>, u64), PacketHandlingError>
{
    // Parse + sanitize (same TransactionFrame::try_new as sigverify)
    let view = SanitizedTransactionView::try_new_sanitized(data, ...)?;

    // Wrap in RuntimeTransaction (computes message hash, determines vote tx)
    let view = RuntimeTransaction::<SanitizedTransactionView<_>>::try_new(
        view, MessageHash::Compute, None,
    )?;

    // Resolve address lookup tables if needed
    let (loaded_addresses, deactivation_slot) = load_addresses_for_view(&view, bank)?;
    let view = RuntimeTransaction::<ResolvedTransactionView<_>>::try_new(
        view, loaded_addresses, bank.get_reserved_account_keys(),
    )?;

    Ok((view, deactivation_slot))
}
```

The resulting `RuntimeTransaction<ResolvedTransactionView<SharedBytes>>` enters the
priority queue (`TransactionViewStateContainer`) and is scheduled for execution.

---

## 8. Complete Call Chain

```
tpu.rs:225  spawn_stake_weighted_qos_server(packet_sender)
  │
  │ [QUIC async runtime]
  ▼
quic.rs:720  handle_chunks()
  ├─ BytesPacket::new(bytes, meta)
  ├─ PacketBatch::Single(packet)
  └─ packet_sender.try_send(packet_batch)
  │
  │ [crossbeam bounded channel, 50K capacity]
  ▼
tpu.rs:277  SigVerifyStage::new(packet_receiver, verifier)
  │
  │ [thread: solSigVerTpu]
  ▼
sigverify_stage.rs:305  loop { Self::verifier(...) }
  ├─ sigverify_stage.rs:231  recv_packet_batches(recvr, 5000)
  ├─ sigverify_stage.rs:258  dedup_packets_and_count_discards()
  └─ sigverify_stage.rs:264  verifier.verify_and_send_packets(batches)
      │
      │ [rayon thread pool]
      ▼
      sigverify.rs:78   verify_transactions(&thread_pool, &mut batches)
        │
        └─► perf/sigverify.rs:51  verify_packet(&mut packet)
              ├─ TransactionFrame::try_new(data)
              │    └─ try_new_as_v1()
              │         ├─ parse header, config_mask, blockhash, addresses, instructions
              │         ├─ parse signatures (64B × num_required)
              │         └─ if has_pqc → parse PqcFrame (1565 bytes)
              ├─ sanitize()
              ├─ view.has_pqc() → AuthScheme::Falcon { pk, sig }
              ├─ auth.verify_signer(&sigs[0], &keys[0], message)
              │    ├─ derive_address() == account_key       ✓
              │    ├─ falcon_sig.verify(pk, msg)            ✓
              │    └─ proxy_sig == expected_proxy            ✓
              └─ cosigners: sig.verify(pk, msg) for [1..]
      │
      sigverify.rs:82   BankingPacketBatch::new(batches)
      sigverify.rs:84   banking_stage_sender.send(banking_packet_batch)
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
            └─ receive_and_buffer.rs:398  try_handle_packet(bytes)
                 └─ receive_and_buffer.rs:429  translate_to_runtime_view()
                      ├─ SanitizedTransactionView::try_new_sanitized()
                      ├─ RuntimeTransaction::try_new(view)
                      └─ RuntimeTransaction::try_new(view, loaded_addresses)
  │
  ▼
scheduler_controller.rs:192  process_transactions()
  └─ scheduler.schedule() → ConsumeWork sent to worker
      │
      │ [thread: solCoWorker00]
      ▼
      consume_worker.rs:120  consumer.process_and_record_aged_transactions()
        └─ consumer.rs:319   bank.load_and_execute_transactions()   ← SVM
        └─ consumer.rs:378   transaction_recorder.record_transactions()
             └─ transaction_recorder.rs:61  hash_transactions()
             └─ transaction_recorder.rs:65  self.record() → PoH
```

---

## 9. RPC Path vs TPU Path: Key Differences

| Aspect | RPC Path (preflight) | TPU Path (leader) |
|--------|---------------------|-------------------|
| **Parser** | `wincode::deserialize` → `VersionedTransaction` | `TransactionFrame::try_new` → zero-copy offsets |
| **PQC data storage** | `FalconSigner { pubkey: Vec<u8>, signature: Vec<u8> }` | `PqcFrame { pubkey_offset, sig_offset }` — no alloc |
| **PQC detection** | `message.config.pqc` (bool field on V1 message) | `TransactionConfigFrame::has_pqc()` (bit 5 of mask) |
| **Verification** | `SanitizedTransaction::verify()` | `verify_packet()` in `perf/src/sigverify.rs` |
| **Auth dispatch** | `if falcon_signer.is_some()` → `AuthScheme::Falcon` | `if view.has_pqc()` → `AuthScheme::Falcon` |
| **Crypto engine** | `AuthScheme::verify_signer()` (same) | `AuthScheme::verify_signer()` (same) |
| **Parallelism** | Sequential (single RPC request) | Parallel (rayon thread pool, all packets at once) |
| **Memory** | `VersionedTransaction` heap struct + `FalconSigner` alloc | Zero-copy `&[u8]` slices into packet buffer |

Both paths share `AuthScheme::verify_signer()` from `pqc/src/lib.rs`, so the
cryptographic verification is identical.
