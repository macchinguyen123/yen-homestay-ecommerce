import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../../services/authService';
import './ManageHomestay.css';

let homestaysCache = null;

export function invalidateHomestaysCache() {
    homestaysCache = null;
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
    
    // Modal state cho Thêm mới Homestay / Phòng
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newHsData, setNewHsData] = useState({
        name: '',
        code: '',
        host: '',
        phone: '',
        region: 'Đà Lạt',
        price: '900.000₫',
        rooms: 5,
        description: '',
        img: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80'
    });

    // Toast state
    const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });
    
    const showToast = (msg, type = 'success') => {
        setToast({ show: true, msg, type });
        setTimeout(() => setToast({ show: false, msg: '', type: 'success' }), 3000);
    };

    const fetchHomestays = async () => {
        if (!homestaysCache) {
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
                setList(data);
            }
        } catch (error) {
            console.error('Error fetching homestays:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHomestays();
    }, []);

    const handleAction = async (id, newStatus, newStatusText) => {
        const updatedList = list.map(item => {
            if (item.id === id) {
                return { ...item, status: newStatus, statusText: newStatusText };
            }
            return item;
        });
        homestaysCache = updatedList;
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

    // Tạo homestay / phòng mới
    const handleSaveNewHomestay = async (e) => {
        e.preventDefault();
        if (!newHsData.name.trim()) {
            showToast('Vui lòng nhập tên homestay / phòng mới!', 'error');
            return;
        }

        const generatedId = Date.now();
        const codeVal = newHsData.code.trim() || `#HS-${String(generatedId).slice(-4)}`;
        const newItem = {
            id: generatedId,
            name: newHsData.name,
            code: codeVal,
            host: newHsData.host || 'Chủ nhà mới',
            phone: newHsData.phone || '0901234567',
            region: newHsData.region,
            price: newHsData.price,
            rooms: Number(newHsData.rooms) || 1,
            date: new Date().toLocaleDateString('vi-VN'),
            status: 'active',
            statusText: 'Đang hoạt động',
            img: newHsData.img
        };

        try {
            const token = localStorage.getItem('token');
            await fetch('http://localhost:8081/api/admin/homestays', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newItem)
            });
        } catch (err) {
            console.error('Async create homestay error:', err);
        }

        const updated = [newItem, ...list];
        setList(updated);
        homestaysCache = updated;
        setIsAddModalOpen(false);
        setSearchTerm('');
        showToast(`🎉 Đã thêm mới thành công "${newItem.name}" vào danh sách!`, 'success');

        // Reset Form
        setNewHsData({
            name: '',
            code: '',
            host: '',
            phone: '',
            region: 'Đà Lạt',
            price: '900.000₫',
            rooms: 5,
            description: '',
            img: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80'
        });
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

    // Phân trang 6 homestay mỗi trang
    const ITEMS_PER_PAGE = 6;
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterStatus, filterRegion]);

    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE) || 1;

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredData.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredData, currentPage]);

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
                    <button type="button" className="btn-add-new" onClick={() => setIsAddModalOpen(true)}>
                        <span className="material-symbols-outlined">add_circle</span> Thêm mới Homestay / Phòng
                    </button>
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
                {totalPages > 1 && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: '16px',
                        padding: '12px 18px',
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                    }}>
                        <div style={{ fontSize: '13px', color: '#64748b' }}>
                            Hiển thị {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredData.length)} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)} trong tổng số {filteredData.length} homestay
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                                type="button"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid #cbd5e1',
                                    background: '#ffffff',
                                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                    opacity: currentPage === 1 ? 0.5 : 1,
                                    fontSize: '13px',
                                    fontWeight: 600
                                }}
                            >
                                ‹ Trước
                            </button>
                            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(p => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setCurrentPage(p)}
                                    style={{
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        border: p === currentPage ? '1px solid #15803D' : '1px solid #cbd5e1',
                                        background: p === currentPage ? '#15803D' : '#ffffff',
                                        color: p === currentPage ? '#ffffff' : '#334155',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        fontWeight: 600
                                    }}
                                >
                                    {p}
                                </button>
                            ))}
                            <button
                                type="button"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid #cbd5e1',
                                    background: '#ffffff',
                                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                    opacity: currentPage === totalPages ? 0.5 : 1,
                                    fontSize: '13px',
                                    fontWeight: 600
                                }}
                            >
                                Sau ›
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL THÊM MỚI HOMESTAY / PHÒNG */}
            {isAddModalOpen && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.65)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }}>
                    <div style={{
                        background: '#ffffff',
                        borderRadius: '14px',
                        width: '100%',
                        maxWidth: '560px',
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            padding: '18px 24px',
                            borderBottom: '1px solid #f1f5f9',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: '#f8fafc'
                        }}>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className="material-symbols-outlined text-emerald-700">cottage</span>
                                Thêm Homestay / Phòng mới
                            </h3>
                            <button type="button" onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#64748b' }}>
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleSaveNewHomestay} style={{ padding: '24px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '14px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Tên Homestay / Phòng (*)</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Ví dụ: Yên Garden Villa"
                                        value={newHsData.name}
                                        onChange={(e) => setNewHsData({ ...newHsData, name: e.target.value })}
                                        style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Mã định danh (Code)</label>
                                    <input
                                        type="text"
                                        placeholder="Tự động nếu để trống (ví dụ: #HS-102)"
                                        value={newHsData.code}
                                        onChange={(e) => setNewHsData({ ...newHsData, code: e.target.value })}
                                        style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '14px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Họ tên chủ nhà</label>
                                    <input
                                        type="text"
                                        placeholder="Ví dụ: Nguyễn Văn A"
                                        value={newHsData.host}
                                        onChange={(e) => setNewHsData({ ...newHsData, host: e.target.value })}
                                        style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Số điện thoại liên hệ</label>
                                    <input
                                        type="text"
                                        placeholder="Ví dụ: 0912345678"
                                        value={newHsData.phone}
                                        onChange={(e) => setNewHsData({ ...newHsData, phone: e.target.value })}
                                        style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Khu vực</label>
                                    <select
                                        value={newHsData.region}
                                        onChange={(e) => setNewHsData({ ...newHsData, region: e.target.value })}
                                        style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                    >
                                        <option value="Đà Lạt">Đà Lạt</option>
                                        <option value="Sa Pa">Sa Pa</option>
                                        <option value="Ninh Bình">Ninh Bình</option>
                                        <option value="Phú Quốc">Phú Quốc</option>
                                        <option value="Huế">Huế</option>
                                        <option value="Hà Giang">Hà Giang</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Giá / Đêm</label>
                                    <input
                                        type="text"
                                        placeholder="950.000₫"
                                        value={newHsData.price}
                                        onChange={(e) => setNewHsData({ ...newHsData, price: e.target.value })}
                                        style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Số lượng phòng</label>
                                    <input
                                        type="number"
                                        value={newHsData.rooms}
                                        onChange={(e) => setNewHsData({ ...newHsData, rooms: e.target.value })}
                                        style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>Link ảnh đại diện (URL)</label>
                                <input
                                    type="text"
                                    value={newHsData.img}
                                    onChange={(e) => setNewHsData({ ...newHsData, img: e.target.value })}
                                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', background: '#15803D', color: '#ffffff', cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}
                                >
                                    Lưu homestay / phòng mới
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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
