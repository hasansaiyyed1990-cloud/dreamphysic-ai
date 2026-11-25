const base = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
export async function api(path, { method = 'GET', body, token } = {}) {
  const response = await fetch(`${base}${path}`, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) throw new Error(payload.message || `Request failed (${response.status})`);
  return payload.data;
}
export async function apiUpload(path, { file, token } = {}) {
  const form = new FormData();
  form.append('image', file);
  const response = await fetch(`${base}${path}`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: form });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) throw new Error(payload.message || `Request failed (${response.status})`);
  return payload.data;
}
