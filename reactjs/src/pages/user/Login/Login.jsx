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
  const [forgotStep, setForgotStep] = useState(1); // 1: Kiểm tra Email & Gửi OTP, 2: Nhập OTP & Đổi mật khẩu
  const [resetInput, setResetInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

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
    setForgotStep(1);
    setResetInput(username.includes('@') ? username : '');
    setOtpInput('');
    setNewPasswordInput('');
    setResetError('');
    setResetSuccess('');
    setForgotModalOpen(true);
  };

  const closeForgotPasswordModal = () => {
    setForgotModalOpen(false);
    setResetLoading(false);
    setResetError('');
    setResetSuccess('');
  };

  // Bước 1: Kiểm tra Email xem có tồn tại không và gửi mã OTP
  const handleCheckEmailAndSendOtp = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    const emailToVerify = resetInput.trim();
    if (!emailToVerify) {
      setResetError('Vui lòng nhập địa chỉ email đăng ký!');
      return;
    }

    setResetLoading(true);

    try {
      const res = await authService.forgotPassword(emailToVerify);
      if (res && res.success) {
        // Tìm thấy email -> Xuất thông báo và chuyển sang bước tiếp theo
        setResetSuccess(res.message || 'Đã tìm thấy tài khoản! Mã xác nhận (OTP) đã được gửi đến email của bạn.');
        setForgotStep(2);
      } else {
        // Không tìm thấy email -> Xuất thông báo lỗi và giữ nguyên ở bước 1 để nhập lại
        setResetError(res?.message || 'Email này chưa được đăng ký trong hệ thống! Vui lòng kiểm tra lại.');
      }
    } catch (err) {
      setResetError('Lỗi kết nối khi gửi yêu cầu. Vui lòng thử lại!');
    } finally {
      setResetLoading(false);
    }
  };

  // Bước 2: Nhập OTP và đặt mật khẩu mới
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    if (!otpInput.trim() || !newPasswordInput.trim()) {
      setResetError('Vui lòng nhập đầy đủ mã OTP và mật khẩu mới!');
      return;
    }

    if (newPasswordInput.length < 6) {
      setResetError('Mật khẩu mới phải có tối thiểu 6 ký tự!');
      return;
    }

    setResetLoading(true);

    try {
      const res = await authService.resetPassword({
        email: resetInput.trim(),
        otp: otpInput.trim(),
        newPassword: newPasswordInput.trim(),
      });

      if (res && res.success) {
        alert(res.message || 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới.');
        setPassword(newPasswordInput.trim());
        setUsername(resetInput.trim());
        closeForgotPasswordModal();
      } else {
        setResetError(res?.message || 'Mã OTP không chính xác hoặc đã hết hạn!');
      }
    } catch (err) {
      setResetError('Lỗi kết nối khi đặt lại mật khẩu!');
    } finally {
      setResetLoading(false);
    }
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
        const userRole = (dbUser.role || (activeRole === 'admin' ? 'ADMIN' : activeRole === 'owner' ? 'OWNER' : 'USER')).toUpperCase();

        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('userName', dbUser.fullName || dbUser.email);
        sessionStorage.setItem('userRole', userRole === 'OWNER' ? 'host' : userRole === 'ADMIN' ? 'admin' : 'guest');

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

          {/* Role Switcher Tabs (Khách thuê / Chủ Homestay / Admin) */}
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
            <button
              className={`login-role-tab ${activeRole === 'admin' ? 'active' : ''}`}
              id="tab-admin"
              onClick={() => switchRole('admin')}
              type="button"
            >
              <i className="bi bi-shield-lock-fill" />
              <span>Admin</span>
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
                    activeRole === 'admin'
                      ? 'admin@yenhomestay.com'
                      : activeRole === 'owner'
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

      {/* Modal Quên mật khẩu - Kiểm tra email và gửi OTP */}
      {forgotModalOpen && (
        <div
          id="forgot-password-modal"
          className="login-modal-overlay"
          onClick={(e) => {
            if (e.target.id === 'forgot-password-modal') closeForgotPasswordModal();
          }}
        >
          <div className="login-modal-box" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={closeForgotPasswordModal}
              className="login-modal-close"
              aria-label="Đóng"
            >
              <i className="bi bi-x-lg" />
            </button>

            <div className="login-modal-head">
              <div className="login-modal-icon-badge">
                <i className={forgotStep === 1 ? "bi bi-envelope-check" : "bi bi-shield-lock"} />
              </div>
              <div>
                <h3>{forgotStep === 1 ? 'Quên mật khẩu?' : 'Nhập mã OTP & Đặt mật khẩu mới'}</h3>
                <p>
                  {forgotStep === 1
                    ? 'Nhập email để hệ thống kiểm tra và gửi mã xác nhận'
                    : `Mã OTP đã được gửi đến: ${resetInput}`}
                </p>
              </div>
            </div>

            {/* Thông báo lỗi (ví dụ: email chưa tồn tại, mã OTP sai) */}
            {resetError && (
              <div className="login-modal-alert error">
                <i className="bi bi-exclamation-triangle-fill" />
                <span>{resetError}</span>
              </div>
            )}

            {/* Thông báo thành công khi tìm thấy email */}
            {resetSuccess && (
              <div className="login-modal-alert success">
                <i className="bi bi-check-circle-fill" />
                <span>{resetSuccess}</span>
              </div>
            )}

            {/* BƯỚC 1: KIỂM TRA EMAIL TRONG HỆ THỐNG */}
            {forgotStep === 1 ? (
              <form onSubmit={handleCheckEmailAndSendOtp} className="login-form">
                <div className="login-form-group">
                  <label className="login-label">
                    Email đăng ký tài khoản <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="reset-input"
                    className="login-input"
                    placeholder="Ví dụ: your-email@gmail.com"
                    value={resetInput}
                    onChange={(e) => {
                      setResetInput(e.target.value);
                      if (resetError) setResetError('');
                    }}
                    required
                    autoFocus
                  />
                  <span className="login-helper-text">
                    Hệ thống sẽ kiểm tra xem email này đã tồn tại chưa rồi mới gửi mã OTP.
                  </span>
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
                    disabled={resetLoading}
                    className="login-modal-submit-btn"
                  >
                    {resetLoading ? 'Đang kiểm tra...' : 'Tiếp tục'}
                  </button>
                </div>
              </form>
            ) : (
              /* BƯỚC 2: NHẬP MÃ OTP VÀ MẬT KHẨU MỚI */
              <form onSubmit={handleResetPasswordSubmit} className="login-form">
                <div className="login-form-group">
                  <label className="login-label">
                    Mã xác nhận OTP (6 số) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="otp-input"
                    maxLength={6}
                    className="login-input"
                    style={{ textAlign: 'center', fontWeight: 'bold', letterSpacing: '6px', fontSize: '18px' }}
                    placeholder="123456"
                    value={otpInput}
                    onChange={(e) => {
                      setOtpInput(e.target.value);
                      if (resetError) setResetError('');
                    }}
                    required
                    autoFocus
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <span className="login-helper-text">Mã có hiệu lực trong 15 phút</span>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotStep(1);
                        setResetError('');
                        setResetSuccess('');
                      }}
                      style={{ fontSize: '12px', color: '#15803D', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      Đổi email khác
                    </button>
                  </div>
                </div>

                <div className="login-form-group">
                  <label className="login-label">
                    Mật khẩu mới <span className="text-red-500">*</span>
                  </label>
                  <div className="login-input-wrapper">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      id="new-password-input"
                      className="login-input"
                      placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                      value={newPasswordInput}
                      onChange={(e) => {
                        setNewPasswordInput(e.target.value);
                        if (resetError) setResetError('');
                      }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      className="login-toggle-pw-btn"
                    >
                      <i className={`bi ${showNewPassword ? 'bi-eye' : 'bi-eye-slash'}`} />
                    </button>
                  </div>
                </div>

                <div className="login-modal-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep(1);
                      setResetError('');
                      setResetSuccess('');
                    }}
                    className="login-modal-cancel-btn"
                  >
                    Quay lại
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="login-modal-submit-btn"
                  >
                    {resetLoading ? 'Đang xử lý...' : 'Xác nhận đổi mật khẩu'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
