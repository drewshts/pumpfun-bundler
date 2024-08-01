import { Keypair } from '@solana/web3.js';
import fs from 'fs';
import path from 'path';
import bs58 from 'bs58'; 
import chalk from 'chalk';

async function backupWallets(dirPath, devWalletPath, walletsFilePath) {
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '');
    const backupDir = path.join('src', 'backupWallets', `dev&buyers_backup_${timestamp}`);
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const files = fs.readdirSync(dirPath).filter(file => file.endsWith('.json'));

    files.forEach(file => {
        const oldPath = path.join(dirPath, file);
        const newPath = path.join(backupDir, file);
        fs.renameSync(oldPath, newPath);
    });

    if (fs.existsSync(devWalletPath)) {
        const devWalletBackupPath = path.join(backupDir, path.basename(devWalletPath));
        fs.renameSync(devWalletPath, devWalletBackupPath);
        console.log(chalk.green('Dev wallet has been backed up successfully.'));
    }

    if (fs.existsSync(walletsFilePath)) {
        const walletsBackupPath = path.join(backupDir, path.basename(walletsFilePath));
        fs.renameSync(walletsFilePath, walletsBackupPath);
        console.log(chalk.green('Wallets.json has been backed up successfully.'));
    }

    console.log(chalk.green('All existing wallets have been backed up successfully.'));
}

async function genWallet(amount) {
    const configPath = './config.json';
    if (!fs.existsSync(configPath)) {
        console.error(chalk.red(`Config file ${configPath} does not exist.`));
        return;
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const buyersFolder = config.WALLET_BUYERS_FOLDER;
    const devWalletPath = config.SECRET_KEY_PATH;
    const walletsFilePath = path.join('./walletsList.json');

    // Check if amount exceeds 20
    if (amount > 20) {
        console.warn(chalk.yellow('Maximum amount of wallets is 20. Resetting amount to 20.'));
        amount = 20;
    }

    // Backup existing wallets and dev wallet
    await backupWallets(buyersFolder, devWalletPath, walletsFilePath);

    const walletsData = [];

    for (let i = 0; i < amount; i++) {
        const keyPair = Keypair.generate();
        const walletData = {
            [`Wallet ${i + 1}`]: {
                address: keyPair.publicKey.toBase58(),
                privateKey: bs58.encode(keyPair.secretKey)
            }
        };

        walletsData.push(walletData);

        // Save to keypairs directory
        fs.writeFileSync(path.join(buyersFolder, `wallet${i + 1}.json`), JSON.stringify(Array.from(keyPair.secretKey)));

        console.log(chalk.green(`Wallet ${i + 1} generated.`));
    }

    // Generate a new dev wallet
    const devWallet = Keypair.generate();
    const devWalletData = {
        'Dev Wallet': {
            address: devWallet.publicKey.toBase58(),
            privateKey: bs58.encode(devWallet.secretKey)
        }
    };

    walletsData.push(devWalletData);
    fs.writeFileSync(devWalletPath, JSON.stringify(Array.from(devWallet.secretKey)));
    console.log(chalk.green('Dev wallet generated.'));

    // Save all wallet data to wallets.json
    fs.writeFileSync(walletsFilePath, JSON.stringify(walletsData, null, 2));
    console.log(chalk.green('All wallets generated successfully.'));
}

export default genWallet;
