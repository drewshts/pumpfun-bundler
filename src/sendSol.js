import { Connection, PublicKey, Keypair, TransactionMessage, VersionedTransaction, SystemProgram } from '@solana/web3.js';
import { searcherClient } from 'jito-ts/dist/sdk/block-engine/searcher.js';
import { Bundle } from "jito-ts/dist/sdk/block-engine/types.js";
import bs58 from 'bs58';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

async function loadWallets() {
    const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
    const buyersFolder = config.WALLET_BUYERS_FOLDER;
    const wallets = [];

    for (let i = 1; i <= 20; i++) {
        const filePath = path.join(buyersFolder, `wallet${i}.json`);
        if (fs.existsSync(filePath)) {
            const buyerSecretKey = Uint8Array.from(JSON.parse(fs.readFileSync(filePath, 'utf8')));
            const buyer = Keypair.fromSecretKey(buyerSecretKey);
            wallets.push({ pubKey: buyer.publicKey.toString(), privKey: bs58.encode(buyer.secretKey) });
        } else {
            console.warn(chalk.yellow(`File ${filePath} does not exist.`));
        }
    }

    return wallets;
}

async function loadDevWallet(secretKeyPath) {
    if (fs.existsSync(secretKeyPath)) {
        const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync(secretKeyPath, 'utf8')));
        return Keypair.fromSecretKey(secretKey);
    } else {
        console.error(chalk.red(`Secret key file ${secretKeyPath} does not exist.`));
        process.exit(1);
    }
}

async function refund(receiver) {
    const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
    const rpc = config.RPC_URL;
    const ws = config.WS_URL;
    const blockEngineURL = config.BLOCK_ENGINE_URL;
    const jitoTip = Keypair.fromSecretKey(new Uint8Array(bs58.decode(config.JITO_TIP_SECRET_KEY)));
    const jitoTipAmount = config.JITO_TIP_AMOUNT;
    const jitoTipLamports = jitoTipAmount * 1e9;
    const sender = Keypair.fromSecretKey(new Uint8Array(bs58.decode(config.SENDER)));

    const connection = new Connection(rpc, {
        commitment: 'confirmed',
        wsEndpoint: ws
    });

    const wallets = await loadWallets();
    const devWallet = await loadDevWallet(config.SECRET_KEY_PATH);
    const devWalletBalance = await fetchBal({ pubKey: devWallet.publicKey.toString(), privKey: bs58.encode(devWallet.secretKey) }, connection);

    const batches = [];
    let currentBatch = [];

    for (const wallet of wallets) {
        const balance = await fetchBal(wallet, connection);
        if ((balance / 1e9) > 0) {
            if (currentBatch.length < 8) {
                currentBatch.push(wallet);
            } else {
                batches.push(currentBatch);
                currentBatch = [wallet];
            }
        } else {
            console.log(`Skipping ${wallet.pubKey} as balance is 0.`);
        }
    }

    if (currentBatch.length > 0) {
        batches.push(currentBatch);
    }

    for (let i = 0; i < batches.length; i += 4) {
        const bundleBatches = batches.slice(i, i + 4);
        const transactions = [];

        for (const batch of bundleBatches) {
            const instructions = [];
            const signers = [];

            for (const wallet of batch) {
                const balance = await fetchBal(wallet, connection);
                const refundTo = new PublicKey(receiver);
                const lamportsToSend = balance; // Subtract a small amount to cover fees

                const refund = SystemProgram.transfer({
                    fromPubkey: new PublicKey(wallet.pubKey),
                    toPubkey: refundTo,
                    lamports: lamportsToSend
                });

                instructions.push(refund);
                signers.push(Keypair.fromSecretKey(bs58.decode(wallet.privKey)));
            }

            const recentBlockhash = (await connection.getLatestBlockhash("finalized")).blockhash;

            // Compile transaction to a message with devWallet as payer
            const messageV0 = new TransactionMessage({
                payerKey: sender.publicKey,
                instructions: instructions,
                recentBlockhash: recentBlockhash
            }).compileToV0Message();

            // Compile to versioned transaction
            const versionedTransaction = new VersionedTransaction(messageV0);

            // Sign the transaction with each wallet's private key and devWallet
            versionedTransaction.sign([...signers, sender]);

            transactions.push(versionedTransaction);
        }

        // Jito tip transaction
        const jitoTipAccount = new PublicKey("96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5");
        const tipInstruction = SystemProgram.transfer({
            fromPubkey: jitoTip.publicKey,
            toPubkey: jitoTipAccount,
            lamports: jitoTipLamports
        });

        const tipMessageV0 = new TransactionMessage({
            payerKey: jitoTip.publicKey,
            instructions: [tipInstruction],
            recentBlockhash: (await connection.getLatestBlockhash("finalized")).blockhash
        }).compileToV0Message();

        const tipTransaction = new VersionedTransaction(tipMessageV0);
        tipTransaction.sign([jitoTip]);

        // Refund transaction from dev wallet
        const devWalletRefundTo = new PublicKey(receiver);
        const devWalletLamportsToSend = devWalletBalance; // Subtract a small amount to cover fees
        const devWalletRefundInstruction = SystemProgram.transfer({
            fromPubkey: devWallet.publicKey,
            toPubkey: devWalletRefundTo,
            lamports: devWalletLamportsToSend
        });

        const devWalletRefundMessageV0 = new TransactionMessage({
            payerKey: sender.publicKey,
            instructions: [devWalletRefundInstruction],
            recentBlockhash: (await connection.getLatestBlockhash("finalized")).blockhash
        }).compileToV0Message();

        const devWalletRefundTransaction = new VersionedTransaction(devWalletRefundMessageV0);
        devWalletRefundTransaction.sign([devWallet, sender]);

        const search = searcherClient(blockEngineURL);
        const bund = new Bundle([]);
        transactions.forEach(tx => bund.addTransactions(tx));
        bund.addTransactions(tipTransaction);
        bund.addTransactions(devWalletRefundTransaction);

        console.log("Number of transactions in the bundle:", bund.transactions.length);
        const sentBundle = await search.sendBundle(bund);

        console.log("Sent Bundle: ", sentBundle);
        console.log(`Confirm Bundle Manually (JITO): https://explorer.jito.wtf/bundle/${sentBundle}`);
        console.log("\n");
    }
}

async function fetchBal(wallet, connection) {
    try {
        const balance = await connection.getBalance(new PublicKey(wallet.pubKey));
        return balance;
    } catch (error) {
        console.error(`Error fetching balance for wallet ${wallet.pubKey}:`, error);
        return fetchBal(wallet, connection);
    }
}

export default refund;
