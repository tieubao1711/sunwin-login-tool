require('dotenv').config();
const axios = require('axios');

function safeText(input) {
  return String(input ?? '')
    .replace(/\r/g, '')
    .trim();
}

async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_GROUP_DATA_ID;

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  const result = {
    username: "sadas",
    nickname: "wrqwe",
    status: 1,
    message: "zxcxzc",
    balance: 100,
    fullname: "zxjkczxjkc"
  }
  const text = [
    'LOGIN RESULT',
    `#${1}/${2}`,
    `Username: ${safeText(result.username)}`,
    `Nickname: ${safeText(result.nickname || '-')}`,
    `Status: ${safeText(result.status)}`,
    `Message: ${safeText(result.message || '-')}`,
    `Balance: ${Number(result.balance || 0).toLocaleString('vi-VN')}`,
    `Fullname: ${safeText(result.fullname || '-')}`
  ].join('\n');

  try {
    const res = await axios.post(url, {
      chat_id: chatId,
      text: text,
      message_thread_id: 5, // Gửi đúng topic
    });

    console.log('OK:', res.data);
  } catch (err) {
    console.log('ERROR:', err.message);
    if (err.response?.data) {
      console.log(JSON.stringify(err.response.data, null, 2));
    }
  }
}

main();