import React, { useState, useEffect, useCallback } from 'react';
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
    const [modal, setModal]             = useState(null); // 'create' | 'edit' | 'detail' | 'delete' | 'toggle'
    const [selectedVoucher, setSelected] = useState(null);
    const [form, setForm]               = useState(EMPTY_FORM);
    const [formError, setFormError]     = useState('');

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

    // ── Fetch ────────────────────────────────────────────────────────────
    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [statsData, voucherData] = await Promise.all([
                adminVoucherService.getStats(),
                adminVoucherService.getAllVouchers('all', 'all', '')
            ]);
            setStats(statsData);
            setVouchers(Array.isArray(voucherData) ? voucherData : []);
        } catch (err) {
            console.error('[VoucherManagement] fetchAll error:', err);
            setToast({ type: 'error', msg: 'Lỗi tải dữ liệu: ' + err.message });
            setTimeout(() => setToast(null), 3500);
        } finally {
            setLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

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

    // ── CRUD Handlers ────────────────────────────────────────────────────
    function openCreate() {
        setForm({ ...EMPTY_FORM, startDate: localDateStr(), expiryDate: nextMonthStr() });
        setFormError('');
        setModal('create');
    }

    function openEdit(v) {
        setSelected(v);
        setForm({
            code: v.code || '',
            homestayId: v.homestayId || '',
            discountType: v.discountType || 'percent',
            value: v.value !== undefined && v.value !== null ? String(v.value) : '',
            minOrderValue: v.minOrderValue !== undefined && v.minOrderValue !== null ? String(v.minOrderValue) : '',
            maxDiscount: v.maxDiscount !== undefined && v.maxDiscount !== null ? String(v.maxDiscount) : '',
            usageLimit: v.usageLimit || 100,
            startDate: v.startDate || localDateStr(),
            expiryDate: v.expiryDate || nextMonthStr(),
            status: v.rawStatus || 'ACTIVE'
        });
        setFormError('');
        setModal('edit');
    }

    function openDetail(v) {
        setSelected(v);
        setModal('detail');
    }

    function openDelete(v) {
        setSelected(v);
        setModal('delete');
    }

    async function handleCreate() {
        if (!form.code.trim()) { setFormError('Vui lòng nhập mã voucher!'); return; }
        if (!form.value || isNaN(Number(form.value)) || Number(form.value) <= 0) {
            setFormError('Vui lòng nhập mức giảm hợp lệ!'); return;
        }
        setSaving(true);
        setFormError('');
        try {
            const homestayId = form.homestayId ? Number(form.homestayId) : null;
            const homestayName = homestayId
                ? (homestayList.find(h => h.id === homestayId)?.name || `Homestay #${homestayId}`)
                : null;
            const payload = {
                code: form.code.trim().toUpperCase(),
                homestayId,
                discountType: form.discountType,
                value: Number(form.value),
                minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : 0,
                maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : 0,
                usageLimit: Number(form.usageLimit) || 100,
                startDate: form.startDate,
                expiryDate: form.expiryDate,
                status: 'ACTIVE'
            };
            const result = await adminVoucherService.createVoucher(payload);
            // Optimistic: thêm ngay vào danh sách, không cần fetch lại
            const newVoucher = {
                id: result?.id || result?.voucherId || Date.now(),
                code: payload.code,
                homestayId,
                homestayName: homestayName || 'Toàn bộ hệ thống YÊN',
                discountType: payload.discountType,
                value: payload.value,
                minOrderValue: payload.minOrderValue,
                maxDiscount: payload.maxDiscount,
                usageLimit: payload.usageLimit,
                usedCount: 0,
                startDate: payload.startDate,
                expiryDate: payload.expiryDate,
                startDateFormatted: payload.startDate ? new Date(payload.startDate).toLocaleDateString('vi-VN') : '—',
                expiryDateFormatted: payload.expiryDate ? new Date(payload.expiryDate).toLocaleDateString('vi-VN') : '—',
                status: 'active',
                rawStatus: 'ACTIVE',
                usagePercent: 0,
            };
            setVouchers(prev => {
                const next = [newVoucher, ...prev];
                recalcStats(next);
                return next;
            });
            showToast('success', `Đã tạo mã giảm giá "${payload.code}" thành công!`);
            setModal(null);
        } catch (err) {
            setFormError(err.message);
        } finally {
            setSaving(false);
        }
    }

    async function handleEdit() {
        if (!form.code.trim()) { setFormError('Vui lòng nhập mã voucher!'); return; }
        setSaving(true);
        setFormError('');
        try {
            const homestayId = form.homestayId ? Number(form.homestayId) : null;
            const homestayName = homestayId
                ? (homestayList.find(h => h.id === homestayId)?.name || `Homestay #${homestayId}`)
                : null;
            const payload = {
                code: form.code.trim().toUpperCase(),
                homestayId,
                discountType: form.discountType,
                value: form.value ? Number(form.value) : undefined,
                minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : 0,
                maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : 0,
                usageLimit: Number(form.usageLimit) || 100,
                startDate: form.startDate,
                expiryDate: form.expiryDate,
                status: form.status
            };
            await adminVoucherService.updateVoucher(selectedVoucher.id, payload);
            // Optimistic: cập nhật ngay trong danh sách
            setVouchers(prev => {
                const next = prev.map(item => item.id === selectedVoucher.id ? {
                    ...item,
                    code: payload.code,
                    homestayId,
                    homestayName: homestayName || 'Toàn bộ hệ thống YÊN',
                    discountType: payload.discountType,
                    value: payload.value,
                    minOrderValue: payload.minOrderValue,
                    maxDiscount: payload.maxDiscount,
                    usageLimit: payload.usageLimit,
                    startDate: payload.startDate,
                    expiryDate: payload.expiryDate,
                    startDateFormatted: payload.startDate ? new Date(payload.startDate).toLocaleDateString('vi-VN') : '—',
                    expiryDateFormatted: payload.expiryDate ? new Date(payload.expiryDate).toLocaleDateString('vi-VN') : '—',
                    status: payload.status === 'DISABLED' ? 'disabled' : item.status,
                    rawStatus: payload.status,
                } : item);
                recalcStats(next);
                return next;
            });
            showToast('success', `Đã cập nhật mã "${payload.code}" thành công!`);
            setModal(null);
        } catch (err) {
            setFormError(err.message);
        } finally {
            setSaving(false);
        }
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

    async function handleDelete() {
        if (!selectedVoucher) return;
        setSaving(true);
        try {
            await adminVoucherService.deleteVoucher(selectedVoucher.id);
            // Optimistic: xóa ngay khỏi danh sách
            setVouchers(prev => {
                const next = prev.filter(item => item.id !== selectedVoucher.id);
                recalcStats(next);
                return next;
            });
            showToast('success', `Đã xóa mã "${selectedVoucher.code}"`);
            setModal(null);
        } catch (err) {
            showToast('error', err.message);
        } finally {
            setSaving(false);
        }
    }

    function handleCopy(code) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(code).then(() => showToast('success', `Đã sao chép mã ${code}`));
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
                    onClick={() => setActiveTab('all')}
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
                    label="Lượt Dùng Tổng"
                    value={stats?.totalUsed ?? '—'}
                    icon="local_activity"
                    colorClass="blue"
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
                            Tạo, chỉnh sửa, bật/tắt và xóa toàn bộ mã giảm giá trong hệ thống YÊN Homestay
                        </p>
                    </div>
                    <button className="vm-btn vm-btn--primary" onClick={openCreate}>
                        <span className="material-symbols-outlined">add</span>
                        Tạo Mã Giảm Giá Mới
                    </button>
                </div>

                {/* Tabs */}
                <div className="vm-tabs-bar">
                    {[
                        { key: 'all',      label: `Tất Cả (${vouchers.length})`,          icon: 'list_alt' },
                        { key: 'active',   label: `Đang Hoạt Động (${countByStatus('active')})`,   icon: 'check_circle' },
                        { key: 'upcoming', label: `Sắp Diễn Ra (${countByStatus('upcoming')})`,    icon: 'schedule' },
                        { key: 'expired',  label: `Hết Hạn (${countByStatus('expired')})`,         icon: 'history' },
                        { key: 'disabled', label: `Đã Tắt (${countByStatus('disabled')})`,         icon: 'cancel' },
                    ].map(t => (
                        <button
                            key={t.key}
                            className={`vm-tab-btn ${activeTab === t.key ? 'active' : ''}`}
                            onClick={() => setActiveTab(t.key)}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{t.icon}</span>
                            {t.label}
                        </button>
                    ))}
                </div>

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

                {/* Table */}
                {loading ? (
                    <div className="vm-loading">
                        <div className="vm-spinner" />
                        <span>Đang tải dữ liệu...</span>
                    </div>
                ) : (
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
                                    <tr key={v.id} className="vm-table-row">
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

                                        {/* 6. Thao Tác */}
                                        <td className="vm-col-actions">
                                            <div className="vm-actions">
                                                <button
                                                    className="vm-icon-btn vm-icon-btn--info"
                                                    onClick={() => openDetail(v)}
                                                    title="Xem chi tiết"
                                                >
                                                    <span className="material-symbols-outlined">visibility</span>
                                                </button>
                                                <button
                                                    className="vm-icon-btn vm-icon-btn--edit"
                                                    onClick={() => openEdit(v)}
                                                    title="Chỉnh sửa"
                                                >
                                                    <span className="material-symbols-outlined">edit</span>
                                                </button>
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
                                                <button
                                                    className="vm-icon-btn vm-icon-btn--danger"
                                                    onClick={() => openDelete(v)}
                                                    title="Xóa mã giảm giá"
                                                >
                                                    <span className="material-symbols-outlined">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Footer & Phân trang */}
                {!loading && filtered.length > 0 && (
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
                MODAL: TẠO MÃ GIẢM GIÁ MỚI
            ══════════════════════════════════════════════════════════════ */}
            <ModalOverlay open={modal === 'create'} onClose={() => setModal(null)}>
                <div className="vm-modal-header vm-modal-header--green">
                    <h3 className="vm-modal-title">
                        <span className="material-symbols-outlined">add_circle</span>
                        Tạo Mã Giảm Giá Mới
                    </h3>
                    <button className="vm-modal-close" onClick={() => setModal(null)}>
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div className="vm-modal-body">
                    <VoucherForm
                        form={form}
                        setForm={setForm}
                        error={formError}
                        homestayList={homestayList}
                    />
                </div>
                <div className="vm-modal-footer">
                    <button className="vm-btn vm-btn--outline" onClick={() => setModal(null)} disabled={saving}>Hủy</button>
                    <button className="vm-btn vm-btn--primary" onClick={handleCreate} disabled={saving}>
                        {saving ? <><span className="vm-spinner-sm" /> Đang lưu...</> : <><span className="material-symbols-outlined">save</span> Tạo Mã Giảm Giá</>}
                    </button>
                </div>
            </ModalOverlay>

            {/* ══════════════════════════════════════════════════════════════
                MODAL: CHỈNH SỬA MÃ GIẢM GIÁ
            ══════════════════════════════════════════════════════════════ */}
            <ModalOverlay open={modal === 'edit'} onClose={() => setModal(null)}>
                <div className="vm-modal-header vm-modal-header--blue">
                    <h3 className="vm-modal-title">
                        <span className="material-symbols-outlined">edit</span>
                        Chỉnh Sửa Mã: {selectedVoucher?.code}
                    </h3>
                    <button className="vm-modal-close" onClick={() => setModal(null)}>
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div className="vm-modal-body">
                    <VoucherForm
                        form={form}
                        setForm={setForm}
                        error={formError}
                        isEdit
                        homestayList={homestayList}
                    />
                </div>
                <div className="vm-modal-footer">
                    <button className="vm-btn vm-btn--outline" onClick={() => setModal(null)} disabled={saving}>Hủy</button>
                    <button className="vm-btn vm-btn--primary" style={{ backgroundColor: '#2563EB' }} onClick={handleEdit} disabled={saving}>
                        {saving ? <><span className="vm-spinner-sm" /> Đang lưu...</> : <><span className="material-symbols-outlined">save</span> Lưu Thay Đổi</>}
                    </button>
                </div>
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
                            <button className="vm-btn vm-btn--primary" style={{ backgroundColor: '#2563EB' }} onClick={() => openEdit(selectedVoucher)}>
                                <span className="material-symbols-outlined">edit</span> Chỉnh Sửa
                            </button>
                        </div>
                    </>
                )}
            </ModalOverlay>

            {/* ══════════════════════════════════════════════════════════════
                MODAL: XÁC NHẬN XÓA
            ══════════════════════════════════════════════════════════════ */}
            <ModalOverlay open={modal === 'delete'} onClose={() => setModal(null)} maxWidth={480}>
                {selectedVoucher && (
                    <>
                        <div className="vm-modal-header vm-modal-header--red">
                            <h3 className="vm-modal-title">
                                <span className="material-symbols-outlined">delete_forever</span>
                                Xác Nhận Xóa Mã Giảm Giá
                            </h3>
                            <button className="vm-modal-close vm-modal-close--white" onClick={() => setModal(null)}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="vm-modal-body">
                            <div className="vm-alert vm-alert--danger">
                                <span className="material-symbols-outlined">warning</span>
                                <div>
                                    <strong>Hành động này không thể hoàn tác!</strong>
                                    <p style={{ margin: '4px 0 0 0', fontSize: 13 }}>
                                        Mã giảm giá <strong style={{ color: '#DC2626' }}>{selectedVoucher.code}</strong> sẽ bị xóa hoàn toàn khỏi hệ thống.
                                        {selectedVoucher.usedCount > 0 && (
                                            <> Mã này đã được sử dụng <strong>{selectedVoucher.usedCount} lần</strong>.</>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="vm-modal-footer">
                            <button className="vm-btn vm-btn--outline" onClick={() => setModal(null)} disabled={saving}>Hủy bỏ</button>
                            <button
                                className="vm-btn vm-btn--danger"
                                onClick={handleDelete}
                                disabled={saving}
                            >
                                {saving
                                    ? <><span className="vm-spinner-sm" /> Đang xóa...</>
                                    : <><span className="material-symbols-outlined">delete_forever</span> Xác Nhận Xóa</>
                                }
                            </button>
                        </div>
                    </>
                )}
            </ModalOverlay>
        </div>
    );
}

// ─── SUB COMPONENTS ──────────────────────────────────────────────────────────

function StatCard({ label, value, icon, colorClass, onClick, small }) {
    return (
        <div className={`vm-stat-card ${onClick ? 'vm-stat-card--clickable' : ''}`} onClick={onClick}>
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

// ── HomestayPicker: Dropdown tìm kiếm homestay ───────────────────────────────
function HomestayPicker({ value, onChange, homestayList }) {
    const [search, setSearch] = useState('');
    const [open, setOpen] = useState(false);
    const ref = React.useRef(null);

    const selected = homestayList.find(h => String(h.id) === String(value));
    const filtered = homestayList.filter(h =>
        !search || h.name.toLowerCase().includes(search.toLowerCase()) || String(h.id).includes(search)
    ).slice(0, 30);

    // Đóng khi click ra ngoài
    useEffect(() => {
        function onClickOutside(e) {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, []);

    function select(h) {
        onChange(h ? String(h.id) : '');
        setSearch('');
        setOpen(false);
    }

    return (
        <div className="vm-hs-picker" ref={ref}>
            <div
                className={`vm-hs-picker-trigger ${open ? 'open' : ''}`}
                onClick={() => setOpen(o => !o)}
            >
                {selected ? (
                    <span className="vm-hs-picker-selected">
                        <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#15803D' }}>home</span>
                        <span className="vm-hs-picker-name">{selected.name}</span>
                        <span className="vm-hs-picker-id">ID: {selected.id}</span>
                    </span>
                ) : (
                    <span className="vm-hs-picker-placeholder">
                        <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#94A3B8' }}>public</span>
                        Áp dụng toàn hệ thống
                    </span>
                )}
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#94A3B8', marginLeft: 'auto' }}>expand_more</span>
            </div>

            {open && (
                <div className="vm-hs-picker-dropdown">
                    <div className="vm-hs-picker-search">
                        <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#94A3B8' }}>search</span>
                        <input
                            autoFocus
                            type="text"
                            placeholder="Tìm theo tên hoặc ID..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onClick={e => e.stopPropagation()}
                        />
                    </div>
                    <div className="vm-hs-picker-list">
                        <div
                            className={`vm-hs-picker-item vm-hs-picker-item--global ${!value ? 'active' : ''}`}
                            onClick={() => select(null)}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>public</span>
                            <div>
                                <div style={{ fontWeight: 600 }}>Toàn hệ thống YÊN</div>
                                <div style={{ fontSize: 11, color: '#94A3B8' }}>Voucher áp dụng cho tất cả homestay</div>
                            </div>
                            {!value && <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#15803D', marginLeft: 'auto' }}>check</span>}
                        </div>
                        {filtered.length === 0 && search && (
                            <div style={{ padding: '12px 16px', color: '#94A3B8', fontSize: 13, textAlign: 'center' }}>Không tìm thấy homestay</div>
                        )}
                        {filtered.map(h => (
                            <div
                                key={h.id}
                                className={`vm-hs-picker-item ${String(value) === String(h.id) ? 'active' : ''}`}
                                onClick={() => select(h)}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#64748B' }}>home</span>
                                <div>
                                    <div style={{ fontWeight: 500 }}>{h.name}</div>
                                    <div style={{ fontSize: 11, color: '#94A3B8' }}>ID: {h.id}</div>
                                </div>
                                {String(value) === String(h.id) && <span className="material-symbols-outlined" style={{ fontSize: 15, color: '#15803D', marginLeft: 'auto' }}>check</span>}
                            </div>
                        ))}
                        {!search && homestayList.length > 30 && (
                            <div style={{ padding: '8px 16px', color: '#94A3B8', fontSize: 12, textAlign: 'center' }}>Nhập từ khóa để tìm thêm...</div>
                        )}
                    </div>
                    {value && (
                        <div className="vm-hs-picker-clear" onClick={() => select(null)}>
                            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                            Bỏ chọn homestay
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function VoucherForm({ form, setForm, error, isEdit, homestayList }) {
    const f = (key) => e => setForm(prev => ({ ...prev, [key]: e.target.value }));
    return (
        <div className="vm-form">
            {error && (
                <div className="vm-alert vm-alert--danger" style={{ marginBottom: 16 }}>
                    <span className="material-symbols-outlined">error</span>
                    <span>{error}</span>
                </div>
            )}

            <div className="vm-form-row">
                <div className="vm-form-group">
                    <label className="vm-form-label">
                        Mã Voucher <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <input
                        className="vm-form-input vm-form-input--mono"
                        type="text"
                        placeholder="VD: SUMMER2026"
                        value={form.code}
                        onChange={f('code')}
                        style={{ textTransform: 'uppercase' }}
                    />
                    <span className="vm-form-hint">Chỉ chữ cái và số, không dấu cách. Sẽ tự chuyển thành chữ HOA.</span>
                </div>
                <div className="vm-form-group">
                    <label className="vm-form-label">Homestay Áp Dụng</label>
                    <HomestayPicker
                        value={form.homestayId}
                        onChange={val => setForm(prev => ({ ...prev, homestayId: val }))}
                        homestayList={homestayList}
                    />
                    <span className="vm-form-hint">Chọn homestay cụ thể hoặc để toàn hệ thống.</span>
                </div>
            </div>

            <div className="vm-form-row">
                <div className="vm-form-group">
                    <label className="vm-form-label">Loại Giảm Giá <span style={{ color: '#DC2626' }}>*</span></label>
                    <select className="vm-form-select" value={form.discountType} onChange={f('discountType')}>
                        <option value="percent">Giảm theo phần trăm (%)</option>
                        <option value="amount">Giảm số tiền cố định (VNĐ)</option>
                    </select>
                </div>
                <div className="vm-form-group">
                    <label className="vm-form-label">
                        {form.discountType === 'percent' ? 'Mức Giảm (%)' : 'Số Tiền Giảm (VNĐ)'}
                        <span style={{ color: '#DC2626' }}> *</span>
                    </label>
                    <input
                        className="vm-form-input"
                        type="number"
                        placeholder={form.discountType === 'percent' ? 'VD: 15 (= 15%)' : 'VD: 100000'}
                        value={form.value}
                        onChange={f('value')}
                        min="0"
                        max={form.discountType === 'percent' ? 100 : undefined}
                    />
                </div>
            </div>

            <div className="vm-form-row">
                <div className="vm-form-group">
                    <label className="vm-form-label">Giảm Tối Đa (VNĐ)</label>
                    <input
                        className="vm-form-input"
                        type="number"
                        placeholder="VD: 200000 (để trống = không giới hạn)"
                        value={form.maxDiscount}
                        onChange={f('maxDiscount')}
                        min="0"
                    />
                </div>
                <div className="vm-form-group">
                    <label className="vm-form-label">Đơn Tối Thiểu (VNĐ)</label>
                    <input
                        className="vm-form-input"
                        type="number"
                        placeholder="VD: 1000000 (để trống = mọi đơn)"
                        value={form.minOrderValue}
                        onChange={f('minOrderValue')}
                        min="0"
                    />
                </div>
            </div>

            <div className="vm-form-row">
                <div className="vm-form-group">
                    <label className="vm-form-label">Số Lượng Lượt Dùng <span style={{ color: '#DC2626' }}>*</span></label>
                    <input
                        className="vm-form-input"
                        type="number"
                        value={form.usageLimit}
                        onChange={f('usageLimit')}
                        min="1"
                    />
                </div>
                {isEdit && (
                    <div className="vm-form-group">
                        <label className="vm-form-label">Trạng Thái</label>
                        <select className="vm-form-select" value={form.status} onChange={f('status')}>
                            <option value="ACTIVE">Đang kích hoạt (ACTIVE)</option>
                            <option value="DISABLED">Tắt (DISABLED)</option>
                        </select>
                    </div>
                )}
            </div>

            <div className="vm-form-row">
                <div className="vm-form-group">
                    <label className="vm-form-label">Ngày Bắt Đầu</label>
                    <input className="vm-form-input" type="date" value={form.startDate} onChange={f('startDate')} />
                </div>
                <div className="vm-form-group">
                    <label className="vm-form-label">Ngày Hết Hạn</label>
                    <input className="vm-form-input" type="date" value={form.expiryDate} onChange={f('expiryDate')} />
                </div>
            </div>
        </div>
    );
}
