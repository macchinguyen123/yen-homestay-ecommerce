import React, { useState } from 'react';
import './AccountManagement.css';
import { Link, useNavigate } from 'react-router-dom';

export default function AccountManagement() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('all');
    
    // Modals state
    const [showUserModal, setShowUserModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showLockModal, setShowLockModal] = useState(false);

    const switchUserTab = (tab) => {
        setActiveTab(tab);
    };

    const handleEditAccount = (id) => {
        navigate(`/admin/accounts/edit`);
    };

    return (
        <div className="account-management-wrapper">
            {/* 1. Top Stat Cards (Grid 4 cột Thống kê Tài Khoản) */}
            <div className="user-stats-grid">
                <div className="user-stat-card">
                    <div className="user-stat-info">
                        <span className="user-stat-label">Tổng Số Tài Khoản</span>
                        <span className="user-stat-value" id="statTotalUsers">5</span>
                        <span className="user-stat-subtext"><span className="material-symbols-outlined" style={{ fontSize: '14px' }}>groups</span> Toàn hệ thống YÊN</span>
                    </div>
                    <div className="user-stat-icon-wrapper blue">
                        <span className="material-symbols-outlined">group</span>
                    </div>
                </div>

                <div className="user-stat-card">
                    <div className="user-stat-info">
                        <span className="user-stat-label">Khách Lưu Trú (Guests)</span>
                        <span className="user-stat-value" id="statTotalGuests">2</span>
                        <span className="user-stat-subtext"><span className="material-symbols-outlined" style={{ fontSize: '14px' }}>person</span> Đã xác thực Email/SĐT</span>
                    </div>
                    <div className="user-stat-icon-wrapper amber">
                        <span className="material-symbols-outlined">travel_explore</span>
                    </div>
                </div>

                <div className="user-stat-card">
                    <div className="user-stat-info">
                        <span className="user-stat-label">Chủ Homestay (Hosts)</span>
                        <span className="user-stat-value" id="statTotalHosts">2</span>
                        <span className="user-stat-subtext"><span className="material-symbols-outlined" style={{ fontSize: '14px' }}>verified</span> Đã xác minh KYC</span>
                    </div>
                    <div className="user-stat-icon-wrapper green">
                        <span className="material-symbols-outlined">cottage</span>
                    </div>
                </div>

                <div className="user-stat-card">
                    <div className="user-stat-info">
                        <span className="user-stat-label">Đang Hoạt Động (Active)</span>
                        <span className="user-stat-value" id="statActiveUsers">4</span>
                        <span className="user-stat-subtext"><span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check_circle</span> Trạng thái bình thường</span>
                    </div>
                    <div className="user-stat-icon-wrapper green">
                        <span className="material-symbols-outlined">how_to_reg</span>
                    </div>
                </div>
            </div>

            {/* 2. Main Content Module Card */}
            <div className="content-module-card">
                
                {/* Module Header Bar */}
                <div className="module-header-bar">
                    <div className="module-title-group">
                        <h2>
                            <span className="material-symbols-outlined" style={{ color: '#0284C7' }}>group</span>
                            Quản Lý Tài Khoản Người Dùng & Phân Quyền
                        </h2>
                        <span className="module-subtitle">Quản lý Du khách lưu trú, Đối tác Chủ Homestay (Hosts) & Phân quyền Quản trị viên</span>
                    </div>

                    {/* Sub-module Navigation Tabs */}
                    <div className="content-tabs">
                        <button className={`content-tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => switchUserTab('all')}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>groups</span>
                            Tất Cả
                        </button>
                        <button className={`content-tab-btn ${activeTab === 'guest' ? 'active' : ''}`} onClick={() => switchUserTab('guest')}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person</span>
                            Khách Lưu Trú
                        </button>
                        <button className={`content-tab-btn ${activeTab === 'host' ? 'active' : ''}`} onClick={() => switchUserTab('host')}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>cottage</span>
                            Chủ Homestay (Owners)
                        </button>
                        <button className={`content-tab-btn ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => switchUserTab('admin')}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>admin_panel_settings</span>
                            Quản Trị Viên (Phân Quyền)
                        </button>
                    </div>
                </div>

                {/* Module Toolbar (Search & Filter) */}
                <div className="module-toolbar">
                    <div className="toolbar-left">
                        <div className="search-box-sm">
                            <span className="material-symbols-outlined" style={{ color: 'var(--text-muted)', marginRight: '6px', fontSize: '18px' }}>search</span>
                            <input type="text" id="userSearchInput" placeholder="Tìm tên, email, số điện thoại..." />
                        </div>

                        <select className="select-filter-sm" id="userStatusFilter">
                            <option value="all">Tất cả trạng thái</option>
                            <option value="active">Đang hoạt động</option>
                            <option value="blocked">Bị khóa</option>
                        </select>
                    </div>
                </div>

                {/* Data Table View */}
                <div className="table-responsive">
                    <table className="admin-data-table">
                        <thead id="userTableHeader">
                            <tr>
                                <th>ID</th>
                                <th>Họ Tên</th>
                                <th>Email</th>
                                <th>Vai Trò</th>
                                <th>Trạng Thái</th>
                                <th>Hành Động</th>
                            </tr>
                        </thead>
                        <tbody id="userTableBody">
                            {/* Dummy Data for Display */}
                            <tr>
                                <td>usr-1</td>
                                <td>Nguyễn Văn An</td>
                                <td>an.nguyen@gmail.com</td>
                                <td>
                                    <span className="role-badge admin">Quản trị viên</span>
                                </td>
                                <td>
                                    <span className="user-status-badge active">Hoạt động</span>
                                </td>
                                <td>
                                    <div className="action-btns">
                                        <button className="btn-action-icon" title="Chi tiết" onClick={() => setShowDetailModal(true)}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>visibility</span>
                                        </button>
                                        <button className="btn-action-icon" title="Sửa" onClick={() => handleEditAccount('usr-1')}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                                        </button>
                                        <button className="btn-action-icon" title="Khóa" onClick={() => setShowLockModal(true)}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#DC2626' }}>lock</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

            </div>

            {/* Modals placeholders */}
            {showUserModal && (
                <div className="modal-overlay">
                    <div className="modal-container">
                        <div className="modal-header">
                            <h3 className="modal-title">
                                <span className="material-symbols-outlined" style={{ color: '#0284C7' }}>manage_accounts</span>
                                Chỉnh Sửa Thông Tin Tài Khoản & Phân Quyền
                            </h3>
                            <button className="modal-close-btn" onClick={() => setShowUserModal(false)}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-field full">
                                <label className="form-label">Họ và Tên <span style={{ color: 'red' }}>*</span></label>
                                <input type="text" className="form-input" placeholder="Ví dụ: Nguyễn Văn An..." />
                            </div>
                            <div className="form-group-grid">
                                <div className="form-field">
                                    <label className="form-label">Địa chỉ Email <span style={{ color: 'red' }}>*</span></label>
                                    <input type="email" className="form-input" placeholder="an.nguyen@gmail.com" />
                                </div>
                                <div className="form-field">
                                    <label className="form-label">Số điện thoại</label>
                                    <input type="text" className="form-input" placeholder="0905 123 456" />
                                </div>
                            </div>
                            <div className="form-group-grid">
                                <div className="form-field">
                                    <label className="form-label">Vai trò / Phân quyền <span style={{ color: 'red' }}>*</span></label>
                                    <select className="form-select" defaultValue="guest">
                                        <option value="guest">Khách lưu trú (Guest)</option>
                                        <option value="host">Chủ Homestay (Host Owner)</option>
                                        <option value="admin">Quản trị viên (System Admin)</option>
                                    </select>
                                </div>
                                <div className="form-field">
                                    <label className="form-label">Trạng thái tài khoản</label>
                                    <select className="form-select" defaultValue="active">
                                        <option value="active">Đang hoạt động (Active)</option>
                                        <option value="blocked">Khóa tài khoản (Blocked)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-admin-cancel" onClick={() => setShowUserModal(false)}>Hủy bỏ</button>
                            <button className="btn-admin-primary" style={{ backgroundColor: '#0284C7' }}>Lưu Tài Khoản</button>
                        </div>
                    </div>
                </div>
            )}

            {showDetailModal && (
                <div className="modal-overlay">
                    <div className="modal-container" style={{ width: '680px' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                <span className="material-symbols-outlined" style={{ color: '#0284C7' }}>account_box</span>
                                Chi Tiết Tài Khoản Người Dùng
                            </h3>
                            <button className="modal-close-btn" onClick={() => setShowDetailModal(false)}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <p>Chi tiết sẽ được hiển thị tại đây...</p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-admin-cancel" onClick={() => setShowDetailModal(false)}>Đóng cửa sổ</button>
                        </div>
                    </div>
                </div>
            )}

            {showLockModal && (
                <div className="modal-overlay">
                    <div className="modal-container" style={{ width: '500px' }}>
                        <div className="modal-header" style={{ background: '#FEF2F2' }}>
                            <h3 className="modal-title" style={{ color: '#DC2626' }}>
                                <span className="material-symbols-outlined" style={{ color: '#DC2626' }}>lock</span>
                                Xác Nhận Khóa Tài Khoản
                            </h3>
                            <button className="modal-close-btn" onClick={() => setShowLockModal(false)}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <p style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B' }}>Khóa truy cập cho tài khoản: <strong style={{ color: '#DC2626' }}>-</strong></p>
                            <div className="form-field full" style={{ marginTop: '12px' }}>
                                <label className="form-label">Lý do khóa tài khoản <span style={{ color: 'red' }}>*</span></label>
                                <select className="form-select">
                                    <option value="Vi phạm chính sách hệ thống">Vi phạm chính sách hệ thống YÊN Homestay</option>
                                    <option value="Spammer / Đặt phòng ảo">Spammer / Đặt phòng ảo không đến</option>
                                    <option value="Khiếu nại chưa xử lý">Có báo cáo / Khiếu nại nghiêm trọng</option>
                                    <option value="Yêu cầu từ người dùng">Theo yêu cầu trực tiếp từ chủ tài khoản</option>
                                </select>
                            </div>
                            <div className="form-field full" style={{ marginTop: '12px' }}>
                                <label className="form-label">Thời hạn khóa</label>
                                <select className="form-select">
                                    <option value="Vĩnh viễn">Vĩnh viễn (Permanent Lock)</option>
                                    <option value="7 ngày">Tạm khóa 7 ngày</option>
                                    <option value="30 ngày">Tạm khóa 30 ngày</option>
                                </select>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-admin-cancel" onClick={() => setShowLockModal(false)}>Hủy</button>
                            <button className="btn-admin-primary" style={{ backgroundColor: '#DC2626' }}>🔒 Đồng ý Khóa Tài Khoản</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
