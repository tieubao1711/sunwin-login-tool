const axios = require('axios');
const config = require('../config');

const API_URL = config.accountApiUrl + '/account-checked';

async function pushAccountChecked(payload) {
  try {
    const res = await axios.post(API_URL, payload, {
      timeout: 10000
    });

    return res.data;
  } catch (err) {
    console.log(
      `[ACCOUNT_CHECKED ERROR] ${payload.username} | ${err.message}`
    );
    return null;
  }
}

module.exports = {
  pushAccountChecked
};