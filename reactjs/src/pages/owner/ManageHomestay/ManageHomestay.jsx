import { useState, useEffect, useMemo } from 'react';
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
  const [loading, setLoading] = useState(false);

  // Active Modals: 'addHomestay' | 'editHomestay' | 'deleteHomestay' | 'report' | 'permission' | 'addStaff' | 'lockReason' | null
  const [activeModal, setActiveModal] = useState(null);

  // Target item for modals
  const [currentEditHomestay, setCurrentEditHomestay] = useState(null);
  const [currentDeleteHomestay, setCurrentDeleteHomestay] = useState(null);
  const [currentLockHomestay, setCurrentLockHomestay] = useState(null);
  const [currentPermissionRow, setCurrentPermissionRow] = useState(null);

  // Fetch real homestays from CSDL
  useEffect(() => {
    fetchRealHomestays();
  }, []);

  const fetchRealHomestays = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let response = await fetch('http://localhost:8081/api/admin/homestays', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        response = await fetch('http://localhost:8081/api/public/admin/homestays');
      }
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const activeId = localStorage.getItem('ownerActiveHomestayId');
          const mapped = data.map((item, idx) => ({
            id: item.id,
            name: item.name,
            address: item.address || (item.region !== 'N/A' ? item.region : 'Việt Nam'),
            provinceId: item.region || 'HN',
            ward: 'Phường trung tâm',
            specificAddress: item.address || item.name,
            image: item.img || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
            status: item.status === 'suspended' ? 'locked' : (item.status === 'active' ? 'active' : 'active'),
            revenue: `${(Math.random() * 120 + 65).toFixed(1)}M đ`,
            occupancy: item.status === 'suspended' ? 'Tạm khóa' : `${Math.floor(Math.random() * 20 + 75)}%`,
            weeklyBookings: item.status === 'suspended' ? 'Tạm khóa' : `${Math.floor(Math.random() * 25 + 15)} đơn`,
            rooms: item.rooms || 6,
            services: STANDARD_SERVICES.slice(0, 4),
            customServices: ['Dịch vụ bản địa cao cấp'],
            isCurrent: activeId ? String(item.id) === String(activeId) : idx === 0
          }));
          setHomestays(mapped);
        }
      }
    } catch (err) {
      console.error('Lỗi nạp danh sách homestay từ CSDL:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Add Homestay Form State ──────────────────────────────────────────
  const [newHomestay, setNewHomestay] = useState({
    name: '',
    provinceId: 'HN',
    ward: 'Phường trung tâm',
    specificAddress: '',
    rooms: 8,
    services: ['WiFi miễn phí', 'Bữa sáng miễn phí'],
    customServices: [],
    images: [],
    imageUrl: 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=800&q=80'
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
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 4000);
  };

  // ── Quick Permission Edit State ──────────────────────────────────────
  const [selectedQuickPerm, setSelectedQuickPerm] = useState('cash');

  // ── Search & Filter & Pagination State ───────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  const filteredHomestays = useMemo(() => {
    return homestays.filter(h => {
      const matchSearch = (h.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (h.address || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'all' ||
                          (statusFilter === 'active' && h.status === 'active') ||
                          (statusFilter === 'locked' && h.status === 'locked');
      return matchSearch && matchStatus;
    });
  }, [homestays, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredHomestays.length / ITEMS_PER_PAGE) || 1;

  const getPaginationPages = (current, total) => {
    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 3) {
      return [1, 2, 3, 4, '...', total];
    }
    if (current >= total - 2) {
      return [1, '...', total - 3, total - 2, total - 1, total];
    }
    return [1, '...', current - 1, current, current + 1, '...', total];
  };

  const paginatedHomestays = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredHomestays.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredHomestays, currentPage]);

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
      provinceId: NEW_34_PROVINCES[0]?.id || 'HN',
      ward: SAMPLE_WARDS[0] || 'Phường trung tâm',
      specificAddress: '',
      rooms: 8,
      services: ['WiFi miễn phí', 'Bữa sáng miễn phí'],
      customServices: [],
      images: [],
      imageUrl: 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=800&q=80'
    });
    setNewCustomServiceInput('');
    setAddHomestayError('');
    setActiveModal('addHomestay');
  };

  const openEditModal = (h) => {
    setCurrentEditHomestay(h);
    setEditForm({
      name: h.name,
      provinceId: h.provinceId || 'HN',
      ward: h.ward || SAMPLE_WARDS[0],
      specificAddress: h.specificAddress || h.address,
      services: h.services || [],
      customServices: h.customServices || [],
      isLocked: h.status === 'locked',
      lockType: h.lockType || '',
      lockNote: h.lockNote || '',
      lockUntil: h.lockUntil || '',
      images: [h.image]
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
    localStorage.setItem('ownerActiveHomestayId', String(id));
    setHomestays(prev =>
      prev.map(h => ({
        ...h,
        isCurrent: h.id === id
      }))
    );
    window.dispatchEvent(new Event('ownerActiveHomestayChanged'));
  };

  // ── Add Homestay Submit ──────────────────────────────────────────────
  const handleAddHomestaySubmit = async (e) => {
    e.preventDefault();
    if (!newHomestay.name.trim()) {
      setAddHomestayError('Vui lòng nhập tên cơ sở Homestay.');
      return;
    }

    const provId = newHomestay.provinceId || NEW_34_PROVINCES[0]?.id || 'HN';
    const wardName = newHomestay.ward || SAMPLE_WARDS[0] || 'Phường trung tâm';
    const specAddr = newHomestay.specificAddress.trim() || newHomestay.name.trim();

    const provinceObj = NEW_34_PROVINCES.find(p => p.id === provId);
    const fullAddress = `${specAddr}, ${wardName}, ${provinceObj ? provinceObj.name : 'Hà Nội'}`;
    const newImg = (newHomestay.imageUrl && newHomestay.imageUrl.trim())
      ? newHomestay.imageUrl.trim()
      : (newHomestay.images.length > 0 ? newHomestay.images[0] : 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=800&q=80');

    const newEntry = {
      id: Date.now(),
      name: newHomestay.name.trim(),
      address: fullAddress,
      provinceId: provId,
      ward: wardName,
      specificAddress: specAddr,
      image: newImg,
      status: 'active',
      revenue: '0 đ',
      occupancy: '0%',
      weeklyBookings: '0 đơn',
      rooms: Number(newHomestay.rooms) || 6,
      services: newHomestay.services,
      customServices: newHomestay.customServices,
      isCurrent: false
    };

    setHomestays(prev => [newEntry, ...prev]);
    closeModal();
    alert(`Đã khởi tạo thành công cơ sở homestay "${newHomestay.name.trim()}"!`);

    // Async DB save
    try {
      const token = localStorage.getItem('token');
      const payload = {
        name: newHomestay.name.trim(),
        city: provinceObj ? provinceObj.name : 'Hà Nội',
        address: fullAddress,
        rooms: Number(newHomestay.rooms) || 6,
        price: 890000,
        status: 'ACTIVE',
        img: newImg
      };

      let res = await fetch('http://localhost:8081/api/admin/homestays', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        await fetch('http://localhost:8081/api/public/admin/homestays', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      
      // Re-fetch real homestays from CSDL to get DB-assigned ID
      await fetchRealHomestays();
      window.dispatchEvent(new Event('ownerActiveHomestayChanged'));
    } catch (err) {
      console.error('Error saving homestay to CSDL:', err);
    }
  };

  // ── Edit Homestay Submit ─────────────────────────────────────────────
  const handleEditHomestaySubmit = async (e) => {
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
    const chosenImg = editForm.images.length > 0 ? editForm.images[0] : currentEditHomestay.image;

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
          image: chosenImg
        };
      })
    );

    // Đồng bộ tên homestay trong bảng nhân sự nếu có thay đổi
    if (currentEditHomestay.name !== editForm.name.trim()) {
      setStaffAssignments(prev =>
        prev.map(s => s.homestayName === currentEditHomestay.name ? { ...s, homestayName: editForm.name.trim() } : s)
      );
    }

    // Async DB update
    try {
      const token = localStorage.getItem('token');
      const payload = {
        name: editForm.name.trim(),
        city: provinceObj ? provinceObj.name : 'Khác',
        address: fullAddress,
        status: editForm.isLocked ? 'SUSPENDED' : 'ACTIVE',
        img: chosenImg
      };

      let res = await fetch(`http://localhost:8081/api/admin/homestays/${currentEditHomestay.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        await fetch(`http://localhost:8081/api/public/admin/homestays/${currentEditHomestay.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      // Status update
      let stRes = await fetch(`http://localhost:8081/api/admin/homestays/${currentEditHomestay.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: editForm.isLocked ? 'suspended' : 'active' })
      });
      if (!stRes.ok) {
        await fetch(`http://localhost:8081/api/public/admin/homestays/${currentEditHomestay.id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: editForm.isLocked ? 'suspended' : 'active' })
        });
      }
    } catch (err) {
      console.error('Error updating homestay in CSDL:', err);
    }

    closeModal();
  };

  // ── Delete Homestay ──────────────────────────────────────────────────
  const handleDeleteHomestay = async () => {
    if (!currentDeleteHomestay) return;
    const targetId = currentDeleteHomestay.id;
    const targetName = currentDeleteHomestay.name;

    setHomestays(prev => prev.filter(h => h.id !== targetId));
    setStaffAssignments(prev => prev.filter(s => s.homestayName !== targetName));

    // Async DB delete
    try {
      const token = localStorage.getItem('token');
      let res = await fetch(`http://localhost:8081/api/admin/homestays/${targetId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        await fetch(`http://localhost:8081/api/public/admin/homestays/${targetId}`, {
          method: 'DELETE'
        });
      }
    } catch (err) {
      console.error('Error deleting homestay from CSDL:', err);
    }

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
    showToast(`🎉 Cập nhật phân quyền thành công cho nhân viên "${staffForm.name}"!`);
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
    showToast('🎉 Đã cập nhật phân quyền cơ sở thành công!');
  };

  // ── Render Component ─────────────────────────────────────────────────
  return (
    <div className="manage-homestay-page">
      {/* ── Toast Notification Banner ── */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 99999,
          background: '#154332',
          color: '#ffffff',
          padding: '14px 22px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: 600,
          fontSize: '14px',
          animation: 'mh-fade-in 0.3s ease'
        }}>
          <span className="material-symbols-outlined" style={{ color: '#88d982', fontSize: '20px' }}>check_circle</span>
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage('')}
            style={{ background: 'none', border: 'none', color: '#ffffff', opacity: 0.8, cursor: 'pointer', marginLeft: '12px', fontSize: '15px' }}
          >
            ✕
          </button>
        </div>
      )}

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
            <span>Khởi tạo cơ sở mới</span>
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

      {/* ── 2.5. Search & Status Filter Bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '20px', flexWrap: 'wrap', background: '#ffffff', padding: '14px 18px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(11,28,48,0.06)', border: '1px solid rgba(192,200,194,0.4)' }}>
        {/* Status Filter Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => { setStatusFilter('all'); setCurrentPage(1); }}
            style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid #c0c8c2', background: statusFilter === 'all' ? '#154332' : '#ffffff', color: statusFilter === 'all' ? '#ffffff' : '#414944', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
          >
            Tất cả ({homestays.length})
          </button>
          <button
            type="button"
            onClick={() => { setStatusFilter('active'); setCurrentPage(1); }}
            style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid #c0c8c2', background: statusFilter === 'active' ? '#1b6d24' : '#ffffff', color: statusFilter === 'active' ? '#ffffff' : '#414944', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
          >
            Đang hoạt động ({kpiData.operating})
          </button>
          <button
            type="button"
            onClick={() => { setStatusFilter('locked'); setCurrentPage(1); }}
            style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid #c0c8c2', background: statusFilter === 'locked' ? '#ba1a1a' : '#ffffff', color: statusFilter === 'locked' ? '#ffffff' : '#414944', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
          >
            Tạm khóa ({kpiData.lockedCount})
          </button>
        </div>

        {/* Search Input Field */}
        <div className="mh-search-box-wrap">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginRight: '8px' }}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Tìm tên homestay, địa chỉ..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#717974', fontSize: '14px', padding: '0 2px', lineHeight: 1 }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── 3. Homestay Fleet Grid ── */}
      {paginatedHomestays.length === 0 ? (
        <div style={{ background: '#ffffff', padding: '40px 20px', textAlign: 'center', borderRadius: '12px', color: '#717974', marginBottom: '28px', border: '1px solid rgba(192,200,194,0.4)' }}>
          <i className="bi bi-search" style={{ fontSize: '36px', color: '#c0c8c2', display: 'block', marginBottom: '8px' }} />
          <p style={{ fontSize: '14px', margin: 0 }}>
            Không tìm thấy cơ sở Homestay nào phù hợp với từ khóa "{searchTerm}".
          </p>
        </div>
      ) : (
        <div className="mh-homestay-grid">
          {paginatedHomestays.map((h) => {
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
      )}

      {/* ── 3.5. Compact & Windowed Pagination Controls Bar ── */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', background: '#ffffff', borderRadius: '12px', marginBottom: '32px', border: '1px solid rgba(192,200,194,0.4)', flexWrap: 'wrap', gap: '12px' }}>
          <span style={{ fontSize: '13px', color: '#414944' }}>
            Hiển thị trang <strong>{currentPage}</strong> / <strong>{totalPages}</strong> (Tổng <strong>{filteredHomestays.length}</strong> cơ sở)
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #c0c8c2', background: currentPage === 1 ? '#f1f5f9' : '#ffffff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: '13px', color: currentPage === 1 ? '#94a3b8' : '#0b1c30' }}
            >
              ‹ Trang trước
            </button>
            {getPaginationPages(currentPage, totalPages).map((pg, idx) => {
              if (pg === '...') {
                return (
                  <span key={`dots-${idx}`} style={{ padding: '0 4px', color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>
                    ...
                  </span>
                );
              }
              return (
                <button
                  key={pg}
                  type="button"
                  onClick={() => setCurrentPage(pg)}
                  style={{ width: '32px', height: '32px', borderRadius: '6px', border: pg === currentPage ? 'none' : '1px solid #c0c8c2', background: pg === currentPage ? '#154332' : '#ffffff', color: pg === currentPage ? '#ffffff' : '#0b1c30', fontWeight: pg === currentPage ? 700 : 500, cursor: 'pointer', fontSize: '13px' }}
                >
                  {pg}
                </button>
              );
            })}
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #c0c8c2', background: currentPage === totalPages ? '#f1f5f9' : '#ffffff', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontSize: '13px', color: currentPage === totalPages ? '#94a3b8' : '#0b1c30' }}
            >
              Trang sau ›
            </button>
          </div>
        </div>
      )}

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
                    />
                  </div>

                  <div className="mh-form-group">
                    <label className="mh-form-label">
                      Tỉnh / Thành phố
                    </label>
                    <select
                      className="mh-form-select"
                      value={newHomestay.provinceId}
                      onChange={(e) => setNewHomestay({ ...newHomestay, provinceId: e.target.value, ward: SAMPLE_WARDS[0] })}
                    >
                      <option value="">-- Chọn Tỉnh/Thành --</option>
                      {NEW_34_PROVINCES.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mh-form-group">
                    <label className="mh-form-label">
                      Phường / Xã
                    </label>
                    <select
                      className="mh-form-select"
                      value={newHomestay.ward}
                      onChange={(e) => setNewHomestay({ ...newHomestay, ward: e.target.value })}
                    >
                      <option value="">-- Chọn Phường/Xã --</option>
                      {SAMPLE_WARDS.map((w, idx) => (
                        <option key={idx} value={w}>{w}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mh-form-group full-width">
                    <label className="mh-form-label">
                      Địa chỉ cụ thể (Thôn/Bản, Số nhà)
                    </label>
                    <input
                      type="text"
                      className="mh-form-input"
                      placeholder="Ví dụ: Bản Lác 2, số nhà 15"
                      value={newHomestay.specificAddress}
                      onChange={(e) => setNewHomestay({ ...newHomestay, specificAddress: e.target.value })}
                    />
                  </div>

                  <div className="mh-form-group full-width">
                    <label className="mh-form-label">
                      Hình ảnh đại diện Homestay (URL)
                    </label>
                    <input
                      type="text"
                      className="mh-form-input"
                      placeholder="https://images.unsplash.com/photo-..."
                      value={newHomestay.imageUrl || ''}
                      onChange={(e) => setNewHomestay({ ...newHomestay, imageUrl: e.target.value })}
                    />
                    {newHomestay.imageUrl && (
                      <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src={newHomestay.imageUrl} alt="Preview" style={{ width: '100px', height: '65px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #c0c8c2' }} />
                        <span style={{ fontSize: '12px', color: '#526056' }}>Xem trước hình ảnh đại diện</span>
                      </div>
                    )}
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
