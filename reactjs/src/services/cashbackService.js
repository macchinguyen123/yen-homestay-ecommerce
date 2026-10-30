const API_BASE_URL = 'http://localhost:8081/api/public/cashback';

const getCacheKey = (userId) => `cached_cashback_wallet_${userId || 'guest'}`;

export const cashbackService = {
  /**
   * Lấy ngay dữ liệu ví đã lưu trong cache (0ms không chờ đợi)
   */
  getCachedWallet(userId) {
    try {
      const cached = localStorage.getItem(getCacheKey(userId));
      if (cached) {
        const wallet = JSON.parse(cached);
        const { bankName, accountNumber, accountHolder, isLinked, isPinSet, walletPin, ...pointsWallet } = wallet;
        if (Array.isArray(pointsWallet.transactions)) {
          pointsWallet.transactions = pointsWallet.transactions.filter((item) => !/rút tiền|ngân hàng/i.test(item.title || ''));
        }
        return pointsWallet;
      }
    } catch (e) {
      console.warn('Không thể đọc cache ví hoàn tiền:', e);
    }
    return null;
  },

  /**
   * Lấy thông tin ví hoàn tiền và lịch sử giao dịch từ Spring Boot (Neon PostgreSQL)
   * Tối ưu phản hồi nhanh với timeout ngắn
   */
  async getWallet(userId) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    try {
      const response = await fetch(`${API_BASE_URL}/${userId || 1}`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }

      const data = await response.json();
      if (Array.isArray(data.transactions)) {
        data.transactions = data.transactions.filter((item) => !/rút tiền|ngân hàng/i.test(item.title || ''));
      }
      // Lưu lại cache để lần sau mở lên hiển thị tức thì
      try {
        localStorage.setItem(getCacheKey(userId), JSON.stringify(data));
      } catch (e) {
        // ignore quota error
      }
      return { success: true, data };
    } catch (error) {
      clearTimeout(timeoutId);
      console.warn('Lỗi kết nối API ví hoàn tiền, ưu tiên sử dụng cache:', error.message);
      const cached = this.getCachedWallet(userId);
      if (cached) {
        return { success: true, data: cached, isFromCache: true };
      }
      return { success: false, error: error.message };
    }
  },

};
