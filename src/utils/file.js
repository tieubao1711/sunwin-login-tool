const fs = require('fs');
const path = require('path');

function readTextFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = {
  readTextFile,
  ensureDir,
  writeJson
};
