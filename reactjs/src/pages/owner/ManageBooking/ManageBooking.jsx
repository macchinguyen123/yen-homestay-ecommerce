import { useState, useEffect, useMemo } from 'react';
import './ManageBooking.css';
import { ownerBookingService } from '../../../services/ownerBookingService';
import { AVAILABLE_SERVICES, formatVND } from './manageBookingData';

export default function ManageBooking() {
  // ─── Data & Loading States ────────────────────────────────────
  const [bookings, setBookings] = useState([]);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [ownerHomestays, setOwnerHomestays] = useState([]);
  const [selectedHomestayId, setSelectedHomestayId] = useState(() => {
    return localStorage.getItem('ownerActiveHomestayId') || '';
  });
  const [loading, setLoading] = useState(true);

  // ─── Filter & Search States ───────────────────────────────────
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [roomFilter, setRoomFilter] = useState('');

  // ─── Toast System ─────────────────────────────────────────────
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ─── Active Modal & Selected Booking ──────────────────────────
  const [activeModal, setActiveModal] = useState(null);
  const [currentBookingId, setCurrentBookingId] = useState('BK-9842');

  const currentBooking = useMemo(() => {
    return (
      bookings.find(
        (b) => String(b.id) === String(currentBookingId) || b.bookingCode === currentBookingId
      ) || bookings[0] || {}
    );
  }, [bookings, currentBookingId]);

  // ─── Forms State ──────────────────────────────────────────────
  const [serviceQty, setServiceQty] = useState({});
  const [contactTab, setContactTab] = useState('call');
  const [chatMessage, setChatMessage] = useState('');

  const [newBooking, setNewBooking] = useState({
    guestName: '',
    phone: '',
    cccd: '',
    city: 'Hà Nội',
    roomId: '',
    roomCode: 'Mountain View #01',
    roomType: 'Mountain View (Nhà Gỗ)',
    guestsCount: 2,
    checkIn: new Date().toISOString().split('T')[0],
    checkOut: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    pricePerNight: 950000,
    depositAmount: 950000,
    paymentMethod: 'Chuyển khoản VietQR',
    specialRequest: ''
  });

  const [checkinForm, setCheckinForm] = useState({
    cccd: '001198034521',
    paymentMethod: 'VietQR',
    isPaid: true
  });

  const [checkoutForm, setCheckoutForm] = useState({
    keysReturned: true,
    equipmentIntact: true,
    paymentType: 'VietQR'
  });

  const [rejectForm, setRejectForm] = useState({
    reason: 'Hết phòng do khách đoàn gia hạn thêm ngày',
    refundOption: 'Hoàn lại 100% tiền cọc về số tài khoản khách trong 24h',
    notifyMessage:
      'Homestay Nhà Sàn Mộc rất tiếc chưa thể phục vụ quý khách trong khung giờ này do trùng lịch bảo trì. Bộ phận lễ tân sẽ liên hệ hỗ trợ hoàn cọc ngay ạ.'
  });

  const [exportConfig, setExportConfig] = useState({
    range: 'Tháng 9/2024',
    status: 'Tất cả trạng thái',
    format: 'xlsx'
  });

  // ─── Checklist State ──────────────────────────────────────────
  const [cleaningChecklist, setCleaningChecklist] = useState([
    { id: 1, text: 'Dọn sạch Mountain View #01 đón khách Mai', done: true },
    { id: 2, text: 'Chuẩn bị 2 suất cơm lam thịt nướng (18h30)', done: true },
    { id: 3, text: 'Bổ sung củi lửa trại cho phòng Lake View #02', done: false },
    { id: 4, text: 'Đối soát thanh toán cọc booking #BK-9850 (Trần Tuấn Kiệt)', done: false }
  ]);

  const toggleChecklist = (id) => {
    setCleaningChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  // ─── Fetch Data from CSDL on Mount & Homestay Switch ───────────
  useEffect(() => {
    loadAllData(selectedHomestayId);
  }, [selectedHomestayId]);

  const loadAllData = async (targetHomestayId = selectedHomestayId) => {
    setLoading(true);
    try {
      const activeId = targetHomestayId ? Number(targetHomestayId) : null;

      // 1. Fetch Danh sách Homestay của chủ nhà
      try {
        const hsRes = await fetch('http://localhost:8081/api/public/homestays');
        if (hsRes.ok) {
          const hsList = await hsRes.json();
          if (Array.isArray(hsList) && hsList.length > 0) {
            setOwnerHomestays(hsList);
            if (targetHomestayId === undefined) {
              const saved = localStorage.getItem('ownerActiveHomestayId');
              if (saved !== null && saved !== undefined && saved !== '') {
                setSelectedHomestayId(saved);
              }
            }
          }
        }
      } catch (err) {
        console.warn('Lỗi fetch homestays:', err);
      }

      // 2. Fetch Bookings thực tế từ Neon PostgreSQL
      const data = await ownerBookingService.getBookings(activeId);
      if (Array.isArray(data) && data.length > 0) {
        setBookings(data);
        setCurrentBookingId(data[0].bookingCode || data[0].id);
      }

      // 3. Fetch Rooms thực tế
      try {
        const roomsRes = await fetch('http://localhost:8081/api/public/homestays');
        if (roomsRes.ok) {
          const homestays = await roomsRes.json();
          let allRooms = [];
          homestays.forEach((h) => {
            if (activeId && h.id !== activeId) return;
            if (Array.isArray(h.rooms)) {
              h.rooms.forEach((r) => {
                allRooms.push({
                  id: r.id,
                  name: r.name || r.roomName,
                  code: `P.${r.id}`,
                  type: r.roomType || 'Standard Room',
                  price: r.price || r.pricePerNight || 950000,
                  capacity: r.capacity || 2,
                  status: (r.status || 'AVAILABLE').toLowerCase()
                });
              });
            }
          });
          if (allRooms.length > 0) {
            setAvailableRooms(allRooms);
            setNewBooking((prev) => ({
              ...prev,
              roomId: allRooms[0].id,
              roomCode: allRooms[0].name,
              roomType: allRooms[0].type,
              pricePerNight: allRooms[0].price,
              depositAmount: Math.round(allRooms[0].price * 0.5)
            }));
          }
        }
      } catch (err) {
        console.warn('Lỗi nạp rooms:', err);
      }
    } catch (error) {
      console.error('Lỗi khi nạp dữ liệu đặt phòng:', error);
      showToast('Không thể kết nối đến máy chủ CSDL', 'error');
    } finally {
      setLoading(false);
    }
  };

  const normalizeStatus = (status) => {
    if (!status) return 'pending';
    const s = String(status).toLowerCase();
    if (s.includes('chờ xác nhận') || s.includes('pending')) return 'pending';
    if (s.includes('check-in') || s.includes('cọc') || s.includes('confirmed') || s.includes('deposit')) return 'deposit';
    if (s.includes('đang ở') || s.includes('ở') || s.includes('staying') || s.includes('occupied') || s.includes('checked_in')) return 'staying';
    if (s.includes('hoàn tất') || s.includes('completed')) return 'completed';
    if (s.includes('hủy') || s.includes('cancel') || s.includes('rejected')) return 'cancelled';
    return 'pending';
  };

  const handleHomestayChange = (e) => {
    const newId = e.target.value;
    setSelectedHomestayId(newId);
    localStorage.setItem('ownerActiveHomestayId', newId);
    loadAllData(newId);
    if (!newId) {
      showToast('Đang hiển thị đơn của tất cả homestay', 'success');
    } else {
      showToast(`Đã chuyển sang homestay #${newId}`, 'success');
    }
  };

  // ─── Filtered Bookings List ───────────────────────────────────
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Filter by status
      if (statusFilter !== 'all') {
        const norm = normalizeStatus(b.status);
        if (statusFilter !== norm) return false;
      }
      // Filter by room
      if (roomFilter && !(b.roomName || b.roomCode || '').toLowerCase().includes(roomFilter.toLowerCase())) {
        return false;
      }
      // Filter by search keyword
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const code = (b.bookingCode || '').toLowerCase();
        const guest = (b.guestName || '').toLowerCase();
        const phone = (b.guestPhone || b.phone || '').toLowerCase();
        const hsName = (b.homestayName || '').toLowerCase();
        if (!code.includes(q) && !guest.includes(q) && !phone.includes(q) && !hsName.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [bookings, statusFilter, roomFilter, searchQuery]);

  // ─── KPI Calculations ─────────────────────────────────────────
  const kpiData = useMemo(() => {
    let pending = 0;
    let checkinToday = 0;
    let checkoutToday = 0;
    let totalDeposit = 0;
    const todayStr = new Date().toISOString().split('T')[0];

    bookings.forEach((b) => {
      const norm = normalizeStatus(b.status);
      if (norm === 'pending') pending++;
      if (norm === 'deposit' || (b.checkInDate && String(b.checkInDate).startsWith(todayStr))) checkinToday++;
      if (norm === 'staying' || (b.checkOutDate && String(b.checkOutDate).startsWith(todayStr))) checkoutToday++;
      totalDeposit += Number(b.depositAmount) || 0;
    });

    return {
      pending,
      checkinToday,
      checkoutToday,
      totalDeposit
    };
  }, [bookings]);

  // Status Tab Counts
  const statusCounts = useMemo(() => {
    let p = 0, d = 0, s = 0, c = 0, x = 0;
    bookings.forEach((b) => {
      const norm = normalizeStatus(b.status);
      if (norm === 'pending') p++;
      else if (norm === 'deposit') d++;
      else if (norm === 'staying') s++;
      else if (norm === 'completed') c++;
      else if (norm === 'cancelled') x++;
    });
    return {
      all: bookings.length,
      pending: p,
      deposit: d,
      staying: s,
      completed: c,
      cancelled: x
    };
  }, [bookings]);

  // ─── Modal Triggers ───────────────────────────────────────────
  const createNights = useMemo(() => {
    if (!newBooking.checkIn || !newBooking.checkOut) return 1;
    const d1 = new Date(newBooking.checkIn);
    const d2 = new Date(newBooking.checkOut);
    const diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
    return Math.max(1, isNaN(diff) ? 1 : diff);
  }, [newBooking.checkIn, newBooking.checkOut]);

  const openModal = (modalName, bookingId = null) => {
    if (bookingId) setCurrentBookingId(bookingId);
    setActiveModal(modalName);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  // ─── Modal Actions Handlers ───────────────────────────────────
  const handleCreateBooking = async (e) => {
    e.preventDefault();
    if (!newBooking.guestName || !newBooking.phone) {
      showToast('Vui lòng điền họ tên và số điện thoại khách hàng!', 'error');
      return;
    }

    try {
      const targetHsId = selectedHomestayId ? Number(selectedHomestayId) : (ownerHomestays[0]?.id || 1);
      const targetRoomId = newBooking.roomId ? Number(newBooking.roomId) : (availableRooms[0]?.id || null);

      const payload = {
        homestayId: targetHsId,
        guestName: newBooking.guestName.trim(),
        phone: newBooking.phone.trim(),
        cccd: newBooking.cccd ? newBooking.cccd.trim() : 'Chưa cập nhật',
        city: newBooking.city ? newBooking.city.trim() : 'Hà Nội',
        roomId: targetRoomId,
        roomCode: newBooking.roomCode,
        roomType: newBooking.roomType,
        guestsCount: Number(newBooking.guestsCount) || 2,
        checkIn: newBooking.checkIn,
        checkOut: newBooking.checkOut,
        pricePerNight: Number(newBooking.pricePerNight) || 950000,
        depositAmount: Number(newBooking.depositAmount) || Math.round((Number(newBooking.pricePerNight) || 950000) * createNights * 0.5),
        paymentMethod: newBooking.paymentMethod || 'Chuyển khoản VietQR',
        specialRequest: newBooking.specialRequest ? newBooking.specialRequest.trim() : '',
        source: 'Trực tiếp'
      };

      const res = await ownerBookingService.createDirectBooking(payload);
      showToast(`Đã tạo thành công đơn đặt phòng #${res?.booking?.bookingCode || res?.bookingCode || 'mới'}!`, 'success');
      closeModal();
      loadAllData(selectedHomestayId);
    } catch (err) {
      console.error(err);
      showToast('Có lỗi xảy ra khi tạo đơn đặt phòng: ' + (err.response?.data?.message || err.message), 'error');
    }
  };

  const handleConfirmCheckin = async () => {
    try {
      const bId = currentBooking.id || currentBookingId;
      await ownerBookingService.checkinBooking(bId, checkinForm);
      showToast(`Đã hoàn tất check-in nhận phòng cho đơn #${currentBooking.bookingCode || currentBookingId}!`, 'success');
      closeModal();
      loadAllData(selectedHomestayId);
    } catch (err) {
      console.error(err);
      showToast('Lỗi Check-in: ' + err.message, 'error');
    }
  };

  const handleConfirmCheckout = async () => {
    try {
      const bId = currentBooking.id || currentBookingId;
      await ownerBookingService.checkoutBooking(bId, checkoutForm);
      showToast(`Đã quyết toán & hoàn tất check-out cho đơn #${currentBooking.bookingCode || currentBookingId}!`, 'success');
      closeModal();
      loadAllData(selectedHomestayId);
    } catch (err) {
      console.error(err);
      showToast('Lỗi Check-out: ' + err.message, 'error');
    }
  };

  const handleApproveBooking = async () => {
    try {
      const bId = currentBooking.id || currentBookingId;
      await ownerBookingService.approveBooking(bId, { confirmDeposit: true, note: 'Chủ nhà đã duyệt đơn qua hệ thống' });
      showToast(`Đã duyệt đơn và xác nhận giữ phòng #${currentBooking.bookingCode || currentBookingId}!`, 'success');
      closeModal();
      loadAllData(selectedHomestayId);
    } catch (err) {
      console.error(err);
      showToast('Lỗi duyệt đơn: ' + err.message, 'error');
    }
  };

  const handleRejectBooking = async () => {
    try {
      const bId = currentBooking.id || currentBookingId;
      await ownerBookingService.rejectBooking(bId, rejectForm);
      showToast(`Đã từ chối đơn đặt phòng #${currentBooking.bookingCode || currentBookingId}!`, 'success');
      closeModal();
      loadAllData(selectedHomestayId);
    } catch (err) {
      console.error(err);
      showToast('Lỗi từ chối đơn: ' + err.message, 'error');
    }
  };

  const adjustServiceQty = (serviceId, delta) => {
    setServiceQty((prev) => {
      const cur = prev[serviceId] || 0;
      const next = Math.max(0, cur + delta);
      return { ...prev, [serviceId]: next };
    });
  };

  const calculateAddedServicesTotal = useMemo(() => {
    return AVAILABLE_SERVICES.reduce((sum, item) => {
      const q = serviceQty[item.id] || 0;
      return sum + q * item.price;
    }, 0);
  }, [serviceQty]);

  const handleSaveServices = async () => {
    try {
      const bId = currentBooking.id || currentBookingId;
      const selectedServices = Object.entries(serviceQty)
        .filter(([_, qty]) => qty > 0)
        .map(([id, qty]) => {
          const s = AVAILABLE_SERVICES.find((item) => item.id === Number(id));
          return {
            extraId: Number(id),
            name: s ? s.name : 'Dịch vụ phụ trợ',
            qty,
            price: s ? s.price : 0
          };
        });

      if (selectedServices.length > 0) {
        await ownerBookingService.addServices(bId, {
          services: selectedServices
        });
        showToast(`Đã thêm ${selectedServices.length} dịch vụ (${formatVND(calculateAddedServicesTotal)}) vào đơn #${currentBooking.bookingCode || currentBookingId}!`, 'success');
        loadAllData(selectedHomestayId);
      }
      closeModal();
    } catch (err) {
      console.error(err);
      showToast('Thêm dịch vụ thất bại: ' + err.message, 'error');
    }
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  const handleExportSubmit = () => {
    showToast(`Đang tải file báo cáo ${exportConfig.format.toUpperCase()} cho kỳ ${exportConfig.range}...`, 'success');
    setTimeout(() => {
      showToast('Tải xuống báo cáo hoàn tất!', 'success');
      closeModal();
    }, 1200);
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    showToast(`Đã gửi tin nhắn đến khách hàng ${currentBooking.guestName}!`, 'success');
    setChatMessage('');
    closeModal();
  };

  // Helper render status badge
  const renderStatusBadge = (status) => {
    if (!status) return null;
    const norm = normalizeStatus(status);
    switch (norm) {
      case 'pending':
        return (
          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-label-sm text-[11px] font-bold">
            Chờ xác nhận
          </span>
        );
      case 'deposit':
        return (
          <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-900 font-label-sm text-[11px] font-bold">
            {String(status).includes('Check-in') ? 'Chờ Check-in' : 'Đã cọc'}
          </span>
        );
      case 'staying':
        return (
          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 font-label-sm text-[11px] font-bold">
            Đang ở
          </span>
        );
      case 'completed':
        return (
          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 font-label-sm text-[11px] font-bold">
            Đã hoàn tất
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-800 font-label-sm text-[11px] font-bold">
            Đã hủy
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 font-label-sm text-[11px] font-bold">
            {status}
          </span>
        );
    }
  };

  // Current Homestay Name
  const activeHomestayName = useMemo(() => {
    if (!selectedHomestayId) return 'Tất cả Homestay';
    const found = ownerHomestays.find((h) => String(h.id) === String(selectedHomestayId));
    return found ? found.name : `Homestay #${selectedHomestayId}`;
  }, [ownerHomestays, selectedHomestayId]);

  return (
    <div className="manage-booking-wrapper bg-surface font-body-md text-on-surface antialiased min-h-screen">
      <div className="flex flex-col w-full gap-space-lg">
        {/* ── 1. TOP BANNER SECTION ───────────────────────────────── */}
        <section className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-space-lg shadow-sm border border-surface-container">
          <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-secondary/5 blur-3xl pointer-events-none"></div>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md relative z-10">
            <div className="flex flex-col gap-space-xs">
              <div className="flex items-center gap-space-xs">
                <span className="px-space-xs py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-[10.5px] uppercase tracking-wider font-bold">
                  Quản lý Vận Hành
                </span>
                {ownerHomestays.length > 0 && (
                  <select
                    value={selectedHomestayId}
                    onChange={handleHomestayChange}
                    className="text-xs font-semibold bg-surface-container-low border border-outline-variant/60 rounded-md px-2 py-0.5 text-on-surface cursor-pointer focus:outline-none"
                  >
                    <option value="">Tất cả Homestay ({bookings.length} đơn)</option>
                    {ownerHomestays.map((hs) => (
                      <option key={hs.id} value={hs.id}>
                        {hs.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">
                Quản lý đơn đặt phòng (Bookings) - {activeHomestayName}
              </h1>
            </div>

            <div className="flex items-center gap-space-sm shrink-0 flex-wrap">
              <button
                onClick={() => openModal('exportReportModal')}
                className="flex items-center gap-space-xs px-space-md py-space-sm bg-surface-container-low hover:bg-surface-container text-on-surface font-label-lg text-label-lg rounded-lg shadow-sm transition-all duration-200 border border-outline-variant/40"
                type="button"
              >
                <span className="material-symbols-outlined text-[19px] text-outline">file_download</span>
                <span>Xuất file Excel / Báo cáo</span>
              </button>
              <button
                onClick={() => openModal('createBookingModal')}
                className="flex items-center gap-space-xs px-space-md py-space-sm bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg rounded-lg shadow-md transition-all duration-200 custom-primary-bg"
                type="button"
              >
                <span className="material-symbols-outlined text-[19px]">add_circle</span>
                <span>Tạo đơn đặt phòng trực tiếp</span>
              </button>
            </div>
          </div>
        </section>

        {/* ── 2. QUICK KPI BAR ────────────────────────────────────── */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md">
          {/* KPI 1 */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container flex items-center justify-between group hover:shadow-md transition-shadow duration-200">
            <div className="flex flex-col gap-1">
              <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-semibold">
                Đơn chờ xác nhận
              </span>
              <div className="flex items-baseline gap-space-xs">
                <span className="font-display-lg text-display-lg text-on-surface font-bold">
                  {String(kpiData.pending).padStart(2, '0')}
                </span>
                <span className="font-body-sm text-body-sm text-tertiary-container font-semibold">
                  cần duyệt ngay
                </span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-tertiary-fixed/60 flex items-center justify-center text-on-tertiary-fixed-variant shrink-0">
              <span className="material-symbols-outlined text-[24px]">pending_actions</span>
            </div>
          </div>

          {/* KPI 2 */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container flex items-center justify-between group hover:shadow-md transition-shadow duration-200">
            <div className="flex flex-col gap-1">
              <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-semibold">
                Check-in hôm nay
              </span>
              <div className="flex items-baseline gap-space-xs">
                <span className="font-display-lg text-display-lg text-secondary font-bold">
                  {String(kpiData.checkinToday).padStart(2, '0')}
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">đơn đặt</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-secondary-container/70 flex items-center justify-center text-on-secondary-container shrink-0">
              <span className="material-symbols-outlined text-[24px]">login</span>
            </div>
          </div>

          {/* KPI 3 */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container flex items-center justify-between group hover:shadow-md transition-shadow duration-200">
            <div className="flex flex-col gap-1">
              <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-semibold">
                Check-out hôm nay
              </span>
              <div className="flex items-baseline gap-space-xs">
                <span className="font-display-lg text-display-lg text-on-surface font-bold">
                  {String(kpiData.checkoutToday).padStart(2, '0')}
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">phòng</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-on-surface-variant shrink-0">
              <span className="material-symbols-outlined text-[24px]">logout</span>
            </div>
          </div>

          {/* KPI 4 */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container flex items-center justify-between group hover:shadow-md transition-shadow duration-200">
            <div className="flex flex-col gap-1">
              <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-semibold">
                Tiền cọc sàn đang giữ
              </span>
              <div className="flex items-baseline gap-space-xs">
                <span className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold">
                  {formatVND(kpiData.totalDeposit)}
                </span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary-fixed/50 flex items-center justify-center text-on-primary-fixed-variant shrink-0">
              <span className="material-symbols-outlined text-[24px]">account_balance_wallet</span>
            </div>
          </div>
        </section>

        {/* ── 3. MAIN GRID LAYOUT (8 COLS & 4 COLS) ─────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg items-start">
          {/* Left 8 Columns */}
          <div className="xl:col-span-8 flex flex-col gap-space-md">
            {/* Search & Filter Controls */}
            <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container flex flex-col gap-space-sm">
              <div className="flex flex-col md:flex-row md:items-center gap-space-sm">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-outline">
                    search
                  </span>
                  <input
                    className="w-full pl-9 pr-space-md py-space-xs text-body-md font-body-md rounded-lg bg-surface-container-low text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-secondary transition-all"
                    placeholder="Tìm mã booking, tên khách, số điện thoại..."
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="relative w-full md:w-48 shrink-0">
                  <select
                    className="w-full px-space-sm py-space-xs appearance-none rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-secondary cursor-pointer"
                    value={roomFilter}
                    onChange={(e) => setRoomFilter(e.target.value)}
                  >
                    <option value="">Tất cả loại phòng</option>
                    <option value="Mountain">Mountain View</option>
                    <option value="Lake">Lake View</option>
                    <option value="Bungalow">Bungalow Suối</option>
                    <option value="Sàn">Nhà Sàn Trải Nghiệm</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2.5 top-2.5 text-[16px] text-outline pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-space-xs overflow-x-auto pb-1 pt-1 scrollbar-none">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`status-tab px-space-sm py-1 rounded-full text-label-md font-label-md whitespace-nowrap transition-all ${
                    statusFilter === 'all'
                      ? 'bg-primary text-on-primary custom-primary-bg font-bold'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                  type="button"
                >
                  Tất cả ({statusCounts.all})
                </button>
                <button
                  onClick={() => setStatusFilter('pending')}
                  className={`status-tab px-space-sm py-1 rounded-full text-label-md font-label-md whitespace-nowrap transition-all ${
                    statusFilter === 'pending'
                      ? 'bg-primary text-on-primary custom-primary-bg font-bold'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                  type="button"
                >
                  Chờ xác nhận ({statusCounts.pending})
                </button>
                <button
                  onClick={() => setStatusFilter('deposit')}
                  className={`status-tab px-space-sm py-1 rounded-full text-label-md font-label-md whitespace-nowrap transition-all ${
                    statusFilter === 'deposit'
                      ? 'bg-primary text-on-primary custom-primary-bg font-bold'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                  type="button"
                >
                  Đã cọc ({statusCounts.deposit})
                </button>
                <button
                  onClick={() => setStatusFilter('staying')}
                  className={`status-tab px-space-sm py-1 rounded-full text-label-md font-label-md whitespace-nowrap transition-all ${
                    statusFilter === 'staying'
                      ? 'bg-primary text-on-primary custom-primary-bg font-bold'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                  type="button"
                >
                  Đang ở ({statusCounts.staying})
                </button>
                <button
                  onClick={() => setStatusFilter('completed')}
                  className={`status-tab px-space-sm py-1 rounded-full text-label-md font-label-md whitespace-nowrap transition-all ${
                    statusFilter === 'completed'
                      ? 'bg-primary text-on-primary custom-primary-bg font-bold'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                  type="button"
                >
                  Đã hoàn tất ({statusCounts.completed})
                </button>
                <button
                  onClick={() => setStatusFilter('cancelled')}
                  className={`status-tab px-space-sm py-1 rounded-full text-label-md font-label-md whitespace-nowrap transition-all ${
                    statusFilter === 'cancelled'
                      ? 'bg-primary text-on-primary custom-primary-bg font-bold'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                  type="button"
                >
                  Đã hủy ({statusCounts.cancelled})
                </button>
              </div>
            </div>

            {/* Bookings Data Table */}
            <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container overflow-hidden flex flex-col">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low text-outline uppercase font-label-sm text-label-sm tracking-wider border-b border-surface-container">
                      <th className="py-3 px-4 font-semibold">Mã Booking</th>
                      <th className="py-3 px-4 font-semibold">Khách hàng</th>
                      <th className="py-3 px-4 font-semibold">Phòng & Số khách</th>
                      <th className="py-3 px-4 font-semibold">Lịch trình lưu trú</th>
                      <th className="py-3 px-4 font-semibold text-right">Tiền cọc sàn giữ</th>
                      <th className="py-3 px-4 font-semibold text-right">Tổng tiền</th>
                      <th className="py-3 px-4 font-semibold text-center">Trạng thái</th>
                      <th className="py-3 px-4 font-semibold text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-low text-body-md font-body-md">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-outline">
                          Đang tải dữ liệu từ CSDL...
                        </td>
                      </tr>
                    ) : filteredBookings.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-outline">
                          Không tìm thấy đơn đặt phòng nào phù hợp.
                        </td>
                      </tr>
                    ) : (
                      filteredBookings.map((b) => (
                        <tr key={b.id || b.bookingCode} className="hover:bg-surface-container-low/50 transition-colors group">
                          <td className="py-3.5 px-4 font-label-md text-label-md text-primary font-bold">
                            #{b.bookingCode || `BK-${b.id}`}
                            <span className="block text-[10px] font-normal text-outline">
                              {b.source || 'OTA Sàn VN'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-space-xs">
                              <div className="w-7 h-7 rounded-full bg-secondary-fixed-dim/40 flex items-center justify-center text-on-secondary-fixed font-bold text-xs shrink-0">
                                {(b.guestName || 'K')[0]}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-label-md text-label-md text-on-surface font-semibold truncate">
                                  {b.guestName || 'Khách vãng lai'}
                                </span>
                                <span className="text-body-sm font-body-sm text-on-surface-variant">
                                  {b.guestPhone || b.phone || '0982***112'}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col">
                              <span className="font-label-md text-label-md text-on-surface font-medium">
                                {b.roomName || 'Mountain View #01'}
                              </span>
                              <span className="text-body-sm font-body-sm text-outline">
                                {b.guestsCount ? `${b.guestsCount} khách` : (b.guestsLabel || '1 khách')}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col">
                              <span className="font-label-md text-label-md text-secondary font-bold">
                                {b.checkInDate ? String(b.checkInDate).substring(0, 10) : (b.checkIn || '—')} -{' '}
                                {b.checkOutDate ? String(b.checkOutDate).substring(0, 10) : (b.checkOut || '—')}
                              </span>
                              <span className="text-body-sm font-body-sm text-outline">
                                {b.nights ? `${b.nights} đêm` : '1 đêm'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right font-label-md text-label-md text-secondary font-semibold">
                            {formatVND(b.depositAmount !== undefined && b.depositAmount !== null ? b.depositAmount : 0)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-headline-sm text-headline-sm text-on-surface font-bold">
                            {formatVND(b.totalAmount !== undefined && b.totalAmount !== null ? b.totalAmount : 0)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {renderStatusBadge(b.status)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => openModal('detailBookingModal', b.bookingCode || b.id)}
                                title="Xem chi tiết"
                                className="w-8 h-8 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface flex items-center justify-center transition-colors"
                                type="button"
                              >
                                <span className="material-symbols-outlined text-[17px]">visibility</span>
                              </button>

                              {/* Action buttons based on status */}
                              {normalizeStatus(b.status) === 'pending' && (
                                <button
                                  onClick={() => openModal('approveBookingModal', b.bookingCode || b.id)}
                                  title="Duyệt đơn & Giữ phòng"
                                  className="w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-colors shadow-sm"
                                  type="button"
                                >
                                  <span className="material-symbols-outlined text-[17px]">check_circle</span>
                                </button>
                              )}

                              {normalizeStatus(b.status) === 'deposit' && (
                                <button
                                  onClick={() => openModal('checkinModal', b.bookingCode || b.id)}
                                  title="Check-in nhận phòng"
                                  className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors shadow-sm"
                                  type="button"
                                >
                                  <span className="material-symbols-outlined text-[17px]">login</span>
                                </button>
                              )}

                              {normalizeStatus(b.status) === 'staying' && (
                                <>
                                  <button
                                    onClick={() => openModal('addServiceModal', b.bookingCode || b.id)}
                                    title="Thêm dịch vụ"
                                    className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center transition-colors custom-primary-bg"
                                    type="button"
                                  >
                                    <span className="material-symbols-outlined text-[17px]">room_service</span>
                                  </button>
                                  <button
                                    onClick={() => openModal('checkoutModal', b.bookingCode || b.id)}
                                    title="Check-out & Quyết toán"
                                    className="w-8 h-8 rounded-lg bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center transition-colors"
                                    type="button"
                                  >
                                    <span className="material-symbols-outlined text-[17px]">logout</span>
                                  </button>
                                </>
                              )}

                              {(normalizeStatus(b.status) === 'pending' || normalizeStatus(b.status) === 'deposit') && (
                                <button
                                  onClick={() => openModal('rejectModal', b.bookingCode || b.id)}
                                  title="Từ chối / Hủy đơn"
                                  className="w-8 h-8 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 flex items-center justify-center transition-colors"
                                  type="button"
                                >
                                  <span className="material-symbols-outlined text-[17px]">cancel</span>
                                </button>
                              )}

                              <button
                                onClick={() => openModal('invoiceModal', b.bookingCode || b.id)}
                                title="Hóa đơn"
                                className="w-8 h-8 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface flex items-center justify-center transition-colors"
                                type="button"
                              >
                                <span className="material-symbols-outlined text-[17px]">receipt_long</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right 4 Columns */}
          <div className="xl:col-span-4 flex flex-col gap-space-md">
            {/* Feature Card: Check-in nhanh hôm nay */}
            <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container overflow-hidden flex flex-col">
              <div className="p-space-md bg-primary-container text-on-primary flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-[20px] text-primary-fixed">badge</span>
                  <h2 className="font-headline-sm text-headline-sm text-on-primary font-bold">
                    Check-in nhanh hôm nay
                  </h2>
                </div>
                <span className="px-space-xs py-0.5 rounded-full bg-secondary text-on-secondary font-label-sm text-[10px] font-bold uppercase">
                  Sắp đến
                </span>
              </div>
              <div className="p-space-md flex flex-col gap-space-md">
                <div className="flex items-center gap-space-sm">
                  <img
                    className="w-14 h-14 rounded-xl object-cover shrink-0 shadow-sm"
                    alt="Chân dung nữ du khách"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuA0LFSerZuRWRa-xYFKGn0v9Z7yaO3TJcniYry7vFR_CNLVdUzBx82AtU9qTsUosSm_cVRV-LR_jKwTuoFPG-EeKZkuXgN-XFKhCKmGUPU95IYF-Neyeva84ZwupG97XUHWs8qt5O8BKkpjXazR3XTGVmtlpdT64Cal4NtBQx_mNvBXaGg33t8hGkimNQpk6iGHK7QXHMZkp17dvnr72Tgr-dgQV9ur5Zr1URU3oLW1q2Pndz6dbLs"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="font-headline-sm text-headline-sm text-on-surface truncate font-bold">
                      {currentBooking.guestName || 'Nguyễn Thị Mai'}
                    </span>
                    <span className="font-body-sm text-body-sm text-outline">
                      {currentBooking.guestPhone || currentBooking.phone || '0982***112'} • Hà Nội
                    </span>
                    <span className="font-label-sm text-label-sm text-secondary font-bold mt-0.5">
                      Mã: #{currentBooking.bookingCode || 'BK-9842'}
                    </span>
                  </div>
                </div>

                <div className="p-space-sm rounded-lg bg-surface-container-low flex flex-col gap-space-xs border border-surface-container">
                  <div className="flex items-center justify-between">
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Phòng chỉ định:</span>
                    <span className="font-label-md text-label-md text-on-surface font-bold">
                      {currentBooking.roomName || 'Chưa xếp phòng'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Giờ dự kiến đến:</span>
                    <span className="font-label-md text-label-md text-secondary font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">schedule</span>{' '}
                      {currentBooking.checkInTime || '14:00'} ({currentBooking.checkIn || (currentBooking.checkInDate ? String(currentBooking.checkInDate).substring(0, 10) : 'Hôm nay')})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Số lượng khách:</span>
                    <span className="font-label-md text-label-md text-on-surface">
                      {currentBooking.guestsCount ? `${currentBooking.guestsCount} người lớn` : (currentBooking.guestsLabel || '2 người lớn')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Tình trạng cọc sàn:</span>
                    <span className="font-label-md text-label-md text-secondary font-bold">
                      Đã thu: {formatVND(currentBooking.depositAmount || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Còn phải thu tại quầy:</span>
                    <span className="font-label-md text-label-md text-error font-bold">
                      {formatVND(
                        Math.max(0, (currentBooking.totalAmount || 0) - (currentBooking.depositAmount || 0))
                      )}
                    </span>
                  </div>
                </div>

                <div className="p-space-sm rounded-lg bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-space-xs">
                  <span className="material-symbols-outlined text-[18px] text-amber-700 shrink-0 mt-0.5">
                    restaurant
                  </span>
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md font-bold text-amber-950">
                      Yêu cầu & Ghi chú đặc biệt:
                    </span>
                    <p className="font-body-sm text-body-sm mt-0.5 text-amber-900 italic">
                      “{currentBooking.specialRequest || 'Không có ghi chú đặc biệt.'}”
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-space-xs pt-space-xs">
                  {normalizeStatus(currentBooking.status) === 'pending' && (
                    <button
                      onClick={() => openModal('approveBookingModal', currentBooking.bookingCode || currentBooking.id)}
                      className="w-full py-2.5 px-space-md rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-label-lg text-label-lg font-bold shadow-sm transition-all flex items-center justify-center gap-space-xs"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[20px]">check_circle</span>
                      <span>Duyệt đơn & Giữ phòng</span>
                    </button>
                  )}
                  {normalizeStatus(currentBooking.status) === 'deposit' && (
                    <button
                      onClick={() => openModal('checkinModal', currentBooking.bookingCode || currentBooking.id)}
                      className="w-full py-2.5 px-space-md rounded-lg bg-secondary hover:bg-secondary/95 text-on-secondary font-label-lg text-label-lg font-bold shadow-sm transition-all flex items-center justify-center gap-space-xs custom-secondary-bg"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
                      <span>Đánh dấu khách đã nhận phòng</span>
                    </button>
                  )}
                  {normalizeStatus(currentBooking.status) === 'staying' && (
                    <button
                      onClick={() => openModal('checkoutModal', currentBooking.bookingCode || currentBooking.id)}
                      className="w-full py-2.5 px-space-md rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-label-lg text-label-lg font-bold shadow-sm transition-all flex items-center justify-center gap-space-xs"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[20px]">logout</span>
                      <span>Check-out & Quyết toán</span>
                    </button>
                  )}
                  {normalizeStatus(currentBooking.status) === 'completed' && (
                    <button
                      onClick={() => openModal('invoiceModal', currentBooking.bookingCode || currentBooking.id)}
                      className="w-full py-2.5 px-space-md rounded-lg bg-primary hover:bg-primary/95 text-on-primary font-label-lg text-label-lg font-bold shadow-sm transition-all flex items-center justify-center gap-space-xs custom-primary-bg"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[20px]">receipt</span>
                      <span>Xem hóa đơn thanh toán</span>
                    </button>
                  )}
                  <div className="grid grid-cols-2 gap-space-xs">
                    <button
                      onClick={() => {
                        setContactTab('call');
                        openModal('contactGuestModal', currentBooking.bookingCode || currentBooking.id);
                      }}
                      className="py-2 px-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md transition-all flex items-center justify-center gap-1 border border-outline-variant/30"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[16px] text-outline">call</span>
                      <span>Gọi cho khách</span>
                    </button>
                    <button
                      onClick={() => {
                        setContactTab('chat');
                        openModal('contactGuestModal', currentBooking.bookingCode || currentBooking.id);
                      }}
                      className="py-2 px-space-sm rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md transition-all flex items-center justify-center gap-1 border border-outline-variant/30"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[16px] text-outline">chat</span>
                      <span>Nhắn qua sàn</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Checklist Card */}
            <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container p-space-md flex flex-col gap-space-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-[20px] text-secondary">checklist</span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                    Nhiệm vụ buồng phòng hôm nay
                  </h3>
                </div>
                <span className="font-label-sm text-label-sm text-outline font-semibold">
                  {cleaningChecklist.filter((c) => c.done).length}/{cleaningChecklist.length} hoàn tất
                </span>
              </div>
              <div className="flex flex-col gap-space-xs">
                {cleaningChecklist.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center gap-space-xs p-space-xs rounded-lg hover:bg-surface-container-low cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => toggleChecklist(item.id)}
                      className="w-4 h-4 rounded text-secondary focus:ring-secondary accent-secondary"
                    />
                    <span
                      className={`font-body-sm text-body-sm ${
                        item.done ? 'text-outline line-through' : 'text-on-surface font-medium'
                      }`}
                    >
                      {item.text}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/*                   HỆ THỐNG TOÀN BỘ 10 POPUP / MODAL CHUYÊN NGHIỆP         */}
      {/* ========================================================================= */}

      {/* 1. POPUP TẠO ĐƠN ĐẶT PHÒNG TRỰC TIẾP */}
      {activeModal === 'createBookingModal' && (
        <div className="bk-modal">
          <div className="bk-modal-content bk-modal-lg">
            <div className="bk-modal-header-primary">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[24px]">add_circle</span>
                <div className="flex flex-col">
                  <h3 className="bk-modal-title">Tạo đơn đặt phòng trực tiếp</h3>
                  <span className="bk-modal-subtitle">
                    Dành cho khách đặt qua hotline, Zalo hoặc đến nhận phòng tại chỗ
                  </span>
                </div>
              </div>
              <button onClick={closeModal} className="bk-modal-close-light" type="button" title="Đóng">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateBooking}>
              <div className="bk-modal-body">
                {/* Phần 1: Thông tin khách hàng */}
                <div className="flex flex-col gap-space-xs">
                  <span className="font-label-md text-label-md text-primary font-bold flex items-center gap-1 uppercase tracking-wider">
                    <span className="material-symbols-outlined text-[16px]">person</span> 1. Thông tin khách lưu trú
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
                    <div className="flex flex-col gap-1">
                      <label className="bk-form-label">
                        Họ và tên khách hàng <span className="text-error">*</span>
                      </label>
                      <input
                        type="text"
                        className="bk-form-input"
                        placeholder="Ví dụ: Hoàng Minh Đức"
                        value={newBooking.guestName}
                        onChange={(e) => setNewBooking({ ...newBooking, guestName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="bk-form-label">
                        Số điện thoại <span className="text-error">*</span>
                      </label>
                      <input
                        type="tel"
                        className="bk-form-input"
                        placeholder="09xx xxx xxx"
                        value={newBooking.phone}
                        onChange={(e) => setNewBooking({ ...newBooking, phone: e.target.value })}
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="bk-form-label">CCCD / Hộ chiếu (Khai báo tạm trú)</label>
                      <input
                        type="text"
                        className="bk-form-input"
                        placeholder="12 chữ số CCCD..."
                        value={newBooking.cccd}
                        onChange={(e) => setNewBooking({ ...newBooking, cccd: e.target.value })}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="bk-form-label">Tỉnh / Thành phố cư trú</label>
                      <input
                        type="text"
                        className="bk-form-input"
                        placeholder="Ví dụ: Hà Nội, Hải Phòng..."
                        value={newBooking.city}
                        onChange={(e) => setNewBooking({ ...newBooking, city: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Phần 2: Chọn phòng & Lịch trình */}
                <div className="flex flex-col gap-space-xs pt-1 border-t border-surface-container">
                  <span className="font-label-md text-label-md text-primary font-bold flex items-center gap-1 uppercase tracking-wider">
                    <span className="material-symbols-outlined text-[16px]">hotel</span> 2. Chi tiết phòng & Lịch lưu trú
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm">
                    <div className="flex flex-col gap-1">
                      <label className="bk-form-label">Chọn loại phòng</label>
                      <select
                        className="bk-form-select"
                        value={newBooking.roomId}
                        onChange={(e) => {
                          const r = availableRooms.find((rm) => String(rm.id) === e.target.value);
                          if (r) {
                            setNewBooking({
                              ...newBooking,
                              roomId: r.id,
                              roomCode: r.name,
                              roomType: r.type,
                              pricePerNight: r.price,
                              depositAmount: Math.round(r.price * 0.5)
                            });
                          }
                        }}
                      >
                        {availableRooms.length > 0 ? (
                          availableRooms.map((rm) => (
                            <option key={rm.id} value={rm.id}>
                              {rm.name} - {formatVND(rm.price)}/đêm
                            </option>
                          ))
                        ) : (
                          <>
                            <option value="mountain">Mountain View (Nhà Gỗ - 950.000đ/đêm)</option>
                            <option value="lake">Lake View (Ven Hồ - 1.100.000đ/đêm)</option>
                            <option value="bungalow">Bungalow Suối (1.250.000đ/đêm)</option>
                            <option value="dorm">Nhà Sàn Trải Nghiệm (350.000đ/người)</option>
                          </>
                        )}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="bk-form-label">Số lượng khách</label>
                      <select
                        className="bk-form-select"
                        value={newBooking.guestsCount}
                        onChange={(e) => setNewBooking({ ...newBooking, guestsCount: e.target.value })}
                      >
                        <option value="1">1 Người lớn</option>
                        <option value="2">2 Người lớn</option>
                        <option value="3">3 Người lớn (+ đệm phụ)</option>
                        <option value="4">Gia đình (2 người lớn + 2 trẻ em)</option>
                        <option value="6">Đoàn thể (6 - 10 người)</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="bk-form-label">Ngày Check-in</label>
                      <input
                        type="date"
                        className="bk-form-input"
                        value={newBooking.checkIn}
                        onChange={(e) => setNewBooking({ ...newBooking, checkIn: e.target.value })}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="bk-form-label">Ngày Check-out</label>
                      <input
                        type="date"
                        className="bk-form-input"
                        value={newBooking.checkOut}
                        onChange={(e) => setNewBooking({ ...newBooking, checkOut: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Phần 3: Tính toán chi phí & Tiền cọc */}
                <div className="p-space-sm rounded-xl bg-surface-container-low flex flex-col gap-space-xs border border-surface-container">
                  <div className="flex items-center justify-between text-body-sm">
                    <span className="text-on-surface-variant">Đơn giá phòng mỗi đêm:</span>
                    <span className="font-bold text-on-surface">{formatVND(newBooking.pricePerNight)}</span>
                  </div>
                  <div className="flex items-center justify-between text-body-sm">
                    <span className="text-on-surface-variant">Thời gian lưu trú:</span>
                    <span className="font-semibold text-secondary">{createNights} đêm</span>
                  </div>
                  <div className="flex items-center justify-between text-body-md border-t border-surface-container pt-1">
                    <span className="font-bold text-on-surface">Tạm tính tiền phòng:</span>
                    <span className="font-headline-sm text-primary font-bold">
                      {formatVND(newBooking.pricePerNight * createNights)}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm pt-2">
                    <div className="flex flex-col gap-1">
                      <label className="bk-form-label">Số tiền cọc thu trước</label>
                      <input
                        type="number"
                        className="bk-form-input font-bold text-secondary"
                        value={newBooking.depositAmount}
                        onChange={(e) => setNewBooking({ ...newBooking, depositAmount: Number(e.target.value) })}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="bk-form-label">Phương thức nhận cọc</label>
                      <select
                        className="bk-form-select"
                        value={newBooking.paymentMethod}
                        onChange={(e) => setNewBooking({ ...newBooking, paymentMethod: e.target.value })}
                      >
                        <option value="Chuyển khoản VietQR">Chuyển khoản VietQR</option>
                        <option value="Tiền mặt tại quầy">Tiền mặt tại quầy</option>
                        <option value="Quẹt thẻ POS">Quẹt thẻ POS</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 pt-1">
                    <label className="bk-form-label">Yêu cầu & Ghi chú đặc biệt:</label>
                    <textarea
                      rows={2}
                      className="bk-form-textarea"
                      placeholder="Ăn tối, thêm giường phụ, chỉ dẫn đường đi..."
                      value={newBooking.specialRequest}
                      onChange={(e) => setNewBooking({ ...newBooking, specialRequest: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="bk-modal-footer">
                <button onClick={closeModal} className="bk-btn bk-btn-cancel" type="button">
                  Hủy bỏ
                </button>
                <button type="submit" className="bk-btn bk-btn-save">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  <span>Lưu & Xác nhận đặt phòng</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. POPUP CHI TIẾT ĐƠN ĐẶT PHÒNG (BOOKING DETAILS) */}
      {activeModal === 'detailBookingModal' && (
        <div className="bk-modal">
          <div className="bk-modal-content bk-modal-lg">
            <div className="bk-modal-header-surface">
              <div className="flex items-center gap-space-xs flex-wrap">
                <span className="material-symbols-outlined text-[22px] text-primary">receipt_long</span>
                <h3 className="bk-modal-title flex items-center gap-2">
                  Chi tiết đơn <span className="text-primary font-bold">#{currentBooking.bookingCode || 'BK-9842'}</span>
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-surface-container text-outline text-[11px] font-label-md">
                  {currentBooking.source || 'OTA Sàn VN'}
                </span>
                {renderStatusBadge(currentBooking.status)}
              </div>
              <button onClick={closeModal} className="bk-modal-close" type="button" title="Đóng">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="bk-modal-body">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-space-md">
                {/* Cột trái: Thông tin khách & Phòng (7 Cột) */}
                <div className="md:col-span-7 flex flex-col gap-space-md">
                  {/* Thẻ khách hàng */}
                  <div className="p-space-sm rounded-xl bg-surface-container-low flex items-center gap-space-sm border border-surface-container">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center font-bold text-xl shrink-0 bg-secondary-fixed-dim/40 text-on-secondary-fixed">
                      {(currentBooking.guestName || 'K')[0]}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-headline-sm text-headline-sm text-on-surface font-bold truncate">
                        {currentBooking.guestName || 'Khách lưu trú'}
                      </span>
                      <span className="font-body-sm text-body-sm text-outline flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">phone</span>
                        <span>{currentBooking.guestPhone || currentBooking.phone || 'Chưa cập nhật'}</span>
                        <span>•</span>
                        <span>{currentBooking.city || 'Việt Nam'}</span>
                      </span>
                      <span className="text-body-sm text-[11px] text-on-surface-variant flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-[13px]">mail</span>
                        <span>{currentBooking.email || 'Chưa cập nhật'}</span>
                        <span>• CCCD:</span>
                        <span className="font-medium">{currentBooking.cccd || 'Chưa cập nhật'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Thẻ chi tiết phòng & Lưu trú */}
                  <div className="p-space-sm rounded-xl bg-surface-container-low flex flex-col gap-space-xs border border-surface-container">
                    <div className="flex items-center justify-between">
                      <span className="font-body-sm text-on-surface-variant">Phòng chỉ định:</span>
                      <span className="font-label-md text-on-surface font-bold">
                        {currentBooking.roomName || 'Chưa xếp phòng'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-body-sm text-on-surface-variant">Loại phòng:</span>
                      <span className="font-label-md text-on-surface">
                        {currentBooking.roomType || 'Phòng tiêu chuẩn'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-body-sm text-on-surface-variant">Số lượng khách:</span>
                      <span className="font-label-md text-on-surface">
                        {currentBooking.guestsCount ? `${currentBooking.guestsCount} người lớn` : (currentBooking.guestsLabel || '2 người lớn')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-body-sm text-on-surface-variant">Lịch trình lưu trú:</span>
                      <span className="font-label-md text-secondary font-bold">
                        {currentBooking.checkInDate ? String(currentBooking.checkInDate).substring(0, 10) : (currentBooking.checkIn || '—')} -{' '}
                        {currentBooking.checkOutDate ? String(currentBooking.checkOutDate).substring(0, 10) : (currentBooking.checkOut || '—')}{' '}
                        ({currentBooking.nights ? `${currentBooking.nights} đêm` : '1 đêm'})
                      </span>
                    </div>
                  </div>

                  {/* Ghi chú đặc biệt */}
                  <div className="p-space-sm rounded-xl bg-amber-50 border border-amber-200 flex flex-col gap-1">
                    <span className="font-label-md text-amber-950 font-bold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px] text-amber-700">edit_note</span> Yêu cầu
                      đặc biệt của khách:
                    </span>
                    <p className="font-body-sm text-amber-900 italic leading-relaxed">
                      “{currentBooking.specialRequest || 'Không có yêu cầu đặc biệt.'}”
                    </p>
                  </div>
                </div>

                {/* Cột phải: Tài chính & Tiến trình (5 Cột) */}
                <div className="md:col-span-5 flex flex-col gap-space-md">
                  {/* Tổng quan thanh toán */}
                  <div className="p-space-sm rounded-xl bg-surface-container-lowest border border-surface-container-high flex flex-col gap-space-xs shadow-sm">
                    <span className="font-label-md text-primary font-bold uppercase tracking-wider">
                      Tổng quan thanh toán
                    </span>
                    <div className="flex items-center justify-between text-body-sm">
                      <span className="text-on-surface-variant">Tổng tiền đơn:</span>
                      <span className="font-headline-sm text-on-surface font-bold">
                        {formatVND(currentBooking.totalAmount || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-body-sm">
                      <span className="text-on-surface-variant">Đã cọc (Sàn/CK):</span>
                      <span className="font-label-md text-secondary font-bold">
                        {formatVND(currentBooking.depositAmount || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-body-md border-t border-surface-container pt-1.5">
                      <span className="font-bold text-error">Còn phải thu tại quầy:</span>
                      <span className="font-headline-sm text-error font-bold">
                        {formatVND(
                          Math.max(0, (currentBooking.totalAmount || 0) - (currentBooking.depositAmount || 0))
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Tiến trình đơn */}
                  <div className="p-space-sm rounded-xl bg-surface-container-low border border-surface-container flex flex-col gap-space-sm">
                    <span className="font-label-md text-on-surface font-bold">Tiến trình đơn đặt phòng</span>
                    <div className="flex flex-col gap-2 text-xs">
                      <div className="flex items-center gap-2 text-secondary font-semibold">
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        <span>Đã tạo & xác nhận cọc sàn thành công</span>
                      </div>
                      <div className={`flex items-center gap-2 ${normalizeStatus(currentBooking.status) !== 'pending' ? 'text-secondary font-semibold' : 'text-outline'}`}>
                        <span className="material-symbols-outlined text-[16px]">
                          {normalizeStatus(currentBooking.status) !== 'pending' ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                        <span>Phòng đã được dọn sạch sẵn sàng đón khách</span>
                      </div>
                      <div className={`flex items-center gap-2 ${['staying', 'completed'].includes(normalizeStatus(currentBooking.status)) ? 'text-secondary font-semibold' : 'text-outline'}`}>
                        <span className="material-symbols-outlined text-[16px]">
                          {['staying', 'completed'].includes(normalizeStatus(currentBooking.status)) ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                        <span>Check-in nhận phòng & bàn giao chìa khóa</span>
                      </div>
                      <div className={`flex items-center gap-2 ${normalizeStatus(currentBooking.status) === 'completed' ? 'text-secondary font-semibold' : 'text-outline'}`}>
                        <span className="material-symbols-outlined text-[16px]">
                          {normalizeStatus(currentBooking.status) === 'completed' ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                        <span>Quyết toán dịch vụ & Check-out</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bk-modal-footer-spread">
              <button
                onClick={() => openModal('rejectBookingModal', currentBooking.bookingCode || currentBooking.id)}
                className="bk-btn bk-btn-danger-soft"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">cancel</span>
                <span>Hủy / Từ chối đơn</span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openModal('addServiceModal', currentBooking.bookingCode || currentBooking.id)}
                  className="bk-btn bk-btn-ghost"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">room_service</span>
                  <span>Thêm dịch vụ</span>
                </button>
                {normalizeStatus(currentBooking.status) === 'pending' && (
                  <button
                    onClick={() => openModal('approveBookingModal', currentBooking.bookingCode || currentBooking.id)}
                    className="bk-btn bk-btn-secondary"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    <span>Duyệt đơn & Giữ phòng</span>
                  </button>
                )}
                {normalizeStatus(currentBooking.status) === 'deposit' && (
                  <button
                    onClick={() => openModal('checkinModal', currentBooking.bookingCode || currentBooking.id)}
                    className="bk-btn bk-btn-save"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                    <span>Check-in nhận phòng</span>
                  </button>
                )}
                {normalizeStatus(currentBooking.status) === 'staying' && (
                  <button
                    onClick={() => openModal('checkoutModal', currentBooking.bookingCode || currentBooking.id)}
                    className="bk-btn bk-btn-secondary"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    <span>Check-out & Quyết toán</span>
                  </button>
                )}
                {normalizeStatus(currentBooking.status) === 'completed' && (
                  <button
                    onClick={() => openModal('invoiceModal', currentBooking.bookingCode || currentBooking.id)}
                    className="bk-btn bk-btn-save"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">receipt</span>
                    <span>Xem hóa đơn</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. POPUP XÁC NHẬN CHECK-IN NHẬN PHÒNG */}
      {activeModal === 'checkinModal' && (
        <div className="bk-modal">
          <div className="bk-modal-content">
            <div className="bk-modal-header-secondary">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[24px]">login</span>
                <div className="flex flex-col">
                  <h3 className="bk-modal-title">Thủ tục Check-in nhận phòng</h3>
                  <span className="bk-modal-subtitle">
                    Mã đơn: <strong className="text-on-secondary">#{currentBooking.bookingCode || 'BK-9842'}</strong>
                  </span>
                </div>
              </div>
              <button onClick={closeModal} className="bk-modal-close-light" type="button" title="Đóng">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="bk-modal-body">
              {/* Tóm tắt phòng & khách */}
              <div className="p-space-sm rounded-xl bg-surface-container-low flex items-center justify-between border border-surface-container">
                <div className="flex flex-col">
                  <span className="font-headline-sm text-on-surface font-bold">
                    {currentBooking.guestName || 'Khách lưu trú'}
                  </span>
                  <span className="font-body-sm text-outline">
                    {currentBooking.guestPhone || currentBooking.phone || 'Chưa cập nhật'}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-label-md text-secondary font-bold">
                    {currentBooking.roomName || 'Chưa xếp phòng'}
                  </span>
                  <span className="font-body-sm text-outline">
                    {currentBooking.checkInDate ? String(currentBooking.checkInDate).substring(0, 10) : (currentBooking.checkIn || '—')} -{' '}
                    {currentBooking.checkOutDate ? String(currentBooking.checkOutDate).substring(0, 10) : (currentBooking.checkOut || '—')}
                  </span>
                </div>
              </div>

              {/* Bước 1: Khai báo lưu trú CCCD */}
              <div className="flex flex-col gap-1">
                <label className="bk-form-label flex items-center justify-between">
                  <span>1. Xác thực CCCD / Giấy tờ tùy thân:</span>
                  <button
                    onClick={() => showToast('Đã quét lưu trữ CCCD của khách thành công', 'success')}
                    className="text-[12px] text-secondary font-semibold hover:underline flex items-center gap-0.5"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[14px]">document_scanner</span> Quét nhanh
                  </button>
                </label>
                <input
                  type="text"
                  className="bk-form-input"
                  value={checkinForm.cccd}
                  onChange={(e) => setCheckinForm({ ...checkinForm, cccd: e.target.value })}
                  placeholder="Nhập hoặc quét mã QR trên CCCD"
                />
              </div>

              {/* Bước 2: Thu tiền phòng còn lại */}
              <div className="p-space-sm rounded-xl bg-red-50 border border-red-200 flex flex-col gap-space-xs">
                <span className="font-label-md text-error font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">payments</span> 2. Thanh toán số tiền phòng còn
                  lại:
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-body-sm text-on-surface-variant">Số tiền phải thu tại quầy:</span>
                  <span className="font-headline-sm text-error font-bold">
                    {formatVND(
                      Math.max(0, (currentBooking.totalAmount || 0) - (currentBooking.depositAmount || 0))
                    )}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-space-xs pt-1">
                  <label className="flex items-center gap-1.5 p-2 rounded-lg bg-surface-container-lowest border border-outline-variant/60 cursor-pointer hover:border-secondary">
                    <input
                      type="radio"
                      name="checkinPaymentMethod"
                      checked={checkinForm.paymentMethod === 'VietQR'}
                      onChange={() => setCheckinForm({ ...checkinForm, paymentMethod: 'VietQR' })}
                      className="text-secondary accent-secondary"
                    />
                    <span className="font-label-sm text-[11.5px] text-on-surface">Chuyển VietQR</span>
                  </label>
                  <label className="flex items-center gap-1.5 p-2 rounded-lg bg-surface-container-lowest border border-outline-variant/60 cursor-pointer hover:border-secondary">
                    <input
                      type="radio"
                      name="checkinPaymentMethod"
                      checked={checkinForm.paymentMethod === 'Cash'}
                      onChange={() => setCheckinForm({ ...checkinForm, paymentMethod: 'Cash' })}
                      className="text-secondary accent-secondary"
                    />
                    <span className="font-label-sm text-[11.5px] text-on-surface">Tiền mặt</span>
                  </label>
                  <label className="flex items-center gap-1.5 p-2 rounded-lg bg-surface-container-lowest border border-outline-variant/60 cursor-pointer hover:border-secondary">
                    <input
                      type="radio"
                      name="checkinPaymentMethod"
                      checked={checkinForm.paymentMethod === 'POS'}
                      onChange={() => setCheckinForm({ ...checkinForm, paymentMethod: 'POS' })}
                      className="text-secondary accent-secondary"
                    />
                    <span className="font-label-sm text-[11.5px] text-on-surface">Quẹt thẻ POS</span>
                  </label>
                </div>
                <label className="flex items-center gap-space-xs pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkinForm.isPaid}
                    onChange={(e) => setCheckinForm({ ...checkinForm, isPaid: e.target.checked })}
                    className="w-4 h-4 rounded text-secondary accent-secondary"
                  />
                  <span className="font-body-sm text-on-surface font-semibold">Đã thu đủ số tiền tại quầy</span>
                </label>
              </div>

              {/* Bước 3: Bàn giao chìa khóa */}
              <div className="p-space-sm rounded-xl bg-surface-container-low border border-surface-container flex flex-col gap-1 text-body-sm">
                <span className="font-label-md text-on-surface font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-secondary">vpn_key</span> 3. Bàn giao
                  chìa khóa & Tiện ích:
                </span>
                <span className="text-on-surface-variant">• Đã bàn giao: 01 Chìa khóa cơ + 01 Thẻ bật điện phòng.</span>
                <span className="text-on-surface-variant">
                  • Wifi Homestay: <strong>NhaSanMoc_Guest</strong> - Mật khẩu: <strong>maichau2024</strong>
                </span>
                <span className="text-on-surface-variant">
                  • Giờ ăn tối theo yêu cầu: <strong>18h30</strong> tại sân nướng than mộc.
                </span>
              </div>
            </div>

            <div className="bk-modal-footer">
              <button onClick={closeModal} className="bk-btn bk-btn-cancel" type="button">
                Hủy
              </button>
              <button onClick={handleConfirmCheckin} className="bk-btn bk-btn-secondary" type="button">
                <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                <span>Xác nhận nhận phòng & Giao chìa khóa</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. POPUP XÁC NHẬN CHECK-OUT & QUYẾT TOÁN */}
      {activeModal === 'checkoutModal' && (
        <div className="bk-modal">
          <div className="bk-modal-content">
            <div className="bk-modal-header-primary">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[24px]">logout</span>
                <div className="flex flex-col">
                  <h3 className="bk-modal-title">Thủ tục Check-out & Quyết toán</h3>
                  <span className="bk-modal-subtitle">
                    Đơn: <strong className="text-on-primary">#{currentBooking.bookingCode || 'BK-9839'}</strong>
                  </span>
                </div>
              </div>
              <button onClick={closeModal} className="bk-modal-close-light" type="button" title="Đóng">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="bk-modal-body">
              {/* Khách & Phòng */}
              <div className="p-space-sm rounded-xl bg-surface-container-low flex items-center justify-between border border-surface-container">
                <div className="flex flex-col">
                  <span className="font-headline-sm text-on-surface font-bold">
                    {currentBooking.guestName || 'Khách lưu trú'}
                  </span>
                  <span className="font-body-sm text-outline">
                    Đã lưu trú: {currentBooking.nights ? `${currentBooking.nights} đêm` : '1 đêm'}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-label-md text-primary font-bold">
                    {currentBooking.roomName || 'Chưa xếp phòng'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-bold">
                    {currentBooking.status || 'Đang ở'}
                  </span>
                </div>
              </div>

              {/* Kiểm tra bàn giao phòng */}
              <div className="flex flex-col gap-space-xs">
                <span className="bk-form-label">Kiểm tra bàn giao phòng:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-xs">
                  <label className="flex items-center gap-2 p-2 rounded-lg bg-surface-container-low border border-surface-container cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkoutForm.keysReturned}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, keysReturned: e.target.checked })}
                      className="w-4 h-4 rounded text-secondary accent-secondary"
                    />
                    <span className="font-body-sm text-on-surface">Đã nhận đủ chìa khóa phòng</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg bg-surface-container-low border border-surface-container cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkoutForm.equipmentIntact}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, equipmentIntact: e.target.checked })}
                      className="w-4 h-4 rounded text-secondary accent-secondary"
                    />
                    <span className="font-body-sm text-on-surface">Trang thiết bị phòng nguyên vẹn</span>
                  </label>
                </div>
              </div>

              {/* Bảng kê quyết toán */}
              <div className="p-space-sm rounded-xl bg-surface-container-low border border-surface-container flex flex-col gap-space-xs">
                <span className="font-label-md text-primary font-bold uppercase tracking-wider">
                  Bảng kê chi phí quyết toán
                </span>
                <div className="flex items-center justify-between text-body-sm py-1 border-b border-surface-container">
                  <span className="text-on-surface-variant">Tiền phòng còn thiếu:</span>
                  <span className="font-semibold text-on-surface">
                    {formatVND(Math.max(0, (currentBooking.totalAmount || 0) - (currentBooking.depositAmount || 0)))}
                  </span>
                </div>
                {Array.isArray(currentBooking.services) && currentBooking.services.length > 0 ? (
                  currentBooking.services.map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between text-body-sm py-1 border-b border-surface-container">
                      <span className="text-on-surface-variant">Dịch vụ ({s.name} x{s.quantity}):</span>
                      <span className="font-bold text-on-surface">{formatVND(s.total || ((s.price || 0) * (s.quantity || 1)))}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-between text-body-sm py-1 border-b border-surface-container">
                    <span className="text-on-surface-variant">Dịch vụ dùng thêm:</span>
                    <span className="font-bold text-on-surface">0đ</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-headline-sm pt-2 border-t-2 border-surface-container-high">
                  <span className="font-bold text-on-surface">TỔNG CỘNG THANH TOÁN:</span>
                  <span className="font-headline-lg text-secondary font-bold">
                    {formatVND(
                      Math.max(0, (currentBooking.totalAmount || 0) - (currentBooking.depositAmount || 0)) +
                      (Array.isArray(currentBooking.services) ? currentBooking.services.reduce((acc, s) => acc + (s.total || ((s.price || 0) * (s.quantity || 1))), 0) : 0)
                    )}
                  </span>
                </div>
              </div>

              {/* Phương thức thanh toán */}
              <div className="flex flex-col gap-1">
                <label className="bk-form-label">Phương thức khách thanh toán nốt:</label>
                <div className="grid grid-cols-3 gap-space-xs">
                  <label className="flex items-center gap-1.5 p-2 rounded-lg bg-surface-container-low border border-outline-variant/60 cursor-pointer hover:border-secondary">
                    <input type="radio" name="checkoutPaymentType" defaultChecked className="text-secondary accent-secondary" />
                    <span className="font-label-sm text-[11.5px] text-on-surface">Quét VietQR</span>
                  </label>
                  <label className="flex items-center gap-1.5 p-2 rounded-lg bg-surface-container-low border border-outline-variant/60 cursor-pointer hover:border-secondary">
                    <input type="radio" name="checkoutPaymentType" className="text-secondary accent-secondary" />
                    <span className="font-label-sm text-[11.5px] text-on-surface">Tiền mặt</span>
                  </label>
                  <label className="flex items-center gap-1.5 p-2 rounded-lg bg-surface-container-low border border-outline-variant/60 cursor-pointer hover:border-secondary">
                    <input type="radio" name="checkoutPaymentType" className="text-secondary accent-secondary" />
                    <span className="font-label-sm text-[11.5px] text-on-surface">Quẹt thẻ</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="bk-modal-footer">
              <button onClick={closeModal} className="bk-btn bk-btn-cancel" type="button">
                Đóng
              </button>
              <button onClick={handleConfirmCheckout} className="bk-btn bk-btn-secondary" type="button">
                <span className="material-symbols-outlined text-[18px]">verified</span>
                <span>Xác nhận thanh toán & Hoàn tất Check-out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. POPUP THÊM DỊCH VỤ / PHỤ PHÍ */}
      {activeModal === 'addServiceModal' && (
        <div className="bk-modal">
          <div className="bk-modal-content bk-modal-lg">
            <div className="bk-modal-header-surface">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[24px] text-primary">room_service</span>
                <div className="flex flex-col">
                  <h3 className="bk-modal-title">Thêm dịch vụ & Trải nghiệm bản địa</h3>
                  <span className="bk-modal-subtitle">
                    Ghi nhận vào:{' '}
                    <strong className="text-primary font-bold">
                      #{currentBooking.bookingCode || 'BK-9839'} ({currentBooking.guestName || 'Lê Văn Hiếu'})
                    </strong>
                  </span>
                </div>
              </div>
              <button onClick={closeModal} className="bk-modal-close" type="button" title="Đóng">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="bk-modal-body">
              <div className="flex flex-col gap-space-xs">
                <span className="font-label-md text-primary font-bold uppercase tracking-wider">
                  Danh mục dịch vụ homestay
                </span>
                <div className="flex flex-col gap-space-xs">
                  {AVAILABLE_SERVICES.map((srv) => (
                    <div
                      key={srv.id}
                      className="flex items-center justify-between p-space-sm rounded-xl bg-surface-container-low border border-surface-container"
                    >
                      <div className="flex items-center gap-space-sm">
                        <span className="material-symbols-outlined text-[24px] text-secondary">
                          {srv.icon || 'restaurant'}
                        </span>
                        <div className="flex flex-col">
                          <span className="font-label-md text-on-surface font-bold">{srv.name}</span>
                          <span className="text-body-sm text-outline">
                            {formatVND(srv.price)} / {srv.unit}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => adjustServiceQty(srv.id, -1)}
                          className="w-7 h-7 rounded-lg bg-surface-container hover:bg-surface-container-high flex items-center justify-center font-bold text-on-surface"
                          type="button"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-bold text-on-surface">
                          {serviceQty[srv.id] || 0}
                        </span>
                        <button
                          onClick={() => adjustServiceQty(srv.id, 1)}
                          className="w-7 h-7 rounded-lg bg-surface-container hover:bg-surface-container-high flex items-center justify-center font-bold text-on-surface"
                          type="button"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tổng kết cộng thêm */}
              <div className="p-space-sm rounded-xl bg-primary-fixed/30 border border-primary-fixed flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-label-md text-primary font-bold">Tổng tiền dịch vụ cộng thêm:</span>
                  <span className="text-body-sm text-on-surface-variant">
                    Tự động cộng vào hóa đơn thanh toán khi check-out
                  </span>
                </div>
                <span className="font-headline-lg text-primary font-bold">
                  {formatVND(calculateAddedServicesTotal)}
                </span>
              </div>
            </div>

            <div className="bk-modal-footer">
              <button onClick={closeModal} className="bk-btn bk-btn-cancel" type="button">
                Hủy
              </button>
              <button onClick={handleSaveServices} className="bk-btn bk-btn-save" type="button">
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                <span>Xác nhận thêm vào hóa đơn</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. POPUP HÓA ĐƠN THANH TOÁN (INVOICE / RECEIPT) */}
      {activeModal === 'invoiceModal' && (
        <div className="bk-modal">
          <div className="bk-modal-content bk-modal-lg">
            {/* Header (Ẩn khi in) */}
            <div className="bk-modal-header-surface no-print">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[22px] text-primary">receipt</span>
                <h3 className="bk-modal-title">Phiếu thanh toán & Hóa đơn dịch vụ</h3>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handlePrintInvoice} className="bk-btn bk-btn-save !py-1.5 !px-3" type="button">
                  <span className="material-symbols-outlined text-[16px]">print</span> In phiếu
                </button>
                <button onClick={closeModal} className="bk-modal-close" type="button" title="Đóng">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
            </div>

            {/* Nội dung hóa đơn */}
            <div id="invoicePrintContent" className="bk-modal-body bg-white text-black p-6">
              <div className="flex items-start justify-between border-b pb-4 border-gray-200">
                <div className="flex flex-col">
                  <h2 className="text-xl font-bold tracking-tight text-gray-900 uppercase">
                    HOMESTAY {activeHomestayName}
                  </h2>
                  <span className="text-xs text-gray-600">Bản Lác, Xã Chiềng Châu, Huyện Mai Châu, Hòa Bình</span>
                  <span className="text-xs text-gray-600">Hotline: 0988 345 678 • Email: contact@nhasanmoc.vn</span>
                  <span className="text-xs text-gray-600">Mã số thuế: 5400192837</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-base font-bold text-emerald-800 uppercase tracking-wide">
                    HÓA ĐƠN THANH TOÁN
                  </span>
                  <span className="text-xs text-gray-700">
                    Số HĐ: <strong>HD-20240916-{currentBooking.id || '003'}</strong>
                  </span>
                  <span className="text-xs text-gray-500">
                    Ngày lập: {new Date().toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs py-2 bg-gray-50 p-3 rounded-lg border border-gray-100 my-3">
                <div>
                  <strong>Khách hàng:</strong> {currentBooking.guestName || 'Phạm Thị Lan'}
                </div>
                <div>
                  <strong>Số điện thoại:</strong> {currentBooking.guestPhone || currentBooking.phone || '0903 442 771'}
                </div>
                <div>
                  <strong>CCCD / Hộ chiếu:</strong> 025091004523
                </div>
                <div>
                  <strong>Phòng lưu trú:</strong> {currentBooking.roomName || 'Bungalow Suối #01'}
                </div>
                <div className="col-span-2">
                  <strong>Thời gian ở:</strong> 14/09/2024 đến 16/09/2024 (2 đêm)
                </div>
              </div>

              <table className="w-full text-left text-xs border-collapse my-3">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-300 font-semibold text-gray-700">
                    <th className="py-2 px-3">STT</th>
                    <th className="py-2 px-3">Nội dung dịch vụ</th>
                    <th className="py-2 px-3 text-center">SL</th>
                    <th className="py-2 px-3 text-right">Đơn giá</th>
                    <th className="py-2 px-3 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="py-2 px-3">1</td>
                    <td className="py-2 px-3">
                      Tiền thuê phòng: {currentBooking.roomName || 'Bungalow Suối #01'} (2 đêm)
                    </td>
                    <td className="py-2 px-3 text-center">1</td>
                    <td className="py-2 px-3 text-right">
                      {formatVND(currentBooking.totalAmount || 2850000)}
                    </td>
                    <td className="py-2 px-3 text-right">
                      {formatVND(currentBooking.totalAmount || 2850000)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3">2</td>
                    <td className="py-2 px-3">Gà đồi nướng than mộc mắc khén</td>
                    <td className="py-2 px-3 text-center">1</td>
                    <td className="py-2 px-3 text-right">280.000đ</td>
                    <td className="py-2 px-3 text-right">280.000đ</td>
                  </tr>
                </tbody>
              </table>

              <div className="flex flex-col gap-1 border-t border-gray-300 pt-3 text-xs">
                <div className="flex justify-between py-0.5">
                  <span className="text-gray-600">Tổng tiền dịch vụ & lưu trú:</span>
                  <span className="font-bold text-gray-900">
                    {formatVND((currentBooking.totalAmount || 2850000) + 280000)}
                  </span>
                </div>
                <div className="flex justify-between py-0.5 text-emerald-700">
                  <span>Đã trừ tiền cọc trực tuyến / Sàn:</span>
                  <span className="font-bold">
                    -{formatVND(currentBooking.depositAmount || 1500000)}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-t border-dashed border-gray-300 text-sm">
                  <span className="font-bold text-gray-900">Khách đã thanh toán tại quầy:</span>
                  <span className="font-bold text-emerald-800 text-base">
                    {formatVND(
                      (currentBooking.totalAmount || 2850000) + 280000 - (currentBooking.depositAmount || 1500000)
                    )}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 pt-6 items-center text-center text-xs">
                <div className="flex flex-col items-center">
                  <span className="font-bold text-gray-800">Khách hàng</span>
                  <span className="text-[11px] text-gray-500 italic mt-0.5">(Ký và ghi rõ họ tên)</span>
                  <span className="mt-12 font-medium text-gray-700">{currentBooking.guestName || 'Phạm Thị Lan'}</span>
                </div>
                <div className="flex flex-col items-center relative">
                  <span className="font-bold text-gray-800">Đại diện Homestay</span>
                  <span className="text-[11px] text-gray-500 italic mt-0.5">(Đã thu đủ 100%)</span>
                  <div className="w-24 h-24 rounded-full border-4 border-red-600/80 text-red-600 flex flex-col items-center justify-center uppercase font-bold text-[10px] tracking-wider rotate-[-12deg] opacity-80 mt-2 pointer-events-none">
                    <span>{activeHomestayName}</span>
                    <span className="text-[12px] font-black border-y border-red-600 py-0.5 my-0.5">ĐÃ THU TIỀN</span>
                    <span>PAID</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bk-modal-footer-spread no-print">
              <button onClick={closeModal} className="bk-btn bk-btn-cancel" type="button">
                Đóng
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => showToast('Đang tạo bản sao lưu PDF hóa đơn...', 'info')}
                  className="bk-btn bk-btn-ghost"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span> Tải file PDF
                </button>
                <button onClick={handlePrintInvoice} className="bk-btn bk-btn-secondary" type="button">
                  <span className="material-symbols-outlined text-[18px]">print</span>
                  <span>In phiếu hóa đơn</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. POPUP DUYỆT ĐƠN & ĐỐI SOÁT CỌC */}
      {activeModal === 'approveBookingModal' && (
        <div className="bk-modal">
          <div className="bk-modal-content bk-modal-sm">
            <div className="bk-modal-header-secondary">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[24px]">verified_user</span>
                <div className="flex flex-col">
                  <h3 className="bk-modal-title">Duyệt đơn & Xác nhận cọc</h3>
                  <span className="bk-modal-subtitle">
                    Mã đơn: <strong className="text-on-secondary">#{currentBooking.bookingCode || 'BK-9850'}</strong>
                  </span>
                </div>
              </div>
              <button onClick={closeModal} className="bk-modal-close-light" type="button" title="Đóng">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="bk-modal-body">
              <div className="p-space-sm rounded-xl bg-surface-container-low flex items-center justify-between border border-surface-container">
                <div className="flex flex-col">
                  <span className="font-headline-sm text-on-surface font-bold">
                    {currentBooking.guestName || 'Khách lưu trú'}
                  </span>
                  <span className="font-body-sm text-outline">
                    {currentBooking.roomName || 'Phòng tiêu chuẩn'}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="font-label-sm text-outline text-[11px]">Tiền cọc cần xác nhận:</span>
                  <span className="font-headline-sm text-secondary font-bold">
                    {formatVND(currentBooking.depositAmount || 0)}
                  </span>
                </div>
              </div>

              <div className="p-space-sm rounded-xl bg-surface-container-low border border-surface-container flex flex-col gap-space-xs">
                <span className="font-label-md text-primary font-bold flex items-center gap-1 uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[16px]">account_balance</span> Dữ liệu giao dịch ngân
                  hàng
                </span>
                <div className="flex flex-col gap-1 text-body-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant">Ngân hàng:</span>
                    <span className="font-medium text-on-surface">
                      {currentBooking.bankTransferInfo?.bankName || 'Vietcombank - Đã ghi nhận'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant">Thời gian nhận:</span>
                    <span className="font-medium text-on-surface">
                      {currentBooking.bankTransferInfo?.transferDate || (currentBooking.createdAt ? String(currentBooking.createdAt).substring(0, 16) : 'Hôm nay')}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5 pt-1">
                    <span className="text-on-surface-variant text-[11px]">Nội dung chuyển khoản đối soát:</span>
                    <span className="p-2 rounded-lg bg-surface-container font-mono text-[12px] text-on-surface border border-surface-container-high">
                      {currentBooking.bankTransferInfo?.transferContent || `${currentBooking.bookingCode || 'BK'} ${currentBooking.guestName || ''}`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-space-xs rounded-lg bg-green-50 text-green-900 border border-green-200 flex items-center gap-2 text-body-sm">
                <span className="material-symbols-outlined text-[20px] text-secondary">check_circle</span>
                <span>Số tiền khớp 100% với giá trị cọc yêu cầu (50%).</span>
              </div>
            </div>

            <div className="bk-modal-footer">
              <button onClick={closeModal} className="bk-btn bk-btn-cancel" type="button">
                Đóng
              </button>
              <button onClick={handleApproveBooking} className="bk-btn bk-btn-secondary" type="button">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                <span>Xác nhận duyệt & Giữ phòng</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. POPUP TỪ CHỐI / HỦY ĐƠN ĐẶT PHÒNG */}
      {activeModal === 'rejectBookingModal' && (
        <div className="bk-modal">
          <div className="bk-modal-content bk-modal-sm">
            <div className="bk-modal-header-error">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[24px]">cancel</span>
                <div className="flex flex-col">
                  <h3 className="bk-modal-title">Từ chối đơn đặt phòng</h3>
                  <span className="bk-modal-subtitle">
                    Mã đơn: <strong>#{currentBooking.bookingCode || 'BK-9850'}</strong> ({currentBooking.guestName || 'Khách'})
                  </span>
                </div>
              </div>
              <button onClick={closeModal} className="bk-modal-close-light" type="button" title="Đóng">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="bk-modal-body">
              <div className="flex flex-col gap-1">
                <label className="bk-form-label">Lý do từ chối tiếp nhận đơn:</label>
                <select
                  className="bk-form-select"
                  value={rejectForm.reason}
                  onChange={(e) => setRejectForm({ ...rejectForm, reason: e.target.value })}
                >
                  <option>Hết phòng do khách đoàn gia hạn thêm ngày</option>
                  <option>Trùng lịch sửa chữa, khử khuẩn và bảo trì homestay</option>
                  <option>Khách hàng không chuyển tiền cọc đúng hạn (quá 2 giờ)</option>
                  <option>Số lượng khách vượt quá công suất phòng tối đa</option>
                  <option>Lý do khác...</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="bk-form-label">Phương án xử lý tiền cọc (nếu đã chuyển):</label>
                <div className="flex flex-col gap-1 text-body-sm">
                  <label className="flex items-center gap-2 p-2 rounded-lg bg-surface-container-low border border-surface-container cursor-pointer">
                    <input
                      type="radio"
                      name="refundOption"
                      checked={rejectForm.refundOption.includes('100%')}
                      onChange={() =>
                        setRejectForm({
                          ...rejectForm,
                          refundOption: 'Hoàn lại 100% tiền cọc về số tài khoản khách trong 24h'
                        })
                      }
                      className="text-error accent-error"
                    />
                    <span>Hoàn lại 100% tiền cọc về số tài khoản khách trong 24h</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg bg-surface-container-low border border-surface-container cursor-pointer">
                    <input
                      type="radio"
                      name="refundOption"
                      checked={rejectForm.refundOption.includes('dời')}
                      onChange={() =>
                        setRejectForm({
                          ...rejectForm,
                          refundOption: 'Đề xuất khách dời lịch sang cuối tuần sau'
                        })
                      }
                      className="text-error accent-error"
                    />
                    <span>Đề xuất khách dời lịch sang cuối tuần sau</span>
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="bk-form-label">Nội dung tin nhắn thông báo gửi khách:</label>
                <textarea
                  rows={2}
                  className="bk-form-textarea"
                  value={rejectForm.notifyMessage}
                  onChange={(e) => setRejectForm({ ...rejectForm, notifyMessage: e.target.value })}
                />
              </div>
            </div>

            <div className="bk-modal-footer">
              <button onClick={closeModal} className="bk-btn bk-btn-cancel" type="button">
                Hủy bỏ
              </button>
              <button onClick={handleRejectBooking} className="bk-btn bk-btn-danger" type="button">
                <span className="material-symbols-outlined text-[18px]">block</span>
                <span>Xác nhận từ chối đơn</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. POPUP XUẤT BÁO CÁO / EXCEL */}
      {activeModal === 'exportReportModal' && (
        <div className="bk-modal">
          <div className="bk-modal-content bk-modal-sm">
            <div className="bk-modal-header-surface">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[24px] text-primary">table_view</span>
                <div className="flex flex-col">
                  <h3 className="bk-modal-title">Xuất báo cáo & Dữ liệu đặt phòng</h3>
                  <span className="bk-modal-subtitle">Xuất dữ liệu chi tiết phục vụ đối soát và kế toán</span>
                </div>
              </div>
              <button onClick={closeModal} className="bk-modal-close" type="button" title="Đóng">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="bk-modal-body">
              <div className="flex flex-col gap-1">
                <label className="bk-form-label">1. Chọn kỳ thời gian xuất:</label>
                <div className="grid grid-cols-2 gap-space-xs">
                  {['Hôm nay (17/09)', '7 ngày gần nhất', 'Tháng 9/2024', 'Tùy chỉnh khoảng ngày'].map((rng) => (
                    <label
                      key={rng}
                      className={`flex items-center gap-1.5 p-2 rounded-lg border cursor-pointer ${
                        exportConfig.range === rng
                          ? 'border-secondary bg-green-50 text-secondary font-semibold'
                          : 'bg-surface-container-low border-outline-variant/60 text-on-surface'
                      }`}
                    >
                      <input
                        type="radio"
                        name="exportRange"
                        checked={exportConfig.range === rng}
                        onChange={() => setExportConfig({ ...exportConfig, range: rng })}
                        className="text-secondary accent-secondary"
                      />
                      <span className="text-body-sm">{rng}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="bk-form-label">2. Trạng thái đơn đặt phòng:</label>
                <select
                  className="bk-form-select"
                  value={exportConfig.status}
                  onChange={(e) => setExportConfig({ ...exportConfig, status: e.target.value })}
                >
                  <option>Tất cả trạng thái (24 đơn)</option>
                  <option>Chỉ đơn đã cọc và đang lưu trú</option>
                  <option>Chỉ đơn đã hoàn tất thanh toán</option>
                  <option>Chỉ đơn đặt qua sàn OTA (đối soát hoa hồng)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="bk-form-label">3. Định dạng tệp tải về:</label>
                <div className="grid grid-cols-3 gap-space-xs">
                  <label
                    onClick={() => setExportConfig({ ...exportConfig, format: 'xlsx' })}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-center cursor-pointer transition-all ${
                      exportConfig.format === 'xlsx'
                        ? 'border-2 border-secondary bg-green-50'
                        : 'bg-surface-container-low border-outline-variant/60'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[28px] text-secondary">description</span>
                    <span className="font-label-md text-on-surface font-bold text-[12px]">Excel (.xlsx)</span>
                    <span className="text-[10px] text-outline">Đầy đủ biểu thức</span>
                  </label>
                  <label
                    onClick={() => setExportConfig({ ...exportConfig, format: 'csv' })}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-center cursor-pointer transition-all ${
                      exportConfig.format === 'csv'
                        ? 'border-2 border-secondary bg-green-50'
                        : 'bg-surface-container-low border-outline-variant/60'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[28px] text-primary">csv</span>
                    <span className="font-label-md text-on-surface font-bold text-[12px]">CSV Data</span>
                    <span className="text-[10px] text-outline">Dữ liệu thô</span>
                  </label>
                  <label
                    onClick={() => setExportConfig({ ...exportConfig, format: 'pdf' })}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-center cursor-pointer transition-all ${
                      exportConfig.format === 'pdf'
                        ? 'border-2 border-secondary bg-green-50'
                        : 'bg-surface-container-low border-outline-variant/60'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[28px] text-error">picture_as_pdf</span>
                    <span className="font-label-md text-on-surface font-bold text-[12px]">PDF Báo cáo</span>
                    <span className="text-[10px] text-outline">In ấn & Ký duyệt</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="bk-modal-footer">
              <button onClick={closeModal} className="bk-btn bk-btn-cancel" type="button">
                Hủy
              </button>
              <button onClick={handleExportSubmit} className="bk-btn bk-btn-save" type="button">
                <span className="material-symbols-outlined text-[18px]">download</span>
                <span>Tải xuống file báo cáo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. POPUP LIÊN HỆ KHÁCH HÀNG (GỌI ĐIỆN / NHẮN TIN) */}
      {activeModal === 'contactGuestModal' && (
        <div className="bk-modal">
          <div className="bk-modal-content bk-modal-sm">
            <div className="bk-modal-header-surface">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[22px] text-primary">contact_phone</span>
                <div className="flex flex-col">
                  <h3 className="bk-modal-title">Liên hệ khách hàng</h3>
                  <span className="bk-modal-subtitle">
                    #{currentBooking.bookingCode || 'BK-9842'} ({currentBooking.roomName || 'Mountain View #01'})
                  </span>
                </div>
              </div>
              <button onClick={closeModal} className="bk-modal-close" type="button" title="Đóng">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="bk-modal-body">
              {/* Tabs chuyển đổi */}
              <div className="flex items-center gap-1 p-1 bg-surface-container rounded-xl">
                <button
                  onClick={() => setContactTab('call')}
                  className={`flex-1 py-2 rounded-lg font-label-md text-label-md font-bold transition-all ${
                    contactTab === 'call' ? 'bg-primary text-on-primary custom-primary-bg' : 'text-on-surface-variant'
                  }`}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px] align-middle">call</span> Gọi điện thoại
                </button>
                <button
                  onClick={() => setContactTab('chat')}
                  className={`flex-1 py-2 rounded-lg font-label-md text-label-md font-bold transition-all ${
                    contactTab === 'chat' ? 'bg-primary text-on-primary custom-primary-bg' : 'text-on-surface-variant'
                  }`}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px] align-middle">chat</span> Nhắn tin nhanh
                </button>
              </div>

              {contactTab === 'call' ? (
                <div className="flex flex-col items-center gap-space-sm py-2">
                  <div className="w-16 h-16 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
                    <span className="material-symbols-outlined text-[32px]">phone_in_talk</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                      {currentBooking.guestName || 'Khách lưu trú'}
                    </span>
                    <span className="text-headline-md font-bold text-secondary mt-0.5">
                      {currentBooking.guestPhone || currentBooking.phone || 'Chưa cập nhật'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 w-full pt-2">
                    <a
                      href={`tel:${currentBooking.guestPhone || currentBooking.phone || ''}`}
                      className="bk-btn bk-btn-secondary flex-1 !py-2.5"
                    >
                      <span className="material-symbols-outlined text-[18px]">call</span>
                      <span>Bấm gọi ngay</span>
                    </a>
                    <button
                      onClick={() =>
                        showToast(`Đang mở kết nối Zalo với số ${currentBooking.guestPhone || currentBooking.phone || 'khách'}...`, 'info')
                      }
                      className="bk-btn bk-btn-ghost flex-1 !py-2.5"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
                      <span>Mở Zalo</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-space-sm">
                  <span className="bk-form-label">Mẫu tin nhắn nhanh có sẵn:</span>
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() =>
                        setChatMessage(
                          `Chào bạn, ${activeHomestayName} đã chuẩn bị xong phòng ${currentBooking.roomName || ''} đón bạn vào lúc ${currentBooking.checkInTime || '14h00'}. Nếu cần hỗ trợ chỉ đường, bạn nhắn lại nhé!`
                        )
                      }
                      className="p-2 rounded-lg bg-surface-container-low hover:bg-surface-container border border-surface-container text-left text-body-sm text-on-surface transition-colors"
                      type="button"
                    >
                      <strong>1. Nhắc nhận phòng:</strong> Phòng đã sẵn sàng đón lúc {currentBooking.checkInTime || '14h00'}...
                    </button>
                    <button
                      onClick={() =>
                        setChatMessage(
                          `Homestay ${activeHomestayName} đã ghi nhận yêu cầu: "${currentBooking.specialRequest || 'đặt phòng'}" và chuẩn bị sẵn sàng phục vụ bạn ạ.`
                        )
                      }
                      className="p-2 rounded-lg bg-surface-container-low hover:bg-surface-container border border-surface-container text-left text-body-sm text-on-surface transition-colors"
                      type="button"
                    >
                      <strong>2. Xác nhận yêu cầu:</strong> Chuẩn bị sẵn sàng theo yêu cầu...
                    </button>
                  </div>

                  <div className="flex flex-col gap-1 pt-1">
                    <label className="bk-form-label">Nội dung tin nhắn:</label>
                    <textarea
                      rows={3}
                      className="bk-form-textarea"
                      placeholder="Nhập nội dung tin nhắn gửi khách..."
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                    />
                  </div>

                  <button onClick={handleSendMessage} className="bk-btn bk-btn-save w-full !py-2.5" type="button">
                    <span className="material-symbols-outlined text-[18px]">send</span>
                    <span>Gửi tin nhắn qua sàn / Zalo</span>
                  </button>
                </div>
              )}
            </div>

            <div className="bk-modal-footer">
              <button onClick={closeModal} className="bk-btn bk-btn-cancel" type="button">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Container */}
      {toast && (
        <div className="bk-toast-box">
          <div className={`bk-toast ${toast.type === 'error' ? 'error' : ''}`}>
            <span className="material-symbols-outlined text-[18px]">
              {toast.type === 'error' ? 'error' : 'check_circle'}
            </span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
