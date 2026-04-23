function cleanNumber(value) {
  const numeric = String(value || '').replace(/[^\d-]/g, '');
  return numeric ? Number(numeric) : 0;
}

function parseTxt(content) {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const items = [];
  let current = null;

  const pushCurrent = () => {
    if (!current) return;
    if (!current.username || !current.password) return;
    items.push({ ...current });
  };

  for (const line of lines) {
    if (line.includes('---KHÁCH LOGIN SUNWIN---')) {
      pushCurrent();
      const match = line.match(/^\[(.*?)\]/);
      current = {
        rawTime: match ? match[1] : '',
        nickname: '',
        username: '',
        password: '',
        fileBalance: 0
      };
      continue;
    }

    if (!current) continue;

    if (line.startsWith('Nickname ---')) {
      current.nickname = line.replace('Nickname ---', '').trim();
      continue;
    }

    if (line.startsWith('Username ---')) {
      current.username = line.replace('Username ---', '').trim();
      continue;
    }

    if (line.startsWith('Password ---')) {
      current.password = line.replace('Password ---', '').trim();
      continue;
    }

    if (line.startsWith('Số dư ---')) {
      current.fileBalance = cleanNumber(line.replace('Số dư ---', '').trim());
    }
  }

  pushCurrent();
  return items;
}

module.exports = {
  parseTxt
};
