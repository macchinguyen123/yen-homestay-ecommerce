import { useState, useEffect, useMemo, useRef } from 'react';
import './ManageDiscount.css';
import {
  INITIAL_VOUCHERS,
  VOUCHER_HISTORY_SEED,
  formatVND,
  toVN
} from './manageDiscountData';
import { ownerVoucherService } from '../../../services/ownerVoucherService';

const IMAGE_PRESETS = [
  { label: 'Mountain View', url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80' },
  { label: 'Dệt thổ cẩm', url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80' },
  { label: 'Mùa lúa chín', url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=80' },
  { label: 'Tour Trekking', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80' },
  { label: 'Nhà sàn mộc', url: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=600&q=80' },
  { label: 'Hoa ban Tây Bắc', url: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=600&q=80' }
];

export default function ManageDiscount() {
  // ─── Owner-scoped localStorage keys ─────────────────────────
  const getOwnerKey = (suffix) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      const uid = user?.id || 'guest';
      return `owner_${uid}_${suffix}`;
    } catch {
      return `owner_guest_${suffix}`;
    }
  };

  // ─── Active Homestay & Homestay List ─────────────────────────
  const [activeHomestayId, setActiveHomestayId] = useState(
    () => localStorage.getItem('ownerActiveHomestayId') || 'all'
  );
  const [homestaysList, setHomestaysList] = useState(() => {
    try {
      const saved = localStorage.getItem('owner_homestays');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // ─── Ref: prevent loadData overwrite after create ─────────────
  const skipNextLoadRef = useRef(false);

  // ─── Vouchers & History State ────────────────────────────────
  // Không đọc từ localStorage khi init để tránh stale data (pending → active sau approve)
  const [vouchers, setVouchers] = useState([]);
  const [history, setHistory] = useState([]);

  const [loading, setLoading] = useState(false);

  // ─── Filter & Search ──────────────────────────────────────────
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('default');

  // ─── Pagination ───────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 6; // số card mỗi trang

  // Sync to per-account localStorage (chỉ dùng để khôi phục khi backend offline)
  useEffect(() => {
    if (vouchers.length === 0) return; // Không ghi đè khi chưa load xong
    try {
      localStorage.setItem(getOwnerKey('vouchers_data'), JSON.stringify(vouchers));
    } catch (_) {}
  }, [vouchers]);

  useEffect(() => {
    if (history.length === 0) return;
    try {
      localStorage.setItem(getOwnerKey('voucher_history'), JSON.stringify(history));
    } catch (_) {}
  }, [history]);

  // Fetch homestays list (chỉ lấy các homestay thuộc quyền quản lý của owner này)
  const fetchHomestays = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      const uid = user?.id;
      const url = uid
        ? `http://localhost:8081/api/public/admin/homestays?ownerId=${uid}`
        : 'http://localhost:8081/api/public/homestays';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setHomestaysList(data);
          try {
            localStorage.setItem(
              getOwnerKey('homestays'),
              JSON.stringify(data.map((h) => ({ id: h.id, name: h.name, city: h.city || '' })))
            );
          } catch (e) {}
        }
      }
    } catch (err) {
      console.warn('Lỗi lấy danh sách homestay:', err);
    }
  };

  // Load TẤT CẢ vouchers của owner từ backend (không filter homestay ở API)
  // Filter homestay được thực hiện client-side trong filteredVouchers
  const loadData = async () => {
    setLoading(true);
    try {
      const list = await ownerVoucherService.getVouchers();
      if (list && Array.isArray(list)) {
        // Backend đã trả về đúng và đầy đủ — dùng trực tiếp, không merge cache
        setVouchers(list);
        try {
          localStorage.setItem(getOwnerKey('vouchers_data'), JSON.stringify(list));
        } catch (_) {}
      } else {
        // Chỉ fallback localStorage khi backend không phản hồi
        const saved = localStorage.getItem(getOwnerKey('vouchers_data'));
        if (saved) {
          setVouchers(JSON.parse(saved));
        } else {
          setVouchers([]);
        }
      }

      const hist = await ownerVoucherService.getHistory();
      if (hist && Array.isArray(hist) && hist.length > 0) {
        setHistory(hist);
      }
    } catch (err) {
      console.warn('Lỗi khi tải dữ liệu voucher:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Xóa cache cũ để đảm bảo luôn fetch fresh từ backend
    ownerVoucherService.clearCache();
    fetchHomestays();
    loadData();

    const handleSync = () => {
      const stored = localStorage.getItem('ownerActiveHomestayId') || 'all';
      setActiveHomestayId(stored);
      // Không gọi loadData() ở đây - activeHomestayId chỉ ảnh hưởng client-side filter
    };
    window.addEventListener('ownerActiveHomestayChanged', handleSync);

    // Xử lý sự kiện duyệt / từ chối / tạo mã từ Admin hoặc tab khác
    const handleSyncPayload = (data) => {
      if (!data) return;
      if (data.type === 'VOUCHER_APPROVED') {
        // Cập nhật ngay state + xóa cache để lần focus tới fetch lại
        ownerVoucherService.clearCache();
        setVouchers((prev) => {
          const updated = prev.map((v) =>
            String(v.id) === String(data.id) || (data.code && v.code === data.code)
              ? { ...v, status: 'active', rawStatus: 'ACTIVE' }
              : v
          );
          try {
            localStorage.setItem(getOwnerKey('vouchers_data'), JSON.stringify(updated));
          } catch (_) {}
          return updated;
        });
        showToast(`✅ Mã "${data.code || data.id}" vừa được Admin phê duyệt kích hoạt!`);
      } else if (data.type === 'VOUCHER_REJECTED') {
        ownerVoucherService.clearCache();
        setVouchers((prev) => {
          const updated = prev.map((v) =>
            String(v.id) === String(data.id) || (data.code && v.code === data.code)
              ? { ...v, status: 'rejected', rawStatus: 'REJECTED' }
              : v
          );
          try {
            localStorage.setItem(getOwnerKey('vouchers_data'), JSON.stringify(updated));
          } catch (_) {}
          return updated;
        });
        showToast(`❌ Mã "${data.code || data.id}" đã bị Admin từ chối phê duyệt!`, 'error');
      } else if (data.type === 'VOUCHER_CREATED' && data.voucher) {
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        const uid = user?.id ? String(user.id) : null;
        if (!data.voucher.ownerId || String(data.voucher.ownerId) === String(uid)) {
          setVouchers((prev) => {
            if (prev.some((v) => v.code === data.voucher.code)) return prev;
            const updated = [data.voucher, ...prev];
            try {
              localStorage.setItem(getOwnerKey('vouchers_data'), JSON.stringify(updated));
            } catch (_) {}
            return updated;
          });
        }
      }
      // Đồng bộ lại với backend sau khi cập nhật optimistic
      loadData();
    };

    let channel = null;
    try {
      if ('BroadcastChannel' in window) {
        channel = new BroadcastChannel('voucher_channel');
        channel.onmessage = (event) => {
          handleSyncPayload(event.data);
        };
      }
    } catch (_) {}

    const handleStorage = (e) => {
      if (e.key === 'voucher_sync_event' && e.newValue) {
        try {
          handleSyncPayload(JSON.parse(e.newValue));
        } catch (_) {
          loadData();
        }
      }
      // Không trigger loadData() khi vouchers_data thay đổi - tránh reload loop
    };
    window.addEventListener('storage', handleStorage);

    const handleCustomSync = (e) => {
      handleSyncPayload(e.detail);
    };
    window.addEventListener('voucher_sync_event', handleCustomSync);
    window.addEventListener('voucher_approved', handleCustomSync);
    window.addEventListener('voucher_rejected', handleCustomSync);
    window.addEventListener('voucher_created', handleCustomSync);
    // Khi user quay lại tab: xóa cache + fetch fresh (bắt được approve từ admin tab khác)
    const handleFocus = () => {
      ownerVoucherService.clearCache();
      loadData();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('ownerActiveHomestayChanged', handleSync);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('voucher_sync_event', handleCustomSync);
      window.removeEventListener('voucher_approved', handleCustomSync);
      window.removeEventListener('voucher_rejected', handleCustomSync);
      window.removeEventListener('voucher_created', handleCustomSync);
      window.removeEventListener('focus', handleFocus);
      if (channel) channel.close();
    };
  }, []);

  // Khi activeHomestayId thay đổi: chỉ reset page, KHÔNG gọi loadData lại
  // vì tất cả vouchers đã được fetch và filter là client-side
  useEffect(() => {
    setCurrentPage(1);
    if (skipNextLoadRef.current) {
      skipNextLoadRef.current = false;
    }
  }, [activeHomestayId]);

  // Reset page khi filter / search thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery]);

  const handleSwitchHomestay = (newId) => {
    setActiveHomestayId(newId);
    localStorage.setItem('ownerActiveHomestayId', String(newId));
    window.dispatchEvent(new Event('ownerActiveHomestayChanged'));
  };


  // ─── Toast System ─────────────────────────────────────────────
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  };

  // ─── Modals State ─────────────────────────────────────────────
  const [activeModal, setActiveModal] = useState(null); // 'add' | 'edit' | 'detail' | 'history' | 'delete'
  const [selectedVoucher, setSelectedVoucher] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    homestayId: '',
    type: 'percent',
    value: '',
    maxDiscount: '',
    minOrder: '',
    usageLimit: 100,
    perUser: 1,
    start: new Date().toISOString().split('T')[0],
    end: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
    audience: 'Công khai toàn sàn',
    description: '',
    active: true,
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80'
  });

  const [deleteReason, setDeleteReason] = useState('Hết ngân sách khuyến mãi');
  const [deleteNotify, setDeleteNotify] = useState(true);

  const closeModal = () => {
    setActiveModal(null);
  };

  // ─── Handlers: Copy Code ──────────────────────────────────────
  const handleCopyCode = (code) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(code);
    }
    showToast(`Đã sao chép mã "${code}"`);
  };

  // ─── Handlers: Toggle Status ──────────────────────────────────
  const handleToggleStatus = async (voucher) => {
    if (voucher.status === 'pending') {
      showToast(`Mã "${voucher.code}" đang chờ Admin phê duyệt, chưa thể bật/tắt!`, 'error');
      return;
    }
    if (voucher.status === 'rejected') {
      showToast(`Mã "${voucher.code}" đã bị Admin từ chối, vui lòng chỉnh sửa và gửi duyệt lại!`, 'error');
      return;
    }
    const current = voucher.status;
    const next = current === 'active' ? 'ended' : 'active';

    setVouchers((prev) =>
      prev.map((v) => (v.code === voucher.code ? { ...v, status: next } : v))
    );
    showToast(`Đã ${next === 'active' ? 'kích hoạt' : 'tạm ngưng'} mã "${voucher.code}"`);

    try {
      if (voucher.id) {
        await ownerVoucherService.toggleStatus(voucher.id);
      }
    } catch (err) {
      console.warn('Lỗi gọi API toggle voucher, cập nhật cục bộ:', err.message);
    }
  };

  // ─── Handlers: Modal Openers ──────────────────────────────────
  const openAddModal = () => {
    const defaultHs = activeHomestayId && activeHomestayId !== 'all' ? activeHomestayId : '';
    setFormData({
      code: '',
      name: '',
      homestayId: defaultHs,
      type: 'percent',
      value: '',
      maxDiscount: '',
      minOrder: '',
      usageLimit: 100,
      perUser: 1,
      start: new Date().toISOString().split('T')[0],
      end: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
      audience: 'Công khai toàn sàn',
      description: '',
      active: true,
      image: IMAGE_PRESETS[0].url
    });
    setActiveModal('add');
  };

  const openEditModal = (v) => {
    setSelectedVoucher(v);
    setFormData({
      code: v.code,
      name: v.name,
      homestayId: v.homestayId || '',
      type: v.type,
      value: v.value,
      maxDiscount: v.maxDiscount || '',
      minOrder: v.minOrder || '',
      usageLimit: v.usageLimit,
      perUser: v.perUser || 1,
      start: v.start,
      end: v.end,
      audience: v.audience || 'Công khai toàn sàn',
      description: v.description || '',
      active: v.status !== 'ended',
      image: v.image || IMAGE_PRESETS[0].url
    });
    setActiveModal('edit');
  };

  const openDetailModal = (v) => {
    setSelectedVoucher(v);
    setActiveModal('detail');
  };

  const openDeleteModal = (v) => {
    setSelectedVoucher(v);
    setActiveModal('delete');
  };

  // ─── Handlers: Form Saves ─────────────────────────────────────
  const handleSaveVoucher = async (e) => {
    e.preventDefault();
    const code = formData.code.trim().toUpperCase();
    if (!code || !formData.name.trim() || !formData.value) {
      showToast('Vui lòng điền đủ thông tin mã giảm giá', 'error');
      return;
    }

    const selectedHs = homestaysList.find(
      (h) => String(h.id) === String(formData.homestayId)
    );
    const hsName = selectedHs
      ? selectedHs.name
      : formData.homestayId
      ? 'Homestay'
      : 'Toàn bộ cơ sở YÊN';

    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const currentOwnerId = user?.id ? Number(user.id) : null;

    const payload = {
      ...formData,
      code,
      ownerId: currentOwnerId,
      homestayId: formData.homestayId ? Number(formData.homestayId) : null,
      homestayName: hsName,
      value: Number(formData.value),
      maxDiscount: Number(formData.maxDiscount) || 0,
      minOrder: Number(formData.minOrder) || 0,
      usageLimit: Number(formData.usageLimit) || 100,
      perUser: Number(formData.perUser) || 1,
      status: activeModal === 'edit'
        ? (formData.active ? 'active' : 'ended')
        : 'pending',
      used: selectedVoucher ? selectedVoucher.used : 0
    };

    try {
      if (activeModal === 'edit' && selectedVoucher) {
        if (selectedVoucher.id) {
          await ownerVoucherService
            .updateVoucher(selectedVoucher.id, payload)
            .catch((err) => console.warn(err));
        }
        setVouchers((prev) =>
          prev.map((v) => (v.code === selectedVoucher.code ? { ...v, ...payload } : v))
        );
        showToast(`Đã cập nhật mã "${code}"`);
      } else {
        // Check duplicate code locally
        if (vouchers.some((v) => v.code === code)) {
          showToast(`Mã "${code}" đã tồn tại! Vui lòng chọn mã khác.`, 'error');
          return;
        }

        let createdObj = { ...payload, status: 'pending', id: Date.now(), homestayName: hsName };
        try {
          const res = await ownerVoucherService.createVoucher(payload);
          if (res && res.id) createdObj = { ...payload, id: res.id, status: 'pending', homestayName: hsName };
        } catch (err) {
          console.warn('Lưu voucher lên máy chủ gặp lỗi, lưu cục bộ:', err.message);
        }

        // Set flag to skip next loadData triggered by setActiveHomestayId('all')
        skipNextLoadRef.current = true;
        // Tự động chuyển bộ chọn homestay về 'all' để mã mới tạo chắc chắn được nhìn thấy
        setActiveHomestayId('all');
        localStorage.setItem('ownerActiveHomestayId', 'all');
        window.dispatchEvent(new Event('ownerActiveHomestayChanged'));

        setVouchers((prev) => [createdObj, ...prev.filter((v) => v.code !== code)]);
        // Chuyển về tab "Tất cả" và trang 1 để mã mới tạo (chờ duyệt) hiện ngay đầu tiên bên trái
        setFilter('all');
        setCurrentPage(1);
        setHistory((prev) => [
          {
            name: payload.name,
            code: payload.code,
            period: `${toVN(payload.start)} - ${toVN(payload.end)}`,
            used: 0,
            limit: payload.usageLimit,
            revenue: 0,
            status: 'pending'
          },
          ...prev
        ]);

        // Phát tín hiệu ngay lập tức sang phía Admin để Admin thấy mã xuất hiện liền
        try {
          const syncData = { type: 'VOUCHER_CREATED', id: createdObj.id, code: createdObj.code, ts: Date.now(), voucher: createdObj };
          localStorage.setItem('voucher_sync_event', JSON.stringify(syncData));
          window.dispatchEvent(new CustomEvent('voucher_created', { detail: syncData }));
          if ('BroadcastChannel' in window) {
            const bc = new BroadcastChannel('voucher_channel');
            bc.postMessage(syncData);
            bc.close();
          }
        } catch (syncErr) {
          console.warn('Lỗi đồng bộ sync event:', syncErr);
        }

        showToast(`Đã gửi duyệt mã "${code}" thành công — Xuất hiện trên trang quản trị Admin ngay lập tức!`);
      }
      closeModal();
    } catch (err) {
      showToast(err.message || 'Lỗi lưu mã giảm giá', 'error');
    }
  };

  const handleConfirmDelete = async (e) => {
    e.preventDefault();
    if (!selectedVoucher) return;
    try {
      if (selectedVoucher.id) {
        await ownerVoucherService
          .deleteVoucher(selectedVoucher.id)
          .catch((err) => console.warn(err));
      }
    } catch (err) {
      console.warn('Lỗi xoá trên máy chủ:', err.message);
    }
    setVouchers((prev) => prev.filter((v) => v.code !== selectedVoucher.code));
    showToast(`Đã xoá mã "${selectedVoucher.code}"`);
    closeModal();
  };

  // ─── Filter & Search Logic ────────────────────────────────────
  // ─── Filter & Search Logic ────────────────────────────────────
  const filteredVouchers = useMemo(() => {
    const list = vouchers.filter((v) => {
      // Status flags
      const vStatus = (v.status || '').toLowerCase();
      const vRaw = (v.rawStatus || '').toLowerCase();
      const isRejected = vStatus === 'rejected' || vRaw === 'rejected';
      const isPending = vStatus === 'pending' || vRaw === 'pending';
      const isActive = (vStatus === 'active' || vRaw === 'active') && !isRejected && !isPending;
      const isEnded = (vStatus === 'ended' || vStatus === 'disabled' || vRaw === 'disabled' || vRaw === 'ended') && !isRejected;
      const isUpcoming = vStatus === 'upcoming';

      // Status filter
      let matchFilter = true;
      if (filter === 'rejected') matchFilter = isRejected;
      else if (filter === 'pending') matchFilter = isPending;
      else if (filter === 'active') matchFilter = isActive;
      else if (filter === 'ended') matchFilter = isEnded;
      else if (filter === 'upcoming') matchFilter = isUpcoming;
      else if (filter === 'all') matchFilter = true;

      // Homestay filter:
      // Tab pending/rejected: LUÔN hiện tất cả bất kể activeHomestayId
      // (vì đây là trạng thái quan trọng, owner cần thấy dù đang chọn homestay nào)
      const skipHomestayFilter = isPending || isRejected;

      let matchHs = true;
      if (!skipHomestayFilter) {
        const isHomestaySelected =
          activeHomestayId &&
          activeHomestayId !== 'all' &&
          activeHomestayId !== 'null' &&
          activeHomestayId !== 'undefined';

        const isValidHomestay =
          isHomestaySelected &&
          homestaysList.some((h) => String(h.id) === String(activeHomestayId));

        matchHs =
          !isValidHomestay ||
          !v.homestayId ||
          String(v.homestayId) === String(activeHomestayId);
      }

      // Text search
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (v.code && v.code.toLowerCase().includes(q)) ||
        (v.name && v.name.toLowerCase().includes(q)) ||
        (v.homestayName && v.homestayName.toLowerCase().includes(q));

      // Date range filter
      let matchDate = true;
      if (dateFrom || dateTo) {
        const vStart = v.start ? new Date(v.start) : null;
        const vEnd = v.end ? new Date(v.end) : null;
        if (dateFrom && vEnd && vEnd < new Date(dateFrom)) matchDate = false;
        if (dateTo && vStart && vStart > new Date(dateTo + 'T23:59:59')) matchDate = false;
      }

      return matchHs && matchFilter && matchSearch && matchDate;
    });

    // Sắp xếp voucher
    if (sortBy === 'value-desc') {
      list.sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0));
    } else if (sortBy === 'value-asc') {
      list.sort((a, b) => (Number(a.value) || 0) - (Number(b.value) || 0));
    } else if (sortBy === 'end-asc') {
      list.sort((a, b) => {
        const da = a.end ? new Date(a.end) : new Date(9999, 11, 31);
        const db = b.end ? new Date(b.end) : new Date(9999, 11, 31);
        return da - db;
      });
    } else if (sortBy === 'name-asc') {
      list.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'vi'));
    }

    // Tab "Tất cả": pending luôn lên đầu, rejected tiếp theo, rồi active
    if (filter === 'all' && sortBy === 'default') {
      const pendingList = list.filter((v) => {
        const s = (v.status || '').toLowerCase();
        const r = (v.rawStatus || '').toLowerCase();
        return s === 'pending' || r === 'pending';
      });
      const rejectedList = list.filter((v) => {
        const s = (v.status || '').toLowerCase();
        const r = (v.rawStatus || '').toLowerCase();
        return s === 'rejected' || r === 'rejected';
      });
      const otherList = list.filter((v) => {
        const s = (v.status || '').toLowerCase();
        const r = (v.rawStatus || '').toLowerCase();
        return s !== 'pending' && r !== 'pending' && s !== 'rejected' && r !== 'rejected';
      });
      return [...pendingList, ...rejectedList, ...otherList];
    }
    return list;
  }, [vouchers, activeHomestayId, homestaysList, filter, searchQuery, dateFrom, dateTo, sortBy]);

  // ─── Pagination derived values ────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filteredVouchers.length / PAGE_SIZE));
  // Reset về trang 1 khi filter/search/homestay thay đổi
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const safePage = Math.min(currentPage, totalPages);
  const pagedVouchers = filter === 'all'
    ? filteredVouchers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
    : filteredVouchers; // các tab khác hiện toàn bộ (thường ít mã)

  // ─── Dynamic KPI Calculations ─────────────────────────────────
  const pendingCount = useMemo(
    () => vouchers.filter((v) => {
      const s = (v.status || '').toLowerCase();
      const r = (v.rawStatus || '').toLowerCase();
      return s === 'pending' || r === 'pending';
    }).length,
    [vouchers]
  );
  const activeCount = useMemo(
    () => vouchers.filter((v) => {
      const s = (v.status || '').toLowerCase();
      const r = (v.rawStatus || '').toLowerCase();
      const isRej = s === 'rejected' || r === 'rejected';
      const isPend = s === 'pending' || r === 'pending';
      return (s === 'active' || r === 'active') && !isRej && !isPend;
    }).length,
    [vouchers]
  );
  const upcomingCount = useMemo(
    () => vouchers.filter((v) => (v.status || '').toLowerCase() === 'upcoming').length,
    [vouchers]
  );
  const endedCount = useMemo(
    () => vouchers.filter((v) => {
      const s = (v.status || '').toLowerCase();
      const r = (v.rawStatus || '').toLowerCase();
      const isRej = s === 'rejected' || r === 'rejected';
      return (s === 'ended' || s === 'disabled' || r === 'disabled' || r === 'ended') && !isRej;
    }).length,
    [vouchers]
  );
  const rejectedCount = useMemo(
    () => vouchers.filter((v) => {
      const s = (v.status || '').toLowerCase();
      const r = (v.rawStatus || '').toLowerCase();
      return s === 'rejected' || r === 'rejected';
    }).length,
    [vouchers]
  );

  const totalUsed = useMemo(
    () => vouchers.reduce((acc, v) => acc + (v.used || 0), 0),
    [vouchers]
  );

  const totalRevenue = useMemo(() => {
    return vouchers.reduce(
      (acc, v) => acc + (v.revenue ? Number(v.revenue) : (v.used || 0) * 1750000),
      0
    );
  }, [vouchers]);

  const totalDiscountInvested = useMemo(() => {
    return vouchers.reduce((acc, v) => {
      const used = v.used || 0;
      let singleCost = 0;
      if (v.type === 'percent') {
        const calculated = (1750000 * (Number(v.value) || 0)) / 100;
        singleCost = v.maxDiscount > 0 ? Math.min(calculated, Number(v.maxDiscount)) : calculated;
      } else {
        singleCost = Number(v.value) || 0;
      }
      return acc + singleCost * used;
    }, 0);
  }, [vouchers]);

  const roiRate = useMemo(() => {
    if (totalDiscountInvested > 0) {
      return (totalRevenue / totalDiscountInvested).toFixed(1);
    }
    return '12.1';
  }, [totalRevenue, totalDiscountInvested]);

  // Top performing voucher
  const topVoucher = useMemo(() => {
    if (vouchers.length === 0) return null;
    return [...vouchers].sort((a, b) => (b.used || 0) - (a.used || 0))[0];
  }, [vouchers]);

  const currentHomestayName = useMemo(() => {
    if (!activeHomestayId || activeHomestayId === 'all') return 'Tất cả cơ sở Homestay';
    const found = homestaysList.find((h) => String(h.id) === String(activeHomestayId));
    return found ? found.name : 'Tất cả cơ sở Homestay';
  }, [homestaysList, activeHomestayId]);

  return (
    <div className="manage-discount-page">
      {/* Toast Notification */}
      {toast && (
        <div className={`service-toast-alert ${toast.type}`}>
          <i
            className={`bi ${
              toast.type === 'error' ? 'bi-exclamation-triangle' : 'bi-check-circle-fill'
            } me-2`}
          />
          {toast.message}
        </div>
      )}

      {/* TOP BANNER */}
      <div className="discount-banner-card">
        <div className="discount-banner-glow" />
        <div className="discount-banner-content">
          <div>
            <div className="discount-badge-tag">
              <i className="bi bi-ticket-perforated-fill" />
              Khuyến mãi &amp; Kích cầu lưu trú
            </div>
            <h1 className="discount-title">Quản lý Mã giảm giá &amp; Voucher Homestay</h1>
            <p className="discount-subtitle">
              Đang xem chiến dịch tại: <strong>{currentHomestayName}</strong>. Thiết lập các mã ưu đãi
              đặt phòng, tri ân du khách tham gia nhiệm vụ văn hóa bản địa và các đợt kích cầu mùa cao điểm.
            </p>
          </div>
          <div className="discount-header-actions">
            <button
              className="btn-secondary-action"
              onClick={() => setActiveModal('history')}
              title="Xem các đợt phát hành trước"
            >
              <i className="bi bi-clock-history" />
              <span>Lịch sử phát hành</span>
            </button>
            <button className="btn-primary-action" onClick={openAddModal}>
              <i className="bi bi-plus-circle-fill" />
              <span>Tạo mã giảm giá mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 KPI CARDS */}
      <div className="discount-kpi-grid">
        <div className="discount-kpi-box">
          <div className="kpi-top-row">
            <div className="kpi-icon-square green">
              <i className="bi bi-tag-fill" />
            </div>
            <span className="kpi-badge-pill green">Đang hoạt động</span>
          </div>
          <div className="kpi-body-number">
            <span className="kpi-big-num">{activeCount.toString().padStart(2, '0')}</span>
            <span className="kpi-unit-label">mã</span>
            <div className="kpi-desc-text">Mã đang kích hoạt</div>
          </div>
          <div className="kpi-foot-row">
            <span>{upcomingCount > 0 ? `${upcomingCount} mã sắp chạy` : 'Sẵn sàng áp dụng'}</span>
            <i className="bi bi-check-circle-fill text-success" />
          </div>
        </div>

        <div className="discount-kpi-box">
          <div className="kpi-top-row">
            <div className="kpi-icon-square emerald">
              <i className="bi bi-gift-fill" />
            </div>
            <span className="kpi-badge-pill green">+22% đợt này</span>
          </div>
          <div className="kpi-body-number">
            <span className="kpi-big-num">{totalUsed}</span>
            <span className="kpi-unit-label">lượt</span>
            <div className="kpi-desc-text">Tổng lượt du khách dùng</div>
          </div>
          <div className="kpi-foot-row">
            <span>Tăng trưởng đặt phòng</span>
            <i className="bi bi-graph-up-arrow text-success" />
          </div>
        </div>

        <div className="discount-kpi-box">
          <div className="kpi-top-row">
            <div className="kpi-icon-square blue">
              <i className="bi bi-cash-stack" />
            </div>
            <span className="kpi-badge-pill">Doanh số thúc đẩy</span>
          </div>
          <div className="kpi-body-number">
            <span className="kpi-big-num">{formatVND(totalRevenue)}</span>
            <div className="kpi-desc-text">Doanh thu qua Voucher</div>
          </div>
          <div className="kpi-foot-row">
            <span>Gắn liền booking thực tế</span>
            <i className="bi bi-pie-chart-fill text-primary" />
          </div>
        </div>

        <div className="discount-kpi-box">
          <div className="kpi-top-row">
            <div className="kpi-icon-square amber">
              <i className="bi bi-piggy-bank-fill" />
            </div>
            <span className="kpi-badge-pill amber">ROI {roiRate}x</span>
          </div>
          <div className="kpi-body-number">
            <span className="kpi-big-num">
              {formatVND(totalDiscountInvested > 0 ? totalDiscountInvested : 7800000)}
            </span>
            <div className="kpi-desc-text">Chi phí giảm giá đầu tư</div>
          </div>
          <div className="kpi-foot-row">
            <span>1đ ưu đãi thu về {roiRate}đ</span>
            <i className="bi bi-lightning-charge-fill text-warning" />
          </div>
        </div>
      </div>

      {/* FILTER STRIP WITH HOMESTAY SELECTOR */}
      <div className="discount-filter-strip">
        {/* ROW 1: Status Tabs */}
        <div className="discount-filter-tabs-row">
          <div className="discount-tabs-list">
            {[
              { key: 'all', label: `Tất cả (${vouchers.length})` },
              { key: 'pending', label: `Chờ duyệt (${pendingCount})`, amber: true },
              { key: 'active', label: `Đang chạy (${activeCount})` },
              { key: 'upcoming', label: `Sắp diễn ra (${upcomingCount})` },
              { key: 'ended', label: `Đã kết thúc (${endedCount})` },
              { key: 'rejected', label: `Bị từ chối (${rejectedCount})`, red: true }
            ].map((tab) => (
              <button
                key={tab.key}
                className={`discount-tab-btn ${filter === tab.key ? 'active' : ''} ${
                  tab.amber ? 'discount-tab-btn--amber' : ''
                } ${tab.red ? 'discount-tab-btn--red' : ''}`}
                onClick={() => { setFilter(tab.key); setCurrentPage(1); }}
              >
                {tab.label}
                {tab.amber && pendingCount > 0 && <span className="discount-pending-dot" />}
                {tab.red && rejectedCount > 0 && <span className="discount-rejected-dot" />}
              </button>
            ))}
          </div>
        </div>

        {/* ROW 2: Filter Controls (Homestay select, Search, Date range, Sort & Reset) */}
        <div className="discount-filter-controls-row" style={{ flexWrap: 'wrap', gap: '10px' }}>
          <div className="discount-hs-select-wrap">
            <i className="bi bi-house-door" />
            <select
              className="discount-hs-select"
              value={activeHomestayId}
              onChange={(e) => handleSwitchHomestay(e.target.value)}
            >
              <option value="all">Tất cả homestay ({homestaysList.length || 0})</option>
              {homestaysList.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>

          <div className="discount-search-box">
            <i className="bi bi-search" />
            <input
              type="text"
              placeholder="Tìm mã hoặc tên voucher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="discount-search-clear"
                onClick={() => setSearchQuery('')}
                title="Xóa tìm kiếm"
              >
                <i className="bi bi-x" />
              </button>
            )}
          </div>

          {/* Presets: Tất cả, 1 tuần, 1 tháng, 1 năm */}
          <div style={{ display: 'inline-flex', background: '#f1f5f9', borderRadius: '8px', padding: '2px', gap: '2px' }}>
            <button
              type="button"
              className="discount-tab-btn"
              style={{
                padding: '4px 10px',
                fontSize: '12px',
                background: !dateFrom && !dateTo ? '#166534' : 'transparent',
                color: !dateFrom && !dateTo ? '#fff' : '#475569',
                borderRadius: '6px'
              }}
              onClick={() => { setDateFrom(''); setDateTo(''); setCurrentPage(1); }}
            >
              Tất cả
            </button>
            <button
              type="button"
              className="discount-tab-btn"
              style={{
                padding: '4px 10px',
                fontSize: '12px',
                background: dateFrom && dateTo && Math.round((new Date(dateTo) - new Date(dateFrom)) / 86400000) <= 8 ? '#166534' : 'transparent',
                color: dateFrom && dateTo && Math.round((new Date(dateTo) - new Date(dateFrom)) / 86400000) <= 8 ? '#fff' : '#475569',
                borderRadius: '6px'
              }}
              onClick={() => {
                const end = new Date();
                const start = new Date(Date.now() - 7 * 86400000);
                setDateFrom(start.toISOString().split('T')[0]);
                setDateTo(end.toISOString().split('T')[0]);
                setCurrentPage(1);
              }}
            >
              1 tuần
            </button>
            <button
              type="button"
              className="discount-tab-btn"
              style={{
                padding: '4px 10px',
                fontSize: '12px',
                background: dateFrom && dateTo && Math.round((new Date(dateTo) - new Date(dateFrom)) / 86400000) > 8 && Math.round((new Date(dateTo) - new Date(dateFrom)) / 86400000) <= 35 ? '#166534' : 'transparent',
                color: dateFrom && dateTo && Math.round((new Date(dateTo) - new Date(dateFrom)) / 86400000) > 8 && Math.round((new Date(dateTo) - new Date(dateFrom)) / 86400000) <= 35 ? '#fff' : '#475569',
                borderRadius: '6px'
              }}
              onClick={() => {
                const end = new Date();
                const start = new Date(Date.now() - 30 * 86400000);
                setDateFrom(start.toISOString().split('T')[0]);
                setDateTo(end.toISOString().split('T')[0]);
                setCurrentPage(1);
              }}
            >
              1 tháng
            </button>
            <button
              type="button"
              className="discount-tab-btn"
              style={{
                padding: '4px 10px',
                fontSize: '12px',
                background: dateFrom && dateTo && Math.round((new Date(dateTo) - new Date(dateFrom)) / 86400000) > 35 ? '#166534' : 'transparent',
                color: dateFrom && dateTo && Math.round((new Date(dateTo) - new Date(dateFrom)) / 86400000) > 35 ? '#fff' : '#475569',
                borderRadius: '6px'
              }}
              onClick={() => {
                const end = new Date();
                const start = new Date(Date.now() - 365 * 86400000);
                setDateFrom(start.toISOString().split('T')[0]);
                setDateTo(end.toISOString().split('T')[0]);
                setCurrentPage(1);
              }}
            >
              1 năm
            </button>
          </div>

          {/* Lọc theo khoảng ngày hiệu lực */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '4px 10px' }}>
            <i className="bi bi-calendar-event" style={{ color: '#166534', fontSize: '13px' }} />
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Từ:</span>
            <input
              type="date"
              style={{ border: 'none', background: 'transparent', fontSize: '12px', color: '#1e293b', outline: 'none' }}
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
            />
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Đến:</span>
            <input
              type="date"
              style={{ border: 'none', background: 'transparent', fontSize: '12px', color: '#1e293b', outline: 'none' }}
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
            />
          </div>

          {/* Sắp xếp */}
          <div className="discount-hs-select-wrap">
            <i className="bi bi-sort-down" />
            <select
              className="discount-hs-select"
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
              title="Sắp xếp danh sách voucher"
            >
              <option value="default">Sắp xếp mặc định</option>
              <option value="value-desc">Giảm nhiều nhất</option>
              <option value="value-asc">Giảm ít nhất</option>
              <option value="end-asc">Sắp hết hạn trước</option>
              <option value="name-asc">Tên voucher A-Z</option>
            </select>
          </div>

          {/* Nút Đặt lại */}
          {(searchQuery || dateFrom || dateTo || sortBy !== 'default' || filter !== 'all' || (activeHomestayId && activeHomestayId !== 'all')) && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setDateFrom('');
                setDateTo('');
                setSortBy('default');
                setFilter('all');
                handleSwitchHomestay('all');
                setCurrentPage(1);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid #fecaca',
                background: '#fee2e2',
                color: '#dc2626',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Đặt lại bộ lọc về mặc định"
            >
              <i className="bi bi-arrow-counterclockwise" />
              Đặt lại
            </button>
          )}
        </div>
      </div>

      {/* MAIN TWO-COLUMN CONTENT */}
      <div className="discount-main-grid">
        {/* LEFT COLUMN: TICKETS */}
        <div>
          {/* VOUCHER TICKETS GRID */}
          {filteredVouchers.length === 0 ? (
            <div className="discount-empty-state">
              <div className="empty-icon-wrap">
                <i className="bi bi-ticket-perforated" />
              </div>
              <h4>Không tìm thấy mã giảm giá phù hợp</h4>
              <p>
                {searchQuery
                  ? `Không có mã nào chứa từ khóa "${searchQuery}". Hãy thử tìm kiếm bằng mã khác.`
                  : 'Chưa có mã giảm giá nào trong danh mục hoặc cơ sở được chọn.'}
              </p>
              <div className="d-flex justify-content-center gap-2 mt-3">
                {searchQuery && (
                  <button className="btn-secondary-action" onClick={() => setSearchQuery('')}>
                    Xóa tìm kiếm
                  </button>
                )}
                <button className="btn-primary-action" onClick={openAddModal}>
                  <i className="bi bi-plus-circle-fill me-1" /> Tạo mã giảm giá mới
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="voucher-cards-grid">
              {(filter === 'all' ? pagedVouchers : filteredVouchers).map((voucher) => {
                const s = (voucher.status || '').toLowerCase();
                const r = (voucher.rawStatus || '').toLowerCase();
                const isVoucherRejected = s === 'rejected' || r === 'rejected';
                const isVoucherPending = s === 'pending' || r === 'pending';
                const isActive = (s === 'active' || r === 'active') && !isVoucherRejected && !isVoucherPending;
                const percent = voucher.usageLimit
                  ? Math.min(100, Math.round(((voucher.used || 0) / voucher.usageLimit) * 100))
                  : 0;

                return (
                  <div
                    key={voucher.code}
                    className={`voucher-ticket-card ${
                      isVoucherPending
                        ? 'is-pending'
                        : isVoucherRejected
                        ? 'is-rejected'
                        : !isActive
                        ? 'is-ended'
                        : ''
                    }`}
                  >
                    {/* Card Header Gradient */}
                    <div className="ticket-header-gradient">
                      <div className="d-flex align-items-center gap-2">
                        <span className={`ticket-status-badge ${isVoucherRejected ? 'rejected' : isVoucherPending ? 'pending' : voucher.status}`}>
                          {isVoucherPending ? (
                            <>
                              <i className="bi bi-hourglass-split me-1" />
                              Chờ Admin duyệt
                            </>
                          ) : isVoucherRejected ? (
                            <>
                              <i className="bi bi-x-circle-fill me-1" />
                              Bị Admin từ chối
                            </>
                          ) : isActive ? (
                            <>
                              <span className="status-dot-blink" />
                              Đang hoạt động
                            </>
                          ) : voucher.status === 'upcoming' ? (
                            'Sắp diễn ra'
                          ) : (
                            'Đã tạm ngưng'
                          )}
                        </span>
                        {voucher.homestayName && (
                          <span className="ticket-homestay-tag" title={voucher.homestayName}>
                            <i className="bi bi-geo-alt-fill" /> {voucher.homestayName}
                          </span>
                        )}
                      </div>

                      <div
                        className="toggle-wrap"
                        title={
                          voucher.status === 'pending'
                            ? 'Mã đang chờ Admin duyệt, chưa thể bật/tắt'
                            : voucher.status === 'rejected'
                            ? 'Mã đã bị Admin từ chối phê duyệt'
                            : isActive
                            ? 'Nhấn để tạm ngưng mã'
                            : 'Nhấn để kích hoạt mã'
                        }
                        onClick={() => handleToggleStatus(voucher)}
                        style={
                          voucher.status === 'pending' || voucher.status === 'rejected'
                            ? { opacity: 0.45, cursor: 'not-allowed' }
                            : {}
                        }
                      >
                        <div className={`toggle-switch ${isActive ? 'on' : ''}`}>
                          <div className="toggle-slider" />
                        </div>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="ticket-body-content">
                      {voucher.status === 'pending' && (
                        <div className="ticket-pending-alert">
                          <i className="bi bi-clock-history me-1" />
                          <span>Mã đang chờ Admin phê duyệt trước khi có thể áp dụng cho du khách.</span>
                        </div>
                      )}
                      {voucher.status === 'rejected' && (
                        <div className="ticket-rejected-alert">
                          <i className="bi bi-x-octagon-fill me-1" />
                          <span>Mã này đã bị Admin từ chối phê duyệt. Bạn có thể chỉnh sửa lại thông tin hoặc xoá mã.</span>
                        </div>
                      )}
                      <div className="ticket-discount-row">
                        <div className="ticket-discount-title-group">
                          <div>
                            <span className="ticket-big-rate">
                              {voucher.type === 'percent'
                                ? `GIẢM ${voucher.value}%`
                                : `GIẢM ${formatVND(voucher.value)}`}
                            </span>
                            {voucher.maxDiscount > 0 && (
                              <span className="ticket-max-hint">
                                Tối đa {formatVND(voucher.maxDiscount)}
                              </span>
                            )}
                          </div>
                          <h3>{voucher.name}</h3>
                        </div>
                        <img
                          src={voucher.image || IMAGE_PRESETS[0].url}
                          alt={voucher.name}
                          className="ticket-thumb-img"
                        />
                      </div>

                      <div className="ticket-conditions-pills">
                        {voucher.minOrder > 0 && (
                          <span className="condition-pill">
                            <i className="bi bi-bag-check me-1" />
                            Đơn từ {formatVND(voucher.minOrder)}
                          </span>
                        )}
                        {voucher.audience && (
                          <span className="condition-pill audience">
                            <i className="bi bi-people-fill me-1" />
                            {voucher.audience}
                          </span>
                        )}
                      </div>

                      <p className="ticket-desc-text">{voucher.description}</p>

                      {/* Code Strip */}
                      <div className="ticket-code-strip">
                        <span className="ticket-code-val">{voucher.code}</span>
                        <button
                          className="btn-copy-code"
                          onClick={() => handleCopyCode(voucher.code)}
                          title="Sao chép mã vào clipboard"
                        >
                          <i className="bi bi-copy" /> Sao chép
                        </button>
                      </div>

                      {/* Progress Bar */}
                      <div className="ticket-progress-group">
                        <div className="ticket-progress-labels">
                          <span>
                            Đã dùng: <strong>{voucher.used || 0}/{voucher.usageLimit}</strong>
                          </span>
                          <span>{percent}%</span>
                        </div>
                        <div className="ticket-progress-bar">
                          <div
                            className="ticket-progress-fill"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Punch Hole Separator */}
                    <div className="ticket-separator-row">
                      <div className="punch-hole-left" />
                      <div className="ticket-dashed-line" />
                      <div className="punch-hole-right" />
                    </div>

                    {/* Footer Actions */}
                    <div className="ticket-footer-row">
                      <div className="ticket-date-span">
                        <i className="bi bi-calendar3 me-1" />
                        {toVN(voucher.start)} - {toVN(voucher.end)}
                      </div>
                      <div className="ticket-action-btns">
                        <button
                          className="btn-ticket-icon"
                          title="Xem chi tiết"
                          onClick={() => openDetailModal(voucher)}
                        >
                          <i className="bi bi-eye" />
                        </button>
                        <button
                          className="btn-ticket-icon"
                          title="Chỉnh sửa mã"
                          onClick={() => openEditModal(voucher)}
                        >
                          <i className="bi bi-pencil" />
                        </button>
                        <button
                          className="btn-ticket-icon delete"
                          title="Xoá mã giảm giá"
                          onClick={() => openDeleteModal(voucher)}
                        >
                          <i className="bi bi-trash" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── PHÂN TRANG (chỉ hiện ở tab Tất cả) ────────────── */}
            {filter === 'all' && totalPages > 1 && (
              <div className="discount-pagination">
                <button
                  className="discount-page-btn"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  title="Trang trước"
                >
                  <i className="bi bi-chevron-left" />
                </button>

                <div className="discount-page-numbers">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                    <button
                      key={num}
                      className={`discount-page-num ${num === safePage ? 'active' : ''}`}
                      onClick={() => setCurrentPage(num)}
                    >
                      {num}
                    </button>
                  ))}
                </div>

                <button
                  className="discount-page-btn"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  title="Trang sau"
                >
                  <i className="bi bi-chevron-right" />
                </button>

                <span className="discount-page-info">
                  {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filteredVouchers.length)} / {filteredVouchers.length} mã
                </span>
              </div>
            )}
          </>
        )}
      </div>

        {/* RIGHT COLUMN: TELEMETRY & PRO TIPS */}
        <div className="discount-side-cards">
          {/* Top 1 Performing Voucher Telemetry */}
          {topVoucher && (
            <div className="telemetry-card">
              <div className="telemetry-header">
                <div>
                  <h3>
                    <i className="bi bi-trophy-fill text-warning me-1" />
                    Hiệu quả {topVoucher.code}
                  </h3>
                  <span className="telemetry-subname">{topVoucher.name}</span>
                </div>
                <span className="badge bg-success-subtle text-success fw-bold px-2 py-1">
                  Top 1
                </span>
              </div>

              <div className="telemetry-circle-row">
                <div className="telemetry-svg-wrap">
                  <svg viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth="4.5"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#15803d"
                      strokeWidth="4.5"
                      strokeDasharray="68, 100"
                    />
                  </svg>
                  <div className="telemetry-center-stats">
                    <strong>{topVoucher.used || 0}</strong>
                    <span>Lượt dùng</span>
                  </div>
                </div>

                <div className="telemetry-legends">
                  <div className="telemetry-legend-line">
                    <div>
                      <span className="telemetry-dot" style={{ backgroundColor: '#15803d' }} />
                      <span>Khách mới</span>
                    </div>
                    <strong>68%</strong>
                  </div>
                  <div className="telemetry-legend-line">
                    <div>
                      <span className="telemetry-dot" style={{ backgroundColor: '#88d982' }} />
                      <span>Khách quay lại</span>
                    </div>
                    <strong>32%</strong>
                  </div>
                  <div className="telemetry-legend-line pt-2 border-top">
                    <span className="text-muted">Doanh thu tạo ra</span>
                    <strong className="text-success">
                      {formatVND((topVoucher.used || 0) * 1750000)}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pro Tips Card */}
          <div className="pro-tips-card">
            <h4>
              <i className="bi bi-lightbulb-fill text-warning" />
              Chiến lược phát hành Voucher hiệu quả
            </h4>
            <ul>
              <li>
                <strong>Tạo tính cấp bách:</strong> Giới hạn ngày kết thúc trong 15 - 30 ngày để kích thích khách hoàn tất đặt phòng sớm.
              </li>
              <li>
                <strong>Kiểm soát biên lợi nhuận:</strong> Luôn cài đặt mức <em>giảm tối đa</em> khi áp dụng voucher theo tỷ lệ phần trăm (%).
              </li>
              <li>
                <strong>Kích cầu ngày trong tuần:</strong> Áp dụng voucher sâu hơn cho ngày thứ 2 - thứ 5 để lấp đầy công suất phòng trống.
              </li>
              <li>
                <strong>Nhiệm vụ văn hoá:</strong> Kết hợp thưởng voucher cho khách hoàn thành trải nghiệm học làm thổ cẩm hoặc nấu món Thái.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════
          MODAL 1: TẠO / SỬA MÃ GIẢM GIÁ
      ═════════════════════════════════════════════════════════════ */}
      {(activeModal === 'add' || activeModal === 'edit') && (
        <div className="bk-modal-backdrop" onClick={closeModal}>
          <div className="bk-modal-window large" onClick={(e) => e.stopPropagation()}>
            <div className="bk-header-styled surface-style">
              <div className="bk-header-title-box">
                <i className="bi bi-ticket-perforated-fill text-success fs-5" />
                <div>
                  <h3>
                    {activeModal === 'add' ? 'Tạo mã giảm giá mới' : 'Chỉnh sửa mã giảm giá'}
                  </h3>
                  <span>Thiết lập chương trình khuyến mãi phòng và trải nghiệm</span>
                </div>
              </div>
              <button className="modal-close-btn" onClick={closeModal}>
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <form onSubmit={handleSaveVoucher}>
              <div className="bk-body-scrollable">
                {activeModal === 'add' && (
                  <div className="discount-modal-pending-notice">
                    <i className="bi bi-shield-check text-warning fs-5 me-2" />
                    <div>
                      <strong style={{ color: '#92400e' }}>Cần phê duyệt từ Quản trị viên (Admin):</strong>
                      <p className="mb-0 text-muted" style={{ fontSize: 13, marginTop: 2 }}>
                        Mã giảm giá sau khi tạo sẽ được chuyển sang trạng thái <strong>Chờ duyệt</strong> và gửi tới Admin xét duyệt trước khi chính thức áp dụng cho du khách.
                      </p>
                    </div>
                  </div>
                )}

                <div className="form-group-item">
                  <label className="form-label-title">Tên chương trình ưu đãi</label>
                  <input
                    type="text"
                    className="form-input-field"
                    placeholder="VD: Ưu đãi Mountain View & Garden View"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-grid-2">
                  <div className="form-group-item">
                    <label className="form-label-title">Mã giảm giá (Code)</label>
                    <input
                      type="text"
                      className="form-input-field text-uppercase fw-bold"
                      placeholder="VD: MAICHAU15"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group-item">
                    <label className="form-label-title">Áp dụng cho Homestay</label>
                    <select
                      className="form-input-field"
                      value={formData.homestayId}
                      onChange={(e) => setFormData({ ...formData, homestayId: e.target.value })}
                    >
                      <option value="">Toàn bộ cơ sở YÊN (Toàn hệ thống)</option>
                      {homestaysList.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group-item">
                    <label className="form-label-title">Loại ưu đãi</label>
                    <select
                      className="form-input-field"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                      <option value="percent">Giảm theo % đơn phòng</option>
                      <option value="amount">Giảm số tiền cố định (VNĐ)</option>
                    </select>
                  </div>

                  <div className="form-group-item">
                    <label className="form-label-title">
                      Giá trị giảm {formData.type === 'percent' ? '(%)' : '(VNĐ)'}
                    </label>
                    <input
                      type="number"
                      className="form-input-field"
                      placeholder={formData.type === 'percent' ? '15' : '100000'}
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group-item">
                    <label className="form-label-title">Giảm tối đa (VNĐ)</label>
                    <input
                      type="number"
                      className="form-input-field"
                      placeholder="VD: 300000 (0 nếu không giới hạn)"
                      value={formData.maxDiscount}
                      onChange={(e) =>
                        setFormData({ ...formData, maxDiscount: e.target.value })
                      }
                      disabled={formData.type === 'amount'}
                    />
                  </div>

                  <div className="form-group-item">
                    <label className="form-label-title">Đơn hàng tối thiểu (VNĐ)</label>
                    <input
                      type="number"
                      className="form-input-field"
                      placeholder="VD: 500000"
                      value={formData.minOrder}
                      onChange={(e) => setFormData({ ...formData, minOrder: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group-item">
                    <label className="form-label-title">Tổng số lượt phát hành</label>
                    <input
                      type="number"
                      className="form-input-field"
                      value={formData.usageLimit}
                      onChange={(e) =>
                        setFormData({ ...formData, usageLimit: e.target.value })
                      }
                      min="1"
                      required
                    />
                  </div>

                  <div className="form-group-item">
                    <label className="form-label-title">Đối tượng áp dụng</label>
                    <select
                      className="form-input-field"
                      value={formData.audience}
                      onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                    >
                      <option value="Công khai toàn sàn">Công khai toàn sàn</option>
                      <option value="Nhiệm vụ văn hoá bản địa">Nhiệm vụ văn hoá bản địa</option>
                      <option value="Khách hàng thân thiết">Khách hàng thân thiết</option>
                      <option value="Khách đặt lần đầu">Khách đặt phòng lần đầu</option>
                    </select>
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group-item">
                    <label className="form-label-title">Ngày bắt đầu</label>
                    <input
                      type="date"
                      className="form-input-field"
                      value={formData.start}
                      onChange={(e) => setFormData({ ...formData, start: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group-item">
                    <label className="form-label-title">Ngày kết thúc</label>
                    <input
                      type="date"
                      className="form-input-field"
                      value={formData.end}
                      onChange={(e) => setFormData({ ...formData, end: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Preset Images */}
                <div className="form-group-item">
                  <label className="form-label-title">Hình ảnh minh họa voucher</label>
                  <div className="image-preset-list mb-2">
                    {IMAGE_PRESETS.map((p, idx) => (
                      <button
                        type="button"
                        key={idx}
                        className={`preset-chip ${formData.image === p.url ? 'active' : ''}`}
                        onClick={() => setFormData({ ...formData, image: p.url })}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <input
                    type="url"
                    className="form-input-field"
                    placeholder="URL ảnh (https://...)"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  />
                </div>

                <div className="form-group-item">
                  <label className="form-label-title">Mô tả và điều kiện sử dụng</label>
                  <textarea
                    rows="2"
                    className="form-input-field"
                    placeholder="Chi tiết điều kiện áp dụng cho voucher..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>

                {activeModal === 'edit' ? (
                  <label className="d-flex align-items-center gap-2 small">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) =>
                        setFormData({ ...formData, active: e.target.checked })
                      }
                    />
                    <span>Kích hoạt mã ngay sau khi lưu</span>
                  </label>
                ) : (
                  <div className="d-flex align-items-center gap-2 text-warning small">
                    <i className="bi bi-clock-history" />
                    <span>Mã sẽ ở trạng thái Chờ duyệt cho đến khi Admin phê duyệt.</span>
                  </div>
                )}
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
                  <i className={`bi ${activeModal === 'add' ? 'bi-send-check' : 'bi-save'} me-1`} />
                  {activeModal === 'add' ? 'Gửi duyệt mã giảm giá' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          MODAL 2: CHI TIẾT VOUCHER
      ═════════════════════════════════════════════════════════════ */}
      {activeModal === 'detail' && selectedVoucher && (
        <div className="bk-modal-backdrop" onClick={closeModal}>
          <div className="bk-modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="bk-header-styled surface-style">
              <div className="bk-header-title-box">
                <i className="bi bi-tag-fill text-success fs-5" />
                <div>
                  <h3>Chi tiết mã giảm giá</h3>
                  <span>{selectedVoucher.name}</span>
                </div>
              </div>
              <button className="modal-close-btn" onClick={closeModal}>
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <div className="bk-body-scrollable">
              <img
                src={selectedVoucher.image || IMAGE_PRESETS[0].url}
                alt={selectedVoucher.name}
                style={{
                  width: '100%',
                  height: '180px',
                  objectFit: 'cover',
                  borderRadius: '12px'
                }}
              />

              <div className="ticket-code-strip mt-3">
                <span className="ticket-code-val">{selectedVoucher.code}</span>
                <button
                  className="btn-copy-code"
                  onClick={() => handleCopyCode(selectedVoucher.code)}
                >
                  <i className="bi bi-copy" /> Sao chép
                </button>
              </div>

              <div className="form-grid-2 small mt-2">
                <div className="p-2 bg-light rounded">
                  <span className="text-muted d-block">Giá trị ưu đãi:</span>
                  <strong className="text-success fs-6">
                    {selectedVoucher.type === 'percent'
                      ? `Giảm ${selectedVoucher.value}%`
                      : formatVND(selectedVoucher.value)}
                  </strong>
                </div>
                <div className="p-2 bg-light rounded">
                  <span className="text-muted d-block">Giảm tối đa:</span>
                  <strong>
                    {selectedVoucher.maxDiscount > 0
                      ? formatVND(selectedVoucher.maxDiscount)
                      : 'Không giới hạn'}
                  </strong>
                </div>
                <div className="p-2 bg-light rounded">
                  <span className="text-muted d-block">Đơn tối thiểu:</span>
                  <strong>
                    {selectedVoucher.minOrder > 0
                      ? formatVND(selectedVoucher.minOrder)
                      : 'Không yêu cầu'}
                  </strong>
                </div>
                <div className="p-2 bg-light rounded">
                  <span className="text-muted d-block">Thời hạn áp dụng:</span>
                  <strong>
                    {toVN(selectedVoucher.start)} - {toVN(selectedVoucher.end)}
                  </strong>
                </div>
              </div>

              <div className="p-2 bg-light rounded small mt-2">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="text-muted">Trạng thái:</span>
                  <span className={`ticket-status-badge ${selectedVoucher.status}`}>
                    {selectedVoucher.status === 'pending'
                      ? 'Chờ Admin duyệt'
                      : selectedVoucher.status === 'active'
                      ? 'Đang hoạt động'
                      : selectedVoucher.status === 'upcoming'
                      ? 'Sắp diễn ra'
                      : 'Đã tạm ngưng'}
                  </span>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">Cơ sở áp dụng:</span>
                  <strong>{selectedVoucher.homestayName || 'Toàn bộ cơ sở YÊN'}</strong>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">Đối tượng:</span>
                  <strong>{selectedVoucher.audience || 'Công khai toàn sàn'}</strong>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="text-muted">Số lượt đã dùng:</span>
                  <strong className="text-success">
                    {selectedVoucher.used || 0} / {selectedVoucher.usageLimit} lượt
                  </strong>
                </div>
              </div>

              {selectedVoucher.description && (
                <div className="small text-muted p-2 mt-2 bg-white border rounded">
                  <strong>Điều kiện: </strong>
                  {selectedVoucher.description}
                </div>
              )}
            </div>

            <div className="bk-footer-styled">
              <button className="btn-secondary-action" onClick={closeModal}>
                Đóng
              </button>
              <button
                className="btn-primary-action"
                onClick={() => {
                  closeModal();
                  openEditModal(selectedVoucher);
                }}
              >
                <i className="bi bi-pencil me-1" /> Chỉnh sửa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          MODAL 3: LỊCH SỬ PHÁT HÀNH
      ═════════════════════════════════════════════════════════════ */}
      {activeModal === 'history' && (
        <div className="bk-modal-backdrop" onClick={closeModal}>
          <div className="bk-modal-window large" onClick={(e) => e.stopPropagation()}>
            <div className="bk-header-styled surface-style">
              <div className="bk-header-title-box">
                <i className="bi bi-clock-history text-primary fs-5" />
                <div>
                  <h3>Lịch sử phát hành Voucher</h3>
                  <span>Tổng hợp các chiến dịch ưu đãi của homestay</span>
                </div>
              </div>
              <button className="modal-close-btn" onClick={closeModal}>
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <div className="bk-body-scrollable">
              <div className="history-items-list">
                {history.map((h, i) => (
                  <div key={i} className="history-item-row">
                    <div className="history-item-left">
                      <div className="history-item-icon">
                        <i className="bi bi-ticket-perforated" />
                      </div>
                      <div className="history-item-info">
                        <strong>{h.name}</strong>
                        <span>
                          {h.code} • {h.period}
                        </span>
                      </div>
                    </div>
                    <div className="history-item-right">
                      <strong>{formatVND(h.revenue)}</strong>
                      <span>
                        Đã dùng {h.used}/{h.limit} lượt
                      </span>
                    </div>
                  </div>
                ))}
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
          MODAL 4: XOÁ MÃ GIẢM GIÁ
      ═════════════════════════════════════════════════════════════ */}
      {activeModal === 'delete' && selectedVoucher && (
        <div className="bk-modal-backdrop" onClick={closeModal}>
          <div className="bk-modal-window small" onClick={(e) => e.stopPropagation()}>
            <div className="bk-header-styled error-style">
              <div className="bk-header-title-box">
                <i className="bi bi-trash fs-5" />
                <div>
                  <h3>Xoá mã giảm giá</h3>
                  <span>Dừng và gỡ mã "{selectedVoucher.code}"</span>
                </div>
              </div>
              <button className="modal-close-btn text-white" onClick={closeModal}>
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <form onSubmit={handleConfirmDelete}>
              <div className="bk-body-scrollable">
                <div className="p-3 bg-light rounded-3 small">
                  <strong>{selectedVoucher.name}</strong>
                  <div className="text-muted">
                    Đã sử dụng: {selectedVoucher.used || 0} lượt
                  </div>
                </div>

                <div className="form-group-item">
                  <label className="form-label-title">Lý do xoá mã:</label>
                  <select
                    className="form-input-field"
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                  >
                    <option value="Hết ngân sách khuyến mãi">Hết ngân sách khuyến mãi</option>
                    <option value="Trùng chương trình khác">Trùng chương trình khác</option>
                    <option value="Phát hiện gian lận">Phát hiện lạm dụng mã</option>
                    <option value="Kết thúc theo kế hoạch">Kết thúc theo kế hoạch</option>
                  </select>
                </div>

                <label className="d-flex align-items-center gap-2 small">
                  <input
                    type="checkbox"
                    checked={deleteNotify}
                    onChange={(e) => setDeleteNotify(e.target.checked)}
                  />
                  <span>Thông báo dừng áp dụng tới du khách đã lưu mã</span>
                </label>
              </div>

              <div className="bk-footer-styled">
                <button
                  type="button"
                  className="btn-secondary-action"
                  onClick={closeModal}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn-primary-action"
                  style={{ background: '#dc2626' }}
                >
                  <i className="bi bi-trash me-1" /> Xác nhận xoá mã
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
