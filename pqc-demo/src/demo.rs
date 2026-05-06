//! Full PQC demo: The "Cold Vault" Storyline
//!
//! 1. Generate Falcon-512 wallet (Cold Vault) and Ed25519 wallet (Hot Wallet)
//! 2. Airdrop 1000 SOL to the PQC Cold Vault
//! 3. Transfer 20 SOL: PQC Vault → Ed25519 Hot Wallet (PQC V1 transaction)
//! 4. Simulate everyday usage on the Hot Wallet
//! 5. Transfer 5 SOL: Ed25519 Hot Wallet → PQC Vault (Standard V1 transaction)
//!    (Demonstrates that PQC addresses are transparent receivers)
//! 6. Print final balances

use base64::{Engine, engine::general_purpose::STANDARD as BASE64};
use ed25519_dalek::{Signer, SigningKey, Verifier};
use rand::rngs::OsRng;
use sha2::{Digest, Sha256};
use solana_pqc::{FALCON512_PUBKEY_LEN, FALCON512_SIG_MAX_LEN, PQC_CONFIG_MASK_BIT};

const RPC_URL: &str = "http://127.0.0.1:8899";
const V1_PREFIX: u8 = 0x81;
const LAMPORTS_PER_SOL: u64 = 1_000_000_000;
const SYSTEM_PROGRAM: [u8; 32] = [0u8; 32];

// ── RPC helpers ──────────────────────────────────────────────────────────

fn rpc_call(method: &str, params: serde_json::Value) -> Result<serde_json::Value, String> {
    let body = serde_json::json!({
        "jsonrpc": "2.0",
        "id": 1,
        "method": method,
        "params": params,
    });

    let resp: serde_json::Value = ureq::post(RPC_URL)
        .set("Content-Type", "application/json")
        .send_bytes(body.to_string().as_bytes())
        .map_err(|e| format!("HTTP error: {e}"))?
        .into_json()
        .map_err(|e| format!("JSON parse error: {e}"))?;

    if let Some(err) = resp.get("error") {
        return Err(format!("RPC error: {err}"));
    }
    resp.get("result")
        .cloned()
        .ok_or_else(|| "missing result".into())
}

fn get_latest_blockhash() -> Result<[u8; 32], String> {
    let result = rpc_call(
        "getLatestBlockhash",
        serde_json::json!([{"commitment": "confirmed"}]),
    )?;
    let bh_str = result["value"]["blockhash"]
        .as_str()
        .ok_or("missing blockhash")?;
    let bh_vec = bs58::decode(bh_str)
        .into_vec()
        .map_err(|e| format!("bad blockhash: {e}"))?;
    let mut bh = [0u8; 32];
    bh.copy_from_slice(&bh_vec);
    Ok(bh)
}

fn request_airdrop(address: &str, lamports: u64) -> Result<String, String> {
    let result = rpc_call("requestAirdrop", serde_json::json!([address, lamports]))?;
    result
        .as_str()
        .map(String::from)
        .ok_or("bad airdrop sig".into())
}

fn get_balance(address: &str) -> Result<u64, String> {
    let result = rpc_call(
        "getBalance",
        serde_json::json!([address, {"commitment": "confirmed"}]),
    )?;
    result["value"].as_u64().ok_or("bad balance".into())
}

fn send_raw_transaction_b64(wire_base64: &str, skip_preflight: bool) -> Result<String, String> {
    let result = rpc_call(
        "sendTransaction",
        serde_json::json!([wire_base64, {
            "encoding": "base64",
            "preflightCommitment": "confirmed",
            "skipPreflight": skip_preflight
        }]),
    )?;
    result
        .as_str()
        .map(String::from)
        .ok_or("bad send result".into())
}

fn wait_for_confirmation(sig: &str, timeout_secs: u64) -> Result<(), String> {
    let start = std::time::Instant::now();
    loop {
        if start.elapsed().as_secs() > timeout_secs {
            return Err("confirmation timeout".into());
        }
        let result = rpc_call("getSignatureStatuses", serde_json::json!([[sig]]))?;
        if let Some(status) = result["value"].get(0) {
            if !status.is_null() {
                if let Some(err) = status.get("err") {
                    if !err.is_null() {
                        return Err(format!("transaction error: {err}"));
                    }
                }
                let conf = status["confirmationStatus"].as_str().unwrap_or("");
                if conf == "confirmed" || conf == "finalized" {
                    return Ok(());
                }
            }
        }
        std::thread::sleep(std::time::Duration::from_millis(1000));
    }
}

fn get_transaction(sig: &str) -> Result<serde_json::Value, String> {
    let result = rpc_call(
        "getTransaction",
        serde_json::json!([
            sig,
            {
                "encoding": "json",
                "maxSupportedTransactionVersion": 1,
                "commitment": "confirmed"
            }
        ]),
    )?;
    Ok(result)
}

fn sol(lamports: u64) -> f64 {
    lamports as f64 / LAMPORTS_PER_SOL as f64
}

fn b58(bytes: &[u8; 32]) -> String {
    bs58::encode(bytes).into_string()
}

// ── V1 message builders ──────────────────────────────────────────────────

fn build_system_transfer_ix_data(lamports: u64) -> Vec<u8> {
    let mut data = Vec::with_capacity(12);
    data.extend_from_slice(&2u32.to_le_bytes());
    data.extend_from_slice(&lamports.to_le_bytes());
    data
}

/// Standard V1 transfer body (Ed25519, no PQC flag).
/// Config mask = 0: all limits use runtime defaults (CU=1.4M, loaded=64MB,
/// heap=32KB, priority_fee=0).
fn build_ed25519_v1_body(
    sender: &[u8; 32],
    receiver: &[u8; 32],
    blockhash: &[u8; 32],
    lamports: u64,
) -> Vec<u8> {
    let ix_data = build_system_transfer_ix_data(lamports);
    let ix_accounts: &[u8] = &[0, 1];

    let mut buf = Vec::with_capacity(256);

    buf.push(1); // num_required_signatures
    buf.push(0); // num_readonly_signed_accounts
    buf.push(1); // num_readonly_unsigned_accounts

    let config_mask: u32 = 0;
    buf.extend_from_slice(&config_mask.to_le_bytes());

    buf.extend_from_slice(blockhash);

    buf.push(1); // num_instructions
    buf.push(3); // num_addresses

    buf.extend_from_slice(sender);
    buf.extend_from_slice(receiver);
    buf.extend_from_slice(&SYSTEM_PROGRAM);

    buf.push(2); // program_id_index (system program)
    buf.push(ix_accounts.len() as u8);
    buf.extend_from_slice(&(ix_data.len() as u16).to_le_bytes());

    buf.extend_from_slice(ix_accounts);
    buf.extend_from_slice(&ix_data);

    buf
}

/// PQC V1 transfer body (Falcon-512, bit 5 set).
fn build_pqc_v1_body(
    sender: &[u8; 32],
    receiver: &[u8; 32],
    blockhash: &[u8; 32],
    lamports: u64,
) -> Vec<u8> {
    let ix_data = build_system_transfer_ix_data(lamports);
    let ix_accounts: &[u8] = &[0, 1];

    let mut buf = Vec::with_capacity(256);

    buf.push(1); // num_required_signatures
    buf.push(0); // num_readonly_signed_accounts
    buf.push(1); // num_readonly_unsigned_accounts

    let config_mask: u32 = 1u32 << PQC_CONFIG_MASK_BIT;
    buf.extend_from_slice(&config_mask.to_le_bytes());

    buf.extend_from_slice(blockhash);

    buf.push(1); // num_instructions
    buf.push(3); // num_addresses

    buf.extend_from_slice(sender);
    buf.extend_from_slice(receiver);
    buf.extend_from_slice(&SYSTEM_PROGRAM);

    // No config values (bit 5 is a pure flag)

    buf.push(2); // program_id_index (system program)
    buf.push(ix_accounts.len() as u8);
    buf.extend_from_slice(&(ix_data.len() as u16).to_le_bytes());

    buf.extend_from_slice(ix_accounts);
    buf.extend_from_slice(&ix_data);

    buf
}

/// Ed25519 V1 wire: [0x81][body][64B signature]
fn build_ed25519_v1_wire(body: &[u8], signature: &[u8; 64]) -> Vec<u8> {
    let mut wire = Vec::with_capacity(1 + body.len() + 64);
    wire.push(V1_PREFIX);
    wire.extend_from_slice(body);
    wire.extend_from_slice(signature);
    wire
}

/// PQC V1 wire: [0x81][body][64B proxy_sig][falcon_trailer: 2B+897B+666B]
fn build_pqc_v1_wire(body: &[u8], falcon_pubkey: &[u8], falcon_sig: &[u8]) -> Vec<u8> {
    assert_eq!(falcon_pubkey.len(), FALCON512_PUBKEY_LEN);
    assert!(falcon_sig.len() <= FALCON512_SIG_MAX_LEN);

    // proxy_sig = SHA-256(falcon_sig) || SHA-256(falcon_pubkey)
    let sig_hash = Sha256::digest(falcon_sig);
    let pk_hash = Sha256::digest(falcon_pubkey);
    let mut proxy = [0u8; 64];
    proxy[..32].copy_from_slice(&sig_hash);
    proxy[32..].copy_from_slice(&pk_hash);

    let trailer_len = 2 + FALCON512_PUBKEY_LEN + FALCON512_SIG_MAX_LEN;
    let mut wire = Vec::with_capacity(1 + body.len() + 64 + trailer_len);
    wire.push(V1_PREFIX);
    wire.extend_from_slice(body);
    // 64-byte proxy signature in the standard slot
    wire.extend_from_slice(&proxy);
    // Falcon trailer
    wire.extend_from_slice(&(falcon_sig.len() as u16).to_le_bytes());
    wire.extend_from_slice(falcon_pubkey);
    let mut padded_sig = [0u8; FALCON512_SIG_MAX_LEN];
    padded_sig[..falcon_sig.len()].copy_from_slice(falcon_sig);
    wire.extend_from_slice(&padded_sig);
    wire
}

fn message_bytes(body: &[u8]) -> Vec<u8> {
    let mut msg = Vec::with_capacity(1 + body.len());
    msg.push(V1_PREFIX);
    msg.extend_from_slice(body);
    msg
}

// ── Diagram display ──────────────────────────────────────────────────────

const C_RESET: &str = "\x1b[0m";
const C_BOLD: &str = "\x1b[1m";
const C_DIM: &str = "\x1b[2m";
const C_CYAN: &str = "\x1b[36m";
const C_YELLOW: &str = "\x1b[33m";
const C_GREEN: &str = "\x1b[32m";
const C_MAGENTA: &str = "\x1b[35m";
const C_RED: &str = "\x1b[31m";
const _C_BLUE: &str = "\x1b[34m";

fn print_address_derivation(falcon_pk_hex: &str, address_b58: &str) {
    let hex_display = format!("{}...", falcon_pk_hex);
    let hex_pad = " ".repeat(48usize.saturating_sub(hex_display.len()));
    let addr_pad = " ".repeat(48usize.saturating_sub(address_b58.len()));
    println!();
    println!("{C_BOLD}┌──────────────────────────────────────────────────────────────┐{C_RESET}");
    println!("{C_BOLD}│  PQC Address Derivation                                      │{C_RESET}");
    println!("{C_BOLD}├──────────────────────────────────────────────────────────────┤{C_RESET}");
    println!("│                                                              │");
    println!("│  {C_CYAN}Falcon-512 Public Key (897 bytes){C_RESET}                         │");
    println!("│  ┌──────────────────────────────────────────────────────┐   │");
    println!("│  │ {C_DIM}{hex_display}{C_RESET}{hex_pad} │   │");
    println!("│  └────────────────────────┬─────────────────────────────┘   │");
    println!("│                           │                                 │");
    println!("│                           ▼ {C_YELLOW}SHA-256{C_RESET}                          │");
    println!("│                                                              │");
    println!("│  {C_GREEN}Solana Address (32 bytes, base58){C_RESET}                         │");
    println!("│  ┌──────────────────────────────────────────────────────┐   │");
    println!("│  │ {C_GREEN}{address_b58}{C_RESET}{addr_pad} │   │");
    println!("│  └──────────────────────────────────────────────────────┘   │");
    println!("│                                                              │");
    println!("│  {C_RED}★ Guaranteed OFF-CURVE{C_RESET} — SHA-256 output has ~2^{{-128}}    │");
    println!("│    chance of hitting Ed25519 curve. Cannot collide with      │");
    println!("│    standard accounts. Same 32-byte format, works with        │");
    println!("│    all existing Solana infrastructure.                        │");
    println!("│                                                              │");
    println!("{C_BOLD}└──────────────────────────────────────────────────────────────┘{C_RESET}");
    println!();
}

fn print_wire_format_comparison(ed25519_size: usize, pqc_size: usize) {
    println!();
    println!("{C_BOLD}┌──────────────────────────────────────────────────────────────┐{C_RESET}");
    println!("{C_BOLD}│  V1 Wire Format Comparison                                   │{C_RESET}");
    println!("{C_BOLD}├──────────────────────────────────────────────────────────────┤{C_RESET}");
    println!("│                                                              │");
    println!("│  {C_GREEN}Standard Ed25519 V1{C_RESET} ({ed25519_size} bytes):                          │");
    println!("│  ┌──────┬──────────────────────┬──────────────────┐         │");
    println!("│  │{C_CYAN} 0x81 {C_RESET}│{C_GREEN} V1 Message Body      {C_RESET}│{C_YELLOW} Ed25519 Sig (64B){C_RESET}│         │");
    println!("│  └──────┴──────────────────────┴──────────────────┘         │");
    println!("│                                                              │");
    println!("│  {C_MAGENTA}PQC Falcon-512 V1{C_RESET} ({pqc_size} bytes):                           │");
    println!("│  ┌──────┬──────────────────┬──────────┬──────────────┐      │");
    println!("│  │{C_CYAN} 0x81 {C_RESET}│{C_GREEN} V1 Message Body  {C_RESET}│{C_YELLOW} Proxy(64){C_RESET}│{C_MAGENTA} Falcon Trail. {C_RESET}│      │");
    println!("│  └──────┴───────┬──────────┴──────────┴──────┬───────┘      │");
    println!("│                 │                             │              │");
    println!("│      ┌──────────┴──────────┐     ┌───────────┴───────────┐  │");
    println!("│      │ {C_GREEN}ConfigMask(4B){C_RESET}     │     │ {C_MAGENTA}sig_len{C_RESET}    2 bytes  │  │");
    println!("│      │ {C_RED}bit 5 = PQC flag{C_RESET}   │     │ {C_MAGENTA}falcon_pk{C_RESET}  897 bytes│  │");
    println!("│      │ adds 0 extra bytes │     │ {C_MAGENTA}falcon_sig{C_RESET} 666 bytes│  │");
    println!("│      └────────────────────┘     │      {C_DIM}(zero-padded){C_RESET} │  │");
    println!("│                                 └───────────────────────┘  │");
    println!("│                                                              │");
    println!("{C_BOLD}└──────────────────────────────────────────────────────────────┘{C_RESET}");
    println!();
}

fn print_proxy_signature_diagram(proxy_b58: &str, pqc_addr: &str) {
    let txid_short = if proxy_b58.len() > 40 {
        format!("{}...", &proxy_b58[..40])
    } else {
        proxy_b58.to_string()
    };
    let txid_pad = " ".repeat(48usize.saturating_sub(txid_short.len()));
    let addr_pad = " ".repeat(48usize.saturating_sub(pqc_addr.len()));
    println!();
    println!("{C_BOLD}┌──────────────────────────────────────────────────────────────┐{C_RESET}");
    println!("{C_BOLD}│  Proxy Signature Structure (signatures[0], 64 bytes)          │{C_RESET}");
    println!("{C_BOLD}├──────────────────────────────────────────────────────────────┤{C_RESET}");
    println!("│                                                              │");
    println!("│  ┌──────────────────────────────╥─────────────────────────┐ │");
    println!("│  │ {C_YELLOW}SHA-256(falcon_sig)[0..32]{C_RESET}    ║ {C_GREEN}SHA-256(falcon_pk)[0..32]{C_RESET}│ │");
    println!("│  └──────────────┬───────────────╨────────────┬────────────┘ │");
    println!("│                 │                             │              │");
    println!("│                 ▼                             ▼              │");
    println!("│      {C_YELLOW}This half = TxID{C_RESET}              {C_GREEN}This half = Account{C_RESET}  │");
    println!("│      {C_DIM}(visible in explorers,{C_RESET}         {C_DIM}(fee payer address){C_RESET}  │");
    println!("│      {C_DIM} RPCs, websockets){C_RESET}                                   │");
    println!("│                                                              │");
    println!("│  {C_BOLD}Actual values:{C_RESET}                                             │");
    println!("│    TxID:    {C_YELLOW}{txid_short}{C_RESET}{txid_pad}│");
    println!("│    Account: {C_GREEN}{pqc_addr}{C_RESET}{addr_pad}│");
    println!("│                                                              │");
    println!("│  {C_CYAN}★ Same 64-byte format as Ed25519 signatures{C_RESET}               │");
    println!("│    → Explorers, wallets, RPCs work without any changes       │");
    println!("│                                                              │");
    println!("{C_BOLD}└──────────────────────────────────────────────────────────────┘{C_RESET}");
    println!();
}

fn print_verification_pipeline() {
    println!();
    println!("{C_BOLD}┌──────────────────────────────────────────────────────────────┐{C_RESET}");
    println!("{C_BOLD}│  Validator: 3 Security Checks                                │{C_RESET}");
    println!("{C_BOLD}├──────────────────────────────────────────────────────────────┤{C_RESET}");
    println!("│                                                              │");
    println!("│  {C_GREEN}Check 1: Address ownership{C_RESET}                                │");
    println!("│  ┌────────────────────────────────────────────────────────┐ │");
    println!("│  │ SHA-256(falcon_pubkey) == account_keys[0]              │ │");
    println!("│  │ → proves: sender owns this account                    │ │");
    println!("│  └────────────────────────────────────────────────────────┘ │");
    println!("│                                                              │");
    println!("│  {C_YELLOW}Check 2: Cryptographic signature{C_RESET}                          │");
    println!("│  ┌────────────────────────────────────────────────────────┐ │");
    println!("│  │ falcon_sig.verify(falcon_pubkey, message_bytes)        │ │");
    println!("│  │ → proves: message signed by the Falcon private key    │ │");
    println!("│  └────────────────────────────────────────────────────────┘ │");
    println!("│                                                              │");
    println!("│  {C_MAGENTA}Check 3: Proxy binding{C_RESET}                                    │");
    println!("│  ┌────────────────────────────────────────────────────────┐ │");
    println!("│  │ signatures[0] == SHA256(sig) || SHA256(pk)             │ │");
    println!("│  │ → proves: proxy is deterministically bound to          │ │");
    println!("│  │   Falcon material (no one can substitute it)           │ │");
    println!("│  └────────────────────────────────────────────────────────┘ │");
    println!("│                                                              │");
    println!("│  {C_RED}If ANY check fails → transaction rejected{C_RESET}                   │");
    println!("│                                                              │");
    println!("│  {C_CYAN}Same function verified at 3 pipeline stages:{C_RESET}               │");
    println!("│    1. RPC preflight   (before forwarding to leader)       │");
    println!("│    2. Leader sigverify (TPU, rayon threadpool)            │");
    println!("│    3. Replay on other validators (block verification)     │");
    println!("│                                                              │");
    println!("{C_BOLD}└──────────────────────────────────────────────────────────────┘{C_RESET}");
    println!();
}

fn print_poh_binding() {
    println!();
    println!("{C_BOLD}┌──────────────────────────────────────────────────────────────┐{C_RESET}");
    println!("{C_BOLD}│  PoH Merkle Hash — PQC data is part of consensus             │{C_RESET}");
    println!("{C_BOLD}├──────────────────────────────────────────────────────────────┤{C_RESET}");
    println!("│                                                              │");
    println!("│  {C_GREEN}Ed25519 tx:{C_RESET}             {C_MAGENTA}PQC Falcon tx:{C_RESET}                    │");
    println!("│  Merkle leaves:          Merkle leaves:                      │");
    println!("│  ┌────────────────┐      ┌──────────────────────┐            │");
    println!("│  │ • ed25519_sig  │      │ • proxy_sig (64B)    │            │");
    println!("│  │   (64 bytes)   │      │ • {C_CYAN}falcon_pk (897B){C_RESET}  │ ← in hash! │");
    println!("│  └────────────────┘      │ • {C_CYAN}falcon_sig(≤666B){C_RESET} │ ← in hash! │");
    println!("│                          └──────────┬───────────┘            │");
    println!("│                                     │                        │");
    println!("│                                     ▼                        │");
    println!("│                          ┌──────────────────────┐            │");
    println!("│                          │ Merkle Root → PoH    │            │");
    println!("│                          │ hash chain → Block   │            │");
    println!("│                          └──────────────────────┘            │");
    println!("│                                                              │");
    println!("│  {C_RED}★ Falcon material is cryptographically bound to block.{C_RESET}  │");
    println!("│    Tampering with PQC data breaks the entire block hash.     │");
    println!("│                                                              │");
    println!("{C_BOLD}└──────────────────────────────────────────────────────────────┘{C_RESET}");
    println!();
}

fn print_final_comparison() {
    println!();
    println!("{C_BOLD}┌──────────────────────────────────────────────────────────────┐{C_RESET}");
    println!("{C_BOLD}│  Ed25519 vs Falcon-512: Side-by-Side                         │{C_RESET}");
    println!("{C_BOLD}├─────────────────────────────┬────────────────────────────────┤{C_RESET}");
    println!("│ {C_GREEN}Ed25519 (standard){C_RESET}           │ {C_MAGENTA}Falcon-512 (PQC){C_RESET}              │");
    println!("├─────────────────────────────┼────────────────────────────────┤");
    println!("│ Wire size: ~220 bytes       │ Wire size: ~1785 bytes         │");
    println!("│ Signature: 64 bytes         │ Signature: ≤666 bytes          │");
    println!("│ Pubkey: 32 bytes            │ Pubkey: 897 bytes              │");
    println!("│ Address: on-curve           │ Address: off-curve (SHA-256)   │");
    println!("│ Quantum-safe: {C_RED}NO ✗{C_RESET}         │ Quantum-safe: {C_GREEN}YES ✓{C_RESET}            │");
    println!("{C_BOLD}└─────────────────────────────┴────────────────────────────────┘{C_RESET}");
    println!();
}

fn print_transaction_details(_tx_sig: &str, tx_data: &serde_json::Value) {
    println!();
    println!("{C_BOLD}┌──────────────────────────────────────────────────────────────────────────┐{C_RESET}");
    println!("{C_BOLD}│  RPC getTransaction Result (PQC Transaction)                             │{C_RESET}");
    println!("{C_BOLD}├──────────────────────────────────────────────────────────────────────────┤{C_RESET}");
    
    // Extract info
    let slot = tx_data["slot"].as_u64().unwrap_or(0);
    let fee = tx_data["meta"]["fee"].as_u64().unwrap_or(0);
    let compute_units = tx_data["meta"]["computeUnitsConsumed"].as_u64().unwrap_or(0);
    let version = tx_data["version"].as_u64().unwrap_or(0); // Should be 1 for V1
    
    let signatures = tx_data["transaction"]["signatures"].as_array();
    let sig_0 = signatures.and_then(|s| s.get(0)).and_then(|s| s.as_str()).unwrap_or("unknown");
    
    let account_keys = tx_data["transaction"]["message"]["accountKeys"].as_array();
    let sender = account_keys.and_then(|k| k.get(0)).and_then(|k| k.as_str()).unwrap_or("unknown");
    
    println!("│  {C_CYAN}Signature:{C_RESET} {sig_0}");
    println!("│  {C_CYAN}Sender:{C_RESET}    {sender}");
    println!("│  {C_CYAN}Slot:{C_RESET}      {slot}");
    println!("│  {C_CYAN}Version:{C_RESET}   {version} (V1 PQC)");
    println!("│  {C_CYAN}Fee:{C_RESET}       {fee} lamports");
    println!("│  {C_CYAN}Compute:{C_RESET}   {compute_units} CUs");
    println!("│                                                                          │");
    println!("│  {C_GREEN}★ The RPC node successfully parsed and returned the PQC transaction!{C_RESET}    │");
    println!("│    Notice that the signature array contains the Proxy Signature (TxID)   │");
    println!("│    and the accountKeys array contains the off-curve Falcon address.      │");
    println!("{C_BOLD}└──────────────────────────────────────────────────────────────────────────┘{C_RESET}");
    println!();
}

// ── Main ─────────────────────────────────────────────────────────────────

fn main() -> Result<(), String> {
    println!("============================================================");
    println!("  Solana PQC Demo: The \"Cold Vault\" Storyline");
    println!("============================================================");
    println!();
    println!("  Story:");
    println!("  1. We use a quantum-safe Falcon-512 wallet as a secure Cold Vault.");
    println!("  2. We use a standard Ed25519 wallet as an everyday Hot Wallet.");
    println!("  3. We fund the Hot Wallet from the Vault (PQC transaction).");
    println!("  4. We return excess funds to the Vault (Standard transaction).");
    println!();

    // ── Step 1: Generate wallets ─────────────────────────────────────────

    println!("[ Step 1 ] Generating wallets...");
    println!();

    // Falcon-512 wallet (Vault)
    let (falcon_pk, falcon_sk) = solana_pqc::generate_falcon_keypair();
    let pqc_address = falcon_pk.derive_address();
    let pqc_pubkey: [u8; 32] = pqc_address.to_bytes();
    let pqc_addr = b58(&pqc_pubkey);
    println!("  🏦 Falcon-512 Cold Vault (PQC):");
    println!("    Address: {pqc_addr}");
    println!(
        "    Falcon pubkey: {}... ({} bytes)",
        hex::encode(&falcon_pk.as_bytes()[..16]),
        falcon_pk.as_bytes().len()
    );

    print_address_derivation(
        &hex::encode(&falcon_pk.as_bytes()[..20]),
        &pqc_addr,
    );

    // Ed25519 wallet (Hot Wallet)
    let ed_signing_key = SigningKey::generate(&mut OsRng);
    let ed_verifying_key = ed_signing_key.verifying_key();
    let ed_pubkey: [u8; 32] = ed_verifying_key.to_bytes();
    let ed_addr = b58(&ed_pubkey);
    println!("  📱 Ed25519 Hot Wallet (Standard):");
    println!("    Address: {ed_addr}");
    println!("    Pubkey:  {}... (32 bytes)", hex::encode(&ed_pubkey[..16]));
    println!();

    // ── Step 2: Airdrop ──────────────────────────────────────────────────

    println!();
    println!("------------------------------------------------------------");
    println!("[ Step 2 ] Fund the Cold Vault (Airdrop 1000 SOL)");
    println!("------------------------------------------------------------");
    println!();

    let airdrop_sig = request_airdrop(&pqc_addr, 1000 * LAMPORTS_PER_SOL)?;
    println!("  Airdrop tx: {airdrop_sig}");
    println!("  Waiting for confirmation...");
    wait_for_confirmation(&airdrop_sig, 30)?;
    println!("  Airdrop CONFIRMED!");
    println!();

    let ed_bal = get_balance(&ed_addr)?;
    let pqc_bal = get_balance(&pqc_addr)?;
    println!("  Balances:");
    println!("    🏦 Vault:      {} SOL", sol(pqc_bal));
    println!("    📱 Hot Wallet: {} SOL", sol(ed_bal));

    // ── Step 3: PQC → Ed25519 (20 SOL) ───────────────────────────────────

    println!();
    println!("------------------------------------------------------------");
    println!("[ Step 3 ] Fund Hot Wallet: Vault --> Hot Wallet (20 SOL)");
    println!("           (PQC V1 transaction, Falcon-512 signature)");
    println!("------------------------------------------------------------");
    println!();

    let blockhash = get_latest_blockhash()?;
    println!("  Blockhash: {}", bs58::encode(&blockhash).into_string());

    let body = build_pqc_v1_body(&pqc_pubkey, &ed_pubkey, &blockhash, 20 * LAMPORTS_PER_SOL);
    println!("  V1 body: {} bytes (config_mask bit 5 = PQC)", body.len());

    let msg = message_bytes(&body);
    println!("  Signing with Falcon-512...");
    let falcon_sig =
        solana_pqc::falcon_sign(&msg, &falcon_sk).ok_or("Falcon signing failed")?;
    println!(
        "  Falcon signature: {}... ({} bytes)",
        hex::encode(&falcon_sig.as_bytes()[..16]),
        falcon_sig.len()
    );

    assert!(
        falcon_sig.verify(&falcon_pk, &msg),
        "Local Falcon verification FAILED"
    );
    println!("  Local verification: PASSED");

    let proxy_sig = falcon_sig.to_proxy_signature(&falcon_pk);
    println!("  Proxy sig (txid): {proxy_sig}");

    let wire = build_pqc_v1_wire(&body, falcon_pk.as_bytes(), falcon_sig.as_bytes());
    println!("  Wire size: {} bytes", wire.len());

    let ed25519_wire_size = 1 + body.len() + 64; // hypothetical ed25519 for same body
    print_wire_format_comparison(ed25519_wire_size, wire.len());
    print_proxy_signature_diagram(&proxy_sig.to_string(), &pqc_addr);

    let wire_b64 = BASE64.encode(&wire);
    println!("  Sending PQC transaction (with preflight)...");
    let tx_sig = send_raw_transaction_b64(&wire_b64, false)?;
    println!("  TX signature: {tx_sig}");
    println!("  Waiting for confirmation...");
    wait_for_confirmation(&tx_sig, 30)?;
    println!("  Transaction CONFIRMED!");

    println!("  Fetching transaction details from RPC...");
    match get_transaction(&tx_sig) {
        Ok(tx_data) => print_transaction_details(&tx_sig, &tx_data),
        Err(e) => println!("  {C_RED}Failed to fetch transaction: {e}{C_RESET}"),
    }

    print_verification_pipeline();
    print_poh_binding();

    let ed_bal = get_balance(&ed_addr)?;
    let pqc_bal = get_balance(&pqc_addr)?;
    println!("  Balances:");
    println!("    🏦 Vault:      {} SOL", sol(pqc_bal));
    println!("    📱 Hot Wallet: {} SOL", sol(ed_bal));

    // ── Step 4: Simulate Hot Wallet Usage ────────────────────────────────

    println!();
    println!("------------------------------------------------------------");
    println!("[ Step 4 ] Simulate everyday Hot Wallet usage");
    println!("------------------------------------------------------------");
    println!();
    
    println!("  📱 Buying coffee (0.05 SOL)...");
    std::thread::sleep(std::time::Duration::from_millis(500));
    println!("  📱 Paying for gas (0.1 SOL)...");
    std::thread::sleep(std::time::Duration::from_millis(500));
    println!("  📱 Minting an NFT (1.5 SOL)...");
    std::thread::sleep(std::time::Duration::from_millis(500));
    println!("  📱 Trading on DEX (10 SOL)...");
    std::thread::sleep(std::time::Duration::from_millis(500));
    println!("  (Simulated usage complete)");
    println!();

    // ── Step 5: Ed25519 → PQC (5 SOL) ───────────────────────────────────

    println!("------------------------------------------------------------");
    println!("[ Step 5 ] Return funds: Hot Wallet --> Vault (5 SOL)");
    println!("           (Standard V1 transaction, Ed25519 signature)");
    println!("------------------------------------------------------------");
    println!();

    let blockhash = get_latest_blockhash()?;
    println!("  Blockhash: {}", bs58::encode(&blockhash).into_string());

    let body = build_ed25519_v1_body(&ed_pubkey, &pqc_pubkey, &blockhash, 5 * LAMPORTS_PER_SOL);
    println!("  V1 body: {} bytes", body.len());

    let msg = message_bytes(&body);
    let ed_signature = ed_signing_key.sign(&msg);
    let sig_bytes: [u8; 64] = ed_signature.to_bytes();
    println!("  Ed25519 signature: {}...", hex::encode(&sig_bytes[..16]));

    ed_verifying_key
        .verify(&msg, &ed_signature)
        .map_err(|e| format!("local verify failed: {e}"))?;
    println!("  Local verification: PASSED");

    let wire = build_ed25519_v1_wire(&body, &sig_bytes);
    let ed25519_wire_size = wire.len();
    println!("  Wire size: {} bytes", ed25519_wire_size);

    let wire_b64 = BASE64.encode(&wire);
    println!("  Sending transaction...");
    let tx_sig = send_raw_transaction_b64(&wire_b64, false)?;
    println!("  TX signature: {tx_sig}");
    println!("  Waiting for confirmation...");
    wait_for_confirmation(&tx_sig, 30)?;
    println!("  Transaction CONFIRMED!");
    println!();

    println!("  {C_GREEN}★ Notice that the PQC Vault receives funds just like any other account.{C_RESET}");
    println!("    The sender (Hot Wallet) doesn't need to know it's sending to a PQC address.");
    println!();

    let ed_bal = get_balance(&ed_addr)?;
    let pqc_bal = get_balance(&pqc_addr)?;
    println!("  Balances:");
    println!("    🏦 Vault:      {} SOL", sol(pqc_bal));
    println!("    📱 Hot Wallet: {} SOL", sol(ed_bal));

    // ── Summary ──────────────────────────────────────────────────────────

    println!();
    println!("============================================================");
    println!("  SUMMARY");
    println!("============================================================");
    println!();
    println!("  🏦 Vault (PQC):        {pqc_addr}");
    println!("  📱 Hot Wallet (Ed):    {ed_addr}");
    println!();
    println!("  Step 1: Airdrop 1000 SOL     --> Vault");
    println!("  Step 2: Vault -- 20 SOL    --> Hot Wallet (V1, Falcon-512 sig)");
    println!("  Step 3: Hot Wallet -- 5 SOL  --> Vault      (V1, Ed25519 sig)");
    println!();

    let ed_final = get_balance(&ed_addr)?;
    let pqc_final = get_balance(&pqc_addr)?;
    println!("  Final balances:");
    println!("    🏦 Vault:      {} SOL  (expected 985 SOL)", sol(pqc_final));
    println!("    📱 Hot Wallet: {} SOL  (expected ~15 SOL, minus tx fees)", sol(ed_final));
    println!();

    if pqc_final == 985 * LAMPORTS_PER_SOL {
        println!("  Vault balance is exactly 985 SOL -- PERFECT!");
    }
    if ed_final < 15 * LAMPORTS_PER_SOL && ed_final > 14 * LAMPORTS_PER_SOL {
        println!("  Hot Wallet balance ~15 SOL (minus fees) -- CORRECT!");
    }

    print_final_comparison();

    println!();
    println!("  All transfers completed successfully!");
    println!("  Post-quantum Falcon-512 signatures are first-class citizens in Solana.");
    println!();
    println!("============================================================");
    println!("  DEMO COMPLETE");
    println!("============================================================");

    Ok(())
}
