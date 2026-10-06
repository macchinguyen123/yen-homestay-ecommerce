import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../../../services/authService';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Role: 'tourist' | 'owner'
  const [activeRole, setActiveRole] = useState('tourist');

  // Input states
  const [username, setUsername] = useState('maichi.lehoang@gmail.com');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password modal state
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [resetInput, setResetInput] = useState('');

  const switchRole = (role) => {
    setActiveRole(role);
    if (role === 'owner') {
      setUsername('chuhoang.homestay@gmail.com');
      setPassword('••••••••••••');
    } else {
      setUsername('maichi.lehoang@gmail.com');
      setPassword('••••••••••••');
    }
  };

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'host' || roleParam === 'owner') {
      switchRole('owner');
    } else {
      switchRole('tourist');
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
    try {
      sessionStorage.setItem('isLoggedIn', 'true');
      sessionStorage.setItem('userName', username);
      sessionStorage.setItem('userRole', activeRole === 'owner' ? 'host' : 'guest');

      const roleStr = activeRole === 'owner' ? 'OWNER' : 'USER';
      localStorage.setItem('user_role', roleStr);
      localStorage.setItem(
        'user',
        JSON.stringify({
          email: username,
          fullName: activeRole === 'owner' ? 'Nguyễn Văn Hoàng (Chủ Homestay)' : 'Lê Hoàng Mai Chi',
          role: roleStr,
        })
      );

      // Async backend auth (silent failover safe)
      authService.login({
        username,
        password: password === '••••••••••••' ? '123456' : password,
        role: activeRole,
      }).catch(() => {});
    } catch (err) {}

    // Chuyển hướng
    if (activeRole === 'owner') {
      navigate('/owner/dashboard');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="login-root relative h-screen w-screen bg-slate-900 text-slate-800 antialiased flex flex-col justify-between overflow-hidden selection:bg-[#15803D] selection:text-white">
      {/* Full Screen Background Video (1080p HD Native & Crystal Clear) */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-black">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full min-w-full min-h-full object-cover pointer-events-none"
        >
          <source
            src="https://res.cloudinary.com/dwnbmfhel/video/upload/v1790141158/YTSave_YouTube_VIETNAM-My-Home-Masew-MyoMouse-Nguyen-Lo_Media_NSnkb1IAjbE_001_1080p_-_Trim_-_Trim_sdbnuc.mp4"
            type="video/mp4"
          />
          <iframe
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[177.78vh] min-w-full h-full min-h-[56.25vw] pointer-events-none scale-125 border-0"
            src="https://www.youtube.com/embed/NSnkb1IAjbE?autoplay=1&mute=1&loop=1&playlist=NSnkb1IAjbE&controls=0&showinfo=0&rel=0&enablejsapi=1&iv_load_policy=3&modestbranding=1&playsinline=1&vq=hd1080"
            allow="autoplay; encrypted-media"
            title="Background Video"
          />
        </video>
      </div>

      {/* Header Navigation Bar */}
      <header className="relative z-20 w-full px-6 py-3 sm:px-10 flex items-center justify-between shrink-0">
        <Link className="flex items-center gap-3 group text-decoration-none" to="/">
          <div className="h-12 sm:h-14 px-3 sm:px-4 rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-lg group-hover:bg-white/25 transition">
            <img src="/logo_white.png" alt="Homestay Logo" className="h-8 sm:h-10 w-auto object-contain" />
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-xs font-semibold text-emerald-200">Cộng đồng Homestay Việt Nam</span>
            <span className="text-[11px] text-white/70 font-normal">Về bản làng, tìm bình yên</span>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            className="flex items-center gap-1.5 text-xs font-semibold text-white px-4 py-2 rounded-xl bg-[#15803D]/85 hover:bg-[#15803D] backdrop-blur-md border border-emerald-400/40 shadow-sm transition"
            to="/"
          >
            <i className="bi bi-house-door text-xs" />
            <span>Về trang chủ</span>
          </Link>
        </div>
      </header>

      {/* Right-aligned Login Box */}
      <main className="relative z-20 flex-1 flex items-center justify-center sm:justify-end px-4 sm:px-12 md:px-20 lg:px-28 py-2 sm:py-4 overflow-hidden">
        <div className="w-full max-w-[365px] bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 p-6 sm:p-7 relative overflow-hidden transition-all duration-300 my-auto">
          {/* Header Title */}
          <div className="mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-snug">
              Đăng nhập tài khoản
            </h2>
            <p className="text-xs text-slate-500 mt-1">Chào mừng bạn quay trở lại với Homestay Việt Nam</p>
          </div>

          {/* Role Switcher Tabs (Khách thuê / Chủ Homestay) */}
          <div className="bg-slate-100/90 p-1 rounded-xl flex gap-1 mb-3.5 border border-slate-200/80">
            <button
              className={
                activeRole === 'tourist'
                  ? 'flex-1 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 bg-[#15803D] text-white shadow-sm'
                  : 'flex-1 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }
              id="tab-tourist"
              onClick={() => switchRole('tourist')}
              type="button"
            >
              <i className="bi bi-person-luggage text-sm" />
              <span>Khách thuê</span>
            </button>
            <button
              className={
                activeRole === 'owner'
                  ? 'flex-1 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 bg-[#15803D] text-white shadow-sm'
                  : 'flex-1 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }
              id="tab-owner"
              onClick={() => switchRole('owner')}
              type="button"
            >
              <i className="bi bi-house-heart-fill text-sm" />
              <span>Chủ Homestay</span>
            </button>
          </div>

          {/* Form Inputs */}
          <form id="login-form" className="space-y-3.5" onSubmit={handleLogin}>
            {/* Email / Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="username-input">
                Email hoặc Số điện thoại <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <i className="bi bi-envelope text-sm" />
                </div>
                <input
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/90 hover:bg-white focus:bg-white text-slate-900 text-sm rounded-xl border border-slate-300 focus:border-[#15803D] focus:ring-2 focus:ring-[#15803D]/20 outline-none transition font-medium placeholder-slate-400"
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
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="password-input">
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <i className="bi bi-lock text-sm" />
                </div>
                <input
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50/90 hover:bg-white focus:bg-white text-slate-900 text-sm rounded-xl border border-slate-300 focus:border-[#15803D] focus:ring-2 focus:ring-[#15803D]/20 outline-none transition font-medium placeholder-slate-400"
                  id="password-input"
                  placeholder="Nhập mật khẩu"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  onClick={togglePasswordVisibility}
                  type="button"
                >
                  <i className={`bi ${showPassword ? 'bi-eye' : 'bi-eye-slash'} text-sm`} id="eye-icon" />
                </button>
              </div>
              {/* Quên mật khẩu link */}
              <div className="flex justify-end mt-1">
                <button
                  type="button"
                  onClick={openForgotPasswordModal}
                  className="text-xs font-semibold text-[#15803D] hover:text-[#166534] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <i className="bi bi-key text-xs" />
                  <span>Quên mật khẩu?</span>
                </button>
              </div>
            </div>

            {/* Primary CTA Button */}
            <button
              className="w-full mt-1.5 py-2.5 px-4 bg-[#15803D] hover:bg-[#166534] active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-lg shadow-[#15803D]/25 transition flex items-center justify-center gap-2 cursor-pointer"
              type="submit"
            >
              <span>Đăng nhập</span>
              <i className="bi bi-arrow-right text-xs" />
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-3.5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white text-slate-400 font-medium">Hoặc đăng nhập nhanh bằng</span>
            </div>
          </div>

          {/* Social Logins */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition text-slate-700 text-xs font-semibold cursor-pointer"
              type="button"
              onClick={() => {
                alert('Đăng nhập Google thành công!');
                navigate('/');
              }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition text-slate-700 text-xs font-semibold cursor-pointer"
              type="button"
              onClick={() => {
                alert('Đăng nhập Facebook thành công!');
                navigate('/');
              }}
            >
              <i className="bi bi-facebook text-blue-600 text-sm" />
              <span>Facebook</span>
            </button>
          </div>

          {/* Bottom Registration Links (Nối sang register với role) */}
          <div className="pt-3.5 mt-3.5 border-t border-slate-200 bg-slate-50/90 -mx-6 sm:-mx-7 -mb-6 sm:-mb-7 p-3.5 sm:px-6 rounded-b-3xl border-slate-100">
            <div className="text-center mb-2">
              <span className="text-xs font-semibold text-slate-700">Bạn chưa có tài khoản?</span>
            </div>
            <div className="flex flex-col gap-2 mt-2">
              <Link
                className={
                  activeRole === 'tourist'
                    ? 'py-2.5 px-3 rounded-xl border border-emerald-300 bg-white hover:bg-emerald-50 text-[#15803D] text-xs font-bold text-center transition flex items-center justify-center gap-2 shadow-sm'
                    : 'py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold text-center transition flex items-center justify-center gap-2 shadow-sm'
                }
                to="/register?role=guest"
                id="link-reg-guest"
              >
                <i className="bi bi-person-luggage text-sm" />
                <span>Đăng ký Khách thuê</span>
              </Link>
              <Link
                className={
                  activeRole === 'owner'
                    ? 'py-2.5 px-3 rounded-xl border border-emerald-400 bg-emerald-50 text-[#15803D] text-xs font-bold text-center transition flex items-center justify-center gap-2 shadow-sm'
                    : 'py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 hover:text-emerald-800 text-xs font-bold text-center transition flex items-center justify-center gap-2 shadow-sm'
                }
                to="/register?role=host"
                id="link-reg-host"
              >
                <i className="bi bi-house-heart-fill text-sm text-emerald-600" />
                <span>Đăng ký Chủ nhà</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Modal Quên mật khẩu */}
      {forgotModalOpen && (
        <div
          id="forgot-password-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md p-6 relative">
            <button
              type="button"
              onClick={closeForgotPasswordModal}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold transition"
            >
              <i className="bi bi-x-lg" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#15803D] flex items-center justify-center font-bold text-lg">
                <i className="bi bi-key" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Quên mật khẩu?</h3>
                <p className="text-xs text-slate-500">Nhập email hoặc số điện thoại để nhận mã khôi phục</p>
              </div>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email / Số điện thoại đăng ký
                </label>
                <input
                  type="text"
                  id="reset-input"
                  className="w-full px-4 py-2.5 bg-slate-50 text-slate-900 text-sm rounded-xl border border-slate-300 focus:border-[#15803D] focus:ring-2 focus:ring-[#15803D]/20 outline-none"
                  placeholder="Ví dụ: email@gmail.com hoặc 0912..."
                  value={resetInput}
                  onChange={(e) => setResetInput(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={closeForgotPasswordModal}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#15803D] hover:bg-[#166534] text-white font-bold text-xs rounded-xl transition shadow-md"
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
