import { Outlet, Link } from 'react-router-dom';
import './Layouts.css';

export default function OwnerLayout() {
  return (
    <div className="role-layout owner-layout-wrap">
      {/* Sidebar */}
      <aside className="role-sidebar owner-sidebar">
        <div className="sidebar-brand">
          <i className="bi bi-house-gear-fill" /> YÊN <span>Host</span>
        </div>

        <nav className="sidebar-menu">
          <Link to="/owner/dashboard" className="sidebar-item active">
            <i className="bi bi-speedometer2" /> Tổng quan (Dashboard)
          </Link>
          <Link to="/owner/dashboard" className="sidebar-item">
            <i className="bi bi-door-open" /> Quản lý loại phòng
          </Link>
          <Link to="/owner/dashboard" className="sidebar-item">
            <i className="bi bi-journal-bookmark" /> Danh sách Đặt phòng
          </Link>
          <Link to="/owner/dashboard" className="sidebar-item">
            <i className="bi bi-graph-up-arrow" /> Báo cáo doanh thu
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
          <div className="topbar-title">Khu vực Quản lý Chủ nhà (Host Portal)</div>
          <div className="topbar-user">
            <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80" alt="Host" />
            <span>Chị Lan Anh (Host)</span>
          </div>
        </header>

        <main className="role-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
