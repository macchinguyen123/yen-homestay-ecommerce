import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { bookingService } from '../../../services/bookingService';
import './CompletePay.css';

const BOOKINGS_KEY = 'yenBookings';
const LAST_KEY = 'yenLastBooking';

const METHOD_LABELS = {
  vietqr: 'Chuyển khoản QR (VietQR)',
  momo: 'Ví MoMo',
  zalopay: 'ZaloPay',
  card: 'Thẻ ngân hàng',
};

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const pad = (n) => String(n).padStart(2, '0');
const fmtVND = (n) => Math.round(n || 0).toLocaleString('vi-VN') + 'đ';

function fmtDate(s) {
  if (!s) return '-';
  const d = new Date(s.includes('T') ? s : s + 'T00:00:00');
  if (isNaN(d.getTime())) return s;
  return `${WEEKDAYS[d.getDay()]}, ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export default function CompletePay() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const code = searchParams.get('code');
    let isMounted = true;

    async function loadBooking() {
      setLoading(true);
      try {
        const list = JSON.parse(localStorage.getItem(BOOKINGS_KEY) || '[]');
        const last = JSON.parse(sessionStorage.getItem(LAST_KEY) || 'null');
        let localFound = null;
        if (code) {
          localFound = list.find((b) => b.code === code) || (last && last.code === code ? last : null);
        } else {
          localFound = last || list[0] || null;
        }

        // Tra cứu đơn đặt phòng từ CSDL thật Neon PostgreSQL
        const targetCode = code || (localFound?.code ? localFound.code : null);
        if (targetCode) {
          try {
            const dbData = await bookingService.getBookingByCode(targetCode);
            if (dbData && isMounted) {
              const checkinStr = dbData.checkInDate || dbData.checkIn || '';
              const checkoutStr = dbData.checkOutDate || dbData.checkOut || '';
              const nightsCount = dbData.nights || 1;
              const totalNum = Number(dbData.totalPriceRaw || 0) || (typeof dbData.totalPrice === 'number' ? dbData.totalPrice : 0);
              const depositNum = Number(dbData.depositAmount || 0);
              const remainingNum = Number(dbData.remainingAmount || 0);
              const paidNum = depositNum > 0 ? depositNum : totalNum;

              const adapted = {
                code: dbData.bookingCode,
                homestay: dbData.homestayName,
                room: {
                  name: dbData.roomName || 'Phòng nghỉ sinh thái',
                  thumb: dbData.roomImage || dbData.homestayImage || 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=600&q=80',
                },
                location: dbData.location || 'Việt Nam',
                checkin: checkinStr,
                checkout: checkoutStr,
                nights: nightsCount,
                guests: dbData.guestsCount || 2,
                contact: {
                  fullName: dbData.touristName || 'Quý khách',
                  phone: 'Liên hệ qua ứng dụng',
                  email: 'Đã xác nhận trong tài khoản',
                },
                pricing: {
                  subtotal: totalNum,
                  cleaning: 0,
                  service: 0,
                  discount: 0,
                  total: totalNum,
                  paid: paidNum,
                  remaining: remainingNum,
                  experienceEstimate: 0,
                },
                method: dbData.paymentType === 'DEPOSIT' ? 'vietqr' : 'vietqr',
                depositStatus: dbData.depositStatus,
                status: dbData.status,
              };

              if (localFound && localFound.pricing) {
                setBooking({
                  ...adapted,
                  ...localFound,
                  code: dbData.bookingCode,
                  homestay: dbData.homestayName || localFound.homestay,
                  room: {
                    name: dbData.roomName || localFound.room?.name,
                    thumb: dbData.roomImage || localFound.room?.thumb,
                  },
                });
              } else {
                setBooking(adapted);
              }
              setLoading(false);
              return;
            }
          } catch (apiErr) {
            console.warn('Không thể tải đặt phòng từ DB, dùng fallback:', apiErr);
          }
        }

        if (isMounted) {
          setBooking(localFound || null);
        }
      } catch (e) {
        if (isMounted) setBooking(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadBooking();
    return () => { isMounted = false; };
  }, [searchParams]);

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2800);
  };

  const handleCopyCode = () => {
    if (!booking?.code) return;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard
        .writeText(booking.code)
        .then(() => triggerToast('Đã sao chép mã đặt phòng thành công!'))
        .catch(() => triggerToast('Hãy chọn và sao chép thủ công.'));
    } else {
      triggerToast('Đã sao chép mã: ' + booking.code);
    }
  };

  if (loading) {
    return (
      <div className="cp-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', color: '#64748B' }}>
          <i className="bi bi-arrow-repeat spin" style={{ fontSize: '2rem', display: 'block', marginBottom: 12 }} />
          <span>Đang tải thông tin đặt phòng...</span>
        </div>
      </div>
    );
  }

  if (!booking || !booking.pricing) {
    return (
      <main className="cp-page">
        <section className="cp-empty">
          <div className="cp-container">
            <div className="cp-empty-card">
              <i className="bi bi-receipt" />
              <h2>Không tìm thấy đặt phòng</h2>
              <p>
                Liên kết này đã cũ hoặc bạn chưa hoàn tất đặt phòng nào. Hãy chọn phòng và đặt lại, hoặc xem các đặt phòng đã có trong tài khoản.
              </p>
              <div className="cp-actions">
                <Link to="/" className="yn-btn yn-btn--primary">Về trang chủ</Link>
                <Link to="/bookings" className="yn-btn yn-btn--ghost">Xem đặt phòng của tôi</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const pr = booking.pricing;
  const isDeposit = pr.remaining > 0;

  return (
    <main className="cp-page">
      {/* 1. ĐỈNH TRANG - BƯỚC THỰC HIỆN */}
      <section className="cp-top">
        <div className="cp-container">
          <div className="cp-steps" aria-label="Các bước đặt phòng">
            <div className="cp-step">
              <span className="cp-step-num"><i className="bi bi-check" /></span>
              <span className="cp-step-label">Thông tin đặt phòng</span>
            </div>
            <span className="cp-step-line" />
            <div className="cp-step">
              <span className="cp-step-num"><i className="bi bi-check" /></span>
              <span className="cp-step-label">Thanh toán</span>
            </div>
            <span className="cp-step-line" />
            <div className="cp-step">
              <span className="cp-step-num"><i className="bi bi-check" /></span>
              <span className="cp-step-label">Hoàn tất</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. NỘI DUNG CHÍNH */}
      <section className="cp-body">
        <div className="cp-container cp-wrap">

          {/* BANNER HERO */}
          <div className="cp-hero">
            <div className="cp-hero-icon"><i className="bi bi-check-lg" /></div>
            <h1>Đặt phòng thành công</h1>
            <p className="cp-hero-sub">
              Cảm ơn <b>{booking.contact?.fullName || 'quý khách'}</b>! Chúng tôi đã gửi email xác nhận tới <b>{booking.contact?.email}</b>.
              {isDeposit && ` Bạn đã đặt cọc ${fmtVND(pr.paid)}, phần còn lại trả khi nhận phòng.`}
            </p>

            <div className="cp-code-box">
              <span>Mã đặt phòng</span>
              <b>{booking.code}</b>
              <button type="button" className="yn-btn yn-btn--ghost yn-btn--sm" onClick={handleCopyCode}>
                <i className="bi bi-copy" /> Sao chép
              </button>
            </div>
          </div>

          {/* LƯỚI THÔNG TIN CHI TIẾT */}
          <div className="cp-grid">

            {/* THÔNG TIN PHÒNG */}
            <section className="cp-card">
              <h2>Thông tin đặt phòng</h2>
              <div className="cp-room">
                <img src={booking.room?.thumb || 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=600&q=80'} alt={booking.room?.name} />
                <div>
                  <span className="cp-room-homestay">{booking.homestay || 'YÊN Homestay'}</span>
                  <h3>{booking.room?.name || 'Phòng nghỉ sinh thái'}</h3>
                  {booking.location && (
                    <span className="cp-room-loc">
                      <i className="bi bi-geo-alt-fill" />
                      <span>{booking.location}</span>
                    </span>
                  )}
                </div>
              </div>

              <dl className="cp-info">
                <div>
                  <dt>Nhận phòng</dt>
                  <dd>{fmtDate(booking.checkin)} · từ 14:00</dd>
                </div>
                <div>
                  <dt>Trả phòng</dt>
                  <dd>{fmtDate(booking.checkout)} · trước 12:00</dd>
                </div>
                <div>
                  <dt>Số khách</dt>
                  <dd>{booking.guests} khách · {booking.nights} đêm</dd>
                </div>
                <div>
                  <dt>Người đặt</dt>
                  <dd>{booking.contact?.fullName} · {booking.contact?.phone}</dd>
                </div>
                {booking.arrivalTime && (
                  <div>
                    <dt>Giờ dự kiến đến</dt>
                    <dd>{booking.arrivalTime}</dd>
                  </div>
                )}
                {booking.experiences && booking.experiences.length > 0 && (
                  <div>
                    <dt>Trải nghiệm đã chọn</dt>
                    <dd>{booking.experiences.join('; ')}</dd>
                  </div>
                )}
                {booking.note && (
                  <div>
                    <dt>Lời nhắn cho chủ nhà</dt>
                    <dd>{booking.note}</dd>
                  </div>
                )}
              </dl>
            </section>

            {/* CHI TIẾT THANH TOÁN */}
            <section className="cp-card">
              <div className="cp-card-title-row">
                <h2>Chi tiết thanh toán</h2>
                <span className={`cp-status ${isDeposit ? 'is-deposit' : ''}`}>
                  {isDeposit ? 'Đã đặt cọc' : 'Đã thanh toán đủ'}
                </span>
              </div>

              <div className="cp-breakdown">
                <div className="cp-row">
                  <span>Tiền phòng ({booking.nights} đêm)</span>
                  <span>{fmtVND(pr.subtotal)}</span>
                </div>
                <div className="cp-row">
                  <span>Phí vệ sinh</span>
                  <span>{fmtVND(pr.cleaning)}</span>
                </div>
                <div className="cp-row">
                  <span>Phí dịch vụ YÊN</span>
                  <span>{fmtVND(pr.service)}</span>
                </div>
                {pr.discount > 0 && (
                  <div className="cp-row cp-row--discount">
                    <span>Mã {booking.coupon || 'Ưu đãi'}</span>
                    <span>-{fmtVND(pr.discount)}</span>
                  </div>
                )}

                <div className="cp-divider" />

                <div className="cp-row cp-row--total">
                  <span>Tổng cộng</span>
                  <span>{fmtVND(pr.total)}</span>
                </div>

                <div className="cp-paid">
                  <div className="cp-row">
                    <span>{isDeposit ? 'Đã đặt cọc' : 'Đã thanh toán'}</span>
                    <b>{fmtVND(pr.paid)}</b>
                  </div>
                  <p className="cp-paid-method">
                    {METHOD_LABELS[booking.method] || 'Thanh toán trực tuyến'}
                  </p>
                  {isDeposit && (
                    <div className="cp-row cp-row--later">
                      <span>Trả khi nhận phòng</span>
                      <span>{fmtVND(pr.remaining)}</span>
                    </div>
                  )}
                </div>

                {pr.experienceEstimate > 0 && (
                  <div className="cp-xp-note">
                    <span>Trải nghiệm dự kiến, trả trực tiếp tại homestay</span>
                    <b>{fmtVND(pr.experienceEstimate)}</b>
                  </div>
                )}
              </div>
            </section>

          </div>

          {/* BƯỚC TIẾP THEO */}
          <section className="cp-card cp-next">
            <h2>Bước tiếp theo</h2>
            <ul>
              <li>
                <i className="bi bi-check2-circle" />
                <span>Chủ nhà sẽ nhắn mã mở khóa cho bạn trước ngày nhận phòng 1 ngày. Bạn tự nhận phòng trong khung 14:00 - 21:00.</span>
              </li>
              <li>
                <i className="bi bi-check2-circle" />
                <span>Email xác nhận kèm mã đặt phòng <b>{booking.code}</b> đã được gửi tới <b>{booking.contact?.email}</b>.</span>
              </li>
              {isDeposit && (
                <li>
                  <i className="bi bi-check2-circle" />
                  <span>Bạn thanh toán nốt <b>{fmtVND(pr.remaining)}</b> khi nhận phòng.</span>
                </li>
              )}
              {booking.experiences && booking.experiences.length > 0 && (
                <li>
                  <i className="bi bi-check2-circle" />
                  <span>
                    Chủ nhà sẽ liên hệ xác nhận {booking.experiences.length} trải nghiệm bạn đã chọn
                    {pr.experienceEstimate > 0 ? `, dự kiến ${fmtVND(pr.experienceEstimate)}, trả trực tiếp tại homestay` : ''}.
                  </span>
                </li>
              )}
              <li>
                <i className="bi bi-check2-circle" />
                <span>Cần đổi lịch hoặc hủy phòng? Miễn phí hủy trong 48 giờ sau khi đặt.</span>
              </li>
            </ul>
          </section>

          {/* NÚT THAO TÁC */}
          <div className="cp-actions">
            <Link to="/bookings" className="yn-btn yn-btn--primary">
              <i className="bi bi-calendar-check" /> Xem đặt phòng của tôi
            </Link>
            <button type="button" className="yn-btn yn-btn--outline" onClick={() => window.print()}>
              <i className="bi bi-printer" /> In xác nhận
            </button>
            <Link to="/" className="yn-btn yn-btn--ghost">
              <i className="bi bi-house" /> Về trang chủ
            </Link>
          </div>

        </div>
      </section>

      {/* TOAST THÔNG BÁO */}
      <div className={`toast-notice ${showToast ? 'show' : ''}`} role="status">
        <i className="bi bi-check-circle-fill" />
        <span>{toastMsg}</span>
      </div>
    </main>
  );
}
