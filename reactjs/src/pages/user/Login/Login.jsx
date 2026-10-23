import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { authService } from '../../../services/authService';
import { userService } from '../../../services/userService';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Input states - Bắt buộc nhập tài khoản từ CSDL
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

  // Modal & Cảnh báo đẹp khi Email Google chưa có trong CSDL
  const [unregisteredModalOpen, setUnregisteredModalOpen] = useState(false);
  const [unregisteredData, setUnregisteredData] = useState({ email: '', name: '', avatar: '' });
  const [unregisteredAlert, setUnregisteredAlert] = useState('');

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
      });

      if (result && result.success && result.user) {
        const dbUser = result.user;
        const rawRole = (dbUser.role || 'USER').toUpperCase();

        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('userName', dbUser.fullName || dbUser.email);
        sessionStorage.setItem('userId', String(dbUser.id));

        let normalizedRole = 'USER';
        let sessionRole = 'guest';

        if (rawRole === 'ADMIN') {
          normalizedRole = 'ADMIN';
          sessionRole = 'admin';
        } else if (rawRole === 'OWNER' || rawRole === 'HOST') {
          normalizedRole = 'OWNER';
          sessionRole = 'host';
        } else {
          normalizedRole = 'TOURIST';
          sessionRole = 'guest';
        }

        sessionStorage.setItem('userRole', sessionRole);
        localStorage.setItem('user_role', normalizedRole);
        localStorage.setItem('user', JSON.stringify(dbUser));

        // Kích hoạt cập nhật trạng thái người dùng trên Header & toàn hệ thống
        window.dispatchEvent(new Event('storage'));

        // Phân quyền điều hướng tự động chính xác theo vai trò trong CSDL
        if (normalizedRole === 'ADMIN') {
          navigate('/admin/dashboard');
        } else if (normalizedRole === 'OWNER') {
          navigate('/owner/dashboard');
        } else {
          const redirectUrl = searchParams.get('redirect');
          if (redirectUrl) {
            navigate(redirectUrl);
          } else {
            navigate('/');
          }
        }
      } else {
        // Thông báo lỗi chuẩn từ CSDL nếu tài khoản hoặc mật khẩu sai
        alert(result?.message || 'Tài khoản hoặc mật khẩu không chính xác!');
      }
    } catch (err) {
      alert('Lỗi kết nối máy chủ hoặc cơ sở dữ liệu!');
    }
  };

  const [googleLoading, setGoogleLoading] = useState(false);

  /**
   * Đăng nhập bằng Google: lấy ID Token từ Google rồi gửi lên backend xác thực.
   * Dùng flow "implicit" để nhận id_token trực tiếp.
   */
  const handleGoogleLogin = useGoogleLogin({
    flow: 'implicit',
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      try {
        // tokenResponse.access_token dùng để lấy userInfo từ Google
        // Sau đó gửi lên backend thông qua userinfo endpoint
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const userInfo = await userInfoRes.json();
        const googleEmail = userInfo?.email?.toLowerCase()?.trim();

        if (!googleEmail) {
          alert('Không tìm thấy địa chỉ email từ tài khoản Google của bạn. Vui lòng thử lại!');
          return;
        }

        // BƯỚC 1: Bắt buộc kiểm tra trực tiếp vào CSDL Neon xem email đã tồn tại hay chưa
        const existsInDb = await userService.checkEmailExists(googleEmail);
        if (!existsInDb) {
          setUnregisteredData({
            email: userInfo.email,
            name: userInfo.name || '',
            avatar: userInfo.picture || '',
          });
          setUnregisteredAlert(userInfo.email);
          setUnregisteredModalOpen(true);
          return;
        }

        // BƯỚC 2: Nếu email ĐÃ CÓ trong CSDL -> Mới gửi lên backend xác thực phiên đăng nhập
        const result = await authService.loginWithGoogleUserInfo({
          email: userInfo.email,
          fullName: userInfo.name,
          avatar: userInfo.picture,
          googleId: userInfo.sub,
        });

        if (result && result.success && result.user) {
          const dbUser = result.user;
          const rawRole = (dbUser.role || 'USER').toUpperCase();
          let normalizedRole = 'TOURIST';
          let sessionRole = 'guest';
          if (rawRole === 'ADMIN') { normalizedRole = 'ADMIN'; sessionRole = 'admin'; }
          else if (rawRole === 'OWNER' || rawRole === 'HOST') { normalizedRole = 'OWNER'; sessionRole = 'host'; }

          sessionStorage.setItem('isLoggedIn', 'true');
          sessionStorage.setItem('userName', dbUser.fullName || dbUser.email);
          sessionStorage.setItem('userId', String(dbUser.id));
          sessionStorage.setItem('userRole', sessionRole);
          localStorage.setItem('user_role', normalizedRole);
          localStorage.setItem('user', JSON.stringify(dbUser));
          window.dispatchEvent(new Event('storage'));

          if (normalizedRole === 'ADMIN') navigate('/admin/dashboard');
          else if (normalizedRole === 'OWNER') navigate('/owner/dashboard');
          else {
            const redirectUrl = searchParams.get('redirect');
            navigate(redirectUrl || '/');
          }
        } else {
          const isNotRegistered = result?.notRegistered || (
            result?.message && (
              result.message.toLowerCase().includes('chưa được đăng ký') ||
              result.message.toLowerCase().includes('chưa tồn tại')
            )
          );

          if (isNotRegistered) {
            setUnregisteredData({
              email: userInfo?.email || result?.email || googleEmail,
              name: userInfo?.name || result?.fullName || '',
              avatar: userInfo?.picture || '',
            });
            setUnregisteredAlert(userInfo?.email || result?.email || googleEmail);
            setUnregisteredModalOpen(true);
          } else {
            alert(result?.message || 'Đăng nhập Google thất bại!');
          }
        }
      } catch (err) {
        alert('Có lỗi xảy ra khi đăng nhập bằng Google. Vui lòng thử lại!');
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => {
      alert('Đăng nhập Google bị hủy hoặc gặp lỗi. Vui lòng thử lại!');
      setGoogleLoading(false);
    },
  });

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

          {/* Cảnh báo đẹp khi email Google chưa có trong CSDL */}
          {unregisteredAlert && (
            <div className="login-card-alert-warning">
              <i className="bi bi-exclamation-triangle-fill" />
              <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Email <strong>{unregisteredAlert}</strong> chưa có trong hệ thống.
                <button
                  type="button"
                  className="login-card-alert-link"
                  onClick={() => {
                    const targetEmail = encodeURIComponent(unregisteredAlert || '');
                    const targetName = encodeURIComponent(unregisteredData.name || '');
                    navigate(`/register?role=guest&email=${targetEmail}&name=${targetName}&from=google`);
                  }}
                  style={{ background: 'none', border: 'none', padding: 0 }}
                >
                  Đăng ký ngay
                </button>
              </div>
              <button
                type="button"
                onClick={() => setUnregisteredAlert('')}
                className="login-card-alert-close"
                aria-label="Đóng cảnh báo"
                title="Đóng"
              >
                <i className="bi bi-x" />
              </button>
            </div>
          )}

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
                  placeholder="Nhập email hoặc số điện thoại của bạn"
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
              id="google-login-btn"
              onClick={() => handleGoogleLogin()}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <>
                  <span className="login-social-spinner" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <svg className="login-social-svg" width="16" height="16" viewBox="0 0 24 24">
                    <path d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" fill="#EA4335" />
                    <path d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" fill="#4285F4" />
                    <path d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z" fill="#FBBC05" />
                    <path d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z" fill="#34A853" />
                  </svg>
                  <span>Google</span>
                </>
              )}
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

          {/* Bottom Registration Links (Nối sang register với role tương ứng) */}
          <div className="login-register-footer">
            <div className="login-register-note">
              <span>Bạn chưa có tài khoản?</span>
            </div>
            <div className="login-register-links">
              <Link
                className="login-reg-btn"
                to="/register?role=guest"
                id="link-reg-guest"
              >
                <i className="bi bi-person-luggage" />
                <span>Đăng ký Khách thuê</span>
              </Link>
              <Link
                className="login-reg-btn"
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

      {/* Modal xác nhận chuyển sang đăng ký khi email Google chưa có tài khoản */}
      {unregisteredModalOpen && (
        <div
          id="unregistered-modal-overlay"
          className="login-modal-overlay"
          onClick={(e) => {
            if (e.target.id === 'unregistered-modal-overlay') setUnregisteredModalOpen(false);
          }}
        >
          <div className="login-unregistered-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="login-unregistered-header">
              <div className="login-unregistered-icon">
                <i className="bi bi-info-circle-fill" />
              </div>
              <h3 className="login-unregistered-title">Tài khoản chưa tồn tại</h3>
            </div>

            <p className="login-unregistered-message">
              Email <strong>{unregisteredData.email}</strong> chưa được đăng ký với tài khoản nào. Bạn có muốn tạo tài khoản mới ngay bây giờ không?
            </p>

            <div className="login-unregistered-btn-row">
              <button
                type="button"
                className="login-unregistered-cancel"
                onClick={() => setUnregisteredModalOpen(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="login-unregistered-confirm"
                onClick={() => {
                  const targetEmail = encodeURIComponent(unregisteredData.email || '');
                  const targetName = encodeURIComponent(unregisteredData.name || '');
                  setUnregisteredModalOpen(false);
                  navigate(`/register?role=guest&email=${targetEmail}&name=${targetName}&from=google`);
                }}
              >
                Đăng ký ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
