import { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import logoImg from '../../assets/logo.png';
import './Header.css';

export default function Header() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(authService.getCurrentUser());
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
        <Link to="/" className="yen-brand-logo" title="YÊN - Homestay Booking" onClick={closeMobileMenu}>
          <img src={logoImg} alt="YÊN Logo" className="yen-logo-img" />
        </Link>



        {/* Navigation Menu */}
        <nav>
          <ul className={`yen-nav-list ${mobileMenuOpen ? 'show' : ''}`}>
            <li className="yen-nav-item">
              <NavLink
                to="/"
                end
                className={({ isActive }) => `yen-nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <i className="bi bi-house-door nav-icon" />
                <span>Trang chủ</span>
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
                to="/wishlist"
                className={({ isActive }) => `yen-nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <i className="bi bi-heart nav-icon" />
                <span>Yêu thích</span>
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
                <span className="yen-noti-badge">3</span>
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
