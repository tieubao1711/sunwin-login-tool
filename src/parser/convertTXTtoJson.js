const fs = require('fs');
const path = require('path');

function convertTxtToJson(inputFile, outputFile) {
  const content = fs.readFileSync(inputFile, 'utf8');

  const lines = content
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);

  const result = [];

  for (const line of lines) {
    const [username, password] = line.split('|');

    if (!username || !password) continue;

    result.push({
      username: username.trim(),
      password: password.trim(),
      nickname: '',
      ip: ''
    });
  }

  fs.writeFileSync(outputFile, JSON.stringify(result, null, 2), 'utf8');

  console.log(`DONE: ${result.length} accounts`);
  console.log(`Output: ${outputFile}`);
}

// ===== RUN =====
const input = path.resolve(__dirname, './../../data/output.txt');
const output = path.resolve(__dirname, './../../data/output.json');

convertTxtToJson(input, output);