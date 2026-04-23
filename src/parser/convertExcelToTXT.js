const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

function formatTime(dateStr) {
  if (!dateStr) return '[Unknown]';

  const d = new Date(dateStr);
  return `[${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()} ${d.toLocaleTimeString('en-US')}]`;
}

function extractField(text, regex) {
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}

function parseText(raw) {
  if (!raw) return null;

  const text = raw.replace(/\\n/g, '\n');

  const username =
    extractField(text, /Username:\s*(.+)/i) ||
    extractField(text, /Tên tài khoản:\s*(.+)/i);

  const password =
    extractField(text, /Pass:\s*(.+)/i) ||
    extractField(text, /Mật khẩu:\s*(.+)/i);

  const nickname = extractField(text, /NickName:\s*(.+)/i);

  const balanceMatch = text.match(/số dư:\s*(\d+)/i);
  const balance = balanceMatch ? Number(balanceMatch[1]) : 0;

  if (!username || !password) return null;

  return {
    username,
    password,
    nickname,
    balance
  };
}

function convertExcelToTxt(inputFile, outputFile) {
  const wb = XLSX.readFile(inputFile);
  const sheet = wb.Sheets[wb.SheetNames[0]];

  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: false
  });

  let currentDate = '';
  const results = [];

  for (const row of rows) {
    const line = String(row[0] || '').trim();

    if (!line) continue;

    // lấy date
    if (line.startsWith('date:')) {
      const match = line.match(/"(.*?)"/);
      if (match) currentDate = match[1];
      continue;
    }

    // lấy dòng text
    if (line.startsWith('text:')) {
      const match = line.match(/text:\s*"(.*)"/);
      if (!match) continue;

      const parsed = parseText(match[1]);
      if (!parsed) continue;

      const time = formatTime(currentDate);

      const block = [
        `${time} Santa: ---KHÁCH LOGIN SUNWIN---`,
        `Nickname --- ${parsed.nickname || '-'}`,
        `Username --- ${parsed.username}`,
        `Password --- ${parsed.password}`,
        `Số dư --- ${parsed.balance}`,
        ''
      ].join('\n');

      results.push(block);
    }
  }

  fs.writeFileSync(outputFile, results.join('\n'), 'utf8');

  console.log(`DONE: ${results.length} records`);
  console.log(`Output: ${outputFile}`);
}

// ===== RUN =====
const input = path.resolve(__dirname, './../../data/input.xlsx');
const output = path.resolve(__dirname, './../../data/output.txt');

convertExcelToTxt(input, output);