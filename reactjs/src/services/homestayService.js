const API_BASE_URL = 'http://localhost:8081/api/public/homestays';

// Bộ nhớ đệm tầng Client để tăng tốc độ tải trang lên tức thì (0ms)
const memoryCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 phút

function getFromStorage(key) {
  try {
    const raw = sessionStorage.getItem(`yen_cache_${key}`);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp < CACHE_TTL) {
      return data;
    }
  } catch (e) {
    // Ignore storage errors
  }
  return null;
}

function setToStorage(key, data) {
  try {
    sessionStorage.setItem(`yen_cache_${key}`, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (e) {
    // Ignore quota errors
  }
}

export const homestayService = {
  /**
   * Lấy toàn bộ danh sách homestay kèm phòng thật từ database (có cache)
   */
  async getAllHomestays(forceRefresh = false) {
    const cacheKey = 'all_homestays';
    if (!forceRefresh) {
      if (memoryCache.has(cacheKey)) {
        return memoryCache.get(cacheKey);
      }
      const cached = getFromStorage(cacheKey);
      if (cached) {
        memoryCache.set(cacheKey, cached);
        return cached;
      }
    }

    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        memoryCache.set(cacheKey, data);
        setToStorage(cacheKey, data);
      }
      return data;
    } catch (error) {
      console.warn('Lỗi khi tải danh sách homestay từ database:', error.message);
      return memoryCache.get(cacheKey) || getFromStorage(cacheKey) || [];
    }
  },

  /**
   * Tìm kiếm homestay trực tiếp từ Database theo từ khóa
   */
  async searchHomestays(query) {
    try {
      const q = query ? query.trim() : '';
      const url = q ? `${API_BASE_URL}?q=${encodeURIComponent(q)}` : API_BASE_URL;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.warn('Lỗi khi tìm kiếm homestay từ database:', error.message);
      return [];
    }
  },

  /**
   * Lấy chi tiết homestay theo ID kèm phòng thật từ database (tốc độ cao có cache)
   */
  async getHomestayById(id, forceRefresh = false) {
    if (!id) return null;
    const cacheKey = `homestay_${id}`;

    if (!forceRefresh) {
      if (memoryCache.has(cacheKey)) {
        return memoryCache.get(cacheKey);
      }
      const cached = getFromStorage(cacheKey);
      if (cached) {
        memoryCache.set(cacheKey, cached);
        return cached;
      }
    }

    try {
      const response = await fetch(`${API_BASE_URL}/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data) {
        memoryCache.set(cacheKey, data);
        setToStorage(cacheKey, data);
      }
      return data;
    } catch (error) {
      console.warn(`Lỗi khi tải homestay ${id} từ database:`, error.message);
      return memoryCache.get(cacheKey) || getFromStorage(cacheKey) || null;
    }
  },

  /**
   * Lấy danh sách phòng thuộc homestay từ database
   */
  async getHomestayRooms(id, forceRefresh = false) {
    if (!id) return [];
    const cacheKey = `rooms_${id}`;

    if (!forceRefresh) {
      if (memoryCache.has(cacheKey)) {
        return memoryCache.get(cacheKey);
      }
      const cached = getFromStorage(cacheKey);
      if (cached) {
        memoryCache.set(cacheKey, cached);
        return cached;
      }
    }

    try {
      const response = await fetch(`${API_BASE_URL}/${id}/rooms`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        memoryCache.set(cacheKey, data);
        setToStorage(cacheKey, data);
      }
      return data;
    } catch (error) {
      console.warn(`Lỗi khi tải phòng của homestay ${id} từ database:`, error.message);
      return memoryCache.get(cacheKey) || getFromStorage(cacheKey) || [];
    }
  }
};
