import React, { useState, useEffect } from 'react';
import './AccountEdit.css';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { adminUserService } from '../../../services/adminUserService';

export default function AccountEdit() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const userId = searchParams.get('id');

    const [loading, setLoading] = useState(true);
    const [toastMessage, setToastMessage] = useState('');
    const [showToast, setShowToast] = useState(false);

    const [user, setUser] = useState({
        id: userId || '1',
        fullName: '',
        nickname: '',
        email: '',
        phoneNumber: '',
        cccd: '',
        nationality: 'Việt Nam',
        dobDay: '',
        dobMonth: '',
        dobYear: '',
        gender: 'nam',
        street: '',
        province: '',
        ward: '',
        taxCode: '',
        bizCode: '',
        role: 'guest', // 'guest' | 'host' | 'admin'
        status: 'active', // 'active' | 'blocked'
        permission: 'Người Dùng Phổ Thông',
        memberTier: 'Thành viên thân thiết',
        lockReason: '',
        avatar: '',
        password: '',
        emailVerified: true,
        phoneVerified: false,
        kycStatus: 'unverified', // 'verified' | 'pending' | 'unverified'
        homestays: [],
        homestaysInput: '',
        adminNotes: '',
        joinDate: '12/01/2025',
        lastLogin: 'Hôm nay 14:20',
    });

    const [avatarPreview, setAvatarPreview] = useState('');

    useEffect(() => {
        const fetchUserData = async () => {
            const targetId = userId || '1';
            try {
                setLoading(true);
                const data = await adminUserService.getUserById(targetId);
                if (data) {
                    const r = (data.role || '').toUpperCase();
                    let mappedRole = 'guest';
                    if (r === 'OWNER') mappedRole = 'host';
                    else if (r === 'ADMIN') mappedRole = 'admin';

                    const s = (data.status || '').toUpperCase();
                    const mappedStatus = (s === 'BLOCKED' || s === 'INACTIVE') ? 'blocked' : 'active';

                    const homestaysList = Array.isArray(data.homestays) ? data.homestays : [];

                    setUser({
                        id: data.id,
                        fullName: data.fullName || '',
                        nickname: data.nickname || '',
                        email: data.email || '',
                        phoneNumber: data.phoneNumber || '',
                        cccd: data.cccd || '',
                        nationality: data.nationality || 'Việt Nam',
                        dobDay: data.dobDay ? String(data.dobDay).padStart(2, '0') : '',
                        dobMonth: data.dobMonth ? String(data.dobMonth).padStart(2, '0') : '',
                        dobYear: data.dobYear ? String(data.dobYear) : '',
                        gender: data.gender || 'nam',
                        street: data.street || '',
                        province: data.province || '',
                        ward: data.ward || '',
                        taxCode: data.taxCode || '',
                        bizCode: data.bizCode || '',
                        role: mappedRole,
                        status: mappedStatus,
                        permission: data.permission || (mappedRole === 'host' ? 'Đối Tác Kinh Doanh' : mappedRole === 'admin' ? 'Toàn Quyền Quản Trị Hệ Thống (Super Admin)' : 'Người Dùng Phổ Thông'),
                        memberTier: data.memberTier || (mappedRole === 'host' ? 'Host Uy Tín (SuperHost)' : 'Thành viên thân thiết'),
                        lockReason: data.lockReason || '',
                        avatar: data.avatar || '',
                        password: '',
                        emailVerified: data.emailVerified !== false,
                        phoneVerified: !!data.phoneVerified,
                        kycStatus: data.kycStatus || (data.cccd ? 'verified' : 'unverified'),
                        homestays: homestaysList,
                        homestaysInput: homestaysList.join(', '),
                        adminNotes: data.adminNotes || '',
                        joinDate: data.joinDate || '12/01/2025',
                        lastLogin: data.lastLogin || 'Hôm nay 14:20',
                    });
                    if (data.avatar) setAvatarPreview(data.avatar);
                }
            } catch (err) {
                console.error('Lỗi khi tải thông tin chi tiết:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [userId]);

    const handleAvatarUrlChange = (e) => {
        const url = e.target.value;
        setUser((prev) => ({ ...prev, avatar: url }));
        setAvatarPreview(url);
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (evt) => {
                const dataUrl = evt.target.result;
                setUser((prev) => ({ ...prev, avatar: dataUrl }));
                setAvatarPreview(dataUrl);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRoleChange = (e) => {
        const val = e.target.value;
        let perm = 'Người Dùng Phổ Thông';
        let tier = 'Thành viên thân thiết';
        if (val === 'host') {
            perm = 'Đối Tác Kinh Doanh';
            tier = 'Host Uy Tín (SuperHost)';
        } else if (val === 'admin') {
            perm = 'Toàn Quyền Quản Trị Hệ Thống (Super Admin)';
            tier = 'Quản Trị Viên Cấp Cao';
        }
        setUser((prev) => ({
            ...prev,
            role: val,
            permission: perm,
            memberTier: tier,
        }));
    };

    const handleStatusChange = (e) => {
        const val = e.target.value;
        setUser((prev) => ({
            ...prev,
            status: val,
            lockReason: val === 'blocked' ? (prev.lockReason || 'Vi phạm chính sách hệ thống (Vĩnh viễn)') : '',
        }));
    };

    const handleHomestaysInputChange = (e) => {
        const val = e.target.value;
        const list = val.split(',').map((s) => s.trim()).filter(Boolean);
        setUser((prev) => ({
            ...prev,
            homestaysInput: val,
            homestays: list,
        }));
    };

    const handleRemoveHomestay = (nameToRemove) => {
        const nextList = user.homestays.filter((h) => h !== nameToRemove);
        setUser((prev) => ({
            ...prev,
            homestays: nextList,
            homestaysInput: nextList.join(', '),
        }));
    };

    const triggerToast = (msg) => {
        setToastMessage(msg);
        setShowToast(true);
        setTimeout(() => {
            setShowToast(false);
        }, 3000);
    };

    const saveUserEditForm = async (e) => {
        if (e && e.preventDefault) e.preventDefault();

        if (!user.fullName.trim()) {
            alert('Vui lòng nhập Họ và Tên!');
            document.getElementById('editFullName')?.focus();
            return;
        }

        if (!user.email.trim()) {
            alert('Vui lòng nhập Địa chỉ Email!');
            document.getElementById('editEmail')?.focus();
            return;
        }

        let backendRole = 'TOURIST';
        if (user.role === 'host') backendRole = 'OWNER';
        else if (user.role === 'admin') backendRole = 'ADMIN';

        const backendStatus = user.status === 'blocked' ? 'BLOCKED' : 'ACTIVE';

        const payload = {
            fullName: user.fullName.trim(),
            email: user.email.trim(),
            phoneNumber: user.phoneNumber ? user.phoneNumber.trim() : '',
            role: backendRole,
            status: backendStatus,
            cccd: user.cccd ? user.cccd.trim() : null,
            nickname: user.nickname ? user.nickname.trim() : null,
            avatar: user.avatar ? user.avatar.trim() : null,
            dobDay: user.dobDay || null,
            dobMonth: user.dobMonth || null,
            dobYear: user.dobYear || null,
            gender: user.gender || 'nam',
            nationality: user.nationality || 'Việt Nam',
            street: user.street ? user.street.trim() : null,
            province: user.province || null,
            ward: user.ward ? user.ward.trim() : null,
            taxCode: user.taxCode ? user.taxCode.trim() : null,
            bizCode: user.bizCode ? user.bizCode.trim() : null,
            phoneVerified: !!user.phoneVerified,
            emailVerified: !!user.emailVerified,
            lockReason: backendStatus === 'BLOCKED' ? user.lockReason : null,
            adminNotes: user.adminNotes ? user.adminNotes.trim() : null,
            memberTier: user.memberTier || null,
            permission: user.permission || null,
            password: user.password && user.password.trim() ? user.password.trim() : undefined,
        };

        try {
            const res = await adminUserService.updateUser(user.id, payload);
            if (res.success) {
                triggerToast('✓ Cập nhật thông tin tài khoản thành công!');
                setTimeout(() => {
                    navigate('/admin/accounts');
                }, 1200);
            } else {
                alert('Lỗi cập nhật: ' + (res.message || 'Không thể lưu thay đổi'));
            }
        } catch (err) {
            console.error('Lỗi khi lưu tài khoản:', err);
            alert('Lỗi kết nối máy chủ: ' + err.message);
        }
    };

    return (
        <div className="account-edit-wrapper">
            {/* 1. Breadcrumb Navigation */}
            <div className="breadcrumb-nav">
                <Link to="/admin/dashboard">Dashboard</Link>
                <span className="separator">/</span>
                <Link to="/admin/accounts">Quản lý tài khoản</Link>
                <span className="separator">/</span>
                <span className="current" id="breadcrumbUserName">
                    {`Chỉnh sửa: ${user.fullName || user.email}`}
                </span>
            </div>

            {/* 2. Header Bar with Actions */}
            <div className="edit-header-bar">
                <div className="edit-header-left">
                    <Link to="/admin/accounts" className="btn-back-link" title="Quay lại danh sách">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </Link>
                    <div className="edit-title-group">
                        <h1 id="headerUserTitle">
                            Chỉnh Sửa Tài Khoản: <span id="headerUserNameTitle">{loading ? 'Đang tải...' : `${user.fullName} (${user.id ? 'usr-' + user.id : ''})`}</span>
                        </h1>
                        <p>Cập nhật đầy đủ hồ sơ định danh cá nhân, pháp lý kinh doanh, bảo mật & phân quyền hệ thống</p>
                    </div>
                </div>

                <div className="edit-header-right">
                    <Link to="/admin/accounts" className="btn-admin-cancel">
                        Hủy bỏ
                    </Link>
                    <button type="button" className="btn-admin-primary" onClick={saveUserEditForm}>
                        <span className="material-symbols-outlined">save</span>
                        <span>Lưu Thay Đổi</span>
                    </button>
                </div>
            </div>

            {/* 3. Layout Grid: 2 Cột */}
            <div className="edit-layout-grid">
                {/* CỘT TRÁI (360px): Tóm tắt hồ sơ, Avatar, Trạng thái xác thực KYC */}
                <aside className="edit-left-column">
                    {/* Card 1: Avatar & Định danh */}
                    <div className="profile-card">
                        <div className="avatar-center-wrapper">
                            <div
                                className="avatar-large-container"
                                style={{
                                    position: 'relative',
                                    width: '110px',
                                    height: '110px',
                                    margin: '0 auto 16px auto',
                                }}
                            >
                                {avatarPreview ? (
                                    <img
                                        id="editAvatarImg"
                                        src={avatarPreview}
                                        alt="Avatar"
                                        className="avatar-large-img"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            borderRadius: '50%',
                                            objectFit: 'cover',
                                            border: '3px solid #DCFCE7',
                                            boxShadow: '0 4px 12px rgba(21, 128, 61, 0.15)',
                                        }}
                                    />
                                ) : (
                                    <div
                                        id="editAvatarFallback"
                                        className="avatar-large-fallback"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            borderRadius: '50%',
                                            background: 'linear-gradient(135deg, #15803D 0%, #166534 100%)',
                                            color: '#FFFFFF',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '38px',
                                            fontWeight: 800,
                                            border: '3px solid #DCFCE7',
                                            boxShadow: '0 4px 12px rgba(21, 128, 61, 0.15)',
                                        }}
                                    >
                                        {(user.fullName || 'A').charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <button
                                    type="button"
                                    className="btn-avatar-camera"
                                    title="Đổi ảnh đại diện"
                                    onClick={() => document.getElementById('editAvatarFileInput').click()}
                                    style={{
                                        position: 'absolute',
                                        bottom: '2px',
                                        right: '2px',
                                        left: 'auto',
                                        top: 'auto',
                                        transform: 'none',
                                        width: '32px',
                                        height: '32px',
                                        minWidth: '32px',
                                        maxWidth: '32px',
                                        borderRadius: '50%',
                                        backgroundColor: '#15803D',
                                        color: '#FFFFFF',
                                        border: '2px solid #FFFFFF',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        padding: 0,
                                        margin: 0,
                                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
                                        zIndex: 10,
                                    }}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>photo_camera</span>
                                </button>
                                <input
                                    type="file"
                                    id="editAvatarFileInput"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={handleFileUpload}
                                />
                            </div>

                            <div
                                className="user-display-name"
                                id="displayFullName"
                                style={{
                                    fontSize: '18px',
                                    fontWeight: 800,
                                    color: 'var(--text-main, #0F172A)',
                                    marginTop: '4px',
                                    marginBottom: '4px',
                                    lineHeight: 1.3,
                                }}
                            >
                                {user.fullName || user.email}
                            </div>
                            <div className="user-display-nickname" id="displayNickname">
                                @{user.nickname || (user.id ? `user_${user.id}` : 'account')}
                            </div>
                            <span className="tier-badge" id="displayMemberTier">
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>verified</span>
                                <span id="tierBadgeText">{user.memberTier || 'Thành viên'}</span>
                            </span>
                        </div>

                        <div className="meta-info-list">
                            <div className="meta-info-item">
                                <span className="label">Mã tài khoản ID:</span>
                                <span className="val" id="metaUserId">
                                    {`usr-${user.id}`}
                                </span>
                            </div>
                            <div className="meta-info-item">
                                <span className="label">Ngày tham gia:</span>
                                <span className="val" id="metaJoinDate">{user.joinDate}</span>
                            </div>
                            <div className="meta-info-item">
                                <span className="label">Lần đăng nhập cuối:</span>
                                <span className="val" id="metaLastLogin">{user.lastLogin}</span>
                            </div>
                            <div className="meta-info-item">
                                <span className="label">Trạng thái:</span>
                                <span className="val" id="metaStatusBadge">
                                    <span className={`user-status-badge ${user.status}`}>
                                        {user.status === 'active' ? 'Đang hoạt động' : 'Bị khóa'}
                                    </span>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Trạng thái Xác Thực & KYC */}
                    <div className="profile-card">
                        <div className="card-title-bar">
                            <h3>
                                <span className="material-symbols-outlined">verified_user</span>
                                Trạng Thái Xác Thực (KYC)
                            </h3>
                        </div>

                        <div className="kyc-verification-box">
                            <div className="kyc-item">
                                <div className="kyc-item-left">
                                    <span className="material-symbols-outlined icon">phone_iphone</span>
                                    <div>
                                        <div className="kyc-item-name">Số điện thoại</div>
                                        <div className="kyc-item-sub" id="kycPhoneSub">
                                            {user.phoneNumber || 'Chưa cung cấp'}
                                        </div>
                                    </div>
                                </div>
                                <div id="kycPhoneStatus">
                                    {user.phoneVerified ? (
                                        <span className="verified-pill">✓ Đã xác minh</span>
                                    ) : (
                                        <span className="unverified-pill">⚠️ Chưa xác minh</span>
                                    )}
                                </div>
                            </div>

                            <div className="kyc-item">
                                <div className="kyc-item-left">
                                    <span className="material-symbols-outlined icon">mail</span>
                                    <div>
                                        <div className="kyc-item-name">Địa chỉ Email</div>
                                        <div className="kyc-item-sub" id="kycEmailSub">
                                            {user.email || 'Chưa cung cấp'}
                                        </div>
                                    </div>
                                </div>
                                <div id="kycEmailStatus">
                                    {user.emailVerified ? (
                                        <span className="verified-pill">✓ Đã xác minh</span>
                                    ) : (
                                        <span className="unverified-pill">⚠️ Chưa xác minh</span>
                                    )}
                                </div>
                            </div>

                            <div className="kyc-item">
                                <div className="kyc-item-left">
                                    <span className="material-symbols-outlined icon">badge</span>
                                    <div>
                                        <div className="kyc-item-name">CCCD / CMND</div>
                                        <div className="kyc-item-sub" id="kycCccdSub">
                                            {user.cccd || 'Chưa cung cấp'}
                                        </div>
                                    </div>
                                </div>
                                <div id="kycCccdStatus">
                                    {user.kycStatus === 'verified' || user.cccd ? (
                                        <span className="verified-pill">✓ Đã xác thực KYC</span>
                                    ) : (
                                        <span className="unverified-pill">⚠️ Chưa KYC</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Ghi chú nội bộ Quản trị viên */}
                    <div className="profile-card">
                        <div className="card-title-bar">
                            <h3>
                                <span className="material-symbols-outlined">notes</span>
                                Ghi Chú Quản Trị Viên (Admin)
                            </h3>
                        </div>
                        <div className="form-row-full">
                            <label className="form-field-label">Ghi chú lưu hành nội bộ:</label>
                            <textarea
                                id="editAdminNotes"
                                className="form-field-control"
                                rows="4"
                                placeholder="Ghi chú về lịch sử đặt phòng, độ tin cậy, thỏa thuận đối tác..."
                                value={user.adminNotes}
                                onChange={(e) => setUser({ ...user, adminNotes: e.target.value })}
                            />
                            <small style={{ fontSize: '11.5px', color: 'var(--text-muted, #64748B)', display: 'block', marginTop: '4px' }}>
                                * Chỉ Quản trị viên hệ thống mới nhìn thấy ghi chú này.
                            </small>
                        </div>
                    </div>
                </aside>

                {/* CỘT PHẢI: FORM CHỈNH SỬA CHI TIẾT (ĐẦY ĐỦ 5 KHỐI NHƯ ACCOUNT_EDIT.HTML) */}
                <section className="edit-right-column">
                    <form onSubmit={saveUserEditForm}>
                        {/* KHỐI 1: THÔNG TIN CÁ NHÂN CƠ BẢN */}
                        <div className="profile-card">
                            <div className="card-title-bar">
                                <h3>
                                    <span className="material-symbols-outlined">person</span>
                                    1. Thông Tin Cá Nhân Cơ Bản
                                </h3>
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>* Dữ liệu định danh cá nhân</span>
                            </div>

                            <div className="form-grid-2">
                                <div>
                                    <label className="form-field-label">
                                        Họ và Tên <span className="required">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="editFullName"
                                        className="form-field-control"
                                        placeholder="Ví dụ: Lê Hoàng Mai Chi"
                                        value={user.fullName}
                                        onChange={(e) => setUser({ ...user, fullName: e.target.value })}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="form-field-label">Nickname / Tên hiển thị</label>
                                    <input
                                        type="text"
                                        id="editNickname"
                                        className="form-field-control"
                                        placeholder="Ví dụ: Mai Chi Homestay"
                                        value={user.nickname}
                                        onChange={(e) => setUser({ ...user, nickname: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-grid-2">
                                <div>
                                    <label className="form-field-label">
                                        Số CCCD / CMND (12 chữ số) <span className="required">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="editCccd"
                                        className="form-field-control"
                                        placeholder="Nhập 12 số CCCD"
                                        maxLength="12"
                                        value={user.cccd}
                                        onChange={(e) => setUser({ ...user, cccd: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="form-field-label">Quốc tịch</label>
                                    <select
                                        id="editNationality"
                                        className="form-field-control"
                                        value={user.nationality}
                                        onChange={(e) => setUser({ ...user, nationality: e.target.value })}
                                    >
                                        <option value="Việt Nam">🇻🇳 Việt Nam</option>
                                        <option value="Anh Quốc">🇬🇧 Anh Quốc</option>
                                        <option value="Hoa Kỳ">🇺🇸 Hoa Kỳ</option>
                                        <option value="Pháp">🇫🇷 Pháp</option>
                                        <option value="Nhật Bản">🇯🇵 Nhật Bản</option>
                                        <option value="Hàn Quốc">🇰🇷 Hàn Quốc</option>
                                        <option value="Khác">🌐 Quốc tế khác</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-grid-2">
                                {/* Ngày sinh (3 selects: Ngày, Tháng, Năm) */}
                                <div>
                                    <label className="form-field-label">Ngày sinh</label>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '8px' }}>
                                        <select
                                            id="editDobDay"
                                            className="form-field-control"
                                            value={user.dobDay}
                                            onChange={(e) => setUser({ ...user, dobDay: e.target.value })}
                                        >
                                            <option value="">Ngày</option>
                                            {Array.from({ length: 31 }, (_, i) => {
                                                const d = String(i + 1).padStart(2, '0');
                                                return <option key={d} value={d}>{d}</option>;
                                            })}
                                        </select>
                                        <select
                                            id="editDobMonth"
                                            className="form-field-control"
                                            value={user.dobMonth}
                                            onChange={(e) => setUser({ ...user, dobMonth: e.target.value })}
                                        >
                                            <option value="">Tháng</option>
                                            {Array.from({ length: 12 }, (_, i) => {
                                                const m = String(i + 1).padStart(2, '0');
                                                return <option key={m} value={m}>Tháng {m}</option>;
                                            })}
                                        </select>
                                        <select
                                            id="editDobYear"
                                            className="form-field-control"
                                            value={user.dobYear}
                                            onChange={(e) => setUser({ ...user, dobYear: e.target.value })}
                                        >
                                            <option value="">Năm</option>
                                            {Array.from({ length: 70 }, (_, i) => {
                                                const y = 2015 - i;
                                                return <option key={y} value={String(y)}>{y}</option>;
                                            })}
                                        </select>
                                    </div>
                                </div>

                                {/* Giới tính */}
                                <div>
                                    <label className="form-field-label">Giới tính</label>
                                    <div className="gender-radio-group">
                                        <label className="gender-radio-label">
                                            <input
                                                type="radio"
                                                name="editGender"
                                                value="nam"
                                                checked={user.gender === 'nam'}
                                                onChange={(e) => setUser({ ...user, gender: e.target.value })}
                                            />
                                            <span>Nam</span>
                                        </label>
                                        <label className="gender-radio-label">
                                            <input
                                                type="radio"
                                                name="editGender"
                                                value="nu"
                                                checked={user.gender === 'nu'}
                                                onChange={(e) => setUser({ ...user, gender: e.target.value })}
                                            />
                                            <span>Nữ</span>
                                        </label>
                                        <label className="gender-radio-label">
                                            <input
                                                type="radio"
                                                name="editGender"
                                                value="khac"
                                                checked={user.gender === 'khac'}
                                                onChange={(e) => setUser({ ...user, gender: e.target.value })}
                                            />
                                            <span>Khác</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="form-row-full" style={{ marginTop: '6px' }}>
                                <label className="form-field-label">Đường dẫn ảnh đại diện (Avatar URL)</label>
                                <input
                                    type="text"
                                    id="editAvatarUrl"
                                    className="form-field-control"
                                    placeholder="https://images.unsplash.com/photo-..."
                                    value={user.avatar}
                                    onChange={handleAvatarUrlChange}
                                />
                            </div>
                        </div>

                        {/* KHỐI 2: ĐỊA CHỈ LIÊN HỆ & CƯ TRÚ */}
                        <div className="profile-card">
                            <div className="card-title-bar">
                                <h3>
                                    <span className="material-symbols-outlined">home_pin</span>
                                    2. Địa Chỉ Cư Trú & Thường Trú
                                </h3>
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Địa chỉ đăng ký</span>
                            </div>

                            <div className="form-row-full">
                                <label className="form-field-label">Số nhà, Tên đường / Thôn bản</label>
                                <input
                                    type="text"
                                    id="editStreet"
                                    className="form-field-control"
                                    placeholder="Ví dụ: 123 Đường Lê Lợi, Bản Lác..."
                                    value={user.street}
                                    onChange={(e) => setUser({ ...user, street: e.target.value })}
                                />
                            </div>

                            <div className="form-grid-2">
                                <div>
                                    <label className="form-field-label">Tỉnh / Thành phố</label>
                                    <select
                                        id="editProvince"
                                        className="form-field-control"
                                        value={user.province}
                                        onChange={(e) => setUser({ ...user, province: e.target.value })}
                                    >
                                        <option value="">-- Chọn Tỉnh / Thành phố --</option>
                                        <option value="Thành phố Đà Nẵng">Thành phố Đà Nẵng</option>
                                        <option value="Thành phố Hà Nội">Thành phố Hà Nội</option>
                                        <option value="Thành phố Hồ Chí Minh">Thành phố Hồ Chí Minh</option>
                                        <option value="Tỉnh Lâm Đồng">Tỉnh Lâm Đồng (Đà Lạt)</option>
                                        <option value="Tỉnh Lào Cai">Tỉnh Lào Cai (Sa Pa)</option>
                                        <option value="Tỉnh Hòa Bình">Tỉnh Hòa Bình (Mai Châu)</option>
                                        <option value="Tỉnh Hà Giang">Tỉnh Hà Giang</option>
                                        <option value="Tỉnh Quảng Nam">Tỉnh Quảng Nam (Hội An)</option>
                                        <option value="Tỉnh Thừa Thiên Huế">Tỉnh Thừa Thiên Huế</option>
                                        <option value="Tỉnh Ninh Bình">Tỉnh Ninh Bình</option>
                                        <option value="Tỉnh Khánh Hòa">Tỉnh Khánh Hòa (Nha Trang)</option>
                                        <option value="Tỉnh Kiên Giang">Tỉnh Kiên Giang (Phú Quốc)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="form-field-label">Phường / Xã / Thị trấn</label>
                                    <input
                                        type="text"
                                        id="editWard"
                                        className="form-field-control"
                                        placeholder="Ví dụ: Phường Hải Châu 1, Xã Chiềng Châu..."
                                        value={user.ward}
                                        onChange={(e) => setUser({ ...user, ward: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* KHỐI 3: THÔNG TIN LIÊN HỆ & XÁC MINH SĐT / EMAIL */}
                        <div className="profile-card">
                            <div className="card-title-bar">
                                <h3>
                                    <span className="material-symbols-outlined">contact_phone</span>
                                    3. Thông Tin Liên Hệ & Trạng Thái Xác Minh
                                </h3>
                            </div>

                            <div className="form-grid-2">
                                <div>
                                    <label className="form-field-label">
                                        Địa chỉ Email <span className="required">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        id="editEmail"
                                        className="form-field-control"
                                        placeholder="nguyen@example.com"
                                        value={user.email}
                                        onChange={(e) => setUser({ ...user, email: e.target.value })}
                                        required
                                    />
                                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <input
                                            type="checkbox"
                                            id="editEmailVerified"
                                            checked={user.emailVerified}
                                            onChange={(e) => setUser({ ...user, emailVerified: e.target.checked })}
                                            style={{ accentColor: 'var(--primary-color, #15803D)', width: '16px', height: '16px', cursor: 'pointer' }}
                                        />
                                        <label htmlFor="editEmailVerified" style={{ fontSize: '13px', fontWeight: 600, color: '#166534', cursor: 'pointer' }}>
                                            Đã xác minh địa chỉ Email
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="form-field-label">
                                        Số điện thoại <span className="required">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="editPhone"
                                        className="form-field-control"
                                        placeholder="0905 123 456"
                                        value={user.phoneNumber}
                                        onChange={(e) => setUser({ ...user, phoneNumber: e.target.value })}
                                    />
                                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <input
                                            type="checkbox"
                                            id="editPhoneVerified"
                                            checked={user.phoneVerified}
                                            onChange={(e) => setUser({ ...user, phoneVerified: e.target.checked })}
                                            style={{ accentColor: 'var(--primary-color, #15803D)', width: '16px', height: '16px', cursor: 'pointer' }}
                                        />
                                        <label htmlFor="editPhoneVerified" style={{ fontSize: '13px', fontWeight: 600, color: '#166534', cursor: 'pointer' }}>
                                            Đã xác minh Số điện thoại
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="form-row-full" style={{ marginTop: '10px' }}>
                                <label className="form-field-label">Trạng thái xác thực KYC tổng quan:</label>
                                <select
                                    id="editKycStatus"
                                    className="form-field-control"
                                    value={user.kycStatus}
                                    onChange={(e) => setUser({ ...user, kycStatus: e.target.value })}
                                >
                                    <option value="verified">✓ Đã xác minh đầy đủ (Verified KYC)</option>
                                    <option value="pending">⏳ Chờ duyệt hồ sơ CCCD / ĐKKD (Pending)</option>
                                    <option value="unverified">⚠️ Chưa xác thực (Unverified)</option>
                                </select>
                            </div>
                        </div>

                        {/* KHỐI 4: THUẾ & ĐĂNG KÝ KINH DOANH (DÀNH CHO CHỦ HOMESTAY / DOANH NGHIỆP) */}
                        <div className="profile-card">
                            <div className="card-title-bar">
                                <h3>
                                    <span className="material-symbols-outlined">receipt_long</span>
                                    4. Pháp Lý, Thuế & Đăng Ký Kinh Doanh
                                </h3>
                                <span style={{ fontSize: '12px', color: '#15803D', fontWeight: 700 }}>Hồ sơ đối tác Homestay</span>
                            </div>

                            <div className="form-grid-2">
                                <div>
                                    <label className="form-field-label">Mã số thuế (MST Cá nhân / Doanh nghiệp)</label>
                                    <input
                                        type="text"
                                        id="editTaxCode"
                                        className="form-field-control"
                                        placeholder="Ví dụ: 0312345678"
                                        value={user.taxCode}
                                        onChange={(e) => setUser({ ...user, taxCode: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="form-field-label">Số Giấy phép ĐKKD</label>
                                    <input
                                        type="text"
                                        id="editBizCode"
                                        className="form-field-control"
                                        placeholder="Ví dụ: 41A8012345"
                                        value={user.bizCode}
                                        onChange={(e) => setUser({ ...user, bizCode: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-row-full">
                                <label className="form-field-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span>Danh sách Homestay trực thuộc quyền quản lý:</span>
                                    {user.homestays && user.homestays.length > 0 && (
                                        <span style={{ fontSize: '12px', color: '#15803D', fontWeight: 700 }}>
                                            {user.homestays.length} Căn Homestay
                                        </span>
                                    )}
                                </label>
                                <input
                                    type="text"
                                    id="editHomestaysInput"
                                    className="form-field-control"
                                    placeholder="Nhập tên các homestay, phân cách bởi dấu phẩy"
                                    value={user.homestaysInput}
                                    onChange={handleHomestaysInputChange}
                                />
                                <div className="homestay-chip-list" id="editHomestayChipList">
                                    {user.homestays && user.homestays.length > 0 ? (
                                        user.homestays.map((h, idx) => (
                                            <span key={idx} className="homestay-chip" title="Homestay do chủ này quản lý">
                                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>cottage</span>
                                                <span>{h}</span>
                                                <button
                                                    type="button"
                                                    className="chip-remove-btn"
                                                    title="Xóa khỏi danh sách"
                                                    onClick={() => handleRemoveHomestay(h)}
                                                >
                                                    ✕
                                                </button>
                                            </span>
                                        ))
                                    ) : (
                                        <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748B)', fontStyle: 'italic', marginTop: '6px', display: 'block' }}>
                                            Chưa có Homestay liên kết
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* KHỐI 5: PHÂN QUYỀN HỆ THỐNG & TRẠNG THÁI TÀI KHOẢN (ADMIN CONTROL) */}
                        <div className="profile-card">
                            <div className="card-title-bar">
                                <h3>
                                    <span className="material-symbols-outlined">admin_panel_settings</span>
                                    5. Phân Quyền Quản Trị & Trạng Thái Hệ Thống
                                </h3>
                                <span style={{ fontSize: '12px', color: '#DC2626', fontWeight: 700 }}>Dành riêng Quản trị viên</span>
                            </div>

                            <div className="form-grid-2">
                                <div>
                                    <label className="form-field-label">
                                        Vai trò tài khoản <span className="required">*</span>
                                    </label>
                                    <select
                                        id="editRoleSelect"
                                        className="form-field-control"
                                        value={user.role}
                                        onChange={handleRoleChange}
                                    >
                                        <option value="guest">Khách lưu trú (Guest / Tourist)</option>
                                        <option value="host">Chủ Homestay (Host Owner)</option>
                                        <option value="admin">Quản trị viên Hệ thống (System Admin)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="form-field-label">Cấp bậc / Phân quyền chức năng</label>
                                    <input
                                        type="text"
                                        id="editPermission"
                                        className="form-field-control"
                                        placeholder="Đối Tác Kinh Doanh"
                                        value={user.permission}
                                        onChange={(e) => setUser({ ...user, permission: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-grid-2">
                                <div>
                                    <label className="form-field-label">
                                        Trạng thái tài khoản <span className="required">*</span>
                                    </label>
                                    <select
                                        id="editStatusSelect"
                                        className="form-field-control"
                                        value={user.status}
                                        onChange={handleStatusChange}
                                    >
                                        <option value="active">Đang hoạt động bình thường (Active)</option>
                                        <option value="blocked">Khóa tài khoản (Blocked / Suspended)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="form-field-label">Huy hiệu thành viên</label>
                                    <input
                                        type="text"
                                        id="editMemberTier"
                                        className="form-field-control"
                                        placeholder="Thành viên thân thiết, Host Tiêu Biểu..."
                                        value={user.memberTier}
                                        onChange={(e) => setUser({ ...user, memberTier: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-row-full" style={{ marginTop: '4px' }}>
                                <label className="form-field-label">
                                    Đổi mật khẩu mới (Để trống nếu không đổi)
                                </label>
                                <input
                                    type="password"
                                    id="editPassword"
                                    className="form-field-control"
                                    placeholder="Nhập mật khẩu mới nếu muốn đổi"
                                    value={user.password}
                                    onChange={(e) => setUser({ ...user, password: e.target.value })}
                                />
                            </div>

                            {user.status === 'blocked' && (
                                <div className="form-row-full" id="lockReasonGroup">
                                    <label className="form-field-label" style={{ color: '#DC2626' }}>
                                        Lý do khóa tài khoản <span className="required">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="editLockReason"
                                        className="form-field-control"
                                        style={{ borderColor: '#F87171', background: '#FEF2F2' }}
                                        placeholder="Ví dụ: Spammer / Đặt phòng ảo không đến (Vĩnh viễn)"
                                        value={user.lockReason}
                                        onChange={(e) => setUser({ ...user, lockReason: e.target.value })}
                                    />
                                </div>
                            )}
                        </div>

                        {/* 6. Sticky Save Bar */}
                        <div
                            className="sticky-save-bar"
                            style={{
                                position: 'sticky',
                                bottom: '20px',
                                left: 'auto',
                                right: 'auto',
                                width: '100%',
                                maxWidth: '100%',
                                boxSizing: 'border-box',
                                zIndex: 50,
                            }}
                        >
                            <div className="info-text">
                                <span className="material-symbols-outlined" style={{ color: 'var(--primary-color)' }}>info</span>
                                <span>Mọi thay đổi sẽ được cập nhật ngay lập tức vào cơ sở dữ liệu hệ thống YÊN.</span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Link to="/admin/accounts" className="btn-admin-cancel">
                                    Hủy bỏ
                                </Link>
                                <button type="submit" className="btn-admin-primary">
                                    <span className="material-symbols-outlined">save</span>
                                    <span>Lưu Thay Đổi</span>
                                </button>
                            </div>
                        </div>
                    </form>
                </section>
            </div>

            {/* Toast Thông Báo */}
            <div className={`admin-toast ${showToast ? 'show' : ''}`} id="adminToast">
                <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>check_circle</span>
                <span id="toastMsg">{toastMessage}</span>
            </div>
        </div>
    );
}
