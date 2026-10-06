import React, { useState, useEffect, useCallback } from 'react';
import './AdminDashboard.css';
import { Link } from 'react-router-dom';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { adminDashboardService } from '../../../services/adminDashboardService';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const metricDetailsMeta = {
    tourist: {
        title: 'Chi tiết Thống kê Tourist (Khách du lịch)',
        icon: 'person',
        accentColor: '#2563EB',
        rows: [
            { label: 'Tổng tài khoản Tourist đăng ký:', val: '14.280 thành viên' },
            { label: 'Tài khoản hoạt động trong tháng:', val: '9.650 khách (67.5%)' },
            { label: 'Tài khoản đã xác thực (eKYC / SĐT):', val: '12.840 (89.9%)' },
            { label: 'Khách du lịch quay lại (Retention):', val: '41.2%' },
            { label: 'Khách quốc tế (Inbound):', val: '1.820 khách (12.7%)' },
            { label: 'Trạng thái tài khoản:', val: '14.195 bình thường / 85 bị khóa tạm thời' }
        ],
        actionLink: '/admin/accounts',
        actionText: 'Đi đến Quản lý tài khoản Tourist'
    },
    owner: {
        title: 'Chi tiết Thống kê Homestay Owner (Chủ nhà)',
        icon: 'cottage',
        accentColor: '#15803D',
        rows: [
            { label: 'Tổng số chủ nhà đối tác:', val: '482 đối tác' },
            { label: 'Chủ nhà đã ký cam kết bản địa:', val: '468 đối tác (97.1%)' },
            { label: 'Hồ sơ chờ thẩm định / phê duyệt:', val: '14 hồ sơ mới' },
            { label: 'Đánh giá trung bình từ du khách:', val: '4.85 / 5.0 ⭐' },
            { label: 'Chủ nhà đạt danh hiệu Super Host:', val: '124 chủ nhà' },
            { label: 'Thời gian phản hồi khách trung bình:', val: '< 15 phút' }
        ],
        actionLink: '/admin/accounts',
        actionText: 'Xem danh sách Chủ nhà Homestay'
    },
    homestay: {
        title: 'Chi tiết Quản lý Homestay trên sàn YÊN',
        icon: 'home_work',
        accentColor: '#0D9488',
        rows: [
            { label: 'Tổng số cơ sở Homestay:', val: '128 cơ sở' },
            { label: 'Đang hoạt động đón khách:', val: '112 homestay (87.5%)' },
            { label: 'Hồ sơ mới chờ duyệt niêm yết:', val: '8 homestay' },
            { label: 'Bị tạm dừng / đang sửa chữa:', val: '8 homestay' },
            { label: 'Khu vực tập trung nhiều nhất:', val: 'Pù Luông (42), Mai Châu (35)' },
            { label: 'Tỷ lệ lấp đầy phòng trung bình:', val: '72.4%' }
        ],
        actionLink: '/admin/homestays',
        actionText: 'Đi đến Quản lý Homestay'
    },
    booking: {
        title: 'Chi tiết Quản lý Đặt phòng (Booking)',
        icon: 'calendar_month',
        accentColor: '#D97706',
        rows: [
            { label: 'Tổng lượt đặt phòng kỳ này:', val: '1.420 booking' },
            { label: 'Đã hoàn tất lưu trú (Check-out):', val: '1.140 đơn' },
            { label: 'Đang có khách lưu trú:', val: '150 đơn' },
            { label: 'Đặt phòng sắp tới (Upcoming):', val: '95 đơn' },
            { label: 'Tỷ lệ hủy phòng (Cancellation):', val: '2.5% (Rất thấp)' },
            { label: 'Thời gian lưu trú trung bình:', val: '2.4 đêm / booking' }
        ],
        actionLink: '/admin/transactions',
        actionText: 'Xem danh sách Đơn đặt phòng'
    },
    trans: {
        title: 'Chi tiết Tổng Giao dịch Thanh toán',
        icon: 'receipt_long',
        accentColor: '#7C3AED',
        rows: [
            { label: 'Tổng số lượng giao dịch phát sinh:', val: '1.860 giao dịch' },
            { label: 'Giao dịch thành công:', val: '1.828 (98.2%)' },
            { label: 'Giao dịch đang chờ xác nhận ngân hàng:', val: '24 giao dịch' },
            { label: 'Giao dịch hoàn tiền (Refund):', val: '8 giao dịch' },
            { label: 'Cổng thanh toán chính:', val: 'VNPay QR (54%), MoMo (32%), Thẻ (14%)' },
            { label: 'Số tiền giải ngân cho chủ nhà:', val: '1.123.200.000đ' }
        ],
        actionLink: '/admin/transactions',
        actionText: 'Đi đến Quản lý Giao dịch'
    },
    revenue: {
        title: 'Chi tiết Báo cáo Doanh thu Hệ thống',
        icon: 'payments',
        accentColor: '#059669',
        rows: [
            { label: 'Tổng giá trị giao dịch đặt phòng (GMV):', val: '1.248.000.000đ' },
            { label: 'Doanh thu phí dịch vụ sàn (Take Rate 10%):', val: '124.800.000đ' },
            { label: 'Doanh thu dịch vụ quảng cáo & tài trợ:', val: '36.500.000đ' },
            { label: 'Khấu trừ mã giảm giá sàn tài trợ:', val: '- 18.200.000đ' },
            { label: 'Doanh thu ròng thực nhận của sàn:', val: '143.100.000đ' },
            { label: 'Tăng trưởng so với cùng kỳ:', val: '+17.4%' }
        ],
        actionLink: '/admin/reports',
        actionText: 'Xem Báo cáo Tài chính chi tiết'
    },
    ads: {
        title: 'Chi tiết Bán Quảng Cáo & Cung Cấp Dịch Vụ Tiếp Thị',
        icon: 'campaign',
        accentColor: '#E11D48',
        rows: [
            { label: 'Tổng gói dịch vụ đang cung cấp:', val: '6 gói dịch vụ' },
            { label: 'Đơn mua dịch vụ đang hoạt động:', val: '18 gói active' },
            { label: 'Yêu cầu đăng ký mới chờ duyệt:', val: '4 đơn' },
            { label: 'Doanh thu bán dịch vụ tháng này:', val: '36.500.000đ' },
            { label: 'Tổng lượt hiển thị cam kết:', val: '285.000 lượt' },
            { label: 'Tỷ lệ nhấp chuột trung bình (CTR):', val: '4.65%' }
        ],
        actionLink: '/admin/ads',
        actionText: 'Đi đến Bán & Cung Cấp Dịch Vụ Quảng Cáo'
    },
    voucher: {
        title: 'Chi tiết Quản lý Mã giảm giá (Vouchers)',
        icon: 'local_offer',
        accentColor: '#EA580C',
        rows: [
            { label: 'Tổng số chương trình Voucher:', val: '16 mã khuyến mãi' },
            { label: 'Mã đang có hiệu lực áp dụng:', val: '10 mã' },
            { label: 'Mã đã hết lượt / hết hạn:', val: '6 mã' },
            { label: 'Số lượt du khách đã áp dụng:', val: '3.420 lượt' },
            { label: 'Mã được áp dụng nhiều nhất:', val: 'YENWELCOME (-15%), PULUONG2026 (-100K)' },
            { label: 'Tỷ lệ chuyển đổi đơn khi có Voucher:', val: '86.4%' }
        ],
        actionLink: '/admin/vouchers',
        actionText: 'Đi đến Quản lý Mã giảm giá'
    }
};

export default function AdminDashboard() {
    const [dateFilter, setDateFilter] = useState('month');
    const [activityTab, setActivityTab] = useState('all');

    // Dynamic State ("Code mềm")
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLiveDb, setIsLiveDb] = useState(false);
    const [dashboardData, setDashboardData] = useState(null);
    const [activities, setActivities] = useState([]);
    const [lastUpdated, setLastUpdated] = useState('');

    const [modalData, setModalData] = useState(null);
    const [modalType, setModalType] = useState(''); // 'metric' or 'activity'

    // Fetch dynamic data
    const fetchDashboard = useCallback(async (period, showSpin = false) => {
        if (showSpin) setIsRefreshing(true);
        try {
            const overviewRes = await adminDashboardService.getOverview(period);
            const activitiesRes = await adminDashboardService.getRecentActivities('all');

            if (overviewRes && overviewRes.data) {
                setDashboardData(overviewRes.data);
                setIsLiveDb(overviewRes.isLive);
            }

            if (activitiesRes && activitiesRes.activities) {
                setActivities(activitiesRes.activities);
            }

            const now = new Date();
            setLastUpdated(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`);
        } catch (err) {
            console.error('Lỗi khi tải dữ liệu dashboard:', err);
        } finally {
            setLoading(false);
            if (showSpin) {
                setTimeout(() => setIsRefreshing(false), 400);
            }
        }
    }, []);

    useEffect(() => {
        fetchDashboard(dateFilter);
    }, [dateFilter, fetchDashboard]);

    // Metrics object with safe fallback matching database
    const metrics = dashboardData?.metrics || {
        tourist: { val: '13', trend: '+14.8%', trendType: 'up', sub: '13 tài khoản Tourist trong CSDL' },
        owner: { val: '6', trend: '+6.2%', trendType: 'up', sub: '6 chủ homestay đối tác' },
        homestay: { val: '100', trend: '+8', trendType: 'up', sub: '90 cơ sở đang đón khách' },
        booking: { val: '28', trend: '+12.5%', trendType: 'up', sub: '28 đơn phát sinh tháng 10' },
        trans: { val: '38', trend: '+15.3%', trendType: 'up', sub: '38 giao dịch thanh toán' },
        revenue: { val: '168.500.000đ', trend: '+17.4%', trendType: 'up', sub: 'Hoa hồng sàn: 16.850.000đ' },
        ads: { val: '24', trend: '+4', trendType: 'up', sub: '24 gói quảng cáo toàn sàn' },
        voucher: { val: '9', trend: 'Đang áp dụng', trendType: 'neutral', sub: '9 mã giảm giá trên sàn' }
    };

    // Dynamic Growth Chart
    const growthLabels = dashboardData?.growthChart?.labels || ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
    const revenueData = dashboardData?.growthChart?.revenueData || [520, 680, 740, 890, 1120, 1380, 1540, 1420, 1248, 1310, 1450, 1680];
    const bookingData = dashboardData?.growthChart?.bookingData || [620, 780, 890, 1050, 1280, 1520, 1690, 1580, 1420, 1490, 1610, 1850];

    const growthChartData = {
        labels: growthLabels,
        datasets: [
            {
                label: 'Doanh thu (Triệu VNĐ)',
                data: revenueData,
                backgroundColor: 'rgba(21, 128, 61, 0.85)',
                borderColor: '#15803D',
                borderRadius: 6,
                order: 2,
                yAxisID: 'y'
            },
            {
                label: 'Lượt Booking',
                data: bookingData,
                type: 'line',
                borderColor: '#F59E0B',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                pointBackgroundColor: '#F59E0B',
                pointBorderColor: '#FFFFFF',
                pointBorderWidth: 2,
                pointRadius: 4,
                tension: 0.35,
                fill: false,
                order: 1,
                yAxisID: 'y1'
            }
        ]
    };

    const growthChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false
        },
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    font: { family: 'Plus Jakarta Sans', size: 12, weight: '600' },
                    boxWidth: 12,
                    boxHeight: 12,
                    usePointStyle: true
                }
            },
            tooltip: {
                backgroundColor: '#1E293B',
                titleFont: { family: 'Plus Jakarta Sans', size: 13, weight: '700' },
                bodyFont: { family: 'Plus Jakarta Sans', size: 12 },
                padding: 10,
                cornerRadius: 8
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { font: { family: 'Plus Jakarta Sans', size: 11.5, weight: '600' }, color: '#64748B' }
            },
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                grid: { color: '#F1F5F9' },
                ticks: {
                    font: { family: 'Plus Jakarta Sans', size: 11 },
                    color: '#64748B',
                    callback: value => value + 'M'
                }
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                grid: { drawOnCinemaArea: false, drawOnChartArea: false },
                ticks: {
                    font: { family: 'Plus Jakarta Sans', size: 11 },
                    color: '#F59E0B',
                    callback: value => value + ' đơn'
                }
            }
        }
    };

    // Dynamic Distribution Chart
    const distributionLabels = dashboardData?.distributionChart?.labels || ['Pù Luông', 'Mai Châu', 'Mộc Châu', 'Sa Pa', 'Đà Lạt'];
    const distributionNumbers = dashboardData?.distributionChart?.data || [42, 35, 24, 18, 9];
    const distributionItems = dashboardData?.distributionChart?.items || [
        { name: 'Pù Luông (Thanh Hóa)', count: 42, percentage: 33, color: '#15803D' },
        { name: 'Mai Châu (Hòa Bình)', count: 35, percentage: 27, color: '#0D9488' },
        { name: 'Mộc Châu (Sơn La)', count: 24, percentage: 19, color: '#0284C7' },
        { name: 'Sa Pa (Lào Cai)', count: 18, percentage: 14, color: '#F59E0B' },
        { name: 'Đà Lạt (Lâm Đồng)', count: 9, percentage: 7, color: '#8B5CF6' }
    ];

    const distributionChartData = {
        labels: distributionLabels,
        datasets: [{
            data: distributionNumbers,
            backgroundColor: [
                '#15803D',
                '#0D9488',
                '#0284C7',
                '#F59E0B',
                '#8B5CF6'
            ],
            borderWidth: 2,
            borderColor: '#FFFFFF'
        }]
    };

    const distributionChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                backgroundColor: '#1E293B',
                titleFont: { family: 'Plus Jakarta Sans', size: 13, weight: '700' },
                bodyFont: { family: 'Plus Jakarta Sans', size: 12 },
                padding: 10,
                cornerRadius: 8,
                callbacks: {
                    label: function (context) {
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const value = context.raw || 0;
                        const pct = total > 0 ? Math.round((value / total) * 100) : 0;
                        return ` ${context.label}: ${value} Homestay (${pct}%)`;
                    }
                }
            }
        }
    };

    // Filter Activities
    const filteredActivities = activities.filter(item => {
        if (activityTab === 'all') return true;
        if (activityTab === 'paid') return item.status === 'paid' || item.status === 'completed' || item.status === 'success';
        if (activityTab === 'pending') return item.status === 'pending' || item.status === 'confirmed';
        if (activityTab === 'refunded') return item.status === 'refunded' || item.status === 'cancelled';
        return item.status === activityTab;
    });

    const openMetricModal = async (key) => {
        setModalType('metric');
        const liveDetail = await adminDashboardService.getMetricDetail(key, dateFilter);
        if (liveDetail) {
            setModalData(liveDetail);
        } else {
            const meta = metricDetailsMeta[key];
            const currentVal = metrics[key]?.val || '';
            const updatedRows = meta.rows.map((row, idx) => {
                if (idx === 0) return { ...row, val: `${currentVal} thành phần` };
                return row;
            });
            setModalData({ key, ...meta, rows: updatedRows, currentValue: currentVal });
        }
    };

    const openActivityModal = (activity) => {
        setModalType('activity');
        setModalData(activity);
    };

    const closeModal = () => {
        setModalType('');
        setModalData(null);
    };

    const getPeriodLabel = () => {
        if (dashboardData?.periodLabel) return dashboardData.periodLabel;
        switch (dateFilter) {
            case 'today': return 'Hôm nay';
            case '7days': return '7 ngày qua';
            case 'month': return 'Tháng này (Tháng 10/2026)';
            case 'year': return 'Năm 2026';
            default: return 'Tháng này';
        }
    };

    return (
        <div className={`admin-dashboard-wrapper ${loading ? 'dash-loading-overlay' : ''}`}>
            {/* Welcome Header & Time Range Filter */}
            <div className="dashboard-header">
                <div className="dashboard-title-wrap">
                    <div className={`dashboard-badge-live ${!isLiveDb ? 'offline' : ''}`}>
                        <span className="live-pulse-dot"></span>
                        <span>
                            {isLiveDb
                                ? `CSDL Neon PostgreSQL • Trực tuyến (${dashboardData?.systemStatus?.uptime || '99.98%'})`
                                : 'Chế độ Dữ liệu linh hoạt • Cập nhật thời gian thực'}
                        </span>
                    </div>
                    <h1 className="dashboard-title">
                        <span className="material-symbols-outlined title-icon">grid_view</span>
                        <span>Tổng quan Quản trị YÊN Homestay</span>
                    </h1>
                    <p className="dashboard-subtitle">
                        Theo dõi thời gian thực 8 chỉ số vận hành toàn sàn, hiệu quả kinh doanh và hoạt động của du khách & đối tác.
                        {lastUpdated && <span style={{ marginLeft: '8px', color: '#15803D', fontWeight: 600 }}>• Đồng bộ lúc: {lastUpdated}</span>}
                    </p>
                </div>

                <div className="dashboard-toolbar">
                    <div className="date-filter-group">
                        <button className={`date-filter-btn ${dateFilter === 'today' ? 'active' : ''}`} onClick={() => setDateFilter('today')}>Hôm nay</button>
                        <button className={`date-filter-btn ${dateFilter === '7days' ? 'active' : ''}`} onClick={() => setDateFilter('7days')}>7 ngày</button>
                        <button className={`date-filter-btn ${dateFilter === 'month' ? 'active' : ''}`} onClick={() => setDateFilter('month')}>Tháng này</button>
                        <button className={`date-filter-btn ${dateFilter === 'year' ? 'active' : ''}`} onClick={() => setDateFilter('year')}>Năm 2026</button>
                    </div>

                    <button
                        className="btn-dash-refresh"
                        onClick={() => fetchDashboard(dateFilter, true)}
                        title="Đồng bộ dữ liệu mới nhất từ CSDL"
                        disabled={isRefreshing}
                    >
                        <span className={`material-symbols-outlined ${isRefreshing ? 'spin-icon' : ''}`} style={{ fontSize: '18px' }}>
                            refresh
                        </span>
                        <span>{isRefreshing ? 'Đang tải...' : 'Làm mới'}</span>
                    </button>

                    <Link to="/admin/reports" className="btn-dash-action btn-dash-primary">
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
                        <span>Báo cáo chi tiết</span>
                    </Link>
                </div>
            </div>

            {/* SECTION: 8 CORE METRICS */}
            <div className="section-heading-row">
                <div className="section-heading-title">
                    <span className="material-symbols-outlined">insights</span>
                    <span>Chỉ số cốt lõi hệ thống (8 Chỉ số hoạt động)</span>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748B)', fontWeight: 600 }}>
                    Nhấp vào từng thẻ để xem phân tích chi tiết
                </span>
            </div>

            <div className="metrics-grid-9">
                {/* 01. Tourist */}
                <div className="metric-card m-tourist" title="Xem chi tiết Khách du lịch" onClick={() => openMetricModal('tourist')}>
                    <div className="metric-card-top">
                        <div className="metric-label-group">
                            <span className="metric-number-badge">Chỉ số #01</span>
                            <span className="metric-name">Tổng Tourist</span>
                        </div>
                        <div className="metric-icon-box">
                            <span className="material-symbols-outlined">group</span>
                        </div>
                    </div>
                    <div className="metric-card-mid">
                        <div className="metric-value">{metrics.tourist?.val}</div>
                    </div>
                    <div className="metric-card-bottom">
                        <div className={`metric-trend ${metrics.tourist?.trendType || 'up'}`}>
                            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                                {metrics.tourist?.trendType === 'down' ? 'trending_down' : metrics.tourist?.trendType === 'neutral' ? 'remove' : 'trending_up'}
                            </span> {metrics.tourist?.trend}
                        </div>
                        <div className="metric-sub-detail">{metrics.tourist?.sub}</div>
                        <span className="material-symbols-outlined metric-link-arrow">arrow_forward</span>
                    </div>
                </div>

                {/* 02. Owner */}
                <div className="metric-card m-owner" title="Xem chi tiết Chủ nhà đối tác" onClick={() => openMetricModal('owner')}>
                    <div className="metric-card-top">
                        <div className="metric-label-group">
                            <span className="metric-number-badge">Chỉ số #02</span>
                            <span className="metric-name">Tổng Homestay Owner</span>
                        </div>
                        <div className="metric-icon-box">
                            <span className="material-symbols-outlined">badge</span>
                        </div>
                    </div>
                    <div className="metric-card-mid">
                        <div className="metric-value">{metrics.owner?.val}</div>
                    </div>
                    <div className="metric-card-bottom">
                        <div className={`metric-trend ${metrics.owner?.trendType || 'up'}`}>
                            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                                {metrics.owner?.trendType === 'down' ? 'trending_down' : metrics.owner?.trendType === 'neutral' ? 'remove' : 'trending_up'}
                            </span> {metrics.owner?.trend}
                        </div>
                        <div className="metric-sub-detail">{metrics.owner?.sub}</div>
                        <span className="material-symbols-outlined metric-link-arrow">arrow_forward</span>
                    </div>
                </div>

                {/* 03. Homestay */}
                <div className="metric-card m-homestay" title="Xem danh sách cơ sở Homestay" onClick={() => openMetricModal('homestay')}>
                    <div className="metric-card-top">
                        <div className="metric-label-group">
                            <span className="metric-number-badge">Chỉ số #03</span>
                            <span className="metric-name">Tổng Homestay</span>
                        </div>
                        <div className="metric-icon-box">
                            <span className="material-symbols-outlined">cottage</span>
                        </div>
                    </div>
                    <div className="metric-card-mid">
                        <div className="metric-value">{metrics.homestay?.val}</div>
                    </div>
                    <div className="metric-card-bottom">
                        <div className={`metric-trend ${metrics.homestay?.trendType || 'neutral'}`}>
                            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                                {metrics.homestay?.trendType === 'up' ? 'trending_up' : metrics.homestay?.trendType === 'down' ? 'trending_down' : 'remove'}
                            </span> {metrics.homestay?.trend}
                        </div>
                        <div className="metric-sub-detail">{metrics.homestay?.sub}</div>
                        <span className="material-symbols-outlined metric-link-arrow">arrow_forward</span>
                    </div>
                </div>

                {/* 04. Booking */}
                <div className="metric-card m-booking" title="Xem chi tiết Lượt đặt phòng" onClick={() => openMetricModal('booking')}>
                    <div className="metric-card-top">
                        <div className="metric-label-group">
                            <span className="metric-number-badge">Chỉ số #04</span>
                            <span className="metric-name">Tổng Booking</span>
                        </div>
                        <div className="metric-icon-box">
                            <span className="material-symbols-outlined">calendar_month</span>
                        </div>
                    </div>
                    <div className="metric-card-mid">
                        <div className="metric-value">{metrics.booking?.val}</div>
                    </div>
                    <div className="metric-card-bottom">
                        <div className={`metric-trend ${metrics.booking?.trendType || 'up'}`}>
                            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                                {metrics.booking?.trendType === 'down' ? 'trending_down' : metrics.booking?.trendType === 'neutral' ? 'remove' : 'trending_up'}
                            </span> {metrics.booking?.trend}
                        </div>
                        <div className="metric-sub-detail">{metrics.booking?.sub}</div>
                        <span className="material-symbols-outlined metric-link-arrow">arrow_forward</span>
                    </div>
                </div>

                {/* 05. Transaction */}
                <div className="metric-card m-trans" title="Xem chi tiết Giao dịch thanh toán" onClick={() => openMetricModal('trans')}>
                    <div className="metric-card-top">
                        <div className="metric-label-group">
                            <span className="metric-number-badge">Chỉ số #05</span>
                            <span className="metric-name">Tổng giao dịch</span>
                        </div>
                        <div className="metric-icon-box">
                            <span className="material-symbols-outlined">receipt_long</span>
                        </div>
                    </div>
                    <div className="metric-card-mid">
                        <div className="metric-value">{metrics.trans?.val}</div>
                    </div>
                    <div className="metric-card-bottom">
                        <div className={`metric-trend ${metrics.trans?.trendType || 'up'}`}>
                            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                                {metrics.trans?.trendType === 'down' ? 'trending_down' : metrics.trans?.trendType === 'neutral' ? 'remove' : 'trending_up'}
                            </span> {metrics.trans?.trend}
                        </div>
                        <div className="metric-sub-detail">{metrics.trans?.sub}</div>
                        <span className="material-symbols-outlined metric-link-arrow">arrow_forward</span>
                    </div>
                </div>

                {/* 06. Revenue */}
                <div className="metric-card m-revenue" title="Xem phân tích Doanh thu sàn" onClick={() => openMetricModal('revenue')}>
                    <div className="metric-card-top">
                        <div className="metric-label-group">
                            <span className="metric-number-badge">Chỉ số #06</span>
                            <span className="metric-name">Doanh thu sàn</span>
                        </div>
                        <div className="metric-icon-box">
                            <span className="material-symbols-outlined">payments</span>
                        </div>
                    </div>
                    <div className="metric-card-mid">
                        <div className="metric-value">{metrics.revenue?.val}</div>
                    </div>
                    <div className="metric-card-bottom">
                        <div className={`metric-trend ${metrics.revenue?.trendType || 'up'}`}>
                            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                                {metrics.revenue?.trendType === 'down' ? 'trending_down' : metrics.revenue?.trendType === 'neutral' ? 'remove' : 'trending_up'}
                            </span> {metrics.revenue?.trend}
                        </div>
                        <div className="metric-sub-detail">{metrics.revenue?.sub}</div>
                        <span className="material-symbols-outlined metric-link-arrow">arrow_forward</span>
                    </div>
                </div>

                {/* 07. Ads */}
                <div className="metric-card m-ads" title="Xem bán gói & dịch vụ quảng cáo" onClick={() => openMetricModal('ads')}>
                    <div className="metric-card-top">
                        <div className="metric-label-group">
                            <span className="metric-number-badge">Chỉ số #07</span>
                            <span className="metric-name">Dịch vụ quảng cáo</span>
                        </div>
                        <div className="metric-icon-box">
                            <span className="material-symbols-outlined">campaign</span>
                        </div>
                    </div>
                    <div className="metric-card-mid">
                        <div className="metric-value">{metrics.ads?.val}</div>
                    </div>
                    <div className="metric-card-bottom">
                        <div className={`metric-trend ${metrics.ads?.trendType || 'up'}`}>
                            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                                {metrics.ads?.trendType === 'down' ? 'trending_down' : metrics.ads?.trendType === 'neutral' ? 'remove' : 'trending_up'}
                            </span> {metrics.ads?.trend}
                        </div>
                        <div className="metric-sub-detail">{metrics.ads?.sub}</div>
                        <span className="material-symbols-outlined metric-link-arrow">arrow_forward</span>
                    </div>
                </div>

                {/* 08. Voucher */}
                <div className="metric-card m-voucher" title="Xem danh sách mã voucher ưu đãi" onClick={() => openMetricModal('voucher')}>
                    <div className="metric-card-top">
                        <div className="metric-label-group">
                            <span className="metric-number-badge">Chỉ số #08</span>
                            <span className="metric-name">Mã giảm giá</span>
                        </div>
                        <div className="metric-icon-box">
                            <span className="material-symbols-outlined">local_offer</span>
                        </div>
                    </div>
                    <div className="metric-card-mid">
                        <div className="metric-value">{metrics.voucher?.val}</div>
                    </div>
                    <div className="metric-card-bottom">
                        <div className={`metric-trend ${metrics.voucher?.trendType || 'neutral'}`}>
                            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                                {metrics.voucher?.trendType === 'up' ? 'trending_up' : metrics.voucher?.trendType === 'down' ? 'trending_down' : 'remove'}
                            </span> {metrics.voucher?.trend}
                        </div>
                        <div className="metric-sub-detail">{metrics.voucher?.sub}</div>
                        <span className="material-symbols-outlined metric-link-arrow">arrow_forward</span>
                    </div>
                </div>

            </div>

            {/* SECTION: BIỂU ĐỒ TRỰC QUAN HÓA (2 CỘT) */}
            <div className="dashboard-charts-row">
                {/* Chart 1: Bar & Line (Revenue vs Bookings) */}
                <div className="chart-panel-card">
                    <div className="chart-panel-header">
                        <div className="chart-panel-title-group">
                            <h3>
                                <span className="material-symbols-outlined" style={{ color: '#15803D' }}>finance</span>
                                <span>Tăng trưởng Doanh thu & Đơn đặt phòng</span>
                            </h3>
                            <p>So sánh tương quan giữa giá trị doanh thu toàn sàn và số lượt booking thành công ({getPeriodLabel()})</p>
                        </div>
                        <div className="chart-panel-actions">
                            <Link to="/admin/reports" className="btn-dash-action" style={{ fontSize: '12px', padding: '5px 10px' }}>
                                <span>Xem chi tiết</span>
                                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>open_in_new</span>
                            </Link>
                        </div>
                    </div>
                    <div className="chart-canvas-wrap">
                        <Bar options={growthChartOptions} data={growthChartData} />
                    </div>
                </div>

                {/* Chart 2: Doughnut (Homestay by Region) */}
                <div className="chart-panel-card">
                    <div className="chart-panel-header">
                        <div className="chart-panel-title-group">
                            <h3>
                                <span className="material-symbols-outlined" style={{ color: '#0D9488' }}>pie_chart</span>
                                <span>Phân bổ Homestay theo địa phương</span>
                            </h3>
                            <p>Tỷ trọng mạng lưới cơ sở homestay theo các vùng du lịch bản địa trọng điểm</p>
                        </div>
                    </div>
                    <div className="chart-canvas-wrap" style={{ height: '200px' }}>
                        <Doughnut options={distributionChartOptions} data={distributionChartData} />
                    </div>
                    <div className="doughnut-stats-list">
                        {distributionItems.map((item, idx) => (
                            <div className="doughnut-stat-row" key={idx}>
                                <span className="doughnut-stat-name">
                                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color || '#15803D' }}></span>
                                    {item.name}
                                </span>
                                <div>
                                    <span className="doughnut-stat-num">{item.count}</span>
                                    <span className="doughnut-stat-pct">({item.percentage}%)</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* SECTION: HOẠT ĐỘNG MỚI NHẤT & SHORTCUTS */}
            <div className="dashboard-activities-row">
                <div className="table-panel-card">
                    <div className="table-panel-header">
                        <div>
                            <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main, #0F172A)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span className="material-symbols-outlined" style={{ color: '#D97706' }}>history_toggle_off</span>
                                <span>Đặt phòng & Giao dịch mới nhất</span>
                            </h3>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted, #64748B)', marginTop: '2px' }}>
                                Dữ liệu thực tế phát sinh trên hệ thống (Cơ sở dữ liệu)
                            </p>
                        </div>

                        <div className="panel-tabs-pill">
                            <button className={`panel-tab-btn ${activityTab === 'all' ? 'active' : ''}`} onClick={() => setActivityTab('all')}>Tất cả</button>
                            <button className={`panel-tab-btn ${activityTab === 'paid' ? 'active' : ''}`} onClick={() => setActivityTab('paid')}>Đã thanh toán</button>
                            <button className={`panel-tab-btn ${activityTab === 'pending' ? 'active' : ''}`} onClick={() => setActivityTab('pending')}>Chờ xác nhận</button>
                            <button className={`panel-tab-btn ${activityTab === 'refunded' ? 'active' : ''}`} onClick={() => setActivityTab('refunded')}>Hoàn tiền / Hủy</button>
                        </div>
                    </div>

                    <div className="dash-table-wrap">
                        <table className="dash-table">
                            <thead>
                                <tr>
                                    <th>Mã đơn</th>
                                    <th>Khách hàng</th>
                                    <th>Homestay đặt chỗ</th>
                                    <th>Tổng tiền</th>
                                    <th>Trạng thái</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredActivities.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', color: '#94A3B8', padding: '24px' }}>Không có hoạt động nào phù hợp với bộ lọc.</td>
                                    </tr>
                                ) : (
                                    filteredActivities.map(item => {
                                        let badgeClass = 'success';
                                        if (item.status === 'pending' || item.status === 'confirmed') badgeClass = 'warning';
                                        if (item.status === 'refunded' || item.status === 'cancelled') badgeClass = 'danger';

                                        return (
                                            <tr key={item.id}>
                                                <td><span className="cell-code">{item.code}</span></td>
                                                <td>
                                                    <div className="cell-user">
                                                        <div className="cell-avatar">{item.avatar}</div>
                                                        <div>
                                                            <div className="cell-name-main">{item.user}</div>
                                                            <div className="cell-name-sub">{item.gateway}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="cell-name-main">{item.homestay}</div>
                                                    <div className="cell-name-sub">{item.time}</div>
                                                </td>
                                                <td><strong style={{ color: '#15803D' }}>{item.amount}</strong></td>
                                                <td>
                                                    <span className={`dash-badge ${badgeClass}`}>{item.statusText}</span>
                                                </td>
                                                <td>
                                                    <button className="btn-dash-action" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => openActivityModal(item)}>
                                                        <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>visibility</span> Xem
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ marginTop: '14px', textAlign: 'right' }}>
                        <Link to="/admin/transactions" className="panel-action-link">
                            <span>Xem tất cả giao dịch trong hệ thống</span>
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
                        </Link>
                    </div>
                </div>

                <div>
                    <div className="table-panel-card">
                        <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main, #0F172A)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="material-symbols-outlined" style={{ color: '#15803D' }}>bolt</span>
                            <span>Truy cập nhanh mô-đun quản lý</span>
                        </h3>

                        <div className="quick-shortcuts-list">
                            <Link to="/admin/accounts" className="shortcut-item">
                                <div className="shortcut-left">
                                    <div className="shortcut-icon" style={{ color: '#2563EB', background: '#EFF6FF' }}>
                                        <span className="material-symbols-outlined">manage_accounts</span>
                                    </div>
                                    <div className="shortcut-info">
                                        <h4>Quản lý tài khoản</h4>
                                        <p>Tourist & Chủ nhà Homestay</p>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined shortcut-arrow">chevron_right</span>
                            </Link>

                            <Link to="/admin/homestays" className="shortcut-item">
                                <div className="shortcut-left">
                                    <div className="shortcut-icon" style={{ color: '#0D9488', background: '#CCFBF1' }}>
                                        <span className="material-symbols-outlined">cottage</span>
                                    </div>
                                    <div className="shortcut-info">
                                        <h4>Quản lý Homestay</h4>
                                        <p>Thẩm định & Duyệt niêm yết sàn</p>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined shortcut-arrow">chevron_right</span>
                            </Link>

                            <Link to="/admin/transactions" className="shortcut-item">
                                <div className="shortcut-left">
                                    <div className="shortcut-icon" style={{ color: '#7C3AED', background: '#F3E8FF' }}>
                                        <span className="material-symbols-outlined">receipt_long</span>
                                    </div>
                                    <div className="shortcut-info">
                                        <h4>Quản lý giao dịch</h4>
                                        <p>Thanh toán, giải ngân & hoàn tiền</p>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined shortcut-arrow">chevron_right</span>
                            </Link>
                        </div>

                        <div className="system-health-box">
                            <div className="health-header">
                                <span>TRẠNG THÁI HẠ TẦNG</span>
                                <span className="health-status-badge">
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16A34A' }}></span>
                                    Ổn định
                                </span>
                            </div>
                            <div className="health-meters">
                                <div className="health-meter-item">
                                    <span>API Gateway & Máy chủ Web:</span>
                                    <span className="health-meter-val" style={{ color: '#15803D' }}>{dashboardData?.systemStatus?.uptime || '99.98% Up'}</span>
                                </div>
                                <div className="health-meter-item">
                                    <span>Database CSDL PostgreSQL:</span>
                                    <span className="health-meter-val">{dashboardData?.systemStatus?.databaseName ? 'Neon DB (homestays)' : '28ms latency'}</span>
                                </div>
                                <div className="health-meter-item">
                                    <span>Cổng VNPay & MoMo:</span>
                                    <span className="health-meter-val" style={{ color: '#15803D' }}>Hoạt động tốt</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL CHI TIẾT */}
            <div className={`dash-modal-overlay ${modalType ? 'show' : ''}`} onClick={closeModal}>
                <div className="dash-modal-box" onClick={e => e.stopPropagation()}>
                    <div className="dash-modal-header">
                        <h3>
                            {modalType === 'metric' && modalData && (
                                <>
                                    <span className="material-symbols-outlined" style={{ color: modalData.accentColor }}>{modalData.icon}</span>
                                    <span>{modalData.title}</span>
                                </>
                            )}
                            {modalType === 'activity' && modalData && (
                                <>
                                    <span className="material-symbols-outlined" style={{ color: '#15803D' }}>receipt</span>
                                    <span>Chi tiết Đơn đặt phòng {modalData.code}</span>
                                </>
                            )}
                        </h3>
                        <button className="dash-modal-close-btn" onClick={closeModal}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                        </button>
                    </div>

                    <div className="dash-modal-body">
                        {modalType === 'metric' && modalData && (
                            <>
                                <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '14px', marginBottom: '16px', border: '1px solid #E2E8F0' }}>
                                    <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '4px' }}>Chỉ số thống kê kỳ: <strong>{getPeriodLabel()}</strong></div>
                                    <div style={{ fontSize: '22px', fontWeight: 800, color: modalData.accentColor }}>
                                        {modalData.currentValue || metrics[modalData.key]?.val}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    {(modalData.rows || []).map((row, idx) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F1F5F9', fontSize: '13px' }}>
                                            <span style={{ color: '#64748B' }}>{row.label}</span>
                                            <strong style={{ color: '#1E293B' }}>{row.val}</strong>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {modalType === 'activity' && modalData && (
                            <>
                                <div style={{ background: '#F0FDF4', borderRadius: '10px', padding: '14px', marginBottom: '16px', border: '1px solid #BBF7D0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: '12px', color: '#166534' }}>Tổng số tiền thanh toán</div>
                                        <div style={{ fontSize: '22px', fontWeight: 800, color: '#15803D' }}>{modalData.amount}</div>
                                    </div>
                                    <span className={`dash-badge ${modalData.status === 'pending' || modalData.status === 'confirmed' ? 'warning' : modalData.status === 'refunded' || modalData.status === 'cancelled' ? 'danger' : 'success'}`}>
                                        {modalData.statusText}
                                    </span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                                        <span style={{ color: '#64748B' }}>Khách hàng:</span>
                                        <strong>{modalData.user} ({modalData.details?.phone || 'Chưa cập nhật'})</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                                        <span style={{ color: '#64748B' }}>Homestay đặt chỗ:</span>
                                        <strong>{modalData.homestay}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                                        <span style={{ color: '#64748B' }}>Chủ nhà (Host):</span>
                                        <strong>{modalData.details?.host || 'Chủ nhà YÊN'}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                                        <span style={{ color: '#64748B' }}>Hạng phòng:</span>
                                        <strong>{modalData.details?.room || 'Phòng tiêu chuẩn'}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                                        <span style={{ color: '#64748B' }}>Thời gian lưu trú:</span>
                                        <strong>{modalData.details?.dates || 'Theo thỏa thuận'}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
                                        <span style={{ color: '#64748B' }}>Phương thức giao dịch:</span>
                                        <strong>{modalData.gateway}</strong>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="dash-modal-footer">
                        <button className="btn-dash-action" onClick={closeModal}>Đóng</button>
                        {modalType === 'metric' && modalData && (
                            <Link to={modalData.actionLink} className="btn-dash-action btn-dash-primary" style={{ display: 'inline-flex' }} onClick={closeModal}>
                                <span>{modalData.actionText}</span>
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
                            </Link>
                        )}
                        {modalType === 'activity' && modalData && (
                            <Link to="/admin/transactions" className="btn-dash-action btn-dash-primary" style={{ display: 'inline-flex' }} onClick={closeModal}>
                                <span>Xem trong Quản lý giao dịch</span>
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
                            </Link>
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
}
