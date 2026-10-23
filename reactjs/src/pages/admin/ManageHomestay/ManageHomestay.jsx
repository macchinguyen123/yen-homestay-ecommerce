import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../../services/authService';
import './ManageHomestay.css';

let homestaysCache = null;
try {
    const saved = sessionStorage.getItem('admin_homestays_cache');
    if (saved) homestaysCache = JSON.parse(saved);
} catch (e) {}

export function invalidateHomestaysCache() {
    homestaysCache = null;
    try {
        sessionStorage.removeItem('admin_homestays_cache');
    } catch (e) {}
}

// Hàm chuẩn hóa loại bỏ dấu tiếng Việt để tìm kiếm thông minh
function removeVietnameseTones(str) {
    if (!str) return '';
    let s = String(str).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    s = s.replace(/đ/g, 'd').replace(/Đ/g, 'd');
    return s.toLowerCase().trim();
}

export default function ManageHomestay() {
    const navigate = useNavigate();
    const [list, setList] = useState(homestaysCache || []);
    const [loading, setLoading] = useState(!homestaysCache);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRegion, setFilterRegion] = useState('all');
    

    // Toast state
    const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });
    
    const showToast = (msg, type = 'success') => {
        setToast({ show: true, msg, type });
        setTimeout(() => setToast({ show: false, msg: '', type: 'success' }), 3000);
    };

    const fetchHomestays = async (isSilent = false) => {
        if (!isSilent && !homestaysCache) {
            setLoading(true);
        }
        try {
            const token = localStorage.getItem('token');
            let response = await fetch('http://localhost:8081/api/admin/homestays', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                response = await fetch('http://localhost:8081/api/public/admin/homestays');
            }
            if (response.ok) {
                const data = await response.json();
                homestaysCache = data;
                try {
                    sessionStorage.setItem('admin_homestays_cache', JSON.stringify(data));
                } catch (e) {}
                setList(data);
            }
        } catch (error) {
            console.error('Error fetching homestays:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHomestays(Boolean(homestaysCache));
    }, []);

    const handleAction = async (id, newStatus, newStatusText) => {
        const updatedList = list.map(item => {
            if (item.id === id) {
                return { ...item, status: newStatus, statusText: newStatusText };
            }
            return item;
        });
        homestaysCache = updatedList;
        try {
            sessionStorage.setItem('admin_homestays_cache', JSON.stringify(updatedList));
        } catch (e) {}
        setList(updatedList);
        showToast(`Đã cập nhật trạng thái homestay thành "${newStatusText}" thành công!`, 'success');

        try {
            const token = localStorage.getItem('token');
            let response = await fetch(`http://localhost:8081/api/admin/homestays/${id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) {
                await fetch(`http://localhost:8081/api/public/admin/homestays/${id}/status`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ status: newStatus })
                });
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };


    // Lọc tìm kiếm không phân biệt tiếng Việt có dấu hay không dấu
    const filteredData = useMemo(() => {
        return list.filter(item => {
            const matchStatus = filterStatus === 'all' || item.status === filterStatus;
            const matchRegion = filterRegion === 'all' || (item.region || '') === filterRegion;

            if (!searchTerm.trim()) {
                return matchStatus && matchRegion;
            }

            const q = searchTerm.toLowerCase().trim();
            const qNoTone = removeVietnameseTones(q);

            const nameNoTone = removeVietnameseTones(item.name);
            const hostNoTone = removeVietnameseTones(item.host);
            const codeNoTone = removeVietnameseTones(item.code);
            const regionNoTone = removeVietnameseTones(item.region);
            const phoneStr = String(item.phone || '');
            const priceStr = String(item.price || '');

            const matchSearch =
                nameNoTone.includes(qNoTone) || (item.name || '').toLowerCase().includes(q) ||
                hostNoTone.includes(qNoTone) || (item.host || '').toLowerCase().includes(q) ||
                codeNoTone.includes(qNoTone) || (item.code || '').toLowerCase().includes(q) ||
                regionNoTone.includes(qNoTone) || (item.region || '').toLowerCase().includes(q) ||
                phoneStr.includes(q) ||
                priceStr.includes(q);

            return matchStatus && matchRegion && matchSearch;
        });
    }, [list, filterStatus, filterRegion, searchTerm]);

    // Cấu hình phân trang chuyên nghiệp cho Admin
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    // Reset về trang 1 khi thay đổi điều kiện lọc, tìm kiếm hoặc kích thước trang
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterStatus, filterRegion, pageSize]);

    const totalItems = filteredData.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

    const paginatedData = useMemo(() => {
        const start = (safeCurrentPage - 1) * pageSize;
        return filteredData.slice(start, start + pageSize);
    }, [filteredData, safeCurrentPage, pageSize]);

    const pageStart = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
    const pageEnd = Math.min(safeCurrentPage * pageSize, totalItems);

    // Thuật toán hiển thị danh sách số trang thông minh (có dấu ...)
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

    const uniqueRegions = Array.from(new Set(list.map(item => item.region).filter(r => r && r !== 'N/A')));

    const activeCount = list.filter(x => x.status === 'active').length;
    const pendingCount = list.filter(x => x.status === 'pending').length;
    const suspendedCount = list.filter(x => x.status === 'suspended').length;
    const rejectedCount = list.filter(x => x.status === 'rejected').length;

    return (
        <div className="manage-homestay-wrapper">
            <div className="admin-content" style={{ padding: 0 }}>
                {/* Page header */}
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Quản lý Homestay &amp; Phòng</h1>
                        <p className="page-sub">Duyệt, giám sát, tìm kiếm và quản lý toàn bộ danh sách homestay &amp; phòng trên nền tảng YÊN</p>
                    </div>
                </div>

                {/* Stat cards */}
                <div className="stats-row">
                    <div className="stat-box">
                        <div>
                            <div className="stat-num">{list.length}</div>
                            <div className="stat-lbl">Tổng Homestay</div>
                        </div>
                        <span className="material-symbols-outlined stat-icon">cottage</span>
                    </div>
                    <div className="stat-box green">
                        <div>
                            <div className="stat-num">{activeCount}</div>
                            <div className="stat-lbl">Đang hoạt động</div>
                        </div>
                        <span className="material-symbols-outlined stat-icon">check_circle</span>
                    </div>
                    <div className="stat-box orange">
                        <div>
                            <div className="stat-num">{pendingCount}</div>
                            <div className="stat-lbl">Chờ duyệt</div>
                        </div>
                        <span className="material-symbols-outlined stat-icon">schedule</span>
                    </div>
                    <div className="stat-box gray">
                        <div>
                            <div className="stat-num">{suspendedCount}</div>
                            <div className="stat-lbl">Tạm khóa</div>
                        </div>
                        <span className="material-symbols-outlined stat-icon">lock</span>
                    </div>
                    <div className="stat-box red">
                        <div>
                            <div className="stat-num">{rejectedCount}</div>
                            <div className="stat-lbl">Bị từ chối</div>
                        </div>
                        <span className="material-symbols-outlined stat-icon">cancel</span>
                    </div>
                </div>

                {/* Filter bar */}
                <div className="filter-bar">
                    <div className="filter-chips">
                        <button className={`chip-btn ${filterStatus === 'all' ? 'active' : ''}`} onClick={() => setFilterStatus('all')}>Tất cả ({list.length})</button>
                        <button className={`chip-btn ${filterStatus === 'active' ? 'active' : ''}`} onClick={() => setFilterStatus('active')}>Đang hoạt động ({activeCount})</button>
                        <button className={`chip-btn ${filterStatus === 'pending' ? 'active' : ''}`} onClick={() => setFilterStatus('pending')}>Chờ duyệt ({pendingCount})</button>
                        <button className={`chip-btn ${filterStatus === 'suspended' ? 'active' : ''}`} onClick={() => setFilterStatus('suspended')}>Tạm khóa ({suspendedCount})</button>
                        <button className={`chip-btn ${filterStatus === 'rejected' ? 'active' : ''}`} onClick={() => setFilterStatus('rejected')}>Bị từ chối ({rejectedCount})</button>
                    </div>
                    <div className="filter-right">
                        <div className="search-input-wrap">
                            <span className="material-symbols-outlined">search</span>
                            <input
                                type="text"
                                placeholder="Tìm tên homestay, chủ nhà, mã phòng..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select className="select-region" value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)}>
                            <option value="all">Tất cả khu vực</option>
                            {uniqueRegions.map((region, idx) => (
                                <option key={idx} value={region}>{region}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="data-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Homestay / Phòng</th>
                                <th>Chủ nhà</th>
                                <th>Khu vực</th>
                                <th>Số phòng</th>
                                <th>Ngày đăng ký</th>
                                <th>Trạng thái</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', padding: '50px' }}>
                                        <div className="spinner-border text-success" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: 'center', color: '#94A3B8', padding: '40px' }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '32px', color: '#cbd5e1', display: 'block', marginBottom: '8px' }}>search_off</span>
                                        Không tìm thấy dữ liệu nào phù hợp với từ khóa "{searchTerm}".
                                    </td>
                                </tr>
                            ) : (
                                paginatedData.map(item => (
                                    <tr key={item.id}>
                                        <td>
                                            <div className="homestay-meta" onClick={() => navigate(`/admin/homestays/edit/${item.id}`)} style={{ cursor: 'pointer' }}>
                                                <img src={item.img} className="homestay-img" alt={item.name} />
                                                <div>
                                                    <div className="homestay-title">{item.name}</div>
                                                    <div className="homestay-sub">Mã: {item.code} &bull; {item.price}/đêm</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <strong>{item.host}</strong>
                                            <div style={{ fontSize: '11.5px', color: '#64748B' }}>{item.phone}</div>
                                        </td>
                                        <td>{item.region}</td>
                                        <td style={{ textAlign: 'center', fontWeight: 600, color: '#15803D' }}>{item.rooms || '-'}</td>
                                        <td style={{ color: '#64748B', fontSize: '12.5px' }}>{item.date}</td>
                                        <td><span className={`status-chip ${item.status}`}>{item.statusText || 'Đang hoạt động'}</span></td>
                                        <td className="action-col">
                                            <button className="btn-action" onClick={() => navigate(`/admin/homestays/edit/${item.id}`)}>
                                                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>edit</span> Xem &amp; Sửa
                                            </button>
                                            
                                            {item.status === 'pending' && (
                                                <button className="btn-approve" onClick={() => handleAction(item.id, 'active', 'Đang hoạt động')}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>check</span> Duyệt
                                                </button>
                                            )}

                                            {item.status === 'active' && (
                                                <button className="btn-suspend" onClick={() => handleAction(item.id, 'suspended', 'Tạm khóa')}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>block</span> Tạm khóa
                                                </button>
                                            )}

                                            {item.status === 'suspended' && (
                                                <button className="btn-approve" onClick={() => handleAction(item.id, 'active', 'Đang hoạt động')}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>lock_open</span> Mở khóa
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* THANH PHÂN TRANG */}
                <div className="homestay-pagination-bar">
                    <div className="homestay-pagination-info">
                        {totalItems > 0 ? (
                            <span>
                                Hiển thị <b>{pageStart} - {pageEnd}</b> trong tổng số <b>{totalItems}</b> homestay
                            </span>
                        ) : (
                            <span>Không có homestay nào</span>
                        )}

                        <div className="homestay-page-size-selector">
                            <label htmlFor="pageSizeSelect">Hiển thị:</label>
                            <select
                                id="pageSizeSelect"
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                            >
                                <option value={10}>10 / trang</option>
                                <option value={20}>20 / trang</option>
                                <option value={50}>50 / trang</option>
                            </select>
                        </div>
                    </div>

                    {totalPages > 1 && (
                        <div className="homestay-pagination-controls">
                            <button
                                type="button"
                                className="pagination-btn pagination-btn--nav"
                                disabled={safeCurrentPage === 1}
                                onClick={() => setCurrentPage(1)}
                                title="Về trang đầu"
                            >
                                <span className="material-symbols-outlined">first_page</span>
                            </button>

                            <button
                                type="button"
                                className="pagination-btn pagination-btn--nav"
                                disabled={safeCurrentPage === 1}
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                title="Trang trước"
                            >
                                <span className="material-symbols-outlined">chevron_left</span>
                                <span>Trước</span>
                            </button>

                            <div className="pagination-pages-list">
                                {pageNumbers.map((p, idx) => {
                                    if (p === '...') {
                                        return <span key={`ellipsis-${idx}`} className="pagination-ellipsis">…</span>;
                                    }
                                    const isActive = p === safeCurrentPage;
                                    return (
                                        <button
                                            key={p}
                                            type="button"
                                            className={`pagination-btn pagination-btn--num ${isActive ? 'active' : ''}`}
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
                                disabled={safeCurrentPage === totalPages}
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                title="Trang tiếp theo"
                            >
                                <span>Sau</span>
                                <span className="material-symbols-outlined">chevron_right</span>
                            </button>

                            <button
                                type="button"
                                className="pagination-btn pagination-btn--nav"
                                disabled={safeCurrentPage === totalPages}
                                onClick={() => setCurrentPage(totalPages)}
                                title="Đến trang cuối"
                            >
                                <span className="material-symbols-outlined">last_page</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>


            {/* Toast Notification UI */}
            <div className={`manage-toast ${toast.show ? 'show' : ''} ${toast.type}`}>
                <span className="material-symbols-outlined">
                    {toast.type === 'success' ? 'check_circle' : 'error'}
                </span>
                <span>{toast.msg}</span>
            </div>
        </div>
    );
}
