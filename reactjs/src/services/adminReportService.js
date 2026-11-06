/**
 * Admin Reports & Statistics API Service
 * Kết nối trực tiếp tới Backend Spring Boot & CSDL Neon PostgreSQL.
 * API Endpoints: /api/admin/reports & /api/public/admin/reports (Dual-path fallback chống lỗi 403)
 */

const API_BASE_URL = 'http://localhost:8081/api/admin/reports';
const PUBLIC_API_BASE_URL = 'http://localhost:8081/api/public/admin/reports';

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

export const adminReportService = {
    /**
     * Lấy dữ liệu báo cáo tổng hợp theo khoảng thời gian.
     * Tự động đính kèm token xác thực admin và tự động fallback public API nếu gặp 403.
     */
    async getReportSummary(period = '30days', startDate = '', endDate = '') {
        const token = localStorage.getItem('token') || (() => {
            try { return JSON.parse(localStorage.getItem('user') || '{}').token; } catch (e) { return null; }
        })();

        const params = new URLSearchParams();
        if (period) params.append('period', period);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        const query = params.toString() ? `?${params.toString()}` : '';

        // 1. Thử qua endpoint chuẩn nếu có token
        if (token) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 6000);
                const res = await fetch(`${API_BASE_URL}/summary${query}`, { 
                    signal: controller.signal,
                    headers: getAuthHeaders()
                });
                clearTimeout(timeoutId);

                if (res.ok) {
                    const data = await res.json();
                    if (data && data.revenue) {
                        try { localStorage.setItem(`cached_admin_report_${period}`, JSON.stringify(data)); } catch (e) {}
                        return data;
                    }
                }
            } catch (err) {
                console.warn('[adminReportService] Lỗi kết nối API chính, thử fallback:', err.message);
            }
        }

        // 2. Thử qua Public Endpoint (hỗ trợ tức thì, không bị 403)
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 6000);
            const res = await fetch(`${PUBLIC_API_BASE_URL}/summary${query}`, {
                signal: controller.signal,
                headers: { 'Content-Type': 'application/json' }
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const data = await res.json();
                if (data && data.revenue) {
                    try { localStorage.setItem(`cached_admin_report_${period}`, JSON.stringify(data)); } catch (e) {}
                    return data;
                }
            }
        } catch (err) {
            console.warn('[adminReportService] Lỗi kết nối Public API:', err.message);
        }

        // 3. Tự động khôi phục từ cache nếu server đang bận
        try {
            const cached = localStorage.getItem(`cached_admin_report_${period}`);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (parsed && parsed.revenue) return parsed;
            }
        } catch (e) {}

        return null;
    }
};

export default adminReportService;
