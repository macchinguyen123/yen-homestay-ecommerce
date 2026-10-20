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

/**
 * Lấy ownerId từ user đã đăng nhập trong localStorage
 */
function getCurrentOwnerId() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user?.id ? String(user.id) : null;
  } catch {
    return null;
  }
}

/**
 * Tạo cache key riêng theo tài khoản owner (không phân biệt homestay)
 */
function makeCacheKey() {
  const ownerId = getCurrentOwnerId() || 'unknown';
  return `cached_owner_${ownerId}_vouchers_all`;
}

/**
 * Xóa toàn bộ cache voucher của owner hiện tại
 */
function clearOwnerCache() {
  try {
    const ownerId = getCurrentOwnerId() || 'unknown';
    Object.keys(localStorage).forEach((key) => {
      if (
        key.startsWith(`cached_owner_${ownerId}_vouchers_`) ||
        key.startsWith(`owner_${ownerId}_vouchers_`)
      ) {
        localStorage.removeItem(key);
      }
    });
  } catch (_) {}
}

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
   * Lấy TẤT CẢ mã giảm giá của owner đăng nhập.
   * KHÔNG truyền homestayId lên API để backend trả về toàn bộ vouchers của owner,
   * kể cả PENDING/REJECTED thuộc mọi homestay.
   * Filter theo homestay thực hiện hoàn toàn ở client-side (ManageDiscount.jsx).
   */
  async getVouchers() {
    const ownerId = getCurrentOwnerId();
    try {
      const params = new URLSearchParams();
      if (ownerId) params.set('ownerId', ownerId);
      const query = params.toString() ? `?${params.toString()}` : '';
      const res = await safeFetch(`${API_BASE_URL}${query}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          // Lưu cache toàn bộ (không phân biệt homestay)
          try {
            localStorage.setItem(makeCacheKey(), JSON.stringify(data));
          } catch (_) {}
          return data;
        }
      }
    } catch (err) {
      console.warn('Lỗi kết nối CSDL voucher, kích hoạt bộ nhớ đệm:', err.message);
    }

    // Fallback: chỉ dùng cache khi backend không phản hồi
    try {
      const cached = localStorage.getItem(makeCacheKey());
      if (cached) return JSON.parse(cached);
    } catch (e) {}

    return null;
  },

  /**
   * Xóa toàn bộ cache voucher của owner hiện tại
   */
  clearCache: clearOwnerCache,

  /**
   * Lấy thống kê KPI và tỉ lệ chuyển đổi voucher
   */
  async getStats() {
    const ownerId = getCurrentOwnerId();
    try {
      const params = new URLSearchParams();
      if (ownerId) params.set('ownerId', ownerId);
      const query = params.toString() ? `?${params.toString()}` : '';
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
  async getHistory() {
    const ownerId = getCurrentOwnerId();
    try {
      const params = new URLSearchParams();
      if (ownerId) params.set('ownerId', ownerId);
      const query = params.toString() ? `?${params.toString()}` : '';
      const res = await safeFetch(`${API_BASE_URL}/history${query}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Lỗi lấy lịch sử voucher từ CSDL:', err.message);
    }
    return null;
  },

  /**
   * Tạo mã giảm giá mới
   */
  async createVoucher(payload) {
    const ownerId = getCurrentOwnerId();
    const finalPayload = {
      ...payload,
      ownerId: payload.ownerId || (ownerId ? Number(ownerId) : null)
    };
    try {
      const query = ownerId ? `?ownerId=${ownerId}` : '';
      const res = await safeFetch(`${API_BASE_URL}${query}`, {
        method: 'POST',
        body: JSON.stringify(finalPayload)
      });
      if (res.ok) {
        const created = await res.json();
        // Xóa toàn bộ cache của tài khoản này để tải lại mới nhất
        clearOwnerCache();
        return created;
      }
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || 'Lỗi khi lưu mã giảm giá lên máy chủ');
    } catch (err) {
      console.warn('Backend create voucher error, falling back locally:', err.message);
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
