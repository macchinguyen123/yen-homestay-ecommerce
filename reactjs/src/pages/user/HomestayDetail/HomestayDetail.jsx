import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import './HomestayDetail.css';
import { authService } from '../../../services/authService';
import { viewedHistoryService } from '../../../services/viewedHistoryService';
import { roomService } from '../../../services/roomService';
import { homestayService } from '../../../services/homestayService';
import { reviewService } from '../../../services/reviewService';
import { SAMPLE_HOMESTAYS } from '../../../data/sampleHomestays';
import {
  roomsData, galleryImages, amenitiesData, AMENITY_GROUPS,
  experiencesData, EXPERIENCE_CATEGORIES, EXPERIENCE_COSTS, EXPERIENCE_PREVIEW_IDS,
  EXPERIENCE_FALLBACK_IMG, similarHomestaysData,
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

/** Review card hiển thị người dùng và đánh giá thật từ Database */
function ReviewCard({ review, showRoom = true, clamp = false, onPhotoClick }) {
  const name = review.touristName || review.name || 'Khách du lịch';
  const initial = name.trim().split(' ').pop().charAt(0).toUpperCase();
  const dateStr = review.formattedDate || review.date || 'Gần đây';
  const ratingVal = review.rating || review.stars || 5;
  const roomName = review.roomName || review.room;
  const photos = review.images || review.photos || [];

  return (
    <div className="review-card">
      <div className="review-head">
        <div className="review-avatar" style={reviewAvatarStyle(name)}>{initial}</div>
        <div>
          <h5>{name}</h5>
          <span>{dateStr}</span>
        </div>
      </div>
      {showRoom && roomName && (
        <span className="review-room-badge">
          <i className="bi bi-door-open" /> {roomName}
        </span>
      )}
      <div className="review-stars">
        {Array.from({ length: 5 }, (_, i) => (
          <i key={i} className={`bi bi-star-fill ${i >= ratingVal ? 'off' : ''}`} />
        ))}
      </div>
      <p className={`review-text ${clamp ? 'clamp' : ''}`}>{review.comment || review.text}</p>
      {review.ownerReply && (
        <div className="review-owner-reply">
          <strong><i className="bi bi-reply-fill" /> Phản hồi từ chủ nhà:</strong>
          <p>{review.ownerReply}</p>
        </div>
      )}
      {photos.length > 0 && (
        <div className="review-photos">
          {photos.map((p, i) => (
            <button key={i} type="button" className="review-photo"
              onClick={() => onPhotoClick && onPhotoClick(review.id, i)}
              title="Xem ảnh lớn">
              <img src={typeof p === 'string' ? p : p.thumb} alt={`Ảnh đánh giá của ${name}`} loading="lazy" />
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
function RoomModal({ room, homestay, allHomestayReviews = [], onClose, onOpenReviews, showToast }) {
  const [galleryIdx, setGalleryIdx] = useState(0);
  const scrollRef = useRef(null);

  const gallery = room.gallery && room.gallery.length > 0 
    ? room.gallery 
    : (room.images && room.images.length > 0 ? room.images : [room.thumb || room.primaryImage || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80']);

  const roomPrice = Number(room.price || room.pricePerNight || 890000);
  const cleaningFee = Number(room.cleaningFee || 100000);
  const maxGuests = room.specs?.guests || room.capacity || 2;
  const areaDesc = room.specs?.area || '28m²';
  const bedsDesc = room.specs?.beds || `${room.bedCount || 1} giường`;
  const amenitiesList = room.amenities || ['Wifi tốc độ cao', 'Phòng tắm riêng', 'Máy điều hòa'];
  const roomName = room.name || room.roomName || 'Chi tiết phòng';
  const availableCount = room.availableCount || 2;

  const today = new Date();
  const defaultCheckin = new Date(today); defaultCheckin.setDate(today.getDate() + 7);
  const defaultCheckout = new Date(defaultCheckin); defaultCheckout.setDate(defaultCheckin.getDate() + 2);

  const [checkin, setCheckin] = useState(toInputDate(defaultCheckin));
  const [checkout, setCheckout] = useState(toInputDate(defaultCheckout));
  const [guests, setGuests] = useState(Math.min(2, maxGuests));
  const [warning, setWarning] = useState('');

  const calcNights = useCallback(() => {
    if (!checkin || !checkout) return 2;
    const diff = Math.round((new Date(checkout) - new Date(checkin)) / 86400000);
    return diff > 0 ? diff : 0;
  }, [checkin, checkout]);

  const nights = calcNights();
  const subtotal = roomPrice * nights;
  const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE);
  const total = nights > 0 ? subtotal + cleaningFee + serviceFee : 0;

  useEffect(() => {
    if (nights <= 0 && checkin && checkout) setWarning('Ngày trả phòng phải sau ngày nhận phòng ít nhất 1 đêm.');
    else setWarning('');
  }, [nights, checkin, checkout]);

  useEffect(() => { setGalleryIdx(0); if (scrollRef.current) scrollRef.current.scrollTop = 0; }, [room]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setGalleryIdx((i) => (i + 1) % gallery.length);
      if (e.key === 'ArrowLeft') setGalleryIdx((i) => (i - 1 + gallery.length) % gallery.length);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, gallery.length]);

  const navigate = useNavigate();
  const handleBook = () => {
    if (!nights || nights <= 0) { showToast('Vui lòng chọn lại ngày nhận - trả phòng hợp lệ!'); return; }
    showToast(`Đang chuyển đến trang xác nhận đặt "${roomName}"...`);
    onClose();
    const hId = homestay?.id || room.homestayId || '';
    navigate(`/booking?homestayId=${hId}&roomId=${room.id}&checkin=${checkin}&checkout=${checkout}&guests=${guests}`, {
      state: {
        homestayId: hId,
        roomId: room.id,
        checkin,
        checkout,
        guests,
        homestay,
        room,
      },
    });
  };

  const roomReviews = useMemo(() => {
    return (allHomestayReviews || []).filter((r) => String(r.roomId) === String(room.id));
  }, [allHomestayReviews, room.id]);

  const modalReviewCount = roomReviews.length;
  const modalRating = modalReviewCount > 0
    ? (roomReviews.reduce((sum, r) => sum + r.rating, 0) / modalReviewCount).toFixed(1)
    : (room.rating ? (room.rating > 5 ? (room.rating / 2).toFixed(1) : Number(room.rating).toFixed(1)) : '5.0');

  return (
    <div className="room-modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="room-modal-container" role="dialog" aria-modal="true">
        <button type="button" className="room-modal-close-btn" onClick={onClose} title="Đóng">
          <i className="bi bi-x-lg" />
        </button>
        <div className="room-modal-scroll" ref={scrollRef}>
          <div className="room-modal-gallery">
            <button type="button" className="room-gallery-arrow prev" onClick={() => setGalleryIdx((i) => (i - 1 + gallery.length) % gallery.length)} title="Ảnh trước">
              <i className="bi bi-chevron-left" />
            </button>
            <img src={gallery[galleryIdx]} alt="Ảnh phòng" />
            <button type="button" className="room-gallery-arrow next" onClick={() => setGalleryIdx((i) => (i + 1) % gallery.length)} title="Ảnh sau">
              <i className="bi bi-chevron-right" />
            </button>
            <span className="room-gallery-counter">{galleryIdx + 1} / {gallery.length}</span>
          </div>

          <div className="room-modal-body">
            <div className="room-modal-head">
              <div>
                <span className="room-modal-tag">Còn {availableCount} phòng trống</span>
                <h2 className="room-modal-title">{roomName}</h2>
                <div className="room-modal-specs">
                  <span><i className="bi bi-arrows-fullscreen" />{areaDesc}</span>
                  <span><i className="bi bi-people" />{maxGuests} khách</span>
                  <span><i className="bi bi-house-door" />{bedsDesc}</span>
                </div>
              </div>
              <div className="room-modal-price-tag">
                <b>{fmtVND(roomPrice)}</b>
                <span>/ đêm</span>
              </div>
            </div>

            <p className="room-modal-desc">{room.description || `Không gian ${roomName} được trang bị đầy đủ tiện nghi tiêu chuẩn cao cấp.`}</p>

            <h4 className="room-modal-subtitle">Tiện nghi trong phòng</h4>
            <div className="room-modal-amenities">
              {amenitiesList.map((a, i) => (
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
                  {Array.from({ length: maxGuests }, (_, i) => i + 1).map((g) => (
                    <option key={g} value={g}>{g} khách</option>
                  ))}
                </select>
              </div>
            </div>
            {warning && <p className="room-booking-warning">{warning}</p>}

            <div className="room-price-breakdown">
              <div className="breakdown-row">
                <span>{fmtVND(roomPrice)} x {nights} đêm</span>
                <span>{fmtVND(subtotal)}</span>
              </div>
              <div className="breakdown-row">
                <span>Phí vệ sinh</span>
                <span>{fmtVND(cleaningFee)}</span>
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
                <i className="bi bi-star-fill" /> {modalRating} · {modalReviewCount} đánh giá
              </span>
            </div>
            {modalReviewCount > 0 ? (
              <div className="room-modal-reviews">
                {roomReviews.slice(0, 2).map((r) => (
                  <ReviewCard key={r.id} review={r} showRoom={false} clamp={true} />
                ))}
              </div>
            ) : (
              <div className="rv-empty-state" style={{ padding: '24px 16px', marginBottom: '16px' }}>
                <i className="bi bi-chat-square-dots" style={{ fontSize: '1.6rem' }} />
                <p>Phòng này hiện chưa có đánh giá riêng nào từ khách hàng.</p>
              </div>
            )}
            <button type="button" className="yn-btn yn-btn--outline yn-btn--block"
              onClick={() => onOpenReviews(modalReviewCount > 0 ? String(room.id) : 'all')}>
              <i className="bi bi-chat-square-text" /> {modalReviewCount > 0 ? `Xem tất cả ${modalReviewCount} đánh giá về phòng này` : 'Xem đánh giá về homestay'}
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
function ReviewsDrawer({ open, onClose, initialGroup, reviews = [], rooms = [], homestayRating = '5.0', onPhotoClick }) {
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

  // Nhóm phòng thực tế kèm số lượng đánh giá thực tế từ Database
  const roomFilterList = useMemo(() => {
    return (rooms || []).map((r) => ({
      id: String(r.id),
      label: r.name || r.roomName || 'Phòng',
      total: reviews.filter((rev) => String(rev.roomId) === String(r.id)).length
    }));
  }, [rooms, reviews]);

  const selectedRoomObj = roomFilterList.find((g) => g.id === group);

  // Lọc đánh giá thực tế
  const filtered = useMemo(() => {
    let res = (reviews || []).filter((r) => {
      if (group !== 'all' && String(r.roomId) !== String(group)) return false;
      if (stars !== 'all' && Number(r.rating) !== Number(stars)) return false;
      if (photo && (!r.images || r.images.length === 0)) return false;
      return true;
    });

    if (sort === 'highest') {
      res.sort((a, b) => b.rating - a.rating || new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (sort === 'lowest') {
      res.sort((a, b) => a.rating - b.rating || new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else {
      res.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
    return res;
  }, [reviews, group, stars, photo, sort]);

  const visible = filtered.slice(0, shown);
  const photoCount = reviews.filter((r) => (group === 'all' || String(r.roomId) === String(group)) && r.images && r.images.length > 0).length;

  return (
    <>
      <div className={`rv-overlay ${open ? 'active' : ''}`} onClick={onClose} />
      <aside className={`rv-drawer ${open ? 'active' : ''}`} role="dialog" aria-modal="true"
        aria-hidden={!open} id="rvDrawer">
        <div className="rv-head">
          <h3>Đánh giá từ khách hàng ({reviews.length})</h3>
          <button type="button" className="yn-btn yn-btn--ghost yn-btn--icon" onClick={onClose} title="Đóng">
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <div className="rv-summary">
          <div className="rv-score">
            <i className="bi bi-star-fill" /> <b>{homestayRating}</b>
          </div>
          <div className="rv-summary-text">
            <strong>{group === 'all' ? reviews.length : (selectedRoomObj?.total || 0)} đánh giá</strong>
            <span>{group === 'all' ? 'Tất cả loại phòng' : (selectedRoomObj?.label || 'Phòng đã chọn')}</span>
          </div>
        </div>

        <div className="rv-filters">
          <div>
            <span className="rv-filter-label">Loại phòng</span>
            <div className="rv-chip-row">
              <button type="button" className={`yn-chip ${group === 'all' ? 'active' : ''}`}
                onClick={() => { setGroup('all'); setShown(REVIEW_PAGE_SIZE); }}>
                Tất cả loại phòng <span className="chip-count">{reviews.length}</span>
              </button>
              {roomFilterList.map((g) => (
                <button key={g.id} type="button" className={`yn-chip ${String(group) === String(g.id) ? 'active' : ''}`}
                  onClick={() => { setGroup(String(g.id)); setShown(REVIEW_PAGE_SIZE); }}>
                  {g.label} <span className="chip-count">{g.total}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="rv-filter-label">Lọc theo sao</span>
            <div className="rv-chip-row">
              {['all', '5', '4', '3', '2', '1'].map((s) => {
                const count = s === 'all'
                  ? reviews.filter((r) => group === 'all' || String(r.roomId) === String(group)).length
                  : reviews.filter((r) => (group === 'all' || String(r.roomId) === String(group)) && Number(r.rating) === Number(s)).length;
                return (
                  <button key={s} type="button"
                    className={`yn-chip ${!photo && stars === s ? 'active' : ''}`}
                    onClick={() => { setStars(s); setPhoto(false); setShown(REVIEW_PAGE_SIZE); }}>
                    {s !== 'all' && <i className="bi bi-star-fill" />}
                    {s === 'all' ? 'Tất cả sao' : `${s} sao`}
                    <span className="chip-count">{count}</span>
                  </button>
                );
              })}
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
              <option value="highest">Điểm cao nhất</option>
              <option value="lowest">Điểm thấp nhất</option>
            </select>
          </div>
        </div>

        <div className="rv-result-bar">
          <span>
            {filtered.length
              ? `Hiển thị ${visible.length} / ${filtered.length} đánh giá`
              : 'Không có đánh giá phù hợp'}
          </span>
        </div>
        <div className="rv-list">
          {visible.length > 0 ? (
            visible.map((r) => (
              <ReviewCard key={r.id} review={r} showRoom clamp={false} onPhotoClick={onPhotoClick} />
            ))
          ) : (
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
        {filtered.length > shown && (
          <div className="rv-foot">
            <button type="button" className="yn-btn yn-btn--outline yn-btn--block"
              onClick={() => setShown((s) => s + REVIEW_PAGE_SIZE)}>
              Xem thêm {Math.min(REVIEW_PAGE_SIZE, filtered.length - shown)} đánh giá
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
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [lightbox, setLightbox] = useState(null);
  const [activeRoomIdx, setActiveRoomIdx] = useState(null);
  const [reviewsDrawer, setReviewsDrawer] = useState({ open: false, group: 'all' });
  const [expDrawer, setExpDrawer] = useState(false);
  const [amDrawer, setAmDrawer] = useState(false);

  const [saved, setSaved] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [wishlist, setWishlist] = useState({});
  const [toast, setToast] = useState({ show: false, msg: '' });

  // State thông tin homestay và danh sách phòng từ Database
  const [homestay, setHomestay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState(roomsData);

  // Đánh giá thực tế lấy trực tiếp từ bảng reviews & users trong CSDL
  const [dbReviews, setDbReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [loadingReviews, setLoadingReviews] = useState(true);

  const roomsSectionRef = useRef(null);
  const reviewsSectionRef = useRef(null);
  const toastTimer = useRef(null);

  const location = useLocation();

  // Tải đánh giá thực tế từ Database theo homestay ID
  useEffect(() => {
    const targetId = homestay?.id || (id && !isNaN(id) ? Number(id) : null);
    if (!targetId) return;

    let isMounted = true;
    const loadRealReviews = async () => {
      setLoadingReviews(true);
      try {
        const [revs, stats] = await Promise.all([
          reviewService.getReviewsByHomestayId(targetId),
          reviewService.getReviewStats(targetId)
        ]);
        if (isMounted) {
          setDbReviews(revs || []);
          setReviewStats(stats);
          setLoadingReviews(false);
        }
      } catch (err) {
        console.warn('Lỗi khi tải đánh giá từ CSDL:', err);
        if (isMounted) setLoadingReviews(false);
      }
    };

    loadRealReviews();
    return () => { isMounted = false; };
  }, [homestay?.id, id]);

  // Tải thông tin homestay và danh sách phòng thật từ SAMPLE_HOMESTAYS hoặc Database
  useEffect(() => {
    window.scrollTo(0, 0);
    let isMounted = true;
    const fetchHomestayAndRooms = async () => {
      setLoading(true);
      try {
        let currentHomestay = null;
        let homestayIdNum = id && !isNaN(id) ? Number(id) : null;

        // 1. Ưu tiên tải từ database trước nếu id là số
        if (homestayIdNum) {
          try {
            currentHomestay = await homestayService.getHomestayById(homestayIdNum);
          } catch (error) {
            console.error("Error fetching homestay from DB:", error);
          }
        }

        // 2. Nếu không tìm thấy trong database, tìm trong SAMPLE_HOMESTAYS
        if (!currentHomestay && id) {
          currentHomestay = SAMPLE_HOMESTAYS.find(
            (h) => String(h.id) === String(id) || 
                   h.name.toLowerCase() === decodeURIComponent(id).toLowerCase()
          );
        }
        // 3. Nếu chưa có, tìm trong tất cả homestays từ database
        if (!currentHomestay) {
          const allDbHomestays = await homestayService.getAllHomestays();
          if (allDbHomestays && allDbHomestays.length > 0) {
            if (id) {
              currentHomestay = allDbHomestays.find(
                (h) => String(h.id) === String(id) || (h.city && id.includes(h.city))
              );
            }
            if (!currentHomestay) {
              currentHomestay = allDbHomestays[0];
            }
          }
        }

        // 4. Fallback mặc định về homestay đầu tiên trong SAMPLE_HOMESTAYS
        if (!currentHomestay) {
          currentHomestay = SAMPLE_HOMESTAYS[0];
        }

        if (isMounted && currentHomestay) {
          setHomestay(currentHomestay);
          if (currentHomestay.rooms && currentHomestay.rooms.length > 0) {
            setRooms(currentHomestay.rooms);
            return;
          }
        }

        // 5. Nếu homestay chưa có phòng sẵn, tải phòng từ database
        const targetId = currentHomestay?.id || homestayIdNum || 1;
        if (!isNaN(targetId)) {
          const dbRooms = await roomService.getRoomsByHomestayId(Number(targetId));
          if (isMounted && dbRooms && dbRooms.length > 0) {
            setRooms(dbRooms);
            return;
          }
        }
      } catch (err) {
        console.warn('Lỗi khi tải chi tiết homestay & phòng:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchHomestayAndRooms();
    return () => { isMounted = false; };
  }, [id]);

  // Mở trực tiếp modal chi tiết phòng nếu có param ?room=... hoặc đi qua route /room/:id, /chi-tiet-phong/:id
  useEffect(() => {
    const isRoomRoute = location.pathname.startsWith('/room') || location.pathname.startsWith('/chi-tiet-phong');
    const roomParam = searchParams.get('room') || searchParams.get('roomId') || (isRoomRoute ? id : null);
    if (roomParam && rooms && rooms.length > 0) {
      const idx = rooms.findIndex((r) => r.id === roomParam || String(r.id) === String(roomParam));
      if (idx !== -1) {
        setActiveRoomIdx(idx);
      } else if (!isNaN(roomParam) && Number(roomParam) >= 0 && Number(roomParam) < rooms.length) {
        setActiveRoomIdx(Number(roomParam));
      } else {
        // Fallback mở phòng đầu tiên nếu roomParam không khớp ID cụ thể
        setActiveRoomIdx(0);
      }
    } else if (isRoomRoute && rooms && rooms.length > 0) {
      setActiveRoomIdx(0);
    }
  }, [id, searchParams, location.pathname, rooms]);

  // Tự động lưu lịch sử sản phẩm đã xem của user
  useEffect(() => {
    const recordUserView = async () => {
      const currentUser = authService.getCurrentUser();
      const userId = currentUser?.id || 10;

      let targetHomestayId = 1;
      if (id) {
        if (!isNaN(id)) {
          targetHomestayId = Number(id);
        } else if (id.includes("memory")) targetHomestayId = 2;
        else if (id.includes("topas") || id.includes("sapa")) targetHomestayId = 3;
        else if (id.includes("trangan") || id.includes("ninhbinh")) targetHomestayId = 4;
        else if (id.includes("nharuong") || id.includes("hue")) targetHomestayId = 5;
        else if (id.includes("sontra")) targetHomestayId = 6;
      }
      await viewedHistoryService.recordView(userId, targetHomestayId);
    };
    recordUserView();
  }, [id]);

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

  const navigate = useNavigate();

  // Đánh giá và số lượt bình luận thực tế hoàn toàn từ CSDL (bảng reviews & users)
  const homestayReviewCount = reviewStats?.totalReviews ?? dbReviews.length;
  const homestayRating = homestayReviewCount > 0
    ? (reviewStats?.averageRating != null && reviewStats.averageRating > 0
        ? Number(reviewStats.averageRating).toFixed(1)
        : (dbReviews.reduce((sum, r) => sum + r.rating, 0) / dbReviews.length).toFixed(1))
    : (homestay?.rating ? (homestay.rating > 5 ? (homestay.rating / 2).toFixed(1) : Number(homestay.rating).toFixed(1)) : '5.0');

  const starBreakdown = useMemo(() => {
    if (homestayReviewCount === 0) {
      return [
        { label: '5 sao', pct: 0, count: 0 },
        { label: '4 sao', pct: 0, count: 0 },
        { label: '3 sao', pct: 0, count: 0 },
        { label: '2 sao', pct: 0, count: 0 },
        { label: '1 sao', pct: 0, count: 0 }
      ];
    }
    const counts = reviewStats?.starCounts || {};
    return [5, 4, 3, 2, 1].map((s) => {
      const c = counts[s] || dbReviews.filter((r) => Number(r.rating) === s).length;
      const pct = Math.round((c / homestayReviewCount) * 100);
      return { label: `${s} sao`, pct, count: c };
    });
  }, [homestayReviewCount, reviewStats, dbReviews]);

  const handlePhotoClick = (reviewId, photoIdx) => {
    const review = dbReviews.find((r) => r.id === reviewId);
    const photos = review?.images || review?.photos || [];
    if (photos.length) {
      setLightbox({
        images: photos.map((p) => typeof p === 'string' ? p : p.full || p.thumb),
        index: photoIdx
      });
    }
  };

  const minPrice = rooms.length > 0 ? Math.min(...rooms.map((r) => Number(r.price || r.pricePerNight || 0))) : 890000;

  const amenitiesPreview = amenitiesData.filter((a) => a.preview).sort((a, b) => a.preview - b.preview);
  const expPreview = EXPERIENCE_PREVIEW_IDS.map((id) => experiencesData.find((x) => x.id === id)).filter(Boolean);

  const relatedHomestays = useMemo(() => {
    const others = SAMPLE_HOMESTAYS.filter(
      (h) => String(h.id) !== String(homestay?.id) && h.name !== homestay?.name
    );
    const sameCity = others.filter((h) => homestay?.city && h.city && h.city.toLowerCase() === homestay.city.toLowerCase());
    const pool = [...sameCity, ...others.filter((h) => !sameCity.includes(h))];
    return pool.slice(0, 3).map((h) => ({
      id: h.id,
      name: h.name,
      location: h.location || h.city || 'Việt Nam',
      rating: h.rating ? (h.rating > 5 ? (h.rating / 2).toFixed(2) : Number(h.rating).toFixed(2)) : '4.90',
      reviews: h.reviewCount || h.reviews || 68,
      specs: `${h.rooms?.length || 2} loại phòng · Phù hợp nghỉ dưỡng`,
      amenities: h.tags?.join(' · ') || 'Wifi miễn phí · Bữa sáng · Ban công',
      price: fmtVND(h.price || h.pricePerNight || 850000),
      img: h.image || h.gallery?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=700&q=80'
    }));
  }, [homestay]);

  const activeGallery = homestay?.gallery?.length > 0
    ? homestay.gallery
    : (homestay?.images?.length > 0 
        ? homestay.images 
        : (homestay?.image ? [homestay.image, ...galleryImages.slice(1)] : galleryImages));

  const homestayName = homestay?.name || 'The Pine Hill Retreat';
  const homestayAddress = homestay?.address || homestay?.location || 'Phường 3, TP. Đà Lạt, Lâm Đồng';
  const homestayDescription = homestay?.description || homestay?.desc || `Ẩn mình giữa đồi thông Đà Lạt, The Pine Hill Retreat mang đến không gian nghỉ dưỡng mộc mạc mà ấm cúng, nơi bạn có thể nhóm lửa sưởi ấm buổi tối se lạnh và ngắm mây trôi ngay từ bồn tắm gỗ ngoài trời. Homestay có nhiều loại phòng khác nhau, từ phòng đôi ấm cúng cho cặp đôi đến villa toàn căn cho nhóm đông, phù hợp cho mọi nhu cầu nghỉ dưỡng chậm rãi cùng người thân hoặc bạn bè.`;
  const hostName = homestay?.ownerName || homestay?.hostName || 'Trần Văn Hùng';
  const hostAvatar = homestay?.ownerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80';
  const hostBio = homestay?.ownerBio || `Xin chào! Tôi là ${hostName}, người sáng lập và quản lý homestay. Rất vui được đón tiếp quý khách đến nghỉ dưỡng và tận hưởng những ngày bình yên.`;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', color: '#15803D' }}>
        <i className="bi bi-arrow-repeat" style={{ animation: 'spin 1s linear infinite', fontSize: '2rem', marginBottom: '16px' }} />
        <h2>Đang tải thông tin homestay...</h2>
      </div>
    );
  }

  return (
    <div className="hd-page">
      {/* ── TITLE ──────────────────────────────────────── */}
      <section className="detail-title-section">
        <div className="hd-container">
          <div className="detail-title-row">
            <div className="detail-title-left">
              <h1 className="detail-name">{homestayName}</h1>
              <div className="detail-meta-row">
                <span className="detail-rating">
                  <i className="bi bi-star-fill" /> {homestayRating}{' '}
                  <a onClick={scrollToReviews}>{homestayReviewCount} đánh giá</a>
                </span>
                <span className="detail-dot">•</span>
                <span className="detail-location">
                  <i className="bi bi-geo-alt-fill" /> {homestayAddress}
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
                  showToast(!saved ? `Đã lưu "${homestayName}" vào Wishlist!` : 'Đã bỏ lưu khỏi Wishlist.');
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
            <div className="gallery-grid">
              <div className="gallery-main" onClick={() => setLightbox({ images: activeGallery, index: 0 })}>
                <img src={activeGallery[0]} alt={`Toàn cảnh ${homestayName}`} />
              </div>
              <div className="gallery-side">
                {activeGallery.slice(1, 5).map((src, i) => (
                  <div key={i} className="gallery-thumb" onClick={() => setLightbox({ images: activeGallery, index: i + 1 })}>
                    <img src={src} alt={`Ảnh ${i + 2}`} />
                  </div>
                ))}
              </div>
            </div>
            <button type="button" className="yn-btn yn-btn--light yn-btn--sm gallery-all-btn"
              onClick={() => setLightbox({ images: activeGallery, index: 0 })}>
              <i className="bi bi-grid-3x3-gap-fill" /> Xem tất cả {activeGallery.length} ảnh
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
                <h2 className="host-overview-title">
                  {homestay?.name ? `Chỗ nghỉ ${homestay.name}` : `Homestay do ${hostName} quản lý`}
                </h2>
                <div className="host-overview-specs">
                  <span><i className="bi bi-door-open" /> {rooms.length} loại phòng</span>
                  <span><i className="bi bi-people" /> Tối đa {homestay?.maxGuests || 8} khách/phòng</span>
                  <span><i className="bi bi-geo-alt" /> {homestay?.city || 'Việt Nam'}</span>
                </div>
              </div>
              <img className="host-avatar"
                src={hostAvatar}
                alt={`Chủ homestay ${hostName}`} />
            </div>
            <div className="detail-divider" />

            <div className="detail-block highlight-block">
              {[
                { icon: 'bi-tree', h: 'Không gian hòa mình cùng thiên nhiên', p: 'Khuôn viên riêng biệt, yên tĩnh và trong lành quanh năm.' },
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
                {homestayDescription}
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
                <span className="rooms-count-note">{rooms.length} loại phòng đang mở đặt</span>
              </div>
              <div className="rooms-list">
                {rooms.map((room, i) => (
                  <article key={room.id} className="room-list-card" onClick={() => setActiveRoomIdx(i)}>
                    <div className="room-list-img">
                      <img src={room.thumb || room.primaryImage || room.gallery?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=700&q=80'} alt={room.name || room.roomName} loading="lazy" />
                      <span className={`room-list-availability ${room.availableCount === 1 ? 'low' : ''}`}>
                        {room.availableCount === 1 ? 'Chỉ còn 1 phòng' : `Còn ${room.availableCount || 2} phòng`}
                      </span>
                    </div>
                    <div className="room-list-info">
                      <h4 className="room-list-name">{room.name || room.roomName}</h4>
                      <div className="room-list-specs">
                        <span><i className="bi bi-arrows-fullscreen" />{room.specs?.area || '28m²'}</span>
                        <span><i className="bi bi-people" />{room.specs?.guests || room.capacity || 2} khách</span>
                        <span><i className="bi bi-house-door" />{room.specs?.beds || `${room.bedCount || 1} giường`}</span>
                      </div>
                      <ul className="room-list-tags">
                        {(room.amenities || []).slice(0, 3).map((a, j) => <li key={j}>{a}</li>)}
                      </ul>
                      <button type="button" className="room-rating-link"
                        onClick={(e) => { e.stopPropagation(); setReviewsDrawer({ open: true, group: String(room.id) }); }}>
                        {(() => {
                          const rRevs = dbReviews.filter((rev) => String(rev.roomId) === String(room.id));
                          const rCount = rRevs.length;
                          const rScore = rCount > 0
                            ? (rRevs.reduce((s, x) => s + x.rating, 0) / rCount).toFixed(1)
                            : (room.rating ? (room.rating > 5 ? (room.rating / 2).toFixed(1) : Number(room.rating).toFixed(1)) : '5.0');
                          return (
                            <>
                              <i className="bi bi-star-fill" /> {rScore}
                              <i className="rating-sep" />
                              <span>{rCount} đánh giá</span>
                              <i className="bi bi-chevron-right rating-arrow" />
                            </>
                          );
                        })()}
                      </button>
                    </div>
                    <div className="room-list-action">
                      <div>
                        <div className="room-list-price-label">Giá mỗi đêm</div>
                        <div className="room-list-price">{fmtVND(Number(room.price || room.pricePerNight || 890000))}</div>
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
              <h3 className="detail-block-title">
                <i className="bi bi-star-fill star-gold" /> {homestayRating} · {homestayReviewCount} đánh giá về homestay
              </h3>
              <div className="rating-overview">
                <div className="rating-score">
                  <b>{homestayRating}</b>
                  <div className="rating-stars">
                    {[...Array(5)].map((_, i) => (
                      <i key={i} className={`bi bi-star-fill ${i < Math.round(Number(homestayRating)) ? 'star-gold' : ''}`} />
                    ))}
                  </div>
                  <span>{homestayReviewCount > 0 ? (Number(homestayRating) >= 4.5 ? 'Tuyệt vời' : 'Rất tốt') : 'Chưa có đánh giá'}</span>
                </div>
                <div className="rating-breakdown">
                  {starBreakdown.map((row) => (
                    <div key={row.label} className="rating-bar-row">
                      <span>{row.label}</span>
                      <div className="rating-bar"><span style={{ width: `${row.pct}%` }} /></div>
                      <b>{row.count}</b>
                    </div>
                  ))}
                </div>
              </div>
              {dbReviews.length > 0 ? (
                <div className="reviews-grid">
                  {dbReviews.slice(0, 4).map((r) => (
                    <ReviewCard key={r.id} review={r} showRoom clamp onPhotoClick={handlePhotoClick} />
                  ))}
                </div>
              ) : (
                <div className="rv-empty-state">
                  <i className="bi bi-chat-square-dots" />
                  <p>Homestay này hiện chưa có đánh giá nào từ khách hàng.</p>
                </div>
              )}
              {dbReviews.length > 0 && (
                <button type="button" className="yn-btn yn-btn--outline"
                  onClick={() => setReviewsDrawer({ open: true, group: 'all' })}>
                  <i className="bi bi-chat-square-text" /> Xem tất cả {homestayReviewCount} đánh giá
                </button>
              )}
            </div>
            <div className="detail-divider" />

            <div className="detail-block">
              <h3 className="detail-block-title">Vị trí homestay</h3>
              <p className="location-note">
                <i className="bi bi-geo-alt-fill" /> {homestayAddress} · {homestay?.distance || 'Cách trung tâm 1.5km, thuận tiện di chuyển tham quan'}
              </p>
              <div className="location-map-box">
                <img src={activeGallery[0] || "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1200&q=80"} alt={`Vị trí ${homestayName}`} />
                <div className="map-pin"><i className="bi bi-geo-alt-fill" /></div>
              </div>
            </div>
            <div className="detail-divider" />

            <div className="detail-block host-profile-block">
              <img className="host-profile-avatar"
                src={hostAvatar}
                alt={`Chủ nhà ${hostName}`} />
              <div className="host-profile-info">
                <h3>Chủ nhà: {hostName}</h3>
                <div className="host-profile-stats">
                  <span><b>{homestayReviewCount}</b> đánh giá</span>
                  <span><b>{homestayRating}</b> ★ điểm chủ nhà</span>
                  <span><b>{homestay?.yearsHosting || 3}</b> năm đón khách</span>
                </div>
                <p>{hostBio}</p>
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
              <div className="summary-rating"><i className="bi bi-star-fill" /> {homestayRating} · {homestayReviewCount} đánh giá</div>
              <button type="button" className="yn-btn yn-btn--primary yn-btn--lg yn-btn--block" onClick={scrollToRooms}>
                Xem các loại phòng
              </button>
              <p className="summary-note">
                <i className="bi bi-check2-circle" /> {rooms.length} loại phòng còn trống · Miễn phí hủy trong 48 giờ
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section className="similar-section">
        <div className="hd-container">
          <div className="similar-head">
            <div>
              <h2 className="similar-title">Homestay tương tự {homestay?.city ? `gần ${homestay.city}` : 'được yêu thích'}</h2>
              <p className="similar-sub">Cùng phong cách nghỉ dưỡng tiện nghi và không gian thiên nhiên trong lành.</p>
            </div>
          </div>
          <div className="similar-grid">
            {relatedHomestays.map((item, i) => (
              <article key={item.id || i} className="sim-card">
                <button type="button"
                  className={`sim-wish ${wishlist[item.name] ? 'active' : ''}`}
                  onClick={() => {
                    setWishlist((w) => ({ ...w, [item.name]: !w[item.name] }));
                    showToast(!wishlist[item.name] ? `Đã thêm "${item.name}" vào Wishlist!` : `Đã bỏ lưu "${item.name}" khỏi Wishlist.`);
                  }}
                  title="Lưu vào Wishlist">
                  <i className={`bi ${wishlist[item.name] ? 'bi-heart-fill' : 'bi-heart'}`} />
                </button>
                <div className="sim-media" style={{ cursor: 'pointer' }} onClick={() => navigate(`/homestay/${item.id}`)}>
                  <img src={item.img} alt={item.name} loading="lazy" />
                </div>
                <div className="sim-body">
                  <div className="sim-meta">
                    <span className="sim-loc"><i className="bi bi-geo-alt-fill" /> {item.location}</span>
                    <span className="sim-rate"><i className="bi bi-star-fill" /> {item.rating} <small>({item.reviews})</small></span>
                  </div>
                  <h3 className="sim-title">
                    <a href={`/homestay/${item.id}`} onClick={(e) => { e.preventDefault(); navigate(`/homestay/${item.id}`); }}>
                      {item.name}
                    </a>
                  </h3>
                  <p className="sim-specs">{item.specs}</p>
                  <ul className="sim-tags">
                    {item.amenities.split(' · ').map((a, j) => <li key={j}>{a}</li>)}
                  </ul>
                  <div className="sim-foot">
                    <div className="sim-price">
                      <small>Giá từ</small><b>{item.price}</b><small>/ đêm</small>
                    </div>
                    <button type="button" className="yn-btn yn-btn--primary yn-btn--sm" onClick={() => navigate(`/homestay/${item.id}`)}>
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
          <div className="mobile-booking-rating"><i className="bi bi-star-fill" /> {homestayRating} ({homestayReviewCount})</div>
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

      {activeRoomIdx !== null && rooms[activeRoomIdx] && (
        <RoomModal
          room={rooms[activeRoomIdx]}
          homestay={homestay}
          allHomestayReviews={dbReviews}
          onClose={() => setActiveRoomIdx(null)}
          onOpenReviews={(group) => { setActiveRoomIdx(null); setReviewsDrawer({ open: true, group }); }}
          showToast={showToast}
        />
      )}

      <ReviewsDrawer
        open={reviewsDrawer.open}
        initialGroup={reviewsDrawer.group}
        reviews={dbReviews}
        rooms={rooms}
        homestayRating={homestayRating}
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
