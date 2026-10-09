import React, { useState, useMemo } from 'react';
import './Settings.css';
import { initialSettingsData } from './settingsData';
import { userService } from '../../../services/userService';
import { authService } from '../../../services/authService';

export default function Settings() {
  const currentUser = authService.getCurrentUser();
  const userId = currentUser?.id;
  const [activeTab, setActiveTab] = useState('account'); // 'account' | 'bank' | 'notification'

  // Profile Form State
  const [profile, setProfile] = useState(initialSettingsData.profile);
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    newPass: '',
    confirmPass: ''
  });

  // Bank Accounts State
  const [bankAccounts, setBankAccounts] = useState(initialSettingsData.bankAccounts);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [bankFormData, setBankFormData] = useState({
    bankName: 'Vietcombank',
    accountNumber: '',
    accountName: '',
    branch: '',
    isDefault: false
  });

  // Notifications State
  const [notifications, setNotifications] = useState(initialSettingsData.notifications);
  const [notiFilter, setNotiFilter] = useState('all'); // 'all' | 'unread' | 'booking' | 'payment' | 'system'
  const [notiChannels, setNotiChannels] = useState(initialSettingsData.notificationChannels);

  // Toast State
  const [toastMessage, setToastMessage] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Đếm thông báo chưa đọc
  const unreadNotiCount = useMemo(() => {
    return notifications.filter((n) => n.unread).length;
  }, [notifications]);

  React.useEffect(() => {
    if (!userId) return;
    userService.getUserProfile(userId).then(result => {
      if (!result.success || !result.data) return;
      const data = result.data;
      setProfile(prev => ({ ...prev, ...data,
        phone: data.phoneNumber || '',
        address: data.street || '',
        birthday: data.dobYear && data.dobMonth && data.dobDay ? `${data.dobYear}-${String(data.dobMonth).padStart(2, '0')}-${String(data.dobDay).padStart(2, '0')}` : '',
        initials: (data.fullName || prev.fullName || 'U').split(/\s+/).map(x => x[0]).join('').slice(-2).toUpperCase()
      }));
    });
  }, [userId]);

  // Format thời gian đã trôi qua
  const formatTimeAgo = (minutes) => {
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    return `${Math.floor(hours / 24)} ngày trước`;
  };

  // Mask số tài khoản ngân hàng
  const maskAccountNum = (num) => {
    const s = String(num || '');
    if (s.length <= 4) return s;
    return `${s.slice(0, 3)} •••• ${s.slice(-4)}`;
  };

  // Lưu thông tin cá nhân
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!userId) return showToast('Vui lòng đăng nhập lại để cập nhật tài khoản.');
    setSavingProfile(true);
    const dateParts = profile.birthday ? profile.birthday.split('-') : [];
    const result = await userService.updateUserProfile(userId, {
      fullName: profile.fullName,
      phoneNumber: profile.phone,
      street: profile.address,
      dobYear: dateParts[0] || null,
      dobMonth: dateParts[1] || null,
      dobDay: dateParts[2] || null,
    });
    if (result.success && result.data) {
      const saved = result.data;
      setProfile(prev => ({ ...prev, ...saved, phone: saved.phoneNumber || prev.phone, address: saved.street || prev.address }));
      const stored = authService.getCurrentUser();
      if (stored) localStorage.setItem('user', JSON.stringify({ ...stored, fullName: saved.fullName, phoneNumber: saved.phoneNumber, avatar: saved.avatar }));
    }
    setSavingProfile(false);
    showToast(result.success ? 'Đã lưu thông tin tài khoản thành công!' : (result.error || 'Không thể cập nhật thông tin.'));
  };

  // Đổi mật khẩu
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPass.length < 8) {
      showToast('⚠️ Mật khẩu mới phải có tối thiểu 8 ký tự!');
      return;
    }
    if (passwordForm.newPass !== passwordForm.confirmPass) {
      showToast('⚠️ Mật khẩu xác nhận không trùng khớp!');
      return;
    }

    if (!userId) return showToast('Vui lòng đăng nhập lại để đổi mật khẩu.');
    const result = await userService.changePassword(userId, passwordForm.current, passwordForm.newPass);
    if (!result.success) return showToast(result.message || 'Đổi mật khẩu thất bại.');
    setPasswordForm({ current: '', newPass: '', confirmPass: '' });
    showToast(result.message || 'Đã cập nhật mật khẩu mới thành công!');
  };

  // Thêm tài khoản ngân hàng mới
  const handleAddBank = (e) => {
    e.preventDefault();
    if (!bankFormData.accountNumber.trim() || !bankFormData.accountName.trim()) {
      showToast('⚠️ Vui lòng điền đầy đủ số tài khoản và tên chủ tài khoản!');
      return;
    }

    const newBank = {
      id: `bank-${Date.now()}`,
      bankName: bankFormData.bankName,
      accountNumber: bankFormData.accountNumber.trim(),
      accountName: bankFormData.accountName.trim().toUpperCase(),
      branch: bankFormData.branch.trim(),
      isDefault: bankFormData.isDefault || bankAccounts.length === 0,
      verified: false
    };

    let updated = [...bankAccounts];
    if (newBank.isDefault) {
      updated = updated.map((b) => ({ ...b, isDefault: false }));
    }
    updated.push(newBank);

    setBankAccounts(updated);
    setIsBankModalOpen(false);
    setBankFormData({
      bankName: 'Vietcombank',
      accountNumber: '',
      accountName: '',
      branch: '',
      isDefault: false
    });
    showToast(`Đã gửi yêu cầu liên kết ngân hàng ${newBank.bankName}!`);
  };

  // Đặt làm tài khoản ngân hàng mặc định
  const handleSetDefaultBank = (bankId) => {
    setBankAccounts((prev) =>
      prev.map((b) => ({
        ...b,
        isDefault: b.id === bankId
      }))
    );
    showToast('Đã thiết lập tài khoản nhận tiền mặc định thành công!');
  };

  // Gỡ tài khoản ngân hàng
  const handleRemoveBank = (bankId) => {
    const target = bankAccounts.find((b) => b.id === bankId);
    if (!target) return;
    const remaining = bankAccounts.filter((b) => b.id !== bankId);
    if (target.isDefault && remaining.length > 0) {
      remaining[0].isDefault = true;
    }
    setBankAccounts(remaining);
    showToast(`Đã gỡ liên kết ngân hàng ${target.bankName}!`);
  };

  // Lọc danh sách thông báo
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (notiFilter === 'all') return true;
      if (notiFilter === 'unread') return n.unread;
      return n.category === notiFilter;
    });
  }, [notifications, notiFilter]);

  // Đọc thông báo
  const handleMarkAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
  };

  // Đọc tất cả thông báo
  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    showToast('Đã đánh dấu tất cả thông báo là đã đọc!');
  };

  // Toggle kênh nhận thông báo
  const handleToggleChannel = (channelId, key) => {
    setNotiChannels((prev) =>
      prev.map((c) =>
        c.id === channelId ? { ...c, [key]: !c[key] } : c
      )
    );
  };

  return (
    <div className="settings-container">
      {/* Top Banner */}
      <div className="settings-header-banner">
        <div className="settings-banner-glow" />
        <div>
          <h1 className="settings-banner-title">Cài đặt tài khoản</h1>
        </div>

        <div className="settings-user-badge-box">
          <div className="settings-badge-avatar">{profile.initials}</div>
          <div className="settings-badge-info">
            <h4>{profile.fullName}</h4>
            <p>{profile.role}</p>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="settings-nav-tabs">
        <button
          type="button"
          className={`settings-tab-btn ${activeTab === 'account' ? 'active' : ''}`}
          onClick={() => setActiveTab('account')}
        >
          <span className="material-symbols-outlined text-[18px]">person</span>
          Tài khoản của tôi
        </button>

        <button
          type="button"
          className={`settings-tab-btn ${activeTab === 'bank' ? 'active' : ''}`}
          onClick={() => setActiveTab('bank')}
        >
          <span className="material-symbols-outlined text-[18px]">account_balance</span>
          Liên kết ngân hàng
          <span className="tab-counter-badge">{bankAccounts.length}</span>
        </button>

        <button
          type="button"
          className={`settings-tab-btn ${activeTab === 'notification' ? 'active' : ''}`}
          onClick={() => setActiveTab('notification')}
        >
          <span className="material-symbols-outlined text-[18px]">notifications</span>
          Thông báo nhận được
          {unreadNotiCount > 0 && (
            <span className="tab-counter-badge alert">{unreadNotiCount}</span>
          )}
        </button>
      </div>

      {/* ========================================================= */}
      {/* 1. MỤC TÀI KHOẢN CỦA TÔI */}
      {/* ========================================================= */}
      {activeTab === 'account' && (
        <div className="settings-account-grid">
          {/* Cột trái: Avatar Profile */}
          <div className="account-sidebar-card">
            <div className="profile-avatar-circle">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.fullName} />
              ) : (
                <span>{profile.initials}</span>
              )}
            </div>

            <div>
              <h3 className="profile-meta-title">{profile.fullName}</h3>
              <p className="profile-meta-email">{profile.email}</p>
            </div>

            <span className="verified-pill">
              <span className="material-symbols-outlined text-[14px]">verified</span>
              Đã xác thực danh tính
            </span>

            <label className="btn-change-avatar">
              <span className="material-symbols-outlined text-[16px]">photo_camera</span>
              Đổi ảnh đại diện
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const url = URL.createObjectURL(file);
                    setProfile({ ...profile, avatarUrl: url });
                    showToast('Đã cập nhật ảnh đại diện thành công!');
                  }
                }}
              />
            </label>

            <div className="profile-stat-list">
              <div className="profile-stat-row">
                <span className="profile-stat-label">Ngày tham gia</span>
                <span className="profile-stat-val">{profile.joinDate}</span>
              </div>
              <div className="profile-stat-row">
                <span className="profile-stat-label">Vai trò</span>
                <span className="profile-stat-val">{profile.role}</span>
              </div>
              <div className="profile-stat-row">
                <span className="profile-stat-label">Trạng thái</span>
                <span className="profile-stat-val active-green">{profile.status}</span>
              </div>
            </div>
          </div>

          {/* Cột phải: Form thông tin & Đổi mật khẩu */}
          <div className="account-forms-col">
            {/* Form Thông Tin Cá Nhân */}
            <div className="settings-box-card">
              <div className="settings-box-header">
                <span className="material-symbols-outlined text-emerald-800 text-[20px]">
                  badge
                </span>
                <h3>Thông tin cá nhân</h3>
              </div>

              <form onSubmit={handleSaveProfile} className="settings-form-grid grid-2">
                <div className="settings-field">
                  <label className="settings-label">Họ và tên *</label>
                  <input
                    type="text"
                    required
                    className="settings-input"
                    value={profile.fullName}
                    onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                  />
                </div>

                <div className="settings-field">
                  <label className="settings-label">Số điện thoại *</label>
                  <input
                    type="tel"
                    required
                    className="settings-input"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  />
                </div>

                <div className="settings-field">
                  <label className="settings-label">Email liên hệ *</label>
                  <input
                    type="email"
                    required
                    className="settings-input"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  />
                </div>

                <div className="settings-field">
                  <label className="settings-label">Ngày sinh</label>
                  <input
                    type="date"
                    className="settings-input"
                    value={profile.birthday}
                    onChange={(e) => setProfile({ ...profile, birthday: e.target.value })}
                  />
                </div>

                <div className="settings-field full">
                  <label className="settings-label">Địa chỉ liên hệ</label>
                  <input
                    type="text"
                    className="settings-input"
                    value={profile.address}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  />
                </div>

                <div className="settings-field full settings-btn-row">
                  <button type="submit" className="btn-save-settings">
                    <span className="material-symbols-outlined text-[17px]">save</span>
                    {savingProfile ? 'Đang lưu...' : 'Lưu thông tin cá nhân'}
                  </button>
                </div>
              </form>
            </div>

            {/* Form Đổi Mật Khẩu */}
            <div className="settings-box-card">
              <div className="settings-box-header">
                <span className="material-symbols-outlined text-emerald-800 text-[20px]">
                  lock
                </span>
                <h3>Đổi mật khẩu bảo mật</h3>
              </div>

              <form onSubmit={handleChangePassword} className="settings-form-grid grid-2">
                <div className="settings-field full">
                  <label className="settings-label">Mật khẩu hiện tại *</label>
                  <input
                    type="password"
                    required
                    className="settings-input"
                    placeholder="Nhập mật khẩu hiện tại"
                    value={passwordForm.current}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, current: e.target.value })
                    }
                  />
                </div>

                <div className="settings-field">
                  <label className="settings-label">Mật khẩu mới *</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    className="settings-input"
                    placeholder="Tối thiểu 8 ký tự"
                    value={passwordForm.newPass}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, newPass: e.target.value })
                    }
                  />
                </div>

                <div className="settings-field">
                  <label className="settings-label">Xác nhận mật khẩu mới *</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    className="settings-input"
                    placeholder="Nhập lại mật khẩu mới"
                    value={passwordForm.confirmPass}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, confirmPass: e.target.value })
                    }
                  />
                </div>

                <div className="settings-field full settings-btn-row">
                  <button type="submit" className="btn-save-settings">
                    <span className="material-symbols-outlined text-[17px]">key</span>
                    Cập nhật mật khẩu
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. MỤC LIÊN KẾT NGÂN HÀNG */}
      {/* ========================================================= */}
      {activeTab === 'bank' && (
        <div className="flex flex-col gap-5">
          <div className="bank-header-row">
            <div className="bank-header-info">
              <h3>Tài khoản ngân hàng nhận tiền</h3>
              <p>Tiền cọc và thanh toán từ du khách sẽ được tự động chuyển về tài khoản mặc định.</p>
            </div>
            <button
              type="button"
              className="btn-add-bank"
              onClick={() => setIsBankModalOpen(true)}
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              Liên kết ngân hàng mới
            </button>
          </div>

          <div className="bank-cards-grid">
            {bankAccounts.map((bank) => (
              <div
                key={bank.id}
                className={`bank-card-item ${bank.isDefault ? 'default-card' : ''}`}
              >
                <div className="bank-card-head">
                  <div className="bank-brand-info">
                    <div className="bank-logo-icon">
                      <span className="material-symbols-outlined">account_balance</span>
                    </div>
                    <div>
                      <h4>{bank.bankName}</h4>
                      <p>{bank.branch || 'Chưa cập nhật chi nhánh'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="bank-account-num">{maskAccountNum(bank.accountNumber)}</div>
                  <div className="bank-account-owner">{bank.accountName}</div>
                </div>

                <div className="bank-badges-wrap">
                  {bank.isDefault && (
                    <span className="badge-bank-pill default">Mặc định</span>
                  )}
                  {bank.verified ? (
                    <span className="badge-bank-pill verified">Đã xác thực</span>
                  ) : (
                    <span className="badge-bank-pill pending">Chờ xác thực</span>
                  )}
                </div>

                <div className="bank-card-actions">
                  {!bank.isDefault && (
                    <button
                      type="button"
                      className="btn-bank-act"
                      onClick={() => handleSetDefaultBank(bank.id)}
                    >
                      <span className="material-symbols-outlined text-[15px]">star</span>
                      Đặt mặc định
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-bank-act text-red-600"
                    onClick={() => handleRemoveBank(bank.id)}
                  >
                    <span className="material-symbols-outlined text-[15px]">link_off</span>
                    Gỡ liên kết
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. MỤC THÔNG BÁO NHẬN ĐƯỢC */}
      {/* ========================================================= */}
      {activeTab === 'notification' && (
        <div className="settings-noti-layout">
          {/* Cột Trái: Danh sách thông báo */}
          <div className="settings-box-card">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-800 text-[20px]">
                  notifications
                </span>
                <h3 className="m-0 font-bold text-base text-slate-800">Thông báo đã nhận</h3>
              </div>
              <button
                type="button"
                className="room-btn room-btn-ghost text-xs text-emerald-800 font-semibold cursor-pointer border-none bg-transparent"
                onClick={handleMarkAllRead}
              >
                Đánh dấu đã đọc tất cả
              </button>
            </div>

            {/* Filter buttons */}
            <div className="noti-filter-row">
              <button
                type="button"
                className={`noti-filter-btn ${notiFilter === 'all' ? 'active' : ''}`}
                onClick={() => setNotiFilter('all')}
              >
                Tất cả
              </button>
              <button
                type="button"
                className={`noti-filter-btn ${notiFilter === 'unread' ? 'active' : ''}`}
                onClick={() => setNotiFilter('unread')}
              >
                Chưa đọc
              </button>
              <button
                type="button"
                className={`noti-filter-btn ${notiFilter === 'booking' ? 'active' : ''}`}
                onClick={() => setNotiFilter('booking')}
              >
                Đặt phòng
              </button>
              <button
                type="button"
                className={`noti-filter-btn ${notiFilter === 'payment' ? 'active' : ''}`}
                onClick={() => setNotiFilter('payment')}
              >
                Thanh toán
              </button>
              <button
                type="button"
                className={`noti-filter-btn ${notiFilter === 'system' ? 'active' : ''}`}
                onClick={() => setNotiFilter('system')}
              >
                Hệ thống
              </button>
            </div>

            {/* Items list */}
            <div className="noti-list-items">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  Không có thông báo nào phù hợp.
                </div>
              ) : (
                filteredNotifications.map((noti) => (
                  <div
                    key={noti.id}
                    className={`noti-item-box ${noti.unread ? 'unread' : ''}`}
                    onClick={() => handleMarkAsRead(noti.id)}
                  >
                    <div className="noti-item-icon">
                      <span className="material-symbols-outlined">{noti.icon}</span>
                    </div>
                    <div className="noti-item-body">
                      <div className="noti-item-title">
                        {noti.unread && <span className="noti-unread-dot" />}
                        {noti.title}
                      </div>
                      <div className="noti-item-desc">{noti.message}</div>
                      <div className="noti-item-time">{formatTimeAgo(noti.minutesAgo)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Cột Phải: Cài đặt kênh nhận thông báo */}
          <div className="settings-box-card h-fit">
            <div className="settings-box-header">
              <span className="material-symbols-outlined text-emerald-800 text-[20px]">
                tune
              </span>
              <h3>Kênh nhận thông báo</h3>
            </div>
            <p className="text-xs text-slate-500 m-0">
              Bật/tắt các thông báo gửi về Email và Ứng dụng khi có cập nhật.
            </p>

            <div>
              {notiChannels.map((item) => (
                <div key={item.id} className="channel-setting-item">
                  <div className="channel-info">
                    <h4>{item.label}</h4>
                    <p>{item.desc}</p>
                  </div>
                  <label className="switch-toggle-wrap">
                    <input
                      type="checkbox"
                      checked={item.email}
                      onChange={() => handleToggleChannel(item.id, 'email')}
                    />
                    <span className="switch-slider" />
                  </label>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="btn-save-settings w-full justify-center mt-2"
              onClick={() => showToast('Đã lưu tùy chọn kênh thông báo!')}
            >
              Lưu tùy chọn kênh
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL THÊM LIÊN KẾT NGÂN HÀNG MỚI */}
      {/* ========================================================= */}
      {isBankModalOpen && (
        <div className="room-modal-backdrop" onClick={() => setIsBankModalOpen(false)}>
          <div className="room-modal-panel" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleAddBank}>
              <div className="room-modal-head">
                <div>
                  <h3 className="room-modal-title">Liên kết ngân hàng mới</h3>
                  <p className="room-modal-desc">
                    Tài khoản dùng để nhận tiền thanh toán và hoàn trả từ hệ thống.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-close-modal"
                  onClick={() => setIsBankModalOpen(false)}
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              <div className="room-modal-body">
                <div className="room-form-row">
                  <label className="room-form-label">Chọn ngân hàng *</label>
                  <select
                    className="room-form-select"
                    value={bankFormData.bankName}
                    onChange={(e) =>
                      setBankFormData({ ...bankFormData, bankName: e.target.value })
                    }
                  >
                    <option value="Vietcombank">Vietcombank (Ngoại thương)</option>
                    <option value="Techcombank">Techcombank (Kỹ thương)</option>
                    <option value="MB Bank">MB Bank (Quân đội)</option>
                    <option value="BIDV">BIDV (Đầu tư &amp; Phát triển)</option>
                    <option value="VietinBank">VietinBank (Công thương)</option>
                    <option value="Agribank">Agribank (Nông nghiệp)</option>
                    <option value="ACB">ACB (Á Châu)</option>
                    <option value="TPBank">TPBank (Tiên Phong)</option>
                  </select>
                </div>

                <div className="room-form-row">
                  <label className="room-form-label">Số tài khoản *</label>
                  <input
                    type="text"
                    required
                    className="room-form-input"
                    placeholder="Ví dụ: 0123456789"
                    value={bankFormData.accountNumber}
                    onChange={(e) =>
                      setBankFormData({ ...bankFormData, accountNumber: e.target.value })
                    }
                  />
                </div>

                <div className="room-form-row">
                  <label className="room-form-label">Tên chủ tài khoản (In hoa không dấu) *</label>
                  <input
                    type="text"
                    required
                    className="room-form-input uppercase"
                    placeholder="NGUYEN HOA"
                    value={bankFormData.accountName}
                    onChange={(e) =>
                      setBankFormData({
                        ...bankFormData,
                        accountName: e.target.value.toUpperCase()
                      })
                    }
                  />
                </div>

                <div className="room-form-row">
                  <label className="room-form-label">Chi nhánh</label>
                  <input
                    type="text"
                    className="room-form-input"
                    placeholder="Chi nhánh Hòa Bình"
                    value={bankFormData.branch}
                    onChange={(e) =>
                      setBankFormData({ ...bankFormData, branch: e.target.value })
                    }
                  />
                </div>

                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={bankFormData.isDefault}
                    onChange={(e) =>
                      setBankFormData({ ...bankFormData, isDefault: e.target.checked })
                    }
                  />
                  <span>Đặt làm tài khoản nhận tiền mặc định</span>
                </label>
              </div>

              <div className="room-modal-foot">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setIsBankModalOpen(false)}
                >
                  Hủy
                </button>
                <button type="submit" className="btn-modal-save">
                  <span className="material-symbols-outlined text-[17px]">link</span>
                  Xác nhận liên kết
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="review-toast">
          <span className="material-symbols-outlined text-emerald-400">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
