const fs = require('fs');
const path = require('path');
const config = require('./config');
const { connectMongo } = require('./db/mongoose');
const { ensureDir, writeJson } = require('./utils/file');
const { runBulkLogin } = require('./services/workerService');
const { nowIsoCompact } = require('./utils/time');
const { startWebServer } = require('./web/server');

// mở browser (ESM fix)
async function openBrowser(url) {
  const { default: open } = await import('open');
  await open(url);
}

async function fetchAccountsFromApi() {
  const res = await fetch(config.accountApiUrl + '/accounts?all=true');

  if (!res.ok) {
    throw new Error(`Fetch API failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();

  if (!Array.isArray(data.items)) {
    throw new Error('API response must be an array');
  }

  return data.items
    .map((item) => ({
      _id: item._id,
      fileName: item.fileName || '',
      username: String(item.username || '').trim(),
      password: String(item.password || '').trim()
    }))
    .filter((item) => item.username && item.password);
}

async function main() {
  // 🔥 START WEB + SOCKET
  const { io } = startWebServer(3001);
  global.io = io;

  // mở browser
  await openBrowser('http://localhost:5173/dashboard');

  ensureDir(path.resolve(process.cwd(), 'output'));

  console.log('[1/4] Connecting MongoDB...');
  await connectMongo();

  console.log('[2/4] Fetching accounts from API...');
  const accounts = await fetchAccountsFromApi();

  if (!accounts.length) {
    throw new Error('No valid account found from API');
  }

  const parsedFile = path.resolve(
    process.cwd(),
    'output',
    `accounts-from-api-${nowIsoCompact()}.json`
  );

  writeJson(parsedFile, accounts);

  console.log(`[Fetch] Total accounts: ${accounts.length}`);
  console.log(`[Fetch] Saved file: ${parsedFile}`);

  console.log('[3/4] Running bulk login...');
  const result = await runBulkLogin(accounts, config.accountApiUrl);

  console.log('--- DONE ---');
  console.log(JSON.stringify(result.summary, null, 2));
}

main()
  .then(() => {
    process.exitCode = 0;
  })
  .catch((error) => {
    console.error('[Fatal Error]', error.message);
    console.error(error.stack || '');
    process.exitCode = 1;
  });