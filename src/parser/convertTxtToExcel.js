// convert-hit-txt-to-xlsx.js
const fs = require('fs');
const XLSX = require('xlsx');

const inputFile = './data/hitnew.txt';
const outputFile = './data/hitnew.xlsx';
const defaultGate = 'hit';

const text = fs.readFileSync(inputFile, 'utf8');

const rows = text
  .split(/\r?\n/)
  .map(line => line.trim())
  .filter(Boolean)
  .map(line => {
    const [username, ...passParts] = line.split('|');
    return {
      username: (username || '').trim(),
      password: passParts.join('|').trim(),
      gate: defaultGate
    };
  })
  .filter(row => row.username && row.password);

const workbook = XLSX.utils.book_new();
const worksheet = XLSX.utils.json_to_sheet(rows, {
  header: ['username', 'password', 'gate']
});

XLSX.utils.book_append_sheet(workbook, worksheet, 'accounts');
XLSX.writeFile(workbook, outputFile);

console.log(`Done: ${rows.length} rows -> ${outputFile}`);