import { Outlet, Link } from 'react-router-dom';
import './Layouts.css';

export default function AdminLayout() {
  return (
    <div className="role-layout admin-layout-wrap">
      {/* Sidebar */}
      <aside className="role-sidebar admin-sidebar">
        <div className="sidebar-brand">
          <i className="bi bi-shield-lock-fill" /> YÊN <span>Admin</span>
        </div>

        <nav className="sidebar-menu">
          <Link to="/admin/dashboard" className="sidebar-item active">
            <i className="bi bi-speedometer2" /> Thống kê chung
          </Link>
          <Link to="/admin/dashboard" className="sidebar-item">
            <i className="bi bi-people" /> Quản lý Người dùng
          </Link>
          <Link to="/admin/dashboard" className="sidebar-item">
            <i className="bi bi-building-check" /> Duyệt Homestay mới
          </Link>
          <Link to="/admin/dashboard" className="sidebar-item">
            <i className="bi bi-currency-dollar" /> Phí giao dịch sàn
          </Link>
        </nav>

        <div className="sidebar-footer">
          <Link to="/" className="sidebar-item switch-user">
            <i className="bi bi-box-arrow-left" /> Về trang Khách hàng
          </Link>
        </div>
      </aside>

      {/* Main Container */}
      <div className="role-body">
        <header className="role-topbar">
          <div className="topbar-title">Khu vực Quản trị Hệ thống (Admin Control Center)</div>
          <div className="topbar-user">
            <span className="admin-badge"><i className="bi bi-shield" /> Super Admin</span>
          </div>
        </header>

        <main className="role-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
