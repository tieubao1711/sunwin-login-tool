const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

function get(text, regex) {
  const m = text.match(regex);
  return m ? m[1].trim() : '';
}

function readAllCells(inputFile) {
  const wb = XLSX.readFile(inputFile);
  const sheet = wb.Sheets[wb.SheetNames[0]];

  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: false,
    defval: ''
  });

  return rows.flat().filter(Boolean).map(String);
}

function parseTextLine(line) {
  const m = line.match(/text:\s*"((?:[^"\\]|\\.)*)"/);
  if (!m) return null;

  const raw = m[1]
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"');

  const username =
    get(raw, /Tên tài khoản:\s*(.*?)(?:\n|$)/i) ||
    get(raw, /Username:\s*(.*?)\s*-\s*Pass:/i);

  const password =
    get(raw, /Mật khẩu:\s*(.*?)(?:\n|$)/i) ||
    get(raw, /Pass:\s*(.*?)\s*-\s*NickName:/i);

  const nickname = get(raw, /NickName:\s*(.*?)(?:\n|\s*-\s*ip:|$)/i);
  const gate = get(raw, /gate:\s*(.*?)\s*-/i);

  const balance = Number(get(raw, /số dư:\s*([\d,.]+)/i).replace(/[,.]/g, '') || 0);
  const safe = Number(get(raw, /số dư két:\s*([\d,.]+)/i).replace(/[,.]/g, '') || 0);

  if (!username || !password) return null;

  return {
    username,
    password,
    nickname,
    gate,
    balance,
    safe
  };
}

function convertXlsxToJson(inputFile, outputFile) {
  const cells = readAllCells(inputFile);

  const result = [];
  const seen = new Set();

  for (const cell of cells) {
    const parsed = parseTextLine(cell);
    if (!parsed) continue;

    const key = `${parsed.username}|${parsed.password}`;
    if (seen.has(key)) continue;

    seen.add(key);
    result.push(parsed);
  }

  fs.writeFileSync(outputFile, JSON.stringify(result, null, 2), 'utf8');

  console.log(`DONE: ${result.length} accounts`);
  console.log(`Output: ${outputFile}`);
}

const input = path.resolve(__dirname, './../../data/DT sunwin.xlsx');
const output = path.resolve(__dirname, './../../data/DT sunwin.json');

convertXlsxToJson(input, output);