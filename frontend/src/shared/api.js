// Shared API client with JWT auth, request timeouts, 401 logout, offline detection
const BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

const API_TIMEOUT_MS = 30000;
const UPLOAD_TIMEOUT_MS = 60000;

function getToken() {
  return localStorage.getItem('dp_token') || '';
}

// Merge a caller-provided signal with a hard timeout so a flaky mobile
// connection can never leave a request hanging forever.
function withTimeout(signal, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', () => controller.abort(), { once: true });
  }
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

async function handleResponse(res) {
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

export async function api(path, { method = 'GET', body, token, signal } = {}) {
  const tok = token ?? getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(tok ? { Authorization: `Bearer ${tok}` } : {}),
  };
  const timed = withTimeout(signal, API_TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      signal: timed.signal,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    return await handleResponse(res);
  } finally {
    timed.clear();
  }
}

export async function apiUpload(path, { file, token, signal } = {}) {
  const tok = token ?? getToken();
  const form = new FormData();
  form.append('image', file);
  const timed = withTimeout(signal, UPLOAD_TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: tok ? { Authorization: `Bearer ${tok}` } : {},
      body: form,
      signal: timed.signal,
    });
    return await handleResponse(res);
  } finally {
    timed.clear();
  }
}
