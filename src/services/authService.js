const crypto = require('crypto');
const config = require('../config');

const sessions = new Map();

function now() {
  return Date.now();
}

function generateCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}

function cleanupExpiredSessions() {
  const current = now();

  for (const [code, session] of sessions.entries()) {
    if (session.expiresAt <= current) {
      sessions.delete(code);
    }
  }
}

function createAuthSession() {
  cleanupExpiredSessions();

  let code = generateCode();

  while (sessions.has(code)) {
    code = generateCode();
  }

  const session = {
    code,
    status: 'pending',
    createdAt: now(),
    expiresAt: now() + Number(config.auth.sessionTtlMs || 300000),
    telegramUser: null,
    token: ''
  };

  sessions.set(code, session);

  return {
    code,
    status: session.status,
    expiresAt: session.expiresAt
  };
}

function createToken(user) {
  const payload = {
    id: user.id,
    username: user.username || '',
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    loginAt: now()
  };

  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');

  const signature = crypto
    .createHmac('sha256', config.auth.secret)
    .update(body)
    .digest('base64url');

  return `${body}.${signature}`;
}

function verifyToken(token) {
  if (!token || !token.includes('.')) return null;

  const [body, signature] = token.split('.');

  const expected = crypto
    .createHmac('sha256', config.auth.secret)
    .update(body)
    .digest('base64url');

  if (signature !== expected) return null;

  try {
    return JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

function approveAuthSession(code, telegramUser) {
  cleanupExpiredSessions();

  const normalizedCode = String(code || '').trim().toUpperCase();
  const session = sessions.get(normalizedCode);

  if (!session) {
    return {
      success: false,
      message: 'Mã login không tồn tại hoặc đã hết hạn'
    };
  }

  if (session.status === 'approved') {
    return {
      success: true,
      message: 'Mã này đã được xác thực rồi',
      session
    };
  }

  const token = createToken(telegramUser);

  session.status = 'approved';
  session.telegramUser = telegramUser;
  session.token = token;
  session.approvedAt = now();

  sessions.set(normalizedCode, session);

  return {
    success: true,
    message: 'Xác thực thành công',
    session
  };
}

function getAuthSessionStatus(code) {
  cleanupExpiredSessions();

  const normalizedCode = String(code || '').trim().toUpperCase();
  const session = sessions.get(normalizedCode);

  if (!session) {
    return {
      exists: false,
      status: 'expired'
    };
  }

  return {
    exists: true,
    code: session.code,
    status: session.status,
    expiresAt: session.expiresAt,
    token: session.status === 'approved' ? session.token : '',
    user: session.status === 'approved' ? session.telegramUser : null
  };
}

module.exports = {
  createAuthSession,
  approveAuthSession,
  getAuthSessionStatus,
  verifyToken
};