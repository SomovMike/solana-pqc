# Solana PQC: Post-Quantum Cryptography for Solana

Proof-of-concept integrating **Falcon-512 post-quantum signatures** into Solana via **V1 transactions** (SIMD-0385).

V1 transactions use a **messageFirst** wire format, which is essential for supporting larger PQC signatures (e.g., Falcon-512 at ~650 bytes) that don't fit into the legacy signaturesFirst envelope.

## Repository Structure

| Repository | Description |
|-----------|-------------|
| **[solana-pqc](https://github.com/SomovMike/solana-pqc)** (this repo) | Rust demo, documentation |
| **[agave](https://github.com/SomovMike/agave/tree/pqc)** (fork, branch `pqc`) | Modified Solana validator with PQC support |

```
solana-pqc/
├── agave/               # Solana validator fork (git submodule / clone)
├── docs/                # Detailed pipeline documentation
└── pqc-demo/            # Rust demo — Falcon-512 & Ed25519 V1 transactions
```

### Documentation (`docs/`)

The `docs/` folder contains detailed breakdowns of how PQC is integrated into the Solana validator pipeline:
- `rpc-pqc-transaction-pipeline.md` — RPC transaction ingestion and forwarding
- `tpu-pqc-sigverify-pipeline.md` — Signature verification in the TPU
- `banking-pqc-record-pipeline.md` — Banking stage processing and ledger recording

## Quick Start

### 1. Clone everything

```bash
git clone https://github.com/SomovMike/solana-pqc.git
cd solana-pqc
git clone -b pqc https://github.com/SomovMike/agave.git
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

### 4. Run the demo (in a separate terminal)

Bidirectional transfers between Ed25519 and Falcon-512 wallets:

```bash
cd pqc-demo
cargo run --bin demo
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

### 5. Verify PQC in validator logs

```bash
grep "PQC" agave/test-ledger/validator.log
```

You should see the full PQC V1 pipeline trace: RPC -> SendTransactionService -> QUIC -> SigVerify -> Banking Stage.

## How It Works

1. **Keypair generation** — Falcon-512 keypair via `pqcrypto-falcon`
2. **Address derivation** — Solana address = `SHA-256(falcon_pubkey)` (897-byte key -> 32-byte address)
3. **V1 message** — Standard SIMD-0385 format with **bit 5** set in `TransactionConfigMask` to signal PQC
4. **Signing** — Falcon-512 signs `[0x81 || v1_body]`
5. **Wire format** — `[0x81][v1_body][2B sig_len][897B falcon_pubkey][666B falcon_sig padded]`
6. **Proxy signature** — `SHA-256(falcon_sig) || SHA-256(falcon_pubkey)` for PoH/txid compatibility (64 bytes)
7. **Verification** — Validator extracts PQC blob, verifies Falcon-512 signature, checks address binding

## Viewing Transactions in Solana Explorer

1. Make sure the local validator is running
2. Open [explorer.solana.com](https://explorer.solana.com/)
3. Select **Custom RPC** in the network dropdown (top right)
4. Enter `http://127.0.0.1:8899`
5. Paste transaction signatures from the demo output to inspect them
