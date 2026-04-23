const mongoose = require('mongoose');

const importRunSchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    sourceFile: { type: String, required: true },
    startedAt: { type: Date, default: Date.now },
    finishedAt: { type: Date, default: null },
    durationMs: { type: Number, default: 0 },
    totalAccounts: { type: Number, default: 0 },
    successCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    highBalanceCount: { type: Number, default: 0 },
    threshold: { type: Number, default: 0 },
    notes: { type: String, default: '' },
    summary: { type: Object, default: {} }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ImportRun', importRunSchema);
