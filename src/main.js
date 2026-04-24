const path = require('path');
const { connectMongo } = require('./db/mongoose');
const { ensureDir } = require('./utils/file');
const { startWebServer } = require('./web/server');
const { startAuthTelegramBot } = require('./services/telegramService');

async function openBrowser(url) {
  const { default: open } = await import('open');
  await open(url);
}

async function main() {
  const { io } = startWebServer(1711);
  global.io = io;
  startAuthTelegramBot();

  ensureDir(path.resolve(process.cwd(), 'output'));

  console.log('[1/2] Connecting MongoDB...');
  await connectMongo();

  console.log('[2/2] Opening dashboard...');
  await openBrowser('http://localhost:5173');
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