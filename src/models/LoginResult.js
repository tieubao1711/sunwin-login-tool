const mongoose = require('mongoose');

const loginResultSchema = new mongoose.Schema(
  {
    runId: { type: mongoose.Schema.Types.ObjectId, ref: 'ImportRun', required: true, index: true },
    rawTime: { type: String, default: '' },
    nickname: { type: String, default: '' },

    username: { type: String, required: true, index: true },
    password: { type: String, default: '' },
    customerUsername: { type: String, default: '' },

    status: { type: String, enum: ['SUCCESS', 'FAILED'], required: true, index: true },
    message: { type: String, default: '' },

    fileBalance: { type: Number, default: 0 },

    balance: { type: Number, default: 0, index: true }, // main balance = wallet.gold
    chip: { type: Number, default: 0 },
    vip: { type: Number, default: 0 },
    safe: { type: Number, default: 0 },
    guarranteedChip: { type: Number, default: 0 },
    guarranteedGold: { type: Number, default: 0 },

    fullname: { type: String, default: '' },
    displayName: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },

    executeTime: { type: Number, default: 0 },
    ipAddress: { type: String, default: '' },
    userId: { type: String, default: '' },

    accessToken: { type: String, default: '' },
    refreshToken: { type: String, default: '' },
    wsToken: { type: String, default: '' },
    signature: { type: String, default: '' },
    expireIn: { type: Number, default: 0 },

    transactionCount: { type: Number, default: 0 },
    slipCount: { type: Number, default: 0 },

    lastTransactionDescription: { type: String, default: '' },
    lastTransactionValue: { type: Number, default: 0 },
    lastTransactionService: { type: String, default: '' },

    lastSlipAmount: { type: Number, default: 0 },
    lastSlipStatus: { type: String, default: '' },
    lastSlipBankName: { type: String, default: '' },
    lastSlipBankAccount: { type: String, default: '' },

    rawResponse: { type: Object, default: null },
    errorStack: { type: String, default: '' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('LoginResult', loginResultSchema);