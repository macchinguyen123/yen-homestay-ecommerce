// ============================================================
// Service gọi API đánh giá thực tế từ Database (Neon PostgreSQL)
// ============================================================

const API_BASE_URL = 'http://localhost:8081/api/public/reviews';

export const reviewService = {
  /**
   * Lấy danh sách đánh giá thực tế của một Homestay từ CSDL
   * @param {number|string} homestayId
   */
  async getReviewsByHomestayId(homestayId) {
    if (!homestayId) return [];
    try {
      const res = await fetch(`${API_BASE_URL}/homestay/${homestayId}`);
      if (!res.ok) {
        console.warn(`Không thể lấy đánh giá cho homestay ${homestayId}: HTTP ${res.status}`);
        return [];
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.warn(`Lỗi khi gọi API đánh giá homestay ${homestayId}:`, err);
      return [];
    }
  },

  /**
   * Lấy danh sách đánh giá thực tế của một Phòng từ CSDL
   * @param {number|string} roomId
   */
  async getReviewsByRoomId(roomId) {
    if (!roomId) return [];
    try {
      const res = await fetch(`${API_BASE_URL}/room/${roomId}`);
      if (!res.ok) {
        return [];
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.warn(`Lỗi khi gọi API đánh giá phòng ${roomId}:`, err);
      return [];
    }
  },

  /**
   * Lấy thống kê số lượng đánh giá và điểm trung bình thực tế từ CSDL
   * @param {number|string} homestayId
   */
  async getReviewStats(homestayId) {
    if (!homestayId) return null;
    try {
      const res = await fetch(`${API_BASE_URL}/stats/${homestayId}`);
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.warn(`Lỗi khi gọi API thống kê đánh giá homestay ${homestayId}:`, err);
      return null;
    }
  }
};
