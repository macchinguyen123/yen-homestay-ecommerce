import React, { useState } from 'react';
import './ComplaintsManagement.css';

export default function ComplaintsManagement() {
    const [activeTab, setActiveTab] = useState('all');
    const [showDisputeModal, setShowDisputeModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const switchDirectionTab = (tab) => {
        setActiveTab(tab);
    };

    return (
        <div className="complaints-management-wrapper">
            {/* 1. Top Stat Cards (4 Cột Thống Kê Khiếu Nại) */}
            <div className="local-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '28px' }}>
                <div className="stat-card" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="stat-info" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span className="stat-label" style={{ fontSize: '13px', fontWeight: 600, color: '#64748B' }}>Tổng Khiếu Nại Tiếp Nhận</span>
                        <span className="stat-value" style={{ fontSize: '26px', fontWeight: 800, color: '#0F172A' }}>6</span>
                        <span className="stat-subtext" style={{ fontSize: '12px', color: '#DC2626', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>report_problem</span> Hồ sơ ghi nhận
                        </span>
                    </div>
                    <div className="dispute-stat-icon-wrapper red">
                        <span className="material-symbols-outlined">warning</span>
                    </div>
                </div>

                <div className="stat-card" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="stat-info" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span className="stat-label" style={{ fontSize: '13px', fontWeight: 600, color: '#64748B' }}>Đang Xử Lý & Xác Minh</span>
                        <span className="stat-value" style={{ fontSize: '26px', fontWeight: 800, color: '#D97706' }}>4</span>
                        <span className="stat-subtext" style={{ fontSize: '12px', color: '#D97706', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>hourglass_top</span> Cần giải quyết
                        </span>
                    </div>
                    <div className="dispute-stat-icon-wrapper amber">
                        <span className="material-symbols-outlined">pending_actions</span>
                    </div>
                </div>

                <div className="stat-card" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="stat-info" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span className="stat-label" style={{ fontSize: '13px', fontWeight: 600, color: '#64748B' }}>Khách Khiếu Nại Homestay</span>
                        <span className="stat-value" style={{ fontSize: '26px', fontWeight: 800, color: '#2563EB' }}>3</span>
                        <span className="stat-subtext" style={{ fontSize: '12px', color: '#2563EB', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>person</span> Du khách phản ánh
                        </span>
                    </div>
                    <div className="dispute-stat-icon-wrapper blue">
                        <span className="material-symbols-outlined">person_alert</span>
                    </div>
                </div>

                <div className="stat-card" style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="stat-info" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span className="stat-label" style={{ fontSize: '13px', fontWeight: 600, color: '#64748B' }}>Homestay Khiếu Nại Khách</span>
                        <span className="stat-value" style={{ fontSize: '26px', fontWeight: 800, color: '#7C3AED' }}>3</span>
                        <span className="stat-subtext" style={{ fontSize: '12px', color: '#7C3AED', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>cottage</span> Chủ nhà báo cáo
                        </span>
                    </div>
                    <div className="dispute-stat-icon-wrapper purple">
                        <span className="material-symbols-outlined">home_repair_service</span>
                    </div>
                </div>
            </div>

            {/* 2. Main Content Module Card */}
            <div className="content-module-card">
                
                {/* Module Header Bar */}
                <div className="module-header-bar">
                    <div className="module-title-group">
                        <h2>
                            <span className="material-symbols-outlined" style={{ color: '#DC2626' }}>report_problem</span>
                            Quản Lý Báo Cáo & Khiếu Nại (Tranh Chấp 2 Chiều)
                        </h2>
                        <span className="module-subtitle">Trung tâm hòa giải và xử lý phản ánh: Khách du lịch khiếu nại Homestay & Chủ nhà khiếu nại Khách du lịch</span>
                    </div>

                    {/* Tabs phân loại 2 chiều */}
                    <div className="content-tabs">
                        <button className={`content-tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => switchDirectionTab('all')}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>view_list</span>
                            Tất Cả Khiếu Nại
                        </button>
                        <button className={`content-tab-btn ${activeTab === 'tourist_to_homestay' ? 'active' : ''}`} onClick={() => switchDirectionTab('tourist_to_homestay')}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person</span>
                            Khách ➔ Homestay
                        </button>
                        <button className={`content-tab-btn ${activeTab === 'homestay_to_tourist' ? 'active' : ''}`} onClick={() => switchDirectionTab('homestay_to_tourist')}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>cottage</span>
                            Homestay ➔ Khách
                        </button>
                    </div>
                </div>

                {/* Module Toolbar (Search & Filter & Action) */}
                <div className="module-toolbar">
                    <div className="toolbar-left">
                        <div className="search-box-sm">
                            <span className="material-symbols-outlined" style={{ color: 'var(--text-muted, #64748B)', marginRight: '6px', fontSize: '18px' }}>search</span>
                            <input type="text" placeholder="Tìm mã khiếu nại, mã booking, khách hàng, homestay..." />
                        </div>

                        <select className="select-filter-sm">
                            <option value="all">Tất cả trạng thái</option>
                            <option value="pending">Chờ tiếp nhận</option>
                            <option value="investigating">Đang xác minh / Đối chất</option>
                            <option value="resolved">Đã giải quyết</option>
                            <option value="rejected">Đã bác bỏ</option>
                        </select>

                        <select className="select-filter-sm">
                            <option value="all">Tất cả mức độ</option>
                            <option value="urgent">Khẩn cấp</option>
                            <option value="medium">Trung bình</option>
                            <option value="low">Bình thường</option>
                        </select>
                    </div>

                    <button className="btn-admin-primary" style={{ backgroundColor: '#DC2626' }} onClick={() => setShowCreateModal(true)}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add_alert</span>
                        <span>Ghi Nhận Khiếu Nại Mới</span>
                    </button>
                </div>

                {/* Data Table View */}
                <div className="table-responsive">
                    <table className="admin-data-table">
                        <thead>
                            <tr>
                                <th>Mã Hồ Sơ</th>
                                <th>Chiều Khiếu Nại</th>
                                <th>Các Bên Tranh Chấp</th>
                                <th>Nội Dung & Yêu Cầu</th>
                                <th>Mức Độ</th>
                                <th>Trạng Thái</th>
                                <th style={{ textAlign: 'right', paddingRight: '20px' }}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <span className="dispute-code-highlight">#KN-1048</span>
                                    <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Đơn: #BK-8841</div>
                                </td>
                                <td><span className="dispute-direction-badge tourist-to-homestay">👤 Khách ➔ 🏡 Homestay</span></td>
                                <td>
                                    <div className="dispute-parties-box">
                                        <div className="party-item">
                                            <span className="party-label reporter">Nguyên Đơn</span>
                                            <strong style={{ color: '#0F172A' }}>Nguyễn Thảo Ly</strong>
                                        </div>
                                        <div className="party-item">
                                            <span className="party-label reported">Bị Đơn</span>
                                            <strong style={{ color: '#0F172A' }}>Nhà Sàn Mộc Mai Châu</strong>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <strong style={{ color: '#0F172A', display: 'block', marginBottom: '2px' }}>Homestay không giống ảnh, phòng bẩn</strong>
                                    <span style={{ fontSize: '11.5px', color: '#DC2626', fontWeight: 600 }}>Yêu cầu: Hoàn tiền 100%</span>
                                </td>
                                <td><span className="severity-badge urgent">Khẩn cấp</span></td>
                                <td><span className="dispute-status-badge investigating">Đang xác minh</span></td>
                                <td style={{ textAlign: 'right', paddingRight: '20px' }}>
                                    <button className="btn-action-icon" title="Hòa giải / Phán quyết" onClick={() => setShowDisputeModal(true)}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#15803D' }}>gavel</span>
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL 1: CHI TIẾT & HÒA GIẢI TRANH CHẤP (RESOLUTION CENTER) */}
            {showDisputeModal && (
                <div className="modal-overlay">
                    <div className="modal-container" style={{ maxWidth: '860px' }}>
                        <div className="modal-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span className="material-symbols-outlined" style={{ color: '#DC2626', fontSize: '26px' }}>gavel</span>
                                <div>
                                    <h3 className="modal-title" style={{ margin: 0, fontSize: '16px' }}>
                                        Hòa Giải & Xử Lý Khiếu Nại <span style={{ color: '#15803D' }}>#KN-1048</span>
                                    </h3>
                                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                                        <span>Đơn: #BK-8841</span> • <span>26/09/2026 - 28/09/2026</span>
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span className="dispute-direction-badge tourist-to-homestay">👤 Khách ➔ 🏡 Homestay</span>
                                <button className="modal-close-btn" onClick={() => setShowDisputeModal(false)}>
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                        </div>

                        <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                            {/* Grid 2 bên tranh chấp */}
                            <div className="dispute-modal-grid">
                                {/* Bên Khiếu Nại (Reporter) */}
                                <div className="dispute-card-panel highlight-blue">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <span className="party-label reporter">Bên Đưa Khiếu Nại (Nguyên đơn)</span>
                                    </div>
                                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#1E293B', marginBottom: '6px' }}>Nguyễn Thảo Ly</h4>
                                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#DC2626', marginBottom: '6px' }}>Homestay không giống ảnh, phòng bẩn</div>
                                    <div style={{ fontSize: '12.5px', color: '#475569', lineHeight: 1.5, background: '#FFFFFF', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                                        Khi đến nhận phòng, tôi thấy phòng rất bẩn, không dọn dẹp, và hoàn toàn khác xa với hình ảnh quảng cáo trên website.
                                    </div>

                                    <div style={{ marginTop: '10px', fontSize: '12.5px', color: '#9A3412', fontWeight: 700 }}>
                                        Yêu cầu đền bù: <span style={{ color: '#C2410C' }}>Hoàn tiền 100%</span>
                                    </div>
                                </div>

                                {/* Bên Bị Khiếu Nại (Reported) & Lịch sử đối chất */}
                                <div className="dispute-card-panel highlight-purple">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <span className="party-label reported">Bên Bị Khiếu Nại (Bị đơn)</span>
                                    </div>
                                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#1E293B', marginBottom: '6px' }}>Nhà Sàn Mộc Mai Châu</h4>
                                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', marginBottom: '4px' }}>Giải trình / Phản hồi từ bị đơn:</div>
                                    <div style={{ fontSize: '12.5px', color: '#475569', lineHeight: 1.5, background: '#FFFFFF', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                                        Do hôm đó mưa lớn nên có một chút vấn đề, nhưng chúng tôi đã đề nghị đổi phòng cho khách.
                                    </div>

                                    {/* Dòng thời gian vụ việc */}
                                    <div style={{ marginTop: '14px' }}>
                                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>Tiến trình xử lý vụ việc:</span>
                                        <div className="dispute-timeline">
                                            <div className="timeline-step">
                                                <div className="timeline-dot"></div>
                                                <div className="timeline-desc">Tiếp nhận khiếu nại</div>
                                                <div className="timeline-time">28/09/2026 14:00</div>
                                            </div>
                                            <div className="timeline-step">
                                                <div className="timeline-dot pending"></div>
                                                <div className="timeline-desc">Chờ phản hồi từ Homestay</div>
                                                <div className="timeline-time">Đang xử lý</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Khung phán quyết & Hòa giải của Admin Sàn YÊN */}
                            <div className="dispute-card-panel resolution-box" style={{ marginTop: '20px' }}>
                                <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#166534', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span className="material-symbols-outlined">balance</span>
                                    <span>Quyết Định Hòa Giải Của Admin Sàn YÊN Homestay</span>
                                </h4>

                                <div className="form-group-grid">
                                    <div className="form-field">
                                        <label className="form-label">Phương Án Phán Quyết / Xử Lý <span style={{ color: 'red' }}>*</span></label>
                                        <select className="form-select">
                                            <option value="refund_guest">💰 Hoàn tiền cho Khách (Trừ từ ví tạm giữ của Homestay)</option>
                                            <option value="charge_guest">💸 Yêu cầu Khách bồi thường thiệt hại cho Homestay</option>
                                            <option value="mediate_ok">🤝 Hòa giải thành công (Hai bên tự thỏa thuận, không phạt)</option>
                                            <option value="reject">❌ Bác bỏ khiếu nại (Không đủ chứng cứ / Vi phạm quy chế)</option>
                                        </select>
                                    </div>

                                    <div className="form-field">
                                        <label className="form-label">Số Tiền Bồi Hoàn / Khấu Trừ (VNĐ)</label>
                                        <input type="number" className="form-input" placeholder="0" />
                                    </div>
                                </div>

                                <div className="form-field full">
                                    <label className="form-label">Căn Cứ & Ghi Chú Kết Luận Của Ban Quản Trị YÊN</label>
                                    <textarea className="form-input" rows="2" placeholder="Ghi chú điều khoản quy chế sàn áp dụng và kết luận cuối cùng gửi cho hai bên..."></textarea>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-admin-cancel" onClick={() => setShowDisputeModal(false)}>Đóng</button>
                            <button className="btn-admin-primary" style={{ backgroundColor: '#15803D' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>verified</span>
                                <span>Ban Hành Quyết Định Giải Quyết</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 2: GHI NHẬN KHIẾU NẠI MỚI (ADMIN TẠO HỒ SƠ) */}
            {showCreateModal && (
                <div className="modal-overlay">
                    <div className="modal-container" style={{ maxWidth: '650px' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                <span className="material-symbols-outlined" style={{ color: '#DC2626' }}>add_alert</span>
                                <span>Ghi Nhận Hồ Sơ Khiếu Nại Mới</span>
                            </h3>
                            <button className="modal-close-btn" onClick={() => setShowCreateModal(false)}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="form-group-grid">
                                <div className="form-field">
                                    <label className="form-label">Chiều Khiếu Nại <span style={{ color: 'red' }}>*</span></label>
                                    <select className="form-select">
                                        <option value="tourist_to_homestay">👤 Khách du lịch khiếu nại Homestay</option>
                                        <option value="homestay_to_tourist">🏡 Homestay khiếu nại Khách du lịch</option>
                                    </select>
                                </div>

                                <div className="form-field">
                                    <label className="form-label">Mã Đơn Đặt Phòng (Booking)</label>
                                    <input type="text" className="form-input" placeholder="Ví dụ: #BK-8850" />
                                </div>
                            </div>

                            <div className="form-group-grid">
                                <div className="form-field">
                                    <label className="form-label">Bên Gửi Khiếu Nại (Nguyên đơn) <span style={{ color: 'red' }}>*</span></label>
                                    <input type="text" className="form-input" placeholder="Tên khách hàng hoặc tên homestay..." />
                                </div>

                                <div className="form-field">
                                    <label className="form-label">Bên Bị Khiếu Nại (Bị đơn) <span style={{ color: 'red' }}>*</span></label>
                                    <input type="text" className="form-input" placeholder="Tên đối tượng bị khiếu nại..." />
                                </div>
                            </div>

                            <div className="form-field full">
                                <label className="form-label">Tiêu Đề Khiếu Nại <span style={{ color: 'red' }}>*</span></label>
                                <input type="text" className="form-input" placeholder="Ví dụ: Phòng hỏng nước nóng, Khách làm hư hại đồ đạc..." />
                            </div>

                            <div className="form-field full">
                                <label className="form-label">Nội Dung Chi Tiết Sự Việc <span style={{ color: 'red' }}>*</span></label>
                                <textarea className="form-input" rows="3" placeholder="Mô tả diễn biến chi tiết sự việc, thời gian xảy ra..."></textarea>
                            </div>

                            <div className="form-group-grid">
                                <div className="form-field">
                                    <label className="form-label">Yêu Cầu / Đòi Bồi Thường</label>
                                    <input type="text" className="form-input" placeholder="Ví dụ: Hoàn 50% tiền phòng, đền bù 500.000đ..." />
                                </div>

                                <div className="form-field">
                                    <label className="form-label">Mức Độ Nghiêm Trọng</label>
                                    <select className="form-select">
                                        <option value="medium">Trung bình</option>
                                        <option value="urgent">Khẩn cấp (Cần xử lý ngay)</option>
                                        <option value="low">Bình thường</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-admin-cancel" onClick={() => setShowCreateModal(false)}>Hủy bỏ</button>
                            <button className="btn-admin-primary" style={{ backgroundColor: '#DC2626' }}>Lưu Hồ Sơ Khiếu Nại</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
