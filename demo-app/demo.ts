(globalThis as any).__NODEJS__ = true;
(globalThis as any).__BROWSER__ = false;

import {
    createSolanaRpc,
    createSolanaRpcSubscriptions,
    generateKeyPairSigner,
    lamports,
    createTransactionMessage,
    setTransactionMessageFeePayer,
    setTransactionMessageLifetimeUsingBlockhash,
    appendTransactionMessageInstruction,
    signTransactionMessageWithSigners,
    getSignatureFromTransaction,
    getComputeUnitEstimateForTransactionMessageFactory,
    sendAndConfirmTransactionFactory,
    createDefaultRpcTransport,
    getTransactionEncoder,
    getBase64EncodedWireTransaction,
    compileTransaction,
} from '@solana/kit';
import { setTransactionMessageConfig } from '../kit/packages/transaction-messages/src/v1-transaction-config';
import { getTransferSolInstruction } from '@solana-program/system';

async function main() {
    console.log("Starting demo...");
    const rpcUrl = "http://127.0.0.1:8899";
    const rpcWsUrl = "ws://127.0.0.1:8900";

    const rpc = createSolanaRpc(rpcUrl);
    const rpcSubscriptions = createSolanaRpcSubscriptions(rpcWsUrl);

    // Generate keys
    const sender = await generateKeyPairSigner();
    const receiver = await generateKeyPairSigner();

    console.log(`Sender address: ${sender.address}`);
    console.log(`Receiver address: ${receiver.address}`);

    // Request airdrop
    console.log("Requesting airdrop...");
    await rpc.requestAirdrop(sender.address, lamports(7_000_000_000n), {
        commitment: 'confirmed'
    }).send();

    // Sleep a bit to ensure airdrop lands
    await new Promise(resolve => setTimeout(resolve, 2000));

    const balance = await rpc.getBalance(sender.address).send();
    console.log(`Sender balance: ${balance.value} lamports`);

    // Create a transaction
    console.log("Creating transfer transaction...");
    const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

    const transferInstruction = getTransferSolInstruction({
        source: sender,
        destination: receiver.address,
        amount: lamports(4_000_000_000n),
    });

    const txMessage = createTransactionMessage({ version: 1 });
    let transactionMessage = setTransactionMessageConfig({
        computeUnitLimit: 200_000,
        loadedAccountsDataSizeLimit: 64 * 1024,
    }, txMessage);
    transactionMessage = setTransactionMessageFeePayer(sender.address, transactionMessage);
    transactionMessage = setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, transactionMessage);
    transactionMessage = appendTransactionMessageInstruction(transferInstruction, transactionMessage);

    console.log("Signing transaction...");
    const signedTx = await signTransactionMessageWithSigners(transactionMessage);
    const signature = getSignatureFromTransaction(signedTx);
    console.log(`Transaction signature: ${signature}`);

    // Debug: print hex of messageBytes and wire format
    const msgHex = Buffer.from(signedTx.messageBytes).toString('hex');
    console.log(`messageBytes (${signedTx.messageBytes.length} bytes): ${msgHex}`);

    const wireBase64 = getBase64EncodedWireTransaction(signedTx);
    const wireBuf = Buffer.from(wireBase64, 'base64');
    console.log(`wire tx (${wireBuf.length} bytes): ${wireBuf.toString('hex')}`);
    console.log(`first byte: 0x${wireBuf[0].toString(16)}`);

    console.log("Sending and confirming transaction...");
    const sendAndConfirm = sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions });
    await sendAndConfirm(signedTx, { commitment: 'confirmed' });

    console.log("Transaction confirmed!");
    const receiverBalance = await rpc.getBalance(receiver.address).send();
    console.log(`Receiver balance: ${receiverBalance.value} lamports`);
}

main().catch(console.error);
