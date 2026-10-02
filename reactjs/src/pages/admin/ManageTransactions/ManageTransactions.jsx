import React, { useState } from 'react';
import './ManageTransactions.css';

const initialTransactions = [
    { id: 1, txCode: "#GD-88201", bookingCode: "#BK-9042", guest: "Trần Minh Khoa", guestPhone: "0903 123 456", homestay: "Pù Luông Eco Lodge", owner: "Triệu Văn Sản", total: "1.700.000đ", deposit: "850.000đ (50%)", netPayout: "1.564.000đ", gateway: "VNPay QR", gatewayClass: "vnpay", status: "escrow", statusText: "Giữ cọc YÊN", traceId: "VNP-992019482" },
    { id: 2, txCode: "#GD-88198", bookingCode: "#BK-8102", guest: "Lê Thị Mai", guestPhone: "0918 776 554", homestay: "Mộc Châu Bamboo Bungalow", owner: "Đinh Thị Hương", total: "1.500.000đ", deposit: "1.500.000đ (100%)", netPayout: "1.380.000đ", gateway: "Ví MoMo", gatewayClass: "momo", status: "refund-pending", statusText: "Chờ hoàn tiền", traceId: "MOMO-77281049" },
    { id: 3, txCode: "#GD-88170", bookingCode: "#BK-7410", guest: "Phạm Quốc Huy", guestPhone: "0977 889 001", homestay: "Sa Pa Terraces Valley", owner: "Vàng A Sáng", total: "2.800.000đ", deposit: "1.400.000đ (50%)", netPayout: "2.576.000đ", gateway: "VietQR", gatewayClass: "vietqr", status: "payout-ready", statusText: "Chờ giải ngân", traceId: "MB-88392019" },
    { id: 4, txCode: "#GD-88155", bookingCode: "#BK-6021", guest: "Nguyễn Vũ Long", guestPhone: "0908 991 223", homestay: "Nhà Sàn Mộc Mai Châu", owner: "Nguyễn Văn An", total: "1.300.000đ", deposit: "650.000đ (50%)", netPayout: "1.196.000đ", gateway: "VNPay QR", gatewayClass: "vnpay", status: "completed", statusText: "Hoàn tất", traceId: "VNP-88102394" },
    { id: 5, txCode: "#GD-88140", bookingCode: "#BK-5912", guest: "Hoàng Anh Tuấn", guestPhone: "0934 556 778", homestay: "Đà Lạt Cloud Valley", owner: "Phạm Hoàng Nam", total: "2.400.000đ", deposit: "1.200.000đ (50%)", netPayout: "2.208.000đ", gateway: "VietQR", gatewayClass: "vietqr", status: "refund-pending", statusText: "Chờ hoàn tiền", traceId: "VCB-9910248" }
];

export default function ManageTransactions() {
    const [transactions, setTransactions] = useState(initialTransactions);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [gateway, setGateway] = useState('all');

    const [activeModal, setActiveModal] = useState(null);
    const [currentTx, setCurrentTx] = useState(null);

    const filteredData = transactions.filter(item => {
        let matchTab = true;
        if (filterStatus === 'escrow') matchTab = (item.status === 'escrow');
        else if (filterStatus === 'refund') matchTab = (item.status === 'refund-pending');
        else if (filterStatus === 'payout') matchTab = (item.status === 'payout-ready');
        
        const matchSearch = item.txCode.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.bookingCode.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.guest.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.homestay.toLowerCase().includes(searchTerm.toLowerCase());
        const matchGateway = gateway === 'all' || item.gatewayClass === gateway;
        return matchTab && matchSearch && matchGateway;
    });

    const openModal = (modalName, tx) => {
        setCurrentTx(tx);
        setActiveModal(modalName);
    };

    const closeModal = () => {
        setActiveModal(null);
        setCurrentTx(null);
    };

    const confirmRefund = () => {
        if (!currentTx) return;
        setTransactions(prev => prev.map(t => 
            t.id === currentTx.id ? { ...t, status: 'refunded', statusText: 'Đã hoàn tiền' } : t
        ));
        closeModal();
    };

    const confirmPayout = () => {
        if (!currentTx) return;
        setTransactions(prev => prev.map(t => 
            t.id === currentTx.id ? { ...t, status: 'completed', statusText: 'Hoàn tất' } : t
        ));
        closeModal();
    };

    return (
        <div className="manage-transactions-wrapper">
            <div className="tx-page-header">
                <div>
                    <h1 className="tx-page-title">Quản lý Giao dịch & Tài chính Sàn YÊN</h1>
                    <div className="tx-page-sub">Theo dõi tiền cọc đặt phòng, duyệt hoàn tiền khách hàng và giải ngân cho Homestay Owner</div>
                </div>
            </div>

            <div className="financial-stats-grid">
                <div className="f-stat-card emerald">
                    <div>
                        <div className="f-stat-val">34.800.000đ</div>
                        <div className="f-stat-lbl">Phí sàn YÊN (Tháng 9)</div>
                    </div>
                    <span className="material-symbols-outlined f-stat-icon">account_balance_wallet</span>
                </div>
                <div className="f-stat-card indigo">
                    <div>
                        <div className="f-stat-val">68.500.000đ</div>
                        <div className="f-stat-lbl">Tiền cọc đang giữ</div>
                    </div>
                    <span className="material-symbols-outlined f-stat-icon">lock_clock</span>
                </div>
                <div className="f-stat-card amber">
                    <div>
                        <div className="f-stat-val">2 Đơn</div>
                        <div className="f-stat-lbl">Yêu cầu hoàn tiền</div>
                    </div>
                    <span className="material-symbols-outlined f-stat-icon">assignment_return</span>
                </div>
                <div className="f-stat-card blue">
                    <div>
                        <div className="f-stat-val">5 Đơn</div>
                        <div className="f-stat-lbl">Chờ giải ngân Owner</div>
                    </div>
                    <span className="material-symbols-outlined f-stat-icon">payments</span>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="tx-filter-bar">
                <div className="tx-filter-chips">
                    <button className={`tx-chip ${filterStatus === 'all' ? 'active' : ''}`} onClick={() => setFilterStatus('all')}>
                        Tất cả <span className="tx-chip-badge">24</span>
                    </button>
                    <button className={`tx-chip ${filterStatus === 'escrow' ? 'active' : ''}`} onClick={() => setFilterStatus('escrow')}>
                        Quản lý tiền cọc <span className="tx-chip-badge">14</span>
                    </button>
                    <button className={`tx-chip ${filterStatus === 'refund' ? 'active' : ''}`} onClick={() => setFilterStatus('refund')}>
                        Xác nhận hoàn tiền <span className="tx-chip-badge">2</span>
                    </button>
                    <button className={`tx-chip ${filterStatus === 'payout' ? 'active' : ''}`} onClick={() => setFilterStatus('payout')}>
                        Thanh toán Owner <span className="tx-chip-badge">5</span>
                    </button>
                </div>

                <div className="tx-filter-right">
                    <div className="tx-search-wrap">
                        <span className="material-symbols-outlined">search</span>
                        <input type="text" placeholder="Tìm mã GD, tên khách, homestay..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <select className="tx-select" value={gateway} onChange={(e) => setGateway(e.target.value)}>
                        <option value="all">Tất cả phương thức</option>
                        <option value="vnpay">VNPay QR</option>
                        <option value="momo">Ví MoMo</option>
                        <option value="vietqr">VietQR</option>
                    </select>
                </div>
            </div>

            {/* Transaction Data Table */}
            <div className="tx-table-wrap">
                <table className="tx-table">
                    <thead>
                        <tr>
                            <th>Mã Giao Dịch</th>
                            <th>Khách Hàng</th>
                            <th>Homestay & Owner</th>
                            <th>Số Tiền / Cọc</th>
                            <th>Trạng Thái</th>
                            <th>Thao Tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.length === 0 ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', color: '#94A3B8', padding: '24px' }}>Không tìm thấy giao dịch phù hợp.</td></tr>
                        ) : (
                            filteredData.map(item => (
                                <tr key={item.id}>
                                    <td>
                                        <div className="tx-title-main">{item.txCode}</div>
                                        <div className="tx-sub-info">Mã BK: {item.bookingCode}</div>
                                    </td>
                                    <td>
                                        <div className="tx-title-main">{item.guest}</div>
                                        <div className="tx-sub-info">{item.guestPhone}</div>
                                    </td>
                                    <td>
                                        <div className="tx-title-main">{item.homestay}</div>
                                        <div className="tx-sub-info">Owner: {item.owner}</div>
                                    </td>
                                    <td>
                                        <strong style={{ color: '#0F172A', fontSize: '13.5px' }}>{item.total}</strong>
                                        <div className="tx-sub-info" style={{ color: '#4F46E5' }}>Cọc: {item.deposit}</div>
                                    </td>
                                    <td>
                                        <span className={`tx-status-badge ${item.status}`}>
                                            {item.statusText}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-btn-group">
                                            <button className="tx-btn tx-btn-secondary" onClick={() => openModal('detail', item)}>
                                                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>visibility</span> Xem
                                            </button>
                                            {item.status === 'refund-pending' && (
                                                <button className="tx-btn tx-btn-refund" onClick={() => openModal('refund', item)}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>replay</span> Hoàn tiền
                                                </button>
                                            )}
                                            {item.status === 'payout-ready' && (
                                                <button className="tx-btn tx-btn-payout" onClick={() => openModal('payout', item)}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>payments</span> Giải ngân
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modals */}
            {activeModal === 'detail' && currentTx && (
                <div className="modal-backdrop open" onClick={closeModal}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <div className="modal-head">
                            <h4>Chi tiết Giao dịch {currentTx.txCode}</h4>
                            <button className="modal-close" onClick={closeModal}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="modal-grid-2">
                                <div className="bill-card">
                                    <h5><span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#15803D' }}>receipt</span> Bảng kê Tài chính</h5>
                                    <div className="bill-row"><span>Mã Booking:</span> <strong>{currentTx.bookingCode}</strong></div>
                                    <div className="bill-row"><span>Giá phòng:</span> <span>{currentTx.total}</span></div>
                                    <div className="bill-row"><span>Phí dịch vụ sàn YÊN (8%):</span> <span>136.000đ</span></div>
                                    <div className="bill-row total"><span>Tổng thanh toán:</span> <span style={{ color: '#15803D' }}>{currentTx.total}</span></div>
                                    <div className="bill-row" style={{ marginTop: '8px', background: '#EEF2FF', padding: '6px 8px', borderRadius: '6px' }}>
                                        <span>Tiền cọc YÊN giữ:</span> <strong style={{ color: '#4338CA' }}>{currentTx.deposit}</strong>
                                    </div>
                                </div>
                                <div className="bill-card">
                                    <h5><span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#0284C7' }}>account_balance</span> Thông tin Thanh toán</h5>
                                    <div className="bill-row"><span>Cổng thanh toán:</span> <strong>{currentTx.gateway}</strong></div>
                                    <div className="bill-row"><span>Mã Trace ID:</span> <strong>{currentTx.traceId}</strong></div>
                                    <div className="bill-row"><span>Người đặt:</span> <span>{currentTx.guest}</span></div>
                                    <div className="bill-row"><span>Chủ nhà:</span> <span>{currentTx.owner}</span></div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-foot">
                            <button className="tx-btn tx-btn-secondary" onClick={closeModal}>Đóng</button>
                        </div>
                    </div>
                </div>
            )}

            {activeModal === 'refund' && currentTx && (
                <div className="modal-backdrop open" onClick={closeModal}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <div className="modal-head">
                            <h4 style={{ color: '#C2410C' }}>Duyệt Hoàn Tiền Cho Khách Hàng</h4>
                            <button className="modal-close" onClick={closeModal}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="bill-card" style={{ borderColor: '#FED7AA', background: '#FFF7ED', marginBottom: '14px' }}>
                                <h5 style={{ color: '#C2410C' }}><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>warning</span> Yêu cầu hủy phòng</h5>
                                <div className="bill-row"><span>Khách hàng:</span> <strong>{currentTx.guest} ({currentTx.guestPhone})</strong></div>
                                <div className="bill-row"><span>Lý do hủy:</span> <span>Bão thời tiết tại Mộc Châu, hủy trước 48h</span></div>
                                <div className="bill-row total" style={{ color: '#C2410C' }}><span>Số tiền duyệt hoàn:</span> <span>{currentTx.total}</span></div>
                            </div>

                            <div className="bank-info-box">
                                <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', marginBottom: '4px' }}>NHẬN TIỀN HOÀN (Ví MoMo / NH):</div>
                                <div className="bank-name">Ví Điện Tử MoMo / Ngân Hàng MB Bank</div>
                                <div className="bank-acc">0918776554</div>
                                <div className="bank-holder">{currentTx.guest.toUpperCase()}</div>
                            </div>

                            <div style={{ marginTop: '14px' }}>
                                <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>Mã giao dịch hoàn tiền (Trace Reference):</label>
                                <input type="text" placeholder="MOMO-REF-88392" style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }} />
                            </div>
                        </div>
                        <div className="modal-foot">
                            <button className="tx-btn tx-btn-secondary" onClick={closeModal}>Hủy bỏ</button>
                            <button className="tx-btn tx-btn-refund" onClick={confirmRefund}>
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span> Xác nhận Hoàn tiền
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeModal === 'payout' && currentTx && (
                <div className="modal-backdrop open" onClick={closeModal}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <div className="modal-head">
                            <h4 style={{ color: '#15803D' }}>Giải Ngân Cho Homestay Owner</h4>
                            <button className="modal-close" onClick={closeModal}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="bill-card" style={{ borderColor: '#A7F3D0', background: '#F0FDF4', marginBottom: '14px' }}>
                                <h5 style={{ color: '#15803D' }}><span className="material-symbols-outlined" style={{ fontSize: '18px' }}>verified</span> Khách đã hoàn tất trả phòng</h5>
                                <div className="bill-row"><span>Homestay:</span> <strong>{currentTx.homestay}</strong></div>
                                <div className="bill-row"><span>Chủ nhà thụ hưởng:</span> <strong>{currentTx.owner}</strong></div>
                                <div className="bill-row"><span>Phí sàn YÊN (8%):</span> <span style={{ color: '#DC2626' }}>-136.000đ</span></div>
                                <div className="bill-row total" style={{ color: '#15803D', fontSize: '15px' }}><span>Thực chuyển cho Chủ nhà:</span> <span>{currentTx.netPayout}</span></div>
                            </div>

                            <div className="bank-info-box">
                                <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', marginBottom: '4px' }}>TÀI KHOẢN NGÂN HÀNG CHỦ NHÀ:</div>
                                <div className="bank-name">Ngân Hàng MB Bank</div>
                                <div className="bank-acc">9704 2200 8891 002</div>
                                <div className="bank-holder">{currentTx.owner.toUpperCase()}</div>
                            </div>
                        </div>
                        <div className="modal-foot">
                            <button className="tx-btn tx-btn-secondary" onClick={closeModal}>Đóng</button>
                            <button className="tx-btn tx-btn-payout" onClick={confirmPayout}>
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>account_balance_wallet</span> Duyệt Chuyển Khoản
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
