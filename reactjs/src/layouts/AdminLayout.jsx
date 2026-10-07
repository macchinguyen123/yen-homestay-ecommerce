import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import './AdminSidebar.css';
import './GlobalAdminContent.css';

export default function AdminLayout() {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    // Đóng dropdown khi click ra ngoài
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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
                            <NavLink to="/admin/complaints" className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}>
                                <span className="material-symbols-outlined menu-icon">report_problem</span>
                                <span>Quản lý báo cáo & Khiếu nại</span>
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
                            <button className="header-icon-btn" title="Thông báo hệ thống">
                                <span className="material-symbols-outlined">notifications</span>
                                <span className="badge-dot">5</span>
                            </button>
                            <button className="header-icon-btn" title="Hộp thư & Hỗ trợ">
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
