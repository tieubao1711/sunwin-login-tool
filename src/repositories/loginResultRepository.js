const LoginResult = require('../models/LoginResult');

async function createLoginResult(payload) {
  return LoginResult.create(payload);
}

module.exports = {
  createLoginResult
};
