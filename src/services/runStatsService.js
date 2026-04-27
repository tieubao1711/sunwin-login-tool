const ImportRun = require('../models/ImportRun');
const LoginResult = require('../models/LoginResult');

const ACCOUNT_API_BASE = 'http://103.82.135.143:3001';

function toNumber(v) {
  const n = Number(v || 0);
  return Number.isFinite(n) ? n : 0;
}

function buildKey(username, password) {
  return `${String(username || '').trim()}|||${String(password || '').trim()}`;
}

function get(obj, path, fallback = undefined) {
  try {
    return path.split('.').reduce((acc, key) => acc?.[key], obj) ?? fallback;
  } catch {
    return fallback;
  }
}

function normalizeEpochMs(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n) || n <= 0) return 0;

  return String(Math.trunc(n)).length <= 10 ? n * 1000 : n;
}

function getDayKey(value) {
  const ms = normalizeEpochMs(value);
  if (!ms) return '';

  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return '';

  return d.toISOString().slice(0, 10);
}

function ensureDay(map, date) {
  if (!date) return null;

  if (!map[date]) {
    map[date] = {
      date,
      depositCount: 0,
      withdrawCount: 0,
      totalDeposit: 0,
      totalWithdraw: 0
    };
  }

  return map[date];
}

function sortByNewest(items = []) {
  return [...items].sort((a, b) => {
    const ta = normalizeEpochMs(a.responseTime || a.requestTime || a.createdTime || 0);
    const tb = normalizeEpochMs(b.responseTime || b.requestTime || b.createdTime || 0);
    return tb - ta;
  });
}

function extractPaymentItems(rawResponse) {
  const depositItems = get(rawResponse, 'data.slipHistory.deposit.data.items', []);
  const withdrawItems = get(rawResponse, 'data.slipHistory.withdraw.data.items', []);

  return {
    deposits: sortByNewest(Array.isArray(depositItems) ? depositItems : []),
    withdraws: sortByNewest(Array.isArray(withdrawItems) ? withdrawItems : [])
  };
}

function summarizePayment(rawResponse, recentLimit = 0) {
  const { deposits, withdraws } = extractPaymentItems(rawResponse);

  const pickedDeposits = recentLimit > 0 ? deposits.slice(0, recentLimit) : deposits;
  const pickedWithdraws = recentLimit > 0 ? withdraws.slice(0, recentLimit) : withdraws;

  return {
    depositCount: pickedDeposits.length,
    withdrawCount: pickedWithdraws.length,
    totalDeposit: pickedDeposits.reduce((sum, item) => sum + toNumber(item.amount), 0),
    totalWithdraw: pickedWithdraws.reduce((sum, item) => sum + toNumber(item.amount), 0)
  };
}

function applyPaymentByDate(stat, rawResponse) {
  const { deposits, withdraws } = extractPaymentItems(rawResponse);

  for (const item of deposits) {
    const date = getDayKey(item.responseTime || item.requestTime || item.createdTime);
    const row = ensureDay(stat.paymentByDateMap, date);
    if (!row) continue;

    row.depositCount += 1;
    row.totalDeposit += toNumber(item.amount);
  }

  for (const item of withdraws) {
    const date = getDayKey(item.responseTime || item.requestTime || item.createdTime);
    const row = ensureDay(stat.paymentByDateMap, date);
    if (!row) continue;

    row.withdrawCount += 1;
    row.totalWithdraw += toNumber(item.amount);
  }
}

function finalizePaymentByDate(stat) {
  stat.paymentByDate = Object.values(stat.paymentByDateMap || {})
    .sort((a, b) => b.date.localeCompare(a.date));

  delete stat.paymentByDateMap;
}

function extractBetRange(rawResponse) {
  const items = get(rawResponse, 'data.transactions.data.items', []);
  const timestamps = (Array.isArray(items) ? items : [])
    .map((x) => normalizeEpochMs(x.createdTime))
    .filter((x) => x > 0);

  if (!timestamps.length) return { min: 0, max: 0 };

  return {
    min: Math.min(...timestamps),
    max: Math.max(...timestamps)
  };
}

function extractPaymentRange(rawResponse) {
  const { deposits, withdraws } = extractPaymentItems(rawResponse);

  const timestamps = [...deposits, ...withdraws]
    .map((x) => normalizeEpochMs(x.responseTime || x.requestTime))
    .filter((x) => x > 0);

  if (!timestamps.length) return { min: 0, max: 0 };

  return {
    min: Math.min(...timestamps),
    max: Math.max(...timestamps)
  };
}

function mergeRange(target, nextRange) {
  if (!nextRange?.min || !nextRange?.max) return;

  if (!target.min || nextRange.min < target.min) {
    target.min = nextRange.min;
  }

  if (!target.max || nextRange.max > target.max) {
    target.max = nextRange.max;
  }
}

function createEmptyStats() {
  return {
    total: 0,
    success: 0,
    failed: 0,
    balancePositive: 0,
    totalBalance: 0,

    highestBalance: -1,
    highestBalanceUser: '',
    highestBalancePassword: '',

    playersWithBetHistory: 0,
    playersWithPaymentHistory: 0,

    totalDeposit: 0,
    totalWithdraw: 0,

    paymentByDateMap: {},

    betRange: { min: 0, max: 0 },
    paymentRange: { min: 0, max: 0 }
  };
}

async function fetchAccountsFromApi() {
  const res = await fetch(`${ACCOUNT_API_BASE}/accounts?all=true`);

  if (!res.ok) {
    throw new Error(`Fetch account API failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();

  if (!Array.isArray(data.items)) {
    throw new Error('Account API response must contain items array');
  }

  return data.items.map((item) => ({
    username: String(item.username || '').trim(),
    password: String(item.password || '').trim(),
    fileName: item.fileName || 'unknown'
  }));
}

function applyResultToStats(stat, item) {
  const balance = toNumber(item.balance);
  const transactionCount = toNumber(item.transactionCount);
  const payment = summarizePayment(item.rawResponse, 0);

  const betRange = extractBetRange(item.rawResponse);
  const paymentRange = extractPaymentRange(item.rawResponse);

  const hasPaymentHistory = payment.depositCount > 0 || payment.withdrawCount > 0;

  stat.total++;

  if (item.status === 'SUCCESS') stat.success++;
  if (item.status === 'FAILED') stat.failed++;

  if (balance > 0) stat.balancePositive++;

  stat.totalBalance += balance;

  if (balance > stat.highestBalance) {
    stat.highestBalance = balance;
    stat.highestBalanceUser = item.username || '';
    stat.highestBalancePassword = item.password || '';
  }

  if (transactionCount > 0) {
    stat.playersWithBetHistory++;
  }

  if (hasPaymentHistory) {
    stat.playersWithPaymentHistory++;
  }

  stat.totalDeposit += payment.totalDeposit;
  stat.totalWithdraw += payment.totalWithdraw;

  applyPaymentByDate(stat, item.rawResponse);

  mergeRange(stat.betRange, betRange);
  mergeRange(stat.paymentRange, paymentRange);
}

async function buildRunFullStats(runId) {
  const run = await ImportRun.findById(runId).lean();

  if (!run) {
    const err = new Error('Run not found');
    err.statusCode = 404;
    throw err;
  }

  const results = await LoginResult.find({ runId: run._id }).lean();

  const accounts = await fetchAccountsFromApi();
  const accountMap = new Map();

  for (const acc of accounts) {
    accountMap.set(buildKey(acc.username, acc.password), acc.fileName);
  }

  const overall = createEmptyStats();
  const byFileMap = {};

  for (const item of results) {
    const fileName =
      accountMap.get(buildKey(item.username, item.password)) || 'unknown';

    if (!byFileMap[fileName]) {
      byFileMap[fileName] = createEmptyStats();
    }

    applyResultToStats(overall, item);
    applyResultToStats(byFileMap[fileName], item);
  }

  finalizePaymentByDate(overall);

  const byFile = Object.entries(byFileMap)
    .map(([fileName, stats]) => {
      finalizePaymentByDate(stats);

      return {
        fileName,
        ...stats
      };
    })
    .sort((a, b) => b.total - a.total);

  return {
    run,
    overall,
    byFile
  };
}

module.exports = {
  buildRunFullStats
};