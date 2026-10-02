import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import './Wishlist.css';

const INITIAL_WISHLIST = [
  {
    id: 'card-1',
    region: 'dalat',
    price: 1450000,
    rating: 4.96,
    title: 'The Memory Valley Villa',
    image: 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=600&q=80',
    badge: 'Top 1 Bán Chạy',
    badgeStyle: { background: '#FFE2E5', color: '#E11D48' },
    badgeIcon: 'bi-fire',
    location: 'Đà Lạt',
    reviews: 340,
    specs: '3 phòng ngủ • 6 khách',
    features: 'Bể bơi nước ấm · Lò sưởi củi · Sân BBQ',
    date: 20260920
  },
  {
    id: 'card-2',
    region: 'sapa',
    price: 780000,
    rating: 4.95,
    title: 'Sa Pa Terraces Eco Bungalow',
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80',
    badge: 'Nổi bật 2026',
    badgeStyle: { background: '#E0F2FE', color: '#0284C7' },
    badgeIcon: 'bi-lightning-charge-fill',
    location: 'Sa Pa',
    reviews: 210,
    specs: '2 phòng ngủ • 4 khách',
    features: 'View ruộng bậc thang · Lửa trại ngoài trời',
    date: 20260919
  },
  {
    id: 'card-3',
    region: 'puluong',
    price: 850000,
    rating: 4.88,
    title: 'Pù Luông Eco Retreat House',
    image: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=600&q=80',
    badge: 'Sinh thái xanh',
    badgeStyle: { background: '#DCFCE7', color: '#15803D' },
    badgeIcon: 'bi-tree-fill',
    location: 'Pù Luông',
    reviews: 145,
    specs: '4 phòng ngủ • 8 khách',
    features: 'Bể bơi vô cực núi · Ẩm thực Mường Thái',
    date: 20260918
  },
  {
    id: 'card-4',
    region: 'maichau',
    price: 550000,
    rating: 4.85,
    title: 'Mai Châu Bamboo Stilt House',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
    badge: 'Giá tốt nhất',
    badgeStyle: { background: '#FEF3C7', color: '#D97706' },
    badgeIcon: 'bi-star-fill',
    location: 'Mai Châu',
    reviews: 98,
    specs: '2 phòng ngủ • 5 khách',
    features: 'Xe đạp miễn phí · Múa xòe Bản Lác',
    date: 20260917
  },
  {
    id: 'card-5',
    region: 'hoian',
    price: 920000,
    rating: 4.90,
    title: 'An Bàng Seaside Haven Hội An',
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80',
    badge: 'Gần biển An Bàng',
    badgeStyle: { background: '#FCE7F3', color: '#DB2777' },
    badgeIcon: 'bi-water',
    location: 'Hội An',
    reviews: 160,
    specs: '3 phòng ngủ • 6 khách',
    features: 'Sân vườn hướng biển · Hải sản tươi sống',
    date: 20260916
  },
  {
    id: 'card-6',
    region: 'ninhbinh',
    price: 720000,
    rating: 4.87,
    title: 'Tràng An Lotus Field Ninh Bình',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
    badge: 'Đầm sen Tràng An',
    badgeStyle: { background: '#F3E8FF', color: '#9333EA' },
    badgeIcon: 'bi-flower1',
    location: 'Ninh Bình',
    reviews: 115,
    specs: '2 phòng ngủ • 4 khách',
    features: 'Bungalow đầm sen · Chèo thuyền Kayak',
    date: 20260915
  },
  {
    id: 'card-7',
    region: 'hagiang',
    price: 680000,
    rating: 4.92,
    title: 'Hà Giang Dong Van Karst Homestay',
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80',
    badge: 'Cao nguyên đá',
    badgeStyle: { background: '#FFE4E6', color: '#E11D48' },
    badgeIcon: 'bi-mountain',
    location: 'Hà Giang',
    reviews: 134,
    specs: '3 phòng ngủ • 6 khách',
    features: "Nhà trình tường H'Mông cổ · Mã Pí Lèng",
    date: 20260914
  },
  {
    id: 'card-8',
    region: 'mocchau',
    price: 620000,
    rating: 4.84,
    title: 'Mộc Châu Tea Hill Lodge',
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80',
    badge: 'Đồi chè Mộc Châu',
    badgeStyle: { background: '#ECFDF5', color: '#059669' },
    badgeIcon: 'bi-cup-hot-fill',
    location: 'Mộc Châu',
    reviews: 89,
    specs: '2 phòng ngủ • 4 khách',
    features: 'Bungalow giữa đồi chè · Vườn mận chín',
    date: 20260913
  }
];

export default function Wishlist() {
  const [items, setItems] = useState(INITIAL_WISHLIST);
  const [activeRegion, setActiveRegion] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [showClearModal, setShowClearModal] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: '', icon: 'bi-check-circle-fill text-success' });

  const triggerToast = (msg, icon = 'bi-check-circle-fill text-success') => {
    setToast({ show: true, msg, icon });
    setTimeout(() => {
      setToast({ show: false, msg: '', icon: '' });
    }, 3200);
  };

  const handleRemoveItem = (id, title) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    triggerToast(`Đã xóa "${title}" khỏi danh sách yêu thích!`, 'bi-heartbreak-fill text-danger');
  };

  const handleClearAll = () => {
    setItems([]);
    setShowClearModal(false);
    triggerToast('Đã xóa toàn bộ danh sách homestay yêu thích!', 'bi-trash-fill text-danger');
  };

  const filteredAndSortedItems = useMemo(() => {
    let result = items.filter((item) => {
      if (activeRegion === 'all') return true;
      return item.region === activeRegion;
    });

    return result.sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      return b.date - a.date; // recent
    });
  }, [items, activeRegion, sortBy]);

  return (
    <div className="wl-main">
      {/* ── HERO SECTION ── */}
      <section className="wl-hero-section">
        <div className="container-xl position-relative" style={{ zIndex: 2 }}>
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
              <div className="d-inline-flex align-items-center gap-2 bg-white bg-opacity-10 backdrop-blur border border-white border-opacity-25 rounded-pill px-4 py-2.5 text-white">
                <i className="bi bi-bookmark-heart-fill fs-5 text-warning"></i>
                <span>
                  Đã lưu <strong className="fs-5 text-warning ms-1">{items.length}</strong> homestay
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT ── */}
      <main className="container-xl pb-5">
        {items.length > 0 ? (
          <div id="wishlistGridSection">
            {/* Toolbar: Filter & Sort */}
            <div className="wl-toolbar-card d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
              {/* Region Pills */}
              <div className="d-flex align-items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {[
                  { key: 'all', label: `Tất cả (${items.length})` },
                  { key: 'dalat', label: 'Đà Lạt' },
                  { key: 'sapa', label: 'Sa Pa' },
                  { key: 'puluong', label: 'Pù Luông' },
                  { key: 'maichau', label: 'Mai Châu' },
                  { key: 'hoian', label: 'Hội An' },
                  { key: 'ninhbinh', label: 'Ninh Bình' },
                  { key: 'hagiang', label: 'Hà Giang' },
                  { key: 'mocchau', label: 'Mộc Châu' }
                ].map((pill) => (
                  <button
                    key={pill.key}
                    type="button"
                    className={`wl-pill-btn ${activeRegion === pill.key ? 'active' : ''}`}
                    onClick={() => setActiveRegion(pill.key)}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              {/* Sort & Actions */}
              <div className="d-flex align-items-center gap-2 flex-wrap shrink-0 ms-auto">
                <div className="d-flex align-items-center gap-2">
                  <span className="text-xs text-muted font-semibold text-nowrap">
                    <i className="bi bi-arrow-down-up me-1"></i>Sắp xếp:
                  </span>
                  <select
                    className="wl-sort-select"
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      triggerToast('Đã sắp xếp lại danh sách homestay!', 'bi-arrow-down-up text-success');
                    }}
                  >
                    <option value="recent">Mới lưu gần đây</option>
                    <option value="price-asc">Giá: Thấp đến Cao</option>
                    <option value="price-desc">Giá: Cao đến Thấp</option>
                    <option value="rating">Đánh giá cao nhất</option>
                  </select>
                </div>

                <button
                  type="button"
                  className="btn btn-outline-danger rounded-pill px-3 py-1.5 text-xs font-semibold"
                  onClick={() => setShowClearModal(true)}
                >
                  <i className="bi bi-trash3-fill me-1"></i> Xóa tất cả
                </button>
              </div>
            </div>

            {/* 4-Column Homestay Grid */}
            {filteredAndSortedItems.length === 0 ? (
              <div className="wl-empty-card my-4">
                <div className="wl-empty-icon" style={{ background: '#FEF3C7', color: '#D97706' }}>
                  <i className="bi bi-geo-alt-fill"></i>
                </div>
                <h3 className="h5 fw-bold text-dark mb-2">Chưa có homestay nào thuộc khu vực này</h3>
                <p className="text-muted text-sm mb-3">Hãy chọn khu vực khác hoặc bấm "Tất cả" để xem toàn bộ danh sách nhé!</p>
                <button
                  type="button"
                  className="btn btn-outline-success rounded-pill px-4 py-2"
                  onClick={() => setActiveRegion('all')}
                >
                  Xem tất cả ({items.length})
                </button>
              </div>
            ) : (
              <div className="wl-homestay-grid">
                {filteredAndSortedItems.map((item) => (
                  <div key={item.id} className="wl-card-col">
                    <div className="wl-card">
                      <div className="wl-card-img-wrap">
                        <img src={item.image} alt={item.title} className="wl-card-img" />
                        <div className="wl-top-badge" style={item.badgeStyle}>
                          <i className={`bi ${item.badgeIcon}`}></i> {item.badge}
                        </div>
                        <button
                          type="button"
                          className="wl-wishlist-btn"
                          onClick={() => handleRemoveItem(item.id, item.title)}
                          title="Bỏ yêu thích"
                        >
                          <i className="bi bi-heart-fill"></i>
                        </button>
                      </div>

                      <div className="wl-card-body">
                        <div>
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <div className="wl-card-location">
                              <i className="bi bi-geo-alt-fill me-1"></i> {item.location}
                            </div>
                            <div className="wl-card-rating">
                              <i className="bi bi-star-fill text-warning me-1"></i>
                              <strong>{item.rating}</strong> <span className="text-muted">({item.reviews})</span>
                            </div>
                          </div>

                          <h3 className="wl-card-title" title={item.title}>
                            {item.title}
                          </h3>

                          <div className="wl-card-specs">
                            <i className="bi bi-door-open me-1"></i> {item.specs}
                          </div>

                          <div className="wl-feature-box">
                            <div className="wl-feature-title">Tiện nghi nổi bật:</div>
                            <div className="wl-feature-text">{item.features}</div>
                          </div>
                        </div>

                        <div className="wl-card-footer">
                          <div className="d-flex align-items-center justify-content-between">
                            <div>
                              <div className="wl-price-label">Giá từ:</div>
                              <div className="wl-price-val">{item.price.toLocaleString('vi-VN')}đ</div>
                            </div>
                            <Link to="/homestay" className="wl-btn-book">
                              Xem homestay
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Empty State */
          <div className="wl-empty-card mt-4">
            <div className="wl-empty-icon">
              <i className="bi bi-heartbreak-fill"></i>
            </div>
            <h2 className="h4 fw-bold text-dark mb-2">Danh sách yêu thích của bạn đang trống</h2>
            <p className="text-muted text-sm mb-4 max-w-md mx-auto">
              Hãy khám phá các homestay sinh thái tuyệt đẹp trên khắp Việt Nam và bấm biểu tượng trái tim để lưu lại những chốn nghỉ ưng ý nhé!
            </p>
            <Link
              to="/search"
              className="btn btn-success btn-lg rounded-pill px-4 fw-semibold text-sm d-inline-flex align-items-center gap-2"
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
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-danger">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>Cảnh báo xóa danh sách
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowClearModal(false)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body py-3">
                <p className="text-sm text-secondary mb-0">
                  Bạn có chắc chắn muốn xóa <strong>toàn bộ {items.length} homestay</strong> khỏi danh sách yêu thích không? Thao tác này không thể hoàn tác.
                </p>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button
                  type="button"
                  className="btn btn-light rounded-pill px-4 text-xs font-semibold"
                  onClick={() => setShowClearModal(false)}
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  className="btn btn-danger rounded-pill px-4 text-xs font-semibold"
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
        <span>{toast.msg}</span>
      </div>
    </div>
  );
}
