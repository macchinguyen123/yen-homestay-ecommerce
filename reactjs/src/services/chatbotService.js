const API = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api').replace(/\/auth\/?$/, '');

export const chatbotService = {
  sendMessage: async (message) => {
    const res = await fetch(`${API}/public/chatbot/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Lỗi kết nối máy chủ (${res.status})`);
    }

    return await res.json();
  },
};
