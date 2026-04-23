const ImportRun = require('../models/ImportRun');

async function createImportRun(payload) {
  return ImportRun.create(payload);
}

async function finishImportRun(id, payload) {
  return ImportRun.findByIdAndUpdate(id, payload, { new: true });
}

module.exports = {
  createImportRun,
  finishImportRun
};
