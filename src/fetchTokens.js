import { Connection } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import chalk from 'chalk';
import fs from 'fs';

async function fetchTokens(walletPubKey) {
    const configPath = './config.json';
    if (!fs.existsSync(configPath)) {
        console.error(chalk.red(`Config file ${configPath} does not exist.`));
        return [];
    }
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const rpc = config.RPC_URL;
    const ws = config.WS_URL;

    const connection = new Connection(rpc, {
        commitment: 'confirmed',
        wsEndpoint: ws
    });

    const filters = [
        {
            dataSize: 165,    //size of account (bytes)
        },
        {
            memcmp: {
                offset: 32,     //location of our query in the account (bytes)
                bytes: walletPubKey,  //our search criteria, a base58 encoded string
            },
        }
    ];

    const accounts = await connection.getParsedProgramAccounts(
        TOKEN_PROGRAM_ID,
        { filters: filters }
    );

    let tokenData = [];

    accounts.forEach((account) => {
        const parsedAccountInfo = account.account.data;
        const decimals = parsedAccountInfo["parsed"]["info"]["tokenAmount"]["decimals"];
        const mintAddress = parsedAccountInfo["parsed"]["info"]["mint"];
        const tokenBalance = parsedAccountInfo["parsed"]["info"]["tokenAmount"]["uiAmount"];

        if (decimals === 6 && tokenBalance > 0) {
            tokenData.push({
                CA: mintAddress,
                balance: tokenBalance
            });
        }
    });

    return tokenData;
}

export default fetchTokens;
