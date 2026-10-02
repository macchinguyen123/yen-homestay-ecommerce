import React, { useState } from 'react';
import './AdsManagement.css';

export default function AdsManagement() {
    const [activeTab, setActiveTab] = useState('packages');
    const [showModal, setShowModal] = useState(false);

    const switchAdsTab = (tab) => {
        setActiveTab(tab);
    };

    const openCreateAdModal = () => {
        setShowModal(true);
    };

    const closeAdModal = () => {
        setShowModal(false);
    };

    return (
        <div className="ads-management-wrapper">
            {/* 1. Top Stat Cards (Grid 4 cột Thống kê Doanh thu & Dịch vụ Quảng cáo) */}
            <div className="ads-stats-grid">
                <div className="ads-stat-card">
                    <div className="ads-stat-info">
                        <span className="ads-stat-label">Doanh Thu Dịch Vụ Ads</span>
                        <span className="ads-stat-value">36.500.000đ</span>
                        <span className="ads-stat-subtext">
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>payments</span> Tháng này (+18.4%)
                        </span>
                    </div>
                    <div className="ads-stat-icon-wrapper emerald">
                        <span className="material-symbols-outlined">monetization_on</span>
                    </div>
                </div>

                <div className="ads-stat-card">
                    <div className="ads-stat-info">
                        <span className="ads-stat-label">Gói Dịch Vụ Đang Bán</span>
                        <span className="ads-stat-value">6</span>
                        <span className="ads-stat-subtext">
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>storefront</span> Mở bán trên cổng Host
                        </span>
                    </div>
                    <div className="ads-stat-icon-wrapper green">
                        <span className="material-symbols-outlined">sell</span>
                    </div>
                </div>

                <div className="ads-stat-card">
                    <div className="ads-stat-info">
                        <span className="ads-stat-label">Đơn Dịch Vụ Đang Chạy</span>
                        <span className="ads-stat-value">18</span>
                        <span className="ads-stat-subtext">
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>rocket_launch</span> Chủ Homestay đã kích hoạt
                        </span>
                    </div>
                    <div className="ads-stat-icon-wrapper blue">
                        <span className="material-symbols-outlined">campaign</span>
                    </div>
                </div>

                <div className="ads-stat-card">
                    <div className="ads-stat-info">
                        <span className="ads-stat-label">Tỷ Lệ Gia Hạn Gói</span>
                        <span className="ads-stat-value">84.5%</span>
                        <span className="ads-stat-subtext">
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>trending_up</span> Khách hàng tiếp tục mua
                        </span>
                    </div>
                    <div className="ads-stat-icon-wrapper amber">
                        <span className="material-symbols-outlined">autorenew</span>
                    </div>
                </div>
            </div>

            {/* 2. Main Content Module Card */}
            <div className="content-module-card">
                
                {/* Module Header Bar */}
                <div className="module-header-bar">
                    <div className="module-title-group">
                        <h2>
                            <span className="material-symbols-outlined" style={{ color: 'var(--primary-color)' }}>campaign</span>
                            Bán & Cung Cấp Dịch Vụ Quảng Cáo
                        </h2>
                        <span className="module-subtitle">Cung cấp các gói đẩy top tìm kiếm, banner Hero Slider, combo ưu đãi & dịch vụ tiếp thị cho chủ Homestay</span>
                    </div>

                    {/* Sub-module Navigation Tabs */}
                    <div className="content-tabs">
                        <button className={`content-tab-btn ${activeTab === 'packages' ? 'active' : ''}`} onClick={() => switchAdsTab('packages')}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>sell</span>
                            Gói Dịch Vụ Đang Bán
                        </button>
                        <button className={`content-tab-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => switchAdsTab('orders')}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>receipt_long</span>
                            Đơn Mua & Đang Chạy
                        </button>
                        <button className={`content-tab-btn ${activeTab === 'slots' ? 'active' : ''}`} onClick={() => switchAdsTab('slots')}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>ad_units</span>
                            Vị Trí & Khung Hiển Thị (Slots)
                        </button>
                    </div>
                </div>

                {/* Module Toolbar (Search & Filter & Create Button) */}
                <div className="module-toolbar">
                    <div className="toolbar-left">
                        <div className="search-box-sm">
                            <span className="material-symbols-outlined" style={{ color: 'var(--text-muted)', marginRight: '6px', fontSize: '18px' }}>search</span>
                            <input type="text" placeholder="Tìm tên gói dịch vụ, đơn mua, homestay..." />
                        </div>

                        <select className="select-filter-sm">
                            <option value="all">Tất cả trạng thái</option>
                            <option value="active">Đang mở bán / Đang chạy</option>
                            <option value="scheduled">Đã lên lịch / Chờ duyệt</option>
                            <option value="ended">Tạm dừng / Kết thúc</option>
                        </select>
                    </div>

                    <button className="btn-admin-primary" onClick={openCreateAdModal}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add_circle</span>
                        <span>+ Tạo Gói Dịch Vụ Mới</span>
                    </button>
                </div>

                {/* Data Table View */}
                <div className="table-responsive">
                    <table className="admin-data-table">
                        <thead>
                            {activeTab === 'packages' && (
                                <tr>
                                    <th>ID</th>
                                    <th>Tên Gói Dịch Vụ</th>
                                    <th>Phân Loại</th>
                                    <th>Giá Niêm Yết (VNĐ)</th>
                                    <th>Quyền Lợi Chính</th>
                                    <th>Trạng Thái</th>
                                    <th>Hành Động</th>
                                </tr>
                            )}
                            {activeTab === 'orders' && (
                                <tr>
                                    <th>Mã Đơn</th>
                                    <th>Homestay / Khách Hàng</th>
                                    <th>Gói Dịch Vụ</th>
                                    <th>Thời Gian Chạy</th>
                                    <th>Giá Trị Đơn</th>
                                    <th>Trạng Thái</th>
                                    <th>Hành Động</th>
                                </tr>
                            )}
                            {activeTab === 'slots' && (
                                <tr>
                                    <th>Mã Slot</th>
                                    <th>Tên Vị Trí / Khu Vực</th>
                                    <th>Định Dạng</th>
                                    <th>Đang Sử Dụng</th>
                                    <th>Chỉ Số CTR Trung Bình</th>
                                    <th>Trạng Thái</th>
                                    <th>Hành Động</th>
                                </tr>
                            )}
                        </thead>
                        <tbody>
                            {activeTab === 'packages' && (
                                <tr>
                                    <td><span className="order-code-badge">PKG-001</span></td>
                                    <td><strong style={{ color: '#0F172A' }}>Gói Top 1 Chuyên Nghiệp</strong></td>
                                    <td><span className="package-badge hot">🔥 Gói HOT</span></td>
                                    <td><span className="price-tag">990.000đ</span></td>
                                    <td><span className="feature-pill">Top 5 Tìm Kiếm</span><span className="feature-pill">Banner</span></td>
                                    <td><span className="user-status-badge active">Đang mở bán</span></td>
                                    <td>
                                        <button className="btn-action-icon" title="Sửa" onClick={openCreateAdModal}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                                        </button>
                                    </td>
                                </tr>
                            )}
                            {activeTab === 'orders' && (
                                <tr>
                                    <td><span className="order-code-badge">ORD-ADS-991</span></td>
                                    <td>
                                        <strong style={{ color: '#0F172A' }}>Mây Lang Thang Homestay</strong>
                                        <div className="host-sub">Chủ nhà: Phạm Thị Mai</div>
                                    </td>
                                    <td><span className="package-badge hot">Gói Top 1</span></td>
                                    <td>01/10/2026 - 31/10/2026</td>
                                    <td><span className="price-tag">990.000đ</span></td>
                                    <td><span className="user-status-badge active">Đang chạy</span></td>
                                    <td>
                                        <button className="btn-action-icon" title="Sửa" onClick={openCreateAdModal}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                                        </button>
                                    </td>
                                </tr>
                            )}
                            {activeTab === 'slots' && (
                                <tr>
                                    <td><span className="order-code-badge">SLOT-HRO</span></td>
                                    <td><strong style={{ color: '#0F172A' }}>Hero Slider Trang Chủ</strong></td>
                                    <td>1920x600px</td>
                                    <td><strong style={{ color: '#15803D' }}>4/5 Slot</strong></td>
                                    <td><span className="ctr-badge">12.5%</span></td>
                                    <td><span className="user-status-badge active">Đang hoạt động</span></td>
                                    <td>
                                        <button className="btn-action-icon" title="Sửa" onClick={openCreateAdModal}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                                        </button>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 3. Modal Thêm / Chỉnh Sửa Gói Dịch Vụ & Đơn Chạy Quảng Cáo */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-container">
                        <div className="modal-header">
                            <h3 className="modal-title">
                                <span className="material-symbols-outlined" style={{ color: 'var(--primary-color)' }}>sell</span>
                                <span>Tạo Gói Dịch Vụ Quảng Cáo Mới</span>
                            </h3>
                            <button className="modal-close-btn" onClick={closeAdModal}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="modal-body">
                            {/* Form content can conditionally render based on activeTab, or just show Package creation fields for now */}
                            {activeTab === 'packages' || activeTab === 'slots' ? (
                                <div>
                                    <div className="form-field full">
                                        <label className="form-label">Tên Gói Dịch Vụ Tiếp Thị <span style={{ color: 'red' }}>*</span></label>
                                        <input type="text" className="form-input" placeholder="Ví dụ: Gói Top 1 Chuyên Nghiệp, Gói Mùa Cao Điểm..." />
                                    </div>

                                    <div className="form-group-grid">
                                        <div className="form-field">
                                            <label className="form-label">Phân loại gói <span style={{ color: 'red' }}>*</span></label>
                                            <select className="form-select">
                                                <option value="hot">🔥 Gói HOT (Phổ biến nhất)</option>
                                                <option value="short">⚡ Ngắn hạn (3 - 7 ngày)</option>
                                                <option value="long">📅 Dài hạn (30 ngày)</option>
                                                <option value="seasonal">🌾 Mùa Cao Điểm / Lễ Hội</option>
                                                <option value="vip">💎 Gói Banner VIP Toàn Diện</option>
                                            </select>
                                        </div>

                                        <div className="form-field">
                                            <label className="form-label">Giá niêm yết bán (VNĐ) <span style={{ color: 'red' }}>*</span></label>
                                            <input type="text" className="form-input" placeholder="Ví dụ: 990.000đ hoặc 990000" />
                                        </div>
                                    </div>

                                    <div className="form-group-grid">
                                        <div className="form-field">
                                            <label className="form-label">Thời hạn gói <span style={{ color: 'red' }}>*</span></label>
                                            <input type="text" className="form-input" placeholder="Ví dụ: 30 ngày, 3 ngày, 14 ngày..." />
                                        </div>

                                        <div className="form-field">
                                            <label className="form-label">Vị trí / Hình thức hiển thị</label>
                                            <select className="form-select">
                                                <option value="top5">⚡ Ưu tiên TOP 5 Tìm Kiếm</option>
                                                <option value="hero">🎯 Hero Slider Trang Chủ</option>
                                                <option value="combo">🏷️ Combo Spotlight Giữa Trang</option>
                                                <option value="popup">💬 Pop-up Chào Mừng Du Khách</option>
                                                <option value="festival">📍 Khu Vực Lễ Hội & Mùa Du Lịch</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-field full">
                                        <label className="form-label">Mô tả ngắn gói dịch vụ</label>
                                        <input type="text" className="form-input" placeholder="Ví dụ: Tối ưu cho cả tháng, tiếp cận tối đa du khách" />
                                    </div>

                                    <div className="form-field full">
                                        <label className="form-label">Danh sách quyền lợi dịch vụ (phân cách bởi dấu chấm phẩy ;)</label>
                                        <textarea className="form-input" rows="3" placeholder="Hiển thị Banner đề xuất Trang Chủ; Báo cáo hiệu quả Realtime; Hỗ trợ tối ưu bài viết & hình ảnh"></textarea>
                                    </div>

                                    <div className="form-field full">
                                        <label className="form-label">Trạng thái mở bán</label>
                                        <select className="form-select">
                                            <option value="active">Đang mở bán trên cổng Host</option>
                                            <option value="ended">Tạm ngưng mở bán</option>
                                        </select>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div className="form-field full">
                                        <label className="form-label">Tên Homestay / Đối tác đăng ký <span style={{ color: 'red' }}>*</span></label>
                                        <input type="text" className="form-input" placeholder="Ví dụ: Han River Glass House & Cozy Villa..." />
                                    </div>

                                    <div className="form-group-grid">
                                        <div className="form-field">
                                            <label className="form-label">Gói Dịch Vụ Đăng Ký <span style={{ color: 'red' }}>*</span></label>
                                            <select className="form-select">
                                                <option value="pkg1">Gói Top 1 Chuyên Nghiệp</option>
                                            </select>
                                        </div>

                                        <div className="form-field">
                                            <label className="form-label">Giá trị đơn hàng (VNĐ)</label>
                                            <input type="text" className="form-input" placeholder="Ví dụ: 990.000đ" />
                                        </div>
                                    </div>

                                    <div className="form-field full">
                                        <label className="form-label">Tiêu đề chiến dịch / Nội dung quảng bá</label>
                                        <input type="text" className="form-input" placeholder="Ví dụ: Đẩy top & Banner Ưu Đãi Mùa Lễ Hội..." />
                                    </div>

                                    <div className="form-field full">
                                        <label className="form-label">Đường dẫn liên kết khi click (URL)</label>
                                        <input type="text" className="form-input" placeholder="https://yenhomestay.com/homestay/han-river" />
                                    </div>

                                    <div className="form-group-grid">
                                        <div className="form-field">
                                            <label className="form-label">Ngày bắt đầu</label>
                                            <input type="text" className="form-input" placeholder="01/05/2026" />
                                        </div>
                                        <div className="form-field">
                                            <label className="form-label">Ngày kết thúc</label>
                                            <input type="text" className="form-input" placeholder="31/05/2026" />
                                        </div>
                                    </div>

                                    <div className="form-field full">
                                        <label className="form-label">Trạng thái đơn hàng</label>
                                        <select className="form-select">
                                            <option value="active">Đang chạy (Active)</option>
                                            <option value="scheduled">Đã lên lịch (Scheduled)</option>
                                            <option value="ended">Tạm dừng / Hoàn thành</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button className="btn-admin-cancel" onClick={closeAdModal}>Hủy bỏ</button>
                            <button className="btn-admin-primary">Lưu Dữ Liệu</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
