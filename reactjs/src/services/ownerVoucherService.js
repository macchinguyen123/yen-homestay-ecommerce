const API_BASE_URL = 'http://localhost:8081/api/owner/vouchers';
const PUBLIC_API_BASE_URL = 'http://localhost:8081/api/public/owner/vouchers';

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
    if (!res.ok && url.includes('/api/owner/vouchers') && !url.includes('/api/public/')) {
      const publicUrl = url.replace('/api/owner/vouchers', '/api/public/owner/vouchers');
      res = await fetch(publicUrl, defaultOpts);
    }
    return res;
  } catch (err) {
    if (url.includes('/api/owner/vouchers') && !url.includes('/api/public/')) {
      const publicUrl = url.replace('/api/owner/vouchers', '/api/public/owner/vouchers');
      return await fetch(publicUrl, defaultOpts);
    }
    throw err;
  }
}

export const ownerVoucherService = {
  /**
   * Lấy danh sách mã giảm giá theo homestay hoặc toàn hệ thống
   */
  async getVouchers(homestayId) {
    try {
      const query = homestayId && homestayId !== 'all' ? `?homestayId=${homestayId}` : '';
      const res = await safeFetch(`${API_BASE_URL}${query}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          localStorage.setItem(`cached_owner_vouchers_${homestayId || 'all'}`, JSON.stringify(data));
          return data;
        }
      }
    } catch (err) {
      console.warn('Lỗi kết nối CSDL voucher, kích hoạt bộ nhớ đệm:', err.message);
    }

    try {
      const cached = localStorage.getItem(`cached_owner_vouchers_${homestayId || 'all'}`);
      if (cached) return JSON.parse(cached);
      const fallbackSaved = localStorage.getItem('owner_vouchers_data');
      if (fallbackSaved) return JSON.parse(fallbackSaved);
    } catch (e) {}

    return null;
  },

  /**
   * Lấy thống kê KPI và tỉ lệ chuyển đổi voucher
   */
  async getStats(homestayId) {
    try {
      const query = homestayId && homestayId !== 'all' ? `?homestayId=${homestayId}` : '';
      const res = await safeFetch(`${API_BASE_URL}/stats${query}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Lỗi lấy thống kê voucher từ CSDL:', err.message);
    }
    return null;
  },

  /**
   * Lấy lịch sử phát hành các chiến dịch voucher
   */
  async getHistory(homestayId) {
    try {
      const query = homestayId && homestayId !== 'all' ? `?homestayId=${homestayId}` : '';
      const res = await safeFetch(`${API_BASE_URL}/history${query}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Lỗi lấy lịch sử voucher từ CSDL:', err.message);
    }
    try {
      const saved = localStorage.getItem('owner_voucher_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  },

  /**
   * Tạo mã giảm giá mới
   */
  async createVoucher(payload) {
    try {
      const res = await safeFetch(API_BASE_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        return await res.json();
      }
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Lỗi khi lưu mã giảm giá lên máy chủ');
    } catch (err) {
      console.warn('Backend create voucher error, falling back locally:', err.message);
      // Re-throw so component handles specific error (e.g. duplicate code)
      throw err;
    }
  },

  /**
   * Cập nhật thông tin mã giảm giá
   */
  async updateVoucher(id, payload) {
    if (!id) throw new Error('Thiếu ID mã giảm giá để cập nhật');
    const res = await safeFetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Lỗi cập nhật mã giảm giá');
    }
    return await res.json();
  },

  /**
   * Bật / tắt trạng thái kích hoạt của voucher
   */
  async toggleStatus(id) {
    if (!id) return null;
    const res = await safeFetch(`${API_BASE_URL}/${id}/toggle`, {
      method: 'POST'
    });
    if (!res.ok) {
      throw new Error('Lỗi cập nhật trạng thái');
    }
    return await res.json();
  },

  /**
   * Xoá mã giảm giá khỏi hệ thống
   */
  async deleteVoucher(id) {
    if (!id) return false;
    const res = await safeFetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Lỗi xoá mã giảm giá');
    }
    return true;
  }
};
