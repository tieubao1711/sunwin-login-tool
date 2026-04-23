const axios = require('axios');
const config = require('../config');

const http = axios.create({
  timeout: config.requestTimeoutMs,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'User-Agent': 'sunwin-login-tool/1.0'
  }
});

async function loginById({ username, password }) {
  try {
    const response = await http.post(config.loginApiUrl, { username, password });
    const payload = response.data || {};
    const data = payload.data || {};

    const profile = data.profile || {};
    const profileInfo = profile.info || {};

    const walletInfo = data.walletInfo || {};
    const wallet = walletInfo.wallet || {};
    const wsMeta = walletInfo.wsMeta || {};

    const transactions = data.transactions || {};
    const transactionData = transactions.data || {};
    const transactionItems = Array.isArray(transactionData.items) ? transactionData.items : [];
    const firstTransaction = transactionItems[0] || {};

    const slipHistory = data.slipHistory || {};
    const depositHistory = slipHistory.deposit || {};
    const withdrawHistory = slipHistory.withdraw || {};

    const depositData = depositHistory.data || {};
    const withdrawData = withdrawHistory.data || {};

    const depositItems = Array.isArray(depositData.items) ? depositData.items : [];
    const withdrawItems = Array.isArray(withdrawData.items) ? withdrawData.items : [];

    const firstDeposit = depositItems[0] || {};
    const firstWithdraw = withdrawItems[0] || {};

    const firstDepositBank = firstDeposit.bankReceive || {};
    const firstWithdrawBank = firstWithdraw.bankReceive || {};

    const displayName =
      profile.displayName ||
      wsMeta.dn ||
      profileInfo.displayName ||
      '';

    const mainBalance = Number(wallet.gold || 0);

    return {
      ok: payload.success === true,
      statusCode: response.status,
      command: '',
      executeTime: 0,
      message:
        transactions.message ||
        depositData.message ||
        withdrawData.message ||
        payload.message ||
        'Success',

      balance: mainBalance,
      chip: Number(wallet.chip || 0),
      vip: Number(wallet.vip || 0),
      safe: Number(wallet.safe || 0),
      guarranteedChip: Number(wallet.guarranteed_chip || 0),
      guarranteedGold: Number(wallet.guarranteed_gold || 0),

      fullname: displayName,
      displayName,
      phone: profile.phone || '',
      email: profile.email || '',

      signature: data.signature || '',
      expireIn: Number(data.expireIn || 0),
      wsToken: data.wsToken || '',
      accessToken: data.accessToken || '',
      refreshToken: profileInfo.refreshToken || '',

      ipAddress: profileInfo.ipAddress || '',
      userId: profileInfo.userId || '',
      customerUsername: profile.username || '',

      transactionCount: Number(transactionData.count || 0),

      depositCount: Number(depositData.count || 0),
      withdrawCount: Number(withdrawData.count || 0),
      slipCount: Number(depositData.count || 0) + Number(withdrawData.count || 0),

      lastTransactionDescription: firstTransaction.description || '',
      lastTransactionValue: Number(firstTransaction.exchangeValue || 0),
      lastTransactionService: firstTransaction.serviceName || '',

      lastDepositAmount: Number(firstDeposit.amount || 0),
      lastDepositStatus: firstDeposit.statusDescription || '',
      lastDepositBankName: firstDepositBank.accountName || '',
      lastDepositBankAccount: firstDepositBank.accountNumber || '',
      lastDepositNote: firstDeposit.notes || '',

      lastWithdrawAmount: Number(firstWithdraw.amount || 0),
      lastWithdrawStatus: firstWithdraw.statusDescription || '',
      lastWithdrawBankName: firstWithdrawBank.accountName || '',
      lastWithdrawBankAccount: firstWithdrawBank.accountNumber || '',
      lastWithdrawNote: firstWithdraw.notes || '',

      rawResponse: payload
    };
  } catch (error) {
    return {
      ok: false,
      statusCode: error.response?.status || 0,
      command: '',
      executeTime: 0,
      message:
        error.response?.data?.message ||
        error.response?.data?.data?.message ||
        error.message ||
        'Request failed',

      balance: 0,
      chip: 0,
      vip: 0,
      safe: 0,
      guarranteedChip: 0,
      guarranteedGold: 0,

      fullname: '',
      displayName: '',
      phone: '',
      email: '',

      signature: '',
      expireIn: 0,
      wsToken: '',
      accessToken: '',
      refreshToken: '',

      ipAddress: '',
      userId: '',
      customerUsername: '',

      transactionCount: 0,
      depositCount: 0,
      withdrawCount: 0,
      slipCount: 0,

      lastTransactionDescription: '',
      lastTransactionValue: 0,
      lastTransactionService: '',

      lastDepositAmount: 0,
      lastDepositStatus: '',
      lastDepositBankName: '',
      lastDepositBankAccount: '',
      lastDepositNote: '',

      lastWithdrawAmount: 0,
      lastWithdrawStatus: '',
      lastWithdrawBankName: '',
      lastWithdrawBankAccount: '',
      lastWithdrawNote: '',

      rawResponse: error.response?.data || null,
      errorStack: error.stack || ''
    };
  }
}

module.exports = {
  loginById
};