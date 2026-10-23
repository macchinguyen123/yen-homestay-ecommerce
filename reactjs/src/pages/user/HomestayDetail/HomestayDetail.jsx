import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams, useLocation, Link } from 'react-router-dom';
import './HomestayDetail.css';
import { authService } from '../../../services/authService';
import { viewedHistoryService } from '../../../services/viewedHistoryService';
import { roomService } from '../../../services/roomService';
import { homestayService } from '../../../services/homestayService';
import { reviewService } from '../../../services/reviewService';
import { ownerService } from '../../../services/ownerService';
import { chatService } from '../../../services/chatService';
import { bookingService } from '../../../services/bookingService';
import { SAMPLE_HOMESTAYS } from '../../../data/sampleHomestays';
import {
  roomsData, galleryImages, amenitiesData, AMENITY_GROUPS,
  experiencesData, EXPERIENCE_CATEGORIES, EXPERIENCE_COSTS, EXPERIENCE_PREVIEW_IDS,
  EXPERIENCE_FALLBACK_IMG, similarHomestaysData,
  avatarColors, unsplashUrl, fmtVND, SERVICE_FEE_RATE,
} from './homestayDetailData';
import { GalleryModal } from '@/components/ui/interactive-bento-gallery';
import PolaroidLineCarousel from '@/components/ui/polaroid-line-carousel';
import ErrorBoundary from '@/components/ErrorBoundary';

// ─── Helpers ──────────────────────────────────────────────────
function formatAmenities(raw) {
  if (!raw) return 'Tiện nghi tiêu chuẩn';
  if (Array.isArray(raw)) {
    return raw.map(s => String(s).trim()).filter(Boolean).join(' · ');
  }
  let str = String(raw).trim();
  str = str.replace(/^[{\[\s"]+/, '').replace(/[}\]\s"]+$/, '');
  str = str.replace(/"\s*,\s*"/g, ' · ').replace(/"\s*/g, '').replace(/\s*"/g, '');
  str = str.replace(/[{}[\]"]/g, '');
  return str || 'Tiện nghi tiêu chuẩn';
}

function toInputDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function reviewAvatarStyle(name) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) % 997;
  return { background: avatarColors[hash % avatarColors.length] };
}
function experiencePriceLabel(x) {
  const p = Number(x?.price || 0);
  return p > 0 ? `${fmtVND(p)} ${x?.unit || ''}` : 'Miễn phí';
}
function matchExperience(x, category, cost) {
  const p = Number(x?.price || 0);
  return (category === 'all' || x.category === category) &&
    (cost === 'all' || (cost === 'free' ? p === 0 : p > 0));
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

/** Review card hiển thị người dùng và đánh giá thật từ Database cho Homestay */
function ReviewCard({ review, showRoom = false, clamp = false, onPhotoClick }) {
  const name = review.touristName || review.name || 'Khách du lịch';
  const initial = name.trim().split(' ').pop().charAt(0).toUpperCase();
  const dateStr = review.formattedDate || review.date || 'Gần đây';
  const ratingVal = review.rating || review.stars || 5;
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
      {/* Nút đóng cố định ở góc trên bên phải màn hình */}
      <button
        type="button"
        className="lightbox-close-btn"
        onClick={onClose}
        title="Đóng (Esc)"
        aria-label="Đóng"
        style={{
          position: 'fixed',
          top: '24px',
          right: '28px',
          zIndex: 9999
        }}
      >
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

// Dữ liệu nhiệm vụ mặc định gắn kết trải nghiệm văn hóa & bảo vệ môi trường
const DEFAULT_GUEST_MISSIONS = [
  {
    id: 1,
    title: 'Check-in & Đánh giá trải nghiệm',
    description: 'Chụp lại khoảnh khắc đẹp tại homestay và viết đánh giá chân thực để nhận voucher ưu đãi cho chuyến đi tiếp theo.',
    rewardNote: 'Voucher giảm 10% cho kỳ nghỉ sau',
    icon: 'bi-camera-fill',
    status: 'ACTIVE'
  },
  {
    id: 2,
    title: 'Bảo vệ môi trường & Tiết kiệm năng lượng',
    description: 'Tắt điều hòa và các thiết bị điện khi ra khỏi phòng, cùng chung tay giữ gìn cảnh quan thiên nhiên trong lành.',
    rewardNote: 'Tặng set trà thảo mộc / trái cây vườn chào mừng',
    icon: 'bi-tree-fill',
    status: 'ACTIVE'
  }
];

/** Room Modal */
function RoomModal({ room, homestay, homestayRating = '5.0', homestayReviewCount = 0, onClose, onScrollToReviews, showToast }) {
  const [galleryIdx, setGalleryIdx] = useState(0);
  const scrollRef = useRef(null);

  const roomFallbackPhotos = [
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
  ];

  const gallery = useMemo(() => {
    const list = [];
    if (room.primaryImage) list.push(room.primaryImage);
    if (room.thumb) list.push(room.thumb);
    if (Array.isArray(room.gallery)) list.push(...room.gallery);
    if (Array.isArray(room.images)) list.push(...room.images);

    const unique = Array.from(new Set(list.filter((x) => typeof x === 'string' && x.trim().length > 0)));
    if (unique.length > 0) return unique;

    // Fallback chỉ khi phòng hoàn toàn không có bất kỳ ảnh nào
    if (room.image) return [room.image];
    if (homestay?.primaryImage) return [homestay.primaryImage];
    return [roomFallbackPhotos[0]];
  }, [room, homestay]);

  const roomPrice = Number(room.price || room.pricePerNight || 890000);
  const cleaningFee = Number(room.cleaningFee || 100000);
  const maxGuests = room.specs?.guests || room.capacity || 2;
  const areaDesc = room.specs?.area || '28m²';
  const bedsDesc = room.specs?.beds || `${room.bedCount || 1} giường`;
  const amenitiesList = room.amenities || ['Wifi tốc độ cao', 'Phòng tắm riêng', 'Máy điều hòa', 'Bình nước nóng', 'Tủ lạnh mini', 'Máy sấy tóc'];
  const roomName = room.name || room.roomName || 'Chi tiết phòng nghỉ';
  const availableCount = room.availableCount || 2;

  const polaroidSlides = useMemo(() => {
    const titles = [
      'Không gian phòng ngủ',
      'Góc thư giãn & ngắm cảnh',
      'Nội thất & tiện nghi',
      'Cửa sổ đón nắng mai',
      'Phòng tắm sạch sẽ, tiện nghi',
      'Góc check-in ấm cúng',
      'Ban công thoáng đãng',
      'Chi tiết decor mộc mạc',
    ];
    return (gallery || []).map((url, idx) => ({
      image: url,
      title: titles[idx % titles.length],
      caption: `${roomName} — Ảnh ${idx + 1}/${gallery.length}`,
      alt: `${roomName} - Ảnh số ${idx + 1}`,
    }));
  }, [gallery, roomName]);

  const today = new Date();
  const defaultCheckin = new Date(today); defaultCheckin.setDate(today.getDate() + 7);
  const defaultCheckout = new Date(defaultCheckin); defaultCheckout.setDate(defaultCheckin.getDate() + 2);

  const [checkin, setCheckin] = useState(toInputDate(defaultCheckin));
  const [checkout, setCheckout] = useState(toInputDate(defaultCheckout));
  const [guests, setGuests] = useState(Math.min(2, maxGuests));
  const [warning, setWarning] = useState('');
  const [busyRanges, setBusyRanges] = useState([]);
  const [loadingBusy, setLoadingBusy] = useState(false);
  const [dateConflictMsg, setDateConflictMsg] = useState('');
  const [missions, setMissions] = useState(() => {
    if (Array.isArray(room?.tasks) && room.tasks.length > 0) return room.tasks;
    if (Array.isArray(homestay?.tasks) && homestay.tasks.length > 0) return homestay.tasks;
    return DEFAULT_GUEST_MISSIONS;
  });

  // Tải danh sách nhiệm vụ từ CSDL thật (Neon PostgreSQL) nếu có
  useEffect(() => {
    if (Array.isArray(room?.tasks) && room.tasks.length > 0) {
      setMissions(room.tasks);
      return;
    }
    if (Array.isArray(homestay?.tasks) && homestay.tasks.length > 0) {
      setMissions(homestay.tasks);
      return;
    }

    const targetHsId = homestay?.id || room?.homestayId;
    if (targetHsId) {
      let isMounted = true;
      homestayService.getHomestayMissions(targetHsId)
        .then((data) => {
          if (isMounted && Array.isArray(data) && data.length > 0) {
            setMissions(data);
          }
        })
        .catch(() => {});
      return () => { isMounted = false; };
    }
  }, [room, homestay]);

  // Tải danh sách các ngày đã kín lịch của phòng từ CSDL thật
  useEffect(() => {
    if (!room?.id) return;
    let isMounted = true;
    setLoadingBusy(true);
    bookingService.getRoomBusyDates(room.id)
      .then((ranges) => {
        if (isMounted) {
          setBusyRanges(Array.isArray(ranges) ? ranges : []);
          setLoadingBusy(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoadingBusy(false);
      });
    return () => { isMounted = false; };
  }, [room?.id]);

  // Kiểm tra chống trùng lịch đặt phòng (Double-Booking Check)
  useEffect(() => {
    if (!checkin || !checkout || !busyRanges || busyRanges.length === 0) {
      setDateConflictMsg('');
      return;
    }
    const cin = new Date(checkin + 'T00:00:00');
    const cout = new Date(checkout + 'T00:00:00');
    if (cin >= cout) {
      setDateConflictMsg('');
      return;
    }

    const conflict = busyRanges.find((r) => {
      if (!r.checkInDate || !r.checkOutDate) return false;
      const bCin = new Date(r.checkInDate + 'T00:00:00');
      const bCout = new Date(r.checkOutDate + 'T00:00:00');
      // Quy tắc giao thoa khách sạn: cin < bCout VÀ cout > bCin
      return cin < bCout && cout > bCin;
    });

    if (conflict) {
      const padZero = (n) => String(n).padStart(2, '0');
      const fmt = (dStr) => {
        const d = new Date(dStr + 'T00:00:00');
        return isNaN(d.getTime()) ? dStr : `${padZero(d.getDate())}/${padZero(d.getMonth() + 1)}/${d.getFullYear()}`;
      };
      setDateConflictMsg(`Phòng này đã có khách đặt từ ${fmt(conflict.checkInDate)} đến ${fmt(conflict.checkOutDate)}. Vui lòng chọn khoảng ngày khác!`);
    } else {
      setDateConflictMsg('');
    }
  }, [checkin, checkout, busyRanges]);

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
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const navigate = useNavigate();
  const handleBook = () => {
    if (!nights || nights <= 0) { 
      showToast('Vui lòng chọn lại ngày nhận - trả phòng hợp lệ!'); 
      return; 
    }
    if (dateConflictMsg) {
      showToast(dateConflictMsg);
      return;
    }
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


  return (
    <div className="room-modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="room-modal-container" role="dialog" aria-modal="true">
        {/* Nút đóng chuẩn đẹp ở góc trên bên phải */}
        <button
          type="button"
          className="room-modal-close-btn"
          onClick={onClose}
          title="Đóng cửa sổ"
          aria-label="Đóng cửa sổ"
        >
          <i className="bi bi-x-lg" />
        </button>

        <div className="room-modal-scroll" ref={scrollRef}>
          {/* ══ BỘ SƯU TẬP ẢNH DẠNG POLAROID LINE CAROUSEL (DÂY TREO ẢNH MỘC MẠC) ══ */}
          <div className="room-modal-gallery-box room-modal-gallery-box--polaroid">
            {/* Tình trạng phòng nổi trên góc trái ảnh (đã bỏ chữ SINGLE theo yêu cầu) */}
            <div className="room-gallery-top-tags">
              <span className="room-gallery-tag-avail">
                <span className="room-avail-pulse-dot" /> Còn {availableCount} phòng trống
              </span>
            </div>

            <ErrorBoundary>
              <PolaroidLineCarousel
                slides={polaroidSlides}
                height="415px"
                cardWidth={320}
                sag={14}
                swing={0.2}
                autoplay={4500}
                background="linear-gradient(180deg, #fdfbf7 0%, #f4ede3 100%)"
                ink="#1e293b"
                string="#9d8157"
                className="room-polaroid-carousel"
                ariaLabel={`Bộ sưu tập ảnh phòng ${roomName}`}
              />
            </ErrorBoundary>
          </div>

          {/* ══ NỘI DUNG CHI TIẾT PHÒNG ══ */}
          <div className="room-modal-body">
            {/* Tiêu đề & Giá phòng */}
            <div className="room-modal-head-card">
              <div className="room-modal-head-left">
                <span className="room-modal-subtitle-tag">
                  <i className="bi bi-geo-alt-fill text-success me-1" />
                  {homestay?.name || 'YÊN Homestay'}
                </span>
                <h2 className="room-modal-title">{roomName}</h2>
                <div className="room-modal-meta-row">
                  <span className="room-meta-rating-badge">
                    <i className="bi bi-star-fill text-warning me-1" />
                    <span className="room-rating-score">{homestayRating || '5.0'}</span>
                    <span className="room-rating-count">({homestayReviewCount || 0} đánh giá)</span>
                  </span>
                  <span className="room-meta-sep">•</span>
                  <span className="room-meta-avail">
                    <i className="bi bi-check-circle-fill text-success me-1" />
                    Giữ phòng tức thì · Hủy miễn phí 48h
                  </span>
                </div>
              </div>

              <div className="room-modal-price-box">
                <span className="room-price-sublabel">Giá niêm yết mỗi đêm</span>
                <div className="room-price-val-row">
                  <b className="room-price-num">{fmtVND(roomPrice)}</b>
                  <span className="room-price-unit">/ đêm</span>
                </div>
                <span className="room-price-note">Đã gồm thuế &amp; phí dịch vụ</span>
              </div>
            </div>

            {/* 4 THẺ THÔNG SỐ PHÒNG (SPECS CARDS) */}
            <div className="room-specs-cards-grid">
              <div className="room-spec-card">
                <div className="room-spec-icon-wrap"><i className="bi bi-arrows-fullscreen" /></div>
                <div className="room-spec-info">
                  <span className="room-spec-lbl">Diện tích</span>
                  <b className="room-spec-val">{areaDesc}</b>
                </div>
              </div>
              <div className="room-spec-card">
                <div className="room-spec-icon-wrap"><i className="bi bi-people-fill" /></div>
                <div className="room-spec-info">
                  <span className="room-spec-lbl">Sức chứa tối đa</span>
                  <b className="room-spec-val">{maxGuests} người lớn</b>
                </div>
              </div>
              <div className="room-spec-card">
                <div className="room-spec-icon-wrap"><i className="bi bi-lamp-fill" /></div>
                <div className="room-spec-info">
                  <span className="room-spec-lbl">Bố trí giường</span>
                  <b className="room-spec-val">{bedsDesc}</b>
                </div>
              </div>
              <div className="room-spec-card">
                <div className="room-spec-icon-wrap"><i className="bi bi-eye-fill" /></div>
                <div className="room-spec-info">
                  <span className="room-spec-lbl">Hướng tầm nhìn</span>
                  <b className="room-spec-val">View vườn &amp; đồi sương</b>
                </div>
              </div>
            </div>

            {/* Mô tả không gian */}
            <div className="room-modal-section">
              <h4 className="room-modal-sec-title">
                <i className="bi bi-info-circle me-1" /> Không gian phòng
              </h4>
              <p className="room-modal-desc">
                {room.description || `Không gian ${roomName} được chăm chút mộc mạc, chan hòa ánh sáng tự nhiên với sàn gỗ ấm áp, giường nệm cao cấp và cửa sổ lớn mở ra khung cảnh thiên nhiên trong lành.`}
              </p>
            </div>

            {/* Tiện nghi phòng */}
            <div className="room-modal-section">
              <h4 className="room-modal-sec-title">
                <i className="bi bi-stars me-1" /> Tiện nghi được trang bị
              </h4>
              <div className="room-modal-amenities-pills">
                {amenitiesList.map((a, i) => (
                  <div key={i} className="room-amenity-pill-item">
                    <i className="bi bi-check2-circle" />
                    <span>{a}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ══ NHIỆM VỤ NHẬN THƯỞNG KHI LƯU TRÚ (GUEST MISSIONS - TỪ CSDL) ══ */}
            {missions && missions.length > 0 && (
              <div className="room-missions-modern-box">
                <div className="missions-modern-header">
                  <div className="missions-header-left">
                    <span className="missions-pill-tag">
                      <i className="bi bi-gift-fill me-1" /> Nhiệm vụ từ chủ phòng
                    </span>
                    <h4 className="missions-modern-title">Hoạt động trải nghiệm &amp; Nhận thưởng</h4>
                  </div>
                  <span className="missions-count-badge">
                    <i className="bi bi-stars text-warning me-1" /> {missions.length} nhiệm vụ
                  </span>
                </div>
                <p className="missions-modern-subtitle">
                  Hoàn thành các hoạt động do chủ homestay thiết kế để nhận quà tặng đặc sản và voucher độc quyền khi lưu trú!
                </p>

                <div className="missions-cards-grid">
                  {missions.map((m, idx) => (
                    <div key={m.id || idx} className="mission-item-card">
                      <div className="mission-card-top">
                        <div className="mission-icon-box">
                          <i className={`bi ${m.icon || (idx === 0 ? 'bi-camera-fill' : 'bi-tree-fill')}`} />
                        </div>
                        <div className="mission-title-wrap">
                          <h5 className="mission-name">{m.title}</h5>
                          <span className="mission-active-badge">
                            <span className="active-dot" /> Đang mở
                          </span>
                        </div>
                      </div>
                      {m.description && <p className="mission-desc-text">{m.description}</p>}
                      {m.rewardNote && (
                        <div className="mission-reward-callout">
                          <i className="bi bi-gift-fill reward-icon" />
                          <div className="reward-content">
                            <span className="reward-label">Phần thưởng:</span>
                            <strong className="reward-value">{m.rewardNote}</strong>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Khối chọn ngày & số khách */}
            <div className="room-booking-widget-box">
              <h4 className="room-modal-sec-title">
                <i className="bi bi-calendar3 me-1" /> Chọn thời gian lưu trú &amp; số khách
              </h4>
              <div className="room-booking-form-grid">
                <div className={`room-booking-field-modern ${dateConflictMsg ? 'has-conflict' : ''}`}>
                  <label htmlFor="roomCheckin"><i className="bi bi-calendar-check text-success me-1" /> Ngày nhận phòng</label>
                  <input type="date" id="roomCheckin" value={checkin} min={toInputDate(today)}
                    onChange={(e) => setCheckin(e.target.value)} />
                </div>
                <div className={`room-booking-field-modern ${dateConflictMsg ? 'has-conflict' : ''}`}>
                  <label htmlFor="roomCheckout"><i className="bi bi-calendar-x text-success me-1" /> Ngày trả phòng</label>
                  <input type="date" id="roomCheckout" value={checkout} min={checkin || toInputDate(today)}
                    onChange={(e) => setCheckout(e.target.value)} />
                </div>
                <div className="room-booking-field-modern">
                  <label htmlFor="roomGuests"><i className="bi bi-person-check text-success me-1" /> Số khách</label>
                  <select id="roomGuests" value={guests} onChange={(e) => setGuests(Number(e.target.value))}>
                    {Array.from({ length: maxGuests }, (_, i) => i + 1).map((g) => (
                      <option key={g} value={g}>{g} khách</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Danh sách ngày phòng đã kín lịch thực tế */}
              {busyRanges.length > 0 && (
                <div className="room-busy-dates-notice">
                  <div className="busy-notice-header">
                    <i className="bi bi-calendar-x-fill me-1" />
                    <span>Lịch phòng đã kín ({busyRanges.length} đợt đặt):</span>
                  </div>
                  <div className="busy-tags-list">
                    {busyRanges.map((r, i) => (
                      <span key={i} className="busy-date-tag">
                        🔒 {r.displayRange || `${r.checkInDate} → ${r.checkOutDate}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Thông báo cảnh báo trùng lịch nổi bật */}
              {dateConflictMsg && (
                <div className="room-booking-conflict-alert">
                  <i className="bi bi-exclamation-octagon-fill" />
                  <div>
                    <strong>Phòng không khả dụng: </strong>
                    <span>{dateConflictMsg}</span>
                  </div>
                </div>
              )}

              {warning && !dateConflictMsg && <p className="room-booking-warning"><i className="bi bi-exclamation-triangle-fill me-1" />{warning}</p>}

              {/* Bảng chi tiết giá rõ ràng */}
              <div className="room-price-breakdown-card">
                <div className="breakdown-card-head">
                  <span>Chi tiết bảng tính tiền ({nights} đêm)</span>
                  <span className="breakdown-guarantee-tag"><i className="bi bi-shield-check" /> Cam kết giá tốt nhất</span>
                </div>
                <div className="breakdown-row">
                  <span>Giá phòng ({fmtVND(roomPrice)} × {nights} đêm)</span>
                  <b>{fmtVND(subtotal)}</b>
                </div>
                <div className="breakdown-row">
                  <span>Phí dọn dẹp &amp; chuẩn bị phòng</span>
                  <b>{fmtVND(cleaningFee)}</b>
                </div>
                <div className="breakdown-row">
                  <span>Phí nền tảng YÊN (bảo vệ thanh toán)</span>
                  <b>{fmtVND(serviceFee)}</b>
                </div>
                <div className="breakdown-divider" />
                <div className="breakdown-row breakdown-total-row">
                  <span>Tổng thanh toán dự tính:</span>
                  <b className="breakdown-total-price">{fmtVND(total)}</b>
                </div>
              </div>
            </div>

            {/* Đánh giá chung */}
            <div className="room-modal-reviews-footer-block">
              <div className="room-modal-subhead">
                <h4 className="room-modal-sec-title" style={{ margin: 0 }}>
                  <i className="bi bi-chat-quote-fill me-1" /> Đánh giá thực tế từ khách du lịch
                </h4>
                <span className="room-modal-rating-badge">
                  <i className="bi bi-star-fill text-warning me-1" /> {homestayRating} · {homestayReviewCount} đánh giá
                </span>
              </div>
              <p className="room-reviews-note">
                100% đánh giá được ghi nhận từ những du khách đã thanh toán và hoàn tất kỳ nghỉ thực tế tại homestay này.
              </p>
              <button
                type="button"
                className="yn-btn yn-btn--outline yn-btn--block"
                onClick={() => { onClose(); if (onScrollToReviews) onScrollToReviews(); }}
              >
                <i className="bi bi-chat-square-text me-1" /> Xem tất cả {homestayReviewCount} nhận xét chi tiết
              </button>
            </div>
          </div>
        </div>

        {/* ══ THANH ĐẶT PHÒNG DƯỚI CÙNG (STICKY FOOTER) ══ */}
        <div className="room-modal-footer">
          <div className="room-modal-footer-price-wrap">
            <span className="room-footer-label">Tổng cộng dự kiến:</span>
            <div className="room-footer-amount-row">
              <b className="room-footer-total">{fmtVND(total)}</b>
              <span className="room-footer-nights">/ {nights} đêm · {guests} khách</span>
            </div>
          </div>
          <button 
            type="button" 
            className="yn-btn yn-btn--primary yn-btn--lg yn-btn-modal-book" 
            onClick={handleBook}
            disabled={!!dateConflictMsg || nights <= 0}
            style={dateConflictMsg ? { opacity: 0.65, cursor: 'not-allowed', background: '#dc2626', borderColor: '#b91c1c' } : {}}
          >
            <i className={`bi ${dateConflictMsg ? 'bi-shield-slash' : 'bi-calendar-check-fill'} me-2`} /> 
            {dateConflictMsg ? 'Trùng lịch - Vui lòng chọn ngày khác' : 'Đặt phòng ngay'}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Reviews Drawer */
function ReviewsDrawer({ open, onClose, reviews = [], homestayRating = '5.0', onPhotoClick }) {
  const REVIEW_PAGE_SIZE = 6;
  const [stars, setStars] = useState('all');
  const [sort, setSort] = useState('newest');
  const [photo, setPhoto] = useState(false);
  const [shown, setShown] = useState(REVIEW_PAGE_SIZE);

  useEffect(() => {
    if (open) { setStars('all'); setSort('newest'); setPhoto(false); setShown(REVIEW_PAGE_SIZE); }
  }, [open]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape' && open) onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Lọc đánh giá thực tế của Homestay
  const filtered = useMemo(() => {
    let res = (reviews || []).filter((r) => {
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
  }, [reviews, stars, photo, sort]);

  const visible = filtered.slice(0, shown);
  const photoCount = reviews.filter((r) => (r.images && r.images.length > 0) || (r.photos && r.photos.length > 0)).length;

  return (
    <>
      <div className={`rv-overlay ${open ? 'active' : ''}`} onClick={onClose} />
      <aside className={`rv-drawer ${open ? 'active' : ''}`} role="dialog" aria-modal="true"
        aria-hidden={!open} id="rvDrawer">
        <div className="rv-head">
          <h3>Đánh giá về homestay ({reviews.length})</h3>
          <button type="button" className="yn-btn yn-btn--ghost yn-btn--icon" onClick={onClose} title="Đóng">
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <div className="rv-summary">
          <div className="rv-score">
            <i className="bi bi-star-fill" /> <b>{homestayRating}</b>
          </div>
          <div className="rv-summary-text">
            <strong>{reviews.length} đánh giá</strong>
            <span>Đánh giá thực tế từ khách du lịch</span>
          </div>
        </div>

        <div className="rv-filters">
          <div>
            <span className="rv-filter-label">Lọc theo sao</span>
            <div className="rv-chip-row">
              {['all', '5', '4', '3', '2', '1'].map((s) => {
                const count = s === 'all'
                  ? reviews.length
                  : reviews.filter((r) => Number(r.rating) === Number(s)).length;
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
                onClick={() => { setStars('all'); setPhoto(false); setShown(REVIEW_PAGE_SIZE); }}>
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
function ExperiencesDrawer({ open, onClose, onScrollToRooms, experiences, loadingExperiences }) {
  // Dùng experiences từ DB (nếu có), fallback về experiencesData static
  const activeExperiences = (experiences && experiences.length > 0) ? experiences : experiencesData;
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

  const result = activeExperiences.filter((x) => matchExperience(x, category, cost));
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
            <strong>{loadingExperiences ? 'Đang tải...' : `${result.length} trải nghiệm`}</strong>
            <span>{(cat ? cat.label : 'Tất cả nhóm trải nghiệm') + (cost === 'all' ? '' : ` · ${costItem.label}`)}</span>
          </div>
        </div>
        <div className="rv-filters">
          <div>
            <span className="rv-filter-label">Nhóm trải nghiệm</span>
            <div className="rv-chip-row">
              {[{ id: 'all', label: 'Tất cả' }, ...EXPERIENCE_CATEGORIES].map((c) => {
                const count = activeExperiences.filter((x) => matchExperience(x, c.id, cost)).length;
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
                const count = activeExperiences.filter((x) => matchExperience(x, category, c.id)).length;
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
            {loadingExperiences
              ? 'Đang tải dữ liệu trải nghiệm từ CSDL...'
              : result.length
              ? `Hiển thị ${result.length} / ${activeExperiences.length} trải nghiệm`
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
                      src={x.img && (x.img.startsWith('http') || x.img.startsWith('/')) ? x.img : unsplashUrl(x.img || EXPERIENCE_FALLBACK_IMG, 1000)} alt={x.title} loading="lazy"
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
                      {(x.includes || []).map((t, i) => (
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
  const [bentoModalOpen, setBentoModalOpen] = useState(false);
  const [selectedBentoItem, setSelectedBentoItem] = useState(null);
  const [activeRoomIdx, setActiveRoomIdx] = useState(null);
  const [reviewsDrawer, setReviewsDrawer] = useState({ open: false, group: 'all' });
  const [expDrawer, setExpDrawer] = useState(false);
  const [amDrawer, setAmDrawer] = useState(false);

  const [saved, setSaved] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [wishlist, setWishlist] = useState({});
  const [toast, setToast] = useState({ show: false, msg: '' });

  const location = useLocation();

  // Khởi tạo ngay từ state truyền sang hoặc cache để hiển thị tức thì (0ms, không chờ loading)
  const initialHomestay = useMemo(() => {
    if (location.state?.homestay) return location.state.homestay;
    try {
      const raw = sessionStorage.getItem(`yen_cache_homestay_${id}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.data) return parsed.data;
      }
    } catch (e) {}
    if (id) {
      const s = SAMPLE_HOMESTAYS.find(
        (h) => String(h.id) === String(id) || h.name.toLowerCase() === decodeURIComponent(id).toLowerCase()
      );
      if (s) return s;
    }
    return null;
  }, [id, location.state]);

  // State thông tin homestay và danh sách phòng từ Database
  const [homestay, setHomestay] = useState(initialHomestay);
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState(() => {
    if (initialHomestay?.rooms && initialHomestay.rooms.length > 0) return initialHomestay.rooms;
    return roomsData;
  });

  // Đánh giá thực tế lấy trực tiếp từ bảng reviews & users trong CSDL
  const [dbReviews, setDbReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [loadingReviews, setLoadingReviews] = useState(true);

  // Trải nghiệm (dịch vụ) của homestay từ CSDL
  const [dbExperiences, setDbExperiences] = useState([]);
  const [loadingExperiences, setLoadingExperiences] = useState(false);
  const [mainMissions, setMainMissions] = useState(DEFAULT_GUEST_MISSIONS);

  // Danh sách toàn bộ homestay thực tế từ CSDL để gợi ý homestay tương tự phong phú
  const [allHomestays, setAllHomestays] = useState([]);

  // Bộ lọc và phân trang đánh giá trực tiếp trên trang Homestay
  const [pageReviewStars, setPageReviewStars] = useState('all');
  const [pageReviewPhotoOnly, setPageReviewPhotoOnly] = useState(false);
  const [pageReviewSort, setPageReviewSort] = useState('newest');
  const [pageReviewsShown, setPageReviewsShown] = useState(6);

  const roomsSectionRef = useRef(null);
  const reviewsSectionRef = useRef(null);
  const locationSectionRef = useRef(null);
  const toastTimer = useRef(null);
  const similarSliderRef = useRef(null);

  const scrollSlider = (ref, direction) => {
    if (ref && ref.current) {
      const containerWidth = ref.current.clientWidth;
      const scrollStep = containerWidth > 768 ? Math.floor(containerWidth * 0.75) : 300;
      ref.current.scrollBy({
        left: direction * scrollStep,
        behavior: 'smooth'
      });
    }
  };

  // Cuộn ngay lập tức lên đầu trang khi mở chi tiết homestay
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [id]);

  // Tải dữ liệu siêu tốc từ CSDL kèm bộ nhớ đệm
  useEffect(() => {
    let isMounted = true;
    const homestayIdNum = id && !isNaN(id) ? Number(id) : null;

    setLoading(true);

    const loadData = async () => {
      try {
        // Tải Homestay từ CSDL (tốc độ cao có cache)
        let activeH = null;
        if (homestayIdNum) {
          activeH = await homestayService.getHomestayById(homestayIdNum);
        }

        // Fallback SAMPLE_HOMESTAYS nếu DB chưa có ID này
        if (!activeH && id) {
          activeH = SAMPLE_HOMESTAYS.find(
            (h) => String(h.id) === String(id) || h.name.toLowerCase() === decodeURIComponent(id).toLowerCase()
          );
        }

        if (!activeH) {
          activeH = SAMPLE_HOMESTAYS[0];
        }

        if (isMounted && activeH) {
          setHomestay(activeH);
          if (activeH.rooms && activeH.rooms.length > 0) {
            setRooms(activeH.rooms);
          }
          // Ngay khi có homestay & phòng, tắt loading để hiển thị trang tức thì
          setLoading(false);
        }

        // Nạp song song Reviews, Stats, Experiences và toàn bộ danh sách Homestay trong nền
        const targetHsId = homestayIdNum || (activeH?.id && !isNaN(activeH.id) ? Number(activeH.id) : 1);
        if (targetHsId) {
          setLoadingExperiences(true);
          homestayService.getAllHomestays().then((list) => {
            if (isMounted && Array.isArray(list) && list.length > 0) {
              setAllHomestays(list);
            }
          }).catch(() => {});

          Promise.all([
            reviewService.getReviewsByHomestayId(targetHsId),
            reviewService.getReviewStats(targetHsId),
            ownerService.getServices(targetHsId).catch(() => null),
            homestayService.getHomestayMissions(targetHsId).catch(() => []),
          ]).then(([revs, stats, services, missionsList]) => {
            if (isMounted) {
              if (revs && revs.length > 0) setDbReviews(revs);
              if (stats) setReviewStats(stats);
              if (Array.isArray(missionsList) && missionsList.length > 0) setMainMissions(missionsList);
              if (Array.isArray(services) && services.length > 0) {
                // Chuyển dịch vụ sang định dạng trải nghiệm hiển thị
                const expMapped = services.map((svc) => {
                  const cat = (svc.category || '').toLowerCase();
                  const expCategory = cat.includes('activity') || cat.includes('outdoor') ? 'thiennhien' :
                    cat.includes('food') || cat.includes('am') ? 'amthuc' :
                    cat.includes('farm') || cat.includes('nong') ? 'nongtrai' : 'thugian';
                  return {
                    id: String(svc.id || svc.name),
                    category: expCategory,
                    title: svc.name || 'Dịch vụ trải nghiệm',
                    summary: svc.description || '',
                    img: svc.image || EXPERIENCE_FALLBACK_IMG,
                    duration: '',
                    time: 'Liên hệ chủ nhà',
                    people: 'Mọi lứa tuổi',
                    price: Number(svc.price || 0),
                    unit: svc.unit || (Number(svc.price) > 0 ? '/ khách' : ''),
                    includes: [],
                    note: '',
                    booking: 'Liên hệ chủ nhà',
                  };
                });
                setDbExperiences(expMapped);
              }
              setLoadingExperiences(false);
              setLoadingReviews(false);
            }
          }).catch(err => {
            console.warn('Lỗi tải đánh giá phụ hoặc trải nghiệm:', err);
            if (isMounted) {
              setLoadingExperiences(false);
              setLoadingReviews(false);
            }
          });
        }
      } catch (err) {
        console.warn('Lỗi khi tải dữ liệu homestay:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();
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
  const scrollToLocation = () => {
    locationSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const navigate = useNavigate();

  const handleChatOwner = async () => {
    const user = authService.getCurrentUser();
    if (!user) { navigate('/login'); return; }
    const homestayId = Number(homestay?.id || id);
    if (!homestayId) return;
    try {
      const conversation = await chatService.open(homestayId);
      navigate('/messages', { state: { conversation } });
    } catch (e) {
      if (e.message?.includes('chủ') || e.message?.includes('bản thân')) {
        showToast('Bạn chính là chủ homestay bạn không thể chat với bản thân');
      } else {
        showToast(e.message || 'Không thể mở cuộc trò chuyện.');
      }
    }
  };

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

  // Danh sách đánh giá lọc và sắp xếp trực tiếp trên trang Homestay
  const filteredPageReviews = useMemo(() => {
    let list = [...(dbReviews || [])];
    if (pageReviewStars !== 'all') {
      list = list.filter((r) => Number(r.rating) === Number(pageReviewStars));
    }
    if (pageReviewPhotoOnly) {
      list = list.filter((r) => (r.images && r.images.length > 0) || (r.photos && r.photos.length > 0));
    }
    if (pageReviewSort === 'highest') {
      list.sort((a, b) => b.rating - a.rating || new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (pageReviewSort === 'lowest') {
      list.sort((a, b) => a.rating - b.rating || new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else {
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }
    return list;
  }, [dbReviews, pageReviewStars, pageReviewPhotoOnly, pageReviewSort]);

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
  // Preview trải nghiệm: ưu tiên từ CSDL, fallback về static data
  const expPreview = dbExperiences.length > 0
    ? dbExperiences.slice(0, 4)
    : EXPERIENCE_PREVIEW_IDS.map((eid) => experiencesData.find((x) => x.id === eid)).filter(Boolean);

  const relatedHomestays = useMemo(() => {
    const sourcePool = allHomestays && allHomestays.length > 0 ? allHomestays : SAMPLE_HOMESTAYS;
    const currentId = String(homestay?.id || id || '');
    const currentName = (homestay?.name || '').trim().toLowerCase();
    const currentCity = (homestay?.city || homestay?.location || '').trim().toLowerCase();
    const currentCategoryId = homestay?.categoryId || homestay?.category?.id;
    const currentPrice = Number(homestay?.price || homestay?.basePrice || minPrice || 1000000);

    const others = sourcePool.filter((h) => {
      const hId = String(h.id);
      const hName = (h.name || '').trim().toLowerCase();
      return hId !== currentId && hName !== currentName;
    });

    if (others.length === 0) return [];

    const currentSeed = Number(currentId.replace(/\D/g, '')) || 1;

    const scored = others.map((h) => {
      let score = 0;
      const hCity = (h.city || h.location || h.address || '').toLowerCase();
      const hCat = h.categoryId || h.category?.id;
      const hPrice = Number(h.price || h.basePrice || h.pricePerNight || 1000000);
      const hIdNum = Number(String(h.id).replace(/\D/g, '')) || 1;

      // 1. Cùng thành phố / khu vực (+100 điểm)
      if (currentCity) {
        if (hCity.includes(currentCity) || currentCity.includes(hCity)) {
          score += 100;
        } else {
          const regions = ['đà lạt', 'sapa', 'hội an', 'ninh bình', 'phú quốc', 'huế', 'ba vì', 'đà nẵng', 'khánh hòa', 'nha trang', 'hà nội', 'hạ long', 'vũng tàu'];
          for (const reg of regions) {
            if (currentCity.includes(reg) && hCity.includes(reg)) {
              score += 90;
              break;
            }
          }
        }
      }

      // 2. Cùng phân loại / kiểu homestay (+45 điểm)
      if (currentCategoryId && hCat && currentCategoryId === hCat) score += 45;

      // 3. Phân khúc giá tương đồng chênh lệch dưới 40% (+25 điểm)
      if (currentPrice > 0 && Math.abs(hPrice - currentPrice) / currentPrice < 0.4) score += 25;

      // 4. Điểm đánh giá cao (+ tối đa 20 điểm)
      const hRatingNum = Number(h.rating || 4.8);
      score += Math.min(hRatingNum * 4, 20);

      // 5. Yếu tố ngẫu nhiên theo ID homestay hiện tại để mỗi homestay gợi ý danh sách phong phú khác biệt
      const pseudoRandom = ((currentSeed * 37 + hIdNum * 19) % 73);
      score += pseudoRandom;

      return { h, score };
    });

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, 16).map(({ h, score }) => {
      let ratingVal = h.rating ? (h.rating > 5 ? (h.rating / 2).toFixed(1) : Number(h.rating).toFixed(1)) : '5';
      if (ratingVal.endsWith('.0')) ratingVal = ratingVal.slice(0, -2);
      const reviewsVal = h.reviewCount || h.reviews || (h.id ? ((Number(String(h.id).replace(/\D/g, '')) || 1) * 7) % 65 + 18 : 1);
      const priceVal = Number(h.price || h.basePrice || h.pricePerNight || 850000);
      const imgVal = h.image || h.primaryImage || h.thumb || h.gallery?.[0] || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80';
      const locVal = h.city || h.location || h.address || 'Việt Nam';
      
      const numRooms = h.rooms?.length || (h.id ? ((Number(String(h.id).replace(/\D/g, '')) || 2) % 4 + 2) : 4);
      const numGuests = h.maxGuests || (numRooms * 2 + 2);
      const specsVal = `${numRooms} phòng ngủ · ${numGuests} khách`;

      const amenitiesVal = h.amenities || h.tags || 'Sân gạch & giếng nước · Bếp củi truyền thống · Không gian xanh';
      const tagVal = h.tag || (score > 120 ? 'Top Bán Chạy' : (score > 80 ? 'Yêu thích' : 'Top Bán Chạy'));

      return {
        id: h.id,
        name: h.name,
        location: locVal,
        rating: ratingVal,
        reviews: reviewsVal,
        specs: specsVal,
        amenities: amenitiesVal,
        price: fmtVND(priceVal),
        img: imgVal,
        tag: tagVal
      };
    });
  }, [allHomestays, homestay, id, minPrice]);

  const homestayName = homestay?.name || 'The Pine Hill Retreat';
  const homestayAddress = homestay?.address || homestay?.location || 'Phường 3, TP. Đà Lạt, Lâm Đồng';
  const homestayCity = homestay?.city || '';
  const fullLocationAddress = useMemo(() => {
    if (!homestayAddress) return homestayCity || 'TP. Đà Lạt, Lâm Đồng';
    if (homestayCity && !homestayAddress.toLowerCase().includes(homestayCity.toLowerCase())) {
      return `${homestayAddress}, ${homestayCity}`;
    }
    return homestayAddress;
  }, [homestayAddress, homestayCity]);

  // Google Maps URL nhúng bản đồ thực tế
  const googleMapEmbedUrl = useMemo(() => {
    return `https://maps.google.com/maps?q=${encodeURIComponent(fullLocationAddress)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;
  }, [fullLocationAddress]);

  // Google Maps URL chỉ đường trực tiếp tới homestay
  const googleMapDirectionsUrl = useMemo(() => {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullLocationAddress)}`;
  }, [fullLocationAddress]);

  // Google Maps URL tìm kiếm vị trí chi tiết
  const googleMapSearchUrl = useMemo(() => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullLocationAddress)}`;
  }, [fullLocationAddress]);
  const homestayDescription = homestay?.description || homestay?.desc || `Ẩn mình giữa đồi thông Đà Lạt, The Pine Hill Retreat mang đến không gian nghỉ dưỡng mộc mạc mà ấm cúng, nơi bạn có thể nhóm lửa sưởi ấm buổi tối se lạnh và ngắm mây trôi ngay từ bồn tắm gỗ ngoài trời. Homestay có nhiều loại phòng khác nhau, từ phòng đôi ấm cúng cho cặp đôi đến villa toàn căn cho nhóm đông, phù hợp cho mọi nhu cầu nghỉ dưỡng chậm rãi cùng người thân hoặc bạn bè.`;
  const hostName = homestay?.ownerName || homestay?.hostName || 'Trần Văn Hùng';
  const hostAvatar = homestay?.ownerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&q=80';
  const hostBio = homestay?.ownerBio || `Xin chào! Tôi là ${hostName}, người sáng lập và quản lý homestay. Rất vui được đón tiếp quý khách đến nghỉ dưỡng và tận hưởng những ngày bình yên.`;

  const activeGallery = homestay?.gallery?.length > 0
    ? homestay.gallery
    : (homestay?.images?.length > 0 
        ? homestay.images 
        : (homestay?.image ? [homestay.image, ...galleryImages.slice(1)] : galleryImages));

  // Chuyển đổi danh sách ảnh của Homestay sang định dạng MediaItem của Interactive Bento Gallery
  const bentoMediaItems = useMemo(() => {
    return (activeGallery || []).map((url, idx) => ({
      id: idx + 1,
      type: (typeof url === 'string' && (url.includes('.mp4') || url.includes('video'))) ? 'video' : 'image',
      title: idx === 0 
        ? `Toàn cảnh ${homestayName}` 
        : idx === 1 
        ? `Không gian phòng ngủ & Nội thất tiện nghi` 
        : idx === 2 
        ? `Khuôn viên thiên nhiên & Kiến trúc homestay` 
        : idx === 3 
        ? `Ban công & Góc thư giãn ngắm cảnh` 
        : `Góc check-in ${homestayName} #${idx + 1}`,
      desc: `${homestayName} • Không gian nghỉ dưỡng ấm cúng, thoáng đãng và đậm chất thơ`,
      url: typeof url === 'string' ? url : (url.full || url.thumb || ''),
      span: idx === 0 ? "md:col-span-2 md:row-span-2 col-span-1" : "md:col-span-1 md:row-span-2 col-span-1",
    }));
  }, [activeGallery, homestayName]);

  if (loading) {
    return (
      <div className="hd-loading-screen">
        <div className="hd-loading-card">
          <div className="hd-loading-logo-wrap">
            <div className="hd-loading-pulse-ring" />
            <i className="bi bi-house-heart-fill hd-loading-icon" />
          </div>
          <h2 className="hd-loading-title">Đang chuẩn bị không gian nghỉ dưỡng</h2>
          <p className="hd-loading-desc">Đang tải thông tin phòng, tiện nghi và giá tốt nhất từ cơ sở dữ liệu...</p>
          <div className="hd-loading-bar-track">
            <div className="hd-loading-bar-fill" />
          </div>
        </div>
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
                <span
                  className="detail-location detail-location--clickable"
                  onClick={scrollToLocation}
                  style={{ cursor: 'pointer' }}
                  title="Xem bản đồ và chỉ đường tới homestay"
                >
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
              <div
                className="gallery-main"
                onClick={() => {
                  setSelectedBentoItem(bentoMediaItems[0] || null);
                  setBentoModalOpen(true);
                }}
                style={{ cursor: 'pointer' }}
                title="Nhấp để mở Bento Gallery tương tác"
              >
                <img src={activeGallery[0]} alt={`Toàn cảnh ${homestayName}`} />
              </div>
              <div className="gallery-side">
                {activeGallery.slice(1, 5).map((src, i) => (
                  <div
                    key={i}
                    className="gallery-thumb"
                    onClick={() => {
                      setSelectedBentoItem(bentoMediaItems[i + 1] || bentoMediaItems[0]);
                      setBentoModalOpen(true);
                    }}
                    style={{ cursor: 'pointer' }}
                    title={`Nhấp để xem ảnh ${i + 2} trong Bento Gallery`}
                  >
                    <img src={src} alt={`Ảnh ${i + 2}`} />
                  </div>
                ))}
              </div>
            </div>
            <div className="gallery-actions-bar">
              <span className="gallery-hint-text">
                <i className="bi bi-images" /> Nhấp vào ảnh bất kỳ để xem toàn màn hình
              </span>
              <button
                type="button"
                className="gallery-all-btn"
                onClick={() => {
                  setSelectedBentoItem(bentoMediaItems[0] || null);
                  setBentoModalOpen(true);
                }}
              >
                <i className="bi bi-grid-3x3-gap-fill" /> Xem tất cả {activeGallery.length} ảnh
              </button>
            </div>
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
            </div>
            <div className="detail-divider" />

            {/* 4.4b TRẢI NGHIỆM HOMESTAY MANG LẠI */}
            <div className="detail-block experience-section" id="experiencesSection">
              <div className="experience-head">
                <div>
                  <h3 className="experience-title">
                    <i className="bi bi-stars" /> Trải nghiệm tại homestay
                  </h3>
                  <p className="experience-sub">
                    Những hoạt động, đặc sản và trải nghiệm văn hóa bản địa do chủ nhà tổ chức hoặc hướng dẫn.
                  </p>
                </div>
                <span className="experience-count-note">
                  {loadingExperiences ? 'Đang tải...' : `${(dbExperiences.length > 0 ? dbExperiences : experiencesData).length} trải nghiệm`}
                </span>
              </div>

              <div className="experience-grid">
                {expPreview.map((x) => {
                  const xcat = EXPERIENCE_CATEGORIES.find((c) => c.id === x.category);
                  const isDb = x.img && (x.img.startsWith('http') || x.img.startsWith('/'));
                  const imgSrc = isDb ? x.img : unsplashUrl(x.img || EXPERIENCE_FALLBACK_IMG, 700);
                  return (
                    <article key={x.id} className="xp-card" onClick={() => setExpDrawer(true)}>
                      <div className="xp-card-media">
                        <img
                          src={imgSrc}
                          alt={x.title}
                          loading="lazy"
                          onError={(e) => { e.target.onerror = null; e.target.src = unsplashUrl(EXPERIENCE_FALLBACK_IMG, 700); }}
                        />
                        <span className={`xp-badge ${Number(x.price) === 0 ? 'xp-badge--free' : ''}`}>
                          <i className={`bi ${xcat?.icon || 'bi-stars'}`} /> {xcat?.label || 'Trải nghiệm'}
                        </span>
                      </div>
                      <div className="xp-card-body">
                        <span className="xp-cat"><i className="bi bi-tag-fill" /> {xcat?.label || 'Bản địa'}</span>
                        <h4 className="xp-card-name">{x.title}</h4>
                        <div className="xp-card-meta">
                          <i className="bi bi-cash-coin" />
                          <span>{experiencePriceLabel(x)}</span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              <button type="button" className="yn-btn yn-btn--outline" onClick={() => setExpDrawer(true)}>
                Hiển thị tất cả {(dbExperiences.length > 0 ? dbExperiences : experiencesData).length} trải nghiệm
              </button>
            </div>
            <div className="detail-divider" />

            {/* 4.4c NHIỆM VỤ NHẬN THƯỞNG KHI LƯU TRÚ (HIỂN THỊ TRỰC TIẾP TRÊN TRANG HOMESTAY) */}
            {mainMissions && mainMissions.length > 0 && (
              <div className="detail-block missions-main-block" id="missionsSection">
                <div className="experience-head">
                  <div>
                    <h3 className="experience-title" style={{ color: '#065f46' }}>
                      <i className="bi bi-gift-fill text-success" /> Nhiệm vụ nhận thưởng khi lưu trú
                    </h3>
                    <p className="experience-sub">
                      Hoàn thành các hoạt động trải nghiệm do chủ homestay thiết kế để nhận quà tặng đặc sản và voucher độc quyền!
                    </p>
                  </div>
                  <span className="missions-count-badge">
                    <i className="bi bi-stars text-warning me-1" /> {mainMissions.length} nhiệm vụ sẵn có
                  </span>
                </div>

                <div className="missions-cards-grid">
                  {mainMissions.map((m, idx) => (
                    <div key={m.id || idx} className="mission-item-card">
                      <div className="mission-card-top">
                        <div className="mission-icon-box">
                          <i className={`bi ${m.icon || (idx === 0 ? 'bi-camera-fill' : 'bi-tree-fill')}`} />
                        </div>
                        <div className="mission-title-wrap">
                          <h5 className="mission-name">{m.title}</h5>
                          <span className="mission-active-badge">
                            <span className="active-dot" /> Đang mở cho khách
                          </span>
                        </div>
                      </div>
                      {m.description && <p className="mission-desc-text">{m.description}</p>}
                      {m.rewardNote && (
                        <div className="mission-reward-callout">
                          <i className="bi bi-gift-fill reward-icon" />
                          <div className="reward-content">
                            <span className="reward-label">Phần thưởng:</span>
                            <strong className="reward-value">{m.rewardNote}</strong>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
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
              
              {/* Tổng quan điểm số và phân bố sao của Homestay */}
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

              {/* Bộ lọc và sắp xếp đánh giá trực tiếp ngay tại trang homestay */}
              {dbReviews.length > 0 && (
                <div className="page-review-controls">
                  <div className="page-review-chips">
                    <button
                      type="button"
                      className={`yn-chip ${pageReviewStars === 'all' && !pageReviewPhotoOnly ? 'active' : ''}`}
                      onClick={() => { setPageReviewStars('all'); setPageReviewPhotoOnly(false); setPageReviewsShown(6); }}
                    >
                      Tất cả <span className="chip-count">{dbReviews.length}</span>
                    </button>
                    {['5', '4', '3', '2', '1'].map((s) => {
                      const count = dbReviews.filter((r) => Number(r.rating) === Number(s)).length;
                      return (
                        <button
                          key={s}
                          type="button"
                          className={`yn-chip ${!pageReviewPhotoOnly && pageReviewStars === s ? 'active' : ''}`}
                          onClick={() => { setPageReviewStars(s); setPageReviewPhotoOnly(false); setPageReviewsShown(6); }}
                        >
                          <i className="bi bi-star-fill" /> {s} sao <span className="chip-count">{count}</span>
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      className={`yn-chip ${pageReviewPhotoOnly ? 'active' : ''}`}
                      onClick={() => { setPageReviewPhotoOnly(!pageReviewPhotoOnly); setPageReviewStars('all'); setPageReviewsShown(6); }}
                    >
                      <i className="bi bi-camera-fill" /> Có hình ảnh <span className="chip-count">{dbReviews.filter((r) => (r.images && r.images.length > 0) || (r.photos && r.photos.length > 0)).length}</span>
                    </button>
                  </div>

                  <div className="page-review-sort">
                    <span className="page-review-sort-label">Sắp xếp:</span>
                    <select
                      className="rv-select"
                      value={pageReviewSort}
                      onChange={(e) => { setPageReviewSort(e.target.value); setPageReviewsShown(6); }}
                    >
                      <option value="newest">Mới nhất</option>
                      <option value="highest">Điểm cao nhất</option>
                      <option value="lowest">Điểm thấp nhất</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Danh sách các đánh giá hiển thị trực tiếp ngay tại trang Homestay */}
              {filteredPageReviews.length > 0 ? (
                <div className="reviews-grid">
                  {filteredPageReviews.slice(0, pageReviewsShown).map((r) => (
                    <ReviewCard key={r.id} review={r} showRoom={false} clamp={false} onPhotoClick={handlePhotoClick} />
                  ))}
                </div>
              ) : (
                <div className="rv-empty-state">
                  <i className="bi bi-chat-square-dots" />
                  <p>
                    {dbReviews.length === 0 
                      ? 'Homestay này hiện chưa có đánh giá nào từ khách hàng.' 
                      : 'Không có đánh giá nào phù hợp với bộ lọc hiện tại.'}
                  </p>
                  {dbReviews.length > 0 && (
                    <button
                      type="button"
                      className="yn-btn yn-btn--outline yn-btn--sm"
                      style={{ marginTop: '10px' }}
                      onClick={() => { setPageReviewStars('all'); setPageReviewPhotoOnly(false); setPageReviewsShown(6); }}
                    >
                      Xóa bộ lọcn
                    </button>
                  )}
                </div>
              )}

              {/* Nút Xem thêm / Thu gọn ngay tại trang homestay */}
              {filteredPageReviews.length > 0 && (
                <div className="page-reviews-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginTop: '16px' }}>
                  {filteredPageReviews.length > pageReviewsShown && (
                    <button
                      type="button"
                      className="yn-btn yn-btn--outline"
                      onClick={() => setPageReviewsShown((s) => s + 6)}
                    >
                      <i className="bi bi-arrow-down-circle" /> Xem thêm {Math.min(6, filteredPageReviews.length - pageReviewsShown)} đánh giá khác (Đã xem {pageReviewsShown}/{filteredPageReviews.length})
                    </button>
                  )}
                  {pageReviewsShown > 6 && (
                    <button
                      type="button"
                      className="yn-btn yn-btn--ghost"
                      onClick={() => { setPageReviewsShown(6); reviewsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
                    >
                      <i className="bi bi-arrow-up-circle" /> Thu gọn bớt
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="detail-divider" />

            <div className="detail-block" id="locationSection" ref={locationSectionRef}>
              <div className="location-section-header">
                <div>
                  <h3 className="detail-block-title">Vị trí homestay</h3>
                  <p className="location-note">
                    <i className="bi bi-geo-alt-fill" /> {fullLocationAddress} · {homestay?.distance || 'Cách trung tâm 1.5km, thuận tiện di chuyển tham quan'}
                  </p>
                </div>
                <a
                  href={googleMapDirectionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="location-direct-link location-direct-link--primary"
                  title="Chỉ đường trên Google Maps"
                >
                  <i className="bi bi-signpost-split-fill" /> Xem chỉ đường tới homestay
                </a>
              </div>

              <div className="location-map-box">
                <iframe
                  title={`Bản đồ vị trí ${homestayName}`}
                  src={googleMapEmbedUrl}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              <div className="location-map-footer">
                <div className="location-coords-badge">
                  <i className="bi bi-pin-map-fill" />
                  <span>{fullLocationAddress}</span>
                </div>
                <div className="location-actions">
                  <button
                    type="button"
                    className="location-copy-btn"
                    onClick={() => {
                      if (navigator.clipboard && window.isSecureContext) {
                        navigator.clipboard.writeText(fullLocationAddress).catch(() => {});
                      }
                      showToast('Đã sao chép địa chỉ homestay vào bộ nhớ tạm!');
                    }}
                    title="Sao chép địa chỉ"
                  >
                    <i className="bi bi-copy" /> Sao chép địa chỉ
                  </button>
                  <a
                    href={googleMapSearchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="location-direct-link"
                    title="Mở trên Google Maps"
                  >
                    <i className="bi bi-box-arrow-up-right" /> Mở Google Maps
                  </a>
                  <a
                    href={googleMapDirectionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="location-direct-link location-direct-link--primary"
                    title="Xem chỉ đường trên Google Maps"
                  >
                    <i className="bi bi-signpost-split-fill" /> Xem chỉ đường tới homestay
                  </a>
                </div>
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
              <button type="button" className="yn-btn yn-btn--outline yn-btn--lg yn-btn--block" onClick={handleChatOwner}>
                <i className="bi bi-chat-dots" /> Chat với chủ nhà
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
              <h2 className="similar-title">Homestay tương tự {homestay?.city ? `tại ${homestay.city}` : 'được yêu thích nhất'}</h2>
              <p className="similar-sub">Gợi ý {relatedHomestays.length} điểm đến cùng phong cách nghỉ dưỡng tiện nghi và không gian thiên nhiên trong lành.</p>
            </div>
            <div className="slider-nav-controls">
              <button
                type="button"
                className="slider-nav-circle-btn"
                onClick={() => scrollSlider(similarSliderRef, -1)}
                aria-label="Xem homestay trước"
                title="Lướt qua trái"
              >
                <i className="bi bi-chevron-left" />
              </button>
              <button
                type="button"
                className="slider-nav-circle-btn"
                onClick={() => scrollSlider(similarSliderRef, 1)}
                aria-label="Xem homestay tiếp theo"
                title="Lướt qua phải"
              >
                <i className="bi bi-chevron-right" />
              </button>
            </div>
          </div>

          <div className="homestay-slider-wrap">
            <button
              type="button"
              className="homestay-slider-arrow arrow-prev"
              style={{
                position: 'absolute',
                top: '50%',
                left: '-20px',
                transform: 'translateY(-50%)',
                zIndex: 35,
                width: '44px',
                height: '52px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1.5px solid rgba(255, 255, 255, 0.95)',
                boxShadow: '0 6px 20px rgba(15, 23, 42, 0.14)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                color: '#1E293B',
                cursor: 'pointer',
                outline: 'none',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onClick={() => scrollSlider(similarSliderRef, -1)}
              aria-label="Xem homestay trước"
            >
              <i className="bi bi-chevron-left" />
            </button>

            <div className="homestay-slider-track" ref={similarSliderRef}>
              {relatedHomestays.map((h, i) => (
                <div key={h.id || i} className="homestay-slider-item">
                  <div className="homestay-card">
                    <div className="card-img-wrapper">
                      <span className="card-top-tag tag-hot">
                        <i className="bi bi-fire" /> {h.tag}
                      </span>
                      <button
                        type="button"
                        className={`card-wishlist-btn ${wishlist[h.name] ? 'active' : ''}`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setWishlist((w) => ({ ...w, [h.name]: !w[h.name] }));
                          showToast(!wishlist[h.name] ? `Đã thêm "${h.name}" vào Wishlist!` : `Đã bỏ lưu "${h.name}" khỏi Wishlist.`);
                        }}
                        title={wishlist[h.name] ? 'Bỏ yêu thích' : 'Lưu vào yêu thích'}
                      >
                        <i className={`bi ${wishlist[h.name] ? 'bi-heart-fill' : 'bi-heart'}`} />
                      </button>
                      <Link to={`/homestay/${h.id}`} style={{ display: 'block', height: '100%' }}>
                        <img
                          src={h.img}
                          alt={h.name}
                          loading="lazy"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </Link>
                    </div>
                    <div className="card-body">
                      <div className="card-location-rating">
                        <span className="card-location">
                          <i className="bi bi-geo-alt-fill text-success" /> {h.location}
                        </span>
                        <span className="card-rating">
                          <i className="bi bi-star-fill" /> {h.rating} ({h.reviews})
                        </span>
                      </div>
                      <h3 className="card-title">
                        <Link to={`/homestay/${h.id}`}>{h.name}</Link>
                      </h3>
                      <div className="card-specs">
                        <span>{h.specs}</span>
                      </div>
                      <div className="card-amenities-box">
                        <span className="amenities-label">Tiện nghi nổi bật:</span>
                        <p className="amenities-items">{formatAmenities(h.amenities)}</p>
                      </div>
                      <div className="card-footer-row">
                        <div>
                          <span className="price-label">Giá từ:</span>
                          <span className="card-price">{h.price}</span>
                        </div>
                        <Link to={`/homestay/${h.id}`} className="btn-view-room">
                          Xem homestay
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="homestay-slider-arrow arrow-next"
              style={{
                position: 'absolute',
                top: '50%',
                right: '-20px',
                transform: 'translateY(-50%)',
                zIndex: 35,
                width: '44px',
                height: '52px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1.5px solid rgba(255, 255, 255, 0.95)',
                boxShadow: '0 6px 20px rgba(15, 23, 42, 0.14)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                color: '#1E293B',
                cursor: 'pointer',
                outline: 'none',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onClick={() => scrollSlider(similarSliderRef, 1)}
              aria-label="Xem homestay tiếp theo"
            >
              <i className="bi bi-chevron-right" />
            </button>
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
          homestayRating={homestayRating}
          homestayReviewCount={homestayReviewCount}
          onClose={() => setActiveRoomIdx(null)}
          onScrollToReviews={scrollToReviews}
          showToast={showToast}
        />
      )}

      <ReviewsDrawer
        open={reviewsDrawer.open}
        reviews={dbReviews}
        homestayRating={homestayRating}
        onClose={() => setReviewsDrawer((s) => ({ ...s, open: false }))}
        onPhotoClick={handlePhotoClick}
      />

      <AmenitiesDrawer
        open={amDrawer}
        onClose={() => setAmDrawer(false)}
      />

      <ExperiencesDrawer
        open={expDrawer}
        experiences={dbExperiences}
        loadingExperiences={loadingExperiences}
        onClose={() => setExpDrawer(false)}
        onScrollToRooms={scrollToRooms}
      />

      <Toast message={toast.msg} show={toast.show} />

      {/* Interactive Bento Gallery Modal khi nhấp vào ảnh homestay */}
      {bentoModalOpen && selectedBentoItem && (
        <GalleryModal
          isOpen={bentoModalOpen}
          selectedItem={selectedBentoItem}
          setSelectedItem={setSelectedBentoItem}
          onClose={() => setBentoModalOpen(false)}
          mediaItems={bentoMediaItems}
        />
      )}
    </div>
  );
}
