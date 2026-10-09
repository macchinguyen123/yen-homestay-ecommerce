import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { voucherService } from '../../../services/voucherService';
import './Promotions.css';

export default function Promotions() {
  const navigate = useNavigate();

  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [redeemInput, setRedeemInput] = useState('');

  // Lưu trạng thái voucher đã lưu vào ví từ localStorage
  const [savedVoucherIds, setSavedVoucherIds] = useState(() => {
    try {
      const stored = localStorage.getItem('yen_saved_vouchers');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Modal & Toast state
  const [selectedTermsVoucher, setSelectedTermsVoucher] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);

  // Tải danh sách voucher thật từ Neon PostgreSQL
  useEffect(() => {
    let isMounted = true;
    const fetchVouchers = async () => {
      try {
        setLoading(true);
        const data = await voucherService.getAllVouchers();
        if (isMounted) {
          setVouchers(data);
        }
      } catch (err) {
        console.error('Lỗi khi tải vouchers:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchVouchers();
    return () => {
      isMounted = false;
    };
  }, []);

  // Đồng bộ savedVoucherIds vào localStorage
  const saveSavedIds = (newIds) => {
    setSavedVoucherIds(newIds);
    try {
      localStorage.setItem('yen_saved_vouchers', JSON.stringify(newIds));
    } catch (e) {
      console.error(e);
    }
  };

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3200);
  };

  const isVoucherSaved = (voucher) => {
    return savedVoucherIds.includes(voucher.code) || savedVoucherIds.includes(voucher.id);
  };

  const handleToggleSave = (item) => {
    const isSaved = isVoucherSaved(item);
    let nextSavedIds;
    if (isSaved) {
      nextSavedIds = savedVoucherIds.filter((id) => id !== item.code && id !== item.id);
      triggerToast(`Đã bỏ lưu voucher "${item.code}".`);
    } else {
      nextSavedIds = [...savedVoucherIds, item.code];
      triggerToast(`Đã lưu voucher "${item.code}" vào ví của bạn!`);
    }
    saveSavedIds(nextSavedIds);
  };

  const handleSaveToWallet = (item) => {
    if (isVoucherSaved(item)) {
      triggerToast(`Mã "${item.code}" đã có sẵn trong ví của bạn!`);
      return;
    }
    const nextSavedIds = [...savedVoucherIds, item.code];
    saveSavedIds(nextSavedIds);
    triggerToast(`Đã lưu voucher "${item.code}" cho ${item.homestayName}!`);
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    triggerToast(`Đã sao chép mã "${code}". Dán tại bước thanh toán để nhận ưu đãi!`);
  };

  const handleRedeemSubmit = async (e) => {
    e.preventDefault();
    const raw = redeemInput.trim().toUpperCase();
    if (!raw) {
      triggerToast('Vui lòng nhập mã ưu đãi (Ví dụ: DALAT15, GIAM100K)!');
      return;
    }

    // Kiểm tra trực tiếp trên API thật
    try {
      const res = await voucherService.checkVoucher(raw);
      if (res && res.valid) {
        if (savedVoucherIds.includes(raw)) {
          triggerToast(`Mã "${raw}" đã có sẵn trong ví của bạn!`);
        } else {
          const nextSavedIds = [...savedVoucherIds, raw];
          saveSavedIds(nextSavedIds);
          triggerToast(`Kích hoạt thành công mã ưu đãi "${raw}"! Đã lưu vào ví.`);
        }
      } else {
        triggerToast(res?.message || `Mã "${raw}" không tồn tại hoặc đã hết hạn.`);
      }
    } catch {
      triggerToast(`Không thể kiểm tra mã "${raw}". Vui lòng thử lại sau.`);
    }

    setRedeemInput('');
  };

  // Thống kê nhanh tính từ dữ liệu thật
  const totalHomestaysCount = new Set(
    vouchers.filter((v) => v.homestayId).map((v) => v.homestayId)
  ).size || (vouchers.length > 0 ? vouchers.length : 12);

  const savedCount = vouchers.filter((v) => isVoucherSaved(v)).length;
  const urgentCount = vouchers.filter((v) => v.isUrgent).length;

  // Lọc voucher theo Section và Search query
  const filterBySection = (sec) => {
    return vouchers.filter((v) => {
      // Nếu danh sách ít và không có mục nào theo sec, phân chia đều
      if (v.section !== sec) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        (v.homestayName && v.homestayName.toLowerCase().includes(q)) ||
        (v.code && v.code.toLowerCase().includes(q)) ||
        (v.location && v.location.toLowerCase().includes(q)) ||
        (v.city && v.city.toLowerCase().includes(q))
      );
    });
  };

  const renderGrid = (sectionKey) => {
    if (loading) {
      return (
        <div className="empty-section-card py-4 text-center">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Đang tải dữ liệu...</span>
          </div>
          <p className="mt-2 text-muted">Đang tải mã giảm giá từ hệ thống...</p>
        </div>
      );
    }

    const items = filterBySection(sectionKey);

    if (items.length === 0) {
      return (
        <div className="empty-section-card">
          <p><i className="bi bi-info-circle me-1"></i> Chưa có voucher phù hợp trong mục này.</p>
        </div>
      );
    }

    return items.map((item) => {
      const saved = isVoucherSaved(item);
      const isExpired = item.status === 'EXPIRED' || item.status === 'DISABLED';

      return (
        <div key={item.id} className={`nearby-card compact-card ${isExpired ? 'opacity-75' : ''}`}>
          <div className="nearby-img-box compact-img-box">
            <span className={`nearby-tag ${item.tagClass}`}>{item.collectionBadge}</span>
            <button
              className={`nearby-heart-btn ${saved ? 'active text-danger' : ''}`}
              onClick={() => handleToggleSave(item)}
              title={saved ? 'Bỏ lưu voucher' : 'Lưu voucher vào ví'}
            >
              <i className={`bi ${saved ? 'bi-heart-fill text-danger' : 'bi-heart'}`}></i>
            </button>
            <img src={item.homestayImg} alt={item.homestayName} loading="lazy" />
          </div>

          <div className="nearby-body compact-body">
            <div className="nearby-meta-row">
              <span className="nearby-location">
                <i className="bi bi-geo-alt-fill text-danger"></i> {item.location || item.city}
              </span>
              <span className="nearby-rating">
                <i className="bi bi-star-fill text-warning"></i> {item.rating}
              </span>
            </div>

            <h3 className="nearby-name compact-name" title={item.homestayName}>
              {item.homestayName}
            </h3>

            <div className="compact-voucher-strip">
              <div className="strip-left-val">{item.discountVal}</div>
              <div className="strip-right-code">
                <span className="code-pill">{item.code}</span>
                <span className="cond-text">{item.condition}</span>
              </div>
            </div>

            <div className="nearby-footer-row compact-footer">
              <button className="btn-terms-link" onClick={() => setSelectedTermsVoucher(item)}>
                Điều kiện
              </button>
              <div className="d-flex align-items-center gap-1.5">
                {saved ? (
                  <button
                    className="btn-voucher-action btn-use"
                    onClick={() => handleCopyCode(item.code)}
                    title="Sao chép mã"
                  >
                    Copy
                  </button>
                ) : (
                  <button
                    className="btn-voucher-action btn-save"
                    onClick={() => handleSaveToWallet(item)}
                  >
                    Lưu
                  </button>
                )}
                {item.homestayId ? (
                  <Link to={`/homestay/${item.homestayId}`} className="btn-room-detail">
                    Xem phòng
                  </Link>
                ) : (
                  <Link to="/homestay" className="btn-room-detail">
                    Xem phòng
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    });
  };

  return (
    <>
      {/* Banner Hero Khuyến Mãi */}
      <section className="promo-hero-section">
        <div className="container">
          <div className="promo-hero-wrapper">
            <div className="promo-hero-top">
              <div className="promo-hero-title-group">
                <div className="promo-badge-top">
                  <i className="bi bi-gift-fill"></i> Ưu đãi độc quyền cho du khách YÊN
                </div>
                <h1 className="promo-hero-title">Kho Mã Giảm Giá Homestay</h1>
                <p className="promo-hero-subtitle">
                  Khám phá mã giảm giá riêng cho từng Homestay tại Đà Lạt, Đà Nẵng, Sa Pa, Ninh Bình và Hội An để tiết kiệm chi phí cho chuyến du lịch của bạn.
                </p>
              </div>

              {/* Ô Nhập Mã Khuyến Mãi */}
              <form className="promo-redeem-gold-box" onSubmit={handleRedeemSubmit}>
                <i className="bi bi-ticket-perforated-fill"></i>
                <input
                  type="text"
                  placeholder="Nhập mã ưu đãi (Ví dụ: DALAT15, GIAM100K)..."
                  value={redeemInput}
                  onChange={(e) => setRedeemInput(e.target.value)}
                />
                <button type="submit" className="btn-redeem-gold">
                  Kích hoạt mã
                </button>
              </form>
            </div>

            {/* Thống Kê Nhanh từ CSDL Thật */}
            <div className="promo-stats-bar">
              <div className="p-stat-item">
                <div className="p-stat-icon">
                  <i className="bi bi-wallet2"></i>
                </div>
                <div className="p-stat-info">
                  <p className="v-val">{savedCount} mã</p>
                  <p className="v-lbl">Mã đã lưu trong Ví</p>
                </div>
              </div>

              <div className="p-stat-item">
                <div className="p-stat-icon">
                  <i className="bi bi-house-heart"></i>
                </div>
                <div className="p-stat-info">
                  <p className="v-val">{totalHomestaysCount} Homestay</p>
                  <p className="v-lbl">Đang có chương trình ưu đãi</p>
                </div>
              </div>

              <div className="p-stat-item">
                <div className="p-stat-icon">
                  <i className="bi bi-hourglass-split"></i>
                </div>
                <div className="p-stat-info">
                  <p className="v-val">{urgentCount} mã</p>
                  <p className="v-lbl">Mã sắp hết hạn trong 3 ngày</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="promotions-main-layout">
        <div className="container">
          {/* Thanh Tìm Kiếm Đồng Bộ */}
          <div className="promo-toolbar-wrap">
            <div className="promo-mode-row justify-content-center">
              <div className="search-hs-box" style={{ maxWidth: '540px' }}>
                <div className="search-icon-badge">
                  <i className="bi bi-search"></i>
                </div>
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên homestay, mã giảm giá hoặc địa danh..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="btn-search-clear"
                    onClick={() => setSearchQuery('')}
                    title="Xóa tìm kiếm"
                  >
                    <i className="bi bi-x-circle-fill"></i>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 1: VOUCHER HOT NHẤT HÔM NAY */}
          <section className="promo-section-block">
            <div className="section-header-hp">
              <div>
                <span className="section-badge-top">
                  <span className="nearby-dot"></span> ĐẶC BIỆT HOT
                </span>
                <h2 className="section-title">Voucher Hot Nhất Hôm Nay</h2>
                <p className="section-subtitle">Mã ưu đãi homestay siêu hot đang được nhiều du khách săn đón nhất</p>
              </div>
              <span className="nearby-view-all text-muted" style={{ cursor: 'default' }}>
                Ưu đãi tốt nhất <i className="bi bi-arrow-right"></i>
              </span>
            </div>
            <div className="vouchers-grid">
              {renderGrid('hot')}
            </div>
          </section>

          {/* SECTION 2: MÃ GIẢM GIÁ MỚI PHÁT HÀNH */}
          <section className="promo-section-block">
            <div className="section-header-hp">
              <div>
                <span className="section-badge-top">
                  <span className="nearby-dot green"></span> CẬP NHẬT MỚI
                </span>
                <h2 className="section-title">Mã Giảm Giá Mới Phát Hành</h2>
                <p className="section-subtitle">Voucher vừa cập nhật dành riêng cho các homestay mới niêm yết trong tháng</p>
              </div>
              <span className="nearby-view-all text-muted" style={{ cursor: 'default' }}>
                Cập nhật liên tục <i className="bi bi-arrow-right"></i>
              </span>
            </div>
            <div className="vouchers-grid">
              {renderGrid('new')}
            </div>
          </section>

          {/* SECTION 3: VOUCHER ĐÃ DÙNG NHIỀU NHẤT */}
          <section className="promo-section-block">
            <div className="section-header-hp">
              <div>
                <span className="section-badge-top">
                  <span className="nearby-dot amber"></span> THÂN THIỆN DU KHÁCH
                </span>
                <h2 className="section-title">Voucher Dùng Nhiều Nhất</h2>
                <p className="section-subtitle">Top các mã được du khách quy đổi đặt phòng thành công cao nhất tuần qua</p>
              </div>
              <span className="nearby-view-all text-muted" style={{ cursor: 'default' }}>
                Được tin dùng <i className="bi bi-arrow-right"></i>
              </span>
            </div>
            <div className="vouchers-grid">
              {renderGrid('most_used')}
            </div>
          </section>

          {/* SECTION 4: ĐẶC QUYỀN VIP & VILLA NGUYÊN CĂN */}
          <section className="promo-section-block">
            <div className="section-header-hp">
              <div>
                <span className="section-badge-top">
                  <span className="nearby-dot purple"></span> SANG TRỌNG &amp; RIÊNG TƯ
                </span>
                <h2 className="section-title">Đặc Quyền VIP &amp; Villa Nguyên Căn</h2>
                <p className="section-subtitle">Dành riêng cho khách lưu trú biệt thự nghỉ dưỡng và homestay cao cấp</p>
              </div>
              <span className="nearby-view-all text-muted" style={{ cursor: 'default' }}>
                Hạng thương gia <i className="bi bi-arrow-right"></i>
              </span>
            </div>
            <div className="vouchers-grid">
              {renderGrid('vip')}
            </div>
          </section>
        </div>
      </main>

      {/* Modal Điều Kiện Sử Dụng */}
      {selectedTermsVoucher && (
        <div className="v-modal-overlay show" style={{ opacity: 1, visibility: 'visible' }}>
          <div className="v-modal-card">
            <div className="v-modal-header">
              <div>
                <h3>
                  Điều Kiện Sử Dụng: <span>{selectedTermsVoucher.code} - {selectedTermsVoucher.homestayName}</span>
                </h3>
              </div>
              <button
                type="button"
                className="v-modal-close-btn"
                onClick={() => setSelectedTermsVoucher(null)}
              >
                &times;
              </button>
            </div>

            <div className="v-modal-body">
              <p className="fw-bold text-dark mb-2">{selectedTermsVoucher.title}</p>
              <div className="mb-2 text-muted small">
                <span><i className="bi bi-clock me-1"></i> {selectedTermsVoucher.expiryText}</span>
                {selectedTermsVoucher.minOrderValue && (
                  <span className="ms-3">
                    <i className="bi bi-cash-stack me-1"></i> {selectedTermsVoucher.condition}
                  </span>
                )}
              </div>

              <h4 className="fs-6 fw-bold text-secondary mt-3 mb-2">Quy định áp dụng:</h4>
              <ul className="terms-list">
                {Array.isArray(selectedTermsVoucher.terms) && selectedTermsVoucher.terms.length > 0 ? (
                  selectedTermsVoucher.terms.map((t, idx) => <li key={idx}>{t}</li>)
                ) : (
                  <>
                    <li>Áp dụng khi thanh toán đặt phòng qua hệ thống YÊN Homestay.</li>
                    <li>Mỗi tài khoản được áp dụng 01 lần duy nhất trên mỗi đơn hàng.</li>
                  </>
                )}
              </ul>

              <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
                <span className="badge bg-light text-dark border">
                  Mã: <strong>{selectedTermsVoucher.code}</strong>
                </span>
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => setSelectedTermsVoucher(null)}
                  >
                    Đóng
                  </button>
                  <button
                    className="btn btn-sm btn-success"
                    onClick={() => {
                      handleCopyCode(selectedTermsVoucher.code);
                      setSelectedTermsVoucher(null);
                    }}
                  >
                    Sao chép mã
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notice */}
      <div className={`promo-toast ${showToast ? 'show' : ''}`}>
        <i className="bi bi-check-circle-fill"></i>
        <span>{toastMsg}</span>
      </div>
    </>
  );
}
