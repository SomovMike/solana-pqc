# Hybrid Accounts for Solana: Project Description

## Table of Contents

- [Project Vision](#project-vision)
- [Why This Matters](#why-this-matters)
- [Key Idea: Hybrid Model](#key-idea-hybrid-model)
- [Why Falcon (FN-DSA)](#why-falcon-fn-dsa)
- [Solana Quantum Threat Map](#solana-quantum-threat-map)
- [Hot Wallet Security: Exposure Window](#hot-wallet-security-exposure-window)
- [Project Architecture](#project-architecture)
- [How It Works](#how-it-works)
- [Repository Structure](#repository-structure)
- [Technical Challenges](#technical-challenges)
- [From Local Prototype to Real Network](#from-local-prototype-to-real-network)
- [Comparison with Alternatives](#comparison-with-alternatives)
- [Future Development](#future-development)
- [Out-of-Scope Challenges](#out-of-scope-challenges)
- [References](#references)

---

## 1. Project Vision

We are creating a **prototype of native post-quantum protection** for Solana at the validator core level (Layer 0). This is not a smart contract and not a program — it is a modification of the blockchain engine itself, allowing it to natively understand and verify signatures of the **Falcon-512** (FN-DSA) algorithm alongside the classical Ed25519.

The goal is not to completely replace Ed25519, but to **add a new type of accounts**: quantum-resistant "vaults" for long-term storage of large amounts.

---

## 2. Why This Matters

### Shor's Algorithm vs Grover's Algorithm

| Algorithm | What it attacks | Threat to Solana |
|----------|----------------|------------------|
| **Shor** | Elliptic curves (Ed25519, ECDSA, BLS) | allows computing the private key from the public key | **Critical** — breaks all signatures |
| **Grover** | Hash functions (SHA-256) | quadratic speedup of brute force | **Minimal** — SHA-256 remains at 128-bit security |

This means that PDA accounts (based on SHA-256) remain secure, while EOA accounts (based on Ed25519) do not.

### Quantum Threat for Solana is Unique
While quantum computers pose a huge threat to all major blockchain platforms, Solana's architecture introduces specific peculiarities that must be taken into account.
Unlike Bitcoin, where the public key is hidden behind a hash (P2WPKH) until the first spend, **each Solana address is itself an Ed25519 public key**.
This means that Solana has no "hidden" layer of protection.
As soon as a quantum computer capable of running Shor's algorithm emerges, all existing Solana accounts will become vulnerable: without exception and without requiring any prior transaction.

### Timeframes

A real quantum threat is a horizon of 10 to 15 years. Today's quantum computers operate with hundreds of noisy qubits, while breaking Ed25519 requires hundreds of thousands of stable logical qubits.
But **preparation must begin now**, because migration of a blockchain is orders of magnitude more complex than migration of centralized systems: each user must personally sign a transaction transferring funds to a new PQC address, using the very key that becomes vulnerable.

## 3. Key Idea: Hybrid Model
Instead of a complete migration to PQC digital signature algorithms, we propose a combination of quantum-secure and classical accounts.

Replacing all user signatures with PQC would inevitably make it impractical to perform multi-user operations that require more than one PQC signature.
In addition to the signature itself, each signature requires a large public key for verification. As a result, transactions with two or more PQC signatures would exceed the size limits of V1 transactions.
Consequently, the naive proposal to "replace all signatures with PQC" does not work, both from an implementation standpoint and in terms of overall network throughput.

We do not attempt to migrate all Solana users to PQC.
Post-quantum signatures are large and slow, which undermines Solana's primary advantage—high throughput.
Instead, we propose a **two-layer security model**: most funds are stored in a PQC Vault secured by Falcon DSA.
Funds are transferred to a standard classical account via a single Falcon-secured transaction, and then used from the fast classical account (hot wallet).
```
┌───────────────────────────────────────────────────────┐
│                  PQC Vault (Falcon)                   │
│                                                       │
│  • Quantum-resistant "vault"                          │
│  • Storage of large amounts (savings account)         │
│  • Rare, simple transactions (transfer to hot wallet) │
│  • Signature: ≤666 bytes, key: 897 bytes              │
│                                                       │
│         ──── simple SOL transfer ────▶                │
│                                                       │
│                  Ed25519 Hot Wallet                   │
│                                                       │
│  • Standard fast wallet                               │
│  • Daily operations: DeFi, NFT, staking               │
│  • Complex multi-instruction transactions             │
│  • Signature: 64 bytes, key: 32 bytes                 │
└───────────────────────────────────────────────────────┘
```

### User Flow

1. The user creates a **PQC Vault** — generates a Falcon key pair and obtains a 32-byte address (`SHA-256(falcon_pubkey || bump)`, off-curve).
2. The main capital is stored in the PQC Vault: SOL, stablecoins, valuable tokens.
3. When interaction with DeFi or trading on a DEX is needed:
   - The user performs **one simple PQC transaction**: transferring the required amount from Vault → Hot Wallet.
   - From the Hot Wallet, the user performs any number of complex transactions (swaps, liquidity provision, NFT minting, etc.).
4. The remaining balance is returned to the Vault via a regular Ed25519 transfer.

### Why This Works

- **PQC transactions are heavy** (~1785 bytes total wire size), but for a simple wallet-to-wallet transfer, the V1 transaction format is sufficient.
- **Complex DeFi transactions** (multiple instructions, CPI, multiple signers) remain on Ed25519 and do not lose performance.
- This is an **analogy to cold storage + hot wallet** in traditional finance, but with a quantum-protected "cold" layer.

## 4. Why Falcon (FN-DSA)

NIST has standardized (or is in the process of standardizing) several PQC signature schemes:

| Scheme | Public Key | Signature | NIST Status | Suitable for Solana? |
|--------|------------|-----------|-------------|----------------------|
| **Ed25519** (current) | 32 B | 64 B | — | Yes (not PQC) |
| **ML-DSA** (Dilithium) | 1312 B | 2560 B | Standard | No — 2560B signature does not fit in a V1 transaction with payload |
| **FN-DSA (Falcon-512)** | 897 B | ≤666 B | Draft | **Yes** — best balance of size/security |
| **SLH-DSA** (SPHINCS+) | 64 B | 7856 B | Standard | No — 7856B exceeds entire V1 limit |
| **HAWK** | ~1024 B | ~555 B | Research | Potentially, but not ready |

**Falcon-512 is the only practical choice** for Solana right now:

- Total PQC trailer (sig_len + pubkey + signature) = **1565 bytes** — fits into a V1 transaction with room for payload.
- ML-DSA would require ~3873 bytes just for the header, leaving too little space for even a simple transfer.
- 128-bit post-quantum security (equivalent to today's Ed25519).

> **Important:** FN-DSA is currently a NIST draft, not a finalized standard. For production, this requires additional evaluation. For a prototype and proof of concept, it is the optimal choice.

---

## 5. Solana Quantum Threat Map

Not all Solana accounts are equally vulnerable. Understanding this is key to setting correct protection priorities.

### What is vulnerable (Ed25519)

| Account Type | What it holds | Why vulnerable |
|--------------|--------------|----------------|
| **EOA (user wallets)** | SOL, tokens | Address = Ed25519 public key. Shor's algorithm computes private key → full access to funds |
| **Token Account authority** | Control over SPL tokens (USDC, BONK, etc.) | Authority is an Ed25519 key. Key compromise = theft of all tokens |
| **Upgrade Authority** | Right to upgrade program code | Ed25519 key. Compromise → malicious code deployment → fund drain from PDA |
| **Mint Authority** | Right to mint new tokens | Ed25519 key. Compromise → infinite token issuance |
| **Freeze Authority** | Right to freeze token accounts | Ed25519 key. Compromise → freezing user funds |
| **Validator Identity / Vote Authority** | Validator control, staking | Ed25519 key. Compromise → manipulation of stake and voting |
| **Stake / Withdraw Authority** | Staking control | Ed25519 key. Compromise → withdrawal of staked SOL |

### What is already safe (SHA-256 / no private key)

| Account Type | Why safe |
|--------------|----------|
| **PDA (Program Derived Addresses)** | Derived via SHA-256, **do not have a private key**. Only programs can sign on behalf of PDA via `invoke_signed`. Shor's algorithm is useless — there is nothing to break |
| **DeFi Vaults (liquidity pools, lending, etc.)** | These are PDAs. The majority of TVL in Solana DeFi (Raydium, Orca, Marginfi, Kamino) is stored in PDA accounts |
| **Immutable programs** | Programs with revoked upgrade authority cannot be modified by anyone, even with a quantum computer |
| **Blockhash, Merkle Trees** | Based on SHA-256 — Grover only gives quadratic speedup, leaving ~128-bit security |
| **Seed phrases** | Keys are derived via one-way KDF. Shor cannot invert hash functions. A quantum attacker can obtain a private key, but **not** the seed phrase |

### Key Insight

A large portion of TVL in the Solana DeFi ecosystem is already protected from quantum attacks by design, because funds are stored in PDAs.
However, administrative keys of protocols (upgrade authority, mint authority) remain vulnerable.

An attacker cannot directly break a PDA, but if they compute the private key of the upgrade authority, they can replace the program code with malicious logic and drain funds.

**Our PQC Vault solves the problem of user wallets.** The same approach applies to protocol authority keys: upgrade authority can also be a Falcon address, protecting the program from quantum code substitution.

---

## 6. Hot Wallet Security: Exposure Window

An obvious question for the hybrid model:

*"Funds are safe in the PQC Vault, but during transfer to the Hot Wallet they become vulnerable again."*

### Why this is not a problem

A quantum attack on Ed25519 is not instantaneous.
Even optimistic estimates suggest that a quantum computer would require hours to execute Shor's algorithm for a single key.
This is a targeted attack on a single public key with enormous computational cost rather than a mass instant break.

Lifetime of funds in Hot Wallet: 5–30 minutes (transfer → operations → return)
Quantum attack time on key: hours — days (Shor on Ed25519)


Spending hours of quantum computation to intercept funds that disappear in 5 minutes is an economic absurdity.

### The real threat — static addresses

Real targets for a quantum attacker:

- A whale wallet with 100,000 SOL that has not moved for 3 years
- A project treasury(protocols, DAOs, foundations) holding millions of USDC at a single address
- Institutional users (funds, custodians)

These targets have two properties: **large value** and **unlimited attack time**. These are exactly the accounts that must migrate to PQC Vault.

### Harvest Now, Decrypt Later

An attacker can already today record all public keys of accounts with large balances.
In 10 years, when a quantum computer appears, they can recover private keys from those public keys and steal funds from accounts that still hold assets.

PQC Vault protects exactly against this scenario: even if a Falcon public key is recorded today, Shor's algorithm cannot derive the private key from it — neither now nor in the future.

## 7. Project Architecture

The project consists of two components interacting over the network:
```
┌──────────────────────────────┐         HTTP/UDP           ┌──────────────────────────────┐
│   Client (Rust)              │ ◀──────────────────────▶   │   Validator (Rust / Agave)   │
│                              │     RPC :8899              │                              │
│  • Falcon key generation     │     TPU :8000              │  • Receives V1 packets       │
│  • SHA-256(pk||bump) → addr  │                            │  • Parses TransactionConfig   │
│  • Builds V1 transaction     │                            │  • Detects PQC flag (bit 5)  │
│  • Signs with Falcon         │                            │  • Extracts Falcon trailer   │
│  • Proxy sig in slot 0       │                            │  • AuthScheme::Falcon verify │
│  • sendTransaction           │                            │  • SVM transaction execution │
└──────────────────────────────┘                            └──────────────────────────────┘
       pqc-demo/                                              agave/
```


### Component 1: Modified Agave Validator (Rust)

Modifications to Solana core, built on V1 transaction format (SIMD-0385):

1. **`solana-pqc` crate** (`pqc/src/lib.rs`) — core PQC library:
   - `FalconPublicKey` / `FalconSignature` types with wire format support
   - `AuthScheme` enum (`Ed25519` | `Falcon`) for unified signature verification
   - Off-curve address derivation: `SHA-256(falcon_pubkey || bump)` (PDA-style bump iteration)
   - Proxy signature: `SHA-256(falcon_sig)[0:32] || SHA-256(falcon_pubkey)[0:32]` → 64-byte `Signature`
   - Constants: `FALCON512_PUBKEY_LEN` (897), `FALCON512_SIG_MAX_LEN` (666), `PQC_CONFIG_MASK_BIT` (5)

2. **Transaction parser** (`transaction-view/`) — zero-copy V1 parsing on the TPU hot path:
   - `TransactionFrame::try_new_as_v1()` — parses V1 wire including PQC trailer
   - `PqcFrame` — stores byte offsets (`sig_len_offset`, `pubkey_offset`, `sig_offset`) into the packet buffer — no heap allocations
   - `TransactionConfigFrame::has_pqc()` — checks bit 5 of `TransactionConfigMask`
   - `pqc_pubkey_bytes()` / `pqc_signature_bytes()` — zero-copy slices into the original packet

3. **RPC deserialization** (`solana-transaction-patched/`) — heap-based parsing for RPC path:
   - `VersionedTransaction` extended with `falcon_signer: Option<FalconSigner>` field
   - Wincode `SchemaRead` / `SchemaWrite` — reads/writes PQC trailer when config mask bit 5 is set
   - `SanitizedTransaction::verify()` — dispatches to `AuthScheme::Falcon` for signer 0 when `falcon_signer` is present

4. **Signature verification** (`perf/src/sigverify.rs`) — the TPU hot path:
   - `verify_packet()` uses `SanitizedTransactionView` + `AuthScheme::Falcon` for PQC transactions
   - Co-signers `[1..N]` always verified as Ed25519
   - Parallel verification via rayon thread pool

5. **Entry / Replay verification** (`entry/src/entry.rs`):
   - `TxVerificationData` extended with `falcon_signer` field
   - `UnverifiedSignatures::verify()` uses `AuthScheme::Falcon` for PQC transactions during block replay
   - `hash_transactions()` hashes proxy signatures (64 bytes each) — Falcon material is committed via the proxy

6. **Protobuf storage** (`storage-proto/`):
   - `confirmed_block.proto` — `FalconSigner` message (pubkey + signature) added to `Transaction`
   - `convert.rs` — bidirectional conversion between `VersionedTransaction` and protobuf

7. **Fee calculation** (`fee/src/lib.rs`):
   - `PQC_FEE_MULTIPLIER` — PQC transactions pay higher fees proportional to `num_pqc_signatures()`

### Component 2: Demo Application (Rust)

Crate `pqc-demo/` — a Rust binary that demonstrates the full hybrid model lifecycle:

1. Generates Falcon-512 wallet (Cold Vault) and Ed25519 wallet (Hot Wallet)
2. Airdrops SOL to the PQC Cold Vault
3. Transfers SOL: PQC Vault → Hot Wallet (Falcon-signed V1 transaction)
4. Transfers SOL: Hot Wallet → random address (standard Ed25519 V1 transaction)
5. Returns funds: Hot Wallet → PQC Vault (Ed25519 to PQC address)

The demo builds V1 wire bytes manually, including the `TransactionConfigMask` with bit 5 set, the proxy signature, and the Falcon trailer. It communicates with the local validator via JSON-RPC.

## 8. How It Works

### V1 Transaction Format

PQC transactions use the **V1 wire format** (SIMD-0385), which has a fundamentally different layout from legacy/V0 — the message body comes first, then signatures at the end, with an optional PQC trailer:

#### Standard Ed25519 V1 Transaction
```
┌─────────────────────────────────────────────────────────────┐
│ Version byte: 0x81 (1 byte)                     V1 prefix  │
├─────────────────────────────────────────────────────────────┤
│ V1 Message Body:                                            │
│   ├─ MessageHeader (3 bytes)                                │
│   ├─ TransactionConfigMask (4 bytes, u32 LE)                │
│   ├─ Blockhash (32 bytes)                                   │
│   ├─ NumInstructions (1 byte)                               │
│   ├─ NumAddresses (1 byte)                                  │
│   ├─ Addresses (NumAddresses × 32 bytes)                    │
│   ├─ ConfigValues (variable, based on mask bits 0-4)        │
│   ├─ InstructionHeaders + Payloads                          │
├─────────────────────────────────────────────────────────────┤
│ Signatures (num_required_sigs × 64 bytes)  Ed25519 sigs    │
└─────────────────────────────────────────────────────────────┘
```

#### PQC Falcon-512 V1 Transaction
```
┌─────────────────────────────────────────────────────────────┐
│ Version byte: 0x81 (1 byte)                     V1 prefix  │
├─────────────────────────────────────────────────────────────┤
│ V1 Message Body:                                            │
│   ├─ MessageHeader (3 bytes)                                │
│   ├─ TransactionConfigMask (4 bytes, u32 LE)  bit 5 = PQC  │
│   ├─ Blockhash (32 bytes)                                   │
│   ├─ NumInstructions (1 byte)                               │
│   ├─ NumAddresses (1 byte)                                  │
│   ├─ Addresses (NumAddresses × 32 bytes)                    │
│   │   [0] = SHA256(falcon_pubkey || bump)  (off-curve)      │
│   ├─ ConfigValues (PQC bit adds NO config bytes)            │
│   ├─ InstructionHeaders + Payloads                          │
├─────────────────────────────────────────────────────────────┤
│ Proxy Signature (1 × 64 bytes)                              │
│   SHA256(falcon_sig)[0:32] || SHA256(falcon_pubkey)[0:32]   │
├─────────────────────────────────────────────────────────────┤
│ PQC Falcon Trailer (1565 bytes):                            │
│   ├─ sig_len (2 bytes, u16 LE)      actual sig length ≤666 │
│   ├─ falcon_pubkey (897 bytes)      Falcon-512 public key   │
│   └─ falcon_sig_padded (666 bytes)  zero-padded to max len  │
└─────────────────────────────────────────────────────────────┘
  Total: ~1729–1785 bytes
```

### TransactionConfigMask Bit Layout

| Bits  | Field                          | Config bytes |
|-------|--------------------------------|--------------|
| 0-1   | Priority fee (both bits = u64) | 8 bytes      |
| 2     | Compute unit limit (u32)       | 4 bytes      |
| 3     | Loaded accounts data size (u32)| 4 bytes      |
| 4     | Heap size (u32)                | 4 bytes      |
| **5** | **PQC flag (pure flag)**       | **0 bytes**  |
| 6-31  | Reserved                       | —            |

### Proxy Signature

The Falcon signature (≤666 bytes) cannot fit into the standard 64-byte `Signature` slot. Instead, we place a **proxy signature** — a 64-byte cryptographic commitment to the Falcon material:

```
proxy_sig[0:32]  = SHA-256(falcon_signature_bytes)
proxy_sig[32:64] = SHA-256(falcon_public_key_bytes)
```

This proxy serves as:
- **Transaction ID** (`txid`) — compatible with all existing Solana infrastructure (RPC subscriptions, blockstore, explorers)
- **PoH mixin** — participates in the Proof of History hash chain exactly like a normal Ed25519 signature
- **Tamper evidence** — cryptographically commits to both the Falcon signature and public key

### Verification Flow (Two Paths)

The validator has two independent code paths for PQC verification, both using the same `AuthScheme::verify_signer()` from the `solana-pqc` crate:

#### RPC Path (preflight verification)
```
Client (base64 JSON-RPC)
  │
  ├─► decode_wire_bytes()              → Vec<u8> (~1785 bytes)
  ├─► wincode::deserialize()           → VersionedTransaction { falcon_signer: Some(...) }
  ├─► sanitize_transaction()           → SanitizedTransaction
  ├─► transaction.verify()             → AuthScheme::Falcon::verify_signer()
  ├─► simulate_transaction()           → SVM (PQC-transparent)
  └─► _send_transaction()             → wire_bytes → TPU
```

#### TPU Path (leader verification, zero-copy)
```
QUIC wire bytes (~1785 bytes)
  │
  ├─► TransactionFrame::try_new_as_v1()  → PqcFrame { offsets }
  ├─► SanitizedTransactionView            → has_pqc(), pqc_pubkey_bytes(), pqc_signature_bytes()
  ├─► verify_packet()                     → AuthScheme::Falcon::verify_signer()
  └─► BankingPacketBatch                  → banking stage
```

#### AuthScheme::Falcon — Three Checks

| # | Check | What it verifies |
|---|-------|-----------------|
| 1 | `falcon_pk.derive_address() == account_keys[0]` | `SHA-256(falcon_pubkey \|\| bump)` matches the sender address (off-curve) |
| 2 | `falcon_sig.verify(&falcon_pk, message)` | Falcon-512 cryptographic signature is valid over V1 message bytes |
| 3 | `proxy_sig == falcon_sig.to_proxy_signature(&falcon_pk)` | `SHA-256(falcon_sig)[0:32] \|\| SHA-256(falcon_pk)[0:32]` matches `signatures[0]` |

### Address Derivation (Off-Curve Guarantee)
```
Falcon Public Key (897 bytes)
        │
        ▼ bump = 255, 254, 253, ...
   SHA-256(falcon_pubkey || bump)
        │
        ▼
   Check: is this a valid Ed25519 curve point?
        │
        ├── YES → decrement bump, try again
        └── NO  → 32 bytes (raw address) ✓
                    │
                    ▼
               Base58 encoding
                    │
                    ▼
               PQC Vault address
```

The bump mechanism guarantees the PQC address is **off the Ed25519 curve**, preventing collisions with standard Ed25519 keypairs. This is the same approach Solana uses for PDA (Program Derived Address) generation.

## 9. Repository Structure

```
Solana_PQC/
├── agave/                          # Fork of Solana validator (branch: pqc)
│   ├── pqc/src/lib.rs              # ← solana-pqc crate: AuthScheme, Falcon types
│   ├── perf/src/sigverify.rs       # ← TPU signature verification (hot path)
│   ├── transaction-view/src/
│   │   ├── transaction_frame.rs    # ← V1 parser + PqcFrame (zero-copy)
│   │   ├── transaction_config_frame.rs  # ← has_pqc() (bit 5 check)
│   │   └── transaction_view.rs     # ← pqc_pubkey_bytes(), pqc_signature_bytes()
│   ├── solana-transaction-patched/
│   │   └── src/versioned/mod.rs    # ← VersionedTransaction + FalconSigner
│   ├── solana-message-patched/
│   │   └── src/versions/v1/        # ← V1 message with config.pqc flag
│   ├── entry/src/entry.rs          # ← Replay verification + PoH hashing
│   ├── fee/src/lib.rs              # ← PQC_FEE_MULTIPLIER
│   ├── storage-proto/
│   │   ├── proto/confirmed_block.proto  # ← FalconSigner protobuf
│   │   └── src/convert.rs          # ← Proto ↔ Rust conversion
│   ├── rpc/src/rpc.rs              # ← RPC sendTransaction with PQC
│   ├── core/src/sigverify.rs       # ← TransactionSigVerifier wrapper
│   └── runtime-transaction/        # ← RuntimeTransaction PQC propagation
│
├── pqc-demo/                       # Rust demo application
│   ├── Cargo.toml                  # ← depends on solana-pqc (path = "../agave/pqc")
│   └── src/demo.rs                 # ← Full hybrid model demo
│
├── docs/                           # Detailed pipeline documentation
│   ├── rpc-pqc-transaction-pipeline.md
│   ├── tpu-pqc-sigverify-pipeline.md
│   └── banking-pqc-record-pipeline.md
│
├── Project description.md          # This file
└── README.md                       # Setup instructions
```

## 10. Technical Challenges

### 1. Address collision with Ed25519 (Off-Curve Problem) — Solved

**Problem**: A SHA-256 hash of a Falcon key may accidentally correspond to a valid point on the Ed25519 curve. In that case, there exists an Ed25519 private key for this address, and an attacker could theoretically sign a transaction on behalf of a PQC account using a standard signature.

**Solution (implemented)**: `FalconPublicKey::derive_address()` uses iterative bump — it appends a byte `bump` (starting at 255, decrementing) to the Falcon public key, computes `SHA-256(falcon_pubkey || bump)`, and checks if the result lies on the Ed25519 curve. The first off-curve result becomes the address. This is the same mechanism Solana uses for PDAs.

---

### 2. V1 transaction size budget

**Problem**: The PQC trailer takes 1565 out of ~4096 available bytes (V1 max packet size). For one signer, the remaining ~2500 bytes are enough for simple operations. But two PQC signers would leave less than 1000 bytes for the message.

**Solution**: Within the hybrid model, PQC transactions are intentionally simple (SOL transfer). Complex multi-signature operations remain on Ed25519. This is a feature of the architecture.

---

### 3. Transaction ID — Solved

**Problem**: The current txid in Solana is `signatures[0]`, hardcoded as 64 bytes. With a Falcon signature (≤666 bytes), this needs a compatible solution.

**Solution (implemented)**: The proxy signature mechanism. `signatures[0]` contains `SHA-256(falcon_sig)[0:32] || SHA-256(falcon_pk)[0:32]` — a 64-byte value that fits the existing `Signature` type. It serves as the txid and is compatible with all existing infrastructure (RPC subscriptions, blockstore, bigtable, explorers).

---

### 4. Falcon verification performance

**Problem**: Falcon verification is slower than Ed25519.

**Solution**: In the hybrid model, PQC transactions are rare (a few per day per user), so the overall network overhead is minimal. Additionally, PQC transactions pay a higher fee (`PQC_FEE_MULTIPLIER`) to compensate for the increased verification cost.

---

### 5. PoH compatibility — Solved

**Problem**: Transaction signatures are embedded into the Proof of History chain. The PoH code assumes 64-byte signatures. With a 666-byte Falcon signature, the PoH hash changes and other validators cannot reproduce the chain.

**Solution (implemented)**: The proxy signature (64 bytes) participates in PoH via `hash_transactions()`, not the raw Falcon signature. Since the proxy cryptographically commits to the Falcon material (via SHA-256), this provides the same tamper-evidence guarantee. No changes to the PoH hashing logic were needed — the standard `signatures[0]` → Merkle tree path works as-is.

---

### 6. Replay verification — Solved

**Problem**: When a validator replays blocks from other leaders, it re-verifies signatures through `entry.rs`, not through `sigverify.rs`. This is a separate code path that needs PQC support.

**Solution (implemented)**: `TxVerificationData` carries `falcon_signer: Option<FalconSigner>`, and `UnverifiedSignatures::verify()` dispatches to `AuthScheme::Falcon` for PQC transactions. Block replay verifies Falcon signatures correctly.

## 11. From Local Prototype to Real Network

Our prototype runs on a local `solana-test-validator` (single node). Below is an analysis of which Agave subsystems are affected by our modification and their current status.

### What is modified and working

| Subsystem | File(s) | Status |
|----------|---------|--------|
| **TPU Sigverify** | `perf/src/sigverify.rs` | ✅ Falcon verification via `AuthScheme` with zero-copy `TransactionView` |
| **RPC Verification** | `rpc/src/rpc.rs` + `solana-transaction-patched/` | ✅ Wincode deserialization + preflight Falcon verification |
| **V1 Parsing (zero-copy)** | `transaction-view/src/transaction_frame.rs` | ✅ `PqcFrame` with byte offsets — no allocations |
| **V1 Parsing (heap)** | `solana-transaction-patched/src/versioned/mod.rs` | ✅ `FalconSigner` in `VersionedTransaction` via Wincode |
| **Replay / Entry Verification** | `entry/src/entry.rs` | ✅ `TxVerificationData` + `AuthScheme::Falcon` in `UnverifiedSignatures::verify()` |
| **PoH Hashing** | `entry/src/entry.rs` (`hash_transactions`) | ✅ Proxy signatures (64B) feed into Merkle tree — no PoH format change |
| **Protobuf Storage** | `storage-proto/` | ✅ `FalconSigner` proto message for historical tx storage |
| **Fee Calculation** | `fee/src/lib.rs` | ✅ `PQC_FEE_MULTIPLIER` per PQC signature |
| **Runtime Transaction** | `runtime-transaction/` | ✅ PQC data propagated through `Deref` chain and `to_versioned_transaction()` |
| **Banking → PoH pipeline** | `consumer.rs` → `transaction_recorder.rs` | ✅ `VersionedTransaction` with `falcon_signer` preserved through execution and recording |

---

### What is NOT affected by our modification

These subsystems use **validator keys**, not user keys. Our PQC Vault affects only user transactions, so these systems continue to operate on Ed25519 without changes:

| Subsystem | Files | Why not affected |
|----------|-------|------------------|
| **Gossip Protocol** | `gossip/src/protocol.rs`, `crds_value.rs`, `ping_pong.rs` | Inter-validator communication uses Ed25519 identity keys |
| **Shred/Turbine Verification** | `ledger/src/sigverify_shreds.rs`, `turbine/src/sigverify_shreds.rs` | Leader signs shreds with Ed25519; PQC signatures are inside transactions |
| **Vote Verification** | `core/src/cluster_info_vote_listener.rs` | Validators vote with Ed25519 vote keys |
| **Repair Protocol** | `core/src/repair/serve_repair.rs` | Inter-validator data recovery |
| **Ed25519 Precompile** | `precompiles/src/ed25519.rs` | On-chain verification of Ed25519 signatures |

---

### What requires additional work for multi-validator deployment

| Area | What's needed | Difficulty |
|------|--------------|------------|
| **Signature type (SDK crate)** | `Signature` in the external `solana-signature` crate is 64 bytes. The proxy workaround works, but production may need a formal `PqcSignature` or enum type | Medium |
| **Multi-validator consensus testing** | Full testing on a cluster with multiple validators to verify replay, gossip, and Turbine work correctly with PQC transactions in blocks | Medium |
| **Explorer / indexer support** | Block explorers and indexers need to understand the PQC trailer to display Falcon public keys and signatures | Low |

### Summary
```
                        Local test-validator     Multi-validator
                        ─────────────────────    ─────────────
TPU Sigverify           ✅ Implemented            ✅ Should work
RPC Verification        ✅ Implemented            ✅ Should work
V1 Parsing              ✅ Implemented            ✅ Should work
Replay/Entry Verify     ✅ Implemented            ✅ Should work
PoH Hashing             ✅ Proxy-based            ✅ Should work
Protobuf Storage        ✅ Implemented            ✅ Should work
Fee Calculation         ✅ Implemented            ✅ Should work
Signature type (SDK)    ⚠️ Proxy workaround       ⚠️ May need extension
Gossip                  ⚪ Not used               ✅ Not affected
Shred/Turbine           ⚪ Not used               ✅ Not affected
Vote Verification       ⚪ Not used               ✅ Not affected
Repair Protocol         ⚪ Not used               ✅ Not affected
Ed25519 Precompile      ⚪ Not used               ✅ Not affected
```

**Conclusion**: The core transaction pipeline is fully implemented for PQC — from RPC ingestion through TPU verification, SVM execution, PoH recording, block storage, and replay verification. The main remaining work for production is SDK-level type formalization and multi-validator cluster testing.


## 12. Comparison with Alternatives

### Winternitz Vault (already exists on Solana)

[solana-winternitz-vault](https://github.com/deanmlittle/solana-winternitz-vault) — a smart contract using hash-based one-time signatures (OTS).

| Parameter | Our approach (Falcon Layer 0) | Winternitz Vault |
|----------|------------------------------|------------------|
| Level | Validator core (native) | Smart contract (program) |
| Signature type | Reusable (Falcon) | **One-time** (Winternitz OTS) |
| UX | Like a regular wallet | Requires a new key after each transaction |
| Core modification | Yes (Agave fork) | No |
| Readiness | Prototype | Works on mainnet |

**Key advantage of our approach**: Falcon keys are reusable. The user creates a PQC Vault once and uses it for years. Winternitz requires generating a new key after each signature, which significantly complicates UX.

We believe that all quantum-secure solutions should be developed, since the response to the quantum computing threat must be as powerful as possible. Thus, we see Winternitz vaults as a complementary approach rather than a competitor.

---

### ML-DSA (Dilithium)

NIST standard, but a 2560B signature makes it impractical for Solana even with V1 transactions (4096B). No space remains for payload.

---

### SLH-DSA (SPHINCS+)

Signature size 7856B — exceeds the entire V1 transaction limit. Cannot be used.


---

## 13. Future Development

### Short-term
- Benchmarks: Falcon verify vs Ed25519 verify (latency, throughput impact)
- Multi-validator cluster testing (replay, consensus, Turbine)
- SPL Token transfers via PQC accounts (not only SOL)

### Mid-term
- Integration with wallet-adapter for web PQC Vault UI
- SIMD proposal for PQC transaction format standardization
- Formal SDK-level `PqcSignature` type (replace proxy workaround)
- Explorer / indexer support for PQC transaction display

### Long-term (ecosystem)
- Research PQ equivalents of BLS aggregation for consensus
- Adapt Rotor/Turbine for large signatures
- Migration framework Ed25519 → PQC for existing accounts
- Support HAWK signatures (when standardized)

---


## 14. Out-of-Scope Challenges

These problems are not solved in our prototype, but we acknowledge their existence and document them for completeness.

### 1. Validator Consensus and Voting (Votor)

**Essence**: In Alpenglow, validators vote every slot (~400ms). Currently, BLS aggregation is used: 1000 signatures are compressed into one. **The post-quantum equivalent of BLS aggregation is the area of active research.**

**Consequences**: If BLS is replaced with Falcon, each validator must send a 666B signature to all others every 400ms. With 1000+ validators, this creates a traffic explosion.

**Possible solution**: Lattice-based aggregation (e.g., Raccoon, DOTT), but none are production-ready yet.

---

### 2. Block Propagation (Rotor/Turbine)

**Essence**: The leader splits a block into shreds (~1232B, MTU size) and distributes them across a validator tree. Currently, each shred includes an Ed25519 signature (64B) to protect against fake packets.

**Consequences**: A Falcon signature (666B) occupies more than half of the MTU, drastically reducing useful payload.

**Possible solutions**:
- One signature per FEC set (group of shreds) with Merkle proofs per shred
- One signature per block with authenticated channels between validators

---

### 3. All Authority Keys

**Essence**: In Solana, all roles are Ed25519 keys: mint authority, freeze authority, upgrade authority, stake/withdraw authority, validator identity, vote authority. Full PQC migration affects each of these roles.

**For our prototype**: We focus only on EOA accounts (user wallets) and the `SystemProgram.transfer` operation.

---

### 4. Mass User Migration

**Essence**: To transfer funds to a PQC address, the user must sign a transaction with their current Ed25519 key, the same key that becomes vulnerable. This is a race against time: if a quantum computer appears before migration is completed, unprotected accounts will be compromised.

**For our prototype**: We propose a simple and practical migration approach for EOA accounts, without requiring radical network changes.

---

### 5. FN-DSA Standardization

**Essence**: Falcon (FN-DSA) is currently a NIST draft, not a finalized standard. More efficient schemes (e.g., HAWK) may appear in the future.

**Our position**: The `TransactionConfigMask` architecture allows adding new algorithms without redesigning the core — bit 5 signals PQC, and the trailer can include an algorithm identifier for future extensibility.

---

### 6. Wallets and Ecosystem

**Essence**: No existing wallets (Phantom, Solflare, Backpack) support Falcon keys. Real-world usage will require:
- PQC integration in wallets
- PQC wallet-adapter standard
- Updates to all SDKs (Rust, Python, Go)
- Explorer updates to display PQC transactions

## References

- [Helius: Solana Post-Quantum Cryptography](https://www.helius.dev/blog/solana-post-quantum-cryptography) — overview of PQC challenges in Solana
- [NIST Post-Quantum Signature Standards](https://csrc.nist.gov/Projects/digital-signatures) — ML-DSA, SLH-DSA, FN-DSA
- [Solana Winternitz Vault](https://github.com/deanmlittle/solana-winternitz-vault) — alternative PQC approach via smart contract
- [SIMD-0385: V1 Transaction Format](https://github.com/solana-foundation/solana-improvement-documents/pull/385) — V1 transaction wire format
- [Alpenglow Whitepaper](https://www.anza.xyz/alpenglow-1-1) — new Solana consensus (Votor/Rotor)
- [HAWK Signatures](https://hawk-sign.info/) — promising PQC scheme
- [Shor's Algorithm](https://arxiv.org/abs/quant-ph/9508027) — quantum threat to elliptic curves
- [Blueshift](https://blueshift.gg/research/quantum-proofing-solana) - Quantum-Proofing Solana
- [anza](https://www.anza.xyz/blog/securing-solana-against-a-powerful-quantum-adversary) - Securing Solana Against a Powerful Quantum Adversary
- [Jump Crypto](https://jumpcrypto.com/resources/quantum-migration-paths-for-solana) - Quantum Migration Paths for Solana
