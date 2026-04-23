const fs = require('fs');
const path = require('path');

const INPUT = path.join(__dirname, 'output.txt');
const OUTPUT = path.join(__dirname, 'output.json');

function parseBlock(block) {
  const clean = block.replace(/\r/g, '');

  let username = '';
  let password = '';
  let nickname = '';

  const usernamePassSameLine = clean.match(
    /Username\s*---\s*(.*?)\s*-\s*Pass:\s*(.*?)(?:\s*-\s*NickName:|\s*-\s*ip:|\n|$)/i
  );

  if (usernamePassSameLine) {
    username = usernamePassSameLine[1].trim();
    password = usernamePassSameLine[2].trim();
  } else {
    const usernameOnly = clean.match(/Username\s*---\s*(.*?)(?:\n|$)/i);
    const passwordOnly = clean.match(/Password\s*---\s*(.*?)(?:\n|$)/i);

    if (usernameOnly) username = usernameOnly[1].trim();
    if (passwordOnly) password = passwordOnly[1].trim();
  }

  const nicknameMatch = clean.match(/Nickname\s*---\s*(.*?)(?:\s*-\s*ip:|\n|$)/i);
  if (nicknameMatch) nickname = nicknameMatch[1].trim();

  if (!username || !password) return null;

  return {
    nickname,
    username,
    password
  };
}

function main() {
  const raw = fs.readFileSync(INPUT, 'utf8');

  const blocks = raw
    .split(/\[\d{1,2}\/\d{1,2}\/\d{4}.*?\]\s*Santa:\s*---KHÁCH LOGIN SUNWIN---/i)
    .map(s => s.trim())
    .filter(Boolean);

  const results = [];

  for (const block of blocks) {
    const parsed = parseBlock(block);
    if (parsed) results.push(parsed);
  }

  fs.writeFileSync(OUTPUT, JSON.stringify(results, null, 2), 'utf8');

  console.log('Parsed:', results.length);
}

main();