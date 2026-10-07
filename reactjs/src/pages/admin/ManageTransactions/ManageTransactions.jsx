import React, { useState, useEffect, useCallback } from 'react';
import './ManageTransactions.css';
import { adminTransactionService } from '../../../services/adminTransactionService';

export default function ManageTransactions() {
    const [transactions, setTransactions] = useState([]);
    const [stats, setStats] = useState({
        yenFeeMonth: '34.800.000đ',
        escrowDepositTotal: '68.500.000đ',
        refundRequestsCount: 2,
        payoutPendingCount: 5,
        totalCount: 24,
        escrowCount: 14,
        refundCount: 2,
        payoutCount: 5,
        completedCount: 3
    });
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [gateway, setGateway] = useState('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);
    const [loading, setLoading] = useState(false);

    const [activeModal, setActiveModal] = useState(null);
    const [currentTx, setCurrentTx] = useState(null);
    const [traceRefInput, setTraceRefInput] = useState('');
    const [actionMessage, setActionMessage] = useState(null);

    const fetchTransactions = useCallback(async () => {
        setLoading(true);
        const res = await adminTransactionService.getTransactions(filterStatus, searchTerm, gateway, page, 10);
        if (res) {
            setTransactions(res.content || []);
            setTotalPages(res.totalPages || 1);
            setTotalElements(res.totalElements || 0);
            if (res.stats) {
                setStats(res.stats);
            }
        }
        setLoading(false);
    }, [filterStatus, searchTerm, gateway, page]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const handleFilterChange = (status) => {
        setFilterStatus(status);
        setPage(1);
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setPage(1);
    };

    const handleGatewayChange = (e) => {
        setGateway(e.target.value);
        setPage(1);
    };

    const openModal = (modalName, tx) => {
        setCurrentTx(tx);
        setTraceRefInput(tx ? (tx.traceId || '') : '');
        setActiveModal(modalName);
    };

    const closeModal = () => {
        setActiveModal(null);
        setCurrentTx(null);
        setTraceRefInput('');
    };

    const confirmRefund = async () => {
        if (!currentTx) return;
        setLoading(true);
        const res = await adminTransactionService.updateTransactionStatus(currentTx.id, {
            status: 'refunded',
            traceId: traceRefInput || currentTx.traceId
        });
        if (res.success) {
            setActionMessage('Đã duyệt hoàn tiền thành công!');
            setTimeout(() => setActionMessage(null), 3000);
            await fetchTransactions();
        } else {
            alert(res.message || 'Có lỗi xảy ra khi duyệt hoàn tiền');
        }
        closeModal();
        setLoading(false);
    };

    const confirmPayout = async () => {
        if (!currentTx) return;
        setLoading(true);
        const res = await adminTransactionService.updateTransactionStatus(currentTx.id, {
            status: 'completed',
            traceId: traceRefInput || currentTx.traceId
        });
        if (res.success) {
            setActionMessage('Đã giải ngân cho chủ nhà thành công!');
            setTimeout(() => setActionMessage(null), 3000);
            await fetchTransactions();
        } else {
            alert(res.message || 'Có lỗi xảy ra khi giải ngân');
        }
        closeModal();
        setLoading(false);
    };

    return (
        <div className="manage-transactions-wrapper">
            <div className="tx-page-header">
                <div>
                    <h1 className="tx-page-title">Quản lý Giao dịch & Tài chính Sàn YÊN</h1>
                    <div className="tx-page-sub">Theo dõi tiền cọc đặt phòng, duyệt hoàn tiền khách hàng và giải ngân cho Homestay Owner</div>
                </div>
            </div>

            {actionMessage && (
                <div style={{
                    padding: '12px 16px',
                    backgroundColor: '#DEF7EC',
                    color: '#03543F',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <span className="material-symbols-outlined">check_circle</span>
                    {actionMessage}
                </div>
            )}

            <div className="financial-stats-grid">
                <div className="f-stat-card emerald">
                    <div>
                        <div className="f-stat-val">{stats.yenFeeMonth}</div>
                        <div className="f-stat-lbl">Phí sàn YÊN (8%)</div>
                    </div>
                    <span className="material-symbols-outlined f-stat-icon">account_balance_wallet</span>
                </div>
                <div className="f-stat-card indigo">
                    <div>
                        <div className="f-stat-val">{stats.escrowDepositTotal}</div>
                        <div className="f-stat-lbl">Tiền cọc đang giữ</div>
                    </div>
                    <span className="material-symbols-outlined f-stat-icon">lock_clock</span>
                </div>
                <div className="f-stat-card amber">
                    <div>
                        <div className="f-stat-val">{stats.refundRequestsCount} Đơn</div>
                        <div className="f-stat-lbl">Yêu cầu hoàn tiền</div>
                    </div>
                    <span className="material-symbols-outlined f-stat-icon">assignment_return</span>
                </div>
                <div className="f-stat-card blue">
                    <div>
                        <div className="f-stat-val">{stats.payoutPendingCount} Đơn</div>
                        <div className="f-stat-lbl">Chờ giải ngân Owner</div>
                    </div>
                    <span className="material-symbols-outlined f-stat-icon">payments</span>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="tx-filter-bar">
                <div className="tx-filter-chips">
                    <button className={`tx-chip ${filterStatus === 'all' ? 'active' : ''}`} onClick={() => handleFilterChange('all')}>
                        Tất cả <span className="tx-chip-badge">{stats.totalCount}</span>
                    </button>
                    <button className={`tx-chip ${filterStatus === 'escrow' ? 'active' : ''}`} onClick={() => handleFilterChange('escrow')}>
                        Quản lý tiền cọc <span className="tx-chip-badge">{stats.escrowCount}</span>
                    </button>
                    <button className={`tx-chip ${filterStatus === 'refund' ? 'active' : ''}`} onClick={() => handleFilterChange('refund')}>
                        Xác nhận hoàn tiền <span className="tx-chip-badge">{stats.refundCount}</span>
                    </button>
                    <button className={`tx-chip ${filterStatus === 'payout' ? 'active' : ''}`} onClick={() => handleFilterChange('payout')}>
                        Thanh toán Owner <span className="tx-chip-badge">{stats.payoutCount}</span>
                    </button>
                </div>

                <div className="tx-filter-right">
                    <div className="tx-search-wrap">
                        <span className="material-symbols-outlined">search</span>
                        <input type="text" placeholder="Tìm mã GD, tên khách, homestay..." value={searchTerm} onChange={handleSearchChange} />
                    </div>
                    <select className="tx-select" value={gateway} onChange={handleGatewayChange}>
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
                        {loading ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', color: '#64748B', padding: '24px' }}>Đang tải dữ liệu giao dịch...</td></tr>
                        ) : transactions.length === 0 ? (
                            <tr><td colSpan="6" style={{ textAlign: 'center', color: '#94A3B8', padding: '24px' }}>Không tìm thấy giao dịch phù hợp.</td></tr>
                        ) : (
                            transactions.map(item => (
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
                                            {(item.status === 'refund-pending' || item.status === 'refund') && (
                                                <button className="tx-btn tx-btn-refund" onClick={() => openModal('refund', item)}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>replay</span> Hoàn tiền
                                                </button>
                                            )}
                                            {(item.status === 'payout-ready' || item.status === 'payout') && (
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

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', padding: '0 4px' }}>
                    <div style={{ fontSize: '13px', color: '#64748B' }}>
                        Hiển thị {transactions.length} trên tổng số {totalElements} giao dịch
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            disabled={page <= 1}
                            onClick={() => setPage(prev => Math.max(1, prev - 1))}
                            className="tx-btn tx-btn-secondary"
                            style={{ opacity: page <= 1 ? 0.5 : 1, cursor: page <= 1 ? 'not-allowed' : 'pointer' }}
                        >
                            Trang trước
                        </button>
                        <span style={{ display: 'flex', alignItems: 'center', padding: '0 8px', fontSize: '13px', fontWeight: '600' }}>
                            Trang {page} / {totalPages}
                        </span>
                        <button
                            disabled={page >= totalPages}
                            onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                            className="tx-btn tx-btn-secondary"
                            style={{ opacity: page >= totalPages ? 0.5 : 1, cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}
                        >
                            Trang sau
                        </button>
                    </div>
                </div>
            )}

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
                                    <div className="bill-row"><span>Phí dịch vụ sàn YÊN (8%):</span> <span>{currentTx.platformFee || '136.000đ'}</span></div>
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
                                <div className="bill-row"><span>Lý do hủy:</span> <span>{currentTx.refundReason || 'Hủy phòng theo quy định'}</span></div>
                                <div className="bill-row total" style={{ color: '#C2410C' }}><span>Số tiền duyệt hoàn:</span> <span>{currentTx.total}</span></div>
                            </div>

                            <div className="bank-info-box">
                                <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', marginBottom: '4px' }}>NHẬN TIỀN HOÀN (Ví MoMo / NH):</div>
                                <div className="bank-name">{currentTx.guestBankInfo || 'Ví Điện Tử MoMo / MB Bank'}</div>
                                <div className="bank-acc">{currentTx.guestPhone}</div>
                                <div className="bank-holder">{currentTx.guest.toUpperCase()}</div>
                            </div>

                            <div style={{ marginTop: '14px' }}>
                                <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>Mã giao dịch hoàn tiền (Trace Reference):</label>
                                <input
                                    type="text"
                                    placeholder="MOMO-REF-88392"
                                    value={traceRefInput}
                                    onChange={e => setTraceRefInput(e.target.value)}
                                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }}
                                />
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
                                <div className="bill-row"><span>Phí sàn YÊN (8%):</span> <span style={{ color: '#DC2626' }}>-{currentTx.platformFee || '136.000đ'}</span></div>
                                <div className="bill-row total" style={{ color: '#15803D', fontSize: '15px' }}><span>Thực chuyển cho Chủ nhà:</span> <span>{currentTx.netPayout}</span></div>
                            </div>

                            <div className="bank-info-box">
                                <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B', marginBottom: '4px' }}>TÀI KHOẢN NGÂN HÀNG CHỦ NHÀ:</div>
                                <div className="bank-name">{currentTx.ownerBankInfo || 'Ngân Hàng MB Bank'}</div>
                                <div className="bank-acc">9704 2200 8891 002</div>
                                <div className="bank-holder">{currentTx.owner.toUpperCase()}</div>
                            </div>

                            <div style={{ marginTop: '14px' }}>
                                <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>Mã giao dịch giải ngân (Trace Reference):</label>
                                <input
                                    type="text"
                                    placeholder="MB-PAYOUT-99102"
                                    value={traceRefInput}
                                    onChange={e => setTraceRefInput(e.target.value)}
                                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px' }}
                                />
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

