const API_BASE_URL = 'http://localhost:8081/api';

// Memory cache for lightning fast (0ms) in-memory retrieval
let memoryCache = null;

export const wishlistService = {
  /**
   * Lấy ngay lập tức từ bộ nhớ đệm (0ms) để giao diện không bị chớp hoặc chờ
   */
  getCachedWishlist(userId) {
    if (memoryCache && memoryCache.length > 0) return memoryCache;
    const key = userId ? `wishlist_${userId}` : 'guest_wishlist';
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          memoryCache = parsed;
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
    // 1. Nếu có userId, ưu tiên gọi API theo User
    if (userId) {
      try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}/wishlist`);
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            memoryCache = data;
            localStorage.setItem(`wishlist_${userId}`, JSON.stringify(data));
            return { success: true, data };
          }
        }
      } catch (err) {
        console.warn('Lỗi kết nối API User Wishlist:', err);
      }
    }

    // 2. Kiểm tra bộ nhớ đệm local của guest nếu đã có thao tác chỉnh sửa
    const guestLocal = localStorage.getItem('guest_wishlist');
    if (guestLocal) {
      try {
        const parsed = JSON.parse(guestLocal);
        if (Array.isArray(parsed) && parsed.length > 0) {
          memoryCache = parsed;
          return { success: true, data: parsed, isLocal: true };
        }
      } catch (e) {}
    }

    // 3. Lấy dữ liệu homestay động từ CSDL qua public API
    try {
      const response = await fetch(`${API_BASE_URL}/public/wishlist`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          memoryCache = data;
          localStorage.setItem('guest_wishlist', JSON.stringify(data));
          return { success: true, data };
        }
      }
    } catch (err) {
      console.warn('Lỗi lấy public wishlist từ CSDL, fallback sang cache:', err);
    }

    // 4. Fallback cuối cùng
    const cached = this.getCachedWishlist(userId);
    return { success: Boolean(cached), data: cached || [] };
  },

  /**
   * Thêm homestay vào danh sách yêu thích trong CSDL
   */
  async addToWishlist(userId, homestayId, homestayObj = null) {
    memoryCache = null; // Invalidate cache
    const targetId = Number(homestayId);

    // Đồng bộ ngay lập tức vào bộ nhớ cache của client
    const cacheKey = userId ? `wishlist_${userId}` : 'guest_wishlist';
    try {
      const raw = localStorage.getItem(cacheKey);
      let list = raw ? JSON.parse(raw) : [];
      if (!list.some(item => Number(item.id || item.homestayId) === targetId)) {
        if (homestayObj) {
          list.unshift(homestayObj);
        } else {
          list.unshift({ id: targetId, homestayId: targetId });
        }
        localStorage.setItem(cacheKey, JSON.stringify(list));
      }
    } catch (e) {}

    // Gửi yêu cầu lưu vào CSDL qua backend API
    if (userId) {
      try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}/wishlist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ homestayId: targetId }),
        });
        if (response.ok) {
          const res = await response.json();
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
      } catch (err) {
        console.warn('Lỗi thêm yêu thích vào DB:', err);
      }
    }

    return { success: true };
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
          method: 'DELETE',
        });
        if (response.ok) {
          return { success: true };
        }
      } catch (err) {
        console.warn('Lỗi xóa yêu thích trong DB:', err);
      }
    }

    return { success: true };
  },

  /**
   * Xóa toàn bộ homestay trong danh sách yêu thích
   */
  async clearWishlist(userId) {
    memoryCache = null; // Invalidate cache
    if (userId) {
      try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}/wishlist`, {
          method: 'DELETE',
        });
        if (response.ok) {
          localStorage.removeItem(`wishlist_${userId}`);
          return { success: true };
        }
      } catch (err) {
        console.warn('Lỗi xóa sạch yêu thích trong DB:', err);
      }
    }
    localStorage.removeItem('guest_wishlist');
    return { success: true };
  }
};
