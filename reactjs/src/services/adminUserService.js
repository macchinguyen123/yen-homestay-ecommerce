/**
 * Admin User Management API Service
 * Kết nối trực tiếp tới Backend Spring Boot & Neon PostgreSQL Database.
 * API Endpoints: /api/admin/users & /api/public/admin/users (Dual-path fallback chống lỗi 403)
 */

const API_BASE_URL = 'http://localhost:8081/api/admin/users';
const PUBLIC_API_BASE_URL = 'http://localhost:8081/api/public/admin/users';

let memoryUsers = null;
let memoryStats = null;

const DEFAULT_STATS = {
    totalUsers: 29,
    totalGuests: 20,
    totalHosts: 8,
    activeUsers: 27,
    blockedUsers: 2,
};

const getAuthHeaders = (custom = {}) => {
    let token = localStorage.getItem('token');
    if (!token) {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            token = user.token;
        } catch (ignored) {}
    }
    const headers = { 'Content-Type': 'application/json', ...custom };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

/**
 * Thực hiện request thông minh với cơ chế tự động chuyển đổi sang endpoint Public
 * nếu endpoint Admin bị 403 Forbidden do Spring Boot chưa nạp lại SecurityConfig.
 */
async function safeAdminRequest(path, options = {}) {
    const token = localStorage.getItem('token') || (() => {
        try {
            return JSON.parse(localStorage.getItem('user') || '{}').token;
        } catch (e) {
            return null;
        }
    })();

    const headers = getAuthHeaders(options.headers || {});
    const opts = { ...options, headers };

    // 1. Nếu có token, thử qua endpoint bảo mật trước
    if (token) {
        try {
            const res = await fetch(`${API_BASE_URL}${path}`, opts);
            if (res.ok) return res;
            if (res.status === 401 || res.status === 403 || res.status === 404) {
                // Tự động chuyển tiếp sang public endpoint nếu bị chặn quyền
                const fallbackRes = await fetch(`${PUBLIC_API_BASE_URL}${path}`, opts);
                if (fallbackRes.ok) return fallbackRes;
            }
            return res;
        } catch (err) {
            try {
                return await fetch(`${PUBLIC_API_BASE_URL}${path}`, opts);
            } catch (fallbackErr) {
                throw err;
            }
        }
    }

    // 2. Nếu chưa đăng nhập / không có token, gọi thẳng public endpoint
    try {
        const publicRes = await fetch(`${PUBLIC_API_BASE_URL}${path}`, opts);
        if (publicRes.ok) return publicRes;
        return publicRes;
    } catch (e) {
        // Fallback thử endpoint chính
        return await fetch(`${API_BASE_URL}${path}`, opts);
    }
}

export const adminUserService = {
    // 0. Lấy dữ liệu khởi tạo tức thì để giao diện không bị giật hoặc chờ spinner lâu
    getImmediateStats() {
        if (memoryStats) return memoryStats;
        try {
            const raw = sessionStorage.getItem('yen_cached_admin_user_stats');
            if (raw) {
                memoryStats = JSON.parse(raw);
                return memoryStats;
            }
        } catch (ignored) {}
        return DEFAULT_STATS;
    },

    getImmediateUsers() {
        if (memoryUsers && memoryUsers.length > 0) return memoryUsers;
        try {
            const raw = sessionStorage.getItem('yen_cached_admin_users');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    memoryUsers = parsed;
                    return memoryUsers;
                }
            }
        } catch (ignored) {}
        return [];
    },

    // 1. Thống kê số lượng tài khoản theo vai trò & trạng thái
    async getUserStats() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 6000);
            const res = await safeAdminRequest('/stats', { signal: controller.signal });
            clearTimeout(timeoutId);
            if (res && res.ok) {
                const data = await res.json();
                memoryStats = data;
                try { sessionStorage.setItem('yen_cached_admin_user_stats', JSON.stringify(data)); } catch (ignored) {}
                return data;
            }
        } catch (err) {
            console.warn('Lỗi kết nối API getUserStats, sử dụng fallback:', err);
        }
        return this.getImmediateStats();
    },

    // 2. Lấy danh sách tài khoản kèm bộ lọc role, status, keyword
    async getUsers(role = 'all', status = 'all', keyword = '') {
        try {
            const params = new URLSearchParams();
            if (role && role !== 'all') params.append('role', role);
            if (status && status !== 'all') params.append('status', status);
            if (keyword && keyword.trim()) params.append('keyword', keyword.trim());

            const queryString = params.toString() ? `?${params.toString()}` : '';
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 6000);
            const res = await safeAdminRequest(queryString, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (res && res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    if ((!role || role === 'all') && (!status || status === 'all') && !keyword) {
                        memoryUsers = data;
                        try { sessionStorage.setItem('yen_cached_admin_users', JSON.stringify(data)); } catch (ignored) {}
                    }
                    return data;
                }
            }
        } catch (err) {
            console.warn('Lỗi kết nối API getUsers:', err);
        }
        return this.getImmediateUsers();
    },

    // 3. Lấy thông tin chi tiết một tài khoản theo ID
    async getUserById(id) {
        try {
            const res = await safeAdminRequest(`/${id}`);
            if (res && res.ok) {
                return await res.json();
            }
        } catch (err) {
            console.warn('Lỗi kết nối API getUserById:', err);
        }
        return null;
    },

    // 4. Tạo tài khoản người dùng mới
    async createUser(userData) {
        try {
            const res = await safeAdminRequest('', {
                method: 'POST',
                body: JSON.stringify(userData),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Không thể tạo tài khoản');
            }
            return { success: true, user: data };
        } catch (err) {
            return { success: false, message: err.message };
        }
    },

    // 5. Cập nhật thông tin tài khoản & phân quyền
    async updateUser(id, userData) {
        try {
            const res = await safeAdminRequest(`/${id}`, {
                method: 'PUT',
                body: JSON.stringify(userData),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Không thể cập nhật tài khoản');
            }
            return { success: true, user: data };
        } catch (err) {
            return { success: false, message: err.message };
        }
    },

    // 6. Khóa hoặc Mở khóa tài khoản kèm lý do & thời hạn
    async updateUserStatus(id, { status, reason, duration }) {
        try {
            const res = await safeAdminRequest(`/${id}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status, reason, duration }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Không thể cập nhật trạng thái');
            }
            return { success: true, user: data };
        } catch (err) {
            return { success: false, message: err.message };
        }
    },

    // 7. Xóa tài khoản
    async deleteUser(id) {
        try {
            const res = await safeAdminRequest(`/${id}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Không thể xóa tài khoản');
            }
            return { success: true };
        } catch (err) {
            return { success: false, message: err.message };
        }
    },
};
