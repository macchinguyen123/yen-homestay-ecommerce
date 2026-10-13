const API_BASE_URL = 'http://localhost:8081/api/public/vouchers';
const CACHE_KEY = 'yen_cached_public_vouchers';

let memoryCache = null;

export const voucherService = {
  /**
   * Lấy nhanh danh sách voucher từ cache (bộ nhớ RAM hoặc sessionStorage) để render tức thì 0ms
   */
  getCachedVouchers() {
    if (Array.isArray(memoryCache) && memoryCache.length > 0) {
      return memoryCache;
    }
    try {
      const stored = sessionStorage.getItem(CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          memoryCache = parsed;
          return parsed;
        }
      }
    } catch (e) {
      // ignore
    }
    return null;
  },

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
      if (Array.isArray(data)) {
        memoryCache = data;
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
        } catch (e) {}
        return data;
      }
      return [];
    } catch (error) {
      console.error('Lỗi khi tải danh sách vouchers từ server:', error);
      const cached = this.getCachedVouchers();
      if (cached) return cached;
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
