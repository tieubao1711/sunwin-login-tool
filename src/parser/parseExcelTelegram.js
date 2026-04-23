const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

function cleanValue(value) {
  return String(value ?? '')
    .trim()
    .replace(/\r/g, '');
}

function readFirstColumnLines(filePath, sheetName) {
  const workbook = XLSX.readFile(filePath);
  const targetSheetName = sheetName || workbook.SheetNames[0];
  const sheet = workbook.Sheets[targetSheetName];

  if (!sheet) {
    throw new Error(`Không tìm thấy sheet: ${targetSheetName}`);
  }

  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: false,
    defval: ''
  });

  return rows
    .map((row) => cleanValue(row[0]))
    .filter((line) => line.length > 0);
}

function splitBlocks(lines) {
  const blocks = [];
  let current = [];

  for (const line of lines) {
    if (/^id:\s*\d+,?$/i.test(line)) {
      if (current.length) {
        blocks.push(current);
      }
      current = [line];
    } else {
      current.push(line);
    }
  }

  if (current.length) {
    blocks.push(current);
  }

  return blocks;
}

function extractQuotedValue(line, key) {
  const regex = new RegExp(`^${key}:\\s*"(.*)"\\s*,?$`, 'i');
  const match = line.match(regex);
  return match ? match[1] : '';
}

function extractRawValue(line, key) {
  const regex = new RegExp(`^${key}:\\s*(.*?)\\s*,?$`, 'i');
  const match = line.match(regex);
  return match ? match[1] : '';
}

function parseMainTextLine(line) {
  const result = {
    registerId: '',
    username: '',
    password: '',
    nickname: '',
    ip: ''
  };

  const registerId = line.match(/Id:\s*([^-]+?)(?=\s*-\s*Username:|$)/i);
  const username = line.match(/Username:\s*([^-]+?)(?=\s*-\s*Pass:|$)/i);
  const password = line.match(/Pass:\s*([^-]+?)(?=\s*-\s*NickName:|$)/i);
  const nickname = line.match(/NickName:\s*([^-]+?)(?=\s*-\s*ip:|$)/i);
  const ip = line.match(/ip:\s*(.+)$/i);

  if (registerId) result.registerId = registerId[1].trim();
  if (username) result.username = username[1].trim();
  if (password) result.password = password[1].trim();
  if (nickname) result.nickname = nickname[1].trim();
  if (ip) result.ip = ip[1].trim();

  return result;
}

function parseGateBalanceLine(line) {
  const result = {
    gate: '',
    balance: 0,
    finalBalance: 0
  };

  const gate = line.match(/gate:\s*([^-]+?)(?=\s*-\s*số dư:|$)/i);
  const balance = line.match(/số dư:\s*(\d+)/i);
  const finalBalance = line.match(/số dư kết:\s*(\d+)/i);

  if (gate) result.gate = gate[1].trim();
  if (balance) result.balance = Number(balance[1]);
  if (finalBalance) result.finalBalance = Number(finalBalance[1]);

  return result;
}

function parseBlock(block) {
  const item = {
    messageId: '',
    type: '',
    date: '',
    dateUnixTime: '',
    from: '',
    fromId: '',
    rawTextLines: [],
    registerId: '',
    username: '',
    password: '',
    nickname: '',
    ip: '',
    gate: '',
    balance: 0,
    finalBalance: 0
  };

  for (const line of block) {
    if (/^id:\s*/i.test(line)) {
      item.messageId = extractRawValue(line, 'id').replace(/,$/, '').trim();
      continue;
    }

    if (/^type:\s*/i.test(line) && !item.type) {
      item.type = extractQuotedValue(line, 'type');
      continue;
    }

    if (/^date:\s*/i.test(line)) {
      item.date = extractQuotedValue(line, 'date');
      continue;
    }

    if (/^date_unixtime:\s*/i.test(line)) {
      item.dateUnixTime = extractQuotedValue(line, 'date_unixtime');
      continue;
    }

    if (/^from:\s*/i.test(line)) {
      item.from = extractQuotedValue(line, 'from');
      continue;
    }

    if (/^from_id:\s*/i.test(line)) {
      item.fromId = extractQuotedValue(line, 'from_id');
      continue;
    }

    if (
      line.includes('Đăng ký - Id:') ||
      line.includes('Username:') ||
      line.includes('Pass:') ||
      line.includes('NickName:')
    ) {
      item.rawTextLines.push(line);

      const parsed = parseMainTextLine(line);
      item.registerId = parsed.registerId || item.registerId;
      item.username = parsed.username || item.username;
      item.password = parsed.password || item.password;
      item.nickname = parsed.nickname || item.nickname;
      item.ip = parsed.ip || item.ip;
      continue;
    }

    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(line.trim())) {
      item.rawTextLines.push(line);
      if (!item.ip) {
        item.ip = line.trim();
      }
      continue;
    }

    if (/gate:\s*/i.test(line) || /số dư:/i.test(line)) {
      item.rawTextLines.push(line);

      const parsed = parseGateBalanceLine(line);
      item.gate = parsed.gate || item.gate;
      item.balance = parsed.balance ?? item.balance;
      item.finalBalance = parsed.finalBalance ?? item.finalBalance;
    }
  }

  return item;
}

function parseExcelTelegram(filePath, sheetName) {
  const lines = readFirstColumnLines(filePath, sheetName);
  const blocks = splitBlocks(lines);
  return blocks.map(parseBlock).filter((item) => item.messageId);
}

function main() {
  const inputFile = path.resolve(__dirname, 'input.xlsx');
  const outputFile = path.resolve(__dirname, 'parsed-output.json');

  const data = parseExcelTelegram(inputFile);

  fs.writeFileSync(outputFile, JSON.stringify(data, null, 2), 'utf8');

  console.log(`Đã parse xong: ${data.length} bản ghi`);
  console.log(`Output: ${outputFile}`);
  console.log('Mẫu record đầu tiên:');
  console.log(data[0]);
}

main();