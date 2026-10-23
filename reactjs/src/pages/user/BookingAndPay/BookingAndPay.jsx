import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { authService } from '../../../services/authService';
import { bookingService } from '../../../services/bookingService';
import { voucherService } from '../../../services/voucherService';
import { ownerService } from '../../../services/ownerService';
import { cashbackService } from '../../../services/cashbackService';
import { getVietQRUrl, VIETQR_MERCHANT, vnpayService } from '../../../services/vnpayService';
import { SAMPLE_HOMESTAYS } from '../../../data/sampleHomestays';
import './BookingAndPay.css';

const SERVICE_FEE_RATE = 0.05;
const DEPOSIT_RATE = 0.3;
const PAY_SESSION_SECONDS = 15 * 60;

const fmtVND = (n) => Math.round(n).toLocaleString('vi-VN') + 'đ';
const pad = (n) => String(n).padStart(2, '0');
const toInputDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const DEFAULT_HOMESTAY = {
  id: 1,
  name: 'Nông Trại Rau Xuân Thọ',
  location: 'Thôn Xuân Thọ, Xã Xuân Thọ, Đà Lạt, Lâm Đồng',
  rating: 5.0,
  reviewCount: 1,
};

const ROOM_CATALOG = {
  doi: {
    id: 1, name: 'Phòng Suite Gia Đình', price: 3250000, cleaningFee: 100000, maxGuests: 4,
    thumb: 'https://tse2.mm.bing.net/th/id/OIP.t3dEkB2w1YoeR9Vst--1XgHaFj?r=0&pid=Api&h=220&P=0'
  },
  giadinh: {
    id: 6, name: 'Phòng Đôi View Núi', price: 1870000, cleaningFee: 100000, maxGuests: 3,
    thumb: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ-vssY_FI1Dj4a3N5b8s_tL7-r_pUgBce2Fa5DnhKObg&s=10'
  },
  villa: {
    id: 1, name: 'Phòng Suite Gia Đình', price: 3250000, cleaningFee: 100000, maxGuests: 4,
    thumb: 'https://tse2.mm.bing.net/th/id/OIP.t3dEkB2w1YoeR9Vst--1XgHaFj?r=0&pid=Api&h=220&P=0'
  }
};

// Dữ liệu trải nghiệm mặc định (fallback) khi chưa tải được từ CSDL
const FALLBACK_EXPERIENCES = [
  { id: 'sanmay', title: 'Săn mây bình minh trên đồi thông', price: 0, unit: '', note: 'Không cần đặt trước' },
  { id: 'trekking', title: 'Đi bộ xuyên rừng thông', price: 100000, unit: '/ nhóm', note: '2 giờ · đặt trước 1 ngày' },
  { id: 'hairau', title: 'Hái rau, dâu tại vườn nhà', price: 60000, unit: '/ khách', note: '60 phút · đặt trước 1 ngày' },
  { id: 'nongtrai', title: 'Cho gà, thỏ ăn & chơi vườn cùng bé', price: 0, unit: '', note: 'Gia đình có trẻ nhỏ' },
  { id: 'naucom', title: 'Học nấu bữa cơm quê cùng chủ nhà', price: 180000, unit: '/ khách', note: '2 giờ · đặt trước 1 ngày' },
  { id: 'tradacphe', title: 'Trà atiso & cà phê rang xay buổi sáng', price: 0, unit: '', note: 'Ly đầu miễn phí' },
  { id: 'luatrai', title: 'Lửa trại & nướng BBQ đêm đồi thông', price: 250000, unit: '/ nhóm', note: '2 giờ · đặt trước 1 ngày' },
  { id: 'bontam', title: 'Ngâm bồn tắm gỗ ngắm mây, ngắm sao', price: 0, unit: '', note: 'Hẹn giờ với chủ nhà' }
];

// Chuyển đổi dịch vụ từ DB sang định dạng trải nghiệm để hiển thị
function mapServiceToExperience(svc) {
  const priceNum = Number(svc.price || 0);
  const unit = svc.unit || (priceNum > 0 ? '/ khách' : '');
  return {
    id: String(svc.id || svc.name),
    title: svc.name || 'Dịch vụ trải nghiệm',
    price: priceNum,
    unit: unit,
    note: svc.description || '',
  };
}

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

const normalizePhone = (raw) => {
  if (!raw) return '';
  let cleaned = String(raw).trim().replace(/[\s.\-]/g, '');
  // Nếu có 9 chữ số bắt đầu bằng 3, 5, 7, 8, 9 (SĐT Việt Nam thiếu số 0 đầu như trong CSDL)
  if (/^[35789]\d{8}$/.test(cleaned)) {
    cleaned = '0' + cleaned;
  }
  // Nếu bắt đầu bằng +84, đổi thành 0
  if (/^\+84([35789]\d{8})$/.test(cleaned)) {
    cleaned = '0' + RegExp.$1;
  }
  return cleaned;
};

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

  // Dữ liệu trải nghiệm lấy từ CSDL
  const [dbExperiences, setDbExperiences] = useState(FALLBACK_EXPERIENCES);
  const [loadingExperiences, setLoadingExperiences] = useState(false);

  // Form Contact
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [guestNote, setGuestNote] = useState('');

  // Tự động điền thông tin tài khoản đang đăng nhập hoặc khôi phục draft sau khi đăng nhập
  useEffect(() => {
    // 1. Điền thông tin người dùng từ tài khoản đăng nhập trước
    const user = authService.getCurrentUser();
    if (user) {
      if (user.fullName) setFullName(user.fullName);
      const userPhone = normalizePhone(user.phoneNumber || user.phone);
      if (userPhone) setPhone(userPhone);
      if (user.email) setEmail(user.email);
    }

    // 2. Khôi phục draft nếu người dùng vừa đăng nhập quay lại (ưu tiên thông tin người dùng vừa nhập)
    try {
      const savedDraft = sessionStorage.getItem('yenBookingDraft');
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        if (draft.checkin) setCheckin(draft.checkin);
        if (draft.checkout) setCheckout(draft.checkout);
        if (draft.guests) setGuests(draft.guests);
        if (draft.fullName) setFullName(draft.fullName);
        if (draft.phone) setPhone(normalizePhone(draft.phone));
        if (draft.email) setEmail(draft.email);
        if (draft.arrivalTime) setArrivalTime(draft.arrivalTime);
        if (draft.guestNote) setGuestNote(draft.guestNote);
        if (Array.isArray(draft.selectedExperiences)) setSelectedExperiences(draft.selectedExperiences);
        if (draft.payPlan) setPayPlan(draft.payPlan);
        if (draft.payMethod) setPayMethod(draft.payMethod);
        if (draft.agreeTerms !== undefined) setAgreeTerms(draft.agreeTerms);
        if (draft.appliedCoupon) setAppliedCoupon(draft.appliedCoupon);
        if (draft.couponInput) setCouponInput(draft.couponInput);
        sessionStorage.removeItem('yenBookingDraft');
      }
    } catch (e) {
      console.warn('Lỗi đọc booking draft:', e);
    }
  }, []);

  // Đọc thông tin phòng & homestay từ state hoặc URL searchParams
  useEffect(() => {
    const passedRoomId = searchParams.get('roomId') || location.state?.roomId;
    const passedHomestayId = searchParams.get('homestayId') || location.state?.homestayId;

    // 1. Tìm trong SAMPLE_HOMESTAYS nếu ID dạng chuỗi hoặc có sẵn trong dữ liệu mẫu
    let sampleH = null;
    let sampleR = null;

    if (passedHomestayId) {
      sampleH = SAMPLE_HOMESTAYS.find(
        (h) => String(h.id) === String(passedHomestayId) || h.name?.toLowerCase() === decodeURIComponent(passedHomestayId).toLowerCase()
      );
    }

    if (passedRoomId) {
      if (sampleH && sampleH.rooms) {
        sampleR = sampleH.rooms.find((r) => String(r.id) === String(passedRoomId));
      }
      if (!sampleR) {
        sampleR = SAMPLE_HOMESTAYS.flatMap((h) => h.rooms || []).find((r) => String(r.id) === String(passedRoomId));
        if (sampleR && !sampleH) {
          sampleH = SAMPLE_HOMESTAYS.find((h) => h.rooms && h.rooms.some((r) => String(r.id) === String(passedRoomId)));
        }
      }
    }

    // Set Homestay
    if (location.state?.homestay) {
      const h = location.state.homestay;
      setHomestay({
        id: h.id,
        name: h.name,
        location: h.location || h.address || h.city || 'Việt Nam',
        rating: h.rating || 5.0,
        reviewCount: h.reviewCount || h.reviews || 0,
      });
    } else if (sampleH) {
      setHomestay({
        id: sampleH.id,
        name: sampleH.name,
        location: sampleH.location || sampleH.address || sampleH.city || 'Việt Nam',
        rating: sampleH.rating || 5.0,
        reviewCount: sampleH.reviewCount || sampleH.reviews || 0,
      });
    } else if (passedHomestayId && !isNaN(Number(passedHomestayId))) {
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
            if (!passedRoomId && !location.state?.room && hData.rooms && hData.rooms.length > 0) {
              const r = hData.rooms[0];
              setRoom({
                id: r.id,
                name: r.name || r.roomName || 'Phòng nghỉ',
                price: Number(r.price || r.pricePerNight || 890000),
                cleaningFee: Number(r.cleaningFee || 100000),
                maxGuests: r.specs?.guests || r.capacity || 2,
                thumb: r.thumb || r.primaryImage || r.gallery?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=400&q=80',
                homestayId: r.homestayId || hData.id,
              });
            }
          }
        })
        .catch((err) => console.error('Lỗi tải homestay:', err));
    } else if (!location.state?.room && !passedRoomId && !passedHomestayId) {
      // Khi không có tham số nào, tải homestay 1 & phòng 1 từ CSDL thật
      fetch('http://localhost:8081/api/public/homestays/1')
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
            if (hData.rooms && hData.rooms.length > 0) {
              const r = hData.rooms[0];
              setRoom({
                id: r.id,
                name: r.name || r.roomName || 'Phòng nghỉ',
                price: Number(r.price || r.pricePerNight || 890000),
                cleaningFee: Number(r.cleaningFee || 100000),
                maxGuests: r.specs?.guests || r.capacity || 2,
                thumb: r.thumb || r.primaryImage || r.gallery?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=400&q=80',
                homestayId: r.homestayId || hData.id,
              });
            }
          }
        })
        .catch((err) => console.error('Lỗi nạp homestay mặc định từ CSDL:', err));
    }

    // Set Room
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
    } else if (sampleR) {
      setRoom({
        id: sampleR.id,
        name: sampleR.name || sampleR.roomName || 'Phòng nghỉ',
        price: Number(sampleR.price || sampleR.pricePerNight || 890000),
        cleaningFee: Number(sampleR.cleaningFee || 80000),
        maxGuests: sampleR.specs?.guests || sampleR.capacity || sampleR.maxGuests || 2,
        thumb: sampleR.thumb || sampleR.primaryImage || sampleR.gallery?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=400&q=80',
        homestayId: sampleR.homestayId || sampleH?.id,
      });
    } else if (passedRoomId && ROOM_CATALOG[passedRoomId]) {
      setRoom(ROOM_CATALOG[passedRoomId]);
    } else if (passedRoomId && !isNaN(Number(passedRoomId))) {
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

    const passedCheckin = searchParams.get('checkin') || location.state?.checkin;
    if (passedCheckin) setCheckin(passedCheckin);
    const passedCheckout = searchParams.get('checkout') || location.state?.checkout;
    if (passedCheckout) setCheckout(passedCheckout);
    const passedGuests = searchParams.get('guests') || location.state?.guests;
    if (passedGuests) setGuests(Number(passedGuests));
  }, [searchParams, location.state]);

  // Load dữ liệu trải nghiệm từ CSDL khi homestayId thay đổi
  useEffect(() => {
    const rawHs = searchParams.get('homestayId') || location.state?.homestayId || homestay?.id;
    const hsId = !isNaN(Number(rawHs)) && Number(rawHs) > 0 ? Number(rawHs) : 1;
    let isMounted = true;
    setLoadingExperiences(true);
    ownerService.getServices(hsId)
      .then((data) => {
        if (!isMounted) return;
        if (Array.isArray(data) && data.length > 0) {
          // Lọc các dịch vụ đang hoạt động
          const mapped = data
            .filter((s) => {
              const status = (s.status || '').toUpperCase();
              if (status === 'INACTIVE' || status === 'SUSPENDED') return false;
              return true;
            })
            .map(mapServiceToExperience);
          if (mapped.length > 0) {
            setDbExperiences(mapped);
          }
        }
        setLoadingExperiences(false);
      })
      .catch(() => {
        if (isMounted) setLoadingExperiences(false);
      });
    return () => { isMounted = false; };
  }, [searchParams, location.state, homestay?.id]);

  // Addons & Discounts
  const [selectedExperiences, setSelectedExperiences] = useState([]);
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMsg, setCouponMsg] = useState({ text: '', type: '' });
  const [dbVouchers, setDbVouchers] = useState([]);

  // Điểm tích lũy & Ví hoàn tiền YÊN
  const [walletBalance, setWalletBalance] = useState(250000);
  const [useWalletPoints, setUseWalletPoints] = useState(true);
  const [customPoints, setCustomPoints] = useState(null);

  useEffect(() => {
    const user = authService.getCurrentUser();
    const uid = user?.id || 21;
    cashbackService.getWallet(uid).then((res) => {
      if (res && res.success && res.data && res.data.balance !== undefined) {
        const bal = Number(res.data.balance);
        setWalletBalance(bal > 0 ? bal : 250000);
      } else {
        setWalletBalance(250000);
      }
    }).catch(() => {
      setWalletBalance(250000);
    });
  }, []);

  useEffect(() => {
    voucherService.getAllVouchers().then((list) => {
      if (Array.isArray(list) && list.length > 0) {
        setDbVouchers(list);
      }
    }).catch(() => {});
  }, []);

  const displayedVouchers = useMemo(() => {
    if (dbVouchers.length > 0) {
      const currentHsId = homestay?.id;
      const sorted = [...dbVouchers].sort((a, b) => {
        if (a.homestayId === currentHsId && b.homestayId !== currentHsId) return -1;
        if (b.homestayId === currentHsId && a.homestayId !== currentHsId) return 1;
        return 0;
      });
      return sorted.slice(0, 5).map((v) => ({
        code: v.code,
        title: v.homestayName ? `Ưu đãi ${v.homestayName}` : v.title || `Voucher ${v.code}`,
        desc: v.condition || `Giảm ${Number(v.value).toLocaleString('vi-VN')}đ`,
        badge: v.discountVal || (v.discountType === 'PERCENT' ? `-${v.value}%` : `-${Math.round(v.value / 1000)}K`),
        wallet: true,
        calc: (sub) => {
          if (v.discountType === 'PERCENT') {
            const disc = Math.round((sub * Number(v.value)) / 100);
            return v.maxDiscount ? Math.min(disc, Number(v.maxDiscount)) : disc;
          }
          return Number(v.value);
        }
      }));
    }
    return Object.values(COUPONS).filter((c) => c.wallet);
  }, [dbVouchers, homestay?.id]);

  // Payment Options
  const [payPlan, setPayPlan] = useState('full'); // 'full' | 'deposit'
  const [payMethod, setPayMethod] = useState('vietqr'); // 'vietqr' | 'vnpay' | 'cash'
  const [vnpayUrl, setVnpayUrl] = useState('');
  const [vnpayLoading, setVnpayLoading] = useState(false);
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

  // Tiền phòng và phí trước khi giảm điểm ví
  const baseTotal = nights > 0 ? Math.max(0, subtotal + cleaningFee + serviceFee - discount) : 0;
  // Số điểm tối đa có thể dùng (không vượt quá số dư ví và không vượt quá baseTotal)
  const maxUsablePoints = Math.min(walletBalance, baseTotal);
  // Số điểm khách chọn dùng (mặc định lấy tối đa nếu chưa chỉnh sửa customPoints)
  const effectivePoints = customPoints !== null ? Math.min(customPoints, maxUsablePoints) : maxUsablePoints;
  // Số tiền được giảm từ điểm tích lũy ví YÊN (1 điểm = 1đ)
  const walletDiscount = useWalletPoints ? effectivePoints : 0;

  // grandTotal sau khi trừ điểm tích lũy Ví YÊN
  const grandTotal = Math.max(0, baseTotal - walletDiscount);

  // Điểm tích lũy 5% nhận được cho LẦN ĐẶT PHÒNG TIẾP THEO sau khi thanh toán thành công
  const cashbackAccumulated = Math.round(grandTotal * 0.05);

  const handleToggleUsePoints = (checked) => {
    setUseWalletPoints(checked);
    if (checked && customPoints === null) {
      setCustomPoints(maxUsablePoints);
    }
  };

  const handleSelectPointsAmount = (amt) => {
    const clamped = Math.max(0, Math.min(Math.round(Number(amt) || 0), maxUsablePoints));
    setCustomPoints(clamped);
    if (!useWalletPoints && clamped > 0) {
      setUseWalletPoints(true);
    }
  };

  // payNow tính toán động theo payPlan – cập nhật ngay khi đổi kế hoạch thanh toán
  const payNow = payPlan === 'deposit' ? Math.round((grandTotal * DEPOSIT_RATE) / 1000) * 1000 : grandTotal;
  const payLater = grandTotal - payNow;

  // Experiences cost total - tính lại ngay khi selectedExperiences hoặc guests thay đổi
  const selectedExpList = dbExperiences.filter((x) => selectedExperiences.includes(String(x.id)));
  const expTotal = selectedExpList.reduce((sum, x) => {
    if (x.price <= 0) return sum;
    const isPerPerson = x.unit && (x.unit.includes('khách') || x.unit.includes('người'));
    return sum + (isPerPerson ? x.price * guests : x.price);
  }, 0);
  const hasPaidExperiences = expTotal > 0;

  // Apply coupon handler (ưu tiên kiểm tra trực tiếp cơ sở dữ liệu PostgreSQL)
  const handleApplyCoupon = async (codeToApply) => {
    const code = (codeToApply || couponInput).trim().toUpperCase();
    if (!code) { setCouponMsg({ text: 'Vui lòng nhập mã giảm giá.', type: 'error' }); return; }

    // 1. Kiểm tra voucher thật từ cơ sở dữ liệu PostgreSQL
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
        setCouponMsg({ text: `Đã áp dụng mã ${code}: Giảm ${fmtVND(discAmt)}.`, type: 'ok' });
        showToast(`Đã áp dụng mã ưu đãi ${code}!`);
        return;
      }
    } catch {
      // Fallback
    }

    // 2. Kiểm tra preset coupons
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

    setCouponMsg({ text: 'Mã giảm giá không tồn tại hoặc đã hết hạn.', type: 'error' });
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setAppliedVoucherData(null);
    setCouponInput('');
    setCouponMsg({ text: '', type: '' });
  };

  // Toggle Experience
  const toggleExperience = (id) => {
    const strId = String(id);
    setSelectedExperiences((prev) =>
      prev.includes(strId) ? prev.filter((item) => item !== strId) : [...prev, strId]
    );
  };

  // Validate form
  const validateForm = () => {
    const errs = {};
    if (nights <= 0) errs.trip = 'Ngày trả phòng phải sau ngày nhận phòng ít nhất 1 đêm.';
    if (!fullName.trim() || fullName.trim().length < 2) errs.fullName = 'Vui lòng nhập họ và tên của bạn.';
    
    const cleanPhone = normalizePhone(phone);
    if (!/^(0|\+84)(3|5|7|8|9)\d{8}$/.test(cleanPhone)) {
      errs.phone = 'Số điện thoại chưa đúng. Ví dụ: 0901 234 567.';
    } else if (cleanPhone !== phone) {
      setPhone(cleanPhone);
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) errs.email = 'Email chưa đúng. Ví dụ: ban@example.com.';
    if (!agreeTerms) errs.terms = 'Bạn cần đồng ý với nội quy và chính sách hủy phòng để tiếp tục.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Open Payment Modal or Redirect to Login if unauthenticated
  const handleSubmitBooking = (e) => {
    if (e && e.preventDefault) e.preventDefault();

    // 1. Bắt buộc đăng nhập trước khi tiến hành thanh toán
    const currentUser = authService.getCurrentUser();
    if (!currentUser || !currentUser.id) {
      // Lưu trữ toàn bộ tiến trình đặt phòng vào sessionStorage để tự động phục hồi sau khi đăng nhập xong
      const currentDraft = {
        checkin, checkout, guests,
        fullName, phone: normalizePhone(phone), email, arrivalTime, guestNote,
        selectedExperiences,
        payPlan, payMethod, agreeTerms,
        appliedCoupon, couponInput,
        homestayId: homestay.id,
        roomId: room.id,
      };
      sessionStorage.setItem('yenBookingDraft', JSON.stringify(currentDraft));
      showToast('Vui lòng đăng nhập tài khoản để tiếp tục thanh toán!');
      setTimeout(() => {
        navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`);
      }, 500);
      return;
    }

    // 2. Kiểm tra thông tin biểu mẫu
    if (!validateForm()) {
      showToast('Vui lòng điền đầy đủ và đúng các thông tin cần thiết!');
      return;
    }

    // Cập nhật lại số điện thoại đã chuẩn hoá vào current user trong localStorage nếu đã đăng nhập
    try {
      const normPhone = normalizePhone(phone);
      if (normPhone && currentUser.phoneNumber !== normPhone) {
        currentUser.phoneNumber = normPhone;
        localStorage.setItem('user', JSON.stringify(currentUser));
      }
    } catch (e) {
      console.warn('Không thể lưu SĐT cập nhật vào user local:', e);
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

  // Handle Redirect to Real VNPay Sandbox Payment Gateway
  const handleOpenVNPayGateway = async () => {
    setVnpayLoading(true);
    try {
      const realUser = authService.getCurrentUser();
      const rawHs = searchParams.get('homestayId') || location.state?.homestayId || homestay?.id || room?.homestayId;
      const hsId = !isNaN(Number(rawHs)) && Number(rawHs) > 0 ? Number(rawHs) : 1;
      const rawRm = searchParams.get('roomId') || location.state?.roomId || room?.id;
      const rmId = !isNaN(Number(rawRm)) && Number(rawRm) > 0 ? Number(rawRm) : null;
      const uid = Number(realUser?.id || realUser?.userId || realUser?.user_id || sessionStorage.getItem('userId') || 21);

      const bookingPayload = {
        touristId: uid,
        homestayId: hsId,
        roomId: Number.isFinite(rmId) && rmId > 0 ? rmId : null,
        checkInDate: checkin,
        checkOutDate: checkout,
        guestsCount: guests,
        totalPrice: grandTotal,
        discountAmount: discount + walletDiscount,
        pointsUsed: walletDiscount,
        paymentType: payPlan === 'deposit' ? 'DEPOSIT' : 'FULL',
        depositAmount: payNow,
        remainingAmount: payLater,
        paymentMethod: 'VNPAY',
        depositStatus: 'UNPAID',
        status: 'PENDING',
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
        console.error('Lỗi khi tạo đơn đặt phòng VNPay:', err);
        alert(err.message || 'Lỗi đặt phòng: Khoảng thời gian này đã có người đặt trước.');
        setVnpayLoading(false);
        setIsProcessing(false);
        return;
      }

      const bookingRecord = {
        code: finalCode,
        homestay: homestay.name || DEFAULT_HOMESTAY.name,
        room: { name: room.name, thumb: room.thumb },
        location: homestay.location || DEFAULT_HOMESTAY.location,
        checkin: checkin,
        checkout: checkout,
        nights: nights,
        guests: guests,
        contact: { fullName: fullName, phone: phone, email: email },
        arrivalTime: arrivalTime,
        experiences: Array.from(selectedExperiences).map((id) => {
          const exp = dbExperiences.find((x) => x.id === id);
          return exp ? exp.title : id;
        }),
        note: guestNote,
        pricing: {
          subtotal: subtotal,
          cleaning: cleaningFee,
          service: serviceFee,
          discount: discount,
          walletDiscount: walletDiscount,
          total: grandTotal,
          paid: payNow,
          remaining: payLater,
          experienceEstimate: expTotal,
        },
        method: 'vnpay',
        coupon: appliedCoupon,
        pointsUsed: walletDiscount,
      };

      try {
        sessionStorage.setItem('yenLastBooking', JSON.stringify(bookingRecord));
        const list = JSON.parse(localStorage.getItem('yenBookings') || '[]');
        list.unshift(bookingRecord);
        localStorage.setItem('yenBookings', JSON.stringify(list));
        localStorage.removeItem(`cached_cashback_wallet_${uid}`);
      } catch (e) {
        console.error('Save booking error:', e);
      }

      const paymentUrl = await vnpayService.createPaymentUrl({
        bookingCode: finalCode,
        amount: payNow,
        orderInfo: `Thanh toan dat phong ${finalCode}`,
      });

      setVnpayLoading(false);
      setPayModalOpen(false);
      // Chuyển hướng sang Cổng thanh toán VNPAY Sandbox thật
      window.location.href = paymentUrl;
    } catch (err) {
      console.error('Lỗi khởi tạo cổng VNPay:', err);
      setVnpayLoading(false);
      showToast('Không thể kết nối Cổng VNPAY Sandbox, vui lòng thử lại!');
    }
  };

  // Handle Simulation of Successful VNPay Payment (for instant testing without gateway approval error)
  const handleSimulateVNPaySuccess = async () => {
    setIsProcessing(true);
    try {
      const realUser = authService.getCurrentUser();
      const rawHs = searchParams.get('homestayId') || location.state?.homestayId || homestay?.id || room?.homestayId;
      const hsId = !isNaN(Number(rawHs)) && Number(rawHs) > 0 ? Number(rawHs) : 1;
      const rawRm = searchParams.get('roomId') || location.state?.roomId || room?.id;
      const rmId = !isNaN(Number(rawRm)) && Number(rawRm) > 0 ? Number(rawRm) : null;
      const uid = Number(realUser?.id || realUser?.userId || realUser?.user_id || sessionStorage.getItem('userId') || 21);

      const bookingPayload = {
        touristId: uid,
        homestayId: hsId,
        roomId: Number.isFinite(rmId) && rmId > 0 ? rmId : null,
        checkInDate: checkin,
        checkOutDate: checkout,
        guestsCount: guests,
        totalPrice: grandTotal,
        discountAmount: discount + walletDiscount,
        pointsUsed: walletDiscount,
        paymentType: payPlan === 'deposit' ? 'DEPOSIT' : 'FULL',
        depositAmount: payNow,
        remainingAmount: payLater,
        paymentMethod: 'VNPAY',
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
        console.error('Lỗi khi tạo đơn đặt phòng giả lập:', err);
        alert(err.message || 'Lỗi đặt phòng: Khoảng thời gian này đã có người đặt trước.');
        setIsProcessing(false);
        return;
      }

      const bookingRecord = {
        code: finalCode,
        homestay: homestay.name || DEFAULT_HOMESTAY.name,
        room: { name: room.name, thumb: room.thumb },
        location: homestay.location || DEFAULT_HOMESTAY.location,
        checkin: checkin,
        checkout: checkout,
        nights: nights,
        guests: guests,
        contact: { fullName: fullName, phone: phone, email: email },
        arrivalTime: arrivalTime,
        experiences: Array.from(selectedExperiences).map((id) => {
          const exp = dbExperiences.find((x) => x.id === id);
          return exp ? exp.title : id;
        }),
        note: guestNote,
        pricing: {
          subtotal: subtotal,
          cleaning: cleaningFee,
          service: serviceFee,
          discount: discount,
          walletDiscount: walletDiscount,
          total: grandTotal,
          paid: payNow,
          remaining: payLater,
          experienceEstimate: expTotal,
        },
        method: 'vnpay',
        coupon: appliedCoupon,
        pointsUsed: walletDiscount,
      };

      try {
        sessionStorage.setItem('yenLastBooking', JSON.stringify(bookingRecord));
        const list = JSON.parse(localStorage.getItem('yenBookings') || '[]');
        list.unshift(bookingRecord);
        localStorage.setItem('yenBookings', JSON.stringify(list));
        localStorage.removeItem(`cached_cashback_wallet_${uid}`);
      } catch (e) {
        console.error('Save booking error:', e);
      }

      setIsProcessing(false);
      setPayModalOpen(false);
      setStep(3);
      navigate(`/complete-pay?vnp_ResponseCode=00&vnp_TxnRef=${finalCode}&vnp_BankCode=NCB&vnp_TransactionNo=SIM${Date.now()}`);
    } catch (err) {
      console.error('Lỗi mô phỏng VNPay:', err);
      setIsProcessing(false);
      showToast('Có lỗi xảy ra khi xác nhận giao dịch.');
    }
  };

  // Handle Confirm Payment (VietQR & Cash)
  const handleConfirmPayment = async () => {
    setIsProcessing(true);
    try {
      const realUser = authService.getCurrentUser();
      const rawHs = searchParams.get('homestayId') || location.state?.homestayId || homestay?.id || room?.homestayId;
      const hsId = !isNaN(Number(rawHs)) && Number(rawHs) > 0 ? Number(rawHs) : 1;
      const rawRm = searchParams.get('roomId') || location.state?.roomId || room?.id;
      const rmId = !isNaN(Number(rawRm)) && Number(rawRm) > 0 ? Number(rawRm) : null;
      const uid = Number(realUser?.id || realUser?.userId || realUser?.user_id || sessionStorage.getItem('userId') || 21);

      const dbPayMethod = payMethod === 'vnpay' ? 'VNPAY' : (payMethod === 'vietqr' ? 'BANK_TRANSFER' : 'CASH');

      const bookingPayload = {
        touristId: uid,
        homestayId: hsId,
        roomId: Number.isFinite(rmId) && rmId > 0 ? rmId : null,
        checkInDate: checkin,
        checkOutDate: checkout,
        guestsCount: guests,
        totalPrice: grandTotal,
        discountAmount: discount + walletDiscount,
        pointsUsed: walletDiscount,
        paymentType: payPlan === 'deposit' ? 'DEPOSIT' : 'FULL',
        depositAmount: payNow,
        remainingAmount: payLater,
        paymentMethod: dbPayMethod,
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
        console.error('Lỗi khi tạo đơn đặt phòng:', err);
        alert(err.message || 'Lỗi đặt phòng: Khoảng thời gian này đã có người đặt trước.');
        setIsProcessing(false);
        return;
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
          const exp = dbExperiences.find((x) => x.id === id);
          return exp ? exp.title : id;
        }),
        note: guestNote,
        pricing: {
          subtotal: subtotal,
          cleaning: cleaningFee,
          service: serviceFee,
          discount: discount,
          walletDiscount: walletDiscount,
          total: grandTotal,
          paid: payNow,
          remaining: payLater,
          experienceEstimate: expTotal,
        },
        method: payMethod,
        coupon: appliedCoupon,
        pointsUsed: walletDiscount,
      };

      try {
        sessionStorage.setItem('yenLastBooking', JSON.stringify(bookingRecord));
        const list = JSON.parse(localStorage.getItem('yenBookings') || '[]');
        list.unshift(bookingRecord);
        localStorage.setItem('yenBookings', JSON.stringify(list));
        localStorage.removeItem(`cached_cashback_wallet_${uid}`);
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
                    <input
                      type="text"
                      id="fullName"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
                      }}
                      placeholder="Nguyễn Văn An"
                    />
                    {errors.fullName && <p className="bk-error">{errors.fullName}</p>}
                  </div>
                  <div className={`bk-field ${errors.phone ? 'has-error' : ''}`}>
                    <label htmlFor="phone">Số điện thoại</label>
                    <input
                      type="tel"
                      id="phone"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
                      }}
                      onBlur={() => {
                        if (phone) {
                          const norm = normalizePhone(phone);
                          if (norm !== phone) setPhone(norm);
                        }
                      }}
                      placeholder="0901 234 567"
                    />
                    {errors.phone && <p className="bk-error">{errors.phone}</p>}
                  </div>
                  <div className={`bk-field ${errors.email ? 'has-error' : ''}`}>
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                      }}
                      placeholder="ban@example.com"
                    />
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
                {loadingExperiences ? (
                  <div style={{ padding: '12px 0', color: '#64748B', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="bk-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                    Đang tải danh sách trải nghiệm...
                  </div>
                ) : (
                <div className="bk-xp-list">
                  {dbExperiences.map((x) => {
                    const isChecked = selectedExperiences.includes(String(x.id));
                    return (
                      <div
                        key={x.id}
                        className={`bk-xp ${isChecked ? 'checked' : ''}`}
                        onClick={() => toggleExperience(x.id)}
                        role="checkbox"
                        aria-checked={isChecked}
                        style={{ cursor: 'pointer' }}
                      >
                        <span className="bk-xp-box">
                          {isChecked && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </span>
                        <span className="bk-xp-body">
                          <b>{x.title}</b>
                          {x.note && <small>{x.note}</small>}
                        </span>
                        <span className={`bk-xp-price ${x.price === 0 ? 'is-free' : ''}`}>
                          {x.price > 0 ? `${fmtVND(x.price)} ${x.unit}` : 'Miễn phí'}
                        </span>
                      </div>
                    );
                  })}
                </div>
                )}
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
                  <h3 className="bk-subtitle"><i className="bi bi-wallet2" /> Voucher ưu đãi từ hệ thống</h3>
                  <span className="bk-voucher-count">{displayedVouchers.length} voucher sẵn có</span>
                </div>
                <div className="bk-voucher-list">
                  {displayedVouchers.map((c) => {
                    const isSelected = appliedCoupon === c.code;
                    return (
                      <button key={c.code} type="button" className={`bk-voucher ${isSelected ? 'is-selected' : ''}`}
                        onClick={() => isSelected ? handleRemoveCoupon() : handleApplyCoupon(c.code)}>
                        <span className="bk-voucher-badge">{c.badge}</span>
                        <span className="bk-voucher-body">
                          <b>{c.title} {c.code === 'VILLA500' || c.code === 'YEN10' ? <em className="bk-voucher-best">Tiết kiệm nhất</em> : null}</b>
                          <small>{c.desc}</small>
                          <small>Mã {c.code}</small>
                        </span>
                        <span className="bk-voucher-side">
                          <span className="bk-voucher-save">Giảm {nights > 0 ? fmtVND(Math.min(c.calc(subtotal), subtotal)) : '–'}</span>
                          <span className="bk-voucher-radio" />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* 4.5 Loyalty Points & YÊN Wallet */}
              <section className="bk-card" style={{ border: useWalletPoints && walletDiscount > 0 ? '1.5px solid #10B981' : undefined }}>
                <div className="bk-card-head">
                  <span className="bk-card-icon" style={{ background: '#ECFDF5', color: '#059669' }}><i className="bi bi-coin" /></span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <h2>Điểm thưởng &amp; Ví YÊN</h2>
                      <span style={{ background: '#FEF3C7', color: '#B45309', padding: '3px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <i className="bi bi-wallet2" /> Số dư khả dụng: {walletBalance.toLocaleString('vi-VN')} điểm (~{fmtVND(walletBalance)})
                      </span>
                    </div>
                    <p>Dùng điểm tích lũy để giảm giá trực tiếp cho lần đặt phòng này (1 điểm = 1đ).</p>
                  </div>
                </div>

                <div style={{ marginTop: '14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px' }}>
                  {/* Toggle checkbox */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer',
                      userSelect: 'none',
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      color: '#0F172A'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={useWalletPoints}
                      onChange={(e) => handleToggleUsePoints(e.target.checked)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#059669' }}
                    />
                    <span>
                      Sử dụng điểm thưởng Ví YÊN cho đơn này
                    </span>
                  </label>

                  {useWalletPoints && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed #CBD5E1' }}>
                      {/* Slider and Input Container */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.88rem', color: '#475569' }}>
                            Chọn số điểm muốn trừ (tối đa {maxUsablePoints.toLocaleString('vi-VN')} điểm):
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                              <input
                                type="number"
                                min={0}
                                max={maxUsablePoints}
                                step={1000}
                                value={effectivePoints}
                                onChange={(e) => handleSelectPointsAmount(e.target.value)}
                                style={{
                                  width: '140px',
                                  padding: '6px 36px 6px 12px',
                                  border: '1.5px solid #10B981',
                                  borderRadius: '8px',
                                  fontWeight: 700,
                                  color: '#065F46',
                                  textAlign: 'right',
                                  fontSize: '0.92rem'
                                }}
                              />
                              <span style={{ position: 'absolute', right: '10px', fontSize: '0.78rem', color: '#64748B', pointerEvents: 'none' }}>
                                điểm
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSelectPointsAmount(maxUsablePoints)}
                              style={{
                                padding: '6px 12px',
                                background: '#ECFDF5',
                                border: '1px solid #A7F3D0',
                                borderRadius: '8px',
                                color: '#047857',
                                fontWeight: 700,
                                fontSize: '0.82rem',
                                cursor: 'pointer'
                              }}
                            >
                              Tối đa
                            </button>
                          </div>
                        </div>

                        {/* Interactive Range Slider */}
                        <div>
                          <input
                            type="range"
                            min={0}
                            max={maxUsablePoints > 0 ? maxUsablePoints : 100}
                            step={1000}
                            value={effectivePoints}
                            onChange={(e) => handleSelectPointsAmount(Number(e.target.value))}
                            style={{
                              width: '100%',
                              accentColor: '#059669',
                              cursor: 'pointer'
                            }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94A3B8', marginTop: '4px' }}>
                            <span>0đ</span>
                            <span>{fmtVND(Math.round(maxUsablePoints * 0.5))}</span>
                            <span>{fmtVND(maxUsablePoints)}</span>
                          </div>
                        </div>

                        {/* Quick Selection Buttons */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.8rem', color: '#64748B', marginRight: '4px' }}>Chọn nhanh:</span>
                          <button
                            type="button"
                            onClick={() => handleSelectPointsAmount(0)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              border: effectivePoints === 0 ? '1.5px solid #64748B' : '1px solid #E2E8F0',
                              background: effectivePoints === 0 ? '#F1F5F9' : '#FFFFFF',
                              color: effectivePoints === 0 ? '#0F172A' : '#475569',
                              fontWeight: effectivePoints === 0 ? 700 : 500,
                              fontSize: '0.8rem',
                              cursor: 'pointer'
                            }}
                          >
                            Không dùng (0đ)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectPointsAmount(Math.round(maxUsablePoints * 0.25))}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              border: effectivePoints === Math.round(maxUsablePoints * 0.25) && effectivePoints > 0 ? '1.5px solid #059669' : '1px solid #E2E8F0',
                              background: effectivePoints === Math.round(maxUsablePoints * 0.25) && effectivePoints > 0 ? '#ECFDF5' : '#FFFFFF',
                              color: effectivePoints === Math.round(maxUsablePoints * 0.25) && effectivePoints > 0 ? '#065F46' : '#475569',
                              fontWeight: effectivePoints === Math.round(maxUsablePoints * 0.25) && effectivePoints > 0 ? 700 : 500,
                              fontSize: '0.8rem',
                              cursor: 'pointer'
                            }}
                          >
                            25% ({fmtVND(Math.round(maxUsablePoints * 0.25))})
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectPointsAmount(Math.round(maxUsablePoints * 0.5))}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              border: effectivePoints === Math.round(maxUsablePoints * 0.5) && effectivePoints > 0 ? '1.5px solid #059669' : '1px solid #E2E8F0',
                              background: effectivePoints === Math.round(maxUsablePoints * 0.5) && effectivePoints > 0 ? '#ECFDF5' : '#FFFFFF',
                              color: effectivePoints === Math.round(maxUsablePoints * 0.5) && effectivePoints > 0 ? '#065F46' : '#475569',
                              fontWeight: effectivePoints === Math.round(maxUsablePoints * 0.5) && effectivePoints > 0 ? 700 : 500,
                              fontSize: '0.8rem',
                              cursor: 'pointer'
                            }}
                          >
                            50% ({fmtVND(Math.round(maxUsablePoints * 0.5))})
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectPointsAmount(Math.round(maxUsablePoints * 0.75))}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              border: effectivePoints === Math.round(maxUsablePoints * 0.75) && effectivePoints > 0 ? '1.5px solid #059669' : '1px solid #E2E8F0',
                              background: effectivePoints === Math.round(maxUsablePoints * 0.75) && effectivePoints > 0 ? '#ECFDF5' : '#FFFFFF',
                              color: effectivePoints === Math.round(maxUsablePoints * 0.75) && effectivePoints > 0 ? '#065F46' : '#475569',
                              fontWeight: effectivePoints === Math.round(maxUsablePoints * 0.75) && effectivePoints > 0 ? 700 : 500,
                              fontSize: '0.8rem',
                              cursor: 'pointer'
                            }}
                          >
                            75% ({fmtVND(Math.round(maxUsablePoints * 0.75))})
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectPointsAmount(maxUsablePoints)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              border: effectivePoints === maxUsablePoints && effectivePoints > 0 ? '1.5px solid #059669' : '1px solid #E2E8F0',
                              background: effectivePoints === maxUsablePoints && effectivePoints > 0 ? '#ECFDF5' : '#FFFFFF',
                              color: effectivePoints === maxUsablePoints && effectivePoints > 0 ? '#065F46' : '#475569',
                              fontWeight: effectivePoints === maxUsablePoints && effectivePoints > 0 ? 700 : 500,
                              fontSize: '0.8rem',
                              cursor: 'pointer'
                            }}
                          >
                            100% ({fmtVND(maxUsablePoints)})
                          </button>
                        </div>

                        {/* Status notification */}
                        <div style={{
                          padding: '10px 14px',
                          background: walletDiscount > 0 ? '#ECFDF5' : '#F1F5F9',
                          border: walletDiscount > 0 ? '1px solid #A7F3D0' : '1px solid #E2E8F0',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '8px',
                          fontSize: '0.85rem'
                        }}>
                          <div style={{ color: walletDiscount > 0 ? '#065F46' : '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <i className={`bi ${walletDiscount > 0 ? 'bi-check-circle-fill text-success' : 'bi-info-circle'}`} />
                            <span>
                              {walletDiscount > 0 ? (
                                <>Đã chọn giảm: <b>-{fmtVND(walletDiscount)}</b> trực tiếp vào tiền thanh toán đơn này.</>
                              ) : (
                                <>Chưa áp dụng giảm bằng điểm cho đơn này.</>
                              )}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                            Số dư điểm còn lại: <b>{(walletBalance - walletDiscount).toLocaleString('vi-VN')}</b> điểm
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
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
                  <div
                    className={`bk-option ${payPlan === 'full' ? 'checked' : ''}`}
                    onClick={() => {
                      setPayPlan('full');
                      if (payMethod === 'cash') setPayMethod('vietqr');
                    }}
                    role="radio"
                    aria-checked={payPlan === 'full'}
                    style={{ cursor: 'pointer' }}
                  >
                    <span className="bk-option-radio" />
                    <span className="bk-option-body">
                      <span className="bk-option-title">Trả toàn bộ</span>
                      <span className="bk-option-sub">Xong một lần, không phải trả thêm khi nhận phòng.</span>
                    </span>
                    <b className="bk-option-amount">{fmtVND(grandTotal)}</b>
                  </div>
                  <div
                    className={`bk-option ${payPlan === 'deposit' ? 'checked' : ''}`}
                    onClick={() => setPayPlan('deposit')}
                    role="radio"
                    aria-checked={payPlan === 'deposit'}
                    style={{ cursor: 'pointer' }}
                  >
                    <span className="bk-option-radio" />
                    <span className="bk-option-body">
                      <span className="bk-option-title">Đặt cọc 30%</span>
                      <span className="bk-option-sub">Trả trước 30% qua QR, 70% còn lại thanh toán bằng tiền mặt khi nhận phòng.</span>
                    </span>
                    <b className="bk-option-amount">{fmtVND(Math.round((grandTotal * DEPOSIT_RATE) / 1000) * 1000)}</b>
                  </div>
                </div>

                <h3 className="bk-subtitle">Phương thức thanh toán</h3>
                <div className="bk-options">
                  {/* VietQR */}
                  <div
                    className={`bk-option ${payMethod === 'vietqr' ? 'checked' : ''}`}
                    onClick={() => setPayMethod('vietqr')}
                    role="radio"
                    aria-checked={payMethod === 'vietqr'}
                    style={{ cursor: 'pointer' }}
                  >
                    <span className="bk-option-radio" />
                    <span className="bk-method-icon bk-method-icon--qr"><i className="bi bi-qr-code-scan" /></span>
                    <span className="bk-option-body">
                      <span className="bk-option-title">Chuyển khoản VietQR (Thực tế)</span>
                      <span className="bk-option-sub">Mã VietQR chuẩn NAPAS 24/7 quét được bằng mọi App ngân hàng (VCB, MB, Techcombank, VPBank,...).</span>
                    </span>
                  </div>

                  {/* VNPAY */}
                  <div
                    className={`bk-option ${payMethod === 'vnpay' ? 'checked' : ''}`}
                    onClick={() => setPayMethod('vnpay')}
                    role="radio"
                    aria-checked={payMethod === 'vnpay'}
                    style={{ cursor: 'pointer' }}
                  >
                    <span className="bk-option-radio" />
                    <span className="bk-method-icon bk-method-icon--vnpay"><i className="bi bi-shield-check" /></span>
                    <span className="bk-option-body">
                      <span className="bk-option-title">Cổng thanh toán VNPAY (Thực tế)</span>
                      <span className="bk-option-sub">Thanh toán qua Cổng VNPAY Sandbox thật (VNPAY-QR, Thẻ ATM nội địa, Thẻ quốc tế Visa/MasterCard).</span>
                    </span>
                  </div>

                  {/* Tiền mặt tại homestay - CHỈ HIỂN THỊ KHI CHỌN ĐẶT CỌC 30% */}
                  {payPlan === 'deposit' && (
                    <div
                      className={`bk-option ${payMethod === 'cash' ? 'checked' : ''}`}
                      onClick={() => setPayMethod('cash')}
                      role="radio"
                      aria-checked={payMethod === 'cash'}
                      style={{ cursor: 'pointer' }}
                    >
                      <span className="bk-option-radio" />
                      <span className="bk-method-icon bk-method-icon--cash"><i className="bi bi-cash-coin" /></span>
                      <span className="bk-option-body">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span className="bk-option-title">Tiền mặt tại homestay (Cọc 30% qua QR + 70% tiền mặt khi nhận phòng)</span>
                          <span style={{ fontSize: '0.72rem', background: '#FEF3C7', color: '#92400E', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                            Cọc {fmtVND(payNow)} · Trả sau {fmtVND(payLater)}
                          </span>
                        </div>
                        <span className="bk-option-sub">
                          Quét mã VietQR chuyển khoản trước 30% tiền cọc ({fmtVND(payNow)}) để giữ chỗ. Số tiền mặt còn lại 70% ({fmtVND(payLater)}) thanh toán trực tiếp tại quầy lễ tân khi nhận phòng.
                        </span>
                      </span>
                    </div>
                  )}
                </div>

                <p className="bk-secure"><i className="bi bi-lock-fill" /> Thông tin thanh toán được mã hóa an toàn.</p>
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

                <label
                  className={`bk-check ${agreeTerms ? 'checked' : ''}`}
                  htmlFor="agreeTermsCheck"
                >
                  <input
                    type="checkbox"
                    id="agreeTermsCheck"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                  />
                  <span className="bk-check-box">
                    {agreeTerms && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </span>
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
                  {walletDiscount > 0 && (
                    <div className="bk-row bk-row--discount" style={{ color: '#059669', fontWeight: 600 }}>
                      <span><i className="bi bi-coin me-1" style={{ color: '#F59E0B' }} />Dùng điểm Ví YÊN</span>
                      <span>-{fmtVND(walletDiscount)}</span>
                    </div>
                  )}
                  {hasPaidExperiences && (
                    <div className="bk-row" style={{ color: '#6B7280', fontSize: '0.82rem' }}>
                      <span>Trải nghiệm (trả tại homestay)</span><span>+{fmtVND(expTotal)}</span>
                    </div>
                  )}
                  <div className="bk-divider" />
                  <div className="bk-row bk-row--total"><span>Tổng cộng</span><span>{fmtVND(grandTotal)}</span></div>
                  {cashbackAccumulated > 0 && (
                    <div style={{
                      marginTop: '10px',
                      padding: '8px 12px',
                      background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
                      border: '1px solid #A7F3D0',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.82rem',
                      color: '#065F46'
                    }}>
                      <span><i className="bi bi-gift-fill me-1" style={{ color: '#059669' }} />Tích 5% cho lần đặt tiếp theo:</span>
                      <b style={{ color: '#047857', fontWeight: 700 }}>+{fmtVND(cashbackAccumulated)}</b>
                    </div>
                  )}
                  {hasPaidExperiences && (
                    <div className="bk-row" style={{ fontSize: '0.78rem', color: '#9CA3AF', marginTop: 2 }}>
                      <span>⚡ Không bao gồm trải nghiệm</span>
                    </div>
                  )}
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

      {/* ── PAYMENT MODAL POPUP (ISOLATED PREFIX TO PREVENT CSS COLLISIONS) ── */}
      <div className={`yn-pay-overlay ${payModalOpen ? 'active' : ''}`} onClick={(e) => {
        if (e.target === e.currentTarget) setPayModalOpen(false);
      }}>
        <div className="yn-pay-modal">
          {/* Header */}
          <div className="yn-pay-head">
            <div className="yn-pay-head-info">
              <span className={`yn-pay-badge ${payMethod}`}>
                {payMethod === 'vietqr' && <><i className="bi bi-qr-code" /> Chuyển khoản VietQR</>}
                {payMethod === 'vnpay' && <><i className="bi bi-credit-card-2-front-fill" /> Cổng thanh toán VNPAY</>}
                {payMethod === 'cash' && <><i className="bi bi-cash-stack" /> Thanh toán Tiền mặt</>}
              </span>
              <h3>
                {payMethod === 'vietqr' && 'Quét mã VietQR để thanh toán'}
                {payMethod === 'vnpay' && 'Thanh toán trực tuyến qua VNPAY'}
                {payMethod === 'cash' && 'Xác nhận thanh toán tiền mặt'}
              </h3>
            </div>
            <button
              type="button"
              className="yn-pay-close-btn"
              onClick={() => setPayModalOpen(false)}
              aria-label="Đóng"
            >
              <i className="bi bi-x-lg" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="yn-pay-body">
            {/* Amount Banner (Compact Single Bar) */}
            <div className="yn-pay-amount-strip">
              <div className="yn-amount-strip-left">
                <span className="yn-amount-strip-label">
                  {payLater > 0
                    ? 'Đặt cọc cần thanh toán (30%):'
                    : payMethod === 'cash'
                    ? 'Thanh toán khi nhận phòng:'
                    : 'Số tiền cần thanh toán:'}
                </span>
                <span className="yn-amount-strip-val">{fmtVND(payNow)}</span>
                {payLater > 0 && (
                  <span className="yn-amount-strip-sub">
                    (Còn lại {fmtVND(payLater)} thanh toán khi nhận phòng)
                  </span>
                )}
              </div>
              {payMethod !== 'cash' && (
                <div className={`yn-pay-timer-pill ${payTimer < 180 ? 'is-urgent' : ''}`}>
                  <i className="bi bi-stopwatch" />
                  <span>Phiên còn: <b>{pad(Math.floor(payTimer / 60))}:{pad(payTimer % 60)}</b></span>
                </div>
              )}
            </div>

            {/* Content for CASH (chỉ có khi đặt cọc 30% - hiển thị VietQR cọc 30% + hướng dẫn 70% tiền mặt) */}
            {payMethod === 'cash' && (
              <div className="yn-cash-layout">
                {/* Top banner */}
                <div className="yn-cash-banner">
                  <div className="yn-cash-banner-icon"><i className="bi bi-wallet2" /></div>
                  <div className="yn-cash-banner-text">
                    <b>Đặt cọc 30% qua VietQR &amp; Thanh toán 70% tiền mặt khi nhận phòng</b>
                    <span>Quý khách chuyển khoản 30% tiền cọc qua mã VietQR dưới đây để xác nhận giữ phòng ngay. Số tiền 70% còn lại thanh toán bằng tiền mặt trực tiếp tại quầy lễ tân homestay.</span>
                  </div>
                </div>

                {/* Phần 1: VietQR thanh toán 30% tiền cọc */}
                <div className="yn-vietqr-stack" style={{ background: '#F8FAFC', padding: '14px', borderRadius: '14px', border: '1.5px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ background: '#DCFCE7', color: '#15803D', fontWeight: 800, fontSize: '0.75rem', padding: '3px 8px', borderRadius: '6px' }}>
                        BƯỚC 1: CHUYỂN KHOẢN CỌC 30%
                      </span>
                      <b style={{ fontSize: '0.92rem', color: '#0F172A' }}>Quét mã VietQR cọc</b>
                    </div>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#15803D' }}>{fmtVND(payNow)}</span>
                  </div>

                  {/* MÃ QR TO CHÍNH GIỮA */}
                  <div className="yn-vietqr-qr-center">
                    <div className="yn-vietqr-img-frame-large">
                      <img
                        src={getVietQRUrl({
                          bankCode: VIETQR_MERCHANT.bankCode,
                          accountNumber: VIETQR_MERCHANT.accountNumber,
                          amount: payNow,
                          memo: bookingCode.replace(/-/g, ''),
                          accountName: VIETQR_MERCHANT.accountName,
                          template: 'compact2'
                        })}
                        alt="QR cọc 30% BIDV"
                        className="yn-vietqr-image-large"
                      />
                    </div>
                    <div className="yn-vietqr-qr-hint">
                      <i className="bi bi-qr-code-scan" />
                      <span>Quét bằng App ngân hàng bất kỳ để chuyển khoản 30% tiền cọc</span>
                      <a
                        href={getVietQRUrl({
                          bankCode: VIETQR_MERCHANT.bankCode,
                          accountNumber: VIETQR_MERCHANT.accountNumber,
                          amount: payNow,
                          memo: bookingCode.replace(/-/g, ''),
                          accountName: VIETQR_MERCHANT.accountName,
                          template: 'compact2'
                        })}
                        download={`VietQR-Coc30-${bookingCode}.png`}
                        target="_blank" rel="noreferrer"
                        className="yn-qr-download-link"
                      >
                        <i className="bi bi-download" /> Tải QR
                      </a>
                    </div>
                  </div>

                  {/* THÔNG TIN CHUYỂN KHOẢN TIỀN CỌC */}
                  <div className="yn-vietqr-info-grid">
                    <div className="yn-vqr-cell">
                      <span className="yn-vqr-lbl">Ngân hàng thụ hưởng</span>
                      <div className="yn-vqr-val">
                        <span className="yn-bank-tag">BIDV</span>
                        <b>Đầu tư &amp; Phát triển VN</b>
                      </div>
                    </div>
                    <div className="yn-vqr-cell">
                      <span className="yn-vqr-lbl">Chủ tài khoản</span>
                      <b className="yn-vqr-val">{VIETQR_MERCHANT.accountName}</b>
                    </div>
                    <div className="yn-vqr-cell yn-vqr-cell--full">
                      <span className="yn-vqr-lbl">Số tài khoản nhận cọc</span>
                      <div className="yn-copyable-val">
                        <b className="highlight-acc">{VIETQR_MERCHANT.accountNumber}</b>
                        <button type="button" className="yn-copy-btn" onClick={() => copyToClipboard(VIETQR_MERCHANT.accountNumber)} title="Sao chép STK">
                          <i className="bi bi-copy" />
                        </button>
                      </div>
                    </div>
                    <div className="yn-vqr-cell">
                      <span className="yn-vqr-lbl">Tiền cọc cần chuyển (30%)</span>
                      <div className="yn-copyable-val">
                        <b className="highlight-price">{fmtVND(payNow)}</b>
                        <button type="button" className="yn-copy-btn" onClick={() => copyToClipboard(String(Math.round(payNow)))} title="Sao chép tiền cọc">
                          <i className="bi bi-copy" />
                        </button>
                      </div>
                    </div>
                    <div className="yn-vqr-cell">
                      <span className="yn-vqr-lbl">Kênh nhận cọc</span>
                      <span className="yn-live-pill"><span className="yn-pulse-dot" /> NAPAS 24/7 tức thì</span>
                    </div>
                    <div className="yn-vqr-cell yn-vqr-cell--full yn-vqr-cell--memo">
                      <span className="yn-vqr-lbl">Nội dung chuyển khoản (Bắt buộc)</span>
                      <div className="yn-copyable-val">
                        <b className="highlight-code yn-vqr-memo-code">{bookingCode.replace(/-/g, '')}</b>
                        <button type="button" className="yn-copy-btn" onClick={() => copyToClipboard(bookingCode.replace(/-/g, ''))} title="Sao chép nội dung">
                          <i className="bi bi-copy" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Phần 2: Tiền mặt còn lại thanh toán tại homestay */}
                <div style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: '14px', padding: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ background: '#FEF3C7', color: '#B45309', fontWeight: 800, fontSize: '0.75rem', padding: '3px 8px', borderRadius: '6px' }}>
                        BƯỚC 2: TIỀN MẶT KHI NHẬN PHÒNG
                      </span>
                      <b style={{ fontSize: '0.92rem', color: '#92400E' }}>Thanh toán 70% còn lại</b>
                    </div>
                    <b style={{ color: '#D97706', fontSize: '1.05rem', fontWeight: 800 }}>{fmtVND(payLater)}</b>
                  </div>
                  
                  <div className="yn-cash-info-grid" style={{ background: '#FFFFFF', border: '1px solid #FDE68A' }}>
                    <div className="yn-cash-info-item">
                      <span className="yn-cash-lbl"><i className="bi bi-cash-stack" /> Tiền mặt trả tại lễ tân (70%)</span>
                      <b style={{ color: '#D97706', fontSize: '1.15rem', fontWeight: 800 }}>{fmtVND(payLater)}</b>
                    </div>
                    <div className="yn-cash-info-item">
                      <span className="yn-cash-lbl"><i className="bi bi-ticket-detailed" /> Mã đối soát booking</span>
                      <div className="yn-cash-val-row">
                        <b className="highlight-code">{bookingCode}</b>
                        <button type="button" className="yn-copy-btn" onClick={() => copyToClipboard(bookingCode)} title="Sao chép mã">
                          <i className="bi bi-copy" />
                        </button>
                      </div>
                    </div>
                    <div className="yn-cash-info-item">
                      <span className="yn-cash-lbl"><i className="bi bi-door-open" /> Giờ nhận phòng</span>
                      <b>14:00 – 21:00</b>
                    </div>
                    <div className="yn-cash-info-item">
                      <span className="yn-cash-lbl"><i className="bi bi-alarm" /> Trả phòng trước</span>
                      <b>12:00 ngày trả</b>
                    </div>
                  </div>

                  <div className="yn-cash-note" style={{ marginTop: '10px' }}>
                    <i className="bi bi-shield-check" />
                    Sau khi quý khách bấm xác nhận chuyển khoản cọc 30%, hệ thống YÊN lập tức xuất phiếu giữ phòng. Số tiền mặt 70% ({fmtVND(payLater)}) quý khách chỉ cần thanh toán khi đến homestay và nhận phòng thực tế.
                  </div>
                </div>
              </div>
            )}

            {/* Content for VNPAY */}
            {payMethod === 'vnpay' && (
              <div className="yn-pay-vnpay-container">
                <div className="yn-vnpay-guide-banner">
                  <div className="yn-vnpay-guide-icon">
                    <i className="bi bi-shield-check" />
                  </div>
                  <div className="yn-vnpay-guide-text">
                    <b>Cổng thanh toán điện tử VNPAY Sandbox</b>
                    <p>Hỗ trợ quét mã VNPAY-QR, thẻ ATM nội địa 40+ ngân hàng, thẻ quốc tế Visa/Mastercard và Ví VNPAY.</p>
                  </div>
                </div>

                <div className="yn-sandbox-credential-box">
                  <div className="yn-sandbox-credential-title">
                    <i className="bi bi-credit-card-2-front" />
                    <span>Thông tin thẻ Sandbox (Ngân hàng NCB):</span>
                  </div>
                  <div className="yn-sandbox-credential-grid">
                    <div className="yn-cred-item">
                      <span>Ngân hàng:</span>
                      <b>NCB (Quốc Dân)</b>
                    </div>
                    <div className="yn-cred-item">
                      <span>Số thẻ:</span>
                      <b>9704198526191432198</b>
                      <button type="button" className="yn-copy-sm" onClick={() => copyToClipboard('9704198526191432198')} title="Sao chép số thẻ">
                        <i className="bi bi-copy" />
                      </button>
                    </div>
                    <div className="yn-cred-item">
                      <span>Tên chủ thẻ:</span>
                      <b>NGUYEN VAN A</b>
                    </div>
                    <div className="yn-cred-item">
                      <span>Ngày phát hành:</span>
                      <b>07/15</b>
                    </div>
                    <div className="yn-cred-item">
                      <span>Mã OTP SMS:</span>
                      <b>123456</b>
                      <button type="button" className="yn-copy-sm" onClick={() => copyToClipboard('123456')} title="Sao chép OTP">
                        <i className="bi bi-copy" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Content for VIETQR - QR TO CHÍNH GIỮA TRÊN + THÔNG TIN ĐẦY ĐỦ DƯỚI */}
            {payMethod === 'vietqr' && (
              <div className="yn-vietqr-stack">
                {/* MÃ QR TO CHÍNH GIỮA */}
                <div className="yn-vietqr-qr-center">
                  <div className="yn-vietqr-img-frame-large">
                    <img
                      src={getVietQRUrl({
                        bankCode: VIETQR_MERCHANT.bankCode,
                        accountNumber: VIETQR_MERCHANT.accountNumber,
                        amount: payNow,
                        memo: bookingCode.replace(/-/g, ''),
                        accountName: VIETQR_MERCHANT.accountName,
                        template: 'compact2'
                      })}
                      alt="QR chuyển khoản BIDV"
                      className="yn-vietqr-image-large"
                    />
                  </div>
                  <div className="yn-vietqr-qr-hint">
                    <i className="bi bi-qr-code-scan" />
                    <span>Quét bằng App ngân hàng bất kỳ để tự động điền thông tin</span>
                    <a
                      href={getVietQRUrl({
                        bankCode: VIETQR_MERCHANT.bankCode,
                        accountNumber: VIETQR_MERCHANT.accountNumber,
                        amount: payNow,
                        memo: bookingCode.replace(/-/g, ''),
                        accountName: VIETQR_MERCHANT.accountName,
                        template: 'compact2'
                      })}
                      download={`VietQR-YenHomestay-${bookingCode}.png`}
                      target="_blank" rel="noreferrer"
                      className="yn-qr-download-link"
                    >
                      <i className="bi bi-download" /> Tải QR
                    </a>
                  </div>
                </div>

                {/* THÔNG TIN THANH TOÁN: 2 CỘT ĐỦ */}
                <div className="yn-vietqr-info-grid">
                  {/* Ngân hàng */}
                  <div className="yn-vqr-cell">
                    <span className="yn-vqr-lbl">Ngân hàng</span>
                    <div className="yn-vqr-val">
                      <span className="yn-bank-tag">BIDV</span>
                      <b>Đầu tư &amp; Phát triển VN</b>
                    </div>
                  </div>

                  {/* Chủ tài khoản */}
                  <div className="yn-vqr-cell">
                    <span className="yn-vqr-lbl">Chủ tài khoản</span>
                    <b className="yn-vqr-val">{VIETQR_MERCHANT.accountName}</b>
                  </div>

                  {/* Số tài khoản - full width */}
                  <div className="yn-vqr-cell yn-vqr-cell--full">
                    <span className="yn-vqr-lbl">Số tài khoản</span>
                    <div className="yn-copyable-val">
                      <b className="highlight-acc">{VIETQR_MERCHANT.accountNumber}</b>
                      <button type="button" className="yn-copy-btn" onClick={() => copyToClipboard(VIETQR_MERCHANT.accountNumber)} title="Sao chép STK">
                        <i className="bi bi-copy" />
                      </button>
                    </div>
                  </div>

                  {/* Số tiền */}
                  <div className="yn-vqr-cell">
                    <span className="yn-vqr-lbl">Số tiền chuyển</span>
                    <div className="yn-copyable-val">
                      <b className="highlight-price">{fmtVND(payNow)}</b>
                      <button type="button" className="yn-copy-btn" onClick={() => copyToClipboard(String(Math.round(payNow)))} title="Sao chép số tiền">
                        <i className="bi bi-copy" />
                      </button>
                    </div>
                  </div>

                  {/* Kênh nhận */}
                  <div className="yn-vqr-cell">
                    <span className="yn-vqr-lbl">Kênh nhận</span>
                    <span className="yn-live-pill"><span className="yn-pulse-dot" /> NAPAS 24/7</span>
                  </div>

                  {/* Nội dung CK - full width, highlight */}
                  <div className="yn-vqr-cell yn-vqr-cell--full yn-vqr-cell--memo">
                    <span className="yn-vqr-lbl">Nội dung chuyển khoản</span>
                    <div className="yn-copyable-val">
                      <b className="highlight-code yn-vqr-memo-code">{bookingCode.replace(/-/g, '')}</b>
                      <button type="button" className="yn-copy-btn" onClick={() => copyToClipboard(bookingCode.replace(/-/g, ''))} title="Sao chép nội dung">
                        <i className="bi bi-copy" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="yn-pay-foot">
            <button type="button" className="yn-btn yn-btn--ghost" onClick={() => setPayModalOpen(false)}>
              Quay lại
            </button>
            {payMethod === 'vnpay' ? (
              <button
                type="button"
                className="yn-btn yn-btn--primary yn-btn-vnpay-submit"
                onClick={handleOpenVNPayGateway}
                disabled={vnpayLoading || isProcessing}
                style={{ minWidth: '220px' }}
              >
                {vnpayLoading ? 'Đang kết nối...' : `Thanh toán qua Cổng VNPAY (${fmtVND(payNow)})`}
              </button>
            ) : payMethod === 'vietqr' ? (
              <button
                type="button"
                className="yn-btn yn-btn--primary"
                onClick={handleConfirmPayment}
                disabled={isProcessing}
              >
                {isProcessing ? 'Đang xác thực...' : 'Tôi đã chuyển khoản thành công'}
              </button>
            ) : payMethod === 'cash' ? (
              <button
                type="button"
                className="yn-btn yn-btn--primary"
                onClick={handleConfirmPayment}
                disabled={isProcessing}
              >
                {isProcessing ? 'Đang xác nhận đặt phòng...' : `Tôi đã chuyển khoản cọc 30% (${fmtVND(payNow)}) — Hoàn tất đặt phòng`}
              </button>
            ) : (
              <button
                type="button"
                className="yn-btn yn-btn--primary"
                onClick={handleConfirmPayment}
                disabled={isProcessing}
              >
                {isProcessing ? 'Đang đặt phòng...' : 'Xác nhận đặt phòng'}
              </button>
            )}
          </div>

          {/* Processing Loading Overlay */}
          {isProcessing && (
            <div className="yn-pay-processing-overlay">
              <span className="bk-spinner" />
              <h4>Đang xác nhận giao dịch đặt phòng...</h4>
              <p>Vui lòng không tắt hoặc làm mới trình duyệt</p>
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
