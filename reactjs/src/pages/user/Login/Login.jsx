import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../../../services/authService';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Role: 'tourist' | 'owner'
  const [activeRole, setActiveRole] = useState('tourist');

  // Input states - Không dùng tài khoản mẫu, bắt buộc nhập từ CSDL
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password modal state
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [resetInput, setResetInput] = useState('');

  const switchRole = (role) => {
    setActiveRole(role);
  };

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'host' || roleParam === 'owner') {
      setActiveRole('owner');
    } else {
      setActiveRole('tourist');
    }
  }, [searchParams]);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const openForgotPasswordModal = () => {
    setForgotModalOpen(true);
  };

  const closeForgotPasswordModal = () => {
    setForgotModalOpen(false);
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    alert('Mã khôi phục mật khẩu đã được gửi tới: ' + resetInput);
    closeForgotPasswordModal();
    setResetInput('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      alert('Vui lòng nhập đầy đủ Email/SĐT và Mật khẩu!');
      return;
    }

    try {
      // Gửi yêu cầu xác thực trực tiếp tới CSDL thông qua API
      const result = await authService.login({
        username: username.trim(),
        password: password,
        role: activeRole,
      });

      if (result && result.success && result.user) {
        // Lưu thông tin người dùng thực tế lấy từ CSDL (fullName, role, email, ...)
        const dbUser = result.user;
        const userRole = (dbUser.role || (activeRole === 'owner' ? 'OWNER' : 'USER')).toUpperCase();

        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('userName', dbUser.fullName || dbUser.email);
        sessionStorage.setItem('userRole', userRole === 'OWNER' ? 'host' : 'guest');

        localStorage.setItem('user_role', userRole);
        localStorage.setItem('user', JSON.stringify(dbUser));

        // Chuyển hướng chính xác theo vai trò trong CSDL
        if (userRole === 'ADMIN') {
          navigate('/admin/dashboard');
        } else if (userRole === 'OWNER') {
          navigate('/owner/dashboard');
        } else {
          navigate('/');
        }
      } else {
        // Thông báo lỗi chuẩn từ CSDL nếu tài khoản hoặc mật khẩu sai
        alert(result?.message || 'Tài khoản hoặc mật khẩu không chính xác!');
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ hoặc cơ sở dữ liệu!');
    }
  };

  return (
    <div className="login-root">
      {/* Full Screen Background Video (1080p HD Native & Crystal Clear) */}
      <div className="login-video-wrapper">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="login-video"
        >
          <source
            src="https://res.cloudinary.com/dwnbmfhel/video/upload/v1790141158/YTSave_YouTube_VIETNAM-My-Home-Masew-MyoMouse-Nguyen-Lo_Media_NSnkb1IAjbE_001_1080p_-_Trim_-_Trim_sdbnuc.mp4"
            type="video/mp4"
          />
          <iframe
            className="login-iframe"
            src="https://www.youtube.com/embed/NSnkb1IAjbE?autoplay=1&mute=1&loop=1&playlist=NSnkb1IAjbE&controls=0&showinfo=0&rel=0&enablejsapi=1&iv_load_policy=3&modestbranding=1&playsinline=1&vq=hd1080"
            allow="autoplay; encrypted-media"
            title="Background Video"
          />
        </video>
      </div>

      {/* Header Navigation Bar */}
      <header className="login-header">
        <Link className="login-logo-link" to="/">
          <div className="login-logo-icon-box">
            <img src="/logo_white.png" alt="Homestay Logo" className="login-logo-img" />
          </div>
          <div className="login-logo-text-box">
            <span className="login-logo-title">Cộng đồng Homestay Việt Nam</span>
            <span className="login-logo-sub">Về bản làng, tìm bình yên</span>
          </div>
        </Link>
        <div className="login-header-action">
          <Link className="login-home-btn" to="/">
            <i className="bi bi-house-door" />
            <span>Về trang chủ</span>
          </Link>
        </div>
      </header>

      {/* Right-aligned Login Box */}
      <main className="login-main">
        <div className="login-card">
          {/* Header Title */}
          <div className="login-card-header">
            <h2 className="login-card-title">
              Đăng nhập tài khoản
            </h2>
            <p className="login-card-subtitle">Chào mừng bạn quay trở lại với Homestay Việt Nam</p>
          </div>

          {/* Role Switcher Tabs (Khách thuê / Chủ Homestay) */}
          <div className="login-role-tabs">
            <button
              className={`login-role-tab ${activeRole === 'tourist' ? 'active' : ''}`}
              id="tab-tourist"
              onClick={() => switchRole('tourist')}
              type="button"
            >
              <i className="bi bi-person-luggage" />
              <span>Khách thuê</span>
            </button>
            <button
              className={`login-role-tab ${activeRole === 'owner' ? 'active' : ''}`}
              id="tab-owner"
              onClick={() => switchRole('owner')}
              type="button"
            >
              <i className="bi bi-house-heart-fill" />
              <span>Chủ Homestay</span>
            </button>
          </div>

          {/* Form Inputs */}
          <form id="login-form" className="login-form" onSubmit={handleLogin}>
            {/* Email / Phone */}
            <div className="login-form-group">
              <label className="login-label" htmlFor="username-input">
                Email hoặc Số điện thoại <span className="login-required">*</span>
              </label>
              <div className="login-input-group">
                <div className="login-input-icon">
                  <i className="bi bi-envelope" />
                </div>
                <input
                  className="login-input"
                  id="username-input"
                  placeholder={
                    activeRole === 'owner'
                      ? 'chuhoang.homestay@gmail.com hoặc 0987...'
                      : 'maichi.lehoang@gmail.com hoặc 0912...'
                  }
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="login-form-group">
              <label className="login-label" htmlFor="password-input">
                Mật khẩu <span className="login-required">*</span>
              </label>
              <div className="login-input-group">
                <div className="login-input-icon">
                  <i className="bi bi-lock" />
                </div>
                <input
                  className="login-input login-input-password"
                  id="password-input"
                  placeholder="Nhập mật khẩu"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  className="login-input-toggle-btn"
                  onClick={togglePasswordVisibility}
                  type="button"
                  id="eye-button"
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  <i className={`bi ${showPassword ? 'bi-eye' : 'bi-eye-slash'}`} id="eye-icon" />
                </button>
              </div>
              {/* Quên mật khẩu link */}
              <div className="login-forgot-wrap">
                <button
                  type="button"
                  onClick={openForgotPasswordModal}
                  className="login-forgot-btn"
                >
                  <i className="bi bi-key" />
                  <span>Quên mật khẩu?</span>
                </button>
              </div>
            </div>

            {/* Primary CTA Button */}
            <button className="login-submit-btn" type="submit">
              <span>Đăng nhập</span>
              <i className="bi bi-arrow-right" />
            </button>
          </form>

          {/* Divider */}
          <div className="login-divider">
            <div className="login-divider-line" />
            <span className="login-divider-text">Hoặc đăng nhập nhanh bằng</span>
          </div>

          {/* Social Logins */}
          <div className="login-social-grid">
            <button
              className="login-social-btn"
              type="button"
              onClick={() => {
                alert('Đăng nhập Google thành công!');
                navigate('/');
              }}
            >
              <svg className="login-social-svg" width="16" height="16" viewBox="0 0 24 24">
                <path
                  d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                  fill="#EA4335"
                />
                <path
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                  fill="#4285F4"
                />
                <path
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
                  fill="#34A853"
                />
              </svg>
              <span>Google</span>
            </button>
            <button
              className="login-social-btn"
              type="button"
              onClick={() => {
                alert('Đăng nhập Facebook thành công!');
                navigate('/');
              }}
            >
              <i className="bi bi-facebook login-fb-icon" />
              <span>Facebook</span>
            </button>
          </div>

          {/* Bottom Registration Links (Nối sang register với role) */}
          <div className="login-register-footer">
            <div className="login-register-note">
              <span>Bạn chưa có tài khoản?</span>
            </div>
            <div className="login-register-links">
              <Link
                className={`login-reg-btn ${activeRole === 'tourist' ? 'active' : ''}`}
                to="/register?role=guest"
                id="link-reg-guest"
              >
                <i className="bi bi-person-luggage" />
                <span>Đăng ký Khách thuê</span>
              </Link>
              <Link
                className={`login-reg-btn ${activeRole === 'owner' ? 'active' : ''}`}
                to="/register?role=host"
                id="link-reg-host"
              >
                <i className="bi bi-house-heart-fill" />
                <span>Đăng ký Chủ nhà</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Modal Quên mật khẩu */}
      {forgotModalOpen && (
        <div id="forgot-password-modal" className="login-modal-overlay">
          <div className="login-modal-box">
            <button
              type="button"
              onClick={closeForgotPasswordModal}
              className="login-modal-close"
            >
              <i className="bi bi-x-lg" />
            </button>

            <div className="login-modal-head">
              <div className="login-modal-icon-badge">
                <i className="bi bi-key" />
              </div>
              <div>
                <h3>Quên mật khẩu?</h3>
                <p>Nhập email hoặc số điện thoại để nhận mã khôi phục</p>
              </div>
            </div>

            <form onSubmit={handleResetPassword} className="login-form">
              <div className="login-form-group">
                <label className="login-label">
                  Email / Số điện thoại đăng ký
                </label>
                <input
                  type="text"
                  id="reset-input"
                  className="login-input"
                  placeholder="Ví dụ: email@gmail.com hoặc 0912..."
                  value={resetInput}
                  onChange={(e) => setResetInput(e.target.value)}
                  required
                />
              </div>

              <div className="login-modal-actions">
                <button
                  type="button"
                  onClick={closeForgotPasswordModal}
                  className="login-modal-cancel-btn"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="login-modal-submit-btn"
                >
                  Gửi mã khôi phục
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
