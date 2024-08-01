import { Keypair, Connection, PublicKey, Transaction, AddressLookupTableProgram, SystemProgram } from '@solana/web3.js';
import { searcherClient } from 'jito-ts/dist/sdk/block-engine/searcher.js';
import { Bundle } from 'jito-ts/dist/sdk/block-engine/types.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bs58 from 'bs58';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load config.json
const configPath = './config.json';
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

async function createAndExtendALT(connection, wallet, addresses) {
    const slot = await connection.getSlot();
    const [createLookupTableIx, lookupTableAddress] = AddressLookupTableProgram.createLookupTable({
        authority: wallet.publicKey,
        payer: wallet.publicKey,
        recentSlot: slot,
    });

    const extendLookupTableIx = AddressLookupTableProgram.extendLookupTable({
        payer: wallet.publicKey,
        authority: wallet.publicKey,
        lookupTable: lookupTableAddress,
        addresses: addresses.map(addr => new PublicKey(addr)),
    });

    const transaction = new Transaction().add(createLookupTableIx).add(extendLookupTableIx);
    transaction.recentBlockhash = (await connection.getRecentBlockhash('finalized')).blockhash;
    transaction.feePayer = wallet.publicKey;
    transaction.sign(wallet);

    // Jito setup
    const blockEngineURL = config.BLOCK_ENGINE_URL;
    const jitoTipAmount = parseFloat(config.JITO_TIP_AMOUNT) * 1e9; // Convert to lamports
    const jitoTipSecretKey = Uint8Array.from(bs58.decode(config.JITO_TIP_SECRET_KEY));
    const jitoTipKeypair = Keypair.fromSecretKey(jitoTipSecretKey);
    const jitoTipPK = new PublicKey(config.JITO_TIP_PK);
    
    // Create Jito tip transaction
    const tipTransaction = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: jitoTipPK,
            lamports: jitoTipAmount,
        })
    );
    tipTransaction.recentBlockhash = transaction.recentBlockhash;
    tipTransaction.feePayer = wallet.publicKey;
    tipTransaction.sign(wallet);

    const search = searcherClient(blockEngineURL);
    const bund = new Bundle([]);
    bund.addTransactions(transaction);
    bund.addTransactions(tipTransaction);

    try {
        const sentBundle = await search.sendBundle(bund);
        console.log(chalk.green('Created and Extended LUT with addresses successfully!'));
        console.log(chalk.green('Sent Bundle:'), sentBundle);
        console.log(chalk.green(`Confirm Bundle Manually (JITO): https://explorer.jito.wtf/bundle/${sentBundle}`));
        return lookupTableAddress;
    } catch (error) {
        console.error(chalk.red("Error occurred while sending the bundle:"), error);
        throw error;
    }
}

async function loadKeypairsFromDirectory(directoryPath) {
    const addresses = [];
    const files = fs.readdirSync(directoryPath)
        .filter(file => file.endsWith('.json'))
        .sort((a, b) => {
            const numA = parseInt(a.match(/\d+/)[0], 10);
            const numB = parseInt(b.match(/\d+/)[0], 10);
            return numA - numB;
        });
    for (const file of files) {
        const filePath = path.join(directoryPath, file);
        const keypairData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const keypair = Keypair.fromSecretKey(Uint8Array.from(keypairData));
        addresses.push(keypair.publicKey);
    }
    return addresses;
}

async function createALT() {
    const rpcUrl = config.RPC_URL;
    const connection = new Connection(rpcUrl, 'confirmed');
    const secretKeyPath = config.SECRET_KEY_PATH;
    const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync(secretKeyPath, 'utf8')));
    const wallet = Keypair.fromSecretKey(secretKey);

    // Load addresses from buyerWallets directory
    const buyerWalletsDir = config.WALLET_BUYERS_FOLDER;
    const buyerAddresses = await loadKeypairsFromDirectory(buyerWalletsDir);

    // Assuming you have additional addresses you want to add to the ALT
    const additionalAddresses = [
        new PublicKey('CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM'),
        new PublicKey('Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1'),
        new PublicKey('4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf'),
        new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'),
        new PublicKey('6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P'),
        new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'),
        new PublicKey('TSLvdd1pWpHVjahSpsvCXUbgwsL3JAcvokwaKt1eokM'),
        new PublicKey('SysvarRent111111111111111111111111111111111'),
        SystemProgram.programId        
    ];

    // Combine all addresses
    const allAddresses = [...buyerAddresses, ...additionalAddresses];

    const lookupTableAddress = await createAndExtendALT(connection, wallet, allAddresses);

    console.log(chalk.green('LUT Address:'), lookupTableAddress.toBase58());

    // Update the config file with the new lookup table address
    config.LOOKUP_TABLE_ADDRESS = lookupTableAddress.toBase58();
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(chalk.green('Updated config.json with new LOOKUP_TABLE_ADDRESS.'));
}

export default createALT;
