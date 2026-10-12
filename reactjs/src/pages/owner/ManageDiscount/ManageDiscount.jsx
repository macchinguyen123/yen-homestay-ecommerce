import { useState, useEffect, useMemo } from 'react';
import './ManageDiscount.css';
import {
  INITIAL_VOUCHERS,
  VOUCHER_HISTORY_SEED,
  formatVND,
  toVN
} from './manageDiscountData';
import { ownerVoucherService } from '../../../services/ownerVoucherService';

const IMAGE_PRESETS = [
  { label: 'Mountain View', url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80' },
  { label: 'Dệt thổ cẩm', url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80' },
  { label: 'Mùa lúa chín', url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=80' },
  { label: 'Tour Trekking', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80' },
  { label: 'Nhà sàn mộc', url: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=600&q=80' },
  { label: 'Hoa ban Tây Bắc', url: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=600&q=80' }
];

export default function ManageDiscount() {
  // ─── Active Homestay & Homestay List ─────────────────────────
  const [activeHomestayId, setActiveHomestayId] = useState(
    () => localStorage.getItem('ownerActiveHomestayId') || 'all'
  );
  const [homestaysList, setHomestaysList] = useState(() => {
    try {
      const saved = localStorage.getItem('owner_homestays');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // ─── Vouchers & History State ────────────────────────────────
  const [vouchers, setVouchers] = useState(() => {
    try {
      const saved = localStorage.getItem('owner_vouchers_data');
      return saved ? JSON.parse(saved) : INITIAL_VOUCHERS;
    } catch {
      return INITIAL_VOUCHERS;
    }
  });

  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('owner_voucher_history');
      return saved ? JSON.parse(saved) : VOUCHER_HISTORY_SEED;
    } catch {
      return VOUCHER_HISTORY_SEED;
    }
  });

  const [loading, setLoading] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('owner_vouchers_data', JSON.stringify(vouchers));
  }, [vouchers]);

  useEffect(() => {
    localStorage.setItem('owner_voucher_history', JSON.stringify(history));
  }, [history]);

  // Fetch homestays list
  const fetchHomestays = async () => {
    try {
      const res = await fetch('http://localhost:8081/api/public/homestays');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setHomestaysList(data);
          try {
            localStorage.setItem(
              'owner_homestays',
              JSON.stringify(data.map((h) => ({ id: h.id, name: h.name, city: h.city || '' })))
            );
          } catch (e) {}
        }
      }
    } catch (err) {
      console.warn('Lỗi lấy danh sách homestay:', err);
    }
  };

  // Load vouchers & history from service
  const loadData = async () => {
    setLoading(true);
    try {
      const list = await ownerVoucherService.getVouchers(activeHomestayId);
      if (list && Array.isArray(list) && list.length > 0) {
        setVouchers(list);
      } else {
        const saved = localStorage.getItem('owner_vouchers_data');
        if (saved) {
          setVouchers(JSON.parse(saved));
        } else {
          setVouchers(INITIAL_VOUCHERS);
        }
      }

      const hist = await ownerVoucherService.getHistory(activeHomestayId);
      if (hist && Array.isArray(hist) && hist.length > 0) {
        setHistory(hist);
      }
    } catch (err) {
      console.warn('Lỗi khi tải dữ liệu voucher:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomestays();
    loadData();

    const handleSync = () => {
      const stored = localStorage.getItem('ownerActiveHomestayId') || 'all';
      setActiveHomestayId(stored);
    };
    window.addEventListener('ownerActiveHomestayChanged', handleSync);
    return () => window.removeEventListener('ownerActiveHomestayChanged', handleSync);
  }, []);

  useEffect(() => {
    loadData();
  }, [activeHomestayId]);

  const handleSwitchHomestay = (newId) => {
    setActiveHomestayId(newId);
    localStorage.setItem('ownerActiveHomestayId', String(newId));
    window.dispatchEvent(new Event('ownerActiveHomestayChanged'));
  };

  // ─── Filter & Search ──────────────────────────────────────────
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // ─── Toast System ─────────────────────────────────────────────
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  };

  // ─── Modals State ─────────────────────────────────────────────
  const [activeModal, setActiveModal] = useState(null); // 'add' | 'edit' | 'detail' | 'history' | 'delete'
  const [selectedVoucher, setSelectedVoucher] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    homestayId: '',
    type: 'percent',
    value: '',
    maxDiscount: '',
    minOrder: '',
    usageLimit: 100,
    perUser: 1,
    start: new Date().toISOString().split('T')[0],
    end: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
    audience: 'Công khai toàn sàn',
    description: '',
    active: true,
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80'
  });

  const [deleteReason, setDeleteReason] = useState('Hết ngân sách khuyến mãi');
  const [deleteNotify, setDeleteNotify] = useState(true);

  const closeModal = () => {
    setActiveModal(null);
  };

  // ─── Handlers: Copy Code ──────────────────────────────────────
  const handleCopyCode = (code) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(code);
    }
    showToast(`Đã sao chép mã "${code}"`);
  };

  // ─── Handlers: Toggle Status ──────────────────────────────────
  const handleToggleStatus = async (voucher) => {
    const current = voucher.status;
    const next = current === 'active' ? 'ended' : 'active';

    setVouchers((prev) =>
      prev.map((v) => (v.code === voucher.code ? { ...v, status: next } : v))
    );
    showToast(`Đã ${next === 'active' ? 'kích hoạt' : 'tạm ngưng'} mã "${voucher.code}"`);

    try {
      if (voucher.id) {
        await ownerVoucherService.toggleStatus(voucher.id);
      }
    } catch (err) {
      console.warn('Lỗi gọi API toggle voucher, cập nhật cục bộ:', err.message);
    }
  };

  // ─── Handlers: Modal Openers ──────────────────────────────────
  const openAddModal = () => {
    const defaultHs = activeHomestayId && activeHomestayId !== 'all' ? activeHomestayId : '';
    setFormData({
      code: '',
      name: '',
      homestayId: defaultHs,
      type: 'percent',
      value: '',
      maxDiscount: '',
      minOrder: '',
      usageLimit: 100,
      perUser: 1,
      start: new Date().toISOString().split('T')[0],
      end: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
      audience: 'Công khai toàn sàn',
      description: '',
      active: true,
      image: IMAGE_PRESETS[0].url
    });
    setActiveModal('add');
  };

  const openEditModal = (v) => {
    setSelectedVoucher(v);
    setFormData({
      code: v.code,
      name: v.name,
      homestayId: v.homestayId || '',
      type: v.type,
      value: v.value,
      maxDiscount: v.maxDiscount || '',
      minOrder: v.minOrder || '',
      usageLimit: v.usageLimit,
      perUser: v.perUser || 1,
      start: v.start,
      end: v.end,
      audience: v.audience || 'Công khai toàn sàn',
      description: v.description || '',
      active: v.status !== 'ended',
      image: v.image || IMAGE_PRESETS[0].url
    });
    setActiveModal('edit');
  };

  const openDetailModal = (v) => {
    setSelectedVoucher(v);
    setActiveModal('detail');
  };

  const openDeleteModal = (v) => {
    setSelectedVoucher(v);
    setActiveModal('delete');
  };

  // ─── Handlers: Form Saves ─────────────────────────────────────
  const handleSaveVoucher = async (e) => {
    e.preventDefault();
    const code = formData.code.trim().toUpperCase();
    if (!code || !formData.name.trim() || !formData.value) {
      showToast('Vui lòng điền đủ thông tin mã giảm giá', 'error');
      return;
    }

    const selectedHs = homestaysList.find(
      (h) => String(h.id) === String(formData.homestayId)
    );
    const hsName = selectedHs
      ? selectedHs.name
      : formData.homestayId
      ? 'Homestay'
      : 'Toàn bộ cơ sở YÊN';

    const payload = {
      ...formData,
      code,
      homestayId: formData.homestayId ? Number(formData.homestayId) : null,
      homestayName: hsName,
      value: Number(formData.value),
      maxDiscount: Number(formData.maxDiscount) || 0,
      minOrder: Number(formData.minOrder) || 0,
      usageLimit: Number(formData.usageLimit) || 100,
      perUser: Number(formData.perUser) || 1,
      status: formData.active ? 'active' : 'ended',
      used: selectedVoucher ? selectedVoucher.used : 0
    };

    try {
      if (activeModal === 'edit' && selectedVoucher) {
        if (selectedVoucher.id) {
          await ownerVoucherService
            .updateVoucher(selectedVoucher.id, payload)
            .catch((err) => console.warn(err));
        }
        setVouchers((prev) =>
          prev.map((v) => (v.code === selectedVoucher.code ? { ...v, ...payload } : v))
        );
        showToast(`Đã cập nhật mã "${code}"`);
      } else {
        // Check duplicate code locally
        if (vouchers.some((v) => v.code === code)) {
          showToast(`Mã "${code}" đã tồn tại! Vui lòng chọn mã khác.`, 'error');
          return;
        }

        let createdObj = payload;
        try {
          const res = await ownerVoucherService.createVoucher(payload);
          if (res && res.id) createdObj = { ...payload, id: res.id };
        } catch (err) {
          if (err.message && err.message.includes('đã tồn tại')) {
            showToast(err.message, 'error');
            return;
          }
          console.warn('Lưu máy chủ lỗi, cập nhật cục bộ:', err.message);
        }

        setVouchers([createdObj, ...vouchers]);
        setHistory([
          {
            name: payload.name,
            code: payload.code,
            period: `${toVN(payload.start)} - ${toVN(payload.end)}`,
            used: 0,
            limit: payload.usageLimit,
            revenue: 0,
            status: payload.status
          },
          ...history
        ]);
        showToast(`Đã tạo mã giảm giá "${code}" thành công!`);
      }
      closeModal();
    } catch (err) {
      showToast(err.message || 'Lỗi lưu mã giảm giá', 'error');
    }
  };

  const handleConfirmDelete = async (e) => {
    e.preventDefault();
    if (!selectedVoucher) return;
    try {
      if (selectedVoucher.id) {
        await ownerVoucherService
          .deleteVoucher(selectedVoucher.id)
          .catch((err) => console.warn(err));
      }
    } catch (err) {
      console.warn('Lỗi xoá trên máy chủ:', err.message);
    }
    setVouchers((prev) => prev.filter((v) => v.code !== selectedVoucher.code));
    showToast(`Đã xoá mã "${selectedVoucher.code}"`);
    closeModal();
  };

  // ─── Filter & Search Logic ────────────────────────────────────
  const filteredVouchers = useMemo(() => {
    return vouchers.filter((v) => {
      // Homestay filter
      const matchHs =
        !activeHomestayId ||
        activeHomestayId === 'all' ||
        !v.homestayId ||
        String(v.homestayId) === String(activeHomestayId);

      // Status filter
      const matchFilter = filter === 'all' || v.status === filter;

      // Text search
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (v.code && v.code.toLowerCase().includes(q)) ||
        (v.name && v.name.toLowerCase().includes(q)) ||
        (v.homestayName && v.homestayName.toLowerCase().includes(q));

      return matchHs && matchFilter && matchSearch;
    });
  }, [vouchers, activeHomestayId, filter, searchQuery]);

  // ─── Dynamic KPI Calculations ─────────────────────────────────
  const activeCount = useMemo(
    () => vouchers.filter((v) => v.status === 'active').length,
    [vouchers]
  );
  const upcomingCount = useMemo(
    () => vouchers.filter((v) => v.status === 'upcoming').length,
    [vouchers]
  );
  const endedCount = useMemo(
    () => vouchers.filter((v) => v.status === 'ended').length,
    [vouchers]
  );

  const totalUsed = useMemo(
    () => vouchers.reduce((acc, v) => acc + (v.used || 0), 0),
    [vouchers]
  );

  const totalRevenue = useMemo(() => {
    return vouchers.reduce(
      (acc, v) => acc + (v.revenue ? Number(v.revenue) : (v.used || 0) * 1750000),
      0
    );
  }, [vouchers]);

  const totalDiscountInvested = useMemo(() => {
    return vouchers.reduce((acc, v) => {
      const used = v.used || 0;
      let singleCost = 0;
      if (v.type === 'percent') {
        const calculated = (1750000 * (Number(v.value) || 0)) / 100;
        singleCost = v.maxDiscount > 0 ? Math.min(calculated, Number(v.maxDiscount)) : calculated;
      } else {
        singleCost = Number(v.value) || 0;
      }
      return acc + singleCost * used;
    }, 0);
  }, [vouchers]);

  const roiRate = useMemo(() => {
    if (totalDiscountInvested > 0) {
      return (totalRevenue / totalDiscountInvested).toFixed(1);
    }
    return '12.1';
  }, [totalRevenue, totalDiscountInvested]);

  // Top performing voucher
  const topVoucher = useMemo(() => {
    if (vouchers.length === 0) return null;
    return [...vouchers].sort((a, b) => (b.used || 0) - (a.used || 0))[0];
  }, [vouchers]);

  const currentHomestayName = useMemo(() => {
    if (!activeHomestayId || activeHomestayId === 'all') return 'Tất cả cơ sở Homestay';
    const found = homestaysList.find((h) => String(h.id) === String(activeHomestayId));
    return found ? found.name : 'Tất cả cơ sở Homestay';
  }, [homestaysList, activeHomestayId]);

  return (
    <div className="manage-discount-page">
      {/* Toast Notification */}
      {toast && (
        <div className={`service-toast-alert ${toast.type}`}>
          <i
            className={`bi ${
              toast.type === 'error' ? 'bi-exclamation-triangle' : 'bi-check-circle-fill'
            } me-2`}
          />
          {toast.message}
        </div>
      )}

      {/* TOP BANNER */}
      <div className="discount-banner-card">
        <div className="discount-banner-glow" />
        <div className="discount-banner-content">
          <div>
            <div className="discount-badge-tag">
              <i className="bi bi-ticket-perforated-fill" />
              Khuyến mãi &amp; Kích cầu lưu trú
            </div>
            <h1 className="discount-title">Quản lý Mã giảm giá &amp; Voucher Homestay</h1>
            <p className="discount-subtitle">
              Đang xem chiến dịch tại: <strong>{currentHomestayName}</strong>. Thiết lập các mã ưu đãi
              đặt phòng, tri ân du khách tham gia nhiệm vụ văn hóa bản địa và các đợt kích cầu mùa cao điểm.
            </p>
          </div>
          <div className="discount-header-actions">
            <button
              className="btn-secondary-action"
              onClick={() => setActiveModal('history')}
              title="Xem các đợt phát hành trước"
            >
              <i className="bi bi-clock-history" />
              <span>Lịch sử phát hành</span>
            </button>
            <button className="btn-primary-action" onClick={openAddModal}>
              <i className="bi bi-plus-circle-fill" />
              <span>Tạo mã giảm giá mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 KPI CARDS */}
      <div className="discount-kpi-grid">
        <div className="discount-kpi-box">
          <div className="kpi-top-row">
            <div className="kpi-icon-square green">
              <i className="bi bi-tag-fill" />
            </div>
            <span className="kpi-badge-pill green">Đang hoạt động</span>
          </div>
          <div className="kpi-body-number">
            <span className="kpi-big-num">{activeCount.toString().padStart(2, '0')}</span>
            <span className="kpi-unit-label">mã</span>
            <div className="kpi-desc-text">Mã đang kích hoạt</div>
          </div>
          <div className="kpi-foot-row">
            <span>{upcomingCount > 0 ? `${upcomingCount} mã sắp chạy` : 'Sẵn sàng áp dụng'}</span>
            <i className="bi bi-check-circle-fill text-success" />
          </div>
        </div>

        <div className="discount-kpi-box">
          <div className="kpi-top-row">
            <div className="kpi-icon-square emerald">
              <i className="bi bi-gift-fill" />
            </div>
            <span className="kpi-badge-pill green">+22% đợt này</span>
          </div>
          <div className="kpi-body-number">
            <span className="kpi-big-num">{totalUsed}</span>
            <span className="kpi-unit-label">lượt</span>
            <div className="kpi-desc-text">Tổng lượt du khách dùng</div>
          </div>
          <div className="kpi-foot-row">
            <span>Tăng trưởng đặt phòng</span>
            <i className="bi bi-graph-up-arrow text-success" />
          </div>
        </div>

        <div className="discount-kpi-box">
          <div className="kpi-top-row">
            <div className="kpi-icon-square blue">
              <i className="bi bi-cash-stack" />
            </div>
            <span className="kpi-badge-pill">Doanh số thúc đẩy</span>
          </div>
          <div className="kpi-body-number">
            <span className="kpi-big-num">{formatVND(totalRevenue)}</span>
            <div className="kpi-desc-text">Doanh thu qua Voucher</div>
          </div>
          <div className="kpi-foot-row">
            <span>Gắn liền booking thực tế</span>
            <i className="bi bi-pie-chart-fill text-primary" />
          </div>
        </div>

        <div className="discount-kpi-box">
          <div className="kpi-top-row">
            <div className="kpi-icon-square amber">
              <i className="bi bi-piggy-bank-fill" />
            </div>
            <span className="kpi-badge-pill amber">ROI {roiRate}x</span>
          </div>
          <div className="kpi-body-number">
            <span className="kpi-big-num">
              {formatVND(totalDiscountInvested > 0 ? totalDiscountInvested : 7800000)}
            </span>
            <div className="kpi-desc-text">Chi phí giảm giá đầu tư</div>
          </div>
          <div className="kpi-foot-row">
            <span>1đ ưu đãi thu về {roiRate}đ</span>
            <i className="bi bi-lightning-charge-fill text-warning" />
          </div>
        </div>
      </div>

      {/* FILTER STRIP WITH HOMESTAY SELECTOR (FULL-WIDTH & BALANCED) */}
      <div className="discount-filter-strip">
        <div className="discount-tabs-list">
          {[
            { key: 'all', label: `Tất cả (${vouchers.length})` },
            { key: 'active', label: `Đang chạy (${activeCount})` },
            { key: 'upcoming', label: `Sắp diễn ra (${upcomingCount})` },
            { key: 'ended', label: `Đã kết thúc (${endedCount})` }
          ].map((tab) => (
            <button
              key={tab.key}
              className={`discount-tab-btn ${filter === tab.key ? 'active' : ''}`}
              onClick={() => setFilter(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="discount-controls-group">
          <div className="discount-hs-select-wrap">
            <i className="bi bi-house-door" />
            <select
              className="discount-hs-select"
              value={activeHomestayId}
              onChange={(e) => handleSwitchHomestay(e.target.value)}
            >
              <option value="all">Tất cả homestay ({homestaysList.length || 0})</option>
              {homestaysList.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>

          <div className="discount-search-box">
            <i className="bi bi-search" />
            <input
              type="text"
              placeholder="Tìm mã hoặc tên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="discount-search-clear"
                onClick={() => setSearchQuery('')}
                title="Xóa tìm kiếm"
              >
                <i className="bi bi-x" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MAIN TWO-COLUMN CONTENT */}
      <div className="discount-main-grid">
        {/* LEFT COLUMN: TICKETS */}
        <div>
          {/* VOUCHER TICKETS GRID */}
          {filteredVouchers.length === 0 ? (
            <div className="discount-empty-state">
              <div className="empty-icon-wrap">
                <i className="bi bi-ticket-perforated" />
              </div>
              <h4>Không tìm thấy mã giảm giá phù hợp</h4>
              <p>
                {searchQuery
                  ? `Không có mã nào chứa từ khóa "${searchQuery}". Hãy thử tìm kiếm bằng mã khác.`
                  : 'Chưa có mã giảm giá nào trong danh mục hoặc cơ sở được chọn.'}
              </p>
              <div className="d-flex justify-content-center gap-2 mt-3">
                {searchQuery && (
                  <button className="btn-secondary-action" onClick={() => setSearchQuery('')}>
                    Xóa tìm kiếm
                  </button>
                )}
                <button className="btn-primary-action" onClick={openAddModal}>
                  <i className="bi bi-plus-circle-fill me-1" /> Tạo mã giảm giá mới
                </button>
              </div>
            </div>
          ) : (
            <div className="voucher-cards-grid">
              {filteredVouchers.map((voucher) => {
                const isActive = voucher.status === 'active';
                const percent = voucher.usageLimit
                  ? Math.min(100, Math.round(((voucher.used || 0) / voucher.usageLimit) * 100))
                  : 0;

                return (
                  <div
                    key={voucher.code}
                    className={`voucher-ticket-card ${voucher.status !== 'active' ? 'is-ended' : ''}`}
                  >
                    {/* Card Header Gradient */}
                    <div className="ticket-header-gradient">
                      <div className="d-flex align-items-center gap-2">
                        <span className={`ticket-status-badge ${voucher.status}`}>
                          {isActive && <span className="status-dot-blink" />}
                          {voucher.status === 'active'
                            ? 'Đang hoạt động'
                            : voucher.status === 'upcoming'
                            ? 'Sắp diễn ra'
                            : 'Đã tạm ngưng'}
                        </span>
                        {voucher.homestayName && (
                          <span className="ticket-homestay-tag" title={voucher.homestayName}>
                            <i className="bi bi-geo-alt-fill" /> {voucher.homestayName}
                          </span>
                        )}
                      </div>

                      <div
                        className="toggle-wrap"
                        title={isActive ? 'Nhấn để tạm ngưng mã' : 'Nhấn để kích hoạt mã'}
                        onClick={() => handleToggleStatus(voucher)}
                      >
                        <div className={`toggle-switch ${isActive ? 'on' : ''}`}>
                          <div className="toggle-slider" />
                        </div>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="ticket-body-content">
                      <div className="ticket-discount-row">
                        <div className="ticket-discount-title-group">
                          <div>
                            <span className="ticket-big-rate">
                              {voucher.type === 'percent'
                                ? `GIẢM ${voucher.value}%`
                                : `GIẢM ${formatVND(voucher.value)}`}
                            </span>
                            {voucher.maxDiscount > 0 && (
                              <span className="ticket-max-hint">
                                Tối đa {formatVND(voucher.maxDiscount)}
                              </span>
                            )}
                          </div>
                          <h3>{voucher.name}</h3>
                        </div>
                        <img
                          src={voucher.image || IMAGE_PRESETS[0].url}
                          alt={voucher.name}
                          className="ticket-thumb-img"
                        />
                      </div>

                      <div className="ticket-conditions-pills">
                        {voucher.minOrder > 0 && (
                          <span className="condition-pill">
                            <i className="bi bi-bag-check me-1" />
                            Đơn từ {formatVND(voucher.minOrder)}
                          </span>
                        )}
                        {voucher.audience && (
                          <span className="condition-pill audience">
                            <i className="bi bi-people-fill me-1" />
                            {voucher.audience}
                          </span>
                        )}
                      </div>

                      <p className="ticket-desc-text">{voucher.description}</p>

                      {/* Code Strip */}
                      <div className="ticket-code-strip">
                        <span className="ticket-code-val">{voucher.code}</span>
                        <button
                          className="btn-copy-code"
                          onClick={() => handleCopyCode(voucher.code)}
                          title="Sao chép mã vào clipboard"
                        >
                          <i className="bi bi-copy" /> Sao chép
                        </button>
                      </div>

                      {/* Progress Bar */}
                      <div className="ticket-progress-group">
                        <div className="ticket-progress-labels">
                          <span>
                            Đã dùng: <strong>{voucher.used || 0}/{voucher.usageLimit}</strong>
                          </span>
                          <span>{percent}%</span>
                        </div>
                        <div className="ticket-progress-bar">
                          <div
                            className="ticket-progress-fill"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Punch Hole Separator */}
                    <div className="ticket-separator-row">
                      <div className="punch-hole-left" />
                      <div className="ticket-dashed-line" />
                      <div className="punch-hole-right" />
                    </div>

                    {/* Footer Actions */}
                    <div className="ticket-footer-row">
                      <div className="ticket-date-span">
                        <i className="bi bi-calendar3 me-1" />
                        {toVN(voucher.start)} - {toVN(voucher.end)}
                      </div>
                      <div className="ticket-action-btns">
                        <button
                          className="btn-ticket-icon"
                          title="Xem chi tiết"
                          onClick={() => openDetailModal(voucher)}
                        >
                          <i className="bi bi-eye" />
                        </button>
                        <button
                          className="btn-ticket-icon"
                          title="Chỉnh sửa mã"
                          onClick={() => openEditModal(voucher)}
                        >
                          <i className="bi bi-pencil" />
                        </button>
                        <button
                          className="btn-ticket-icon delete"
                          title="Xoá mã giảm giá"
                          onClick={() => openDeleteModal(voucher)}
                        >
                          <i className="bi bi-trash" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: TELEMETRY & PRO TIPS */}
        <div className="discount-side-cards">
          {/* Top 1 Performing Voucher Telemetry */}
          {topVoucher && (
            <div className="telemetry-card">
              <div className="telemetry-header">
                <div>
                  <h3>
                    <i className="bi bi-trophy-fill text-warning me-1" />
                    Hiệu quả {topVoucher.code}
                  </h3>
                  <span className="telemetry-subname">{topVoucher.name}</span>
                </div>
                <span className="badge bg-success-subtle text-success fw-bold px-2 py-1">
                  Top 1
                </span>
              </div>

              <div className="telemetry-circle-row">
                <div className="telemetry-svg-wrap">
                  <svg viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth="4.5"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#15803d"
                      strokeWidth="4.5"
                      strokeDasharray="68, 100"
                    />
                  </svg>
                  <div className="telemetry-center-stats">
                    <strong>{topVoucher.used || 0}</strong>
                    <span>Lượt dùng</span>
                  </div>
                </div>

                <div className="telemetry-legends">
                  <div className="telemetry-legend-line">
                    <div>
                      <span className="telemetry-dot" style={{ backgroundColor: '#15803d' }} />
                      <span>Khách mới</span>
                    </div>
                    <strong>68%</strong>
                  </div>
                  <div className="telemetry-legend-line">
                    <div>
                      <span className="telemetry-dot" style={{ backgroundColor: '#88d982' }} />
                      <span>Khách quay lại</span>
                    </div>
                    <strong>32%</strong>
                  </div>
                  <div className="telemetry-legend-line pt-2 border-top">
                    <span className="text-muted">Doanh thu tạo ra</span>
                    <strong className="text-success">
                      {formatVND((topVoucher.used || 0) * 1750000)}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pro Tips Card */}
          <div className="pro-tips-card">
            <h4>
              <i className="bi bi-lightbulb-fill text-warning" />
              Chiến lược phát hành Voucher hiệu quả
            </h4>
            <ul>
              <li>
                <strong>Tạo tính cấp bách:</strong> Giới hạn ngày kết thúc trong 15 - 30 ngày để kích thích khách hoàn tất đặt phòng sớm.
              </li>
              <li>
                <strong>Kiểm soát biên lợi nhuận:</strong> Luôn cài đặt mức <em>giảm tối đa</em> khi áp dụng voucher theo tỷ lệ phần trăm (%).
              </li>
              <li>
                <strong>Kích cầu ngày trong tuần:</strong> Áp dụng voucher sâu hơn cho ngày thứ 2 - thứ 5 để lấp đầy công suất phòng trống.
              </li>
              <li>
                <strong>Nhiệm vụ văn hoá:</strong> Kết hợp thưởng voucher cho khách hoàn thành trải nghiệm học làm thổ cẩm hoặc nấu món Thái.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════
          MODAL 1: TẠO / SỬA MÃ GIẢM GIÁ
      ═════════════════════════════════════════════════════════════ */}
      {(activeModal === 'add' || activeModal === 'edit') && (
        <div className="bk-modal-backdrop" onClick={closeModal}>
          <div className="bk-modal-window large" onClick={(e) => e.stopPropagation()}>
            <div className="bk-header-styled surface-style">
              <div className="bk-header-title-box">
                <i className="bi bi-ticket-perforated-fill text-success fs-5" />
                <div>
                  <h3>
                    {activeModal === 'add' ? 'Tạo mã giảm giá mới' : 'Chỉnh sửa mã giảm giá'}
                  </h3>
                  <span>Thiết lập chương trình khuyến mãi phòng và trải nghiệm</span>
                </div>
              </div>
              <button className="modal-close-btn" onClick={closeModal}>
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <form onSubmit={handleSaveVoucher}>
              <div className="bk-body-scrollable">
                <div className="form-group-item">
                  <label className="form-label-title">Tên chương trình ưu đãi</label>
                  <input
                    type="text"
                    className="form-input-field"
                    placeholder="VD: Ưu đãi Mountain View & Garden View"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-grid-2">
                  <div className="form-group-item">
                    <label className="form-label-title">Mã giảm giá (Code)</label>
                    <input
                      type="text"
                      className="form-input-field text-uppercase fw-bold"
                      placeholder="VD: MAICHAU15"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group-item">
                    <label className="form-label-title">Áp dụng cho Homestay</label>
                    <select
                      className="form-input-field"
                      value={formData.homestayId}
                      onChange={(e) => setFormData({ ...formData, homestayId: e.target.value })}
                    >
                      <option value="">Toàn bộ cơ sở YÊN (Toàn hệ thống)</option>
                      {homestaysList.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group-item">
                    <label className="form-label-title">Loại ưu đãi</label>
                    <select
                      className="form-input-field"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                      <option value="percent">Giảm theo % đơn phòng</option>
                      <option value="amount">Giảm số tiền cố định (VNĐ)</option>
                    </select>
                  </div>

                  <div className="form-group-item">
                    <label className="form-label-title">
                      Giá trị giảm {formData.type === 'percent' ? '(%)' : '(VNĐ)'}
                    </label>
                    <input
                      type="number"
                      className="form-input-field"
                      placeholder={formData.type === 'percent' ? '15' : '100000'}
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group-item">
                    <label className="form-label-title">Giảm tối đa (VNĐ)</label>
                    <input
                      type="number"
                      className="form-input-field"
                      placeholder="VD: 300000 (0 nếu không giới hạn)"
                      value={formData.maxDiscount}
                      onChange={(e) =>
                        setFormData({ ...formData, maxDiscount: e.target.value })
                      }
                      disabled={formData.type === 'amount'}
                    />
                  </div>

                  <div className="form-group-item">
                    <label className="form-label-title">Đơn hàng tối thiểu (VNĐ)</label>
                    <input
                      type="number"
                      className="form-input-field"
                      placeholder="VD: 500000"
                      value={formData.minOrder}
                      onChange={(e) => setFormData({ ...formData, minOrder: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group-item">
                    <label className="form-label-title">Tổng số lượt phát hành</label>
                    <input
                      type="number"
                      className="form-input-field"
                      value={formData.usageLimit}
                      onChange={(e) =>
                        setFormData({ ...formData, usageLimit: e.target.value })
                      }
                      min="1"
                      required
                    />
                  </div>

                  <div className="form-group-item">
                    <label className="form-label-title">Đối tượng áp dụng</label>
                    <select
                      className="form-input-field"
                      value={formData.audience}
                      onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                    >
                      <option value="Công khai toàn sàn">Công khai toàn sàn</option>
                      <option value="Nhiệm vụ văn hoá bản địa">Nhiệm vụ văn hoá bản địa</option>
                      <option value="Khách hàng thân thiết">Khách hàng thân thiết</option>
                      <option value="Khách đặt lần đầu">Khách đặt phòng lần đầu</option>
                    </select>
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group-item">
                    <label className="form-label-title">Ngày bắt đầu</label>
                    <input
                      type="date"
                      className="form-input-field"
                      value={formData.start}
                      onChange={(e) => setFormData({ ...formData, start: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group-item">
                    <label className="form-label-title">Ngày kết thúc</label>
                    <input
                      type="date"
                      className="form-input-field"
                      value={formData.end}
                      onChange={(e) => setFormData({ ...formData, end: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Preset Images */}
                <div className="form-group-item">
                  <label className="form-label-title">Hình ảnh minh họa voucher</label>
                  <div className="image-preset-list mb-2">
                    {IMAGE_PRESETS.map((p, idx) => (
                      <button
                        type="button"
                        key={idx}
                        className={`preset-chip ${formData.image === p.url ? 'active' : ''}`}
                        onClick={() => setFormData({ ...formData, image: p.url })}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <input
                    type="url"
                    className="form-input-field"
                    placeholder="URL ảnh (https://...)"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  />
                </div>

                <div className="form-group-item">
                  <label className="form-label-title">Mô tả và điều kiện sử dụng</label>
                  <textarea
                    rows="2"
                    className="form-input-field"
                    placeholder="Chi tiết điều kiện áp dụng cho voucher..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>

                <label className="d-flex align-items-center gap-2 small">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) =>
                      setFormData({ ...formData, active: e.target.checked })
                    }
                  />
                  <span>Kích hoạt mã ngay sau khi lưu</span>
                </label>
              </div>

              <div className="bk-footer-styled">
                <button
                  type="button"
                  className="btn-secondary-action"
                  onClick={closeModal}
                >
                  Hủy
                </button>
                <button type="submit" className="btn-primary-action">
                  <i className="bi bi-save me-1" /> Lưu mã giảm giá
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          MODAL 2: CHI TIẾT VOUCHER
      ═════════════════════════════════════════════════════════════ */}
      {activeModal === 'detail' && selectedVoucher && (
        <div className="bk-modal-backdrop" onClick={closeModal}>
          <div className="bk-modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="bk-header-styled surface-style">
              <div className="bk-header-title-box">
                <i className="bi bi-tag-fill text-success fs-5" />
                <div>
                  <h3>Chi tiết mã giảm giá</h3>
                  <span>{selectedVoucher.name}</span>
                </div>
              </div>
              <button className="modal-close-btn" onClick={closeModal}>
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <div className="bk-body-scrollable">
              <img
                src={selectedVoucher.image || IMAGE_PRESETS[0].url}
                alt={selectedVoucher.name}
                style={{
                  width: '100%',
                  height: '180px',
                  objectFit: 'cover',
                  borderRadius: '12px'
                }}
              />

              <div className="ticket-code-strip mt-3">
                <span className="ticket-code-val">{selectedVoucher.code}</span>
                <button
                  className="btn-copy-code"
                  onClick={() => handleCopyCode(selectedVoucher.code)}
                >
                  <i className="bi bi-copy" /> Sao chép
                </button>
              </div>

              <div className="form-grid-2 small mt-2">
                <div className="p-2 bg-light rounded">
                  <span className="text-muted d-block">Giá trị ưu đãi:</span>
                  <strong className="text-success fs-6">
                    {selectedVoucher.type === 'percent'
                      ? `Giảm ${selectedVoucher.value}%`
                      : formatVND(selectedVoucher.value)}
                  </strong>
                </div>
                <div className="p-2 bg-light rounded">
                  <span className="text-muted d-block">Giảm tối đa:</span>
                  <strong>
                    {selectedVoucher.maxDiscount > 0
                      ? formatVND(selectedVoucher.maxDiscount)
                      : 'Không giới hạn'}
                  </strong>
                </div>
                <div className="p-2 bg-light rounded">
                  <span className="text-muted d-block">Đơn tối thiểu:</span>
                  <strong>
                    {selectedVoucher.minOrder > 0
                      ? formatVND(selectedVoucher.minOrder)
                      : 'Không yêu cầu'}
                  </strong>
                </div>
                <div className="p-2 bg-light rounded">
                  <span className="text-muted d-block">Thời hạn áp dụng:</span>
                  <strong>
                    {toVN(selectedVoucher.start)} - {toVN(selectedVoucher.end)}
                  </strong>
                </div>
              </div>

              <div className="p-2 bg-light rounded small mt-2">
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">Cơ sở áp dụng:</span>
                  <strong>{selectedVoucher.homestayName || 'Toàn bộ cơ sở YÊN'}</strong>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">Đối tượng:</span>
                  <strong>{selectedVoucher.audience || 'Công khai toàn sàn'}</strong>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Số lượt đã dùng:</span>
                  <strong className="text-success">
                    {selectedVoucher.used || 0} / {selectedVoucher.usageLimit} lượt
                  </strong>
                </div>
              </div>

              {selectedVoucher.description && (
                <div className="small text-muted p-2 mt-2 bg-white border rounded">
                  <strong>Điều kiện: </strong>
                  {selectedVoucher.description}
                </div>
              )}
            </div>

            <div className="bk-footer-styled">
              <button className="btn-secondary-action" onClick={closeModal}>
                Đóng
              </button>
              <button
                className="btn-primary-action"
                onClick={() => {
                  closeModal();
                  openEditModal(selectedVoucher);
                }}
              >
                <i className="bi bi-pencil me-1" /> Chỉnh sửa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          MODAL 3: LỊCH SỬ PHÁT HÀNH
      ═════════════════════════════════════════════════════════════ */}
      {activeModal === 'history' && (
        <div className="bk-modal-backdrop" onClick={closeModal}>
          <div className="bk-modal-window large" onClick={(e) => e.stopPropagation()}>
            <div className="bk-header-styled surface-style">
              <div className="bk-header-title-box">
                <i className="bi bi-clock-history text-primary fs-5" />
                <div>
                  <h3>Lịch sử phát hành Voucher</h3>
                  <span>Tổng hợp các chiến dịch ưu đãi của homestay</span>
                </div>
              </div>
              <button className="modal-close-btn" onClick={closeModal}>
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <div className="bk-body-scrollable">
              <div className="history-items-list">
                {history.map((h, i) => (
                  <div key={i} className="history-item-row">
                    <div className="history-item-left">
                      <div className="history-item-icon">
                        <i className="bi bi-ticket-perforated" />
                      </div>
                      <div className="history-item-info">
                        <strong>{h.name}</strong>
                        <span>
                          {h.code} • {h.period}
                        </span>
                      </div>
                    </div>
                    <div className="history-item-right">
                      <strong>{formatVND(h.revenue)}</strong>
                      <span>
                        Đã dùng {h.used}/{h.limit} lượt
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bk-footer-styled">
              <button className="btn-secondary-action" onClick={closeModal}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          MODAL 4: XOÁ MÃ GIẢM GIÁ
      ═════════════════════════════════════════════════════════════ */}
      {activeModal === 'delete' && selectedVoucher && (
        <div className="bk-modal-backdrop" onClick={closeModal}>
          <div className="bk-modal-window small" onClick={(e) => e.stopPropagation()}>
            <div className="bk-header-styled error-style">
              <div className="bk-header-title-box">
                <i className="bi bi-trash fs-5" />
                <div>
                  <h3>Xoá mã giảm giá</h3>
                  <span>Dừng và gỡ mã "{selectedVoucher.code}"</span>
                </div>
              </div>
              <button className="modal-close-btn text-white" onClick={closeModal}>
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <form onSubmit={handleConfirmDelete}>
              <div className="bk-body-scrollable">
                <div className="p-3 bg-light rounded-3 small">
                  <strong>{selectedVoucher.name}</strong>
                  <div className="text-muted">
                    Đã sử dụng: {selectedVoucher.used || 0} lượt
                  </div>
                </div>

                <div className="form-group-item">
                  <label className="form-label-title">Lý do xoá mã:</label>
                  <select
                    className="form-input-field"
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                  >
                    <option value="Hết ngân sách khuyến mãi">Hết ngân sách khuyến mãi</option>
                    <option value="Trùng chương trình khác">Trùng chương trình khác</option>
                    <option value="Phát hiện gian lận">Phát hiện lạm dụng mã</option>
                    <option value="Kết thúc theo kế hoạch">Kết thúc theo kế hoạch</option>
                  </select>
                </div>

                <label className="d-flex align-items-center gap-2 small">
                  <input
                    type="checkbox"
                    checked={deleteNotify}
                    onChange={(e) => setDeleteNotify(e.target.checked)}
                  />
                  <span>Thông báo dừng áp dụng tới du khách đã lưu mã</span>
                </label>
              </div>

              <div className="bk-footer-styled">
                <button
                  type="button"
                  className="btn-secondary-action"
                  onClick={closeModal}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn-primary-action"
                  style={{ background: '#dc2626' }}
                >
                  <i className="bi bi-trash me-1" /> Xác nhận xoá mã
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
