const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBoolean(value, fallback = false) {
  if (value == null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

module.exports = {
  toolName: process.env.TOOL_NAME || "bulk-tool-01",
  machineId: process.env.MACHINE_ID || "pc-01",
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sunwin_login_tool',
  accountApiUrl: process.env.ACCOUNT_API_URL || 'http://103.82.135.143:3001',
  inputFile: path.resolve(process.cwd(), process.env.INPUT_FILE || './data/2.txt'),
  loginApiUrl: process.env.LOGIN_API_URL || 'http://103.82.135.143:3000/login/full-info',
  delayBetweenRequestsMs: Number(process.env.DELAY_BETWEEN_REQUESTS_MS || 0),
  requestTimeoutMs: toNumber(process.env.REQUEST_TIMEOUT_MS, 20000),
  concurrency: toNumber(process.env.CONCURRENCY, 5),
  highBalanceThreshold: toNumber(process.env.HIGH_BALANCE_THRESHOLD, 100000),
  runName: process.env.RUN_NAME || '',
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    dataChatId: process.env.TELEGRAM_DATA_CHAT_ID || '',
    dataTopicId: process.env.TELEGRAM_DATA_TOPIC_ID
      ? Number(process.env.TELEGRAM_DATA_TOPIC_ID)
      : undefined,

    highBalanceChatId: process.env.TELEGRAM_HIGH_BALANCE_CHAT_ID || '',
    highBalanceTopicId: process.env.TELEGRAM_HIGH_BALANCE_TOPIC_ID
      ? Number(process.env.TELEGRAM_HIGH_BALANCE_TOPIC_ID)
      : undefined,

    summaryChatId: process.env.TELEGRAM_SUMMARY_CHAT_ID || '',
    summaryTopicId: process.env.TELEGRAM_SUMMARY_TOPIC_ID
      ? Number(process.env.TELEGRAM_SUMMARY_TOPIC_ID)
      : undefined,

    notifySuccess: String(process.env.TELEGRAM_NOTIFY_SUCCESS || 'true') === 'true',
    notifyFailure: String(process.env.TELEGRAM_NOTIFY_FAILURE || 'true') === 'true',
    dataQueueDelayMs: Number(process.env.TELEGRAM_DATA_QUEUE_DELAY_MS || 1200)
  },
  auth: {
    secret: process.env.AUTH_SECRET || 'local-auth-secret',
    sessionTtlMs: Number(process.env.AUTH_SESSION_TTL_MS || 300000),
    telegramChatId: process.env.AUTH_TELEGRAM_CHAT_ID || '',
    telegramTopicId: process.env.AUTH_TELEGRAM_TOPIC_ID || ''
  }
};
