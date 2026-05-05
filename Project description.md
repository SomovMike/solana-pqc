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
- [Technical Challenges (Solvable)](#technical-challenges-solvable)
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

### Shor’s Algorithm vs Grover’s Algorithm

| Algorithm | What it attacks | Threat to Solana |
|----------|----------------|------------------|
| **Shor** | Elliptic curves (Ed25519, ECDSA, BLS) | allows computing the private key from the public key | **Critical** — breaks all signatures |
| **Grover** | Hash functions (SHA-256) | quadratic speedup of brute force | **Minimal** — SHA-256 remains at 128-bit security |

This means that PDA accounts (based on SHA-256) remain secure, while EOA accounts (based on Ed25519) do not.

### Quantum Threat for Solana is Unique
While quantum computers pose a huge threat to all major blockchain platforms, Solana’s architecture introduces specific peculiarities that must be taken into account.
Unlike Bitcoin, where the public key is hidden behind a hash (P2WPKH) until the first spend, **each Solana address is itself an Ed25519 public key**.
This means that Solana has no “hidden” layer of protection.
As soon as a quantum computer capable of running Shor’s algorithm emerges, all existing Solana accounts will become vulnerable: without exception and without requiring any prior transaction.

### Timeframes

A real quantum threat is a horizon of 10 to 15 years. Today’s quantum computers operate with hundreds of noisy qubits, while breaking Ed25519 requires hundreds of thousands of stable logical qubits.
But **preparation must begin now**, because migration of a blockchain is orders of magnitude more complex than migration of centralized systems: each user must personally sign a transaction transferring funds to a new PQC address, using the very key that becomes vulnerable.

## 3. Key Idea: Hybrid Model
Instead of a complete migration to PQC digital signature algorithms, we propose a combination of quantum-secure and classical accounts.

Replacing all user signatures with PQC would inevitably make it impractical to perform multi-user operations that require more than one PQC signature.
In addition to the signature itself, each signature requires a large public key for verification. As a result, transactions with two or more PQC signatures would exceed the size limits of the V1 transaction format.
Consequently, the naive proposal to “replace all signatures with PQC” does not work, both from an implementation standpoint and in terms of overall network throughput.

We do not attempt to migrate all Solana users to PQC.
Post-quantum signatures are large and slow, which undermines Solana’s primary advantage—high throughput.
Instead, we propose a **two-layer security model**: most funds are stored in a PQC Vault secured by Falcon DSA.
Funds are transferred to a standard classical account via a single Falcon-secured transaction, and then used from the fast classical account (hot wallet).
```
┌───────────────────────────────────────────────────────┐
│                  PQC Vault (Falcon)                   │
│                                                       │
│  • Quantum-resistant "vault"                          │
│  • Storage of large amounts (savings account)         │
│  • Rare, simple transactions (transfer to hot wallet) │
│  • Signature: 666 bytes, key: 897 bytes               │
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

1. The user creates a **PQC Vault** — generates a Falcon key and obtains a 32-byte address (SHA-256 hash of the 897-byte public key).
2. The main capital is stored in the PQC Vault: SOL, stablecoins, valuable tokens.
3. When interaction with DeFi or trading on a DEX is needed:
   - The user performs **one simple PQC transaction**: transferring the required amount from Vault → Hot Wallet.
   - From the Hot Wallet, the user performs any number of complex transactions (swaps, liquidity provision, NFT minting, etc.).
4. The remaining balance is returned to the Vault via a regular Ed25519 transfer.

### Why This Works

- **PQC transactions are heavy** (~1564 bytes for the header alone), but for a simple wallet-to-wallet transfer, the V1 transaction format is sufficient.
- **Complex DeFi transactions** (multiple instructions, CPI, multiple signers) remain on Ed25519 and do not lose performance.
- This is an **analogy to cold storage + hot wallet** in traditional finance, but with a quantum-protected "cold" layer.

## 4. Why Falcon (FN-DSA)

NIST has standardized (or is in the process of standardizing) several PQC signature schemes:

| Scheme | Public Key | Signature | NIST Status | Suitable for Solana? |
|--------|------------|-----------|-------------|----------------------|
| **Ed25519** (current) | 32 B | 64 B | — | Yes (not PQC) |
| **ML-DSA** (Dilithium) | 1312 B | 2560 B | Standard | No — 2560B signature does not fit in a V1 transaction with payload |
| **FN-DSA (Falcon-512)** | 897 B | 666 B | Draft | **Yes** — best balance of size/security |
| **SLH-DSA** (SPHINCS+) | 64 B | 7856 B | Standard | No — 7856B exceeds entire V1 limit |
| **HAWK** | ~1024 B | ~555 B | Research | Potentially, but not ready |

**Falcon-512 is the only practical choice** for Solana right now:

- Total PQC header (magic + pubkey + signature) = **~1564 bytes** — fits into a V1 transaction (4096 bytes) with room for payload.
- ML-DSA would require ~3873 bytes just for the header, leaving ~223 bytes — not enough even for a simple transfer.
- 128-bit post-quantum security (equivalent to today’s Ed25519).

> **Important:** FN-DSA is currently a NIST draft, not a finalized standard. For production, this requires additional evaluation. For a prototype and proof of concept, it is the optimal choice.

---

## 5. Solana Quantum Threat Map

Not all Solana accounts are equally vulnerable. Understanding this is key to setting correct protection priorities.

### What is vulnerable (Ed25519)

| Account Type | What it holds | Why vulnerable |
|--------------|--------------|----------------|
| **EOA (user wallets)** | SOL, tokens | Address = Ed25519 public key. Shor’s algorithm computes private key → full access to funds |
| **Token Account authority** | Control over SPL tokens (USDC, BONK, etc.) | Authority is an Ed25519 key. Key compromise = theft of all tokens |
| **Upgrade Authority** | Right to upgrade program code | Ed25519 key. Compromise → malicious code deployment → fund drain from PDA |
| **Mint Authority** | Right to mint new tokens | Ed25519 key. Compromise → infinite token issuance |
| **Freeze Authority** | Right to freeze token accounts | Ed25519 key. Compromise → freezing user funds |
| **Validator Identity / Vote Authority** | Validator control, staking | Ed25519 key. Compromise → manipulation of stake and voting |
| **Stake / Withdraw Authority** | Staking control | Ed25519 key. Compromise → withdrawal of staked SOL |

### What is already safe (SHA-256 / no private key)

| Account Type | Why safe |
|--------------|----------|
| **PDA (Program Derived Addresses)** | Derived via SHA-256, **do not have a private key**. Only programs can sign on behalf of PDA via `invoke_signed`. Shor’s algorithm is useless — there is nothing to break |
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
Even optimistic estimates suggest that a quantum computer would require hours to execute Shor’s algorithm for a single key.
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

PQC Vault protects exactly against this scenario: even if a Falcon public key is recorded today, Shor’s algorithm cannot derive the private key from it — neither now nor in the future.

## 7. Project Architecture

The project consists of two independent components interacting over the network:
```
┌──────────────────────────────┐         HTTP/UDP           ┌──────────────────────────────┐
│   Client (Rust/Node)         │ ◀──────────────────────▶   │   Validator (Rust / Agave)   │
│                              │     RPC :8899              │                              │
│  • Falcon key generation     │     TPU :8000              │  • Receives V1 packets       │
│  • SHA-256 hash → address    │                            │  • Parses magic byte         │
│  • Builds V1 transaction     │                            │  • Extracts Falcon key       │
│  • Signs with Falcon         │                            │  • SHA-256 → address check   │
│  • sendTransaction           │                            │  • Native Falcon verification│
│                              │                            │  • SVM transaction execution │
└──────────────────────────────┘                            └──────────────────────────────┘
       pqc-demo/                                              agave/
```


### Component 1: Modified Agave Validator (Rust)

Modifications to Solana core:

1. **Transaction parser** (`sdk/packet/`, `transaction-view/`) — detects magic byte in the signature header and reads a 897B key + 666B signature instead of the standard 64B.
2. **Cryptographic validation (sigverify)** (`perf/src/sigverify.rs`, `core/src/sigverify.rs`) — core of the project:
   - Extracts Falcon public key from transaction
   - Computes SHA-256 hash of the key
   - Compares the hash with the sender address in `account_keys`
   - Calls native Falcon verification
   - Sets `is_signer = true` on success
3. **Dependencies** — crate `pqcrypto-falcon` or `falcon-rust` added to `Cargo.toml` in `perf` and `core`.

### Component 2: Modified TypeScript SDK (kit)

Fork of `anza-xyz/kit` monorepo:

1. **`@solana/keys`** — new function `generateFalconKeyPair()`, extension of `SignatureBytes` to 666B.
2. **`@solana/addresses`** — function `getFalconAddressFromPublicKey()` (SHA-256 → 32B → Base58).
3. **Transaction codec** (`@solana/transactions`) — when detecting Falcon signature, writes to buffer:
   `[magic byte] + [897B pubkey] + [666B signature]`.

### Component 3: Demo Application

Script `demo-app/demo.ts`:

1. Connects to local validator
2. Generates PQC Vault (Falcon) and Hot Wallet (Ed25519)
3. Airdrops SOL to PQC Vault
4. Transfers from PQC Vault → Hot Wallet (Falcon signature)
5. Transfers from Hot Wallet → another address (Ed25519 signature)

This demonstrates the full hybrid model lifecycle.

## 8. How It Works

### PQC Transaction Format (V1, 4096 bytes)
```
┌─────────────────────────────────────────────────────────────┐
│ Signature Section                                           │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [0xFF]  Magic Byte — "next signature is Falcon"         │ │
│ │ [897B]  Falcon-512 public key                           │ │
│ │ [666B]  Falcon-512 signature                            │ │
│ └─────────────────────────────────────────────────────────┘ │
│ Total signature section: ~1564 байт                         │
├─────────────────────────────────────────────────────────────┤
│ Transaction message (~2500 bytes available)                 │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Header (num_signers, num_readonly, ...)                 │ │
│ │ Account Keys (32B × N)                                  │ │
│ │ Recent Blockhash (32B)                                  │ │
│ │ Instructions (program_id, accounts, data)               │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```


### Verification Flow on the Validator
```
V1 Transaction (4096B)
        │
        ▼
    TPU receives packet
        │
        ▼
    Parser checks first byte of signature section
        │
        ├── 0xFF (magic byte) ──▶ PQC path:
        │ 1. Reads 897B → falcon_pubkey
        │ 2. Reads 666B → falcon_signature
        │ 3. SHA-256(falcon_pubkey) → 32B hash
        │ 4. Compares hash with account_keys[0]
        │ 5. falcon_verify(message, signature, pubkey)
        │ 6. Success → is_signer = true
        │
        └── Standard byte ──▶ Ed25519 path (unchanged)
        │
        ▼
    SVM executes transaction
```
  
### Address Derivation
```
Falcon Public Key (897 байт)
        │
        ▼
   SHA-256 hash
        │
        ▼
   32 bytes (raw address)
        │
        ▼
   Base58 encoding
        │
        ▼
   Solana PQC Vault address (e.g.: "7xKXtg2CW87...")
```

## 9. Repository Structure

Solana_PQC/
├── agave/ # Fork of Solana core (modified validator)
│ ├── perf/src/sigverify.rs # ← Falcon verification
│ ├── core/src/sigverify.rs # ← Falcon verification
│ ├── sdk/packet/src/lib.rs # ← PQC packet parsing
│ └── ...
│
├── kit/ # Fork of TypeScript SDK (@solana/kit)
│ ├── packages/keys/ # ← Falcon key generation
│ ├── packages/addresses/ # ← PQC address derivation
│ ├── packages/transactions/ # ← PQC transaction codec
│ └── ...
│
├── demo-app/ # Demo application
│ ├── demo.ts # Main script
│ ├── package.json
│ └── tsconfig.json
│
├── PROJECT.md # This file
└── README.md # Setup instructions

## 10. Technical Challenges (Solvable)

### 1. Address collision with Ed25519 (Off-Curve Problem)

**Problem**: A SHA-256 hash of a Falcon key may accidentally correspond to a valid point on the Ed25519 curve. In that case, there exists an Ed25519 private key for this address, and an attacker could theoretically sign a transaction on behalf of a PQC account using a standard signature.

**Solution**: A mechanism similar to PDA bump — iteratively add salt/bump to the hash and check that the result does not lie on the Ed25519 curve. Alternatively, reserve a fixed bit/byte in the address that guarantees it is off-curve.

---

### 2. V1 transaction size budget

**Problem**: The PQC header takes ~1564 out of 4096 bytes. For one signer, ~2532B remains — enough for simple operations. But two PQC signers = ~3128B header → less than 1000B for the message.

**Solution**: Within the hybrid model, PQC transactions are intentionally simple (SOL transfer). Complex multi-signature operations remain on Ed25519. 
It is a feature of the whole architecture.

---

### 3. Transaction ID

**Problem**: The current txid in Solana is the first Ed25519 signature (64B). With a Falcon signature (666B), this must change.

**Prototype-level solution**: txid is defined as a concatenation of SHA(signature) || SHA(public key).

---

### 4. Falcon verification performance

**Problem**: Falcon verification is slower than Ed25519.

**Solution**: In the hybrid model, PQC transactions are rare (a few per day per user), so the overall network overhead is minimal. Benchmarks will show exact numbers.

## 11. From Local Prototype to Real Network

Our prototype runs on a local `solana-test-validator` (single node). Below is an honest analysis of which Agave subsystems are affected by our modification and which require additional work for deployment on a real network with hundreds of validators.

### What we modify

| Subsystem | File | Status |
|----------|------|--------|
| **TPU Sigverify** | `perf/src/sigverify.rs` | Modified — main PQC verification entry point |
| **Core Sigverify** | `core/src/sigverify.rs` | Modified — wrapper around perf sigverify |

This is the transaction entry point in the validator: TPU receives a packet → `sigverify` checks the signature → the banking stage executes the transaction. On a local validator, this is **sufficient** for a full cycle.

---

### What breaks on a real network

#### 1. Replay / Entry Verification — re-verification of signatures
```
entry/src/entry.rs → UnverifiedSignatures::verify()
                   → signature.verify(pubkey, serialized_message)
```

When a validator replays blocks from other leaders, it verifies signatures again — not via `sigverify.rs`, but via a separate path in `entry`. On a local validator, you are the leader for all blocks, so replay is not triggered. On a real network, each validator must be able to verify PQC signatures in blocks produced by others.

**Required change**: Add Falcon verification in `entry/src/entry.rs` → `UnverifiedSignatures::verify()`.

---

#### 2. PoH Chaining — hashing signatures in Proof of History
```
entry/src/entry.rs → hash_signatures()
                   → next_hash_with_signatures()
```


Transaction signatures are **embedded into the Proof of History chain**. This code assumes 64-byte signatures (`Signature` = `[u8; 64]`). With a 666-byte Falcon signature, the PoH hash changes, and other validators **cannot reproduce** the chain — consensus breaks.

**Required change**: Define how PQC signatures participate in PoH (hash full 666B? or hash only a 64B digest of the signature?).

---

#### 3. Transaction ID — fundamental transaction identifier

In Solana, `txid = signatures[0]`, and it is **hardcoded as 64 bytes** of type `Signature`. It is used everywhere:

| Usage | File |
|------|------|
| SVM Transaction trait | `svm-transaction/src/svm_transaction.rs` → `fn signature() -> &Signature` |
| Resolved Transaction View | `transaction-view/src/resolved_transaction_view.rs` → `self.view.signatures()[0]` |
| Geyser Plugin API | `geyser-plugin-interface/src/geyser_plugin_interface.rs` → "first signature, used for identifying the transaction" |
| Blockstore (RocksDB) | `ledger/src/blockstore/column.rs` → keys `[u8; SIGNATURE_BYTES + ...]` |
| Bigtable (archive) | `storage-bigtable/src/lib.rs` → `get_bincode_cell("tx", signature.to_string())` |
| RPC subscriptions | `rpc/src/rpc_subscriptions.rs` → subscription by signature |

**Required change**: Switch to `txid = SHA-256(transaction_payload)` — a signature-agnostic identifier. This affects dozens of files.

---

#### 4. Signature type — fundamental limitation

The `Signature` type is defined in the **external crate** `solana-signature` (not in Agave) as exactly 64 bytes. It is used in:
```
transaction-view/src/signature_frame.rs:
  MAX_SIGNATURES_PER_PACKET = PACKET_DATA_SIZE / (size_of::<Signature>() + size_of::<Pubkey>())
  // = 1232 / (64 + 32) = 12

perf/src/sigverify.rs:
  const MESSAGE_OFFSET: usize = 1 + size_of::<Signature>();  // = 65
```


A Falcon signature (666B) does not fit into the `Signature` type. Our magic byte workaround works in the prototype, but for production a modification of the base type in the SDK is required.

**Required change**: Introduce a new type `PqcSignature` or extend `Signature` to an enum `Ed25519(64B) | Falcon(666B)` in the `solana-signature` crate.

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

### Summary
                    Local test-validator     Real network
                    ─────────────────────    ─────────────
TPU Sigverify       ✅ Modified               ✅ Works
Replay/Entry Verify ⚪ Not triggered          ❌ Requires changes
PoH Chaining        ⚪ Not critical           ❌ Requires changes
Transaction ID      ⚪ Can ignore             ❌ Requires redesign
Signature type(SDK) ⚠️ Magic byte workaround  ❌ Requires extension
Gossip              ⚪ Not used               ✅ Not affected
Shred/Turbine       ⚪ Not used               ✅ Not affected
Vote Verification   ⚪ Formal                 ✅ Not affected
Repair Protocol     ⚪ Not used               ✅ Not affected
Ed25519 Precompile  ⚪ Not used               ✅ Not affected


**Conclusion**: For production deployment, **4 subsystems** must be modified (replay, PoH, txid, SDK types). Validator infrastructure (gossip, turbine, votes, repair) remains unchanged — PQC Vault only affects the user transaction layer.


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

### Short-term (after hackathon)
- Benchmarks: Falcon verify vs Ed25519 verify (latency, throughput)
- Error handling and edge cases in transaction parser
- End-to-end testing on devnet with real transaction flows 

### Mid-term
- Integration with wallet-adapter for web PQC Vault UI
- SPL Token transfers via PQC accounts (not only SOL)
- SIMD proposal for PQC transaction format standardization

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

**Our position**: The magic byte architecture allows adding new algorithms without redesigning the core : simply assign a new magic byte for each new algorithm.

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
- [SIMD-0296: Transaction Size Increase](https://github.com/solana-foundation/solana-improvement-documents/pull/296) — increase of transaction size to 4096B
- [Alpenglow Whitepaper](https://www.anza.xyz/alpenglow-1-1) — new Solana consensus (Votor/Rotor)
- [HAWK Signatures](https://hawk-sign.info/) — promising PQC scheme
- [Shor's Algorithm](https://arxiv.org/abs/quant-ph/9508027) — quantum threat to elliptic curves
- [Blueshift](https://blueshift.gg/research/quantum-proofing-solana) - Quantum-Proofing Solana
- [anza](https://www.anza.xyz/blog/securing-solana-against-a-powerful-quantum-adversary) - Securing Solana Against a Powerful Quantum Adversary
- [Jump Crypto](https://jumpcrypto.com/resources/quantum-migration-paths-for-solana) - Quantum Migration Paths for Solana
