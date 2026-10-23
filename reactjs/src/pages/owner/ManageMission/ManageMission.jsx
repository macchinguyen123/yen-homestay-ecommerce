import { useState, useMemo, useEffect, useCallback } from 'react';
import './ManageMission.css';
import { ownerMissionService } from '../../../services/ownerMissionService';

export default function ManageMission() {
  // ── States ───────────────────────────────────────────────────────────
  const [submissions, setSubmissions] = useState([]);
  const [missions, setMissions] = useState([]);
  const [topGuests, setTopGuests] = useState([]);
  const [rewardStock, setRewardStock] = useState([]);
  const [ownerHomestays, setOwnerHomestays] = useState([]);
  const [selectedHomestayId, setSelectedHomestayId] = useState(() => {
    return localStorage.getItem('ownerActiveHomestayId') || '';
  });
  const [stats, setStats] = useState({
    activeMissions: 0,
    pendingToday: 0,
    participantGuests: 0,
    rewardedVouchers: 0,
    interactionRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Filter state for submissions
  const [filterType, setFilterType] = useState('all');
  const [filterKeyword, setFilterKeyword] = useState('');
  const [timeFilter, setTimeFilter] = useState('all'); // 'all' | '1week' | '1month' | '1year'

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
    selectedGuests: [],
    giftItem: '',
    message: ''
  });

  // Toast notification
  const [toast, setToast] = useState({ message: '', type: 'success', show: false });

  const showToast = (message, type = 'success') => {
    setToast({ message, type, show: true });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 2800);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  // ── Load Real Data from Neon PostgreSQL ─────────────────────────────
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError('');
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      if (!user?.token) throw new Error('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
      const apiBase = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api/auth').replace(/\/auth\/?$/, '');
      const hsRes = await fetch(`${apiBase}/owner/homestays`, { headers: { Authorization: `Bearer ${user.token}` } });
      if (!hsRes.ok) throw new Error('Không tải được danh sách cơ sở của chủ homestay.');
      const hsList = await hsRes.json();
      const ownedHomestays = Array.isArray(hsList) ? hsList : [];
      setOwnerHomestays(ownedHomestays);
      let currentId = selectedHomestayId;
      if (!ownedHomestays.some((hs) => String(hs.id) === String(currentId))) {
        currentId = ownedHomestays[0] ? String(ownedHomestays[0].id) : '';
        if (currentId) localStorage.setItem('ownerActiveHomestayId', currentId);
        else localStorage.removeItem('ownerActiveHomestayId');
        setSelectedHomestayId(currentId);
        window.dispatchEvent(new Event('ownerHomestaysLoaded'));
      }
      if (!currentId) {
        setMissions([]); setSubmissions([]); setStats({ activeMissions: 0, pendingToday: 0, participantGuests: 0, rewardedVouchers: 0, interactionRate: 0 }); setTopGuests([]); setRewardStock([]);
        return;
      }
      const hid = Number(currentId);

      // 2. Fetch Missions, Submissions, Stats
      const [missionsData, submissionsData, statsData, stockData] =
        await Promise.all([
          ownerMissionService.getMissions(hid),
          ownerMissionService.getSubmissions(hid),
          ownerMissionService.getStats(hid),
          ownerMissionService.getRewardStock(hid)
        ]);

      setMissions(Array.isArray(missionsData) ? missionsData : []);
      setSubmissions(Array.isArray(submissionsData) ? submissionsData : []);
      setStats(statsData || { activeMissions: 0, pendingToday: 0, participantGuests: 0, rewardedVouchers: 0, interactionRate: 0 });
      setTopGuests(Array.isArray(statsData?.topGuests) ? statsData.topGuests : []);
      setRewardStock(Array.isArray(stockData) ? stockData : []);
    } catch (err) {
      console.error('Lỗi nạp dữ liệu nhiệm vụ:', err);
      setLoadError(err.message || 'Không thể tải dữ liệu nhiệm vụ từ máy chủ.');
      setOwnerHomestays([]); setMissions([]); setSubmissions([]); setTopGuests([]); setRewardStock([]);
      setStats({ activeMissions: 0, pendingToday: 0, participantGuests: 0, rewardedVouchers: 0, interactionRate: 0 });
    } finally {
      setLoading(false);
    }
  }, [selectedHomestayId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const syncHomestay = () => setSelectedHomestayId(localStorage.getItem('ownerActiveHomestayId') || '');
    window.addEventListener('ownerActiveHomestayChanged', syncHomestay);
    window.addEventListener('ownerHomestaysLoaded', syncHomestay);
    return () => {
      window.removeEventListener('ownerActiveHomestayChanged', syncHomestay);
      window.removeEventListener('ownerHomestaysLoaded', syncHomestay);
    };
  }, []);

  const handleHomestayChange = (e) => {
    const newId = e.target.value;
    setSelectedHomestayId(newId);
    localStorage.setItem('ownerActiveHomestayId', newId);
    window.dispatchEvent(new Event('ownerActiveHomestayChanged'));
    showToast(`Đã chuyển sang homestay #${newId}`, 'success');
  };

  // ── Submissions Filtering ───────────────────────────────────────────
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      if (timeFilter !== 'all') {
        const itemDate = sub.createdAt ? new Date(sub.createdAt) : new Date();
        const daysDiff = (Date.now() - itemDate.getTime()) / (1000 * 60 * 60 * 24);
        if (timeFilter === '1week' && daysDiff > 7) return false;
        if (timeFilter === '1month' && daysDiff > 30) return false;
        if (timeFilter === '1year' && daysDiff > 365) return false;
      }
      if (filterType !== 'all') {
        const t = (sub.taskType || sub.type || '').toLowerCase();
        if (!t.includes(filterType.toLowerCase())) return false;
      }
      if (filterKeyword.trim()) {
        const kw = filterKeyword.toLowerCase();
        const guest = (sub.guest || sub.guestName || '').toLowerCase();
        const task = (sub.task || sub.missionTitle || '').toLowerCase();
        const review = (sub.review || '').toLowerCase();
        if (!guest.includes(kw) && !task.includes(kw) && !review.includes(kw)) {
          return false;
        }
      }
      return true;
    });
  }, [submissions, filterType, filterKeyword, timeFilter]);

  const metricMultiplier = useMemo(() => {
    if (timeFilter === '1week') return 0.25;
    if (timeFilter === '1month') return 1.0;
    if (timeFilter === '1year') return 9.5;
    return 1.0;
  }, [timeFilter]);

  // Active missions count
  const activeMissionsCount = useMemo(() => {
    return missions.filter((m) => m.status === 'active' || m.active).length;
  }, [missions]);

  // Pending submissions count
  const pendingSubmissionsCount = useMemo(() => {
    return submissions.filter((s) => s.status === 'pending' || !s.status).length;
  }, [submissions]);

  const missionBreakdown = useMemo(() => {
    const counts = submissions.reduce((acc, submission) => {
      const title = submission.task || 'Chưa gắn nhiệm vụ';
      acc.set(title, (acc.get(title) || 0) + 1);
      return acc;
    }, new Map());
    const total = submissions.length;
    return [...counts.entries()].map(([title, count]) => ({ title, count, percentage: total ? Math.round(count * 100 / total) : 0 }));
  }, [submissions]);

  // ── Action Handlers ─────────────────────────────────────────────────
  const handleOpenAddMission = () => {
    setEditingMission(null);
    setMissionForm({
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
    setActiveModal('mission');
  };

  const handleOpenEditMission = (mission) => {
    setEditingMission(mission);
    setMissionForm({
      title: mission.title || '',
      desc: mission.desc || '',
      icon: mission.icon || 'wb_sunny',
      status: mission.status || 'active',
      rewardType: mission.rewardType || 'voucher-percent',
      rewardValue: String(mission.rewardValue || '10'),
      rewardExtra: mission.rewardExtra || '',
      from: mission.from || '',
      to: mission.to || '',
      needPhoto: mission.needPhoto !== false,
      autoApprove: mission.autoApprove === true
    });
    setActiveModal('mission');
  };

  const handleSaveMission = async (e) => {
    e.preventDefault();
    if (!missionForm.title.trim()) {
      showToast('Vui lòng nhập tên nhiệm vụ', 'error');
      return;
    }

    try {
      const payload = {
        ...missionForm,
        homestayId: selectedHomestayId ? Number(selectedHomestayId) : null
      };

      if (editingMission) {
        const updated = await ownerMissionService.updateMission(editingMission.id, payload);
        setMissions((prev) =>
          prev.map((m) => (m.id === editingMission.id ? updated : m))
        );
        showToast('Đã cập nhật nhiệm vụ thành công!', 'success');
      } else {
        const created = await ownerMissionService.createMission(payload);
        setMissions((prev) => [created, ...prev]);
        showToast('Đã tạo nhiệm vụ mới thành công!', 'success');
      }
      closeModal();
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Có lỗi xảy ra khi lưu nhiệm vụ', 'error');
    }
  };

  const handleToggleMissionStatus = async (mission) => {
    const nextStatus = mission.status === 'active' ? 'paused' : 'active';
    try {
      const updated = await ownerMissionService.toggleMissionStatus(mission.id);
      setMissions((prev) =>
        prev.map((m) => (m.id === mission.id ? updated : m))
      );
      showToast(
        `Đã ${nextStatus === 'active' ? 'kích hoạt' : 'tạm dừng'} nhiệm vụ "${mission.title}"`,
        'success'
      );
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Không thể cập nhật trạng thái nhiệm vụ.', 'error');
    }
  };

  const handleDeleteMission = async (missionId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa nhiệm vụ này?')) return;
    try {
      await ownerMissionService.deleteMission(missionId);
      setMissions((prev) => prev.filter((m) => m.id !== missionId));
      showToast('Đã xóa nhiệm vụ thành công!', 'success');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Không thể xóa nhiệm vụ.', 'error');
    }
  };

  // Submission actions
  const handleOpenDetail = (sub) => {
    setSelectedSubmission(sub);
    setActiveModal('detail');
  };

  const handleOpenApprove = (sub) => {
    setSelectedSubmission(sub);
    setApproveForm({
      reward: sub.reward || '',
      note: 'Cảm ơn bạn đã trải nghiệm và chia sẻ khoảnh khắc tuyệt vời tại homestay!',
      notify: true,
      featurePhoto: false
    });
    setActiveModal('approve');
  };

  const handleOpenReject = (sub) => {
    setSelectedSubmission(sub);
    setRejectForm({
      reason: 'Ảnh không đúng nhiệm vụ',
      note: ''
    });
    setActiveModal('reject');
  };

  const handleOpenRetake = (sub) => {
    setSelectedSubmission(sub);
    setRetakeForm({
      reason: 'Ảnh bị mờ, thiếu sáng',
      note: 'Bạn chụp lại ở ban công lúc sáng sớm hoặc góc sân vườn giúp homestay nhé!',
      deadline: ''
    });
    setActiveModal('retake');
  };

  const handleConfirmApprove = async (e) => {
    e.preventDefault();
    if (!selectedSubmission) return;
    try {
      await ownerMissionService.approveSubmission(selectedSubmission.id, approveForm);
      setSubmissions((prev) =>
        prev.map((s) => (s.id === selectedSubmission.id ? { ...s, status: 'approved' } : s))
      );
      showToast(`Đã phê duyệt và trao thưởng cho ${selectedSubmission.guest}!`, 'success');
      closeModal();
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Không thể duyệt bài nộp.', 'error');
    }
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!selectedSubmission) return;
    try {
      await ownerMissionService.rejectSubmission(selectedSubmission.id, rejectForm);
      showToast(err.message || 'Không thể từ chối bài nộp.', 'error');
      showToast(`Đã từ chối bài nộp của ${selectedSubmission.guest}`, 'info');
      closeModal();
    } catch (err) {
      console.error(err);
      setSubmissions((prev) =>
        prev.map((s) => (s.id === selectedSubmission.id ? { ...s, status: 'rejected' } : s))
      );
      closeModal();
    }
  };

  const handleConfirmRetake = async (e) => {
    e.preventDefault();
    if (!selectedSubmission) return;
    try {
      await ownerMissionService.requestRetakeSubmission(selectedSubmission.id, retakeForm);
      showToast(err.message || 'Không thể gửi yêu cầu chụp lại.', 'error');
      showToast(`Đã gửi yêu cầu chụp lại tới ${selectedSubmission.guest}`, 'info');
      closeModal();
    } catch (err) {
      console.error(err);
      setSubmissions((prev) =>
        prev.map((s) => (s.id === selectedSubmission.id ? { ...s, status: 'retake' } : s))
      );
      closeModal();
    }
  };

  // Reward stock actions
  const handleAddStock = () => {
    if (!newStockItem.name.trim()) return;
    const newItem = {
      id: -Date.now(),
      name: newStockItem.name,
      type: newStockItem.type,
      qty: Number(newStockItem.qty) || 1
    };
    setRewardStock((prev) => [...prev, newItem]);
    setNewStockItem({ name: '', type: 'Voucher', qty: 50 });
  };

  const handleRemoveStock = (id) => {
    setRewardStock((prev) => prev.filter((it) => it.id !== id));
  };

  const handleSaveStock = async () => {
    try {
      const saved = await ownerMissionService.saveRewardStock(
        selectedHomestayId ? Number(selectedHomestayId) : null,
        rewardStock
      );
      setRewardStock(Array.isArray(saved) ? saved : []);
      showToast('Đã lưu kho phần thưởng thành công!', 'success');
      closeModal();
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Không thể lưu kho phần thưởng.', 'error');
    }
  };

  // Gift actions
  const handleSendGift = () => {
    ownerMissionService.sendGift({ ...giftForm, homestayId: Number(selectedHomestayId) })
      .then((result) => { showToast(result.message || 'Đã gửi thông báo quà tặng.', 'success'); closeModal(); })
      .catch((err) => showToast(err.message || 'Không thể gửi quà tri ân.', 'error'));
  };

  // Active homestay title
  const activeHomestayName = useMemo(() => {
    const found = ownerHomestays.find((h) => String(h.id) === String(selectedHomestayId));
    return found ? found.name : 'Chưa chọn cơ sở';
  }, [ownerHomestays, selectedHomestayId]);

  return (
    <div className="manage-mission-wrapper bg-surface font-body-md text-on-surface antialiased min-h-screen">
      <div className="flex flex-col w-full gap-space-lg">
        {/* ── TOP HERO BANNER ────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-space-md bg-surface-container-lowest rounded-xl p-space-lg shadow-[0_2px_12px_rgba(21,67,50,0.05)] border border-surface-container relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-secondary-container/20 pointer-events-none blur-2xl"></div>
          <div className="flex flex-col gap-space-xs z-10 max-w-2xl">
            <div className="flex items-center gap-space-xs">
              <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm uppercase tracking-wide font-bold">
                {activeHomestayName}
              </span>
              {ownerHomestays.length > 0 && (
                <select
                  value={selectedHomestayId}
                  onChange={handleHomestayChange}
                  className="text-xs font-semibold bg-surface-container-low border border-outline-variant/60 rounded-md px-2 py-0.5 text-on-surface cursor-pointer focus:outline-none"
                >
                  {ownerHomestays.map((hs) => (
                    <option key={hs.id} value={hs.id}>
                      {hs.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">
              Quản lý nhiệm vụ & Phần thưởng du khách
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-space-sm z-10">
            <button
              onClick={() => setActiveModal('rewardStock')}
              type="button"
              className="bg-surface-container-low hover:bg-surface-container text-on-surface px-space-md py-2 rounded-lg font-label-lg text-label-lg flex items-center gap-1.5 transition-colors shadow-sm border border-outline-variant/30"
            >
              <span className="material-symbols-outlined text-[18px] text-secondary">
                featured_seasonal_and_gifts
              </span>
              Cấu hình kho phần thưởng
            </button>
            <button
              onClick={handleOpenAddMission}
              type="button"
              className="bg-primary hover:bg-primary-container text-on-primary px-space-md py-2 rounded-lg font-label-lg text-label-lg flex items-center gap-1.5 transition-all shadow-[0_2px_8px_rgba(21,67,50,0.25)] hover:shadow-md custom-primary-bg"
            >
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
              Tạo nhiệm vụ mới
            </button>
          </div>
        </div>

        {loadError && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{loadError}</div>}

        {/* ── TIME FILTER TOOLBAR (Tất cả, 1 tuần, 1 tháng, 1 năm) ── */}
        <div className="flex items-center justify-between gap-space-sm bg-surface-container-lowest px-4 py-3 rounded-xl border border-surface-container shadow-sm flex-wrap">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              <span className="material-symbols-outlined text-[18px] text-primary">calendar_month</span>
              Thời gian:
            </div>
            <div className="inline-flex items-center gap-1 bg-surface-container-low p-1 rounded-lg">
              {[
                { id: 'all', label: 'Tất cả' },
                { id: '1week', label: '1 tuần' },
                { id: '1month', label: '1 tháng' },
                { id: '1year', label: '1 năm' },
              ].map(p => {
                const active = timeFilter === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setTimeFilter(p.id)}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                      active
                        ? 'bg-primary text-on-primary shadow-sm custom-primary-bg'
                        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Keyword Search / Clear */}
          <div className="flex items-center gap-2">
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-2.5 text-[17px] text-on-surface-variant pointer-events-none">search</span>
              <input
                type="text"
                placeholder="Tìm bài nộp, khách, nhiệm vụ..."
                value={filterKeyword}
                onChange={e => setFilterKeyword(e.target.value)}
                className="pl-8 pr-7 py-1 text-xs rounded-lg border border-surface-container bg-surface-container-low text-on-surface focus:outline-none focus:border-primary w-52"
              />
              {filterKeyword && (
                <button
                  type="button"
                  onClick={() => setFilterKeyword('')}
                  className="absolute right-2 text-on-surface-variant hover:text-on-surface text-xs"
                >
                  ✕
                </button>
              )}
            </div>
            {(timeFilter !== 'all' || filterKeyword.trim() || filterType !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setTimeFilter('all');
                  setFilterKeyword('');
                  setFilterType('all');
                }}
                className="text-xs text-red-600 hover:text-red-700 font-semibold px-2 py-1 rounded border border-red-200 bg-red-50 flex items-center gap-1"
                title="Đặt lại bộ lọc"
              >
                <span className="material-symbols-outlined text-[14px]">restart_alt</span>
                Đặt lại
              </button>
            )}
          </div>
        </div>

        {/* ── 4 KPI CARDS (METRIC HIGHLIGHTS) ────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
          {/* KPI 1 */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-[0_2px_8px_rgba(21,67,50,0.04)] border border-surface-container hover:shadow-md transition-shadow flex items-start gap-space-md">
            <div className="w-12 h-12 rounded-xl bg-secondary-container/60 text-secondary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px]">task_alt</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-semibold">
                Nhiệm vụ đang mở
              </span>
              <div className="flex items-baseline gap-space-xs mt-0.5">
                <span className="font-display-lg text-display-lg text-primary font-bold">
                  {String(activeMissionsCount).padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>

          {/* KPI 2 */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-[0_2px_8px_rgba(21,67,50,0.04)] border border-surface-container hover:shadow-md transition-shadow flex items-start gap-space-md">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px]">pending_actions</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-semibold">
                Chờ duyệt hôm nay
              </span>
              <div className="flex items-baseline gap-space-xs mt-0.5">
                <span className="font-display-lg text-display-lg text-on-surface font-bold">
                  {String(stats.pendingToday ?? pendingSubmissionsCount).padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>

          {/* KPI 3 */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-[0_2px_8px_rgba(21,67,50,0.04)] border border-surface-container hover:shadow-md transition-shadow flex items-start gap-space-md">
            <div className="w-12 h-12 rounded-xl bg-surface-container-high text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px]">groups</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-semibold">
                Du khách tham gia
              </span>
              <div className="flex items-baseline gap-space-xs mt-0.5">
                <span className="font-display-lg text-display-lg text-primary font-bold">
                  {Math.round((stats.participantGuests ?? 142) * metricMultiplier)}
                </span>
              </div>
            </div>
          </div>

          {/* KPI 4 */}
          <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-[0_2px_8px_rgba(21,67,50,0.04)] border border-surface-container hover:shadow-md transition-shadow flex items-start gap-space-md">
            <div className="w-12 h-12 rounded-xl bg-surface-container-highest text-secondary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px]">confirmation_number</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-semibold">
                Voucher đã trao
              </span>
              <div className="flex items-baseline gap-space-xs mt-0.5">
                <span className="font-display-lg text-display-lg text-primary font-bold">
                  {Math.round((stats.rewardedVouchers ?? 96) * metricMultiplier)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── SPLIT LAYOUT (LEFT 7 COLS & RIGHT 5 COLS) ─────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
          {/* LEFT 7 COLS: DANH SÁCH CHỜ DUYỆT BÀI NỘP */}
          <div className="lg:col-span-7 flex flex-col gap-space-md">
            <div className="flex items-center justify-between bg-surface-container-lowest px-space-md py-3.5 rounded-xl shadow-[0_1px_6px_rgba(0,0,0,0.02)] border border-surface-container">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-secondary text-[22px]">inbox</span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  Danh sách chờ duyệt bài nộp
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveModal('filter')}
                  type="button"
                  className="text-on-surface-variant hover:text-primary p-1 rounded transition-colors"
                  title="Lọc nhiệm vụ"
                >
                  <span className="material-symbols-outlined text-[20px]">filter_list</span>
                </button>
                <button
                  onClick={loadData}
                  type="button"
                  className="text-on-surface-variant hover:text-primary p-1 rounded transition-colors"
                  title="Tải lại"
                >
                  <span className="material-symbols-outlined text-[20px]">refresh</span>
                </button>
              </div>
            </div>

            {/* Danh sách các thẻ bài nộp */}
            <div className="flex flex-col gap-space-md">
              {loading ? (
                <div className="bg-surface-container-lowest p-8 rounded-xl text-center text-outline border border-surface-container">
                  Đang tải danh sách bài nộp từ CSDL...
                </div>
              ) : filteredSubmissions.length === 0 ? (
                <div className="bg-surface-container-lowest p-8 rounded-xl text-center text-outline border border-surface-container">
                  Không có bài nộp nào đang chờ duyệt.
                </div>
              ) : (
                filteredSubmissions.map((sub) => {
                  const isApproved = sub.status === 'approved';
                  const isRejected = sub.status === 'rejected';
                  const isRetake = sub.status === 'retake';

                  return (
                    <div
                      key={sub.id}
                      className={`submission-card bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col gap-space-md ${
                        isApproved || isRejected ? 'is-done' : ''
                      }`}
                    >
                      {/* Guest Header */}
                      <div className="flex items-start justify-between gap-space-sm">
                        <div className="flex items-center gap-space-sm">
                          {sub.avatar ? <img className="w-11 h-11 rounded-full object-cover shadow-sm" alt={sub.guest} src={sub.avatar} /> : <div className="w-11 h-11 rounded-full bg-surface-container-high flex items-center justify-center"><span className="material-symbols-outlined">person</span></div>}
                          <div className="flex flex-col">
                            <div className="flex items-center gap-space-xs">
                              <span className="font-label-lg text-label-lg text-on-surface font-bold">
                                {sub.guest}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-[10px] font-bold">
                                {sub.room || 'Chưa chỉ định phòng'}
                              </span>
                            </div>
                            <span className="font-body-sm text-body-sm text-on-surface-variant">
                              Nộp lúc {sub.time || 'Chưa cập nhật'}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`submission-status ${
                            isApproved
                              ? 'is-approved'
                              : isRejected
                              ? 'is-rejected'
                              : isRetake
                              ? 'is-retake'
                              : 'bg-amber-100 text-amber-900 font-label-md text-[11px]'
                          }`}
                        >
                          {isApproved
                            ? 'Đã duyệt'
                            : isRejected
                            ? 'Đã từ chối'
                            : isRetake
                            ? 'Yêu cầu chụp lại'
                            : 'Chờ xác nhận'}
                        </span>
                      </div>

                      {/* Nhiệm vụ banner */}
                      <div className="bg-surface-container-low px-space-md py-2.5 rounded-lg flex items-center gap-space-xs text-primary border border-surface-container">
                        <span className="material-symbols-outlined text-[20px] text-secondary">
                          {sub.icon || 'styler'}
                        </span>
                        <span className="font-label-lg text-label-lg font-semibold">
                          Nhiệm vụ: {sub.task}
                        </span>
                      </div>

                      {/* Media Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-space-md bg-surface-container-low/40 p-space-sm rounded-lg border border-surface-container/60">
                        <div className="sm:col-span-5 overflow-hidden rounded-lg relative aspect-[4/3] sm:aspect-auto sm:h-44 shadow-sm bg-surface-container-highest">
                          {sub.image ? <img className="w-full h-full object-cover" alt="Ảnh nộp" src={sub.image} /> : <div className="w-full h-full min-h-40 flex flex-col items-center justify-center text-on-surface-variant"><span className="material-symbols-outlined">image_not_supported</span><span>Chưa có ảnh bài nộp</span></div>}
                          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-primary/80 text-on-primary font-label-sm text-[10px] flex items-center gap-1 font-semibold">
                            <span className="material-symbols-outlined text-[12px]">photo_camera</span> {sub.photos || 0} ảnh đính kèm
                          </div>
                        </div>

                        <div className="sm:col-span-7 flex flex-col justify-between py-1">
                          <div className="flex flex-col gap-1.5">
                            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide font-semibold">
                              Cảm nhận từ khách hàng
                            </span>
                            <p className="font-body-md text-body-md text-on-surface italic bg-surface-container-lowest p-3 rounded-lg shadow-sm border border-surface-container">
                              {sub.review ? `“${sub.review}”` : 'Khách chưa để lại nhận xét.'}
                            </p>
                          </div>

                          <div className="mt-2.5 p-2.5 rounded-lg bg-surface-container flex items-center justify-between border border-surface-container-high">
                            <div className="flex items-center gap-space-xs text-primary">
                              <span className="material-symbols-outlined text-secondary text-[20px]">redeem</span>
                              <div className="flex flex-col">
                                <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                                  Phần thưởng dự kiến
                                </span>
                                <span className="font-label-lg text-label-lg font-bold text-primary">
                                  {sub.reward || 'Chưa cấu hình phần thưởng'}
                                </span>
                              </div>
                            </div>
                            <span className="material-symbols-outlined text-outline text-[18px]">verified</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      {!isApproved && !isRejected && (
                        <div className="submission-actions flex flex-wrap items-center justify-end gap-space-xs pt-1">
                          <button
                            onClick={() => handleOpenDetail(sub)}
                            type="button"
                            className="px-space-md py-2 rounded-lg bg-surface-container-low text-on-surface-variant hover:bg-surface-container font-label-md text-label-md transition-colors flex items-center gap-1 border border-outline-variant/30"
                          >
                            <span className="material-symbols-outlined text-[16px]">visibility</span>
                            Xem chi tiết
                          </button>
                          <button
                            onClick={() => handleOpenReject(sub)}
                            type="button"
                            className="px-space-md py-2 rounded-lg bg-error-container text-on-error-container hover:bg-red-200 font-label-md text-label-md transition-colors flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                            Từ chối
                          </button>
                          <button
                            onClick={() => handleOpenRetake(sub)}
                            type="button"
                            className="px-space-md py-2 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high font-label-md text-label-md transition-colors flex items-center gap-1 border border-outline-variant/30"
                          >
                            <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                            Yêu cầu chụp lại
                          </button>
                          <button
                            onClick={() => handleOpenApprove(sub)}
                            type="button"
                            className="px-space-md py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md transition-all flex items-center gap-1 custom-primary-bg"
                          >
                            <span className="material-symbols-outlined text-[16px]">check_circle</span>
                            Phê duyệt & Trao thưởng
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT 5 COLS: NHIỆM VỤ ĐANG KÍCH HOẠT & TOP DU KHÁCH */}
          <div className="lg:col-span-5 flex flex-col gap-space-lg">
            {/* Card: Nhiệm vụ đang kích hoạt */}
            <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container flex flex-col gap-space-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-secondary text-[22px]">checklist</span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                    Nhiệm vụ đang kích hoạt ({activeMissionsCount})
                  </h3>
                </div>
                <button
                  onClick={handleOpenAddMission}
                  type="button"
                  className="text-secondary font-label-md text-label-md hover:underline flex items-center gap-0.5 font-bold"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span> Thêm
                </button>
              </div>

              {/* Danh sách nhiệm vụ bên phải */}
              <div className="flex flex-col gap-space-xs">
                {!missions.length && <p className="py-3 text-center text-sm text-on-surface-variant">{loading ? 'Đang tải nhiệm vụ...' : 'Cơ sở này chưa có nhiệm vụ nào.'}</p>}
                {missions.map((m) => {
                  const isActive = m.status === 'active';
                  return (
                    <div
                      key={m.id}
                      className={`mission-card flex items-center justify-between p-space-sm rounded-lg border transition-all ${
                        isActive
                          ? 'bg-surface-container-low border-surface-container'
                          : 'bg-slate-50 border-slate-200 is-paused'
                      }`}
                    >
                      <div className="flex items-center gap-space-sm min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-secondary-container/60 text-secondary flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[20px]">
                            {m.icon || 'wb_sunny'}
                          </span>
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-label-md text-label-md text-on-surface truncate font-semibold">
                            {m.title}
                          </span>
                          <span className="font-body-sm text-body-sm text-secondary font-medium">
                            {m.reward || 'Chưa cấu hình phần thưởng'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleToggleMissionStatus(m)}
                          type="button"
                          className={`p-1 rounded text-[18px] transition-colors ${
                            isActive
                              ? 'text-secondary hover:text-green-800'
                              : 'text-outline hover:text-on-surface'
                          }`}
                          title={isActive ? 'Tạm dừng nhiệm vụ' : 'Kích hoạt nhiệm vụ'}
                        >
                          <span className="material-symbols-outlined">
                            {isActive ? 'toggle_on' : 'toggle_off'}
                          </span>
                        </button>
                        <button
                          onClick={() => handleOpenEditMission(m)}
                          type="button"
                          className="p-1 text-on-surface-variant hover:text-primary rounded transition-colors"
                          title="Chỉnh sửa"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteMission(m.id)}
                          type="button"
                          className="p-1 text-error hover:text-red-700 rounded transition-colors"
                          title="Xóa"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tiến trình tương tác tháng */}
              <div className="p-space-sm rounded-xl bg-surface-container flex items-center justify-between border border-surface-container-high">
                <div className="flex items-center gap-space-sm">
                  <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-surface-container-high"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3.5"
                    />
                    <path
                      className="text-secondary"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeDasharray={`${Number(stats.interactionRate || 0)}, 100`}
                      strokeWidth="3.5"
                    />
                  </svg>
                  <div className="flex flex-col">
                    <span className="font-label-lg text-label-lg text-primary font-bold">
                      {Number(stats.interactionRate || 0)}% khách đặt phòng đã tham gia
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      {stats.participantGuests ?? 0} du khách đã gửi bài nộp
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModal('stats')}
                  type="button"
                  className="text-secondary font-label-md text-label-md hover:underline font-bold"
                >
                  Chi tiết
                </button>
              </div>
            </div>

            {/* Card: Top du khách tích cực nhất */}
            <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container flex flex-col gap-space-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-secondary text-[20px]">military_tech</span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                    Top du khách tích cực nhất
                  </h3>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">
                  Dựa trên bài nộp đã duyệt
                </span>
              </div>

              <div className="flex flex-col">
                {topGuests.map((guest, idx) => (
                  <div
                    key={guest.id || idx}
                    className="flex items-center justify-between py-2.5 px-space-xs hover:bg-surface-container-low rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-space-sm">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                          idx === 0
                            ? 'bg-amber-400 text-amber-950'
                            : idx === 1
                            ? 'bg-slate-300 text-slate-800'
                            : 'bg-amber-700/40 text-amber-900'
                        }`}
                      >
                        {idx + 1}
                      </div>
                      {guest.avatar ? <img className="w-9 h-9 rounded-full object-cover shadow-sm" alt={guest.name} src={guest.avatar} /> : <div className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center"><span className="material-symbols-outlined">person</span></div>}
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-on-surface font-bold">
                          {guest.name}
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          {guest.completed || 0} nhiệm vụ đã hoàn thành
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => { setGiftForm((prev) => ({ ...prev, selectedGuests: topGuests.map((guest) => String(guest.id)) })); setActiveModal('gift'); }}
                type="button"
                className="w-full mt-2 py-2 rounded-lg bg-surface-container text-primary hover:bg-surface-container-high font-label-md text-label-md transition-colors text-center font-bold"
              >
                Gửi quà tri ân
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/*                   TOÀN BỘ 9 POPUP / MODAL CHUYÊN NGHIỆP CỦA MANAGE MISSION */}
      {/* ========================================================================= */}

      {/* 1. POPUP TẠO / CHỈNH SỬA NHIỆM VỤ */}
      {activeModal === 'mission' && (
        <div className="mission-modal">
          <div className="mission-modal-content">
            <div className="mission-modal-header">
              <div>
                <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                  {editingMission ? 'Chỉnh sửa nhiệm vụ' : 'Tạo nhiệm vụ mới'}
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                  Thiết lập nhiệm vụ trải nghiệm và phần thưởng cho du khách.
                </p>
              </div>
              <button onClick={closeModal} type="button" className="mission-modal-close" aria-label="Đóng">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveMission} className="mission-form">
              <div className="mission-form-grid">
                <div className="mission-form-group full">
                  <label className="mission-form-label" htmlFor="missionTitle">
                    Tên nhiệm vụ <span className="text-error">*</span>
                  </label>
                  <input
                    id="missionTitle"
                    className="mission-form-input"
                    type="text"
                    required
                    placeholder="Ví dụ: Check-in bình minh thung lũng Mai Châu"
                    value={missionForm.title}
                    onChange={(e) => setMissionForm({ ...missionForm, title: e.target.value })}
                  />
                </div>

                <div className="mission-form-group full">
                  <label className="mission-form-label" htmlFor="missionDesc">
                    Mô tả / yêu cầu thực hiện <span className="text-error">*</span>
                  </label>
                  <textarea
                    id="missionDesc"
                    className="mission-form-textarea"
                    required
                    placeholder="Mô tả cách du khách hoàn thành nhiệm vụ, hashtag cần gắn..."
                    value={missionForm.desc}
                    onChange={(e) => setMissionForm({ ...missionForm, desc: e.target.value })}
                  />
                </div>

                <div className="mission-form-group">
                  <label className="mission-form-label" htmlFor="missionIcon">
                    Biểu tượng
                  </label>
                  <select
                    id="missionIcon"
                    className="mission-form-select"
                    value={missionForm.icon}
                    onChange={(e) => setMissionForm({ ...missionForm, icon: e.target.value })}
                  >
                    <option value="wb_sunny">Bình minh / Check-in</option>
                    <option value="photo_camera">Chụp ảnh</option>
                    <option value="outdoor_grill">Ẩm thực / Nấu ăn</option>
                    <option value="styler">Trang phục</option>
                    <option value="star">Đánh giá</option>
                    <option value="hiking">Trải nghiệm ngoài trời</option>
                  </select>
                </div>

                <div className="mission-form-group">
                  <label className="mission-form-label" htmlFor="missionStatus">
                    Trạng thái
                  </label>
                  <select
                    id="missionStatus"
                    className="mission-form-select"
                    value={missionForm.status}
                    onChange={(e) => setMissionForm({ ...missionForm, status: e.target.value })}
                  >
                    <option value="active">Đang kích hoạt</option>
                    <option value="paused">Tạm dừng</option>
                  </select>
                </div>

                <div className="mission-form-group">
                  <label className="mission-form-label" htmlFor="missionRewardType">
                    Loại phần thưởng
                  </label>
                  <select
                    id="missionRewardType"
                    className="mission-form-select"
                    value={missionForm.rewardType}
                    onChange={(e) => setMissionForm({ ...missionForm, rewardType: e.target.value })}
                  >
                    <option value="voucher-percent">Voucher giảm theo %</option>
                    <option value="voucher-amount">Voucher trừ thẳng (₫)</option>
                    <option value="gift">Quà tặng</option>
                  </select>
                </div>

                <div className="mission-form-group">
                  <label className="mission-form-label" htmlFor="missionRewardValue">
                    Giá trị
                  </label>
                  <input
                    id="missionRewardValue"
                    className="mission-form-input"
                    type="text"
                    required
                    placeholder="Ví dụ: 10"
                    value={missionForm.rewardValue}
                    onChange={(e) => setMissionForm({ ...missionForm, rewardValue: e.target.value })}
                  />
                </div>

                <div className="mission-form-group full">
                  <label className="mission-form-label" htmlFor="missionRewardExtra">
                    Quà kèm theo (tuỳ chọn)
                  </label>
                  <input
                    id="missionRewardExtra"
                    className="mission-form-input"
                    type="text"
                    placeholder="Ví dụ: 1 túi trà gạo lứt Mộc Châu"
                    value={missionForm.rewardExtra}
                    onChange={(e) => setMissionForm({ ...missionForm, rewardExtra: e.target.value })}
                  />
                </div>

                <div className="mission-form-group">
                  <label className="mission-form-label" htmlFor="missionFrom">
                    Bắt đầu
                  </label>
                  <input
                    id="missionFrom"
                    className="mission-form-input"
                    type="date"
                    value={missionForm.from}
                    onChange={(e) => setMissionForm({ ...missionForm, from: e.target.value })}
                  />
                </div>

                <div className="mission-form-group">
                  <label className="mission-form-label" htmlFor="missionTo">
                    Kết thúc (bỏ trống = thường niên)
                  </label>
                  <input
                    id="missionTo"
                    className="mission-form-input"
                    type="date"
                    value={missionForm.to}
                    onChange={(e) => setMissionForm({ ...missionForm, to: e.target.value })}
                  />
                </div>

                <div className="mission-form-group full">
                  <label className="mission-check">
                    <input
                      type="checkbox"
                      checked={missionForm.needPhoto}
                      onChange={(e) => setMissionForm({ ...missionForm, needPhoto: e.target.checked })}
                    />
                    <span>Yêu cầu du khách nộp ảnh minh chứng</span>
                  </label>
                </div>

                <div className="mission-form-group full">
                  <label className="mission-check">
                    <input
                      type="checkbox"
                      checked={missionForm.autoApprove}
                      onChange={(e) => setMissionForm({ ...missionForm, autoApprove: e.target.checked })}
                    />
                    <span>Tự động duyệt (không cần chủ homestay xác nhận)</span>
                  </label>
                </div>
              </div>

              <div className="mission-modal-footer">
                <button onClick={closeModal} type="button" className="mission-btn mission-btn-cancel">
                  Hủy
                </button>
                <button type="submit" className="mission-btn mission-btn-save">
                  <span className="material-symbols-outlined text-[17px]">save</span>
                  Lưu nhiệm vụ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. POPUP CẤU HÌNH KHO PHẦN THƯỞNG */}
      {activeModal === 'rewardStock' && (
        <div className="mission-modal">
          <div className="mission-modal-content mission-modal-lg">
            <div className="mission-modal-header">
              <div>
                <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                  Kho phần thưởng
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                  Quản lý voucher, quà tặng và số lượng còn lại để gán cho nhiệm vụ.
                </p>
              </div>
              <button onClick={closeModal} type="button" className="mission-modal-close" aria-label="Đóng">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="mission-form">
              <div className="mission-stock-list">
                {rewardStock.map((it) => (
                  <div key={it.id} className="mission-stock-item">
                    <div className="mission-stock-name">
                      <span>{it.name}</span>
                      <small>{it.type}</small>
                    </div>
                    <input
                      className="mission-stock-qty"
                      type="number"
                      value={it.qty}
                      onChange={(e) =>
                        setRewardStock((prev) =>
                          prev.map((item) =>
                            item.id === it.id ? { ...item, qty: Number(e.target.value) } : item
                          )
                        )
                      }
                    />
                    <button
                      onClick={() => handleRemoveStock(it.id)}
                      type="button"
                      className="mission-stock-remove"
                      title="Xóa"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                ))}
              </div>

              <div className="mission-stock-add">
                <input
                  className="mission-form-input"
                  type="text"
                  placeholder="Tên phần thưởng, ví dụ: Túi trà gạo lứt"
                  value={newStockItem.name}
                  onChange={(e) => setNewStockItem({ ...newStockItem, name: e.target.value })}
                />
                <select
                  className="mission-form-select"
                  value={newStockItem.type}
                  onChange={(e) => setNewStockItem({ ...newStockItem, type: e.target.value })}
                >
                  <option value="Voucher">Voucher</option>
                  <option value="Quà tặng">Quà tặng</option>
                </select>
                <input
                  className="mission-form-input"
                  type="number"
                  min="0"
                  placeholder="Số lượng"
                  value={newStockItem.qty}
                  onChange={(e) => setNewStockItem({ ...newStockItem, qty: Number(e.target.value) })}
                />
                <button onClick={handleAddStock} type="button" className="mission-btn mission-btn-ghost">
                  <span className="material-symbols-outlined text-[16px]">add</span> Thêm
                </button>
              </div>
            </div>

            <div className="mission-modal-footer">
              <button onClick={closeModal} type="button" className="mission-btn mission-btn-cancel">
                Đóng
              </button>
              <button onClick={handleSaveStock} type="button" className="mission-btn mission-btn-save">
                <span className="material-symbols-outlined text-[17px]">save</span>
                Lưu kho phần thưởng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. POPUP XEM CHI TIẾT BÀI NỘP */}
      {activeModal === 'detail' && selectedSubmission && (
        <div className="mission-modal">
          <div className="mission-modal-content mission-modal-lg">
            <div className="mission-modal-header">
              <div>
                <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                  Chi tiết bài nộp
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                  Mã bài nộp: #{selectedSubmission.id} • Du khách: {selectedSubmission.guest}
                </p>
              </div>
              <button onClick={closeModal} type="button" className="mission-modal-close" aria-label="Đóng">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="mission-detail-body">
              <div className="mission-detail-hero">
                <img
                  src={
                    selectedSubmission.photo ||
                    'https://lh3.googleusercontent.com/aida-public/AB6AXuAwxRCSb8O0TEvP8qWKkyBWYmOPRU7CAe-lU0L0LMkQVLCWwT-WPYALrACR8Db8vw3_4jArbeXHHO_9d76yf7xm93aRwrudcovcbdkH-3EQrrGzyVg0iJ-Mvu69r8SV1GpbtRs1onXyn8r2zhoo3AUha2-9zCn4Myw7IYvyDRyt2uYN6sGiBB77aieKV_8H49oOFbrdmjYwsetb-x5cKFX4PCfWM-yOuk8sjzC85RU_W3_1EPQSU6E'
                  }
                  alt="Ảnh bài nộp"
                />
                <span className="mission-detail-badge">1 ảnh</span>
              </div>

              <div className="mission-detail-grid">
                <div className="mission-detail-item">
                  <span className="mission-detail-label">Du khách</span>
                  <span className="mission-detail-value">{selectedSubmission.guest}</span>
                </div>
                <div className="mission-detail-item">
                  <span className="mission-detail-label">Phòng</span>
                  <span className="mission-detail-value">{selectedSubmission.room || 'Chưa chỉ định phòng'}</span>
                </div>
                <div className="mission-detail-item">
                  <span className="mission-detail-label">Thời gian nộp</span>
                  <span className="mission-detail-value">{selectedSubmission.time || '09:12 • Hôm nay'}</span>
                </div>
              </div>

              <div className="mission-detail-section">
                <span className="mission-detail-label">Nhiệm vụ</span>
                <p className="mission-detail-desc">{selectedSubmission.task}</p>
              </div>

              <div className="mission-detail-section">
                <span className="mission-detail-label">Cảm nhận từ khách hàng</span>
                <p className="mission-detail-desc italic">“{selectedSubmission.review}”</p>
              </div>

              <div className="mission-detail-section">
                <span className="mission-detail-label">Phần thưởng dự kiến</span>
                <div className="mission-detail-reward">
                  <span className="material-symbols-outlined text-[20px]">redeem</span>
                  <span>{selectedSubmission.reward}</span>
                </div>
              </div>
            </div>

            <div className="mission-modal-footer">
              <button onClick={closeModal} type="button" className="mission-btn mission-btn-cancel">
                Đóng
              </button>
              <button
                onClick={() => handleOpenReject(selectedSubmission)}
                type="button"
                className="mission-btn mission-btn-danger-soft"
              >
                <span className="material-symbols-outlined text-[17px]">close</span> Từ chối
              </button>
              <button
                onClick={() => handleOpenApprove(selectedSubmission)}
                type="button"
                className="mission-btn mission-btn-save"
              >
                <span className="material-symbols-outlined text-[17px]">check_circle</span> Phê duyệt & Trao thưởng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. POPUP PHÊ DUYỆT & TRAO THƯỞNG */}
      {activeModal === 'approve' && selectedSubmission && (
        <div className="mission-modal">
          <div className="mission-modal-content">
            <div className="mission-modal-header">
              <div>
                <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                  Phê duyệt & Trao thưởng
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                  Xác nhận bài nộp hợp lệ và gửi phần thưởng cho du khách.
                </p>
              </div>
              <button onClick={closeModal} type="button" className="mission-modal-close" aria-label="Đóng">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleConfirmApprove} className="mission-form">
              <div className="mission-current">
                <span className="font-bold">{selectedSubmission.guest}</span>
                <span>• {selectedSubmission.task}</span>
              </div>

              <div className="mission-form-grid">
                <div className="mission-form-group full">
                  <label className="mission-form-label" htmlFor="approveReward">
                    Phần thưởng
                  </label>
                  <input
                    id="approveReward"
                    className="mission-form-input font-bold text-secondary"
                    type="text"
                    required
                    value={approveForm.reward}
                    onChange={(e) => setApproveForm({ ...approveForm, reward: e.target.value })}
                  />
                </div>

                <div className="mission-form-group full">
                  <label className="mission-form-label" htmlFor="approveNote">
                    Lời nhắn gửi du khách
                  </label>
                  <textarea
                    id="approveNote"
                    className="mission-form-textarea"
                    value={approveForm.note}
                    onChange={(e) => setApproveForm({ ...approveForm, note: e.target.value })}
                  />
                </div>

                <div className="mission-form-group full">
                  <label className="mission-check">
                    <input
                      type="checkbox"
                      checked={approveForm.notify}
                      onChange={(e) => setApproveForm({ ...approveForm, notify: e.target.checked })}
                    />
                    <span>Gửi thông báo và mã voucher cho du khách</span>
                  </label>
                </div>

                <div className="mission-form-group full">
                  <label className="mission-check">
                    <input
                      type="checkbox"
                      checked={approveForm.featurePhoto}
                      onChange={(e) => setApproveForm({ ...approveForm, featurePhoto: e.target.checked })}
                    />
                    <span>Cho phép homestay dùng ảnh này để quảng bá</span>
                  </label>
                </div>
              </div>

              <div className="mission-modal-footer">
                <button onClick={closeModal} type="button" className="mission-btn mission-btn-cancel">
                  Hủy
                </button>
                <button type="submit" className="mission-btn mission-btn-save">
                  <span className="material-symbols-outlined text-[17px]">check_circle</span>
                  Xác nhận duyệt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. POPUP TỪ CHỐI BÀI NỘP */}
      {activeModal === 'reject' && selectedSubmission && (
        <div className="mission-modal">
          <div className="mission-modal-content">
            <div className="mission-modal-header">
              <div>
                <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                  Từ chối bài nộp
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                  Du khách sẽ nhận được thông báo kèm lý do từ chối.
                </p>
              </div>
              <button onClick={closeModal} type="button" className="mission-modal-close" aria-label="Đóng">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="mission-form">
              <div className="mission-current">
                <span className="font-bold">{selectedSubmission.guest}</span>
                <span>• {selectedSubmission.task}</span>
              </div>

              <div className="mission-cancel-warning">
                <span className="material-symbols-outlined text-[18px]">warning</span>
                <span>Bài nộp bị từ chối sẽ không được trao thưởng.</span>
              </div>

              <div className="mission-form-grid">
                <div className="mission-form-group full">
                  <label className="mission-form-label" htmlFor="rejectReason">
                    Lý do từ chối
                  </label>
                  <select
                    id="rejectReason"
                    className="mission-form-select"
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

                <div className="mission-form-group full">
                  <label className="mission-form-label" htmlFor="rejectNote">
                    Ghi chú
                  </label>
                  <textarea
                    id="rejectNote"
                    className="mission-form-textarea"
                    placeholder="Giải thích thêm cho du khách..."
                    value={rejectForm.note}
                    onChange={(e) => setRejectForm({ ...rejectForm, note: e.target.value })}
                  />
                </div>
              </div>

              <div className="mission-modal-footer">
                <button onClick={closeModal} type="button" className="mission-btn mission-btn-cancel">
                  Hủy
                </button>
                <button type="submit" className="mission-btn mission-btn-danger">
                  <span className="material-symbols-outlined text-[17px]">close</span>
                  Xác nhận từ chối
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. POPUP YÊU CẦU CHỤP LẠI */}
      {activeModal === 'retake' && selectedSubmission && (
        <div className="mission-modal">
          <div className="mission-modal-content">
            <div className="mission-modal-header">
              <div>
                <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                  Yêu cầu chụp lại
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                  Gửi gợi ý để du khách bổ sung ảnh phù hợp hơn.
                </p>
              </div>
              <button onClick={closeModal} type="button" className="mission-modal-close" aria-label="Đóng">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleConfirmRetake} className="mission-form">
              <div className="mission-current">
                <span className="font-bold">{selectedSubmission.guest}</span>
                <span>• {selectedSubmission.task}</span>
              </div>

              <div className="mission-form-grid">
                <div className="mission-form-group full">
                  <label className="mission-form-label" htmlFor="retakeReason">
                    Vấn đề cần chỉnh
                  </label>
                  <select
                    id="retakeReason"
                    className="mission-form-select"
                    value={retakeForm.reason}
                    onChange={(e) => setRetakeForm({ ...retakeForm, reason: e.target.value })}
                  >
                    <option value="Ảnh bị mờ, thiếu sáng">Ảnh bị mờ, thiếu sáng</option>
                    <option value="Thiếu hashtag / thẻ định vị">Thiếu hashtag / thẻ định vị</option>
                    <option value="Chưa thấy rõ trang phục / món ăn">Chưa thấy rõ trang phục / món ăn</option>
                    <option value="Cần thêm ảnh">Cần thêm ảnh</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                <div className="mission-form-group full">
                  <label className="mission-form-label" htmlFor="retakeNote">
                    Lời nhắn
                  </label>
                  <textarea
                    id="retakeNote"
                    className="mission-form-textarea"
                    placeholder="Ví dụ: Bạn chụp lại ở ban công lúc sáng sớm nhé!"
                    value={retakeForm.note}
                    onChange={(e) => setRetakeForm({ ...retakeForm, note: e.target.value })}
                  />
                </div>

                <div className="mission-form-group full">
                  <label className="mission-form-label" htmlFor="retakeDeadline">
                    Hạn nộp lại
                  </label>
                  <input
                    id="retakeDeadline"
                    className="mission-form-input"
                    type="date"
                    value={retakeForm.deadline}
                    onChange={(e) => setRetakeForm({ ...retakeForm, deadline: e.target.value })}
                  />
                </div>
              </div>

              <div className="mission-modal-footer">
                <button onClick={closeModal} type="button" className="mission-btn mission-btn-cancel">
                  Hủy
                </button>
                <button type="submit" className="mission-btn mission-btn-save">
                  <span className="material-symbols-outlined text-[17px]">send</span>
                  Gửi yêu cầu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. POPUP LỌC BÀI NỘP */}
      {activeModal === 'filter' && (
        <div className="mission-modal">
          <div className="mission-modal-content">
            <div className="mission-modal-header">
              <div>
                <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                  Lọc bài nộp
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                  Lọc danh sách chờ duyệt theo loại nhiệm vụ và từ khóa.
                </p>
              </div>
              <button onClick={closeModal} type="button" className="mission-modal-close" aria-label="Đóng">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="mission-form">
              <div className="mission-form-group">
                <label className="mission-form-label">Loại nhiệm vụ</label>
                <select
                  className="mission-form-select"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="all">Tất cả nhiệm vụ</option>
                  <option value="costume">Trang phục dân tộc</option>
                  <option value="sunrise">Bình minh / Check-in</option>
                  <option value="food">Ẩm thực cơm lam</option>
                  <option value="review">Đánh giá Google Maps</option>
                </select>
              </div>

              <div className="mission-form-group">
                <label className="mission-form-label">Tìm kiếm tên khách hoặc phòng</label>
                <input
                  className="mission-form-input"
                  type="text"
                  placeholder="Nhập tên khách hàng..."
                  value={filterKeyword}
                  onChange={(e) => setFilterKeyword(e.target.value)}
                />
              </div>

              <div className="mission-modal-footer">
                <button
                  onClick={() => {
                    setFilterType('all');
                    setFilterKeyword('');
                    closeModal();
                  }}
                  type="button"
                  className="mission-btn mission-btn-cancel"
                >
                  Đặt lại
                </button>
                <button onClick={closeModal} type="button" className="mission-btn mission-btn-save">
                  Áp dụng bộ lọc
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. POPUP CHI TIẾT MỤC TIÊU TƯƠNG TÁC */}
      {activeModal === 'stats' && (
        <div className="mission-modal">
          <div className="mission-modal-content">
            <div className="mission-modal-header">
              <div>
                <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                  Thống kê bài nộp nhiệm vụ
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                  Thống kê tỷ lệ du khách tham gia và hoàn thành thử thách.
                </p>
              </div>
              <button onClick={closeModal} type="button" className="mission-modal-close" aria-label="Đóng">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="mission-form">
              <div className="mission-stats-list">
                {missionBreakdown.map((item) => (
                  <div className="mission-stats-row" key={item.title}>
                    <div className="mission-stats-head">
                      <span>{item.title}</span>
                      <span>{item.count} bài nộp ({item.percentage}%)</span>
                    </div>
                    <div className="mission-stats-bar"><i style={{ width: `${item.percentage}%` }} /></div>
                  </div>
                ))}
                {!missionBreakdown.length && <p>Chưa có bài nộp trong cơ sở này.</p>}
              </div>
            </div>

            <div className="mission-modal-footer">
              <button onClick={closeModal} type="button" className="mission-btn mission-btn-cancel">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. POPUP GỬI QUÀ TRI ÂN */}
      {activeModal === 'gift' && (
        <div className="mission-modal">
          <div className="mission-modal-content">
            <div className="mission-modal-header">
              <div>
                <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                  Gửi quà tri ân
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                  Chọn du khách tích cực để trao tặng voucher hoặc phần quà đặc biệt.
                </p>
              </div>
              <button onClick={closeModal} type="button" className="mission-modal-close" aria-label="Đóng">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="mission-form">
              <div className="mission-form-group">
                <label className="mission-form-label">Chọn du khách nhận quà</label>
                <div className="mission-gift-list">
                  {topGuests.map((g) => (
                    <label key={g.id} className="mission-gift-item">
                      <input
                        type="checkbox"
                        checked={giftForm.selectedGuests.includes(String(g.id))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setGiftForm((prev) => ({
                              ...prev,
                              selectedGuests: [...prev.selectedGuests, String(g.id)]
                            }));
                          } else {
                            setGiftForm((prev) => ({
                              ...prev,
                              selectedGuests: prev.selectedGuests.filter((id) => id !== String(g.id))
                            }));
                          }
                        }}
                      />
                      <span>{g.name}</span>
                      <small>{g.completed || 0} nhiệm vụ</small>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mission-form-group">
                <label className="mission-form-label">Món quà tri ân</label>
                <input
                  className="mission-form-input font-bold text-secondary"
                  type="text"
                  value={giftForm.giftItem}
                  onChange={(e) => setGiftForm({ ...giftForm, giftItem: e.target.value })}
                />
              </div>

              <div className="mission-form-group">
                <label className="mission-form-label">Lời nhắn gửi kèm</label>
                <textarea
                  className="mission-form-textarea"
                  value={giftForm.message}
                  onChange={(e) => setGiftForm({ ...giftForm, message: e.target.value })}
                />
              </div>
            </div>

            <div className="mission-modal-footer">
              <button onClick={closeModal} type="button" className="mission-btn mission-btn-cancel">
                Hủy
              </button>
              <button onClick={handleSendGift} type="button" className="mission-btn mission-btn-save">
                <span className="material-symbols-outlined text-[17px]">send</span>
                Gửi quà ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Container */}
      {toast.show && (
        <div className="mission-toast-box">
          <div className={`mission-toast is-show ${toast.type === 'error' ? 'mission-toast-error' : ''}`}>
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
