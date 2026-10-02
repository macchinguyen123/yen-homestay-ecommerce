import { useState, useEffect } from 'react';
import './ManageService.css';
import {
  INITIAL_SERVICES,
  INITIAL_NOTES,
  CATEGORIES,
  POPULAR_STATS,
  formatVND
} from './manageServiceData';

export default function ManageService() {
  // ─── LocalStorage Persistence ─────────────────────────────────
  const [services, setServices] = useState(() => {
    try {
      const saved = localStorage.getItem('owner_services_data');
      return saved ? JSON.parse(saved) : INITIAL_SERVICES;
    } catch {
      return INITIAL_SERVICES;
    }
  });

  const [notes, setNotes] = useState(() => {
    try {
      const saved = localStorage.getItem('owner_service_notes');
      return saved ? JSON.parse(saved) : INITIAL_NOTES;
    } catch {
      return INITIAL_NOTES;
    }
  });

  useEffect(() => {
    localStorage.setItem('owner_services_data', JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    localStorage.setItem('owner_service_notes', JSON.stringify(notes));
  }, [notes]);

  // ─── Filter & Search States ───────────────────────────────────
  const [selectedCat, setSelectedCat] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('');

  // ─── Toast Notification ───────────────────────────────────────
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ─── Modals State ─────────────────────────────────────────────
  const [activeModal, setActiveModal] = useState(null); // 'price' | 'combo' | 'service' | 'note'

  // Form states
  const [priceForm, setPriceForm] = useState({ serviceId: '', price: '' });
  const [serviceForm, setServiceForm] = useState({
    id: null,
    name: '',
    category: 'food',
    status: 'Đang phục vụ',
    price: '',
    unit: '',
    description: '',
    image: ''
  });
  const [comboForm, setComboForm] = useState({
    id: null,
    name: '',
    price: '',
    image: '',
    linkedServices: []
  });
  const [noteForm, setNoteForm] = useState({
    id: null,
    icon: 'soup_kitchen',
    title: '',
    content: ''
  });

  // ─── Handlers: Status Toggle ─────────────────────────────────
  const handleToggleStatus = (id) => {
    setServices((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const nextStatus = s.status === 'Tạm ngưng' ? 'Đang phục vụ' : 'Tạm ngưng';
          return { ...s, status: nextStatus };
        }
        return s;
      })
    );
    showToast('Đã cập nhật trạng thái dịch vụ');
  };

  // ─── Handlers: Delete Service ────────────────────────────────
  const handleDeleteService = (id, name) => {
    // Check if service is linked to any active combo
    const linkedCombo = services.find(
      (s) => s.category === 'combo' && (s.linkedServices || []).includes(id)
    );
    if (linkedCombo) {
      alert(
        `Không thể xóa "${name}" vì đang thuộc Combo "${linkedCombo.name}". Hãy sửa Combo để bỏ dịch vụ này trước!`
      );
      return;
    }

    if (window.confirm(`Bạn có chắc chắn muốn xóa dịch vụ "${name}"?`)) {
      setServices((prev) => prev.filter((s) => s.id !== id));
      showToast(`Đã xóa dịch vụ "${name}"`);
    }
  };

  // ─── Handlers: Modal Opens ───────────────────────────────────
  const openPriceModal = () => {
    const nonCombo = services.filter((s) => s.category !== 'combo');
    if (nonCombo.length > 0) {
      setPriceForm({ serviceId: nonCombo[0].id, price: nonCombo[0].price });
    }
    setActiveModal('price');
  };

  const openAddServiceModal = () => {
    setServiceForm({
      id: null,
      name: '',
      category: 'food',
      status: 'Đang phục vụ',
      price: '',
      unit: '',
      description: '',
      image: ''
    });
    setActiveModal('service');
  };

  const openEditServiceModal = (item) => {
    if (item.category === 'combo') {
      setComboForm({
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image || '',
        linkedServices: item.linkedServices || []
      });
      setActiveModal('combo');
    } else {
      setServiceForm({
        id: item.id,
        name: item.name,
        category: item.category,
        status: item.status,
        price: item.price,
        unit: item.unit,
        description: item.description,
        image: item.image || ''
      });
      setActiveModal('service');
    }
  };

  const openAddComboModal = () => {
    setComboForm({
      id: null,
      name: '',
      price: '',
      image: '',
      linkedServices: []
    });
    setActiveModal('combo');
  };

  const openNoteModal = (existing = null) => {
    if (existing) {
      setNoteForm({
        id: existing.id,
        icon: existing.icon,
        title: existing.title,
        content: existing.content
      });
    } else {
      setNoteForm({
        id: null,
        icon: 'soup_kitchen',
        title: '',
        content: ''
      });
    }
    setActiveModal('note');
  };

  const closeModal = () => setActiveModal(null);

  // ─── Image Upload Helpers ─────────────────────────────────────
  const handleImageUpload = (e, callback) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file hình ảnh (JPG, PNG)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => callback(reader.result);
    reader.readAsDataURL(file);
  };

  // ─── Form Submits ─────────────────────────────────────────────
  const handleSavePrice = (e) => {
    e.preventDefault();
    const sId = Number(priceForm.serviceId);
    const newPrice = Number(priceForm.price);
    if (!sId || newPrice < 0) {
      showToast('Vui lòng nhập giá hợp lệ', 'error');
      return;
    }
    setServices((prev) =>
      prev.map((s) => (s.id === sId ? { ...s, price: newPrice } : s))
    );
    closeModal();
    showToast('Đã cập nhật bảng giá thành công');
  };

  const handleSaveService = (e) => {
    e.preventDefault();
    if (!serviceForm.name.trim() || !serviceForm.price) {
      showToast('Vui lòng điền tên và giá dịch vụ', 'error');
      return;
    }
    const priceNum = Number(serviceForm.price);
    if (serviceForm.id) {
      // Update
      setServices((prev) =>
        prev.map((s) =>
          s.id === serviceForm.id
            ? { ...s, ...serviceForm, price: priceNum, unit: serviceForm.unit || 'khách' }
            : s
        )
      );
      showToast('Đã cập nhật thông tin dịch vụ');
    } else {
      // Create
      const newService = {
        ...serviceForm,
        id: Date.now(),
        price: priceNum,
        unit: serviceForm.unit || 'khách',
        createdAt: Date.now()
      };
      setServices((prev) => [newService, ...prev]);
      showToast('Đã thêm dịch vụ mới thành công');
    }
    closeModal();
  };

  const handleSaveCombo = (e) => {
    e.preventDefault();
    if (!comboForm.name.trim() || !comboForm.price || comboForm.linkedServices.length === 0) {
      showToast('Vui lòng nhập tên, giá và chọn ít nhất 1 dịch vụ liên kết', 'error');
      return;
    }
    const priceNum = Number(comboForm.price);
    if (comboForm.id) {
      setServices((prev) =>
        prev.map((s) =>
          s.id === comboForm.id
            ? {
                ...s,
                name: comboForm.name,
                price: priceNum,
                image: comboForm.image,
                linkedServices: comboForm.linkedServices,
                description: `Gói combo gồm ${comboForm.linkedServices.length} dịch vụ liên kết`
              }
            : s
        )
      );
      showToast('Đã cập nhật gói Combo');
    } else {
      const newCombo = {
        id: Date.now(),
        name: comboForm.name,
        category: 'combo',
        status: 'Đang phục vụ',
        price: priceNum,
        unit: 'Gói combo',
        description: `Gói combo gồm ${comboForm.linkedServices.length} dịch vụ liên kết`,
        image: comboForm.image || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
        linkedServices: comboForm.linkedServices,
        createdAt: Date.now()
      };
      setServices((prev) => [newCombo, ...prev]);
      showToast('Đã tạo gói Combo liên kết mới');
    }
    closeModal();
  };

  const handleSaveNote = (e) => {
    e.preventDefault();
    if (!noteForm.title.trim()) {
      showToast('Vui lòng nhập tiêu đề ghi chú', 'error');
      return;
    }
    if (noteForm.id) {
      setNotes((prev) =>
        prev.map((n) => (n.id === noteForm.id ? { ...n, ...noteForm } : n))
      );
      showToast('Đã cập nhật ghi chú');
    } else {
      const newNote = { ...noteForm, id: Date.now() };
      setNotes((prev) => [...prev, newNote]);
      showToast('Đã thêm ghi chú vận hành mới');
    }
    closeModal();
  };

  const handleDeleteNote = (id) => {
    if (window.confirm('Bạn có chắc muốn xóa ghi chú này?')) {
      setNotes((prev) => prev.filter((n) => n.id !== id));
      showToast('Đã xóa ghi chú');
    }
  };

  // ─── Filter & Sort Logic ──────────────────────────────────────
  let filteredServices = services.filter((s) => {
    const matchCat = selectedCat === 'all' || s.category === selectedCat;
    const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
    return matchCat && matchSearch;
  });

  if (sortOrder === 'asc') {
    filteredServices = [...filteredServices].sort((a, b) => a.price - b.price);
  } else if (sortOrder === 'desc') {
    filteredServices = [...filteredServices].sort((a, b) => b.price - a.price);
  }

  // ─── Stats ────────────────────────────────────────────────────
  const activeCount = services.filter((s) => s.status !== 'Tạm ngưng').length;
  const totalRevenueMock = services.reduce((sum, s) => sum + Number(s.price || 0), 0);

  return (
    <div className="manage-service-page">
      {/* Toast Alert */}
      {toast && (
        <div className={`service-toast-alert ${toast.type}`}>
          <i className={`bi ${toast.type === 'error' ? 'bi-exclamation-triangle' : 'bi-check-circle-fill'} me-2`} />
          {toast.message}
        </div>
      )}

      {/* HEADER BREADCRUMB */}
      <div className="service-header-card">
        <div>
          <div className="service-location-badge">
            <i className="bi bi-geo-alt-fill" />
            Thung lũng Mai Châu, Hòa Bình
          </div>
          <h1 className="service-title">Quản lý dịch vụ &amp; Trải nghiệm bản địa</h1>
        </div>
        <div className="service-header-actions">
          <button className="btn-secondary-action" onClick={openPriceModal}>
            <i className="bi bi-tag-fill" />
            <span>Cập nhật bảng giá</span>
          </button>
          <button className="btn-secondary-action" onClick={openAddComboModal}>
            <i className="bi bi-collection-fill" />
            <span>Gói Combo liên kết</span>
          </button>
          <button className="btn-primary-action" onClick={openAddServiceModal}>
            <i className="bi bi-plus-circle-fill" />
            <span>Thêm dịch vụ mới</span>
          </button>
        </div>
      </div>

      {/* DASHBOARD 4 STATS */}
      <div className="service-stats-grid">
        <div className="service-stat-card">
          <div>
            <div className="stat-header-label">Tổng dịch vụ mở bán</div>
            <div className="stat-value-group">
              <span className="stat-value-number">{activeCount}</span>
              <span className="stat-sub-badge green">100% khả dụng</span>
            </div>
          </div>
          <div className="stat-icon-box green-soft">
            <i className="bi bi-bell-fill" />
          </div>
        </div>

        <div className="service-stat-card">
          <div>
            <div className="stat-header-label">Lượt khách dùng tháng này</div>
            <div className="stat-value-group">
              <span className="stat-value-number">148</span>
              <span className="stat-sub-badge green">
                <i className="bi bi-arrow-up-short" /> +24%
              </span>
            </div>
          </div>
          <div className="stat-icon-box emerald-soft">
            <i className="bi bi-compass-fill" />
          </div>
        </div>

        <div className="service-stat-card">
          <div>
            <div className="stat-header-label">Doanh thu phụ trợ</div>
            <div className="stat-value-group">
              <span className="stat-value-number">{formatVND(totalRevenueMock)}</span>
              <span className="stat-sub-badge gray">38% tổng DT</span>
            </div>
          </div>
          <div className="stat-icon-box amber-soft">
            <i className="bi bi-cash-stack" />
          </div>
        </div>

        <div className="service-stat-card">
          <div>
            <div className="stat-header-label">Đánh giá trải nghiệm</div>
            <div className="stat-value-group">
              <span className="stat-value-number">4.92</span>
              <span className="stat-sub-badge orange">
                <i className="bi bi-star-fill me-1" /> 98 phản hồi
              </span>
            </div>
          </div>
          <div className="stat-icon-box teal-soft">
            <i className="bi bi-hand-thumbs-up-fill" />
          </div>
        </div>
      </div>

      {/* TABS & TÌM KIẾM */}
      <div className="service-filter-bar">
        <div className="category-tabs-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              className={`cat-tab-btn ${selectedCat === cat.key ? 'active' : ''}`}
              onClick={() => setSelectedCat(cat.key)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="service-search-sort">
          <div className="search-input-wrap">
            <i className="bi bi-search" />
            <input
              type="text"
              placeholder="Tìm tên dịch vụ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="sort-select"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="">Sắp xếp theo giá</option>
            <option value="asc">Giá: Thấp đến Cao</option>
            <option value="desc">Giá: Cao đến Thấp</option>
          </select>
        </div>
      </div>

      {/* MAIN TWO-COLUMN CONTENT */}
      <div className="service-main-content">
        {/* LEFT COLUMN: CARDS GRID */}
        <div className="services-card-grid">
          {filteredServices.map((service) => {
            const isActive = service.status !== 'Tạm ngưng';
            return (
              <div key={service.id} className="service-card-item">
                <div className="service-card-img-wrap">
                  <img
                    src={
                      service.image ||
                      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80'
                    }
                    alt={service.name}
                    className="service-card-img"
                  />
                  <span
                    className={`service-category-badge ${service.category === 'combo' ? 'combo' : ''}`}
                  >
                    {CATEGORIES.find((c) => c.key === service.category)?.label || 'Dịch vụ'}
                  </span>
                  <span
                    className={`service-status-pill ${isActive ? 'active' : 'paused'}`}
                  >
                    {service.status}
                  </span>
                </div>

                <div className="service-card-body">
                  <div>
                    <h3 className="service-card-name">{service.name}</h3>
                    <p className="service-card-desc">{service.description}</p>
                    {service.category === 'combo' && (
                      <div className="combo-linked-count">
                        <i className="bi bi-link-45deg me-1" />
                        {(service.linkedServices || []).length} dịch vụ liên kết
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="service-price-row">
                      <span className="service-unit">
                        Đơn vị: <strong>{service.unit}</strong>
                      </span>
                      <span className="service-price-val">{formatVND(service.price)}</span>
                    </div>

                    <div className="service-card-footer">
                      <div
                        className="toggle-wrap"
                        onClick={() => handleToggleStatus(service.id)}
                      >
                        <div className={`toggle-switch ${isActive ? 'on' : ''}`}>
                          <div className="toggle-slider" />
                        </div>
                        <span className="toggle-label">
                          {isActive ? 'Mở nhận khách' : 'Tạm dừng'}
                        </span>
                      </div>

                      <div className="card-action-btns">
                        <button
                          className="icon-action-btn"
                          title="Chỉnh sửa dịch vụ"
                          onClick={() => openEditServiceModal(service)}
                        >
                          <i className="bi bi-pencil-square" />
                        </button>
                        <button
                          className="icon-action-btn delete"
                          title="Xóa dịch vụ"
                          onClick={() => handleDeleteService(service.id, service.name)}
                        >
                          <i className="bi bi-trash" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add Service Placeholder Card */}
          <div className="add-service-empty-card" onClick={openAddServiceModal}>
            <div className="add-card-circle-icon">
              <i className="bi bi-plus-lg" />
            </div>
            <h4>Thêm dịch vụ trải nghiệm mới</h4>
            <p>
              Đưa đặc sản ẩm thực, tour trekking hay dịch vụ tắm lá người Dao vào gói đón tiếp của Homestay bạn.
            </p>
            <span className="add-card-badge">Khởi tạo ngay</span>
          </div>
        </div>

        {/* RIGHT COLUMN: POPULAR & NOTES */}
        <div className="service-side-column">
          {/* Top Popular Services */}
          <div className="side-panel-card">
            <div className="side-panel-title-row">
              <div>
                <h3>Dịch vụ đặt kèm nhiều nhất</h3>
                <span className="side-panel-sub">Tháng này • Đóng góp 46.200.000đ</span>
              </div>
              <i className="bi bi-bar-chart-fill text-success" />
            </div>

            <div className="popular-bars-list">
              {POPULAR_STATS.map((stat, i) => (
                <div key={i} className="popular-bar-item">
                  <div className="bar-name-row">
                    <div className="bar-name-left">
                      <span className="bar-dot" style={{ backgroundColor: stat.color }} />
                      <span>{stat.name}</span>
                    </div>
                    <strong>{stat.percent}%</strong>
                  </div>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{
                        width: `${stat.percent}%`,
                        backgroundColor: stat.color
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Operations Notes */}
          <div className="side-panel-card">
            <div className="side-panel-title-row">
              <h3>Ghi chú vận hành dịch vụ</h3>
              <button
                className="btn-add-note-inline"
                onClick={() => openNoteModal()}
              >
                + Thêm lưu ý
              </button>
            </div>

            <div className="notes-list">
              {notes.map((note) => (
                <div key={note.id} className="note-item-box">
                  <div className="note-content-group">
                    <i className={`bi bi-${note.icon === 'soup_kitchen' ? 'egg-fried' : note.icon === 'explore' ? 'compass' : 'car-front-fill'} note-icon-tag`} />
                    <div className="note-text-group">
                      <span className="note-title-txt">{note.title}</span>
                      <span className="note-desc-txt">{note.content}</span>
                    </div>
                  </div>
                  <div className="note-actions">
                    <button
                      className="btn-note-action"
                      onClick={() => openNoteModal(note)}
                      title="Sửa"
                    >
                      <i className="bi bi-pencil" />
                    </button>
                    <button
                      className="btn-note-action delete"
                      onClick={() => handleDeleteNote(note.id)}
                      title="Xóa"
                    >
                      <i className="bi bi-trash" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── MODAL 1: CẬP NHẬT BẢNG GIÁ ──────────────────────────── */}
      {activeModal === 'price' && (
        <div className="service-modal-overlay" onClick={closeModal}>
          <div className="service-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-bar">
              <h2>Cập nhật bảng giá dịch vụ</h2>
              <button className="modal-close-btn" onClick={closeModal}>
                <i className="bi bi-x-lg" />
              </button>
            </div>
            <form onSubmit={handleSavePrice}>
              <div className="modal-body-scroll">
                <div className="form-group-item">
                  <label className="form-label-title">Chọn dịch vụ cần đổi giá</label>
                  <select
                    className="form-input-field"
                    value={priceForm.serviceId}
                    onChange={(e) => {
                      const id = Number(e.target.value);
                      const target = services.find((s) => s.id === id);
                      setPriceForm({
                        serviceId: id,
                        price: target ? target.price : ''
                      });
                    }}
                  >
                    {services
                      .filter((s) => s.category !== 'combo')
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} — {formatVND(s.price)}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="form-group-item">
                  <label className="form-label-title">Giá mới (VNĐ)</label>
                  <input
                    type="number"
                    className="form-input-field"
                    placeholder="Nhập giá mới..."
                    value={priceForm.price}
                    onChange={(e) =>
                      setPriceForm({ ...priceForm, price: e.target.value })
                    }
                    min="0"
                    required
                  />
                </div>
              </div>
              <div className="modal-footer-bar">
                <button
                  type="button"
                  className="btn-secondary-action"
                  onClick={closeModal}
                >
                  Hủy
                </button>
                <button type="submit" className="btn-primary-action">
                  Lưu cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: THÊM / SỬA GÓI COMBO ──────────────────────── */}
      {activeModal === 'combo' && (
        <div className="service-modal-overlay" onClick={closeModal}>
          <div className="service-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-bar">
              <h2>{comboForm.id ? 'Chỉnh sửa gói Combo' : 'Tạo gói Combo liên kết'}</h2>
              <button className="modal-close-btn" onClick={closeModal}>
                <i className="bi bi-x-lg" />
              </button>
            </div>
            <form onSubmit={handleSaveCombo}>
              <div className="modal-body-scroll">
                <div className="form-group-item">
                  <label className="form-label-title">Hình ảnh Combo</label>
                  <div className="image-upload-row">
                    <div className="preview-square">
                      {comboForm.image ? (
                        <img src={comboForm.image} alt="Preview" />
                      ) : (
                        <i className="bi bi-image" />
                      )}
                    </div>
                    <div className="upload-input-wrap">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handleImageUpload(e, (dataUrl) =>
                            setComboForm({ ...comboForm, image: dataUrl })
                          )
                        }
                      />
                      <span className="upload-hint">Khuyên dùng ảnh phong cảnh (16:9)</span>
                    </div>
                  </div>
                </div>

                <div className="form-group-item">
                  <label className="form-label-title">Tên gói Combo</label>
                  <input
                    type="text"
                    className="form-input-field"
                    placeholder="VD: Combo Nghỉ dưỡng & Khám phá..."
                    value={comboForm.name}
                    onChange={(e) =>
                      setComboForm({ ...comboForm, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-group-item">
                  <label className="form-label-title">Chọn các dịch vụ trong Combo</label>
                  <div className="combo-multi-list">
                    {services
                      .filter((s) => s.category !== 'combo')
                      .map((s) => {
                        const checked = comboForm.linkedServices.includes(s.id);
                        return (
                          <label key={s.id} className="combo-check-item">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setComboForm({
                                    ...comboForm,
                                    linkedServices: [...comboForm.linkedServices, s.id]
                                  });
                                } else {
                                  setComboForm({
                                    ...comboForm,
                                    linkedServices: comboForm.linkedServices.filter(
                                      (id) => id !== s.id
                                    )
                                  });
                                }
                              }}
                            />
                            <span>
                              {s.name} ({formatVND(s.price)})
                            </span>
                          </label>
                        );
                      })}
                  </div>
                </div>

                <div className="form-group-item">
                  <label className="form-label-title">Giá trọn gói Combo (VNĐ)</label>
                  <input
                    type="number"
                    className="form-input-field"
                    placeholder="Nhập giá ưu đãi của combo..."
                    value={comboForm.price}
                    onChange={(e) =>
                      setComboForm({ ...comboForm, price: e.target.value })
                    }
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="modal-footer-bar">
                <button
                  type="button"
                  className="btn-secondary-action"
                  onClick={closeModal}
                >
                  Hủy
                </button>
                <button type="submit" className="btn-primary-action">
                  {comboForm.id ? 'Lưu Combo' : 'Tạo Combo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: THÊM / SỬA DỊCH VỤ ────────────────────────── */}
      {activeModal === 'service' && (
        <div className="service-modal-overlay" onClick={closeModal}>
          <div
            className="service-modal-box large"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-bar">
              <h2>
                {serviceForm.id
                  ? 'Chỉnh sửa dịch vụ / trải nghiệm'
                  : 'Thêm dịch vụ / trải nghiệm mới'}
              </h2>
              <button className="modal-close-btn" onClick={closeModal}>
                <i className="bi bi-x-lg" />
              </button>
            </div>
            <form onSubmit={handleSaveService}>
              <div className="modal-body-scroll">
                {/* Upload Image */}
                <div className="form-group-item">
                  <label className="form-label-title">Hình ảnh dịch vụ</label>
                  <div className="image-upload-row">
                    <div className="preview-square">
                      {serviceForm.image ? (
                        <img src={serviceForm.image} alt="Preview" />
                      ) : (
                        <i className="bi bi-image" />
                      )}
                    </div>
                    <div className="upload-input-wrap">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handleImageUpload(e, (dataUrl) =>
                            setServiceForm({ ...serviceForm, image: dataUrl })
                          )
                        }
                      />
                      <span className="upload-hint">
                        Hỗ trợ JPG, PNG. Khuyên dùng ảnh ngang tỉ lệ 16:9
                      </span>
                    </div>
                  </div>
                </div>

                <div className="form-group-item">
                  <label className="form-label-title">Tên dịch vụ</label>
                  <input
                    type="text"
                    className="form-input-field"
                    placeholder="Nhập tên dịch vụ..."
                    value={serviceForm.name}
                    onChange={(e) =>
                      setServiceForm({ ...serviceForm, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-grid-2">
                  <div className="form-group-item">
                    <label className="form-label-title">Phân loại</label>
                    <select
                      className="form-input-field"
                      value={serviceForm.category}
                      onChange={(e) =>
                        setServiceForm({
                          ...serviceForm,
                          category: e.target.value
                        })
                      }
                    >
                      <option value="food">Ẩm thực & Bữa ăn</option>
                      <option value="culture">Trải nghiệm văn hóa & Tour</option>
                      <option value="transport">Thuê xe & Di chuyển</option>
                      <option value="wellness">Tiện ích thư giãn</option>
                    </select>
                  </div>

                  <div className="form-group-item">
                    <label className="form-label-title">Trạng thái</label>
                    <select
                      className="form-input-field"
                      value={serviceForm.status}
                      onChange={(e) =>
                        setServiceForm({
                          ...serviceForm,
                          status: e.target.value
                        })
                      }
                    >
                      <option value="Đang phục vụ">Đang phục vụ (Sẵn sàng)</option>
                      <option value="Cần đặt trước">Cần đặt trước</option>
                      <option value="Tạm ngưng">Tạm ngưng</option>
                    </select>
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group-item">
                    <label className="form-label-title">Giá tiền (VNĐ)</label>
                    <input
                      type="number"
                      className="form-input-field"
                      placeholder="Ví dụ: 250000"
                      value={serviceForm.price}
                      onChange={(e) =>
                        setServiceForm({ ...serviceForm, price: e.target.value })
                      }
                      min="0"
                      required
                    />
                  </div>

                  <div className="form-group-item">
                    <label className="form-label-title">Đơn vị tính</label>
                    <input
                      type="text"
                      className="form-input-field"
                      placeholder="Ví dụ: Set / Khách / Giờ..."
                      value={serviceForm.unit}
                      onChange={(e) =>
                        setServiceForm({ ...serviceForm, unit: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="form-group-item">
                  <label className="form-label-title">Mô tả dịch vụ</label>
                  <textarea
                    rows="3"
                    className="form-input-field"
                    placeholder="Viết mô tả ngắn gọn về dịch vụ..."
                    value={serviceForm.description}
                    onChange={(e) =>
                      setServiceForm({
                        ...serviceForm,
                        description: e.target.value
                      })
                    }
                  />
                </div>
              </div>

              <div className="modal-footer-bar">
                <button
                  type="button"
                  className="btn-secondary-action"
                  onClick={closeModal}
                >
                  Hủy
                </button>
                <button type="submit" className="btn-primary-action">
                  Lưu dịch vụ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 4: THÊM / SỬA GHI CHÚ ────────────────────────── */}
      {activeModal === 'note' && (
        <div className="service-modal-overlay" onClick={closeModal}>
          <div className="service-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-bar">
              <h2>{noteForm.id ? 'Chỉnh sửa ghi chú' : 'Thêm ghi chú vận hành'}</h2>
              <button className="modal-close-btn" onClick={closeModal}>
                <i className="bi bi-x-lg" />
              </button>
            </div>
            <form onSubmit={handleSaveNote}>
              <div className="modal-body-scroll">
                <div className="form-group-item">
                  <label className="form-label-title">Biểu tượng</label>
                  <select
                    className="form-input-field"
                    value={noteForm.icon}
                    onChange={(e) =>
                      setNoteForm({ ...noteForm, icon: e.target.value })
                    }
                  >
                    <option value="soup_kitchen">Ẩm thực</option>
                    <option value="explore">Khám phá / Tour</option>
                    <option value="directions_car">Xe cộ & Di chuyển</option>
                  </select>
                </div>

                <div className="form-group-item">
                  <label className="form-label-title">Tiêu đề lưu ý</label>
                  <input
                    type="text"
                    className="form-input-field"
                    placeholder="VD: Mâm cỗ tối đặt trước 16h..."
                    value={noteForm.title}
                    onChange={(e) =>
                      setNoteForm({ ...noteForm, title: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-group-item">
                  <label className="form-label-title">Nội dung chi tiết</label>
                  <textarea
                    rows="3"
                    className="form-input-field"
                    placeholder="Chi tiết lưu ý cho nhân viên hoặc bếp..."
                    value={noteForm.content}
                    onChange={(e) =>
                      setNoteForm({ ...noteForm, content: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="modal-footer-bar">
                <button
                  type="button"
                  className="btn-secondary-action"
                  onClick={closeModal}
                >
                  Hủy
                </button>
                <button type="submit" className="btn-primary-action">
                  Lưu ghi chú
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
