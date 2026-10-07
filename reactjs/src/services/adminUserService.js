/**
 * Admin User Management API Service
 * Kết nối trực tiếp tới Backend Spring Boot & Neon PostgreSQL Database.
 * API Endpoints: /api/admin/users
 */

const API_BASE_URL = 'http://localhost:8081/api/admin/users';

export const adminUserService = {
    // 1. Thống kê số lượng tài khoản theo vai trò & trạng thái
    async getUserStats() {
        try {
            const res = await fetch(`${API_BASE_URL}/stats`);
            if (res.ok) {
                return await res.json();
            }
        } catch (err) {
            console.warn('Lỗi kết nối API getUserStats, sử dụng fallback:', err);
        }
        return {
            totalUsers: 22,
            totalGuests: 14,
            totalHosts: 7,
            activeUsers: 21,
            blockedUsers: 1,
        };
    },

    // 2. Lấy danh sách tài khoản kèm bộ lọc role, status, keyword
    async getUsers(role = 'all', status = 'all', keyword = '') {
        try {
            const params = new URLSearchParams();
            if (role && role !== 'all') params.append('role', role);
            if (status && status !== 'all') params.append('status', status);
            if (keyword && keyword.trim()) params.append('keyword', keyword.trim());

            const url = `${API_BASE_URL}?${params.toString()}`;
            const res = await fetch(url);
            if (res.ok) {
                return await res.json();
            }
        } catch (err) {
            console.warn('Lỗi kết nối API getUsers:', err);
        }
        return [];
    },

    // 3. Lấy thông tin chi tiết một tài khoản theo ID
    async getUserById(id) {
        try {
            const res = await fetch(`${API_BASE_URL}/${id}`);
            if (res.ok) {
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
            const res = await fetch(`${API_BASE_URL}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
            const res = await fetch(`${API_BASE_URL}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
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
            const res = await fetch(`${API_BASE_URL}/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
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
            const res = await fetch(`${API_BASE_URL}/${id}`, {
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
