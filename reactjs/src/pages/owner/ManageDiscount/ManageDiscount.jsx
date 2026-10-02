import { useState, useEffect } from 'react';
import './ManageDiscount.css';
import {
  INITIAL_VOUCHERS,
  VOUCHER_HISTORY_SEED,
  formatVND,
  toVN
} from './manageDiscountData';

export default function ManageDiscount() {
  // ─── LocalStorage Persistence ─────────────────────────────────
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

  useEffect(() => {
    localStorage.setItem('owner_vouchers_data', JSON.stringify(vouchers));
  }, [vouchers]);

  useEffect(() => {
    localStorage.setItem('owner_voucher_history', JSON.stringify(history));
  }, [history]);

  // ─── Filter & Search ──────────────────────────────────────────
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // ─── Toast System ─────────────────────────────────────────────
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ─── Modals State ─────────────────────────────────────────────
  const [activeModal, setActiveModal] = useState(null); // 'add' | 'edit' | 'detail' | 'history' | 'delete'
  const [selectedVoucher, setSelectedVoucher] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
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
    image: ''
  });

  const [deleteReason, setDeleteReason] = useState('Hết ngân sách khuyến mãi');
  const [deleteNotify, setDeleteNotify] = useState(true);

  const closeModal = () => {
    setActiveModal(null);
  };

  // ─── Handlers: Copy Code ──────────────────────────────────────
  const handleCopyCode = (code) => {
    navigator.clipboard?.writeText(code);
    showToast(`Đã sao chép mã "${code}"`);
  };

  // ─── Handlers: Toggle Status ──────────────────────────────────
  const handleToggleStatus = (code) => {
    setVouchers((prev) =>
      prev.map((v) => {
        if (v.code === code) {
          const next = v.status === 'active' ? 'ended' : 'active';
          return { ...v, status: next };
        }
        return v;
      })
    );
    showToast('Đã cập nhật trạng thái mã');
  };

  // ─── Handlers: Modal Openers ──────────────────────────────────
  const openAddModal = () => {
    setFormData({
      code: '',
      name: '',
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
    setActiveModal('add');
  };

  const openEditModal = (v) => {
    setSelectedVoucher(v);
    setFormData({
      code: v.code,
      name: v.name,
      type: v.type,
      value: v.value,
      maxDiscount: v.maxDiscount || '',
      minOrder: v.minOrder || '',
      usageLimit: v.usageLimit,
      perUser: v.perUser,
      start: v.start,
      end: v.end,
      audience: v.audience,
      description: v.description,
      active: v.status !== 'ended',
      image: v.image || ''
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
  const handleSaveVoucher = (e) => {
    e.preventDefault();
    const code = formData.code.trim().toUpperCase();
    if (!code || !formData.name.trim() || !formData.value) {
      showToast('Vui lòng điền đủ thông tin mã giảm giá', 'error');
      return;
    }

    const payload = {
      ...formData,
      code,
      value: Number(formData.value),
      maxDiscount: Number(formData.maxDiscount) || 0,
      minOrder: Number(formData.minOrder) || 0,
      usageLimit: Number(formData.usageLimit) || 100,
      perUser: Number(formData.perUser) || 1,
      status: formData.active ? 'active' : 'ended',
      used: selectedVoucher ? selectedVoucher.used : 0
    };

    if (activeModal === 'edit' && selectedVoucher) {
      setVouchers((prev) =>
        prev.map((v) => (v.code === selectedVoucher.code ? payload : v))
      );
      showToast(`Đã cập nhật mã "${code}"`);
    } else {
      // Check duplicate code
      if (vouchers.some((v) => v.code === code)) {
        showToast(`Mã "${code}" đã tồn tại! Vui lòng chọn mã khác.`, 'error');
        return;
      }
      setVouchers([payload, ...vouchers]);
      // Also add to history log
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
  };

  const handleConfirmDelete = (e) => {
    e.preventDefault();
    if (!selectedVoucher) return;
    setVouchers((prev) => prev.filter((v) => v.code !== selectedVoucher.code));
    showToast(`Đã xoá mã "${selectedVoucher.code}"`);
    closeModal();
  };

  // ─── Filter Logic ─────────────────────────────────────────────
  const filteredVouchers = vouchers.filter((v) => {
    const matchFilter = filter === 'all' || v.status === filter;
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      v.code.toLowerCase().includes(q) ||
      v.name.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  // KPI Calculations
  const activeCount = vouchers.filter((v) => v.status === 'active').length;
  const totalUsed = vouchers.reduce((acc, v) => acc + (v.used || 0), 0);

  return (
    <div className="manage-discount-page">
      {/* Toast Notification */}
      {toast && (
        <div className={`service-toast-alert ${toast.type}`}>
          <i
            className={`bi ${toast.type === 'error' ? 'bi-exclamation-triangle' : 'bi-check-circle-fill'} me-2`}
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
              Khuyến mãi &amp; Kích cầu
            </div>
            <h1 className="discount-title">Quản lý Mã giảm giá &amp; Voucher Homestay</h1>
            <p className="discount-subtitle">
              Quản lý các chiến dịch giảm giá phòng nghỉ, voucher tri ân du khách hoàn thành nhiệm vụ văn hoá bản địa và gói kích cầu lấp đầy công suất mùa lúa chín Mai Châu.
            </p>
          </div>
          <div className="discount-header-actions">
            <button
              className="btn-secondary-action"
              onClick={() => setActiveModal('history')}
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
            <span>Khả dụng toàn sàn</span>
            <i className="bi bi-check-circle-fill text-success" />
          </div>
        </div>

        <div className="discount-kpi-box">
          <div className="kpi-top-row">
            <div className="kpi-icon-square emerald">
              <i className="bi bi-gift-fill" />
            </div>
            <span className="kpi-badge-pill green">+22% lượt dùng</span>
          </div>
          <div className="kpi-body-number">
            <span className="kpi-big-num">{totalUsed}</span>
            <span className="kpi-unit-label">lượt</span>
            <div className="kpi-desc-text">Lượt sử dụng đợt này</div>
          </div>
          <div className="kpi-foot-row">
            <span>Tăng trưởng đều</span>
            <i className="bi bi-graph-up-arrow text-success" />
          </div>
        </div>

        <div className="discount-kpi-box">
          <div className="kpi-top-row">
            <div className="kpi-icon-square blue">
              <i className="bi bi-cash-stack" />
            </div>
            <span className="kpi-badge-pill">38% Doanh số</span>
          </div>
          <div className="kpi-body-number">
            <span className="kpi-big-num">94.500.000</span>
            <span className="kpi-unit-label">₫</span>
            <div className="kpi-desc-text">Doanh thu qua Voucher</div>
          </div>
          <div className="kpi-foot-row">
            <span>Tổng 248tr mùa vụ</span>
            <i className="bi bi-pie-chart-fill text-primary" />
          </div>
        </div>

        <div className="discount-kpi-box">
          <div className="kpi-top-row">
            <div className="kpi-icon-square amber">
              <i className="bi bi-piggy-bank-fill" />
            </div>
            <span className="kpi-badge-pill amber">ROI 12.1x</span>
          </div>
          <div className="kpi-body-number">
            <span className="kpi-big-num">7.800.000</span>
            <span className="kpi-unit-label">₫</span>
            <div className="kpi-desc-text">Chi phí giảm giá đầu tư</div>
          </div>
          <div className="kpi-foot-row">
            <span>1đ vốn thu về 12.1đ</span>
            <i className="bi bi-lightning-charge-fill text-warning" />
          </div>
        </div>
      </div>

      {/* MAIN TWO-COLUMN CONTENT */}
      <div className="discount-main-grid">
        {/* LEFT COLUMN: FILTERS & TICKETS */}
        <div>
          {/* FILTER STRIP */}
          <div className="discount-filter-strip">
            <div className="discount-tabs-list">
              {[
                { key: 'all', label: `Tất cả (${vouchers.length})` },
                { key: 'active', label: `Đang chạy (${activeCount})` },
                { key: 'upcoming', label: 'Sắp diễn ra (1)' },
                { key: 'ended', label: 'Đã kết thúc (2)' }
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

            <div className="discount-search-box">
              <i className="bi bi-search" />
              <input
                type="text"
                placeholder="Tìm mã hoặc tên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* VOUCHER TICKETS GRID */}
          <div className="voucher-cards-grid">
            {filteredVouchers.map((voucher) => {
              const isActive = voucher.status === 'active';
              const percent = voucher.usageLimit
                ? Math.min(100, Math.round((voucher.used / voucher.usageLimit) * 100))
                : 0;

              return (
                <div key={voucher.code} className="voucher-ticket-card">
                  {/* Card Header Gradient */}
                  <div className="ticket-header-gradient">
                    <span className={`ticket-status-badge ${voucher.status}`}>
                      {isActive && <span className="status-dot-blink" />}
                      {voucher.status === 'active'
                        ? 'Đang hoạt động'
                        : voucher.status === 'upcoming'
                        ? 'Sắp diễn ra'
                        : 'Đã kết thúc'}
                    </span>

                    <div
                      className="toggle-wrap"
                      onClick={() => handleToggleStatus(voucher.code)}
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
                        src={voucher.image}
                        alt={voucher.name}
                        className="ticket-thumb-img"
                      />
                    </div>

                    <p className="ticket-desc-text">{voucher.description}</p>

                    {/* Code Strip */}
                    <div className="ticket-code-strip">
                      <span className="ticket-code-val">{voucher.code}</span>
                      <button
                        className="btn-copy-code"
                        onClick={() => handleCopyCode(voucher.code)}
                      >
                        <i className="bi bi-copy" /> Sao chép
                      </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="ticket-progress-group">
                      <div className="ticket-progress-labels">
                        <span>
                          Đã dùng: <strong>{voucher.used}/{voucher.usageLimit}</strong>
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
                    <div>
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
                        title="Chỉnh sửa"
                        onClick={() => openEditModal(voucher)}
                      >
                        <i className="bi bi-pencil" />
                      </button>
                      <button
                        className="btn-ticket-icon delete"
                        title="Xoá mã"
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
        </div>

        {/* RIGHT COLUMN: TELEMETRY & TIPS */}
        <div className="discount-side-cards">
          {/* Top 1 Voucher Telemetry */}
          <div className="telemetry-card">
            <div className="telemetry-header">
              <h3>
                <i className="bi bi-pie-chart-fill text-success" />
                Hiệu quả MAICHAU15
              </h3>
              <span className="badge bg-light text-dark fw-bold">Top 1</span>
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
                  <strong>42</strong>
                  <span>Booking</span>
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
                    <span>Khách cũ</span>
                  </div>
                  <strong>32%</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Pro Tips Card */}
          <div className="pro-tips-card">
            <h4>
              <i className="bi bi-lightbulb-fill text-warning" />
              Mẹo phát hành Voucher hiệu quả
            </h4>
            <ul>
              <li>Thiết lập mã có hạn dùng 15 - 30 ngày để tạo tâm lý chốt đơn nhanh.</li>
              <li>Giới hạn số tiền giảm tối đa để bảo vệ biên lợi nhuận của homestay.</li>
              <li>Kết hợp voucher giảm giá phòng kèm bữa tối đặc sản để tăng doanh thu phụ trợ.</li>
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
                </div>

                <div className="form-grid-2">
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
                </div>

                <div className="form-grid-2">
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
                  <i className="bi bi-save" /> Lưu mã giảm giá
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
                src={selectedVoucher.image}
                alt={selectedVoucher.name}
                style={{
                  width: '100%',
                  height: '180px',
                  objectFit: 'cover',
                  borderRadius: '12px'
                }}
              />

              <div className="ticket-code-strip">
                <span className="ticket-code-val">{selectedVoucher.code}</span>
                <button
                  className="btn-copy-code"
                  onClick={() => handleCopyCode(selectedVoucher.code)}
                >
                  <i className="bi bi-copy" /> Sao chép
                </button>
              </div>

              <div className="form-grid-2 small">
                <div className="p-2 bg-light rounded">
                  <span className="text-muted d-block">Giá trị:</span>
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
                  <span className="text-muted d-block">Thời gian:</span>
                  <strong>
                    {toVN(selectedVoucher.start)} - {toVN(selectedVoucher.end)}
                  </strong>
                </div>
              </div>

              <div className="small">
                <strong>Đối tượng:</strong> {selectedVoucher.audience}
              </div>
              <div className="small text-muted">{selectedVoucher.description}</div>
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
                <i className="bi bi-pencil" /> Chỉnh sửa
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
                  <div className="text-muted">Đã sử dụng: {selectedVoucher.used} lượt</div>
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
                  <i className="bi bi-trash" /> Xác nhận xoá mã
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
