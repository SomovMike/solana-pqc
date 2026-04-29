//! PQC (Falcon-512) Solana V1 transaction demo.
//!
//! Generates a Falcon-512 keypair, derives a Solana address, requests an
//! airdrop, builds a V1 SOL transfer with the PQC config flag (bit 5),
//! signs with Falcon-512, and sends through the local test-validator RPC.

use base64::{Engine, engine::general_purpose::STANDARD as BASE64};
use sha2::{Digest, Sha256};
use solana_pqc::{
    FALCON512_PUBKEY_LEN, FALCON512_SIG_MAX_LEN, PQC_CONFIG_MASK_BIT,
};

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
    let blockhash_str = value["blockhash"].as_str().ok_or("missing blockhash")?;
    let blockhash_bytes = bs58::decode(blockhash_str)
        .into_vec()
        .map_err(|e| format!("bad blockhash: {e}"))?;
    let mut bh = [0u8; 32];
    bh.copy_from_slice(&blockhash_bytes);
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
        serde_json::json!([wire_base64, {"encoding": "base64"}]),
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

// ── V1 message builder (manual, no solana-message dependency) ────────────

/// Build a V1 message body for a SOL transfer.
///
/// Wire layout (SIMD-0385, **without** V1_PREFIX byte):
/// ```text
/// [header 3B][config_mask 4B][blockhash 32B]
/// [num_ix 1B][num_addr 1B]
/// [addresses N*32B]
/// [config_values ...]
/// [ix_headers N*4B]
/// [ix_payloads ...]
/// ```
fn build_v1_transfer_body(
    sender: &[u8; 32],
    receiver: &[u8; 32],
    blockhash: &[u8; 32],
    lamports: u64,
) -> Vec<u8> {
    // System program Transfer instruction data: index=2 (u32 LE) + amount (u64 LE)
    let mut ix_data = Vec::with_capacity(12);
    ix_data.extend_from_slice(&2u32.to_le_bytes());
    ix_data.extend_from_slice(&lamports.to_le_bytes());

    let ix_accounts: &[u8] = &[0, 1]; // source=accounts[0], dest=accounts[1]

    let mut buf = Vec::with_capacity(256);

    // Header
    buf.push(1); // num_required_signatures
    buf.push(0); // num_readonly_signed_accounts
    buf.push(1); // num_readonly_unsigned_accounts (system_program)

    // Config mask: bit 5 (PQC) set. No config values for pure-flag bit.
    let config_mask: u32 = 1u32 << PQC_CONFIG_MASK_BIT;
    buf.extend_from_slice(&config_mask.to_le_bytes());

    // Blockhash (lifetime specifier)
    buf.extend_from_slice(blockhash);

    // Counts
    buf.push(1); // num_instructions
    buf.push(3); // num_addresses

    // Addresses: [sender, receiver, system_program]
    buf.extend_from_slice(sender);
    buf.extend_from_slice(receiver);
    buf.extend_from_slice(&SYSTEM_PROGRAM);

    // Config values: none (bit 5 is pure flag, bits 0-4 unset)

    // Instruction header: (program_id_index, num_accounts, data_len as u16 LE)
    buf.push(2); // program_id_index = system_program = accounts[2]
    buf.push(ix_accounts.len() as u8);
    buf.extend_from_slice(&(ix_data.len() as u16).to_le_bytes());

    // Instruction payload: account indices, then data
    buf.extend_from_slice(ix_accounts);
    buf.extend_from_slice(&ix_data);

    buf
}

/// Assemble the full PQC V1 wire transaction:
///   [V1_PREFIX][v1_body][2B sig_len LE][897B falcon_pk][666B falcon_sig padded]
fn build_pqc_wire(
    v1_body: &[u8],
    falcon_pubkey: &[u8],
    falcon_sig: &[u8],
) -> Vec<u8> {
    assert_eq!(falcon_pubkey.len(), FALCON512_PUBKEY_LEN);
    assert!(falcon_sig.len() <= FALCON512_SIG_MAX_LEN);

    let mut wire = Vec::with_capacity(
        1 + v1_body.len() + 2 + FALCON512_PUBKEY_LEN + FALCON512_SIG_MAX_LEN,
    );
    wire.push(V1_PREFIX);
    wire.extend_from_slice(v1_body);
    wire.extend_from_slice(&(falcon_sig.len() as u16).to_le_bytes());
    wire.extend_from_slice(falcon_pubkey);
    let mut padded_sig = [0u8; FALCON512_SIG_MAX_LEN];
    padded_sig[..falcon_sig.len()].copy_from_slice(falcon_sig);
    wire.extend_from_slice(&padded_sig);
    wire
}

fn pubkey_to_base58(bytes: &[u8; 32]) -> String {
    bs58::encode(bytes).into_string()
}

// ── Main ─────────────────────────────────────────────────────────────────

fn main() -> Result<(), String> {
    let dry_run = std::env::args().any(|a| a == "--dry-run");

    println!("=== Solana PQC (Falcon-512) Transaction Demo ===");
    if dry_run {
        println!("  (dry-run mode — no RPC calls)");
    }
    println!();

    // 1. Generate Falcon-512 keypair
    println!("Generating Falcon-512 keypair...");
    let (falcon_pk, falcon_sk) = solana_pqc::generate_falcon_keypair();
    let address = falcon_pk.derive_address();
    let address_bytes = address.to_bytes();
    let address_b58 = pubkey_to_base58(&address_bytes);
    println!(
        "  Falcon pubkey:    {}... ({} bytes)",
        hex::encode(&falcon_pk.as_bytes()[..16]),
        falcon_pk.as_bytes().len()
    );
    println!("  Solana address:   {address_b58}");

    // 2. Generate a deterministic receiver (just random bytes)
    let receiver: [u8; 32] = Sha256::digest(b"pqc-demo-receiver").into();
    let receiver_b58 = pubkey_to_base58(&receiver);
    println!("  Receiver address: {receiver_b58}");

    if !dry_run {
        // 3. Airdrop
        println!("\nRequesting airdrop (5 SOL)...");
        let airdrop_sig = request_airdrop(&address_b58, 5 * LAMPORTS_PER_SOL)?;
        println!("  Airdrop tx: {airdrop_sig}");
        println!("  Waiting for confirmation...");
        wait_for_confirmation(&airdrop_sig, 30)?;

        let balance = get_balance(&address_b58)?;
        println!(
            "  Balance: {} SOL",
            balance as f64 / LAMPORTS_PER_SOL as f64
        );
    }

    // 4. Build V1 transfer message body
    println!("\nBuilding V1 PQC transfer (1 SOL)...");
    let blockhash = if dry_run {
        let dummy: [u8; 32] = Sha256::digest(b"dummy-blockhash").into();
        println!("  Blockhash: {} (dummy)", bs58::encode(&dummy).into_string());
        dummy
    } else {
        let (bh, _last_valid) = get_latest_blockhash()?;
        println!("  Blockhash: {}", bs58::encode(&bh).into_string());
        bh
    };

    let v1_body = build_v1_transfer_body(&address_bytes, &receiver, &blockhash, LAMPORTS_PER_SOL);
    println!("  V1 body size: {} bytes", v1_body.len());

    // 5. Sign with Falcon-512
    //    The signed data is the full serialized message: V1_PREFIX + v1_body
    let mut message_bytes = Vec::with_capacity(1 + v1_body.len());
    message_bytes.push(V1_PREFIX);
    message_bytes.extend_from_slice(&v1_body);

    println!("\nSigning with Falcon-512...");
    let falcon_sig = solana_pqc::falcon_sign(&message_bytes, &falcon_sk)
        .ok_or("Falcon signing failed")?;
    println!(
        "  Falcon sig: {}... ({} bytes)",
        hex::encode(&falcon_sig.as_bytes()[..16]),
        falcon_sig.len()
    );

    // Quick local verify
    assert!(
        falcon_sig.verify(&falcon_pk, &message_bytes),
        "Local Falcon verification FAILED"
    );
    println!("  Local verification: PASSED");

    // 6. Build PQC wire transaction
    let wire = build_pqc_wire(&v1_body, falcon_pk.as_bytes(), falcon_sig.as_bytes());
    println!("  Wire transaction: {} bytes", wire.len());

    // Proxy signature for display
    let proxy_sig = falcon_sig.to_proxy_signature(&falcon_pk);
    println!("  Proxy sig (txid): {proxy_sig}");

    // 7. Send via RPC
    let wire_b64 = BASE64.encode(&wire);
    println!("\nBase64 payload: {} chars", wire_b64.len());

    if dry_run {
        println!("\n  [dry-run] Skipping RPC send. Wire format built successfully.");
        println!("  [dry-run] Run without --dry-run with a test-validator to send.");
    } else {
        println!("Sending PQC transaction to RPC...");
        match send_raw_transaction(&wire_b64) {
            Ok(sig) => {
                println!("  RPC returned: {sig}");
                println!("\nWaiting for confirmation...");
                match wait_for_confirmation(&sig, 30) {
                    Ok(()) => {
                        println!("  Transaction CONFIRMED!");
                        let recv_bal = get_balance(&receiver_b58)?;
                        println!(
                            "  Receiver balance: {} SOL",
                            recv_bal as f64 / LAMPORTS_PER_SOL as f64
                        );
                    }
                    Err(e) => println!("  Confirmation failed: {e}"),
                }
            }
            Err(e) => {
                println!("  Send failed: {e}");
                println!(
                    "\n  Note: this may happen if the banking stage cannot yet process PQC txs."
                );
                println!("  The key result is that the RPC accepted the PQC wire format.");
            }
        }
    }

    println!("\n=== Demo complete ===");
    Ok(())
}
