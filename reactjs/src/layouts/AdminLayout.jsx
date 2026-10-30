import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import './AdminSidebar.css';
import './GlobalAdminContent.css';

export default function AdminLayout() {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifOpen, setNotifOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [loadingNotifs, setLoadingNotifs] = useState(false);

    const dropdownRef = useRef(null);
    const notifRef = useRef(null);
    const navigate = useNavigate();

    // Đóng dropdown khi click ra ngoài
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setNotifOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        if (!user?.id || !user?.token) return;
        setLoadingNotifs(true);
        const apiBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/auth\/?$/, '') || 'http://localhost:8081/api';
        try {
            const res = await fetch(`${apiBase}/notifications`, {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                    'X-User-Id': String(user.id)
                }
            });
            if (res.ok) {
                const data = await res.json();
                const list = Array.isArray(data) ? data : [];
                setNotifications(list);
                setUnreadCount(list.filter((n) => !n.read).length);
            }
        } catch (err) {
            console.error('Lỗi tải thông báo admin:', err);
        } finally {
            setLoadingNotifs(false);
        }
    };

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        if (!user?.id || !user?.token) return;
        const apiBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/auth\/?$/, '') || 'http://localhost:8081/api';
        const loadCount = () => fetch(`${apiBase}/notifications/unread-count`, {
            headers: {
                Authorization: `Bearer ${user.token}`,
                'X-User-Id': String(user.id)
            }
        })
            .then((response) => response.ok ? response.json() : { count: 0 })
            .then((data) => setUnreadCount(Number(data.count || 0)))
            .catch(() => setUnreadCount(0));

        loadCount();
        const socketBase = import.meta.env.VITE_WS_BASE_URL || apiBase.replace(/^http/, 'ws').replace(/\/api$/, '');
        const socket = new WebSocket(`${socketBase}/ws/notifications?token=${encodeURIComponent(user.token)}`);
        socket.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data);
                if (typeof payload.unreadCount === 'number') {
                    setUnreadCount(payload.unreadCount);
                } else {
                    loadCount();
                }
            } catch {
                loadCount();
            }
        };
        return () => socket.close();
    }, []);

    const toggleNotifDropdown = () => {
        const nextState = !notifOpen;
        setNotifOpen(nextState);
        if (nextState) {
            fetchNotifications();
        }
    };

    const handleMarkAllRead = async () => {
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        if (!user?.token) return;
        const apiBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/auth\/?$/, '') || 'http://localhost:8081/api';
        try {
            await fetch(`${apiBase}/notifications/read-all`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${user.token}`,
                    'X-User-Id': String(user.id)
                }
            });
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Lỗi đánh dấu tất cả thông báo đã đọc:', err);
        }
    };

    const handleNotificationClick = async (notif) => {
        if (!notif.read) {
            const user = JSON.parse(localStorage.getItem('user') || 'null');
            if (user?.token) {
                const apiBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/auth\/?$/, '') || 'http://localhost:8081/api';
                fetch(`${apiBase}/notifications/${notif.id}/read`, {
                    method: 'PATCH',
                    headers: {
                        Authorization: `Bearer ${user.token}`,
                        'X-User-Id': String(user.id)
                    }
                }).catch(() => {});
            }
            setNotifications((prev) =>
                prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
            );
            setUnreadCount((c) => Math.max(0, c - 1));
        }

        setNotifOpen(false);
        if (notif.url) {
            navigate(notif.url);
        } else if (notif.type === 'BOOKING') {
            navigate('/admin/transactions');
        } else if (notif.type === 'COMPLAINT') {
            navigate('/admin/complaints');
        } else if (notif.type === 'HOMESTAY') {
            navigate('/admin/homestays');
        } else if (notif.type === 'REVIEW') {
            navigate('/admin/reviews');
        }
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return '';
        try {
            const d = new Date(timeStr);
            if (isNaN(d.getTime())) return timeStr;
            return d.toLocaleString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                day: '2-digit',
                month: '2-digit'
            });
        } catch {
            return timeStr;
        }
    };

    const getIconClass = (type) => {
        switch ((type || '').toUpperCase()) {
            case 'BOOKING': return 'green';
            case 'COMPLAINT': return 'red';
            case 'HOMESTAY': return 'blue';
            case 'REVIEW': return 'amber';
            default: return 'green';
        }
    };

    const getIconName = (type) => {
        switch ((type || '').toUpperCase()) {
            case 'BOOKING': return 'receipt_long';
            case 'COMPLAINT': return 'report_problem';
            case 'HOMESTAY': return 'cottage';
            case 'REVIEW': return 'rate_review';
            default: return 'notifications';
        }
    };

    return (
        <div className="admin-wrapper">
            {/* SIDEBAR QUẢN TRỊ ADMIN */}
            <aside className="admin-sidebar">
                <div className="sidebar-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => navigate('/admin/dashboard')}>
                        <img src="/logo_white.png" alt="YÊN Homestay Logo" style={{ height: '32px', width: 'auto', objectFit: 'contain' }} />
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ color: '#A7F3D0', fontSize: '13px', fontWeight: '700', lineHeight: '1.2' }}>YÊN Homestay</span>
                            <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '11px', fontWeight: '500', letterSpacing: '0.5px' }}>Admin Panel</span>
                        </div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    <ul className="sidebar-menu">
                        <li className="menu-item">
                            <NavLink to="/admin/dashboard" className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}>
                                <span className="material-symbols-outlined menu-icon">dashboard</span>
                                <span>Dashboard</span>
                            </NavLink>
                        </li>
                        <li className="menu-item">
                            <NavLink to="/admin/accounts" className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}>
                                <span className="material-symbols-outlined menu-icon">group</span>
                                <span>Quản lý tài khoản</span>
                            </NavLink>
                        </li>
                        <li className="menu-item">
                            <NavLink to="/admin/homestays" className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}>
                                <span className="material-symbols-outlined menu-icon">cottage</span>
                                <span>Quản lý Homestay</span>
                            </NavLink>
                        </li>
                        <li className="menu-item">
                            <NavLink to="/admin/local-content" className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}>
                                <span className="material-symbols-outlined menu-icon">map</span>
                                <span>Quản lý nội dung địa phương</span>
                            </NavLink>
                        </li>
                        <li className="menu-item">
                            <NavLink to="/admin/transactions" className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}>
                                <span className="material-symbols-outlined menu-icon">receipt_long</span>
                                <span>Quản lý giao dịch</span>
                            </NavLink>
                        </li>
                        <li className="menu-item">
                            <NavLink to="/admin/ads" className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}>
                                <span className="material-symbols-outlined menu-icon">campaign</span>
                                <span>Bán & Dịch vụ quảng cáo</span>
                            </NavLink>
                        </li>
                        <li className="menu-item">
                            <NavLink to="/admin/vouchers" className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}>
                                <span className="material-symbols-outlined menu-icon">local_offer</span>
                                <span>Quản lý mã giảm giá</span>
                            </NavLink>
                        </li>
                        <li className="menu-item">
                            <NavLink to="/admin/reports" className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}>
                                <span className="material-symbols-outlined menu-icon">bar_chart</span>
                                <span>Báo cáo & Thống kê</span>
                            </NavLink>
                        </li>
                        <li className="menu-item">
                            <NavLink to="/admin/reviews" className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}>
                                <span className="material-symbols-outlined menu-icon">rate_review</span>
                                <span>Đánh giá & Phân tích</span>
                            </NavLink>
                        </li>
                        <li className="menu-item">
                            <NavLink to="/admin/complaints" className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}>
                                <span className="material-symbols-outlined menu-icon">report_problem</span>
                                <span>Quản lý báo cáo & Khiếu nại</span>
                            </NavLink>
                        </li>
                        <li className="menu-item">
                            <NavLink to="/admin/messages" className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}>
                                <span className="material-symbols-outlined menu-icon">chat</span>
                                <span>Tin nhắn & Hỗ trợ</span>
                            </NavLink>
                        </li>
                    </ul>
                </nav>

                <div className="sidebar-footer">
                    <div className="host-profile" onClick={() => navigate('/')}>
                        <div className="host-icon">
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>storefront</span>
                        </div>
                        <div className="host-info">
                            <h4>Trang Khách hàng</h4>
                            <p>Về trang chủ sàn YÊN</p>
                        </div>
                        <span className="material-symbols-outlined" style={{ color: '#81b099', fontSize: '16px' }}>open_in_new</span>
                    </div>
                    <div className="host-quote">
                        "Hệ thống quản trị YÊN Homestay"
                    </div>
                </div>
            </aside>

            {/* MAIN ADMIN CONTENT */}
            <div className="admin-main">
                {/* ADMIN HEADER */}
                <header className="admin-header">
                    <div className="header-left">
                        <div className="header-search">
                            <span className="material-symbols-outlined search-icon">search</span>
                            <input type="text" className="search-input" placeholder="Tìm kiếm tài khoản, homestay, giao dịch, bài viết..." />
                        </div>
                    </div>

                    <div className="admin-header-right">
                        <div className="header-action-btns">
                            {/* Nút Thông báo hệ thống với Dropdown */}
                            <div className="admin-notif-wrapper" ref={notifRef}>
                                <button
                                    className={`header-icon-btn ${notifOpen ? 'active' : ''}`}
                                    title="Thông báo hệ thống"
                                    onClick={toggleNotifDropdown}
                                >
                                    <span className="material-symbols-outlined">notifications</span>
                                    {unreadCount > 0 && <span className="badge-dot">{unreadCount}</span>}
                                </button>

                                {notifOpen && (
                                    <div className="admin-notif-dropdown">
                                        <div className="admin-notif-header">
                                            <div className="admin-notif-title-row">
                                                <span className="admin-notif-title">Thông báo hệ thống</span>
                                                {unreadCount > 0 && (
                                                    <span className="admin-notif-badge-pill">{unreadCount} mới</span>
                                                )}
                                            </div>
                                            {unreadCount > 0 && (
                                                <button className="admin-notif-mark-all" onClick={handleMarkAllRead}>
                                                    Đọc tất cả
                                                </button>
                                            )}
                                        </div>

                                        <div className="admin-notif-list">
                                            {loadingNotifs ? (
                                                <div className="admin-notif-empty">
                                                    <span>Đang tải thông báo...</span>
                                                </div>
                                            ) : notifications.length === 0 ? (
                                                <div className="admin-notif-empty">
                                                    <span className="material-symbols-outlined">notifications_off</span>
                                                    <span>Chưa có thông báo nào mới</span>
                                                </div>
                                            ) : (
                                                notifications.map((n) => (
                                                    <div
                                                        key={n.id}
                                                        className={`admin-notif-item ${!n.read ? 'unread' : ''}`}
                                                        onClick={() => handleNotificationClick(n)}
                                                    >
                                                        <div className={`admin-notif-icon-box ${getIconClass(n.type)}`}>
                                                            <span className="material-symbols-outlined">
                                                                {getIconName(n.type)}
                                                            </span>
                                                        </div>
                                                        <div className="admin-notif-body">
                                                            <span className="admin-notif-item-title">{n.title}</span>
                                                            <span className="admin-notif-item-desc">{n.message}</span>
                                                            <span className="admin-notif-item-time">{formatTime(n.createdAt)}</span>
                                                        </div>
                                                        {!n.read && <span className="admin-notif-unread-dot"></span>}
                                                    </div>
                                                ))
                                            )}
                                        </div>

                                        <div className="admin-notif-footer">
                                            <span
                                                className="admin-notif-footer-link"
                                                onClick={() => {
                                                    setNotifOpen(false);
                                                    navigate('/admin/dashboard');
                                                }}
                                            >
                                                Xem bảng điều khiển
                                            </span>
                                            <span
                                                className="admin-notif-footer-link"
                                                onClick={() => setNotifOpen(false)}
                                            >
                                                Đóng
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Nút Hộp thư & Hỗ trợ (Tin nhắn) */}
                            <button
                                className="header-icon-btn"
                                title="Hộp thư & Tin nhắn hỗ trợ"
                                onClick={() => navigate('/admin/messages')}
                            >
                                <span className="material-symbols-outlined">chat</span>
                            </button>
                        </div>

                        <div className="header-divider"></div>

                        <div className="owner-header-profile-wrapper" ref={dropdownRef}>
                            <div className={`owner-header-profile ${dropdownOpen ? 'active' : ''}`} onClick={() => setDropdownOpen(!dropdownOpen)}>
                                <div className="owner-avatar">A</div>
                                <div className="owner-info">
                                    <div className="owner-info-top">
                                        <span className="owner-name">Admin System</span>
                                        <span className="owner-role-badge">Quản trị viên</span>
                                    </div>
                                    <span className="owner-subtext">Hệ thống YÊN</span>
                                </div>
                                <span className="material-symbols-outlined dropdown-arrow" style={{ fontSize: '18px', color: 'var(--text-muted)', marginLeft: '2px' }}>expand_more</span>
                            </div>

                            <div className={`profile-dropdown-menu ${dropdownOpen ? 'show' : ''}`}>
                                <div className="dropdown-header">
                                    <strong className="dropdown-user-name">Admin System</strong>
                                    <span className="dropdown-user-email">admin@yenhomestay.com</span>
                                </div>
                                <div className="dropdown-divider"></div>
                                <div className="dropdown-item" onClick={() => navigate('/admin/reports')}>
                                    <span className="material-symbols-outlined">analytics</span>
                                    <span>Báo cáo & Thống kê</span>
                                </div>
                                <div className="dropdown-item" onClick={() => navigate('/admin/accounts')}>
                                    <span className="material-symbols-outlined">manage_accounts</span>
                                    <span>Quản lý người dùng</span>
                                </div>
                                <div className="dropdown-item" onClick={() => navigate('/admin/messages')}>
                                    <span className="material-symbols-outlined">chat</span>
                                    <span>Hộp thư tin nhắn</span>
                                </div>
                                <div className="dropdown-divider"></div>
                                <div className="dropdown-item text-danger" onClick={() => navigate('/')}>
                                    <span className="material-symbols-outlined">logout</span>
                                    <span>Đăng xuất</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="admin-body-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
