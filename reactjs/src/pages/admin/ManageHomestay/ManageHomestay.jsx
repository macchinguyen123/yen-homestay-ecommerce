import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../../services/authService';
import './ManageHomestay.css';

export default function ManageHomestay() {
    const navigate = useNavigate();
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRegion, setFilterRegion] = useState('all');

    const fetchHomestays = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:8081/api/admin/homestays', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
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
        if (!window.confirm(`Bạn có chắc muốn chuyển trạng thái sang "${newStatusText}"?`)) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8081/api/admin/homestays/${id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                // Update local state instead of refetching for performance
                setList(prev => prev.map(item => {
                    if (item.id === id) {
                        return { ...item, status: newStatus, statusText: newStatusText };
                    }
                    return item;
                }));
            } else {
                alert('Có lỗi xảy ra khi cập nhật trạng thái');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Lỗi kết nối máy chủ');
        }
    };

    const filteredData = list.filter(item => {
        const matchStatus = filterStatus === 'all' || item.status === filterStatus;
        const matchSearch = (item.name || '').toLowerCase().includes(searchTerm.toLowerCase())
            || (item.host || '').toLowerCase().includes(searchTerm.toLowerCase())
            || (item.code || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchRegion = filterRegion === 'all' || (item.region || '').toLowerCase().includes(filterRegion.toLowerCase());
        return matchStatus && matchSearch && matchRegion;
    });

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
                        <h1 className="page-title">Quản lý Homestay</h1>
                        <p className="page-sub">Duyệt, giám sát và quản lý toàn bộ danh sách homestay trên nền tảng YÊN</p>
                    </div>
                    <button className="btn-add-new" onClick={() => navigate('/admin/homestays/edit')}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
                        Thêm Homestay Mới
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
                        <button className={`chip-btn ${filterStatus === 'all' ? 'active' : ''}`} onClick={() => setFilterStatus('all')}>Tất cả</button>
                        <button className={`chip-btn ${filterStatus === 'active' ? 'active' : ''}`} onClick={() => setFilterStatus('active')}>Đang hoạt động</button>
                        <button className={`chip-btn ${filterStatus === 'pending' ? 'active' : ''}`} onClick={() => setFilterStatus('pending')}>Chờ duyệt</button>
                        <button className={`chip-btn ${filterStatus === 'suspended' ? 'active' : ''}`} onClick={() => setFilterStatus('suspended')}>Tạm khóa</button>
                        <button className={`chip-btn ${filterStatus === 'rejected' ? 'active' : ''}`} onClick={() => setFilterStatus('rejected')}>Bị từ chối</button>
                    </div>
                    <div className="filter-right">
                        <div className="search-input-wrap">
                            <span className="material-symbols-outlined">search</span>
                            <input type="text" placeholder="Tìm tên, chủ nhà, mã..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                        <select className="select-region" value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)}>
                            <option value="all">Tất cả khu vực</option>
                            <option value="Hà Giang">Hà Giang</option>
                            <option value="Sapa">Sapa</option>
                            <option value="Đà Lạt">Đà Lạt</option>
                            <option value="Hội An">Hội An</option>
                            <option value="Mai Châu">Mai Châu</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="data-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Homestay</th>
                                <th>Chủ nhà</th>
                                <th>Khu vực</th>
                                <th>Phòng</th>
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
                                    <td colSpan="7" style={{ textAlign: 'center', color: '#94A3B8', padding: '30px' }}>Không tìm thấy dữ liệu phù hợp.</td>
                                </tr>
                            ) : (
                                filteredData.map(item => (
                                    <tr key={item.id}>
                                        <td>
                                            <div className="homestay-meta" onClick={() => navigate('/admin/homestays/edit')} style={{ cursor: 'pointer' }}>
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
                                        <td><span className={`status-chip ${item.status}`}>{item.statusText}</span></td>
                                        <td className="action-col">
                                            <button className="btn-action" onClick={() => navigate('/admin/homestays/edit')}>
                                                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>edit</span> Xem & Sửa
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

            </div>
        </div>
    );
}
