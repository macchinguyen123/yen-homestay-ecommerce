const DEFAULT_API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api/auth';

/**
 * Hàm fetch an toàn tự động thử cả cổng 8080 và 8081
 */
async function fetchAuth(endpoint, options) {
  return fetch(`${DEFAULT_API_URL}${endpoint}`, options);
}

/**
 * Service xử lý đăng nhập & phân quyền với Backend Spring Boot & PostgreSQL DB
 */
export const authService = {
  /**
   * Đăng nhập người dùng bằng email/sđt và mật khẩu
   */
  async login({ username, password, role }) {
    try {
      const response = await fetchAuth('/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, role }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Lưu thông tin đăng nhập vào localStorage & sessionStorage
        const userData = {
          id: data.id,
          email: data.email,
          phoneNumber: data.phoneNumber,
          fullName: data.fullName,
          role: data.role,
          avatar: data.avatar,
          token: data.token,
        };

        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('user_role', data.role);
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('userName', data.fullName || data.email);
        sessionStorage.setItem('userRole', data.role);

        return { success: true, message: data.message || 'Đăng nhập thành công!', user: userData };
      } else {
        return { success: false, message: data.message || 'Đăng nhập thất bại. Vui lòng thử lại!' };
      }
    } catch (error) {
      console.error('Backend error during login:', error);
      return { success: false, message: 'Không thể kết nối máy chủ. Vui lòng thử lại sau.' };
    }
  },

  /**
   * Đăng ký tài khoản mới
   */
  async register(registerData) {
    try {
      const response = await fetchAuth('/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        return { success: true, message: data.message || 'Đăng ký thành công!' };
      } else {
        return { success: false, message: data.message || 'Đăng ký không thành công.' };
      }
    } catch (error) {
      console.error('Backend error during register:', error);
      return { success: false, message: 'Không thể kết nối máy chủ. Vui lòng thử lại sau.' };
    }
  },

  /**
   * Xác thực email bằng token
   */
  async verifyEmail(token) {
    try {
      const response = await fetchAuth(`/verify?token=${encodeURIComponent(token)}`, {
        method: 'GET',
      });
      const data = await response.json();
      if (response.ok && data.success) {
        return { success: true, message: data.message || 'Xác thực thành công!' };
      } else {
        return { success: false, message: data.message || 'Xác thực không thành công.' };
      }
    } catch (error) {
      console.warn('Backend error during verify fallback:', error);
      return { success: false, message: 'Lỗi kết nối tới server!' };
    }
  },

  /**
   * Bước 1 Quên mật khẩu: Kiểm tra email có tồn tại không và gửi mã OTP
   */
  async forgotPassword(email) {
    try {
      const response = await fetchAuth('/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.warn('Backend server error during forgotPassword:', error);
      return {
        success: false,
        message: 'Không thể kết nối đến máy chủ backend (cổng 8080/8081). Vui lòng đảm bảo server Spring Boot đang chạy!',
      };
    }
  },

  /**
   * Xác thực mã OTP
   */
  async verifyResetOtp({ email, otp }) {
    try {
      const response = await fetchAuth('/verify-reset-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.warn('Backend error during verify OTP:', error);
      return { success: false, message: 'Lỗi kết nối tới máy chủ!' };
    }
  },

  /**
   * Bước 2 Quên mật khẩu: Đặt lại mật khẩu mới với mã OTP
   */
  async resetPassword({ email, otp, newPassword }) {
    try {
      const response = await fetchAuth('/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.trim(),
          newPassword: newPassword.trim(),
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.warn('Backend error during reset password:', error);
      return { success: false, message: 'Lỗi kết nối tới máy chủ!' };
    }
  },

  /**
   * Lấy thông tin user đang đăng nhập
   */
  getCurrentUser() {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      return null;
    }
  },

  /**
   * Đăng xuất
   */
  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('user_role');
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('userName');
    sessionStorage.removeItem('userRole');
  },

  /**
   * Kiểm tra trực tiếp kết nối tới Database qua API Backend
   */
  async testDbConnection() {
    try {
      const response = await fetchAuth('/public/test-db', { method: 'GET' });
      const data = await response.json();
      return data;
    } catch (err) {
      return { 
        status: 'OFFLINE_DEMO', 
        message: 'Chưa chạy Spring Boot server ở port 8080/8081. Đang dùng chế độ Mock dữ liệu ở Frontend.' 
      };
    }
  }
};
