import React, { useState } from 'react';
import './ReportsStatistics.css';
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
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function ReportsStatistics() {
    const [activeTab, setActiveTab] = useState('revenue');
    const [dateFilter, setDateFilter] = useState('30days');

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' }
        }
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'right' } }
    };

    return (
        <div className="reports-statistics-wrapper">
            <div className="reports-page-header">
                <div className="reports-page-title-group">
                    <h1>
                        <span className="material-symbols-outlined header-title-icon">analytics</span>
                        Báo Cáo & Thống Kê Sàn YÊN
                    </h1>
                    <div className="reports-page-subtitle">Tổng hợp chỉ số kinh doanh, xu hướng booking, tăng trưởng người dùng & hiệu quả vận hành</div>
                </div>

                <div className="reports-header-actions">
                    <div className="date-range-wrap">
                        <span className="material-symbols-outlined">calendar_today</span>
                        <select className="date-range-select" value={dateFilter} onChange={e => setDateFilter(e.target.value)}>
                            <option value="today">Hôm nay</option>
                            <option value="7days">7 ngày qua</option>
                            <option value="30days">Tháng này (Tháng 9/2026)</option>
                            <option value="this_quarter">Quý 3/2026</option>
                            <option value="this_year">Năm 2026</option>
                        </select>
                    </div>

                    <button className="btn-export btn-export-excel" onClick={() => alert('Đang xuất file Excel...')}>
                        <span className="material-symbols-outlined">download</span> Xuất Excel
                    </button>
                    <button className="btn-export btn-export-pdf" onClick={() => alert('Đang chuẩn bị file in báo cáo...')}>
                        <span className="material-symbols-outlined">picture_as_pdf</span> In Báo Cáo
                    </button>
                </div>
            </div>

            <div className="reports-tabs-nav">
                <button className={`tab-btn ${activeTab === 'revenue' ? 'active' : ''}`} onClick={() => setActiveTab('revenue')}>
                    <span className="material-symbols-outlined">payments</span> Báo cáo doanh thu
                </button>
                <button className={`tab-btn ${activeTab === 'booking' ? 'active' : ''}`} onClick={() => setActiveTab('booking')}>
                    <span className="material-symbols-outlined">book_online</span> Thống kê Booking
                </button>
                <button className={`tab-btn ${activeTab === 'tourist' ? 'active' : ''}`} onClick={() => setActiveTab('tourist')}>
                    <span className="material-symbols-outlined">group</span> Thống kê khách thuê
                </button>
                <button className={`tab-btn ${activeTab === 'owner' ? 'active' : ''}`} onClick={() => setActiveTab('owner')}>
                    <span className="material-symbols-outlined">real_estate_agent</span> Thống kê Owner
                </button>
                <button className={`tab-btn ${activeTab === 'homestay' ? 'active' : ''}`} onClick={() => setActiveTab('homestay')}>
                    <span className="material-symbols-outlined">cottage</span> Thống kê Homestay
                </button>
                <button className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`} onClick={() => setActiveTab('transactions')}>
                    <span className="material-symbols-outlined">receipt_long</span> Thống kê giao dịch
                </button>
                <button className={`tab-btn ${activeTab === 'vouchers' ? 'active' : ''}`} onClick={() => setActiveTab('vouchers')}>
                    <span className="material-symbols-outlined">local_offer</span> Thống kê mã giảm giá
                </button>
                <button className={`tab-btn ${activeTab === 'ads' ? 'active' : ''}`} onClick={() => setActiveTab('ads')}>
                    <span className="material-symbols-outlined">campaign</span> Thống kê quảng cáo
                </button>
            </div>

            {/* TAB: REVENUE */}
            {activeTab === 'revenue' && (
                <div className="tab-panel-content active">
                    <div className="kpi-grid">
                        <div className="kpi-card">
                            <div>
                                <div className="kpi-title">Tổng Doanh Thu Đặt Phòng (GMV)</div>
                                <div className="kpi-value">3.48 Tỷ VNĐ</div>
                                <span className="kpi-trend up"><span className="material-symbols-outlined" style={{ fontSize: '14px' }}>trending_up</span> +20.0% so tháng trước</span>
                            </div>
                            <div className="kpi-icon-box green"><span className="material-symbols-outlined">account_balance_wallet</span></div>
                        </div>
                        <div className="kpi-card">
                            <div>
                                <div className="kpi-title">Phí Hoa Hồng Sàn YÊN (8%)</div>
                                <div className="kpi-value">278.4 Triệu</div>
                                <span className="kpi-trend up"><span className="material-symbols-outlined" style={{ fontSize: '14px' }}>trending_up</span> +19.8%</span>
                            </div>
                            <div className="kpi-icon-box blue"><span className="material-symbols-outlined">domain</span></div>
                        </div>
                        <div className="kpi-card">
                            <div>
                                <div className="kpi-title">Tiền Cọc Đang Giữ (Escrow)</div>
                                <div className="kpi-value">685 Triệu</div>
                                <span className="kpi-trend neutral"><span className="material-symbols-outlined" style={{ fontSize: '14px' }}>horizontal_rule</span> 145 Booking giữ cọc</span>
                            </div>
                            <div className="kpi-icon-box purple"><span className="material-symbols-outlined">lock_clock</span></div>
                        </div>
                        <div className="kpi-card">
                            <div>
                                <div className="kpi-title">Doanh Thu TB / Đơn Phòng</div>
                                <div className="kpi-value">895.000đ</div>
                                <span className="kpi-trend up"><span className="material-symbols-outlined" style={{ fontSize: '14px' }}>trending_up</span> +4.5%</span>
                            </div>
                            <div className="kpi-icon-box amber"><span className="material-symbols-outlined">price_change</span></div>
                        </div>
                    </div>

                    <div className="charts-grid-2">
                        <div className="chart-card">
                            <div className="chart-card-header">
                                <div>
                                    <div className="chart-card-title"><span className="material-symbols-outlined">show_chart</span> Biểu Đồ Xu Hướng Doanh Thu Theo Tháng</div>
                                    <div className="chart-card-subtitle">So sánh Doanh thu tổng sàn (GMV) và Doanh thu phí sàn YÊN (8%)</div>
                                </div>
                            </div>
                            <div className="chart-container-box">
                                <Line 
                                    options={chartOptions} 
                                    data={{
                                        labels: ['Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9'],
                                        datasets: [
                                            {
                                                label: 'Tổng Doanh Thu (GMV)',
                                                data: [1.2, 1.8, 2.4, 3.1, 2.9, 3.48],
                                                borderColor: '#15803D',
                                                backgroundColor: 'rgba(21, 128, 61, 0.08)',
                                                fill: true,
                                                tension: 0.35,
                                                borderWidth: 3
                                            },
                                            {
                                                label: 'Phí Sàn YÊN (8%)',
                                                data: [0.096, 0.144, 0.192, 0.248, 0.232, 0.278],
                                                borderColor: '#0284C7',
                                                backgroundColor: 'transparent',
                                                borderDash: [5, 5],
                                                borderWidth: 2
                                            }
                                        ]
                                    }} 
                                />
                            </div>
                        </div>
                        <div className="chart-card">
                            <div className="chart-card-header">
                                <div>
                                    <div className="chart-card-title"><span className="material-symbols-outlined">pie_chart</span> Cơ Cấu Doanh Thu Theo Khu Vực</div>
                                </div>
                            </div>
                            <div className="chart-container-box">
                                <Doughnut 
                                    options={doughnutOptions}
                                    data={{
                                        labels: ['Pù Luông', 'Mai Châu', 'Mộc Châu', 'Sa Pa', 'Đà Lạt', 'Khác'],
                                        datasets: [{
                                            data: [35, 22, 18, 15, 7, 3],
                                            backgroundColor: ['#15803D', '#0284C7', '#9333EA', '#D97706', '#EC4899', '#94A3B8']
                                        }]
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="table-card">
                        <div className="table-card-header">
                            <div className="table-card-title">
                                <span className="material-symbols-outlined">table_view</span> Chi Tiết Doanh Thu & Hoa Hồng Theo Khu Vực Du Lịch
                            </div>
                        </div>
                        <div className="table-responsive">
                            <table className="reports-table">
                                <thead>
                                <tr>
                                    <th>Top</th>
                                    <th>Khu Vực Du Lịch</th>
                                    <th>Số Lượng Homestay</th>
                                    <th>Tổng Doanh Thu Đặt Phòng</th>
                                    <th>Phí Sàn YÊN Thu Về (8%)</th>
                                    <th>Mức Tăng Trưởng MoM</th>
                                </tr>
                                </thead>
                                <tbody>
                                <tr>
                                    <td><div className="rank-badge top-1">1</div></td>
                                    <td><strong>Pù Luông (Thanh Hóa)</strong></td>
                                    <td>128 Homestay</td>
                                    <td>1.218.000.000đ</td>
                                    <td><strong style={{ color: '#15803D' }}>97.440.000đ</strong></td>
                                    <td><span className="badge-status success">+24.5%</span></td>
                                </tr>
                                <tr>
                                    <td><div className="rank-badge top-2">2</div></td>
                                    <td><strong>Mai Châu (Hòa Bình)</strong></td>
                                    <td>95 Homestay</td>
                                    <td>765.600.000đ</td>
                                    <td><strong style={{ color: '#15803D' }}>61.248.000đ</strong></td>
                                    <td><span className="badge-status success">+18.2%</span></td>
                                </tr>
                                <tr>
                                    <td><div className="rank-badge top-3">3</div></td>
                                    <td><strong>Mộc Châu (Sơn La)</strong></td>
                                    <td>82 Homestay</td>
                                    <td>626.400.000đ</td>
                                    <td><strong style={{ color: '#15803D' }}>50.112.000đ</strong></td>
                                    <td><span className="badge-status success">+15.0%</span></td>
                                </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: BOOKING */}
            {activeTab === 'booking' && (
                <div className="tab-panel-content active">
                    <div className="kpi-grid">
                        <div className="kpi-card">
                            <div>
                                <div className="kpi-title">Tổng Số Lượt Booking</div>
                                <div className="kpi-value">3.890 Đơn</div>
                                <span className="kpi-trend up"><span className="material-symbols-outlined" style={{ fontSize: '14px' }}>trending_up</span> +14.2%</span>
                            </div>
                            <div className="kpi-icon-box blue"><span className="material-symbols-outlined">book_online</span></div>
                        </div>
                        <div className="kpi-card">
                            <div>
                                <div className="kpi-title">Tỷ Lệ Lấp Đầy (Occupancy)</div>
                                <div className="kpi-value">76.8%</div>
                                <span className="kpi-trend up"><span className="material-symbols-outlined" style={{ fontSize: '14px' }}>trending_up</span> +5.2%</span>
                            </div>
                            <div className="kpi-icon-box green"><span className="material-symbols-outlined">meeting_room</span></div>
                        </div>
                        <div className="kpi-card">
                            <div>
                                <div className="kpi-title">Booking Hoàn Thành Chi Trả</div>
                                <div className="kpi-value">3.480 Đơn (89.5%)</div>
                                <span className="kpi-trend up"><span className="material-symbols-outlined" style={{ fontSize: '14px' }}>trending_up</span> Ổn định</span>
                            </div>
                            <div className="kpi-icon-box teal"><span className="material-symbols-outlined">verified</span></div>
                        </div>
                        <div className="kpi-card">
                            <div>
                                <div className="kpi-title">Thời Gian Ở Trung Bình</div>
                                <div className="kpi-value">2.4 Đêm</div>
                                <span className="kpi-trend neutral"><span className="material-symbols-outlined" style={{ fontSize: '14px' }}>horizontal_rule</span> Trung bình cuối tuần</span>
                            </div>
                            <div className="kpi-icon-box amber"><span className="material-symbols-outlined">bedtime</span></div>
                        </div>
                    </div>

                    <div className="charts-grid-equal">
                        <div className="chart-card">
                            <div className="chart-card-header">
                                <div className="chart-card-title"><span className="material-symbols-outlined">bar_chart</span> Phân Bổ Booking Thành Công / Hủy Theo Tuần</div>
                            </div>
                            <div className="chart-container-box">
                                <Bar 
                                    options={{ ...chartOptions, scales: { x: { stacked: true }, y: { stacked: true } } }}
                                    data={{
                                        labels: ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'],
                                        datasets: [
                                            {
                                                label: 'Booking Thành công',
                                                data: [840, 920, 1050, 1080],
                                                backgroundColor: '#16A34A'
                                            },
                                            {
                                                label: 'Booking Hủy',
                                                data: [95, 110, 102, 103],
                                                backgroundColor: '#EF4444'
                                            }
                                        ]
                                    }}
                                />
                            </div>
                        </div>
                        <div className="chart-card">
                            <div className="chart-card-header">
                                <div className="chart-card-title"><span className="material-symbols-outlined">pie_chart</span> Tỷ Lệ Nguồn Đặt Phòng (Traffic Attribution)</div>
                            </div>
                            <div className="chart-container-box">
                                <Pie 
                                    options={{ responsive: true, maintainAspectRatio: false }}
                                    data={{
                                        labels: ['Direct Website', 'App Mobile', 'Affiliate', 'Google Search', 'Khác'],
                                        datasets: [{
                                            data: [48, 32, 12, 5, 3],
                                            backgroundColor: ['#059669', '#2563EB', '#7C3AED', '#EA580C', '#64748B']
                                        }]
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: TOURIST */}
            {activeTab === 'tourist' && (
                <div className="tab-panel-content active">
                    <div className="kpi-grid">
                        <div className="kpi-card">
                            <div>
                                <div className="kpi-title">Tổng Du Khách Đăng Ký</div>
                                <div className="kpi-value">28.450 Người</div>
                            </div>
                            <div className="kpi-icon-box purple"><span className="material-symbols-outlined">person_add</span></div>
                        </div>
                        <div className="kpi-card">
                            <div>
                                <div className="kpi-title">Tỷ Lệ Khách Quay Lại</div>
                                <div className="kpi-value">34.2%</div>
                            </div>
                            <div className="kpi-icon-box green"><span className="material-symbols-outlined">replay</span></div>
                        </div>
                    </div>
                    <div className="charts-grid-equal">
                        <div className="chart-card">
                            <div className="chart-card-header">
                                <div className="chart-card-title">Tăng Trưởng Khách Mới & Quay Lại</div>
                            </div>
                            <div className="chart-container-box">
                                <Line 
                                    options={chartOptions}
                                    data={{
                                        labels: ['T4', 'T5', 'T6', 'T7', 'T8', 'T9'],
                                        datasets: [
                                            {
                                                label: 'Du khách mới',
                                                data: [4200, 5800, 8900, 12400, 11200, 14500],
                                                borderColor: '#2563EB',
                                                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                                                fill: true
                                            },
                                            {
                                                label: 'Khách quay lại',
                                                data: [1100, 1800, 3100, 4200, 3900, 4950],
                                                borderColor: '#059669',
                                                backgroundColor: 'transparent'
                                            }
                                        ]
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: OWNER */}
            {activeTab === 'owner' && (
                <div className="tab-panel-content active">
                    <div className="kpi-grid">
                        <div className="kpi-card">
                            <div>
                                <div className="kpi-title">Tổng Số Chủ Nhà (Owners)</div>
                                <div className="kpi-value">320 Đối Tác</div>
                            </div>
                            <div className="kpi-icon-box blue"><span className="material-symbols-outlined">real_estate_agent</span></div>
                        </div>
                        <div className="kpi-card">
                            <div>
                                <div className="kpi-title">Owner Đang Hoạt Động</div>
                                <div className="kpi-value">285 Owner (89.0%)</div>
                            </div>
                            <div className="kpi-icon-box green"><span className="material-symbols-outlined">task_alt</span></div>
                        </div>
                    </div>
                    <div className="charts-grid-equal">
                        <div className="chart-card">
                            <div className="chart-card-header">
                                <div className="chart-card-title">Top Homestay Owner Doanh Thu Cao Nhất</div>
                            </div>
                            <div className="chart-container-box">
                                <Bar 
                                    options={chartOptions}
                                    data={{
                                        labels: ['Triệu Văn Sản', 'Vàng A Sáng', 'Đinh Thị Hương', 'Nguyễn Văn An', 'Bùi Văn Nam'],
                                        datasets: [
                                            {
                                                label: 'Doanh thu (Triệu VNĐ)',
                                                data: [385, 290, 245, 210, 180],
                                                backgroundColor: '#15803D'
                                            }
                                        ]
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: HOMESTAY */}
            {activeTab === 'homestay' && (
                <div className="tab-panel-content active">
                    <div className="kpi-grid">
                        <div className="kpi-card">
                            <div>
                                <div className="kpi-title">Tổng Homestay Niêm Yết</div>
                                <div className="kpi-value">450 Homestay</div>
                            </div>
                            <div className="kpi-icon-box green"><span className="material-symbols-outlined">cottage</span></div>
                        </div>
                    </div>
                    <div className="charts-grid-equal">
                        <div className="chart-card">
                            <div className="chart-card-header">
                                <div className="chart-card-title">Mật Độ Phân Bổ Homestay Theo Khu Vực</div>
                            </div>
                            <div className="chart-container-box">
                                <Bar 
                                    options={chartOptions}
                                    data={{
                                        labels: ['Pù Luông', 'Mai Châu', 'Mộc Châu', 'Sa Pa', 'Đà Lạt', 'Ninh Bình', 'Khác'],
                                        datasets: [{
                                            label: 'Số lượng Homestay',
                                            data: [128, 95, 82, 74, 45, 32, 24],
                                            backgroundColor: '#0EA5E9'
                                        }]
                                    }}
                                />
                            </div>
                        </div>
                        <div className="chart-card">
                            <div className="chart-card-header">
                                <div className="chart-card-title">Tỷ Lệ Trạng Thái Niêm Yết Homestay</div>
                            </div>
                            <div className="chart-container-box">
                                <Pie 
                                    options={{ responsive: true, maintainAspectRatio: false }}
                                    data={{
                                        labels: ['Đang hoạt động', 'Chờ phê duyệt', 'Tạm khóa', 'Ngừng niêm yết'],
                                        datasets: [{
                                            data: [395, 25, 18, 12],
                                            backgroundColor: ['#10B981', '#F59E0B', '#EF4444', '#6B7280']
                                        }]
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: TRANSACTIONS */}
            {activeTab === 'transactions' && (
                <div className="tab-panel-content active">
                    <div className="kpi-grid">
                        <div className="kpi-card">
                            <div>
                                <div className="kpi-title">Tổng Giá Trị Giao Dịch</div>
                                <div className="kpi-value">12.4 Tỷ VNĐ</div>
                            </div>
                            <div className="kpi-icon-box green"><span className="material-symbols-outlined">receipt_long</span></div>
                        </div>
                    </div>
                    <div className="charts-grid-equal">
                        <div className="chart-card">
                            <div className="chart-card-header">
                                <div className="chart-card-title">Tỷ Lệ Sử Dụng Các Cổng Thanh Toán</div>
                            </div>
                            <div className="chart-container-box">
                                <Doughnut 
                                    options={{ responsive: true, maintainAspectRatio: false }}
                                    data={{
                                        labels: ['VNPay QR (45%)', 'Ví MoMo (32%)', 'VietQR (18%)', 'Thẻ Visa/Master (5%)'],
                                        datasets: [{
                                            data: [45, 32, 18, 5],
                                            backgroundColor: ['#0284C7', '#C026D3', '#16A34A', '#EA580C']
                                        }]
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: VOUCHERS */}
            {activeTab === 'vouchers' && (
                <div className="tab-panel-content active">
                    <div className="kpi-grid">
                        <div className="kpi-card">
                            <div>
                                <div className="kpi-title">Tổng Lượt Dùng Voucher</div>
                                <div className="kpi-value">12.450 Lượt</div>
                            </div>
                            <div className="kpi-icon-box rose"><span className="material-symbols-outlined">local_offer</span></div>
                        </div>
                        <div className="kpi-card">
                            <div>
                                <div className="kpi-title">Ngân Sách Ưu Đãi Đã Tài Trợ</div>
                                <div className="kpi-value">340.5 Triệu</div>
                            </div>
                            <div className="kpi-icon-box amber"><span className="material-symbols-outlined">savings</span></div>
                        </div>
                    </div>
                    <div className="charts-grid-equal">
                        <div className="chart-card">
                            <div className="chart-card-header">
                                <div className="chart-card-title">Top 5 Voucher Được Sử Dụng Nhiều Nhất</div>
                            </div>
                            <div className="chart-container-box">
                                <Bar 
                                    options={chartOptions}
                                    data={{
                                        labels: ['YENNEW2026', 'PULUONGCHILL', 'SUMMERVIBE', 'MOCKHAUTRIP', 'VIPHOMESTAY'],
                                        datasets: [
                                            {
                                                label: 'Lượt sử dụng',
                                                data: [4850, 3200, 2150, 1420, 830],
                                                backgroundColor: '#EC4899'
                                            }
                                        ]
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: ADS */}
            {activeTab === 'ads' && (
                <div className="tab-panel-content active">
                    <div className="kpi-grid">
                        <div className="kpi-card">
                            <div>
                                <div className="kpi-title">Tổng Lượt Hiển Thị (Impressions)</div>
                                <div className="kpi-value">1.84M Lượt</div>
                            </div>
                            <div className="kpi-icon-box purple"><span className="material-symbols-outlined">visibility</span></div>
                        </div>
                        <div className="kpi-card">
                            <div>
                                <div className="kpi-title">Tỷ Lệ Click CTR Trung Bình</div>
                                <div className="kpi-value">8.59%</div>
                            </div>
                            <div className="kpi-icon-box green"><span className="material-symbols-outlined">ads_click</span></div>
                        </div>
                    </div>
                    <div className="charts-grid-equal">
                        <div className="chart-card">
                            <div className="chart-card-header">
                                <div className="chart-card-title">Tỷ Lệ Click CTR Theo Vị Trí Quảng Cáo (Ad Slot)</div>
                            </div>
                            <div className="chart-container-box">
                                <Bar 
                                    options={chartOptions}
                                    data={{
                                        labels: ['Hero Banner', 'Pop-up Khuyến mãi', 'Combo Tiết kiệm', 'Sidebar Detail'],
                                        datasets: [{
                                            label: 'CTR (%)',
                                            data: [9.4, 11.2, 7.8, 4.5],
                                            backgroundColor: '#8B5CF6'
                                        }]
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
