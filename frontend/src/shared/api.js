// Shared API client with JWT auth, AbortController timeout, 401 logout, and sanitized error tracking
const BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
const DEFAULT_TIMEOUT_MS = 30000;

let lastApiError = null;

export function getLastApiError() {
  return lastApiError;
}

export function clearLastApiError() {
  lastApiError = null;
}

function recordError(path, status, message) {
  const safePath = String(path || '').split('?')[0];
  const safeMsg = String(message || 'Unknown error').slice(0, 140);
  lastApiError = `${status || 'NET'} ${safePath}: ${safeMsg}`;
}

function getToken() {
  return localStorage.getItem('dp_token') || '';
}

export async function api(path, { method = 'GET', body, token, signal, timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const tok = token ?? getToken();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(tok ? { Authorization: `Bearer ${tok}` } : {}),
  };

  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      signal: controller.signal,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    const payload = await res.json().catch(() => ({}));
    if (res.status === 401) {
      localStorage.removeItem('dp_token');
      window.dispatchEvent(new Event('dp:logout'));
    }
    if (!res.ok || payload.success === false) {
      const msg = payload.message || `Request failed (${res.status})`;
      recordError(path, res.status, msg);
      throw new Error(msg);
    }
    return payload.data ?? payload;
  } catch (err) {
    if (err.name === 'AbortError') {
      const msg = 'Request timed out. Check your connection and retry.';
      recordError(path, 'TIMEOUT', msg);
      throw new Error(msg);
    }
    if (!lastApiError || !err.message) {
      recordError(path, 'NET', err.message || 'Network error');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export async function apiUpload(path, { file, token, signal, timeoutMs = 45000, fields } = {}) {
  const tok = token ?? getToken();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  const form = new FormData();
  form.append('image', file);
  if (fields && typeof fields === 'object') {
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined && value !== null) form.append(key, String(value));
    }
  }

  try {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: tok ? { Authorization: `Bearer ${tok}` } : {},
      body: form,
      signal: controller.signal,
    });
    const payload = await res.json().catch(() => ({}));
    if (res.status === 401) {
      localStorage.removeItem('dp_token');
      window.dispatchEvent(new Event('dp:logout'));
    }
    if (!res.ok || payload.success === false) {
      const msg = payload.message || `Request failed (${res.status})`;
      recordError(path, res.status, msg);
      throw new Error(msg);
    }
    return payload.data ?? payload;
  } catch (err) {
    if (err.name === 'AbortError') {
      const msg = 'Upload timed out. Please retry.';
      recordError(path, 'TIMEOUT', msg);
      throw new Error(msg);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
