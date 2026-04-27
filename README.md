# Solana PQC: Post-Quantum Cryptography for Solana

Proof-of-concept enabling **V1 transactions** (SIMD-0385) on Solana as groundwork for Post-Quantum Cryptography integration.

V1 transactions use a **messageFirst** wire format, which is essential for supporting larger PQC signatures (e.g., Falcon-512) that don't fit into the legacy signaturesFirst envelope.

## Repository Structure

This project spans 3 repositories:

| Repository | Description |
|-----------|-------------|
| **[solana-pqc](https://github.com/SomovMike/solana-pqc)** (this repo) | Demo app, documentation |
| **[agave](https://github.com/SomovMike/agave/tree/pqc/enable-v1)** (fork, branch `pqc/enable-v1`) | Modified Solana validator |
| **[kit](https://github.com/SomovMike/kit/tree/pqc/enable-v1)** (fork, branch `pqc/enable-v1`) | Modified TypeScript client library |

## Quick Start

### 1. Clone everything

```bash
git clone https://github.com/SomovMike/solana-pqc.git
cd solana-pqc
git clone -b pqc/enable-v1 https://github.com/SomovMike/agave.git
git clone -b pqc/enable-v1 https://github.com/SomovMike/kit.git
```

This gives the required directory structure (the demo app references `../kit/` for TypeScript imports):

```
solana-pqc/
├── agave/           # Solana validator fork
├── kit/             # @solana/kit client library fork
├── demo-app/        # V1 transaction demo
├── PROJECT.md       # Full project vision
└── V1_CHANGES.md    # Detailed changelog
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

```bash
cd demo-app
pnpm install
pnpm start
```

Expected output:
```
Starting demo...
Sender address: ...
Receiver address: ...
Requesting airdrop...
Sender balance: 7000000000 lamports
Creating transfer transaction...
Signing transaction...
Transaction signature: ...
first byte: 0x81            <-- V1 transaction!
Sending and confirming transaction...
Transaction confirmed!
Receiver balance: 4000000000 lamports
```

### 5. Verify V1 in validator logs

```bash
grep "PQC" agave/test-ledger/validator.log
```

You should see the full V1 pipeline trace: RPC -> SendTransactionService -> QUIC -> SigVerify -> Banking Stage.

## What Was Changed

See [V1_CHANGES.md](V1_CHANGES.md) for a detailed description of every change with code snippets.

**Summary:**
- **Agave (validator):** Removed 3 V1 blockers + fixed a bug in `solana-transaction` crate where `message_data()` serialized V1 messages without the `0x81` version prefix, breaking signature verification
- **Kit (client):** Removed type-level V1 restriction + exported `setTransactionMessageConfig`

## What the Demo Does

1. Connects to the local validator via JSON-RPC (`http://127.0.0.1:8899`)
2. Generates two Ed25519 keypairs (sender, receiver)
3. Airdrops 7 SOL to sender
4. Creates a **V1 transaction** (`version: 1`) with a SOL transfer instruction
5. Sets V1-specific `TransactionConfig` (compute limits, loaded accounts data size)
6. Signs, sends, and confirms the transaction **with preflight enabled**

## Project Vision

See [PROJECT.md](PROJECT.md) for the full project vision: hybrid quantum-resistant accounts for Solana using Falcon-512 (FN-DSA) signatures alongside Ed25519.

## Viewing Transactions in Solana Explorer

1. Make sure the local validator is running
2. Open [explorer.solana.com](https://explorer.solana.com/)
3. Select **Custom RPC** in the network dropdown (top right)
4. Enter `http://127.0.0.1:8899`
5. Paste transaction signatures from the demo output to inspect them
