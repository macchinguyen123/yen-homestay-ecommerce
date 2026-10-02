import { Outlet, Link } from 'react-router-dom';
import './Layouts.css';

export default function UserLayout() {
  return (
    <div className="user-layout">
      {/* Header */}
      <header className="user-header">
        <div className="header-container">
          <Link to="/" className="brand-logo">
            <i className="bi bi-house-heart-fill" /> YÊN <span>Homestay</span>
          </Link>

          <nav className="header-nav">
            <Link to="/" className="nav-link active">Trang chủ</Link>
            <Link to="/homestay/doi" className="nav-link">Chi tiết Homestay</Link>
            <Link to="/owner/dashboard" className="nav-link role-switch owner">
              <i className="bi bi-person-workspace" /> Dành cho Chủ nhà
            </Link>
            <Link to="/admin/dashboard" className="nav-link role-switch admin">
              <i className="bi bi-shield-lock" /> Admin
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="user-main">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="user-footer">
        <div className="footer-container">
          <p>© 2026 YÊN Homestay E-commerce Platform. Nền tảng đặt phòng nghỉ dưỡng mộc mạc.</p>
        </div>
      </footer>
    </div>
  );
}
