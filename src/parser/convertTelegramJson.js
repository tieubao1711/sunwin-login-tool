const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

function flattenText(text) {
  if (Array.isArray(text)) {
    return text
      .map(item => {
        if (typeof item === 'string') return item;
        if (item && typeof item.text === 'string') return item.text;
        return '';
      })
      .join('');
  }

  return String(text || '');
}

function getField(text, regex) {
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}

function parseMessage(msg) {
  const raw = flattenText(msg.text);

  if (!raw.includes('KHÁCH LOGIN SUNWIN')) return null;

  const isFailed = raw.includes('THẤT BẠI');

  const username = getField(raw, /Username\s*---\s*(.*?)(?:\n|$)/i);
  const password = getField(raw, /Password\s*---\s*(.*?)(?:\n|$)/i);
  const displayName = getField(raw, /Nickname\s*---\s*(.*?)(?:\n|$)/i);
  const reason = getField(raw, /Lý do\s*---\s*(.*?)(?:\n|$)/i);
  const balance = Number(getField(raw, /Số dư\s*---\s*(\d+)/i) || 0);

  if (!username || !password) return null;

  return {
    username,
    password,
    displayName: displayName || '',
    balance,
    reason: reason || '',
    time: msg.date || '',
    messageId: msg.id || ''
  };
}

function autosize(sheet, rows) {
  const headers = Object.keys(rows[0] || {});
  sheet['!cols'] = headers.map(header => {
    const maxLength = Math.max(
      header.length,
      ...rows.map(row => String(row[header] || '').length)
    );

    return {
      wch: Math.min(Math.max(maxLength + 2, 12), 45)
    };
  });
}

function exportTelegramJsonToExcel(inputFile, outputFile) {
  const raw = fs.readFileSync(inputFile, 'utf8');
  const data = JSON.parse(raw);

  const successRows = [];
  const failedRows = [];

  const seen = new Set();

  for (const msg of data.messages || []) {
    const parsed = parseMessage(msg);
    if (!parsed) continue;

    const status = flattenText(msg.text).includes('THẤT BẠI') ? 'FAILED' : 'SUCCESS';
    const key = `${parsed.username}|${parsed.password}|${status}`;

    if (seen.has(key)) continue;
    seen.add(key);

    if (status === 'SUCCESS') {
      successRows.push({
        username: parsed.username,
        password: parsed.password,
        displayName: parsed.displayName,
        balance: parsed.balance,
        time: parsed.time,
        messageId: parsed.messageId
      });
    } else {
      failedRows.push({
        username: parsed.username,
        password: parsed.password,
        reason: parsed.reason,
        time: parsed.time,
        messageId: parsed.messageId
      });
    }
  }

  const wb = XLSX.utils.book_new();

  const successSheet = XLSX.utils.json_to_sheet(successRows);
  const failedSheet = XLSX.utils.json_to_sheet(failedRows);

  autosize(successSheet, successRows);
  autosize(failedSheet, failedRows);

  XLSX.utils.book_append_sheet(wb, successSheet, 'SUCCESS');
  XLSX.utils.book_append_sheet(wb, failedSheet, 'FAILED');

  XLSX.writeFile(wb, outputFile);

  console.log(`DONE`);
  console.log(`SUCCESS: ${successRows.length}`);
  console.log(`FAILED: ${failedRows.length}`);
  console.log(`Output: ${outputFile}`);
}

// RUN
const input = path.resolve(__dirname, './../../data/sunvina.json');
const output = path.resolve(__dirname, './../../data/sunvina-result.xlsx');

exportTelegramJsonToExcel(input, output);