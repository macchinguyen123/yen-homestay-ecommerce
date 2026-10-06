const API_BASE_URL = 'http://localhost:8080/api/auth';

/**
 * Service xử lý đăng nhập & phân quyền với Backend Spring Boot & Supabase DB
 */
export const authService = {
  /**
   * Đăng nhập người dùng bằng email/sđt và mật khẩu
   */
  async login({ username, password, role }) {
    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
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
      console.warn('Backend server not reachable or network error, fallback to offline demo auth:', error);
      // Fallback cho demo nếu server backend chưa được bật ở local
      const mockRole = role === 'owner' ? 'OWNER' : 'USER';
      const mockName = username.includes('chuhoang') ? 'Nguyễn Văn Hoàng (Chủ Homestay)' : 'Lê Hoàng Mai Chi';
      const mockData = {
        id: 1,
        email: username,
        fullName: mockName,
        role: mockRole,
        token: 'MOCK_TOKEN_OFFLINE',
      };
      
      localStorage.setItem('user', JSON.stringify(mockData));
      localStorage.setItem('user_role', mockRole);
      sessionStorage.setItem('isLoggedIn', 'true');
      sessionStorage.setItem('userName', mockName);
      sessionStorage.setItem('userRole', mockRole);

      return { success: true, message: `Đăng nhập (Demo Mode) thành công với tài khoản ${mockName}!`, user: mockData };
    }
  },

  /**
   * Đăng ký tài khoản mới
   */
  async register(registerData) {
    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
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
      console.warn('Backend error during register fallback:', error);
      return { success: true, message: 'Đăng ký thành công (chế độ Demo)!' };
    }
  },

  /**
   * Xác thực email bằng token
   */
  async verifyEmail(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/verify?token=${token}`);
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
   * Kiểm tra trực tiếp kết nối tới Supabase Database qua API Backend
   */
  async testDbConnection() {
    try {
      const response = await fetch('http://localhost:8080/api/public/test-db');
      const data = await response.json();
      return data;
    } catch (err) {
      return { 
        status: 'OFFLINE_DEMO', 
        message: 'Chưa chạy Spring Boot server ở port 8080. Đang dùng chế độ Mock dữ liệu ở Frontend.' 
      };
    }
  }
};

