import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { authService } from '../../../services/authService';
import { bookingService } from '../../../services/bookingService';
import { voucherService } from '../../../services/voucherService';
import './BookingAndPay.css';

const SERVICE_FEE_RATE = 0.05;
const DEPOSIT_RATE = 0.3;
const PAY_SESSION_SECONDS = 15 * 60;

const fmtVND = (n) => Math.round(n).toLocaleString('vi-VN') + 'đ';
const pad = (n) => String(n).padStart(2, '0');
const toInputDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const DEFAULT_HOMESTAY = {
  name: 'The Pine Hill Retreat',
  location: 'Phường 3, TP. Đà Lạt, Lâm Đồng',
  rating: 4.90,
  reviewCount: 126,
};

const ROOM_CATALOG = {
  doi: {
    id: 'doi', name: 'Phòng Đôi View Rừng Thông', price: 890000, cleaningFee: 100000, maxGuests: 2,
    thumb: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=400&q=80'
  },
  giadinh: {
    id: 'giadinh', name: 'Phòng Gác Mái Gia Đình', price: 1350000, cleaningFee: 130000, maxGuests: 4,
    thumb: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=400&q=80'
  },
  villa: {
    id: 'villa', name: 'Villa Toàn Căn Đồi Thông', price: 3200000, cleaningFee: 250000, maxGuests: 8,
    thumb: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80'
  }
};

const EXPERIENCES = [
  { id: 'sanmay', title: 'Săn mây bình minh trên đồi thông', price: 0, unit: '', note: 'Không cần đặt trước' },
  { id: 'trekking', title: 'Đi bộ xuyên rừng thông', price: 100000, unit: '/ nhóm', note: '2 giờ · đặt trước 1 ngày' },
  { id: 'hairau', title: 'Hái rau, dâu tại vườn nhà', price: 60000, unit: '/ khách', note: '60 phút · đặt trước 1 ngày' },
  { id: 'nongtrai', title: 'Cho gà, thỏ ăn & chơi vườn cùng bé', price: 0, unit: '', note: 'Gia đình có trẻ nhỏ' },
  { id: 'naucom', title: 'Học nấu bữa cơm quê cùng chủ nhà', price: 180000, unit: '/ khách', note: '2 giờ · đặt trước 1 ngày' },
  { id: 'tradacphe', title: 'Trà atiso & cà phê rang xay buổi sáng', price: 0, unit: '', note: 'Ly đầu miễn phí' },
  { id: 'luatrai', title: 'Lửa trại & nướng BBQ đêm đồi thông', price: 250000, unit: '/ nhóm', note: '2 giờ · đặt trước 1 ngày' },
  { id: 'bontam', title: 'Ngâm bồn tắm gỗ ngắm mây, ngắm sao', price: 0, unit: '', note: 'Hẹn giờ với chủ nhà' }
];

const COUPONS = {
  YEN10: {
    code: 'YEN10', title: 'Giảm 10% tiền phòng', desc: 'Tối đa 300.000đ', badge: '-10%', wallet: true,
    calc: (subtotal) => Math.min(Math.round(subtotal * 0.1), 300000)
  },
  DALAT100: {
    code: 'DALAT100', title: 'Giảm 100.000đ', desc: 'Cho tiền phòng từ 1.500.000đ', badge: '-100K', wallet: true, min: 1500000,
    calc: () => 100000
  },
  LONGSTAY: {
    code: 'LONGSTAY', title: 'Giảm 150.000đ khi ở dài ngày', desc: 'Áp dụng khi ở từ 3 đêm', badge: '-150K', wallet: true, minNights: 3,
    calc: () => 150000
  },
  HELLODALAT: {
    code: 'HELLODALAT', title: 'Giảm 5% tiền phòng', desc: 'Tối đa 100.000đ', badge: '-5%', wallet: false,
    calc: (subtotal) => Math.min(Math.round(subtotal * 0.05), 100000)
  }
};

const BANK_INFO = { bank: 'Ngân hàng Quân Đội (MB Bank)', account: '0901234567', holder: 'CONG TY YEN HOMESTAY' };

function qrSvgSvg(seedStr, color) {
  const N = 29;
  let seed = 0;
  for (const ch of seedStr) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const rand = () => {
    seed = (seed + 0x6D2B79F5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const finder = (x, y, ox, oy) => {
    const dx = x - ox, dy = y - oy;
    if (dx < 0 || dy < 0 || dx > 6 || dy > 6) return null;
    return Math.max(Math.abs(dx - 3), Math.abs(dy - 3)) !== 2;
  };
  const near = (x, y, ox, oy) => x >= ox - 1 && x <= ox + 7 && y >= oy - 1 && y <= oy + 7;

  let d = '';
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const f = [finder(x, y, 0, 0), finder(x, y, N - 7, 0), finder(x, y, 0, N - 7)].find((v) => v !== null);
      let dark;
      if (f !== undefined) dark = f;
      else if (near(x, y, 0, 0) || near(x, y, N - 7, 0) || near(x, y, 0, N - 7)) dark = false;
      else dark = rand() > 0.52;
      if (dark) d += `M${x} ${y}h1v1h-1z`;
    }
  }
  return `<svg viewBox="-1 -1 ${N + 2} ${N + 2}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges"><path d="${d}" fill="${color}"/></svg>`;
}

export default function BookingAndPay() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const todayStr = toInputDate(new Date());

  // Dates initial
  const defaultCheckinDate = new Date(); defaultCheckinDate.setDate(defaultCheckinDate.getDate() + 7);
  const defaultCheckoutDate = new Date(defaultCheckinDate); defaultCheckoutDate.setDate(defaultCheckoutDate.getDate() + 2);

  const [homestay, setHomestay] = useState(DEFAULT_HOMESTAY);
  const [room, setRoom] = useState(ROOM_CATALOG.doi);
  const [checkin, setCheckin] = useState(toInputDate(defaultCheckinDate));
  const [checkout, setCheckout] = useState(toInputDate(defaultCheckoutDate));
  const [guests, setGuests] = useState(2);

  // Form Contact
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [guestNote, setGuestNote] = useState('');

  // Tự động điền thông tin tài khoản đang đăng nhập
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      if (user.fullName) setFullName(user.fullName);
      if (user.phone) setPhone(user.phone);
      if (user.email) setEmail(user.email);
    }
  }, []);

  // Đọc thông tin phòng & homestay từ state hoặc URL searchParams
  useEffect(() => {
    const passedRoomId = searchParams.get('roomId') || location.state?.roomId;
    const passedHomestayId = searchParams.get('homestayId') || location.state?.homestayId;

    if (location.state?.room) {
      const r = location.state.room;
      setRoom({
        id: r.id,
        name: r.name || r.roomName || 'Phòng nghỉ',
        price: Number(r.price || r.pricePerNight || 890000),
        cleaningFee: Number(r.cleaningFee || 100000),
        maxGuests: r.specs?.guests || r.capacity || 2,
        thumb: r.thumb || r.primaryImage || r.gallery?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=400&q=80',
        homestayId: r.homestayId,
      });
    } else if (passedRoomId) {
      if (ROOM_CATALOG[passedRoomId]) {
        setRoom(ROOM_CATALOG[passedRoomId]);
      } else {
        fetch(`http://localhost:8081/api/public/rooms/${passedRoomId}`)
          .then((res) => res.ok ? res.json() : null)
          .then((data) => {
            if (data) {
              setRoom({
                id: data.id,
                name: data.name || data.roomName || 'Phòng nghỉ',
                price: Number(data.price || data.pricePerNight || 890000),
                cleaningFee: Number(data.cleaningFee || 100000),
                maxGuests: data.specs?.guests || data.capacity || 2,
                thumb: data.thumb || data.primaryImage || data.gallery?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=400&q=80',
                homestayId: data.homestayId,
              });
              if (!passedHomestayId && data.homestayId) {
                fetch(`http://localhost:8081/api/public/homestays/${data.homestayId}`)
                  .then((r) => r.ok ? r.json() : null)
                  .then((hData) => {
                    if (hData) {
                      setHomestay({
                        id: hData.id,
                        name: hData.name,
                        location: hData.location || hData.address || hData.city || 'Việt Nam',
                        rating: hData.rating || 5.0,
                        reviewCount: hData.reviewCount || hData.reviews || 0,
                      });
                    }
                  });
              }
            }
          })
          .catch((err) => console.error('Lỗi tải thông tin phòng:', err));
      }
    }

    if (location.state?.homestay) {
      const h = location.state.homestay;
      setHomestay({
        id: h.id,
        name: h.name,
        location: h.location || h.address || h.city || 'Việt Nam',
        rating: h.rating || 5.0,
        reviewCount: h.reviewCount || h.reviews || 0,
      });
    } else if (passedHomestayId) {
      fetch(`http://localhost:8081/api/public/homestays/${passedHomestayId}`)
        .then((res) => res.ok ? res.json() : null)
        .then((hData) => {
          if (hData) {
            setHomestay({
              id: hData.id,
              name: hData.name,
              location: hData.location || hData.address || hData.city || 'Việt Nam',
              rating: hData.rating || 5.0,
              reviewCount: hData.reviewCount || hData.reviews || 0,
            });
          }
        })
        .catch((err) => console.error('Lỗi tải homestay:', err));
    }

    const passedCheckin = searchParams.get('checkin') || location.state?.checkin;
    if (passedCheckin) setCheckin(passedCheckin);
    const passedCheckout = searchParams.get('checkout') || location.state?.checkout;
    if (passedCheckout) setCheckout(passedCheckout);
    const passedGuests = searchParams.get('guests') || location.state?.guests;
    if (passedGuests) setGuests(Number(passedGuests));
  }, [searchParams, location.state]);

  // Addons & Discounts
  const [selectedExperiences, setSelectedExperiences] = useState(new Set());
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMsg, setCouponMsg] = useState({ text: '', type: '' });

  // Payment Options
  const [payPlan, setPayPlan] = useState('full'); // 'full' | 'deposit'
  const [payMethod, setPayMethod] = useState('vietqr'); // 'vietqr' | 'momo' | 'zalopay' | 'card'
  const [cardInfo, setCardInfo] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState({});

  // Stepper & Modal State
  const [step, setStep] = useState(1); // 1: Info, 2: Payment, 3: Completed
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payTimer, setPayTimer] = useState(PAY_SESSION_SECONDS);
  const [bookingCode, setBookingCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: '' });

  const timerIntervalRef = useRef(null);

  const showToast = (msg) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: '' }), 2800);
  };

  // Calculate Nights
  const getNights = useCallback(() => {
    if (!checkin || !checkout) return 0;
    const diff = Math.round((new Date(checkout + 'T00:00:00') - new Date(checkin + 'T00:00:00')) / 86400000);
    return diff > 0 ? diff : 0;
  }, [checkin, checkout]);

  const nights = getNights();
  const subtotal = room.price * nights;
  const cleaningFee = nights > 0 ? room.cleaningFee : 0;
  const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE);

  const [appliedVoucherData, setAppliedVoucherData] = useState(null);

  const couponObj = appliedCoupon ? COUPONS[appliedCoupon] : null;
  const discount = nights > 0 ? (
    appliedVoucherData ? Math.min(appliedVoucherData.discountAmount, subtotal) :
    (couponObj ? Math.min(couponObj.calc(subtotal), subtotal) : 0)
  ) : 0;
  const grandTotal = nights > 0 ? Math.max(0, subtotal + cleaningFee + serviceFee - discount) : 0;

  const payNow = payPlan === 'deposit' ? Math.round((grandTotal * DEPOSIT_RATE) / 1000) * 1000 : grandTotal;
  const payLater = grandTotal - payNow;

  // Experiences cost total
  const selectedExpList = EXPERIENCES.filter((x) => selectedExperiences.has(x.id));
  const expTotal = selectedExpList.reduce((sum, x) => {
    if (x.price <= 0) return sum;
    return sum + (x.unit === '/ khách' ? x.price * guests : x.price);
  }, 0);

  // Apply coupon handler (supports both presets and real Neon PostgreSQL vouchers)
  const handleApplyCoupon = async (codeToApply) => {
    const code = (codeToApply || couponInput).trim().toUpperCase();
    if (!code) { setCouponMsg({ text: 'Vui lòng nhập mã giảm giá.', type: 'error' }); return; }

    // 1. Kiểm tra preset coupons
    const c = COUPONS[code];
    if (c) {
      if (c.min && subtotal < c.min) {
        setCouponMsg({ text: `Mã ${code} yêu cầu tiền phòng từ ${fmtVND(c.min)}.`, type: 'error' });
        return;
      }
      if (c.minNights && nights < c.minNights) {
        setCouponMsg({ text: `Mã ${code} yêu cầu ở từ ${c.minNights} đêm.`, type: 'error' });
        return;
      }
      setAppliedVoucherData(null);
      setAppliedCoupon(code);
      setCouponInput(code);
      setCouponMsg({ text: `Đã áp dụng ${code}: ${c.title}.`, type: 'ok' });
      showToast('Đã áp dụng mã giảm giá!');
      return;
    }

    // 2. Kiểm tra voucher thật từ cơ sở dữ liệu PostgreSQL
    try {
      const res = await voucherService.checkVoucher(code);
      if (res && res.valid) {
        if (res.minOrderValue && subtotal < Number(res.minOrderValue)) {
          setCouponMsg({ text: `Mã ${code} yêu cầu đơn phòng từ ${fmtVND(res.minOrderValue)}.`, type: 'error' });
          return;
        }

        let discAmt = 0;
        if (res.discountType === 'PERCENT') {
          discAmt = Math.round((subtotal * Number(res.value)) / 100);
          if (res.maxDiscount && discAmt > Number(res.maxDiscount)) {
            discAmt = Number(res.maxDiscount);
          }
        } else {
          discAmt = Number(res.value || 0);
        }

        setAppliedVoucherData({
          code: res.code,
          discountAmount: discAmt,
          title: `Giảm ${fmtVND(discAmt)}`,
        });
        setAppliedCoupon(code);
        setCouponInput(code);
        setCouponMsg({ text: `Đã áp dụng mã thật ${code}: Giảm ${fmtVND(discAmt)}.`, type: 'ok' });
        showToast(`Đã áp dụng mã ưu đãi ${code}!`);
      } else {
        setCouponMsg({ text: res?.message || 'Mã không hợp lệ hoặc đã hết hạn.', type: 'error' });
      }
    } catch {
      setCouponMsg({ text: 'Lỗi xác thực mã giảm giá. Hãy thử lại.', type: 'error' });
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setAppliedVoucherData(null);
    setCouponInput('');
    setCouponMsg({ text: '', type: '' });
  };

  // Toggle Experience
  const toggleExperience = (id) => {
    setSelectedExperiences((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Validate form
  const validateForm = () => {
    const errs = {};
    if (nights <= 0) errs.trip = 'Ngày trả phòng phải sau ngày nhận phòng ít nhất 1 đêm.';
    if (!fullName.trim() || fullName.trim().length < 2) errs.fullName = 'Vui lòng nhập họ và tên của bạn.';
    if (!/^(0|\+84)(3|5|7|8|9)\d{8}$/.test(phone.replace(/[\s.\-]/g, ''))) errs.phone = 'Số điện thoại chưa đúng. Ví dụ: 0901 234 567.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) errs.email = 'Email chưa đúng. Ví dụ: ban@example.com.';

    if (payMethod === 'card') {
      const digits = cardInfo.number.replace(/\D/g, '');
      if (digits.length < 13 || digits.length > 19) errs.cardNumber = 'Số thẻ không hợp lệ.';
      if (!cardInfo.name.trim()) errs.cardName = 'Vui lòng nhập tên trên thẻ.';
      if (!/^\d{2}\/\d{2}$/.test(cardInfo.expiry)) errs.cardExpiry = 'Ngày hết hạn MM/YY.';
      if (!/^\d{3,4}$/.test(cardInfo.cvv)) errs.cardCvv = 'Mã CVV gồm 3-4 chữ số.';
    }

    if (!agreeTerms) errs.terms = 'Bạn cần đồng ý với nội quy và chính sách hủy phòng để tiếp tục.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Open Payment Modal
  const handleSubmitBooking = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast('Vui lòng điền đầy đủ và đúng các thông tin cần thiết!');
      return;
    }

    const yr = new Date().getFullYear();
    const rnd = Math.floor(1000 + Math.random() * 9000);
    const code = `YEN-${yr}-${rnd}`;
    setBookingCode(code);
    setStep(2);
    setPayModalOpen(true);
    setPayTimer(PAY_SESSION_SECONDS);
  };

  // Countdown timer for modal
  useEffect(() => {
    if (payModalOpen) {
      timerIntervalRef.current = setInterval(() => {
        setPayTimer((t) => (t > 0 ? t - 1 : 0));
      }, 1000);
    } else {
      clearInterval(timerIntervalRef.current);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [payModalOpen]);

  // Handle Confirm Payment
  const handleConfirmPayment = async () => {
    setIsProcessing(true);
    try {
      const realUser = authService.getCurrentUser();
      const hsId = Number(searchParams.get('homestayId') || location.state?.homestayId || homestay.id || room.homestayId || 1);
      const rmId = Number(searchParams.get('roomId') || location.state?.roomId || room.id);

      const bookingPayload = {
        touristId: realUser?.id ? Number(realUser.id) : 21,
        homestayId: hsId,
        roomId: Number.isFinite(rmId) && rmId > 0 ? rmId : null,
        checkInDate: checkin,
        checkOutDate: checkout,
        guestsCount: guests,
        totalPrice: grandTotal,
        discountAmount: discount,
        paymentType: payPlan === 'deposit' ? 'DEPOSIT' : 'FULL',
        depositAmount: payNow,
        remainingAmount: payLater,
        depositStatus: 'PAID',
        status: 'CONFIRMED',
        customerName: fullName,
        customerPhone: phone,
        customerEmail: email,
      };

      let finalCode = bookingCode;
      try {
        const result = await bookingService.createBooking(bookingPayload);
        if (result && result.bookingCode) {
          finalCode = result.bookingCode;
        }
      } catch (err) {
        console.warn('Tạo đặt phòng qua API gặp lỗi, tiếp tục với mã dự phòng:', err);
      }

      const bookingRecord = {
        code: finalCode,
        homestay: homestay.name || DEFAULT_HOMESTAY.name,
        room: {
          name: room.name,
          thumb: room.thumb,
        },
        location: homestay.location || DEFAULT_HOMESTAY.location,
        checkin: checkin,
        checkout: checkout,
        nights: nights,
        guests: guests,
        contact: {
          fullName: fullName,
          phone: phone,
          email: email,
        },
        arrivalTime: arrivalTime,
        experiences: Array.from(selectedExperiences).map((id) => {
          const exp = EXPERIENCES.find((x) => x.id === id);
          return exp ? exp.title : id;
        }),
        note: guestNote,
        pricing: {
          subtotal: subtotal,
          cleaning: cleaningFee,
          service: serviceFee,
          discount: discount,
          total: grandTotal,
          paid: payNow,
          remaining: payLater,
          experienceEstimate: expTotal,
        },
        method: payMethod,
        coupon: appliedCoupon,
      };

      try {
        sessionStorage.setItem('yenLastBooking', JSON.stringify(bookingRecord));
        const list = JSON.parse(localStorage.getItem('yenBookings') || '[]');
        list.unshift(bookingRecord);
        localStorage.setItem('yenBookings', JSON.stringify(list));
      } catch (e) {
        console.error('Save booking error:', e);
      }

      setIsProcessing(false);
      setPayModalOpen(false);
      setStep(3);
      navigate(`/complete-pay?code=${finalCode}`);
    } catch (e) {
      console.error('Lỗi quy trình xác nhận thanh toán:', e);
      setIsProcessing(false);
      showToast('Có lỗi xảy ra, vui lòng thử lại!');
    }
  };

  const copyToClipboard = (text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
      showToast(`Đã sao chép: ${text}`);
    }
  };

  return (
    <div className="bk-page">
      {/* ── STEPPER TOPBAR ── */}
      <section className="bk-top">
        <div className="bk-container">
          <Link to="/homestay/doi" className="bk-back">
            <i className="bi bi-chevron-left" /> Quay lại homestay
          </Link>
          <div className="bk-top-row">
            <h1 className="bk-title">Xác nhận và thanh toán</h1>
            <div className="bk-steps">
              <div className={`bk-step ${step === 1 ? 'is-active' : ''} ${step > 1 ? 'is-done' : ''}`}>
                <span className="bk-step-num">{step > 1 ? '' : '1'}</span>
                <span className="bk-step-label">Thông tin đặt phòng</span>
              </div>
              <span className="bk-step-line" />
              <div className={`bk-step ${step === 2 ? 'is-active' : ''} ${step > 2 ? 'is-done' : ''}`}>
                <span className="bk-step-num">{step > 2 ? '' : '2'}</span>
                <span className="bk-step-label">Thanh toán</span>
              </div>
              <span className="bk-step-line" />
              <div className={`bk-step ${step === 3 ? 'is-active' : ''}`}>
                <span className="bk-step-num">3</span>
                <span className="bk-step-label">Hoàn tất</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STEP 3: SUCCESS VIEW ── */}
      {step === 3 ? (
        <section className="bk-body">
          <div className="bk-container" style={{ maxWidth: 640 }}>
            <div className="bk-success-card">
              <div className="bk-success-icon"><i className="bi bi-check-lg" /></div>
              <h2>Đặt phòng thành công!</h2>
              <p>Cảm ơn bạn <b>{fullName}</b>! Đơn đặt phòng tại <b>{room.name}</b> đã được xác nhận. Mã đặt phòng của bạn là:</p>
              <div className="bk-success-code">{bookingCode}</div>
              <p className="bk-hint" style={{ marginBottom: 24 }}>
                Thông tin nhận phòng & mã số mở cửa đã được gửi đến email <b>{email}</b> và SĐT <b>{phone}</b>.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <Link to="/" className="yn-btn yn-btn--primary">Trở về Trang chủ</Link>
                <button type="button" className="yn-btn yn-btn--outline" onClick={() => window.print()}>
                  <i className="bi bi-printer" /> In xác nhận
                </button>
              </div>
            </div>
          </div>
        </section>
      ) : (
        /* ── STEP 1 & 2: MAIN FORM & SUMMARY ── */
        <section className="bk-body">
          <div className="bk-container bk-grid">

            {/* FORM COLUMN */}
            <form className="bk-main" onSubmit={handleSubmitBooking}>

              {/* 1. Trip details */}
              <section className="bk-card">
                <div className="bk-card-head">
                  <span className="bk-card-icon"><i className="bi bi-calendar2-check" /></span>
                  <div>
                    <h2>Chuyến đi của bạn</h2>
                    <p>Kiểm tra lại ngày ở và số khách trước khi thanh toán.</p>
                  </div>
                </div>
                <div className="bk-trip-grid">
                  <div className={`bk-field ${errors.trip ? 'has-error' : ''}`}>
                    <label htmlFor="checkin">Nhận phòng</label>
                    <input type="date" id="checkin" value={checkin} min={todayStr}
                      onChange={(e) => setCheckin(e.target.value)} required />
                    <p className="bk-hint">Từ 14:00 đến 21:00</p>
                  </div>
                  <div className={`bk-field ${errors.trip ? 'has-error' : ''}`}>
                    <label htmlFor="checkout">Trả phòng</label>
                    <input type="date" id="checkout" value={checkout} min={checkin}
                      onChange={(e) => setCheckout(e.target.value)} required />
                    <p className="bk-hint">Trước 12:00</p>
                  </div>
                  <div className="bk-field bk-field--full">
                    <label htmlFor="guests">Số khách</label>
                    <select id="guests" value={guests} onChange={(e) => setGuests(Number(e.target.value))}>
                      {Array.from({ length: room.maxGuests }, (_, i) => i + 1).map((g) => (
                        <option key={g} value={g}>{g} khách</option>
                      ))}
                    </select>
                    <p className="bk-hint">Phòng này nhận tối đa {room.maxGuests} khách.</p>
                  </div>
                </div>
                {errors.trip && <p className="bk-error bk-error--block">{errors.trip}</p>}
              </section>

              {/* 2. Contact Info */}
              <section className="bk-card">
                <div className="bk-card-head">
                  <span className="bk-card-icon"><i className="bi bi-person-lines-fill" /></span>
                  <div>
                    <h2>Thông tin liên hệ</h2>
                    <p>Chủ nhà dùng thông tin này để gửi mã mở khóa và xác nhận đặt phòng.</p>
                  </div>
                </div>
                <div className="bk-form-grid">
                  <div className={`bk-field bk-field--full ${errors.fullName ? 'has-error' : ''}`}>
                    <label htmlFor="fullName">Họ và tên</label>
                    <input type="text" id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nguyễn Văn An" />
                    {errors.fullName && <p className="bk-error">{errors.fullName}</p>}
                  </div>
                  <div className={`bk-field ${errors.phone ? 'has-error' : ''}`}>
                    <label htmlFor="phone">Số điện thoại</label>
                    <input type="tel" id="phone" value={phone} onChange={(e) => setPhone(e.target.value)}
                      placeholder="0901 234 567" />
                    {errors.phone && <p className="bk-error">{errors.phone}</p>}
                  </div>
                  <div className={`bk-field ${errors.email ? 'has-error' : ''}`}>
                    <label htmlFor="email">Email</label>
                    <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="ban@example.com" />
                    {errors.email && <p className="bk-error">{errors.email}</p>}
                  </div>
                  <div className="bk-field bk-field--full">
                    <label htmlFor="arrivalTime">Giờ dự kiến đến</label>
                    <select id="arrivalTime" value={arrivalTime} onChange={(e) => setArrivalTime(e.target.value)}>
                      <option value="">Chưa chắc, tôi sẽ nhắn chủ nhà sau</option>
                      <option value="14:00 - 16:00">14:00 - 16:00</option>
                      <option value="16:00 - 18:00">16:00 - 18:00</option>
                      <option value="18:00 - 21:00">18:00 - 21:00</option>
                    </select>
                  </div>
                  <div className="bk-field bk-field--full">
                    <label htmlFor="guestNote">Lời nhắn cho chủ nhà <span className="bk-optional">(không bắt buộc)</span></label>
                    <textarea id="guestNote" rows="3" value={guestNote} onChange={(e) => setGuestNote(e.target.value)}
                      placeholder="Ví dụ: đi cùng bé 3 tuổi, cần thêm ghế ăn; kỷ niệm ngày cưới..." />
                  </div>
                </div>
              </section>

              {/* 3. Experiences */}
              <section className="bk-card">
                <div className="bk-card-head">
                  <span className="bk-card-icon"><i className="bi bi-stars" /></span>
                  <div>
                    <h2>Trải nghiệm muốn tham gia</h2>
                    <p>Chọn trước để chủ nhà chuẩn bị. Khoản này tính riêng và trả trực tiếp tại homestay.</p>
                  </div>
                </div>
                <div className="bk-xp-list">
                  {EXPERIENCES.map((x) => {
                    const isChecked = selectedExperiences.has(x.id);
                    return (
                      <label key={x.id} className={`bk-xp ${isChecked ? 'checked' : ''}`} onClick={() => toggleExperience(x.id)}>
                        <span className="bk-xp-box"><i className="bi bi-check-lg" /></span>
                        <span className="bk-xp-body"><b>{x.title}</b><small>{x.note}</small></span>
                        <span className={`bk-xp-price ${x.price === 0 ? 'is-free' : ''}`}>
                          {x.price > 0 ? `${fmtVND(x.price)} ${x.unit}` : 'Miễn phí'}
                        </span>
                      </label>
                    );
                  })}
                </div>
                {selectedExpList.length > 0 && expTotal > 0 && (
                  <div className="bk-xp-total">
                    <span>Dự kiến trả thêm tại homestay</span>
                    <b>{fmtVND(expTotal)}</b>
                  </div>
                )}
              </section>

              {/* 4. Coupons & Vouchers */}
              <section className="bk-card">
                <div className="bk-card-head">
                  <span className="bk-card-icon"><i className="bi bi-ticket-perforated" /></span>
                  <div>
                    <h2>Mã giảm giá</h2>
                    <p>Nhập mã của bạn hoặc chọn voucher trong túi.</p>
                  </div>
                </div>

                <h3 className="bk-subtitle">Nhập mã thủ công</h3>
                <div className="bk-coupon-row">
                  <input type="text" value={couponInput} onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Nhập mã giảm giá (ví dụ: YEN10)" maxLength="20" />
                  {!appliedCoupon ? (
                    <button type="button" className="yn-btn yn-btn--outline" onClick={() => handleApplyCoupon()}>Áp dụng</button>
                  ) : (
                    <button type="button" className="yn-btn yn-btn--ghost" onClick={handleRemoveCoupon}>Bỏ mã</button>
                  )}
                </div>
                {couponMsg.text && (
                  <p className={`bk-coupon-msg ${couponMsg.type === 'ok' ? 'is-ok' : 'is-error'}`}>{couponMsg.text}</p>
                )}

                <div className="bk-voucher-head">
                  <h3 className="bk-subtitle"><i className="bi bi-wallet2" /> Voucher trong túi của bạn</h3>
                  <span className="bk-voucher-count">3 voucher sẵn có</span>
                </div>
                <div className="bk-voucher-list">
                  {Object.values(COUPONS).filter((c) => c.wallet).map((c) => {
                    const isSelected = appliedCoupon === c.code;
                    return (
                      <button key={c.code} type="button" className={`bk-voucher ${isSelected ? 'is-selected' : ''}`}
                        onClick={() => isSelected ? handleRemoveCoupon() : handleApplyCoupon(c.code)}>
                        <span className="bk-voucher-badge">{c.badge}</span>
                        <span className="bk-voucher-body">
                          <b>{c.title} {c.code === 'YEN10' && <em className="bk-voucher-best">Tiết kiệm nhất</em>}</b>
                          <small>{c.desc}</small>
                          <small>Mã {c.code}</small>
                        </span>
                        <span className="bk-voucher-side">
                          <span className="bk-voucher-save">Giảm {c.code === 'YEN10' ? fmtVND(subtotal * 0.1) : '100.000đ'}</span>
                          <span className="bk-voucher-radio" />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* 5. Payment Selection */}
              <section className="bk-card">
                <div className="bk-card-head">
                  <span className="bk-card-icon"><i className="bi bi-wallet2" /></span>
                  <div>
                    <h2>Thanh toán</h2>
                    <p>Chọn số tiền thanh toán ngay và phương thức bạn muốn dùng.</p>
                  </div>
                </div>

                <h3 className="bk-subtitle">Bạn muốn trả bao nhiêu bây giờ?</h3>
                <div className="bk-options">
                  <label className={`bk-option ${payPlan === 'full' ? 'checked' : ''}`} onClick={() => setPayPlan('full')}>
                    <span className="bk-option-radio" />
                    <span className="bk-option-body">
                      <span className="bk-option-title">Trả toàn bộ</span>
                      <span className="bk-option-sub">Xong một lần, không phải trả thêm khi nhận phòng.</span>
                    </span>
                    <b className="bk-option-amount">{fmtVND(grandTotal)}</b>
                  </label>
                  <label className={`bk-option ${payPlan === 'deposit' ? 'checked' : ''}`} onClick={() => setPayPlan('deposit')}>
                    <span className="bk-option-radio" />
                    <span className="bk-option-body">
                      <span className="bk-option-title">Đặt cọc 30%</span>
                      <span className="bk-option-sub">Trả trước 30%, phần còn lại trả khi nhận phòng.</span>
                    </span>
                    <b className="bk-option-amount">{fmtVND(Math.round((grandTotal * DEPOSIT_RATE) / 1000) * 1000)}</b>
                  </label>
                </div>

                <h3 className="bk-subtitle">Phương thức thanh toán</h3>
                <div className="bk-options">
                  <label className={`bk-option ${payMethod === 'vietqr' ? 'checked' : ''}`} onClick={() => setPayMethod('vietqr')}>
                    <span className="bk-option-radio" />
                    <span className="bk-method-icon bk-method-icon--qr"><i className="bi bi-qr-code-scan" /></span>
                    <span className="bk-option-body">
                      <span className="bk-option-title">Chuyển khoản QR (VietQR)</span>
                      <span className="bk-option-sub">Quét bằng app của bất kỳ ngân hàng nào.</span>
                    </span>
                  </label>
                  <label className={`bk-option ${payMethod === 'momo' ? 'checked' : ''}`} onClick={() => setPayMethod('momo')}>
                    <span className="bk-option-radio" />
                    <span className="bk-method-icon bk-method-icon--momo"><i className="bi bi-phone" /></span>
                    <span className="bk-option-body">
                      <span className="bk-option-title">Ví MoMo</span>
                      <span className="bk-option-sub">Quét mã hoặc mở ứng dụng MoMo.</span>
                    </span>
                  </label>
                  <label className={`bk-option ${payMethod === 'zalopay' ? 'checked' : ''}`} onClick={() => setPayMethod('zalopay')}>
                    <span className="bk-option-radio" />
                    <span className="bk-method-icon bk-method-icon--zalo"><i className="bi bi-phone" /></span>
                    <span className="bk-option-body">
                      <span className="bk-option-title">Ví ZaloPay</span>
                      <span className="bk-option-sub">Thanh toán nhanh qua ví ZaloPay.</span>
                    </span>
                  </label>
                  <label className={`bk-option ${payMethod === 'card' ? 'checked' : ''}`} onClick={() => setPayMethod('card')}>
                    <span className="bk-option-radio" />
                    <span className="bk-method-icon bk-method-icon--card"><i className="bi bi-credit-card-2-front" /></span>
                    <span className="bk-option-body">
                      <span className="bk-option-title">Thẻ ATM nội địa, Visa, Mastercard</span>
                      <span className="bk-option-sub">Thanh toán bằng thẻ ngân hàng.</span>
                    </span>
                  </label>
                </div>

                {payMethod === 'card' && (
                  <div className="bk-card-form">
                    <div className="bk-form-grid">
                      <div className={`bk-field bk-field--full ${errors.cardNumber ? 'has-error' : ''}`}>
                        <label htmlFor="cardNumber">Số thẻ</label>
                        <input type="text" id="cardNumber" placeholder="1234 5678 9012 3456" maxLength="19"
                          value={cardInfo.number} onChange={(e) => setCardInfo({ ...cardInfo, number: e.target.value })} />
                      </div>
                      <div className={`bk-field bk-field--full ${errors.cardName ? 'has-error' : ''}`}>
                        <label htmlFor="cardName">Tên in trên thẻ</label>
                        <input type="text" id="cardName" placeholder="NGUYEN VAN AN"
                          value={cardInfo.name} onChange={(e) => setCardInfo({ ...cardInfo, name: e.target.value.toUpperCase() })} />
                      </div>
                      <div className={`bk-field ${errors.cardExpiry ? 'has-error' : ''}`}>
                        <label htmlFor="cardExpiry">Ngày hết hạn</label>
                        <input type="text" id="cardExpiry" placeholder="MM/YY" maxLength="5"
                          value={cardInfo.expiry} onChange={(e) => setCardInfo({ ...cardInfo, expiry: e.target.value })} />
                      </div>
                      <div className={`bk-field ${errors.cardCvv ? 'has-error' : ''}`}>
                        <label htmlFor="cardCvv">Mã CVV</label>
                        <input type="password" id="cardCvv" placeholder="•••" maxLength="4"
                          value={cardInfo.cvv} onChange={(e) => setCardInfo({ ...cardInfo, cvv: e.target.value })} />
                      </div>
                    </div>
                  </div>
                )}
                <p className="bk-secure"><i className="bi bi-lock-fill" /> Thông tin thanh toán được mã hóa an toàn 256-bit.</p>
              </section>

              {/* 6. Policy & Agreement */}
              <section className="bk-card">
                <div className="bk-card-head">
                  <span className="bk-card-icon"><i className="bi bi-shield-check" /></span>
                  <div>
                    <h2>Chính sách hủy phòng</h2>
                    <p>Áp dụng cho đặt phòng này tại {homestay.name}.</p>
                  </div>
                </div>
                <ul className="bk-policy">
                  <li><i className="bi bi-check-circle-fill" /><span>Miễn phí hủy trong <b>48 giờ</b> sau khi đặt phòng.</span></li>
                  <li><i className="bi bi-arrow-counterclockwise" /><span>Hoàn 50% nếu hủy trước <b>5 ngày</b> nhận phòng.</span></li>
                  <li className="is-muted"><i className="bi bi-slash-circle" /><span>Nội quy: Nhận phòng 14:00 - 21:00, trả phòng trước 12:00. Không tổ chức tiệc đêm.</span></li>
                </ul>

                <label className={`bk-check ${agreeTerms ? 'checked' : ''}`} onClick={() => setAgreeTerms(!agreeTerms)}>
                  <span className="bk-check-box"><i className="bi bi-check-lg" /></span>
                  <span>Tôi đã đọc và đồng ý với nội quy nhà, chính sách hủy phòng và điều khoản dịch vụ của YÊN.</span>
                </label>
                {errors.terms && <p className="bk-error bk-error--block">{errors.terms}</p>}
              </section>
            </form>

            {/* SIDEBAR SUMMARY COLUMN */}
            <aside className="bk-side">
              <div className="bk-summary">
                <div className="bk-sum-room">
                  <img src={room.thumb} alt={room.name} />
                  <div>
                    <span className="bk-sum-homestay">{homestay.name}</span>
                    <h3>{room.name}</h3>
                    <span className="bk-sum-rating">
                      <i className="bi bi-star-fill" /> {Number(homestay.rating || 5).toFixed(1)} ({homestay.reviewCount || 0} đánh giá)
                    </span>
                  </div>
                </div>

                <div className="bk-sum-trip">
                  <div><span>Nhận phòng</span><b>{checkin} (từ 14:00)</b></div>
                  <div><span>Trả phòng</span><b>{checkout} (trước 12:00)</b></div>
                  <div><span>Khách & số đêm</span><b>{guests} khách · {nights} đêm</b></div>
                </div>

                <div className="bk-breakdown">
                  <h4>Chi tiết giá tiền</h4>
                  <div className="bk-row"><span>{fmtVND(room.price)} x {nights} đêm</span><span>{fmtVND(subtotal)}</span></div>
                  <div className="bk-row"><span>Phí vệ sinh</span><span>{fmtVND(cleaningFee)}</span></div>
                  <div className="bk-row"><span>Phí dịch vụ YÊN</span><span>{fmtVND(serviceFee)}</span></div>
                  {discount > 0 && (
                    <div className="bk-row bk-row--discount">
                      <span>Mã giảm giá ({appliedCoupon})</span><span>-{fmtVND(discount)}</span>
                    </div>
                  )}
                  <div className="bk-divider" />
                  <div className="bk-row bk-row--total"><span>Tổng cộng</span><span>{fmtVND(grandTotal)}</span></div>
                </div>

                <div className="bk-due">
                  <div className="bk-row bk-row--due">
                    <span>Thanh toán bây giờ</span>
                    <b>{fmtVND(payNow)}</b>
                  </div>
                  {payLater > 0 && (
                    <div className="bk-row bk-row--later">
                      <span>Trả khi nhận phòng</span><span>{fmtVND(payLater)}</span>
                    </div>
                  )}
                </div>

                <button type="button" className="yn-btn yn-btn--primary yn-btn--lg yn-btn--block" onClick={handleSubmitBooking}>
                  <i className="bi bi-lock-fill" /> Xác nhận & thanh toán {fmtVND(payNow)}
                </button>
                <p className="bk-sum-note">
                  <i className="bi bi-check2-circle" /> Miễn phí hủy trong 48 giờ sau khi đặt.
                </p>
              </div>
            </aside>

          </div>
        </section>
      )}

      {/* ── PAYMENT MODAL POPUP ── */}
      <div className={`bk-modal-overlay ${payModalOpen ? 'active' : ''}`}>
        <div className="bk-modal">
          <div className="bk-modal-head">
            <h3>Thanh toán qua {payMethod.toUpperCase()}</h3>
            <button type="button" className="yn-btn yn-btn--ghost yn-btn--icon" onClick={() => setPayModalOpen(false)}>
              <i className="bi bi-x-lg" />
            </button>
          </div>

          <div className="bk-modal-body">
            <div className="pay-amount">
              <span>{payLater > 0 ? 'Số tiền đặt cọc cần thanh toán' : 'Số tiền cần thanh toán'}</span>
              <b>{fmtVND(payNow)}</b>
            </div>

            <div className={`pay-timer ${payTimer < 180 ? 'is-urgent' : ''}`}>
              <i className="bi bi-clock-history" /> Phiên thanh toán còn: <b>{pad(Math.floor(payTimer / 60))}:{pad(payTimer % 60)}</b>
            </div>

            {payMethod !== 'card' ? (
              <div className="pay-qr-wrap">
                <div className="pay-qr" dangerouslySetInnerHTML={{ __html: qrSvgSvg(bookingCode + payMethod, '#15803D') }} />
                <p className="pay-qr-caption">Quét mã bằng App Ngân hàng hoặc Ví điện tử</p>
                <ol className="pay-steps">
                  <li>Mở ứng dụng ngân hàng/ví điện tử của bạn.</li>
                  <li>Chọn "Quét mã QR" và chuyển đúng số tiền <b>{fmtVND(payNow)}</b>.</li>
                  <li>Nội dung chuyển khoản: <b>{bookingCode.replace('-', '')}</b>.</li>
                </ol>

                <dl className="pay-bank">
                  <div><dt>Ngân hàng</dt><dd>{BANK_INFO.bank}</dd></div>
                  <div>
                    <dt>Số tài khoản</dt>
                    <dd>
                      {BANK_INFO.account}
                      <button type="button" className="pay-copy" onClick={() => copyToClipboard(BANK_INFO.account)}>
                        <i className="bi bi-copy" />
                      </button>
                    </dd>
                  </div>
                  <div><dt>Chủ tài khoản</dt><dd>{BANK_INFO.holder}</dd></div>
                </dl>
              </div>
            ) : (
              <div>
                <div className="pay-card-preview">
                  <i className="bi bi-credit-card-2-front" />
                  <div>
                    <b>•••• •••• •••• {cardInfo.number.slice(-4) || '3456'}</b>
                    <span>{cardInfo.name || 'NGUYEN VAN AN'}</span>
                  </div>
                </div>
                <p className="pay-card-note">Hệ thống đang sẵn sàng gửi yêu cầu xác thực OTP từ ngân hàng phát hành thẻ của bạn.</p>
              </div>
            )}

            <p className="pay-demo-note"><i className="bi bi-info-circle" /> Giao diện demo: sau khi bấm "Tôi đã thanh toán", hệ thống sẽ tự động xác nhận đơn thành công.</p>
          </div>

          <div className="bk-modal-foot">
            <button type="button" className="yn-btn yn-btn--ghost" onClick={() => setPayModalOpen(false)}>Quay lại</button>
            <button type="button" className="yn-btn yn-btn--primary" onClick={handleConfirmPayment}>
              Tôi đã thanh toán
            </button>
          </div>

          {isProcessing && (
            <div className="bk-processing">
              <span className="bk-spinner" />
              <p>Đang xác nhận giao dịch thanh toán...</p>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notice */}
      <div className={`toast-notice ${toast.show ? 'show' : ''}`}>
        <i className="bi bi-check-circle-fill" />
        <span>{toast.msg}</span>
      </div>
    </div>
  );
}
