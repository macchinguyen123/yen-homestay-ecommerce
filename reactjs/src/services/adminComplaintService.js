/**
 * Admin Complaints & Dispute Management API Service
 * Kết nối trực tiếp tới Backend Spring Boot & CSDL Neon PostgreSQL
 * API Endpoints: /api/admin/complaints
 */

const API_BASE_URL = 'http://localhost:8081/api/admin/complaints';

export const adminComplaintService = {
    /**
     * Lấy danh sách khiếu nại theo bộ lọc
     */
    async getComplaints({ direction = 'all', status = 'all', severity = 'all', search = '' } = {}) {
        const params = new URLSearchParams();
        if (direction && direction !== 'all') params.append('direction', direction);
        if (status && status !== 'all') params.append('status', status);
        if (severity && severity !== 'all') params.append('severity', severity);
        if (search && search.trim()) params.append('search', search.trim());

        const url = `${API_BASE_URL}?${params.toString()}`;
        const res = await fetch(url);
        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`HTTP ${res.status}: ${errText}`);
        }
        return await res.json();
    },

    /**
     * Lấy 4 chỉ số thống kê (KPI cards)
     */
    async getComplaintStats() {
        const res = await fetch(`${API_BASE_URL}/stats`);
        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`HTTP ${res.status}: ${errText}`);
        }
        return await res.json();
    },

    /**
     * Lấy danh sách các đơn đặt phòng thực tế trong CSDL để liên kết khiếu nại
     */
    async getAvailableBookings() {
        const res = await fetch(`${API_BASE_URL}/bookings`);
        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`HTTP ${res.status}: ${errText}`);
        }
        return await res.json();
    },

    /**
     * Lấy chi tiết khiếu nại theo ID
     */
    async getComplaintById(id) {
        const res = await fetch(`${API_BASE_URL}/${id}`);
        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`HTTP ${res.status}: ${errText}`);
        }
        return await res.json();
    },

    /**
     * Ban hành quyết định hòa giải / xử lý khiếu nại
     */
    async resolveComplaint(id, { action, amount, adminNote }) {
        const res = await fetch(`${API_BASE_URL}/${id}/resolve`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action,
                amount: Number(amount) || 0,
                adminNote: adminNote || ''
            })
        });
        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`HTTP ${res.status}: ${errText}`);
        }
        return await res.json();
    },

    /**
     * Ghi nhận hồ sơ khiếu nại mới từ hotline hoặc trực tiếp
     */
    async createComplaint(payload) {
        const res = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`HTTP ${res.status}: ${errText}`);
        }
        return await res.json();
    }
};

export default adminComplaintService;
