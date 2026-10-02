import { useState, useEffect } from 'react';
import './ManageBooking.css';
import {
  INITIAL_BOOKINGS_DATA,
  AVAILABLE_SERVICES,
  ROOM_STATUS_TODAY,
  formatVND
} from './manageBookingData';

export default function ManageBooking() {
  // ─── LocalStorage Persistence ─────────────────────────────────
  const [bookings, setBookings] = useState(() => {
    try {
      const saved = localStorage.getItem('owner_bookings_data');
      return saved ? JSON.parse(saved) : INITIAL_BOOKINGS_DATA;
    } catch {
      return INITIAL_BOOKINGS_DATA;
    }
  });

  useEffect(() => {
    localStorage.setItem('owner_bookings_data', JSON.stringify(bookings));
  }, [bookings]);

  // ─── Filter & Search State ────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [roomFilter, setRoomFilter] = useState('');

  // ─── Toast System ─────────────────────────────────────────────
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ─── Active Modal & Selected Booking ──────────────────────────
  const [activeModal, setActiveModal] = useState(null);
  const [currentBookingId, setCurrentBookingId] = useState('BK-9842');

  const currentBooking =
    bookings.find((b) => b.id === currentBookingId) || bookings[0] || {};

  // ─── Add Service Form Quantities ──────────────────────────────
  const [serviceQty, setServiceQty] = useState({});

  // ─── Contact Modal State ──────────────────────────────────────
  const [contactTab, setContactTab] = useState('call');
  const [chatMessage, setChatMessage] = useState('');

  // ─── Create Booking Form State ────────────────────────────────
  const [newBooking, setNewBooking] = useState({
    guestName: '',
    phone: '',
    roomCode: 'Mountain View #01',
    roomType: 'Phòng Mountain View (Nhà Gỗ)',
    guestsCount: '2 người lớn',
    checkIn: new Date().toISOString().split('T')[0],
    checkOut: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    pricePerNight: 950000,
    depositAmount: 950000,
    specialRequest: ''
  });

  const closeModal = () => {
    setActiveModal(null);
  };

  // ─── Modal Openers ────────────────────────────────────────────
  const openDetail = (id) => {
    setCurrentBookingId(id);
    setActiveModal('detail');
  };

  const openCheckin = (id) => {
    setCurrentBookingId(id);
    setActiveModal('checkin');
  };

  const openCheckout = (id) => {
    setCurrentBookingId(id);
    setActiveModal('checkout');
  };

  const openAddService = (id) => {
    setCurrentBookingId(id);
    setServiceQty({});
    setActiveModal('addService');
  };

  const openInvoice = (id) => {
    setCurrentBookingId(id);
    setActiveModal('invoice');
  };

  const openApprove = (id) => {
    setCurrentBookingId(id);
    setActiveModal('approve');
  };

  const openReject = (id) => {
    setCurrentBookingId(id);
    setActiveModal('reject');
  };

  const openContact = (id, tab = 'call') => {
    setCurrentBookingId(id);
    setContactTab(tab);
    setChatMessage('');
    setActiveModal('contact');
  };

  // ─── Action Handlers ──────────────────────────────────────────
  const confirmCheckin = () => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === currentBookingId
          ? { ...b, status: 'Đang ở', remainAmount: 0, statusBadge: 'status-staying' }
          : b
      )
    );
    showToast(`Check-in thành công cho khách ${currentBooking.guestName}!`);
    closeModal();
  };

  const confirmCheckout = () => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === currentBookingId
          ? { ...b, status: 'Đang ở', status: 'Đã hoàn tất', remainAmount: 0, statusBadge: 'status-completed' }
          : b
      )
    );
    showToast(`Check-out và quyết toán thành công đơn #${currentBookingId}!`);
    closeModal();
  };

  const confirmApprove = () => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === currentBookingId
          ? {
              ...b,
              status: 'Chờ Check-in',
              depositStatus: 'Đã nhận đủ cọc',
              statusBadge: 'status-checkin'
            }
          : b
      )
    );
    showToast(`Đã duyệt đơn #${currentBookingId} & xác nhận giữ phòng!`);
    closeModal();
  };

  const confirmReject = () => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === currentBookingId
          ? { ...b, status: 'Đã hủy', statusBadge: 'status-completed' }
          : b
      )
    );
    showToast(`Đã từ chối đơn #${currentBookingId}!`);
    closeModal();
  };

  const saveAddedServices = () => {
    let addedItems = [];
    AVAILABLE_SERVICES.forEach((srv) => {
      const q = serviceQty[srv.name] || 0;
      if (q > 0) {
        addedItems.push({
          name: srv.name,
          qty: q,
          price: srv.price,
          total: srv.price * q
        });
      }
    });

    if (addedItems.length === 0) {
      showToast('Vui lòng chọn số lượng dịch vụ cần thêm', 'error');
      return;
    }

    const extraTotal = addedItems.reduce((acc, cur) => acc + cur.total, 0);

    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === currentBookingId) {
          const currentServices = b.services || [];
          return {
            ...b,
            services: [...currentServices, ...addedItems],
            totalAmount: b.totalAmount + extraTotal,
            remainAmount: b.remainAmount + extraTotal
          };
        }
        return b;
      })
    );

    showToast(`Đã thêm ${addedItems.length} dịch vụ vào đơn #${currentBookingId}`);
    closeModal();
  };

  const handleCreateDirectBooking = (e) => {
    e.preventDefault();
    if (!newBooking.guestName.trim() || !newBooking.phone.trim()) {
      showToast('Vui lòng nhập tên khách và số điện thoại', 'error');
      return;
    }

    const id = `BK-${Math.floor(1000 + Math.random() * 9000)}`;
    const nights = 2;
    const totalAmount = newBooking.pricePerNight * nights;
    const depositAmount = Number(newBooking.depositAmount) || totalAmount / 2;

    const created = {
      id,
      source: 'Trực tiếp',
      guestName: newBooking.guestName,
      phone: newBooking.phone,
      email: `${newBooking.phone}@guest.vn`,
      cccd: 'Chưa cập nhật',
      avatar: newBooking.guestName.charAt(0).toUpperCase(),
      avatarBg: 'bg-primary',
      city: 'Khách vãng lai',
      roomType: newBooking.roomType,
      roomCode: newBooking.roomCode,
      guestsCount: newBooking.guestsCount,
      checkIn: newBooking.checkIn,
      checkInTime: '14:00',
      checkOut: newBooking.checkOut,
      checkOutTime: '12:00',
      nights,
      depositStatus: 'Đã nhận cọc trực tiếp',
      depositAmount,
      totalAmount,
      remainAmount: totalAmount - depositAmount,
      status: 'Chờ Check-in',
      statusBadge: 'status-checkin',
      specialRequest: newBooking.specialRequest,
      services: [],
      timeline: [
        {
          title: 'Tạo đơn đặt phòng trực tiếp tại quầy',
          time: 'Vừa xong',
          status: 'done'
        },
        {
          title: 'Chờ khách nhận phòng',
          time: `${newBooking.checkIn} 14:00`,
          status: 'current'
        }
      ]
    };

    setBookings([created, ...bookings]);
    showToast(`Tạo thành công đơn đặt phòng #${id}!`);
    closeModal();
  };

  // ─── Filter Logic ─────────────────────────────────────────────
  const filteredBookings = bookings.filter((b) => {
    let matchStatus = true;
    if (statusFilter === 'Chờ xác nhận') matchStatus = b.status === 'Chờ xác nhận';
    else if (statusFilter === 'Đã cọc')
      matchStatus = b.status === 'Chờ Check-in' || b.depositStatus.includes('Đã');
    else if (statusFilter === 'Đang ở') matchStatus = b.status === 'Đang ở';
    else if (statusFilter === 'Đã hoàn tất') matchStatus = b.status === 'Đã hoàn tất';
    else if (statusFilter === 'Đã hủy') matchStatus = b.status === 'Đã hủy';

    let matchRoom = true;
    if (roomFilter) {
      matchRoom = b.roomType.toLowerCase().includes(roomFilter.toLowerCase());
    }

    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      b.id.toLowerCase().includes(q) ||
      b.guestName.toLowerCase().includes(q) ||
      b.phone.includes(q);

    return matchStatus && matchRoom && matchSearch;
  });

  // Calculate dynamic KPIs
  const pendingCount = bookings.filter((b) => b.status === 'Chờ xác nhận').length;
  const stayingCount = bookings.filter((b) => b.status === 'Đang ở').length;
  const totalDepositHeld = bookings.reduce((sum, b) => sum + (b.depositAmount || 0), 0);

  return (
    <div className="manage-booking-page">
      {/* Toast Alert */}
      {toast && (
        <div className={`service-toast-alert ${toast.type}`}>
          <i
            className={`bi ${toast.type === 'error' ? 'bi-exclamation-triangle' : 'bi-check-circle-fill'} me-2`}
          />
          {toast.message}
        </div>
      )}

      {/* TOP BANNER */}
      <section className="booking-banner-card">
        <div className="booking-banner-glow" />
        <div className="banner-content-row">
          <div>
            <span className="banner-tag">Quản lý Vận Hành</span>
            <h1 className="banner-title">Quản lý đơn đặt phòng (Bookings)</h1>
          </div>
          <div className="banner-action-buttons">
            <button
              className="btn-secondary-action"
              onClick={() => setActiveModal('export')}
            >
              <i className="bi bi-file-earmark-excel" />
              <span>Xuất file Excel / Báo cáo</span>
            </button>
            <button
              className="btn-primary-action"
              onClick={() => setActiveModal('createBooking')}
            >
              <i className="bi bi-plus-circle-fill" />
              <span>Tạo đơn đặt phòng trực tiếp</span>
            </button>
          </div>
        </div>
      </section>

      {/* QUICK KPI BAR */}
      <section className="booking-kpi-grid">
        <div className="kpi-card-box">
          <div>
            <div className="kpi-label">Đơn chờ xác nhận</div>
            <div className="kpi-val-group">
              <span className="kpi-number">{pendingCount.toString().padStart(2, '0')}</span>
              <span className="kpi-subtext orange">cần duyệt ngay</span>
            </div>
          </div>
          <div className="kpi-icon-circle amber">
            <i className="bi bi-hourglass-split" />
          </div>
        </div>

        <div className="kpi-card-box">
          <div>
            <div className="kpi-label">Check-in hôm nay</div>
            <div className="kpi-val-group">
              <span className="kpi-number highlight-green">03</span>
              <span className="kpi-subtext gray">đơn đặt</span>
            </div>
          </div>
          <div className="kpi-icon-circle green">
            <i className="bi bi-box-arrow-in-right" />
          </div>
        </div>

        <div className="kpi-card-box">
          <div>
            <div className="kpi-label">Đang lưu trú tại Homestay</div>
            <div className="kpi-val-group">
              <span className="kpi-number">{stayingCount.toString().padStart(2, '0')}</span>
              <span className="kpi-subtext gray">phòng</span>
            </div>
          </div>
          <div className="kpi-icon-circle slate">
            <i className="bi bi-houses-fill" />
          </div>
        </div>

        <div className="kpi-card-box">
          <div>
            <div className="kpi-label">Tiền cọc sàn đang giữ</div>
            <div className="kpi-val-group">
              <span className="kpi-number highlight-primary">{formatVND(totalDepositHeld)}</span>
            </div>
          </div>
          <div className="kpi-icon-circle teal">
            <i className="bi bi-wallet2" />
          </div>
        </div>
      </section>

      {/* MAIN TWO-COLUMN CONTENT */}
      <div className="booking-main-grid">
        {/* LEFT COLUMN: FILTERS + TABLE + AVAILABILITY STRIP */}
        <div>
          {/* FILTER AND SEARCH CONTROLS */}
          <div className="booking-filter-wrapper">
            <div className="search-select-row">
              <div className="booking-search-input-wrap">
                <i className="bi bi-search" />
                <input
                  type="text"
                  className="booking-search-input"
                  placeholder="Tìm mã booking, tên khách, số điện thoại..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <select
                className="filter-room-select"
                value={roomFilter}
                onChange={(e) => setRoomFilter(e.target.value)}
              >
                <option value="">Tất cả loại phòng</option>
                <option value="Mountain">Mountain View (Nhà Gỗ)</option>
                <option value="Lake">Lake View (Ven Hồ)</option>
                <option value="Bungalow">Bungalow Suối</option>
                <option value="Nhà Sàn">Nhà Sàn Trải Nghiệm</option>
              </select>

              <div className="date-indicator-badge">
                <i className="bi bi-calendar3" />
                <span>Hôm nay</span>
              </div>
            </div>

            {/* STATUS FILTER PILLS */}
            <div className="status-pill-list">
              {[
                { key: 'all', label: `Tất cả (${bookings.length})` },
                { key: 'Chờ xác nhận', label: `Chờ xác nhận (${pendingCount})` },
                { key: 'Đã cọc', label: 'Đã cọc (11)' },
                { key: 'Đang ở', label: `Đang ở (${stayingCount})` },
                { key: 'Đã hoàn tất', label: 'Đã hoàn tất (3)' },
                { key: 'Đã hủy', label: 'Đã hủy (0)' }
              ].map((pill) => (
                <button
                  key={pill.key}
                  className={`status-tab-btn ${statusFilter === pill.key ? 'active' : ''}`}
                  onClick={() => setStatusFilter(pill.key)}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* TABLE OF BOOKINGS */}
          <div className="booking-table-card">
            <div className="booking-table-responsive">
              <table className="custom-booking-table">
                <thead>
                  <tr>
                    <th>Mã Booking</th>
                    <th>Khách hàng</th>
                    <th>Phòng & Số khách</th>
                    <th>Lịch trình lưu trú</th>
                    <th style={{ textAlign: 'right' }}>Tiền cọc sàn giữ</th>
                    <th style={{ textAlign: 'right' }}>Tổng tiền</th>
                    <th style={{ textAlign: 'center' }}>Trạng thái</th>
                    <th style={{ textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((b) => (
                    <tr key={b.id}>
                      <td className="booking-code-col">
                        <strong>#{b.id}</strong>
                        <span>{b.source}</span>
                      </td>

                      <td>
                        <div className="guest-info-cell">
                          <div className={`guest-avatar-circle ${b.avatarBg}`}>
                            {b.avatar}
                          </div>
                          <div className="guest-text-wrap">
                            <strong>{b.guestName}</strong>
                            <span>{b.phone}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="guest-text-wrap">
                          <strong>{b.roomCode}</strong>
                          <span style={{ color: '#64748b' }}>
                            <i className="bi bi-people me-1" />
                            {b.guestsCount}
                          </span>
                        </div>
                      </td>

                      <td className="schedule-cell">
                        <strong>
                          {b.checkIn} - {b.checkOut}
                        </strong>
                        <span>{b.checkInTime}</span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <strong style={{ color: '#15803d' }}>
                          {formatVND(b.depositAmount)}
                        </strong>
                        <span style={{ display: 'block', fontSize: '0.68rem', color: '#64748b' }}>
                          {b.depositStatus}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <strong>{formatVND(b.totalAmount)}</strong>
                        <span style={{ display: 'block', fontSize: '0.68rem', color: '#dc2626' }}>
                          {b.remainAmount > 0 ? `Còn ${formatVND(b.remainAmount)}` : 'Đã đủ 100%'}
                        </span>
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <span className={`status-pill-badge ${b.statusBadge}`}>
                          {b.status === 'Chờ Check-in' && <span className="status-dot-blink" />}
                          {b.status}
                        </span>
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <div className="row-action-btns">
                          {b.status === 'Chờ Check-in' && (
                            <button
                              className="btn-row-action green"
                              onClick={() => openCheckin(b.id)}
                            >
                              Check-in
                            </button>
                          )}
                          {b.status === 'Đang ở' && (
                            <>
                              <button
                                className="btn-row-action gray"
                                onClick={() => openCheckout(b.id)}
                              >
                                Check-out
                              </button>
                              <button
                                className="btn-row-action teal"
                                onClick={() => openAddService(b.id)}
                              >
                                + Dịch vụ
                              </button>
                            </>
                          )}
                          {b.status === 'Chờ xác nhận' && (
                            <>
                              <button
                                className="btn-row-action green"
                                onClick={() => openApprove(b.id)}
                              >
                                Duyệt
                              </button>
                              <button
                                className="btn-row-action red"
                                onClick={() => openReject(b.id)}
                              >
                                Từ chối
                              </button>
                            </>
                          )}
                          {b.status === 'Đã hoàn tất' && (
                            <button
                              className="btn-row-action gray"
                              onClick={() => openInvoice(b.id)}
                            >
                              Xem hóa đơn
                            </button>
                          )}
                          <button
                            className="btn-row-icon-only"
                            title="Chi tiết booking"
                            onClick={() => openDetail(b.id)}
                          >
                            <i className="bi bi-eye" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ROOM AVAILABILITY STRIP */}
          <div className="room-avail-strip">
            <div className="strip-header">
              <h3>
                <i className="bi bi-door-open-fill text-success" />
                Tình trạng phòng hôm nay
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Công suất hiện tại: 72%
              </span>
            </div>
            <div className="strip-grid-rooms">
              {ROOM_STATUS_TODAY.map((r, i) => (
                <div key={i} className={`strip-room-card ${r.color}`}>
                  <strong>{r.room}</strong>
                  <span>{r.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: QUICK CHECK-IN HERO CARD */}
        <div>
          <div className="quick-checkin-card">
            <div className="quick-checkin-header">
              <h2>
                <i className="bi bi-person-badge-fill" />
                Check-in nhanh hôm nay
              </h2>
              <span className="quick-checkin-badge">Sắp đến</span>
            </div>

            <div className="quick-checkin-body">
              <div className="quick-guest-hero">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuA0LFSerZuRWRa-xYFKGn0v9Z7yaO3TJcniYry7vFR_CNLVdUzBx82AtU9qTsUosSm_cVRV-LR_jKwTuoFPG-EeKZkuXgN-XFKhCKmGUPU95IYF-Neyeva84ZwupG97XUHWs8qt5O8BKkpjXazR3XTGVmtlpdT64Cal4NtBQx_mNvBXaGg33t8hGkimNQpk6iGHK7QXHMZkp17dvnr72Tgr-dgQV9ur5Zr1URU3oLW1q2Pndz6dbLs"
                  alt="Guest"
                  className="quick-guest-avatar"
                />
                <div>
                  <h3 style={{ margin: '0 0 2px 0', fontSize: '0.95rem', fontWeight: 800 }}>
                    Nguyễn Thị Mai
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    0982 341 112 • Hà Nội
                  </span>
                  <div style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: 700, marginTop: '2px' }}>
                    Mã: #BK-9842
                  </div>
                </div>
              </div>

              <div className="quick-guest-details-box">
                <div className="quick-detail-line">
                  <span>Phòng chỉ định:</span>
                  <strong>Mountain View #01</strong>
                </div>
                <div className="quick-detail-line">
                  <span>Giờ dự kiến đến:</span>
                  <strong style={{ color: '#15803d' }}>14:00 (Hôm nay)</strong>
                </div>
                <div className="quick-detail-line">
                  <span>Số lượng khách:</span>
                  <strong>2 Người lớn</strong>
                </div>
                <div className="quick-detail-line">
                  <span>Tình trạng cọc sàn:</span>
                  <strong style={{ color: '#15803d' }}>Đã thu: 1.500.000đ</strong>
                </div>
                <div className="quick-detail-line">
                  <span>Còn thu tại quầy:</span>
                  <strong style={{ color: '#dc2626' }}>1.350.000đ</strong>
                </div>
              </div>

              <div className="quick-request-box">
                <i className="bi bi-chat-quote-fill me-1" />
                <span>
                  &ldquo;Ăn tối cơm lam thịt nướng tại homestay lúc 18h30. Nhờ chuẩn bị lò than ngoài sân.&rdquo;
                </span>
              </div>

              <button
                className="btn-full-checkin"
                onClick={() => openCheckin('BK-9842')}
              >
                <i className="bi bi-box-arrow-in-right" />
                <span>Đánh dấu khách đã nhận phòng</span>
              </button>

              <div className="contact-duo-buttons">
                <button
                  className="btn-contact-half"
                  onClick={() => openContact('BK-9842', 'call')}
                >
                  <i className="bi bi-telephone-fill text-success" />
                  <span>Gọi cho khách</span>
                </button>
                <button
                  className="btn-contact-half"
                  onClick={() => openContact('BK-9842', 'chat')}
                >
                  <i className="bi bi-chat-dots-fill text-primary" />
                  <span>Nhắn qua sàn</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════
          MODAL 1: CHI TIẾT BOOKING
      ═════════════════════════════════════════════════════════════ */}
      {activeModal === 'detail' && (
        <div className="bk-modal-backdrop" onClick={closeModal}>
          <div className="bk-modal-window large" onClick={(e) => e.stopPropagation()}>
            <div className="bk-header-styled surface-style">
              <div className="bk-header-title-box">
                <i className="bi bi-receipt text-primary fs-5" />
                <div>
                  <h3>Chi tiết đơn đặt phòng #{currentBooking.id}</h3>
                  <span>Nguồn: {currentBooking.source}</span>
                </div>
              </div>
              <button className="modal-close-btn" onClick={closeModal}>
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <div className="bk-body-scrollable">
              {/* Guest & Room Grid */}
              <div className="form-grid-2">
                <div className="p-3 bg-light rounded-3">
                  <div className="d-flex align-items-center gap-3 mb-2">
                    <div className={`guest-avatar-circle ${currentBooking.avatarBg}`}>
                      {currentBooking.avatar}
                    </div>
                    <div>
                      <strong className="d-block">{currentBooking.guestName}</strong>
                      <small className="text-muted">{currentBooking.phone}</small>
                    </div>
                  </div>
                  <div className="text-secondary small">
                    <div>Email: {currentBooking.email}</div>
                    <div>CCCD: {currentBooking.cccd}</div>
                    <div>Thành phố: {currentBooking.city}</div>
                  </div>
                </div>

                <div className="p-3 bg-light rounded-3">
                  <strong className="d-block text-success">{currentBooking.roomCode}</strong>
                  <span className="small text-muted">{currentBooking.roomType}</span>
                  <div className="mt-2 small text-secondary">
                    <div>Số khách: {currentBooking.guestsCount}</div>
                    <div>
                      Lịch ở: {currentBooking.checkIn} - {currentBooking.checkOut} ({currentBooking.nights} đêm)
                    </div>
                    <div>
                      Trạng thái: <strong>{currentBooking.status}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Box */}
              <div className="p-3 border rounded-3 bg-white">
                <div className="d-flex justify-content-between mb-1 small">
                  <span>Tiền cọc sàn giữ:</span>
                  <strong className="text-success">{formatVND(currentBooking.depositAmount)}</strong>
                </div>
                <div className="d-flex justify-content-between mb-1 small">
                  <span>Còn phải thu tại quầy:</span>
                  <strong className="text-danger">{formatVND(currentBooking.remainAmount)}</strong>
                </div>
                <div className="d-flex justify-content-between pt-2 border-top">
                  <strong>TỔNG TIỀN ĐƠN HÀNG:</strong>
                  <strong className="fs-5 text-success">{formatVND(currentBooking.totalAmount)}</strong>
                </div>
              </div>

              {/* Special Request */}
              {currentBooking.specialRequest && (
                <div className="p-3 bg-warning-subtle rounded-3 small text-warning-emphasis">
                  <strong>Yêu cầu đặc biệt:</strong> {currentBooking.specialRequest}
                </div>
              )}

              {/* Services Used */}
              {currentBooking.services && currentBooking.services.length > 0 && (
                <div>
                  <h6 className="fw-bold mb-2 small text-uppercase text-muted">Dịch vụ sử dụng thêm:</h6>
                  <div className="d-flex flex-column gap-2">
                    {currentBooking.services.map((s, idx) => (
                      <div key={idx} className="d-flex justify-content-between p-2 bg-light rounded-2 small">
                        <span>
                          {s.name} (x{s.qty})
                        </span>
                        <strong>{formatVND(s.total)}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline */}
              {currentBooking.timeline && (
                <div>
                  <h6 className="fw-bold mb-3 small text-uppercase text-muted">Tiến trình đơn:</h6>
                  <div className="timeline-stepper">
                    {currentBooking.timeline.map((st, i) => (
                      <div key={i} className="timeline-step-item">
                        <div className={`timeline-dot ${st.status}`}>
                          <i className={`bi bi-${st.status === 'done' ? 'check' : 'clock'}`} />
                        </div>
                        <div className="timeline-step-text">
                          <strong>{st.title}</strong>
                          <span>{st.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bk-footer-styled">
              <button className="btn-secondary-action" onClick={closeModal}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          MODAL 2: CHECK-IN NHẬN PHÒNG
      ═════════════════════════════════════════════════════════════ */}
      {activeModal === 'checkin' && (
        <div className="bk-modal-backdrop" onClick={closeModal}>
          <div className="bk-modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="bk-header-styled secondary-style">
              <div className="bk-header-title-box">
                <i className="bi bi-box-arrow-in-right fs-5" />
                <div>
                  <h3>Thủ tục Check-in nhận phòng</h3>
                  <span>Mã đơn: #{currentBooking.id}</span>
                </div>
              </div>
              <button className="modal-close-btn text-white" onClick={closeModal}>
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <div className="bk-body-scrollable">
              <div className="p-3 bg-light rounded-3 d-flex justify-content-between align-items-center">
                <div>
                  <strong className="d-block">{currentBooking.guestName}</strong>
                  <span className="small text-muted">{currentBooking.phone}</span>
                </div>
                <div className="text-end">
                  <strong className="d-block text-success">{currentBooking.roomCode}</strong>
                  <span className="small text-muted">
                    {currentBooking.checkIn} - {currentBooking.checkOut}
                  </span>
                </div>
              </div>

              <div className="form-group-item">
                <label className="form-label-title">1. Xác thực CCCD / Giấy tờ tùy thân:</label>
                <input
                  type="text"
                  className="form-input-field"
                  defaultValue={currentBooking.cccd !== 'Chưa cập nhật' ? currentBooking.cccd : '001198034521'}
                  placeholder="Nhập hoặc quét mã QR CCCD..."
                />
              </div>

              <div className="p-3 border border-danger-subtle bg-danger-subtle rounded-3">
                <strong className="text-danger d-block mb-1">
                  2. Thanh toán số tiền phòng còn lại:
                </strong>
                <div className="d-flex justify-content-between align-items-baseline mb-2">
                  <span className="small text-muted">Còn phải thu tại quầy:</span>
                  <span className="fs-5 fw-bold text-danger">
                    {formatVND(currentBooking.remainAmount)}
                  </span>
                </div>
                <div className="d-flex gap-2">
                  <label className="p-2 border rounded bg-white flex-fill small">
                    <input type="radio" name="payType" defaultChecked className="me-1" /> VietQR
                  </label>
                  <label className="p-2 border rounded bg-white flex-fill small">
                    <input type="radio" name="payType" className="me-1" /> Tiền mặt
                  </label>
                  <label className="p-2 border rounded bg-white flex-fill small">
                    <input type="radio" name="payType" className="me-1" /> Quẹt POS
                  </label>
                </div>
              </div>

              <div className="p-3 bg-light rounded-3 small">
                <strong className="d-block mb-1">3. Bàn giao chìa khóa & Tiện ích:</strong>
                <div className="text-muted">• Giao 01 chìa khóa cơ + 01 thẻ phòng {currentBooking.roomCode}</div>
                <div className="text-muted">• Wifi: NhaSanMoc_Guest (Pass: maichau2024)</div>
              </div>
            </div>

            <div className="bk-footer-styled">
              <button className="btn-secondary-action" onClick={closeModal}>
                Hủy
              </button>
              <button className="btn-primary-action" onClick={confirmCheckin}>
                <i className="bi bi-check2-circle" />
                <span>Xác nhận nhận phòng & Giao chìa</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          MODAL 3: CHECK-OUT & QUYẾT TOÁN
      ═════════════════════════════════════════════════════════════ */}
      {activeModal === 'checkout' && (
        <div className="bk-modal-backdrop" onClick={closeModal}>
          <div className="bk-modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="bk-header-styled primary-style">
              <div className="bk-header-title-box">
                <i className="bi bi-box-arrow-right fs-5" />
                <div>
                  <h3>Thủ tục Check-out & Quyết toán</h3>
                  <span>Đơn: #{currentBooking.id}</span>
                </div>
              </div>
              <button className="modal-close-btn text-white" onClick={closeModal}>
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <div className="bk-body-scrollable">
              <div className="p-3 bg-light rounded-3 d-flex justify-content-between align-items-center">
                <div>
                  <strong className="d-block">{currentBooking.guestName}</strong>
                  <span className="small text-muted">{currentBooking.nights} đêm lưu trú</span>
                </div>
                <div className="text-end">
                  <strong className="text-success">{currentBooking.roomCode}</strong>
                </div>
              </div>

              <div className="p-3 bg-light rounded-3">
                <div className="d-flex justify-content-between py-1 border-bottom small">
                  <span>Tiền phòng còn thiếu:</span>
                  <strong>{formatVND(currentBooking.remainAmount)}</strong>
                </div>
                <div className="d-flex justify-content-between py-1 border-bottom small">
                  <span>Dịch vụ dùng thêm:</span>
                  <strong>
                    {formatVND(
                      (currentBooking.services || []).reduce((acc, c) => acc + c.total, 0)
                    )}
                  </strong>
                </div>
                <div className="d-flex justify-content-between pt-2">
                  <strong>TỔNG CỘNG THANH TOÁN:</strong>
                  <strong className="fs-5 text-success">
                    {formatVND(
                      currentBooking.remainAmount +
                        (currentBooking.services || []).reduce((acc, c) => acc + c.total, 0)
                    )}
                  </strong>
                </div>
              </div>

              <div className="d-flex flex-column gap-2 small">
                <label className="d-flex align-items-center gap-2">
                  <input type="checkbox" defaultChecked /> Đã nhận lại đủ chìa khóa phòng
                </label>
                <label className="d-flex align-items-center gap-2">
                  <input type="checkbox" defaultChecked /> Đồ đạc và trang thiết bị phòng nguyên vẹn
                </label>
              </div>
            </div>

            <div className="bk-footer-styled">
              <button className="btn-secondary-action" onClick={closeModal}>
                Đóng
              </button>
              <button className="btn-primary-action" onClick={confirmCheckout}>
                <i className="bi bi-check-all" />
                <span>Xác nhận thanh toán & Trả phòng</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          MODAL 4: THÊM DỊCH VỤ VÀO ĐƠN
      ═════════════════════════════════════════════════════════════ */}
      {activeModal === 'addService' && (
        <div className="bk-modal-backdrop" onClick={closeModal}>
          <div className="bk-modal-window large" onClick={(e) => e.stopPropagation()}>
            <div className="bk-header-styled surface-style">
              <div className="bk-header-title-box">
                <i className="bi bi-basket2 text-primary fs-5" />
                <div>
                  <h3>Thêm dịch vụ & Trải nghiệm bản địa</h3>
                  <span>Đơn: #{currentBooking.id} ({currentBooking.guestName})</span>
                </div>
              </div>
              <button className="modal-close-btn" onClick={closeModal}>
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <div className="bk-body-scrollable">
              <div className="d-flex flex-column gap-2">
                {AVAILABLE_SERVICES.map((srv, i) => {
                  const currentQ = serviceQty[srv.name] || 0;
                  return (
                    <div key={i} className="service-qty-row">
                      <div>
                        <strong className="d-block">{srv.name}</strong>
                        <span className="small text-muted">
                          {formatVND(srv.price)} / {srv.unit}
                        </span>
                      </div>
                      <div className="service-qty-controls">
                        <button
                          className="btn-qty-spin"
                          onClick={() =>
                            setServiceQty({
                              ...serviceQty,
                              [srv.name]: Math.max(0, currentQ - 1)
                            })
                          }
                        >
                          -
                        </button>
                        <span className="qty-display-number">{currentQ}</span>
                        <button
                          className="btn-qty-spin"
                          onClick={() =>
                            setServiceQty({
                              ...serviceQty,
                              [srv.name]: currentQ + 1
                            })
                          }
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bk-footer-styled">
              <button className="btn-secondary-action" onClick={closeModal}>
                Hủy
              </button>
              <button className="btn-primary-action" onClick={saveAddedServices}>
                <i className="bi bi-plus-circle" />
                <span>Xác nhận thêm vào hóa đơn</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          MODAL 5: HÓA ĐƠN THANH TOÁN (INVOICE)
      ═════════════════════════════════════════════════════════════ */}
      {activeModal === 'invoice' && (
        <div className="bk-modal-backdrop" onClick={closeModal}>
          <div className="bk-modal-window large" onClick={(e) => e.stopPropagation()}>
            <div className="bk-header-styled surface-style">
              <div className="bk-header-title-box">
                <i className="bi bi-receipt-cutoff text-primary fs-5" />
                <h3>Phiếu thanh toán & Hóa đơn dịch vụ</h3>
              </div>
              <div className="d-flex gap-2">
                <button
                  className="btn-primary-action py-1 px-3"
                  onClick={() => window.print()}
                >
                  <i className="bi bi-printer" /> In phiếu
                </button>
                <button className="modal-close-btn" onClick={closeModal}>
                  <i className="bi bi-x-lg" />
                </button>
              </div>
            </div>

            <div className="bk-body-scrollable">
              <div className="invoice-print-container p-4 border rounded-3 bg-white">
                <div className="d-flex justify-content-between pb-3 border-bottom">
                  <div>
                    <h5 className="fw-bold mb-1">HOMESTAY NHÀ SÀN MỘC</h5>
                    <div className="small text-muted">Bản Lác, Chiềng Châu, Mai Châu, Hòa Bình</div>
                    <div className="small text-muted">Hotline: 0988 345 678 • MST: 5400192837</div>
                  </div>
                  <div className="text-end">
                    <h6 className="fw-bold text-success mb-1">HÓA ĐƠN THANH TOÁN</h6>
                    <div className="small">Số: #{currentBooking.invoiceNo || 'HD-20240917-001'}</div>
                    <div className="small text-muted">{currentBooking.invoiceDate || '17/09/2024 12:00'}</div>
                  </div>
                </div>

                <div className="p-3 bg-light rounded-2 small my-2">
                  <div>
                    <strong>Khách hàng:</strong> {currentBooking.guestName} ({currentBooking.phone})
                  </div>
                  <div>
                    <strong>Phòng lưu trú:</strong> {currentBooking.roomCode} ({currentBooking.nights} đêm)
                  </div>
                </div>

                <table className="table table-sm small mb-3">
                  <thead>
                    <tr className="table-light">
                      <th>Nội dung dịch vụ</th>
                      <th className="text-center">Số lượng</th>
                      <th className="text-end">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Tiền phòng: {currentBooking.roomType}</td>
                      <td className="text-center">{currentBooking.nights} đêm</td>
                      <td className="text-end">{formatVND(currentBooking.totalAmount)}</td>
                    </tr>
                    {(currentBooking.services || []).map((s, idx) => (
                      <tr key={idx}>
                        <td>{s.name}</td>
                        <td className="text-center">{s.qty}</td>
                        <td className="text-end">{formatVND(s.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="d-flex justify-content-between pt-2 border-top">
                  <strong>TỔNG TIỀN ĐÃ THANH TOÁN:</strong>
                  <strong className="fs-5 text-success">
                    {formatVND(currentBooking.totalAmount)}
                  </strong>
                </div>

                <div className="text-center pt-4">
                  <div className="invoice-stamp-paid">
                    <span>NHÀ SÀN MỘC</span>
                    <span>ĐÃ THU</span>
                    <span>PAID</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bk-footer-styled">
              <button className="btn-secondary-action" onClick={closeModal}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          MODAL 6: DUYỆT ĐƠN & ĐỐI SOÁT CỌC
      ═════════════════════════════════════════════════════════════ */}
      {activeModal === 'approve' && (
        <div className="bk-modal-backdrop" onClick={closeModal}>
          <div className="bk-modal-window small" onClick={(e) => e.stopPropagation()}>
            <div className="bk-header-styled secondary-style">
              <div className="bk-header-title-box">
                <i className="bi bi-shield-check fs-5" />
                <div>
                  <h3>Duyệt đơn & Xác nhận cọc</h3>
                  <span>Mã đơn: #{currentBooking.id}</span>
                </div>
              </div>
              <button className="modal-close-btn text-white" onClick={closeModal}>
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <div className="bk-body-scrollable">
              <div className="p-3 bg-light rounded-3 d-flex justify-content-between align-items-center">
                <div>
                  <strong>{currentBooking.guestName}</strong>
                  <span className="d-block small text-muted">{currentBooking.roomCode}</span>
                </div>
                <div className="text-end">
                  <span className="small text-muted">Cọc cần xác nhận:</span>
                  <strong className="d-block fs-5 text-success">
                    {formatVND(currentBooking.depositAmount)}
                  </strong>
                </div>
              </div>

              {currentBooking.bankTransferInfo && (
                <div className="p-3 bg-light rounded-3 small">
                  <strong>Dữ liệu đối soát ngân hàng:</strong>
                  <div className="text-muted mt-1">
                    Ngân hàng: {currentBooking.bankTransferInfo.bankName}
                  </div>
                  <div className="text-muted">
                    Nội dung: {currentBooking.bankTransferInfo.transferContent}
                  </div>
                  <div className="text-muted">
                    Thời gian: {currentBooking.bankTransferInfo.transferDate}
                  </div>
                </div>
              )}

              <div className="p-2 bg-success-subtle text-success-emphasis rounded-2 small d-flex align-items-center gap-2">
                <i className="bi bi-check-circle-fill" />
                <span>Số tiền khớp 100% với giá trị cọc yêu cầu.</span>
              </div>
            </div>

            <div className="bk-footer-styled">
              <button className="btn-secondary-action" onClick={closeModal}>
                Đóng
              </button>
              <button className="btn-primary-action" onClick={confirmApprove}>
                <i className="bi bi-check-circle" />
                <span>Xác nhận duyệt & Giữ phòng</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          MODAL 7: TỪ CHỐI ĐƠN
      ═════════════════════════════════════════════════════════════ */}
      {activeModal === 'reject' && (
        <div className="bk-modal-backdrop" onClick={closeModal}>
          <div className="bk-modal-window small" onClick={(e) => e.stopPropagation()}>
            <div className="bk-header-styled error-style">
              <div className="bk-header-title-box">
                <i className="bi bi-x-circle fs-5" />
                <div>
                  <h3>Từ chối đơn đặt phòng</h3>
                  <span>Mã đơn: #{currentBooking.id}</span>
                </div>
              </div>
              <button className="modal-close-btn text-white" onClick={closeModal}>
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <div className="bk-body-scrollable">
              <div className="form-group-item">
                <label className="form-label-title">Lý do từ chối:</label>
                <select className="form-input-field">
                  <option>Hết phòng do khách đoàn gia hạn thêm ngày</option>
                  <option>Trùng lịch khử trùng và bảo trì cơ sở</option>
                  <option>Khách hàng không chuyển cọc đúng hạn</option>
                </select>
              </div>

              <div className="form-group-item">
                <label className="form-label-title">Nội dung gửi cho khách:</label>
                <textarea
                  rows="3"
                  className="form-input-field"
                  defaultValue="Homestay Nhà Sàn Mộc rất tiếc chưa thể tiếp nhận đơn đặt của quý khách do trùng lịch bảo trì."
                />
              </div>
            </div>

            <div className="bk-footer-styled">
              <button className="btn-secondary-action" onClick={closeModal}>
                Hủy bỏ
              </button>
              <button
                className="btn-primary-action"
                style={{ background: '#dc2626' }}
                onClick={confirmReject}
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          MODAL 8: XUẤT BÁO CÁO / EXCEL
      ═════════════════════════════════════════════════════════════ */}
      {activeModal === 'export' && (
        <div className="bk-modal-backdrop" onClick={closeModal}>
          <div className="bk-modal-window small" onClick={(e) => e.stopPropagation()}>
            <div className="bk-header-styled surface-style">
              <div className="bk-header-title-box">
                <i className="bi bi-file-earmark-spreadsheet text-success fs-5" />
                <div>
                  <h3>Xuất báo cáo & Dữ liệu</h3>
                  <span>Tải file Excel đối soát kế toán</span>
                </div>
              </div>
              <button className="modal-close-btn" onClick={closeModal}>
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <div className="bk-body-scrollable">
              <div className="form-group-item">
                <label className="form-label-title">Chọn kỳ xuất dữ liệu:</label>
                <select className="form-input-field">
                  <option>Tháng 9/2024</option>
                  <option>7 ngày gần nhất</option>
                  <option>Hôm nay</option>
                </select>
              </div>

              <div className="form-group-item">
                <label className="form-label-title">Định dạng:</label>
                <div className="d-flex gap-2">
                  <label className="p-3 border rounded-3 bg-light flex-fill text-center small fw-bold">
                    <i className="bi bi-filetype-xlsx d-block fs-4 text-success mb-1" />
                    Excel (.xlsx)
                  </label>
                  <label className="p-3 border rounded-3 bg-light flex-fill text-center small fw-bold">
                    <i className="bi bi-filetype-pdf d-block fs-4 text-danger mb-1" />
                    PDF Báo cáo
                  </label>
                </div>
              </div>
            </div>

            <div className="bk-footer-styled">
              <button className="btn-secondary-action" onClick={closeModal}>
                Hủy
              </button>
              <button
                className="btn-primary-action"
                onClick={() => {
                  showToast('Đang tải xuống tệp báo cáo Excel...');
                  closeModal();
                }}
              >
                <i className="bi bi-download" /> Tải xuống
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          MODAL 9: LIÊN HỆ KHÁCH HÀNG (CALL / CHAT)
      ═════════════════════════════════════════════════════════════ */}
      {activeModal === 'contact' && (
        <div className="bk-modal-backdrop" onClick={closeModal}>
          <div className="bk-modal-window small" onClick={(e) => e.stopPropagation()}>
            <div className="bk-header-styled surface-style">
              <div className="bk-header-title-box">
                <i className="bi bi-telephone-outbound text-primary fs-5" />
                <div>
                  <h3>Liên hệ khách hàng</h3>
                  <span>#{currentBooking.id} ({currentBooking.roomCode})</span>
                </div>
              </div>
              <button className="modal-close-btn" onClick={closeModal}>
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <div className="bk-body-scrollable">
              <div className="d-flex gap-2 p-1 bg-light rounded-2">
                <button
                  className={`btn flex-fill btn-sm fw-bold ${contactTab === 'call' ? 'btn-success' : 'btn-light'}`}
                  onClick={() => setContactTab('call')}
                >
                  <i className="bi bi-telephone me-1" /> Gọi điện
                </button>
                <button
                  className={`btn flex-fill btn-sm fw-bold ${contactTab === 'chat' ? 'btn-success' : 'btn-light'}`}
                  onClick={() => setContactTab('chat')}
                >
                  <i className="bi bi-chat-dots me-1" /> Nhắn tin
                </button>
              </div>

              {contactTab === 'call' ? (
                <div className="text-center py-3">
                  <div
                    className="rounded-circle bg-success-subtle text-success mx-auto d-flex align-items-center justify-content-center mb-2"
                    style={{ width: '64px', height: '64px', fontSize: '1.8rem' }}
                  >
                    <i className="bi bi-telephone-fill" />
                  </div>
                  <h5 className="fw-bold mb-1">{currentBooking.guestName}</h5>
                  <div className="fs-5 fw-bold text-success mb-3">{currentBooking.phone}</div>
                  <a
                    href={`tel:${currentBooking.phone?.replace(/\s/g, '')}`}
                    className="btn btn-success fw-bold px-4 py-2"
                  >
                    Bấm gọi ngay
                  </a>
                </div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  <div className="small text-muted">Mẫu tin nhắn nhanh:</div>
                  <button
                    className="text-start p-2 border rounded bg-light small"
                    onClick={() =>
                      setChatMessage(
                        `Chào bạn, Homestay Nhà Sàn Mộc đã sẵn sàng đón bạn nhận phòng ${currentBooking.roomCode} lúc 14h00 hôm nay nhé!`
                      )
                    }
                  >
                    Nhắc nhận phòng lúc 14h00
                  </button>
                  <button
                    className="text-start p-2 border rounded bg-light small"
                    onClick={() =>
                      setChatMessage(
                        'Homestay hỗ trợ hướng dẫn xe ô tô 16 chỗ vào tận sân hiên homestay nhé!'
                      )
                    }
                  >
                    Hướng dẫn đường vào xe ô tô
                  </button>
                  <textarea
                    rows="3"
                    className="form-input-field mt-1"
                    placeholder="Nội dung tin nhắn..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                  />
                  <button
                    className="btn-primary-action w-100 justify-content-center"
                    onClick={() => {
                      if (!chatMessage.trim()) {
                        showToast('Vui lòng nhập tin nhắn', 'error');
                        return;
                      }
                      showToast('Đã gửi tin nhắn đến khách hàng!');
                      closeModal();
                    }}
                  >
                    <i className="bi bi-send" /> Gửi tin nhắn qua Zalo / SMS
                  </button>
                </div>
              )}
            </div>

            <div className="bk-footer-styled">
              <button className="btn-secondary-action" onClick={closeModal}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          MODAL 10: TẠO ĐƠN ĐẶT PHÒNG TRỰC TIẾP
      ═════════════════════════════════════════════════════════════ */}
      {activeModal === 'createBooking' && (
        <div className="bk-modal-backdrop" onClick={closeModal}>
          <div className="bk-modal-window large" onClick={(e) => e.stopPropagation()}>
            <div className="bk-header-styled surface-style">
              <div className="bk-header-title-box">
                <i className="bi bi-calendar-plus text-primary fs-5" />
                <div>
                  <h3>Tạo đơn đặt phòng trực tiếp</h3>
                  <span>Tiếp nhận khách vãng lai hoặc qua điện thoại</span>
                </div>
              </div>
              <button className="modal-close-btn" onClick={closeModal}>
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <form onSubmit={handleCreateDirectBooking}>
              <div className="bk-body-scrollable">
                <div className="form-grid-2">
                  <div className="form-group-item">
                    <label className="form-label-title">Tên khách hàng</label>
                    <input
                      type="text"
                      className="form-input-field"
                      placeholder="VD: Hoàng Văn Nam"
                      value={newBooking.guestName}
                      onChange={(e) =>
                        setNewBooking({ ...newBooking, guestName: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="form-group-item">
                    <label className="form-label-title">Số điện thoại</label>
                    <input
                      type="text"
                      className="form-input-field"
                      placeholder="VD: 0988 123 456"
                      value={newBooking.phone}
                      onChange={(e) =>
                        setNewBooking({ ...newBooking, phone: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group-item">
                    <label className="form-label-title">Phòng xếp lịch</label>
                    <select
                      className="form-input-field"
                      value={newBooking.roomCode}
                      onChange={(e) => {
                        const code = e.target.value;
                        let type = 'Phòng Mountain View (Nhà Gỗ)';
                        let price = 950000;
                        if (code.includes('Lake')) {
                          type = 'Phòng Lake View (Ven Hồ)';
                          price = 1100000;
                        } else if (code.includes('Bungalow')) {
                          type = 'Bungalow Suối';
                          price = 1250000;
                        }
                        setNewBooking({
                          ...newBooking,
                          roomCode: code,
                          roomType: type,
                          pricePerNight: price,
                          depositAmount: price
                        });
                      }}
                    >
                      <option value="Mountain View #01">Mountain View #01 (950k/đêm)</option>
                      <option value="Lake View #02">Lake View #02 (1.100k/đêm)</option>
                      <option value="Bungalow Suối #01">Bungalow Suối #01 (1.250k/đêm)</option>
                    </select>
                  </div>

                  <div className="form-group-item">
                    <label className="form-label-title">Số lượng khách</label>
                    <input
                      type="text"
                      className="form-input-field"
                      value={newBooking.guestsCount}
                      onChange={(e) =>
                        setNewBooking({ ...newBooking, guestsCount: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group-item">
                    <label className="form-label-title">Ngày nhận phòng</label>
                    <input
                      type="date"
                      className="form-input-field"
                      value={newBooking.checkIn}
                      onChange={(e) =>
                        setNewBooking({ ...newBooking, checkIn: e.target.value })
                      }
                    />
                  </div>
                  <div className="form-group-item">
                    <label className="form-label-title">Ngày trả phòng</label>
                    <input
                      type="date"
                      className="form-input-field"
                      value={newBooking.checkOut}
                      onChange={(e) =>
                        setNewBooking({ ...newBooking, checkOut: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="form-group-item">
                  <label className="form-label-title">Tiền cọc nhận trước (VNĐ)</label>
                  <input
                    type="number"
                    className="form-input-field"
                    value={newBooking.depositAmount}
                    onChange={(e) =>
                      setNewBooking({ ...newBooking, depositAmount: e.target.value })
                    }
                  />
                </div>

                <div className="form-group-item">
                  <label className="form-label-title">Ghi chú hoặc yêu cầu đặc biệt</label>
                  <textarea
                    rows="2"
                    className="form-input-field"
                    placeholder="VD: Khách đến muộn lúc 19h..."
                    value={newBooking.specialRequest}
                    onChange={(e) =>
                      setNewBooking({ ...newBooking, specialRequest: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="bk-footer-styled">
                <button
                  type="button"
                  className="btn-secondary-action"
                  onClick={closeModal}
                >
                  Hủy
                </button>
                <button type="submit" className="btn-primary-action">
                  <i className="bi bi-check-lg" />
                  <span>Tạo đơn đặt phòng</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
