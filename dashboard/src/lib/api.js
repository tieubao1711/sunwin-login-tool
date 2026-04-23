const API_BASE = 'http://103.82.135.143:1711/api';

export async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

export async function getLatestRun() {
  return apiGet('/runs/latest');
}

export async function getRuns(limit = 20) {
  return apiGet(`/runs?limit=${limit}`);
}

export async function getRun(runId) {
  return apiGet(`/runs/${runId}`);
}

export async function getRunResults(runId, params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;

    // chỉ gửi true, bỏ false
    if (typeof value === 'boolean') {
      if (value) {
        query.set(key, 'true');
      }
      return;
    }

    query.set(key, String(value));
  });

  return apiGet(`/runs/${runId}/results?${query.toString()}`);
}

export async function getResultDetail(resultId) {
  return apiGet(`/results/${resultId}`);
}

export async function getRunStats(runId) {
  return apiGet(`/runs/${runId}/stats`);
}

export async function loadAccountsFromApi(body) {
  const res = await fetch('http://103.82.135.143:1711/api/control/run/load', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`Load failed: ${res.status}`);
  return res.json();
}

export async function startRun(body) {
  const res = await fetch('http://103.82.135.143:1711/api/control/run/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`Start failed: ${res.status}`);
  return res.json();
}

export async function pauseRun() {
  const res = await fetch('http://103.82.135.143:1711/api/control/run/pause', {
    method: 'POST'
  });
  return res.json();
}

export async function resumeRun() {
  const res = await fetch('http://103.82.135.143:1711/api/control/run/resume', {
    method: 'POST'
  });
  return res.json();
}

export async function stopRun() {
  const res = await fetch('http://103.82.135.143:1711/api/control/run/stop', {
    method: 'POST'
  });
  return res.json();
}

export async function getCurrentRunStatus() {
  return apiGet('/run/current');
}