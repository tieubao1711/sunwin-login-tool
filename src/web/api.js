const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();

const LoginResult = require('../models/LoginResult');
const ImportRun = require('../models/ImportRun');

// lấy run mới nhất
router.get('/runs/latest', async (req, res) => {
  try {
    const run = await ImportRun.findOne()
      .sort({ startedAt: -1, createdAt: -1 })
      .lean();

    res.json(run || null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// lấy danh sách runs
router.get('/runs', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 20), 100);

    const items = await ImportRun.find()
      .sort({ startedAt: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({ items });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// lấy chi tiết 1 run
router.get('/runs/:runId', async (req, res) => {
  try {
    const run = await ImportRun.findById(req.params.runId).lean();

    if (!run) {
      return res.status(404).json({ message: 'Run not found' });
    }

    res.json(run);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// lấy results của run
router.get('/runs/:runId/results', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 200), 2000);
    const search = String(req.query.search || '').trim();
    const status = String(req.query.status || '').trim();

    const hasTransaction = req.query.hasTransaction === 'true';
    const hasDeposit = req.query.hasDeposit === 'true';

    const query = {
      runId: new mongoose.Types.ObjectId(req.params.runId)
    };

    if (status && ['SUCCESS', 'FAILED'].includes(status)) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { fullname: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }

    const historyFilters = [];
    if (hasTransaction) {
      historyFilters.push({ transactionCount: { $gt: 0 } });
    }
    if (hasDeposit) {
      historyFilters.push({ slipCount: { $gt: 0 } });
    }

    if (historyFilters.length === 1) {
      Object.assign(query, historyFilters[0]);
    } else if (historyFilters.length > 1) {
      query.$and = query.$and || [];
      query.$and.push({ $or: historyFilters });
    }

    const items = await LoginResult.find(query)
      .sort({ balance: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({ items });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// stats của run
router.get('/runs/:runId/stats', async (req, res) => {
  try {
    const runId = req.params.runId;

    const [successCount, failedCount, highBalanceCount] = await Promise.all([
      LoginResult.countDocuments({ runId, status: 'SUCCESS' }),
      LoginResult.countDocuments({ runId, status: 'FAILED' }),
      LoginResult.countDocuments({
        runId,
        status: 'SUCCESS',
        balance: { $gt: 100000 }
      })
    ]);

    res.json({
      successCount,
      failedCount,
      highBalanceCount
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/results/:resultId', async (req, res) => {
  try {
    const item = await LoginResult.findById(req.params.resultId).lean();

    if (!item) {
      return res.status(404).json({ message: 'Result not found' });
    }

    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;