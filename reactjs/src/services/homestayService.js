const API_BASE_URL = 'http://localhost:8081/api/public/homestays';

export const homestayService = {
  /**
   * Lấy toàn bộ danh sách homestay kèm phòng thật từ database
   */
  async getAllHomestays() {
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.warn('Lỗi khi tải danh sách homestay từ database:', error.message);
      return [];
    }
  },

  /**
   * Lấy chi tiết homestay theo ID kèm phòng thật từ database
   */
  async getHomestayById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.warn(`Lỗi khi tải homestay ${id} từ database:`, error.message);
      return null;
    }
  },

  /**
   * Lấy danh sách phòng thuộc homestay từ database
   */
  async getHomestayRooms(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}/rooms`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.warn(`Lỗi khi tải phòng của homestay ${id} từ database:`, error.message);
      return [];
    }
  }
};
