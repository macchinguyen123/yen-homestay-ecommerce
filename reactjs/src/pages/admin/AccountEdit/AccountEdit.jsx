import React, { useState } from 'react';
import './AccountEdit.css';
import { Link } from 'react-router-dom';

export default function AccountEdit() {
    const [avatarPreview, setAvatarPreview] = useState('');

    const handleAvatarUrlChange = () => {};
    const handleProvinceChange = () => {};
    const handleRoleChange = () => {};
    const handleStatusChange = () => {};
    const triggerAvatarUpload = () => {};
    const saveUserEditForm = () => {};

    return (
        <div className="account-edit-wrapper">
            {/* 1. Breadcrumb Navigation */}
            <div className="breadcrumb-nav">
                <Link to="/admin/dashboard">Dashboard</Link>
                <span className="separator">/</span>
                <Link to="/admin/accounts">Quản lý tài khoản</Link>
                <span className="separator">/</span>
                <span className="current" id="breadcrumbUserName">Chỉnh sửa thông tin tài khoản</span>
            </div>

            {/* 2. Header Bar with Actions */}
            <div className="edit-header-bar">
                <div className="edit-header-left">
                    <Link to="/admin/accounts" className="btn-back-link" title="Quay lại danh sách">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </Link>
                    <div className="edit-title-group">
                        <h1 id="headerUserTitle">
                            Chỉnh Sửa Tài Khoản: <span id="headerUserNameTitle">Đang tải...</span>
                        </h1>
                        <p>Cập nhật đầy đủ hồ sơ định danh cá nhân, pháp lý kinh doanh, bảo mật & phân quyền hệ thống</p>
                    </div>
                </div>

                <div className="edit-header-right">
                    <Link to="/admin/accounts" className="btn-admin-cancel" style={{ textDecoration: 'none' }}>Hủy bỏ</Link>
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
                            <div className="avatar-large-container">
                                {avatarPreview ? (
                                    <img id="editAvatarImg" src={avatarPreview} alt="Avatar" className="avatar-large-img" />
                                ) : (
                                    <div id="editAvatarFallback" className="avatar-large-fallback">A</div>
                                )}
                                <button type="button" className="btn-avatar-camera" title="Đổi ảnh đại diện" onClick={triggerAvatarUpload}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>photo_camera</span>
                                </button>
                                <input type="file" id="editAvatarFileInput" accept="image/*" style={{ display: 'none' }} />
                            </div>

                            <div className="user-display-name" id="displayFullName">Nguyễn Văn An</div>
                            <div className="user-display-nickname" id="displayNickname">@an.nguyen</div>
                            <span className="tier-badge" id="displayMemberTier">
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>verified</span>
                                <span id="tierBadgeText">Host Uy Tín (SuperHost)</span>
                            </span>
                        </div>

                        <div className="meta-info-list">
                            <div className="meta-info-item">
                                <span className="label">Mã tài khoản ID:</span>
                                <span className="val" id="metaUserId">usr-1</span>
                            </div>
                            <div className="meta-info-item">
                                <span className="label">Ngày tham gia:</span>
                                <span className="val" id="metaJoinDate">12/01/2025</span>
                            </div>
                            <div className="meta-info-item">
                                <span className="label">Lần đăng nhập cuối:</span>
                                <span className="val" id="metaLastLogin">Hôm nay 14:20</span>
                            </div>
                            <div className="meta-info-item">
                                <span className="label">Trạng thái:</span>
                                <span className="val" id="metaStatusBadge">
                                    <span className="user-status-badge active">Đang hoạt động</span>
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
                                        <div className="kyc-item-sub" id="kycPhoneSub">0905 123 456</div>
                                    </div>
                                </div>
                                <div id="kycPhoneStatus">
                                    <span className="verified-pill">✓ Đã xác minh</span>
                                </div>
                            </div>

                            <div className="kyc-item">
                                <div className="kyc-item-left">
                                    <span className="material-symbols-outlined icon">mail</span>
                                    <div>
                                        <div className="kyc-item-name">Địa chỉ Email</div>
                                        <div className="kyc-item-sub" id="kycEmailSub">an@gmail.com</div>
                                    </div>
                                </div>
                                <div id="kycEmailStatus">
                                    <span className="verified-pill">✓ Đã xác minh</span>
                                </div>
                            </div>

                            <div className="kyc-item">
                                <div className="kyc-item-left">
                                    <span className="material-symbols-outlined icon">badge</span>
                                    <div>
                                        <div className="kyc-item-name">CCCD / CMND</div>
                                        <div className="kyc-item-sub" id="kycCccdSub">048092001234</div>
                                    </div>
                                </div>
                                <div id="kycCccdStatus">
                                    <span className="verified-pill">✓ Đã xác thực KYC</span>
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
                            <textarea id="editAdminNotes" className="form-field-control" rows="4" placeholder="Ghi chú về lịch sử đặt phòng, độ tin cậy, thỏa thuận đối tác..."></textarea>
                            <small style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>* Chỉ Admin mới nhìn thấy ghi chú này.</small>
                        </div>
                    </div>
                </aside>

                {/* CỘT PHẢI: FORM CHỈNH SỬA CHI TIẾT */}
                <section className="edit-right-column">
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
                                <label className="form-field-label">Họ và Tên <span className="required">*</span></label>
                                <input type="text" id="editFullName" className="form-field-control" placeholder="Ví dụ: Lê Hoàng Mai Chi" />
                            </div>

                            <div>
                                <label className="form-field-label">Nickname / Tên hiển thị</label>
                                <input type="text" id="editNickname" className="form-field-control" placeholder="Ví dụ: Mai Chi Homestay" />
                            </div>
                        </div>

                        <div className="form-grid-2">
                            <div>
                                <label className="form-field-label">Số CCCD / CMND (12 chữ số) <span className="required">*</span></label>
                                <input type="text" id="editCccd" className="form-field-control" placeholder="Nhập 12 số CCCD" maxLength="12" />
                            </div>

                            <div>
                                <label className="form-field-label">Quốc tịch</label>
                                <select id="editNationality" className="form-field-control" defaultValue="Việt Nam">
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
                            {/* Ngày sinh */}
                            <div>
                                <label className="form-field-label">Ngày sinh</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '8px' }}>
                                    <select id="editDobDay" className="form-field-control">
                                        <option value="">Ngày</option>
                                    </select>
                                    <select id="editDobMonth" className="form-field-control">
                                        <option value="">Tháng</option>
                                    </select>
                                    <select id="editDobYear" className="form-field-control">
                                        <option value="">Năm</option>
                                    </select>
                                </div>
                            </div>

                            {/* Giới tính */}
                            <div>
                                <label className="form-field-label">Giới tính</label>
                                <div className="gender-radio-group">
                                    <label className="gender-radio-label">
                                        <input type="radio" name="editGender" value="nam" /> Nam
                                    </label>
                                    <label className="gender-radio-label">
                                        <input type="radio" name="editGender" value="nu" /> Nữ
                                    </label>
                                    <label className="gender-radio-label">
                                        <input type="radio" name="editGender" value="khac" /> Khác
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="form-row-full" style={{ marginTop: '6px' }}>
                            <label className="form-field-label">Đường dẫn ảnh đại diện (Avatar URL)</label>
                            <input type="text" id="editAvatarUrl" className="form-field-control" placeholder="https://images.unsplash.com/photo-..." onChange={handleAvatarUrlChange} />
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
                            <input type="text" id="editStreet" className="form-field-control" placeholder="Ví dụ: 123 Đường Lê Lợi, Bản Lác..." />
                        </div>

                        <div className="form-grid-2">
                            <div>
                                <label className="form-field-label">Tỉnh / Thành phố</label>
                                <select id="editProvince" className="form-field-control" onChange={handleProvinceChange} defaultValue="">
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
                                </select>
                            </div>

                            <div>
                                <label className="form-field-label">Phường / Xã / Thị trấn</label>
                                <input type="text" id="editWard" className="form-field-control" placeholder="Ví dụ: Phường Hải Châu 1, Xã Chiềng Châu..." />
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
                                <label className="form-field-label">Địa chỉ Email <span className="required">*</span></label>
                                <input type="email" id="editEmail" className="form-field-control" placeholder="nguyen@example.com" />
                                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input type="checkbox" id="editEmailVerified" style={{ accentColor: 'var(--primary-color)', width: '16px', height: '16px' }} />
                                    <label htmlFor="editEmailVerified" style={{ fontSize: '13px', fontWeight: 600, color: '#166534', cursor: 'pointer' }}>Đã xác minh địa chỉ Email</label>
                                </div>
                            </div>

                            <div>
                                <label className="form-field-label">Số điện thoại <span className="required">*</span></label>
                                <input type="text" id="editPhone" className="form-field-control" placeholder="0905 123 456" />
                                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input type="checkbox" id="editPhoneVerified" style={{ accentColor: 'var(--primary-color)', width: '16px', height: '16px' }} />
                                    <label htmlFor="editPhoneVerified" style={{ fontSize: '13px', fontWeight: 600, color: '#166534', cursor: 'pointer' }}>Đã xác minh Số điện thoại</label>
                                </div>
                            </div>
                        </div>

                        <div className="form-row-full" style={{ marginTop: '10px' }}>
                            <label className="form-field-label">Trạng thái xác thực KYC tổng quan:</label>
                            <select id="editKycStatus" className="form-field-control" defaultValue="verified">
                                <option value="verified">✓ Đã xác minh đầy đủ (Verified KYC)</option>
                                <option value="pending">⏳ Chờ duyệt hồ sơ CCCD / ĐKKD (Pending)</option>
                                <option value="unverified">⚠️ Chưa xác thực (Unverified)</option>
                            </select>
                        </div>
                    </div>

                    {/* KHỐI 4: THUẾ & ĐĂNG KÝ KINH DOANH */}
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
                                <input type="text" id="editTaxCode" className="form-field-control" placeholder="Ví dụ: 0312345678" />
                            </div>

                            <div>
                                <label className="form-field-label">Số Giấy phép ĐKKD</label>
                                <input type="text" id="editBizCode" className="form-field-control" placeholder="Ví dụ: 41A8012345" />
                            </div>
                        </div>

                        <div className="form-row-full">
                            <label className="form-field-label">Danh sách Homestay trực thuộc quyền quản lý:</label>
                            <input type="text" id="editHomestaysInput" className="form-field-control" placeholder="Nhập tên các homestay, phân cách bởi dấu phẩy" />
                            <div className="homestay-chip-list" id="editHomestayChipList">
                                {/* Render chip động */}
                            </div>
                        </div>
                    </div>

                    {/* KHỐI 5: PHÂN QUYỀN HỆ THỐNG & TRẠNG THÁI TÀI KHOẢN */}
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
                                <label className="form-field-label">Vai trò tài khoản <span className="required">*</span></label>
                                <select id="editRoleSelect" className="form-field-control" onChange={handleRoleChange} defaultValue="guest">
                                    <option value="guest">Khách lưu trú (Guest)</option>
                                    <option value="host">Chủ Homestay (Host Owner)</option>
                                    <option value="admin">Quản trị viên Hệ thống (System Admin)</option>
                                </select>
                            </div>

                            <div>
                                <label className="form-field-label">Cấp bậc / Phân quyền chức năng</label>
                                <input type="text" id="editPermission" className="form-field-control" placeholder="Đối Tác Kinh Doanh" />
                            </div>
                        </div>

                        <div className="form-grid-2">
                            <div>
                                <label className="form-field-label">Trạng thái tài khoản <span className="required">*</span></label>
                                <select id="editStatusSelect" className="form-field-control" onChange={handleStatusChange} defaultValue="active">
                                    <option value="active">Đang hoạt động bình thường (Active)</option>
                                    <option value="blocked">Khóa tài khoản (Blocked / Suspended)</option>
                                </select>
                            </div>

                            <div>
                                <label className="form-field-label">Huy hiệu thành viên</label>
                                <input type="text" id="editMemberTier" className="form-field-control" placeholder="Thành viên thân thiết, Host Tiêu Biểu..." />
                            </div>
                        </div>

                        <div className="form-row-full" id="lockReasonGroup" style={{ display: 'none' }}>
                            <label className="form-field-label" style={{ color: '#DC2626' }}>Lý do khóa tài khoản <span className="required">*</span></label>
                            <input type="text" id="editLockReason" className="form-field-control" style={{ borderColor: '#F87171', background: '#FEF2F2' }} placeholder="Ví dụ: Spammer / Đặt phòng ảo không đến (Vĩnh viễn)" />
                        </div>
                    </div>

                    {/* 6. Sticky Save Bar */}
                    <div className="sticky-save-bar">
                        <div className="info-text">
                            <span className="material-symbols-outlined" style={{ color: 'var(--primary-color)' }}>info</span>
                            <span>Mọi thay đổi sẽ được cập nhật ngay lập tức vào cơ sở dữ liệu hệ thống YÊN.</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Link to="/admin/accounts" className="btn-admin-cancel" style={{ textDecoration: 'none' }}>Hủy bỏ</Link>
                            <button type="button" className="btn-admin-primary" onClick={saveUserEditForm}>
                                <span className="material-symbols-outlined">save</span>
                                <span>Lưu Thay Đổi</span>
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
