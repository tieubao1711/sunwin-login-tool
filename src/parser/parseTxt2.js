function parseTxt2(content) {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const items = [];

  for (const line of lines) {
    const parts = line.split('|');

    if (parts.length < 2) continue;

    const username = String(parts[0] || '').trim();
    const password = String(parts[1] || '').trim();

    if (!username || !password) continue;

    items.push({
      rawTime: '',
      nickname: '',
      username,
      password,
      fileBalance: 0,
      ip: ''
    });
  }

  return items;
}

module.exports = {
  parseTxt2
};