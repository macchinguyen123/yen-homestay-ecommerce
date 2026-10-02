import { useState, useEffect, useRef, useCallback } from 'react';
import './HomestayDetail.css';
import {
  roomsData, galleryImages, amenitiesData, AMENITY_GROUPS,
  experiencesData, EXPERIENCE_CATEGORIES, EXPERIENCE_COSTS, EXPERIENCE_PREVIEW_IDS,
  EXPERIENCE_FALLBACK_IMG, similarHomestaysData,
  REVIEW_GROUPS, TOTAL_REVIEWS, allReviews, getFilteredReviews,
  avatarColors, unsplashUrl, fmtVND, SERVICE_FEE_RATE,
} from './homestayDetailData';

// ─── Helpers ──────────────────────────────────────────────────
function toInputDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function reviewAvatarStyle(name) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) % 997;
  return { background: avatarColors[hash % avatarColors.length] };
}
function experiencePriceLabel(x) {
  return x.price > 0 ? `${fmtVND(x.price)} ${x.unit}` : 'Miễn phí';
}
function matchExperience(x, category, cost) {
  return (category === 'all' || x.category === category) &&
    (cost === 'all' || (cost === 'free' ? x.price === 0 : x.price > 0));
}

// ─── Sub-components ────────────────────────────────────────────

/** Toast notification */
function Toast({ message, show }) {
  return (
    <div className={`toast-notice ${show ? 'show' : ''}`} role="status" aria-live="polite">
      <i className="bi bi-check-circle-fill" />
      <span>{message}</span>
    </div>
  );
}

/** Review card */
function ReviewCard({ review, showRoom = true, clamp = false, onPhotoClick }) {
  const initial = review.name.trim().split(' ').pop().charAt(0).toUpperCase();
  return (
    <div className="review-card">
      <div className="review-head">
        <div className="review-avatar" style={reviewAvatarStyle(review.name)}>{initial}</div>
        <div>
          <h5>{review.name}</h5>
          <span>{review.date}</span>
        </div>
      </div>
      {showRoom && (
        <span className="review-room-badge">
          <i className="bi bi-door-open" /> {review.room}
        </span>
      )}
      <div className="review-stars">
        {Array.from({ length: 5 }, (_, i) => (
          <i key={i} className={`bi bi-star-fill ${i >= review.stars ? 'off' : ''}`} />
        ))}
      </div>
      <p className={`review-text ${clamp ? 'clamp' : ''}`}>{review.text}</p>
      {review.photos.length > 0 && (
        <div className="review-photos">
          {review.photos.map((p, i) => (
            <button key={i} type="button" className="review-photo"
              onClick={() => onPhotoClick && onPhotoClick(review.id, i)}
              title="Xem ảnh lớn">
              <img src={p.thumb} alt={`Ảnh của ${review.name}`} loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Lightbox */
function Lightbox({ images, index, onClose, onNav }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNav(1);
      if (e.key === 'ArrowLeft') onNav(-1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, onNav]);

  if (!images || images.length === 0) return null;
  return (
    <div className="lightbox-overlay active" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <button type="button" className="lightbox-close-btn" onClick={onClose} title="Đóng">
        <i className="bi bi-x-lg" />
      </button>
      <button type="button" className="lightbox-arrow prev" onClick={() => onNav(-1)} title="Ảnh trước">
        <i className="bi bi-chevron-left" />
      </button>
      <div className="lightbox-image-wrap">
        <img src={images[index]} alt="Ảnh homestay" />
        <span className="lightbox-counter">{index + 1} / {images.length}</span>
      </div>
      <button type="button" className="lightbox-arrow next" onClick={() => onNav(1)} title="Ảnh sau">
        <i className="bi bi-chevron-right" />
      </button>
    </div>
  );
}

/** Room Modal */
function RoomModal({ room, onClose, onOpenReviews, showToast }) {
  const [galleryIdx, setGalleryIdx] = useState(0);
  const scrollRef = useRef(null);

  const today = new Date();
  const defaultCheckin = new Date(today); defaultCheckin.setDate(today.getDate() + 7);
  const defaultCheckout = new Date(defaultCheckin); defaultCheckout.setDate(defaultCheckin.getDate() + 2);

  const [checkin, setCheckin] = useState(toInputDate(defaultCheckin));
  const [checkout, setCheckout] = useState(toInputDate(defaultCheckout));
  const [guests, setGuests] = useState(Math.min(2, room.specs.guests));
  const [warning, setWarning] = useState('');

  const calcNights = useCallback(() => {
    if (!checkin || !checkout) return 2;
    const diff = Math.round((new Date(checkout) - new Date(checkin)) / 86400000);
    return diff > 0 ? diff : 0;
  }, [checkin, checkout]);

  const nights = calcNights();
  const subtotal = room.price * nights;
  const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE);
  const total = nights > 0 ? subtotal + room.cleaningFee + serviceFee : 0;

  useEffect(() => {
    if (nights <= 0 && checkin && checkout) setWarning('Ngày trả phòng phải sau ngày nhận phòng ít nhất 1 đêm.');
    else setWarning('');
  }, [nights, checkin, checkout]);

  useEffect(() => { setGalleryIdx(0); if (scrollRef.current) scrollRef.current.scrollTop = 0; }, [room]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setGalleryIdx((i) => (i + 1) % room.gallery.length);
      if (e.key === 'ArrowLeft') setGalleryIdx((i) => (i - 1 + room.gallery.length) % room.gallery.length);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, room.gallery.length]);

  const handleBook = () => {
    if (!nights || nights <= 0) { showToast('Vui lòng chọn lại ngày nhận - trả phòng hợp lệ!'); return; }
    showToast(`Đang chuyển đến trang xác nhận đặt "${room.name}"...`);
    onClose();
  };

  const roomReviews = getFilteredReviews(room.reviewGroup, 'all', 'newest').slice(0, 2);

  return (
    <div className="room-modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="room-modal-container" role="dialog" aria-modal="true">
        <button type="button" className="room-modal-close-btn" onClick={onClose} title="Đóng">
          <i className="bi bi-x-lg" />
        </button>
        <div className="room-modal-scroll" ref={scrollRef}>
          <div className="room-modal-gallery">
            <button type="button" className="room-gallery-arrow prev" onClick={() => setGalleryIdx((i) => (i - 1 + room.gallery.length) % room.gallery.length)} title="Ảnh trước">
              <i className="bi bi-chevron-left" />
            </button>
            <img src={room.gallery[galleryIdx]} alt="Ảnh phòng" />
            <button type="button" className="room-gallery-arrow next" onClick={() => setGalleryIdx((i) => (i + 1) % room.gallery.length)} title="Ảnh sau">
              <i className="bi bi-chevron-right" />
            </button>
            <span className="room-gallery-counter">{galleryIdx + 1} / {room.gallery.length}</span>
          </div>

          <div className="room-modal-body">
            <div className="room-modal-head">
              <div>
                <span className="room-modal-tag">Còn {room.availableCount} phòng trống</span>
                <h2 className="room-modal-title">{room.name}</h2>
                <div className="room-modal-specs">
                  <span><i className="bi bi-arrows-fullscreen" />{room.specs.area}</span>
                  <span><i className="bi bi-people" />{room.specs.guests} khách</span>
                  <span><i className="bi bi-house-door" />{room.specs.beds}</span>
                </div>
              </div>
              <div className="room-modal-price-tag">
                <b>{fmtVND(room.price)}</b>
                <span>/ đêm</span>
              </div>
            </div>

            <p className="room-modal-desc">{room.description}</p>

            <h4 className="room-modal-subtitle">Tiện nghi trong phòng</h4>
            <div className="room-modal-amenities">
              {room.amenities.map((a, i) => (
                <div key={i} className="room-amenity-chip">
                  <i className="bi bi-check-circle-fill" /> {a}
                </div>
              ))}
            </div>

            <h4 className="room-modal-subtitle">Chọn ngày & số khách</h4>
            <div className="room-booking-form">
              <div className="room-booking-date-grid">
                <div className="room-booking-field">
                  <label htmlFor="roomCheckin">Nhận phòng</label>
                  <input type="date" id="roomCheckin" value={checkin} min={toInputDate(today)}
                    onChange={(e) => setCheckin(e.target.value)} />
                </div>
                <div className="room-booking-field">
                  <label htmlFor="roomCheckout">Trả phòng</label>
                  <input type="date" id="roomCheckout" value={checkout}
                    onChange={(e) => setCheckout(e.target.value)} />
                </div>
              </div>
              <div className="room-booking-field">
                <label htmlFor="roomGuests">Số khách</label>
                <select id="roomGuests" value={guests} onChange={(e) => setGuests(Number(e.target.value))}>
                  {Array.from({ length: room.specs.guests }, (_, i) => i + 1).map((g) => (
                    <option key={g} value={g}>{g} khách</option>
                  ))}
                </select>
              </div>
            </div>
            {warning && <p className="room-booking-warning">{warning}</p>}

            <div className="room-price-breakdown">
              <div className="breakdown-row">
                <span>{fmtVND(room.price)} x {nights} đêm</span>
                <span>{fmtVND(subtotal)}</span>
              </div>
              <div className="breakdown-row">
                <span>Phí vệ sinh</span>
                <span>{fmtVND(room.cleaningFee)}</span>
              </div>
              <div className="breakdown-row">
                <span>Phí dịch vụ YÊN</span>
                <span>{fmtVND(serviceFee)}</span>
              </div>
              <div className="breakdown-divider" />
              <div className="breakdown-row breakdown-total">
                <span>Tổng cộng</span>
                <span>{fmtVND(total)}</span>
              </div>
            </div>

            <div className="room-modal-subhead">
              <h4 className="room-modal-subtitle">Khách nói gì về phòng này</h4>
              <span className="room-modal-rating">
                <i className="bi bi-star-fill" />{room.rating.toFixed(2)} · {room.reviewCount} đánh giá
              </span>
            </div>
            <div className="room-modal-reviews">
              {roomReviews.map((r) => (
                <ReviewCard key={r.id} review={r} showRoom={false} clamp={true} />
              ))}
            </div>
            <button type="button" className="yn-btn yn-btn--outline yn-btn--block"
              onClick={() => onOpenReviews(room.reviewGroup)}>
              <i className="bi bi-chat-square-text" /> Xem tất cả {room.reviewCount} đánh giá về phòng này
            </button>
          </div>
        </div>

        <div className="room-modal-footer">
          <div className="room-modal-footer-price">
            <b>{fmtVND(total)}</b>
            <span>tổng cho {nights} đêm</span>
          </div>
          <button type="button" className="yn-btn yn-btn--primary yn-btn--lg" onClick={handleBook}>
            Đặt phòng ngay
          </button>
        </div>
      </div>
    </div>
  );
}

/** Reviews Drawer */
function ReviewsDrawer({ open, onClose, initialGroup, onPhotoClick }) {
  const REVIEW_PAGE_SIZE = 6;
  const [group, setGroup] = useState(initialGroup || 'all');
  const [stars, setStars] = useState('all');
  const [sort, setSort] = useState('newest');
  const [photo, setPhoto] = useState(false);
  const [shown, setShown] = useState(REVIEW_PAGE_SIZE);

  useEffect(() => {
    if (open) { setGroup(initialGroup || 'all'); setStars('all'); setSort('newest'); setPhoto(false); setShown(REVIEW_PAGE_SIZE); }
  }, [open, initialGroup]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && open) onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const room = roomsData.find((r) => r.reviewGroup === group);
  const result = getFilteredReviews(group, stars, sort, photo);
  const visible = result.slice(0, shown);
  const photoCount = getFilteredReviews(group, 'all', 'newest', true).length;

  return (
    <>
      <div className={`rv-overlay ${open ? 'active' : ''}`} onClick={onClose} />
      <aside className={`rv-drawer ${open ? 'active' : ''}`} role="dialog" aria-modal="true"
        aria-hidden={!open} id="rvDrawer">
        <div className="rv-head">
          <h3>Đánh giá của khách</h3>
          <button type="button" className="yn-btn yn-btn--ghost yn-btn--icon" onClick={onClose} title="Đóng">
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <div className="rv-summary">
          <div className="rv-score">
            <i className="bi bi-star-fill" /> <b>{room ? room.rating.toFixed(2) : '4.90'}</b>
          </div>
          <div className="rv-summary-text">
            <strong>{room ? room.reviewCount : TOTAL_REVIEWS} đánh giá</strong>
            <span>{room ? room.name : 'Tất cả loại phòng'}</span>
          </div>
        </div>

        <div className="rv-filters">
          <div>
            <span className="rv-filter-label">Loại phòng</span>
            <div className="rv-chip-row">
              {[{ id: 'all', label: 'Tất cả', total: TOTAL_REVIEWS }, ...REVIEW_GROUPS].map((g) => (
                <button key={g.id} type="button" className={`yn-chip ${group === g.id ? 'active' : ''}`}
                  onClick={() => { setGroup(g.id); setShown(REVIEW_PAGE_SIZE); }}>
                  {g.label} <span className="chip-count">{g.total}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="rv-filter-label">Lọc theo</span>
            <div className="rv-chip-row">
              {[{ v: 'all', label: 'Tất cả sao' }, { v: '5', label: '5', star: true }, { v: '4', label: '4', star: true }].map((s) => (
                <button key={s.v} type="button"
                  className={`yn-chip ${!photo && stars === s.v ? 'active' : ''}`}
                  onClick={() => { setStars(s.v); setPhoto(false); setShown(REVIEW_PAGE_SIZE); }}>
                  {s.star && <i className="bi bi-star-fill" />}{s.label}
                </button>
              ))}
              <button type="button" className={`yn-chip ${photo ? 'active' : ''}`}
                onClick={() => { setPhoto(!photo); setStars('all'); setShown(REVIEW_PAGE_SIZE); }}>
                <i className="bi bi-camera-fill" /> Có hình ảnh <span className="chip-count">{photoCount}</span>
              </button>
            </div>
          </div>
          <div className="rv-filter-group--inline">
            <span className="rv-filter-label">Sắp xếp</span>
            <select className="rv-select" value={sort}
              onChange={(e) => { setSort(e.target.value); setShown(REVIEW_PAGE_SIZE); }}>
              <option value="newest">Mới nhất</option>
              <option value="high">Điểm cao nhất</option>
              <option value="low">Điểm thấp nhất</option>
            </select>
          </div>
        </div>

        <div className="rv-result-bar">
          <span>
            {result.length
              ? `Hiển thị ${visible.length} / ${result.length} đánh giá`
              : 'Không có đánh giá phù hợp'}
          </span>
        </div>
        <div className="rv-list">
          {visible.length > 0
            ? visible.map((r) => (
              <ReviewCard key={r.id} review={r} showRoom clamp={false} onPhotoClick={onPhotoClick} />
            ))
            : (
              <div className="rv-empty">
                <i className="bi bi-chat-square-dots" />
                Chưa có đánh giá nào khớp với bộ lọc này.<br />
                <button type="button" className="yn-btn yn-btn--outline yn-btn--sm"
                  onClick={() => { setGroup('all'); setStars('all'); setPhoto(false); setShown(REVIEW_PAGE_SIZE); }}>
                  Xóa bộ lọc
                </button>
              </div>
            )}
        </div>
        {result.length > shown && (
          <div className="rv-foot">
            <button type="button" className="yn-btn yn-btn--outline yn-btn--block"
              onClick={() => setShown((s) => s + REVIEW_PAGE_SIZE)}>
              Xem thêm {Math.min(REVIEW_PAGE_SIZE, result.length - shown)} đánh giá
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

/** Experiences Drawer */
function ExperiencesDrawer({ open, onClose, onScrollToRooms }) {
  const [category, setCategory] = useState('all');
  const [cost, setCost] = useState('all');
  const focusItemRef = useRef(null);

  useEffect(() => {
    if (open) { setCategory('all'); setCost('all'); }
  }, [open]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && open) onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const result = experiencesData.filter((x) => matchExperience(x, category, cost));
  const cat = EXPERIENCE_CATEGORIES.find((c) => c.id === category);
  const costItem = EXPERIENCE_COSTS.find((c) => c.id === cost);

  return (
    <>
      <div className={`rv-overlay ${open ? 'active' : ''}`} onClick={onClose} />
      <aside className={`rv-drawer ${open ? 'active' : ''}`} role="dialog" aria-modal="true" aria-hidden={!open}>
        <div className="rv-head">
          <h3>Trải nghiệm tại homestay</h3>
          <button type="button" className="yn-btn yn-btn--ghost yn-btn--icon" onClick={onClose} title="Đóng">
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <div className="rv-summary">
          <div className="xp-summary-icon"><i className="bi bi-stars" /></div>
          <div className="rv-summary-text">
            <strong>{result.length} trải nghiệm</strong>
            <span>{(cat ? cat.label : 'Tất cả nhóm trải nghiệm') + (cost === 'all' ? '' : ` · ${costItem.label}`)}</span>
          </div>
        </div>
        <div className="rv-filters">
          <div>
            <span className="rv-filter-label">Nhóm trải nghiệm</span>
            <div className="rv-chip-row">
              {[{ id: 'all', label: 'Tất cả' }, ...EXPERIENCE_CATEGORIES].map((c) => {
                const count = experiencesData.filter((x) => matchExperience(x, c.id, cost)).length;
                return (
                  <button key={c.id} type="button" className={`yn-chip ${category === c.id ? 'active' : ''}`}
                    onClick={() => setCategory(c.id)}>
                    {c.label} <span className="chip-count">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <span className="rv-filter-label">Chi phí</span>
            <div className="rv-chip-row">
              {EXPERIENCE_COSTS.map((c) => {
                const count = experiencesData.filter((x) => matchExperience(x, category, c.id)).length;
                return (
                  <button key={c.id} type="button" className={`yn-chip ${cost === c.id ? 'active' : ''}`}
                    onClick={() => setCost(c.id)}>
                    {c.label} <span className="chip-count">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="rv-result-bar">
          <span>
            {result.length
              ? `Hiển thị ${result.length} / ${experiencesData.length} trải nghiệm`
              : 'Không có trải nghiệm phù hợp'}
          </span>
        </div>
        <div className="rv-list xp-list">
          {result.length > 0
            ? result.map((x) => {
              const xcat = EXPERIENCE_CATEGORIES.find((c) => c.id === x.category);
              return (
                <article key={x.id} className="xp-item" ref={focusItemRef} data-xp-id={x.id}>
                  <div className="xp-item-media">
                    <img
                      src={unsplashUrl(x.img, 1000)} alt={x.title} loading="lazy"
                      onError={(e) => { e.target.onerror = null; e.target.src = unsplashUrl(EXPERIENCE_FALLBACK_IMG, 1000); }}
                    />
                    <span className="xp-badge"><i className={`bi ${xcat?.icon}`} /> {xcat?.label}</span>
                  </div>
                  <div className="xp-item-body">
                    <h4 className="xp-item-title">{x.title}</h4>
                    <p className="xp-item-desc">{x.summary}</p>
                    <div className="xp-item-facts">
                      <span><i className="bi bi-hourglass-split" />{x.duration}</span>
                      <span><i className="bi bi-clock" />{x.time}</span>
                      <span><i className="bi bi-people" />{x.people}</span>
                    </div>
                    <ul className="xp-item-includes">
                      {x.includes.map((t, i) => (
                        <li key={i}><i className="bi bi-check2" /><span>{t}</span></li>
                      ))}
                    </ul>
                    {x.note && (
                      <div className="xp-item-note">
                        <i className="bi bi-info-circle" /><span>{x.note}</span>
                      </div>
                    )}
                    <div className="xp-item-foot">
                      <span className={`xp-item-price ${x.price === 0 ? 'is-free' : ''}`}>{experiencePriceLabel(x)}</span>
                      <span className="xp-item-book"><i className="bi bi-calendar-check" />{x.booking}</span>
                    </div>
                  </div>
                </article>
              );
            })
            : (
              <div className="rv-empty">
                <i className="bi bi-compass" />
                Chưa có trải nghiệm nào khớp.<br />
                <button type="button" className="yn-btn yn-btn--outline yn-btn--sm"
                  onClick={() => { setCategory('all'); setCost('all'); }}>Xóa bộ lọc</button>
              </div>
            )}
        </div>
        <div className="rv-foot xp-foot">
          <p className="xp-foot-note">
            <i className="bi bi-info-circle" /> Trải nghiệm tính riêng với tiền phòng. Bạn đăng ký trực tiếp với chủ nhà khi đặt phòng hoặc nhắn tin trước chuyến đi.
          </p>
          <button type="button" className="yn-btn yn-btn--primary yn-btn--block"
            onClick={() => { onClose(); onScrollToRooms(); }}>
            Chọn phòng để đặt
          </button>
        </div>
      </aside>
    </>
  );
}

/** Amenities Drawer */
function AmenitiesDrawer({ open, onClose }) {
  const [category, setCategory] = useState('all');

  useEffect(() => { if (open) setCategory('all'); }, [open]);
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && open) onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const groups = AMENITY_GROUPS.filter((g) => category === 'all' || g.id === category);
  const shownCount = amenitiesData.filter((a) => category === 'all' || a.group === category).length;
  const activeGroup = AMENITY_GROUPS.find((g) => g.id === category);

  return (
    <>
      <div className={`rv-overlay ${open ? 'active' : ''}`} onClick={onClose} />
      <aside className={`rv-drawer ${open ? 'active' : ''}`} role="dialog" aria-modal="true" aria-hidden={!open}>
        <div className="rv-head">
          <h3>Nơi này có những gì cho bạn</h3>
          <button type="button" className="yn-btn yn-btn--ghost yn-btn--icon" onClick={onClose} title="Đóng">
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <div className="rv-summary">
          <div className="xp-summary-icon"><i className="bi bi-house-door" /></div>
          <div className="rv-summary-text">
            <strong>{shownCount} tiện nghi</strong>
            <span>{activeGroup ? activeGroup.label : 'Tất cả nhóm tiện nghi'}</span>
          </div>
        </div>
        <div className="rv-filters">
          <div>
            <span className="rv-filter-label">Nhóm tiện nghi</span>
            <div className="rv-chip-row">
              {[{ id: 'all', label: 'Tất cả', count: amenitiesData.length }, ...AMENITY_GROUPS.map((g) => ({ ...g, count: amenitiesData.filter((a) => a.group === g.id).length }))].map((g) => (
                <button key={g.id} type="button" className={`yn-chip ${category === g.id ? 'active' : ''}`}
                  onClick={() => setCategory(g.id)}>
                  {g.label} <span className="chip-count">{g.count}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="rv-result-bar">
          <span>Hiển thị {shownCount} / {amenitiesData.length} tiện nghi</span>
        </div>
        <div className="rv-list am-list">
          {groups.map((g) => {
            const items = amenitiesData.filter((a) => a.group === g.id);
            return (
              <section key={g.id} className="am-group">
                <h4 className="am-group-title">
                  <i className={`bi ${g.icon}`} /> {g.label}
                  <span className="am-group-count">{items.length}</span>
                </h4>
                <ul className="am-group-list">
                  {items.map((a) => (
                    <li key={a.id} className="am-row">
                      <i className={`bi ${a.icon}`} />
                      <div>
                        <span className="am-row-name">{a.name}</span>
                        {a.note && <span className="am-row-note">{a.note}</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </aside>
    </>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────────
export default function HomestayDetail() {
  const [lightbox, setLightbox] = useState(null);
  const [activeRoomIdx, setActiveRoomIdx] = useState(null);
  const [reviewsDrawer, setReviewsDrawer] = useState({ open: false, group: 'all' });
  const [expDrawer, setExpDrawer] = useState(false);
  const [amDrawer, setAmDrawer] = useState(false);

  const [saved, setSaved] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [wishlist, setWishlist] = useState({});
  const [toast, setToast] = useState({ show: false, msg: '' });

  const roomsSectionRef = useRef(null);
  const reviewsSectionRef = useRef(null);
  const toastTimer = useRef(null);

  const anyOpen = lightbox || activeRoomIdx !== null || reviewsDrawer.open || expDrawer || amDrawer;
  useEffect(() => {
    document.body.style.overflow = anyOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [anyOpen]);

  const showToast = useCallback((msg) => {
    setToast({ show: true, msg });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), 2800);
  }, []);

  const scrollToRooms = () => {
    roomsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const scrollToReviews = () => {
    reviewsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const minPrice = Math.min(...roomsData.map((r) => r.price));

  const amenitiesPreview = amenitiesData.filter((a) => a.preview).sort((a, b) => a.preview - b.preview);
  const expPreview = EXPERIENCE_PREVIEW_IDS.map((id) => experiencesData.find((x) => x.id === id)).filter(Boolean);

  const newestAll = getFilteredReviews('all', 'all', 'newest');
  const reviewPreview = REVIEW_GROUPS
    .map((g) => newestAll.find((r) => r.group === g.id && r.photos.length) || newestAll.find((r) => r.group === g.id))
    .sort((a, b) => b.ts - a.ts);

  const handlePhotoClick = (reviewId, photoIdx) => {
    const review = allReviews.find((r) => r.id === reviewId);
    if (review?.photos.length) setLightbox({ images: review.photos.map((p) => p.full), index: photoIdx });
  };

  return (
    <div className="hd-page">
      {/* ── TITLE ──────────────────────────────────────── */}
      <section className="detail-title-section">
        <div className="hd-container">
          <div className="detail-title-row">
            <div className="detail-title-left">
              <h1 className="detail-name">The Pine Hill Retreat</h1>
              <div className="detail-meta-row">
                <span className="detail-rating">
                  <i className="bi bi-star-fill" /> 4.90{' '}
                  <a onClick={scrollToReviews}>126 đánh giá</a>
                </span>
                <span className="detail-dot">•</span>
                <span className="detail-location">
                  <i className="bi bi-geo-alt-fill" /> Phường 3, TP. Đà Lạt, Lâm Đồng
                </span>
              </div>
            </div>
            <div className="detail-title-actions">
              <button type="button" className="yn-btn yn-btn--ghost yn-btn--sm"
                onClick={() => {
                  if (navigator.clipboard && window.isSecureContext)
                    navigator.clipboard.writeText(window.location.href).catch(() => {});
                  showToast('Đã sao chép liên kết chia sẻ homestay!');
                }}>
                <i className="bi bi-share" /> Chia sẻ
              </button>
              <button type="button" className={`yn-btn yn-btn--ghost yn-btn--sm ${saved ? 'saved' : ''}`}
                onClick={() => {
                  setSaved((s) => !s);
                  showToast(!saved ? 'Đã lưu "The Pine Hill Retreat" vào Wishlist!' : 'Đã bỏ lưu khỏi Wishlist.');
                }}>
                <i className={`bi ${saved ? 'bi-heart-fill' : 'bi-heart'}`} /> {saved ? 'Đã lưu' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── GALLERY ────────────────────────────────────── */}
      <section className="detail-gallery-section">
        <div className="hd-container">
          <div className="gallery-wrap">
            <div className="gallery-grid" onClick={() => setLightbox({ images: galleryImages, index: 0 })}>
              <div className="gallery-main">
                <img src={galleryImages[0]} alt="Toàn cảnh The Pine Hill Retreat" />
              </div>
              <div className="gallery-side">
                {galleryImages.slice(1, 5).map((src, i) => (
                  <div key={i} className="gallery-thumb">
                    <img src={src} alt={`Ảnh ${i + 2}`} />
                  </div>
                ))}
              </div>
            </div>
            <button type="button" className="yn-btn yn-btn--light yn-btn--sm gallery-all-btn"
              onClick={() => setLightbox({ images: galleryImages, index: 0 })}>
              <i className="bi bi-grid-3x3-gap-fill" /> Xem tất cả {galleryImages.length} ảnh
            </button>
          </div>
        </div>
      </section>

      {/* ── BODY ───────────────────────────────────────── */}
      <section className="detail-body-section">
        <div className="hd-container detail-body-grid">
          <div className="detail-main-col">
            <div className="detail-block host-overview-block">
              <div className="host-overview-text">
                <h2 className="host-overview-title">Homestay do Chị Lan Anh quản lý</h2>
                <div className="host-overview-specs">
                  <span><i className="bi bi-door-open" /> 3 loại phòng</span>
                  <span><i className="bi bi-people" /> Tối đa 8 khách/phòng</span>
                  <span><i className="bi bi-tree" /> Trên đồi thông riêng biệt</span>
                </div>
              </div>
              <img className="host-avatar"
                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80"
                alt="Chủ nhà Lan Anh" />
            </div>
            <div className="detail-divider" />

            <div className="detail-block highlight-block">
              {[
                { icon: 'bi-tree', h: 'Không gian giữa rừng thông', p: 'Nằm trên đồi thông riêng biệt, yên tĩnh và trong lành quanh năm.' },
                { icon: 'bi-key', h: 'Tự nhận phòng dễ dàng', p: 'Mở khóa bằng mã số, thoải mái nhận phòng bất cứ giờ nào.' },
                { icon: 'bi-patch-check', h: 'Chủ nhà tận tâm', p: 'Phản hồi trong vòng 1 giờ và luôn hỗ trợ khách 24/7.' },
              ].map((item, i) => (
                <div key={i} className="highlight-item">
                  <span className="highlight-icon"><i className={`bi ${item.icon}`} /></span>
                  <div><h4>{item.h}</h4><p>{item.p}</p></div>
                </div>
              ))}
            </div>
            <div className="detail-divider" />

            <div className="detail-block">
              <p className={`detail-description ${descExpanded ? 'expanded' : ''}`}>
                Ẩn mình giữa đồi thông Đà Lạt, The Pine Hill Retreat mang đến không gian nghỉ dưỡng mộc mạc mà ấm cúng,
                nơi bạn có thể nhóm lửa sưởi ấm buổi tối se lạnh và ngắm mây trôi ngay từ bồn tắm gỗ ngoài trời.
                Homestay có nhiều loại phòng khác nhau, từ phòng đôi ấm cúng cho cặp đôi đến villa toàn căn cho nhóm đông,
                phù hợp cho mọi nhu cầu nghỉ dưỡng chậm rãi cùng người thân hoặc bạn bè.
              </p>
              <button type="button" className="yn-btn yn-btn--link"
                onClick={() => setDescExpanded((e) => !e)}>
                {descExpanded ? <>Thu gọn <i className="bi bi-chevron-up" /></> : <>Đọc thêm <i className="bi bi-chevron-down" /></>}
              </button>
            </div>
            <div className="detail-divider" />

            <div className="detail-block" id="amenitiesSection">
              <h3 className="detail-block-title">Nơi này có những gì cho bạn</h3>
              <div className="amenities-grid">
                {amenitiesPreview.map((a) => (
                  <div key={a.id} className="amenity-row">
                    <i className={`bi ${a.icon}`} /> {a.name}
                  </div>
                ))}
              </div>
              <button type="button" className="yn-btn yn-btn--outline" onClick={() => setAmDrawer(true)}>
                Hiển thị tất cả {amenitiesData.length} tiện nghi
              </button>

              <div className="experience-section">
                <div className="experience-head">
                  <div>
                    <h4 className="experience-title"><i className="bi bi-stars" /> Trải nghiệm homestay mang lại</h4>
                    <p className="experience-sub">Những hoạt động đậm chất miền quê bạn có thể tham gia ngay tại đồi thông.</p>
                  </div>
                  <span className="experience-count-note">{experiencesData.length} trải nghiệm</span>
                </div>
                <div className="experience-grid">
                  {expPreview.map((x) => {
                    const cat = EXPERIENCE_CATEGORIES.find((c) => c.id === x.category);
                    return (
                      <button key={x.id} type="button" className="xp-card" onClick={() => setExpDrawer(true)}>
                        <span className="xp-card-media">
                          <img src={unsplashUrl(x.img, 700)} alt={x.title} loading="lazy"
                            onError={(e) => { e.target.onerror = null; e.target.src = unsplashUrl(EXPERIENCE_FALLBACK_IMG, 700); }} />
                          <span className={`xp-badge ${x.price === 0 ? 'xp-badge--free' : ''}`}>{experiencePriceLabel(x)}</span>
                        </span>
                        <span className="xp-card-body">
                          <span className="xp-cat"><i className={`bi ${cat?.icon}`} /> {cat?.label}</span>
                          <span className="xp-card-name">{x.title}</span>
                          <span className="xp-card-meta"><i className="bi bi-clock" /> {x.duration}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                <button type="button" className="yn-btn yn-btn--outline" onClick={() => setExpDrawer(true)}>
                  <i className="bi bi-compass" /> Xem tất cả {experiencesData.length} trải nghiệm
                </button>
              </div>
            </div>
            <div className="detail-divider" />

            <div className="detail-block" id="roomsSection" ref={roomsSectionRef}>
              <div className="rooms-header">
                <h3 className="detail-block-title">Chọn phòng để đặt</h3>
                <span className="rooms-count-note">{roomsData.length} loại phòng đang mở đặt</span>
              </div>
              <div className="rooms-list">
                {roomsData.map((room, i) => (
                  <article key={room.id} className="room-list-card" onClick={() => setActiveRoomIdx(i)}>
                    <div className="room-list-img">
                      <img src={room.thumb} alt={room.name} loading="lazy" />
                      <span className={`room-list-availability ${room.availableCount === 1 ? 'low' : ''}`}>
                        {room.availableCount === 1 ? 'Chỉ còn 1 phòng' : `Còn ${room.availableCount} phòng`}
                      </span>
                    </div>
                    <div className="room-list-info">
                      <h4 className="room-list-name">{room.name}</h4>
                      <div className="room-list-specs">
                        <span><i className="bi bi-arrows-fullscreen" />{room.specs.area}</span>
                        <span><i className="bi bi-people" />{room.specs.guests} khách</span>
                        <span><i className="bi bi-house-door" />{room.specs.beds}</span>
                      </div>
                      <ul className="room-list-tags">
                        {room.amenities.slice(0, 3).map((a, j) => <li key={j}>{a}</li>)}
                      </ul>
                      <button type="button" className="room-rating-link"
                        onClick={(e) => { e.stopPropagation(); setReviewsDrawer({ open: true, group: room.reviewGroup }); }}>
                        <i className="bi bi-star-fill" /> {room.rating.toFixed(2)}
                        <i className="rating-sep" />
                        <span>{room.reviewCount} đánh giá</span>
                        <i className="bi bi-chevron-right rating-arrow" />
                      </button>
                    </div>
                    <div className="room-list-action">
                      <div>
                        <div className="room-list-price-label">Giá mỗi đêm</div>
                        <div className="room-list-price">{fmtVND(room.price)}</div>
                      </div>
                      <button type="button" className="yn-btn yn-btn--primary"
                        onClick={(e) => { e.stopPropagation(); setActiveRoomIdx(i); }}>
                        Xem & đặt phòng
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
            <div className="detail-divider" />

            <div className="detail-block" id="reviewsSection" ref={reviewsSectionRef}>
              <h3 className="detail-block-title"><i className="bi bi-star-fill star-gold" /> 4.90 · 126 đánh giá về homestay</h3>
              <div className="rating-overview">
                <div className="rating-score">
                  <b>4.90</b>
                  <div className="rating-stars">
                    {[...Array(5)].map((_, i) => <i key={i} className="bi bi-star-fill" />)}
                  </div>
                  <span>Tuyệt vời</span>
                </div>
                <div className="rating-breakdown">
                  {[['Sạch sẽ', 98, 4.9], ['Vị trí', 96, 4.8], ['Giao tiếp', 99, 5.0], ['Đáng giá tiền', 94, 4.7]].map(([label, w, score]) => (
                    <div key={label} className="rating-bar-row">
                      <span>{label}</span>
                      <div className="rating-bar"><span style={{ width: `${w}%` }} /></div>
                      <b>{score}</b>
                    </div>
                  ))}
                </div>
              </div>
              <div className="reviews-grid">
                {reviewPreview.map((r) => (
                  <ReviewCard key={r.id} review={r} showRoom clamp onPhotoClick={handlePhotoClick} />
                ))}
              </div>
              <button type="button" className="yn-btn yn-btn--outline"
                onClick={() => setReviewsDrawer({ open: true, group: 'all' })}>
                <i className="bi bi-chat-square-text" /> Xem tất cả 126 đánh giá
              </button>
            </div>
            <div className="detail-divider" />

            <div className="detail-block">
              <h3 className="detail-block-title">Vị trí homestay</h3>
              <p className="location-note">
                <i className="bi bi-geo-alt-fill" /> Phường 3, TP. Đà Lạt, Lâm Đồng · Cách trung tâm 1.2km, cách chợ đêm Đà Lạt 5 phút đi xe
              </p>
              <div className="location-map-box">
                <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1200&q=80" alt="Bản đồ khu vực Đà Lạt" />
                <div className="map-pin"><i className="bi bi-geo-alt-fill" /></div>
              </div>
            </div>
            <div className="detail-divider" />

            <div className="detail-block host-profile-block">
              <img className="host-profile-avatar"
                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80"
                alt="Chủ nhà Lan Anh" />
              <div className="host-profile-info">
                <h3>Chủ nhà: Lan Anh</h3>
                <div className="host-profile-stats">
                  <span><b>126</b> đánh giá</span>
                  <span><b>4.9</b> ★ điểm chủ nhà</span>
                  <span><b>3</b> năm đón khách</span>
                </div>
                <p>Xin chào, mình là Lan Anh — sinh ra và lớn lên ở Đà Lạt. Mình xây khu nhà gỗ này để chia sẻ góc bình yên của gia đình với những ai muốn tạm rời phố thị. Mình luôn ở gần đó nên có thể hỗ trợ bạn bất cứ lúc nào trong chuyến đi.</p>
              </div>
            </div>
            <div className="detail-divider" />

            <div className="detail-block">
              <h3 className="detail-block-title">Điều cần lưu ý</h3>
              <div className="rules-grid">
                <div className="rules-col">
                  <h5><i className="bi bi-clock" /> Nội quy nhà</h5>
                  <p>Nhận phòng: 14:00 - 21:00</p>
                  <p>Trả phòng: trước 12:00</p>
                  <p>Không tổ chức tiệc, sự kiện</p>
                </div>
                <div className="rules-col">
                  <h5><i className="bi bi-shield-check" /> An toàn & tài sản</h5>
                  <p>Có lắp camera ở khu vực ngoài trời</p>
                  <p>Trang bị bình chữa cháy, hộp sơ cứu</p>
                </div>
                <div className="rules-col">
                  <h5><i className="bi bi-arrow-counterclockwise" /> Chính sách hủy phòng</h5>
                  <p>Miễn phí hủy trong 48 giờ sau khi đặt</p>
                  <p>Hoàn 50% nếu hủy trước 5 ngày nhận phòng</p>
                </div>
              </div>
            </div>
          </div>

          <aside className="detail-side-col">
            <div className="summary-card">
              <span className="summary-from-label">Giá chỉ từ</span>
              <div className="summary-price"><b>{fmtVND(minPrice)}</b> / đêm</div>
              <div className="summary-rating"><i className="bi bi-star-fill" /> 4.90 · 126 đánh giá</div>
              <button type="button" className="yn-btn yn-btn--primary yn-btn--lg yn-btn--block" onClick={scrollToRooms}>
                Xem các loại phòng
              </button>
              <p className="summary-note">
                <i className="bi bi-check2-circle" /> {roomsData.length} loại phòng còn trống · Miễn phí hủy trong 48 giờ
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section className="similar-section">
        <div className="hd-container">
          <div className="similar-head">
            <div>
              <h2 className="similar-title">Homestay tương tự gần Đà Lạt</h2>
              <p className="similar-sub">Cùng khu vực, cùng phong cách nghỉ dưỡng giữa thiên nhiên.</p>
            </div>
          </div>
          <div className="similar-grid">
            {similarHomestaysData.map((item, i) => (
              <article key={i} className="sim-card">
                <button type="button"
                  className={`sim-wish ${wishlist[item.name] ? 'active' : ''}`}
                  onClick={() => {
                    setWishlist((w) => ({ ...w, [item.name]: !w[item.name] }));
                    showToast(!wishlist[item.name] ? `Đã thêm "${item.name}" vào Wishlist!` : `Đã bỏ lưu "${item.name}" khỏi Wishlist.`);
                  }}
                  title="Lưu vào Wishlist">
                  <i className={`bi ${wishlist[item.name] ? 'bi-heart-fill' : 'bi-heart'}`} />
                </button>
                <a className="sim-media" href="#">
                  <img src={item.img} alt={item.name} loading="lazy" />
                </a>
                <div className="sim-body">
                  <div className="sim-meta">
                    <span className="sim-loc"><i className="bi bi-geo-alt-fill" /> {item.location}</span>
                    <span className="sim-rate"><i className="bi bi-star-fill" /> {item.rating} <small>({item.reviews})</small></span>
                  </div>
                  <h3 className="sim-title"><a href="#">{item.name}</a></h3>
                  <p className="sim-specs">{item.specs}</p>
                  <ul className="sim-tags">
                    {item.amenities.split(' · ').map((a, j) => <li key={j}>{a}</li>)}
                  </ul>
                  <div className="sim-foot">
                    <div className="sim-price">
                      <small>Giá từ</small><b>{item.price}</b><small>/ đêm</small>
                    </div>
                    <button type="button" className="yn-btn yn-btn--primary yn-btn--sm" onClick={() => {}}>
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <div className="mobile-booking-bar">
        <div>
          <b>{fmtVND(minPrice)}</b> <span>/ đêm</span>
          <div className="mobile-booking-rating"><i className="bi bi-star-fill" /> 4.90 (126)</div>
        </div>
        <button type="button" className="yn-btn yn-btn--primary" onClick={scrollToRooms}>Xem phòng</button>
      </div>

      {lightbox && (
        <Lightbox
          images={lightbox.images}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onNav={(dir) => setLightbox((lb) => ({ ...lb, index: (lb.index + dir + lb.images.length) % lb.images.length }))}
        />
      )}

      {activeRoomIdx !== null && (
        <RoomModal
          room={roomsData[activeRoomIdx]}
          onClose={() => setActiveRoomIdx(null)}
          onOpenReviews={(group) => { setActiveRoomIdx(null); setReviewsDrawer({ open: true, group }); }}
          showToast={showToast}
        />
      )}

      <ReviewsDrawer
        open={reviewsDrawer.open}
        initialGroup={reviewsDrawer.group}
        onClose={() => setReviewsDrawer((s) => ({ ...s, open: false }))}
        onPhotoClick={handlePhotoClick}
      />

      <ExperiencesDrawer
        open={expDrawer}
        onClose={() => setExpDrawer(false)}
        onScrollToRooms={scrollToRooms}
      />

      <AmenitiesDrawer
        open={amDrawer}
        onClose={() => setAmDrawer(false)}
      />

      <Toast message={toast.msg} show={toast.show} />
    </div>
  );
}
