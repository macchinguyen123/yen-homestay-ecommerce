import { useState, useEffect } from 'react';
import './AddPackage.css';
import {
  INITIAL_PACKAGES,
  INITIAL_STATS,
  SEED_HISTORY,
  FILTER_OPTIONS,
  fmtVND,
} from './addPackageData';

export default function AddPackage() {
  // ── States ──────────────────────────────────────────────────
  const [filter, setFilter] = useState('all');
  const [walletBalance, setWalletBalance] = useState(() => {
    const saved = localStorage.getItem('owner_ad_wallet');
    return saved ? parseInt(saved, 10) : 2450000;
  });

  const [historyList, setHistoryList] = useState(() => {
    const saved = localStorage.getItem('owner_ad_history');
    return saved ? JSON.parse(saved) : SEED_HISTORY;
  });

  const [activePackageInfo, setActivePackageInfo] = useState(INITIAL_STATS.activePackage);

  // Modal confirm purchase
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal recharge wallet
  const [isRechargeOpen, setIsRechargeOpen] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState(1000000);

  // Toast
  const [toastMessage, setToastMessage] = useState(null);

  // Sync wallet & history to localStorage
  useEffect(() => {
    localStorage.setItem('owner_ad_wallet', walletBalance.toString());
  }, [walletBalance]);

  useEffect(() => {
    localStorage.setItem('owner_ad_history', JSON.stringify(historyList));
  }, [historyList]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // ── Filtered Packages ───────────────────────────────────────
  const filteredPackages = INITIAL_PACKAGES.filter((pkg) => {
    if (filter === 'all') return true;
    return pkg.categories.includes(filter);
  });

  // ── Open modal confirm ──────────────────────────────────────
  const handleOpenConfirm = (pkg) => {
    setSelectedPkg(pkg);
    setIsModalOpen(true);
  };

  const handleCloseConfirm = () => {
    setIsModalOpen(false);
    setSelectedPkg(null);
  };

  // ── Execute Purchase ────────────────────────────────────────
  const handleConfirmPurchase = () => {
    if (!selectedPkg) return;

    if (walletBalance < selectedPkg.price) {
      alert(`Số dư Ví Ads (${fmtVND(walletBalance)}) không đủ để đăng ký ${selectedPkg.name} (${fmtVND(selectedPkg.price)}). Vui lòng nạp thêm tiền vào ví!`);
      setIsModalOpen(false);
      setIsRechargeOpen(true);
      return;
    }

    // Deduct balance
    const newBalance = walletBalance - selectedPkg.price;
    setWalletBalance(newBalance);

    // Add to history
    const today = new Date();
    const dateStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}`;
    const newRecord = {
      id: Date.now(),
      pkgName: selectedPkg.name,
      price: selectedPkg.price,
      duration: selectedPkg.duration,
      date: dateStr,
      status: 'Đang chạy',
      timestamp: Date.now(),
    };

    setHistoryList([newRecord, ...historyList]);
    setActivePackageInfo({
      name: selectedPkg.name,
      status: 'Đang chạy',
      daysLeft: parseInt(selectedPkg.duration, 10) || 7,
      campaign: 'Quảng cáo tăng tốc booking',
    });

    handleCloseConfirm();
    showToast(`Đăng ký thành công ${selectedPkg.name}! Số dư còn lại: ${fmtVND(newBalance)}.`);
  };

  // ── Execute Recharge ────────────────────────────────────────
  const handleConfirmRecharge = () => {
    const newBal = walletBalance + rechargeAmount;
    setWalletBalance(newBal);
    setIsRechargeOpen(false);
    showToast(`Đã nạp thành công ${fmtVND(rechargeAmount)} vào Ví Ads! Số dư mới: ${fmtVND(newBal)}.`);
  };

  return (
    <div className="add-package-page">
      {/* ── TOP HERO BANNER ─────────────────────────────────── */}
      <section className="pkg-hero-banner">
        <div className="pkg-hero-glow" />

        <div className="pkg-hero-content">
          <span className="pkg-hero-tag">
            <i className="bi bi-rocket-takeoff-fill" /> Dịch vụ Quảng bá Homestay
          </span>
          <h1 className="pkg-hero-title">Đăng ký Gói Quảng Cáo &amp; Đẩy Top</h1>
          <p className="pkg-hero-subtitle">
            Gia tăng lượt tiếp cận du khách tiềm năng, tối ưu hóa công suất phòng mùa cao điểm.
          </p>
        </div>

        {/* Action Toolbar & Balance */}
        <div className="pkg-hero-actions">
          {/* Filter Pills */}
          <div className="pkg-filters" role="group" aria-label="Bộ lọc gói">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={`pkg-filter-btn ${filter === opt.id ? 'active' : ''}`}
                onClick={() => setFilter(opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Wallet balance & recharge button */}
          <div className="pkg-wallet-bar">
            <div className="pkg-wallet-badge">
              <i className="bi bi-wallet2" />
              <span>Số dư ví: <strong>{fmtVND(walletBalance)}</strong></span>
            </div>
            <button
              type="button"
              className="pkg-btn-recharge"
              onClick={() => setIsRechargeOpen(true)}
            >
              <i className="bi bi-plus-circle-fill" /> Nạp tiền Ví Ads
            </button>
          </div>
        </div>
      </section>

      {/* ── PACKAGES GRID SECTION ───────────────────────────── */}
      <section className="pkg-section">
        <div className="pkg-section-head">
          <h2>Danh sách các Gói Quảng Cáo &amp; Đẩy Top</h2>
          <p>Lựa chọn gói giải pháp tối ưu nhất cho Homestay của bạn để bứt phá doanh số đặt phòng</p>
        </div>

        <div className="pkg-cards-grid">
          {filteredPackages.map((pkg) => (
            <div
              key={pkg.id}
              className={`pkg-card ${pkg.isHot ? 'featured' : ''}`}
            >
              {pkg.badge && <span className="pkg-ribbon">{pkg.badge}</span>}

              <div className="pkg-card-top">
                <div
                  className="pkg-icon-wrap"
                  style={{ backgroundColor: pkg.iconBg, color: pkg.iconColor }}
                >
                  <i className={`bi ${pkg.icon}`} />
                </div>
                <h3 className="pkg-name">{pkg.name}</h3>
                <p className="pkg-desc">{pkg.desc}</p>

                <div className="pkg-price-row">
                  {fmtVND(pkg.price)}
                  <span className="pkg-price-unit">/ {pkg.duration}</span>
                </div>

                <ul className="pkg-features-list">
                  {pkg.features.map((feat, idx) => (
                    <li key={idx}>
                      <i className="bi bi-check-circle-fill" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                className={`pkg-btn-action ${pkg.isHot ? 'primary' : 'outline'}`}
                onClick={() => handleOpenConfirm(pkg)}
              >
                {pkg.buttonText}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── MIDDLE STATS & BANNER ROW ───────────────────────── */}
      <section className="pkg-middle-grid">
        {/* Left column: 2 stacked metric cards */}
        <div className="pkg-stats-col">
          {/* Stat 1: Monthly Views */}
          <div className="pkg-stat-card">
            <div>
              <div className="pkg-stat-top">
                <span className="pkg-stat-label">LƯỢT HIỂN THỊ THÁNG NÀY</span>
                <div className="pkg-stat-icon" style={{ background: '#ECFDF5', color: '#047857' }}>
                  <i className="bi bi-eye-fill" />
                </div>
              </div>
              <div className="pkg-stat-val">
                {INITIAL_STATS.monthlyViews.toLocaleString('vi-VN')}
                <span>lượt</span>
              </div>
              <div className="pkg-stat-growth">
                <i className="bi bi-arrow-up-right" /> {INITIAL_STATS.monthlyViewsChange}
                <span>so với tháng trước</span>
              </div>
            </div>

            <div className="pkg-stat-bottom">
              <div className="pkg-progress-row">
                <span>Mục tiêu hiển thị: {INITIAL_STATS.targetViews.toLocaleString('vi-VN')}</span>
                <strong>Đạt {INITIAL_STATS.targetPercent}%</strong>
              </div>
              <div className="pkg-progress-bar">
                <div
                  className="pkg-progress-fill"
                  style={{ width: `${INITIAL_STATS.targetPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Stat 2: Active Package */}
          <div className="pkg-stat-card">
            <div>
              <div className="pkg-stat-top">
                <span className="pkg-stat-label">GÓI ĐANG KÍCH HOẠT</span>
                <div className="pkg-stat-icon" style={{ background: '#F1F5F9', color: '#065F46' }}>
                  <i className="bi bi-stars" />
                </div>
              </div>
              <div className="pkg-stat-val">
                {activePackageInfo.name}
              </div>
              <div className="pkg-active-badge">
                <i className="bi bi-record-circle-fill me-1" /> {activePackageInfo.status} (Còn {activePackageInfo.daysLeft} ngày)
              </div>
            </div>

            <div className="pkg-stat-bottom">
              <span className="text-slate-500" style={{ fontSize: '0.75rem', color: '#64748B' }}>Chiến dịch hiện tại: </span>
              <strong style={{ fontSize: '0.8rem', color: '#065F46' }}>{activePackageInfo.campaign}</strong>
            </div>
          </div>
        </div>

        {/* Right column: Featured Banner */}
        <div className="pkg-banner-card">
          <div className="pkg-banner-media">
            <img
              src={INITIAL_STATS.featuredBanner.image}
              alt={INITIAL_STATS.featuredBanner.title}
              className="pkg-banner-img"
            />
            <div className="pkg-banner-overlay">
              <span className="pkg-banner-tag">
                <i className="bi bi-patch-check-fill" /> {INITIAL_STATS.featuredBanner.badge}
              </span>
              <h3 className="pkg-banner-title">{INITIAL_STATS.featuredBanner.title}</h3>
              <p className="pkg-banner-desc">{INITIAL_STATS.featuredBanner.desc}</p>
            </div>
          </div>

          <div className="pkg-banner-meta">
            <div className="pkg-banner-meta-row">
              <span>Tỷ lệ tiếp cận mục tiêu</span>
              <strong>{INITIAL_STATS.featuredBanner.targetReach}</strong>
            </div>
            <div className="pkg-banner-meta-divider" />
            <div className="pkg-banner-meta-row">
              <span>Chi phí / Lượt hiển thị (CPC)</span>
              <strong className="accent">{INITIAL_STATS.featuredBanner.cpc}</strong>
            </div>
          </div>
        </div>
      </section>

      {/* ── REGISTERED HISTORY SECTION ──────────────────────── */}
      <section className="pkg-history-card">
        <div className="pkg-history-header">
          <h3>
            <i className="bi bi-clock-history" /> Lịch sử Đăng ký Gói Quảng Cáo
          </h3>
          <span className="pkg-history-badge">{historyList.length} gói đã đăng ký</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="pkg-history-table">
            <thead>
              <tr>
                <th>Tên gói dịch vụ</th>
                <th>Thời hạn</th>
                <th>Ngày đăng ký</th>
                <th>Chi phí</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {historyList.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.pkgName}</strong></td>
                  <td>{item.duration || '30 ngày'}</td>
                  <td>{item.date}</td>
                  <td><strong style={{ color: '#065F46' }}>{fmtVND(item.price)}</strong></td>
                  <td>
                    <span className={`pkg-status-tag ${item.status === 'Đang chạy' ? 'active' : 'completed'}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── MODAL XÁC NHẬN ĐĂNG KÝ GÓI ──────────────────────── */}
      {isModalOpen && selectedPkg && (
        <div className="pkg-modal-backdrop" onClick={handleCloseConfirm}>
          <div className="pkg-modal-box" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="pkg-modal-header">
              <div className="pkg-modal-title-wrap">
                <div className="pkg-modal-icon-badge">
                  <i className="bi bi-patch-check-fill" />
                </div>
                <h3 className="pkg-modal-title">Xác nhận đăng ký dịch vụ</h3>
              </div>
              <button
                type="button"
                className="pkg-modal-close-btn"
                onClick={handleCloseConfirm}
                aria-label="Đóng"
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="pkg-modal-body">
              <div className="pkg-modal-highlight-card">
                <span className="pkg-modal-badge-label">Gói được chọn</span>
                <h4 className="pkg-modal-pkg-name">{selectedPkg.name}</h4>
                <p className="pkg-modal-pkg-desc">{selectedPkg.desc}</p>
              </div>

              <div className="pkg-modal-detail-list">
                <div className="pkg-modal-detail-row">
                  <span>Thời hạn sử dụng:</span>
                  <strong>{selectedPkg.duration}</strong>
                </div>
                <div className="pkg-modal-detail-row">
                  <span>Chi phí gói:</span>
                  <strong className="price">{fmtVND(selectedPkg.price)}</strong>
                </div>
                <div className="pkg-modal-detail-row">
                  <span>Số dư hiện tại:</span>
                  <strong>{fmtVND(walletBalance)}</strong>
                </div>
                <div className="pkg-modal-detail-row">
                  <span>Số dư sau khi trừ:</span>
                  <strong style={{ color: walletBalance >= selectedPkg.price ? '#065F46' : '#DC2626' }}>
                    {walletBalance >= selectedPkg.price
                      ? fmtVND(walletBalance - selectedPkg.price)
                      : 'Không đủ số dư'}
                  </strong>
                </div>
              </div>

              <div className="pkg-modal-benefits-box">
                <span className="pkg-modal-benefits-title">Quyền lợi gói quảng cáo</span>
                <ul className="pkg-modal-benefits-list">
                  {selectedPkg.features.map((feat, idx) => (
                    <li key={idx}>
                      <i className="bi bi-check-circle-fill" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pkg-modal-footer">
              <button
                type="button"
                className="pkg-modal-btn-cancel"
                onClick={handleCloseConfirm}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="pkg-modal-btn-confirm"
                onClick={handleConfirmPurchase}
              >
                <i className="bi bi-check2-circle" /> Xác nhận đăng ký
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL NẠP TIỀN VÍ ADS ───────────────────────────── */}
      {isRechargeOpen && (
        <div className="pkg-modal-backdrop" onClick={() => setIsRechargeOpen(false)}>
          <div className="pkg-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="pkg-modal-header">
              <div className="pkg-modal-title-wrap">
                <div className="pkg-modal-icon-badge">
                  <i className="bi bi-wallet2" />
                </div>
                <h3 className="pkg-modal-title">Nạp tiền Ví Ads Homestay</h3>
              </div>
              <button
                type="button"
                className="pkg-modal-close-btn"
                onClick={() => setIsRechargeOpen(false)}
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <div className="pkg-modal-body">
              <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0 }}>
                Chọn mệnh giá muốn nạp vào ví quảng cáo để kích hoạt các chiến dịch đẩy top ngay lập tức:
              </p>

              <div className="pkg-recharge-grid">
                {[500000, 1000000, 2000000, 5000000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    className={`pkg-amount-btn ${rechargeAmount === amt ? 'active' : ''}`}
                    onClick={() => setRechargeAmount(amt)}
                  >
                    +{fmtVND(amt)}
                  </button>
                ))}
              </div>

              <div className="pkg-modal-detail-list">
                <div className="pkg-modal-detail-row">
                  <span>Phương thức nạp:</span>
                  <strong>Mã QR Ngân hàng (24/7)</strong>
                </div>
                <div className="pkg-modal-detail-row">
                  <span>Số tiền thanh toán:</span>
                  <strong className="price">{fmtVND(rechargeAmount)}</strong>
                </div>
              </div>
            </div>

            <div className="pkg-modal-footer">
              <button
                type="button"
                className="pkg-modal-btn-cancel"
                onClick={() => setIsRechargeOpen(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="pkg-modal-btn-confirm"
                onClick={handleConfirmRecharge}
              >
                <i className="bi bi-qr-code-scan" /> Xác nhận nạp tiền
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST NOTIFICATION ──────────────────────────────── */}
      {toastMessage && (
        <div className="pkg-toast" role="status" aria-live="polite">
          <i className="bi bi-check-circle-fill" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
