import { PublicKey, Keypair, Connection, Transaction, TransactionMessage, VersionedTransaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { createAssociatedTokenAccountInstruction, getAssociatedTokenAddress, createTransferInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { searcherClient } from 'jito-ts/dist/sdk/block-engine/searcher.js';
import { Bundle } from "jito-ts/dist/sdk/block-engine/types.js";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bs58 from 'bs58';
import chalk from 'chalk';

// Define __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Utility function to sleep for a given number of milliseconds
async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to get or create an associated token account
async function getOrCreateAssociatedTokenAccount(connection, payer, mint, owner) {
    const associatedTokenAddress = await getAssociatedTokenAddress(mint, owner);

    try {
        const accountInfo = await connection.getAccountInfo(associatedTokenAddress);
        if (accountInfo) {
            return associatedTokenAddress;
        }
    } catch (error) {
        console.log('Account does not exist. Creating a new one.');
    }

    const createAccountInstruction = createAssociatedTokenAccountInstruction(
        payer.publicKey, associatedTokenAddress, owner, mint
    );

    const transaction = new Transaction().add(createAccountInstruction);
    await sendAndConfirmTransaction(connection, transaction, [payer], { skipPreflight: false, preflightCommitment: 'confirmed' });

    return associatedTokenAddress;
}

async function consoSPLT(mintAddress) {
    // Load configuration from config.json
    const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
    const { RPC_URL: rpc, WS_URL: ws, BLOCK_ENGINE_URL: blockEngineURL, JITO_TIP_SECRET_KEY, JITO_TIP_AMOUNT, SECRET_KEY_PATH, WALLET_BUYERS_FOLDER, DELAY = 200 } = config;

    const jitoTip = Keypair.fromSecretKey(new Uint8Array(bs58.decode(JITO_TIP_SECRET_KEY)));
    const jitoTipLamports = JITO_TIP_AMOUNT * 1e9;
    const mintPublicKey = new PublicKey(mintAddress);
    const receiverKeypair = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(SECRET_KEY_PATH, 'utf8'))));
    const receiverPublicKey = receiverKeypair.publicKey;

    // Load buyer keypairs
    const buyerFiles = fs.readdirSync(WALLET_BUYERS_FOLDER)
        .filter(file => file.endsWith('.json'))
        .sort((a, b) => parseInt(a.match(/\d+/)[0], 10) - parseInt(b.match(/\d+/)[0], 10));
    
    const keypairs = buyerFiles.map(file => Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(path.join(WALLET_BUYERS_FOLDER, file), 'utf8')))));

    const connection = new Connection(rpc, {
        commitment: 'confirmed',
        wsEndpoint: ws
    });

    // Ensure receiver has an associated token account
    let receiverATA;
    try {
        receiverATA = await getOrCreateAssociatedTokenAccount(
            connection,
            receiverKeypair,
            mintPublicKey,
            receiverPublicKey
        );
        console.log(chalk.green(`Receiver ATA: ${receiverATA.toBase58()}`));
    } catch (error) {
        console.error(chalk.red(`Failed to get or create receiver's ATA: ${error.message}`));
        return;
    }

    const maxInstructionsPerTransaction = 6;  // Max number of instructions per transaction to avoid size limits
    const transactionsPerBundle = 4;  // Number of versioned transactions per bundle

    // Process keypairs in parallel
    const transactions = await Promise.all(keypairs.map(async keypair => {
        try {
            const owner = keypair.publicKey;

            let walletBalance = await connection.getBalance(owner);
            let solBalance = walletBalance / 1e9;

            if (solBalance <= 0.001) {
                console.log(chalk.red(`Wallet SOL balance too low for wallet ${owner.toString()}, skipping.`));
                return null;
            }

            const tokenAccount = await connection.getTokenAccountsByOwner(owner, { mint: mintPublicKey });
            if (tokenAccount.value.length === 0) {
                console.log(chalk.red(`No token account found for wallet ${owner.toString()}, skipping.\n`));
                return null;
            }
            const tokenAccountPubkey = tokenAccount.value[0].pubkey;

            let sendAmount = await connection.getTokenAccountBalance(tokenAccountPubkey);
            let sendAmountLamports = sendAmount.value.amount;
            sendAmount = sendAmount.value.uiAmount;

            if (sendAmount <= 0) {
                console.log(chalk.red(`Token balance too low (empty) for wallet ${owner.toString()}, skipping.\n`));
                return null;
            }

            // Create the send instruction
            const instruction = createTransferInstruction(
                tokenAccountPubkey,
                receiverATA,
                owner,
                sendAmountLamports,
                [],
                TOKEN_PROGRAM_ID
            );

            return { instruction, keypair, owner };
        } catch (error) {
            console.error(`Error processing wallet ${keypair.publicKey.toString()}:`, error);
            return null;
        }
    }));

    // Filter out null results
    const validTransactions = transactions.filter(tx => tx !== null);

    if (validTransactions.length === 0) {
        console.log(chalk.yellow("No valid transactions to process."));
        return;
    }

    // Creating bundles of 4 versioned transactions
    for (let i = 0; i < validTransactions.length; i += transactionsPerBundle * maxInstructionsPerTransaction) {
        const bundleTransactions = validTransactions.slice(i, i + transactionsPerBundle * maxInstructionsPerTransaction);

        const bundles = [];
        for (let j = 0; j < bundleTransactions.length; j += maxInstructionsPerTransaction) {
            const batch = bundleTransactions.slice(j, j + maxInstructionsPerTransaction);

            const instructions = batch.map(t => t.instruction);
            const signers = batch.map(t => t.keypair);
            const recentBlockhash = (await connection.getLatestBlockhash("finalized")).blockhash;

            const messageV0 = new TransactionMessage({
                payerKey: receiverPublicKey,  // Change here to use receiverPublicKey as payer
                instructions: instructions,
                recentBlockhash: recentBlockhash
            }).compileToV0Message();

            const versionedTransaction = new VersionedTransaction(messageV0);
            versionedTransaction.sign([receiverKeypair, ...signers]);  // Change here to use receiverKeypair as signer

            bundles.push(versionedTransaction);
        }

        // Jito setup
        const search = searcherClient(blockEngineURL);
        const jitoTipAccounts = [
            '96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5',
            'HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe',
            'Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY',
            'ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49',
            'DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh',
            'ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt',
            'DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL',
            '3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT'
        ];

        const pickAccount = Math.floor(Math.random() * jitoTipAccounts.length);
        const jitoTipAccount = new PublicKey(jitoTipAccounts[pickAccount]);

        const jitoBlockhash = (await connection.getLatestBlockhash("finalized")).blockhash;

        const bund = new Bundle([]);
        bundles.forEach(tx => bund.addTransactions(tx));
        bund.addTipTx(jitoTip, jitoTipLamports, jitoTipAccount, jitoBlockhash);

        console.log("Number of transactions in the bundle:", bund.transactions.length);

        try {
            const sentBundle = await search.sendBundle(bund);
            console.log(`Bundle ${Math.floor(i / (transactionsPerBundle * maxInstructionsPerTransaction)) + 1}:`, `Confirm Bundle Manually (JITO): https://explorer.jito.wtf/bundle/${sentBundle}`);
        } catch (error) {
            console.error("Error occurred while sending SPL tokens:", error);
        }

        // Add delay between bundles to avoid rate limit
        if (i + transactionsPerBundle * maxInstructionsPerTransaction < validTransactions.length) {
            console.log(`Sleeping for ${DELAY} ms before sending next bundle...`);
            await sleep(DELAY);
        }
    }
}

export default consoSPLT;
