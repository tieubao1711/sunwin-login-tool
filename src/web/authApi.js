const express = require('express');
const {
  createAuthSession,
  getAuthSessionStatus,
  verifyToken
} = require('../services/authService');
const { startAuthTelegramBot } = require('./../services/telegramService');

const router = express.Router();

router.post('/session', (req, res) => {
  startAuthTelegramBot();
  const session = createAuthSession();

  res.json({
    success: true,
    code: session.code,
    expiresAt: session.expiresAt
  });
});

router.get('/status/:code', (req, res) => {
  const status = getAuthSessionStatus(req.params.code);

  res.json({
    success: true,
    ...status
  });
});

router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');

  const user = verifyToken(token);

  if (!user) {
    return res.status(401).json({
      authenticated: false
    });
  }

  res.json({
    authenticated: true,
    user
  });
});

module.exports = router;