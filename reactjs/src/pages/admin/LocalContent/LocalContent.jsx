import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './LocalContent.css';

const API = 'http://localhost:8081/api/admin/local-content';
const EMPTY_FORM = {
    name: '',
    city: '',
    location: '',
    imageUrl: '',
    description: '',
    startDate: '',
    endDate: '',
    badgeInfo: ''
};

// Client-side cache for instant 0ms rendering
let cachedFestivals = null;
let cachedHomestays = null;

export function invalidateLocalContentCache() {
    cachedFestivals = null;
    cachedHomestays = null;
    try {
        sessionStorage.removeItem('admin_cached_festivals');
        sessionStorage.removeItem('admin_cached_homestays');
    } catch {
        // ignore
    }
}

// Restore cache from sessionStorage if available
try {
    if (!cachedFestivals) {
        const stored = sessionStorage.getItem('admin_cached_festivals');
        if (stored) cachedFestivals = JSON.parse(stored);
    }
    if (!cachedHomestays) {
        const storedH = sessionStorage.getItem('admin_cached_homestays');
        if (storedH) cachedHomestays = JSON.parse(storedH);
    }
} catch {
    // ignore
}

// Chuẩn hóa loại bỏ dấu tiếng Việt để tìm kiếm thông minh
function removeVietnameseTones(str) {
    if (!str) return '';
    let s = String(str).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    s = s.replace(/đ/g, 'd').replace(/Đ/g, 'd');
    return s.toLowerCase().trim();
}

function inputDate(value) {
    if (!value) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    return match ? `${match[3]}-${match[2]}-${match[1]}` : '';
}

function displayDate(value) {
    const normalized = inputDate(value);
    if (!normalized) return value || '—';
    const [year, month, day] = normalized.split('-');
    return `${day}/${month}/${year}`;
}

async function readApiResponse(response, fallback) {
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
        const detail = body.message || body.error || (body.path ? `API ${body.path} trả về lỗi ${response.status}.` : '');
        throw new Error(detail || fallback);
    }
    return body;
}

export default function LocalContent() {
    const [items, setItems] = useState(cachedFestivals || []);
    const [homestays, setHomestays] = useState(cachedHomestays || []);
    const [loading, setLoading] = useState(!cachedFestivals);
    const [saving, setSaving] = useState(false);

    // Filters
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCity, setFilterCity] = useState('all');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [selectedHomes, setSelectedHomes] = useState([]);
    const [distanceLabels, setDistanceLabels] = useState({});
    const [homeSearchInModal, setHomeSearchInModal] = useState('');

    // Pagination
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    // Toast
    const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });

    const showToast = useCallback((msg, type = 'success') => {
        setToast({ show: true, msg, type });
        setTimeout(() => setToast({ show: false, msg: '', type: 'success' }), 3000);
    }, []);

    // Fetch data with caching & silent background revalidation
    const loadData = useCallback(async (isSilent = false) => {
        if (!isSilent && !cachedFestivals) {
            setLoading(true);
        }
        try {
            const [festRes, homeRes] = await Promise.all([
                fetch(`${API}/festivals`),
                fetch(`${API}/homestays`)
            ]);
            const [festData, homeData] = await Promise.all([
                readApiResponse(festRes, 'Không tải được danh sách lễ hội.'),
                readApiResponse(homeRes, 'Không tải được danh sách homestay.')
            ]);

            cachedFestivals = festData;
            cachedHomestays = homeData;
            try {
                sessionStorage.setItem('admin_cached_festivals', JSON.stringify(festData));
                sessionStorage.setItem('admin_cached_homestays', JSON.stringify(homeData));
            } catch {
                // ignore
            }

            setItems(festData);
            setHomestays(homeData);
        } catch (e) {
            if (!isSilent) {
                showToast(e.message || 'Không thể kết nối máy chủ.', 'error');
            }
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        // If we already have cache, show immediately and refresh silently in background
        loadData(Boolean(cachedFestivals));
    }, [loadData]);

    // Unique cities for filters & modal
    const uniqueCities = useMemo(() => {
        const set = new Set();
        homestays.forEach(h => { if (h.city) set.add(h.city.trim()); });
        items.forEach(i => { if (i.city) set.add(i.city.trim()); });
        return Array.from(set).sort((a, b) => a.localeCompare(b, 'vi'));
    }, [homestays, items]);

    // Filtered data
    const filteredData = useMemo(() => {
        return items.filter(item => {
            const matchStatus = filterStatus === 'all' || item.status === filterStatus;
            const matchCity = filterCity === 'all' || (item.city || '').toLowerCase() === filterCity.toLowerCase();

            if (!searchTerm.trim()) {
                return matchStatus && matchCity;
            }

            const q = searchTerm.toLowerCase().trim();
            const qNoTone = removeVietnameseTones(q);

            const nameNoTone = removeVietnameseTones(item.name);
            const cityNoTone = removeVietnameseTones(item.city);
            const locationNoTone = removeVietnameseTones(item.location);
            const badgeNoTone = removeVietnameseTones(item.badgeInfo);

            const matchSearch =
                nameNoTone.includes(qNoTone) || (item.name || '').toLowerCase().includes(q) ||
                cityNoTone.includes(qNoTone) || (item.city || '').toLowerCase().includes(q) ||
                locationNoTone.includes(qNoTone) || (item.location || '').toLowerCase().includes(q) ||
                badgeNoTone.includes(qNoTone) || (item.badgeInfo || '').toLowerCase().includes(q);

            return matchStatus && matchCity && matchSearch;
        });
    }, [items, filterStatus, filterCity, searchTerm]);

    // Reset pagination on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterStatus, filterCity, pageSize]);

    // Pagination calculations
    const totalItems = filteredData.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

    const paginatedData = useMemo(() => {
        const start = (safeCurrentPage - 1) * pageSize;
        return filteredData.slice(start, start + pageSize);
    }, [filteredData, safeCurrentPage, pageSize]);

    const pageStart = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
    const pageEnd = Math.min(safeCurrentPage * pageSize, totalItems);

    const pageNumbers = useMemo(() => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        if (safeCurrentPage <= 4) {
            return [1, 2, 3, 4, 5, '...', totalPages];
        }
        if (safeCurrentPage >= totalPages - 3) {
            return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        }
        return [1, '...', safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, '...', totalPages];
    }, [totalPages, safeCurrentPage]);

    // Counts for stat boxes
    const activeCount = items.filter(x => x.status === 'active').length;
    const upcomingCount = items.filter(x => x.status === 'upcoming').length;
    const endedCount = items.filter(x => x.status === 'ended').length;
    const totalLinkedHomestays = items.reduce((sum, item) => sum + (item.nearbyHomestays || 0), 0);

    // Modal controls
    const closeModal = () => {
        setShowModal(false);
        setEditingId(null);
        setForm({ ...EMPTY_FORM });
        setSelectedHomes([]);
        setDistanceLabels({});
        setHomeSearchInModal('');
    };

    const createFestival = () => {
        setEditingId(null);
        setForm({
            ...EMPTY_FORM,
            city: uniqueCities[0] || 'Lâm Đồng'
        });
        setSelectedHomes([]);
        setDistanceLabels({});
        setHomeSearchInModal('');
        setShowModal(true);
    };

    const editFestival = (item) => {
        setEditingId(item.id);
        setForm({
            ...EMPTY_FORM,
            ...item,
            startDate: inputDate(item.startDate),
            endDate: inputDate(item.endDate)
        });
        setSelectedHomes(item.homestayIds || []);
        const distMap = {};
        (item.homestayIds || []).forEach((id, idx) => {
            distMap[id] = item.distanceLabels?.[idx] || '';
        });
        setDistanceLabels(distMap);
        setHomeSearchInModal('');
        setShowModal(true);
    };

    const toggleHome = (id) => {
        setSelectedHomes(current => {
            if (current.includes(id)) {
                return current.filter(x => x !== id);
            } else {
                return [...current, id];
            }
        });
    };

    // Homestays in the modal based on chosen city
    const modalCityHomes = useMemo(() => {
        if (!form.city) return [];
        const normCity = form.city.trim().toLowerCase();
        return homestays.filter(home => {
            const hCity = (home.city || '').trim().toLowerCase();
            const matchCity = hCity.includes(normCity) || normCity.includes(hCity);
            if (!matchCity) return false;

            if (!homeSearchInModal.trim()) return true;
            const q = homeSearchInModal.toLowerCase().trim();
            const qNoTone = removeVietnameseTones(q);
            const nameNoTone = removeVietnameseTones(home.name);
            const addrNoTone = removeVietnameseTones(home.address);
            return nameNoTone.includes(qNoTone) || addrNoTone.includes(qNoTone) || (home.name || '').toLowerCase().includes(q);
        });
    }, [homestays, form.city, homeSearchInModal]);

    const handleSaveFestival = async (e) => {
        e.preventDefault();
        setSaving(true);
        const payload = {
            ...form,
            homestayIds: selectedHomes,
            distanceLabels: selectedHomes.map(id => distanceLabels[id] || '')
        };

        try {
            const response = await fetch(`${API}/festivals${editingId ? `/${editingId}` : ''}`, {
                method: editingId ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await readApiResponse(response, 'Không thể lưu thông tin lễ hội.');

            // Update state & cache
            setItems(prev => {
                const next = editingId
                    ? prev.map(item => item.id === editingId ? result : item)
                    : [result, ...prev];
                cachedFestivals = next;
                try {
                    sessionStorage.setItem('admin_cached_festivals', JSON.stringify(next));
                } catch {
                    // ignore
                }
                return next;
            });

            showToast(editingId ? 'Cập nhật lễ hội thành công!' : 'Thêm mới lễ hội thành công!', 'success');
            closeModal();
        } catch (error) {
            showToast(error.message || 'Lỗi khi lưu thông tin.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const deleteFestival = async (id, name) => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa lễ hội "${name}" không?`)) return;

        try {
            const response = await fetch(`${API}/festivals/${id}`, { method: 'DELETE' });
            await readApiResponse(response, 'Không xóa được lễ hội.');

            setItems(prev => {
                const next = prev.filter(x => x.id !== id);
                cachedFestivals = next;
                try {
                    sessionStorage.setItem('admin_cached_festivals', JSON.stringify(next));
                } catch {
                    // ignore
                }
                return next;
            });

            showToast('Đã xóa lễ hội thành công!', 'success');
        } catch (error) {
            showToast(error.message || 'Lỗi khi xóa lễ hội.', 'error');
        }
    };

    return (
        <div className="manage-homestay-wrapper">
            <div className="admin-content" style={{ padding: 0 }}>
                {/* Page header */}
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Quản lý Lễ hội &amp; Nội dung Địa phương</h1>
                        <p className="page-sub">Quản lý các sự kiện văn hóa, lễ hội du lịch và liên kết các homestay lân cận để quảng bá trên trang chủ</p>
                    </div>
                    <button className="btn-add-new" onClick={createFestival}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add_circle</span>
                        Thêm lễ hội mới
                    </button>
                </div>

                {/* Stat cards - 5 columns matching ManageHomestay */}
                <div className="stats-row">
                    <div className="stat-box">
                        <div>
                            <div className="stat-num">{items.length}</div>
                            <div className="stat-lbl">Tổng Lễ hội &amp; Sự kiện</div>
                        </div>
                        <span className="material-symbols-outlined stat-icon">celebration</span>
                    </div>
                    <div className="stat-box green">
                        <div>
                            <div className="stat-num">{activeCount}</div>
                            <div className="stat-lbl">Đang diễn ra</div>
                        </div>
                        <span className="material-symbols-outlined stat-icon">play_circle</span>
                    </div>
                    <div className="stat-box orange">
                        <div>
                            <div className="stat-num">{upcomingCount}</div>
                            <div className="stat-lbl">Sắp diễn ra</div>
                        </div>
                        <span className="material-symbols-outlined stat-icon">schedule</span>
                    </div>
                    <div className="stat-box gray">
                        <div>
                            <div className="stat-num">{endedCount}</div>
                            <div className="stat-lbl">Đã kết thúc</div>
                        </div>
                        <span className="material-symbols-outlined stat-icon">event_busy</span>
                    </div>
                    <div className="stat-box blue">
                        <div>
                            <div className="stat-num">{totalLinkedHomestays}</div>
                            <div className="stat-lbl">Homestay liên kết</div>
                        </div>
                        <span className="material-symbols-outlined stat-icon">cottage</span>
                    </div>
                </div>

                {/* Filter bar */}
                <div className="filter-bar">
                    <div className="filter-chips">
                        <button
                            className={`chip-btn ${filterStatus === 'all' ? 'active' : ''}`}
                            onClick={() => setFilterStatus('all')}
                        >
                            Tất cả ({items.length})
                        </button>
                        <button
                            className={`chip-btn ${filterStatus === 'active' ? 'active' : ''}`}
                            onClick={() => setFilterStatus('active')}
                        >
                            Đang diễn ra ({activeCount})
                        </button>
                        <button
                            className={`chip-btn ${filterStatus === 'upcoming' ? 'active' : ''}`}
                            onClick={() => setFilterStatus('upcoming')}
                        >
                            Sắp diễn ra ({upcomingCount})
                        </button>
                        <button
                            className={`chip-btn ${filterStatus === 'ended' ? 'active' : ''}`}
                            onClick={() => setFilterStatus('ended')}
                        >
                            Đã kết thúc ({endedCount})
                        </button>
                    </div>
                    <div className="filter-right">
                        <div className="search-input-wrap">
                            <span className="material-symbols-outlined">search</span>
                            <input
                                type="text"
                                placeholder="Tìm lễ hội, địa điểm, nhãn..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select
                            className="select-region"
                            value={filterCity}
                            onChange={(e) => setFilterCity(e.target.value)}
                        >
                            <option value="all">Tất cả tỉnh thành ({uniqueCities.length})</option>
                            {uniqueCities.map((city, idx) => (
                                <option key={idx} value={city}>{city}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Data Table */}
                <div className="data-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Lễ hội / Sự kiện</th>
                                <th>Tỉnh thành &amp; Địa điểm</th>
                                <th>Thời gian diễn ra</th>
                                <th>Homestay liên kết</th>
                                <th>Trạng thái</th>
                                <th style={{ textAlign: 'center' }}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '50px' }}>
                                        <div className="spinner-border text-success" role="status" style={{ width: '2rem', height: '2rem' }}>
                                            <span className="visually-hidden">Đang tải...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', color: '#94A3B8', padding: '40px' }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '36px', color: '#cbd5e1', display: 'block', marginBottom: '8px' }}>search_off</span>
                                        {searchTerm ? `Không tìm thấy lễ hội nào phù hợp với từ khóa "${searchTerm}".` : 'Không có dữ liệu lễ hội nào phù hợp bộ lọc.'}
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map(item => (
                                    <tr key={item.id}>
                                        <td>
                                            <div className="homestay-meta">
                                                <img
                                                    src={item.imageUrl || 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=120'}
                                                    className="homestay-img"
                                                    alt={item.name}
                                                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=120'; }}
                                                />
                                                <div>
                                                    <div className="homestay-title" style={{ fontSize: '14px' }}>{item.name}</div>
                                                    <div className="homestay-sub" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                                                        {item.badgeInfo && (
                                                            <span className="badge-chip">{item.badgeInfo}</span>
                                                        )}
                                                        <span style={{ color: '#94A3B8' }}>ID: #{item.id}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 600, color: '#0F172A' }}>{item.city || '—'}</div>
                                            <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#94A3B8' }}>location_on</span>
                                                {item.location || 'Chưa có địa điểm chi tiết'}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#334155' }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#15803D' }}>event</span>
                                                <span>{displayDate(item.startDate)} &ndash; {displayDate(item.endDate)}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="homestay-link-pill">
                                                <span className="material-symbols-outlined">cottage</span>
                                                <b>{item.nearbyHomestays || 0}</b> homestay
                                            </span>
                                        </td>
                                        <td>
                                            {item.status === 'active' && <span className="status-chip active">Đang diễn ra</span>}
                                            {item.status === 'upcoming' && <span className="status-chip pending">Sắp diễn ra</span>}
                                            {item.status === 'ended' && <span className="status-chip suspended">Đã kết thúc</span>}
                                            {!['active', 'upcoming', 'ended'].includes(item.status) && (
                                                <span className="status-chip suspended">{item.status || 'Chưa rõ'}</span>
                                            )}
                                        </td>
                                        <td className="action-col" style={{ justifyContent: 'center' }}>
                                            <button className="btn-action" onClick={() => editFestival(item)} title="Chỉnh sửa lễ hội">
                                                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>edit</span> Sửa
                                            </button>
                                            <button className="btn-delete-action" onClick={() => deleteFestival(item.id, item.name)} title="Xóa lễ hội">
                                                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>delete</span> Xóa
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="homestay-pagination-bar">
                    <div className="homestay-pagination-info">
                        {totalItems > 0 ? (
                            <span>
                                Hiển thị <b>{pageStart}</b> &ndash; <b>{pageEnd}</b> trên tổng <b>{totalItems}</b> lễ hội
                            </span>
                        ) : (
                            <span>Không có mục nào</span>
                        )}

                        <div className="homestay-page-size-selector">
                            <label htmlFor="local-content-pagesize">Số hàng mỗi trang:</label>
                            <select
                                id="local-content-pagesize"
                                value={pageSize}
                                onChange={(e) => setPageSize(Number(e.target.value))}
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>
                        </div>
                    </div>

                    <div className="homestay-pagination-controls">
                        <button
                            type="button"
                            className="pagination-btn pagination-btn--nav"
                            disabled={safeCurrentPage <= 1}
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        >
                            <span className="material-symbols-outlined">chevron_left</span>
                            Trước
                        </button>

                        <div className="pagination-pages-list">
                            {pageNumbers.map((p, idx) => {
                                if (p === '...') {
                                    return <span key={`ell-${idx}`} className="pagination-ellipsis">&hellip;</span>;
                                }
                                return (
                                    <button
                                        key={`page-${p}`}
                                        type="button"
                                        className={`pagination-btn pagination-btn--num ${p === safeCurrentPage ? 'active' : ''}`}
                                        onClick={() => setCurrentPage(p)}
                                    >
                                        {p}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            type="button"
                            className="pagination-btn pagination-btn--nav"
                            disabled={safeCurrentPage >= totalPages}
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        >
                            Sau
                            <span className="material-symbols-outlined">chevron_right</span>
                        </button>
                    </div>
                </div>

                {/* Modal Create/Edit */}
                <div className={`modal-backdrop ${showModal ? 'open' : ''}`} onClick={(e) => { if (e.target.classList.contains('modal-backdrop')) closeModal(); }}>
                    {showModal && (
                        <div className="modal-box" style={{ maxWidth: '820px' }}>
                            <div className="modal-head">
                                <h4>
                                    <span className="material-symbols-outlined" style={{ verticalAlign: 'middle', marginRight: '8px', color: '#15803D' }}>
                                        {editingId ? 'edit_note' : 'add_circle'}
                                    </span>
                                    {editingId ? 'Chỉnh sửa lễ hội / sự kiện' : 'Thêm mới lễ hội / sự kiện địa phương'}
                                </h4>
                                <button type="button" className="modal-close" onClick={closeModal}>&times;</button>
                            </div>

                            <form onSubmit={handleSaveFestival}>
                                <div className="modal-body" style={{ maxHeight: '76vh', overflowY: 'auto' }}>
                                    <div className="admin-form-section">
                                        <div className="admin-form-group">
                                            <label className="admin-form-label">Tên lễ hội / sự kiện <span style={{ color: '#DC2626' }}>*</span></label>
                                            <input
                                                type="text"
                                                required
                                                maxLength={255}
                                                className="admin-form-input"
                                                placeholder="VD: Lễ hội Hoa Đà Lạt 2026, Festival Biển Vũng Tàu..."
                                                value={form.name}
                                                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                                            />
                                        </div>

                                        <div className="admin-form-grid-2">
                                            <div className="admin-form-group">
                                                <label className="admin-form-label">Tỉnh / Thành phố <span style={{ color: '#DC2626' }}>*</span></label>
                                                <input
                                                    type="text"
                                                    required
                                                    list="admin-festival-cities-datalist"
                                                    className="admin-form-input"
                                                    placeholder="VD: Lâm Đồng, Đà Lạt, Khánh Hòa..."
                                                    value={form.city}
                                                    onChange={(e) => {
                                                        const newCity = e.target.value;
                                                        setForm(prev => ({ ...prev, city: newCity }));
                                                    }}
                                                />
                                                <datalist id="admin-festival-cities-datalist">
                                                    {uniqueCities.map(c => <option key={c} value={c} />)}
                                                </datalist>
                                            </div>

                                            <div className="admin-form-group">
                                                <label className="admin-form-label">Địa điểm tổ chức cụ thể</label>
                                                <input
                                                    type="text"
                                                    maxLength={255}
                                                    className="admin-form-input"
                                                    placeholder="VD: Quảng trường Lâm Viên, Công viên Bãi Trước..."
                                                    value={form.location}
                                                    onChange={(e) => setForm(prev => ({ ...prev, location: e.target.value }))}
                                                />
                                            </div>
                                        </div>

                                        <div className="admin-form-grid-2">
                                            <div className="admin-form-group">
                                                <label className="admin-form-label">Ngày bắt đầu</label>
                                                <input
                                                    type="date"
                                                    className="admin-form-input"
                                                    value={form.startDate || ''}
                                                    onChange={(e) => setForm(prev => ({ ...prev, startDate: e.target.value }))}
                                                />
                                            </div>

                                            <div className="admin-form-group">
                                                <label className="admin-form-label">Ngày kết thúc</label>
                                                <input
                                                    type="date"
                                                    className="admin-form-input"
                                                    value={form.endDate || ''}
                                                    onChange={(e) => setForm(prev => ({ ...prev, endDate: e.target.value }))}
                                                />
                                            </div>
                                        </div>

                                        <div className="admin-form-grid-2">
                                            <div className="admin-form-group">
                                                <label className="admin-form-label">Đường dẫn ảnh bìa (Image URL)</label>
                                                <input
                                                    type="url"
                                                    className="admin-form-input"
                                                    placeholder="https://..."
                                                    value={form.imageUrl || ''}
                                                    onChange={(e) => setForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                                                />
                                            </div>

                                            <div className="admin-form-group">
                                                <label className="admin-form-label">Nhãn nổi bật (Badge)</label>
                                                <input
                                                    type="text"
                                                    maxLength={100}
                                                    className="admin-form-input"
                                                    placeholder="VD: Đặc sắc, Lễ hội mùa hè, Sự kiện lớn..."
                                                    value={form.badgeInfo || ''}
                                                    onChange={(e) => setForm(prev => ({ ...prev, badgeInfo: e.target.value }))}
                                                />
                                            </div>
                                        </div>

                                        {form.imageUrl && (
                                            <div className="admin-form-group">
                                                <label className="admin-form-label">Xem trước ảnh bìa</label>
                                                <div className="festival-img-preview-box">
                                                    <img
                                                        src={form.imageUrl}
                                                        alt="Xem trước"
                                                        onError={(e) => { e.target.style.display = 'none'; }}
                                                        onLoad={(e) => { e.target.style.display = 'block'; }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div className="admin-form-group">
                                            <label className="admin-form-label">Mô tả ngắn về lễ hội / sự kiện</label>
                                            <textarea
                                                rows={3}
                                                maxLength={1000}
                                                className="admin-form-textarea"
                                                placeholder="Giới thiệu điểm nổi bật, hoạt động đặc sắc, quy mô sự kiện..."
                                                value={form.description || ''}
                                                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                                            />
                                        </div>

                                        {/* Gợi ý Homestay lân cận */}
                                        <div className="admin-form-group" style={{ marginTop: '14px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                <label className="admin-form-label" style={{ margin: 0 }}>
                                                    Liên kết Homestay lân cận tại <span style={{ color: '#15803D', fontWeight: 700 }}>"{form.city || 'Tỉnh/thành đã chọn'}"</span>
                                                    <span style={{ marginLeft: '8px', fontSize: '12px', color: '#64748B', fontWeight: 500 }}>
                                                        ({selectedHomes.length} đã chọn)
                                                    </span>
                                                </label>
                                                {modalCityHomes.length > 5 && (
                                                    <div className="mini-search-wrap">
                                                        <span className="material-symbols-outlined">search</span>
                                                        <input
                                                            type="text"
                                                            placeholder="Tìm tên homestay..."
                                                            value={homeSearchInModal}
                                                            onChange={(e) => setHomeSearchInModal(e.target.value)}
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="festival-home-picker-card">
                                                {!form.city ? (
                                                    <div className="empty-picker-notice">
                                                        <span className="material-symbols-outlined">info</span>
                                                        Vui lòng nhập Tỉnh / Thành phố ở phía trên để hiển thị danh sách Homestay phù hợp.
                                                    </div>
                                                ) : modalCityHomes.length === 0 ? (
                                                    <div className="empty-picker-notice">
                                                        <span className="material-symbols-outlined">cottage</span>
                                                        Chưa có Homestay nào thuộc khu vực "{form.city}" trong hệ thống.
                                                    </div>
                                                ) : (
                                                    <div className="picker-list">
                                                        {modalCityHomes.map(home => {
                                                            const isChecked = selectedHomes.includes(home.id);
                                                            return (
                                                                <div key={home.id} className={`picker-item ${isChecked ? 'selected' : ''}`}>
                                                                    <label className="picker-label">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={isChecked}
                                                                            onChange={() => toggleHome(home.id)}
                                                                        />
                                                                        <img
                                                                            src={home.imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=100'}
                                                                            alt={home.name}
                                                                            className="picker-img"
                                                                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=100'; }}
                                                                        />
                                                                        <div className="picker-info">
                                                                            <div className="picker-name">{home.name}</div>
                                                                            <div className="picker-sub">
                                                                                {home.address || home.city}
                                                                                {home.pricePerNight ? ` • ${Number(home.pricePerNight).toLocaleString('vi-VN')} đ/đêm` : ''}
                                                                            </div>
                                                                        </div>
                                                                    </label>

                                                                    {isChecked && (
                                                                        <div className="picker-distance-wrap">
                                                                            <input
                                                                                type="text"
                                                                                className="picker-distance-input"
                                                                                placeholder="VD: Cách 500m, Cách 1.2km..."
                                                                                value={distanceLabels[home.id] || ''}
                                                                                onChange={(e) => setDistanceLabels(prev => ({ ...prev, [home.id]: e.target.value }))}
                                                                            />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-foot">
                                    <button type="button" className="btn-reject" onClick={closeModal} disabled={saving}>
                                        Hủy bỏ
                                    </button>
                                    <button type="submit" className="btn-pass" disabled={saving}>
                                        {saving ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" style={{ marginRight: '6px' }}></span>
                                                Đang lưu...
                                            </>
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined" style={{ fontSize: '16px', verticalAlign: 'middle', marginRight: '4px' }}>check</span>
                                                {editingId ? 'Cập nhật lễ hội' : 'Thêm mới lễ hội'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>

                {/* Toast Notification */}
                <div className={`manage-toast ${toast.type} ${toast.show ? 'show' : ''}`}>
                    <span className="material-symbols-outlined">
                        {toast.type === 'success' ? 'check_circle' : 'error'}
                    </span>
                    <span>{toast.msg}</span>
                </div>
            </div>
        </div>
    );
}
