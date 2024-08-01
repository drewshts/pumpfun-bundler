import { PublicKey, Keypair, Connection, TransactionMessage, VersionedTransaction, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { searcherClient } from 'jito-ts/dist/sdk/block-engine/searcher.js';
import { Bundle } from "jito-ts/dist/sdk/block-engine/types.js";
import fs from 'fs';
import bs58 from 'bs58';
import chalk from 'chalk';

import { getBondingCurve } from './getKeys.js';
import GPA from './pumpDecode.js';
import sendBundle from './sendBundle.js';

async function createSellTXWithTip(mint, bondingCurve, aBondingCurve, pump, wallet, sellAmountLamports, tokenAccountPubKey, virtualSolReserves, virtualTokenReserves) {
    const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
    const rpc = config.RPC_URL;
    const ws = config.WS_URL;
    const jitoTipAmount = config.JITO_TIP_AMOUNT;
    const jitoTipLamports = jitoTipAmount * 1e9;

    const connection = new Connection(rpc, {
        commitment: 'confirmed',
        wsEndpoint: ws
    });

    const pubkey = wallet.publicKey;
    const secret = wallet.secretKey;
    const owner = new PublicKey(pubkey.toString());

    const payer = Keypair.fromSecretKey(secret);

    const SYSTEM_PROGRAM_ID = "11111111111111111111111111111111";
    const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
    const global = new PublicKey("4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf");
    const feeRecipient = new PublicKey("CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM");

    const account1 = global;
    const account2 = feeRecipient; // Writeable
    const account3 = mint;
    const account4 = bondingCurve; // Writeable
    const account5 = aBondingCurve; // Writeable
    const account6 = new PublicKey(tokenAccountPubKey); // Writeable
    const account7 = owner; // Writeable & Signer & Fee Payer
    const account8 = new PublicKey(SYSTEM_PROGRAM_ID); // Program
    const account9 = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"); // Program
    const account10 = new PublicKey(TOKEN_PROGRAM_ID);
    const account11 = new PublicKey("Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1");
    const account12 = new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P"); // Program

    const pricePer = (virtualSolReserves / virtualTokenReserves) / 1e9;

    let slippage = 1 - 0.5;

    let minSolOutput = parseFloat(sellAmountLamports / 1e9 * pricePer);
    minSolOutput = Math.floor(minSolOutput * slippage * 1e9);

    const sell = BigInt("12502976635542562355");
    const amount = BigInt(sellAmountLamports);
    const min_sol_output = BigInt(minSolOutput);

    const integers = [sell, amount, min_sol_output];

    const binary_segments = integers.map(integer => {
        const buffer = Buffer.alloc(8);
        buffer.writeBigUInt64LE(integer);
        return buffer;
    });

    const transactionBuffer = Buffer.concat(binary_segments);

    const swapOut = new TransactionInstruction({
        programId: pump,
        keys: [
            { pubkey: account1, isSigner: false, isWritable: false },
            { pubkey: account2, isSigner: false, isWritable: true },
            { pubkey: account3, isSigner: false, isWritable: false },
            { pubkey: account4, isSigner: false, isWritable: true },
            { pubkey: account5, isSigner: false, isWritable: true },
            { pubkey: account6, isSigner: false, isWritable: true },
            { pubkey: account7, isSigner: true, isWritable: true },
            { pubkey: account8, isSigner: false, isWritable: false },
            { pubkey: account9, isSigner: false, isWritable: false },
            { pubkey: account10, isSigner: false, isWritable: false },
            { pubkey: account11, isSigner: false, isWritable: false },
            { pubkey: account12, isSigner: false, isWritable: false }
        ],
        data: transactionBuffer
    });

    const payerKey = payer.publicKey instanceof PublicKey ? payer.publicKey : new PublicKey(payer.publicKey);
    const jitoTipAccounts = [
        '96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5', 'HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe', 'Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY',
        'ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49', 'DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh', 'ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt',
        'DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL', '3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT'
    ];

    let pickAccount = Math.floor(Math.random() * jitoTipAccounts.length);
    let jitoTipAccount = jitoTipAccounts[pickAccount];

    const tipAccount = new PublicKey(jitoTipAccount);

    const blockhashObj = await connection.getLatestBlockhash('finalized');
    const recentBlockhash = blockhashObj.blockhash;

    const tipIX = SystemProgram.transfer({
        fromPubkey: payer.publicKey,
        toPubkey: tipAccount,
        lamports: jitoTipLamports
    });

    // Create TransactionMessage
    const messageV0 = new TransactionMessage({
        payerKey: payerKey,
        instructions: [swapOut, tipIX],
        recentBlockhash: recentBlockhash
    }).compileToV0Message();

    // Create VersionedTransaction
    const fullTX = new VersionedTransaction(messageV0);
    fullTX.sign([payer]);

    // Return TransactionMessage and VersionedTransaction
    return { instructions: [swapOut, tipIX], payer };
}

async function singleSell(ca) {
    const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

    const rpc = config.RPC_URL;
    const ws = config.WS_URL;
    const blockEngineURL = config.BLOCK_ENGINE_URL;
   
    const connection = new Connection(rpc, {
        commitment: 'confirmed',
        wsEndpoint: ws
    });

    const PUMP_PUBLIC_KEY = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";
    const pump = new PublicKey(PUMP_PUBLIC_KEY);
    const pumpProgramId = new PublicKey(PUMP_PUBLIC_KEY);
    const mintPubKey = new PublicKey(ca);

    const bondingCurvePda = getBondingCurve(mintPubKey, pumpProgramId);
    const bondingCurveAta = getAssociatedTokenAddressSync(mintPubKey, bondingCurvePda, true);

    const bCurve = bs58.encode(bondingCurvePda.toBuffer());
    const aCurve = bs58.encode(bondingCurveAta.toBuffer());

    const reserveData = await GPA(bCurve);

    const virtualSolReserves = reserveData.vSolReserve;
    const virtualTokenReserves = reserveData.vTokenReserve;

    const secretKeyPath = config.SECRET_KEY_PATH;
    const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync(secretKeyPath, 'utf8')));
    const wallet = Keypair.fromSecretKey(secretKey);

    const owner = wallet.publicKey;
    let walletBalance = await connection.getBalance(owner);

    if (walletBalance <= 0) {
        console.log(chalk.red("Wallet SOL balance too low, skipping."));
        return;
    }

    const tokenAccount = await connection.getTokenAccountsByOwner(owner, { mint: new PublicKey(ca) });

    if (tokenAccount.value.length === 0) {
        console.log(chalk.red("Token balance too low (empty), skipping.\n"));
        return;
    }

    const tokenAccountPubKey = tokenAccount.value[0].pubkey.toBase58();

    let sellAmount = await connection.getTokenAccountBalance(new PublicKey(tokenAccountPubKey));
    let sellAmountLamports = sellAmount.value.amount;
    sellAmount = sellAmount.value.uiAmount;

    if (sellAmount <= 0) {
        console.log(chalk.red("Token balance too low (empty), skipping.\n"));
        return;
    }

    const mint = new PublicKey(ca);
    const bondingCurve = new PublicKey(bCurve);
    const aBondingCurve = new PublicKey(aCurve);

    const sellIX = await createSellTXWithTip(mint, bondingCurve, aBondingCurve, pump, wallet, sellAmountLamports, tokenAccountPubKey, virtualSolReserves, virtualTokenReserves);

    const messageV0 = new TransactionMessage({
        payerKey: sellIX.payer.publicKey,
        instructions: sellIX.instructions,
        recentBlockhash: (await connection.getLatestBlockhash()).blockhash
    }).compileToV0Message([]);

    const fullTX = new VersionedTransaction(messageV0);
    fullTX.sign([sellIX.payer]);

    const bund = new Bundle([]);
    bund.addTransactions(fullTX);

    try {
        const sentBundle = await sendBundle(bund, blockEngineURL);
        console.log(`Confirm Bundle Manually (JITO): https://explorer.jito.wtf/bundle/${sentBundle}`);
        
    } catch (e) {
        if (e.message.includes("bundle contains an already processed transaction")) {
            console.log(chalk.green("Bundle Landed! Confirm Bundle Manually (JITO): https://explorer.jito.wtf/bundle/${sentBundle}"));
            return;
        }
        console.error(chalk.red("Error sending bundle:"), e);
    }
}

export default singleSell;
