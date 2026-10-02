import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import './Bookings.css';

const INITIAL_BOOKINGS = [
  {
    id: 'BK-2026-8892',
    code: 'YEN-2026-8892',
    homestayName: 'The Memory Valley Villa',
    homestayImg: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=600&q=80',
    location: 'Hồ Tuyền Lâm, Đà Lạt',
    roomType: 'Villa 3 phòng ngủ view thung lũng',
    checkIn: '22/09/2026',
    checkOut: '25/09/2026',
    nights: 3,
    guests: '6 người lớn · 2 trẻ em',
    totalPrice: '4.350.000đ',
    payStatus: 'Đã thanh toán VNPAY (100%)',
    status: 'active', // 'active', 'upcoming', 'completed', 'complaint'
    task: {
      id: 'TASK-8892',
      title: 'Danh sách việc cần làm tại Homestay',
      rewardText: '🎁 Quà tặng trực tiếp từ Homestay',
      status: 'pending',
      checklist: [
        { id: 1, text: 'Chụp ảnh phòng ở thực tế & nội thất homestay', done: false },
        { id: 2, text: 'Chụp ảnh check-in khuôn viên & cảnh quan xung quanh', done: false },
        { id: 3, text: 'Đăng nhận xét & đánh giá trải nghiệm homestay', done: false }
      ],
      userReview: null
    }
  },
  {
    id: 'BK-2026-7714',
    code: 'YEN-2026-7714',
    homestayName: 'Han River Glass House',
    homestayImg: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
    location: 'Bờ sông Hàn, Đà Nẵng',
    roomType: 'Căn hộ kính view toàn cảnh bờ sông Hàn',
    checkIn: '15/10/2026',
    checkOut: '18/10/2026',
    nights: 3,
    guests: '4 người lớn',
    totalPrice: '3.450.000đ',
    payStatus: 'Đã cọc 30% (VietQR)',
    status: 'upcoming',
    task: {
      id: 'TASK-7714',
      title: 'Danh sách việc cần làm tại Homestay',
      rewardText: '🎁 Quà tặng trực tiếp từ Homestay',
      status: 'pending',
      checklist: [
        { id: 1, text: 'Chụp ảnh phòng kính view toàn cảnh Sông Hàn', done: false },
        { id: 2, text: 'Chụp ảnh check-in khoảnh khắc ngắm hoàng hôn', done: false },
        { id: 3, text: 'Đánh giá chất lượng dịch vụ & độ sạch của phòng', done: false }
      ],
      userReview: null
    }
  },
  {
    id: 'BK-2026-5021',
    code: 'YEN-2026-5021',
    homestayName: 'Hội An Ancient Town Retreat',
    homestayImg: 'https://images.unsplash.com/photo-1523731407965-2430cd12f5e4?auto=format&fit=crop&w=600&q=80',
    location: 'Phố cổ Hội An, Quảng Nam',
    roomType: 'Phòng suite view phố cổ đèn lồng',
    checkIn: '10/07/2026',
    checkOut: '13/07/2026',
    nights: 3,
    guests: '2 người lớn',
    totalPrice: '2.850.000đ',
    payStatus: 'Đã thanh toán (MoMo)',
    status: 'complaint',
    complaint: {
      id: 'KN-5021',
      ticketCode: 'KN-5021-A',
      typeText: 'Chất lượng phòng ở',
      severity: 'medium',
      content: 'Phòng có mùi ẩm, điều hòa không hoạt động trong suốt kỳ lưu trú.',
      statusText: 'Đang xử lý'
    },
    task: {
      id: 'TASK-5021',
      title: 'Danh sách việc cần làm tại Homestay',
      rewardText: '🎁 Quà tặng trực tiếp từ Homestay',
      status: 'pending',
      checklist: [
        { id: 1, text: 'Chụp ảnh phòng suite view phố cổ', done: false },
        { id: 3, text: 'Đăng bài nhận xét trải nghiệm', done: false }
      ],
      userReview: null
    }
  },
  {
    id: 'BK-2026-6540',
    code: 'YEN-2026-6540',
    homestayName: 'Topas Ecolodge Sapa',
    homestayImg: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80',
    location: 'Mường Hoa, Sapa',
    roomType: 'Bungalow thung lũng Mường Hoa',
    checkIn: '05/08/2026',
    checkOut: '08/08/2026',
    nights: 3,
    guests: '2 người lớn',
    totalPrice: '13.770.000đ',
    payStatus: 'Đã thanh toán (Thẻ Visa)',
    status: 'completed',
    task: {
      id: 'TASK-6540',
      title: 'Danh sách việc cần làm tại Homestay',
      rewardText: '🎁 Đã nhận quà tặng từ Homestay',
      status: 'completed',
      checklist: [
        { id: 1, text: 'Chụp ảnh Bungalow view thung lũng Mường Hoa', done: true },
        { id: 2, text: 'Chụp ảnh check-in biển mây Sapa', done: true },
        { id: 3, text: 'Đăng bài nhận xét & đánh giá trải nghiệm Sapa', done: true }
      ],
      userReview: {
        rating: 5,
        title: 'Chuyến săn mây tuyệt vời nhất năm!',
        content: 'Cảnh quan thung lũng Mường Hoa quá đẹp. Chủ nhà YÊN hỗ trợ xe Limousine tận tình, phòng ốc sạch sẽ ấm cúng.',
        createdAt: '09/08/2026'
      }
    }
  }
];

export default function Bookings() {
  const [userBookings, setUserBookings] = useState(INITIAL_BOOKINGS);
  const [currentFilter, setCurrentFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState({ show: false, msg: '' });

  // Task Modal State
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [activeTaskBkId, setActiveTaskBkId] = useState(null);
  const [starRating, setStarRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewContent, setReviewContent] = useState('');

  // Complaint Modal State
  const [complaintModalOpen, setComplaintModalOpen] = useState(false);
  const [activeCmpBkId, setActiveCmpBkId] = useState(null);
  const [cmpType, setCmpType] = useState('');
  const [cmpSeverity, setCmpSeverity] = useState('medium');
  const [cmpContent, setCmpContent] = useState('');
  const [cmpContact, setCmpContact] = useState('');
  const [cmpResolution, setCmpResolution] = useState('apology');

  const showToast = (msg) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: '' }), 3200);
  };

  // Stats calculation
  const stats = useMemo(() => {
    const activeCount = userBookings.filter((b) => b.status === 'active').length;
    const upcomingCount = userBookings.filter((b) => b.status === 'upcoming').length;
    const completedCount = userBookings.filter((b) => b.status === 'completed').length;
    const complaintCount = userBookings.filter((b) => b.status === 'complaint').length;
    const pendingTasksCount = userBookings.filter((b) => b.task && b.task.status === 'pending').length;
    return {
      all: userBookings.length,
      active: activeCount,
      upcoming: upcomingCount,
      completed: completedCount,
      complaint: complaintCount,
      pendingTasks: pendingTasksCount,
    };
  }, [userBookings]);

  // Filtered List
  const filteredBookings = useMemo(() => {
    return userBookings.filter((b) => {
      if (currentFilter !== 'all' && b.status !== currentFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = b.homestayName.toLowerCase().includes(q);
        const matchCode = b.code.toLowerCase().includes(q);
        const matchLoc = b.location.toLowerCase().includes(q);
        return matchName || matchCode || matchLoc;
      }
      return true;
    });
  }, [userBookings, currentFilter, searchQuery]);

  // Task Modal Handler
  const openTaskModal = (bkId) => {
    setActiveTaskBkId(bkId);
    setTaskModalOpen(true);
    setStarRating(5);
    setReviewTitle('');
    setReviewContent('');
  };

  const handleTaskSubmit = (e) => {
    e.preventDefault();
    if (!reviewContent.trim() || reviewContent.trim().length < 10) {
      showToast('Vui lòng nhập nội dung đánh giá chi tiết tối thiểu 10 ký tự!');
      return;
    }

    setUserBookings((prev) =>
      prev.map((b) => {
        if (b.id === activeTaskBkId) {
          return {
            ...b,
            task: {
              ...b.task,
              status: 'completed',
              checklist: b.task.checklist.map((item) => ({ ...item, done: true })),
              userReview: {
                rating: starRating,
                title: reviewTitle || 'Đánh giá tuyệt vời!',
                content: reviewContent,
                createdAt: 'Hôm nay',
              },
            },
          };
        }
        return b;
      })
    );

    setTaskModalOpen(false);
    showToast('Đã hoàn thành danh sách nhiệm vụ & gửi đánh giá!');
  };

  // Complaint Modal Handler
  const openComplaintModal = (bkId) => {
    setActiveCmpBkId(bkId);
    setComplaintModalOpen(true);
    setCmpType('');
    setCmpContent('');
    setCmpContact('');
  };

  const handleComplaintSubmit = (e) => {
    e.preventDefault();
    if (!cmpType) { showToast('Vui lòng chọn loại vấn đề!'); return; }
    if (!cmpContent.trim() || cmpContent.trim().length < 20) {
      showToast('Vui lòng mô tả chi tiết sự việc (tối thiểu 20 ký tự)!');
      return;
    }
    if (!cmpContact.trim()) { showToast('Vui lòng nhập SĐT/Email để nhận phản hồi!'); return; }

    const ticketCode = 'KN-' + activeCmpBkId.replace('BK-', '') + '-' + Math.floor(100 + Math.random() * 900);

    setUserBookings((prev) =>
      prev.map((b) => {
        if (b.id === activeCmpBkId) {
          return {
            ...b,
            status: 'complaint',
            complaint: {
              id: ticketCode,
              ticketCode,
              typeText: cmpType,
              severity: cmpSeverity,
              content: cmpContent,
              statusText: 'Đang xử lý',
            },
          };
        }
        return b;
      })
    );

    setComplaintModalOpen(false);
    showToast(`Khiếu nại đã gửi thành công! Mã ticket: ${ticketCode}`);
  };

  const activeTaskBk = userBookings.find((b) => b.id === activeTaskBkId);
  const activeCmpBk = userBookings.find((b) => b.id === activeCmpBkId);

  return (
    <div className="bk-page">
      <div className="bk-container">
        <div className="bk-layout-grid">

          {/* 1. LEFT SIDEBAR */}
          <aside className="bk-sidebar-col">
            <div className="bk-user-profile-card">
              <div className="d-flex align-items-center gap-3 mb-3" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
                  alt="Avatar" className="bk-avatar-img" />
                <div>
                  <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>Lê Hoàng Mai Chi</h2>
                  <span className="badge-member-tag" style={{ marginTop: 4 }}>
                    <i className="bi bi-house-heart-fill text-success" /> Du khách YÊN
                  </span>
                </div>
              </div>

              <div className="bk-sidebar-stats-grid">
                <div className="sidebar-stat-item">
                  <span className="lbl">Đang ở</span>
                  <b className="val text-success" style={{ color: '#15803D' }}>{stats.active} phòng</b>
                </div>
                <div className="sidebar-stat-item">
                  <span className="lbl">Việc cần làm</span>
                  <b className="val text-warning" style={{ color: '#D97706' }}>{stats.pendingTasks} mục</b>
                </div>
              </div>
            </div>

            <div className="account-sidebar-card">
              <div className="sidebar-title">
                <span className="sidebar-title-dot" /> Quản lý phòng đặt
              </div>
              <div className="account-nav-list">
                <button type="button" className={`account-nav-item ${currentFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setCurrentFilter('all')}>
                  <i className="bi bi-grid-fill" /> <span>Tất cả phòng đặt</span>
                  <span className="nav-badge-count">{stats.all}</span>
                </button>
                <button type="button" className={`account-nav-item ${currentFilter === 'active' ? 'active' : ''}`}
                  onClick={() => setCurrentFilter('active')}>
                  <span className="active-pulse-dot" /> <span>Đang lưu trú</span>
                  <span className="nav-badge-count">{stats.active}</span>
                </button>
                <button type="button" className={`account-nav-item ${currentFilter === 'upcoming' ? 'active' : ''}`}
                  onClick={() => setCurrentFilter('upcoming')}>
                  <i className="bi bi-clock-history" /> <span>Sắp nhận phòng</span>
                  <span className="nav-badge-count">{stats.upcoming}</span>
                </button>
                <button type="button" className={`account-nav-item ${currentFilter === 'completed' ? 'active' : ''}`}
                  onClick={() => setCurrentFilter('completed')}>
                  <i className="bi bi-check-circle-fill" /> <span>Đã hoàn thành</span>
                  <span className="nav-badge-count">{stats.completed}</span>
                </button>
                <button type="button" className={`account-nav-item ${currentFilter === 'complaint' ? 'active' : ''}`}
                  onClick={() => setCurrentFilter('complaint')}>
                  <i className="bi bi-exclamation-triangle-fill" /> <span>Khiếu nại</span>
                  <span className="nav-badge-count">{stats.complaint}</span>
                </button>
              </div>
            </div>
          </aside>

          {/* 2. RIGHT CONTENT AREA */}
          <section className="bk-content-col">
            <div className="bk-toolbar">
              <div>
                <h1>Đặt Phòng & Danh Sách Nhiệm Vụ</h1>
                <p>Theo dõi lịch sử chuyến đi và thực hiện các nhiệm vụ tích quà tại Homestay</p>
              </div>
              <div className="search-hs-box">
                <div className="search-icon-badge"><i className="bi bi-search" /></div>
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo tên homestay, mã đặt..." />
              </div>
            </div>

            <div className="bk-cards-list">
              {filteredBookings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 20px', background: '#FFFFFF', borderRadius: 18, border: '1.5px dashed #CBD5E1' }}>
                  <i className="bi bi-calendar-x" style={{ fontSize: '2.5rem', color: '#94A3B8', display: 'block', marginBottom: 12 }} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>Chưa có lịch sử phòng đặt trong mục này</h3>
                  <p style={{ fontSize: '0.88rem', color: '#64748B', marginBottom: 18 }}>Hãy khám phá các homestay sinh thái tuyệt đẹp và đặt chuyến đi ngay hôm nay!</p>
                  <Link to="/" className="btn-complete-mission" style={{ display: 'inline-flex', textDecoration: 'none' }}>
                    <i className="bi bi-compass" /> Khám phá Homestay ngay
                  </Link>
                </div>
              ) : (
                filteredBookings.map((bk) => {
                  const isTaskDone = bk.task && bk.task.status === 'completed';
                  const doneCount = bk.task ? bk.task.checklist.filter((i) => i.done).length : 0;
                  const totalCount = bk.task ? bk.task.checklist.length : 0;

                  return (
                    <div key={bk.id} className={`bk-card-item ${bk.status === 'active' ? 'is-active-stay' : ''}`}>
                      <div className="bk-card-header">
                        <div className="bk-code-group">
                          <span className="bk-code-label">Mã đặt phòng:</span>
                          <span className="bk-code-val">{bk.code}</span>
                        </div>
                        {bk.status === 'active' && <span className="status-badge status-active"><span className="active-pulse-dot" /> ĐANG LƯU TRÚ</span>}
                        {bk.status === 'upcoming' && <span className="status-badge status-upcoming"><i className="bi bi-clock-history" /> SẮP NHẬN PHÒNG</span>}
                        {bk.status === 'completed' && <span className="status-badge status-completed"><i className="bi bi-check-circle-fill" /> ĐÃ HOÀN THÀNH</span>}
                        {bk.status === 'complaint' && <span className="status-badge status-complaint"><i className="bi bi-exclamation-triangle-fill" /> Khiếu nại ({bk.complaint?.statusText})</span>}
                      </div>

                      <div className="bk-card-body">
                        <div className="bk-img-box">
                          <img src={bk.homestayImg} alt={bk.homestayName} />
                        </div>
                        <div className="bk-info-box">
                          <h3 className="bk-hs-name">{bk.homestayName}</h3>
                          <div className="bk-hs-location"><i className="bi bi-geo-alt-fill text-danger" /> {bk.location}</div>
                          <div className="bk-specs-row">
                            <span><i className="bi bi-house-door text-success" /> {bk.roomType}</span>
                            <span>•</span>
                            <span><i className="bi bi-people text-primary" /> {bk.guests}</span>
                          </div>
                          <div className="bk-dates-chip">
                            <i className="bi bi-calendar-event" />
                            <span>Nhận: {bk.checkIn} — Trả: {bk.checkOut} ({bk.nights} đêm)</span>
                          </div>
                          <div className="bk-price-row">
                            <div>
                              <span style={{ fontSize: '0.78rem', color: '#64748B' }}>Tổng cộng:</span>
                              <div className="bk-price-val">{bk.totalPrice}</div>
                            </div>
                            <div className="bk-pay-tag"><i className="bi bi-shield-check" /> {bk.payStatus}</div>
                          </div>
                        </div>
                      </div>

                      {/* TASK CHECKLIST BOX */}
                      {bk.task && (
                        <div className={`bk-task-checklist-box ${isTaskDone ? 'is-completed' : ''}`}>
                          <div className="task-checklist-head">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div className={`task-checklist-icon-badge ${isTaskDone ? 'completed' : ''}`}>
                                <i className={`bi ${isTaskDone ? 'bi-check-circle-fill' : 'bi-card-checklist'}`} />
                              </div>
                              <div>
                                <h4 className="task-checklist-title">{bk.task.title}</h4>
                                <span className="task-reward-pill"><i className="bi bi-gift-fill" /> {bk.task.rewardText}</span>
                              </div>
                            </div>
                            <span className={`task-progress-badge ${isTaskDone ? 'done' : 'pending'}`}>
                              {isTaskDone ? '3/3 việc hoàn thành' : `${doneCount}/${totalCount} việc đã làm`}
                            </span>
                          </div>

                          <div className="task-checklist-items">
                            {bk.task.checklist.map((item) => (
                              <div key={item.id} className={`task-item-row ${item.done ? 'done' : ''}`}
                                onClick={() => openTaskModal(bk.id)}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <i className={`bi ${item.done ? 'bi-check-square-fill text-success' : 'bi-square'}`} />
                                  <span>{item.text}</span>
                                </div>
                                <span className={`task-item-status-tag ${item.done ? 'done' : 'pending'}`}>
                                  {item.done ? 'Đã xong' : 'Chưa xong'}
                                </span>
                              </div>
                            ))}
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
                            <button type="button" className={`btn-complete-mission ${isTaskDone ? 'done' : ''}`}
                              onClick={() => openTaskModal(bk.id)}>
                              <i className={`bi ${isTaskDone ? 'bi-patch-check-fill' : 'bi-cloud-arrow-up-fill'}`} />
                              {isTaskDone ? 'Nhiệm vụ đã hoàn thành' : 'Hoàn thành nhiệm vụ'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* CARD FOOTER */}
                      <div className="bk-card-footer">
                        <button type="button" className="btn-action-ghost" onClick={() => showToast(`Liên hệ hotline ${bk.homestayName}: 0949.050.888`)}>
                          <i className="bi bi-telephone-fill text-success me-1" /> Liên hệ chủ nhà
                        </button>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button type="button" className="btn-action-ghost" onClick={() => showToast(`Đang mở hóa đơn điện tử đơn ${bk.code}...`)}>
                            <i className="bi bi-receipt" /> Hóa đơn
                          </button>
                          <button type="button" className="btn-complaint-trigger" onClick={() => openComplaintModal(bk.id)}>
                            <i className="bi bi-exclamation-triangle-fill" /> {bk.status === 'complaint' ? 'Xem khiếu nại' : 'Khiếu nại'}
                          </button>
                          <Link to="/homestay/doi" className="btn-action-ghost">Xem phòng</Link>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

        </div>
      </div>

      {/* ── MODAL CHI TIẾT NHIỆM VỤ & BÀI ĐÁNH GIÁ ── */}
      <div className={`bk-modal-overlay ${taskModalOpen ? 'show' : ''}`}>
        <div className="bk-modal-card">
          <div className="bk-modal-head">
            <h3><i className="bi bi-clipboard-check text-success" /> Danh Sách Nhiệm Vụ Homestay</h3>
            <button type="button" className="bk-modal-close" onClick={() => setTaskModalOpen(false)}>×</button>
          </div>
          <div className="bk-modal-body">
            <div className="task-detail-banner">
              <i className="bi bi-gift-fill" style={{ fontSize: '1.5rem', color: '#D97706' }} />
              <div>
                <h4>Nhiệm vụ: Đăng ảnh & gửi nhận xét trải nghiệm</h4>
                <p>Dành riêng cho chuyến lưu trú tại <b>{activeTaskBk?.homestayName}</b>.</p>
              </div>
            </div>

            {activeTaskBk?.task?.status === 'completed' && activeTaskBk.task.userReview ? (
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 20 }}>
                <span className="status-badge status-completed" style={{ marginBottom: 12 }}>ĐÃ HOÀN THÀNH</span>
                <div style={{ fontSize: '1.2rem', color: '#F59E0B', marginBottom: 8 }}>
                  {'★'.repeat(activeTaskBk.task.userReview.rating)}
                </div>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', margin: '0 0 6px' }}>
                  {activeTaskBk.task.userReview.title}
                </h4>
                <p style={{ fontSize: '0.88rem', color: '#334155', margin: 0 }}>
                  {activeTaskBk.task.userReview.content}
                </p>
              </div>
            ) : (
              <form onSubmit={handleTaskSubmit}>
                <div className="rating-section">
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: 8 }}>1. Chọn số sao đánh giá trải nghiệm</div>
                  <div className="star-rating-box">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button key={s} type="button" className={`star-btn ${s <= starRating ? 'active' : ''}`}
                        onClick={() => setStarRating(s)}>★</button>
                    ))}
                  </div>
                </div>

                <div className="form-group-review">
                  <label htmlFor="reviewTitle">2. Tiêu đề nhận xét</label>
                  <input type="text" id="reviewTitle" className="form-input-review" value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)} placeholder="Ví dụ: Chuyến đi nghỉ dưỡng tuyệt vời..." required />
                </div>

                <div className="form-group-review">
                  <label htmlFor="reviewContent">3. Nội dung nhận xét chi tiết</label>
                  <textarea id="reviewContent" className="form-textarea-review" value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)} placeholder="Chia sẻ cảm nhận về phòng ở, thái độ chủ nhà..." required />
                </div>

                <div className="form-group-review">
                  <label>4. Đính kèm ảnh check-in thực tế</label>
                  <div className="photo-upload-box" onClick={() => showToast('Đã chọn 2 ảnh check-in!')}>
                    <i className="bi bi-camera-fill" />
                    <p><b>Bấm để chọn ảnh từ thiết bị</b> (Tối đa 5 ảnh)</p>
                  </div>
                </div>

                <button type="submit" className="btn-submit-review">
                  <i className="bi bi-send-check-fill" /> Đăng bài & Hoàn thành nhiệm vụ
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* ── MODAL KHIẾU NẠI ── */}
      <div className={`bk-modal-overlay ${complaintModalOpen ? 'show' : ''}`}>
        <div className="bk-modal-card">
          <div className="bk-modal-head" style={{ background: 'linear-gradient(135deg, #7C2D12 0%, #C2410C 100%)' }}>
            <h3><i className="bi bi-exclamation-triangle-fill" /> Gửi Khiếu Nại Đặt Phòng</h3>
            <button type="button" className="bk-modal-close" onClick={() => setComplaintModalOpen(false)}>×</button>
          </div>
          <div className="bk-modal-body">
            <form onSubmit={handleComplaintSubmit}>
              <div className="form-group-review">
                <label>1. Loại vấn đề cần khiếu nại</label>
                <select className="form-input-review" value={cmpType} onChange={(e) => setCmpType(e.target.value)} required>
                  <option value="">-- Chọn loại khiếu nại --</option>
                  <option value="Chất lượng phòng ở">Chất lượng phòng ở (Dơ bẩn, hư hỏng, thiếu tiện nghi)</option>
                  <option value="Thái độ chủ nhà">Thái độ chủ nhà (Không thân thiện, không hỗ trợ)</option>
                  <option value="Tranh chấp giá">Tranh chấp giá / Phụ thu ngoài hóa đơn</option>
                  <option value="Sự cố check-in">Sự cố check-in / check-out</option>
                </select>
              </div>

              <div className="form-group-review">
                <label>2. Mức độ ảnh hưởng</label>
                <div className="severity-options">
                  <label className="severity-opt">
                    <input type="radio" name="sev" value="low" checked={cmpSeverity === 'low'} onChange={() => setCmpSeverity('low')} />
                    <span className="sev-tag low">Nhẹ</span>
                  </label>
                  <label className="severity-opt">
                    <input type="radio" name="sev" value="medium" checked={cmpSeverity === 'medium'} onChange={() => setCmpSeverity('medium')} />
                    <span className="sev-tag medium">Trung bình</span>
                  </label>
                  <label className="severity-opt">
                    <input type="radio" name="sev" value="high" checked={cmpSeverity === 'high'} onChange={() => setCmpSeverity('high')} />
                    <span className="sev-tag high">Nghiêm trọng</span>
                  </label>
                </div>
              </div>

              <div className="form-group-review">
                <label>3. Mô tả chi tiết sự việc</label>
                <textarea className="form-textarea-review" rows="4" value={cmpContent}
                  onChange={(e) => setCmpContent(e.target.value)}
                  placeholder="Mô tả rõ ràng vấn đề gặp phải..." required />
              </div>

              <div className="form-group-review">
                <label>4. SĐT / Email nhận phản hồi</label>
                <input type="text" className="form-input-review" value={cmpContact}
                  onChange={(e) => setCmpContact(e.target.value)} placeholder="Ví dụ: 0901234567" required />
              </div>

              <button type="submit" className="btn-submit-complaint">
                <i className="bi bi-send-check-fill" /> Gửi khiếu nại chính thức
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Toast Notice */}
      <div className={`bk-toast ${toast.show ? 'show' : ''}`}>
        <i className="bi bi-check-circle-fill" />
        <span>{toast.msg}</span>
      </div>
    </div>
  );
}
