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

module.exports = {
  resetWarp,
};
