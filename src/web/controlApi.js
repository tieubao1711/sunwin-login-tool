const express = require('express');
const router = express.Router();
const runManager = require('../services/runManager');

const ACCOUNT_API_BASE = 'http://103.82.135.143:3001';

function cleanFileNameInput(fileName) {
  return String(fileName || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
    .join(',');
}

async function fetchAccountsFromApi(fileName) {
  const query = new URLSearchParams();

  const cleanFileName = cleanFileNameInput(fileName);

  if (cleanFileName) {
    query.set('fileName', cleanFileName);
  }

  // full data của fileName đã nhập, không phải lấy tất cả file nếu có fileName
  query.set('all', 'true');

  const url = `${ACCOUNT_API_BASE}/accounts?${query.toString()}`;
  console.log('[Account API]', url);

  const res = await fetch(url);

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
    const { fileName = '' } = req.body;

    const cleanFileName = cleanFileNameInput(fileName);
    const accounts = await fetchAccountsFromApi(cleanFileName);

    return res.json({
      success: true,
      total: accounts.length,
      source: cleanFileName || 'all',
      preview: accounts.slice(0, 5).map((x) => ({
        _id: x._id,
        username: x.username,
        fileName: x.fileName
      }))
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.post('/run/start', async (req, res) => {
  try {
    const {
      fileName = '',
      startIndex = 1,
      endIndex,
      concurrency = 3,
      delayBetweenRequestsMs = 0,
      highBalanceThreshold = 100000,
      resetWarpEvery = 5
    } = req.body;

    const cleanFileName = cleanFileNameInput(fileName);
    const allAccounts = await fetchAccountsFromApi(cleanFileName);

    if (!allAccounts.length) {
      return res.status(400).json({
        message: 'Không tìm thấy account nào theo fileName đã nhập'
      });
    }

    const start = Math.max(1, Number(startIndex || 1));
    const end = endIndex
      ? Math.min(Number(endIndex), allAccounts.length)
      : allAccounts.length;

    if (start > end) {
      return res.status(400).json({
        message: 'Start index không được lớn hơn End index'
      });
    }

    const accounts = allAccounts.slice(start - 1, end);

    runManager
      .start({
        accounts,
        source: `${cleanFileName || 'all'} | range=${start}-${end}`,
        options: {
          concurrency,
          delayBetweenRequestsMs,
          highBalanceThreshold,
          resetWarpEvery
        }
      })
      .catch((err) => {
        console.error('[RunManager] Start error:', err.message);
      });

    return res.json({
      success: true,
      runId: runManager.getStatus().runId,
      total: accounts.length,
      loadedTotal: allAccounts.length,
      startIndex: start,
      endIndex: end,
      source: cleanFileName || 'all'
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