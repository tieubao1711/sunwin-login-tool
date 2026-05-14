const { execSync } = require('child_process');

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function resetWarp() {
  try {
    console.log('🔄 Đang reset WARP...');
    execSync('warp-cli disconnect');
    await delay(1000);
    execSync('warp-cli connect');
    await delay(1000);
    console.log('✅ WARP đã được reset xong.');
  } catch (err) {
    console.log(`⚠️ Lỗi khi reset WARP: ${err.message}`);
  }
}

async function waitForWarpReady({
  retries = 10,
  delayMs = 1000,
  testUrl = 'https://api.ipify.org?format=json'
} = {}) {
  for (let i = 1; i <= retries; i++) {
    try {
      const res = await fetch(testUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(8000)
      });

      if (res.ok) {
        const text = await res.text();
        console.log(`[WARP] Network ready after ${i}/${retries}: ${text}`);
        return true;
      }
    } catch (err) {
      console.log(`[WARP] Network not ready ${i}/${retries}: ${err.message}`);
    }

    await new Promise((r) => setTimeout(r, delayMs));
  }

  console.log('[WARP] Network still not ready, continue anyway');
  return false;
}

module.exports = {
  resetWarp,
  waitForWarpReady
};
