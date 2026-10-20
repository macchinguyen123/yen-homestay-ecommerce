import React, { useState, useEffect, useCallback, useRef } from 'react';
import './VoucherManagement.css';
import { adminVoucherService } from '../../../services/adminVoucherService';

// ─── Hằng số ───────────────────────────────────────────────────────────────
const EMPTY_FORM = {
    code: '',
    homestayId: '',
    discountType: 'percent',
    value: '',
    minOrderValue: '',
    maxDiscount: '',
    usageLimit: 100,
    startDate: '',
    expiryDate: '',
    status: 'ACTIVE'
};

const STATUS_CONFIG = {
    active:   { label: 'Đang hoạt động', color: '#15803D', bg: '#DCFCE7', border: '#BBF7D0', icon: 'check_circle' },
    upcoming: { label: 'Sắp diễn ra',    color: '#2563EB', bg: '#DBEAFE', border: '#BFDBFE', icon: 'schedule' },
    expired:  { label: 'Đã hết hạn',     color: '#64748B', bg: '#F1F5F9', border: '#CBD5E1', icon: 'history' },
    disabled: { label: 'Đã tắt',         color: '#DC2626', bg: '#FEE2E2', border: '#FECDD3', icon: 'cancel' },
    pending:  { label: 'Chờ duyệt',      color: '#B45309', bg: '#FEF3C7', border: '#FDE68A', icon: 'pending' },
};

function formatVND(val) {
    if (val === null || val === undefined || val === '') return '—';
    const num = Number(val);
    if (isNaN(num)) return '—';
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(num % 1_000_000 === 0 ? 0 : 1) + ' Tr';
    if (num >= 1_000) return Math.round(num / 1000) + 'K';
    return num + 'đ';
}

function formatFullVND(val) {
    if (val === null || val === undefined) return '—';
    const num = Number(val);
    if (isNaN(num)) return '—';
    return new Intl.NumberFormat('vi-VN').format(num) + 'đ';
}

function localDateStr() {
    return new Date().toISOString().slice(0, 10);
}

function nextMonthStr() {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
}

// ───────────────────────────────────────────────────────────────────────────
export default function VoucherManagement() {
    // ── State chính ──────────────────────────────────────────────────────
    const [vouchers, setVouchers]       = useState([]);
    const [stats, setStats]             = useState(null);
    const [loading, setLoading]         = useState(true);
    const [saving, setSaving]           = useState(false);
    const [toast, setToast]             = useState(null);

    // ── Homestay list (cho dropdown picker) ──────────────────────────────
    const [homestayList, setHomestayList] = useState([]);

    // ── Bộ lọc ──────────────────────────────────────────────────────────
    const [activeTab, setActiveTab]     = useState('all');
    const [filterType, setFilterType]   = useState('all');
    const [searchQuery, setSearch]      = useState('');

    // ── Phân trang ───────────────────────────────────────────────────────
    const [page, setPage]               = useState(1);
    const [pageSize, setPageSize]       = useState(8);
    const [togglingId, setTogglingId]   = useState(null);

    // ── Modal ────────────────────────────────────────────────────────────
    const [modal, setModal]             = useState(null); // 'detail' | 'approve' | 'reject'
    const [selectedVoucher, setSelected] = useState(null);

    // ── Pending vouchers (chờ duyệt từ owner) ────────────────────────────
    const [pendingVouchers, setPendingVouchers] = useState([]);
    const [pendingLoading, setPendingLoading]   = useState(false);
    const [approvingId, setApprovingId]         = useState(null);
    const [rejectingId, setRejectingId]         = useState(null);

    // ── Toast ────────────────────────────────────────────────────────────
    function showToast(type, msg) {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3500);
    }

    // ── Tính lại stats từ danh sách hiện tại ─────────────────────────────
    function recalcStats(list) {
        const active   = list.filter(v => v.status === 'active').length;
        const expired  = list.filter(v => v.status === 'expired').length;
        const disabled = list.filter(v => v.status === 'disabled').length;
        const totalUsed = list.reduce((s, v) => s + (v.usedCount || 0), 0);
        let totalDiscountCost = 0;
        list.forEach(v => {
            const used = v.usedCount || 0;
            if (used === 0) return;
            if (v.discountType === 'percent') {
                const single = Math.min(1500000 * (Number(v.value) || 0) / 100, Number(v.maxDiscount) || Infinity);
                totalDiscountCost += single * used;
            } else {
                totalDiscountCost += (Number(v.value) || 0) * used;
            }
        });
        setStats({ total: list.length, active, expired, disabled, totalUsed, totalDiscountCost: Math.round(totalDiscountCost) });
    }

    // ── Fetch homestay list (chỉ cần 1 lần) ─────────────────────────────
    useEffect(() => {
        fetch('http://localhost:8081/api/public/homestays')
            .then(r => r.ok ? r.json() : [])
            .then(data => {
                if (Array.isArray(data)) {
                    setHomestayList(data.map(h => ({ id: h.id, name: h.name || `Homestay #${h.id}` })));
                }
            })
            .catch(() => {});
    }, []);

    const prevPendingCountRef = useRef(null);

    // ── Fetch ────────────────────────────────────────────────────────────
    const fetchAll = useCallback(async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        try {
            const [statsData, voucherData] = await Promise.all([
                adminVoucherService.getStats(),
                adminVoucherService.getAllVouchers('all', 'all', '')
            ]);
            setStats(statsData);
            // Giữ toàn bộ vouchers bao gồm cả PENDING để hiển thị tức thì
            setVouchers(Array.isArray(voucherData) ? voucherData : []);
        } catch (err) {
            console.error('[VoucherManagement] fetchAll error:', err);
            if (!isSilent) {
                setToast({ type: 'error', msg: 'Lỗi tải dữ liệu: ' + err.message });
                setTimeout(() => setToast(null), 3500);
            }
        } finally {
            if (!isSilent) setLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchPending = useCallback(async (isSilent = false) => {
        if (!isSilent) setPendingLoading(true);
        try {
            const data = await adminVoucherService.getPendingVouchers();
            const list = Array.isArray(data) ? data : [];
            setPendingVouchers(list);
            // Nếu có mã giảm giá mới từ chủ homestay gửi duyệt
            if (prevPendingCountRef.current !== null && list.length > prevPendingCountRef.current) {
                fetchAll(true);
                const newest = list[0];
                setToast({
                    type: 'success',
                    msg: `🔔 Chủ homestay vừa gửi duyệt mã "${newest?.code || ''}"!`
                });
                setTimeout(() => setToast(null), 4500);
            }
            prevPendingCountRef.current = list.length;
        } catch (err) {
            console.error('[VoucherManagement] fetchPending error:', err);
        } finally {
            if (!isSilent) setPendingLoading(false);
        }
    }, [fetchAll]);

    // Khởi tạo và lắng nghe đồng bộ theo thời gian thực (Real-time Sync)
    useEffect(() => {
        fetchAll();
        fetchPending();

        // 1. Lắng nghe BroadcastChannel giữa các tab trình duyệt
        let channel = null;
        try {
            if ('BroadcastChannel' in window) {
                channel = new BroadcastChannel('voucher_channel');
                channel.onmessage = (event) => {
                    if (event.data?.type === 'VOUCHER_CREATED' || event.data?.type === 'VOUCHER_UPDATED') {
                        fetchAll(true);
                        fetchPending(true);
                        setToast({
                            type: 'success',
                            msg: `🔔 Chủ homestay vừa gửi duyệt mã "${event.data?.code || event.data?.voucher?.code || ''}"!`
                        });
                        setTimeout(() => setToast(null), 4500);
                    }
                };
            }
        } catch (_) {}

        // 2. Lắng nghe storage event (khi đổi tab trên cùng trình duyệt)
        const handleStorage = (e) => {
            if (e.key === 'voucher_sync_event' && e.newValue) {
                try {
                    const parsed = JSON.parse(e.newValue);
                    fetchAll(true);
                    fetchPending(true);
                    if (parsed?.code && parsed.type === 'VOUCHER_CREATED') {
                        setToast({
                            type: 'success',
                            msg: `🔔 Chủ homestay vừa gửi duyệt mã "${parsed.code}"!`
                        });
                        setTimeout(() => setToast(null), 4500);
                    }
                } catch (_) {}
            }
        };

        // 3. Lắng nghe custom event trong cùng tab
        const handleCustomEvent = (e) => {
            fetchAll(true);
            fetchPending(true);
            if (e.detail?.code) {
                setToast({
                    type: 'success',
                    msg: `🔔 Chủ homestay vừa gửi duyệt mã "${e.detail.code}"!`
                });
                setTimeout(() => setToast(null), 4500);
            }
        };

        window.addEventListener('storage', handleStorage);
        window.addEventListener('voucher_created', handleCustomEvent);

        // 4. Polling định kỳ mỗi 4 giây (đảm bảo tự động cập nhật ngay cả khi khác trình duyệt/máy tính)
        const timer = setInterval(() => {
            fetchPending(true);
        }, 4000);

        return () => {
            if (channel) channel.close();
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener('voucher_created', handleCustomEvent);
            clearInterval(timer);
        };
    }, [fetchAll, fetchPending]);

    // Reset về trang 1 khi thay đổi bộ lọc hoặc số phần tử / trang
    useEffect(() => {
        setPage(1);
    }, [activeTab, filterType, searchQuery, pageSize]);

    // ── Lọc danh sách ───────────────────────────────────────────────────
    const filtered = vouchers.filter(v => {
        const matchTab = activeTab === 'all' || v.status === activeTab;
        const matchType = filterType === 'all' || v.discountType === filterType;
        const q = searchQuery.toLowerCase();
        const matchSearch = !q
            || (v.code || '').toLowerCase().includes(q)
            || (v.homestayName || '').toLowerCase().includes(q);
        return matchTab && matchType && matchSearch;
    });

    // ── Dữ liệu phân trang ──────────────────────────────────────────────
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, filtered.length);
    const paginatedVouchers = filtered.slice(startIndex, endIndex);

    // ── Thống kê count từ danh sách ─────────────────────────────────────
    const countByStatus = (s) => vouchers.filter(v => v.status === s).length;

    // ── Detail & Approve Handlers ───────────────────────────────────────

    function openDetail(v) {
        setSelected(v);
        setModal('detail');
    }

    async function handleToggle(v) {
        if (togglingId) return;
        setTogglingId(v.id);
        // Optimistic update ngay lập tức
        const nextStatus = v.status === 'active' ? 'disabled' : 'active';
        setVouchers(prev => {
            const next = prev.map(item => item.id === v.id ? {
                ...item,
                status: nextStatus,
                rawStatus: nextStatus === 'active' ? 'ACTIVE' : 'DISABLED'
            } : item);
            recalcStats(next);
            return next;
        });
        try {
            await adminVoucherService.toggleStatus(v.id);
            const nextLabel = nextStatus === 'active' ? 'bật' : 'tắt';
            showToast('success', `Đã ${nextLabel} mã "${v.code}" thành công!`);
        } catch (err) {
            // Rollback nếu lỗi
            setVouchers(prev => {
                const next = prev.map(item => item.id === v.id ? {
                    ...item,
                    status: v.status,
                    rawStatus: v.rawStatus
                } : item);
                recalcStats(next);
                return next;
            });
            showToast('error', err.message);
        } finally {
            setTogglingId(null);
        }
    }

    function handleCopy(code) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(code).then(() => showToast('success', `Đã sao chép mã ${code}`));
        }
    }

    async function handleApprove(v) {
        if (approvingId) return;
        setApprovingId(v.id);
        try {
            await adminVoucherService.approveVoucher(v.id);
            setPendingVouchers(prev => prev.filter(p => p.id !== v.id));
            setVouchers(prev => prev.map(item => item.id === v.id ? { ...item, status: 'active', rawStatus: 'ACTIVE' } : item));
            fetchAll(true);
            fetchPending(true);
            // Đồng bộ sang bên chủ homestay ngay tức thì
            try {
                const syncData = {
                    type: 'VOUCHER_APPROVED',
                    id: v.id,
                    code: v.code,
                    voucher: { ...v, status: 'active', rawStatus: 'ACTIVE' },
                    ts: Date.now()
                };
                localStorage.setItem('voucher_sync_event', JSON.stringify(syncData));
                window.dispatchEvent(new CustomEvent('voucher_sync_event', { detail: syncData }));
                window.dispatchEvent(new CustomEvent('voucher_approved', { detail: syncData }));
                if ('BroadcastChannel' in window) {
                    const bc = new BroadcastChannel('voucher_channel');
                    bc.postMessage(syncData);
                    bc.close();
                }
            } catch (_) {}
            showToast('success', `Đã duyệt mã "${v.code}" — Mã giảm giá đã được kích hoạt!`);
            setModal(null);
        } catch (err) {
            showToast('error', err.message);
        } finally {
            setApprovingId(null);
        }
    }

    async function handleReject(v) {
        if (rejectingId) return;
        setRejectingId(v.id);
        try {
            await adminVoucherService.rejectVoucher(v.id);
            setPendingVouchers(prev => prev.filter(p => p.id !== v.id));
            setVouchers(prev => prev.map(item => item.id === v.id ? { ...item, status: 'rejected', rawStatus: 'REJECTED' } : item));
            fetchAll(true);
            fetchPending(true);
            // Đồng bộ sang bên chủ homestay ngay tức thì
            try {
                const syncData = {
                    type: 'VOUCHER_REJECTED',
                    id: v.id,
                    code: v.code,
                    voucher: { ...v, status: 'rejected', rawStatus: 'REJECTED' },
                    ts: Date.now()
                };
                localStorage.setItem('voucher_sync_event', JSON.stringify(syncData));
                window.dispatchEvent(new CustomEvent('voucher_sync_event', { detail: syncData }));
                window.dispatchEvent(new CustomEvent('voucher_rejected', { detail: syncData }));
                if ('BroadcastChannel' in window) {
                    const bc = new BroadcastChannel('voucher_channel');
                    bc.postMessage(syncData);
                    bc.close();
                }
            } catch (_) {}
            showToast('success', `Đã từ chối phê duyệt mã "${v.code}"`);
            setModal(null);
        } catch (err) {
            showToast('error', err.message);
        } finally {
            setRejectingId(null);
        }
    }

    // ─── RENDER ──────────────────────────────────────────────────────────────
    return (
        <div className="vm-page-container">

            {/* Toast */}
            {toast && (
                <div className={`vm-toast vm-toast--${toast.type}`}>
                    <span className="material-symbols-outlined">
                        {toast.type === 'success' ? 'check_circle' : 'error'}
                    </span>
                    {toast.msg}
                </div>
            )}

            {/* ── 1. STAT CARDS ─────────────────────────────────────────── */}
            <div className="vm-stats-grid">
                <StatCard
                    label="Tổng Mã Giảm Giá"
                    value={stats?.total ?? '—'}
                    icon="confirmation_number"
                    colorClass="orange"
                    onClick={() => { setActiveTab('all'); }}
                />
                <StatCard
                    label="Chờ Duyệt"
                    value={pendingVouchers.length}
                    icon="pending"
                    colorClass="amber"
                    onClick={() => setActiveTab('pending')}
                    highlight={pendingVouchers.length > 0}
                />
                <StatCard
                    label="Đang Hoạt Động"
                    value={stats?.active ?? '—'}
                    icon="check_circle"
                    colorClass="green"
                    onClick={() => setActiveTab('active')}
                />
                <StatCard
                    label="Đã Hết Hạn"
                    value={stats?.expired ?? '—'}
                    icon="history"
                    colorClass="slate"
                    onClick={() => setActiveTab('expired')}
                />
                <StatCard
                    label="Chi Phí Giảm Giá Ước Tính"
                    value={stats ? formatFullVND(stats.totalDiscountCost) : '—'}
                    icon="payments"
                    colorClass="purple"
                    small
                />
            </div>

            {/* ── 2. MAIN CONTENT CARD ────────────────────────────────────── */}
            <div className="vm-card">
                {/* Header */}
                <div className="vm-card-header">
                    <div className="vm-card-title-group">
                        <h2 className="vm-card-title">
                            <span className="material-symbols-outlined" style={{ color: '#15803D' }}>local_offer</span>
                            Quản Lý Mã Giảm Giá
                        </h2>
                        <p className="vm-card-subtitle">
                            Xem và xét duyệt mã giảm giá do chủ cơ sở homestay gửi lên hệ thống YÊN Homestay
                        </p>
                    </div>
                    {pendingVouchers.length > 0 && (
                        <button
                            className="vm-btn vm-btn--amber"
                            onClick={() => setActiveTab('pending')}
                        >
                            <span className="material-symbols-outlined">pending</span>
                            Chờ Duyệt
                            <span className="vm-pending-badge">{pendingVouchers.length}</span>
                        </button>
                    )}
                </div>

                {/* Tabs */}
                <div className="vm-tabs-bar">
                    {[
                        { key: 'all',      label: `Tất Cả (${vouchers.length})` },
                        { key: 'pending',  label: `Chờ Duyệt (${pendingVouchers.length})`,       amber: true },
                        { key: 'active',   label: `Đang Hoạt Động (${countByStatus('active')})` },
                        { key: 'upcoming', label: `Sắp Diễn Ra (${countByStatus('upcoming')})`},
                        { key: 'expired',  label: `Hết Hạn (${countByStatus('expired')})`},
                        { key: 'disabled', label: `Đã Tắt (${countByStatus('disabled')})`},
                    ].map(t => (
                        <button
                            key={t.key}
                            className={`vm-tab-btn ${activeTab === t.key ? 'active' : ''} ${t.amber ? 'vm-tab-btn--amber' : ''}`}
                            onClick={() => setActiveTab(t.key)}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{t.icon}</span>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Pending Alert Banner khi đang ở các tab khác */}
                {pendingVouchers.length > 0 && activeTab !== 'pending' && (
                    <div
                        className="vm-pending-banner"
                        onClick={() => setActiveTab('pending')}
                        title="Bấm để mở danh sách duyệt ngay"
                    >
                        <div className="vm-pending-banner-text">
                            <span className="material-symbols-outlined vm-bell-shake">notifications_active</span>
                            <span>
                                Đang có <strong>{pendingVouchers.length}</strong> mã giảm giá từ chủ homestay gửi lên chờ bạn xét duyệt!
                            </span>
                        </div>
                        <button
                            className="vm-btn vm-btn--amber vm-btn--sm"
                            onClick={(e) => { e.stopPropagation(); setActiveTab('pending'); }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>pending_actions</span>
                            Xem và duyệt ngay
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
                        </button>
                    </div>
                )}

                {/* Toolbar */}
                <div className="vm-toolbar">
                    <div className="vm-toolbar-left">
                        <div className="vm-search-box">
                            <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#94A3B8' }}>search</span>
                            <input
                                type="text"
                                placeholder="Tìm mã voucher, homestay..."
                                value={searchQuery}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <select
                            className="vm-select"
                            value={filterType}
                            onChange={e => setFilterType(e.target.value)}
                        >
                            <option value="all">Tất cả hình thức</option>
                            <option value="percent">Giảm theo % (phần trăm)</option>
                            <option value="amount">Giảm tiền cố định (VNĐ)</option>
                        </select>
                    </div>
                    <button
                        className="vm-btn vm-btn--outline vm-btn--sm"
                        onClick={fetchAll}
                        title="Làm mới danh sách"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>refresh</span>
                        Làm mới
                    </button>
                </div>

                {/* Pending Panel */}
                {activeTab === 'pending' && (
                    <PendingPanel
                        pendingVouchers={pendingVouchers}
                        loading={pendingLoading}
                        approvingId={approvingId}
                        rejectingId={rejectingId}
                        onApprove={(v) => { setSelected(v); setModal('approve'); }}
                        onReject={(v) => { setSelected(v); setModal('reject'); }}
                        onDetail={(v) => openDetail(v)}
                        onRefresh={fetchPending}
                    />
                )}

                {/* Table */}
                {activeTab !== 'pending' && loading ? (
                    <div className="vm-loading">
                        <div className="vm-spinner" />
                        <span>Đang tải dữ liệu...</span>
                    </div>
                ) : activeTab !== 'pending' && (
                    <div className="vm-table-wrap">
                        <table className="vm-table">
                            <colgroup>
                                <col style={{ width: '15%' }} />
                                <col style={{ width: '18%' }} />
                                <col style={{ width: '20%' }} />
                                <col style={{ width: '19%' }} />
                                <col style={{ width: '13%' }} />
                                <col style={{ width: '15%' }} />
                            </colgroup>
                            <thead>
                                <tr>
                                    <th className="vm-col-code">Mã Voucher</th>
                                    <th className="vm-col-homestay">Homestay Áp Dụng</th>
                                    <th className="vm-col-discount">Ưu Đãi & Điều Kiện</th>
                                    <th className="vm-col-timeusage">Thời Hạn & Lượt Dùng</th>
                                    <th className="vm-col-status">Trạng Thái</th>
                                    <th className="vm-col-actions" style={{ textAlign: 'right' }}>Thao Tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="vm-table-empty">
                                            <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#CBD5E1' }}>search_off</span>
                                            <div>Không có mã giảm giá nào phù hợp với bộ lọc hiện tại</div>
                                        </td>
                                    </tr>
                                ) : paginatedVouchers.map(v => (
                                    <tr key={v.id} className={`vm-table-row ${v.status === 'pending' ? 'vm-row-pending' : ''}`}>
                                        {/* 1. Mã Voucher */}
                                        <td className="vm-col-code">
                                            <div
                                                className="vm-code-badge"
                                                onClick={() => handleCopy(v.code)}
                                                title="Nhấp để sao chép"
                                            >
                                                <span>{v.code}</span>
                                                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>content_copy</span>
                                            </div>
                                            <div className="vm-table-sub">ID: {v.id}</div>
                                        </td>

                                        {/* 2. Homestay Áp Dụng */}
                                        <td className="vm-col-homestay">
                                            {v.homestayId ? (
                                                <>
                                                    <div className="vm-hs-name" title={v.homestayName}>{v.homestayName}</div>
                                                    <div className="vm-table-sub">ID: {v.homestayId}</div>
                                                </>
                                            ) : (
                                                <span className="vm-system-badge">
                                                    <span className="material-symbols-outlined" style={{ fontSize: 13 }}>public</span>
                                                    Toàn hệ thống
                                                </span>
                                            )}
                                        </td>

                                        {/* 3. Ưu Đãi & Điều Kiện */}
                                        <td className="vm-col-discount">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                                {v.discountType === 'percent' ? (
                                                    <div className="vm-discount-badge vm-discount-badge--percent">
                                                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>percent</span>
                                                        Giảm {v.value}%
                                                    </div>
                                                ) : (
                                                    <div className="vm-discount-badge vm-discount-badge--amount">
                                                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>payments</span>
                                                        Giảm {formatVND(v.value)}
                                                    </div>
                                                )}
                                                {v.maxDiscount > 0 && (
                                                    <span className="vm-table-sub" style={{ margin: 0 }}>Tối đa {formatVND(v.maxDiscount)}</span>
                                                )}
                                            </div>
                                            <div className="vm-table-sub" style={{ marginTop: '4px', color: '#475569' }}>
                                                Đơn từ: <strong>{formatVND(v.minOrderValue) || 'Mọi đơn'}</strong>
                                            </div>
                                        </td>

                                        {/* 4. Thời Hạn & Lượt Dùng */}
                                        <td className="vm-col-timeusage">
                                            <div style={{ fontSize: '12px', color: '#334155', fontWeight: '600' }}>
                                                {v.startDateFormatted || '—'} – {v.expiryDateFormatted || '—'}
                                            </div>
                                            <div className="vm-usage-wrap" style={{ marginTop: '4px' }}>
                                                <div className="vm-usage-text">
                                                    <span style={{ color: '#64748B', fontSize: '11px' }}>Đã dùng:</span>{' '}
                                                    <strong style={{ color: '#0F172A', fontSize: '11.5px' }}>{v.usedCount}</strong>
                                                    <span style={{ color: '#94A3B8', fontSize: '11px' }}>/{v.usageLimit}</span>
                                                </div>
                                                <div className="vm-usage-bar">
                                                    <div
                                                        className="vm-usage-bar-fill"
                                                        style={{
                                                             width: `${v.usagePercent}%`,
                                                             background: v.usagePercent >= 80 ? '#DC2626' : '#15803D'
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </td>

                                        {/* 5. Trạng Thái */}
                                        <td className="vm-col-status">
                                            <StatusChip status={v.status} />
                                        </td>

                                        {/* 6. Thao Tác: Duyệt/Từ chối nếu đang chờ duyệt, hoặc Xem chi tiết và bật/tắt */}
                                        <td className="vm-col-actions">
                                            <div className="vm-actions">
                                                <button
                                                    className="vm-icon-btn vm-icon-btn--info"
                                                    onClick={() => openDetail(v)}
                                                    title="Xem chi tiết"
                                                >
                                                    <span className="material-symbols-outlined">visibility</span>
                                                </button>
                                                {v.status === 'pending' ? (
                                                    <>
                                                        <button
                                                            className="vm-icon-btn vm-icon-btn--success"
                                                            onClick={() => { setSelected(v); setModal('approve'); }}
                                                            disabled={approvingId === v.id || rejectingId === v.id}
                                                            title="Duyệt mã giảm giá này"
                                                        >
                                                            {approvingId === v.id ? (
                                                                <span className="vm-spinner-sm" style={{ borderTopColor: '#15803D' }} />
                                                            ) : (
                                                                <span className="material-symbols-outlined">verified</span>
                                                            )}
                                                        </button>
                                                        <button
                                                            className="vm-icon-btn vm-icon-btn--danger"
                                                            onClick={() => { setSelected(v); setModal('reject'); }}
                                                            disabled={approvingId === v.id || rejectingId === v.id}
                                                            title="Từ chối mã giảm giá này"
                                                        >
                                                            {rejectingId === v.id ? (
                                                                <span className="vm-spinner-sm" style={{ borderTopColor: '#DC2626' }} />
                                                            ) : (
                                                                <span className="material-symbols-outlined">cancel</span>
                                                            )}
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        className={`vm-icon-btn ${v.status === 'active' ? 'vm-icon-btn--warn' : 'vm-icon-btn--success'}`}
                                                        onClick={() => handleToggle(v)}
                                                        disabled={togglingId === v.id}
                                                        title={v.status === 'active' ? 'Tắt mã giảm giá này' : 'Bật mã giảm giá này'}
                                                    >
                                                        {togglingId === v.id ? (
                                                            <span className="vm-spinner-sm" style={{ borderTopColor: '#15803D' }} />
                                                        ) : (
                                                            <span className="material-symbols-outlined">
                                                                {v.status === 'active' ? 'toggle_on' : 'toggle_off'}
                                                            </span>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Footer & Phân trang (only for non-pending tabs) */}
                {activeTab !== 'pending' && !loading && filtered.length > 0 && (
                    <div className="vm-table-footer">
                        <div className="vm-footer-left">
                            <span className="vm-footer-info">
                                Hiển thị <strong>{filtered.length === 0 ? 0 : startIndex + 1} - {endIndex}</strong> / <strong>{filtered.length}</strong> mã giảm giá
                            </span>
                            <div className="vm-page-size-selector">
                                <span>Số dòng:</span>
                                <select
                                    value={pageSize}
                                    onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                                    className="vm-page-select"
                                >
                                    <option value={5}>5</option>
                                    <option value={8}>8</option>
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                </select>
                            </div>
                        </div>

                        {totalPages > 1 && (
                            <div className="vm-pagination">
                                <button
                                    className="vm-page-btn vm-page-btn--prev"
                                    disabled={currentPage <= 1}
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    title="Trang trước"
                                >
                                    <span className="material-symbols-outlined">chevron_left</span>
                                    <span>Trước</span>
                                </button>

                                <div className="vm-page-numbers">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
                                        <button
                                            key={num}
                                            className={`vm-page-num ${num === currentPage ? 'active' : ''}`}
                                            onClick={() => setPage(num)}
                                        >
                                            {num}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    className="vm-page-btn vm-page-btn--next"
                                    disabled={currentPage >= totalPages}
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    title="Trang tiếp theo"
                                >
                                    <span>Sau</span>
                                    <span className="material-symbols-outlined">chevron_right</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ══════════════════════════════════════════════════════════════
                MODAL: DUYỆT MÃ GIẢM GIÁ
            ══════════════════════════════════════════════════════════════ */}
            <ModalOverlay open={modal === 'approve'} onClose={() => setModal(null)} maxWidth={520}>
                {selectedVoucher && (
                    <>
                        <div className="vm-modal-header" style={{ background: 'linear-gradient(135deg, #15803D, #16A34A)', color: '#fff' }}>
                            <h3 className="vm-modal-title">
                                <span className="material-symbols-outlined">verified</span>
                                Xác Nhận Duyệt Mã Giảm Giá
                            </h3>
                            <button className="vm-modal-close vm-modal-close--white" onClick={() => setModal(null)}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="vm-modal-body">
                            <div className="vm-approve-preview">
                                <div className="vm-approve-icon">🎟️</div>
                                <div className="vm-approve-code">{selectedVoucher.code}</div>
                                <div className="vm-approve-info">
                                    {selectedVoucher.discountType === 'percent'
                                        ? `Giảm ${selectedVoucher.value}% (tối đa ${formatFullVND(selectedVoucher.maxDiscount)})`
                                        : `Giảm ${formatFullVND(selectedVoucher.value)}`
                                    }
                                </div>
                                <div className="vm-approve-meta">
                                    <span>📅 {selectedVoucher.startDateFormatted} – {selectedVoucher.expiryDateFormatted}</span>
                                    <span>🏠 {selectedVoucher.homestayName || 'Toàn hệ thống'}</span>
                                </div>
                            </div>
                            <div className="vm-alert" style={{ background: '#DCFCE7', border: '1px solid #BBF7D0', color: '#15803D', marginTop: 16 }}>
                                <span className="material-symbols-outlined">info</span>
                                <div>
                                    <strong>Sau khi duyệt:</strong> Mã giảm giá sẽ được kích hoạt ngay và người dùng có thể áp dụng khi đặt phòng.
                                </div>
                            </div>
                        </div>
                        <div className="vm-modal-footer">
                            <button className="vm-btn vm-btn--outline" onClick={() => setModal(null)} disabled={!!approvingId}>Hủy</button>
                            <button
                                className="vm-btn vm-btn--success"
                                onClick={() => handleApprove(selectedVoucher)}
                                disabled={!!approvingId}
                            >
                                {approvingId === selectedVoucher.id
                                    ? <><span className="vm-spinner-sm" /> Đang duyệt...</>
                                    : <><span className="material-symbols-outlined">verified</span> Duyệt &amp; Kích Hoạt</>
                                }
                            </button>
                        </div>
                    </>
                )}
            </ModalOverlay>

            {/* ══════════════════════════════════════════════════════════════
                MODAL: TỪ CHỐI MÃ GIẢM GIÁ
            ══════════════════════════════════════════════════════════════ */}
            <ModalOverlay open={modal === 'reject'} onClose={() => setModal(null)} maxWidth={520}>
                {selectedVoucher && (
                    <>
                        <div className="vm-modal-header vm-modal-header--red">
                            <h3 className="vm-modal-title">
                                <span className="material-symbols-outlined">cancel</span>
                                Từ Chối Mã Giảm Giá
                            </h3>
                            <button className="vm-modal-close vm-modal-close--white" onClick={() => setModal(null)}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="vm-modal-body">
                            <div className="vm-alert vm-alert--danger">
                                <span className="material-symbols-outlined">warning</span>
                                <div>
                                    <strong>Bạn đang từ chối mã <span style={{ color: '#DC2626' }}>'{selectedVoucher.code}'</span></strong>
                                    <p style={{ margin: '4px 0 0 0', fontSize: 13 }}>
                                        Mã sẽ bị chuyển sang trạng thái <strong>Đã Tắt</strong>. Chủ homestay có thể gửi lại yêu cầu nếu cần.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="vm-modal-footer">
                            <button className="vm-btn vm-btn--outline" onClick={() => setModal(null)} disabled={!!rejectingId}>Hủy</button>
                            <button
                                className="vm-btn vm-btn--danger"
                                onClick={() => handleReject(selectedVoucher)}
                                disabled={!!rejectingId}
                            >
                                {rejectingId === selectedVoucher.id
                                    ? <><span className="vm-spinner-sm" /> Đang từ chối...</>
                                    : <><span className="material-symbols-outlined">cancel</span> Xác Nhận Từ Chối</>
                                }
                            </button>
                        </div>
                    </>
                )}
            </ModalOverlay>



            {/* ══════════════════════════════════════════════════════════════
                MODAL: CHI TIẾT MÃ GIẢM GIÁ
            ══════════════════════════════════════════════════════════════ */}
            <ModalOverlay open={modal === 'detail'} onClose={() => setModal(null)}>
                {selectedVoucher && (
                    <>
                        <div className="vm-modal-header vm-modal-header--dark">
                            <h3 className="vm-modal-title">
                                <span className="material-symbols-outlined" style={{ color: '#FEF08A' }}>confirmation_number</span>
                                Chi Tiết Mã Giảm Giá
                            </h3>
                            <button className="vm-modal-close vm-modal-close--white" onClick={() => setModal(null)}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="vm-modal-body">
                            {/* Ticket preview */}
                            <div className="vm-ticket">
                                <div className="vm-ticket-top">
                                    <div className="vm-ticket-brand">
                                        <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#15803D' }}>local_offer</span>
                                        <span className="vm-ticket-brand-name">
                                            {selectedVoucher.homestayId ? selectedVoucher.homestayName : 'YÊN HOMESTAY SYSTEM'}
                                        </span>
                                    </div>
                                    <div
                                        className="vm-code-badge"
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleCopy(selectedVoucher.code)}
                                    >
                                        {selectedVoucher.code}
                                        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>content_copy</span>
                                    </div>
                                </div>
                                <div className="vm-ticket-amount">
                                    {selectedVoucher.discountType === 'percent'
                                        ? `GIẢM ${selectedVoucher.value}% (Tối đa ${formatFullVND(selectedVoucher.maxDiscount)})`
                                        : `GIẢM ${formatFullVND(selectedVoucher.value)}`
                                    }
                                </div>
                                <div className="vm-ticket-meta">
                                    <div>
                                        <span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: 'middle' }}>event</span>
                                        {' '}Hạn: {selectedVoucher.startDateFormatted} – {selectedVoucher.expiryDateFormatted}
                                    </div>
                                    <div>
                                        <span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: 'middle' }}>shopping_bag</span>
                                        {' '}Đơn từ: {formatFullVND(selectedVoucher.minOrderValue) || 'Mọi đơn'}
                                    </div>
                                    <div>
                                        <span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: 'middle' }}>confirmation_number</span>
                                        {' '}Số lượng: {selectedVoucher.usageLimit} lượt
                                    </div>
                                    <div>
                                        <span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: 'middle' }}>local_activity</span>
                                        {' '}Đã dùng: {selectedVoucher.usedCount} lượt
                                    </div>
                                </div>
                            </div>

                            {/* Thông tin bổ sung */}
                            <div className="vm-detail-grid">
                                <DetailRow icon="tag" label="ID Voucher" value={selectedVoucher.id} />
                                <DetailRow icon="store" label="Phạm vi" value={
                                    selectedVoucher.homestayId
                                        ? `Riêng - ${selectedVoucher.homestayName} (ID: ${selectedVoucher.homestayId})`
                                        : 'Toàn bộ hệ thống YÊN'
                                } />
                                <DetailRow icon="category" label="Loại giảm" value={
                                    selectedVoucher.discountType === 'percent'
                                        ? `Theo phần trăm - ${selectedVoucher.value}%`
                                        : `Số tiền cố định - ${formatFullVND(selectedVoucher.value)}`
                                } />
                                <DetailRow icon="trending_up" label="Tỷ lệ sử dụng" value={`${selectedVoucher.usagePercent}% (${selectedVoucher.usedCount}/${selectedVoucher.usageLimit})`} />
                                <DetailRow icon="info" label="Trạng thái hệ thống" value={STATUS_CONFIG[selectedVoucher.status]?.label || selectedVoucher.status} />
                            </div>
                        </div>
                        <div className="vm-modal-footer">
                            <button className="vm-btn vm-btn--outline" onClick={() => setModal(null)}>Đóng</button>
                        </div>
                    </>
                )}
            </ModalOverlay>
        </div>
    );
}

// ─── SUB COMPONENTS ──────────────────────────────────────────────────────────

function StatCard({ label, value, icon, colorClass, onClick, small, highlight }) {
    return (
        <div
            className={`vm-stat-card ${onClick ? 'vm-stat-card--clickable' : ''} ${highlight ? 'vm-stat-card--highlight' : ''}`}
            onClick={onClick}
        >
            <div className="vm-stat-info">
                <span className="vm-stat-label">{label}</span>
                <div className={`vm-stat-value ${small ? 'vm-stat-value--sm' : ''}`}>{value}</div>
            </div>
            <div className={`vm-stat-icon vm-stat-icon--${colorClass}`}>
                <span className="material-symbols-outlined">{icon}</span>
            </div>
        </div>
    );
}

function PendingPanel({ pendingVouchers, loading, approvingId, rejectingId, onApprove, onReject, onDetail, onRefresh }) {
    if (loading) {
        return (
            <div className="vm-loading">
                <div className="vm-spinner" />
                <span>Đang tải danh sách chờ duyệt...</span>
            </div>
        );
    }

    if (pendingVouchers.length === 0) {
        return (
            <div className="vm-pending-empty">
                <span className="material-symbols-outlined" style={{ fontSize: 56, color: '#BBF7D0' }}>task_alt</span>
                <div style={{ fontWeight: 600, fontSize: 16, color: '#15803D', marginTop: 12 }}>Không có mã nào đang chờ duyệt</div>
                <div style={{ color: '#64748B', fontSize: 13, marginTop: 4 }}>Tất cả yêu cầu từ chủ homestay đã được xử lý.</div>
                <button className="vm-btn vm-btn--outline" style={{ marginTop: 16 }} onClick={onRefresh}>
                    <span className="material-symbols-outlined" style={{ fontSize: 17 }}>refresh</span>
                    Làm mới
                </button>
            </div>
        );
    }

    return (
        <div className="vm-pending-panel">
            <div className="vm-pending-header">
                <div className="vm-pending-title">
                    <span className="material-symbols-outlined" style={{ color: '#B45309' }}>pending_actions</span>
                    <span>Yêu Cầu Chờ Duyệt Từ Chủ Homestay</span>
                    <span className="vm-pending-badge">{pendingVouchers.length}</span>
                </div>
                <button className="vm-btn vm-btn--outline vm-btn--sm" onClick={onRefresh}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>refresh</span>
                    Làm mới
                </button>
            </div>

            <div className="vm-pending-list">
                {pendingVouchers.map(v => (
                    <div key={v.id} className="vm-pending-card">
                        <div className="vm-pending-card-left">
                            <div className="vm-pending-code-wrap">
                                <span className="vm-pending-code">{v.code}</span>
                                <span className="vm-status-chip" style={{ color: '#B45309', background: '#FEF3C7', border: '1px solid #FDE68A', fontSize: 11 }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 12 }}>pending</span>
                                    Chờ duyệt
                                </span>
                            </div>
                            <div className="vm-pending-meta">
                                <span>
                                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>home</span>
                                    {v.homestayName || 'Toàn hệ thống'}
                                </span>
                                <span>
                                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>event</span>
                                    {v.startDateFormatted} – {v.expiryDateFormatted}
                                </span>
                                <span>
                                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>confirmation_number</span>
                                    {v.usageLimit} lượt
                                </span>
                            </div>
                        </div>

                        <div className="vm-pending-card-center">
                            {v.discountType === 'percent' ? (
                                <div className="vm-discount-badge vm-discount-badge--percent" style={{ fontSize: 14 }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 15 }}>percent</span>
                                    Giảm {v.value}%
                                </div>
                            ) : (
                                <div className="vm-discount-badge vm-discount-badge--amount" style={{ fontSize: 14 }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 15 }}>payments</span>
                                    Giảm {new Intl.NumberFormat('vi-VN').format(Number(v.value))}đ
                                </div>
                            )}
                            {v.maxDiscount > 0 && (
                                <div style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>Tối đa {new Intl.NumberFormat('vi-VN').format(Number(v.maxDiscount))}đ</div>
                            )}
                            {v.minOrderValue > 0 && (
                                <div style={{ fontSize: 11, color: '#64748B' }}>Đơn từ {new Intl.NumberFormat('vi-VN').format(Number(v.minOrderValue))}đ</div>
                            )}
                        </div>

                        <div className="vm-pending-card-actions">
                            <button
                                className="vm-icon-btn vm-icon-btn--info"
                                onClick={() => onDetail(v)}
                                title="Xem chi tiết"
                            >
                                <span className="material-symbols-outlined">visibility</span>
                            </button>
                            <button
                                className="vm-btn vm-btn--success vm-btn--sm"
                                onClick={() => onApprove(v)}
                                disabled={!!approvingId || !!rejectingId}
                                title="Duyệt mã giảm giá này"
                            >
                                {approvingId === v.id
                                    ? <><span className="vm-spinner-sm" /> Đang duyệt...</>
                                    : <><span className="material-symbols-outlined" style={{ fontSize: 15 }}>verified</span> Duyệt</>
                                }
                            </button>
                            <button
                                className="vm-btn vm-btn--outline vm-btn--sm"
                                style={{ color: '#DC2626', borderColor: '#DC2626' }}
                                onClick={() => onReject(v)}
                                disabled={!!approvingId || !!rejectingId}
                                title="Từ chối mã giảm giá này"
                            >
                                {rejectingId === v.id
                                    ? <><span className="vm-spinner-sm" /> Đang từ chối...</>
                                    : <><span className="material-symbols-outlined" style={{ fontSize: 15 }}>cancel</span> Từ chối</>
                                }
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function StatusChip({ status }) {
    const cfg = STATUS_CONFIG[status] || { label: status, color: '#64748B', bg: '#F1F5F9', border: '#E2E8F0', icon: 'help' };
    return (
        <span
            className="vm-status-chip"
            style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
        >
            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>{cfg.icon}</span>
            {cfg.label}
        </span>
    );
}

function ModalOverlay({ open, onClose, children, maxWidth = 700 }) {
    return (
        <div className={`vm-modal-overlay ${open ? 'vm-modal-overlay--open' : ''}`} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="vm-modal-container" style={{ maxWidth }}>
                {children}
            </div>
        </div>
    );
}

function DetailRow({ icon, label, value }) {
    return (
        <div className="vm-detail-row">
            <div className="vm-detail-row-label">
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#64748B' }}>{icon}</span>
                {label}
            </div>
            <div className="vm-detail-row-value">{value}</div>
        </div>
    );
}
