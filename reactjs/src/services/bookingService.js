const API_BASE_URL = 'http://localhost:8081/api/public/bookings';

let memoryCache = {};

export const bookingService = {
  /**
   * Lấy ngay tức thì danh sách đặt phòng từ bộ nhớ đệm (0ms)
   */
  getCachedUserBookings(userId) {
    if (!userId) return [];
    if (memoryCache[userId] && Array.isArray(memoryCache[userId])) {
      return memoryCache[userId];
    }
    try {
      const stored = localStorage.getItem(`cached_user_bookings_${userId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          memoryCache[userId] = parsed;
          return parsed;
        }
      }
    } catch (e) {}
    return [];
  },

  /**
   * Lấy danh sách lịch sử đặt phòng thật của người dùng từ Neon PostgreSQL
   * @param {number|string} userId ID của du khách
   */
  async getUserBookings(userId) {
    if (!userId) return [];
    try {
      const response = await fetch(`${API_BASE_URL}/user/${userId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        memoryCache[userId] = data;
        try {
          localStorage.setItem(`cached_user_bookings_${userId}`, JSON.stringify(data));
        } catch (e) {}
        return data;
      }
      return [];
    } catch (error) {
      console.error(`Lỗi khi tải lịch sử đặt phòng của user ${userId}:`, error);
      return this.getCachedUserBookings(userId);
    }
  },

  /**
   * Lấy chi tiết đơn đặt phòng theo mã booking
   * @param {string} bookingCode Mã đặt phòng (VD: YEN-2026-8892)
   */
  async getBookingByCode(bookingCode) {
    try {
      const response = await fetch(`${API_BASE_URL}/code/${bookingCode}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error(`Lỗi khi tra cứu đơn đặt phòng ${bookingCode}:`, error);
      return null;
    }
  },

  /**
   * Tạo đơn đặt phòng mới lưu trực tiếp vào CSDL thật Neon PostgreSQL
   * @param {Object} bookingData Thông tin đặt phòng
   */
  async createBooking(bookingData) {
    try {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      const userId = user?.id || user?.userId || user?.user_id || sessionStorage.getItem('userId') || bookingData.touristId || 1;
      const headers = {
        'Content-Type': 'application/json',
      };
      if (user?.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
      }
      if (userId) {
        headers['X-User-Id'] = String(userId);
      }
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...bookingData,
          touristId: Number(userId),
        }),
      });
      const data = await response.json();
      if (!response.ok || data?.success === false) {
        const msg = data?.message || 'Lỗi khi tạo đơn đặt phòng';
        const err = new Error(msg);
        err.response = data;
        throw err;
      }
      // Dọn cache bookings của owner để khi chuyển sang tài khoản owner sẽ fetch đơn mới tức thì
      try {
        Object.keys(localStorage).forEach((k) => {
          if (k.startsWith('cached_owner_bookings_')) {
            localStorage.removeItem(k);
          }
        });
      } catch (ignored) {}
      return data;
    } catch (error) {
      console.error('Lỗi khi gửi đơn đặt phòng:', error);
      throw error;
    }
  },

  /**
   * Lấy danh sách các khoảng ngày đã kín lịch của một phòng
   * @param {number|string} roomId
   */
  async getRoomBusyDates(roomId) {
    if (!roomId) return [];
    try {
      const response = await fetch(`${API_BASE_URL}/room/${roomId}/busy-dates`);
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.warn('Lỗi khi lấy lịch kín của phòng:', e);
      return [];
    }
  },

  /**
   * Lấy danh sách các khoảng ngày đã kín lịch của cả homestay
   * @param {number|string} homestayId
   */
  async getHomestayBusyDates(homestayId) {
    if (!homestayId) return [];
    try {
      const response = await fetch(`${API_BASE_URL}/homestay/${homestayId}/busy-dates`);
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.warn('Lỗi khi lấy lịch kín của homestay:', e);
      return [];
    }
  },

  /**
   * Hủy đơn đặt phòng
   * @param {number|string} bookingId ID của đơn đặt phòng
   * @param {number|string} touristId ID của du khách
   */
  async cancelBooking(bookingId, touristId) {
    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
      const userId = touristId || currentUser?.id || currentUser?.userId || currentUser?.user_id || sessionStorage.getItem('userId') || 1;
      const headers = {};
      if (currentUser?.token) {
        headers['Authorization'] = `Bearer ${currentUser.token}`;
      }
      if (userId) {
        headers['X-User-Id'] = String(userId);
      }
      const response = await fetch(`${API_BASE_URL}/${bookingId}/cancel`, {
        method: 'PUT',
        headers,
      });
      return await response.json();
    } catch (error) {
      console.error('Lỗi khi hủy đơn đặt phòng:', error);
      throw error;
    }
  },

  /**
   * Gửi khiếu nại thực tế liên kết với đơn đặt phòng
   * @param {Object} complaintData Dữ liệu khiếu nại
   */
  async submitComplaint(complaintData) {
    try {
      const response = await fetch(`${API_BASE_URL}/complaint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(complaintData),
      });
      return await response.json();
    } catch (error) {
      console.error('Lỗi khi gửi khiếu nại:', error);
      throw error;
    }
  },

  /**
   * Đăng bài nhận xét & hoàn thành danh sách nhiệm vụ homestay
   * @param {Object} reviewData Dữ liệu đánh giá và ảnh
   */
  async submitReview(reviewData) {
    try {
      const response = await fetch(`${API_BASE_URL}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      });
      return await response.json();
    } catch (error) {
      console.error('Lỗi khi gửi nhận xét nhiệm vụ:', error);
      throw error;
    }
  },
};
