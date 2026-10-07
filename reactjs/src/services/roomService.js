const API_BASE_URL = 'http://localhost:8081/api/public/rooms';

export const roomService = {
  /**
   * Lấy tất cả phòng từ database
   */
  async getAllRooms() {
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.warn('Lỗi khi tải danh sách phòng từ database:', error.message);
      return [];
    }
  },

  /**
   * Lấy chi tiết 1 phòng theo ID từ database
   */
  async getRoomById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.warn(`Lỗi khi tải chi tiết phòng ${id} từ database:`, error.message);
      return null;
    }
  },

  /**
   * Lấy danh sách phòng của 1 homestay từ database
   */
  async getRoomsByHomestayId(homestayId) {
    try {
      const response = await fetch(`${API_BASE_URL}/homestay/${homestayId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.warn(`Lỗi khi tải phòng của homestay ${homestayId} từ database:`, error.message);
      return [];
    }
  },

  /**
   * Đồng bộ / seed dữ liệu phòng vào database
   */
  async seedRooms() {
    try {
      const response = await fetch(`${API_BASE_URL}/seed`, { method: 'POST' });
      return await response.json();
    } catch (error) {
      console.warn('Lỗi khi seed phòng:', error.message);
      return null;
    }
  }
};
