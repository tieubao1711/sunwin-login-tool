function normalizeLoginResult(login, error) {
  // =========================
  // ERROR CASE
  // =========================
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

      // ===== TRANSACTION =====
      depositCount: 0,
      withdrawCount: 0,

      deposits: [],
      withdraws: [],

      lastTransactionDescription: '',
      lastTransactionValue: 0,
      lastTransactionService: '',

      // ===== DEPOSIT =====
      lastDepositAmount: 0,
      lastDepositStatus: '',
      lastDepositBankName: '',
      lastDepositBankAccount: '',
      lastDepositNote: '',

      // ===== WITHDRAW =====
      lastWithdrawAmount: 0,
      lastWithdrawStatus: '',
      lastWithdrawBankName: '',
      lastWithdrawBankAccount: '',
      lastWithdrawNote: '',

      rawResponse: null,
      errorStack: error.stack || ''
    };
  }

  // =========================
  // SUCCESS CASE
  // =========================
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

    // ===== TRANSACTION =====
    depositCount: login.depositCount || 0,
    withdrawCount: login.withdrawCount || 0,

    deposits: login.deposits || [],
    withdraws: login.withdraws || [],

    lastTransactionDescription: login.lastTransactionDescription || '',
    lastTransactionValue: login.lastTransactionValue || 0,
    lastTransactionService: login.lastTransactionService || '',

    // ===== DEPOSIT =====
    lastDepositAmount: login.lastDepositAmount || 0,
    lastDepositStatus: login.lastDepositStatus || '',
    lastDepositBankName: login.lastDepositBankName || '',
    lastDepositBankAccount: login.lastDepositBankAccount || '',
    lastDepositNote: login.lastDepositNote || '',

    // ===== WITHDRAW =====
    lastWithdrawAmount: login.lastWithdrawAmount || 0,
    lastWithdrawStatus: login.lastWithdrawStatus || '',
    lastWithdrawBankName: login.lastWithdrawBankName || '',
    lastWithdrawBankAccount: login.lastWithdrawBankAccount || '',
    lastWithdrawNote: login.lastWithdrawNote || '',

    rawResponse: login.rawResponse || null,
    errorStack: login.errorStack || ''
  };
}

// =========================
// BUILD DB PAYLOAD
// =========================
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

    // ===== TRANSACTION =====
    depositCount: login.depositCount,
    withdrawCount: login.withdrawCount,
    deposits: login.deposits,
    withdraws: login.withdraws,

    lastTransactionDescription: login.lastTransactionDescription,
    lastTransactionValue: login.lastTransactionValue,
    lastTransactionService: login.lastTransactionService,

    // ===== DEPOSIT =====
    lastDepositAmount: login.lastDepositAmount,
    lastDepositStatus: login.lastDepositStatus,
    lastDepositBankName: login.lastDepositBankName,
    lastDepositBankAccount: login.lastDepositBankAccount,
    lastDepositNote: login.lastDepositNote,

    // ===== WITHDRAW =====
    lastWithdrawAmount: login.lastWithdrawAmount,
    lastWithdrawStatus: login.lastWithdrawStatus,
    lastWithdrawBankName: login.lastWithdrawBankName,
    lastWithdrawBankAccount: login.lastWithdrawBankAccount,
    lastWithdrawNote: login.lastWithdrawNote,

    rawResponse: login.rawResponse,
    errorStack: login.errorStack || ''
  };
}

module.exports = {
  normalizeLoginResult,
  buildLoginResultPayload
};