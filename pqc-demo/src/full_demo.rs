//! Full PQC demo: bidirectional SOL transfers between Ed25519 and Falcon-512 wallets.
//!
//! 1. Generate Ed25519 wallet (standard) and Falcon-512 wallet (PQC)
//! 2. Airdrop 10 SOL to Ed25519 wallet
//! 3. Transfer 7 SOL:  Ed25519 → PQC   (standard V1 transaction)
//! 4. Transfer 2 SOL:  PQC → Ed25519   (PQC V1 transaction, Falcon-512 signed)
//! 5. Print final balances

use base64::{Engine, engine::general_purpose::STANDARD as BASE64};
use ed25519_dalek::{Signer, SigningKey, Verifier};
use rand::rngs::OsRng;
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
/// Config bits 2+3: compute_unit_limit + loaded_accounts_data_size_limit.
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

    let config_mask: u32 = (1 << 2) | (1 << 3);
    buf.extend_from_slice(&config_mask.to_le_bytes());

    buf.extend_from_slice(blockhash);

    buf.push(1); // num_instructions
    buf.push(3); // num_addresses

    buf.extend_from_slice(sender);
    buf.extend_from_slice(receiver);
    buf.extend_from_slice(&SYSTEM_PROGRAM);

    // Config values (bit 2: CU limit, bit 3: loaded accounts limit)
    buf.extend_from_slice(&200_000u32.to_le_bytes());
    buf.extend_from_slice(&65_536u32.to_le_bytes());

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

/// PQC V1 wire: [0x81][body][2B sig_len][897B falcon_pk][666B padded falcon_sig]
fn build_pqc_v1_wire(body: &[u8], falcon_pubkey: &[u8], falcon_sig: &[u8]) -> Vec<u8> {
    assert_eq!(falcon_pubkey.len(), FALCON512_PUBKEY_LEN);
    assert!(falcon_sig.len() <= FALCON512_SIG_MAX_LEN);

    let mut wire =
        Vec::with_capacity(1 + body.len() + 2 + FALCON512_PUBKEY_LEN + FALCON512_SIG_MAX_LEN);
    wire.push(V1_PREFIX);
    wire.extend_from_slice(body);
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

// ── Main ─────────────────────────────────────────────────────────────────

fn main() -> Result<(), String> {
    println!("============================================================");
    println!("  Solana PQC Full Demo: Ed25519 <-> Falcon-512 Transfers");
    println!("============================================================");
    println!();

    // ── Step 1: Generate wallets ─────────────────────────────────────────

    println!("[ Step 1 ] Generating wallets...");
    println!();

    // Ed25519 wallet
    let ed_signing_key = SigningKey::generate(&mut OsRng);
    let ed_verifying_key = ed_signing_key.verifying_key();
    let ed_pubkey: [u8; 32] = ed_verifying_key.to_bytes();
    let ed_addr = b58(&ed_pubkey);
    println!("  Ed25519 wallet (standard):");
    println!("    Address: {ed_addr}");
    println!("    Pubkey:  {}... (32 bytes)", hex::encode(&ed_pubkey[..16]));
    println!();

    // Falcon-512 wallet
    let (falcon_pk, falcon_sk) = solana_pqc::generate_falcon_keypair();
    let pqc_address = falcon_pk.derive_address();
    let pqc_pubkey: [u8; 32] = pqc_address.to_bytes();
    let pqc_addr = b58(&pqc_pubkey);
    println!("  Falcon-512 wallet (PQC):");
    println!("    Address: {pqc_addr}");
    println!(
        "    Falcon pubkey: {}... ({} bytes)",
        hex::encode(&falcon_pk.as_bytes()[..16]),
        falcon_pk.as_bytes().len()
    );
    println!("    (Solana address = SHA-256 of Falcon pubkey, off-curve)");

    // ── Step 2: Airdrop ──────────────────────────────────────────────────

    println!();
    println!("------------------------------------------------------------");
    println!("[ Step 2 ] Airdrop 10 SOL to Ed25519 wallet");
    println!("------------------------------------------------------------");
    println!();

    let airdrop_sig = request_airdrop(&ed_addr, 10 * LAMPORTS_PER_SOL)?;
    println!("  Airdrop tx: {airdrop_sig}");
    println!("  Waiting for confirmation...");
    wait_for_confirmation(&airdrop_sig, 30)?;
    println!("  Airdrop CONFIRMED!");
    println!();

    let ed_bal = get_balance(&ed_addr)?;
    let pqc_bal = get_balance(&pqc_addr)?;
    println!("  Balances after airdrop:");
    println!("    Ed25519: {} SOL", sol(ed_bal));
    println!("    PQC:     {} SOL", sol(pqc_bal));

    // ── Step 3: Ed25519 → PQC (7 SOL) ───────────────────────────────────

    println!();
    println!("------------------------------------------------------------");
    println!("[ Step 3 ] Transfer 7 SOL: Ed25519 --> PQC");
    println!("           (standard V1 transaction, Ed25519 signature)");
    println!("------------------------------------------------------------");
    println!();

    let blockhash = get_latest_blockhash()?;
    println!("  Blockhash: {}", bs58::encode(&blockhash).into_string());

    let body = build_ed25519_v1_body(&ed_pubkey, &pqc_pubkey, &blockhash, 7 * LAMPORTS_PER_SOL);
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
    println!("  Wire size: {} bytes", wire.len());

    let wire_b64 = BASE64.encode(&wire);
    println!("  Sending transaction...");
    let tx_sig = send_raw_transaction_b64(&wire_b64, false)?;
    println!("  TX signature: {tx_sig}");
    println!("  Waiting for confirmation...");
    wait_for_confirmation(&tx_sig, 30)?;
    println!("  Transaction CONFIRMED!");
    println!();

    let ed_bal = get_balance(&ed_addr)?;
    let pqc_bal = get_balance(&pqc_addr)?;
    println!("  Balances after Ed25519 -> PQC transfer:");
    println!("    Ed25519: {} SOL", sol(ed_bal));
    println!("    PQC:     {} SOL", sol(pqc_bal));

    // ── Step 4: PQC → Ed25519 (2 SOL) ───────────────────────────────────

    println!();
    println!("------------------------------------------------------------");
    println!("[ Step 4 ] Transfer 2 SOL: PQC --> Ed25519");
    println!("           (PQC V1 transaction, Falcon-512 signature)");
    println!("------------------------------------------------------------");
    println!();

    let blockhash = get_latest_blockhash()?;
    println!("  Blockhash: {}", bs58::encode(&blockhash).into_string());

    let body = build_pqc_v1_body(&pqc_pubkey, &ed_pubkey, &blockhash, 2 * LAMPORTS_PER_SOL);
    println!("  V1 body: {} bytes", body.len());

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

    let wire_b64 = BASE64.encode(&wire);
    println!("  Sending PQC transaction...");
    let tx_sig = send_raw_transaction_b64(&wire_b64, true)?;
    println!("  TX signature: {tx_sig}");
    println!("  Waiting for confirmation...");
    wait_for_confirmation(&tx_sig, 30)?;
    println!("  Transaction CONFIRMED!");
    println!();

    let ed_bal = get_balance(&ed_addr)?;
    let pqc_bal = get_balance(&pqc_addr)?;
    println!("  Balances after PQC -> Ed25519 transfer:");
    println!("    Ed25519: {} SOL", sol(ed_bal));
    println!("    PQC:     {} SOL", sol(pqc_bal));

    // ── Summary ──────────────────────────────────────────────────────────

    println!();
    println!("============================================================");
    println!("  SUMMARY");
    println!("============================================================");
    println!();
    println!("  Ed25519 wallet: {ed_addr}");
    println!("  PQC wallet:     {pqc_addr}");
    println!();
    println!("  Step 1: Airdrop 10 SOL       --> Ed25519");
    println!("  Step 2: Ed25519 -- 7 SOL -->  PQC        (V1, Ed25519 sig)");
    println!("  Step 3: PQC     -- 2 SOL -->  Ed25519    (V1, Falcon-512 sig)");
    println!();

    let ed_final = get_balance(&ed_addr)?;
    let pqc_final = get_balance(&pqc_addr)?;
    println!("  Final balances:");
    println!("    Ed25519: {} SOL  (expected ~5 SOL, minus tx fees)", sol(ed_final));
    println!("    PQC:     {} SOL  (expected 5 SOL)", sol(pqc_final));
    println!();

    if pqc_final == 5 * LAMPORTS_PER_SOL {
        println!("  PQC balance is exactly 5 SOL -- PERFECT!");
    }
    if ed_final < 5 * LAMPORTS_PER_SOL && ed_final > 4 * LAMPORTS_PER_SOL {
        println!("  Ed25519 balance ~5 SOL (minus fees) -- CORRECT!");
    }

    println!();
    println!("  All transfers completed successfully!");
    println!("  Post-quantum Falcon-512 signatures work on Solana.");
    println!();
    println!("============================================================");
    println!("  DEMO COMPLETE");
    println!("============================================================");

    Ok(())
}
