const API_BASE_URL = 'http://localhost:8081/api/public/vouchers';

export const voucherService = {
  /**
   * Lấy danh sách toàn bộ voucher thật từ Neon PostgreSQL
   */
  async getAllVouchers() {
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('Lỗi khi tải danh sách vouchers từ server:', error);
      return [];
    }
  },

  /**
   * Kiểm tra mã voucher tại bước thanh toán hoặc kích hoạt
   * @param {string} code Mã voucher
   */
  async checkVoucher(code) {
    try {
      const response = await fetch(`${API_BASE_URL}/check/${encodeURIComponent(code)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Lỗi khi kiểm tra mã voucher ${code}:`, error);
      return { valid: false, message: 'Không thể kết nối đến máy chủ để xác thực mã.' };
    }
  }
};
