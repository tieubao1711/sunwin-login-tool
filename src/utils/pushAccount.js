const fs = require('fs');
const path = require('path');

const API_URL = 'http://103.82.135.143:3001/accounts';
const JSON_FILE = path.join(__dirname, '../../data/sun7k6.json');
const FILE_NAME = path.basename(JSON_FILE);

async function pushAccounts() {
  try {
    const raw = fs.readFileSync(JSON_FILE, 'utf8');
    const items = JSON.parse(raw);

    if (!Array.isArray(items)) {
      throw new Error('accounts.json phải là 1 mảng');
    }

    let success = 0;
    let failed = 0;

    for (const item of items) {
      const username = String(item.username || '').trim();
      const password = String(item.password || '').trim();

      if (!username || !password) {
        failed++;
        console.log('Bỏ qua record thiếu username/password:', item);
        continue;
      }

      try {
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fileName: FILE_NAME,
            username,
            password
          })
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          failed++;
          console.log(`Lỗi ${username}:`, data);
          continue;
        }

        success++;
        console.log(`OK ${username}`);
      } catch (err) {
        failed++;
        console.log(`Request fail ${username}:`, err.message);
      }
    }

    console.log('--- DONE ---');
    console.log('Success:', success);
    console.log('Failed:', failed);
  } catch (err) {
    console.error('Lỗi:', err.message);
  }
}

pushAccounts();