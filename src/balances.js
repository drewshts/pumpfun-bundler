import { PublicKey, Connection, Keypair } from '@solana/web3.js';
import fetchTokens from './fetchTokens.js';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import bs58 from 'bs58';

async function loadWallets() {
    const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
    const buyersFolder = config.WALLET_BUYERS_FOLDER;
    const wallets = [];

    for (let i = 1; i <= 20; i++) {
        const filePath = path.join(buyersFolder, `wallet${i}.json`);
        if (fs.existsSync(filePath)) {
            const buyerSecretKey = Uint8Array.from(JSON.parse(fs.readFileSync(filePath, 'utf8')));
            const buyer = Keypair.fromSecretKey(buyerSecretKey);
            wallets.push({ pubKey: buyer.publicKey.toString(), label: `Wallet ${i}` });
        } else {
            console.warn(chalk.yellow(`File ${filePath} does not exist.`));
        }
    }

    // Load dev_wallet
    const devWalletPath = config.SECRET_KEY_PATH;
    if (fs.existsSync(devWalletPath)) {
        const devWalletSecretKey = Uint8Array.from(JSON.parse(fs.readFileSync(devWalletPath, 'utf8')));
        const devWallet = Keypair.fromSecretKey(devWalletSecretKey);
        wallets.push({ pubKey: devWallet.publicKey.toString(), label: 'Dev Wallet' });
    } else {
        console.warn(chalk.yellow(`Dev wallet file ${devWalletPath} does not exist.`));
    }

    return wallets;
}

async function loadWalletsWithTipper() {
    const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
    const buyersFolder = config.WALLET_BUYERS_FOLDER;
    const wallets = [];

    for (let i = 1; i <= 20; i++) {
        const filePath = path.join(buyersFolder, `wallet${i}.json`);
        if (fs.existsSync(filePath)) {
            const buyerSecretKey = Uint8Array.from(JSON.parse(fs.readFileSync(filePath, 'utf8')));
            const buyer = Keypair.fromSecretKey(buyerSecretKey);
            wallets.push({ pubKey: buyer.publicKey.toString(), label: `Wallet ${i}` });
        } else {
            console.warn(chalk.yellow(`File ${filePath} does not exist.`));
        }
    }

    // Load dev_wallet
    const devWalletPath = config.SECRET_KEY_PATH;
    if (fs.existsSync(devWalletPath)) {
        const devWalletSecretKey = Uint8Array.from(JSON.parse(fs.readFileSync(devWalletPath, 'utf8')));
        const devWallet = Keypair.fromSecretKey(devWalletSecretKey);
        wallets.push({ pubKey: devWallet.publicKey.toString(), label: 'Dev Wallet' });
    } else {
        console.warn(chalk.yellow(`Dev wallet file ${devWalletPath} does not exist.`));
    }

    // Load sender wallet
    const senderSecretKey = Uint8Array.from(bs58.decode(config.SENDER));
    const senderWallet = Keypair.fromSecretKey(senderSecretKey);
    wallets.push({ pubKey: senderWallet.publicKey.toString(), label: 'Sender Wallet' });

    // Load sender wallet
    const jitoTipper = Uint8Array.from(bs58.decode(config.JITO_TIP_SECRET_KEY));
    const jitoTipperWallet = Keypair.fromSecretKey(jitoTipper);
    wallets.push({ pubKey: jitoTipperWallet.publicKey.toString(), label: 'Jito Tipper Wallet' });

    return wallets;
}

async function checkBalancesDetailed() {
    const configPath = './config.json';
    if (!fs.existsSync(configPath)) {
        console.error(chalk.red(`Config file ${configPath} does not exist.`));
        return;
    }
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const rpc = config.RPC_URL;
    const ws = config.WS_URL;

    const connection = new Connection(rpc, {
        commitment: 'confirmed',
        wsEndpoint: ws
    });

    const wallets = await loadWalletsWithTipper();

    let totalBalance = 0;

    for (let i = 0; i < wallets.length; i++) {
        const wallet = wallets[i];
        const walletPublicKey = new PublicKey(wallet.pubKey);

        const balance = await connection.getBalance(walletPublicKey);
        console.log(`${wallet.label} ${wallet.pubKey} has ${balance / 1e9} SOL`);

        totalBalance += (balance / 1e9);

        // Fetch SPL token balances
        const tokenCAs = await fetchTokens(wallet.pubKey);
        if (tokenCAs.length === 0) {
            console.log(chalk.red("No SPL tokens found for this wallet.\n"));
        } else {
            console.log(`Tokens for ${wallet.label}:`);
            const tokenTable = tokenCAs.map((tokenCA, index) => ({
                Mint: tokenCA.CA,
                Balance: tokenCA.balance
            }));
            console.table(tokenTable);
        }
    }
    console.log(chalk.greenBright(`Total Balance: ${totalBalance.toFixed(4)} SOL`));
    //console.log(chalk.redBright("BALANCES MAY TAKE A FEW SECONDS TO LOAD, RERUN IF THEY DO NOT SHOW UP OR CHECK JITO TXS"));
}

async function checkBalances() {
	console.log(chalk.greenBright(`Fetching Balances ⌛️`));
    const configPath = './config.json';
    if (!fs.existsSync(configPath)) {
        console.error(chalk.red(`Config file ${configPath} does not exist.`));
        return 0; // Return 0 balance if config file is missing
    }
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const rpc = config.RPC_URL;
    const ws = config.WS_URL;

    const connection = new Connection(rpc, {
        commitment: 'confirmed',
        wsEndpoint: ws
    });

    const wallets = await loadWallets();

    let totalBalance = 0;

    for (let i = 0; i < wallets.length; i++) {
        const wallet = wallets[i];
        const walletPublicKey = new PublicKey(wallet.pubKey);

        const balance = await connection.getBalance(walletPublicKey);
        totalBalance += (balance / 1e9);
    }

    return totalBalance.toFixed(4); // Return the total balance
}

export { checkBalancesDetailed, checkBalances };