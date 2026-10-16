const API_BASE_URL = `${(import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api/auth').replace(/\/auth\/?$/, '')}/owner/missions`;

const authHeaders = () => {
  const token = JSON.parse(localStorage.getItem('user') || 'null')?.token;
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Yêu cầu thất bại (HTTP ${response.status}).`);
  }
  if (response.status === 204) return null;
  return response.json();
}

const query = (values) => {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') params.set(key, value);
  });
  const value = params.toString();
  return value ? `?${value}` : '';
};

export const ownerMissionService = {
  getMissions: (homestayId) => request(query({ homestayId })),
  createMission: (data) => request('', { method: 'POST', body: JSON.stringify(data) }),
  updateMission: (id, data) => request(`/${rawId(id)}`, { method: 'PUT', body: JSON.stringify(data) }),
  toggleMissionStatus: (id) => request(`/${rawId(id)}/toggle`, { method: 'PATCH' }),
  deleteMission: (id) => request(`/${rawId(id)}`, { method: 'DELETE' }),
  getSubmissions: (homestayId, status = 'all', taskType = 'all', search = '') =>
    request(`/submissions${query({ homestayId, status: status === 'all' ? '' : status, taskType: taskType === 'all' ? '' : taskType, search })}`),
  approveSubmission: (id, data = {}) => request(`/submissions/${encodeURIComponent(id)}/approve`, { method: 'POST', body: JSON.stringify(data) }),
  rejectSubmission: (id, data) => request(`/submissions/${encodeURIComponent(id)}/reject`, { method: 'POST', body: JSON.stringify(data) }),
  requestRetakeSubmission: (id, data) => request(`/submissions/${encodeURIComponent(id)}/retake`, { method: 'POST', body: JSON.stringify(data) }),
  getStats: (homestayId) => request(`/stats${query({ homestayId })}`),
  getRewardStock: (homestayId) => request(`/reward-stocks${query({ homestayId })}`),
  saveRewardStock: (homestayId, items) => request('/reward-stocks', { method: 'POST', body: JSON.stringify({ homestayId, items }) }),
  sendGift: (data) => request('/send-gift', { method: 'POST', body: JSON.stringify(data) }),
};

function rawId(id) {
  return typeof id === 'string' && id.startsWith('M') ? Number(id.replace(/\D/g, '')) : id;
}
