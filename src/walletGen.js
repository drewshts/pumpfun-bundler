function a20_0x4378(_0x4ed5d3,_0x26b596){const _0x4c13df=a20_0x4c13();return a20_0x4378=function(_0x437815,_0x2e69fd){_0x437815=_0x437815-0xfd;let _0x3bf2c7=_0x4c13df[_0x437815];return _0x3bf2c7;},a20_0x4378(_0x4ed5d3,_0x26b596);}function a20_0x4c13(){const _0x249bd7=['filter','createInterface','green','readdirSync','.json','./config.json','2prCWiy','from','writeFileSync','existsSync','question','basename','address','close','wallet','decode','Wallet\x20','stringify','689113vLaBpf','5532558mlhBqA','renameSync','11612196NalcPQ','readFileSync','Do\x20you\x20want\x20to\x20generate\x20a\x20new\x20sender\x20wallet?\x20(y/n):\x20','JITO_TIP_SECRET_KEY','SENDER','Tipper\x20Wallet\x20Address\x20','walletsList.json\x20has\x20been\x20backed\x20up\x20successfully.','4302384TBsxjv','join','86112QTblOO','mkdirSync','Sender\x20Wallet\x20Address\x20','src','212264ZfCdYA','dev&buyers_backup_','stdout','SECRET_KEY_PATH','7JoZhgu','backupWallets','secretKey','generate','Sender\x20Wallet','red','push','yellow','endsWith','toBase58','./walletsList.json','Maximum\x20amount\x20of\x20wallets\x20is\x2020.\x20Resetting\x20amount\x20to\x2020.','Using\x20existing\x20sender\x20wallet.','Dev,\x20Sender,\x20Tipper\x20wallets\x20generated.','trim','log','publicKey','parse','utf8','encode','5377645TgNnmc'];a20_0x4c13=function(){return _0x249bd7;};return a20_0x4c13();}(function(_0x53a16e,_0x360401){const _0x16c312=a20_0x4378,_0xa914c0=_0x53a16e();while(!![]){try{const _0x4f76af=parseInt(_0x16c312(0x12f))/0x1*(parseInt(_0x16c312(0x123))/0x2)+parseInt(_0x16c312(0xfe))/0x3+parseInt(_0x16c312(0x100))/0x4+-parseInt(_0x16c312(0x11c))/0x5+parseInt(_0x16c312(0x130))/0x6+parseInt(_0x16c312(0x108))/0x7*(parseInt(_0x16c312(0x104))/0x8)+-parseInt(_0x16c312(0x132))/0x9;if(_0x4f76af===_0x360401)break;else _0xa914c0['push'](_0xa914c0['shift']());}catch(_0x51befa){_0xa914c0['push'](_0xa914c0['shift']());}}}(a20_0x4c13,0xb1a46));import{Keypair}from'@solana/web3.js';import a20_0xa8051e from'./qrCodeGen.js';import a20_0x36e4a9 from'fs';import a20_0x234a77 from'path';import a20_0x501de1 from'bs58';import a20_0x2a31f1 from'chalk';import a20_0x141f30 from'readline';async function promptUser(_0x941b01){const _0x523b26=a20_0x4378,_0x262936=a20_0x141f30[_0x523b26(0x11e)]({'input':process['stdin'],'output':process[_0x523b26(0x106)]});return new Promise(_0x39373d=>{const _0x25eea5=_0x523b26;_0x262936[_0x25eea5(0x127)](_0x941b01,_0x33c68a=>{const _0x100bf7=_0x25eea5;_0x262936[_0x100bf7(0x12a)](),_0x39373d(_0x33c68a[_0x100bf7(0x116)]()['toLowerCase']());});});}async function backupWallets(_0x1949e1,_0x234145,_0x170578){const _0x589550=a20_0x4378,_0x2ebb6f=new Date()['toISOString']()['replace'](/[-:.]/g,''),_0x2fc240=a20_0x234a77[_0x589550(0xff)](_0x589550(0x103),_0x589550(0x109),_0x589550(0x105)+_0x2ebb6f);!a20_0x36e4a9[_0x589550(0x126)](_0x2fc240)&&a20_0x36e4a9[_0x589550(0x101)](_0x2fc240,{'recursive':!![]});const _0x1bb272=a20_0x36e4a9[_0x589550(0x120)](_0x1949e1)[_0x589550(0x11d)](_0x468741=>_0x468741[_0x589550(0x110)](_0x589550(0x121)));_0x1bb272['forEach'](_0x1d5816=>{const _0x1662d2=_0x589550,_0xd0ad92=a20_0x234a77[_0x1662d2(0xff)](_0x1949e1,_0x1d5816),_0x883311=a20_0x234a77[_0x1662d2(0xff)](_0x2fc240,_0x1d5816);a20_0x36e4a9[_0x1662d2(0x131)](_0xd0ad92,_0x883311);});if(a20_0x36e4a9[_0x589550(0x126)](_0x234145)){const _0x53f242=a20_0x234a77[_0x589550(0xff)](_0x2fc240,a20_0x234a77[_0x589550(0x128)](_0x234145));a20_0x36e4a9[_0x589550(0x131)](_0x234145,_0x53f242),console[_0x589550(0x117)](a20_0x2a31f1['green']('Dev\x20wallet\x20has\x20been\x20backed\x20up\x20successfully.'));}if(a20_0x36e4a9['existsSync'](_0x170578)){const _0x176e75=a20_0x234a77[_0x589550(0xff)](_0x2fc240,a20_0x234a77[_0x589550(0x128)](_0x170578));a20_0x36e4a9[_0x589550(0x131)](_0x170578,_0x176e75),console[_0x589550(0x117)](a20_0x2a31f1[_0x589550(0x11f)](_0x589550(0xfd)));}console[_0x589550(0x117)](a20_0x2a31f1[_0x589550(0x11f)]('All\x20existing\x20wallets\x20have\x20been\x20backed\x20up\x20successfully.'));}async function genWallet(_0x772bc8){const _0x218c82=a20_0x4378,_0x396fa3=_0x218c82(0x122);if(!a20_0x36e4a9[_0x218c82(0x126)](_0x396fa3)){console['error'](a20_0x2a31f1[_0x218c82(0x10d)]('Config\x20file\x20'+_0x396fa3+'\x20does\x20not\x20exist.'));return;}const _0xe58ab3=JSON[_0x218c82(0x119)](a20_0x36e4a9[_0x218c82(0x133)](_0x396fa3,_0x218c82(0x11a))),_0x2ad6e0=_0xe58ab3['WALLET_BUYERS_FOLDER'],_0x1c0a5d=_0xe58ab3[_0x218c82(0x107)],_0x5607a1=a20_0x234a77[_0x218c82(0xff)](_0x218c82(0x112));_0x772bc8>0x14&&(console['warn'](a20_0x2a31f1[_0x218c82(0x10f)](_0x218c82(0x113))),_0x772bc8=0x14);await backupWallets(_0x2ad6e0,_0x1c0a5d,_0x5607a1);const _0x5866a0=[];for(let _0x5474e3=0x0;_0x5474e3<_0x772bc8;_0x5474e3++){const _0x131853=Keypair['generate'](),_0xd62d22={[_0x218c82(0x12d)+(_0x5474e3+0x1)]:{'address':_0x131853[_0x218c82(0x118)][_0x218c82(0x111)](),'privateKey':a20_0x501de1[_0x218c82(0x11b)](_0x131853[_0x218c82(0x10a)])}};_0x5866a0[_0x218c82(0x10e)](_0xd62d22),a20_0x36e4a9[_0x218c82(0x125)](a20_0x234a77['join'](_0x2ad6e0,_0x218c82(0x12b)+(_0x5474e3+0x1)+'.json'),JSON[_0x218c82(0x12e)](Array[_0x218c82(0x124)](_0x131853['secretKey']))),console[_0x218c82(0x117)](a20_0x2a31f1['green'](_0x218c82(0x12d)+(_0x5474e3+0x1)+'\x20generated.'));}let _0x3a675b=!![];if(_0xe58ab3['SENDER']){const _0x25a5f9=await promptUser(_0x218c82(0x134));(_0x25a5f9==='n'||_0x25a5f9==='no')&&(_0x3a675b=![]);}const _0x541c41=Keypair[_0x218c82(0x10b)](),_0x5229cc={'Dev\x20Wallet':{'address':_0x541c41[_0x218c82(0x118)][_0x218c82(0x111)](),'privateKey':a20_0x501de1['encode'](_0x541c41['secretKey'])}};let _0x4d6696;if(_0x3a675b){const _0x5558e0=Keypair[_0x218c82(0x10b)]();_0x4d6696={'Sender\x20Wallet':{'address':_0x5558e0[_0x218c82(0x118)][_0x218c82(0x111)](),'privateKey':a20_0x501de1['encode'](_0x5558e0[_0x218c82(0x10a)])}},_0xe58ab3[_0x218c82(0x136)]=a20_0x501de1[_0x218c82(0x11b)](_0x5558e0[_0x218c82(0x10a)]),a20_0xa8051e(_0x4d6696[_0x218c82(0x10c)][_0x218c82(0x129)],_0x218c82(0x102)+_0x4d6696['Sender\x20Wallet'][_0x218c82(0x129)]);}else{console['log'](a20_0x2a31f1[_0x218c82(0x10f)](_0x218c82(0x114)));const _0x5426bb=Keypair['fromSecretKey'](new Uint8Array(a20_0x501de1[_0x218c82(0x12c)](_0xe58ab3[_0x218c82(0x136)])));_0x4d6696={'Sender\x20Wallet':{'address':_0x5426bb[_0x218c82(0x118)]['toBase58'](),'privateKey':_0xe58ab3[_0x218c82(0x136)]}};}const _0x5688c0=Keypair[_0x218c82(0x10b)](),_0x1204d6={'Tipper\x20Wallet':{'address':_0x5688c0[_0x218c82(0x118)]['toBase58'](),'privateKey':a20_0x501de1[_0x218c82(0x11b)](_0x5688c0[_0x218c82(0x10a)])}};_0x5866a0[_0x218c82(0x10e)](_0x5229cc),_0x5866a0[_0x218c82(0x10e)](_0x4d6696),_0x5866a0[_0x218c82(0x10e)](_0x1204d6),a20_0x36e4a9[_0x218c82(0x125)](_0x1c0a5d,JSON[_0x218c82(0x12e)](Array['from'](_0x541c41[_0x218c82(0x10a)]))),console[_0x218c82(0x117)](a20_0x2a31f1['green'](_0x218c82(0x115))),a20_0x36e4a9['writeFileSync'](_0x5607a1,JSON[_0x218c82(0x12e)](_0x5866a0,null,0x2)),console['log'](a20_0x2a31f1[_0x218c82(0x11f)]('All\x20wallets\x20generated\x20successfully.')),_0xe58ab3[_0x218c82(0x135)]=a20_0x501de1[_0x218c82(0x11b)](_0x5688c0[_0x218c82(0x10a)]),a20_0x36e4a9[_0x218c82(0x125)](_0x396fa3,JSON[_0x218c82(0x12e)](_0xe58ab3,null,0x2)),console[_0x218c82(0x117)](a20_0x2a31f1[_0x218c82(0x11f)]('Config\x20updated\x20with\x20sender\x20and\x20tipper\x20secret\x20keys.')),a20_0xa8051e(_0x5688c0['publicKey']['toBase58'](),_0x218c82(0x137)+_0x5688c0[_0x218c82(0x118)]['toBase58']());}export default genWallet;