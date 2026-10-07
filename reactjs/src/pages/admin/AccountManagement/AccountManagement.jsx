import React, { useState, useEffect, useMemo } from 'react';
import './AccountManagement.css';
import { useNavigate } from 'react-router-dom';
import { adminUserService } from '../../../services/adminUserService';

export default function AccountManagement() {
    const navigate = useNavigate();

    // Stats state
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalGuests: 0,
        totalHosts: 0,
        activeUsers: 0,
        blockedUsers: 0,
    });

    // Users list & filter states
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all'); // 'all' | 'guest' | 'host' | 'admin'
    const [searchKeyword, setSearchKeyword] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'blocked'



    // Detail modal
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedUserDetail, setSelectedUserDetail] = useState(null);

    // Lock modal
    const [lockModalOpen, setLockModalOpen] = useState(false);
    const [targetLockUser, setTargetLockUser] = useState(null);
    const [lockReason, setLockReason] = useState('Vi phạm chính sách hệ thống');
    const [lockDuration, setLockDuration] = useState('Vĩnh viễn');

    // Load Data from Real Backend (Spring Boot + Neon PostgreSQL)
    const loadData = async () => {
        setLoading(true);
        try {
            const [statsData, usersData] = await Promise.all([
                adminUserService.getUserStats(),
                adminUserService.getUsers('all', 'all', ''),
            ]);
            if (statsData) setStats(statsData);
            if (Array.isArray(usersData)) setUsers(usersData);
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu tài khoản:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Filtered users according to current active tab, search, and status
    const filteredUsers = useMemo(() => {
        const kw = searchKeyword.trim().toLowerCase();
        return users.filter((u) => {
            // Tab filter
            const role = (u.role || '').toUpperCase();
            if (activeTab === 'guest') {
                if (role !== 'TOURIST' && role !== 'USER') return false;
            } else if (activeTab === 'host') {
                if (role !== 'OWNER') return false;
            } else if (activeTab === 'admin') {
                if (role !== 'ADMIN') return false;
            }

            // Status filter
            const status = (u.status || 'ACTIVE').toUpperCase();
            if (statusFilter === 'active' && status !== 'ACTIVE') return false;
            if (statusFilter === 'blocked' && status !== 'BLOCKED' && status !== 'INACTIVE') return false;

            // Search keyword
            if (kw) {
                const nameMatch = (u.fullName || '').toLowerCase().includes(kw);
                const emailMatch = (u.email || '').toLowerCase().includes(kw);
                const phoneMatch = (u.phoneNumber || '').toLowerCase().includes(kw);
                const cccdMatch = (u.cccd || '').toLowerCase().includes(kw);
                const idMatch = String(u.id || '').includes(kw);
                if (!nameMatch && !emailMatch && !phoneMatch && !cccdMatch && !idMatch) {
                    return false;
                }
            }

            return true;
        });
    }, [users, activeTab, statusFilter, searchKeyword]);

    // Role helper mappings
    const getRoleClass = (role) => {
        const r = (role || '').toUpperCase();
        if (r === 'OWNER') return 'host';
        if (r === 'ADMIN') return 'admin';
        return 'guest';
    };

    const getAvatarBg = (u) => {
        const r = (u.role || '').toUpperCase();
        if (r === 'OWNER') return 'linear-gradient(135deg, #15803D 0%, #166534 100%)';
        if (r === 'ADMIN') return 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)';
        return 'linear-gradient(135deg, #D97706 0%, #B45309 100%)';
    };



    // Lock / Unlock Handlers
    const handleLockToggle = async (u) => {
        const isBlocked = (u.status || '').toUpperCase() === 'BLOCKED' || (u.status || '').toUpperCase() === 'INACTIVE';
        if (isBlocked) {
            if (window.confirm(`Mở khóa cho tài khoản "${u.fullName || u.email}"?`)) {
                const res = await adminUserService.updateUserStatus(u.id, {
                    status: 'ACTIVE',
                    reason: '',
                    duration: '',
                });
                if (res.success) {
                    alert('Đã mở khóa tài khoản thành công!');
                    loadData();
                } else {
                    alert('Lỗi khi mở khóa: ' + res.message);
                }
            }
        } else {
            setTargetLockUser(u);
            setLockReason('Vi phạm chính sách hệ thống');
            setLockDuration('Vĩnh viễn');
            setLockModalOpen(true);
        }
    };

    const confirmLockAccount = async () => {
        if (!targetLockUser) return;
        const res = await adminUserService.updateUserStatus(targetLockUser.id, {
            status: 'BLOCKED',
            reason: lockReason,
            duration: lockDuration,
        });

        if (res.success) {
            alert(`Đã khóa tài khoản "${targetLockUser.fullName}" thành công!`);
            setLockModalOpen(false);
            setTargetLockUser(null);
            loadData();
        } else {
            alert('Lỗi khi khóa tài khoản: ' + res.message);
        }
    };

    // Detail Modal Handler
    const openUserDetail = (u) => {
        setSelectedUserDetail(u);
        setDetailModalOpen(true);
    };

    return (
        <div className="account-management-wrapper">
            {/* 1. Top Stat Cards (Grid 4 cột Thống kê Tài Khoản) */}
            <div className="user-stats-grid">
                <div className="user-stat-card">
                    <div className="user-stat-info">
                        <span className="user-stat-label">Tổng Số Tài Khoản</span>
                        <span className="user-stat-value" id="statTotalUsers">
                            {loading ? '...' : stats.totalUsers}
                        </span>
                        <span className="user-stat-subtext">
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>groups</span>
                            Toàn hệ thống YÊN
                        </span>
                    </div>
                    <div className="user-stat-icon-wrapper blue">
                        <span className="material-symbols-outlined">group</span>
                    </div>
                </div>

                <div className="user-stat-card">
                    <div className="user-stat-info">
                        <span className="user-stat-label">Khách Lưu Trú (Guests)</span>
                        <span className="user-stat-value" id="statTotalGuests">
                            {loading ? '...' : stats.totalGuests}
                        </span>
                        <span className="user-stat-subtext">
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>person</span>
                            Đã xác thực Email/SĐT
                        </span>
                    </div>
                    <div className="user-stat-icon-wrapper amber">
                        <span className="material-symbols-outlined">travel_explore</span>
                    </div>
                </div>

                <div className="user-stat-card">
                    <div className="user-stat-info">
                        <span className="user-stat-label">Chủ Homestay (Hosts)</span>
                        <span className="user-stat-value" id="statTotalHosts">
                            {loading ? '...' : stats.totalHosts}
                        </span>
                        <span className="user-stat-subtext">
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>verified</span>
                            Đã xác minh KYC
                        </span>
                    </div>
                    <div className="user-stat-icon-wrapper green">
                        <span className="material-symbols-outlined">cottage</span>
                    </div>
                </div>

                <div className="user-stat-card">
                    <div className="user-stat-info">
                        <span className="user-stat-label">Đang Hoạt Động (Active)</span>
                        <span className="user-stat-value" id="statActiveUsers">
                            {loading ? '...' : stats.activeUsers}
                        </span>
                        <span className="user-stat-subtext">
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check_circle</span>
                            Trạng thái bình thường
                        </span>
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
                        <span className="module-subtitle">
                            Quản lý Du khách lưu trú, Đối tác Chủ Homestay (Hosts) & Phân quyền Quản trị viên
                        </span>
                    </div>

                    {/* Sub-module Navigation Tabs */}
                    <div className="content-tabs">
                        <button
                            className={`content-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                            data-tab="all"
                            onClick={() => setActiveTab('all')}
                            type="button"
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>groups</span>
                            Tất Cả
                        </button>
                        <button
                            className={`content-tab-btn ${activeTab === 'guest' ? 'active' : ''}`}
                            data-tab="guest"
                            onClick={() => setActiveTab('guest')}
                            type="button"
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person</span>
                            Khách Lưu Trú
                        </button>
                        <button
                            className={`content-tab-btn ${activeTab === 'host' ? 'active' : ''}`}
                            data-tab="host"
                            onClick={() => setActiveTab('host')}
                            type="button"
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>cottage</span>
                            Chủ Homestay (Owners)
                        </button>
                        <button
                            className={`content-tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
                            data-tab="admin"
                            onClick={() => setActiveTab('admin')}
                            type="button"
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>admin_panel_settings</span>
                            Quản Trị Viên (Phân Quyền)
                        </button>
                    </div>
                </div>

                {/* Module Toolbar (Search & Filter) */}
                <div className="module-toolbar">
                    <div className="toolbar-left">
                        <div className="search-box-sm">
                            <span
                                className="material-symbols-outlined"
                                style={{ color: 'var(--text-muted, #64748B)', marginRight: '6px', fontSize: '18px' }}
                            >
                                search
                            </span>
                            <input
                                type="text"
                                id="userSearchInput"
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                                placeholder="Tìm tên, email, số điện thoại..."
                            />
                        </div>

                        <select
                            className="select-filter-sm"
                            id="userStatusFilter"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
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
                            {activeTab === 'host' ? (
                                <tr>
                                    <th>Chủ Homestay Owner</th>
                                    <th>Thông Tin Liên Hệ</th>
                                    <th>Xác Minh KYC & CCCD</th>
                                    <th>Danh Sách Homestay Sở Hữu</th>
                                    <th>Tổng Đặt Phòng</th>
                                    <th>Trạng Thái</th>
                                    <th style={{ textAlign: 'right' }}>Thao Tác</th>
                                </tr>
                            ) : (
                                <tr>
                                    <th>Tài Khoản / Người Dùng</th>
                                    <th>Email & Số Điện Thoại</th>
                                    <th>Vai Trò & Phân Quyền</th>
                                    <th>Ngày Tham Gia</th>
                                    <th>Thống Kê Hoạt Động</th>
                                    <th>Trạng Thái</th>
                                    <th style={{ textAlign: 'right' }}>Thao Tác</th>
                                </tr>
                            )}
                        </thead>
                        <tbody id="userTableBody">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted, #64748B)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                            <span className="material-symbols-outlined" style={{ animation: 'spin 1s linear infinite' }}>sync</span>
                                            <span>Đang tải dữ liệu từ CSDL Neon PostgreSQL...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted, #64748B)' }}>
                                        Không tìm thấy tài khoản phù hợp trong hệ thống.
                                    </td>
                                </tr>
                            ) : activeTab === 'host' ? (
                                filteredUsers.map((item) => (
                                    <tr key={item.id}>
                                        <td>
                                            <div
                                                className="cell-item-title"
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => navigate(`/admin/accounts/edit?id=${item.id}`)}
                                                title="Bấm để chỉnh sửa chi tiết"
                                            >
                                                {item.avatar ? (
                                                    <img
                                                        src={item.avatar}
                                                        alt={item.fullName}
                                                        className="user-avatar-circle"
                                                        style={{ objectFit: 'cover' }}
                                                    />
                                                ) : (
                                                    <div
                                                        className="user-avatar-circle"
                                                        style={{ background: getAvatarBg(item) }}
                                                    >
                                                        {(item.fullName || item.email || 'H').charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div className="item-name-group">
                                                    <span className="item-name" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        {item.fullName || item.email}
                                                        <span
                                                            className="material-symbols-outlined"
                                                            style={{ color: '#15803D', fontSize: '16px' }}
                                                            title="Verified Host"
                                                        >
                                                            verified
                                                        </span>
                                                    </span>
                                                    <span style={{ fontSize: '11.5px', color: '#15803D', fontWeight: 700 }}>
                                                        {item.memberTier || 'Chủ Homestay'}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <strong style={{ fontSize: '13px', color: 'var(--text-main, #0F172A)' }}>
                                                    {item.email}
                                                </strong>
                                                <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748B)' }}>
                                                    {item.phoneNumber || 'Chưa cập nhật SĐT'}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                <span
                                                    className="status-badge active"
                                                    style={{ background: '#DCFCE7', color: '#15803D', width: 'fit-content' }}
                                                >
                                                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                                                        verified_user
                                                    </span>
                                                    {item.kycText || 'Đã xác minh KYC'}
                                                </span>
                                                {item.cccd ? (
                                                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted, #64748B)', fontFamily: 'monospace' }}>
                                                        CCCD: {item.cccd}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                <span className="status-badge active" style={{ width: 'fit-content' }}>
                                                    🏡 {item.homestayCount || 0} Căn Homestay
                                                </span>
                                                <span
                                                    style={{
                                                        fontSize: '11.5px',
                                                        color: 'var(--text-muted, #64748B)',
                                                        maxWidth: '260px',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                    }}
                                                >
                                                    {item.homestays && item.homestays.length > 0
                                                        ? item.homestays.join(', ')
                                                        : 'Đang chuẩn bị danh sách phòng'}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <strong style={{ fontSize: '14px', color: '#0284C7' }}>
                                                {item.bookingsCount || 0} lượt khách
                                            </strong>
                                        </td>
                                        <td>
                                            <span className={`user-status-badge ${(item.status || 'ACTIVE').toLowerCase()}`}>
                                                {item.statusText || ((item.status || '').toUpperCase() === 'ACTIVE' ? 'Đang hoạt động' : 'Bị khóa')}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-btns" style={{ justifyContent: 'flex-end' }}>
                                                <button
                                                    className="btn-action-icon"
                                                    title="Chỉnh sửa chi tiết"
                                                    onClick={() => navigate(`/admin/accounts/edit?id=${item.id}`)}
                                                    type="button"
                                                >
                                                    <span className="material-symbols-outlined" style={{ color: '#15803D' }}>
                                                        edit
                                                    </span>
                                                </button>
                                                <button
                                                    className="btn-action-icon"
                                                    title={(item.status || '').toUpperCase() === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa'}
                                                    onClick={() => handleLockToggle(item)}
                                                    type="button"
                                                >
                                                    <span
                                                        className="material-symbols-outlined"
                                                        style={{ color: (item.status || '').toUpperCase() === 'ACTIVE' ? '#EF4444' : '#15803D' }}
                                                    >
                                                        {(item.status || '').toUpperCase() === 'ACTIVE' ? 'lock' : 'lock_open'}
                                                    </span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                filteredUsers.map((item) => (
                                    <tr key={item.id}>
                                        <td>
                                            <div
                                                className="cell-item-title"
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => navigate(`/admin/accounts/edit?id=${item.id}`)}
                                                title="Bấm để chỉnh sửa chi tiết"
                                            >
                                                {item.avatar ? (
                                                    <img
                                                        src={item.avatar}
                                                        alt={item.fullName}
                                                        className="user-avatar-circle"
                                                        style={{ objectFit: 'cover' }}
                                                    />
                                                ) : (
                                                    <div
                                                        className="user-avatar-circle"
                                                        style={{ background: getAvatarBg(item) }}
                                                    >
                                                        {(item.fullName || item.email || 'U').charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div className="item-name-group">
                                                    <span className="item-name">{item.fullName || item.email}</span>
                                                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted, #64748B)' }}>
                                                        {item.nickname ? `@${item.nickname}` : `ID: ${item.id}`}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <strong style={{ fontSize: '13px', color: 'var(--text-main, #0F172A)' }}>
                                                    {item.email}
                                                </strong>
                                                <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748B)' }}>
                                                    {item.phoneNumber || 'Chưa cập nhật SĐT'}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                <span className={`role-badge ${getRoleClass(item.role)}`} style={{ width: 'fit-content' }}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                                                        {(item.role || '').toUpperCase() === 'OWNER'
                                                            ? 'cottage'
                                                            : (item.role || '').toUpperCase() === 'ADMIN'
                                                            ? 'admin_panel_settings'
                                                            : 'person'}
                                                    </span>
                                                    {item.roleText || item.role}
                                                </span>
                                                <span style={{ fontSize: '11px', color: 'var(--text-muted, #64748B)' }}>
                                                    {item.permission}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#475569' }}>
                                                {item.joinDate || '01/01/2025'}
                                            </span>
                                        </td>
                                        <td>
                                            {(item.role || '').toUpperCase() === 'OWNER' ? (
                                                <span className="status-badge active">
                                                    🏡 {item.homestayCount || 0} Homestay
                                                </span>
                                            ) : (
                                                <span className="status-badge active" style={{ background: '#E0F2FE', color: '#0284C7' }}>
                                                    🧳 {item.bookingsCount || 0} lượt đặt
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                <span className={`user-status-badge ${(item.status || 'ACTIVE').toLowerCase()}`}>
                                                    {item.statusText || ((item.status || '').toUpperCase() === 'ACTIVE' ? 'Đang hoạt động' : 'Bị khóa')}
                                                </span>
                                                {((item.status || '').toUpperCase() === 'BLOCKED' || (item.status || '').toUpperCase() === 'INACTIVE') && item.lockReason ? (
                                                    <span style={{ fontSize: '11px', color: '#EF4444' }} title={item.lockReason}>
                                                        ⚠️ {item.lockReason}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="action-btns" style={{ justifyContent: 'flex-end' }}>
                                                <button
                                                    className="btn-action-icon"
                                                    title="Chỉnh sửa chi tiết"
                                                    onClick={() => navigate(`/admin/accounts/edit?id=${item.id}`)}
                                                    type="button"
                                                >
                                                    <span className="material-symbols-outlined" style={{ color: '#15803D' }}>
                                                        edit
                                                    </span>
                                                </button>
                                                <button
                                                    className="btn-action-icon"
                                                    title={(item.status || '').toUpperCase() === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa'}
                                                    onClick={() => handleLockToggle(item)}
                                                    type="button"
                                                >
                                                    <span
                                                        className="material-symbols-outlined"
                                                        style={{ color: (item.status || '').toUpperCase() === 'ACTIVE' ? '#EF4444' : '#15803D' }}
                                                    >
                                                        {(item.status || '').toUpperCase() === 'ACTIVE' ? 'lock' : 'lock_open'}
                                                    </span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>



            {/* 4. Modal KHÓA TÀI KHOẢN KÈM LÝ DO */}
            {lockModalOpen && targetLockUser && (
                <div className="modal-overlay show" id="lockModalOverlay">
                    <div className="modal-container" style={{ width: '500px' }}>
                        <div className="modal-header" style={{ background: '#FEF2F2' }}>
                            <h3 className="modal-title" style={{ color: '#DC2626' }}>
                                <span className="material-symbols-outlined" style={{ color: '#DC2626' }}>lock</span>
                                Xác Nhận Khóa Tài Khoản
                            </h3>
                            <button className="modal-close-btn" onClick={() => setLockModalOpen(false)} type="button">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="modal-body">
                            <p style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B' }}>
                                Khóa truy cập cho tài khoản:{' '}
                                <strong id="lockTargetUserName" style={{ color: '#DC2626' }}>
                                    {targetLockUser.fullName || targetLockUser.email}
                                </strong>
                            </p>

                            <div className="form-field full" style={{ marginTop: '12px' }}>
                                <label className="form-label">
                                    Lý do khóa tài khoản <span style={{ color: 'red' }}>*</span>
                                </label>
                                <select
                                    id="lockReasonSelect"
                                    className="form-select"
                                    value={lockReason}
                                    onChange={(e) => setLockReason(e.target.value)}
                                >
                                    <option value="Vi phạm chính sách hệ thống">Vi phạm chính sách hệ thống YÊN Homestay</option>
                                    <option value="Spammer / Đặt phòng ảo">Spammer / Đặt phòng ảo không đến</option>
                                    <option value="Khiếu nại chưa xử lý">Có báo cáo / Khiếu nại nghiêm trọng</option>
                                    <option value="Yêu cầu từ người dùng">Theo yêu cầu trực tiếp từ chủ tài khoản</option>
                                </select>
                            </div>

                            <div className="form-field full" style={{ marginTop: '12px' }}>
                                <label className="form-label">Thời hạn khóa</label>
                                <select
                                    id="lockDurationSelect"
                                    className="form-select"
                                    value={lockDuration}
                                    onChange={(e) => setLockDuration(e.target.value)}
                                >
                                    <option value="Vĩnh viễn">Vĩnh viễn (Permanent Lock)</option>
                                    <option value="7 ngày">Tạm khóa 7 ngày</option>
                                    <option value="30 ngày">Tạm khóa 30 ngày</option>
                                </select>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-admin-cancel" onClick={() => setLockModalOpen(false)} type="button">
                                Hủy
                            </button>
                            <button
                                className="btn-admin-primary"
                                style={{ backgroundColor: '#DC2626' }}
                                onClick={confirmLockAccount}
                                type="button"
                            >
                                🔒 Đồng ý Khóa Tài Khoản
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
