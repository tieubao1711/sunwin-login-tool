function toNumber(v) {
  const n = Number(v || 0);
  return Number.isFinite(n) ? n : 0;
}

function get(obj, path, fallback = []) {
  try {
    return path.split('.').reduce((a, k) => a?.[k], obj) ?? fallback;
  } catch {
    return fallback;
  }
}

function sortByNewest(items) {
  return [...items].sort((a, b) => {
    const ta = toNumber(a.responseTime || a.requestTime);
    const tb = toNumber(b.responseTime || b.requestTime);
    return tb - ta;
  });
}

export function getPaymentSummary(rawResponse, limit = 3) {
  const deposits = get(
    rawResponse,
    'data.slipHistory.deposit.data.items',
    []
  );

  const withdraws = get(
    rawResponse,
    'data.slipHistory.withdraw.data.items',
    []
  );

  const latestDeposits = sortByNewest(deposits).slice(0, limit);
  const latestWithdraws = sortByNewest(withdraws).slice(0, limit);

  const totalDeposit = latestDeposits.reduce(
    (sum, x) => sum + toNumber(x.amount),
    0
  );

  const totalWithdraw = latestWithdraws.reduce(
    (sum, x) => sum + toNumber(x.amount),
    0
  );

  return {
    totalDeposit,
    totalWithdraw,
    score: totalDeposit + totalWithdraw
  };
}