const API_BASE_URL = 'http://localhost:8081/api/owner/bookings';
const PUBLIC_API_BASE_URL = 'http://localhost:8081/api/public/owner/bookings';

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
    if (!res.ok && url.includes('/api/owner/bookings') && !url.includes('/api/public/')) {
      const publicUrl = url.replace('/api/owner/bookings', '/api/public/owner/bookings');
      res = await fetch(publicUrl, defaultOpts);
    }
    return res;
  } catch (err) {
    if (url.includes('/api/owner/bookings') && !url.includes('/api/public/')) {
      const publicUrl = url.replace('/api/owner/bookings', '/api/public/owner/bookings');
      return await fetch(publicUrl, defaultOpts);
    }
    throw err;
  }
}

export const ownerBookingService = {
  /**
   * Lấy danh sách đơn đặt phòng từ CSDL Neon PostgreSQL
   */
  async getBookings(homestayId, status = 'all', search = '') {
    try {
      const params = new URLSearchParams();
      if (homestayId) params.append('homestayId', homestayId);
      if (status && status !== 'all') params.append('status', status);
      if (search) params.append('search', search);

      const query = params.toString() ? `?${params.toString()}` : '';
      const res = await safeFetch(`${API_BASE_URL}${query}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          localStorage.setItem(`cached_owner_bookings_${homestayId || 'all'}`, JSON.stringify(data));
          return data;
        }
      }
    } catch (err) {
      console.warn('Lỗi kết nối CSDL đơn đặt phòng, sử dụng cache:', err.message);
    }

    try {
      const cached = localStorage.getItem(`cached_owner_bookings_${homestayId || 'all'}`);
      if (cached) return JSON.parse(cached);
    } catch (e) {}

    return null;
  },

  /**
   * Lấy thống kê KPI và phòng hôm nay từ CSDL
   */
  async getStats(homestayId) {
    try {
      const query = homestayId ? `?homestayId=${homestayId}` : '';
      const res = await safeFetch(`${API_BASE_URL}/stats${query}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Lỗi lấy thống kê đặt phòng từ CSDL:', err.message);
    }
    return null;
  },

  /**
   * Tra cứu chi tiết đơn đặt phòng
   */
  async getBookingDetail(idOrCode) {
    try {
      const res = await safeFetch(`${API_BASE_URL}/${idOrCode}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.error(`Lỗi tra cứu đơn ${idOrCode}:`, err);
    }
    return null;
  },

  /**
   * Tạo đơn đặt phòng trực tiếp lưu vào CSDL
   */
  async createDirectBooking(payload) {
    const res = await safeFetch(API_BASE_URL, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Không thể tạo đơn đặt phòng trực tiếp');
    }
    return await res.json();
  },

  async createBooking(payload) {
    return this.createDirectBooking(payload);
  },

  /**
   * Xác nhận Check-in nhận phòng
   */
  async checkinBooking(id, payload = {}) {
    const res = await safeFetch(`${API_BASE_URL}/${id}/checkin`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Check-in thất bại');
    }
    return await res.json();
  },

  /**
   * Xác nhận Check-out & quyết toán
   */
  async checkoutBooking(id, payload = {}) {
    const res = await safeFetch(`${API_BASE_URL}/${id}/checkout`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Check-out thất bại');
    }
    return await res.json();
  },

  /**
   * Duyệt đơn đặt phòng & xác nhận đối soát cọc
   */
  async approveBooking(id, payload = {}) {
    const res = await safeFetch(`${API_BASE_URL}/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Duyệt đơn thất bại');
    }
    return await res.json();
  },

  /**
   * Từ chối / Hủy đơn đặt phòng
   */
  async rejectBooking(id, payload = {}) {
    const res = await safeFetch(`${API_BASE_URL}/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Từ chối đơn thất bại');
    }
    return await res.json();
  },

  /**
   * Thêm dịch vụ / trải nghiệm bản địa vào đơn đặt phòng
   */
  async addServices(id, payload) {
    const res = await safeFetch(`${API_BASE_URL}/${id}/services`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Thêm dịch vụ thất bại');
    }
    return await res.json();
  }
};
