import React, { useState } from 'react';
import './LocalContent.css';

export default function LocalContent() {
    const [activeTab, setActiveTab] = useState('festivals');
    const [showModal, setShowModal] = useState(false);

    return (
        <div className="local-content-wrapper">
            {/* 1. Top Stat Cards (Grid 4 cột Thống kê) */}
            <div className="local-stats-grid">
                <div className="stat-card">
                    <div className="stat-info">
                        <span className="stat-label">Lễ Hội & Sự Kiện</span>
                        <span className="stat-value">4</span>
                        <span className="stat-subtext"><span className="material-symbols-outlined" style={{ fontSize: '14px' }}>event</span> Sắp & Đang diễn ra</span>
                    </div>
                    <div className="stat-icon-wrapper amber">
                        <span className="material-symbols-outlined">festival</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-info">
                        <span className="stat-label">Tỉnh / Thành Phố</span>
                        <span className="stat-value">4</span>
                        <span className="stat-subtext"><span className="material-symbols-outlined" style={{ fontSize: '14px' }}>location_city</span> Điểm đến trọng điểm</span>
                    </div>
                    <div className="stat-icon-wrapper green">
                        <span className="material-symbols-outlined">map</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-info">
                        <span className="stat-label">Trải Nghiệm Bản Địa</span>
                        <span className="stat-value">4</span>
                        <span className="stat-subtext"><span className="material-symbols-outlined" style={{ fontSize: '14px' }}>star</span> Đánh giá {'>'} 4.9★</span>
                    </div>
                    <div className="stat-icon-wrapper blue">
                        <span className="material-symbols-outlined">explore</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-info">
                        <span className="stat-label">Homestay Liên Kết</span>
                        <span className="stat-value">16</span>
                        <span className="stat-subtext"><span className="material-symbols-outlined" style={{ fontSize: '14px' }}>cottage</span> 4 căn / Lễ hội</span>
                    </div>
                    <div className="stat-icon-wrapper rose">
                        <span className="material-symbols-outlined">home_work</span>
                    </div>
                </div>
            </div>

            {/* 2. Main Content Module Card */}
            <div className="content-module-card">
                
                {/* Module Header Bar */}
                <div className="module-header-bar">
                    <div className="module-title-group">
                        <h2>
                            <span className="material-symbols-outlined" style={{ color: 'var(--primary-color)' }}>location_on</span>
                            Quản Lý Nội Dung Địa Phương
                        </h2>
                        <span className="module-subtitle">Điều phối các Sự kiện Lễ hội, Trải nghiệm văn hóa bản địa & Gán Homestay liên quan</span>
                    </div>

                    {/* Sub-module Navigation Tabs */}
                    <div className="content-tabs">
                        <button className={`content-tab-btn ${activeTab === 'festivals' ? 'active' : ''}`} onClick={() => setActiveTab('festivals')}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>event</span>
                            Lễ Hội & Sự Kiện
                        </button>
                        <button className={`content-tab-btn ${activeTab === 'experiences' ? 'active' : ''}`} onClick={() => setActiveTab('experiences')}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>hiking</span>
                            Điểm Đến & Trải Nghiệm
                        </button>
                    </div>
                </div>

                {/* Module Toolbar */}
                <div className="module-toolbar">
                    <div className="toolbar-left">
                        <div className="search-box-sm">
                            <span className="material-symbols-outlined" style={{ color: 'var(--text-muted)', marginRight: '6px', fontSize: '18px' }}>search</span>
                            <input type="text" placeholder="Tìm tên lễ hội, địa điểm..." />
                        </div>

                        <select className="select-filter-sm">
                            <option value="all">Tất cả trạng thái</option>
                            <option value="upcoming">Sắp diễn ra</option>
                            <option value="active">Đang diễn ra</option>
                            <option value="featured">Nổi bật</option>
                        </select>
                    </div>

                    <button className="btn-admin-primary" onClick={() => setShowModal(true)}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
                        <span>{activeTab === 'festivals' ? 'Thêm Lễ hội mới' : 'Thêm Trải nghiệm mới'}</span>
                    </button>
                </div>

                {/* Data Table View */}
                <div className="table-responsive">
                    <table className="admin-data-table">
                        <thead>
                            {activeTab === 'festivals' ? (
                                <tr>
                                    <th>Lễ Hội / Sự Kiện</th>
                                    <th>Tỉnh Thành</th>
                                    <th>Thời Gian Tổ Chức</th>
                                    <th>Homestay Gán Đề Xuất</th>
                                    <th>Trạng Thái</th>
                                    <th>Thao Tác</th>
                                </tr>
                            ) : (
                                <tr>
                                    <th>Điểm Đến / Trải Nghiệm</th>
                                    <th>Tỉnh Thành</th>
                                    <th>Mô Tả Tiện Ích</th>
                                    <th>Homestay Liên Kết</th>
                                    <th>Trạng Thái</th>
                                    <th>Thao Tác</th>
                                </tr>
                            )}
                        </thead>
                        <tbody>
                            {activeTab === 'festivals' && (
                                <>
                                    <tr>
                                        <td>
                                            <div className="cell-item-title">
                                                <img src="https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?auto=format&fit=crop&w=150&q=80" alt="thumb" className="item-thumb" />
                                                <div className="item-name-group">
                                                    <span className="item-name">Festival Hoa Đà Lạt</span>
                                                    <span className="item-location"><span className="material-symbols-outlined" style={{ fontSize: '13px' }}>location_on</span> Quảng trường Lâm Viên</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td><strong>Đà Lạt</strong></td>
                                        <td>20/12 - 30/12/2026</td>
                                        <td><strong style={{ color: '#0284C7' }}>4 Homestay</strong></td>
                                        <td><span className="status-badge upcoming">Sắp diễn ra</span></td>
                                        <td>
                                            <div className="action-btns">
                                                <button className="btn-action-icon" onClick={() => setShowModal(true)}><span className="material-symbols-outlined">edit</span></button>
                                                <button className="btn-action-icon danger"><span className="material-symbols-outlined">delete</span></button>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <div className="cell-item-title">
                                                <img src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=150&q=80" alt="thumb" className="item-thumb" />
                                                <div className="item-name-group">
                                                    <span className="item-name">Lễ hội Pháo hoa Quốc tế</span>
                                                    <span className="item-location"><span className="material-symbols-outlined" style={{ fontSize: '13px' }}>location_on</span> Bờ sông Hàn</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td><strong>Đà Nẵng</strong></td>
                                        <td>08/06 - 13/07/2026</td>
                                        <td><strong style={{ color: '#0284C7' }}>8 Homestay</strong></td>
                                        <td><span className="status-badge featured">Nổi bật</span></td>
                                        <td>
                                            <div className="action-btns">
                                                <button className="btn-action-icon" onClick={() => setShowModal(true)}><span className="material-symbols-outlined">edit</span></button>
                                                <button className="btn-action-icon danger"><span className="material-symbols-outlined">delete</span></button>
                                            </div>
                                        </td>
                                    </tr>
                                </>
                            )}

                            {activeTab === 'experiences' && (
                                <>
                                    <tr>
                                        <td>
                                            <div className="cell-item-title">
                                                <img src="https://images.unsplash.com/photo-1596701062351-8c2c14d1fdd0?auto=format&fit=crop&w=150&q=80" alt="thumb" className="item-thumb" />
                                                <div className="item-name-group">
                                                    <span className="item-name">Săn mây Tà Xùa</span>
                                                    <span className="item-location"><span className="material-symbols-outlined" style={{ fontSize: '13px' }}>location_on</span> Đỉnh Tà Xùa, Bắc Yên</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td><strong>Sơn La</strong></td>
                                        <td>Trải nghiệm ngắm bình minh trên biển mây</td>
                                        <td><strong style={{ color: '#0284C7' }}>3 Homestay</strong></td>
                                        <td><span className="status-badge active">Hoạt động</span></td>
                                        <td>
                                            <div className="action-btns">
                                                <button className="btn-action-icon" onClick={() => setShowModal(true)}><span className="material-symbols-outlined">edit</span></button>
                                                <button className="btn-action-icon danger"><span className="material-symbols-outlined">delete</span></button>
                                            </div>
                                        </td>
                                    </tr>
                                </>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 3. Modal Thêm / Chỉnh Sửa Lễ Hội / Trải Nghiệm */}
            {showModal && (
                <div className="modal-overlay show">
                    <div className="modal-container">
                        <div className="modal-header">
                            <h3 className="modal-title">
                                <span className="material-symbols-outlined" style={{ color: 'var(--primary-color)' }}>add_circle</span>
                                <span>{activeTab === 'festivals' ? 'Thêm Lễ hội / Sự kiện mới' : 'Thêm Trải nghiệm mới'}</span>
                            </h3>
                            <button className="modal-close-btn" onClick={() => setShowModal(false)}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="form-field full">
                                <label className="form-label">Tên Lễ hội / Trải nghiệm <span style={{ color: 'red' }}>*</span></label>
                                <input type="text" className="form-input" placeholder="Ví dụ: Festival Hoa Đà Lạt 2026..." />
                            </div>

                            <div className="form-group-grid">
                                <div className="form-field">
                                    <label className="form-label">Tỉnh / Thành phố <span style={{ color: 'red' }}>*</span></label>
                                    <select className="form-select">
                                        <option value="Đà Nẵng">Đà Nẵng</option>
                                        <option value="Đà Lạt">Đà Lạt</option>
                                        <option value="Huế">Huế</option>
                                        <option value="Ninh Bình">Ninh Bình</option>
                                        <option value="Hội An">Hội An</option>
                                        <option value="Sapa">Sapa</option>
                                    </select>
                                </div>

                                <div className="form-field">
                                    <label className="form-label">Thời gian tổ chức</label>
                                    <input type="text" className="form-input" placeholder="Ví dụ: 08/06 - 13/07/2026" />
                                </div>
                            </div>

                            <div className="form-field full">
                                <label className="form-label">Địa điểm cụ thể / Tiện ích Homestay</label>
                                <input type="text" className="form-input" placeholder="Ví dụ: Quảng trường Lâm Viên hoặc Phục vụ trà củi nóng tận ban công..." />
                            </div>

                            <div className="form-field full">
                                <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span>Homestay lân cận hiển thị trên trang chủ</span>
                                    <span style={{ fontSize: '11.5px', color: 'var(--primary-color)', fontWeight: 700 }}>⚡ Tự động quét theo địa điểm + Tùy chỉnh</span>
                                </label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '160px', overflowY: 'auto', background: '#F8FAFC', border: '1px solid var(--border-color)', padding: '12px', borderRadius: '8px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                                        <input type="checkbox" /> The Pine Hill Retreat
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                                        <input type="checkbox" /> Mây Lang Thang Homestay
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                                        <input type="checkbox" /> Han River Cozy
                                    </label>
                                </div>
                            </div>

                            <div className="form-field full">
                                <label className="form-label">Trạng thái hiển thị</label>
                                <select className="form-select">
                                    <option value="upcoming">Sắp diễn ra</option>
                                    <option value="active">Đang diễn ra / Hoạt động</option>
                                    <option value="featured">Nổi bật / Gói độc quyền</option>
                                    <option value="ended">Đã kết thúc / Tạm ẩn</option>
                                </select>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-admin-cancel" onClick={() => setShowModal(false)}>Hủy bỏ</button>
                            <button className="btn-admin-primary" onClick={() => setShowModal(false)}>Lưu nội dung</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
