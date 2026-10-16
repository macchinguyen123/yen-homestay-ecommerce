import { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import './Layouts.css';
import { authService } from '../services/authService';
import { userService } from '../services/userService';

// ─── Danh sách nav theo sidebar.html gốc ─────────────────────────────────────
const OWNER_NAV = [
  { to: '/owner/dashboard',  icon: 'bi-speedometer2',    label: 'Trang chủ' },
  { to: '/owner/homestay',   icon: 'bi-house-heart',     label: 'Quản lý Homestay' },
  { to: '/owner/rooms',      icon: 'bi-door-open',       label: 'Quản lý phòng' },
  { to: '/owner/services',   icon: 'bi-basket2',         label: 'Quản lý dịch vụ' },
  { to: '/owner/bookings',   icon: 'bi-journal-bookmark',label: 'Quản lý Booking' },
  { to: '/owner/messages',   icon: 'bi-chat-dots',        label: 'Tin nhắn' },
  { to: '/owner/missions',   icon: 'bi-trophy',          label: 'Quản lý nhiệm vụ' },
  { to: '/owner/reviews',    icon: 'bi-star-half',       label: 'Quản lý đánh giá' },
  { to: '/owner/discounts',  icon: 'bi-ticket-perforated', label: 'Quản lý mã giảm giá' },
  { to: '/owner/revenue',    icon: 'bi-bar-chart-line',  label: 'Doanh thu & thống kê' },
  { to: '/owner/packages',   icon: 'bi-megaphone',       label: 'Gói quảng cáo' },
  { to: '/owner/settings',   icon: 'bi-gear',            label: 'Cài đặt' },
];

export default function OwnerLayout() {
  const navigate = useNavigate();
  const [ownerProfile, setOwnerProfile] = useState(() => authService.getCurrentUser() || {});

  // Notification dropdown
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifCount, setNotifCount]   = useState(0);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);

  // Profile dropdown
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // Dynamic Homestays & Switcher State
  const [homestaysList, setHomestaysList] = useState([]);
  const [activeHomestayId, setActiveHomestayId] = useState(null);
  const [homestaysLoading, setHomestaysLoading] = useState(true);
  const [homestaysError, setHomestaysError] = useState('');
  const [hsDropdownOpen, setHsDropdownOpen] = useState(false);
  const hsRef = useRef(null);

  const fetchHomestays = async () => {
    try {
      const user = authService.getCurrentUser();
      const token = user?.token || JSON.parse(localStorage.getItem('user') || 'null')?.token;
      if (!token) {
        setHomestaysList([]);
        setActiveHomestayId(null);
        setHomestaysError('Phiên đăng nhập không có token. Vui lòng đăng xuất và đăng nhập lại.');
        return;
      }
      const apiBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/auth\/?$/, '') || 'http://localhost:8081/api';
      const res = await fetch(`${apiBase}/owner/homestays`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setHomestaysError('');
          setHomestaysList(data);
          try {
            localStorage.setItem('owner_homestays', JSON.stringify(data.map(h => ({ id: h.id, name: h.name, city: h.region || h.city || h.address || '' }))));
          } catch (e) {}
          if (data.length > 0) {
            const storedId = localStorage.getItem('ownerActiveHomestayId');
            const found = data.find(h => String(h.id) === String(storedId));
            if (found) {
              setActiveHomestayId(found.id);
            } else {
              setActiveHomestayId(data[0].id);
              localStorage.setItem('ownerActiveHomestayId', String(data[0].id));
            }
            window.dispatchEvent(new Event('ownerHomestaysLoaded'));
          } else {
            setActiveHomestayId(null);
            localStorage.removeItem('ownerActiveHomestayId');
          }
        }
      } else {
        const body = await res.json().catch(() => ({}));
        setHomestaysError(body.message || `Không tải được cơ sở (HTTP ${res.status}).`);
        setHomestaysList([]);
        setActiveHomestayId(null);
      }
    } catch (err) {
      console.error('Lỗi nạp danh sách homestay cho sidebar:', err);
      setHomestaysError('Không thể kết nối máy chủ để tải cơ sở.');
      setHomestaysList([]);
      setActiveHomestayId(null);
    } finally {
      setHomestaysLoading(false);
    }
  };

  useEffect(() => {
    fetchHomestays();

    const user = authService.getCurrentUser();
    if (user?.id) {
      userService.getUserProfile(user.id).then(result => {
        if (result.success && result.data) {
          setOwnerProfile(result.data);
          localStorage.setItem('user', JSON.stringify({ ...user, ...result.data }));
        }
      });
    }

    const handleSync = () => {
      fetchHomestays();
    };
    window.addEventListener('ownerActiveHomestayChanged', handleSync);
    return () => window.removeEventListener('ownerActiveHomestayChanged', handleSync);
  }, []);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user?.id || !user?.token) return;
    const apiBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/auth\/?$/, '') || 'http://localhost:8081/api';
    const headers = { Authorization: `Bearer ${user.token}` };
    const load = () => fetch(`${apiBase}/notifications`, { headers })
      .then((response) => response.ok ? response.json() : [])
      .then((items) => {
        const list = Array.isArray(items) ? items : [];
        setNotifications(list);
        setNotifCount(list.filter((item) => !item.read).length);
      }).catch(() => { setNotifications([]); setNotifCount(0); });
    load();
    const socketBase = import.meta.env.VITE_WS_BASE_URL || apiBase.replace(/^http/, 'ws').replace(/\/api$/, '');
    const socket = new WebSocket(`${socketBase}/ws/notifications?token=${encodeURIComponent(user.token)}`);
    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (typeof payload.unreadCount === 'number') setNotifCount(payload.unreadCount);
        load();
      } catch { load(); }
    };
    return () => socket.close();
  }, []);

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target))   setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (hsRef.current && !hsRef.current.contains(e.target)) setHsDropdownOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectHomestay = (hsId) => {
    localStorage.setItem('ownerActiveHomestayId', String(hsId));
    setActiveHomestayId(hsId);
    setHsDropdownOpen(false);
    window.dispatchEvent(new Event('ownerActiveHomestayChanged'));
  };

  const handleReadAllNotifs = () => {
    const user = authService.getCurrentUser();
    const apiBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/auth\/?$/, '') || 'http://localhost:8081/api';
    fetch(`${apiBase}/notifications/read-all`, { method: 'PATCH', headers: { Authorization: `Bearer ${user?.token || ''}` } }).catch(() => {});
    setNotifications((items) => items.map((item) => ({ ...item, read: true })));
    setNotifCount(0);
    setNotifOpen(false);
  };

  const handleLogout = () => {
    setProfileOpen(false);
    navigate('/');
  };

  const currentHomestayObj = homestaysList.find(h => String(h.id) === String(activeHomestayId)) || homestaysList[0];

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
            <span className="owner-sidebar-brand-sub">
              {currentHomestayObj ? currentHomestayObj.name : (homestaysLoading ? 'Đang tải cơ sở...' : 'Chưa có cơ sở')}
            </span>
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

        {/* Footer: nút Chọn/Chuyển homestay + Về trang khách */}
        <div className="owner-sidebar-footer">
          <div className="owner-sidebar-hs-wrap" ref={hsRef} style={{ position: 'relative' }}>
            <div
              className="owner-sidebar-homestay-card"
              onClick={() => setHsDropdownOpen(o => !o)}
              title="Nhấn để đổi cơ sở Homestay đang quản lý"
            >
              <div className="owner-sidebar-homestay-icon">
                {currentHomestayObj?.img ? (
                  <img src={currentHomestayObj.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px' }} />
                ) : (
                  <i className="bi bi-houses-fill" />
                )}
              </div>
              <div className="owner-sidebar-homestay-info">
                <strong>{currentHomestayObj ? currentHomestayObj.name : 'Đang nạp cơ sở...'}</strong>
                <span>{currentHomestayObj ? (currentHomestayObj.region || currentHomestayObj.address || 'Việt Nam') : ''}</span>
              </div>
              <i className="bi bi-chevron-expand owner-sidebar-homestay-arrow" />
            </div>

            {/* Homestay Switcher Dropdown */}
            {hsDropdownOpen && (
              <div className="owner-hs-switcher-dropdown">
                <div className="owner-hs-switcher-header">
                  <span>Chuyển cơ sở ({homestaysList.length})</span>
                  <Link to="/owner/homestays" className="owner-hs-add-link" onClick={() => setHsDropdownOpen(false)}>
                    + Tạo cơ sở mới
                  </Link>
                </div>
                <div className="owner-hs-switcher-list">
                  {!homestaysLoading && homestaysList.length === 0 && <div className="owner-hs-item-sub">Tài khoản chưa có homestay.</div>}
                  {!homestaysLoading && homestaysError && <div className="owner-hs-item-sub owner-hs-error">{homestaysError}</div>}
                  {homestaysList.map((hs) => {
                    const isSelected = String(hs.id) === String(activeHomestayId);
                    return (
                      <div
                        key={hs.id}
                        className={`owner-hs-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleSelectHomestay(hs.id)}
                      >
                        {hs.img ? <img src={hs.img} alt={hs.name} className="owner-hs-item-img" /> : <div className="owner-hs-item-img owner-hs-item-placeholder"><i className="bi bi-houses-fill" /></div>}
                        <div className="owner-hs-item-info">
                          <div className="owner-hs-item-name">{hs.name}</div>
                          <div className="owner-hs-item-sub">{hs.region || hs.address || 'Việt Nam'}</div>
                        </div>
                        {isSelected && (
                          <i className="bi bi-check-circle-fill owner-hs-item-check" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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
                onClick={() => setNotifOpen(o => !o)}
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
                    {notifications.length ? notifications.slice(0, 8).map(n => (
                      <div key={n.id} className="owner-notif-item">
                        <div className="owner-notif-icon green">
                          <i className="bi bi-bell-fill" />
                        </div>
                        <div className="owner-notif-content">
                          <strong>{n.title}</strong>
                          <span>{n.message}</span>
                        </div>
                        <small>{n.createdAt ? new Date(n.createdAt).toLocaleString('vi-VN') : ''}</small>
                      </div>
                    )) : <div className="owner-notif-item"><div className="owner-notif-content"><span>Chưa có thông báo.</span></div></div>}
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
                  src={ownerProfile.avatar || `https://ui-avatars.com/api/?background=059669&color=fff&name=${encodeURIComponent(ownerProfile.fullName || 'Owner')}`}
                  alt="Profile"
                  className="owner-profile-avatar"
                />
                <div className="owner-profile-info">
                  <div className="owner-profile-name-row">
              <span className="owner-profile-name">{ownerProfile.fullName || ownerProfile.email || 'Chủ homestay'}</span>
                    <span className="owner-profile-role-badge">Chủ homestay</span>
                  </div>
                  <span className="owner-profile-sub">
                    {currentHomestayObj ? currentHomestayObj.name : (homestaysLoading ? 'Đang tải cơ sở...' : 'Chưa có cơ sở')}
                  </span>
                </div>
                <i className="bi bi-chevron-down owner-profile-chevron" />
              </button>

              {/* Profile dropdown menu */}
              {profileOpen && (
                <div className="owner-dropdown owner-profile-dropdown">
                  <div className="owner-dropdown-header border-b-only">
                    <div className="owner-profile-dropdown-info">
                      <img
                        src={ownerProfile.avatar || `https://ui-avatars.com/api/?background=059669&color=fff&name=${encodeURIComponent(ownerProfile.fullName || 'Owner')}`}
                        alt=""
                        className="owner-profile-avatar--lg"
                      />
                      <div>
                        <strong>{ownerProfile.fullName || 'Chủ homestay'}</strong>
                        <span>{ownerProfile.email || ''}</span>
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
