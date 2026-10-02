import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import './Header.css';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
          <div className="yen-brand-icon">
            <i className="bi bi-house-heart-fill" />
          </div>
          <div className="yen-brand-text">
            <span className="yen-brand-name">YÊN <span>Homestay</span></span>
            <span className="yen-brand-sub">Du lịch sinh thái bản địa</span>
          </div>
        </Link>

        {/* Mobile Toggle Button */}
        <button
          className="yen-mobile-toggle"
          onClick={toggleMobileMenu}
          aria-label="Toggle Menu"
          type="button"
        >
          <i className={`bi ${mobileMenuOpen ? 'bi-x-lg' : 'bi-list'}`} />
        </button>

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
                to="/booking"
                className={({ isActive }) => `yen-nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <i className="bi bi-calendar-event nav-icon" />
                <span>Đặt phòng & Thanh toán</span>
              </NavLink>
            </li>

            <li className="yen-nav-item">
              <NavLink
                to="/bookings"
                className={({ isActive }) => `yen-nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <i className="bi bi-calendar-check nav-icon" />
                <span>Đơn phòng & Nhiệm vụ</span>
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
                <span>Wishlist</span>
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
                to="/account"
                className={({ isActive }) => `yen-nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <i className="bi bi-person-fill-gear nav-icon" />
                <span>Tài khoản</span>
              </NavLink>
            </li>

            <li className="yen-nav-item">
              <NavLink
                to="/login"
                className={({ isActive }) => `yen-nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <i className="bi bi-person-circle nav-icon" />
                <span>Đăng nhập</span>
              </NavLink>
            </li>

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
          </ul>
        </nav>
      </div>
    </header>
  );
}
