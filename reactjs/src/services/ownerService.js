const API_BASE_URL = 'http://localhost:8081/api/owner/services';
const PUBLIC_API_BASE_URL = 'http://localhost:8081/api/public/owner/services';

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
    if (!res.ok && (url.includes('/api/owner/services') && !url.includes('/api/public/'))) {
      // Fallback to public endpoint if token not required
      const publicUrl = url.replace('/api/owner/services', '/api/public/owner/services');
      res = await fetch(publicUrl, defaultOpts);
    }
    return res;
  } catch (err) {
    // Retry with public
    if (url.includes('/api/owner/services') && !url.includes('/api/public/')) {
      const publicUrl = url.replace('/api/owner/services', '/api/public/owner/services');
      return await fetch(publicUrl, defaultOpts);
    }
    throw err;
  }
}

export const ownerService = {
  /**
   * Lấy danh sách dịch vụ của homestay từ CSDL
   */
  async getServices(homestayId) {
    try {
      const query = homestayId ? `?homestayId=${homestayId}` : '';
      const res = await safeFetch(`${API_BASE_URL}${query}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          // Cache locally for instant next renders
          localStorage.setItem(`cached_services_${homestayId || 'default'}`, JSON.stringify(data));
          return data;
        }
      }
    } catch (err) {
      console.warn('Lỗi kết nối CSDL dịch vụ, sử dụng bộ nhớ đệm:', err.message);
    }
    // Return cached if available
    try {
      const cached = localStorage.getItem(`cached_services_${homestayId || 'default'}`);
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return null;
  },

  /**
   * Lấy thống kê KPI và tỉ lệ dịch vụ từ CSDL
   */
  async getStats(homestayId) {
    try {
      const query = homestayId ? `?homestayId=${homestayId}` : '';
      const res = await safeFetch(`${API_BASE_URL}/stats${query}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Lỗi lấy thống kê dịch vụ từ CSDL:', err.message);
    }
    return null;
  },

  /**
   * Thêm dịch vụ mới vào CSDL
   */
  async createService(payload) {
    const res = await safeFetch(API_BASE_URL, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Không thể tạo dịch vụ');
    }
    return await res.json();
  },

  /**
   * Cập nhật dịch vụ trong CSDL
   */
  async updateService(id, payload) {
    const res = await safeFetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Không thể cập nhật dịch vụ');
    }
    return await res.json();
  },

  /**
   * Bật/tắt trạng thái nhận khách
   */
  async toggleStatus(id) {
    const res = await safeFetch(`${API_BASE_URL}/${id}/toggle-status`, {
      method: 'POST'
    });
    if (!res.ok) {
      throw new Error('Lỗi chuyển trạng thái');
    }
    return await res.json();
  },

  /**
   * Cập nhật nhanh bảng giá
   */
  async updatePrice(id, price) {
    const res = await safeFetch(`${API_BASE_URL}/${id}/price`, {
      method: 'POST',
      body: JSON.stringify({ price })
    });
    if (!res.ok) {
      throw new Error('Lỗi cập nhật giá');
    }
    return await res.json();
  },

  /**
   * Xóa dịch vụ khỏi CSDL
   */
  async deleteService(id) {
    const res = await safeFetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      throw new Error('Lỗi xóa dịch vụ');
    }
    return await res.json();
  },

  /**
   * Lấy danh sách ghi chú vận hành
   */
  async getNotes(homestayId) {
    try {
      const query = homestayId ? `?homestayId=${homestayId}` : '';
      const res = await safeFetch(`${API_BASE_URL}/notes${query}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Lỗi lấy ghi chú từ CSDL:', err.message);
    }
    return null;
  },

  /**
   * Thêm ghi chú mới
   */
  async createNote(payload) {
    const res = await safeFetch(`${API_BASE_URL}/notes`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Lỗi thêm ghi chú');
    return await res.json();
  },

  /**
   * Cập nhật ghi chú
   */
  async updateNote(id, payload) {
    const res = await safeFetch(`${API_BASE_URL}/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Lỗi cập nhật ghi chú');
    return await res.json();
  },

  /**
   * Xóa ghi chú
   */
  async deleteNote(id) {
    const res = await safeFetch(`${API_BASE_URL}/notes/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Lỗi xóa ghi chú');
    return await res.json();
  }
};
