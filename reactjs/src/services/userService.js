const API_BASE_URL = 'http://localhost:8080/api/users';

export const userService = {
  /**
   * Lấy thông tin cá nhân của user từ Spring Boot API (Neon DB)
   */
  async getUserProfile(userId) {
    try {
      const response = await fetch(`${API_BASE_URL}/${userId}`);
      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.warn('Lỗi kết nối API lấy thông tin người dùng, sử dụng dữ liệu mặc định:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Cập nhật thông tin cá nhân của user lên Spring Boot API (Neon DB)
   */
  async updateUserProfile(userId, profileData) {
    try {
      const response = await fetch(`${API_BASE_URL}/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Cập nhật thất bại (${response.status})`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.warn('Lỗi kết nối API cập nhật thông tin người dùng:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Đổi mật khẩu tài khoản
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      const response = await fetch(`${API_BASE_URL}/${userId}/password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        return { success: true, message: data.message || 'Đổi mật khẩu thành công!' };
      } else {
        return { success: false, message: data.message || 'Đổi mật khẩu thất bại!' };
      }
    } catch (error) {
      console.warn('Lỗi kết nối API đổi mật khẩu:', error);
      return { success: false, message: 'Lỗi hệ thống hoặc kết nối server!' };
    }
  },

  /**
   * Xác minh số điện thoại
   */
  async verifyPhone(userId, phoneNumber) {
    try {
      const response = await fetch(`${API_BASE_URL}/${userId}/verify-phone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });

      if (!response.ok) {
        throw new Error('Xác minh SĐT không thành công');
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.warn('Lỗi kết nối API xác minh SĐT:', error);
      return { success: false, error: error.message };
    }
  }
};
