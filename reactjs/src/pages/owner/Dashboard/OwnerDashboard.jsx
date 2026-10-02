import { useState, useRef, useEffect } from 'react';
import './OwnerDashboard.css';
import {
  INITIAL_DASHBOARD_STATS,
  INITIAL_BOOKINGS,
  REVENUE_PERIODS,
  NOTIFICATIONS_DATA,
  OCCUPANCY_DATA,
  formatCurrency,
  formatDateRange,
} from './ownerDashboardData';

const ITEMS_PER_PAGE = 5;
const PERIOD_OPTS = [
  { value: '7days',  label: '7 ngày gần đây' },
  { value: '30days', label: '30 ngày gần đây' },
  { value: 'month',  label: 'Tháng này' },
];

const ROOM_IMAGES = [
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=150&q=80',
];

// ─── SVG Revenue Chart ─────────────────────────────────────────────────────────
function RevenueChart({ period }) {
  const { labels, values } = REVENUE_PERIODS[period];
  const [tooltip, setTooltip] = useState(null);
  const svgRef = useRef(null);

  const W = 560, H = 200;
  const PL = 48, PR = 16, PT = 12, PB = 32;
  const chartW = W - PL - PR;
  const chartH = H - PT - PB;

  const maxVal = Math.max(...values, 1);
  const ySteps = 4;

  const points = labels.map((_, i) => ({
    x: PL + (i / (labels.length - 1)) * chartW,
    y: PT + chartH - (values[i] / maxVal) * chartH,
    value: values[i],
    label: labels[i],
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaD = `${pathD} L${points[points.length - 1].x.toFixed(1)},${(PT + chartH).toFixed(1)} L${PL},${(PT + chartH).toFixed(1)} Z`;

  return (
    <div className="chart-container" style={{ position: 'relative' }}>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%' }}>
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#059669" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {Array.from({ length: ySteps + 1 }).map((_, i) => {
          const y = PT + (i / ySteps) * chartH;
          const val = maxVal - (i / ySteps) * maxVal;
          return (
            <g key={i}>
              <line x1={PL} y1={y} x2={PL + chartW} y2={y} stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
              <text x={PL - 6} y={y + 4} textAnchor="end" className="chart-axis-label">
                {val > 0 ? `${(val / 1e6).toFixed(0)}tr` : '0'}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaD} fill="url(#revGrad)" />

        {/* Line */}
        <path d={pathD} fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x} cy={p.y} r={4}
            fill="#FFFFFF" stroke="#059669" strokeWidth="2.5"
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setTooltip({ x: p.x, y: p.y, value: p.value, label: p.label })}
            onMouseLeave={() => setTooltip(null)}
          />
        ))}

        {/* X-axis labels */}
        {points.map((p, i) => (
          <text key={i} x={p.x} y={H - 6} textAnchor="middle" className="chart-axis-label">
            {p.label}
          </text>
        ))}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="chart-tooltip"
          style={{
            left: `${(tooltip.x / W) * 100}%`,
            top: `${(tooltip.y / H) * 100}%`,
          }}
        >
          <strong>{tooltip.label}</strong>: {formatCurrency(tooltip.value)}
        </div>
      )}
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────
export default function OwnerDashboard() {
  const [period, setPeriod] = useState('7days');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);

  // Lọc booking theo ngày
  const filteredBookings = dateFilter
    ? INITIAL_BOOKINGS.filter(b => {
        const cin  = new Date(b.checkIn);
        const cout = new Date(b.checkOut);
        const sel  = new Date(dateFilter);
        cin.setHours(0,0,0,0); cout.setHours(0,0,0,0); sel.setHours(0,0,0,0);
        return sel >= cin && sel <= cout;
      })
    : INITIAL_BOOKINGS;

  const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);
  const pagedBookings = filteredBookings.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const upcomingBookings = INITIAL_BOOKINGS.filter(b => b.status === 'Đã đặt' || b.status === 'Đang ở').slice(0, 4);

  const { percentage, booked, available, total } = OCCUPANCY_DATA;
  const occupancyDeg = Math.round((percentage / 100) * 360);

  return (
    <div className="owner-dashboard-page">

      {/* ── HERO BANNER ────────────────────────────────── */}
      <section className="dashboard-hero">
        <div className="dashboard-hero-overlay" />
        <div className="dashboard-hero-content">
          <div className="hero-greeting">
            <i className="bi bi-hand-wave-fill" /> Xin chào, Nguyễn Văn An!
          </div>
          <h1>
            Chào mừng bạn đến với hệ thống<br />
            quản lý homestay!
          </h1>
          <p>
            Cùng nhau mang đến những trải nghiệm tuyệt vời cho du khách<br />
            và lan tỏa vẻ đẹp quê hương.
          </p>
        </div>

        {/* Homestay card (floating right) */}
        <div className="hero-homestay-card">
          <img
            src="https://images.unsplash.com/photo-1601918774946-25832a4be0d6?auto=format&fit=crop&w=500&q=80"
            alt="Nhà Sàn Mộc"
            className="hero-homestay-image"
          />
          <div className="hero-homestay-info">
            <span className="hero-homestay-sub">Homestay của bạn</span>
            <h3 className="hero-homestay-name">Nhà Sàn Mộc</h3>
            <span className="hero-homestay-loc">
              <i className="bi bi-geo-alt-fill" />
              Làng Cò, Mai Châu, Hòa Bình
            </span>
          </div>
        </div>
      </section>

      {/* ── CONTENT ─────────────────────────────────────── */}
      <div className="dashboard-container">

        {/* ── 4 STAT CARDS ──────────────────────────────── */}
        <section className="dashboard-stat-grid">
          {INITIAL_DASHBOARD_STATS.map(s => (
            <div key={s.id} className="dashboard-stat-card">
              <div className="stat-icon" style={{ background: s.bg, color: s.color }}>
                <i className={`bi ${s.icon}`} />
              </div>
              <div>
                <span className="stat-label">{s.label}</span>
                <div className="stat-number">{typeof s.value === 'number' ? s.value.toLocaleString('vi-VN') : s.value}</div>
                <span className="stat-growth">{s.growth}</span>
                <span className="stat-description">{s.desc}</span>
              </div>
            </div>
          ))}
        </section>

        {/* ── 3-COLUMN GRID ─────────────────────────────── */}
        <div className="dashboard-main-grid">

          {/* ── LEFT: chart + table ───────────────────── */}
          <div className="dashboard-left-column">

            {/* Revenue Chart */}
            <section className="dashboard-card">
              <div className="dashboard-card-header">
                <h2>Doanh thu gần đây</h2>
                <select
                  className="dashboard-select"
                  value={period}
                  onChange={e => setPeriod(e.target.value)}
                >
                  {PERIOD_OPTS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <RevenueChart period={period} />
            </section>

            {/* Recent Bookings */}
            <section className="dashboard-card">
              <div className="dashboard-card-header">
                <h2>Đơn đặt phòng gần đây</h2>
                <div className="table-filter-bar">
                  <input
                    type="date"
                    className="dashboard-select"
                    value={dateFilter}
                    onChange={e => { setDateFilter(e.target.value); setPage(1); }}
                    title="Lọc theo ngày"
                  />
                  <button
                    className="view-all-button"
                    onClick={() => { setDateFilter(''); setPage(1); }}
                  >
                    Tất cả <i className="bi bi-arrow-right" />
                  </button>
                </div>
              </div>

              <div className="booking-table-wrap">
                <table className="booking-table">
                  <thead>
                    <tr>
                      <th>Khách hàng</th>
                      <th>Phòng</th>
                      <th>Ngày nhận – trả</th>
                      <th>Trạng thái</th>
                      <th>Thanh toán</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagedBookings.length > 0 ? pagedBookings.map(b => (
                      <tr key={b.id}>
                        <td>
                          <div className="customer">
                            <img src={b.avatar} alt={b.customerName} />
                            {b.customerName}
                          </div>
                        </td>
                        <td>{b.room}</td>
                        <td>{formatDateRange(b.checkIn, b.checkOut)}</td>
                        <td>
                          <span className={`status ${b.statusClass}`}>{b.status}</span>
                        </td>
                        <td className="price">{formatCurrency(b.price)}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: '#94A3B8' }}>
                          Không có đơn nào trong khoảng thời gian này.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                    <i className="bi bi-chevron-left" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i + 1}
                      className={page === i + 1 ? 'active' : ''}
                      onClick={() => setPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                    <i className="bi bi-chevron-right" />
                  </button>
                </div>
              )}
            </section>
          </div>

          {/* ── MIDDLE: upcoming + notifications ──────── */}
          <div className="dashboard-middle-column">

            {/* Upcoming bookings */}
            <section className="dashboard-card">
              <div className="dashboard-card-header">
                <h2>Lịch đặt phòng sắp tới</h2>
                <button className="view-all-button">Xem tất cả</button>
              </div>
              <div className="upcoming-list">
                {upcomingBookings.map((b, i) => (
                  <div key={b.id} className="upcoming-item">
                    <img src={ROOM_IMAGES[i % ROOM_IMAGES.length]} alt={b.room} />
                    <div className="upcoming-info">
                      <strong>{b.customerName}</strong>
                      <span>Phòng {b.room}</span>
                      <small>{formatDateRange(b.checkIn, b.checkOut)}</small>
                    </div>
                    <div className="upcoming-right">
                      <span className={`status ${b.statusClass}`}>{b.status}</span>
                      <strong>{formatCurrency(b.price)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Notifications */}
            <section className="dashboard-card">
              <div className="dashboard-card-header">
                <h2>Thông báo mới</h2>
                <button className="view-all-button">Xem tất cả</button>
              </div>
              <div className="notification-list">
                {NOTIFICATIONS_DATA.map(n => (
                  <div key={n.id} className="notification-item">
                    <div className={`notification-icon ${n.type}`}>
                      <i className={`bi ${n.icon}`} />
                    </div>
                    <div className="notification-content">
                      <strong>{n.title}</strong>
                      <span>{n.desc}</span>
                    </div>
                    <small>{n.time}</small>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* ── RIGHT: quick actions + occupancy + image ── */}
          <aside className="dashboard-right-column">

            {/* Quick Actions */}
            <section className="dashboard-card">
              <h2 className="dashboard-section-title">Thao tác nhanh</h2>
              <div className="quick-actions">
                <button>
                  <i className="bi bi-door-open green" />
                  Thêm phòng
                </button>
                <button>
                  <i className="bi bi-basket2 blue" />
                  Thêm dịch vụ
                </button>
                <button>
                  <i className="bi bi-ticket-perforated orange" />
                  Tạo mã giảm giá
                </button>
                <button>
                  <i className="bi bi-calendar-plus blue" />
                  Thêm nhiệm vụ
                </button>
              </div>
            </section>

            {/* Occupancy */}
            <section className="dashboard-card">
              <h2 className="dashboard-section-title">Tỷ lệ lấp đầy phòng</h2>
              <div className="occupancy-container">
                <div
                  className="occupancy-circle"
                  style={{
                    background: `conic-gradient(#059669 0deg ${occupancyDeg}deg, #E2E8F0 ${occupancyDeg}deg 360deg)`
                  }}
                >
                  <span>{percentage}%</span>
                </div>
                <div className="occupancy-legend">
                  <div>
                    <span className="legend-dot green" />
                    <span>Đã đặt</span>
                    <strong>{booked}</strong>
                  </div>
                  <div>
                    <span className="legend-dot gray" />
                    <span>Còn trống</span>
                    <strong>{available}</strong>
                  </div>
                  <div>
                    <span className="legend-dot orange" />
                    <span>Tổng phòng</span>
                    <strong>{total}</strong>
                  </div>
                </div>
              </div>
            </section>

            {/* Bottom image card */}
            <div className="bottom-image-card">
              <img
                src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=80"
                alt="Homestay"
              />
              <div>
                Cùng phát triển<br />homestay Việt!
              </div>
            </div>

          </aside>
        </div>
      </div>
    </div>
  );
}
