// ============================================================
// Service gọi API đánh giá thực tế từ Database (Neon PostgreSQL)
// ============================================================

const API_BASE_URL = 'http://localhost:8081/api/public/reviews';

const reviewsCache = new Map();
const statsCache = new Map();

export const reviewService = {
  /**
   * Lấy danh sách đánh giá thực tế của một Homestay từ CSDL (có cache)
   * @param {number|string} homestayId
   */
  async getReviewsByHomestayId(homestayId, forceRefresh = false) {
    if (!homestayId) return [];
    const cacheKey = `reviews_${homestayId}`;
    if (!forceRefresh && reviewsCache.has(cacheKey)) {
      return reviewsCache.get(cacheKey);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/homestay/${homestayId}`);
      if (!res.ok) {
        console.warn(`Không thể lấy đánh giá cho homestay ${homestayId}: HTTP ${res.status}`);
        return reviewsCache.get(cacheKey) || [];
      }
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      reviewsCache.set(cacheKey, list);
      return list;
    } catch (err) {
      console.warn(`Lỗi khi gọi API đánh giá homestay ${homestayId}:`, err);
      return reviewsCache.get(cacheKey) || [];
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
   * Lấy thống kê số lượng đánh giá và điểm trung bình thực tế từ CSDL (có cache)
   * @param {number|string} homestayId
   */
  async getReviewStats(homestayId, forceRefresh = false) {
    if (!homestayId) return null;
    const cacheKey = `stats_${homestayId}`;
    if (!forceRefresh && statsCache.has(cacheKey)) {
      return statsCache.get(cacheKey);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/stats/${homestayId}`);
      if (!res.ok) return statsCache.get(cacheKey) || null;
      const data = await res.json();
      statsCache.set(cacheKey, data);
      return data;
    } catch (err) {
      console.warn(`Lỗi khi gọi API thống kê đánh giá homestay ${homestayId}:`, err);
      return statsCache.get(cacheKey) || null;
    }
  }
};
