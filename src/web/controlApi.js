const express = require('express');
const router = express.Router();
const runManager = require('../services/runManager');

async function fetchAccountsFromApi(accountApiUrl) {
  const res = await fetch(`${accountApiUrl}/accounts?all=true`);

  if (!res.ok) {
    throw new Error(`Fetch API failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();

  if (!Array.isArray(data.items)) {
    throw new Error('API response must contain items array');
  }

  return data.items
    .map((item) => ({
      _id: item._id,
      fileName: item.fileName || '',
      username: String(item.username || '').trim(),
      password: String(item.password || '').trim()
    }))
    .filter((item) => item.username && item.password);
}

router.post('/run/load', async (req, res) => {
  try {
    const { accountApiUrl } = req.body;

    if (!accountApiUrl) {
      return res.status(400).json({ message: 'Thiếu accountApiUrl' });
    }

    const accounts = await fetchAccountsFromApi(accountApiUrl);

    return res.json({
      success: true,
      total: accounts.length,
      source: accountApiUrl,
      preview: accounts.slice(0, 5).map((x) => ({
        _id: x._id,
        username: x.username
      }))
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.post('/run/start', async (req, res) => {
  try {
    const {
      accountApiUrl,
      concurrency = 3,
      delayBetweenRequestsMs = 0,
      highBalanceThreshold = 100000
    } = req.body;

    if (!accountApiUrl) {
      return res.status(400).json({ message: 'Thiếu accountApiUrl' });
    }

    const accounts = await fetchAccountsFromApi(accountApiUrl);

    runManager.start({
      accounts,
      source: accountApiUrl,
      options: {
        concurrency,
        delayBetweenRequestsMs,
        highBalanceThreshold
      }
    }).catch((err) => {
      console.error('[RunManager] Start error:', err.message);
    });

    return res.json({
      success: true,
      total: accounts.length
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.post('/run/pause', (req, res) => {
  res.json({ success: true, status: runManager.pause() });
});

router.post('/run/resume', (req, res) => {
  res.json({ success: true, status: runManager.resume() });
});

router.post('/run/stop', (req, res) => {
  res.json({ success: true, status: runManager.stop() });
});

router.get('/run/current', (req, res) => {
  res.json(runManager.getStatus());
});

module.exports = router;