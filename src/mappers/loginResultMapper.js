function normalizeLoginResult(login, error) {
  if (error) {
    return {
      ok: false,
      message: error.message || 'Login error',
      balance: 0,
      chip: 0,
      vip: '',
      safe: 0,
      guarranteedChip: 0,
      guarranteedGold: 0,
      fullname: '',
      displayName: '',
      phone: '',
      email: '',
      executeTime: 0,
      ipAddress: '',
      customerUsername: '',
      userId: '',
      accessToken: '',
      refreshToken: '',
      wsToken: '',
      signature: '',
      expireIn: 0,
      transactionCount: 0,
      slipCount: 0,
      lastTransactionDescription: '',
      lastTransactionValue: 0,
      lastTransactionService: '',
      lastSlipAmount: 0,
      lastSlipStatus: '',
      lastSlipBankName: '',
      lastSlipBankAccount: '',
      lastSlipTransactionCode: '',
      recentSlipHistory: [],
      rawResponse: null,
      errorStack: error.stack || ''
    };
  }

  return {
    ok: !!login.ok,
    message: login.message || '',
    balance: login.balance || 0,
    chip: login.chip || 0,
    vip: login.vip || '',
    safe: login.safe || 0,
    guarranteedChip: login.guarranteedChip || 0,
    guarranteedGold: login.guarranteedGold || 0,
    fullname: login.fullname || '',
    displayName: login.displayName || '',
    phone: login.phone || '',
    email: login.email || '',
    executeTime: login.executeTime || 0,
    ipAddress: login.ipAddress || '',
    customerUsername: login.customerUsername || '',
    userId: login.userId || '',
    accessToken: login.accessToken || '',
    refreshToken: login.refreshToken || '',
    wsToken: login.wsToken || '',
    signature: login.signature || '',
    expireIn: login.expireIn || 0,
    transactionCount: login.transactionCount || 0,
    slipCount: login.slipCount || 0,
    lastTransactionDescription: login.lastTransactionDescription || '',
    lastTransactionValue: login.lastTransactionValue || 0,
    lastTransactionService: login.lastTransactionService || '',
    lastSlipAmount: login.lastSlipAmount || 0,
    lastSlipStatus: login.lastSlipStatus || '',
    lastSlipBankName: login.lastSlipBankName || '',
    lastSlipBankAccount: login.lastSlipBankAccount || '',
    lastSlipTransactionCode: login.lastSlipTransactionCode || '',
    recentSlipHistory: login.recentSlipHistory || [],
    rawResponse: login.rawResponse || null,
    errorStack: login.errorStack || ''
  };
}

function buildLoginResultPayload(account, runId, status, login) {
  return {
    runId,
    rawTime: account.rawTime,
    nickname: account.nickname,
    username: account.username,
    password: account.password,
    fileBalance: account.fileBalance || 0,

    status,
    message: login.message,

    balance: login.balance,
    chip: login.chip,
    vip: login.vip,
    safe: login.safe,
    guarranteedChip: login.guarranteedChip,
    guarranteedGold: login.guarranteedGold,

    fullname: login.fullname,
    displayName: login.displayName,
    phone: login.phone,
    email: login.email,

    executeTime: login.executeTime,
    ipAddress: login.ipAddress,
    customerUsername: login.customerUsername,
    userId: login.userId,

    accessToken: login.accessToken,
    refreshToken: login.refreshToken,
    wsToken: login.wsToken,
    signature: login.signature,
    expireIn: login.expireIn,

    transactionCount: login.transactionCount,
    slipCount: login.slipCount,

    lastTransactionDescription: login.lastTransactionDescription,
    lastTransactionValue: login.lastTransactionValue,
    lastTransactionService: login.lastTransactionService,

    lastSlipAmount: login.lastSlipAmount,
    lastSlipStatus: login.lastSlipStatus,
    lastSlipBankName: login.lastSlipBankName,
    lastSlipBankAccount: login.lastSlipBankAccount,
    lastSlipTransactionCode: login.lastSlipTransactionCode,

    rawResponse: login.rawResponse,
    errorStack: login.errorStack || ''
  };
}

module.exports = {
  normalizeLoginResult,
  buildLoginResultPayload
};