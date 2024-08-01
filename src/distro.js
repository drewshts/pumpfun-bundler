import { PublicKey, Keypair, Connection, TransactionMessage, VersionedTransaction, SystemProgram } from '@solana/web3.js';
import { searcherClient } from 'jito-ts/dist/sdk/block-engine/searcher.js';
import { Bundle } from "jito-ts/dist/sdk/block-engine/types.js";
import fs from 'fs';
import path from 'path';
import bs58 from 'bs58';
import chalk from 'chalk';

async function loadConfig() {
    const configPath = './config.json';
    if (!fs.existsSync(configPath)) {
        console.error(chalk.red(`Config file ${configPath} does not exist.`));
        process.exit(1);
    }
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}

async function loadWallets() {
    const config = await loadConfig();
    const buyersFolder = config.WALLET_BUYERS_FOLDER;
    const wallets = [];
    for (let i = 1; i <= 20; i++) {
        const filePath = path.join(buyersFolder, `wallet${i}.json`);
        if (fs.existsSync(filePath)) {
            const walletSecretKey = Uint8Array.from(JSON.parse(fs.readFileSync(filePath, 'utf8')));
            const wallet = Keypair.fromSecretKey(walletSecretKey);
            wallets.push(wallet);
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

async function distro(amounts, devWalletAmount) {
    const config = await loadConfig();
    const rpc = config.RPC_URL;
    const ws = config.WS_URL;
    const blockEngineURL = config.BLOCK_ENGINE_URL;

    const connection = new Connection(rpc, {
        commitment: 'confirmed',
        wsEndpoint: ws
    });

    const wallets = await loadWallets();

    const senderSecretKey = Uint8Array.from(bs58.decode(config.SENDER));
    const senderKeypair = Keypair.fromSecretKey(senderSecretKey);
    const senderPublicKey = senderKeypair.publicKey;

    let devWalletSendAmount = devWalletAmount.includes('.') ? parseFloat(devWalletAmount) : parseInt(devWalletAmount, 10);
    devWalletSendAmount = devWalletSendAmount * 1e9;

    const totalAmountToSend = amounts.reduce((total, amount) => total + (parseFloat(amount) * 1e9), 0) + devWalletSendAmount;
    const additionalAmountForFees = 0.01 * 1e9;
    const requiredBalance = totalAmountToSend + additionalAmountForFees;

    const senderBalance = await connection.getBalance(senderPublicKey);
    if (senderBalance < requiredBalance) {
        console.error(chalk.red(`Insufficient balance. Required: ${requiredBalance / 1e9} SOL, Available: ${senderBalance / 1e9} SOL`));
        return;
    }

    const batches = [];
    let currentBatch = [];

    for (const wallet of wallets) {
        if (currentBatch.length < 10) {
            currentBatch.push(wallet);
        } else {
            batches.push(currentBatch);
            currentBatch = [wallet];
        }
    }

    if (currentBatch.length > 0) {
        batches.push(currentBatch);
    }

    const devWallet = await loadDevWallet(config.SECRET_KEY_PATH);
    const devWalletPublicKey = devWallet.publicKey;

    console.log(chalk.blueBright(`\nWallets to receive specified amounts of SOL\n`));
    wallets.forEach((wallet, index) => {
        console.log(chalk.green(`${wallet.publicKey.toBase58()}: ${amounts[index]} SOL`));
    });

    console.log(chalk.blueBright(`\nDev wallet to receive `) + chalk.redBright(`${devWalletAmount} SOL\n`));
    console.log(chalk.green(devWalletPublicKey.toBase58()));

    for (let i = 0; i < batches.length; i += 4) {
        const bundleBatches = batches.slice(i, i + 4);
        const transactions = [];

        for (const batch of bundleBatches) {
            const instructions = [];

            for (const wallet of batch) {
                const index = wallets.indexOf(wallet);
                const sendAmount = parseFloat(amounts[index]) * 1e9;
                const walletPublicKey = wallet.publicKey;
                const instruction = SystemProgram.transfer({
                    fromPubkey: senderPublicKey,
                    toPubkey: walletPublicKey,
                    lamports: sendAmount
                });

                instructions.push(instruction);
            }

            if (i === 0 && batch === batches[0]) {
                const devWalletInstruction = SystemProgram.transfer({
                    fromPubkey: senderPublicKey,
                    toPubkey: devWalletPublicKey,
                    lamports: devWalletSendAmount
                });
                instructions.push(devWalletInstruction);
            }

            const recentBlockhash = (await connection.getLatestBlockhash("finalized")).blockhash;

            const messageV0 = new TransactionMessage({
                payerKey: senderPublicKey,
                instructions: instructions,
                recentBlockhash: recentBlockhash
            }).compileToV0Message();

            const versionedTransaction = new VersionedTransaction(messageV0);
            versionedTransaction.sign([senderKeypair]);

            transactions.push(versionedTransaction);
        }

        const jitoTipAccount = new PublicKey("96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5");
        const jitoTip = Keypair.fromSecretKey(new Uint8Array(bs58.decode(config.JITO_TIP_SECRET_KEY)));
        const jitoTipAmount = config.JITO_TIP_AMOUNT;
        const jitoTipLamports = jitoTipAmount * 1e9;
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

        const search = searcherClient(blockEngineURL);
        const bund = new Bundle([]);
        transactions.forEach(tx => bund.addTransactions(tx));
        bund.addTransactions(tipTransaction);

        console.log("\nNumber of transactions in the bundle:", bund.transactions.length);
        const sentBundle = await search.sendBundle(bund);

        console.log("Sent Bundle: ", sentBundle);
        console.log(`Confirm Bundle Manually (JITO): https://explorer.jito.wtf/bundle/${sentBundle}`);
        console.log("\n");
    }
}

export default distro;
