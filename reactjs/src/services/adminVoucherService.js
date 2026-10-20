/**
 * adminVoucherService.js
 * Service kết nối với Backend Spring Boot để quản lý toàn bộ mã giảm giá từ phía Admin.
 *
 * Fallback chain:
 *   1. /api/admin/vouchers        (AdminVoucherController)
 *   2. /api/public/admin/vouchers (AdminVoucherController - public mapping)
 *   3. /api/public/owner/vouchers (OwnerVoucherController - sẵn sàng trên Spring Boot)
 *   4. /api/owner/vouchers        (OwnerVoucherController)
 *   5. /api/public/vouchers       (VoucherController)
 *   6. localStorage cache
 */

const ADMIN_BASE   = 'http://localhost:8081/api/admin/vouchers';
const PUBLIC_ADMIN  = 'http://localhost:8081/api/public/admin/vouchers';
const OWNER_BASE   = 'http://localhost:8081/api/owner/vouchers';
const PUBLIC_OWNER  = 'http://localhost:8081/api/public/owner/vouchers';
const PUBLIC_BASE   = 'http://localhost:8081/api/public/vouchers';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  const h = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
};

/**
 * Chuyển đổi format từ Spring Boot LocalDate (array [yyyy, mm, dd] hoặc ISO string).
 */
function parseSpringDate(raw) {
  if (!raw) return null;
  if (Array.isArray(raw)) {
    return new Date(raw[0], raw[1] - 1, raw[2]);
  }
  if (typeof raw === 'string') {
    return new Date(raw);
  }
  return null;
}

function toDateStr(raw) {
  if (!raw) return null;
  if (Array.isArray(raw)) return `${raw[0]}-${String(raw[1]).padStart(2,'0')}-${String(raw[2]).padStart(2,'0')}`;
  return String(raw);
}

function fmtViDate(raw) {
  if (!raw) return '—';
  const d = parseSpringDate(raw);
  if (!d || isNaN(d)) return String(raw);
  return d.toLocaleDateString('vi-VN');
}

/** Chuyển đổi format từ VoucherController cũ → format admin */
function normalizePublicVoucher(v, today = new Date()) {
  const expiryDate = parseSpringDate(v.expiryDate);
  const startDate  = parseSpringDate(v.startDate);

  let status = 'active';
  if (expiryDate && expiryDate < today) status = 'expired';
  else if (v.status && (v.status.toUpperCase() === 'DISABLED' || v.status.toUpperCase() === 'ENDED')) status = 'disabled';
  else if (startDate && startDate > today) status = 'upcoming';

  const limit = (v.usageLimit != null && v.usageLimit > 0) ? v.usageLimit : 100;
  const used  = v.usedCount || 0;

  return {
    id:                   v.voucherId || v.id,
    code:                 v.code,
    homestayId:           v.homestayId ?? null,
    homestayName:         v.homestayName || (v.homestayId ? `Homestay #${v.homestayId}` : 'Toàn bộ hệ thống YÊN'),
    discountType:         (v.discountType || 'PERCENT').toLowerCase() === 'percent' ? 'percent' : 'amount',
    value:                v.value,
    minOrderValue:        v.minOrderValue,
    maxDiscount:          v.maxDiscount,
    usageLimit:           limit,
    usedCount:            used,
    startDate:            toDateStr(v.startDate),
    expiryDate:           toDateStr(v.expiryDate),
    startDateFormatted:   fmtViDate(v.startDate),
    expiryDateFormatted:  fmtViDate(v.expiryDate),
    status:               status,
    rawStatus:            v.status || 'ACTIVE',
    usagePercent:         limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0,
  };
}

/** Chuyển đổi format từ OwnerVoucherController → format admin */
function normalizeOwnerVoucher(v, today = new Date()) {
  const expiryDate = parseSpringDate(v.end || v.expiryDate);
  const startDate  = parseSpringDate(v.start || v.startDate);

  let status = 'active';
  const rawStatus = (v.status || '').toLowerCase();
  if (expiryDate && expiryDate < today) status = 'expired';
  else if (rawStatus === 'disabled' || rawStatus === 'ended') status = 'disabled';
  else if (startDate && startDate > today) status = 'upcoming';

  const limit = (v.usageLimit != null && v.usageLimit > 0) ? v.usageLimit : 100;
  const used  = v.used != null ? v.used : (v.usedCount || 0);

  return {
    id:                   v.id,
    code:                 v.code,
    homestayId:           v.homestayId ?? null,
    homestayName:         v.homestayName || (v.homestayId ? `Homestay #${v.homestayId}` : 'Toàn bộ hệ thống YÊN'),
    discountType:         (v.type || v.discountType || 'PERCENT').toLowerCase() === 'percent' ? 'percent' : 'amount',
    value:                v.value,
    minOrderValue:        v.minOrder ?? v.minOrderValue ?? 0,
    maxDiscount:          v.maxDiscount ?? 0,
    usageLimit:           limit,
    usedCount:            used,
    startDate:            toDateStr(v.start || v.startDate),
    expiryDate:           toDateStr(v.end || v.expiryDate),
    startDateFormatted:   fmtViDate(v.start || v.startDate),
    expiryDateFormatted:  fmtViDate(v.end || v.expiryDate),
    status:               status,
    rawStatus:            status === 'disabled' ? 'DISABLED' : 'ACTIVE',
    usagePercent:         limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0,
  };
}

async function safeFetch(url, opts = {}) {
  try {
    const res = await fetch(url, { headers: getHeaders(), ...opts });
    return res;
  } catch (err) {
    throw err;
  }
}

export const adminVoucherService = {

  /**
   * Lấy thống kê tổng quan mã giảm giá
   */
  async getStats() {
    // 1. Thử admin endpoint trước
    for (const base of [ADMIN_BASE, PUBLIC_ADMIN]) {
      try {
        const res = await safeFetch(`${base}/stats`);
        if (res.ok) return await res.json();
      } catch (_) {}
    }

    // 2. Tính toán stats từ danh sách vouchers đã load
    try {
      const vouchers = await this.getAllVouchers();
      const active   = vouchers.filter(v => v.status === 'active').length;
      const expired  = vouchers.filter(v => v.status === 'expired').length;
      const disabled = vouchers.filter(v => v.status === 'disabled').length;
      const totalUsed = vouchers.reduce((s, v) => s + (v.usedCount || 0), 0);

      let totalDiscountCost = 0;
      vouchers.forEach(v => {
        const used = v.usedCount || 0;
        if (used === 0) return;
        if (v.discountType === 'percent') {
          const single = Math.min(
            1500000 * (Number(v.value) || 0) / 100,
            Number(v.maxDiscount) || Infinity
          );
          totalDiscountCost += single * used;
        } else {
          totalDiscountCost += (Number(v.value) || 0) * used;
        }
      });

      return {
        total: vouchers.length,
        active,
        expired,
        disabled,
        totalUsed,
        totalDiscountCost: Math.round(totalDiscountCost)
      };
    } catch (_) {}

    return { total: 0, active: 0, expired: 0, disabled: 0, totalUsed: 0, totalDiscountCost: 0 };
  },

  /**
   * Lấy danh sách tất cả mã giảm giá với bộ lọc
   */
  async getAllVouchers(status = 'all', type = 'all', keyword = '') {
    const today = new Date();

    // 1. Ưu tiên Admin API - chấp nhận cả array rỗng (không fallback nếu kết nối thành công)
    for (const base of [ADMIN_BASE, PUBLIC_ADMIN]) {
      try {
        const params = new URLSearchParams({ status, type });
        if (keyword) params.append('keyword', keyword);
        const res = await safeFetch(`${base}?${params}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            // Admin API thành công → dùng kết quả này (kể cả rỗng)
            localStorage.setItem('admin_vouchers_cache', JSON.stringify(data));
            return data;
          }
        }
      } catch (err) {
        console.warn(`[adminVoucherService] Admin API failed (${base}):`, err.message);
      }
    }

    // 2. Fallback: dùng public vouchers endpoint (chỉ khi admin API không kết nối được)
    try {
      const res = await safeFetch(PUBLIC_BASE);
      if (res.ok) {
        const raw = await res.json();
        if (Array.isArray(raw) && raw.length > 0) {
          let vouchers = raw.map(v => normalizePublicVoucher(v, today));
          if (status !== 'all') vouchers = vouchers.filter(v => v.status === status);
          if (type !== 'all')   vouchers = vouchers.filter(v => v.discountType === type);
          if (keyword) {
            const q = keyword.toLowerCase();
            vouchers = vouchers.filter(v =>
              (v.code || '').toLowerCase().includes(q) ||
              (v.homestayName || '').toLowerCase().includes(q)
            );
          }
          localStorage.setItem('admin_vouchers_cache', JSON.stringify(vouchers));
          return vouchers;
        }
      }
    } catch (err) {
      console.warn('[adminVoucherService] Public API failed:', err.message);
    }

    // 3. Trả cache localStorage nếu mọi kết nối lỗi
    try {
      const cached = localStorage.getItem('admin_vouchers_cache');
      if (cached) return JSON.parse(cached);
    } catch (_) {}

    return [];
  },

  /**
   * Lấy chi tiết một mã giảm giá
   */
  async getVoucherById(id) {
    for (const base of [ADMIN_BASE, PUBLIC_ADMIN, PUBLIC_OWNER, OWNER_BASE]) {
      try {
        const res = await safeFetch(`${base}/${id}`);
        if (res.ok) {
          const data = await res.json();
          return normalizeOwnerVoucher(data);
        }
      } catch (_) {}
    }
    throw new Error('Không tìm thấy mã giảm giá');
  },

  /**
   * Tạo mã giảm giá mới (Admin phát hành)
   */
  async createVoucher(payload) {
    for (const base of [ADMIN_BASE, PUBLIC_ADMIN]) {
      try {
        const res = await safeFetch(base, {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) return data;
        if (res.status === 400) throw new Error(data.message || 'Lỗi tạo mã giảm giá');
      } catch (err) {
        if (err.message && !err.message.includes('fetch')) throw err;
      }
    }

    // Fallback qua Owner Voucher endpoint
    const ownerPayload = {
      code: payload.code,
      homestayId: payload.homestayId,
      type: payload.discountType,
      value: payload.value,
      minOrder: payload.minOrderValue,
      maxDiscount: payload.maxDiscount,
      usageLimit: payload.usageLimit,
      start: payload.startDate,
      end: payload.expiryDate,
      status: payload.status === 'DISABLED' ? 'ended' : 'active'
    };

    for (const base of [PUBLIC_OWNER, OWNER_BASE]) {
      try {
        const res = await safeFetch(base, {
          method: 'POST',
          body: JSON.stringify(ownerPayload)
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) return normalizeOwnerVoucher(data);
        if (res.status === 400) throw new Error(data.message || 'Lỗi tạo mã giảm giá');
      } catch (err) {
        if (err.message && !err.message.includes('fetch')) throw err;
      }
    }

    throw new Error('Không thể kết nối đến server để tạo mã giảm giá. Vui lòng kiểm tra Spring Boot đang chạy.');
  },

  /**
   * Cập nhật thông tin mã giảm giá
   */
  async updateVoucher(id, payload) {
    for (const base of [ADMIN_BASE, PUBLIC_ADMIN]) {
      try {
        const res = await safeFetch(`${base}/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) return data;
        if (res.status === 400) throw new Error(data.message || 'Lỗi cập nhật mã giảm giá');
      } catch (err) {
        if (err.message && !err.message.includes('fetch')) throw err;
      }
    }

    const ownerPayload = {
      code: payload.code,
      homestayId: payload.homestayId,
      type: payload.discountType,
      value: payload.value,
      minOrder: payload.minOrderValue,
      maxDiscount: payload.maxDiscount,
      usageLimit: payload.usageLimit,
      start: payload.startDate,
      end: payload.expiryDate,
      status: payload.status === 'DISABLED' ? 'ended' : 'active'
    };

    for (const base of [PUBLIC_OWNER, OWNER_BASE]) {
      try {
        const res = await safeFetch(`${base}/${id}`, {
          method: 'PUT',
          body: JSON.stringify(ownerPayload)
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) return normalizeOwnerVoucher(data);
        if (res.status === 400) throw new Error(data.message || 'Lỗi cập nhật mã giảm giá');
      } catch (err) {
        if (err.message && !err.message.includes('fetch')) throw err;
      }
    }

    throw new Error('Không thể kết nối đến server để cập nhật. Vui lòng kiểm tra Spring Boot đang chạy.');
  },

  /**
   * Bật / tắt trạng thái kích hoạt mã giảm giá
   */
  async toggleStatus(id) {
    // 1. Thử Admin API
    for (const base of [ADMIN_BASE, PUBLIC_ADMIN]) {
      try {
        const res = await safeFetch(`${base}/${id}/toggle`, { method: 'POST' });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          return data;
        }
      } catch (_) {}
    }

    // 2. Thử Owner API (hoạt động trực tiếp trên Spring Boot hiện tại)
    for (const base of [PUBLIC_OWNER, OWNER_BASE]) {
      try {
        const res = await safeFetch(`${base}/${id}/toggle`, { method: 'POST' });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          const isDis = data.status === 'ended' || data.status === 'DISABLED' || data.status === 'disabled';
          return {
            ...data,
            status: isDis ? 'disabled' : 'active',
            rawStatus: isDis ? 'DISABLED' : 'ACTIVE'
          };
        }
      } catch (_) {}
    }

    throw new Error('Không thể đổi trạng thái. Vui lòng kiểm tra Spring Boot đang chạy.');
  },

  /**
   * Xóa mã giảm giá
   */
  async deleteVoucher(id) {
    for (const base of [ADMIN_BASE, PUBLIC_ADMIN, PUBLIC_OWNER, OWNER_BASE]) {
      try {
        const res = await safeFetch(`${base}/${id}`, { method: 'DELETE' });
        const data = await res.json().catch(() => ({}));
        if (res.ok) return data;
      } catch (_) {}
    }
    throw new Error('Không thể xóa mã giảm giá. Vui lòng kiểm tra Spring Boot đang chạy.');
  },

  /**
   * Lấy danh sách mã giảm giá đang chờ duyệt (PENDING) từ chủ homestay
   * Chỉ tin vào backend - không merge localStorage để tránh mất dữ liệu từ owners khác
   */
  async getPendingVouchers() {
    // Thử cả 2 endpoint admin - ưu tiên ADMIN_BASE (đầy đủ quyền hơn)
    for (const base of [ADMIN_BASE, PUBLIC_ADMIN]) {
      try {
        const res = await safeFetch(`${base}/pending`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            console.log(`[adminVoucherService] getPendingVouchers: ${data.length} mã đang chờ duyệt từ ${base}`);
            return data; // Luôn tin vào backend, kể cả array rỗng
          }
        }
      } catch (err) {
        console.warn(`[adminVoucherService] getPendingVouchers failed (${base}):`, err.message);
      }
    }

    // Nếu backend không kết nối được, trả array rỗng (không dùng localStorage vì chỉ có data của 1 owner)
    console.warn('[adminVoucherService] Không thể lấy danh sách chờ duyệt từ backend');
    return [];
  },

  /**
   * Admin duyệt mã giảm giá (PENDING → ACTIVE)
   */
  async approveVoucher(id) {
    let serverOk = false;
    let result = null;
    for (const base of [PUBLIC_ADMIN, ADMIN_BASE]) {
      try {
        const res = await safeFetch(`${base}/${id}/approve`, { method: 'POST' });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          result = data;
          serverOk = true;
          break;
        }
        if (res.status === 400 && data.message) throw new Error(data.message);
      } catch (err) {
        if (err.message && !err.message.includes('fetch')) throw err;
      }
    }

    // Xóa cache voucher của tất cả owner để lần sau fetch lại từ backend
    // (thành công hơn so với việc update từng key một vì có thể miss key mới)
    try {
      Object.keys(localStorage).forEach((key) => {
        if (
          key === 'owner_vouchers_data' ||
          key.includes('vouchers_data') ||
          key.startsWith('cached_owner_')
        ) {
          localStorage.removeItem(key);
        }
      });
    } catch (_) {}

    return result || { success: true, message: 'Đã duyệt mã thành công' };
  },

  /**
   * Admin từ chối mã giảm giá (PENDING → REJECTED)
   */
  async rejectVoucher(id) {
    let serverOk = false;
    let result = null;
    for (const base of [PUBLIC_ADMIN, ADMIN_BASE]) {
      try {
        const res = await safeFetch(`${base}/${id}/reject`, { method: 'POST' });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          result = data;
          serverOk = true;
          break;
        }
        if (res.status === 400 && data.message) throw new Error(data.message);
      } catch (err) {
        if (err.message && !err.message.includes('fetch')) throw err;
      }
    }

    // Xóa cache voucher của tất cả owner để lần sau fetch lại từ backend
    try {
      Object.keys(localStorage).forEach((key) => {
        if (
          key === 'owner_vouchers_data' ||
          key.includes('vouchers_data') ||
          key.startsWith('cached_owner_')
        ) {
          localStorage.removeItem(key);
        }
      });
    } catch (_) {}

    return result || { success: true, message: 'Đã từ chối mã' };
  }
};

