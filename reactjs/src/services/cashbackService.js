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
        return JSON.parse(cached);
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

  /**
   * Gửi yêu cầu rút tiền về tài khoản ngân hàng
   */
  async withdraw(userId, { bank, accNum, amount, pin }) {
    try {
      const response = await fetch(`${API_BASE_URL}/${userId || 1}/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bank, accNum, amount: Number(amount), pin }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.message || 'Rút tiền thất bại');
      }

      if (resData.wallet) {
        try {
          localStorage.setItem(getCacheKey(userId), JSON.stringify(resData.wallet));
        } catch (e) {}
      }

      return { success: true, data: resData.wallet, message: resData.message };
    } catch (error) {
      console.error('Lỗi khi rút tiền:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Cập nhật thông tin tài khoản ngân hàng liên kết
   */
  async updateBank(userId, { bankName, accountNumber, accountHolder }) {
    try {
      const response = await fetch(`${API_BASE_URL}/${userId || 1}/bank`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bankName, accountNumber, accountHolder }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.message || 'Cập nhật ngân hàng thất bại');
      }

      if (resData.wallet) {
        try {
          localStorage.setItem(getCacheKey(userId), JSON.stringify(resData.wallet));
        } catch (e) {}
      }

      return { success: true, data: resData.wallet, message: resData.message };
    } catch (error) {
      console.error('Lỗi khi cập nhật ngân hàng:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Đổi mã PIN Ví
   */
  async updatePin(userId, { currentPin, newPin }) {
    try {
      const response = await fetch(`${API_BASE_URL}/${userId || 1}/pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPin, newPin }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.message || 'Cập nhật mã PIN thất bại');
      }

      if (resData.wallet) {
        try {
          localStorage.setItem(getCacheKey(userId), JSON.stringify(resData.wallet));
        } catch (e) {}
      }

      return { success: true, data: resData.wallet, message: resData.message };
    } catch (error) {
      console.error('Lỗi khi cập nhật PIN:', error);
      return { success: false, error: error.message };
    }
  }
};
