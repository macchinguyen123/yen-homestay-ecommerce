const API_BASE_URL = 'http://localhost:8080/api/users';

export const viewedHistoryService = {
  /**
   * Lấy danh sách sản phẩm đã xem của user từ Spring Boot API (Neon PostgreSQL DB)
   */
  async getViewedHistory(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/${userId}/viewed-history`);
      if (!response.ok) {
        throw new Error(`Server status: ${response.status}`);
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        // Cache to localStorage for fast local fallback
        localStorage.setItem(`viewed_history_${userId}`, JSON.stringify(data));
        return { success: true, data };
      }
      return { success: false, data: [] };
    } catch (error) {
      console.warn('Lỗi kết nối API lấy lịch sử đã xem, chuyển sang dữ liệu cache/fallback:', error);
      const cached = localStorage.getItem(`viewed_history_${userId}`);
      if (cached) {
        try {
          return { success: true, data: JSON.parse(cached), isOffline: true };
        } catch (e) {}
      }
      return { success: false, error: error.message, data: [] };
    }
  },

  /**
   * Tự động lưu/cập nhật thời gian xem sản phẩm khi user nhấn vào xem chi tiết
   */
  async recordView(userId, homestayId) {
    if (!userId || !homestayId) return { success: false };

    try {
      const response = await fetch(`${API_BASE_URL}/${userId}/viewed-history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ homestayId: Number(homestayId) }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      const resData = await response.json();
      return { success: true, data: resData.data };
    } catch (error) {
      console.warn('Lỗi kết nối API ghi nhận lịch sử xem:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Xóa 1 sản phẩm khỏi lịch sử xem
   */
  async deleteViewedItem(userId, homestayId) {
    try {
      const response = await fetch(`${API_BASE_URL}/${userId}/viewed-history/${homestayId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      return { success: response.ok, data };
    } catch (error) {
      console.warn('Lỗi API xóa item lịch sử:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Xóa toàn bộ lịch sử đã xem của user
   */
  async clearViewedHistory(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/${userId}/viewed-history`, {
        method: 'DELETE',
      });
      const data = await response.json();
      // Clear local cache
      localStorage.removeItem(`viewed_history_${userId}`);
      return { success: response.ok, data };
    } catch (error) {
      console.warn('Lỗi API xóa toàn bộ lịch sử:', error);
      localStorage.removeItem(`viewed_history_${userId}`);
      return { success: false, error: error.message };
    }
  }
};
