import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { invalidateHomestaysCache } from '../ManageHomestay/ManageHomestay';
import './HomestayEdit.css';

export default function HomestayEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('active');
    const [loading, setLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        rooms: '',
        guests: '',
        description: '',
        address: '',
        city: ''
    });

    const [metaData, setMetaData] = useState({
        code: id ? `#HS-${String(id).padStart(4, '0')}` : '#HS-0001',
        createdAt: 'N/A',
        rating: 5.0,
        reviews: 0,
        hostName: 'N/A',
        hostPhone: 'N/A',
        img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=600&q=80'
    });

    // Toast state
    const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });
    
    const showToast = (msg, type = 'success') => {
        setToast({ show: true, msg, type });
        setTimeout(() => setToast({ show: false, msg: '', type: 'success' }), 3000);
    };

    const [kycDocs, setKycDocs] = useState({
        license: false,
        ownership: false,
        cccd: false
    });

    useEffect(() => {
        if (id) {
            fetchHomestay();
        }
    }, [id]);

    const fetchHomestay = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            let res = await fetch(`http://localhost:8081/api/admin/homestays/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) {
                res = await fetch(`http://localhost:8081/api/public/admin/homestays/${id}`);
            }
            if (res.ok) {
                const data = await res.json();
                const fetchedImg = data.img || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=600&q=80';
                setFormData({
                    name: data.name || '',
                    price: data.price !== undefined && data.price !== null ? data.price : '',
                    rooms: data.rooms !== undefined && data.rooms !== null ? data.rooms : '',
                    guests: data.guests !== undefined && data.guests !== null ? data.guests : '',
                    description: data.description || '',
                    address: data.address || '',
                    city: data.city || '',
                    img: fetchedImg
                });
                setStatus(data.status || 'active');
                setMetaData({
                    code: data.code || `#HS-${String(id).padStart(4, '0')}`,
                    createdAt: data.createdAt || 'N/A',
                    rating: data.rating || 5.0,
                    reviews: data.reviews || 0,
                    hostName: data.hostName || 'Chưa cập nhật',
                    hostPhone: data.hostPhone || 'Chưa cập nhật',
                    img: fetchedImg
                });
            } else {
                showToast('Không thể nạp dữ liệu homestay với ID: ' + id, 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('Lỗi kết nối máy chủ!', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDirectStatusChange = async (newStatus, statusLabel) => {
        setStatus(newStatus);
        invalidateHomestaysCache();
        showToast(`Đã chuyển trạng thái homestay thành "${statusLabel}" thành công!`, 'success');

        if (id) {
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
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: newStatus })
                    });
                }
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const url = id 
                ? `http://localhost:8081/api/admin/homestays/${id}`
                : `http://localhost:8081/api/admin/homestays`;
            const method = id ? 'PUT' : 'POST';

            const payload = {
                ...formData,
                status: status
            };

            let res = await fetch(url, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            if (!res.ok && id) {
                res = await fetch(`http://localhost:8081/api/public/admin/homestays/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }
            
            const data = await res.json();
            
            if (res.ok) {
                const targetId = id || data.id;
                if (targetId) {
                    let stRes = await fetch(`http://localhost:8081/api/admin/homestays/${targetId}/status`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ status })
                    });
                    if (!stRes.ok) {
                        await fetch(`http://localhost:8081/api/public/admin/homestays/${targetId}/status`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status })
                        });
                    }
                }
                
                invalidateHomestaysCache();
                showToast('Lưu thông tin thành công!', 'success');
                setTimeout(() => navigate('/admin/homestays'), 400);
            } else {
                let errStr = 'Có lỗi xảy ra khi lưu!';
                try {
                    if (data.message) errStr += ' ' + data.message;
                } catch(e) {}
                showToast(errStr, 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('Lỗi kết nối máy chủ!', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = (e) => {
        setStatus(e.target.value);
    };

    const toggleKyc = (doc) => {
        setKycDocs(prev => ({
            ...prev,
            [doc]: !prev[doc]
        }));
    };

    return (
        <div className="homestay-edit-wrapper">
            {/* HEADER */}
            <header className="admin-header">
                <div className="header-left">
                    <nav className="breadcrumb">
                        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/admin/homestays'); }} className="bc-link">Quản lý Homestay</a>
                        <span className="bc-sep">›</span>
                        <span className="bc-current">Chi tiết Homestay</span>
                    </nav>
                </div>
                <div className="admin-header-right">
                    <button className="btn-back" onClick={() => navigate(-1)}>
                        <span className="material-symbols-outlined">arrow_back</span> Quay lại
                    </button>
                    <button className="btn-save-header" onClick={handleSave} disabled={loading}>
                        <span className="material-symbols-outlined">save</span> {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                </div>
            </header>

            <div className="admin-content" style={{ padding: '24px' }}>
                <div className="edit-layout">
                    {/* LEFT COLUMN: meta card */}
                    <div className="edit-left">
                        {/* Thumbnail card */}
                        <div className="meta-card">
                            <div className="hs-thumb-wrap">
                                <img src={metaData.img} alt={formData.name || 'Homestay'} className="hs-thumb" />
                                <div className="thumb-overlay">
                                    <span className="material-symbols-outlined">photo_camera</span>
                                </div>
                            </div>
                            <div className="meta-info-block">
                                <div className="meta-row">
                                    <span className="meta-label">Mã Homestay</span>
                                    <span className="meta-val">{metaData.code}</span>
                                </div>
                                <div className="meta-row">
                                    <span className="meta-label">Ngày đăng ký</span>
                                    <span className="meta-val">{metaData.createdAt}</span>
                                </div>
                                <div className="meta-row">
                                    <span className="meta-label">Đánh giá</span>
                                    <span className="meta-val">{metaData.rating} <span className="material-symbols-outlined" style={{ fontSize: '12px', color: '#F59E0B' }}>star</span></span>
                                </div>
                            </div>
                        </div>

                        {/* Status card */}
                        <div className="meta-card">
                            <h4 className="card-title"><span className="material-symbols-outlined">tune</span> Quản lý trạng thái</h4>
                            <div className="form-group">
                                <label className="form-label">Trạng thái hoạt động</label>
                                <select className="form-select" value={status} onChange={handleStatusChange}>
                                    <option value="active">Đang hoạt động</option>
                                    <option value="pending">Chờ duyệt</option>
                                    <option value="suspended">Tạm khóa</option>
                                    <option value="rejected">Bị từ chối</option>
                                </select>
                            </div>
                            {status === 'suspended' || status === 'rejected' ? (
                                <div className="form-group">
                                    <label className="form-label">Lý do khóa / từ chối</label>
                                    <textarea className="form-textarea" rows="2" placeholder="Nhập lý do..."></textarea>
                                </div>
                            ) : null}
                            <div className="form-group">
                                <label className="form-label">Ghi chú nội bộ (Admin)</label>
                                <textarea className="form-textarea" rows="3" placeholder="Ghi chú chỉ hiển thị cho admin..."></textarea>
                            </div>
                            <div className="action-btns-group">
                                <button type="button" className="btn-approve-lg" onClick={() => handleDirectStatusChange('active', 'Đang hoạt động')}>
                                    <span className="material-symbols-outlined">check_circle</span> Duyệt lên sàn
                                </button>
                                <button type="button" className="btn-suspend-lg" onClick={() => handleDirectStatusChange('suspended', 'Tạm khóa')}>
                                    <span className="material-symbols-outlined">block</span> Tạm khóa
                                </button>
                            </div>
                        </div>

                        {/* Host info card */}
                        <div className="meta-card">
                            <h4 className="card-title"><span className="material-symbols-outlined">person</span> Thông tin Chủ nhà</h4>
                            <div className="host-info-row">
                                <div className="host-avatar-sm">{(metaData.hostName || 'CN').charAt(0).toUpperCase()}</div>
                                <div>
                                    <div className="host-name">{metaData.hostName}</div>
                                    <div className="host-phone">{metaData.hostPhone}</div>
                                </div>
                            </div>
                            <a href="#" className="host-link">
                                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>open_in_new</span>
                                Xem hồ sơ tài khoản
                            </a>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: form cards */}
                    <div className="edit-right">
                        {/* Card 1: Thông tin cơ bản */}
                        <div className="form-card">
                            <h4 className="card-title"><span className="material-symbols-outlined">info</span> Thông tin cơ bản</h4>
                            <div className="form-grid-2">
                                <div className="form-group full-span">
                                    <label className="form-label">Tên Homestay <span className="required">*</span></label>
                                    <input type="text" className="form-input" placeholder="Tên homestay hiển thị..." value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Giá cơ bản (đ/đêm) <span className="required">*</span></label>
                                    <input type="number" className="form-input" placeholder="450000" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Số phòng</label>
                                    <input type="number" className="form-input" placeholder="5" min="1" value={formData.rooms} onChange={e => setFormData({...formData, rooms: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Sức chứa tối đa (khách)</label>
                                    <input type="number" className="form-input" placeholder="12" min="1" value={formData.guests} onChange={e => setFormData({...formData, guests: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Giờ Check-in</label>
                                    <input type="time" className="form-input" defaultValue="14:00" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Giờ Check-out</label>
                                    <input type="time" className="form-input" defaultValue="12:00" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Mô tả ngắn</label>
                                <textarea className="form-textarea" rows="3" placeholder="Mô tả nổi bật của homestay..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
                            </div>
                            <div className="form-group">
                                <label className="form-label">URL ảnh đại diện</label>
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    placeholder="https://..." 
                                    value={formData.img || ''} 
                                    onChange={e => {
                                        const val = e.target.value;
                                        setFormData(prev => ({ ...prev, img: val }));
                                        setMetaData(prev => ({ ...prev, img: val }));
                                    }} 
                                />
                            </div>
                        </div>

                        {/* Card 2: Địa chỉ */}
                        <div className="form-card">
                            <h4 className="card-title"><span className="material-symbols-outlined">location_on</span> Địa chỉ & Khu vực</h4>
                            <div className="form-grid-2">
                                <div className="form-group full-span">
                                    <label className="form-label">Địa chỉ đầy đủ</label>
                                    <input type="text" className="form-input" placeholder="Số nhà, đường..." value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Khu vực / Tỉnh thành</label>
                                    <select className="form-select" value={formData.city || ''} onChange={e => setFormData({...formData, city: e.target.value})}>
                                        <option value="">-- Chọn khu vực --</option>
                                        <option value="Hà Giang">Hà Giang</option>
                                        <option value="Sapa">Sapa</option>
                                        <option value="Đà Lạt">Đà Lạt</option>
                                        <option value="Hội An">Hội An</option>
                                        <option value="Mai Châu">Mai Châu</option>
                                        <option value="Mộc Châu">Mộc Châu</option>
                                        <option value="Phú Quốc">Phú Quốc</option>
                                        <option value="Đà Nẵng">Đà Nẵng</option>
                                        <option value="Nha Trang">Nha Trang</option>
                                        <option value="Hạ Long">Hạ Long</option>
                                        <option value="Khác">Khác</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Card 3: Tiện nghi */}
                        <div className="form-card">
                            <h4 className="card-title"><span className="material-symbols-outlined">checklist</span> Tiện nghi & Dịch vụ</h4>
                            <div className="amenity-grid">
                                <label className="amenity-item"><input type="checkbox" defaultChecked /> <span className="material-symbols-outlined">wifi</span> WiFi miễn phí</label>
                                <label className="amenity-item"><input type="checkbox" defaultChecked /> <span className="material-symbols-outlined">kitchen</span> Bếp nấu ăn</label>
                                <label className="amenity-item"><input type="checkbox" /> <span className="material-symbols-outlined">cleaning_services</span> Giặt / Dọn phòng</label>
                                <label className="amenity-item"><input type="checkbox" defaultChecked /> <span className="material-symbols-outlined">ac_unit</span> Điều hòa</label>
                                <label className="amenity-item"><input type="checkbox" /> <span className="material-symbols-outlined">fireplace</span> Lò sưởi</label>
                                <label className="amenity-item"><input type="checkbox" /> <span className="material-symbols-outlined">hot_tub</span> Bồn tắm nước nóng</label>
                                <label className="amenity-item"><input type="checkbox" defaultChecked /> <span className="material-symbols-outlined">outdoor_grill</span> Khu BBQ ngoài trời</label>
                                <label className="amenity-item"><input type="checkbox" defaultChecked /> <span className="material-symbols-outlined">landscape</span> View thiên nhiên đẹp</label>
                                <label className="amenity-item"><input type="checkbox" /> <span className="material-symbols-outlined">pool</span> Hồ bơi / Bể tắm</label>
                                <label className="amenity-item"><input type="checkbox" /> <span className="material-symbols-outlined">directions_boat</span> Bến thuyền / Cano</label>
                                <label className="amenity-item"><input type="checkbox" /> <span className="material-symbols-outlined">sports_tennis</span> Sân chơi / Thể thao</label>
                                <label className="amenity-item"><input type="checkbox" defaultChecked /> <span className="material-symbols-outlined">two_wheeler</span> Cho thuê xe / Phương tiện</label>
                            </div>
                        </div>

                        {/* Card 4: Chính sách */}
                        <div className="form-card">
                            <h4 className="card-title"><span className="material-symbols-outlined">policy</span> Chính sách & Quy định</h4>
                            <div className="form-group">
                                <label className="form-label">Chính sách phòng / Nội quy</label>
                                <textarea className="form-textarea" rows="3" placeholder="Ví dụ: Không hút thuốc. Không mang thú nuôi. Giờ yên tĩnh sau 22h..." defaultValue="Không mang theo thú cưng, giữ yên tĩnh sau 22:00."></textarea>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Chính sách hoàn tiền / Hủy phòng</label>
                                <select className="form-select" defaultValue="moderate">
                                    <option value="flexible">Linh hoạt — Hoàn tiền đầy đủ trước 24h</option>
                                    <option value="moderate">Vừa phải — Hoàn tiền 50% trước 5 ngày</option>
                                    <option value="strict">Nghiêm ngặt — Không hoàn tiền sau khi đặt</option>
                                    <option value="custom">Tùy chỉnh</option>
                                </select>
                            </div>
                        </div>

                        {/* Card 5: Giấy tờ & Xác minh */}
                        <div className="form-card">
                            <h4 className="card-title"><span className="material-symbols-outlined">verified</span> Giấy tờ & Xác minh</h4>
                            <div className="form-grid-2">
                                <div className="form-group">
                                    <label className="form-label">Số Giấy phép kinh doanh</label>
                                    <input type="text" className="form-input" placeholder="GPKD-..." defaultValue="GPKD-2023-8889" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Mã số thuế</label>
                                    <input type="text" className="form-input" placeholder="0123456789" defaultValue="0312567980" />
                                </div>
                            </div>
                            <div className="kyc-checklist">
                                <div className="kyc-item">
                                    <span className={`material-symbols-outlined kyc-icon ${kycDocs.license ? 'verified' : 'unverified'}`}>
                                        {kycDocs.license ? 'check_circle' : 'radio_button_unchecked'}
                                    </span>
                                    <div>
                                        <div className="kyc-title">Giấy phép kinh doanh</div>
                                        <div className="kyc-sub">{kycDocs.license ? 'Đã xác minh' : 'Chưa xác minh'}</div>
                                    </div>
                                    <button className={`btn-kyc-verify ${kycDocs.license ? 'revoke' : ''}`} onClick={() => toggleKyc('license')}>
                                        {kycDocs.license ? 'Hủy' : 'Xác minh'}
                                    </button>
                                </div>
                                <div className="kyc-item">
                                    <span className={`material-symbols-outlined kyc-icon ${kycDocs.ownership ? 'verified' : 'unverified'}`}>
                                        {kycDocs.ownership ? 'check_circle' : 'radio_button_unchecked'}
                                    </span>
                                    <div>
                                        <div className="kyc-title">Giấy tờ sở hữu / thuê nhà</div>
                                        <div className="kyc-sub">{kycDocs.ownership ? 'Đã xác minh' : 'Chưa xác minh'}</div>
                                    </div>
                                    <button className={`btn-kyc-verify ${kycDocs.ownership ? 'revoke' : ''}`} onClick={() => toggleKyc('ownership')}>
                                        {kycDocs.ownership ? 'Hủy' : 'Xác minh'}
                                    </button>
                                </div>
                                <div className="kyc-item">
                                    <span className={`material-symbols-outlined kyc-icon ${kycDocs.cccd ? 'verified' : 'unverified'}`}>
                                        {kycDocs.cccd ? 'check_circle' : 'radio_button_unchecked'}
                                    </span>
                                    <div>
                                        <div className="kyc-title">CCCD / Hộ chiếu Chủ nhà</div>
                                        <div className="kyc-sub">{kycDocs.cccd ? 'Đã xác minh' : 'Chưa xác minh'}</div>
                                    </div>
                                    <button className={`btn-kyc-verify ${kycDocs.cccd ? 'revoke' : ''}`} onClick={() => toggleKyc('cccd')}>
                                        {kycDocs.cccd ? 'Hủy' : 'Xác minh'}
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* STICKY SAVE BAR */}
            <div className="sticky-save-bar">
                <span className="save-bar-info">Chỉnh sửa thông tin homestay</span>
                <div className="save-bar-btns">
                    <button className="btn-cancel-bar" onClick={() => navigate(-1)}>Hủy</button>
                    <button className="btn-save-bar" onClick={handleSave}>
                        <span className="material-symbols-outlined">save</span> Lưu thay đổi
                    </button>
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
