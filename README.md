# Solana PQC: Post-Quantum Cryptography for Solana

Proof-of-concept integrating **Falcon-512 post-quantum signatures** into Solana via **V1 transactions** (SIMD-0385).

V1 transactions use a **messageFirst** wire format, which is essential for supporting larger PQC signatures (e.g., Falcon-512 at ~650 bytes) that don't fit into the legacy signaturesFirst envelope.

## Repository Structure

| Repository | Description |
|-----------|-------------|
| **[solana-pqc](https://github.com/SomovMike/solana-pqc)** (this repo) | Rust demo, documentation |
| **[agave](https://github.com/SomovMike/agave/tree/pqc/enable-v1)** (fork, branch `pqc/enable-v1`) | Modified Solana validator with PQC support |

```
solana-pqc/
├── agave/               # Solana validator fork (git submodule / clone)
├── pqc-demo/            # Rust demos — Falcon-512 & Ed25519 V1 transactions
├── PQC_CHANGES.md       # Detailed changelog of all PQC integration changes
├── PQC_DEBUG_FIXES.md   # Debug fixes for the PQC transaction pipeline
├── V1_CHANGES.md        # V1 transaction support changelog
└── PROJECT.md           # Full project vision
```

## Quick Start

### 1. Clone everything

```bash
git clone https://github.com/SomovMike/solana-pqc.git
cd solana-pqc
git clone -b pqc/enable-v1 https://github.com/SomovMike/agave.git
```

### 2. Build the validator

```bash
cd agave
cargo build --bin solana-test-validator
```

> First build takes ~15-20 minutes. Subsequent builds are incremental (~2 min).

### 3. Start the local test validator

```bash
cd agave
RUST_LOG=warn ./target/debug/solana-test-validator --reset --log
```

The `--reset` flag starts with a clean ledger. Logs are written to `test-ledger/validator.log`.

### 4. Run the demos (in a separate terminal)

**Full demo (recommended)** — bidirectional transfers between Ed25519 and Falcon-512 wallets:

```bash
cd pqc-demo
cargo run --bin full-demo
```

This creates two wallets (Ed25519 + Falcon-512), airdrops 10 SOL, transfers 7 SOL from Ed25519 to PQC, then 2 SOL back from PQC to Ed25519.

Expected output:
```
============================================================
  Solana PQC Full Demo: Ed25519 <-> Falcon-512 Transfers
============================================================

[ Step 1 ] Generating wallets...

  Ed25519 wallet (standard):
    Address: Jr1PpUWWz8BVcfrHnVFBhg1x9tPgoDPJQUb4nKiqPUM
  Falcon-512 wallet (PQC):
    Address: 68a2p1ERoa91wHskMoxoYkNkXbiCLGuEtBZTXvBbCyNZ
    Falcon pubkey: 0928a99fb6b747d118bdbed98c4ef7ba... (897 bytes)

[ Step 2 ] Airdrop 10 SOL to Ed25519 wallet
  Airdrop CONFIRMED!

[ Step 3 ] Transfer 7 SOL: Ed25519 --> PQC
  Wire size: 228 bytes
  Transaction CONFIRMED!

[ Step 4 ] Transfer 2 SOL: PQC --> Ed25519
  Wire size: 1721 bytes
  Transaction CONFIRMED!

  Final balances:
    Ed25519: ~5 SOL (minus tx fees)
    PQC:     5 SOL

  All transfers completed successfully!
  Post-quantum Falcon-512 signatures work on Solana.
============================================================
```

**Other demos:**

```bash
# PQC-only demo (Falcon-512 keypair, airdrop, PQC transfer)
cargo run --bin pqc-demo

# PQC demo in dry-run mode (no validator needed)
cargo run --bin pqc-demo -- --dry-run

# Ed25519-only V1 smoke test (verifies PQC changes don't break standard Ed25519)
cargo run --bin ed25519-demo
```

### 5. Verify PQC in validator logs

```bash
grep "PQC" agave/test-ledger/validator.log
```

You should see the full PQC V1 pipeline trace: RPC -> SendTransactionService -> QUIC -> SigVerify -> Banking Stage.

## What Was Changed

See [PQC_CHANGES.md](PQC_CHANGES.md) for a detailed description of every change with code snippets.
See [PQC_DEBUG_FIXES.md](PQC_DEBUG_FIXES.md) for pipeline debug fixes that were needed to get PQC transactions fully confirmed.

**PQC integration (Phase 1-8):**

- **`solana-pqc` crate** — Falcon-512 keypair generation, signing, verification, address derivation (SHA-256), proxy signatures, wire format helpers
- **`transaction-view`** — Extended V1 config mask to include PQC bit 5, PQC wire parsing in `TransactionFrame`, pure-flag semantics
- **`perf/sigverify`** — Falcon-512 signature verification path alongside Ed25519
- **`rpc`** — V1-aware size limits, PQC wire detection, fast-path forwarding to TPU
- **`transaction-view/sanitize`** — Signature count adjusted for PQC signer

**Pipeline debug fixes:**

- **`streamer/quic`** — Increased QUIC stream size limit from 1232 to 4096 bytes for PQC transactions
- **`transaction-view/resolved_transaction_view`** — Added proxy signature storage and `SVMTransaction` implementation for PQC
- **`runtime-transaction`** — Fixed V1 transaction config defaults (`compute_unit_limit` and `loaded_accounts_data_size_limit` now default to max instead of 0)

See [V1_CHANGES.md](V1_CHANGES.md) for earlier V1 transaction support changes.

## How It Works

1. **Keypair generation** — Falcon-512 keypair via `pqcrypto-falcon`
2. **Address derivation** — Solana address = `SHA-256(falcon_pubkey)` (897-byte key -> 32-byte address)
3. **V1 message** — Standard SIMD-0385 format with **bit 5** set in `TransactionConfigMask` to signal PQC
4. **Signing** — Falcon-512 signs `[0x81 || v1_body]`
5. **Wire format** — `[0x81][v1_body][2B sig_len][897B falcon_pubkey][666B falcon_sig padded]`
6. **Proxy signature** — `SHA-256(falcon_sig) || SHA-256(falcon_pubkey)` for PoH/txid compatibility (64 bytes)
7. **Verification** — Validator extracts PQC blob, verifies Falcon-512 signature, checks address binding

## Project Vision

See [PROJECT.md](PROJECT.md) for the full project vision: hybrid quantum-resistant accounts for Solana using Falcon-512 (FN-DSA) signatures alongside Ed25519.

## Viewing Transactions in Solana Explorer

1. Make sure the local validator is running
2. Open [explorer.solana.com](https://explorer.solana.com/)
3. Select **Custom RPC** in the network dropdown (top right)
4. Enter `http://127.0.0.1:8899`
5. Paste transaction signatures from the demo output to inspect them
