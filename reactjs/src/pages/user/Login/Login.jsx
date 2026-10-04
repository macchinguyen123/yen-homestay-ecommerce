import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../../../services/authService';
import './Login.css';


export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Role state: 'tourist' | 'owner'
  const [activeRole, setActiveRole] = useState('tourist');

  // Input fields
  const [username, setUsername] = useState('maichi.lehoang@gmail.com');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Forgot password modal
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [resetInput, setResetInput] = useState('');

  // Toast notice
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'host' || roleParam === 'owner') {
      handleSwitchRole('owner');
    } else {
      handleSwitchRole('tourist');
    }
  }, [searchParams]);

  const showToast = (msg, type = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: '', type: 'success' }), 3200);
  };

  const handleSwitchRole = (role) => {
    setActiveRole(role);
    if (role === 'owner') {
      setUsername('chuhoang.homestay@gmail.com');
      setPassword('123456');
    } else {
      setUsername('maichi.lehoang@gmail.com');
      setPassword('123456');
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      showToast('Vui lòng điền đầy đủ Email/SĐT và Mật khẩu!', 'error');
      return;
    }

    setIsLoading(true);
    const result = await authService.login({
      username: username.trim(),
      password: password,
      role: activeRole,
    });
    setIsLoading(false);

    if (result.success) {
      showToast(result.message || 'Đăng nhập thành công!');

      setTimeout(() => {
        const userRole = result.user?.role || (activeRole === 'owner' ? 'OWNER' : 'USER');
        if (userRole === 'OWNER') {
          navigate('/owner/dashboard');
        } else if (userRole === 'ADMIN') {
          navigate('/admin/dashboard');
        } else {
          navigate('/');
        }
      }, 1200);
    } else {
      showToast(result.message || 'Đăng nhập không thành công!', 'error');
    }
  };


  const handleTestDb = async () => {
    setIsLoading(true);
    const result = await authService.testDbConnection();
    setIsLoading(false);
    if (result.status === 'SUCCESS') {
      showToast(`✅ Kết nối Supabase THÀNH CÔNG! DB: ${result.databaseName} (${result.totalUsersInDb} tài khoản)`);
    } else {
      showToast(`⚠️ Status: ${result.status} - ${result.message}`, 'error');
    }
  };

  const handleResetSubmit = (e) => {

    e.preventDefault();
    if (!resetInput.trim()) {
      showToast('Vui lòng nhập Email hoặc SĐT đăng ký!');
      return;
    }
    showToast(`Mã khôi phục đã được gửi tới: ${resetInput}`);
    setForgotModalOpen(false);
    setResetInput('');
  };

  return (
    <div className="login-page">
      {/* 1. BACKGROUND VIDEO OVERLAY */}
      <div className="bg-video-wrapper">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="bg-video"
          poster="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1920&q=80"
        >
          <source
            src="https://res.cloudinary.com/dwnbmfhel/video/upload/v1790141158/YTSave_YouTube_VIETNAM-My-Home-Masew-MyoMouse-Nguyen-Lo_Media_NSnkb1IAjbE_001_1080p_-_Trim_-_Trim_sdbnuc.mp4"
            type="video/mp4"
          />
        </video>
        <div className="bg-video-overlay" />
      </div>

      {/* 2. HEADER BAR */}
      <header className="login-header">
        <Link to="/" className="login-brand">
          <div className="login-logo-box">
            <span className="login-logo-text">YÊN <span>Homestay</span></span>
          </div>
          <div className="login-brand-meta">
            <span className="title">Cộng đồng Homestay Việt Nam</span>
            <span className="sub">Về bản làng, tìm bình yên</span>
          </div>
        </Link>

        <Link to="/" className="btn-home-back">
          <i className="bi bi-house-door" /> Về trang chủ
        </Link>
      </header>

      {/* 3. MAIN LOGIN CARD */}
      <main className="login-main">
        <div className="login-card">
          <div className="login-card-head">
            <h2>Đăng nhập tài khoản</h2>
            <p>Chào mừng bạn quay trở lại với Homestay Việt Nam</p>
            <button
              type="button"
              className="btn btn-sm btn-outline-success mt-2"
              onClick={handleTestDb}
              style={{ fontSize: '0.78rem', borderRadius: 20, padding: '4px 12px' }}
            >
              <i className="bi bi-database-check me-1" /> Kiểm tra kết nối Supabase DB
            </button>
          </div>


          {/* ROLE SWITCHER TABS */}
          <div className="role-tabs">
            <button
              type="button"
              className={`role-tab-btn ${activeRole === 'tourist' ? 'active' : ''}`}
              onClick={() => handleSwitchRole('tourist')}
            >
              <i className="bi bi-person-luggage" /> Khách thuê
            </button>
            <button
              type="button"
              className={`role-tab-btn ${activeRole === 'owner' ? 'active' : ''}`}
              onClick={() => handleSwitchRole('owner')}
            >
              <i className="bi bi-house-heart-fill" /> Chủ Homestay
            </button>
          </div>

          {/* FORM */}
          <form onSubmit={handleLoginSubmit}>
            <div className="login-form-group">
              <label htmlFor="user-input">Email hoặc Số điện thoại <span style={{ color: '#E11D48' }}>*</span></label>
              <div className="input-icon-wrap">
                <i className="bi bi-envelope field-icon" />
                <input
                  type="text"
                  id="user-input"
                  className="login-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="maichi.lehoang@gmail.com hoặc 0912..."
                  required
                />
              </div>
            </div>

            <div className="login-form-group">
              <label htmlFor="pass-input">Mật khẩu <span style={{ color: '#E11D48' }}>*</span></label>
              <div className="input-icon-wrap">
                <i className="bi bi-lock field-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="pass-input"
                  className="login-input"
                  style={{ paddingRight: 40 }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  required
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i className={`bi ${showPassword ? 'bi-eye' : 'bi-eye-slash'}`} />
                </button>
              </div>

              <div style={{ textAlign: 'right', marginTop: 4 }}>
                <button
                  type="button"
                  className="forgot-link-btn"
                  onClick={() => setForgotModalOpen(true)}
                >
                  <i className="bi bi-key" /> Quên mật khẩu?
                </button>
              </div>
            </div>

            <button type="submit" className="btn-submit-login" disabled={isLoading}>
              <span>{isLoading ? 'Đang xử lý kết nối...' : 'Đăng nhập'}</span>
              {isLoading ? (
                <span className="spinner-border spinner-border-sm ms-2" role="status" aria-hidden="true"></span>
              ) : (
                <i className="bi bi-arrow-right" />
              )}
            </button>
          </form>

          {/* SOCIAL LOGIN */}
          <div className="login-divider">
            <span>Hoặc đăng nhập nhanh bằng</span>
          </div>

          <div className="social-btns-grid">
            <button
              type="button"
              className="btn-social"
              onClick={() => {
                showToast('Đăng nhập Google thành công!');
                setTimeout(() => navigate('/'), 1000);
              }}
            >
              <svg style={{ width: 16, height: 16 }} viewBox="0 0 24 24">
                <path d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" fill="#EA4335" />
                <path d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" fill="#4285F4" />
                <path d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z" fill="#FBBC05" />
                <path d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z" fill="#34A853" />
              </svg>
              <span>Google</span>
            </button>

            <button
              type="button"
              className="btn-social"
              onClick={() => {
                showToast('Đăng nhập Facebook thành công!');
                setTimeout(() => navigate('/'), 1000);
              }}
            >
              <i className="bi bi-facebook" style={{ color: '#1877F2', fontSize: '1rem' }} />
              <span>Facebook</span>
            </button>
          </div>

          {/* REGISTER LINKS */}
          <div className="card-register-footer">
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>
              Bạn chưa có tài khoản?
            </span>
            <div className="reg-links-box">
              <Link to="/register?role=guest" className="btn-reg-pill guest">
                <i className="bi bi-person-luggage" /> Đăng ký Khách thuê
              </Link>
              <Link to="/register?role=host" className="btn-reg-pill host">
                <i className="bi bi-house-heart-fill" style={{ color: '#15803D' }} /> Đăng ký Chủ nhà
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* 4. MODAL QUÊN MẬT KHẨU */}
      {forgotModalOpen && (
        <div className="modal-overlay-login">
          <div className="forgot-modal-card">
            <button
              type="button"
              className="forgot-modal-close"
              onClick={() => setForgotModalOpen(false)}
            >
              <i className="bi bi-x-lg" />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: '#DCFCE7', color: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 800 }}>
                <i className="bi bi-key" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>Quên mật khẩu?</h3>
                <p style={{ fontSize: '0.78rem', color: '#64748B', margin: 0 }}>Nhập email hoặc số điện thoại để nhận mã khôi phục</p>
              </div>
            </div>

            <form onSubmit={handleResetSubmit}>
              <div className="login-form-group">
                <label htmlFor="reset-in">Email / Số điện thoại đăng ký</label>
                <input
                  type="text"
                  id="reset-in"
                  className="login-input"
                  style={{ paddingLeft: 14 }}
                  placeholder="Ví dụ: email@gmail.com hoặc 0912..."
                  value={resetInput}
                  onChange={(e) => setResetInput(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
                <button
                  type="button"
                  className="btn-social"
                  onClick={() => setForgotModalOpen(false)}
                >
                  Hủy bỏ
                </button>
                <button type="submit" className="btn-submit-login" style={{ width: 'auto', padding: '8px 18px', marginTop: 0 }}>
                  Gửi mã khôi phục
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notice */}
      <div className={`toast-notice ${toast.show ? 'show' : ''}`} style={toast.type === 'error' ? { background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B' } : {}}>
        <i className={`bi ${toast.type === 'error' ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'}`} style={toast.type === 'error' ? { color: '#DC2626' } : {}} />
        <span>{toast.msg}</span>
      </div>
    </div>
  );
}

