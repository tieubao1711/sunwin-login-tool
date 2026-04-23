function buildTelegramResult(record, account, status, login) {
  return {
    id: String(record._id),
    username: account.username,
    nickname: account.nickname,
    status,
    message: login.message,
    balance: login.balance,
    fullname: login.fullname,
    phone: login.phone,

    lastSlipBankName: login.lastSlipBankName,
    lastSlipBankAccount: login.lastSlipBankAccount,
    lastSlipAmount: login.lastSlipAmount,
    lastSlipStatus: login.lastSlipStatus,
    lastSlipTransactionCode: login.lastSlipTransactionCode,
    recentSlipHistory: login.recentSlipHistory || []
  };
}

module.exports = {
  buildTelegramResult
};