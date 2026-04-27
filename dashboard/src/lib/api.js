const API_BASE = 'http://127.0.0.1:1711/api';
const ACCOUNT_API_BASE = 'http://103.82.135.143:3001';

/* =========================
   Helpers
========================= */

function buildQuery(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;

    // boolean: chỉ gửi true
    if (typeof value === 'boolean') {
      if (value) query.set(key, 'true');
      return;
    }

    query.set(key, String(value));
  });

  return query.toString();
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
}

/* =========================
   RUN APIs
========================= */

export async function getRunFullStats(runId) {
  return apiGet(`/runs/${runId}/full-stats`);
}

export async function apiGet(path, params = {}) {
  const qs = buildQuery(params);
  const url = `${API_BASE}${path}${qs ? `?${qs}` : ''}`;
  return fetchJson(url);
}

export async function getLatestRun() {
  return apiGet('/runs/latest');
}

export async function getRuns(limit = 20) {
  return apiGet('/runs', { limit });
}

export async function getRun(runId) {
  return apiGet(`/runs/${runId}`);
}

export async function getRunResults(runId, params = {}) {
  return apiGet(`/runs/${runId}/results`, params);
}

export async function getRunStats(runId) {
  return apiGet(`/runs/${runId}/stats`);
}

export async function getResultDetail(resultId) {
  return apiGet(`/results/${resultId}`);
}

/* =========================
   CONTROL APIs
========================= */

export async function loadAccountsFromApi(body) {
  return fetchJson(`${API_BASE}/control/run/load`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

export async function startRun(body) {
  return fetchJson(`${API_BASE}/control/run/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
}

export async function pauseRun() {
  return fetchJson(`${API_BASE}/control/run/pause`, {
    method: 'POST'
  });
}

export async function resumeRun() {
  return fetchJson(`${API_BASE}/control/run/resume`, {
    method: 'POST'
  });
}

export async function stopRun() {
  return fetchJson(`${API_BASE}/control/run/stop`, {
    method: 'POST'
  });
}

export async function getCurrentRunStatus() {
  return apiGet('/run/current');
}

/* =========================
   ACCOUNT APIs (external)
========================= */

export async function getAccounts(params = {}) {
  const qs = buildQuery(params);
  const url = `${ACCOUNT_API_BASE}/accounts${qs ? `?${qs}` : ''}`;
  return fetchJson(url);
}

export async function getAccountChecked(params = {}) {
  const qs = buildQuery(params);
  const url = `${ACCOUNT_API_BASE}/account-checked${qs ? `?${qs}` : ''}`;
  return fetchJson(url);
}

export async function getAccountFlagged(params = {}) {
  const qs = buildQuery(params);
  const url = `${ACCOUNT_API_BASE}/account-flagged${qs ? `?${qs}` : ''}`;
  return fetchJson(url);
}

export async function getCentralRuns(params = {}) {
  const qs = buildQuery(params);
  const url = `${ACCOUNT_API_BASE}/central-runs${qs ? `?${qs}` : ''}`;
  return fetchJson(url);
}

export async function getCentralLoginResults(params = {}) {
  const qs = buildQuery(params);
  const url = `${ACCOUNT_API_BASE}/central-login-results${qs ? `?${qs}` : ''}`;
  return fetchJson(url);
}

export async function deleteCentralRun(runKey) {
  return fetchJson(
    `${ACCOUNT_API_BASE}/central-runs/${encodeURIComponent(runKey)}`,
    {
      method: 'DELETE'
    }
  );
}