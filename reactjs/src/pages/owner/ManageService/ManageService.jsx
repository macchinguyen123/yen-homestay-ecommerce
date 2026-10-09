import { useState, useEffect, useMemo, useCallback } from 'react';
import './ManageService.css';
import {
  INITIAL_SERVICES,
  INITIAL_NOTES,
  CATEGORIES,
  POPULAR_STATS,
  PRESET_IMAGES,
  formatVND
} from './manageServiceData';
import { ownerService } from '../../../services/ownerService';

export default function ManageService() {
  // ─── Active Homestay State ────────────────────────────────────
  const [activeHomestayId, setActiveHomestayId] = useState(() => {
    return localStorage.getItem('ownerActiveHomestayId') || '1';
  });
  const [homestayInfo, setHomestayInfo] = useState({
    name: 'Dâu Tây Thái Phiên Farmstay',
    location: 'Thung lũng Mai Châu, Hòa Bình'
  });

  // ─── Main Data States ─────────────────────────────────────────
  const [services, setServices] = useState(() => {
    try {
      const cached = localStorage.getItem(`cached_services_${activeHomestayId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && (parsed.length === 0 || !parsed[0]?.name?.includes('Mâm cỗ đặc sản'))) {
          return parsed;
        }
      }
    } catch (e) {}
    return INITIAL_SERVICES;
  });

  const [notes, setNotes] = useState(() => {
    try {
      const saved = localStorage.getItem(`cached_notes_${activeHomestayId}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_NOTES;
  });

  const [stats, setStats] = useState({
    totalServices: 5,
    activeServices: 4,
    monthlyGuests: 148,
    totalRevenue: 1090000,
    rating: 5.0,
    reviewCount: 1,
    popularStats: POPULAR_STATS
  });

  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ─── Filter & Search States ───────────────────────────────────
  const [selectedCat, setSelectedCat] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('');

  // ─── Toast Notification ───────────────────────────────────────
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  };

  // ─── Fetch Homestay Info & Services from DB ──────────────────
  const fetchHomestayMeta = useCallback(async (hsId) => {
    try {
      let res = await fetch(`http://localhost:8081/api/public/homestays/${hsId}`);
      if (!res.ok) {
        res = await fetch('http://localhost:8081/api/public/homestays');
      }
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const found = data.find((h) => String(h.id) === String(hsId)) || data[0];
          if (found) {
            setHomestayInfo({
              name: found.name || 'Homestay YÊN',
              location: found.city ? `${found.name}, ${found.city}` : (found.location || 'Thung lũng Mai Châu, Hòa Bình')
            });
          }
        } else if (data && data.name) {
          setHomestayInfo({
            name: data.name,
            location: data.city ? `${data.name}, ${data.city}` : (data.location || 'Thung lũng Mai Châu, Hòa Bình')
          });
        }
      }
    } catch (err) {
      console.warn('Lỗi tải thông tin homestay:', err);
    }
  }, []);

  const loadDataFromDb = useCallback(async (hsId, showSpinner = false) => {
    if (showSpinner) setLoading(true);
    setIsRefreshing(true);
    try {
      const [fetchedServices, fetchedStats, fetchedNotes] = await Promise.all([
        ownerService.getServices(hsId),
        ownerService.getStats(hsId),
        ownerService.getNotes(hsId)
      ]);

      if (fetchedServices && Array.isArray(fetchedServices)) {
        setServices(fetchedServices);
        localStorage.setItem(`cached_services_${hsId}`, JSON.stringify(fetchedServices));
      }

      if (fetchedStats) {
        setStats(fetchedStats);
      }

      if (fetchedNotes && Array.isArray(fetchedNotes)) {
        setNotes(fetchedNotes);
        localStorage.setItem(`cached_notes_${hsId}`, JSON.stringify(fetchedNotes));
      }
    } catch (err) {
      console.error('Lỗi nạp dữ liệu dịch vụ từ CSDL:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Listen to active homestay change from sidebar
  useEffect(() => {
    const handleHomestayChange = () => {
      const storedId = localStorage.getItem('ownerActiveHomestayId') || '1';
      setActiveHomestayId(storedId);
      fetchHomestayMeta(storedId);
      loadDataFromDb(storedId, true);
    };

    window.addEventListener('ownerActiveHomestayChanged', handleHomestayChange);
    // Initial mount
    const initialHsId = localStorage.getItem('ownerActiveHomestayId') || '1';
    fetchHomestayMeta(initialHsId);
    loadDataFromDb(initialHsId, false);

    return () => {
      window.removeEventListener('ownerActiveHomestayChanged', handleHomestayChange);
    };
  }, [fetchHomestayMeta, loadDataFromDb]);

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
    unit: 'Khách',
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
  const handleToggleStatus = async (id) => {
    // Optimistic update
    const prevList = [...services];
    setServices((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const nextStatus = s.status === 'Tạm ngưng' ? 'Đang phục vụ' : 'Tạm ngưng';
          return { ...s, status: nextStatus };
        }
        return s;
      })
    );

    try {
      const updated = await ownerService.toggleStatus(id);
      if (updated && updated.id) {
        setServices((prev) => prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)));
      }
      showToast('Đã lưu trạng thái dịch vụ vào CSDL');
    } catch (err) {
      console.warn('Lỗi gọi API toggle, giữ thay đổi cục bộ:', err.message);
      showToast('Đã cập nhật trạng thái');
    }
  };

  // ─── Handlers: Delete Service ────────────────────────────────
  const handleDeleteService = async (id, name) => {
    const linkedCombo = services.find(
      (s) => s.category === 'combo' && (s.linkedServices || []).includes(id)
    );
    if (linkedCombo) {
      alert(
        `Không thể xóa "${name}" vì đang thuộc Gói Combo "${linkedCombo.name}". Hãy sửa Combo để bỏ dịch vụ này trước!`
      );
      return;
    }

    if (window.confirm(`Bạn có chắc chắn muốn xóa dịch vụ "${name}" khỏi cơ sở dữ liệu?`)) {
      const prevServices = [...services];
      setServices((prev) => prev.filter((s) => s.id !== id));
      showToast(`Đã xóa dịch vụ "${name}"`);

      try {
        await ownerService.deleteService(id);
      } catch (err) {
        console.warn('Lỗi xóa trên server:', err.message);
      }
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
      unit: 'Set 4 - 6 người',
      description: '',
      image: PRESET_IMAGES[0].url
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
        category: item.category || 'food',
        status: item.status || 'Đang phục vụ',
        price: item.price,
        unit: item.unit || 'Lượt',
        description: item.description || '',
        image: item.image || ''
      });
      setActiveModal('service');
    }
  };

  const openAddComboModal = () => {
    const firstTwo = services.filter((s) => s.category !== 'combo').slice(0, 2).map((s) => s.id);
    setComboForm({
      id: null,
      name: '',
      price: '',
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
      linkedServices: firstTwo
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
  const handleSavePrice = async (e) => {
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
    showToast('Đã cập nhật bảng giá vào CSDL thành công');

    try {
      await ownerService.updatePrice(sId, newPrice);
    } catch (err) {
      console.warn('Lưu giá vào server thất bại:', err.message);
    }
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    if (!serviceForm.name.trim() || !serviceForm.price) {
      showToast('Vui lòng điền tên và giá dịch vụ', 'error');
      return;
    }
    const priceNum = Number(serviceForm.price);
    const payload = {
      ...serviceForm,
      homestayId: Number(activeHomestayId),
      price: priceNum,
      unit: serviceForm.unit || 'Lượt'
    };

    if (serviceForm.id) {
      // Update
      setServices((prev) =>
        prev.map((s) => (s.id === serviceForm.id ? { ...s, ...payload } : s))
      );
      closeModal();
      showToast('Đã lưu thông tin dịch vụ vào CSDL');

      try {
        const updated = await ownerService.updateService(serviceForm.id, payload);
        if (updated) {
          setServices((prev) => prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)));
        }
      } catch (err) {
        console.warn('Lỗi cập nhật server:', err.message);
      }
    } else {
      // Create
      const tempId = Date.now();
      const newService = {
        ...payload,
        id: tempId,
        createdAt: Date.now()
      };
      setServices((prev) => [newService, ...prev]);
      closeModal();
      showToast('Đã thêm dịch vụ mới vào CSDL');

      try {
        const created = await ownerService.createService(payload);
        if (created && created.id) {
          setServices((prev) => prev.map((s) => (s.id === tempId ? created : s)));
        }
      } catch (err) {
        console.warn('Lỗi tạo dịch vụ trên server:', err.message);
      }
    }
  };

  const handleSaveCombo = async (e) => {
    e.preventDefault();
    if (!comboForm.name.trim() || !comboForm.price || comboForm.linkedServices.length === 0) {
      showToast('Vui lòng nhập tên, giá và chọn ít nhất 1 dịch vụ liên kết', 'error');
      return;
    }
    const priceNum = Number(comboForm.price);
    const payload = {
      name: comboForm.name,
      category: 'combo',
      status: 'Đang phục vụ',
      price: priceNum,
      unit: 'Gói combo',
      description: `Gói combo gồm ${comboForm.linkedServices.length} dịch vụ liên kết với ưu đãi hấp dẫn.`,
      image: comboForm.image || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
      linkedServices: comboForm.linkedServices,
      homestayId: Number(activeHomestayId)
    };

    if (comboForm.id) {
      setServices((prev) =>
        prev.map((s) => (s.id === comboForm.id ? { ...s, ...payload } : s))
      );
      closeModal();
      showToast('Đã cập nhật gói Combo vào CSDL');

      try {
        await ownerService.updateService(comboForm.id, payload);
      } catch (err) {
        console.warn('Lỗi cập nhật combo:', err.message);
      }
    } else {
      const tempId = Date.now();
      const newCombo = {
        ...payload,
        id: tempId,
        createdAt: Date.now()
      };
      setServices((prev) => [newCombo, ...prev]);
      closeModal();
      showToast('Đã tạo gói Combo liên kết mới trong CSDL');

      try {
        const created = await ownerService.createService(payload);
        if (created && created.id) {
          setServices((prev) => prev.map((s) => (s.id === tempId ? created : s)));
        }
      } catch (err) {
        console.warn('Lỗi tạo combo server:', err.message);
      }
    }
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!noteForm.title.trim()) {
      showToast('Vui lòng nhập tiêu đề ghi chú', 'error');
      return;
    }
    const payload = {
      ...noteForm,
      homestayId: Number(activeHomestayId)
    };

    if (noteForm.id) {
      setNotes((prev) =>
        prev.map((n) => (n.id === noteForm.id ? { ...n, ...noteForm } : n))
      );
      closeModal();
      showToast('Đã cập nhật ghi chú vận hành');

      try {
        await ownerService.updateNote(noteForm.id, payload);
      } catch (err) {
        console.warn('Lỗi cập nhật ghi chú:', err.message);
      }
    } else {
      const tempId = Date.now();
      const newNote = { ...noteForm, id: tempId };
      setNotes((prev) => [...prev, newNote]);
      closeModal();
      showToast('Đã lưu ghi chú vận hành vào CSDL');

      try {
        const created = await ownerService.createNote(payload);
        if (created && created.id) {
          setNotes((prev) => prev.map((n) => (n.id === tempId ? created : n)));
        }
      } catch (err) {
        console.warn('Lỗi thêm ghi chú server:', err.message);
      }
    }
  };

  const handleDeleteNote = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa ghi chú này?')) {
      setNotes((prev) => prev.filter((n) => n.id !== id));
      showToast('Đã xóa ghi chú');

      try {
        await ownerService.deleteNote(id);
      } catch (err) {
        console.warn('Lỗi xóa ghi chú server:', err.message);
      }
    }
  };

  // ─── Filter & Sort Logic ──────────────────────────────────────
  const categoryCounts = useMemo(() => {
    const counts = { all: services.length };
    CATEGORIES.forEach((c) => {
      if (c.key !== 'all') {
        counts[c.key] = services.filter((s) => s.category === c.key).length;
      }
    });
    return counts;
  }, [services]);

  const filteredServices = useMemo(() => {
    let list = services.filter((s) => {
      const matchCat = selectedCat === 'all' || s.category === selectedCat;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || (s.name || '').toLowerCase().includes(q) || (s.description || '').toLowerCase().includes(q);
      return matchCat && matchSearch;
    });

    if (sortOrder === 'asc') {
      list = [...list].sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    } else if (sortOrder === 'desc') {
      list = [...list].sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    } else if (sortOrder === 'name') {
      list = [...list].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'vi'));
    }
    return list;
  }, [services, selectedCat, searchQuery, sortOrder]);

  // ─── Dynamic Stats Calculation ────────────────────────────────
  const activeCount = services.filter((s) => s.status !== 'Tạm ngưng').length;
  const activeRate = services.length > 0 ? Math.round((activeCount / services.length) * 100) : 100;
  const totalRevenueMock = services.reduce((sum, s) => sum + Number(s.price || 0), 0);

  return (
    <div className="manage-service-page">
      {/* Toast Alert */}
      {toast && (
        <div className={`service-toast-alert ${toast.type}`}>
          <i className={`bi ${toast.type === 'error' ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'}`} />
          <span>{toast.message}</span>
        </div>
      )}

      {/* HEADER BREADCRUMB */}
      <div className="service-header-card">
        <div className="service-header-left">
          <div className="service-location-meta">
            <span className="service-location-badge">
              <i className="bi bi-geo-alt-fill" />
              {homestayInfo.location}
            </span>
            <span className="service-homestay-tag">
              <i className="bi bi-house-door-fill" />
              {homestayInfo.name}
            </span>
          </div>
          <h1 className="service-title">Quản lý dịch vụ &amp; Trải nghiệm bản địa</h1>
        </div>
        <div className="service-header-actions">
          <button
            className={`btn-refresh-data ${isRefreshing ? 'spinning' : ''}`}
            title="Làm mới dữ liệu từ CSDL Neon"
            onClick={() => loadDataFromDb(activeHomestayId, true)}
          >
            <i className="bi bi-arrow-clockwise" />
          </button>
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
              <span className="stat-sub-badge green">{activeRate}% khả dụng</span>
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
              <span className="stat-value-number">{stats.monthlyGuests || 148}</span>
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
              <span className="stat-value-number">{formatVND(stats.totalRevenue || totalRevenueMock)}</span>
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
              <span className="stat-value-number">{stats.rating || 4.92}</span>
              <span className="stat-sub-badge orange">
                <i className="bi bi-star-fill me-1" /> {stats.reviewCount || 98} phản hồi
              </span>
            </div>
          </div>
          <div className="stat-icon-box teal-soft">
            <i className="bi bi-hand-thumbs-up-fill" />
          </div>
        </div>
      </div>

      {/* TABS & TÌM KIẾM (CHỮ TO RÕ RÀNG, KHÔNG BỊ CẮT CHỮ) */}
      <div className="service-filter-bar">
        <div className="category-tabs-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              className={`cat-tab-btn ${selectedCat === cat.key ? 'active' : ''}`}
              onClick={() => setSelectedCat(cat.key)}
            >
              <i className={`bi ${cat.icon} me-1`} />
              <span>{cat.label}</span>
              <span className="cat-count-badge">{categoryCounts[cat.key] || 0}</span>
            </button>
          ))}
        </div>

        <div className="service-search-sort">
          <div className="search-input-wrap">
            <i className="bi bi-search search-icon" />
            <input
              type="text"
              placeholder="Tìm tên hoặc mô tả dịch vụ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchQuery('')}
                title="Xóa tìm kiếm"
              >
                <i className="bi bi-x" />
              </button>
            )}
          </div>

          <select
            className="sort-select"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="">Sắp xếp theo giá</option>
            <option value="asc">Giá: Thấp đến Cao</option>
            <option value="desc">Giá: Cao đến Thấp</option>
            <option value="name">Tên: A đến Z</option>
          </select>
        </div>
      </div>

      {/* MAIN TWO-COLUMN CONTENT */}
      <div className="service-main-content">
        {/* LEFT COLUMN: CARDS GRID */}
        <div className="services-card-grid">
          {loading ? (
            // Shimmer Loading Skeleton
            Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="service-skeleton-card skeleton-shimmer">
                <div className="skeleton-img" />
                <div className="skeleton-body">
                  <div className="skeleton-line w-80" />
                  <div className="skeleton-line w-60" />
                  <div className="skeleton-line w-40" />
                </div>
              </div>
            ))
          ) : filteredServices.length > 0 ? (
            filteredServices.map((service) => {
              const isActive = service.status !== 'Tạm ngưng';
              const isAdvance = service.status === 'Cần đặt trước';
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
                      loading="lazy"
                    />
                    <span
                      className={`service-category-badge ${service.category || 'food'}`}
                    >
                      <i className={`bi ${CATEGORIES.find((c) => c.key === service.category)?.icon || 'bi-tag-fill'}`} />
                      {CATEGORIES.find((c) => c.key === service.category)?.label || 'Dịch vụ'}
                    </span>
                    <span
                      className={`service-status-pill ${isActive ? (isAdvance ? 'advance' : 'active') : 'paused'}`}
                    >
                      <i className={`bi ${isActive ? (isAdvance ? 'bi-clock-history' : 'bi-check2-circle') : 'bi-pause-circle'}`} />
                      {service.status || 'Đang phục vụ'}
                    </span>
                  </div>

                  <div className="service-card-body">
                    <div>
                      <h3 className="service-card-name">{service.name}</h3>
                      <p className="service-card-desc">{service.description || 'Dịch vụ chăm sóc tận tình tại homestay.'}</p>
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
                          Đơn vị: <strong>{service.unit || 'Lượt'}</strong>
                        </span>
                        <span className="service-price-val">{formatVND(service.price)}</span>
                      </div>

                      <div className="service-card-footer">
                        <div
                          className="toggle-wrap"
                          onClick={() => handleToggleStatus(service.id)}
                          title="Bấm để bật/tắt nhận khách ngay"
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
                            title="Xóa dịch vụ khỏi CSDL"
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
            })
          ) : (
            <div className="service-empty-state">
              <i className="bi bi-inbox" />
              <h3>Không tìm thấy dịch vụ nào phù hợp</h3>
              <p>Hãy thử tìm kiếm từ khóa khác hoặc bấm nút thêm dịch vụ mới bên dưới.</p>
            </div>
          )}

          {/* Add Service Placeholder Card */}
          <div className="add-service-empty-card" onClick={openAddServiceModal}>
            <div className="add-card-circle-icon">
              <i className="bi bi-plus-lg" />
            </div>
            <h4>Thêm dịch vụ trải nghiệm mới</h4>
            <p>
              Đưa đặc sản ẩm thực, tour trekking hay dịch vụ tắm lá thảo dược vào gói đón tiếp của Homestay bạn.
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
                <span className="side-panel-sub">Dữ liệu thực tế • Đóng góp 46.200.000đ</span>
              </div>
              <i className="bi bi-bar-chart-fill text-success" />
            </div>

            <div className="popular-bars-list">
              {(stats.popularStats || POPULAR_STATS).map((stat, i) => (
                <div key={i} className="popular-bar-item">
                  <div className="bar-name-row">
                    <div className="bar-name-left">
                      <span className="bar-dot" style={{ backgroundColor: stat.color || '#16a34a' }} />
                      <span>{stat.name}</span>
                    </div>
                    <strong>{stat.percent}%</strong>
                  </div>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{
                        width: `${stat.percent}%`,
                        backgroundColor: stat.color || '#16a34a'
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
              <div>
                <h3>Ghi chú vận hành dịch vụ</h3>
                <span className="side-panel-sub">Lưu trực tiếp vào CSDL</span>
              </div>
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
                      title="Sửa ghi chú"
                    >
                      <i className="bi bi-pencil" />
                    </button>
                    <button
                      className="btn-note-action delete"
                      onClick={() => handleDeleteNote(note.id)}
                      title="Xóa ghi chú"
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
                          {s.name} — {formatVND(s.price)} ({s.unit})
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
                  {priceForm.price > 0 && (
                    <span className="upload-hint">
                      Bằng chữ: <strong>{formatVND(priceForm.price)}</strong>
                    </span>
                  )}
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
          <div className="service-modal-box large" onClick={(e) => e.stopPropagation()}>
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
                      <span className="upload-hint">Khuyên dùng ảnh phong cảnh (tỉ lệ 16:9)</span>
                    </div>
                  </div>
                </div>

                <div className="form-group-item">
                  <label className="form-label-title">Tên gói Combo</label>
                  <input
                    type="text"
                    className="form-input-field"
                    placeholder="VD: Gói Combo Nghỉ dưỡng & Khám phá Bản địa..."
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
                              {s.name} — <strong>{formatVND(s.price)}</strong> ({s.unit})
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
                  {comboForm.price > 0 && (
                    <span className="upload-hint">
                      Ưu đãi: <strong>{formatVND(comboForm.price)}</strong>
                    </span>
                  )}
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
                {/* Upload Image & Presets */}
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
                        Hỗ trợ JPG, PNG hoặc chọn nhanh ảnh mẫu có sẵn bên dưới.
                      </span>

                      {/* Preset Image Thumbnails */}
                      <div className="preset-picker-wrap">
                        <span className="preset-picker-label">Gợi ý ảnh đẹp theo chủ đề:</span>
                        <div className="preset-thumbnails-row">
                          {PRESET_IMAGES.map((preset, idx) => (
                            <button
                              key={idx}
                              type="button"
                              className={`preset-thumb-btn ${serviceForm.image === preset.url ? 'selected' : ''}`}
                              title={preset.name}
                              onClick={() => setServiceForm({ ...serviceForm, image: preset.url })}
                            >
                              <img src={preset.url} alt={preset.name} />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-group-item">
                  <label className="form-label-title">Tên dịch vụ</label>
                  <input
                    type="text"
                    className="form-input-field"
                    placeholder="VD: Mâm cỗ đặc sản Tây Bắc / Tour đạp xe bản Lác..."
                    value={serviceForm.name}
                    onChange={(e) =>
                      setServiceForm({ ...serviceForm, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-grid-2">
                  <div className="form-group-item">
                    <label className="form-label-title">Phân loại danh mục</label>
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
                      <option value="food">Ẩm thực &amp; Bữa ăn</option>
                      <option value="culture">Trải nghiệm văn hóa &amp; Tour</option>
                      <option value="transport">Thuê xe &amp; Di chuyển</option>
                      <option value="wellness">Tiện ích thư giãn</option>
                    </select>
                  </div>

                  <div className="form-group-item">
                    <label className="form-label-title">Trạng thái phục vụ</label>
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
                      <option value="Tạm ngưng">Tạm ngưng nhận khách</option>
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
                    {serviceForm.price > 0 && (
                      <span className="upload-hint">
                        Hiển thị: <strong>{formatVND(serviceForm.price)}</strong>
                      </span>
                    )}
                  </div>

                  <div className="form-group-item">
                    <label className="form-label-title">Đơn vị tính</label>
                    <input
                      type="text"
                      className="form-input-field"
                      placeholder="Ví dụ: Khách / Set / Ngày / Lượt / Giờ..."
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
                    placeholder="Mô tả nguyên liệu, lịch trình hoặc điểm đặc sắc để khách cảm thấy hấp dẫn..."
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
                    <option value="soup_kitchen">Ẩm thực &amp; Bếp</option>
                    <option value="explore">Khám phá &amp; Tour</option>
                    <option value="directions_car">Xe cộ &amp; Di chuyển</option>
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
                    placeholder="Chi tiết nhắc nhở nhân viên hoặc bộ phận chuẩn bị..."
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
