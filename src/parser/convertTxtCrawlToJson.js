const fs = require('fs');

const INPUT_FILE = './data/sunmoon.txt';
const OUTPUT_FILE = './data/sunmoon.json';

function parseLine(line) {
  line = line.trim();

  if (!line) return null;

  // bỏ protocol/domain phía trước
  line = line
    .replace(/^https?:\/\/sun\.win\/:/i, '')
    .replace(/^sun\.win\/:/i, '')
    .replace(/^https?:\/\/www\.sun\.win\/:/i, '')
    .replace(/^www\.sun\.win\/:/i, '');

  const parts = line.split(':');

  // lấy username + password ở cuối
  if (parts.length < 2) return null;

  const username = parts[parts.length - 2]?.trim();
  const password = parts[parts.length - 1]?.trim();

  if (!username || !password) return null;

  return {
    username,
    password,
    displayName: '',
    status: 'SUCCESS',
    reason: ''
  };
}

function main() {
  const raw = fs.readFileSync(INPUT_FILE, 'utf8');

  const lines = raw
    .split(/\r?\n/)
    .map(x => x.trim())
    .filter(Boolean);

  const results = [];
  const seen = new Set();

  for (const line of lines) {
    const parsed = parseLine(line);

    if (!parsed) continue;

    const key = `${parsed.username}:${parsed.password}`;

    // xoá trùng
    if (seen.has(key)) continue;

    seen.add(key);

    results.push(parsed);
  }

  fs.writeFileSync(
    OUTPUT_FILE,
    JSON.stringify(results, null, 2),
    'utf8'
  );

  console.log(`Done: ${results.length} accounts`);
  console.log(`Saved: ${OUTPUT_FILE}`);
}

main();