import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import './Register.css';

const PROVINCES_DATA = [
  { code: 'HN', name: 'Hà Nội', wards: ['Ba Đình', 'Hoàn Kiếm', 'Tây Hồ', 'Cầu Giấy', 'Đống Đa'] },
  { code: 'DN', name: 'Đà Nẵng', wards: ['Hải Châu', 'Sơn Trà', 'Ngũ Hành Sơn', 'Thanh Khê', 'Cẩm Lệ'] },
  { code: 'HCM', name: 'TP. Hồ Chí Minh', wards: ['Quận 1', 'Quận 3', 'Quận 7', 'Bình Thạnh', 'Thủ Đức'] },
  { code: 'LD', name: 'Lâm Đồng', wards: ['Phường 1 (Đà Lạt)', 'Phường 2 (Đà Lạt)', 'Phường 10 (Đà Lạt)', 'Xã Xuân Thọ'] },
  { code: 'LC', name: 'Lào Cai', wards: ['Phường Sa Pa', 'Xã Tả Van', 'Xã Hầu Thào', 'Xã Mường Hoa'] },
  { code: 'TH', name: 'Thanh Hóa', wards: ['Thị trấn Cành Nàng', 'Xã Thành Lâm (Pù Luông)', 'Xã Cổ Lũng'] },
  { code: 'NB', name: 'Ninh Bình', wards: ['Xã Ninh Hải (Tam Cốc)', 'Xã Trường Yên (Tràng An)', 'Xã Ninh Xuân'] }
];

const COUNTRY_CODES = [
  { code: '+84', name: 'VN (+84)' },
  { code: '+1', name: 'US (+1)' },
  { code: '+81', name: 'JP (+81)' },
  { code: '+82', name: 'KR (+82)' },
  { code: '+33', name: 'FR (+33)' },
  { code: '+49', name: 'DE (+49)' },
  { code: '+44', name: 'UK (+44)' }
];

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Role: 'guest' | 'host'
  const [role, setRole] = useState('guest');

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'host' || roleParam === 'owner') {
      setRole('host');
    } else if (roleParam === 'guest' || roleParam === 'tourist') {
      setRole('guest');
    }
  }, [searchParams]);

  // Step: 1 | 2 | 3
  const [step, setStep] = useState(1);

  // Form State: Guest
  const [guestForm, setGuestForm] = useState({
    name: '',
    dob: '',
    gender: '',
    nationality: 'VN',
    email: '',
    phoneCode: '+84',
    phone: '',
    street: '',
    provinceCode: '',
    ward: '',
    pwd: '',
    pwdConfirm: '',
    terms: false
  });

  // Form State: Host
  const [hostForm, setHostForm] = useState({
    name: '',
    email: '',
    phoneCode: '+84',
    phone: '',
    cccd: '',
    nationality: 'VN',
    bizType: 'ho-kinh-doanh',
    bizName: '',
    taxCode: '',
    bizCode: '',
    bizDate: '',
    bizIssuer: '',
    bank: '',
    bankAcct: '',
    pwd: '',
    pwdConfirm: '',
    terms: false
  });

  // Password visibility
  const [showPwdGuest, setShowPwdGuest] = useState(false);
  const [showPwdConfirmGuest, setShowPwdConfirmGuest] = useState(false);
  const [showPwdHost, setShowPwdHost] = useState(false);
  const [showPwdConfirmHost, setShowPwdConfirmHost] = useState(false);

  // OTP State (Step 2)
  const [otpMethod, setOtpMethod] = useState('email'); // 'email' | 'phone'
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Countdown timer effect for Step 2
  useEffect(() => {
    let timer;
    if (step === 2 && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  const currentGuestProvince = PROVINCES_DATA.find((p) => p.code === guestForm.provinceCode);

  // Form submission handler
  const handleStep1Submit = (e) => {
    e.preventDefault();
    if (role === 'guest') {
      if (!guestForm.name || !guestForm.email || !guestForm.phone || !guestForm.pwd) {
        alert('Vui lòng điền đầy đủ các thông tin bắt buộc (*)');
        return;
      }
      if (guestForm.pwd !== guestForm.pwdConfirm) {
        alert('Mật khẩu nhập lại không khớp!');
        return;
      }
      if (!guestForm.terms) {
        alert('Bạn chưa đồng ý với điều khoản sử dụng');
        return;
      }
    } else {
      if (!hostForm.name || !hostForm.email || !hostForm.phone || !hostForm.cccd || !hostForm.taxCode || !hostForm.bizCode || !hostForm.pwd) {
        alert('Vui lòng điền đầy đủ các thông tin bắt buộc (*)');
        return;
      }
      if (hostForm.pwd !== hostForm.pwdConfirm) {
        alert('Mật khẩu nhập lại không khớp!');
        return;
      }
      if (!hostForm.terms) {
        alert('Bạn chưa đồng ý với chính sách đối tác');
        return;
      }
    }
    setStep(2);
    setCountdown(60);
    setCanResend(false);
  };

  const handleOtpChange = (index, val) => {
    if (val.length > 1) val = val.slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = val;
    setOtpDigits(newDigits);

    // Auto focus next box
    if (val && index < 5) {
      const nextEl = document.getElementById(`otp-box-${index + 1}`);
      if (nextEl) nextEl.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const prevEl = document.getElementById(`otp-box-${index - 1}`);
      if (prevEl) prevEl.focus();
    }
  };

  const handleConfirmOtp = () => {
    const code = otpDigits.join('');
    if (code.length < 6) {
      alert('Vui lòng nhập đủ 6 chữ số mã OTP!');
      return;
    }
    setStep(3);
  };

  const handleResendOtp = () => {
    setCountdown(60);
    setCanResend(false);
    setOtpDigits(['', '', '', '', '', '']);
    alert(`Đã gửi lại mã OTP tới ${otpMethod === 'email' ? (role === 'guest' ? guestForm.email : hostForm.email) : (role === 'guest' ? guestForm.phone : hostForm.phone)}`);
  };

  return (
    <div className="register-page">
      {/* LEFT PANEL: BRANDING */}
      <div className="register-branding d-none d-lg-flex">
        <div className="branding-overlay">
          <div className="branding-content">
            <Link to="/" className="brand-logo mb-4 text-decoration-none">
              <span className="brand-name"><i className="bi bi-house-heart-fill me-2 text-warning"></i>YÊN Homestay</span>
            </Link>
            <h2 className="branding-headline">Khám phá văn hóa bản địa qua từng chuyến đi</h2>
            <p className="branding-sub">
              Tham gia cộng đồng homestay lớn nhất Việt Nam — trải nghiệm du lịch cộng đồng độc đáo hoặc đón tiếp du khách bốn phương.
            </p>
            <div className="branding-stats">
              <div className="stat-item"><span className="stat-num">2.500+</span><span className="stat-label">Homestay xác thực</span></div>
              <div className="stat-item"><span className="stat-num">34</span><span className="stat-label">Tỉnh thành</span></div>
              <div className="stat-item"><span className="stat-num">98%</span><span className="stat-label">Hài lòng</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: FORM */}
      <div className="register-form-panel">
        <div className="form-panel-inner">
          {/* Mobile Logo */}
          <div className="mobile-logo d-lg-none mb-4 text-center">
            <Link to="/" className="text-decoration-none">
              <span className="brand-name-sm"><i className="bi bi-house-heart-fill me-1 text-success"></i>YÊN Homestay</span>
            </Link>
          </div>

          {/* Role Switcher */}
          {step === 1 && (
            <div className="role-switch-container mb-4">
              <button
                type="button"
                className={`role-switch-btn ${role === 'guest' ? 'active' : ''}`}
                onClick={() => setRole('guest')}
              >
                <i className="bi bi-person-luggage me-1"></i> Người thuê phòng
              </button>
              <button
                type="button"
                className={`role-switch-btn ${role === 'host' ? 'active' : ''}`}
                onClick={() => setRole('host')}
              >
                <i className="bi bi-house-heart-fill me-1"></i> Chủ Homestay
              </button>
            </div>
          )}

          {/* Step Indicator */}
          <div className="step-indicator mb-4">
            <div className={`step-item ${step >= 1 ? 'active' : ''} ${step > 1 ? 'done' : ''}`}>
              <div className="step-dot"><i className="bi bi-person-fill"></i></div>
              <span className="step-label">Thông tin</span>
            </div>
            <div className={`step-line ${step > 1 ? 'done' : ''}`}></div>
            <div className={`step-item ${step >= 2 ? 'active' : ''} ${step > 2 ? 'done' : ''}`}>
              <div className="step-dot"><i className="bi bi-shield-check"></i></div>
              <span className="step-label">Xác minh</span>
            </div>
            <div className={`step-line ${step > 2 ? 'done' : ''}`}></div>
            <div className={`step-item ${step === 3 ? 'active done' : ''}`}>
              <div className="step-dot"><i className="bi bi-check-lg"></i></div>
              <span className="step-label">Hoàn tất</span>
            </div>
          </div>

          {/* ==================== BƯỚC 1: FORM ==================== */}
          {step === 1 && role === 'guest' && (
            <div className="register-step">
              <div className="step-header mb-3">
                <h1 className="step-title">Tạo tài khoản du khách</h1>
                <p className="step-subtitle">Điền thông tin để bắt đầu đặt phòng homestay cộng đồng</p>
              </div>

              <form onSubmit={handleStep1Submit}>
                <div className="mb-3">
                  <label className="reg-label">Họ và tên <span className="text-danger">*</span></label>
                  <div className="input-icon-wrap">
                    <i className="bi bi-person input-icon"></i>
                    <input
                      type="text"
                      className="reg-input"
                      placeholder="Nhập họ và tên đầy đủ"
                      value={guestForm.name}
                      onChange={(e) => setGuestForm({ ...guestForm, name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-sm-7">
                    <label className="reg-label">Ngày sinh <span className="text-danger">*</span></label>
                    <div className="input-icon-wrap">
                      <i className="bi bi-calendar3 input-icon"></i>
                      <input
                        type="date"
                        className="reg-input"
                        value={guestForm.dob}
                        onChange={(e) => setGuestForm({ ...guestForm, dob: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-sm-5">
                    <label className="reg-label">Giới tính</label>
                    <div className="input-icon-wrap">
                      <i className="bi bi-gender-ambiguous input-icon"></i>
                      <select
                        className="reg-input reg-select"
                        value={guestForm.gender}
                        onChange={(e) => setGuestForm({ ...guestForm, gender: e.target.value })}
                      >
                        <option value="">Chọn...</option>
                        <option value="nam">Nam</option>
                        <option value="nu">Nữ</option>
                        <option value="khac">Khác</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="reg-label">Quốc tịch</label>
                  <div className="input-icon-wrap">
                    <i className="bi bi-globe2 input-icon"></i>
                    <select
                      className="reg-input reg-select"
                      value={guestForm.nationality}
                      onChange={(e) => setGuestForm({ ...guestForm, nationality: e.target.value })}
                    >
                      <option value="VN">Việt Nam</option>
                      <option value="US">Mỹ (United States)</option>
                      <option value="JP">Nhật Bản (Japan)</option>
                      <option value="KR">Hàn Quốc (Korea)</option>
                      <option value="FR">Pháp (France)</option>
                    </select>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="reg-label">Email <span className="text-danger">*</span></label>
                  <div className="input-icon-wrap">
                    <i className="bi bi-envelope input-icon"></i>
                    <input
                      type="email"
                      className="reg-input"
                      placeholder="example@email.com"
                      value={guestForm.email}
                      onChange={(e) => setGuestForm({ ...guestForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="reg-hint"><i className="bi bi-info-circle me-1"></i>Hóa đơn VAT và mã xác nhận sẽ gửi qua email này</div>
                </div>

                <div className="mb-3">
                  <label className="reg-label">Số điện thoại <span className="text-danger">*</span></label>
                  <div className="phone-input-group">
                    <select
                      className="phone-code-select"
                      value={guestForm.phoneCode}
                      onChange={(e) => setGuestForm({ ...guestForm, phoneCode: e.target.value })}
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>{c.name}</option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      className="reg-input phone-number-input"
                      placeholder="Nhập số điện thoại"
                      value={guestForm.phone}
                      onChange={(e) => setGuestForm({ ...guestForm, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* 2-Tier Address */}
                <div className="mb-3">
                  <label className="reg-label">Địa chỉ</label>
                  <div className="input-icon-wrap mb-2">
                    <i className="bi bi-geo-alt input-icon"></i>
                    <input
                      type="text"
                      className="reg-input"
                      placeholder="Số nhà, tên đường"
                      value={guestForm.street}
                      onChange={(e) => setGuestForm({ ...guestForm, street: e.target.value })}
                    />
                  </div>
                  <div className="row g-2">
                    <div className="col-6">
                      <select
                        className="reg-input reg-select"
                        value={guestForm.provinceCode}
                        onChange={(e) => {
                          const pCode = e.target.value;
                          const p = PROVINCES_DATA.find((item) => item.code === pCode);
                          setGuestForm({
                            ...guestForm,
                            provinceCode: pCode,
                            ward: p ? p.wards[0] : ''
                          });
                        }}
                      >
                        <option value="">-- Tỉnh / Thành phố --</option>
                        {PROVINCES_DATA.map((p) => (
                          <option key={p.code} value={p.code}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-6">
                      <select
                        className="reg-input reg-select"
                        value={guestForm.ward}
                        onChange={(e) => setGuestForm({ ...guestForm, ward: e.target.value })}
                        disabled={!guestForm.provinceCode}
                      >
                        <option value="">-- Phường / Xã --</option>
                        {currentGuestProvince && currentGuestProvince.wards.map((w) => (
                          <option key={w} value={w}>{w}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="row g-3 mb-2">
                  <div className="col-sm-6">
                    <label className="reg-label">Mật khẩu <span className="text-danger">*</span></label>
                    <div className="input-icon-wrap">
                      <i className="bi bi-lock input-icon"></i>
                      <input
                        type={showPwdGuest ? 'text' : 'password'}
                        className="reg-input reg-input-pwd"
                        placeholder="Tối thiểu 8 ký tự"
                        value={guestForm.pwd}
                        onChange={(e) => setGuestForm({ ...guestForm, pwd: e.target.value })}
                        required
                      />
                      <button type="button" className="btn-toggle-pwd" onClick={() => setShowPwdGuest(!showPwdGuest)}>
                        <i className={`bi ${showPwdGuest ? 'bi-eye' : 'bi-eye-slash'}`}></i>
                      </button>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <label className="reg-label">Nhập lại mật khẩu <span className="text-danger">*</span></label>
                    <div className="input-icon-wrap">
                      <i className="bi bi-lock-fill input-icon"></i>
                      <input
                        type={showPwdConfirmGuest ? 'text' : 'password'}
                        className="reg-input reg-input-pwd"
                        placeholder="Nhập lại mật khẩu"
                        value={guestForm.pwdConfirm}
                        onChange={(e) => setGuestForm({ ...guestForm, pwdConfirm: e.target.value })}
                        required
                      />
                      <button type="button" className="btn-toggle-pwd" onClick={() => setShowPwdConfirmGuest(!showPwdConfirmGuest)}>
                        <i className={`bi ${showPwdConfirmGuest ? 'bi-eye' : 'bi-eye-slash'}`}></i>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="form-check reg-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="guestTerms"
                      checked={guestForm.terms}
                      onChange={(e) => setGuestForm({ ...guestForm, terms: e.target.checked })}
                      required
                    />
                    <label className="form-check-label reg-check-label" htmlFor="guestTerms">
                      Tôi đồng ý với <a href="#" className="reg-link">Điều khoản sử dụng</a> và <a href="#" className="reg-link">Chính sách bảo mật</a> của YÊN Homestay
                    </label>
                  </div>
                </div>

                <div className="reg-actions">
                  <Link to="/login" className="btn-back-login"><i className="bi bi-arrow-left me-1"></i> Quay lại đăng nhập</Link>
                  <button type="submit" className="btn-reg-next">Tiếp theo <i className="bi bi-arrow-right ms-1"></i></button>
                </div>
              </form>
            </div>
          )}

          {step === 1 && role === 'host' && (
            <div className="register-step">
              <div className="step-header mb-3">
                <h1 className="step-title">Đăng ký Chủ Homestay</h1>
                <p className="step-subtitle">Đăng ký cơ sở lưu trú và tham gia mạng lưới du lịch cộng đồng</p>
              </div>

              <form onSubmit={handleStep1Submit}>
                <div className="form-section-title"><i className="bi bi-person-badge-fill me-2"></i>Thông tin cá nhân chủ nhà</div>

                <div className="mb-3">
                  <label className="reg-label">Họ và tên chủ sở hữu <span className="text-danger">*</span></label>
                  <div className="input-icon-wrap">
                    <i className="bi bi-person input-icon"></i>
                    <input
                      type="text"
                      className="reg-input"
                      placeholder="Nhập họ và tên đầy đủ"
                      value={hostForm.name}
                      onChange={(e) => setHostForm({ ...hostForm, name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-sm-6">
                    <label className="reg-label">Email <span className="text-danger">*</span></label>
                    <div className="input-icon-wrap">
                      <i className="bi bi-envelope input-icon"></i>
                      <input
                        type="email"
                        className="reg-input"
                        placeholder="email@example.com"
                        value={hostForm.email}
                        onChange={(e) => setHostForm({ ...hostForm, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <label className="reg-label">Số điện thoại <span className="text-danger">*</span></label>
                    <div className="phone-input-group">
                      <select
                        className="phone-code-select"
                        value={hostForm.phoneCode}
                        onChange={(e) => setHostForm({ ...hostForm, phoneCode: e.target.value })}
                      >
                        {COUNTRY_CODES.map((c) => (
                          <option key={c.code} value={c.code}>{c.name}</option>
                        ))}
                      </select>
                      <input
                        type="tel"
                        className="reg-input phone-number-input"
                        placeholder="Số điện thoại"
                        value={hostForm.phone}
                        onChange={(e) => setHostForm({ ...hostForm, phone: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-sm-6">
                    <label className="reg-label">Số CCCD / CMND <span className="text-danger">*</span></label>
                    <div className="input-icon-wrap">
                      <i className="bi bi-credit-card input-icon"></i>
                      <input
                        type="text"
                        className="reg-input"
                        placeholder="VD: 079204012345"
                        maxLength="12"
                        value={hostForm.cccd}
                        onChange={(e) => setHostForm({ ...hostForm, cccd: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <label className="reg-label">Quốc tịch</label>
                    <div className="input-icon-wrap">
                      <i className="bi bi-globe2 input-icon"></i>
                      <select
                        className="reg-input reg-select"
                        value={hostForm.nationality}
                        onChange={(e) => setHostForm({ ...hostForm, nationality: e.target.value })}
                      >
                        <option value="VN">Việt Nam</option>
                        <option value="US">Mỹ (United States)</option>
                        <option value="JP">Nhật Bản (Japan)</option>
                        <option value="KR">Hàn Quốc (Korea)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-section-title mt-3"><i className="bi bi-file-earmark-text-fill me-2"></i>Thông tin Pháp lý &amp; Đăng ký kinh doanh</div>

                <div className="row g-3 mb-3">
                  <div className="col-sm-6">
                    <label className="reg-label">Mô hình kinh doanh <span className="text-danger">*</span></label>
                    <div className="input-icon-wrap">
                      <i className="bi bi-briefcase input-icon"></i>
                      <select
                        className="reg-input reg-select"
                        value={hostForm.bizType}
                        onChange={(e) => setHostForm({ ...hostForm, bizType: e.target.value })}
                        required
                      >
                        <option value="ho-kinh-doanh">Hộ kinh doanh cá thể</option>
                        <option value="doanh-nghiep">Doanh nghiệp / Công ty</option>
                        <option value="hop-tac-xa">Hợp tác xã du lịch cộng đồng</option>
                        <option value="ca-nhan">Cá nhân kinh doanh</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <label className="reg-label">Tên cơ sở theo ĐKKD <span className="text-danger">*</span></label>
                    <div className="input-icon-wrap">
                      <i className="bi bi-card-text input-icon"></i>
                      <input
                        type="text"
                        className="reg-input"
                        placeholder="VD: Hộ kinh doanh Pù Luông Eco"
                        value={hostForm.bizName}
                        onChange={(e) => setHostForm({ ...hostForm, bizName: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-sm-6">
                    <label className="reg-label">Mã số thuế (MST) <span className="text-danger">*</span></label>
                    <div className="input-icon-wrap">
                      <i className="bi bi-receipt-cutoff input-icon"></i>
                      <input
                        type="text"
                        className="reg-input"
                        placeholder="Nhập 10 hoặc 13 chữ số"
                        value={hostForm.taxCode}
                        onChange={(e) => setHostForm({ ...hostForm, taxCode: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <label className="reg-label">Mã số ĐKKD / Số Giấy phép <span className="text-danger">*</span></label>
                    <div className="input-icon-wrap">
                      <i className="bi bi-shield-check input-icon"></i>
                      <input
                        type="text"
                        className="reg-input"
                        placeholder="Số GCN đăng ký kinh doanh"
                        value={hostForm.bizCode}
                        onChange={(e) => setHostForm({ ...hostForm, bizCode: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section-title mt-3"><i className="bi bi-bank me-2"></i>Tài khoản nhận thanh toán</div>

                <div className="row g-3 mb-3">
                  <div className="col-sm-6">
                    <label className="reg-label">Ngân hàng</label>
                    <div className="input-icon-wrap">
                      <i className="bi bi-bank input-icon"></i>
                      <select
                        className="reg-input reg-select"
                        value={hostForm.bank}
                        onChange={(e) => setHostForm({ ...hostForm, bank: e.target.value })}
                      >
                        <option value="">Chọn ngân hàng...</option>
                        <option value="vcb">Vietcombank</option>
                        <option value="tcb">Techcombank</option>
                        <option value="mbbank">MBBank</option>
                        <option value="bid">BIDV</option>
                        <option value="vtb">Vietinbank</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <label className="reg-label">Số tài khoản</label>
                    <div className="input-icon-wrap">
                      <i className="bi bi-credit-card-2-front input-icon"></i>
                      <input
                        type="text"
                        className="reg-input"
                        placeholder="Số tài khoản ngân hàng"
                        value={hostForm.bankAcct}
                        onChange={(e) => setHostForm({ ...hostForm, bankAcct: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section-title mt-3"><i className="bi bi-shield-lock-fill me-2"></i>Bảo mật tài khoản</div>

                <div className="row g-3 mb-2">
                  <div className="col-sm-6">
                    <label className="reg-label">Mật khẩu <span className="text-danger">*</span></label>
                    <div className="input-icon-wrap">
                      <i className="bi bi-lock input-icon"></i>
                      <input
                        type={showPwdHost ? 'text' : 'password'}
                        className="reg-input reg-input-pwd"
                        placeholder="Tối thiểu 8 ký tự"
                        value={hostForm.pwd}
                        onChange={(e) => setHostForm({ ...hostForm, pwd: e.target.value })}
                        required
                      />
                      <button type="button" className="btn-toggle-pwd" onClick={() => setShowPwdHost(!showPwdHost)}>
                        <i className={`bi ${showPwdHost ? 'bi-eye' : 'bi-eye-slash'}`}></i>
                      </button>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <label className="reg-label">Nhập lại mật khẩu <span className="text-danger">*</span></label>
                    <div className="input-icon-wrap">
                      <i className="bi bi-lock-fill input-icon"></i>
                      <input
                        type={showPwdConfirmHost ? 'text' : 'password'}
                        className="reg-input reg-input-pwd"
                        placeholder="Nhập lại mật khẩu"
                        value={hostForm.pwdConfirm}
                        onChange={(e) => setHostForm({ ...hostForm, pwdConfirm: e.target.value })}
                        required
                      />
                      <button type="button" className="btn-toggle-pwd" onClick={() => setShowPwdConfirmHost(!showPwdConfirmHost)}>
                        <i className={`bi ${showPwdConfirmHost ? 'bi-eye' : 'bi-eye-slash'}`}></i>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="form-check reg-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="hostTerms"
                      checked={hostForm.terms}
                      onChange={(e) => setHostForm({ ...hostForm, terms: e.target.checked })}
                      required
                    />
                    <label className="form-check-label reg-check-label" htmlFor="hostTerms">
                      Tôi cam kết thông tin cung cấp là chính xác và đồng ý với <a href="#" className="reg-link">Chính sách đối tác lưu trú</a> của YÊN Homestay
                    </label>
                  </div>
                </div>

                <div className="reg-actions">
                  <Link to="/login" className="btn-back-login"><i className="bi bi-arrow-left me-1"></i> Quay lại đăng nhập</Link>
                  <button type="submit" className="btn-reg-next">Tiếp theo <i className="bi bi-arrow-right ms-1"></i></button>
                </div>
              </form>
            </div>
          )}

          {/* ==================== BƯỚC 2: OTP ==================== */}
          {step === 2 && (
            <div className="register-step">
              <div className="step-header mb-4">
                <h1 className="step-title">Xác minh tài khoản</h1>
                <p className="step-subtitle">Chọn phương thức nhận mã OTP để kích hoạt tài khoản</p>
              </div>

              <div className="verify-method-group mb-4">
                <button
                  type="button"
                  className={`verify-method-btn ${otpMethod === 'email' ? 'active' : ''}`}
                  onClick={() => setOtpMethod('email')}
                >
                  <i className="bi bi-envelope-fill"></i>
                  <div>
                    <div className="method-title">Xác minh Email</div>
                    <div className="method-desc">{role === 'guest' ? guestForm.email : hostForm.email}</div>
                  </div>
                </button>

                <button
                  type="button"
                  className={`verify-method-btn ${otpMethod === 'phone' ? 'active' : ''}`}
                  onClick={() => setOtpMethod('phone')}
                >
                  <i className="bi bi-telephone-fill"></i>
                  <div>
                    <div className="method-title">Xác minh SMS</div>
                    <div className="method-desc">{role === 'guest' ? guestForm.phone : hostForm.phone}</div>
                  </div>
                </button>
              </div>

              <div className="otp-section">
                <p className="otp-info">
                  Mã OTP 6 chữ số đã được gửi tới <strong>{otpMethod === 'email' ? (role === 'guest' ? guestForm.email : hostForm.email) : (role === 'guest' ? guestForm.phone : hostForm.phone)}</strong>
                </p>

                <div className="otp-inputs mb-3">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-box-${idx}`}
                      type="text"
                      className={`otp-box ${digit ? 'filled' : ''}`}
                      maxLength="1"
                      inputMode="numeric"
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    />
                  ))}
                </div>

                <p className="otp-resend-row">
                  Chưa nhận được mã?{' '}
                  <button
                    type="button"
                    className="btn-resend"
                    onClick={handleResendOtp}
                    disabled={!canResend}
                  >
                    {canResend ? 'Gửi lại mã OTP' : `Gửi lại (${countdown}s)`}
                  </button>
                </p>
              </div>

              <div className="reg-actions mt-4">
                <button type="button" className="btn-back-step" onClick={() => setStep(1)}><i className="bi bi-arrow-left me-1"></i> Quay lại</button>
                <button type="button" className="btn-reg-next" onClick={handleConfirmOtp}>Xác nhận <i className="bi bi-check-lg ms-1"></i></button>
              </div>
            </div>
          )}

          {/* ==================== BƯỚC 3: COMPLETE ==================== */}
          {step === 3 && (
            <div className="register-step text-center">
              <div className="success-icon mb-3"><i className="bi bi-patch-check-fill"></i></div>
              <h1 className="step-title mb-2">Đăng ký thành công!</h1>
              <p className="step-subtitle mb-2">
                {role === 'guest' ? 'Chào mừng bạn đến với YÊN Homestay!' : 'Hồ sơ chủ nhà của bạn đã được khởi tạo thành công.'}
              </p>
              <div className="success-reward mb-4">
                <i className="bi bi-gift-fill me-2"></i>Bạn vừa nhận được <strong>100 điểm Eco</strong> chào mừng thành viên mới!
              </div>

              <div className="d-flex flex-column gap-2">
                <Link to="/" className="btn-reg-next w-100 text-center justify-content-center gap-2">
                  <i className="bi bi-house-fill"></i> Về trang chủ
                </Link>
                {role === 'guest' ? (
                  <Link to="/account" className="btn-back-step w-100 text-center justify-content-center gap-2">
                    <i className="bi bi-person-fill"></i> Quản lý tài khoản
                  </Link>
                ) : (
                  <Link to="/owner/dashboard" className="btn-back-step w-100 text-center justify-content-center gap-2">
                    <i className="bi bi-speedometer2"></i> Truy cập Dashboard Chủ nhà
                  </Link>
                )}
              </div>
            </div>
          )}

          <p className="login-prompt mt-4 text-center">
            Đã có tài khoản? <Link to="/login" className="reg-link fw-semibold">Đăng nhập ngay</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
