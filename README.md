# Solana PQC: Post-Quantum Cryptography for Solana

Proof-of-concept integrating **Falcon-512 post-quantum signatures** into Solana via **V1 transactions** (SIMD-0385).

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

### 3. Start the local test validator

```bash
cd agave
./target/debug/solana-test-validator --reset
```

The `--reset` flag starts with a clean ledger.

### 4. Run the demo (in a separate terminal)

Bidirectional transfers between Ed25519 and Falcon-512 wallets:

```bash
cd pqc-demo
cargo run --bin demo
```
