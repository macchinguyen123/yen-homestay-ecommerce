import { useState, useMemo } from 'react';
import './ManageHomestay.css';
import {
  NEW_34_PROVINCES,
  SAMPLE_WARDS,
  STANDARD_SERVICES,
  INITIAL_HOMESTAYS,
  STAFF_PERM_GROUPS,
  ALL_STAFF_PERMS,
  STAFF_PERM_REQUIRES,
  STAFF_PRESETS,
  ROLE_DEFAULT_PRESET,
  INITIAL_STAFF_ASSIGNMENTS
} from './manageHomestayData';

export default function ManageHomestay() {
  // ── States ───────────────────────────────────────────────────────────
  const [homestays, setHomestays] = useState(INITIAL_HOMESTAYS);
  const [staffAssignments, setStaffAssignments] = useState(INITIAL_STAFF_ASSIGNMENTS);
  const [highlightedRowId, setHighlightedRowId] = useState(null);

  // Active Modals: 'addHomestay' | 'editHomestay' | 'deleteHomestay' | 'report' | 'permission' | 'addStaff' | 'lockReason' | null
  const [activeModal, setActiveModal] = useState(null);

  // Target item for modals
  const [currentEditHomestay, setCurrentEditHomestay] = useState(null);
  const [currentDeleteHomestay, setCurrentDeleteHomestay] = useState(null);
  const [currentLockHomestay, setCurrentLockHomestay] = useState(null);
  const [currentPermissionRow, setCurrentPermissionRow] = useState(null);

  // ── Add Homestay Form State ──────────────────────────────────────────
  const [newHomestay, setNewHomestay] = useState({
    name: '',
    provinceId: '',
    ward: '',
    specificAddress: '',
    rooms: 8,
    services: ['WiFi miễn phí', 'Bữa sáng miễn phí'],
    customServices: [],
    images: []
  });
  const [newCustomServiceInput, setNewCustomServiceInput] = useState('');
  const [addHomestayError, setAddHomestayError] = useState('');

  // ── Edit Homestay Form State ─────────────────────────────────────────
  const [editForm, setEditForm] = useState({
    name: '',
    provinceId: '',
    ward: '',
    specificAddress: '',
    services: [],
    customServices: [],
    isLocked: false,
    lockType: '',
    lockNote: '',
    lockUntil: '',
    images: []
  });
  const [editCustomServiceInput, setEditCustomServiceInput] = useState('');

  // ── Add Staff Form State ─────────────────────────────────────────────
  const [staffForm, setStaffForm] = useState({
    name: '',
    phone: '',
    email: '',
    role: 'receptionist',
    preset: 'frontdesk',
    assignedHomestays: [],
    perms: STAFF_PRESETS.frontdesk.perms,
    invite: true
  });
  const [staffError, setStaffError] = useState('');

  // ── Quick Permission Edit State ──────────────────────────────────────
  const [selectedQuickPerm, setSelectedQuickPerm] = useState('cash');

  // ── Calculated KPIs ──────────────────────────────────────────────────
  const kpiData = useMemo(() => {
    const total = homestays.length;
    const operating = homestays.filter(h => h.status === 'active').length;
    const lockedCount = homestays.filter(h => h.status === 'locked').length;
    const totalRooms = homestays.reduce((sum, h) => sum + (Number(h.rooms) || 0), 0);
    return {
      total,
      operating,
      lockedCount,
      totalRooms
    };
  }, [homestays]);

  // ── Modal Open Handlers ──────────────────────────────────────────────
  const openAddHomestayModal = () => {
    setNewHomestay({
      name: '',
      provinceId: '',
      ward: '',
      specificAddress: '',
      rooms: 8,
      services: ['WiFi miễn phí', 'Bữa sáng miễn phí'],
      customServices: [],
      images: []
    });
    setNewCustomServiceInput('');
    setAddHomestayError('');
    setActiveModal('addHomestay');
  };

  const openEditModal = (h) => {
    setCurrentEditHomestay(h);
    setEditForm({
      name: h.name,
      provinceId: h.provinceId || 'PT',
      ward: h.ward || SAMPLE_WARDS[0],
      specificAddress: h.specificAddress || h.address,
      services: h.services || [],
      customServices: h.customServices || [],
      isLocked: h.status === 'locked',
      lockType: h.lockType || '',
      lockNote: h.lockNote || '',
      lockUntil: h.lockUntil || '',
      images: []
    });
    setEditCustomServiceInput('');
    setActiveModal('editHomestay');
  };

  const openDeleteModal = (h) => {
    setCurrentDeleteHomestay(h);
    setActiveModal('deleteHomestay');
  };

  const openLockReasonModal = (h) => {
    setCurrentLockHomestay(h);
    setActiveModal('lockReason');
  };

  const openAddStaffModal = () => {
    setStaffForm({
      name: '',
      phone: '',
      email: '',
      role: 'receptionist',
      preset: 'frontdesk',
      assignedHomestays: homestays.length > 0 ? [homestays[0].name] : [],
      perms: [...STAFF_PRESETS.frontdesk.perms],
      invite: true
    });
    setStaffError('');
    setActiveModal('addStaff');
  };

  const openPermissionModal = (row) => {
    setCurrentPermissionRow(row);
    setSelectedQuickPerm(row.rolePreset || 'cash');
    setActiveModal('permission');
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  // ── Switch Active Homestay ───────────────────────────────────────────
  const handleSwitchCurrent = (id) => {
    setHomestays(prev =>
      prev.map(h => ({
        ...h,
        isCurrent: h.id === id
      }))
    );
  };

  // ── Add Homestay Submit ──────────────────────────────────────────────
  const handleAddHomestaySubmit = (e) => {
    e.preventDefault();
    if (!newHomestay.name.trim() || !newHomestay.provinceId || !newHomestay.ward || !newHomestay.specificAddress.trim()) {
      setAddHomestayError('Vui lòng điền đầy đủ tên cơ sở, chọn Tỉnh/Thành, Phường/Xã và địa chỉ cụ thể.');
      return;
    }

    const provinceObj = NEW_34_PROVINCES.find(p => p.id === newHomestay.provinceId);
    const fullAddress = `${newHomestay.specificAddress.trim()}, ${newHomestay.ward}, ${provinceObj ? provinceObj.name : ''}`;

    const newEntry = {
      id: Date.now(),
      name: newHomestay.name.trim(),
      address: fullAddress,
      provinceId: newHomestay.provinceId,
      ward: newHomestay.ward,
      specificAddress: newHomestay.specificAddress.trim(),
      image: newHomestay.images.length > 0
        ? newHomestay.images[0]
        : 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
      status: 'active',
      revenue: '0 đ',
      occupancy: '0%',
      weeklyBookings: '0 đơn',
      rooms: Number(newHomestay.rooms) || 6,
      services: newHomestay.services,
      customServices: newHomestay.customServices,
      isCurrent: false
    };

    setHomestays(prev => [...prev, newEntry]);
    closeModal();
    alert(`Đã khởi tạo cơ sở mới "${newEntry.name}" thành công!`);
  };

  // ── Edit Homestay Submit ─────────────────────────────────────────────
  const handleEditHomestaySubmit = (e) => {
    e.preventDefault();
    if (!currentEditHomestay) return;

    if (editForm.isLocked) {
      if (!editForm.lockType) {
        alert('Vui lòng chọn lý do khóa homestay!');
        return;
      }
      if (editForm.lockNote.trim().length < 10) {
        alert('Vui lòng ghi rõ chi tiết lý do khóa (tối thiểu 10 ký tự)!');
        return;
      }
    }

    const provinceObj = NEW_34_PROVINCES.find(p => p.id === editForm.provinceId);
    const fullAddress = `${editForm.specificAddress.trim()}, ${editForm.ward}, ${provinceObj ? provinceObj.name : ''}`;

    setHomestays(prev =>
      prev.map(h => {
        if (h.id !== currentEditHomestay.id) return h;
        return {
          ...h,
          name: editForm.name.trim(),
          address: fullAddress,
          provinceId: editForm.provinceId,
          ward: editForm.ward,
          specificAddress: editForm.specificAddress.trim(),
          services: editForm.services,
          customServices: editForm.customServices,
          status: editForm.isLocked ? 'locked' : 'active',
          lockType: editForm.isLocked ? editForm.lockType : undefined,
          lockNote: editForm.isLocked ? editForm.lockNote : undefined,
          lockUntil: editForm.isLocked ? editForm.lockUntil : undefined,
          image: editForm.images.length > 0 ? editForm.images[0] : h.image
        };
      })
    );

    // Đồng bộ tên homestay trong bảng nhân sự nếu có thay đổi
    if (currentEditHomestay.name !== editForm.name.trim()) {
      setStaffAssignments(prev =>
        prev.map(s => s.homestayName === currentEditHomestay.name ? { ...s, homestayName: editForm.name.trim() } : s)
      );
    }

    closeModal();
    alert(editForm.isLocked ? 'Đã khóa cơ sở và lưu thay đổi!' : 'Đã cập nhật thông tin homestay thành công!');
  };

  // ── Delete Homestay ──────────────────────────────────────────────────
  const handleDeleteHomestay = () => {
    if (!currentDeleteHomestay) return;
    setHomestays(prev => prev.filter(h => h.id !== currentDeleteHomestay.id));
    setStaffAssignments(prev => prev.filter(s => s.homestayName !== currentDeleteHomestay.name));
    closeModal();
  };

  // ── Staff Permissions Logic ──────────────────────────────────────────
  const handleStaffRoleChange = (role) => {
    const defaultPresetKey = ROLE_DEFAULT_PRESET[role] || 'viewonly';
    const presetObj = STAFF_PRESETS[defaultPresetKey];
    setStaffForm(prev => ({
      ...prev,
      role,
      preset: defaultPresetKey,
      perms: presetObj ? [...presetObj.perms] : []
    }));
  };

  const handleStaffPresetChange = (presetKey) => {
    const presetObj = STAFF_PRESETS[presetKey];
    setStaffForm(prev => ({
      ...prev,
      preset: presetKey,
      perms: presetObj && presetObj.perms ? [...presetObj.perms] : prev.perms
    }));
  };

  const handleToggleStaffPerm = (permKey) => {
    setStaffForm(prev => {
      let newPerms = [...prev.perms];
      if (newPerms.includes(permKey)) {
        // Uncheck - remove dependent children
        newPerms = newPerms.filter(p => p !== permKey);
        let changed = true;
        while (changed) {
          changed = false;
          Object.entries(STAFF_PERM_REQUIRES).forEach(([perm, req]) => {
            if (newPerms.includes(perm) && !newPerms.includes(req)) {
              newPerms = newPerms.filter(p => p !== perm);
              changed = true;
            }
          });
        }
      } else {
        // Check - ensure prerequisites are enabled
        newPerms.push(permKey);
        let req = STAFF_PERM_REQUIRES[permKey];
        while (req) {
          if (!newPerms.includes(req)) newPerms.push(req);
          req = STAFF_PERM_REQUIRES[req];
        }
      }

      // Check if matches any preset
      const currentSorted = newPerms.slice().sort().join(',');
      const match = Object.keys(STAFF_PRESETS).find(
        k => STAFF_PRESETS[k].perms && STAFF_PRESETS[k].perms.slice().sort().join(',') === currentSorted
      );

      return {
        ...prev,
        perms: newPerms,
        preset: match || 'custom'
      };
    });
  };

  const handleAddStaffSubmit = (e) => {
    e.preventDefault();
    const phoneClean = staffForm.phone.replace(/[\s.-]/g, '');

    if (staffForm.name.trim().length < 2) {
      setStaffError('Vui lòng nhập họ và tên nhân viên hợp lệ.');
      return;
    }
    if (!/^(0\d{9}|\+84\d{9})$/.test(phoneClean)) {
      setStaffError('Số điện thoại không hợp lệ (Ví dụ: 0984123219).');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(staffForm.email.trim())) {
      setStaffError('Email đăng nhập không hợp lệ.');
      return;
    }
    if (staffForm.assignedHomestays.length === 0) {
      setStaffError('Vui lòng chọn ít nhất một cơ sở phụ trách.');
      return;
    }
    if (staffForm.perms.length === 0) {
      setStaffError('Vui lòng cấp ít nhất một quyền truy cập cho nhân viên.');
      return;
    }

    // Xác định label tài chính
    let finLabel = 'Không có quyền tài chính';
    if (staffForm.perms.includes('fin_expense')) finLabel = 'Toàn quyền thu chi';
    else if (staffForm.perms.includes('fin_cash')) finLabel = 'Quyền xem & thu tiền mặt';
    else if (staffForm.perms.includes('fin_view')) finLabel = 'Chỉ xem báo cáo';

    const maskedPhone = phoneClean.length >= 9
      ? phoneClean.slice(0, 4) + '.***.' + phoneClean.slice(-3)
      : phoneClean;

    // Cập nhật hoặc tạo mới hàng cho từng homestay được gán
    let updatedId = null;
    setStaffAssignments(prev => {
      let next = [...prev];
      staffForm.assignedHomestays.forEach(hName => {
        const existingIdx = next.findIndex(row => row.homestayName === hName);
        if (existingIdx >= 0) {
          const row = next[existingIdx];
          const isManager = staffForm.role === 'manager';
          next[existingIdx] = {
            ...row,
            manager: isManager ? `${staffForm.name} (${maskedPhone})` : row.manager,
            staffCount: isManager ? row.staffCount : row.staffCount + 1,
            financeAccess: finLabel,
            rolePreset: staffForm.preset
          };
          updatedId = row.id;
        } else {
          const newRow = {
            id: Date.now() + Math.random(),
            homestayName: hName,
            manager: staffForm.role === 'manager' ? `${staffForm.name} (${maskedPhone})` : 'Chưa chỉ định',
            staffCount: staffForm.role === 'manager' ? 1 : 1,
            financeAccess: finLabel,
            rolePreset: staffForm.preset
          };
          next.push(newRow);
          updatedId = newRow.id;
        }
      });
      return next;
    });

    setHighlightedRowId(updatedId);
    setTimeout(() => setHighlightedRowId(null), 3000);

    closeModal();
    alert(`Đã phân quyền thành công cho nhân viên "${staffForm.name}"!`);
  };

  const handleSaveQuickPermission = () => {
    if (!currentPermissionRow) return;
    const presetLabel = STAFF_PRESETS[selectedQuickPerm]?.label || 'Tùy chỉnh';
    setStaffAssignments(prev =>
      prev.map(row => {
        if (row.id !== currentPermissionRow.id) return row;
        return {
          ...row,
          financeAccess: presetLabel,
          rolePreset: selectedQuickPerm
        };
      })
    );
    closeModal();
    alert('Đã cập nhật phân quyền cơ sở thành công!');
  };

  // ── Render Component ─────────────────────────────────────────────────
  return (
    <div className="manage-homestay-page">
      {/* ── 1. Top Header Bar ── */}
      <div className="mh-header-bar">
        <div>
          <h1 className="mh-header-title">Quản lý Chuỗi Homestay &amp; Cơ sở</h1>
          <p className="mh-header-subtitle">
            Giám sát vận hành, hiệu suất kinh doanh, cơ sở vật chất và phân quyền nhân sự từ xa.
          </p>
        </div>
        <div className="mh-header-actions">
          <button type="button" className="mh-btn-outline" onClick={() => setActiveModal('report')}>
            <span className="material-symbols-outlined text-[18px]">analytics</span>
            <span>Báo cáo chuỗi</span>
          </button>
          <button type="button" className="mh-btn-primary" onClick={openAddHomestayModal}>
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>+ Khởi tạo cơ sở mới</span>
          </button>
        </div>
      </div>

      {/* ── 2. KPI Summary Cards ── */}
      <div className="mh-kpi-grid">
        {/* KPI 1 */}
        <div className="mh-kpi-card">
          <div className="mh-kpi-top">
            <div>
              <span className="mh-kpi-label">Tổng số cơ sở</span>
              <div className="mh-kpi-value">
                {String(kpiData.total).padStart(2, '0')}
                <span className="mh-kpi-unit">Cơ sở</span>
              </div>
            </div>
            <div className="mh-kpi-icon-box">
              <span className="material-symbols-outlined text-[24px]">cabin</span>
            </div>
          </div>
          <div className="mh-kpi-bottom">
            <span className="mh-badge-pill">{kpiData.operating} Đang vận hành</span>
            <span>•</span>
            <span style={{ color: '#5d2f00' }}>{kpiData.lockedCount} Tạm khóa</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="mh-kpi-card">
          <div className="mh-kpi-top">
            <div>
              <span className="mh-kpi-label">Quy mô phòng chuỗi</span>
              <div className="mh-kpi-value">
                {kpiData.totalRooms}
                <span className="mh-kpi-unit">Căn / Phòng</span>
              </div>
            </div>
            <div className="mh-kpi-icon-box">
              <span className="material-symbols-outlined text-[24px]">king_bed</span>
            </div>
          </div>
          <div className="mh-kpi-bottom">
            <span className="material-symbols-outlined text-[16px]" style={{ color: '#1b6d24' }}>groups</span>
            <span>Sức chứa tối đa: <strong>140 khách/ngày</strong></span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="mh-kpi-card">
          <div className="mh-kpi-top">
            <div>
              <span className="mh-kpi-label">Doanh thu tháng 09</span>
              <div className="mh-kpi-value highlight">
                313.7M
                <span className="mh-kpi-unit">đ</span>
              </div>
            </div>
            <div className="mh-kpi-icon-box green">
              <span className="material-symbols-outlined text-[24px]">payments</span>
            </div>
          </div>
          <div className="mh-kpi-bottom">
            <span style={{ color: '#1b6d24', fontWeight: 600, display: 'inline-flex', alignItems: 'center' }}>
              <span className="material-symbols-outlined text-[14px]">arrow_upward</span> +22.4%
            </span>
            <span>so với tháng 08</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="mh-kpi-card">
          <div className="mh-kpi-top">
            <div>
              <span className="mh-kpi-label">Lấp đầy trung bình</span>
              <div className="mh-kpi-value">77.8%</div>
            </div>
            <div className="mh-kpi-icon-box">
              <span className="material-symbols-outlined text-[24px]">pie_chart</span>
            </div>
          </div>
          <div className="mh-kpi-bottom" style={{ justifyContent: 'space-between', width: '100%' }}>
            <span style={{ color: '#217128', fontWeight: 500 }}>🌾 Cao điểm mùa lúa chín</span>
            <span>Mục tiêu: 85%</span>
          </div>
        </div>
      </div>

      {/* ── 3. Homestay Fleet Grid ── */}
      <div className="mh-homestay-grid">
        {homestays.map((h) => {
          const isLocked = h.status === 'locked';
          return (
            <div
              key={h.id}
              className={`mh-card ${isLocked ? 'is-locked' : ''} ${h.isCurrent ? 'is-current' : ''}`}
            >
              <div>
                <div className="mh-card-cover">
                  <img src={h.image} alt={h.name} />
                  <div className="mh-card-overlay" />

                  {/* Top badges */}
                  <div className="mh-card-top-badges">
                    <span className={`mh-status-badge ${isLocked ? 'locked' : 'active'}`}>
                      {isLocked ? (
                        <>
                          <span className="material-symbols-outlined text-[14px]">lock</span>
                          Ngưng hoạt động
                        </>
                      ) : (
                        <>
                          <span className="mh-pulse-dot" />
                          Đang hoạt động
                        </>
                      )}
                    </span>
                    {h.isCurrent && (
                      <span className="mh-current-tag">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        Đang chọn
                      </span>
                    )}
                  </div>

                  {/* Hero info */}
                  <div className="mh-card-hero-info">
                    <h2 className="mh-card-title">{h.name}</h2>
                    <p className="mh-card-address">
                      <span className="material-symbols-outlined">location_on</span>
                      {h.address}
                    </p>
                  </div>
                </div>

                {/* Card stats */}
                <div className="mh-card-body">
                  <div className="mh-card-stats-row">
                    <div className="mh-stat-col">
                      <span className="mh-stat-lbl">Doanh thu T09</span>
                      <span className="mh-stat-val">{h.revenue}</span>
                    </div>
                    <div className="mh-stat-col">
                      <span className="mh-stat-lbl">{isLocked ? 'Trạng thái' : 'Tỷ lệ lấp đầy'}</span>
                      <span className={`mh-stat-val ${isLocked ? 'error-val' : 'green-val'}`}>
                        {h.occupancy}
                      </span>
                    </div>
                    <div className="mh-stat-col">
                      <span className="mh-stat-lbl">{isLocked ? 'Lịch hẹn mở' : 'Booking tuần'}</span>
                      <span className={`mh-stat-val ${isLocked ? '' : 'primary-val'}`}>
                        {h.weeklyBookings}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mh-card-footer">
                {!isLocked ? (
                  <button
                    type="button"
                    className={`mh-card-btn-switch ${h.isCurrent ? 'current' : ''}`}
                    onClick={() => handleSwitchCurrent(h.id)}
                  >
                    <span className="material-symbols-outlined text-[16px]">sync_alt</span>
                    {h.isCurrent ? 'Cơ sở hiện tại' : 'Chuyển sang cơ sở này'}
                  </button>
                ) : (
                  <button type="button" className="mh-card-btn-switch" onClick={() => openLockReasonModal(h)}>
                    <span className="material-symbols-outlined text-[16px]">build</span>
                    Quản lý tiến độ nâng cấp
                  </button>
                )}

                <div className="mh-card-actions-right">
                  {isLocked && (
                    <button
                      type="button"
                      className="mh-btn-action btn-lock-reason"
                      title="Xem lý do khóa"
                      onClick={() => openLockReasonModal(h)}
                    >
                      <span className="material-symbols-outlined text-[16px]">info</span>
                      <span>Lý do khóa</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="mh-btn-action"
                    title="Chỉnh sửa thông tin"
                    onClick={() => openEditModal(h)}
                  >
                    <span className="material-symbols-outlined text-[16px]" style={{ color: '#717974' }}>edit</span>
                    <span>Chỉnh sửa</span>
                  </button>
                  <button
                    type="button"
                    className="mh-btn-action btn-danger"
                    title="Xóa cơ sở"
                    onClick={() => openDeleteModal(h)}
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 4. Operational Governance Table ── */}
      <div className="mh-governance-card">
        <div className="mh-gov-header">
          <div>
            <h4 className="mh-gov-title">Phân quyền &amp; Giám sát nhân sự từ xa</h4>
            <p className="mh-gov-subtitle">
              Quản lý người chịu trách nhiệm vận hành tại chỗ, lễ tân tiếp đón và kiểm soát quyền truy cập tài chính của từng homestay.
            </p>
          </div>
          <button type="button" className="mh-gov-add-btn" onClick={openAddStaffModal}>
            <span>+ Phân quyền nhân viên mới</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>

        <div className="mh-table-wrapper">
          <table className="mh-table">
            <thead>
              <tr>
                <th>Cơ sở Homestay</th>
                <th>Quản lý trực tiếp</th>
                <th>Nhân sự ca trực</th>
                <th>Tài khoản thu chi</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {staffAssignments.map((row) => (
                <tr
                  key={row.id}
                  className={highlightedRowId === row.id ? 'highlighted' : ''}
                >
                  <td style={{ fontWeight: 600 }}>{row.homestayName}</td>
                  <td>{row.manager}</td>
                  <td>
                    <span className="mh-badge-staff-count">{row.staffCount} Nhân sự</span>
                  </td>
                  <td style={{ color: '#1b6d24', fontSize: '12.5px', fontWeight: 600 }}>
                    {row.financeAccess}
                  </td>
                  <td className="text-right">
                    <button
                      type="button"
                      className="mh-table-btn-perm"
                      onClick={() => openPermissionModal(row)}
                    >
                      Đổi quyền
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* =====================================================================
          MODALS
         ===================================================================== */}

      {/* ── Modal 1: Khởi tạo Homestay Mới ── */}
      {activeModal === 'addHomestay' && (
        <div className="mh-modal-overlay" onClick={closeModal}>
          <div className="mh-modal-box modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="mh-modal-header">
              <div>
                <h3>Khởi tạo cơ sở Homestay mới</h3>
                <p>Thêm cơ sở mới vào hệ sinh thái chuỗi nghỉ dưỡng của bạn.</p>
              </div>
              <button type="button" className="mh-modal-close-btn" onClick={closeModal}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleAddHomestaySubmit}>
              <div className="mh-modal-body">
                <div className="mh-form-grid">
                  <div className="mh-form-group full-width">
                    <label className="mh-form-label">
                      Tên cơ sở Homestay <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      className="mh-form-input"
                      placeholder="Ví dụ: Mộc Bản Lác..."
                      value={newHomestay.name}
                      onChange={(e) => setNewHomestay({ ...newHomestay, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mh-form-group">
                    <label className="mh-form-label">
                      Tỉnh / Thành phố <span className="required">*</span>
                    </label>
                    <select
                      className="mh-form-select"
                      value={newHomestay.provinceId}
                      onChange={(e) => setNewHomestay({ ...newHomestay, provinceId: e.target.value, ward: SAMPLE_WARDS[0] })}
                      required
                    >
                      <option value="">-- Chọn Tỉnh/Thành --</option>
                      {NEW_34_PROVINCES.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mh-form-group">
                    <label className="mh-form-label">
                      Phường / Xã <span className="required">*</span>
                    </label>
                    <select
                      className="mh-form-select"
                      value={newHomestay.ward}
                      onChange={(e) => setNewHomestay({ ...newHomestay, ward: e.target.value })}
                      required
                    >
                      <option value="">-- Chọn Phường/Xã --</option>
                      {SAMPLE_WARDS.map((w, idx) => (
                        <option key={idx} value={w}>{w}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mh-form-group full-width">
                    <label className="mh-form-label">
                      Địa chỉ cụ thể (Thôn/Bản, Số nhà) <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      className="mh-form-input"
                      placeholder="Ví dụ: Bản Lác 2, số nhà 15"
                      value={newHomestay.specificAddress}
                      onChange={(e) => setNewHomestay({ ...newHomestay, specificAddress: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mh-form-group full-width">
                    <label className="mh-form-label">
                      Quy mô phòng ban đầu <span className="required">*</span>
                    </label>
                    <input
                      type="number"
                      className="mh-form-input"
                      min="1"
                      value={newHomestay.rooms}
                      onChange={(e) => setNewHomestay({ ...newHomestay, rooms: e.target.value })}
                      required
                    />
                  </div>

                  {/* Services & Experiences */}
                  <div className="mh-form-group full-width">
                    <label className="mh-form-label">Trải nghiệm đặc biệt &amp; Dịch vụ đi kèm</label>
                    <div className="mh-form-checkbox-group">
                      {STANDARD_SERVICES.map((srv, idx) => (
                        <label key={idx} className="mh-checkbox-label">
                          <input
                            type="checkbox"
                            checked={newHomestay.services.includes(srv)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setNewHomestay(prev => ({
                                ...prev,
                                services: checked
                                  ? [...prev.services, srv]
                                  : prev.services.filter(s => s !== srv)
                              }));
                            }}
                          />
                          <span>{srv}</span>
                        </label>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                      <input
                        type="text"
                        className="mh-form-input"
                        style={{ flex: 1 }}
                        placeholder="Nhập trải nghiệm độc quyền (VD: Trekking rừng, hái chè...)"
                        value={newCustomServiceInput}
                        onChange={(e) => setNewCustomServiceInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newCustomServiceInput.trim()) {
                              setNewHomestay(prev => ({
                                ...prev,
                                customServices: [...prev.customServices, newCustomServiceInput.trim()]
                              }));
                              setNewCustomServiceInput('');
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="mh-btn-outline"
                        onClick={() => {
                          if (newCustomServiceInput.trim()) {
                            setNewHomestay(prev => ({
                              ...prev,
                              customServices: [...prev.customServices, newCustomServiceInput.trim()]
                            }));
                            setNewCustomServiceInput('');
                          }
                        }}
                      >
                        + Thêm
                      </button>
                    </div>

                    {newHomestay.customServices.length > 0 && (
                      <div className="mh-chip-list">
                        {newHomestay.customServices.map((cs, i) => (
                          <span key={i} className="mh-chip">
                            <span>✨ {cs}</span>
                            <button
                              type="button"
                              className="mh-chip-remove"
                              onClick={() => setNewHomestay(prev => ({
                                ...prev,
                                customServices: prev.customServices.filter((_, idx) => idx !== i)
                              }))}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {addHomestayError && (
                  <div className="mh-alert-box">
                    <span className="material-symbols-outlined text-[18px]">error</span>
                    <span>{addHomestayError}</span>
                  </div>
                )}
              </div>
              <div className="mh-modal-footer">
                <button type="button" className="mh-btn-outline" onClick={closeModal}>Hủy</button>
                <button type="submit" className="mh-btn-primary">Xác nhận tạo cơ sở</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal 2: Báo cáo chuỗi ── */}
      {activeModal === 'report' && (
        <div className="mh-modal-overlay" onClick={closeModal}>
          <div className="mh-modal-box modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="mh-modal-header">
              <div>
                <h3>Báo cáo hiệu suất chuỗi nghỉ dưỡng</h3>
                <p>Tổng hợp số liệu kinh doanh và tăng trưởng toàn hệ thống.</p>
              </div>
              <button type="button" className="mh-modal-close-btn" onClick={closeModal}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="mh-modal-body">
              <div className="mh-alert-box info" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: 700 }}>
                  Tháng 09/2026: Tăng trưởng mạnh mẽ toàn hệ thống
                </span>
                <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5 }}>
                  Tổng doanh thu toàn chuỗi đạt <strong>313.700.000₫</strong>, tăng <strong>22.4%</strong> so với tháng trước nhờ mùa lúa chín vùng cao Tây Bắc. Tỷ lệ lấp đầy đạt đỉnh tại Mộc Retreat Pù Luông (81.5%).
                </p>
              </div>

              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8f9ff', borderRadius: '8px' }}>
                  <span>Tổng số lượt khách lưu trú:</span>
                  <strong>412 lượt khách</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8f9ff', borderRadius: '8px' }}>
                  <span>Chi tiêu bình quân / đơn đặt:</span>
                  <strong>3.870.000₫</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8f9ff', borderRadius: '8px' }}>
                  <span>Đánh giá hài lòng chuỗi:</span>
                  <strong style={{ color: '#1b6d24' }}>4.92 / 5.0 (98% hài lòng)</strong>
                </div>
              </div>
            </div>
            <div className="mh-modal-footer">
              <button type="button" className="mh-btn-outline" onClick={closeModal}>Đóng</button>
              <button
                type="button"
                className="mh-btn-primary"
                onClick={() => {
                  alert('Đã tải xuống file báo cáo tổng hợp chuỗi (Excel/PDF)!');
                  closeModal();
                }}
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                Tải xuống báo cáo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal 3: Chỉnh sửa thông tin Homestay ── */}
      {activeModal === 'editHomestay' && currentEditHomestay && (
        <div className="mh-modal-overlay" onClick={closeModal}>
          <div className="mh-modal-box modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="mh-modal-header">
              <div>
                <h3>Chỉnh sửa thông tin cơ sở</h3>
                <p>Cập nhật thông tin, địa chỉ, trạng thái hoạt động và dịch vụ trải nghiệm.</p>
              </div>
              <button type="button" className="mh-modal-close-btn" onClick={closeModal}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleEditHomestaySubmit}>
              <div className="mh-modal-body">
                <div className="mh-form-grid">
                  <div className="mh-form-group full-width">
                    <label className="mh-form-label">
                      Tên cơ sở Homestay <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      className="mh-form-input"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mh-form-group">
                    <label className="mh-form-label">
                      Tỉnh / Thành phố <span className="required">*</span>
                    </label>
                    <select
                      className="mh-form-select"
                      value={editForm.provinceId}
                      onChange={(e) => setEditForm({ ...editForm, provinceId: e.target.value })}
                      required
                    >
                      {NEW_34_PROVINCES.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mh-form-group">
                    <label className="mh-form-label">
                      Phường / Xã <span className="required">*</span>
                    </label>
                    <select
                      className="mh-form-select"
                      value={editForm.ward}
                      onChange={(e) => setEditForm({ ...editForm, ward: e.target.value })}
                      required
                    >
                      {SAMPLE_WARDS.map((w, idx) => (
                        <option key={idx} value={w}>{w}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mh-form-group full-width">
                    <label className="mh-form-label">
                      Địa chỉ cụ thể <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      className="mh-form-input"
                      value={editForm.specificAddress}
                      onChange={(e) => setEditForm({ ...editForm, specificAddress: e.target.value })}
                      required
                    />
                  </div>

                  {/* Services */}
                  <div className="mh-form-group full-width">
                    <label className="mh-form-label">Dịch vụ &amp; Trải nghiệm</label>
                    <div className="mh-form-checkbox-group">
                      {STANDARD_SERVICES.map((srv, idx) => (
                        <label key={idx} className="mh-checkbox-label">
                          <input
                            type="checkbox"
                            checked={editForm.services.includes(srv)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setEditForm(prev => ({
                                ...prev,
                                services: checked
                                  ? [...prev.services, srv]
                                  : prev.services.filter(s => s !== srv)
                              }));
                            }}
                          />
                          <span>{srv}</span>
                        </label>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                      <input
                        type="text"
                        className="mh-form-input"
                        style={{ flex: 1 }}
                        placeholder="Thêm trải nghiệm độc quyền (VD: Trekking rừng, hái chè...)"
                        value={editCustomServiceInput}
                        onChange={(e) => setEditCustomServiceInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (editCustomServiceInput.trim()) {
                              setEditForm(prev => ({
                                ...prev,
                                customServices: [...prev.customServices, editCustomServiceInput.trim()]
                              }));
                              setEditCustomServiceInput('');
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="mh-btn-outline"
                        onClick={() => {
                          if (editCustomServiceInput.trim()) {
                            setEditForm(prev => ({
                              ...prev,
                              customServices: [...prev.customServices, editCustomServiceInput.trim()]
                            }));
                            setEditCustomServiceInput('');
                          }
                        }}
                      >
                        + Thêm
                      </button>
                    </div>

                    {editForm.customServices.length > 0 && (
                      <div className="mh-chip-list">
                        {editForm.customServices.map((cs, i) => (
                          <span key={i} className="mh-chip">
                            <span>✨ {cs}</span>
                            <button
                              type="button"
                              className="mh-chip-remove"
                              onClick={() => setEditForm(prev => ({
                                ...prev,
                                customServices: prev.customServices.filter((_, idx) => idx !== i)
                              }))}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Lock Toggle */}
                  <div className="mh-form-group full-width" style={{ marginTop: '8px' }}>
                    <label className="mh-checkbox-label" style={{ color: '#ba1a1a', fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={editForm.isLocked}
                        onChange={(e) => setEditForm({ ...editForm, isLocked: e.target.checked })}
                      />
                      <span className="material-symbols-outlined text-[18px]">lock</span>
                      Khóa homestay (ngừng nhận đặt phòng)
                    </label>
                  </div>

                  {editForm.isLocked && (
                    <div className="mh-form-group full-width" style={{ background: '#ffdad6', padding: '14px', borderRadius: '8px' }}>
                      <label className="mh-form-label">
                        Lý do khóa <span className="required">*</span>
                      </label>
                      <select
                        className="mh-form-select"
                        value={editForm.lockType}
                        onChange={(e) => setEditForm({ ...editForm, lockType: e.target.value })}
                        required
                      >
                        <option value="">-- Chọn lý do --</option>
                        <option>Bảo trì / nâng cấp cơ sở</option>
                        <option>Tạm ngưng kinh doanh theo mùa</option>
                        <option>Thiếu hoặc hết hạn hồ sơ pháp lý</option>
                        <option>Vi phạm quy định của sàn</option>
                        <option>Khác</option>
                      </select>

                      <label className="mh-form-label" style={{ marginTop: '10px' }}>
                        Ghi chú chi tiết lý do (tối thiểu 10 ký tự) <span className="required">*</span>
                      </label>
                      <textarea
                        className="mh-form-textarea"
                        rows="3"
                        placeholder="Ghi rõ chi tiết sự cố hoặc lý do nâng cấp..."
                        value={editForm.lockNote}
                        onChange={(e) => setEditForm({ ...editForm, lockNote: e.target.value })}
                        required
                      />

                      <label className="mh-form-label" style={{ marginTop: '10px' }}>
                        Khóa đến ngày (không bắt buộc)
                      </label>
                      <input
                        type="date"
                        className="mh-form-input"
                        value={editForm.lockUntil}
                        onChange={(e) => setEditForm({ ...editForm, lockUntil: e.target.value })}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="mh-modal-footer">
                <button type="button" className="mh-btn-outline" onClick={closeModal}>Hủy</button>
                <button type="submit" className="mh-btn-primary">Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal 4: Xác nhận xóa cơ sở ── */}
      {activeModal === 'deleteHomestay' && currentDeleteHomestay && (
        <div className="mh-modal-overlay" onClick={closeModal}>
          <div className="mh-modal-box modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="mh-modal-header">
              <div>
                <h3>Xác nhận xóa cơ sở</h3>
                <p>Gỡ bỏ cơ sở khỏi chuỗi quản lý.</p>
              </div>
              <button type="button" className="mh-modal-close-btn" onClick={closeModal}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="mh-modal-body">
              <div className="mh-alert-box" style={{ background: '#ffdad6', color: '#93000a' }}>
                <span className="material-symbols-outlined">warning</span>
                <span>
                  Bạn có chắc chắn muốn xóa cơ sở <strong>"{currentDeleteHomestay.name}"</strong>? Thao tác này không thể hoàn tác.
                </span>
              </div>
            </div>
            <div className="mh-modal-footer">
              <button type="button" className="mh-btn-outline" onClick={closeModal}>Hủy bỏ</button>
              <button
                type="button"
                className="mh-btn-primary"
                style={{ backgroundColor: '#ba1a1a' }}
                onClick={handleDeleteHomestay}
              >
                Đồng ý xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal 5: Chi tiết lý do khóa homestay ── */}
      {activeModal === 'lockReason' && currentLockHomestay && (
        <div className="mh-modal-overlay" onClick={closeModal}>
          <div className="mh-modal-box modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="mh-modal-header">
              <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-symbols-outlined text-[20px]" style={{ color: '#ba1a1a' }}>lock</span>
                  Chi tiết lý do ngưng hoạt động
                </h3>
                <p>Cơ sở: <strong>{currentLockHomestay.name}</strong></p>
              </div>
              <button type="button" className="mh-modal-close-btn" onClick={closeModal}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="mh-modal-body">
              <div style={{ background: '#ffdad6', padding: '16px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#717974' }}>
                    Loại sự cố / Lý do:
                  </span>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#0b1c30', marginTop: '2px' }}>
                    {currentLockHomestay.lockType || 'Bảo trì cơ sở'}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#717974' }}>
                    Ghi chú chi tiết:
                  </span>
                  <div style={{ fontSize: '13.5px', color: '#0b1c30', marginTop: '4px', background: '#fff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #c0c8c2' }}>
                    {currentLockHomestay.lockNote || 'Không có ghi chú chi tiết.'}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#717974' }}>
                    Thời hạn mở lại dự kiến:
                  </span>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0b1c30', marginTop: '2px' }}>
                    {currentLockHomestay.lockUntil ? currentLockHomestay.lockUntil.split('-').reverse().join('/') : 'Chưa xác định'}
                  </div>
                </div>
              </div>
            </div>
            <div className="mh-modal-footer">
              <button type="button" className="mh-btn-outline" onClick={closeModal}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal 6: Phân quyền nhân viên mới ── */}
      {activeModal === 'addStaff' && (
        <div className="mh-modal-overlay" onClick={closeModal}>
          <div className="mh-modal-box modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="mh-modal-header">
              <div>
                <h3>Phân quyền nhân viên mới</h3>
                <p>Tạo tài khoản, chọn cơ sở phụ trách và cấp quyền truy cập chi tiết.</p>
              </div>
              <button type="button" className="mh-modal-close-btn" onClick={closeModal}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleAddStaffSubmit}>
              <div className="mh-modal-body">
                <div className="mh-form-grid">
                  <div className="mh-form-group full-width">
                    <label className="mh-form-label">
                      Họ và tên nhân viên <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      className="mh-form-input"
                      placeholder="Ví dụ: Nguyễn Thị Lan"
                      value={staffForm.name}
                      onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mh-form-group">
                    <label className="mh-form-label">
                      Số điện thoại <span className="required">*</span>
                    </label>
                    <input
                      type="tel"
                      className="mh-form-input"
                      placeholder="0984 123 219"
                      value={staffForm.phone}
                      onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mh-form-group">
                    <label className="mh-form-label">
                      Email đăng nhập <span className="required">*</span>
                    </label>
                    <input
                      type="email"
                      className="mh-form-input"
                      placeholder="lan.nguyen@example.com"
                      value={staffForm.email}
                      onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mh-form-group">
                    <label className="mh-form-label">Chức vụ</label>
                    <select
                      className="mh-form-select"
                      value={staffForm.role}
                      onChange={(e) => handleStaffRoleChange(e.target.value)}
                    >
                      <option value="manager">Quản lý cơ sở</option>
                      <option value="receptionist">Lễ tân</option>
                      <option value="accountant">Kế toán thu chi</option>
                      <option value="housekeeping">Buồng phòng / Tạp vụ</option>
                    </select>
                  </div>

                  <div className="mh-form-group">
                    <label className="mh-form-label">Mẫu phân quyền</label>
                    <select
                      className="mh-form-select"
                      value={staffForm.preset}
                      onChange={(e) => handleStaffPresetChange(e.target.value)}
                    >
                      {Object.entries(STAFF_PRESETS).map(([key, p]) => (
                        <option key={key} value={key}>{p.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Assigned Homestays */}
                  <div className="mh-form-group full-width">
                    <label className="mh-form-label">
                      Cơ sở phụ trách <span className="required">*</span>
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px' }}>
                      {homestays.map((h) => {
                        const checked = staffForm.assignedHomestays.includes(h.name);
                        return (
                          <label
                            key={h.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: '1px solid #c0c8c2',
                              background: checked ? '#eff4ff' : '#fff',
                              cursor: 'pointer',
                              fontSize: '13px'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const isChecked = e.target.checked;
                                setStaffForm(prev => ({
                                  ...prev,
                                  assignedHomestays: isChecked
                                    ? [...prev.assignedHomestays, h.name]
                                    : prev.assignedHomestays.filter(name => name !== h.name)
                                }));
                              }}
                            />
                            <span>{h.name}</span>
                            {h.status === 'locked' && (
                              <span style={{ color: '#ba1a1a', fontSize: '11px', fontWeight: 600 }}>(đang khóa)</span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Permissions Detail Grid */}
                  <div className="mh-form-group full-width">
                    <label className="mh-form-label">Chi tiết quyền truy cập</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                      {STAFF_PERM_GROUPS.map((grp, gIdx) => (
                        <div key={gIdx} style={{ background: '#eff4ff', padding: '12px', borderRadius: '8px' }}>
                          <div style={{ fontSize: '12.5px', fontWeight: 700, marginBottom: '8px', color: '#0b1c30' }}>
                            {grp.title}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {grp.items.map(([key, lbl]) => (
                              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={staffForm.perms.includes(key)}
                                  onChange={() => handleToggleStaffPerm(key)}
                                />
                                <span>{lbl}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <span style={{ fontSize: '11.5px', color: '#717974', marginTop: '6px' }}>
                      Chọn mẫu phân quyền để điền nhanh, sau đó bật/tắt từng quyền nếu cần. Quyền cao sẽ tự kích hoạt các quyền xem phụ thuộc.
                    </span>
                  </div>

                  <div className="mh-form-group full-width">
                    <label className="mh-checkbox-label" style={{ fontSize: '13px' }}>
                      <input
                        type="checkbox"
                        checked={staffForm.invite}
                        onChange={(e) => setStaffForm({ ...staffForm, invite: e.target.checked })}
                      />
                      Gửi lời mời kích hoạt tài khoản qua email
                    </label>
                  </div>
                </div>

                {staffError && (
                  <div className="mh-alert-box">
                    <span className="material-symbols-outlined text-[18px]">error</span>
                    <span>{staffError}</span>
                  </div>
                )}
              </div>
              <div className="mh-modal-footer">
                <button type="button" className="mh-btn-outline" onClick={closeModal}>Hủy</button>
                <button type="submit" className="mh-btn-primary">Tạo &amp; phân quyền</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal 7: Thiết lập quyền nhân sự nhanh ── */}
      {activeModal === 'permission' && currentPermissionRow && (
        <div className="mh-modal-overlay" onClick={closeModal}>
          <div className="mh-modal-box modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="mh-modal-header">
              <div>
                <h3>Thiết lập quyền nhân sự</h3>
                <p>Cơ sở: <strong>{currentPermissionRow.homestayName}</strong></p>
              </div>
              <button type="button" className="mh-modal-close-btn" onClick={closeModal}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="mh-modal-body">
              <div className="mh-form-group">
                <label className="mh-form-label">Chọn cấp độ phân quyền mới</label>
                <select
                  className="mh-form-select"
                  value={selectedQuickPerm}
                  onChange={(e) => setSelectedQuickPerm(e.target.value)}
                >
                  <option value="full">Toàn quyền vận hành cơ sở</option>
                  <option value="cash">Quyền xem &amp; thu tiền mặt</option>
                  <option value="frontdesk">Chỉ tiếp tân &amp; check-in phòng</option>
                  <option value="viewonly">Chỉ xem</option>
                </select>
              </div>
            </div>
            <div className="mh-modal-footer">
              <button type="button" className="mh-btn-outline" onClick={closeModal}>Hủy</button>
              <button type="button" className="mh-btn-primary" onClick={handleSaveQuickPermission}>
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
