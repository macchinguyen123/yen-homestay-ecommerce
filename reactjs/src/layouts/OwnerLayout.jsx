import { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import './Layouts.css';

// ─── Danh sách nav theo sidebar.html gốc ─────────────────────────────────────
const OWNER_NAV = [
  { to: '/owner/dashboard',  icon: 'bi-speedometer2',    label: 'Trang chủ' },
  { to: '/owner/homestay',   icon: 'bi-house-heart',     label: 'Quản lý Homestay' },
  { to: '/owner/rooms',      icon: 'bi-door-open',       label: 'Quản lý phòng' },
  { to: '/owner/services',   icon: 'bi-basket2',         label: 'Quản lý dịch vụ' },
  { to: '/owner/bookings',   icon: 'bi-journal-bookmark',label: 'Quản lý Booking' },
  { to: '/owner/missions',   icon: 'bi-trophy',          label: 'Quản lý nhiệm vụ' },
  { to: '/owner/reviews',    icon: 'bi-star-half',       label: 'Quản lý đánh giá' },
  { to: '/owner/discounts',  icon: 'bi-ticket-perforated', label: 'Quản lý mã giảm giá' },
  { to: '/owner/revenue',    icon: 'bi-bar-chart-line',  label: 'Doanh thu & thống kê' },
  { to: '/owner/packages',   icon: 'bi-megaphone',       label: 'Gói quảng cáo' },
  { to: '/owner/settings',   icon: 'bi-gear',            label: 'Cài đặt' },
];

// ─── Thông báo mẫu (notification dropdown) ────────────────────────────────────
const SAMPLE_NOTIFS = [
  { id: 1, icon: 'bi-bell-fill',           color: 'green',  title: 'Đơn đặt phòng mới',      desc: 'Nguyễn Thị Mai vừa đặt phòng Garden View.',       time: '5 phút trước' },
  { id: 2, icon: 'bi-alarm-fill',          color: 'yellow', title: 'Nhắc nhở nhận phòng',     desc: 'Lê Văn Hiếu check-in lúc 14:00 hôm nay.',          time: '1 giờ trước' },
  { id: 3, icon: 'bi-star-fill',           color: 'orange', title: 'Đánh giá 5 sao mới',      desc: 'Hoàng Minh Anh để lại đánh giá 5 sao.',            time: '3 giờ trước' },
];

export default function OwnerLayout() {
  const navigate = useNavigate();

  // Notification dropdown
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifCount, setNotifCount]   = useState(SAMPLE_NOTIFS.length);
  const notifRef = useRef(null);

  // Profile dropdown
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target))   setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleReadAllNotifs = () => {
    setNotifCount(0);
    setNotifOpen(false);
  };

  const handleLogout = () => {
    setProfileOpen(false);
    navigate('/');
  };

  return (
    <div className="owner-layout-root">

      {/* ══════════════════════════════════════════════════
          SIDEBAR  (theo sidebar.html gốc)
      ══════════════════════════════════════════════════ */}
      <aside className="owner-sidebar">

        {/* Brand / Logo */}
        <div className="owner-sidebar-brand">
          <i className="bi bi-house-gear-fill owner-sidebar-brand-icon" />
          <div className="owner-sidebar-brand-text">
            <span className="owner-sidebar-brand-name">YÊN <span>Host</span></span>
            <span className="owner-sidebar-brand-sub">Nhà Sàn Mộc</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="owner-sidebar-nav">
          {OWNER_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `owner-nav-item${isActive ? ' active' : ''}`
              }
            >
              <i className={`bi ${item.icon}`} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer: nút Về trang khách */}
        <div className="owner-sidebar-footer">
          <div className="owner-sidebar-homestay-card">
            <div className="owner-sidebar-homestay-icon">
              <i className="bi bi-houses-fill" />
            </div>
            <div className="owner-sidebar-homestay-info">
              <strong>Nhà Sàn Mộc</strong>
              <span>Mai Châu, Hòa Bình</span>
            </div>
            <i className="bi bi-chevron-expand owner-sidebar-homestay-arrow" />
          </div>

          <Link to="/" className="owner-nav-item owner-nav-switch">
            <i className="bi bi-box-arrow-left" />
            <span>Về trang Khách hàng</span>
          </Link>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════
          MAIN BODY (header + outlet)
      ══════════════════════════════════════════════════ */}
      <div className="owner-body">

        {/* ── HEADER (theo header.html gốc) ───────────── */}
        <header className="owner-header">

          {/* Tiêu đề trang hiện tại */}
          <div className="owner-header-title">
            <i className="bi bi-house-gear-fill" style={{ color: '#059669' }} />
            Khu vực Quản lý Chủ nhà
          </div>

          {/* Right side: notifications + profile */}
          <div className="owner-header-right">

            {/* ── Notification bell ── */}
            <div className="owner-notif-wrap" ref={notifRef}>
              <button
                className="owner-icon-btn"
                onClick={() => { setNotifOpen(o => !o); setNotifCount(0); }}
                aria-label="Thông báo"
              >
                <i className="bi bi-bell-fill" />
                {notifCount > 0 && (
                  <span className="owner-notif-badge">{notifCount}</span>
                )}
              </button>

              {/* Notification dropdown */}
              {notifOpen && (
                <div className="owner-dropdown owner-notif-dropdown">
                  <div className="owner-dropdown-header">
                    <strong>Thông báo mới</strong>
                    <button className="owner-dropdown-link" onClick={handleReadAllNotifs}>
                      Đánh dấu tất cả đã đọc
                    </button>
                  </div>

                  <div className="owner-notif-list">
                    {SAMPLE_NOTIFS.map(n => (
                      <div key={n.id} className="owner-notif-item">
                        <div className={`owner-notif-icon ${n.color}`}>
                          <i className={`bi ${n.icon}`} />
                        </div>
                        <div className="owner-notif-content">
                          <strong>{n.title}</strong>
                          <span>{n.desc}</span>
                        </div>
                        <small>{n.time}</small>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="owner-header-divider" />

            {/* ── Profile button ── */}
            <div className="owner-profile-wrap" ref={profileRef}>
              <button
                className="owner-profile-btn"
                onClick={() => setProfileOpen(o => !o)}
                aria-label="Tài khoản"
              >
                <img
                  src="https://lh3.googleusercontent.com/aida/AEtjO1W7zs7OjBASCOexo74_mIgfQZTcHfdYs4AEy6azcaerc7X6IvM9nRu28E-RnVj7Xy6fyOhptHylxmI6RomPfEdWiYzjw0V-yC6tQ7qliOWFrY8-_z9Umlu9GLUHeDbDtoyytD4pPROYAQ4DqzbShJOYUgKdJWg83gVaScW_7WY2vDqgy16KLOiYQ9rBz3fb50bOLvZtubEFqW8cHqktuA0BcjG9YuxpWN6XELHpvmfymi5zqcsHwvyJ3pz2gBd_bOAup7qMKlzR"
                  alt="Profile"
                  className="owner-profile-avatar"
                />
                <div className="owner-profile-info">
                  <div className="owner-profile-name-row">
                    <span className="owner-profile-name">Nguyễn Văn An</span>
                    <span className="owner-profile-role-badge">Chủ homestay</span>
                  </div>
                  <span className="owner-profile-sub">Nhà Sàn Mộc</span>
                </div>
                <i className="bi bi-chevron-down owner-profile-chevron" />
              </button>

              {/* Profile dropdown menu */}
              {profileOpen && (
                <div className="owner-dropdown owner-profile-dropdown">
                  <div className="owner-dropdown-header border-b-only">
                    <div className="owner-profile-dropdown-info">
                      <img
                        src="https://lh3.googleusercontent.com/aida/AEtjO1W7zs7OjBASCOexo74_mIgfQZTcHfdYs4AEy6azcaerc7X6IvM9nRu28E-RnVj7Xy6fyOhptHylxmI6RomPfEdWiYzjw0V-yC6tQ7qliOWFrY8-_z9Umlu9GLUHeDbDtoyytD4pPROYAQ4DqzbShJOYUgKdJWg83gVaScW_7WY2vDqgy16KLOiYQ9rBz3fb50bOLvZtubEFqW8cHqktuA0BcjG9YuxpWN6XELHpvmfymi5zqcsHwvyJ3pz2gBd_bOAup7qMKlzR"
                        alt=""
                        className="owner-profile-avatar--lg"
                      />
                      <div>
                        <strong>Nguyễn Văn An</strong>
                        <span>nguyenvanan@gmail.com</span>
                      </div>
                    </div>
                  </div>

                  <div className="owner-dropdown-body">
                    <NavLink to="/owner/settings" className="owner-dropdown-item" onClick={() => setProfileOpen(false)}>
                      <i className="bi bi-gear-fill" /> Cài đặt tài khoản
                    </NavLink>
                    <Link to="/" className="owner-dropdown-item" onClick={() => setProfileOpen(false)}>
                      <i className="bi bi-house-door-fill" /> Về trang Khách hàng
                    </Link>
                  </div>

                  <div className="owner-dropdown-footer">
                    <button className="owner-logout-btn" onClick={handleLogout}>
                      <i className="bi bi-box-arrow-right" /> Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* ── Page content ────────────────────────────── */}
        <main className="owner-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
