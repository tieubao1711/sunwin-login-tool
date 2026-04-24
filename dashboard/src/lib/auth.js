const API_BASE = 'http://127.0.0.1:1711/api';

export function getAuthToken() {
  return sessionStorage.getItem('authToken') || '';
}

export function setAuthToken(token) {
  sessionStorage.setItem('authToken', token);
}

export function clearAuthToken() {
  sessionStorage.removeItem('authToken');
}

export async function createAuthSession() {
  const res = await fetch(`${API_BASE}/auth/session`, {
    method: 'POST'
  });

  if (!res.ok) {
    throw new Error(`Create auth session failed: ${res.status}`);
  }

  return res.json();
}

export async function getAuthStatus(code) {
  const res = await fetch(`${API_BASE}/auth/status/${code}`);

  if (!res.ok) {
    throw new Error(`Get auth status failed: ${res.status}`);
  }

  return res.json();
}

export async function getMe() {
  const token = getAuthToken();

  if (!token) {
    return { authenticated: false };
  }

  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    return { authenticated: false };
  }

  return res.json();
}