/**
 * Admin Reports & Statistics API Service
 * Kết nối trực tiếp tới Backend Spring Boot & CSDL Neon PostgreSQL.
 * API Endpoints: /api/admin/reports
 */

const API_BASE_URL = 'http://localhost:8081/api/admin/reports';

export const adminReportService = {
    /**
     * Lấy dữ liệu báo cáo tổng hợp theo khoảng thời gian.
     * Trả về object data nếu thành công, hoặc ném lỗi nếu thất bại.
     * Timeout 15 giây để chờ Neon Cloud phản hồi.
     */
    async getReportSummary(period = '30days', startDate = '', endDate = '') {
        const controller = new AbortController();
        // Neon Cloud có thể chậm, đặt timeout 15 giây
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        try {
            const params = new URLSearchParams();
            if (period) params.append('period', period);
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);

            const url = `${API_BASE_URL}/summary?${params.toString()}`;
            console.log('[adminReportService] Gọi API:', url);

            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`HTTP ${res.status}: ${errText}`);
            }

            const data = await res.json();
            console.log('[adminReportService] Nhận dữ liệu thành công:', data?.period);

            if (data && data.revenue) {
                return data;
            }

            throw new Error('Dữ liệu API không hợp lệ (thiếu trường revenue)');

        } catch (err) {
            clearTimeout(timeoutId);
            if (err.name === 'AbortError') {
                throw new Error('Kết nối timeout (>15s) - Vui lòng kiểm tra backend đang chạy.');
            }
            throw err;
        }
    }
};
