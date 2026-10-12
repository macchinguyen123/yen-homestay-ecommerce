import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Wishlist.css';
import { wishlistService } from '../../../services/wishlistService';
import { authService } from '../../../services/authService';
import { formatAmenities } from '../Category/Category';

const SORT_OPTIONS = [
  { key: 'recent', label: 'Mới lưu gần đây', icon: 'bi-clock-history' },
  { key: 'price-asc', label: 'Giá: Thấp đến Cao', icon: 'bi-sort-numeric-down' },
  { key: 'price-desc', label: 'Giá: Cao đến Thấp', icon: 'bi-sort-numeric-up-alt' },
  { key: 'rating', label: 'Đánh giá cao nhất', icon: 'bi-star-fill' },
];

export default function Wishlist() {
  const initialUser = authService.getCurrentUser();
  const cachedData = wishlistService.getCachedWishlist(initialUser ? initialUser.id : null);

  const [items, setItems] = useState(cachedData || []);
  const [loading, setLoading] = useState(!cachedData || cachedData.length === 0);
  const [activeRegion, setActiveRegion] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: '', icon: 'bi-check-circle-fill text-success' });
  const [currentUser, setCurrentUser] = useState(initialUser);

  const sortRef = useRef(null);

  // Close custom dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setSortDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Trigger Toast Notification
  const triggerToast = (msg, icon = 'bi-check-circle-fill text-success') => {
    setToast({ show: true, msg, icon });
    setTimeout(() => {
      setToast({ show: false, msg: '', icon: '' });
    }, 3200);
  };

  // Tải dữ liệu siêu tốc từ CSDL (kèm stale-while-revalidate)
  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);

    let isMounted = true;
    const loadData = async () => {
      try {
        const res = await wishlistService.getWishlist(user ? user.id : null);
        if (isMounted && res && Array.isArray(res.data)) {
          setItems(res.data);
        }
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu yêu thích từ CSDL:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Xóa 1 sản phẩm khỏi yêu thích
  const handleRemoveItem = async (id, title) => {
    const targetId = Number(id);
    setItems((prev) => prev.filter((item) => Number(item.id || item.homestayId) !== targetId));

    try {
      await wishlistService.removeFromWishlist(currentUser ? currentUser.id : null, targetId);
      if (!currentUser) {
        const updated = items.filter((item) => Number(item.id || item.homestayId) !== targetId);
        localStorage.setItem('guest_wishlist', JSON.stringify(updated));
      }
    } catch (e) {
      console.warn('Lỗi khi xóa trong DB:', e);
    }

    triggerToast(`Đã xóa "${title || 'Homestay'}" khỏi danh sách yêu thích!`, 'bi-heartbreak-fill text-danger');
  };

  // Xóa toàn bộ sản phẩm khỏi yêu thích
  const handleClearAll = async () => {
    try {
      await wishlistService.clearWishlist(currentUser ? currentUser.id : null);
    } catch (e) {
      console.warn('Lỗi khi xóa sạch trong DB:', e);
    }

    setItems([]);
    setShowClearModal(false);
    triggerToast('Đã xóa toàn bộ danh sách homestay yêu thích!', 'bi-trash-fill text-danger');
  };

  // Tạo động danh sách các khu vực/tỉnh thành từ dữ liệu homestay hiện có
  const dynamicRegions = useMemo(() => {
    const regionMap = new Map();

    items.forEach((item) => {
      const slug = item.region || 'other';
      const name = item.city || item.location || 'Khác';
      if (!regionMap.has(slug)) {
        regionMap.set(slug, { key: slug, label: name, count: 0 });
      }
      regionMap.get(slug).count += 1;
    });

    const regionsList = [
      { key: 'all', label: 'Tất cả', count: items.length },
      ...Array.from(regionMap.values())
    ];

    return regionsList;
  }, [items]);

  // Lọc theo khu vực & Sắp xếp động
  const filteredAndSortedItems = useMemo(() => {
    let result = items.filter((item) => {
      if (activeRegion === 'all') return true;
      return (item.region || '').toLowerCase() === activeRegion.toLowerCase();
    });

    return result.sort((a, b) => {
      const priceA = Number(a.rawPrice != null ? a.rawPrice : (parseFloat(String(a.price).replace(/[^0-9]/g, '')) || 0));
      const priceB = Number(b.rawPrice != null ? b.rawPrice : (parseFloat(String(b.price).replace(/[^0-9]/g, '')) || 0));
      const ratingA = Number(a.rating || 0);
      const ratingB = Number(b.rating || 0);
      const dateA = Number(a.date || (a.createdAt ? new Date(a.createdAt).getTime() : 0));
      const dateB = Number(b.date || (b.createdAt ? new Date(b.createdAt).getTime() : 0));

      if (sortBy === 'price-asc') return priceA - priceB;
      if (sortBy === 'price-desc') return priceB - priceA;
      if (sortBy === 'rating') return ratingB - ratingA;
      return dateB - dateA; // recent
    });
  }, [items, activeRegion, sortBy]);

  const currentSortObj = useMemo(() => {
    return SORT_OPTIONS.find((opt) => opt.key === sortBy) || SORT_OPTIONS[0];
  }, [sortBy]);

  return (
    <div className="wl-main">
      {/* ── HERO BANNER SECTION ── */}
      <section className="wl-hero-section">
        <div className="wl-container position-relative" style={{ zIndex: 2 }}>
          <div className="row align-items-center">
            <div className="col-lg-8">
              <div className="wl-hero-badge">
                <i className="bi bi-heart-fill text-danger"></i> Bộ sưu tập nghỉ dưỡng cá nhân
              </div>
              <h1 className="wl-hero-title">Homestay Yêu Thích Của Bạn</h1>
              <p className="wl-hero-sub">
                Lưu giữ những chốn dừng chân mộc mạc, bình yên và giàu bản sắc văn hóa để chuẩn bị cho hành trình trải nghiệm sắp tới.
              </p>
            </div>
            <div className="col-lg-4 text-lg-end mt-3 mt-lg-0">
              <div className="d-inline-flex align-items-center gap-2 bg-white bg-opacity-10 backdrop-blur border border-white border-opacity-25 rounded-pill px-4 py-2.5 text-white shadow-sm">
                <i className="bi bi-bookmark-heart-fill fs-5 text-warning"></i>
                <span className="fw-medium">
                  Đã lưu <strong className="fs-5 text-warning ms-1 fw-bold">{items.length}</strong> homestay
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT ── */}
      <main className="wl-container pb-5">
        {loading && items.length === 0 ? (
          <div className="wl-loading-container text-center py-5">
            <div className="spinner-border text-success" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Đang tải dữ liệu từ CSDL...</span>
            </div>
            <p className="mt-3 text-secondary fw-semibold">Đang tải danh sách homestay yêu thích từ CSDL...</p>
          </div>
        ) : items.length > 0 ? (
          <div id="wishlistGridSection">
            {/* ── MODERN INTERACTIVE TOOLBAR CARD ── */}
            <div className="wl-toolbar-card">
              <div className="wl-toolbar-inner">
                {/* 1. Left: Dynamic Region Filter Pills */}
                <div className="wl-pills-bar no-scrollbar">
                  {dynamicRegions.map((pill) => (
                    <button
                      key={pill.key}
                      type="button"
                      className={`wl-pill-btn ${activeRegion === pill.key ? 'active' : ''}`}
                      onClick={() => setActiveRegion(pill.key)}
                    >
                      <span className="wl-pill-label">{pill.label}</span>
                      <span className="wl-pill-count">{pill.count}</span>
                    </button>
                  ))}
                </div>

                {/* 2. Right: Action Controls Group (Custom Sort + Clear All) */}
                <div className="wl-toolbar-actions">
                  {/* Custom Interactive Dropdown */}
                  <div className="wl-sort-dropdown-wrap" ref={sortRef}>
                    <button
                      type="button"
                      className={`wl-sort-trigger-btn ${sortDropdownOpen ? 'active' : ''}`}
                      onClick={() => setSortDropdownOpen((prev) => !prev)}
                      aria-expanded={sortDropdownOpen}
                    >
                      <span className="wl-sort-icon-box">
                        <i className="bi bi-arrow-down-up"></i>
                      </span>
                      <span className="wl-sort-text">
                        <span className="wl-sort-prefix">Sắp xếp:</span>
                        <strong className="wl-sort-selected-label">{currentSortObj.label}</strong>
                      </span>
                      <i className={`bi bi-chevron-down wl-sort-chevron ${sortDropdownOpen ? 'rotate' : ''}`}></i>
                    </button>

                    {sortDropdownOpen && (
                      <div className="wl-sort-menu animate-pop">
                        <div className="wl-sort-menu-header">
                          <i className="bi bi-filter-right me-1 text-success"></i> Tiêu chí sắp xếp
                        </div>
                        {SORT_OPTIONS.map((opt) => (
                          <button
                            key={opt.key}
                            type="button"
                            className={`wl-sort-item ${sortBy === opt.key ? 'selected' : ''}`}
                            onClick={() => {
                              setSortBy(opt.key);
                              setSortDropdownOpen(false);
                              triggerToast(`Đã sắp xếp theo: ${opt.label}`, 'bi-arrow-down-up text-success');
                            }}
                          >
                            <div className="d-flex align-items-center gap-2">
                              <i className={`bi ${opt.icon} wl-sort-item-icon ${opt.key === 'rating' ? 'text-warning' : ''}`}></i>
                              <span className="wl-sort-item-name">{opt.label}</span>
                            </div>
                            {sortBy === opt.key && (
                              <i className="bi bi-check-lg text-success fw-bold fs-5"></i>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Clear All Button */}
                  <button
                    type="button"
                    className="wl-clear-btn"
                    onClick={() => setShowClearModal(true)}
                    title="Xóa tất cả homestay khỏi danh sách yêu thích"
                  >
                    <i className="bi bi-trash3-fill"></i>
                    <span>Xóa tất cả</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Homestay Grid matching Homepage card design */}
            {filteredAndSortedItems.length === 0 ? (
              <div className="wl-empty-card my-4 text-center py-5">
                <div className="wl-empty-icon mb-3">
                  <i className="bi bi-geo-alt-fill"></i>
                </div>
                <h3 className="h5 fw-bold text-dark mb-2">Chưa có homestay nào thuộc khu vực này</h3>
                <p className="text-muted text-sm mb-3">Hãy chọn khu vực khác hoặc bấm "Tất cả" để xem toàn bộ danh sách nhé!</p>
                <button
                  type="button"
                  className="btn btn-outline-success rounded-pill px-4 py-2 fw-semibold"
                  onClick={() => setActiveRegion('all')}
                >
                  Xem tất cả ({items.length})
                </button>
              </div>
            ) : (
              <div className="wl-homestay-grid">
                {filteredAndSortedItems.map((h) => {
                  const itemId = h.id || h.homestayId;
                  const itemTitle = h.name || h.title;
                  const itemImg = h.img || h.image || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80';
                  const itemLocation = h.location || h.city || 'Việt Nam';
                  const itemRating = h.rating != null ? h.rating : '4.95';
                  const itemReviews = h.reviews != null ? h.reviews : 20;
                  const itemSpecs = h.specs || '2 phòng ngủ • 4 khách';
                  const itemAmenities = h.amenities || h.features || 'Bể bơi · BBQ · WiFi miễn phí';
                  const itemPrice = h.price || (h.rawPrice ? Number(h.rawPrice).toLocaleString('vi-VN') + 'đ' : '0đ');
                  const itemTag = h.tag || h.badge || 'Du khách yêu thích';
                  const isHotTag = itemTag.toLowerCase().includes('bán chạy') || itemTag.toLowerCase().includes('nổi bật');

                  return (
                    <div key={itemId} className="homestay-card">
                      {/* Image Wrapper */}
                      <div className="card-img-wrapper">
                        <span className={`card-top-tag ${isHotTag ? 'tag-hot' : ''}`}>
                          {isHotTag && <i className="bi bi-fire me-1" />}
                          {itemTag}
                        </span>

                        <button
                          type="button"
                          className="card-wishlist-btn active"
                          onClick={() => handleRemoveItem(itemId, itemTitle)}
                          title="Bỏ yêu thích"
                        >
                          <i className="bi bi-heart-fill" />
                        </button>

                        <Link to={`/homestay/${itemId}`} style={{ display: 'block', height: '100%' }}>
                          <img src={itemImg} alt={itemTitle} />
                        </Link>
                      </div>

                      {/* Card Body */}
                      <div className="card-body">
                        <div className="card-location-rating">
                          <span className="card-location">
                            <i className="bi bi-geo-alt-fill text-success me-1" />
                            {itemLocation}
                          </span>
                          <span className="card-rating">
                            <i className="bi bi-star-fill text-warning me-1" />
                            {itemRating} <span className="review-count">({itemReviews})</span>
                          </span>
                        </div>

                        <h3 className="card-title">
                          <Link to={`/homestay/${itemId}`}>{itemTitle}</Link>
                        </h3>

                        <div className="card-specs">
                          <span>
                            <i className="bi bi-door-open me-1 text-secondary" />
                            {itemSpecs}
                          </span>
                        </div>

                        <div className="card-amenities-box">
                          <span className="amenities-label">Tiện nghi nổi bật:</span>
                          <p className="amenities-items" title={formatAmenities(itemAmenities)}>{formatAmenities(itemAmenities)}</p>
                        </div>

                        <div className="card-footer-row">
                          <div>
                            <span className="price-label">Giá từ:</span>
                            <span className="card-price">{itemPrice}</span>
                          </div>
                          <Link to={`/homestay/${itemId}`} className="btn-view-room">
                            Xem homestay
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Empty State */
          <div className="wl-empty-card mt-4 text-center py-5">
            <div className="wl-empty-icon mb-3">
              <i className="bi bi-heartbreak-fill"></i>
            </div>
            <h2 className="h4 fw-bold text-dark mb-2">Danh sách yêu thích của bạn đang trống</h2>
            <p className="text-secondary text-sm mb-4 max-w-md mx-auto" style={{ maxWidth: 500 }}>
              Hãy khám phá các homestay sinh thái tuyệt đẹp trên khắp Việt Nam và bấm biểu tượng trái tim để lưu lại những chốn nghỉ ưng ý nhé!
            </p>
            <Link
              to="/search"
              className="btn btn-success btn-lg rounded-pill px-4 fw-bold text-sm d-inline-flex align-items-center gap-2 shadow-sm"
            >
              <i className="bi bi-compass-fill"></i> Khám phá Homestay ngay
            </Link>
          </div>
        )}
      </main>

      {/* ── MODAL XÁC NHẬN XÓA TẤT CẢ ── */}
      {showClearModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-0 pb-0 pt-4 px-4">
                <h5 className="modal-title fw-bold text-danger d-flex align-items-center">
                  <i className="bi bi-exclamation-triangle-fill me-2 fs-4"></i>Cảnh báo xóa danh sách
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowClearModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body py-3 px-4">
                <p className="text-secondary mb-0" style={{ fontSize: '0.95rem', lineHeight: 1.6 }}>
                  Bạn có chắc chắn muốn xóa <strong>toàn bộ {items.length} homestay</strong> khỏi danh sách yêu thích không? Thao tác này sẽ cập nhật trên hệ thống và không thể hoàn tác.
                </p>
              </div>
              <div className="modal-footer border-0 pb-4 px-4 pt-2">
                <button
                  type="button"
                  className="btn btn-light rounded-pill px-4 fw-semibold"
                  style={{ fontSize: '0.875rem' }}
                  onClick={() => setShowClearModal(false)}
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  className="btn btn-danger rounded-pill px-4 fw-semibold"
                  style={{ fontSize: '0.875rem' }}
                  onClick={handleClearAll}
                >
                  Đồng ý xóa sạch
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST NOTIFICATION ── */}
      <div className={`wl-toast ${toast.show ? 'show' : ''}`}>
        <i className={`bi ${toast.icon || 'bi-check-circle-fill text-success'} fs-5`}></i>
        <span className="fw-semibold">{toast.msg}</span>
      </div>
    </div>
  );
}
