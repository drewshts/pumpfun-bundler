import { searcherClient } from 'jito-ts/dist/sdk/block-engine/searcher.js';
import chalk from 'chalk';
async function sendBundle(bundle, blockEngineURL) {
    // list of all blockengine URLs
    const blockEngineURLs = [
        "amsterdam.mainnet.block-engine.jito.wtf",
        "frankfurt.mainnet.block-engine.jito.wtf",
        "ny.mainnet.block-engine.jito.wtf",
        "tokyo.mainnet.block-engine.jito.wtf"
    ];

    // send the bundle first to the current blockengine URL
    const client = searcherClient(blockEngineURL);
    const bundleData = bundle
    let bundleID = await client.sendBundle(bundleData);

    // send the bundle to all other blockengine URLs
    const otherBlockEngineURLs = blockEngineURLs.filter(url => url !== blockEngineURL);
    for (const url of otherBlockEngineURLs) {
        const otherClient = searcherClient(url);
        bundleID = await otherClient.sendBundle(bundleData);
    }
    console.log(chalk.yellow('\nSell initiated!'));
    //console.log(`Bundle sent to all block engines. Bundle ID: ${bundleID}`);
    // return the bundle data
    return bundleID;
}

// Export the function
export default sendBundle;