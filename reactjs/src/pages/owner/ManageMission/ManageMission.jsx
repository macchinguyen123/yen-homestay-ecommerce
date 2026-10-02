import { useState, useMemo } from 'react';
import './ManageMission.css';
import {
  INITIAL_METRICS,
  INITIAL_SUBMISSIONS,
  INITIAL_MISSIONS,
  INITIAL_TOP_GUESTS,
  INITIAL_REWARD_STOCK
} from './manageMissionData';

export default function ManageMission() {
  // ── States ───────────────────────────────────────────────────────────
  const [submissions, setSubmissions] = useState(INITIAL_SUBMISSIONS);
  const [missions, setMissions] = useState(INITIAL_MISSIONS);
  const [topGuests] = useState(INITIAL_TOP_GUESTS);
  const [rewardStock, setRewardStock] = useState(INITIAL_REWARD_STOCK);
  const [voucherCount, setVoucherCount] = useState(INITIAL_METRICS.rewardedVouchers);

  // Filter state for submissions
  const [filterType, setFilterType] = useState('all');
  const [filterKeyword, setFilterKeyword] = useState('');

  // Modals: 'mission' | 'rewardStock' | 'detail' | 'approve' | 'reject' | 'retake' | 'filter' | 'stats' | 'gift' | null
  const [activeModal, setActiveModal] = useState(null);

  // Target item for modals
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [editingMission, setEditingMission] = useState(null);

  // Forms State
  const [missionForm, setMissionForm] = useState({
    title: '',
    desc: '',
    icon: 'wb_sunny',
    status: 'active',
    rewardType: 'voucher-percent',
    rewardValue: '10',
    rewardExtra: '',
    from: '',
    to: '',
    needPhoto: true,
    autoApprove: false
  });

  const [approveForm, setApproveForm] = useState({
    reward: '',
    note: '',
    notify: true,
    featurePhoto: false
  });

  const [rejectForm, setRejectForm] = useState({
    reason: 'Ảnh không đúng nhiệm vụ',
    note: ''
  });

  const [retakeForm, setRetakeForm] = useState({
    reason: 'Ảnh bị mờ, thiếu sáng',
    note: '',
    deadline: ''
  });

  const [newStockItem, setNewStockItem] = useState({
    name: '',
    type: 'Voucher',
    qty: 50
  });

  const [giftForm, setGiftForm] = useState({
    selectedGuests: INITIAL_TOP_GUESTS.map(g => g.name),
    giftItem: 'Voucher giảm 20% lần lưu trú sau',
    message: 'Cảm ơn bạn đã đồng hành cùng Nhà Sàn Mộc trong tháng 09. Mong sớm được đón bạn quay lại!'
  });

  // Toast notification
  const [toast, setToast] = useState({ message: '', type: 'success', show: false });

  const showToast = (message, type = 'success') => {
    setToast({ message, type, show: true });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 2800);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  // ── Metrics Calculation ──────────────────────────────────────────────
  const activeMissionsCount = useMemo(() => {
    return missions.filter(m => m.status === 'active').length;
  }, [missions]);

  const pendingSubmissionsCount = useMemo(() => {
    return submissions.filter(s => s.status === 'pending').length;
  }, [submissions]);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter(s => {
      const matchType = filterType === 'all' || s.taskType === filterType;
      const matchKeyword = !filterKeyword || s.guest.toLowerCase().includes(filterKeyword.toLowerCase());
      return matchType && matchKeyword;
    });
  }, [submissions, filterType, filterKeyword]);

  // ── Handlers ─────────────────────────────────────────────────────────

  // Open Mission Modal (Create or Edit)
  const openCreateMissionModal = () => {
    setEditingMission(null);
    setMissionForm({
      title: '',
      desc: '',
      icon: 'wb_sunny',
      status: 'active',
      rewardType: 'voucher-percent',
      rewardValue: '10',
      rewardExtra: '',
      from: new Date().toISOString().split('T')[0],
      to: '',
      needPhoto: true,
      autoApprove: false
    });
    setActiveModal('mission');
  };

  const openEditMissionModal = (m) => {
    setEditingMission(m);
    setMissionForm({
      title: m.title,
      desc: m.desc,
      icon: m.icon,
      status: m.status,
      rewardType: m.rewardType,
      rewardValue: m.rewardValue,
      rewardExtra: m.rewardExtra,
      from: '',
      to: '',
      needPhoto: true,
      autoApprove: false
    });
    setActiveModal('mission');
  };

  const handleSaveMission = (e) => {
    e.preventDefault();
    if (!missionForm.title.trim()) return;

    if (editingMission) {
      setMissions(prev =>
        prev.map(m => m.id === editingMission.id ? { ...m, ...missionForm } : m)
      );
      showToast(`Đã cập nhật nhiệm vụ "${missionForm.title}".`);
    } else {
      const newMission = {
        id: 'M' + Date.now(),
        ...missionForm,
        given: 0
      };
      setMissions(prev => [...prev, newMission]);
      showToast(`Đã tạo nhiệm vụ "${missionForm.title}".`);
    }
    closeModal();
  };

  const handleToggleMissionStatus = (id) => {
    setMissions(prev =>
      prev.map(m => {
        if (m.id !== id) return m;
        const newStatus = m.status === 'active' ? 'paused' : 'active';
        showToast(newStatus === 'active' ? 'Đã kích hoạt nhiệm vụ.' : 'Đã tạm dừng nhiệm vụ.');
        return { ...m, status: newStatus };
      })
    );
  };

  // Submissions Actions
  const openDetailModal = (sub) => {
    setSelectedSubmission(sub);
    setActiveModal('detail');
  };

  const openApproveModal = (sub) => {
    setSelectedSubmission(sub);
    setApproveForm({
      reward: sub.reward,
      note: 'Cảm ơn bạn đã chia sẻ khoảnh khắc đẹp tại Nhà Sàn Mộc!',
      notify: true,
      featurePhoto: false
    });
    setActiveModal('approve');
  };

  const handleApproveSubmit = (e) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    setSubmissions(prev =>
      prev.map(s => s.id === selectedSubmission.id ? { ...s, status: 'approved' } : s)
    );
    setVoucherCount(prev => prev + 1);
    showToast(`Đã duyệt và trao thưởng cho ${selectedSubmission.guest}.`);
    closeModal();
  };

  const openRejectModal = (sub) => {
    setSelectedSubmission(sub);
    setRejectForm({
      reason: 'Ảnh không đúng nhiệm vụ',
      note: ''
    });
    setActiveModal('reject');
  };

  const handleRejectSubmit = (e) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    setSubmissions(prev =>
      prev.map(s => s.id === selectedSubmission.id ? { ...s, status: 'rejected' } : s)
    );
    showToast(`Đã từ chối bài nộp của ${selectedSubmission.guest}.`);
    closeModal();
  };

  const openRetakeModal = (sub) => {
    setSelectedSubmission(sub);
    const d = new Date();
    d.setDate(d.getDate() + 3);
    setRetakeForm({
      reason: 'Ảnh bị mờ, thiếu sáng',
      note: 'Bạn vui lòng chụp lại góc ban công lúc sáng sớm đủ ánh sáng tự nhiên nhé!',
      deadline: d.toISOString().split('T')[0]
    });
    setActiveModal('retake');
  };

  const handleRetakeSubmit = (e) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    setSubmissions(prev =>
      prev.map(s => s.id === selectedSubmission.id ? { ...s, status: 'retake' } : s)
    );
    showToast(`Đã gửi yêu cầu chụp lại cho ${selectedSubmission.guest}.`);
    closeModal();
  };

  // Stock Management
  const handleAddStock = () => {
    if (!newStockItem.name.trim()) {
      showToast('Hãy nhập tên phần thưởng.', 'error');
      return;
    }
    setRewardStock(prev => [
      ...prev,
      {
        id: Date.now(),
        name: newStockItem.name.trim(),
        type: newStockItem.type,
        qty: Number(newStockItem.qty) || 0
      }
    ]);
    setNewStockItem({ name: '', type: 'Voucher', qty: 50 });
  };

  const handleRemoveStock = (id) => {
    setRewardStock(prev => prev.filter(item => item.id !== id));
  };

  const handleSaveStock = () => {
    showToast('Đã lưu kho phần thưởng thành công.');
    closeModal();
  };

  // Gift to top guests
  const handleSendGift = (e) => {
    e.preventDefault();
    if (giftForm.selectedGuests.length === 0) {
      showToast('Hãy chọn ít nhất một du khách nhận quà.', 'error');
      return;
    }
    showToast(`Đã gửi quà tri ân cho ${giftForm.selectedGuests.length} du khách.`);
    closeModal();
  };

  // Format Helper for Reward Label
  const formatRewardLabel = (mission) => {
    let text = '';
    if (mission.rewardType === 'voucher-percent') text = `Voucher giảm ${mission.rewardValue}%`;
    else if (mission.rewardType === 'voucher-amount') text = `Voucher ${Number(mission.rewardValue).toLocaleString('vi-VN')}₫`;
    else if (mission.rewardType === 'points') text = `${mission.rewardValue} điểm`;
    else if (mission.rewardType === 'gift') text = `Quà: ${mission.rewardValue}`;

    if (mission.rewardExtra) text += ` + ${mission.rewardExtra}`;
    return text;
  };

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div className="manage-mission-page">
      {/* Toast Notice */}
      {toast.show && (
        <div className="mm-toast-box">
          <div className={`mm-toast ${toast.type}`}>
            <span className="material-symbols-outlined text-[18px]">
              {toast.type === 'error' ? 'error' : 'check_circle'}
            </span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* ── 1. Hero Banner ── */}
      <div className="mm-hero-card">
        <div className="mm-hero-decor" />
        <div className="mm-hero-info">
          <span className="mm-homestay-tag">Nhà Sàn Mộc • Mai Châu</span>
          <h1 className="mm-hero-title">Quản lý nhiệm vụ &amp; Phần thưởng du khách</h1>
        </div>
        <div className="mm-hero-actions">
          <button type="button" className="mm-btn-ghost" onClick={() => setActiveModal('rewardStock')}>
            <span className="material-symbols-outlined text-[18px]" style={{ color: '#1b6d24' }}>
              featured_seasonal_and_gifts
            </span>
            <span>Cấu hình kho phần thưởng</span>
          </button>
          <button type="button" className="mm-btn-primary" onClick={openCreateMissionModal}>
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Tạo nhiệm vụ mới</span>
          </button>
        </div>
      </div>

      {/* ── 2. Metric Highlights ── */}
      <div className="mm-metrics-grid">
        <div className="mm-metric-card">
          <div className="mm-metric-icon-box green">
            <span className="material-symbols-outlined text-[24px]">task_alt</span>
          </div>
          <div className="mm-metric-info">
            <span className="mm-metric-lbl">Nhiệm vụ đang mở</span>
            <span className="mm-metric-val">{String(activeMissionsCount).padStart(2, '0')}</span>
          </div>
        </div>

        <div className="mm-metric-card">
          <div className="mm-metric-icon-box amber">
            <span className="material-symbols-outlined text-[24px]">pending_actions</span>
          </div>
          <div className="mm-metric-info">
            <span className="mm-metric-lbl">Chờ duyệt hôm nay</span>
            <span className="mm-metric-val">{String(pendingSubmissionsCount).padStart(2, '0')}</span>
          </div>
        </div>

        <div className="mm-metric-card">
          <div className="mm-metric-icon-box blue">
            <span className="material-symbols-outlined text-[24px]">groups</span>
          </div>
          <div className="mm-metric-info">
            <span className="mm-metric-lbl">Du khách tham gia</span>
            <span className="mm-metric-val">{INITIAL_METRICS.participantGuests}</span>
          </div>
        </div>

        <div className="mm-metric-card">
          <div className="mm-metric-icon-box purple">
            <span className="material-symbols-outlined text-[24px]">confirmation_number</span>
          </div>
          <div className="mm-metric-info">
            <span className="mm-metric-lbl">Voucher đã trao</span>
            <span className="mm-metric-val">{voucherCount}</span>
          </div>
        </div>
      </div>

      {/* ── 3. Split Layout Grid ── */}
      <div className="mm-split-grid">
        {/* LEFT COLUMN: Submissions Approval Queue */}
        <div className="mm-submissions-col">
          <div className="mm-col-header-bar">
            <div className="mm-col-title-wrap">
              <span className="material-symbols-outlined text-[22px]" style={{ color: '#1b6d24' }}>
                inbox
              </span>
              <h2>Danh sách chờ duyệt bài nộp</h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                className="mm-btn-icon"
                title="Lọc bài nộp"
                onClick={() => setActiveModal('filter')}
              >
                <span className="material-symbols-outlined text-[20px]">filter_list</span>
              </button>
              <button
                type="button"
                className="mm-btn-icon"
                title="Tải lại"
                onClick={() => showToast('Đã làm mới danh sách bài nộp.')}
              >
                <span className="material-symbols-outlined text-[20px]">refresh</span>
              </button>
            </div>
          </div>

          {filteredSubmissions.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#717974', background: '#fff', borderRadius: '12px' }}>
              Không có bài nộp nào phù hợp với bộ lọc hiện tại.
            </div>
          ) : (
            filteredSubmissions.map((sub) => {
              const isDone = sub.status !== 'pending';
              return (
                <div key={sub.id} className={`mm-submission-card ${isDone ? 'is-done' : ''}`}>
                  {/* Guest Info */}
                  <div className="mm-sub-header">
                    <div className="mm-sub-guest-wrap">
                      <img src={sub.avatar} alt={sub.guest} className="mm-sub-avatar" />
                      <div className="mm-sub-guest-info">
                        <div className="mm-sub-name-row">
                          <span className="mm-sub-guest-name">{sub.guest}</span>
                          <span className="mm-sub-room-badge">{sub.room}</span>
                        </div>
                        <span className="mm-sub-time">Nộp lúc {sub.time}</span>
                      </div>
                    </div>

                    <span className={`mm-sub-status-badge ${sub.status}`}>
                      {sub.status === 'pending' && 'Chờ xác nhận'}
                      {sub.status === 'approved' && 'Đã duyệt & Trao thưởng'}
                      {sub.status === 'rejected' && 'Đã từ chối'}
                      {sub.status === 'retake' && 'Chờ nộp lại'}
                    </span>
                  </div>

                  {/* Task Banner */}
                  <div className="mm-sub-task-banner">
                    <span className="material-symbols-outlined">
                      {sub.taskType === 'food' ? 'dinner_dining' : 'styler'}
                    </span>
                    <span>Nhiệm vụ: {sub.task}</span>
                  </div>

                  {/* Content Grid: Photo + Review */}
                  <div className="mm-sub-content-grid">
                    <div className="mm-sub-photo-box">
                      <img src={sub.image} alt={sub.task} />
                      <div className="mm-sub-photo-tag">
                        <span className="material-symbols-outlined text-[13px]">photo_camera</span>
                        <span>{sub.photos} ảnh đính kèm</span>
                      </div>
                    </div>

                    <div className="mm-sub-details-col">
                      <div>
                        <span className="mm-review-lbl">Cảm nhận từ khách hàng</span>
                        <p className="mm-review-quote">“{sub.review}”</p>
                      </div>

                      <div className="mm-sub-reward-box">
                        <div className="mm-reward-flex">
                          <span className="material-symbols-outlined">redeem</span>
                          <div>
                            <div style={{ fontSize: '11px', color: '#717974' }}>Phần thưởng dự kiến</div>
                            <div className="mm-reward-val">{sub.reward}</div>
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-[18px]" style={{ color: '#717974' }}>
                          verified
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mm-sub-actions">
                    <button
                      type="button"
                      className="mm-btn-sub-act"
                      onClick={() => openDetailModal(sub)}
                    >
                      <span className="material-symbols-outlined text-[15px]">visibility</span>
                      <span>Xem chi tiết</span>
                    </button>

                    {!isDone && (
                      <>
                        <button
                          type="button"
                          className="mm-btn-sub-act btn-danger"
                          onClick={() => openRejectModal(sub)}
                        >
                          <span className="material-symbols-outlined text-[15px]">close</span>
                          <span>Từ chối</span>
                        </button>
                        <button
                          type="button"
                          className="mm-btn-sub-act"
                          onClick={() => openRetakeModal(sub)}
                        >
                          <span className="material-symbols-outlined text-[15px]">replay</span>
                          <span>Yêu cầu chụp lại</span>
                        </button>
                        <button
                          type="button"
                          className="mm-btn-sub-act btn-approve"
                          onClick={() => openApproveModal(sub)}
                        >
                          <span className="material-symbols-outlined text-[16px]">check_circle</span>
                          <span>Phê duyệt &amp; Trao thưởng</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* RIGHT COLUMN: Active Missions & Top Guests */}
        <div className="mm-side-col">
          {/* Active Missions Card */}
          <div className="mm-missions-box">
            <div className="mm-missions-head">
              <div className="mm-missions-title-wrap">
                <div className="mm-icon-square">
                  <span className="material-symbols-outlined text-[20px]">checklist</span>
                </div>
                <h2>Nhiệm vụ đang kích hoạt</h2>
              </div>
              <span className="mm-missions-count">{activeMissionsCount} Nhiệm vụ chạy song song</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {missions.map((m) => {
                const isPaused = m.status === 'paused';
                return (
                  <div key={m.id} className={`mm-mission-card ${isPaused ? 'is-paused' : ''}`}>
                    <div className="mm-mission-top">
                      <div className="mm-mission-title-line">
                        <span className="material-symbols-outlined text-[18px]" style={{ color: '#1b6d24' }}>
                          {m.icon}
                        </span>
                        <span>{m.title}</span>
                      </div>
                      <span className={`mm-mission-badge ${isPaused ? 'paused' : 'active'}`}>
                        {isPaused ? 'Tạm dừng' : 'Đang kích hoạt'}
                      </span>
                    </div>

                    <p className="mm-mission-desc">{m.desc}</p>

                    <div className="mm-mission-reward-line">
                      <span className="mm-reward-text">
                        <span className="material-symbols-outlined text-[15px]">local_offer</span>
                        {formatRewardLabel(m)}
                      </span>
                      <span className="mm-given-count">Đã trao: {m.given} lượt</span>
                    </div>

                    <div className="mm-mission-footer-actions">
                      <button
                        type="button"
                        className="mm-btn-mini"
                        onClick={() => handleToggleMissionStatus(m.id)}
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {isPaused ? 'play_arrow' : 'pause'}
                        </span>
                        <span>{isPaused ? 'Kích hoạt' : 'Tạm dừng'}</span>
                      </button>
                      <button
                        type="button"
                        className="mm-btn-mini"
                        onClick={() => openEditMissionModal(m)}
                      >
                        <span className="material-symbols-outlined text-[14px]">edit</span>
                        <span>Chỉnh sửa</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Monthly Progress Widget */}
            <div className="mm-target-progress-widget">
              <div className="mm-circle-progress-wrap">
                <svg style={{ width: '40px', height: '40px', transform: 'rotate(-90deg)' }} viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#d3e4fe"
                    strokeWidth="3.5"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#1b6d24"
                    strokeDasharray="82, 100"
                    strokeLinecap="round"
                    strokeWidth="3.5"
                  />
                </svg>
                <div className="mm-progress-info">
                  <span className="mm-progress-title">82% Mục tiêu tương tác tháng</span>
                  <span className="mm-progress-sub">96/120 du khách đã nhận phần thưởng</span>
                </div>
              </div>
              <button
                type="button"
                className="mm-btn-link"
                onClick={() => setActiveModal('stats')}
              >
                Chi tiết
              </button>
            </div>
          </div>

          {/* Top Guests Section */}
          <div className="mm-top-guests-box">
            <div className="mm-top-guests-header">
              <div className="mm-top-title-wrap">
                <span className="material-symbols-outlined">military_tech</span>
                <h3>Top du khách tích cực nhất</h3>
              </div>
              <span style={{ fontSize: '11.5px', color: '#717974' }}>Tháng 09/2026</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {topGuests.map((g, idx) => (
                <div key={g.id} className="mm-guest-row">
                  <div className="mm-guest-profile">
                    <div className={`mm-rank-badge rank-${idx + 1}`}>{idx + 1}</div>
                    <img src={g.avatar} alt={g.name} className="mm-guest-avatar" />
                    <div className="mm-guest-meta">
                      <span className="mm-guest-name">{g.name}</span>
                      <span className="mm-guest-sub">{g.completed} nhiệm vụ đã hoàn thành</span>
                    </div>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#1b6d24' }}>
                    {g.points} điểm
                  </span>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="mm-btn-wide"
              onClick={() => setActiveModal('gift')}
            >
              Gửi quà tri ân tháng 09
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================================
          MODALS
         ===================================================================== */}

      {/* ── Modal 1: Tạo / Chỉnh sửa Nhiệm vụ ── */}
      {activeModal === 'mission' && (
        <div className="mm-modal-overlay" onClick={closeModal}>
          <div className="mm-modal-box modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="mm-modal-header">
              <div>
                <h3>{editingMission ? 'Chỉnh sửa nhiệm vụ' : 'Tạo nhiệm vụ mới'}</h3>
                <p>Thiết lập nhiệm vụ trải nghiệm và phần thưởng hấp dẫn cho du khách.</p>
              </div>
              <button type="button" className="mm-modal-close-btn" onClick={closeModal}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSaveMission}>
              <div className="mm-modal-body">
                <div className="mm-form-grid">
                  <div className="mm-form-group full-width">
                    <label className="mm-form-label">Tên nhiệm vụ *</label>
                    <input
                      type="text"
                      className="mm-form-input"
                      placeholder="Ví dụ: Check-in bình minh thung lũng Mai Châu"
                      value={missionForm.title}
                      onChange={(e) => setMissionForm({ ...missionForm, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mm-form-group full-width">
                    <label className="mm-form-label">Mô tả / Yêu cầu thực hiện *</label>
                    <textarea
                      className="mm-form-textarea"
                      rows="3"
                      placeholder="Mô tả cách du khách hoàn thành nhiệm vụ, hashtag cần gắn..."
                      value={missionForm.desc}
                      onChange={(e) => setMissionForm({ ...missionForm, desc: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mm-form-group">
                    <label className="mm-form-label">Biểu tượng</label>
                    <select
                      className="mm-form-select"
                      value={missionForm.icon}
                      onChange={(e) => setMissionForm({ ...missionForm, icon: e.target.value })}
                    >
                      <option value="wb_sunny">Bình minh / Check-in</option>
                      <option value="photo_camera">Chụp ảnh</option>
                      <option value="outdoor_grill">Ẩm thực / Nấu ăn</option>
                      <option value="styler">Trang phục</option>
                      <option value="star">Đánh giá 5 sao</option>
                      <option value="hiking">Trải nghiệm ngoài trời</option>
                    </select>
                  </div>

                  <div className="mm-form-group">
                    <label className="mm-form-label">Trạng thái</label>
                    <select
                      className="mm-form-select"
                      value={missionForm.status}
                      onChange={(e) => setMissionForm({ ...missionForm, status: e.target.value })}
                    >
                      <option value="active">Đang kích hoạt</option>
                      <option value="paused">Tạm dừng</option>
                    </select>
                  </div>

                  <div className="mm-form-group">
                    <label className="mm-form-label">Loại phần thưởng</label>
                    <select
                      className="mm-form-select"
                      value={missionForm.rewardType}
                      onChange={(e) => setMissionForm({ ...missionForm, rewardType: e.target.value })}
                    >
                      <option value="voucher-percent">Voucher giảm theo %</option>
                      <option value="voucher-amount">Voucher trừ thẳng (₫)</option>
                      <option value="gift">Quà tặng hiện vật</option>
                      <option value="points">Cộng điểm tích lũy</option>
                    </select>
                  </div>

                  <div className="mm-form-group">
                    <label className="mm-form-label">
                      {missionForm.rewardType === 'voucher-percent' && 'Giá trị (%)'}
                      {missionForm.rewardType === 'voucher-amount' && 'Giá trị (₫)'}
                      {missionForm.rewardType === 'points' && 'Số điểm'}
                      {missionForm.rewardType === 'gift' && 'Tên quà tặng'} *
                    </label>
                    <input
                      type="text"
                      className="mm-form-input"
                      value={missionForm.rewardValue}
                      onChange={(e) => setMissionForm({ ...missionForm, rewardValue: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mm-form-group full-width">
                    <label className="mm-form-label">Quà kèm theo (tùy chọn)</label>
                    <input
                      type="text"
                      className="mm-form-input"
                      placeholder="Ví dụ: 1 túi trà gạo lứt Mộc Châu"
                      value={missionForm.rewardExtra}
                      onChange={(e) => setMissionForm({ ...missionForm, rewardExtra: e.target.value })}
                    />
                  </div>

                  <div className="mm-form-group full-width">
                    <label className="mm-checkbox-row">
                      <input
                        type="checkbox"
                        checked={missionForm.needPhoto}
                        onChange={(e) => setMissionForm({ ...missionForm, needPhoto: e.target.checked })}
                      />
                      <span>Yêu cầu du khách nộp ảnh minh chứng</span>
                    </label>
                  </div>

                  <div className="mm-form-group full-width">
                    <label className="mm-checkbox-row">
                      <input
                        type="checkbox"
                        checked={missionForm.autoApprove}
                        onChange={(e) => setMissionForm({ ...missionForm, autoApprove: e.target.checked })}
                      />
                      <span>Tự động duyệt (không cần chủ homestay xác nhận thủ công)</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="mm-modal-footer">
                <button type="button" className="mm-btn-ghost" onClick={closeModal}>Hủy</button>
                <button type="submit" className="mm-btn-primary">
                  <span className="material-symbols-outlined text-[17px]">save</span>
                  Lưu nhiệm vụ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal 2: Cấu hình Kho phần thưởng ── */}
      {activeModal === 'rewardStock' && (
        <div className="mm-modal-overlay" onClick={closeModal}>
          <div className="mm-modal-box modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="mm-modal-header">
              <div>
                <h3>Kho phần thưởng du khách</h3>
                <p>Quản lý voucher, quà tặng và số lượng còn lại để gán cho nhiệm vụ.</p>
              </div>
              <button type="button" className="mm-modal-close-btn" onClick={closeModal}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="mm-modal-body">
              <div>
                {rewardStock.map((item) => (
                  <div key={item.id} className="mm-stock-item">
                    <div className="mm-stock-name">
                      <span>{item.name}</span>
                      <small>{item.type}</small>
                    </div>
                    <input
                      type="number"
                      min="0"
                      className="mm-form-input"
                      value={item.qty}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        setRewardStock(prev =>
                          prev.map(i => i.id === item.id ? { ...i, qty: val } : i)
                        );
                      }}
                    />
                    <button
                      type="button"
                      className="mm-btn-icon"
                      style={{ color: '#ba1a1a' }}
                      title="Xóa"
                      onClick={() => handleRemoveStock(item.id)}
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                ))}

                <div className="mm-stock-add-row">
                  <input
                    type="text"
                    className="mm-form-input"
                    placeholder="Tên phần thưởng (Ví dụ: Túi trà hoa cúc)"
                    value={newStockItem.name}
                    onChange={(e) => setNewStockItem({ ...newStockItem, name: e.target.value })}
                  />
                  <select
                    className="mm-form-select"
                    value={newStockItem.type}
                    onChange={(e) => setNewStockItem({ ...newStockItem, type: e.target.value })}
                  >
                    <option value="Voucher">Voucher</option>
                    <option value="Quà tặng">Quà tặng</option>
                  </select>
                  <input
                    type="number"
                    min="1"
                    className="mm-form-input"
                    placeholder="SL"
                    value={newStockItem.qty}
                    onChange={(e) => setNewStockItem({ ...newStockItem, qty: e.target.value })}
                  />
                  <button type="button" className="mm-btn-ghost" onClick={handleAddStock}>
                    + Thêm
                  </button>
                </div>
              </div>
            </div>
            <div className="mm-modal-footer">
              <button type="button" className="mm-btn-ghost" onClick={closeModal}>Đóng</button>
              <button type="button" className="mm-btn-primary" onClick={handleSaveStock}>
                <span className="material-symbols-outlined text-[17px]">save</span>
                Lưu kho phần thưởng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal 3: Chi tiết bài nộp ── */}
      {activeModal === 'detail' && selectedSubmission && (
        <div className="mm-modal-overlay" onClick={closeModal}>
          <div className="mm-modal-box modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="mm-modal-header">
              <div>
                <h3>Bài nộp • {selectedSubmission.guest}</h3>
                <p>Mã bài nộp: {selectedSubmission.id}</p>
              </div>
              <button type="button" className="mm-modal-close-btn" onClick={closeModal}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="mm-modal-body">
              <div style={{ position: 'relative', height: '240px', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
                <img src={selectedSubmission.image} alt={selectedSubmission.guest} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <span style={{ position: 'absolute', bottom: '10px', left: '10px', padding: '3px 10px', borderRadius: '6px', background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '12px' }}>
                  {selectedSubmission.photos} ảnh đính kèm
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '14px', background: '#eff4ff', padding: '12px', borderRadius: '8px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#717974', textTransform: 'uppercase' }}>Du khách</span>
                  <div style={{ fontWeight: 700, fontSize: '14px' }}>{selectedSubmission.guest}</div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#717974', textTransform: 'uppercase' }}>Phòng</span>
                  <div style={{ fontWeight: 700, fontSize: '14px' }}>{selectedSubmission.room}</div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#717974', textTransform: 'uppercase' }}>Thời gian</span>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>{selectedSubmission.time}</div>
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#717974', textTransform: 'uppercase' }}>Nhiệm vụ</span>
                <p style={{ margin: '4px 0 0', fontWeight: 600 }}>{selectedSubmission.task}</p>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#717974', textTransform: 'uppercase' }}>Cảm nhận của khách</span>
                <p style={{ margin: '4px 0 0', fontStyle: 'italic', background: '#fafbfc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  “{selectedSubmission.review}”
                </p>
              </div>

              <div>
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#717974', textTransform: 'uppercase' }}>Phần thưởng dự kiến</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1b6d24', fontWeight: 700, marginTop: '4px' }}>
                  <span className="material-symbols-outlined">redeem</span>
                  <span>{selectedSubmission.reward}</span>
                </div>
              </div>
            </div>
            <div className="mm-modal-footer">
              <button type="button" className="mm-btn-ghost" onClick={closeModal}>Đóng</button>
              {selectedSubmission.status === 'pending' && (
                <>
                  <button
                    type="button"
                    className="mm-btn-sub-act btn-danger"
                    onClick={() => {
                      closeModal();
                      setTimeout(() => openRejectModal(selectedSubmission), 150);
                    }}
                  >
                    Từ chối
                  </button>
                  <button
                    type="button"
                    className="mm-btn-primary"
                    onClick={() => {
                      closeModal();
                      setTimeout(() => openApproveModal(selectedSubmission), 150);
                    }}
                  >
                    Phê duyệt &amp; Trao thưởng
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal 4: Phê duyệt & Trao thưởng ── */}
      {activeModal === 'approve' && selectedSubmission && (
        <div className="mm-modal-overlay" onClick={closeModal}>
          <div className="mm-modal-box modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="mm-modal-header">
              <div>
                <h3>Phê duyệt &amp; Trao thưởng</h3>
                <p>Xác nhận bài nộp của {selectedSubmission.guest} hợp lệ và gửi quà.</p>
              </div>
              <button type="button" className="mm-modal-close-btn" onClick={closeModal}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleApproveSubmit}>
              <div className="mm-modal-body">
                <div style={{ background: '#eff4ff', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-symbols-outlined text-[18px]">person</span>
                  <span><strong>{selectedSubmission.guest}</strong> — {selectedSubmission.task}</span>
                </div>

                <div className="mm-form-group full-width" style={{ marginBottom: '12px' }}>
                  <label className="mm-form-label">Phần thưởng trao</label>
                  <input
                    type="text"
                    className="mm-form-input"
                    value={approveForm.reward}
                    onChange={(e) => setApproveForm({ ...approveForm, reward: e.target.value })}
                    required
                  />
                </div>

                <div className="mm-form-group full-width" style={{ marginBottom: '12px' }}>
                  <label className="mm-form-label">Lời nhắn gửi du khách</label>
                  <textarea
                    className="mm-form-textarea"
                    rows="3"
                    value={approveForm.note}
                    onChange={(e) => setApproveForm({ ...approveForm, note: e.target.value })}
                  />
                </div>

                <div className="mm-form-group full-width" style={{ gap: '8px' }}>
                  <label className="mm-checkbox-row">
                    <input
                      type="checkbox"
                      checked={approveForm.notify}
                      onChange={(e) => setApproveForm({ ...approveForm, notify: e.target.checked })}
                    />
                    <span>Gửi thông báo mã voucher ngay cho du khách</span>
                  </label>
                  <label className="mm-checkbox-row">
                    <input
                      type="checkbox"
                      checked={approveForm.featurePhoto}
                      onChange={(e) => setApproveForm({ ...approveForm, featurePhoto: e.target.checked })}
                    />
                    <span>Cho phép homestay sử dụng ảnh này để quảng bá truyền thông</span>
                  </label>
                </div>
              </div>
              <div className="mm-modal-footer">
                <button type="button" className="mm-btn-ghost" onClick={closeModal}>Hủy</button>
                <button type="submit" className="mm-btn-primary">
                  <span className="material-symbols-outlined text-[17px]">check_circle</span>
                  Xác nhận duyệt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal 5: Từ chối bài nộp ── */}
      {activeModal === 'reject' && selectedSubmission && (
        <div className="mm-modal-overlay" onClick={closeModal}>
          <div className="mm-modal-box modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="mm-modal-header">
              <div>
                <h3>Từ chối bài nộp</h3>
                <p>Du khách sẽ nhận được thông báo kèm lý do từ chối cụ thể.</p>
              </div>
              <button type="button" className="mm-modal-close-btn" onClick={closeModal}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleRejectSubmit}>
              <div className="mm-modal-body">
                <div style={{ background: '#ffdad6', color: '#93000a', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-symbols-outlined text-[18px]">warning</span>
                  <span>Bài nộp bị từ chối sẽ không được trao thưởng.</span>
                </div>

                <div className="mm-form-group full-width" style={{ marginBottom: '12px' }}>
                  <label className="mm-form-label">Lý do từ chối</label>
                  <select
                    className="mm-form-select"
                    value={rejectForm.reason}
                    onChange={(e) => setRejectForm({ ...rejectForm, reason: e.target.value })}
                  >
                    <option value="Ảnh không đúng nhiệm vụ">Ảnh không đúng nhiệm vụ</option>
                    <option value="Ảnh mờ / không rõ nội dung">Ảnh mờ / không rõ nội dung</option>
                    <option value="Nội dung không phù hợp">Nội dung không phù hợp</option>
                    <option value="Nghi ngờ gian lận">Nghi ngờ gian lận</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                <div className="mm-form-group full-width">
                  <label className="mm-form-label">Ghi chú chi tiết cho khách</label>
                  <textarea
                    className="mm-form-textarea"
                    rows="3"
                    placeholder="Giải thích thêm cho du khách..."
                    value={rejectForm.note}
                    onChange={(e) => setRejectForm({ ...rejectForm, note: e.target.value })}
                  />
                </div>
              </div>
              <div className="mm-modal-footer">
                <button type="button" className="mm-btn-ghost" onClick={closeModal}>Hủy</button>
                <button type="submit" className="mm-btn-primary" style={{ backgroundColor: '#ba1a1a' }}>
                  <span className="material-symbols-outlined text-[17px]">close</span>
                  Xác nhận từ chối
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal 6: Yêu cầu chụp lại ── */}
      {activeModal === 'retake' && selectedSubmission && (
        <div className="mm-modal-overlay" onClick={closeModal}>
          <div className="mm-modal-box modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="mm-modal-header">
              <div>
                <h3>Yêu cầu chụp lại ảnh</h3>
                <p>Gửi gợi ý để du khách bổ sung ảnh phù hợp hơn.</p>
              </div>
              <button type="button" className="mm-modal-close-btn" onClick={closeModal}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleRetakeSubmit}>
              <div className="mm-modal-body">
                <div className="mm-form-group full-width" style={{ marginBottom: '12px' }}>
                  <label className="mm-form-label">Vấn đề cần chỉnh sửa</label>
                  <select
                    className="mm-form-select"
                    value={retakeForm.reason}
                    onChange={(e) => setRetakeForm({ ...retakeForm, reason: e.target.value })}
                  >
                    <option value="Ảnh bị mờ, thiếu sáng">Ảnh bị mờ, thiếu sáng</option>
                    <option value="Thiếu hashtag / thẻ định vị">Thiếu hashtag / thẻ định vị</option>
                    <option value="Chưa thấy rõ trang phục / món ăn">Chưa thấy rõ trang phục / món ăn</option>
                    <option value="Cần thêm ảnh">Cần thêm góc ảnh khác</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                <div className="mm-form-group full-width" style={{ marginBottom: '12px' }}>
                  <label className="mm-form-label">Lời nhắn hướng dẫn</label>
                  <textarea
                    className="mm-form-textarea"
                    rows="3"
                    value={retakeForm.note}
                    onChange={(e) => setRetakeForm({ ...retakeForm, note: e.target.value })}
                  />
                </div>

                <div className="mm-form-group full-width">
                  <label className="mm-form-label">Hạn nộp lại</label>
                  <input
                    type="date"
                    className="mm-form-input"
                    value={retakeForm.deadline}
                    onChange={(e) => setRetakeForm({ ...retakeForm, deadline: e.target.value })}
                  />
                </div>
              </div>
              <div className="mm-modal-footer">
                <button type="button" className="mm-btn-ghost" onClick={closeModal}>Hủy</button>
                <button type="submit" className="mm-btn-primary">
                  <span className="material-symbols-outlined text-[17px]">send</span>
                  Gửi yêu cầu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal 7: Lọc bài nộp ── */}
      {activeModal === 'filter' && (
        <div className="mm-modal-overlay" onClick={closeModal}>
          <div className="mm-modal-box modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="mm-modal-header">
              <div>
                <h3>Lọc danh sách bài nộp</h3>
                <p>Lọc bài nộp theo loại nhiệm vụ hoặc tên du khách.</p>
              </div>
              <button type="button" className="mm-modal-close-btn" onClick={closeModal}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="mm-modal-body">
              <div className="mm-form-group full-width" style={{ marginBottom: '12px' }}>
                <label className="mm-form-label">Loại nhiệm vụ</label>
                <select
                  className="mm-form-select"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="all">Tất cả nhiệm vụ</option>
                  <option value="costume">Trang phục / Check-in</option>
                  <option value="food">Ẩm thực</option>
                </select>
              </div>

              <div className="mm-form-group full-width">
                <label className="mm-form-label">Tìm theo tên du khách</label>
                <input
                  type="text"
                  className="mm-form-input"
                  placeholder="Ví dụ: Hương, Hiếu..."
                  value={filterKeyword}
                  onChange={(e) => setFilterKeyword(e.target.value)}
                />
              </div>
            </div>
            <div className="mm-modal-footer">
              <button
                type="button"
                className="mm-btn-ghost"
                onClick={() => {
                  setFilterType('all');
                  setFilterKeyword('');
                  closeModal();
                }}
              >
                Đặt lại
              </button>
              <button type="button" className="mm-btn-primary" onClick={closeModal}>
                Áp dụng bộ lọc
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal 8: Thống kê chi tiết nhiệm vụ ── */}
      {activeModal === 'stats' && (
        <div className="mm-modal-overlay" onClick={closeModal}>
          <div className="mm-modal-box modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="mm-modal-header">
              <div>
                <h3>Mục tiêu tương tác tháng</h3>
                <p>Số lượt trao thưởng chi tiết theo từng nhiệm vụ.</p>
              </div>
              <button type="button" className="mm-modal-close-btn" onClick={closeModal}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="mm-modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {missions.map((m) => {
                  const maxGiven = Math.max(...missions.map(x => x.given), 1);
                  const percent = Math.round((m.given / maxGiven) * 100);
                  return (
                    <div key={m.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600 }}>
                        <span>{m.title}</span>
                        <span style={{ color: '#1b6d24' }}>{m.given} lượt</span>
                      </div>
                      <div style={{ height: '8px', background: '#eff4ff', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${percent}%`, height: '100%', background: '#1b6d24', borderRadius: '4px', transition: 'width 0.4s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mm-modal-footer">
              <button type="button" className="mm-btn-ghost" onClick={closeModal}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal 9: Gửi quà tri ân top du khách ── */}
      {activeModal === 'gift' && (
        <div className="mm-modal-overlay" onClick={closeModal}>
          <div className="mm-modal-box modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="mm-modal-header">
              <div>
                <h3>Gửi quà tri ân tháng 09</h3>
                <p>Chọn du khách tích cực và phần quà tri ân ý nghĩa.</p>
              </div>
              <button type="button" className="mm-modal-close-btn" onClick={closeModal}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSendGift}>
              <div className="mm-modal-body">
                <div className="mm-form-group full-width" style={{ marginBottom: '14px' }}>
                  <label className="mm-form-label">Người nhận quà</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {topGuests.map((g) => {
                      const checked = giftForm.selectedGuests.includes(g.name);
                      return (
                        <label
                          key={g.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            background: checked ? '#eff4ff' : '#fff',
                            border: '1px solid #c0c8c2',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '13px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const isChecked = e.target.checked;
                                setGiftForm(prev => ({
                                  ...prev,
                                  selectedGuests: isChecked
                                    ? [...prev.selectedGuests, g.name]
                                    : prev.selectedGuests.filter(n => n !== g.name)
                                }));
                              }}
                            />
                            <span>{g.name}</span>
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: 600, color: '#717974' }}>{g.points} điểm</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="mm-form-group full-width" style={{ marginBottom: '12px' }}>
                  <label className="mm-form-label">Phần quà trao</label>
                  <select
                    className="mm-form-select"
                    value={giftForm.giftItem}
                    onChange={(e) => setGiftForm({ ...giftForm, giftItem: e.target.value })}
                  >
                    <option value="Voucher giảm 20% lần lưu trú sau">Voucher giảm 20% lần lưu trú sau</option>
                    <option value="Đêm nghỉ miễn phí (1 đêm)">Đêm nghỉ miễn phí (1 đêm)</option>
                    <option value="Set quà nông sản Mai Châu">Set quà nông sản Mai Châu</option>
                    <option value="Khăn thổ cẩm handmade">Khăn thổ cẩm handmade</option>
                  </select>
                </div>

                <div className="mm-form-group full-width">
                  <label className="mm-form-label">Lời nhắn tri ân</label>
                  <textarea
                    className="mm-form-textarea"
                    rows="3"
                    value={giftForm.message}
                    onChange={(e) => setGiftForm({ ...giftForm, message: e.target.value })}
                  />
                </div>
              </div>
              <div className="mm-modal-footer">
                <button type="button" className="mm-btn-ghost" onClick={closeModal}>Hủy</button>
                <button type="submit" className="mm-btn-primary">
                  <span className="material-symbols-outlined text-[17px]">redeem</span>
                  Gửi quà ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
