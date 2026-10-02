import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ManageHomestay.css';

const defaultList = [
    {
        id: 1,
        code: "#HS-1042",
        name: "Homestay Nhà Trình Tường Hà Giang",
        host: "Nguyễn Văn Minh",
        hostId: "USR001",
        phone: "0912 345 678",
        email: "nguyenvanminh@email.com",
        region: "Hà Giang",
        price: "450.000đ",
        date: "15/01/2026",
        status: "active",
        statusText: "Đang hoạt động",
        rooms: 5,
        img: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=400&q=80",
    },
    {
        id: 2,
        code: "#HS-2073",
        name: "Sapa Valley Retreat",
        host: "Trần Thị Lan",
        hostId: "USR002",
        phone: "0934 567 890",
        email: "tranthilan@email.com",
        region: "Sapa",
        price: "680.000đ",
        date: "03/03/2026",
        status: "pending",
        statusText: "Chờ duyệt",
        rooms: 8,
        img: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=400&q=80",
    },
    {
        id: 3,
        code: "#HS-3018",
        name: "Đà Lạt Pine Garden",
        host: "Lê Quang Huy",
        hostId: "USR003",
        phone: "0901 234 567",
        email: "lequanghuy@email.com",
        region: "Đà Lạt",
        price: "750.000đ",
        date: "10/02/2026",
        status: "active",
        statusText: "Đang hoạt động",
        rooms: 6,
        img: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=400&q=80",
    },
    {
        id: 4,
        code: "#HS-4055",
        name: "Hội An River House",
        host: "Phạm Thị Thu",
        hostId: "USR004",
        phone: "0978 654 321",
        email: "phamthithu@email.com",
        region: "Hội An",
        price: "890.000đ",
        date: "20/04/2026",
        status: "pending",
        statusText: "Chờ duyệt",
        rooms: 10,
        img: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=400&q=80",
    },
    {
        id: 5,
        code: "#HS-4821",
        name: "Mộc Châu Cloud Farm",
        host: "Hoàng Đức Anh",
        hostId: "USR005",
        phone: "0856 789 012",
        email: "hoanganh@email.com",
        region: "Mai Châu",
        price: "420.000đ",
        date: "28/04/2026",
        status: "active",
        statusText: "Đang hoạt động",
        rooms: 7,
        img: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=400&q=80",
    },
    {
        id: 6,
        code: "#HS-5109",
        name: "Mai Châu Green Lodge",
        host: "Bùi Văn Nam",
        hostId: "USR006",
        phone: "0915 667 889",
        email: "buivannam@email.com",
        region: "Mai Châu",
        price: "550.000đ",
        date: "01/05/2026",
        status: "suspended",
        statusText: "Tạm khóa",
        rooms: 4,
        img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80",
    }
];

export default function ManageHomestay() {
    const navigate = useNavigate();
    const [list, setList] = useState(defaultList);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRegion, setFilterRegion] = useState('all');

    const handleAction = (id, newStatus, newStatusText) => {
        setList(prev => prev.map(item => {
            if (item.id === id) {
                return { ...item, status: newStatus, statusText: newStatusText };
            }
            return item;
        }));
    };

    const filteredData = list.filter(item => {
        const matchStatus = filterStatus === 'all' || item.status === filterStatus;
        const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
            || item.host.toLowerCase().includes(searchTerm.toLowerCase())
            || item.code.toLowerCase().includes(searchTerm.toLowerCase());
        const matchRegion = filterRegion === 'all' || item.region === filterRegion;
        return matchStatus && matchSearch && matchRegion;
    });

    const activeCount = list.filter(x => x.status === 'active').length;
    const pendingCount = list.filter(x => x.status === 'pending').length;
    const suspendedCount = list.filter(x => x.status === 'suspended').length;

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
                    <div className="stat-box red">
                        <div>
                            <div className="stat-num">{suspendedCount}</div>
                            <div className="stat-lbl">Tạm khóa</div>
                        </div>
                        <span className="material-symbols-outlined stat-icon">block</span>
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
                            {filteredData.length === 0 ? (
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
