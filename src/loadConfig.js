import fs from 'fs';

async function loadConfig() {
    const rawConfig = fs.readFileSync("./config.json", "utf8");
    const parsedConfig = JSON.parse(rawConfig);

    let minBuySol = parsedConfig.minBuySol;
    let maxBuySol = parsedConfig.maxBuySol;
    let devBuySol = parsedConfig.devBuySol;

    minBuySol = parsedConfig.minBuySol.includes('.') ? parseFloat(parsedConfig.minBuySol) : parseInt(parsedConfig.minBuySol, 10);
    maxBuySol = parsedConfig.maxBuySol.includes('.') ? parseFloat(parsedConfig.maxBuySol) : parseInt(parsedConfig.maxBuySol, 10);
    devBuySol = parsedConfig.devBuySol.includes('.') ? parseFloat(parsedConfig.devBuySol) : parseInt(parsedConfig.devBuySol, 10);

    return {
        minBuySol,
        maxBuySol,
        devBuySol
    };
}

export default loadConfig;