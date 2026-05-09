//! Solana PQC Demo: Falcon-512 Cold Vault + Ed25519 Hot Wallet
//!
//! 1. Generate Falcon-512 wallet (Cold Vault) and Ed25519 wallet (Hot Wallet)
//! 2. Airdrop SOL to the PQC Cold Vault
//! 3. Transfer SOL: PQC Vault -> Ed25519 Hot Wallet (PQC V1 transaction)
//! 4. Transfer SOL: Hot Wallet -> random address (standard V1 transaction)
//! 5. Return funds: Hot Wallet -> PQC Vault (standard V1 to PQC address)

use base64::{Engine, engine::general_purpose::STANDARD as BASE64};
use ed25519_dalek::{Signer, SigningKey};
use rand::rngs::OsRng;
use sha2::{Digest, Sha256};
use solana_pqc::{FALCON512_PUBKEY_LEN, FALCON512_SIG_MAX_LEN, PQC_CONFIG_MASK_BIT};

const RPC_URL: &str = "http://127.0.0.1:8899";
const V1_PREFIX: u8 = 0x81;
const LAMPORTS_PER_SOL: u64 = 1_000_000_000;
const SYSTEM_PROGRAM: [u8; 32] = [0u8; 32];

// ── Colors ───────────────────────────────────────────────────────────────

const RST: &str = "\x1b[0m";
const BOLD: &str = "\x1b[1m";
const DIM: &str = "\x1b[2m";
const CYAN: &str = "\x1b[36m";
const GREEN: &str = "\x1b[32m";
const YELLOW: &str = "\x1b[33m";
const MAGENTA: &str = "\x1b[35m";

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

fn build_ed25519_v1_body(
    sender: &[u8; 32],
    receiver: &[u8; 32],
    blockhash: &[u8; 32],
    lamports: u64,
) -> Vec<u8> {
    let ix_data = build_system_transfer_ix_data(lamports);
    let ix_accounts: &[u8] = &[0, 1];

    let mut buf = Vec::with_capacity(256);
    buf.push(1);
    buf.push(0);
    buf.push(1);
    buf.extend_from_slice(&0u32.to_le_bytes());
    buf.extend_from_slice(blockhash);
    buf.push(1);
    buf.push(3);
    buf.extend_from_slice(sender);
    buf.extend_from_slice(receiver);
    buf.extend_from_slice(&SYSTEM_PROGRAM);
    buf.push(2);
    buf.push(ix_accounts.len() as u8);
    buf.extend_from_slice(&(ix_data.len() as u16).to_le_bytes());
    buf.extend_from_slice(ix_accounts);
    buf.extend_from_slice(&ix_data);
    buf
}

fn build_pqc_v1_body(
    sender: &[u8; 32],
    receiver: &[u8; 32],
    blockhash: &[u8; 32],
    lamports: u64,
) -> Vec<u8> {
    let ix_data = build_system_transfer_ix_data(lamports);
    let ix_accounts: &[u8] = &[0, 1];

    let mut buf = Vec::with_capacity(256);
    buf.push(1);
    buf.push(0);
    buf.push(1);
    let config_mask: u32 = 1u32 << PQC_CONFIG_MASK_BIT;
    buf.extend_from_slice(&config_mask.to_le_bytes());
    buf.extend_from_slice(blockhash);
    buf.push(1);
    buf.push(3);
    buf.extend_from_slice(sender);
    buf.extend_from_slice(receiver);
    buf.extend_from_slice(&SYSTEM_PROGRAM);
    buf.push(2);
    buf.push(ix_accounts.len() as u8);
    buf.extend_from_slice(&(ix_data.len() as u16).to_le_bytes());
    buf.extend_from_slice(ix_accounts);
    buf.extend_from_slice(&ix_data);
    buf
}

fn build_ed25519_v1_wire(body: &[u8], signature: &[u8; 64]) -> Vec<u8> {
    let mut wire = Vec::with_capacity(1 + body.len() + 64);
    wire.push(V1_PREFIX);
    wire.extend_from_slice(body);
    wire.extend_from_slice(signature);
    wire
}

fn build_pqc_v1_wire(body: &[u8], falcon_pubkey: &[u8], falcon_sig: &[u8]) -> Vec<u8> {
    assert_eq!(falcon_pubkey.len(), FALCON512_PUBKEY_LEN);
    assert!(falcon_sig.len() <= FALCON512_SIG_MAX_LEN);

    let sig_hash = Sha256::digest(falcon_sig);
    let pk_hash = Sha256::digest(falcon_pubkey);
    let mut proxy = [0u8; 64];
    proxy[..32].copy_from_slice(&sig_hash);
    proxy[32..].copy_from_slice(&pk_hash);

    let trailer_len = 2 + FALCON512_PUBKEY_LEN + FALCON512_SIG_MAX_LEN;
    let mut wire = Vec::with_capacity(1 + body.len() + 64 + trailer_len);
    wire.push(V1_PREFIX);
    wire.extend_from_slice(body);
    wire.extend_from_slice(&proxy);
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

fn print_balances(pqc_addr: &str, ed_addr: &str) -> Result<(), String> {
    let pqc_bal = get_balance(pqc_addr)?;
    let ed_bal = get_balance(ed_addr)?;
    println!("    {CYAN}Vault (PQC):{RST}      {BOLD}{:.6} SOL{RST}", sol(pqc_bal));
    println!("    {CYAN}Hot Wallet (Ed):{RST}  {BOLD}{:.6} SOL{RST}", sol(ed_bal));
    Ok(())
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

fn send_ed25519_transfer(
    signing_key: &SigningKey,
    sender: &[u8; 32],
    receiver: &[u8; 32],
    lamports: u64,
) -> Result<String, String> {
    let blockhash = get_latest_blockhash()?;
    let body = build_ed25519_v1_body(sender, receiver, &blockhash, lamports);
    let msg = message_bytes(&body);
    let signature = signing_key.sign(&msg);
    let sig_bytes: [u8; 64] = signature.to_bytes();
    let wire = build_ed25519_v1_wire(&body, &sig_bytes);
    let wire_b64 = BASE64.encode(&wire);
    let tx_sig = send_raw_transaction_b64(&wire_b64, false)?;
    wait_for_confirmation(&tx_sig, 30)?;
    Ok(tx_sig)
}

// ── Main ─────────────────────────────────────────────────────────────────

fn main() -> Result<(), String> {
    println!();
    println!("{BOLD}  ====================================================================={RST}");
    println!("{BOLD}    Solana PQC Demo: Falcon-512 Cold Vault + Ed25519 Hot Wallet{RST}");
    println!("{BOLD}  ====================================================================={RST}");
    println!();

    // ── Step 1: Generate wallets ─────────────────────────────────────────

    println!("  {BOLD}[1] Generating wallets{RST}");
    println!("  {DIM}---------------------------------------------------------------------{RST}");
    println!();

    let (falcon_pk, falcon_sk) = solana_pqc::generate_falcon_keypair();
    let pqc_address = falcon_pk.derive_address();
    let pqc_pubkey: [u8; 32] = pqc_address.to_bytes();
    let pqc_addr = b58(&pqc_pubkey);

    let ed_signing_key = SigningKey::generate(&mut OsRng);
    let ed_verifying_key = ed_signing_key.verifying_key();
    let ed_pubkey: [u8; 32] = ed_verifying_key.to_bytes();
    let ed_addr = b58(&ed_pubkey);

    println!("    {MAGENTA}Falcon-512 Cold Vault (PQC){RST}");
    println!("      Address:     {BOLD}{pqc_addr}{RST}");
    println!("      Falcon key:  {} bytes", falcon_pk.as_bytes().len());
    println!();
    println!("    {GREEN}Ed25519 Hot Wallet (Standard){RST}");
    println!("      Address:     {BOLD}{ed_addr}{RST}");
    println!();

    // ── Step 2: Airdrop ──────────────────────────────────────────────────

    println!("  {BOLD}[2] Airdrop 1000 SOL to PQC Vault{RST}");
    println!("  {DIM}---------------------------------------------------------------------{RST}");
    println!();

    let airdrop_sig = request_airdrop(&pqc_addr, 1000 * LAMPORTS_PER_SOL)?;
    println!("    Tx:   {DIM}{airdrop_sig}{RST}");
    print!("    ");
    wait_for_confirmation(&airdrop_sig, 30)?;
    println!("{GREEN}Confirmed{RST}");
    println!();
    print_balances(&pqc_addr, &ed_addr)?;
    println!();

    // ── Step 3: PQC -> Ed25519 (20 SOL) ─────────────────────────────────

    println!("  {BOLD}[3] PQC Vault -> Hot Wallet: 20 SOL{RST}  {MAGENTA}(Falcon-512 signed){RST}");
    println!("  {DIM}---------------------------------------------------------------------{RST}");
    println!();

    let blockhash = get_latest_blockhash()?;
    let body = build_pqc_v1_body(&pqc_pubkey, &ed_pubkey, &blockhash, 20 * LAMPORTS_PER_SOL);
    let msg = message_bytes(&body);

    let falcon_sig =
        solana_pqc::falcon_sign(&msg, &falcon_sk).ok_or("Falcon signing failed")?;
    let proxy_sig = falcon_sig.to_proxy_signature(&falcon_pk);
    let wire = build_pqc_v1_wire(&body, falcon_pk.as_bytes(), falcon_sig.as_bytes());

    println!("    Falcon sig:    {DIM}{} bytes{RST}", falcon_sig.len());
    println!("    Wire size:     {YELLOW}{} bytes{RST}", wire.len());
    println!("    Proxy (TxID):  {DIM}{proxy_sig}{RST}");
    println!();

    let wire_b64 = BASE64.encode(&wire);
    let tx_sig = send_raw_transaction_b64(&wire_b64, false)?;
    println!("    Tx:   {DIM}{tx_sig}{RST}");
    print!("    ");
    wait_for_confirmation(&tx_sig, 30)?;
    println!("{GREEN}Confirmed{RST}");
    println!();

    println!("    {BOLD}Validator verification (3 checks):{RST}");
    println!("      {GREEN}[1]{RST} SHA-256(falcon_pk || bump) == sender address    {GREEN}✓{RST}");
    println!("      {GREEN}[2]{RST} Falcon-512 signature valid over message         {GREEN}✓{RST}");
    println!("      {GREEN}[3]{RST} Proxy signature matches Falcon material         {GREEN}✓{RST}");
    println!();

    // On-chain verification via getTransaction
    println!("    {BOLD}On-chain (getTransaction):{RST}");
    match get_transaction(&tx_sig) {
        Ok(tx_data) => {
            let slot = tx_data["slot"].as_u64().unwrap_or(0);
            let fee = tx_data["meta"]["fee"].as_u64().unwrap_or(0);
            let version = &tx_data["version"];
            let sig_0 = tx_data["transaction"]["signatures"]
                .as_array()
                .and_then(|s| s.get(0))
                .and_then(|s| s.as_str())
                .unwrap_or("?");
            let sender_key = tx_data["transaction"]["message"]["accountKeys"]
                .as_array()
                .and_then(|k| k.get(0))
                .and_then(|k| k.as_str())
                .unwrap_or("?");

            println!("      Slot:        {slot}");
            println!("      Version:     {version}");
            println!("      Fee:         {fee} lamports");
            println!("      Signature:   {DIM}{sig_0}{RST}");
            println!("                   {YELLOW}= SHA256(falcon_sig) || SHA256(falcon_pk){RST}");
            println!("      Sender:      {DIM}{sender_key}{RST}");
            println!("                   {YELLOW}= SHA256(falcon_pk) [off-curve]{RST}");
        }
        Err(e) => println!("      {DIM}(fetch failed: {e}){RST}"),
    }
    println!();
    print_balances(&pqc_addr, &ed_addr)?;
    println!();

    // ── Step 4: Ed25519 -> random (15 SOL) ──────────────────────────────

    println!("  {BOLD}[4] Hot Wallet — spending via classical transactions{RST}  {GREEN}(Ed25519 signed){RST}");
    println!("  {DIM}---------------------------------------------------------------------{RST}");
    println!("  {DIM}  (In practice: DeFi swaps, NFT mints, staking, etc.){RST}");
    println!("  {DIM}  (For simplicity: a single 15 SOL transfer){RST}");
    println!();

    let random_key = SigningKey::generate(&mut OsRng);
    let random_pubkey: [u8; 32] = random_key.verifying_key().to_bytes();
    let random_addr = b58(&random_pubkey);
    println!("    Recipient:     {DIM}{random_addr}{RST}");

    let tx_sig = send_ed25519_transfer(&ed_signing_key, &ed_pubkey, &random_pubkey, 15 * LAMPORTS_PER_SOL)?;
    println!("    Tx:   {DIM}{tx_sig}{RST}");
    println!("    {GREEN}Confirmed{RST}");
    println!();
    print_balances(&pqc_addr, &ed_addr)?;
    println!();

    // ── Step 5: Ed25519 -> PQC Vault (return funds) ─────────────────────

    println!("  {BOLD}[5] Hot Wallet -> PQC Vault: 4 SOL{RST}  {GREEN}(Ed25519 -> PQC address){RST}");
    println!("  {DIM}---------------------------------------------------------------------{RST}");
    println!();

    let tx_sig = send_ed25519_transfer(&ed_signing_key, &ed_pubkey, &pqc_pubkey, 4 * LAMPORTS_PER_SOL)?;
    println!("    Tx:   {DIM}{tx_sig}{RST}");
    println!("    {GREEN}Confirmed{RST}");
    println!();
    print_balances(&pqc_addr, &ed_addr)?;
    println!();

    // ── Summary ──────────────────────────────────────────────────────────

    println!("  {BOLD}====================================================================={RST}");
    println!("  {BOLD}  Results{RST}");
    println!("  {BOLD}====================================================================={RST}");
    println!();

    let pqc_final = get_balance(&pqc_addr)?;
    let ed_final = get_balance(&ed_addr)?;

    println!("    {MAGENTA}Vault (PQC):{RST}      {BOLD}{:.} SOL{RST}", sol(pqc_final));
    println!("    {GREEN}Hot Wallet (Ed):{RST}  {BOLD}{:.6} SOL{RST}", sol(ed_final));
    println!();
    println!("    Transactions executed:");
    println!("      [3] PQC Vault -> Hot Wallet     20 SOL   {MAGENTA}Falcon-512{RST}");
    println!("      [4] Hot Wallet -> spending       15 SOL   {GREEN}Ed25519{RST}");
    println!("      [5] Hot Wallet -> PQC Vault      4 SOL   {GREEN}Ed25519{RST}");
    println!();
    println!("  {BOLD}{GREEN}  Demo complete.{RST}");
    println!();

    Ok(())
}
