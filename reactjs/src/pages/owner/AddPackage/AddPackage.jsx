import { useState, useEffect, useCallback, useMemo } from 'react';
import './AddPackage.css';
import {
  INITIAL_PACKAGES,
  INITIAL_STATS,
  SEED_HISTORY,
  FILTER_OPTIONS,
  fmtVND,
} from './addPackageData';
import { ownerAdsService } from '../../../services/ownerAdsService';
import { authService } from '../../../services/authService';

export default function AddPackage() {
  // ── States ──────────────────────────────────────────────────
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [historyTab, setHistoryTab] = useState('all'); // 'all' | 'running' | 'completed'

  // Khởi tạo ngay lập tức từ Cache để hiển thị 0 giây
  const [packagesList, setPackagesList] = useState(() => {
    return ownerAdsService.getCachedPackages() || INITIAL_PACKAGES;
  });

  const [historyList, setHistoryList] = useState(() => {
    return ownerAdsService.getCachedOrders() || SEED_HISTORY;
  });

  const [statsData, setStatsData] = useState(() => {
    const cachedOrders = ownerAdsService.getCachedOrders() || SEED_HISTORY;
    const dynamicStats = ownerAdsService.computeStatsFromOrders(cachedOrders);
    return { ...INITIAL_STATS, ...dynamicStats };
  });

  const [homestays, setHomestays] = useState(() => ownerAdsService.getQuickHomestays());
  const [selectedHomestayId, setSelectedHomestayId] = useState(() => {
    const stored = localStorage.getItem('ownerActiveHomestayId');
    return stored || '1';
  });
  const [campaignTitle, setCampaignTitle] = useState('');

  // Wallet State
  const [walletBalance, setWalletBalance] = useState(() => {
    const saved = localStorage.getItem('owner_ad_wallet');
    return saved ? parseInt(saved, 10) : 2450000;
  });

  // Modal confirm purchase
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  // Modal recharge wallet
  const [isRechargeOpen, setIsRechargeOpen] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState(1000000);

  // Modal order details
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Toast message
  const [toastMessage, setToastMessage] = useState(null);

  // Current logged in owner
  const currentUser = authService.getCurrentUser();
  const ownerId = currentUser?.id || 1;

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Sync wallet to localStorage
  useEffect(() => {
    localStorage.setItem('owner_ad_wallet', walletBalance.toString());
  }, [walletBalance]);

  // Lắng nghe sự kiện chuyển đổi Homestay từ Sidebar
  useEffect(() => {
    const handleHomestayChange = () => {
      const activeId = localStorage.getItem('ownerActiveHomestayId');
      if (activeId) {
        setSelectedHomestayId(activeId);
      }
      setHomestays(ownerAdsService.getQuickHomestays());
    };

    window.addEventListener('ownerActiveHomestayChanged', handleHomestayChange);
    return () => window.removeEventListener('ownerActiveHomestayChanged', handleHomestayChange);
  }, []);

  // ── LOAD DỮ LIỆU TỪ CSDL CHẠY NGẦM (NON-BLOCKING) ─────────
  const fetchAllData = useCallback(async () => {
    try {
      // Chạy song song cả 2 request lấy Packages và Orders cùng một lúc
      const [pkgResult, ordResult] = await Promise.allSettled([
        ownerAdsService.getPackages(filter, searchQuery),
        ownerAdsService.getOrders(ownerId)
      ]);

      // 1. Cập nhật gói quảng cáo từ CSDL
      if (pkgResult.status === 'fulfilled' && pkgResult.value.success && pkgResult.value.data?.length > 0) {
        setPackagesList(pkgResult.value.data);
      }

      // 2. Cập nhật lịch sử đơn quảng cáo từ CSDL
      let currentOrders = historyList;
      if (ordResult.status === 'fulfilled' && ordResult.value.success && ordResult.value.data?.length > 0) {
        currentOrders = ordResult.value.data;
        setHistoryList(ordResult.value.data);
      }

      // 3. Tính toán thống kê động
      const dynamicStats = ownerAdsService.computeStatsFromOrders(currentOrders);
      setStatsData(prev => ({
        ...prev,
        ...dynamicStats,
        featuredBanner: prev.featuredBanner || INITIAL_STATS.featuredBanner
      }));
    } catch (err) {
      console.warn('Đồng bộ CSDL ngầm:', err);
    }
  }, [filter, searchQuery, ownerId, historyList]);

  // Đồng bộ ngầm ngay khi vào trang mà không che màn hình
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // ── FILTERED PACKAGES ───────────────────────────────────────
  const filteredPackages = useMemo(() => {
    return packagesList.filter((pkg) => {
      if (filter === 'all') return true;
      return pkg.categories && pkg.categories.includes(filter);
    });
  }, [packagesList, filter]);

  // ── FILTERED HISTORY ────────────────────────────────────────
  const filteredHistory = useMemo(() => {
    return historyList.filter((item) => {
      if (historyTab === 'all') return true;
      if (historyTab === 'running') return item.status === 'Đang chạy';
      if (historyTab === 'completed') return item.status === 'Đã hoàn thành' || item.status === 'Hết hạn';
      return true;
    });
  }, [historyList, historyTab]);

  // ── Open modal confirm purchase ─────────────────────────────
  const handleOpenConfirm = (pkg) => {
    setSelectedPkg(pkg);
    const activeHs = homestays.find(h => String(h.id) === String(selectedHomestayId)) || homestays[0];
    setCampaignTitle(`Đẩy Top ${activeHs ? activeHs.name : 'Homestay'} - ${pkg.name}`);
    setIsModalOpen(true);
  };

  const handleCloseConfirm = () => {
    if (purchasing) return;
    setIsModalOpen(false);
    setSelectedPkg(null);
  };

  // ── Open Order Detail ───────────────────────────────────────
  const handleOpenOrderDetail = (order) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  // ── Quick Shortfall Recharge ────────────────────────────────
  const handleQuickRechargeShortfall = (shortfall) => {
    setIsModalOpen(false);
    setRechargeAmount(Math.max(100000, Math.ceil(shortfall / 100000) * 100000));
    setIsRechargeOpen(true);
  };

  // ── EXECUTE PURCHASE (LƯU VÀO CSDL) ─────────────────────────
  const handleConfirmPurchase = async () => {
    if (!selectedPkg) return;

    if (walletBalance < selectedPkg.price) {
      const shortfall = selectedPkg.price - walletBalance;
      handleQuickRechargeShortfall(shortfall);
      return;
    }

    setPurchasing(true);

    try {
      const activeHs = homestays.find(h => String(h.id) === String(selectedHomestayId)) || homestays[0];

      // Gửi đơn mua đến backend Spring Boot để lưu vào bảng homestay_ads
      const result = await ownerAdsService.buyPackage({
        packageId: selectedPkg.id,
        homestayId: activeHs ? activeHs.id : 1,
        ownerId: ownerId,
        pkgName: selectedPkg.name,
        pricePaid: selectedPkg.price,
        campaignTitle: campaignTitle || `Quảng cáo ${selectedPkg.name}`,
        durationDays: selectedPkg.durationDays || 30,
      });

      if (result.success) {
        // Trừ tiền trong ví
        const newBalance = walletBalance - selectedPkg.price;
        setWalletBalance(newBalance);

        // Tạo bản ghi hiển thị ngay ở bảng lịch sử
        const today = new Date();
        const dateStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}`;
        
        const newRecord = {
          id: result.data?.order?.id || result.data?.orderId || Date.now(),
          orderCode: result.data?.order?.orderCode || `ORD-ADS-${Date.now().toString().slice(-4)}`,
          pkgName: selectedPkg.name,
          homestayName: activeHs ? activeHs.name : 'Homestay của bạn',
          price: selectedPkg.price,
          duration: selectedPkg.duration || '30 ngày',
          date: dateStr,
          status: 'Đang chạy',
          daysLeft: selectedPkg.durationDays || 30,
          campaign: campaignTitle || `Quảng cáo ${selectedPkg.name}`,
          timestamp: Date.now(),
        };

        const updatedHistory = [newRecord, ...historyList];
        setHistoryList(updatedHistory);

        // Cập nhật widget Gói đang kích hoạt
        setStatsData(prev => ({
          ...prev,
          activePackage: {
            name: selectedPkg.name,
            status: 'Đang chạy',
            daysLeft: selectedPkg.durationDays || 30,
            campaign: campaignTitle || `Quảng cáo ${selectedPkg.name}`,
          },
          runningCount: (prev.runningCount || 0) + 1,
          monthlyViews: (prev.monthlyViews || 35000) + 12000,
        }));

        handleCloseConfirm();
        showToast(`Đăng ký thành công ${selectedPkg.name}! Đã lưu vào CSDL. Số dư ví còn: ${fmtVND(newBalance)}.`);

        // Kích hoạt đồng bộ lại CSDL
        setTimeout(() => {
          fetchAllData();
        }, 500);
      } else {
        alert('Lỗi đăng ký gói: ' + (result.message || 'Không thể kết nối máy chủ'));
      }
    } catch (err) {
      console.error('Lỗi khi mua gói:', err);
      alert('Đã xảy ra lỗi khi xử lý mua gói quảng cáo: ' + err.message);
    } finally {
      setPurchasing(false);
    }
  };

  // ── EXECUTE RECHARGE WALLET ─────────────────────────────────
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
            Các gói quảng cáo được cấu hình và mở bán trực tiếp từ ban quản trị hệ thống.
          </p>
        </div>

        {/* Action Toolbar & Balance */}
        <div className="pkg-hero-actions">
          {/* Search & Filter Pills */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="pkg-search-box">
              <i className="bi bi-search" />
              <input
                type="text"
                className="pkg-search-input"
                placeholder="Tìm kiếm gói quảng cáo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

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
          <div>
            <h2>Danh sách các Gói Quảng Cáo &amp; Đẩy Top</h2>
            <p>Lựa chọn gói giải pháp tối ưu nhất cho Homestay của bạn để bứt phá doanh số đặt phòng</p>
          </div>
          {packagesList.length > 0 && (
            <span style={{ fontSize: '0.85rem', color: '#065F46', fontWeight: 600 }}>
              <i className="bi bi-check2-circle" /> {filteredPackages.length} gói đang mở bán
            </span>
          )}
        </div>

        {filteredPackages.length === 0 ? (
          <div className="pkg-empty-state">
            <i className="bi bi-box-seam" />
            <h4>Không tìm thấy gói quảng cáo phù hợp</h4>
            <p>Hãy thử chọn bộ lọc khác hoặc nhập từ khóa tìm kiếm mới</p>
          </div>
        ) : (
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
                    style={{ backgroundColor: pkg.iconBg || '#DCFCE7', color: pkg.iconColor || '#166534' }}
                  >
                    <i className={`bi ${pkg.icon || 'bi-star-fill'}`} />
                  </div>
                  <h3 className="pkg-name">{pkg.name}</h3>
                  <p className="pkg-desc">{pkg.desc}</p>

                  <div className="pkg-price-row">
                    {fmtVND(pkg.price)}
                    <span className="pkg-price-unit">/ {pkg.duration}</span>
                  </div>

                  <ul className="pkg-features-list">
                    {(pkg.features || []).map((feat, idx) => (
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
                  <i className="bi bi-cart-check-fill" style={{ marginRight: '6px' }} />
                  {pkg.buttonText || 'Đăng ký ngay'}
                </button>
              </div>
            ))}
          </div>
        )}
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
                {statsData.monthlyViews.toLocaleString('vi-VN')}
                <span>lượt</span>
              </div>
              <div className="pkg-stat-growth">
                <i className="bi bi-arrow-up-right" /> {statsData.monthlyViewsChange || '+35.2%'}
                <span>so với tháng trước</span>
              </div>
            </div>

            <div className="pkg-stat-bottom">
              <div className="pkg-progress-row">
                <span>Mục tiêu hiển thị: {statsData.targetViews.toLocaleString('vi-VN')}</span>
                <strong>Đạt {statsData.targetPercent}%</strong>
              </div>
              <div className="pkg-progress-bar">
                <div
                  className="pkg-progress-fill"
                  style={{ width: `${Math.min(100, statsData.targetPercent)}%` }}
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
              <div className="pkg-stat-val" style={{ fontSize: '1.25rem', lineHeight: '1.4' }}>
                {statsData.activePackage?.name || 'Chưa có gói kích hoạt'}
              </div>
              <div className="pkg-active-badge">
                <i className="bi bi-record-circle-fill me-1" /> {statsData.activePackage?.status || 'Đang chạy'}
                {statsData.activePackage?.daysLeft > 0 ? ` (Còn ${statsData.activePackage.daysLeft} ngày)` : ''}
              </div>
            </div>

            <div className="pkg-stat-bottom">
              <span className="text-slate-500" style={{ fontSize: '0.75rem', color: '#64748B' }}>Chiến dịch hiện tại: </span>
              <strong style={{ fontSize: '0.8rem', color: '#065F46' }}>
                {statsData.activePackage?.campaign || 'Quảng cáo tăng tốc booking'}
              </strong>
            </div>
          </div>
        </div>

        {/* Right column: Featured Banner */}
        <div className="pkg-banner-card">
          <div className="pkg-banner-media">
            <img
              src={statsData.featuredBanner?.image || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'}
              alt={statsData.featuredBanner?.title || 'Banner Quảng Cáo'}
              className="pkg-banner-img"
            />
            <div className="pkg-banner-overlay">
              <span className="pkg-banner-tag">
                <i className="bi bi-patch-check-fill" /> {statsData.featuredBanner?.badge || 'VỊ TRÍ NỔI BẬT TOP 1'}
              </span>
              <h3 className="pkg-banner-title">{statsData.featuredBanner?.title || 'Banner Đẩy Top Trang Chủ'}</h3>
              <p className="pkg-banner-desc">
                {statsData.featuredBanner?.desc || 'Xuất hiện ngay vị trí đầu tiên khi du khách tìm kiếm khu vực homestay của bạn.'}
              </p>
            </div>
          </div>

          <div className="pkg-banner-meta">
            <div className="pkg-banner-meta-row">
              <span>Tỷ lệ tiếp cận mục tiêu</span>
              <strong>{statsData.featuredBanner?.targetReach || '98% Khách hàng tiềm năng'}</strong>
            </div>
            <div className="pkg-banner-meta-divider" />
            <div className="pkg-banner-meta-row">
              <span>Chi phí / Lượt hiển thị (CPC)</span>
              <strong className="accent">{statsData.featuredBanner?.cpc || '~500đ / click'}</strong>
            </div>
          </div>
        </div>
      </section>

      {/* ── REGISTERED HISTORY SECTION ──────────────────────── */}
      <section className="pkg-history-card">
        <div className="pkg-history-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <h3>
              <i className="bi bi-clock-history" /> Lịch sử Đăng ký Gói Quảng Cáo
            </h3>
            <div className="pkg-history-tabs">
              <button
                type="button"
                className={`pkg-htab-btn ${historyTab === 'all' ? 'active' : ''}`}
                onClick={() => setHistoryTab('all')}
              >
                Tất cả ({historyList.length})
              </button>
              <button
                type="button"
                className={`pkg-htab-btn ${historyTab === 'running' ? 'active' : ''}`}
                onClick={() => setHistoryTab('running')}
              >
                Đang chạy ({historyList.filter(i => i.status === 'Đang chạy').length})
              </button>
              <button
                type="button"
                className={`pkg-htab-btn ${historyTab === 'completed' ? 'active' : ''}`}
                onClick={() => setHistoryTab('completed')}
              >
                Đã hoàn thành ({historyList.filter(i => i.status !== 'Đang chạy').length})
              </button>
            </div>
          </div>

          <span className="pkg-history-badge">
            <i className="bi bi-database-check" /> {filteredHistory.length} đơn quảng cáo
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="pkg-history-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Tên gói dịch vụ</th>
                <th>Homestay áp dụng</th>
                <th>Thời hạn</th>
                <th>Ngày đăng ký</th>
                <th>Chi phí</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: '#64748B' }}>
                    Chưa có đơn quảng cáo nào trong mục này. Hãy chọn một gói phía trên để đăng ký!
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <code style={{ background: '#F1F5F9', padding: '2px 6px', borderRadius: '4px', fontSize: '0.78rem', color: '#475569' }}>
                        {item.orderCode || `ORD-${item.id}`}
                      </code>
                    </td>
                    <td><strong>{item.pkgName}</strong></td>
                    <td>
                      <span style={{ color: '#0F172A', fontWeight: 500 }}>
                        <i className="bi bi-house-door" style={{ color: '#059669', marginRight: '4px' }} />
                        {item.homestayName || 'Homestay của bạn'}
                      </span>
                    </td>
                    <td>
                      <div>
                        {item.duration || '30 ngày'}
                        {item.dateRange && (
                          <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{item.dateRange}</div>
                        )}
                      </div>
                    </td>
                    <td>{item.date || item.startDate}</td>
                    <td><strong style={{ color: '#065F46' }}>{fmtVND(item.price)}</strong></td>
                    <td>
                      <span className={`pkg-status-tag ${item.status === 'Đang chạy' ? 'active' : 'completed'}`}>
                        {item.status}
                        {item.status === 'Đang chạy' && item.daysLeft > 0 ? ` (${item.daysLeft} ngày)` : ''}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="pkg-btn-view-detail"
                        onClick={() => handleOpenOrderDetail(item)}
                        title="Xem chi tiết đơn quảng cáo"
                      >
                        <i className="bi bi-eye-fill" /> Chi tiết
                      </button>
                    </td>
                  </tr>
                ))
              )}
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
                <h3 className="pkg-modal-title">Xác nhận đăng ký dịch vụ quảng cáo</h3>
              </div>
              <button
                type="button"
                className="pkg-modal-close-btn"
                onClick={handleCloseConfirm}
                aria-label="Đóng"
                disabled={purchasing}
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

              {/* Homestay Selection */}
              <div className="pkg-form-group">
                <label className="pkg-form-label" htmlFor="pkg-select-homestay">
                  <i className="bi bi-house-door" style={{ color: '#059669' }} /> Chọn Homestay muốn chạy quảng cáo:
                </label>
                <select
                  id="pkg-select-homestay"
                  className="pkg-form-select"
                  value={selectedHomestayId}
                  onChange={(e) => {
                    setSelectedHomestayId(e.target.value);
                    const found = homestays.find(h => String(h.id) === String(e.target.value));
                    if (found) {
                      setCampaignTitle(`Đẩy Top ${found.name} - ${selectedPkg.name}`);
                    }
                  }}
                >
                  {homestays.map((hs) => (
                    <option key={hs.id} value={hs.id}>
                      {hs.name} ({hs.city})
                    </option>
                  ))}
                </select>
              </div>

              {/* Campaign Title / Slogan */}
              <div className="pkg-form-group">
                <label className="pkg-form-label" htmlFor="pkg-input-campaign">
                  <i className="bi bi-tag" style={{ color: '#059669' }} /> Tiêu đề chiến dịch / Ghi chú quảng cáo:
                </label>
                <input
                  id="pkg-input-campaign"
                  type="text"
                  className="pkg-form-input"
                  placeholder="Ví dụ: Chiến dịch mùa lúa chín đón khách..."
                  value={campaignTitle}
                  onChange={(e) => setCampaignTitle(e.target.value)}
                />
              </div>

              {/* Price & Wallet details */}
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
                  <span>Số dư Ví Ads hiện tại:</span>
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

              {/* Shortfall Alert if balance not enough */}
              {walletBalance < selectedPkg.price && (
                <div className="pkg-shortfall-alert">
                  <div className="pkg-shortfall-text">
                    Số dư ví hiện tại còn thiếu <strong>{fmtVND(selectedPkg.price - walletBalance)}</strong> để đăng ký gói này.
                  </div>
                  <button
                    type="button"
                    className="pkg-shortfall-btn"
                    onClick={() => handleQuickRechargeShortfall(selectedPkg.price - walletBalance)}
                  >
                    <i className="bi bi-plus-circle-fill" /> Nạp ngay
                  </button>
                </div>
              )}

              {/* Benefits */}
              <div className="pkg-modal-benefits-box">
                <span className="pkg-modal-benefits-title">Quyền lợi gói quảng cáo</span>
                <ul className="pkg-modal-benefits-list">
                  {(selectedPkg.features || []).map((feat, idx) => (
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
                disabled={purchasing}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="pkg-modal-btn-confirm"
                onClick={handleConfirmPurchase}
                disabled={purchasing}
              >
                {purchasing ? (
                  <>
                    <i className="bi bi-arrow-repeat" style={{ animation: 'pkgSpin 1s linear infinite' }} />
                    Đang lưu vào CSDL...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check2-circle" /> Xác nhận đăng ký &amp; Kích hoạt
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL CHI TIẾT ĐƠN QUẢNG CÁO ────────────────────── */}
      {isDetailOpen && selectedOrder && (
        <div className="pkg-modal-backdrop" onClick={() => setIsDetailOpen(false)}>
          <div className="pkg-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="pkg-modal-header">
              <div className="pkg-modal-title-wrap">
                <div className="pkg-modal-icon-badge" style={{ background: '#ECFDF5', color: '#047857' }}>
                  <i className="bi bi-megaphone-fill" />
                </div>
                <h3 className="pkg-modal-title">Chi tiết Chiến dịch Quảng Cáo</h3>
              </div>
              <button
                type="button"
                className="pkg-modal-close-btn"
                onClick={() => setIsDetailOpen(false)}
                aria-label="Đóng"
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <div className="pkg-modal-body">
              <div className="pkg-modal-highlight-card">
                <span className="pkg-modal-badge-label">Mã đơn: {selectedOrder.orderCode || `ORD-${selectedOrder.id}`}</span>
                <h4 className="pkg-modal-pkg-name">{selectedOrder.pkgName}</h4>
                <p className="pkg-modal-pkg-desc">Áp dụng cho: <strong>{selectedOrder.homestayName}</strong></p>
              </div>

              <div className="pkg-detail-grid">
                <div className="pkg-detail-item">
                  <span className="label">Trạng thái</span>
                  <span className="val">
                    <span className={`pkg-status-tag ${selectedOrder.status === 'Đang chạy' ? 'active' : 'completed'}`}>
                      {selectedOrder.status}
                    </span>
                  </span>
                </div>
                <div className="pkg-detail-item">
                  <span className="label">Thời hạn còn lại</span>
                  <span className="val accent">
                    {selectedOrder.daysLeft > 0 ? `${selectedOrder.daysLeft} ngày` : 'Đã kết thúc'}
                  </span>
                </div>
                <div className="pkg-detail-item">
                  <span className="label">Chi phí đã trả</span>
                  <span className="val accent">{fmtVND(selectedOrder.price)}</span>
                </div>
                <div className="pkg-detail-item">
                  <span className="label">Thanh toán</span>
                  <span className="val" style={{ color: '#059669' }}>
                    <i className="bi bi-patch-check-fill me-1" /> Đã thanh toán
                  </span>
                </div>
                <div className="pkg-detail-item" style={{ gridColumn: '1 / -1' }}>
                  <span className="label">Thời gian chiến dịch</span>
                  <span className="val">
                    {selectedOrder.dateRange || `${selectedOrder.date || 'Hôm nay'} (${selectedOrder.duration || '30 ngày'})`}
                  </span>
                </div>
                <div className="pkg-detail-item" style={{ gridColumn: '1 / -1' }}>
                  <span className="label">Thông điệp chiến dịch</span>
                  <span className="val">{selectedOrder.campaign || selectedOrder.pkgName}</span>
                </div>
              </div>

              <div className="pkg-modal-benefits-box">
                <span className="pkg-modal-benefits-title">Đặc quyền đang áp dụng trên website</span>
                <ul className="pkg-modal-benefits-list">
                  <li>
                    <i className="bi bi-check-circle-fill" />
                    <span>Ưu tiên xuất hiện đầu danh sách tìm kiếm và bản đồ khu vực</span>
                  </li>
                  <li>
                    <i className="bi bi-check-circle-fill" />
                    <span>Gắn nhãn nổi bật thu hút du khách đặt phòng nhanh hơn</span>
                  </li>
                  <li>
                    <i className="bi bi-check-circle-fill" />
                    <span>Thống kê lượt xem và click quảng cáo cập nhật tự động</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pkg-modal-footer">
              <button
                type="button"
                className="pkg-modal-btn-cancel"
                onClick={() => setIsDetailOpen(false)}
              >
                Đóng
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

              <div className="pkg-recharge-grid" style={{ marginTop: '12px' }}>
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

              {/* QR Mockup Box */}
              <div className="pkg-qr-box">
                <div className="pkg-qr-img">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=YENHOMESTAY_ADS_RECHARGE_${rechargeAmount}`}
                    alt="VietQR Code"
                  />
                </div>
                <div className="pkg-qr-details">
                  <span>Ngân hàng: <strong>MBBank (Quân Đội)</strong></span>
                  <span>Số tài khoản: <strong>9999.8888.6688</strong></span>
                  <span>Chủ tài khoản: <strong>YEN HOMESTAY VIETNAM</strong></span>
                  <span>Nội dung CK: <strong>NAP ADS OWNER {ownerId}</strong></span>
                </div>
              </div>

              <div className="pkg-modal-detail-list" style={{ marginTop: '12px' }}>
                <div className="pkg-modal-detail-row">
                  <span>Phương thức nạp:</span>
                  <strong>Mã QR Ngân hàng (Tự động 24/7)</strong>
                </div>
                <div className="pkg-modal-detail-row">
                  <span>Số tiền nạp vào ví:</span>
                  <strong className="price">{fmtVND(rechargeAmount)}</strong>
                </div>
                <div className="pkg-modal-detail-row">
                  <span>Số dư sau khi nạp:</span>
                  <strong style={{ color: '#065F46' }}>{fmtVND(walletBalance + rechargeAmount)}</strong>
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
                <i className="bi bi-qr-code-scan" /> Xác nhận đã chuyển khoản &amp; Cộng tiền
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
