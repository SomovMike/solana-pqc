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
├── agave/           # Solana validator fork (git submodule / clone)
├── pqc-demo/        # Rust demo — Falcon-512 & Ed25519 V1 transactions
├── PQC_CHANGES.md   # Detailed changelog of all PQC integration changes
├── V1_CHANGES.md    # V1 transaction support changelog
└── PROJECT.md       # Full project vision
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

### 4. Run the PQC demo (in a separate terminal)

**Falcon-512 PQC transaction:**

```bash
cd pqc-demo
cargo run --bin pqc-demo
```

Expected output:
```
=== Solana PQC (Falcon-512) Transaction Demo ===

Generating Falcon-512 keypair...
  Falcon pubkey:    0913fab4249916273a1c6df3fc623c86... (897 bytes)
  Solana address:   DvQjUSGChdLt41zLsC7KQpwN8369GCNXSCcMrCS89o6p
  Receiver address: 6Uu44jk34kVnFi2Ggc7HD19igDMF36JiT7zTqeLEhs7Y

Building V1 PQC transfer (1 SOL)...
  Blockhash: ...
  V1 body size: 155 bytes

Signing with Falcon-512...
  Falcon sig: 39a6d21da980ecd44c8eeab8a22961f4... (653 bytes)
  Local verification: PASSED
  Wire transaction: 1721 bytes
  Proxy sig (txid): 3irgtfmJL8KBFaAhF6ftzqvCPJYRnbbN...

Sending PQC transaction to RPC...
  Transaction CONFIRMED!
```

You can also run in dry-run mode (no validator needed):

```bash
cargo run --bin pqc-demo -- --dry-run
```

**Ed25519 V1 smoke test** (verifies PQC changes don't break standard Ed25519):

```bash
cargo run --bin ed25519-demo
```

### 5. Verify PQC in validator logs

```bash
grep "PQC" agave/test-ledger/validator.log
```

You should see the full PQC V1 pipeline trace: RPC -> SendTransactionService -> QUIC -> SigVerify -> Banking Stage.

## What Was Changed

See [PQC_CHANGES.md](PQC_CHANGES.md) for a detailed description of every change with code snippets.

**Summary:**

- **`solana-pqc` crate** — Falcon-512 keypair generation, signing, verification, address derivation (SHA-256), proxy signatures, wire format helpers
- **`transaction-view`** — Extended V1 config mask to include PQC bit 5, PQC wire parsing in `TransactionFrame`, pure-flag semantics
- **`perf/sigverify`** — Falcon-512 signature verification path alongside Ed25519
- **`rpc`** — V1-aware size limits, PQC wire detection, fast-path forwarding to TPU
- **`transaction-view/sanitize`** — Signature count adjusted for PQC signer

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
