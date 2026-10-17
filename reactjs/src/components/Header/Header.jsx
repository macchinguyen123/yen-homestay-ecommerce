import { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { wishlistService } from '../../services/wishlistService';
import logoImg from '../../assets/logo.png';
import './Header.css';

export default function Header() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    const current = authService.getCurrentUser();
    setUser(current);

    const updateWishlist = async () => {
      try {
        const cached = wishlistService.getCachedWishlist(current?.id);
        if (Array.isArray(cached)) {
          setWishlistCount(cached.length);
        } else if (current?.id) {
          const res = await wishlistService.getWishlist(current.id);
          if (res?.data && Array.isArray(res.data)) {
            setWishlistCount(res.data.length);
          }
        } else {
          setWishlistCount(0);
        }
      } catch (e) {
        setWishlistCount(0);
      }
    };
    updateWishlist();

    window.addEventListener('wishlist-updated', updateWishlist);
    window.addEventListener('storage', updateWishlist);

    if (current?.id) {
      const apiBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/auth\/?$/, '') || 'http://localhost:8081/api';
      const loadUnread = () => fetch(`${apiBase}/notifications/unread-count`, { headers: { Authorization: `Bearer ${current.token || ''}` } })
        .then((r) => r.ok ? r.json() : { count: 0 })
        .then((data) => setUnreadCount(Number(data.count || 0)))
        .catch(() => setUnreadCount(0));
      loadUnread();
      const socketBase = import.meta.env.VITE_WS_BASE_URL || apiBase.replace(/^http/, 'ws').replace(/\/api$/, '');
      const socket = new WebSocket(`${socketBase}/ws/notifications?token=${encodeURIComponent(current.token || '')}`);
      socket.onmessage = (event) => {
        try { const payload = JSON.parse(event.data); if (typeof payload.unreadCount === 'number') setUnreadCount(payload.unreadCount); else loadUnread(); }
        catch { loadUnread(); }
      };
      return () => {
        socket.close();
        window.removeEventListener('wishlist-updated', updateWishlist);
        window.removeEventListener('storage', updateWishlist);
      };
    }

    return () => {
      window.removeEventListener('wishlist-updated', updateWishlist);
      window.removeEventListener('storage', updateWishlist);
    };
  }, []);

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    closeMobileMenu();
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };


  return (
    <header className="yen-header">
      <div className="yen-header-container">
        {/* Brand Logo YÊN */}
        <Link to="/" className="yen-brand-logo" title="YÊN - Homestay Booking">
          <img src={logoImg} alt="YÊN Logo" className="yen-logo-img" />
        </Link>

        {/* Navigation Menu */}
        <nav>
          <ul className="yen-nav-list">
            <li className="yen-nav-item">
              <NavLink
                to="/"
                end
                className={({ isActive }) => `yen-nav-link ${isActive ? 'active' : ''}`}
              >
                <i className="bi bi-house-door nav-icon" />
                <span>Trang chủ</span>
              </NavLink>
            </li>

            <li className="yen-nav-item">
              <NavLink
                to="/category"
                className={({ isActive }) => `yen-nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <i className="bi bi-grid-fill nav-icon" />
                <span>Danh mục</span>
              </NavLink>
            </li>

            <li className="yen-nav-item">
              <NavLink
                to="/promotions"
                className={({ isActive }) => `yen-nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <i className="bi bi-gift nav-icon" />
                <span>Khuyến mãi</span>
              </NavLink>
            </li>

            <li className="yen-nav-item">
              <NavLink
                to="/wishlist"
                className={({ isActive }) => `yen-nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <i className="bi bi-heart nav-icon" />
                <span>Yêu thích</span>
                {wishlistCount > 0 && <span className="yen-noti-badge">{wishlistCount}</span>}
              </NavLink>
            </li>

            <li className="yen-nav-item">
              <NavLink
                to="/support"
                className={({ isActive }) => `yen-nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <i className="bi bi-headset nav-icon" />
                <span>Hỗ trợ</span>
              </NavLink>
            </li>



            <li className="yen-nav-item">
              <NavLink
                to="/notifications"
                className={({ isActive }) => `yen-nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <i className="bi bi-bell nav-icon" />
                <span>Thông báo</span>
                {unreadCount > 0 && <span className="yen-noti-badge">{unreadCount}</span>}
              </NavLink>
            </li>

            <li className="yen-nav-item">
              <NavLink
                to="/bookings"
                className={({ isActive }) => `yen-nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <i className="bi bi-calendar-event nav-icon" />
                <span>Đặt phòng</span>
              </NavLink>
            </li>
              <li className="yen-nav-item">
                  <NavLink
                      to="/messages"
                      className={({ isActive }) => `yen-nav-link ${isActive ? 'active' : ''}`}
                      onClick={closeMobileMenu}
                  >
                      <i className="bi bi-chat-dots nav-icon" />
                      <span>Tin nhắn</span>
                  </NavLink>
              </li>

            <li className="yen-nav-item">
              <NavLink
                to={user ? "/account" : "/login"}
                className={({ isActive }) => `yen-nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <i className="bi bi-person-circle nav-icon" />
                <span>{user ? (user.fullName?.split(' ')[0] || user.email) : "Tài khoản"}</span>
              </NavLink>
            </li>

            {user?.role === 'OWNER' && (
              <li className="yen-nav-item">
                <Link
                  to="/owner/dashboard"
                  className="yen-nav-link role-switch-pill owner"
                  onClick={closeMobileMenu}
                >
                  <i className="bi bi-person-workspace nav-icon" />
                  <span>Chủ nhà</span>
                </Link>
              </li>
            )}

            {user?.role === 'ADMIN' && (
              <li className="yen-nav-item">
                <Link
                  to="/admin/dashboard"
                  className="yen-nav-link role-switch-pill admin"
                  onClick={closeMobileMenu}
                >
                  <i className="bi bi-shield-lock nav-icon" />
                  <span>Admin</span>
                </Link>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}
