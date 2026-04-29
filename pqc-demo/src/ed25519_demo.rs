//! Smoke test: standard Ed25519 wallets and SOL transfers via V1 transactions.
//!
//! Verifies that PQC validator changes haven't broken the normal Ed25519
//! pipeline. Creates a keypair, airdrops SOL, builds and signs a V1 SOL
//! transfer, sends it through RPC, and confirms.

use base64::{Engine, engine::general_purpose::STANDARD as BASE64};
use ed25519_dalek::{Signer, SigningKey};
use rand::rngs::OsRng;

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

fn get_latest_blockhash() -> Result<([u8; 32], u64), String> {
    let result = rpc_call(
        "getLatestBlockhash",
        serde_json::json!([{"commitment": "confirmed"}]),
    )?;
    let value = &result["value"];
    let bh_str = value["blockhash"].as_str().ok_or("missing blockhash")?;
    let bh_vec = bs58::decode(bh_str)
        .into_vec()
        .map_err(|e| format!("bad blockhash: {e}"))?;
    let mut bh = [0u8; 32];
    bh.copy_from_slice(&bh_vec);
    let last_valid = value["lastValidBlockHeight"]
        .as_u64()
        .ok_or("missing lastValidBlockHeight")?;
    Ok((bh, last_valid))
}

fn request_airdrop(address: &str, lamports: u64) -> Result<String, String> {
    let result = rpc_call(
        "requestAirdrop",
        serde_json::json!([address, lamports]),
    )?;
    result.as_str().map(String::from).ok_or("bad airdrop sig".into())
}

fn get_balance(address: &str) -> Result<u64, String> {
    let result = rpc_call(
        "getBalance",
        serde_json::json!([address, {"commitment": "confirmed"}]),
    )?;
    result["value"].as_u64().ok_or("bad balance".into())
}

fn send_raw_transaction(wire_base64: &str) -> Result<String, String> {
    let result = rpc_call(
        "sendTransaction",
        serde_json::json!([wire_base64, {
            "encoding": "base64",
            "preflightCommitment": "confirmed"
        }]),
    )?;
    result.as_str().map(String::from).ok_or("bad send result".into())
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

fn pubkey_to_base58(bytes: &[u8; 32]) -> String {
    bs58::encode(bytes).into_string()
}

// ── V1 message + wire builder (standard Ed25519) ─────────────────────────

/// Build a V1 message body for a SOL transfer (no PQC flag).
///
/// Wire layout (SIMD-0385, without V1_PREFIX):
///   [header 3B][config_mask 4B][blockhash 32B]
///   [num_ix 1B][num_addr 1B]
///   [addresses N*32B]
///   [config_values ...]
///   [ix_header 4B][ix_payload ...]
fn build_v1_transfer_body(
    sender: &[u8; 32],
    receiver: &[u8; 32],
    blockhash: &[u8; 32],
    lamports: u64,
) -> Vec<u8> {
    let mut ix_data = Vec::with_capacity(12);
    ix_data.extend_from_slice(&2u32.to_le_bytes()); // SystemInstruction::Transfer
    ix_data.extend_from_slice(&lamports.to_le_bytes());

    let ix_accounts: &[u8] = &[0, 1];

    let mut buf = Vec::with_capacity(256);

    // Header
    buf.push(1); // num_required_signatures
    buf.push(0); // num_readonly_signed_accounts
    buf.push(1); // num_readonly_unsigned_accounts

    // Config mask: bits 2 + 3 set (compute_unit_limit + loaded_accounts_data_size_limit)
    let config_mask: u32 = 0b0_1100;
    buf.extend_from_slice(&config_mask.to_le_bytes());

    // Blockhash
    buf.extend_from_slice(blockhash);

    // Counts
    buf.push(1); // num_instructions
    buf.push(3); // num_addresses

    // Addresses
    buf.extend_from_slice(sender);
    buf.extend_from_slice(receiver);
    buf.extend_from_slice(&SYSTEM_PROGRAM);

    // Config values for bits 2 and 3 (in bit order):
    //   bit 2: compute_unit_limit = 200_000
    //   bit 3: loaded_accounts_data_size_limit = 65_536
    buf.extend_from_slice(&200_000u32.to_le_bytes());
    buf.extend_from_slice(&65_536u32.to_le_bytes());

    // Instruction header
    buf.push(2); // program_id_index
    buf.push(ix_accounts.len() as u8);
    buf.extend_from_slice(&(ix_data.len() as u16).to_le_bytes());

    // Instruction payload
    buf.extend_from_slice(ix_accounts);
    buf.extend_from_slice(&ix_data);

    buf
}

/// Assemble V1 wire transaction with Ed25519 signature:
///   [V1_PREFIX][v1_body][signature 64B]
fn build_v1_wire(v1_body: &[u8], signature: &[u8; 64]) -> Vec<u8> {
    let mut wire = Vec::with_capacity(1 + v1_body.len() + 64);
    wire.push(V1_PREFIX);
    wire.extend_from_slice(v1_body);
    wire.extend_from_slice(signature);
    wire
}

// ── Main ─────────────────────────────────────────────────────────────────

fn main() -> Result<(), String> {
    println!("=== Ed25519 V1 Transaction Smoke Test ===\n");

    // 1. Generate Ed25519 keypair
    println!("Step 1: Generate Ed25519 keypair");
    let signing_key = SigningKey::generate(&mut OsRng);
    let verifying_key = signing_key.verifying_key();
    let pubkey_bytes: [u8; 32] = verifying_key.to_bytes();
    let address = pubkey_to_base58(&pubkey_bytes);
    println!("  Address: {address}");

    // 2. Generate receiver
    let recv_key = SigningKey::generate(&mut OsRng);
    let recv_pubkey: [u8; 32] = recv_key.verifying_key().to_bytes();
    let recv_address = pubkey_to_base58(&recv_pubkey);
    println!("  Receiver: {recv_address}");

    // 3. Airdrop
    println!("\nStep 2: Airdrop 5 SOL");
    let airdrop_sig = request_airdrop(&address, 5 * LAMPORTS_PER_SOL)?;
    println!("  Airdrop tx: {airdrop_sig}");
    println!("  Waiting for confirmation...");
    wait_for_confirmation(&airdrop_sig, 30)?;

    let balance = get_balance(&address)?;
    println!(
        "  Balance: {} SOL",
        balance as f64 / LAMPORTS_PER_SOL as f64
    );
    assert!(balance >= 5 * LAMPORTS_PER_SOL, "Airdrop failed");
    println!("  PASS: airdrop confirmed");

    // 4. Build V1 transfer
    println!("\nStep 3: Build V1 SOL transfer (1 SOL)");
    let (blockhash, _last_valid) = get_latest_blockhash()?;
    println!("  Blockhash: {}", bs58::encode(&blockhash).into_string());

    let v1_body = build_v1_transfer_body(&pubkey_bytes, &recv_pubkey, &blockhash, LAMPORTS_PER_SOL);
    println!("  V1 body: {} bytes", v1_body.len());

    // 5. Sign (Ed25519 signs the full message: V1_PREFIX + v1_body)
    let mut message_to_sign = Vec::with_capacity(1 + v1_body.len());
    message_to_sign.push(V1_PREFIX);
    message_to_sign.extend_from_slice(&v1_body);

    println!("\nStep 4: Sign with Ed25519");
    let signature = signing_key.sign(&message_to_sign);
    let sig_bytes: [u8; 64] = signature.to_bytes();
    println!("  Signature: {}...", hex::encode(&sig_bytes[..16]));

    // Local verify
    use ed25519_dalek::Verifier;
    verifying_key
        .verify(&message_to_sign, &signature)
        .map_err(|e| format!("Local verify failed: {e}"))?;
    println!("  Local verification: PASSED");

    // 6. Build wire and send
    let wire = build_v1_wire(&v1_body, &sig_bytes);
    println!("  Wire size: {} bytes", wire.len());

    let wire_b64 = BASE64.encode(&wire);
    println!("\nStep 5: Send V1 transaction via RPC");
    println!("  Base64 payload: {} chars", wire_b64.len());

    let tx_sig = send_raw_transaction(&wire_b64)?;
    println!("  RPC returned: {tx_sig}");

    println!("\nStep 6: Wait for confirmation");
    wait_for_confirmation(&tx_sig, 30)?;
    println!("  Transaction CONFIRMED!");

    // 7. Verify balances
    println!("\nStep 7: Verify balances");
    let sender_bal = get_balance(&address)?;
    let recv_bal = get_balance(&recv_address)?;
    println!(
        "  Sender:   {} SOL",
        sender_bal as f64 / LAMPORTS_PER_SOL as f64
    );
    println!(
        "  Receiver: {} SOL",
        recv_bal as f64 / LAMPORTS_PER_SOL as f64
    );

    assert!(
        recv_bal >= LAMPORTS_PER_SOL,
        "Receiver should have at least 1 SOL"
    );
    println!("  PASS: receiver has >= 1 SOL");

    assert!(
        sender_bal < 5 * LAMPORTS_PER_SOL,
        "Sender should have less than 5 SOL after transfer"
    );
    println!("  PASS: sender balance decreased");

    println!("\n=== All checks passed! Ed25519 V1 pipeline works correctly. ===");
    Ok(())
}
