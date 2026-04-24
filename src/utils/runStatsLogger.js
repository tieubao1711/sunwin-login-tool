const ImportRun = require('../models/ImportRun');
const LoginResult = require('../models/LoginResult');

const ACCOUNT_API_URL = 'http://103.82.135.143:3001';

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

function sortByNewest(items = []) {
  return [...items].sort((a, b) => {
    const ta = normalizeEpochMs(a.responseTime || a.requestTime || a.createdTime || 0);
    const tb = normalizeEpochMs(b.responseTime || b.requestTime || b.createdTime || 0);
    return tb - ta;
  });
}

function summarizePayment(rawResponse, recentLimit = 0) {
  const depositItems = get(rawResponse, 'data.slipHistory.deposit.data.items', []);
  const withdrawItems = get(rawResponse, 'data.slipHistory.withdraw.data.items', []);

  const deposits = sortByNewest(Array.isArray(depositItems) ? depositItems : []);
  const withdraws = sortByNewest(Array.isArray(withdrawItems) ? withdrawItems : []);

  const pickedDeposits =
    recentLimit > 0 ? deposits.slice(0, recentLimit) : deposits;

  const pickedWithdraws =
    recentLimit > 0 ? withdraws.slice(0, recentLimit) : withdraws;

  return {
    depositCount: pickedDeposits.length,
    withdrawCount: pickedWithdraws.length,
    totalDeposit: pickedDeposits.reduce(
      (sum, item) => sum + toNumber(item.amount),
      0
    ),
    totalWithdraw: pickedWithdraws.reduce(
      (sum, item) => sum + toNumber(item.amount),
      0
    )
  };
}

function extractBetRange(rawResponse) {
  const items = get(rawResponse, 'data.transactions.data.items', []);

  const timestamps = (Array.isArray(items) ? items : [])
    .map((x) => normalizeEpochMs(x.createdTime))
    .filter((x) => x > 0);

  if (!timestamps.length) {
    return { min: 0, max: 0 };
  }

  return {
    min: Math.min(...timestamps),
    max: Math.max(...timestamps)
  };
}

function extractPaymentRange(rawResponse) {
  const depositItems = get(rawResponse, 'data.slipHistory.deposit.data.items', []);
  const withdrawItems = get(rawResponse, 'data.slipHistory.withdraw.data.items', []);

  const all = [
    ...(Array.isArray(depositItems) ? depositItems : []),
    ...(Array.isArray(withdrawItems) ? withdrawItems : [])
  ];

  const timestamps = all
    .map((x) => normalizeEpochMs(x.responseTime || x.requestTime))
    .filter((x) => x > 0);

  if (!timestamps.length) {
    return { min: 0, max: 0 };
  }

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

function formatMoney(n) {
  return toNumber(n).toLocaleString('vi-VN');
}

function formatDate(d) {
  if (!d) return '-';

  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return String(d);

  return dt.toLocaleString('vi-VN', {
    hour12: false
  });
}

function formatRange(minTs, maxTs) {
  if (!minTs || !maxTs) return '-';
  return `${formatDate(minTs)}  ->  ${formatDate(maxTs)}`;
}

function divider(char = '=') {
  return char.repeat(90);
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

    betRange: { min: 0, max: 0 },
    paymentRange: { min: 0, max: 0 }
  };
}

async function fetchAccountsFromApi() {
  const res = await fetch(`${ACCOUNT_API_URL}/accounts?all=true`);

  if (!res.ok) {
    throw new Error(`Fetch API failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();

  if (!Array.isArray(data.items)) {
    throw new Error('API response must contain items array');
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

  const hasPaymentHistory =
    payment.depositCount > 0 || payment.withdrawCount > 0;

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

  mergeRange(stat.betRange, betRange);
  mergeRange(stat.paymentRange, paymentRange);
}

function createRunStatsText({ run, overall, byFile }) {
  const lines = [];

  lines.push(divider('='));
  lines.push('RUN SUMMARY');
  lines.push(divider('='));
  lines.push(`Run ID                : ${String(run._id)}`);
  lines.push(`Run Name              : ${run.name || '-'}`);
  lines.push(`Source File           : ${run.sourceFile || '-'}`);
  lines.push(`Started At            : ${formatDate(run.startedAt || run.createdAt)}`);
  lines.push(`Finished At           : ${formatDate(run.finishedAt || run.updatedAt)}`);
  lines.push(`Duration (ms)         : ${toNumber(run.durationMs)}`);
  lines.push(divider('-'));
  lines.push(`Tổng account          : ${overall.total}`);
  lines.push(`Success               : ${overall.success}`);
  lines.push(`Failed                : ${overall.failed}`);
  lines.push(`Balance > 0           : ${overall.balancePositive}`);
  lines.push(
    `Balance lớn nhất      : ${formatMoney(
      overall.highestBalance > 0 ? overall.highestBalance : 0
    )} (${overall.highestBalanceUser || '-'})`
  );
  lines.push(`Tổng balance          : ${formatMoney(overall.totalBalance)}`);
  lines.push(`Có lịch sử cược       : ${overall.playersWithBetHistory}`);
  lines.push(`Có lịch sử nạp/rút    : ${overall.playersWithPaymentHistory}`);
  lines.push(`Tổng nạp              : ${formatMoney(overall.totalDeposit)}`);
  lines.push(`Tổng rút              : ${formatMoney(overall.totalWithdraw)}`);
  lines.push(
    `Khoảng thời gian cược : ${formatRange(
      overall.betRange.min,
      overall.betRange.max
    )}`
  );
  lines.push(
    `Khoảng thời gian n/r  : ${formatRange(
      overall.paymentRange.min,
      overall.paymentRange.max
    )}`
  );
  lines.push(divider('='));

  lines.push('');
  lines.push('CHI TIẾT THEO FILE');
  lines.push(divider('='));

  Object.entries(byFile)
    .sort((a, b) => b[1].total - a[1].total)
    .forEach(([fileName, s], index) => {
      lines.push('');
      lines.push(`[${index + 1}] ${fileName}`);
      lines.push(divider('-'));
      lines.push(`  Tổng account        : ${s.total}`);
      lines.push(`  Success             : ${s.success}`);
      lines.push(`  Failed              : ${s.failed}`);
      lines.push(`  Balance > 0         : ${s.balancePositive}`);
      lines.push(
        `  Balance lớn nhất    : ${formatMoney(
          s.highestBalance > 0 ? s.highestBalance : 0
        )} (${s.highestBalanceUser || '-'})`
      );
      lines.push(`  Tổng balance        : ${formatMoney(s.totalBalance)}`);
      lines.push(`  Có lịch sử cược     : ${s.playersWithBetHistory}`);
      lines.push(`  Có lịch sử nạp/rút  : ${s.playersWithPaymentHistory}`);
      lines.push(`  Tổng nạp            : ${formatMoney(s.totalDeposit)}`);
      lines.push(`  Tổng rút            : ${formatMoney(s.totalWithdraw)}`);
      lines.push(`  TG cược             : ${formatRange(s.betRange.min, s.betRange.max)}`);
      lines.push(`  TG nạp/rút          : ${formatRange(s.paymentRange.min, s.paymentRange.max)}`);
    });

  lines.push(divider('='));

  return lines.join('\n');
}

async function generateRunStatsText(runId) {
  const run = runId
    ? await ImportRun.findById(runId).lean()
    : await ImportRun.findOne()
        .sort({ createdAt: -1, startedAt: -1 })
        .lean();

  if (!run) {
    throw new Error('Không có run nào.');
  }

  const results = await LoginResult.find({ runId: run._id }).lean();

  const accounts = await fetchAccountsFromApi();
  const accountMap = new Map();

  for (const acc of accounts) {
    accountMap.set(buildKey(acc.username, acc.password), acc.fileName);
  }

  const overall = createEmptyStats();
  const byFile = {};

  for (const item of results) {
    const fileName =
      accountMap.get(buildKey(item.username, item.password)) || 'unknown';

    if (!byFile[fileName]) {
      byFile[fileName] = createEmptyStats();
    }

    applyResultToStats(overall, item);
    applyResultToStats(byFile[fileName], item);
  }

  return createRunStatsText({
    run,
    overall,
    byFile
  });
}

module.exports = {
  generateRunStatsText
};