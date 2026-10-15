import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './OwnerDashboard.css';
import {
  formatCurrency,
  formatDateRange,
} from './ownerDashboardData';

const ITEMS_PER_PAGE = 5;
const PERIOD_OPTS = [
  { value: '7days',  label: '7 ngày gần đây' },
  { value: '30days', label: '30 ngày gần đây' },
  { value: 'month',  label: 'Tháng này' },
];

// ─── SVG Revenue Chart ─────────────────────────────────────────────────────────
function RevenueChart({ data = [] }) {
  const [tooltip, setTooltip] = useState(null);
  const svgRef = useRef(null);

  const W = 560, H = 200;
  const PL = 48, PR = 16, PT = 12, PB = 32;
  const chartW = W - PL - PR;
  const chartH = H - PT - PB;

  const labels = data.map(point => point.label);
  const values = data.map(point => Number(point.amount) || 0);
  const maxVal = Math.max(...values, 1);
  const ySteps = 4;

  const points = labels.map((_, i) => ({
    x: PL + (i / Math.max(labels.length - 1, 1)) * chartW,
    y: PT + chartH - (values[i] / maxVal) * chartH,
    value: values[i],
    label: labels[i],
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaD = points.length ? `${pathD} L${points[points.length - 1].x.toFixed(1)},${(PT + chartH).toFixed(1)} L${PL},${(PT + chartH).toFixed(1)} Z` : '';

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
        {points.length > 1 && <path d={areaD} fill="url(#revGrad)" />}

        {/* Line */}
        {points.length > 1 && <path d={pathD} fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}

        {/* Points */}
        {points.map((p, i) => (labels.length <= 10 || i % Math.ceil(labels.length / 7) === 0 || i === labels.length - 1) && (
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
        {points.map((p, i) => (labels.length <= 10 || i % Math.ceil(labels.length / 7) === 0 || i === labels.length - 1) && (
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
  const [notifications, setNotifications] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState('');
  const [activeHomestayId, setActiveHomestayId] = useState(() => localStorage.getItem('ownerActiveHomestayId'));
  const owner = JSON.parse(localStorage.getItem('user') || 'null') || {};

  useEffect(() => {
    const syncHomestay = () => setActiveHomestayId(localStorage.getItem('ownerActiveHomestayId'));
    window.addEventListener('ownerActiveHomestayChanged', syncHomestay);
    window.addEventListener('storage', syncHomestay);
    return () => {
      window.removeEventListener('ownerActiveHomestayChanged', syncHomestay);
      window.removeEventListener('storage', syncHomestay);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!activeHomestayId || !user?.token) {
      setDashboard(null);
      setDashboardLoading(false);
      setDashboardError(activeHomestayId ? 'Vui lòng đăng nhập lại để tải số liệu.' : 'Chọn hoặc tạo homestay để xem thống kê.');
      return () => { cancelled = true; };
    }
    const apiBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/auth\/?$/, '') || 'http://localhost:8081/api';
    setDashboardLoading(true);
    setDashboardError('');
    fetch(`${apiBase}/owner/dashboard?homestayId=${encodeURIComponent(activeHomestayId)}&period=${period}`, {
      headers: { Authorization: `Bearer ${user.token}` },
    })
      .then(async response => {
        if (!response.ok) throw new Error((await response.json().catch(() => ({}))).message || 'Không tải được dữ liệu dashboard.');
        return response.json();
      })
      .then(data => { if (!cancelled) setDashboard(data); })
      .catch(error => { if (!cancelled) { setDashboard(null); setDashboardError(error.message); } })
      .finally(() => { if (!cancelled) setDashboardLoading(false); });
    return () => { cancelled = true; };
  }, [activeHomestayId, period]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user?.id || !user?.token) return;
    const apiBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/auth\/?$/, '') || 'http://localhost:8081/api';
    const load = () => fetch(`${apiBase}/notifications`, { headers: { Authorization: `Bearer ${user.token}` } })
      .then((response) => response.ok ? response.json() : [])
      .then((items) => setNotifications(Array.isArray(items) ? items.slice(0, 5) : []))
      .catch(() => setNotifications([]));
    load();
    const socketBase = import.meta.env.VITE_WS_BASE_URL || apiBase.replace(/^http/, 'ws').replace(/\/api$/, '');
    const socket = new WebSocket(`${socketBase}/ws/notifications?token=${encodeURIComponent(user.token)}`);
    socket.onmessage = load;
    return () => socket.close();
  }, []);

  // Lọc các booking thật theo ngày
  const bookings = dashboard?.recentBookings || [];
  const filteredBookings = dateFilter
    ? bookings.filter(b => {
        const cin  = new Date(b.checkIn);
        const cout = new Date(b.checkOut);
        const sel  = new Date(dateFilter);
        cin.setHours(0,0,0,0); cout.setHours(0,0,0,0); sel.setHours(0,0,0,0);
        return sel >= cin && sel <= cout;
      })
    : bookings;

  const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);
  const pagedBookings = filteredBookings.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const upcomingBookings = dashboard?.upcomingBookings || [];

  const stats = dashboard?.summary || {};
  const percentage = Number(stats.occupancyRate) || 0;
  const booked = Number(stats.bookedRooms) || 0;
  const available = Number(stats.availableRooms) || 0;
  const total = Number(stats.totalRooms) || 0;
  const occupancyDeg = Math.round((percentage / 100) * 360);
  const statCards = [
    { id: 'total-bookings', label: 'Tổng booking', value: Number(stats.totalBookings) || 0, desc: 'Tổng đơn của cơ sở', icon: 'bi-calendar2-check', color: '#11885f', bg: '#ddf5e9' },
    { id: 'pending-bookings', label: 'Booking chờ xác nhận', value: Number(stats.pendingBookings) || 0, desc: 'Cần xử lý', icon: 'bi-clock-history', color: '#25a8c7', bg: '#ddf4fa' },
    { id: 'today-checkin', label: 'Check-in hôm nay', value: Number(stats.checkInsToday) || 0, desc: 'Theo ngày nhận phòng', icon: 'bi-door-open', color: '#7355d9', bg: '#ece6ff' },
    { id: 'monthly-revenue', label: 'Doanh thu tháng này', value: formatCurrency(stats.monthRevenue), desc: 'Thanh toán thành công', icon: 'bi-cash-stack', color: '#11885f', bg: '#ddf5e9' },
  ];

  return (
    <div className="owner-dashboard-page">

      {/* ── HERO BANNER ────────────────────────────────── */}
      <section className="dashboard-hero">
        <div className="dashboard-hero-overlay" />
        <div className="dashboard-hero-content">
          <div className="hero-greeting">
            <i className="bi bi-hand-wave-fill" /> Xin chào, {owner.fullName || owner.name || owner.email || 'Chủ homestay'}!
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
          {dashboard?.homestay?.img ? <img src={dashboard.homestay.img} alt={dashboard.homestay.name} className="hero-homestay-image" /> : <div className="hero-homestay-image hero-homestay-placeholder"><i className="bi bi-houses-fill" /></div>}
          <div className="hero-homestay-info">
            <span className="hero-homestay-sub">Homestay của bạn</span>
            <h3 className="hero-homestay-name">{dashboard?.homestay?.name || 'Chưa chọn cơ sở'}</h3>
            <span className="hero-homestay-loc">
              <i className="bi bi-geo-alt-fill" />
              {[dashboard?.homestay?.address, dashboard?.homestay?.city].filter(Boolean).join(', ') || 'Chưa cập nhật địa chỉ'}
            </span>
          </div>
        </div>
      </section>

      {/* ── CONTENT ─────────────────────────────────────── */}
      <div className="dashboard-container">

        {/* ── 4 STAT CARDS ──────────────────────────────── */}
        <section className="dashboard-stat-grid">
          {statCards.map(s => (
            <div key={s.id} className="dashboard-stat-card">
              <div className="stat-icon" style={{ background: s.bg, color: s.color }}>
                <i className={`bi ${s.icon}`} />
              </div>
              <div>
                <span className="stat-label">{s.label}</span>
                <div className="stat-number">{typeof s.value === 'number' ? s.value.toLocaleString('vi-VN') : s.value}</div>
                {s.id === 'monthly-revenue' && <span className="stat-growth">Tháng trước: {formatCurrency(stats.previousMonthRevenue)}</span>}
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
              {dashboardLoading ? <p className="dashboard-empty-state">Đang tải doanh thu...</p> : <RevenueChart data={dashboard?.revenue || []} />}
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
                    {!dashboardLoading && pagedBookings.length > 0 ? pagedBookings.map(b => (
                      <tr key={b.id}>
                        <td>
                          <div className="customer">
                            {b.avatar ? <img src={b.avatar} alt={b.customerName} /> : <span className="customer-avatar-placeholder"><i className="bi bi-person-fill" /></span>}
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
                          {dashboardLoading ? 'Đang tải đơn đặt phòng...' : (dashboardError || 'Chưa có đơn đặt phòng trong khoảng thời gian này.')}
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
                <Link to="/owner/bookings" className="view-all-button">Xem tất cả</Link>
              </div>
              <div className="upcoming-list">
                {upcomingBookings.map((b) => (
                  <div key={b.id} className="upcoming-item">
                    {b.avatar ? <img src={b.avatar} alt={b.room} /> : <span className="customer-avatar-placeholder"><i className="bi bi-door-open" /></span>}
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
                {!dashboardLoading && upcomingBookings.length === 0 && <p className="dashboard-empty-state">Chưa có lịch nhận phòng sắp tới.</p>}
              </div>
            </section>

            {/* Notifications */}
            <section className="dashboard-card">
              <div className="dashboard-card-header">
                <h2>Thông báo mới</h2>
              <Link to="/owner/notifications" className="view-all-button">Xem tất cả</Link>
              </div>
              <div className="notification-list">
                {notifications.map(n => (
                  <div key={n.id} className="notification-item">
                    <div className="notification-icon green">
                      <i className="bi bi-bell-fill" />
                    </div>
                    <div className="notification-content">
                      <strong>{n.title}</strong>
                      <span>{n.message}</span>
                    </div>
                    <small>{n.createdAt ? new Date(n.createdAt).toLocaleString('vi-VN') : ''}</small>
                  </div>
                ))}
                {!notifications.length && <p>Chưa có thông báo.</p>}
              </div>
            </section>
          </div>

          {/* ── RIGHT: quick actions + occupancy + image ── */}
          <aside className="dashboard-right-column">

            {/* Quick Actions */}
            <section className="dashboard-card">
              <h2 className="dashboard-section-title">Thao tác nhanh</h2>
              <div className="quick-actions">
                <Link to="/owner/rooms">
                  <i className="bi bi-door-open green" />
                  Thêm phòng
                </Link>
                <Link to="/owner/services">
                  <i className="bi bi-basket2 blue" />
                  Thêm dịch vụ
                </Link>
                <Link to="/owner/discounts">
                  <i className="bi bi-ticket-perforated orange" />
                  Tạo mã giảm giá
                </Link>
                <Link to="/owner/missions">
                  <i className="bi bi-calendar-plus blue" />
                  Thêm nhiệm vụ
                </Link>
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
            {dashboardError && <p className="dashboard-empty-state">{dashboardError}</p>}

          </aside>
        </div>
      </div>
    </div>
  );
}
