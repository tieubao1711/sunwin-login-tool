const axios = require('axios');
const config = require('../config');

const ACCOUNT_API_URL = process.env.ACCOUNT_API_URL || config.accountApiUrl || '';

const http = axios.create({
  timeout: Number(config.vpsSyncTimeoutMs || 15000),
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'User-Agent': 'sunwin-login-tool/1.0'
  }
});

function isVpsEnabled() {
  return !!ACCOUNT_API_URL;
}

async function post(path, payload) {
  if (!isVpsEnabled()) return null;

  const res = await http.post(`${ACCOUNT_API_URL}${path}`, payload);
  return res.data;
}

async function syncFlaggedAccount(payload) {
  const depositCount = Number(payload.depositCount || 0);
  const withdrawCount = Number(payload.withdrawCount || 0);

  const hasDeposit =
    depositCount > 0 ||
    (Array.isArray(payload.deposits) && payload.deposits.length > 0);

  const hasWithdraw =
    withdrawCount > 0 ||
    (Array.isArray(payload.withdraws) && payload.withdraws.length > 0);

  if (!hasDeposit && !hasWithdraw) return null;

  return post('/account-flagged', payload);
}

async function syncCentralRun(payload) {
  if (!payload?.runKey) return null;

  return post('/central-runs', {
    runKey: String(payload.runKey),
    toolName: payload.toolName || process.env.TOOL_NAME || config.toolName || 'bulk-tool-local',
    machineId: payload.machineId || process.env.MACHINE_ID || config.machineId || '',
    sourceFile: payload.sourceFile || '',
    total: Number(payload.total || 0),
    status: payload.status || 'RUNNING',
    startedAt: payload.startedAt || undefined,
    finishedAt: payload.finishedAt || undefined,
    meta: payload.meta || {}
  });
}

async function syncCentralLoginResult(payload) {
  if (!payload?.runKey || !payload?.username) return null;

  return post('/central-login-results', {
    runKey: String(payload.runKey),
    toolName: payload.toolName || process.env.TOOL_NAME || config.toolName || 'bulk-tool-local',
    machineId: payload.machineId || process.env.MACHINE_ID || config.machineId || '',

    accountId: payload.accountId ? String(payload.accountId) : '',
    username: String(payload.username).trim(),
    password: payload.password || '',

    displayName: payload.displayName || payload.fullname || '',
    phone: payload.phone || '',

    status: payload.status || '',
    message: payload.message || '',

    balance: Number(payload.balance || 0),
    safe: Number(payload.safe || 0),

    deposits: Array.isArray(payload.deposits) ? payload.deposits : [],
    withdraws: Array.isArray(payload.withdraws) ? payload.withdraws : [],

    rawResponse: payload.rawResponse || null,
    durationMs: Number(payload.durationMs || 0)
  });
}

module.exports = {
  syncFlaggedAccount,
  syncCentralRun,
  syncCentralLoginResult
};