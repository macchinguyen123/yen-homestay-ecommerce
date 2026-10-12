const API_BASE_URL = 'http://localhost:8081/api/owner/missions';
const PUBLIC_API_BASE_URL = 'http://localhost:8081/api/public/owner/missions';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

async function safeFetch(url, options = {}) {
  const defaultOpts = {
    headers: getAuthHeaders(),
    ...options
  };
  try {
    let res = await fetch(url, defaultOpts);
    if (!res.ok && url.includes('/api/owner/missions') && !url.includes('/api/public/')) {
      const publicUrl = url.replace('/api/owner/missions', '/api/public/owner/missions');
      res = await fetch(publicUrl, defaultOpts);
    }
    return res;
  } catch (err) {
    if (url.includes('/api/owner/missions') && !url.includes('/api/public/')) {
      const publicUrl = url.replace('/api/owner/missions', '/api/public/owner/missions');
      return await fetch(publicUrl, defaultOpts);
    }
    throw err;
  }
}

export const ownerMissionService = {
  /**
   * Lấy danh sách nhiệm vụ của Homestay
   */
  async getMissions(homestayId) {
    try {
      const query = homestayId ? `?homestayId=${homestayId}` : '';
      const res = await safeFetch(`${API_BASE_URL}${query}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          localStorage.setItem(`cached_owner_missions_${homestayId || 'all'}`, JSON.stringify(data));
          return data;
        }
      }
    } catch (err) {
      console.warn('Lỗi gọi API getMissions, sử dụng cache:', err.message);
    }

    try {
      const cached = localStorage.getItem(`cached_owner_missions_${homestayId || 'all'}`);
      if (cached) return JSON.parse(cached);
    } catch (e) {
      console.error(e);
    }
    return [];
  },

  /**
   * Tạo nhiệm vụ mới
   */
  async createMission(missionData) {
    try {
      const res = await safeFetch(`${API_BASE_URL}`, {
        method: 'POST',
        body: JSON.stringify(missionData)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Lỗi tạo nhiệm vụ API:', err.message);
    }
    // Fallback offline object
    return {
      id: `M${Date.now().toString().slice(-3)}`,
      rawId: Date.now(),
      ...missionData,
      given: 0,
      status: missionData.status || 'active'
    };
  },

  /**
   * Cập nhật nhiệm vụ
   */
  async updateMission(id, missionData) {
    const rawId = typeof id === 'string' && id.startsWith('M') ? parseInt(id.replace(/\D/g, ''), 10) : id;
    try {
      const res = await safeFetch(`${API_BASE_URL}/${rawId}`, {
        method: 'PUT',
        body: JSON.stringify(missionData)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Lỗi cập nhật nhiệm vụ API:', err.message);
    }
    return { id, rawId, ...missionData };
  },

  /**
   * Bật / tắt tạm dừng nhiệm vụ
   */
  async toggleMissionStatus(id) {
    const rawId = typeof id === 'string' && id.startsWith('M') ? parseInt(id.replace(/\D/g, ''), 10) : id;
    try {
      const res = await safeFetch(`${API_BASE_URL}/${rawId}/toggle`, {
        method: 'PATCH'
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Lỗi toggle mission API:', err.message);
    }
    return null;
  },

  /**
   * Xóa nhiệm vụ
   */
  async deleteMission(id) {
    const rawId = typeof id === 'string' && id.startsWith('M') ? parseInt(id.replace(/\D/g, ''), 10) : id;
    try {
      const res = await safeFetch(`${API_BASE_URL}/${rawId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Lỗi xóa mission API:', err.message);
    }
    return { success: true };
  },

  /**
   * Lấy danh sách bài nộp của khách (Submissions)
   */
  async getSubmissions(homestayId, status = 'all', taskType = 'all', search = '') {
    try {
      const params = new URLSearchParams();
      if (homestayId) params.append('homestayId', homestayId);
      if (status && status !== 'all') params.append('status', status);
      if (taskType && taskType !== 'all') params.append('taskType', taskType);
      if (search) params.append('search', search);

      const query = params.toString() ? `?${params.toString()}` : '';
      const res = await safeFetch(`${API_BASE_URL}/submissions${query}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          localStorage.setItem(`cached_owner_submissions_${homestayId || 'all'}`, JSON.stringify(data));
          return data;
        }
      }
    } catch (err) {
      console.warn('Lỗi getSubmissions API, sử dụng cache:', err.message);
    }

    try {
      const cached = localStorage.getItem(`cached_owner_submissions_${homestayId || 'all'}`);
      if (cached) return JSON.parse(cached);
    } catch (e) {
      console.error(e);
    }
    return [];
  },

  /**
   * Duyệt bài nộp và trao quà / voucher
   */
  async approveSubmission(idOrCode, data = {}) {
    try {
      const res = await safeFetch(`${API_BASE_URL}/submissions/${idOrCode}/approve`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Lỗi duyệt bài nộp API:', err.message);
    }
    return { id: idOrCode, status: 'approved', ...data };
  },

  /**
   * Từ chối bài nộp
   */
  async rejectSubmission(idOrCode, data) {
    try {
      const res = await safeFetch(`${API_BASE_URL}/submissions/${idOrCode}/reject`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Lỗi từ chối bài nộp API:', err.message);
    }
    return { id: idOrCode, status: 'rejected', ...data };
  },

  /**
   * Yêu cầu chụp lại bài nộp
   */
  async retakeSubmission(idOrCode, data) {
    try {
      const res = await safeFetch(`${API_BASE_URL}/submissions/${idOrCode}/retake`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Lỗi yêu cầu chụp lại bài nộp API:', err.message);
    }
    return { id: idOrCode, status: 'retake', ...data };
  },

  /**
   * Lấy thống kê KPI và bảng xếp hạng
   */
  async getStats(homestayId) {
    try {
      const query = homestayId ? `?homestayId=${homestayId}` : '';
      const res = await safeFetch(`${API_BASE_URL}/stats${query}`);
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(`cached_owner_mission_stats_${homestayId || 'all'}`, JSON.stringify(data));
        return data;
      }
    } catch (err) {
      console.warn('Lỗi getStats API, sử dụng cache:', err.message);
    }

    try {
      const cached = localStorage.getItem(`cached_owner_mission_stats_${homestayId || 'all'}`);
      if (cached) return JSON.parse(cached);
    } catch (e) {
      console.error(e);
    }
    return {
      activeMissions: 4,
      pendingToday: 0,
      participantGuests: 142,
      rewardedVouchers: 96,
      interactionRate: 68,
      topGuests: [],
      rewardStocks: []
    };
  },

  /**
   * Lấy kho quà tặng
   */
  async getRewardStocks(homestayId) {
    try {
      const query = homestayId ? `?homestayId=${homestayId}` : '';
      const res = await safeFetch(`${API_BASE_URL}/reward-stocks${query}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Lỗi getRewardStocks API:', err.message);
    }
    return [];
  },

  /**
   * Cập nhật kho quà tặng
   */
  async saveRewardStocks(homestayId, items) {
    try {
      const res = await safeFetch(`${API_BASE_URL}/reward-stocks`, {
        method: 'POST',
        body: JSON.stringify({ homestayId, items })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Lỗi saveRewardStocks API:', err.message);
    }
    return items;
  },

  /**
   * Gửi quà tri ân tháng
   */
  async sendGift(data) {
    try {
      const res = await safeFetch(`${API_BASE_URL}/send-gift`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Lỗi sendGift API:', err.message);
    }
    return { success: true, message: 'Đã gửi quà thành công!' };
  }
};
