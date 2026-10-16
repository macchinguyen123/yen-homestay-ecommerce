const API_BASE_URL = 'http://localhost:8081/api';

let memoryCache = null;
let memoryCacheKey = null;

function authHeaders() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user?.token ? { Authorization: `Bearer ${user.token}` } : {};
  } catch { return {}; }
}

export const wishlistService = {
  /**
   * Lấy ngay lập tức từ bộ nhớ đệm (0ms) để giao diện không bị chớp hoặc chờ
   */
  getCachedWishlist(userId) {
    const key = userId ? `wishlist_${userId}` : 'guest_wishlist';
    if (memoryCacheKey === key && memoryCache !== null) return memoryCache;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          memoryCache = parsed;
          memoryCacheKey = key;
          return parsed;
        }
      }
    } catch (e) {}
    return null;
  },

  /**
   * Lấy danh sách homestay yêu thích từ CSDL (tốc độ cao với cache đa tầng)
   */
  async getWishlist(userId) {
    if (userId) {
      try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}/wishlist`, { headers: authHeaders() });
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            memoryCache = data;
            memoryCacheKey = `wishlist_${userId}`;
            localStorage.setItem(`wishlist_${userId}`, JSON.stringify(data));
            return { success: true, data };
          }
          throw new Error(data?.message || 'Dữ liệu wishlist không hợp lệ');
        }
        throw new Error(`HTTP ${response.status}`);
      } catch (err) {
        throw err;
      }
    }
    const raw = localStorage.getItem('guest_wishlist');
    const data = raw ? JSON.parse(raw) : [];
    memoryCache = Array.isArray(data) ? data : [];
    memoryCacheKey = 'guest_wishlist';
    return { success: true, data: memoryCache, isLocal: true };
  },

  /**
   * Thêm homestay vào danh sách yêu thích trong CSDL
   */
  async addToWishlist(userId, homestayId, homestayObj = null) {
    memoryCache = null; // Invalidate cache
    const targetId = Number(homestayId);
    if (!userId) throw new Error('Bạn cần đăng nhập để lưu homestay yêu thích.');
    if (!Number.isInteger(targetId) || targetId <= 0) throw new Error('Homestay không hợp lệ.');

    // Gửi yêu cầu lưu vào CSDL qua backend API
    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}/wishlist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify({ homestayId: targetId }),
        });
        const res = await response.json().catch(() => ({}));
        if (response.ok && res.success !== false) {
          if (res.data) {
            try {
              const raw = localStorage.getItem(`wishlist_${userId}`);
              let list = raw ? JSON.parse(raw) : [];
              const idx = list.findIndex(i => Number(i.id || i.homestayId) === targetId);
              if (idx !== -1) list[idx] = res.data;
              else list.unshift(res.data);
              localStorage.setItem(`wishlist_${userId}`, JSON.stringify(list));
            } catch (err) {}
          }
          return { success: true, data: res.data };
        }
        throw new Error(res.message || `Không thể lưu wishlist (HTTP ${response.status}).`);
    } catch (err) { throw err; }
  },

  /**
   * Xóa 1 homestay khỏi danh sách yêu thích trong CSDL
   */
  async removeFromWishlist(userId, homestayId) {
    memoryCache = null; // Invalidate cache
    const targetId = Number(homestayId);

    // Đồng bộ ngay lập tức loại bỏ khỏi cache client
    const cacheKey = userId ? `wishlist_${userId}` : 'guest_wishlist';
    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        let list = JSON.parse(raw);
        list = list.filter(item => Number(item.id || item.homestayId) !== targetId);
        localStorage.setItem(cacheKey, JSON.stringify(list));
      }
    } catch (e) {}

    // Gửi yêu cầu xóa trong CSDL qua backend API
    if (userId) {
      try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}/wishlist/${targetId}`, {
          method: 'DELETE', headers: authHeaders(),
        });
        if (response.ok) {
          return { success: true };
        }
      } catch (err) { throw err; }
    }

    throw new Error('Bạn cần đăng nhập để xóa homestay yêu thích.');
  },

  /**
   * Xóa toàn bộ homestay trong danh sách yêu thích
   */
  async clearWishlist(userId) {
    memoryCache = null; // Invalidate cache
    if (userId) {
      try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}/wishlist`, {
          method: 'DELETE', headers: authHeaders(),
        });
        if (response.ok) {
          localStorage.removeItem(`wishlist_${userId}`);
          return { success: true };
        }
      } catch (err) { throw err; }
    }
    throw new Error('Bạn cần đăng nhập để xóa danh sách yêu thích.');
  }
};
