import React, { useState } from 'react';
import './VoucherManagement.css';

const initialVouchersList = [
    {
        id: 1,
        code: 'DALAT200',
        homestayName: 'The Memory Valley Villa',
        hostName: 'Nguyễn Văn An',
        hostPhone: '0912.345.678',
        hostAvatar: 'A',
        region: 'Đà Lạt',
        name: 'Ưu đãi mùa thu thung lũng Đà Lạt',
        discountType: 'percent', 
        discountVal: 20,
        maxDiscount: '200.000đ',
        minOrder: '1.000.000đ',
        totalLimit: 50,
        usedCount: 0,
        startDate: '01/10/2026',
        endDate: '31/10/2026',
        createdDate: '22/09/2026 14:30',
        status: 'pending', 
        statusText: 'Chờ duyệt',
        hostReason: 'Chúng tôi muốn chạy chương trình ưu đãi mùa thu tri ân khách lưu trú trên 2 đêm tại Đà Lạt. Chủ homestay tự tài trợ 100% kinh phí trợ giá.',
        adminNote: ''
    },
    {
        id: 2,
        code: 'SAPAWARM15',
        homestayName: 'Topas Ecolodge Sapa',
        hostName: 'Trần Thị Thu Hà',
        hostPhone: '0988.765.432',
        hostAvatar: 'H',
        region: 'Sa Pa',
        name: 'Mùa mây ấm áp Bungalow Sapa',
        discountType: 'percent',
        discountVal: 15,
        maxDiscount: '300.000đ',
        minOrder: '2.000.000đ',
        totalLimit: 30,
        usedCount: 0,
        startDate: '05/10/2026',
        endDate: '15/11/2026',
        createdDate: '22/09/2026 16:15',
        status: 'pending',
        statusText: 'Chờ duyệt',
        hostReason: 'Khuyến mãi mùa săn mây Tả Van cho các cặp đôi và gia đình đặt phòng trước 2 tuần.',
        adminNote: ''
    },
    {
        id: 3,
        code: 'HANRIVER100K',
        homestayName: 'Han River Glass House',
        hostName: 'Lê Hoàng Minh',
        hostPhone: '0905.123.987',
        hostAvatar: 'M',
        region: 'Đà Nẵng',
        name: 'Ngắm cảnh sông Hàn buổi tối',
        discountType: 'fixed',
        discountVal: 100000,
        maxDiscount: '100.000đ',
        minOrder: '800.000đ',
        totalLimit: 100,
        usedCount: 0,
        startDate: '01/10/2026',
        endDate: '30/11/2026',
        createdDate: '23/09/2026 09:10',
        status: 'pending',
        statusText: 'Chờ duyệt',
        hostReason: 'Kích cầu đặt phòng căn hộ kính view sông Hàn cho khách công tác & du lịch ngắn ngày.',
        adminNote: ''
    },
    {
        id: 4,
        code: 'PULUONGGREEN',
        homestayName: 'Pù Luông Eco Lodge',
        hostName: 'Phạm Văn Đức',
        hostPhone: '0945.888.999',
        hostAvatar: 'Đ',
        region: 'Pù Luông',
        name: 'Mùa lúa chín Pù Luông 2026',
        discountType: 'fixed',
        discountVal: 150000,
        maxDiscount: '150.000đ',
        minOrder: '1.200.000đ',
        totalLimit: 40,
        usedCount: 0,
        startDate: '10/10/2026',
        endDate: '05/11/2026',
        createdDate: '23/09/2026 10:05',
        status: 'pending',
        statusText: 'Chờ duyệt',
        hostReason: 'Chào đón du khách ngắm ruộng bậc thang mùa gặt bản Đôn Pù Luông.',
        adminNote: ''
    },
    {
        id: 5,
        code: 'HOIANVILLA10',
        homestayName: 'An Bang Beach Villa',
        hostName: 'Vũ Thị Ngọc',
        hostPhone: '0935.111.222',
        hostAvatar: 'N',
        region: 'Hội An',
        name: 'Nghỉ dưỡng biển An Bàng Hội An',
        discountType: 'percent',
        discountVal: 10,
        maxDiscount: '150.000đ',
        minOrder: '1.500.000đ',
        totalLimit: 60,
        usedCount: 18,
        startDate: '15/09/2026',
        endDate: '31/10/2026',
        createdDate: '14/09/2026 08:30',
        status: 'approved',
        statusText: 'Đã duyệt',
        hostReason: 'Khuyến mãi dịp đầu thu dành riêng cho du khách thích không gian yên tĩnh bãi biển An Bàng.',
        adminNote: 'Đã phê duyệt phát hành ngày 14/09/2026.'
    },
    {
        id: 6,
        code: 'NINHBINHCOZY',
        homestayName: 'Tràng An River Homestay',
        hostName: 'Bùi Quang Tuấn',
        hostPhone: '0977.333.444',
        hostAvatar: 'T',
        region: 'Ninh Bình',
        name: 'Khám phá di sản Tràng An',
        discountType: 'fixed',
        discountVal: 80000,
        maxDiscount: '80.000đ',
        minOrder: '600.000đ',
        totalLimit: 80,
        usedCount: 35,
        startDate: '01/09/2026',
        endDate: '31/10/2026',
        createdDate: '30/08/2026 11:20',
        status: 'approved',
        statusText: 'Đã duyệt',
        hostReason: 'Tăng lượng chốt phòng cuối tuần cho khách du lịch chèo thuyền Tràng An - Tam Cốc.',
        adminNote: 'Phê duyệt hợp lệ.'
    },
    {
        id: 7,
        code: 'HAGIANG500K',
        homestayName: 'Đồng Văn Plateau Lodge',
        hostName: 'Vàng A Lềnh',
        hostPhone: '0919.555.666',
        hostAvatar: 'L',
        region: 'Hà Giang',
        name: 'Mùa hoa tam giác mạch Hà Giang',
        discountType: 'fixed',
        discountVal: 500000,
        maxDiscount: '500.000đ',
        minOrder: '600.000đ',
        totalLimit: 200,
        usedCount: 0,
        startDate: '01/10/2026',
        endDate: '30/11/2026',
        createdDate: '20/09/2026 15:45',
        status: 'rejected',
        statusText: 'Đã từ chối',
        hostReason: 'Giảm 500.000đ cho khách phượt.',
        adminNote: 'Mức giảm giá quá cao, không phù hợp quy định hạn mức trợ giá của sàn YÊN.'
    }
];

export default function VoucherManagement() {
    const [vouchers, setVouchers] = useState(initialVouchersList);
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRegion, setSelectedRegion] = useState('all');
    const [selectedType, setSelectedType] = useState('all');

    const [activeModal, setActiveModal] = useState(null); // 'detail' | 'reject'
    const [selectedVoucher, setSelectedVoucher] = useState(null);
    const [rejectReason, setRejectReason] = useState('Mức giảm giá quá cao, không phù hợp quy định sàn');
    const [customRejectReason, setCustomRejectReason] = useState('');

    const handleCopy = (code) => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(code).then(() => {
                alert(`Đã sao chép mã ${code}!`);
            });
        } else {
            alert(`Mã: ${code}`);
        }
    };

    const handleApprove = (id) => {
        if (window.confirm(`Bạn có chắc chắn muốn PHÊ DUYỆT mã giảm giá này không?`)) {
            setVouchers(prev => prev.map(v => {
                if (v.id === id) {
                    return {
                        ...v,
                        status: 'approved',
                        statusText: 'Đã duyệt',
                        adminNote: `Đã duyệt phát hành bởi Admin ngày ${new Date().toLocaleDateString('vi-VN')}`
                    };
                }
                return v;
            }));
            setActiveModal(null);
            alert(`Đã phê duyệt phát hành mã giảm giá!`);
        }
    };

    const handleReject = () => {
        if (!selectedVoucher) return;
        
        let reason = rejectReason;
        if (rejectReason === 'custom') {
            reason = customRejectReason.trim();
            if (!reason) {
                alert('Vui lòng nhập lý do từ chối cụ thể!');
                return;
            }
        }

        setVouchers(prev => prev.map(v => {
            if (v.id === selectedVoucher.id) {
                return {
                    ...v,
                    status: 'rejected',
                    statusText: 'Đã từ chối',
                    adminNote: reason
                };
            }
            return v;
        }));
        
        setActiveModal(null);
        alert(`Đã từ chối yêu cầu phát hành mã ${selectedVoucher.code}!`);
    };

    const filteredVouchers = vouchers.filter(item => {
        const matchSearch = item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.homestayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.hostName.toLowerCase().includes(searchQuery.toLowerCase());

        const matchStatus = activeTab === 'all' || item.status === activeTab;
        const matchRegion = selectedRegion === 'all' || item.region === selectedRegion;
        const matchType = selectedType === 'all' || item.discountType === selectedType;

        return matchSearch && matchStatus && matchRegion && matchType;
    });

    const totalCount = vouchers.length;
    const pendingCount = vouchers.filter(v => v.status === 'pending').length;
    const approvedCount = vouchers.filter(v => v.status === 'approved').length;
    const rejectedCount = vouchers.filter(v => v.status === 'rejected').length;

    return (
        <div className="admin-body-content">
            {/* 1. Top Stat Cards */}
            <div className="local-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <div className="stat-card" onClick={() => setActiveTab('all')} style={{ cursor: 'pointer', background: '#fff', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="stat-info">
                        <span className="stat-label" style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Tổng Yêu Cầu Từ Host</span>
                        <div className="stat-value" style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', marginTop: '4px' }}>{totalCount}</div>
                    </div>
                    <div className="voucher-stat-icon-wrapper orange">
                        <span className="material-symbols-outlined">confirmation_number</span>
                    </div>
                </div>

                <div className="stat-card" onClick={() => setActiveTab('pending')} style={{ cursor: 'pointer', borderLeft: '4px solid #D97706', background: '#fff', padding: '16px', borderRadius: '10px', borderTop: '1px solid #E2E8F0', borderRight: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="stat-info">
                        <span className="stat-label" style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Đang Chờ Admin Duyệt</span>
                        <div className="stat-value" style={{ fontSize: '24px', fontWeight: 800, color: '#D97706', marginTop: '4px' }}>{pendingCount}</div>
                    </div>
                    <div className="voucher-stat-icon-wrapper amber">
                        <span className="material-symbols-outlined">pending_actions</span>
                    </div>
                </div>

                <div className="stat-card" onClick={() => setActiveTab('approved')} style={{ cursor: 'pointer', background: '#fff', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="stat-info">
                        <span className="stat-label" style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Đã Phê Duyệt Phát Hành</span>
                        <div className="stat-value" style={{ fontSize: '24px', fontWeight: 800, color: '#15803D', marginTop: '4px' }}>{approvedCount}</div>
                    </div>
                    <div className="voucher-stat-icon-wrapper green">
                        <span className="material-symbols-outlined">verified</span>
                    </div>
                </div>

                <div className="stat-card" onClick={() => setActiveTab('rejected')} style={{ cursor: 'pointer', background: '#fff', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="stat-info">
                        <span className="stat-label" style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Đã Từ Chối</span>
                        <div className="stat-value" style={{ fontSize: '24px', fontWeight: 800, color: '#DC2626', marginTop: '4px' }}>{rejectedCount}</div>
                    </div>
                    <div className="voucher-stat-icon-wrapper red">
                        <span className="material-symbols-outlined">assignment_late</span>
                    </div>
                </div>
            </div>

            {/* 2. Main Content Module Card */}
            <div className="content-module-card" style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <div className="module-header-bar" style={{ padding: '20px', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div className="module-title-group">
                        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                            <span className="material-symbols-outlined" style={{ color: '#15803D' }}>fact_check</span>
                            Duyệt Mã Giảm Giá Tạo Bởi Chủ Homestay
                        </h2>
                        <span className="module-subtitle" style={{ fontSize: '13px', color: '#64748B', marginTop: '4px', display: 'block' }}>Thẩm định điều kiện, mức giảm giá và mục đích khuyến mãi do chủ cơ sở homestay gửi yêu cầu phê duyệt</span>
                    </div>

                    <div className="content-tabs" style={{ display: 'flex', gap: '8px' }}>
                        <button className={`content-tab-btn ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')} style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', background: activeTab === 'all' ? '#1E293B' : '#F1F5F9', color: activeTab === 'all' ? '#fff' : '#475569', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>list_alt</span>
                            Tất Cả Yêu Cầu ({totalCount})
                        </button>
                        <button className={`content-tab-btn ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')} style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', background: activeTab === 'pending' ? '#D97706' : '#F1F5F9', color: activeTab === 'pending' ? '#fff' : '#475569', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: activeTab === 'pending' ? '#fff' : '#D97706' }}>hourglass_top</span>
                            Chờ Duyệt ({pendingCount})
                        </button>
                        <button className={`content-tab-btn ${activeTab === 'approved' ? 'active' : ''}`} onClick={() => setActiveTab('approved')} style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', background: activeTab === 'approved' ? '#15803D' : '#F1F5F9', color: activeTab === 'approved' ? '#fff' : '#475569', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: activeTab === 'approved' ? '#fff' : '#15803D' }}>check_circle</span>
                            Đã Duyệt ({approvedCount})
                        </button>
                        <button className={`content-tab-btn ${activeTab === 'rejected' ? 'active' : ''}`} onClick={() => setActiveTab('rejected')} style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', background: activeTab === 'rejected' ? '#DC2626' : '#F1F5F9', color: activeTab === 'rejected' ? '#fff' : '#475569', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: activeTab === 'rejected' ? '#fff' : '#DC2626' }}>cancel</span>
                            Đã Từ Chối ({rejectedCount})
                        </button>
                    </div>
                </div>

                <div className="module-toolbar" style={{ padding: '16px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div className="toolbar-left" style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div className="search-box-sm" style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '6px 12px', width: '300px' }}>
                            <span className="material-symbols-outlined" style={{ color: '#64748B', marginRight: '6px', fontSize: '18px' }}>search</span>
                            <input 
                                type="text" 
                                placeholder="Tìm mã voucher, tên homestay, chủ nhà..." 
                                style={{ border: 'none', outline: 'none', width: '100%', fontSize: '13px' }}
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <select 
                            className="select-filter-sm" 
                            style={{ padding: '7px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', outline: 'none', fontSize: '13px', color: '#1E293B', background: '#fff' }}
                            value={selectedRegion}
                            onChange={e => setSelectedRegion(e.target.value)}
                        >
                            <option value="all">Tất cả khu vực</option>
                            <option value="Đà Lạt">Đà Lạt</option>
                            <option value="Đà Nẵng">Đà Nẵng</option>
                            <option value="Sa Pa">Sa Pa</option>
                            <option value="Pù Luông">Pù Luông</option>
                            <option value="Hội An">Hội An</option>
                        </select>

                        <select 
                            className="select-filter-sm" 
                            style={{ padding: '7px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', outline: 'none', fontSize: '13px', color: '#1E293B', background: '#fff' }}
                            value={selectedType}
                            onChange={e => setSelectedType(e.target.value)}
                        >
                            <option value="all">Tất cả hình thức giảm</option>
                            <option value="percent">Giảm theo phần trăm (%)</option>
                            <option value="fixed">Giảm số tiền cố định (VNĐ)</option>
                        </select>
                    </div>

                    <div style={{ fontSize: '12.5px', color: '#64748B', fontWeight: 600 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px', verticalAlign: 'middle', color: '#15803D' }}>info</span> Chủ Homestay tự chịu chi phí trợ giá mã
                    </div>
                </div>

                <div className="table-responsive" style={{ overflowX: 'auto', padding: '20px' }}>
                    <table className="admin-data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                                <th style={{ padding: '12px 8px', color: '#475569', fontWeight: 600 }}>Mã Voucher & Ngày Gửi</th>
                                <th style={{ padding: '12px 8px', color: '#475569', fontWeight: 600 }}>Chủ Homestay & Cơ Sở</th>
                                <th style={{ padding: '12px 8px', color: '#475569', fontWeight: 600 }}>Tên Chương Trình & Mức Giảm</th>
                                <th style={{ padding: '12px 8px', color: '#475569', fontWeight: 600 }}>Số Lượng & Đơn Tối Thiểu</th>
                                <th style={{ padding: '12px 8px', color: '#475569', fontWeight: 600 }}>Hạn Sử Dụng</th>
                                <th style={{ padding: '12px 8px', color: '#475569', fontWeight: 600 }}>Trạng Thái</th>
                                <th style={{ padding: '12px 8px', color: '#475569', fontWeight: 600, textAlign: 'right', paddingRight: '20px' }}>Thao Tác Duyệt</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredVouchers.length === 0 ? (
                                <tr><td colSpan="7" style={{ textAlign: 'center', color: '#94A3B8', padding: '36px' }}>Không tìm thấy yêu cầu tạo mã giảm giá nào trong mục này.</td></tr>
                            ) : (
                                filteredVouchers.map(item => (
                                    <tr key={item.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                                        <td style={{ padding: '16px 8px' }}>
                                            <div className="voucher-code-badge" onClick={() => handleCopy(item.code)} title="Sao chép mã">
                                                <span>{item.code}</span>
                                                <span className="material-symbols-outlined copy-icon">content_copy</span>
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#64748B', marginTop: '3px' }}>
                                                Gửi: {item.createdDate}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div className="host-mini-avatar">{item.hostAvatar}</div>
                                                <div>
                                                    <strong style={{ color: '#0F172A', fontSize: '13px' }}>{item.hostName}</strong>
                                                    <div style={{ fontSize: '11.5px', color: '#15803D', fontWeight: 700, marginTop: '1px' }}>
                                                        {item.homestayName}
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: '#64748B' }}>Khu vực: {item.region}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 8px' }}>
                                            <strong style={{ color: '#0F172A', fontSize: '13px' }}>{item.name}</strong>
                                            {item.discountType === 'percent' ? (
                                                <>
                                                    <div className="discount-val-badge">
                                                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>percent</span>
                                                        <span>Giảm {item.discountVal}%</span>
                                                    </div>
                                                    <div className="discount-condition-sub">Tối đa: {item.maxDiscount}</div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="discount-val-badge">
                                                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>payments</span>
                                                        <span>Giảm {item.maxDiscount}</span>
                                                    </div>
                                                    <div className="discount-condition-sub">Trừ tiền mặt trực tiếp</div>
                                                </>
                                            )}
                                        </td>
                                        <td style={{ padding: '16px 8px' }}>
                                            <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0F172A' }}>{item.totalLimit} lượt phát hành</div>
                                            <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>Đơn từ: <strong>{item.minOrder}</strong></div>
                                        </td>
                                        <td style={{ padding: '16px 8px', fontSize: '11.5px', color: '#475569' }}>
                                            <div>Từ: <strong>{item.startDate}</strong></div>
                                            <div>Đến: <strong>{item.endDate}</strong></div>
                                        </td>
                                        <td style={{ padding: '16px 8px' }}>
                                            {item.status === 'pending' && (
                                                <span className="voucher-status-chip pending">
                                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#D97706' }}></span>
                                                    <span>Chờ Admin duyệt</span>
                                                </span>
                                            )}
                                            {item.status === 'approved' && (
                                                <span className="voucher-status-chip approved">
                                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#15803D' }}></span>
                                                    <span>Đã phê duyệt</span>
                                                </span>
                                            )}
                                            {item.status === 'rejected' && (
                                                <span className="voucher-status-chip rejected">
                                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#DC2626' }}></span>
                                                    <span>Đã từ chối</span>
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ padding: '16px 8px', textAlign: 'right', paddingRight: '16px' }}>
                                            {item.status === 'pending' && (
                                                <div className="action-btn-group">
                                                    <button className="btn-approve-sm" onClick={() => handleApprove(item.id)} title="Duyệt phát hành ngay">
                                                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
                                                        <span>Duyệt</span>
                                                    </button>
                                                    <button className="btn-reject-sm" onClick={() => { setSelectedVoucher(item); setActiveModal('reject'); }} title="Từ chối yêu cầu này">
                                                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>cancel</span>
                                                        <span>Từ chối</span>
                                                    </button>
                                                    <button className="action-icon-btn" onClick={() => { setSelectedVoucher(item); setActiveModal('detail'); }} title="Xem hồ sơ chi tiết">
                                                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>visibility</span>
                                                    </button>
                                                </div>
                                            )}
                                            {item.status === 'approved' && (
                                                <div className="action-btn-group">
                                                    <span className="approved-tag"><span className="material-symbols-outlined" style={{ fontSize: '15px' }}>verified</span> Đã duyệt</span>
                                                    <button className="action-icon-btn" onClick={() => { setSelectedVoucher(item); setActiveModal('detail'); }} title="Xem chi tiết">
                                                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>visibility</span>
                                                    </button>
                                                </div>
                                            )}
                                            {item.status === 'rejected' && (
                                                <div className="action-btn-group">
                                                    <button className="btn-rejected-view-sm" onClick={() => { setSelectedVoucher(item); setActiveModal('detail'); }} title="Xem lý do từ chối">
                                                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>info</span>
                                                        <span>Xem lý do</span>
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL 1: CHI TIẾT YÊU CẦU */}
            <div className={`modal-overlay ${activeModal === 'detail' ? 'open' : ''}`}>
                <div className="modal-container">
                    {selectedVoucher && (
                        <>
                            <div className="modal-header" style={{ background: 'linear-gradient(135deg, #052E16 0%, #15803D 100%)', color: '#FFFFFF' }}>
                                <h3 className="modal-title" style={{ color: '#FFFFFF' }}>
                                    <span className="material-symbols-outlined" style={{ color: '#FEF08A' }}>fact_check</span>
                                    <span>Thẩm Định Yêu Cầu Tạo Mã Giảm Giá</span>
                                </h3>
                                <button className="modal-close-btn" style={{ color: '#FFFFFF' }} onClick={() => setActiveModal(null)}>
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            <div className="modal-body">
                                <div className="host-request-banner" style={{ marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div className="host-avatar-badge">{selectedVoucher.hostAvatar}</div>
                                        <div>
                                            <h4 style={{ margin: 0, fontWeight: 800, color: '#0F172A', fontSize: '15px' }}>{selectedVoucher.hostName} (SĐT: {selectedVoucher.hostPhone})</h4>
                                            <p style={{ margin: 0, color: '#64748B', fontSize: '12.5px' }}>Cơ sở: <strong style={{ color: '#15803D' }}>{selectedVoucher.homestayName}</strong> ({selectedVoucher.region})</p>
                                            <span style={{ fontSize: '11px', color: '#94A3B8' }}>Gửi yêu cầu lúc: {selectedVoucher.createdDate}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="voucher-ticket-preview">
                                    <div className="ticket-header">
                                        <div className="ticket-brand">
                                            <div className="ticket-brand-logo">{selectedVoucher.hostAvatar}</div>
                                            <div className="ticket-brand-name">{selectedVoucher.homestayName.toUpperCase()}</div>
                                        </div>
                                        <div className="ticket-code-pill">
                                            <span>{selectedVoucher.code}</span>
                                        </div>
                                    </div>

                                    <div className="ticket-discount-amount">
                                        {selectedVoucher.discountType === 'percent'
                                            ? `GIẢM ${selectedVoucher.discountVal}% (Tối đa ${selectedVoucher.maxDiscount})`
                                            : `GIẢM ${selectedVoucher.maxDiscount}`}
                                    </div>
                                    <div className="ticket-program-name">{selectedVoucher.name}</div>

                                    <div className="ticket-meta-grid">
                                        <div><span className="material-symbols-outlined" style={{ fontSize: '14px', verticalAlign: 'middle' }}>event</span> <span>Hạn dùng: {selectedVoucher.startDate} - {selectedVoucher.endDate}</span></div>
                                        <div><span className="material-symbols-outlined" style={{ fontSize: '14px', verticalAlign: 'middle' }}>shopping_bag</span> <span>Đơn tối thiểu: {selectedVoucher.minOrder}</span></div>
                                        <div><span className="material-symbols-outlined" style={{ fontSize: '14px', verticalAlign: 'middle' }}>confirmation_number</span> <span>Số lượng: {selectedVoucher.totalLimit} lượt</span></div>
                                        <div><span className="material-symbols-outlined" style={{ fontSize: '14px', verticalAlign: 'middle' }}>person_check</span> <span>Tối đa: 1 lượt / khách</span></div>
                                    </div>
                                </div>

                                <div className="host-note-box" style={{ marginBottom: '16px' }}>
                                    <h5 style={{ fontWeight: 800, color: '#0F172A', fontSize: '14px', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span className="material-symbols-outlined" style={{ color: '#2563EB', fontSize: '18px' }}>description</span>Lý do tạo mã từ Chủ Homestay:
                                    </h5>
                                    <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>"{selectedVoucher.hostReason || 'Không có ghi chú thêm.'}"</p>
                                </div>

                                {selectedVoucher.adminNote && (
                                    <div className="admin-feedback-box">
                                        <h5 style={{ fontWeight: 800, color: '#0F172A', fontSize: '14px', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <span className="material-symbols-outlined" style={{ color: '#DC2626', fontSize: '18px' }}>report</span>Phản hồi từ Admin:
                                        </h5>
                                        <p style={{ color: '#DC2626', fontSize: '13px', margin: 0 }}>{selectedVoucher.adminNote}</p>
                                    </div>
                                )}
                            </div>

                            <div className="modal-footer">
                                <button className="btn-admin-cancel" onClick={() => setActiveModal(null)}>Đóng</button>
                                {selectedVoucher.status === 'pending' && (
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button className="btn-admin-primary" style={{ backgroundColor: '#DC2626' }} onClick={() => setActiveModal('reject')}>
                                            <span className="material-symbols-outlined">cancel</span> Từ Chối Yêu Cầu
                                        </button>
                                        <button className="btn-admin-primary" style={{ backgroundColor: '#15803D' }} onClick={() => handleApprove(selectedVoucher.id)}>
                                            <span className="material-symbols-outlined">check_circle</span> Phê Duyệt Phát Hành
                                        </button>
                                    </div>
                                )}
                                {selectedVoucher.status === 'approved' && (
                                    <span style={{ background: '#DCFCE7', color: '#15803D', fontSize: '13px', padding: '8px 16px', borderRadius: '999px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span className="material-symbols-outlined">verified</span> Mã đã được phê duyệt
                                    </span>
                                )}
                                {selectedVoucher.status === 'rejected' && (
                                    <span style={{ background: '#FEE2E2', color: '#DC2626', fontSize: '13px', padding: '8px 16px', borderRadius: '999px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span className="material-symbols-outlined">cancel</span> Yêu cầu đã bị từ chối
                                    </span>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* MODAL 2: TỪ CHỐI */}
            <div className={`modal-overlay ${activeModal === 'reject' ? 'open' : ''}`}>
                <div className="modal-container" style={{ maxWidth: '520px' }}>
                    {selectedVoucher && (
                        <>
                            <div className="modal-header" style={{ background: '#DC2626', color: '#FFFFFF' }}>
                                <h3 className="modal-title" style={{ color: '#FFFFFF' }}>
                                    <span className="material-symbols-outlined">cancel</span>
                                    <span>Từ Chối Yêu Cầu Tạo Mã</span>
                                </h3>
                                <button className="modal-close-btn" style={{ color: '#FFFFFF' }} onClick={() => setActiveModal('detail')}>
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            <div className="modal-body">
                                <p style={{ fontSize: '13.5px', color: '#475569', marginBottom: '16px' }}>Bạn đang từ chối yêu cầu phát hành mã <strong style={{ color: '#DC2626' }}>{selectedVoucher.code}</strong> của Homestay <strong>{selectedVoucher.homestayName}</strong>.</p>

                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', fontWeight: 700, color: '#0F172A', marginBottom: '8px', fontSize: '13.5px' }}>Lý Do Từ Chối <span style={{ color: '#DC2626' }}>*</span></label>
                                    <select 
                                        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13.5px', outline: 'none', marginBottom: '12px' }}
                                        value={rejectReason}
                                        onChange={e => setRejectReason(e.target.value)}
                                    >
                                        <option value="Mức giảm giá quá cao, không phù hợp quy định sàn">Mức giảm giá quá cao, không phù hợp quy định sàn</option>
                                        <option value="Thông tin chương trình chưa rõ ràng hoặc gây hiểu nhầm">Thông tin chương trình chưa rõ ràng hoặc gây hiểu nhầm</option>
                                        <option value="Thời gian áp dụng trùng lặp chương trình khuyến mãi lớn của hệ thống">Thời gian áp dụng trùng lặp chương trình lớn của hệ thống</option>
                                        <option value="Cơ sở Homestay đang trong quá trình xử lý khiếu nại">Cơ sở Homestay đang trong quá trình xử lý khiếu nại</option>
                                        <option value="custom">Lý do khác (Nhập chi tiết bên dưới)...</option>
                                    </select>

                                    {rejectReason === 'custom' && (
                                        <textarea 
                                            rows="3" 
                                            placeholder="Nhập chi tiết phản hồi lý do từ chối gửi tới chủ homestay..."
                                            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '13.5px', outline: 'none', resize: 'none' }}
                                            value={customRejectReason}
                                            onChange={e => setCustomRejectReason(e.target.value)}
                                        />
                                    )}
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button className="btn-admin-cancel" onClick={() => setActiveModal('detail')}>Hủy bỏ</button>
                                <button className="btn-admin-primary" style={{ backgroundColor: '#DC2626' }} onClick={handleReject}>Xác Nhận Từ Chối</button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
