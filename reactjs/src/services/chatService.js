const API = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api').replace(/\/auth\/?$/, '');

const headers = () => {
  try {
    const u = JSON.parse(localStorage.getItem('user') || 'null');
    const h = {};
    if (u?.token) h['Authorization'] = `Bearer ${u.token}`;
    if (u?.id) h['X-User-Id'] = String(u.id);
    return h;
  } catch {
    return {};
  }
};

async function call(path, options = {}) {
  const r = await fetch(`${API}/chat${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...headers(),
      ...(options.headers || {})
    }
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.message || `HTTP ${r.status}`);
  return d;
}

export const chatService = {
  list: () => call('/conversations'),
  open: (homestayId) => call('/conversations', { method: 'POST', body: JSON.stringify({ homestayId }) }),
  messages: (id) => call(`/conversations/${id}/messages`),
  send: (id, content) => call(`/conversations/${id}/messages`, { method: 'POST', body: JSON.stringify({ content }) }),
  read: (id) => call(`/conversations/${id}/read`, { method: 'PATCH' })
};
