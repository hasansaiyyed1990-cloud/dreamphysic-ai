// Shared API client with JWT auth, AbortController, 401 logout, offline detection
const BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

function getToken() {
  return localStorage.getItem('dp_token') || '';
}

export async function api(path, { method = 'GET', body, token, signal } = {}) {
  const tok = token ?? getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(tok ? { Authorization: `Bearer ${tok}` } : {}),
  };
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    signal,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const payload = await res.json().catch(() => ({}));
  if (res.status === 401) {
    localStorage.removeItem('dp_token');
    window.dispatchEvent(new Event('dp:logout'));
  }
  if (!res.ok || payload.success === false) {
    throw new Error(payload.message || `Request failed (${res.status})`);
  }
  return payload.data ?? payload;
}

export async function apiUpload(path, { file, token, signal } = {}) {
  const tok = token ?? getToken();
  const form = new FormData();
  form.append('image', file);
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: tok ? { Authorization: `Bearer ${tok}` } : {},
    body: form,
    signal,
  });
  const payload = await res.json().catch(() => ({}));
  if (res.status === 401) {
    localStorage.removeItem('dp_token');
    window.dispatchEvent(new Event('dp:logout'));
  }
  if (!res.ok || payload.success === false) {
    throw new Error(payload.message || `Request failed (${res.status})`);
  }
  return payload.data ?? payload;
}
