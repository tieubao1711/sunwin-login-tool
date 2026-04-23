// const fs = require('fs');
// const path = require('path');
// const config = require('./config');
// const { connectMongo } = require('./db/mongoose');
// const { parseTxt } = require('./parser/parseTxt');
// const { parseTxt2 } = require('./parser/parseTxt2');
// const { readTextFile, ensureDir, writeJson } = require('./utils/file');
// const { runBulkLogin } = require('./services/workerService');
// const { nowIsoCompact } = require('./utils/time');

// async function main() {
//   if (!fs.existsSync(config.inputFile)) {
//     throw new Error(`Input file not found: ${config.inputFile}`);
//   }

//   ensureDir(path.resolve(process.cwd(), 'output'));

//   console.log('[1/4] Connecting MongoDB...');
//   await connectMongo();

//   console.log('[2/4] Reading input file...');
//   const rawText = readTextFile(config.inputFile);

//   console.log('[3/4] Parsing TXT...');
//   const accounts = parseTxt(rawText);

//   if (!accounts.length) {
//     throw new Error('No valid account found in input file');
//   }

//   const parsedFile = path.resolve(
//     process.cwd(),
//     'output',
//     `parsed-accounts-${nowIsoCompact()}.json`
//   );

//   writeJson(parsedFile, accounts);

//   console.log(`[Parse] Total accounts: ${accounts.length}`);
//   console.log(`[Parse] Saved parsed file: ${parsedFile}`);

//   console.log('[4/4] Running bulk login...');
//   const result = await runBulkLogin(accounts, config.inputFile);

//   console.log('--- DONE ---');
//   console.log(JSON.stringify(result.summary, null, 2));
// }

// main()
//   .then(() => {
//     process.exitCode = 0;
//   })
//   .catch((error) => {
//     console.error('[Fatal Error]', error.message);
//     console.error(error.stack || '');
//     process.exitCode = 1;
//   });