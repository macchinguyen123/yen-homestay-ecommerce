import { useState, useMemo, useRef, useEffect } from 'react';
import './ManageRevenue.css';
import {
  INITIAL_REVENUE_METRICS,
  INITIAL_ROOM_REVENUES,
  INITIAL_SERVICE_REVENUES,
  INITIAL_TRANSACTIONS,
  CHART_POINTS
} from './manageRevenueData';

export default function ManageRevenue() {
  // ── States ───────────────────────────────────────────────────────────
  // Time filter: 'all' | '1_week' | '1_month' | '1_year' | 'custom'
  const [timePreset, setTimePreset] = useState('1_month');
  const [dateFrom, setDateFrom] = useState('2026-09-01');
  const [dateTo, setDateTo] = useState('2026-09-30');

  const handleApplyPreset = (preset) => {
    setTimePreset(preset);
    if (preset === 'all') {
      setDateFrom('');
      setDateTo('');
    } else if (preset === '1_week') {
      setDateFrom('2026-09-22');
      setDateTo('2026-09-28');
    } else if (preset === '1_month') {
      setDateFrom('2026-09-01');
      setDateTo('2026-09-30');
    } else if (preset === '1_year') {
      setDateFrom('2026-01-01');
      setDateTo('2026-12-31');
    }
  };

  // Homestay Filter
  const [activeHomestayId, setActiveHomestayId] = useState(
    () => localStorage.getItem('ownerActiveHomestayId') || 'all'
  );
  const [homestaysList, setHomestaysList] = useState([]);

  useEffect(() => {
    // Fetch homebstays list
    const fetchHomestays = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        const uid = user?.id;
        const url = uid
          ? `http://localhost:8081/api/public/admin/homestays?ownerId=${uid}`
          : 'http://localhost:8081/api/public/homestays';
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setHomestaysList(data);
        }
      } catch (_) {}
    };
    fetchHomestays();

    const handleSync = () => {
      setActiveHomestayId(localStorage.getItem('ownerActiveHomestayId') || 'all');
    };
    window.addEventListener('ownerActiveHomestayChanged', handleSync);
    return () => window.removeEventListener('ownerActiveHomestayChanged', handleSync);
  }, []);

  const currentHomestayName = useMemo(() => {
    if (!activeHomestayId || activeHomestayId === 'all') return 'Tất cả cơ sở Homestay';
    const found = homestaysList.find(h => String(h.id) === String(activeHomestayId));
    return found ? found.name : 'Tất cả cơ sở Homestay';
  }, [homestaysList, activeHomestayId]);

  // Transactions State
  const [transactions] = useState(INITIAL_TRANSACTIONS);
  const [searchTx, setSearchTx] = useState('');
  const [sortOption, setSortOption] = useState('newest'); // 'newest' | 'oldest' | 'highest' | 'lowest'
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  // SVG Chart Interactive Hover
  const [chartHover, setChartHover] = useState({
    visible: false,
    x: 0,
    y: 0,
    value: '',
    date: ''
  });

  const svgRef = useRef(null);

  // ── Dynamic Title & Dynamic Metrics Calculation ──────────────────────
  const { periodTitle, metrics } = useMemo(() => {
    let title = '';
    let factor = 1.0;

    if (timePreset === 'all' && !dateFrom && !dateTo) {
      title = 'Toàn bộ thời gian (Tất cả)';
      factor = 3.5;
    } else if (timePreset === '1_week') {
      title = '1 tuần qua (22/09 - 28/09/2026)';
      factor = 0.28;
    } else if (timePreset === '1_month') {
      title = '1 tháng qua (Tháng 09/2026)';
      factor = 1.0;
    } else if (timePreset === '1_year') {
      title = '1 năm (Năm 2026)';
      factor = 11.2;
    } else {
      if (dateFrom && dateTo) {
        title = `Từ ${dateFrom} đến ${dateTo}`;
        const diffDays = Math.max(1, Math.round((new Date(dateTo) - new Date(dateFrom)) / (1000 * 60 * 60 * 24)));
        factor = Math.max(0.1, diffDays / 30);
      } else if (dateFrom) {
        title = `Từ ngày ${dateFrom}`;
        factor = 1.0;
      } else if (dateTo) {
        title = `Đến ngày ${dateTo}`;
        factor = 1.0;
      } else {
        title = 'Toàn bộ thời gian (Tất cả)';
        factor = 3.5;
      }
    }

    const baseTotal = Math.round(128500000 * factor);
    const room = Math.round(baseTotal * 0.64);
    const service = baseTotal - room;
    const deposit = Math.round(baseTotal * 0.25);

    return {
      periodTitle: title,
      metrics: {
        total: baseTotal,
        room,
        service,
        deposit
      }
    };
  }, [timePreset, dateFrom, dateTo]);

  // ── Transactions Filtering & Sorting ─────────────────────────────────
  const sortedTransactions = useMemo(() => {
    let list = transactions.filter((tx) => {
      const q = searchTx.toLowerCase();
      const matchSearch =
        tx.id.toLowerCase().includes(q) ||
        tx.customer.toLowerCase().includes(q) ||
        tx.detail.toLowerCase().includes(q);
      if (!matchSearch) return false;

      // Lọc theo ngày giao dịch
      if (dateFrom || dateTo) {
        const txDate = tx.timestamp ? new Date(tx.timestamp) : null;
        if (txDate) {
          if (dateFrom && txDate < new Date(dateFrom)) return false;
          if (dateTo && txDate > new Date(dateTo + 'T23:59:59')) return false;
        }
      }

      return true;
    });

    list.sort((a, b) => {
      if (sortOption === 'newest') return new Date(b.timestamp) - new Date(a.timestamp);
      if (sortOption === 'oldest') return new Date(a.timestamp) - new Date(b.timestamp);
      if (sortOption === 'highest') return b.amount - a.amount;
      if (sortOption === 'lowest') return a.amount - b.amount;
      return 0;
    });

    return list;
  }, [transactions, searchTx, sortOption, dateFrom, dateTo]);

  // ── SVG Chart Mouse Move Handler ─────────────────────────────────────
  const handleChartMouseMove = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const svgWidth = rect.width;

    // Map clientX [0, svgWidth] -> chartX [0, 1000]
    const chartX = Math.max(0, Math.min(1000, (clientX / svgWidth) * 1000));

    // Find closest chart point
    let closest = CHART_POINTS[0];
    let minDiff = Infinity;
    CHART_POINTS.forEach((pt) => {
      const diff = Math.abs(pt.x - chartX);
      if (diff < minDiff) {
        minDiff = diff;
        closest = pt;
      }
    });

    setChartHover({
      visible: true,
      x: closest.x,
      y: closest.y,
      value: closest.value.toLocaleString('vi-VN') + 'đ',
      date: closest.date
    });
  };

  const handleChartMouseLeave = () => {
    setChartHover((prev) => ({ ...prev, visible: false }));
  };

  const formatVND = (num) => num.toLocaleString('vi-VN') + 'đ';

  return (
    <div className="manage-revenue-page">
      {/* ── 1. Top Context & Action Banner ── */}
      <div className="mr-hero-banner">
        <div className="mr-hero-glow" />
        <div className="mr-hero-left">
          {homestaysList.length > 0 ? (
            <div className="mr-homestay-selector-wrap" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#88d982' }}>cottage</span>
              <select
                value={activeHomestayId}
                onChange={(e) => {
                  setActiveHomestayId(e.target.value);
                  localStorage.setItem('ownerActiveHomestayId', e.target.value);
                  window.dispatchEvent(new Event('ownerActiveHomestayChanged'));
                }}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  padding: '4px 28px 4px 10px',
                  cursor: 'pointer',
                  appearance: 'none',
                  outline: 'none',
                  minWidth: '180px'
                }}
              >
                <option value="all" style={{ background: '#154332', color: '#fff' }}>🏠 Tất cả cơ sở ({homestaysList.length})</option>
                {homestaysList.map(h => (
                  <option key={h.id} value={h.id} style={{ background: '#154332', color: '#fff' }}>
                    🏡 {h.name}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', pointerEvents: 'none', marginLeft: '-24px' }}>expand_more</span>
            </div>
          ) : (
            <span className="mr-tag-homestay">Nhà Sàn Mộc • Mai Châu</span>
          )}
          <h1 className="mr-hero-title">Doanh thu &amp; Báo cáo thống kê</h1>
          {activeHomestayId !== 'all' && (
            <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>
              Đang xem: <strong style={{ color: '#88d982' }}>{currentHomestayName}</strong>
            </p>
          )}
        </div>

        <div className="mr-hero-right">
          {/* Dynamic Filter Controls: Tất cả, 1 tuần, 1 tháng, 1 năm & Từ ngày - Đến ngày */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            background: '#ffffff',
            padding: '6px 12px',
            borderRadius: '12px',
            border: '1px solid rgba(192, 200, 194, 0.6)',
            boxShadow: '0 2px 8px rgba(21, 67, 50, 0.06)',
            flexWrap: 'wrap'
          }}>
            {/* Quick Time Presets */}
            <div style={{ display: 'inline-flex', background: '#f1f5f9', borderRadius: '8px', padding: '3px', gap: '3px' }}>
              <button
                type="button"
                className={`mr-filter-btn ${timePreset === 'all' && !dateFrom && !dateTo ? 'active' : ''}`}
                onClick={() => handleApplyPreset('all')}
                style={{ borderRadius: '6px', padding: '5px 12px', fontSize: '12px', fontWeight: 700 }}
              >
                Tất cả
              </button>
              <button
                type="button"
                className={`mr-filter-btn ${timePreset === '1_week' ? 'active' : ''}`}
                onClick={() => handleApplyPreset('1_week')}
                style={{ borderRadius: '6px', padding: '5px 12px', fontSize: '12px', fontWeight: 700 }}
              >
                1 tuần
              </button>
              <button
                type="button"
                className={`mr-filter-btn ${timePreset === '1_month' ? 'active' : ''}`}
                onClick={() => handleApplyPreset('1_month')}
                style={{ borderRadius: '6px', padding: '5px 12px', fontSize: '12px', fontWeight: 700 }}
              >
                1 tháng
              </button>
              <button
                type="button"
                className={`mr-filter-btn ${timePreset === '1_year' ? 'active' : ''}`}
                onClick={() => handleApplyPreset('1_year')}
                style={{ borderRadius: '6px', padding: '5px 12px', fontSize: '12px', fontWeight: 700 }}
              >
                1 năm
              </button>
            </div>

            <div style={{ width: '1px', height: '22px', background: '#e2e8f0' }} />

            {/* Custom Date Range Picker */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span className="material-symbols-outlined text-[16px] text-emerald-800" style={{ fontSize: '16px', color: '#166534' }}>calendar_today</span>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>Từ:</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setTimePreset('custom');
                }}
                style={{
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  background: '#f8fafc',
                  fontSize: '12px',
                  color: '#1e293b',
                  padding: '4px 8px',
                  outline: 'none',
                  cursor: 'pointer',
                  width: '125px',
                  minWidth: '125px',
                  fontWeight: 600
                }}
                title="Lọc báo cáo từ ngày"
              />
              <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 700 }}>–</span>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>Đến:</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setTimePreset('custom');
                }}
                style={{
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  background: '#f8fafc',
                  fontSize: '12px',
                  color: '#1e293b',
                  padding: '4px 8px',
                  outline: 'none',
                  cursor: 'pointer',
                  width: '125px',
                  minWidth: '125px',
                  fontWeight: 600
                }}
                title="Lọc báo cáo đến ngày"
              />
              {(dateFrom || dateTo) && (
                <button
                  type="button"
                  onClick={() => handleApplyPreset('all')}
                  style={{
                    background: '#fee2e2',
                    border: '1px solid #fecaca',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    color: '#dc2626',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 700,
                    marginLeft: '4px'
                  }}
                  title="Xóa khoảng ngày lọc"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Action Export Buttons */}
          <div className="mr-action-buttons">
            <button
              type="button"
              className="mr-btn-action-outline"
              onClick={() => alert(`Đã xuất báo cáo doanh thu Excel cho kỳ: ${periodTitle}!`)}
            >
              <span className="material-symbols-outlined text-[18px]" style={{ color: '#1b6d24' }}>
                description
              </span>
              <span>Xuất báo cáo Excel</span>
            </button>
            <button
              type="button"
              className="mr-btn-action-primary"
              onClick={() => window.print()}
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              <span>Xuất báo cáo PDF/Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. Metric Highlights Grid ── */}
      <div className="mr-metrics-grid">
        <div className="mr-metric-card">
          <div className="mr-metric-header">
            <span className="mr-metric-lbl">TỔNG DOANH THU THUẦN</span>
            <div className="mr-metric-icon green">
              <span className="material-symbols-outlined text-[24px]">payments</span>
            </div>
          </div>
          <div className="mr-metric-value">
            {metrics.total.toLocaleString('vi-VN')}
            <span className="currency">đ</span>
          </div>
        </div>

        <div className="mr-metric-card">
          <div className="mr-metric-header">
            <span className="mr-metric-lbl">TIỀN PHÒNG LƯU TRÚ</span>
            <div className="mr-metric-icon blue">
              <span className="material-symbols-outlined text-[24px]">door_open</span>
            </div>
          </div>
          <div className="mr-metric-value" style={{ color: '#0b1c30' }}>
            {metrics.room.toLocaleString('vi-VN')}
            <span className="currency">đ</span>
          </div>
        </div>

        <div className="mr-metric-card">
          <div className="mr-metric-header">
            <span className="mr-metric-lbl">DỊCH VỤ &amp; BẢN ĐỊA</span>
            <div className="mr-metric-icon amber">
              <span className="material-symbols-outlined text-[24px]">local_mall</span>
            </div>
          </div>
          <div className="mr-metric-value" style={{ color: '#0b1c30' }}>
            {metrics.service.toLocaleString('vi-VN')}
            <span className="currency">đ</span>
          </div>
        </div>

        <div className="mr-metric-card">
          <div className="mr-metric-header">
            <span className="mr-metric-lbl">CỌC BÁN &amp; QUYẾT TOÁN</span>
            <div className="mr-metric-icon cyan">
              <span className="material-symbols-outlined text-[24px]">verified_user</span>
            </div>
          </div>
          <div className="mr-metric-value" style={{ color: '#0b1c30' }}>
            {metrics.deposit.toLocaleString('vi-VN')}
            <span className="currency">đ</span>
          </div>
        </div>
      </div>

      {/* ── 3. Revenue Evolution Chart ── */}
      <div className="mr-chart-section">
        <div className="mr-chart-header">
          <span className="mr-badge-real">Thực tế</span>
          <h3 className="mr-chart-title">Diễn biến doanh thu {periodTitle}</h3>
        </div>
        <p style={{ margin: 0, fontSize: '13px', color: '#414944' }}>
          Ghi nhận đỉnh doanh thu cao điểm vào các dịp cuối tuần và sự kiện văn hóa.
        </p>

        <div className="mr-chart-legend">
          <div className="mr-legend-item">
            <span className="mr-legend-dot" style={{ backgroundColor: '#002c1e' }} />
            <span>Tiền phòng lưu trú</span>
          </div>
          <div className="mr-legend-item">
            <span className="mr-legend-dot" style={{ backgroundColor: '#f59e0b' }} />
            <span>Trải nghiệm &amp; Ẩm thực Tây Bắc</span>
          </div>
          <div className="mr-legend-item">
            <span className="mr-legend-dot" style={{ backgroundColor: '#1b6d24' }} />
            <span>Trung bình kỳ báo cáo</span>
          </div>
        </div>

        {/* SVG Chart with Interactive Crosshair */}
        <div className="mr-chart-canvas-wrap">
          {/* Y Axis Labels */}
          <div className="mr-y-axis">
            <span>10.000.000đ</span>
            <span>8.000.000đ</span>
            <span>6.000.000đ</span>
            <span>4.000.000đ</span>
            <span>2.000.000đ</span>
            <span>0đ</span>
          </div>

          {/* SVG Canvas Body */}
          <div className="mr-chart-body">
            <svg
              ref={svgRef}
              className="mr-svg-chart"
              viewBox="0 0 1000 220"
              preserveAspectRatio="none"
              onMouseMove={handleChartMouseMove}
              onMouseLeave={handleChartMouseLeave}
            >
              <defs>
                <linearGradient id="gradientGreenRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#002c1e" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#002c1e" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines */}
              <line x1="0" y1="0" x2="1000" y2="0" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="0" y1="44" x2="1000" y2="44" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="0" y1="88" x2="1000" y2="88" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="0" y1="132" x2="1000" y2="132" stroke="#F1F5F9" strokeWidth="1" />
              <line x1="0" y1="176" x2="1000" y2="176" stroke="#F1F5F9" strokeWidth="1" />

              {/* Chart Area Fill & Smooth Curve */}
              <path
                d="M0,150 C70,150 100,50 150,50 C200,50 220,180 300,180 C370,180 400,80 480,80 C540,80 570,160 630,160 C700,160 730,20 800,20 C870,20 920,120 1000,120 L1000,220 L0,220 Z"
                fill="url(#gradientGreenRevenue)"
              />
              <path
                d="M0,150 C70,150 100,50 150,50 C200,50 220,180 300,180 C370,180 400,80 480,80 C540,80 570,160 630,160 C700,160 730,20 800,20 C870,20 920,120 1000,120"
                fill="none"
                stroke="#002c1e"
                strokeWidth="3.5"
              />

              {/* Interactive Crosshair & Dot */}
              {chartHover.visible && (
                <>
                  <line
                    x1={chartHover.x}
                    y1="0"
                    x2={chartHover.x}
                    y2="220"
                    stroke="#002c1e"
                    strokeWidth="1.5"
                    strokeDasharray="4"
                  />
                  <circle
                    cx={chartHover.x}
                    cy={chartHover.y}
                    r="6"
                    fill="#ffffff"
                    stroke="#002c1e"
                    strokeWidth="3"
                  />
                </>
              )}
            </svg>

            {/* Dynamic Tooltip */}
            {chartHover.visible && (
              <div
                className="mr-chart-tooltip"
                style={{
                  left: `${(chartHover.x / 1000) * 100}%`,
                  top: `${(chartHover.y / 220) * 100}%`
                }}
              >
                {chartHover.date}: {chartHover.value}
              </div>
            )}

            {/* X Axis Labels */}
            <div className="mr-x-axis">
              <span>Đầu kỳ</span>
              <span>Giai đoạn 1</span>
              <span>Giai đoạn 2</span>
              <span>Giữa kỳ</span>
              <span>Giai đoạn 3</span>
              <span>Cuối kỳ</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Allocation Grid: Top Rooms & Services ── */}
      <div className="mr-allocation-grid">
        {/* Top Rooms */}
        <div className="mr-card-box">
          <div className="mr-box-header">
            <div>
              <h3 className="mr-box-title">Top phòng doanh thu cao nhất</h3>
              <p className="mr-box-subtitle">Phân bổ hiệu suất phòng nghiệp vụ Nhà Sàn Mộc</p>
            </div>
            <span className="mr-tag-homestay" style={{ background: '#e5eeff', color: '#002c1e' }}>
              4 Hạng phòng
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {INITIAL_ROOM_REVENUES.map((room) => (
              <div key={room.id} className="mr-room-item">
                {room.image ? (
                  <img src={room.image} alt={room.name} className="mr-room-thumb" />
                ) : (
                  <div className="mr-room-icon-box">
                    <span className="material-symbols-outlined text-[24px]">{room.icon}</span>
                  </div>
                )}
                <div className="mr-room-info">
                  <div className="mr-room-name-row">
                    <h4 className="mr-room-name">{room.name}</h4>
                    {room.rank && (
                      <span className={`mr-room-badge ${room.rank === 'Top 1' ? 'top1' : 'top2'}`}>
                        {room.rank}
                      </span>
                    )}
                  </div>
                  <span className="mr-room-sub">
                    {room.bookings} lượt đặt • {room.occupancy}
                  </span>
                </div>
                <div className="mr-room-rev">
                  <strong className="mr-room-val">{formatVND(room.revenue)}</strong>
                  <span className="mr-room-pct">{room.percentage} doanh thu phòng</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Services */}
        <div className="mr-card-box">
          <div className="mr-box-header">
            <div>
              <h3 className="mr-box-title">Dịch vụ &amp; Trải nghiệm bản địa</h3>
              <p className="mr-box-subtitle">Động lực tăng trưởng lợi nhuận ròng của Homestay</p>
            </div>
            <span className="mr-tag-homestay" style={{ background: '#fef3c7', color: '#78350f' }}>
              {formatVND(INITIAL_REVENUE_METRICS.serviceRevenue)}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {INITIAL_SERVICE_REVENUES.map((srv) => (
              <div key={srv.id} className="mr-service-item">
                <div className="mr-service-icon">{srv.icon}</div>
                <div className="mr-service-content">
                  <div className="mr-service-name-row">
                    <h4 className="mr-service-name">{srv.name}</h4>
                    <strong className="mr-service-val">
                      {formatVND(srv.revenue)}{' '}
                      <span style={{ fontSize: '11px', color: '#717974', fontWeight: 400 }}>
                        ({srv.percentage}%)
                      </span>
                    </strong>
                  </div>
                  <div className="mr-progress-track">
                    <div
                      className="mr-progress-fill"
                      style={{ width: `${srv.percentage}%`, backgroundColor: srv.color }}
                    />
                  </div>
                  <div className="mr-service-sub-row">
                    <span>{srv.detail}</span>
                    <span>{srv.countDisplay}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '4px', paddingTop: '10px', borderTop: '1px solid #e5eeff', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: '#414944' }}>Biên lợi nhuận gộp mảng trải nghiệm:</span>
            <strong style={{ color: '#1b6d24' }}>68.5% (Tỷ suất sinh lời cao nhất)</strong>
          </div>
        </div>
      </div>

      {/* ── 5. Transactions & Reconciliation Table ── */}
      <div className="mr-table-section">
        <div className="mr-table-controls">
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              Lịch sử giao dịch &amp; Đối soát cọc gần nhất
              <span style={{ fontSize: '11px', fontWeight: 400, background: '#eff4ff', padding: '2px 8px', borderRadius: '9999px', color: '#414944' }}>
                Đồng bộ tự động
              </span>
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: '#414944' }}>
              Theo dõi đối soát tiền cọc và tiền OTA chuyển khoản qua VietQR
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Search */}
            <div className="mr-search-box">
              <span className="material-symbols-outlined mr-search-icon">search</span>
              <input
                type="text"
                placeholder="Tìm mã TX, tên khách..."
                className="mr-search-input"
                value={searchTx}
                onChange={(e) => setSearchTx(e.target.value)}
              />
            </div>

            {/* Sort Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className="mr-btn-action-outline"
                style={{ padding: '6px 12px' }}
                onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
              >
                <span className="material-symbols-outlined text-[16px]">filter_list</span>
                <span>
                  {sortOption === 'newest' && 'Gần nhất (thời gian)'}
                  {sortOption === 'oldest' && 'Lâu nhất (thời gian)'}
                  {sortOption === 'highest' && 'Nhiều nhất (tiền)'}
                  {sortOption === 'lowest' && 'Thấp nhất (tiền)'}
                </span>
                <span className="material-symbols-outlined text-[16px]">expand_more</span>
              </button>

              {sortDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    marginTop: '6px',
                    width: '200px',
                    backgroundColor: '#fff',
                    borderRadius: '10px',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.12)',
                    border: '1px solid #c0c8c2',
                    zIndex: 30,
                    overflow: 'hidden'
                  }}
                >
                  {[
                    ['newest', 'Gần nhất (thời gian)'],
                    ['oldest', 'Lâu nhất (thời gian)'],
                    ['highest', 'Nhiều nhất (tiền)'],
                    ['lowest', 'Thấp nhất (tiền)']
                  ].map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '8px 14px',
                        background: sortOption === val ? '#eff4ff' : 'none',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: sortOption === val ? 700 : 500,
                        color: sortOption === val ? '#002c1e' : '#0b1c30',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        setSortOption(val);
                        setSortDropdownOpen(false);
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table Body */}
        <div className="mr-table-wrap">
          <table className="mr-table">
            <thead>
              <tr>
                <th>MÃ GIAO DỊCH</th>
                <th>THỜI GIAN</th>
                <th>KHÁCH HÀNG / ĐOÀN</th>
                <th>LOẠI THU / NGHIỆP VỤ</th>
                <th>KÊNH NHẬN</th>
                <th>SỐ TIỀN</th>
                <th>TRẠNG THÁI</th>
              </tr>
            </thead>
            <tbody>
              {sortedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#717974' }}>
                    Không có giao dịch nào khớp với tìm kiếm.
                  </td>
                </tr>
              ) : (
                sortedTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="mr-tx-id">{tx.id}</td>
                    <td style={{ fontSize: '12px', color: '#414944' }}>{tx.timeDisplay}</td>
                    <td>
                      <strong style={{ display: 'block', fontSize: '13px' }}>{tx.customer}</strong>
                      <span style={{ fontSize: '11.5px', color: '#717974' }}>{tx.detail}</span>
                    </td>
                    <td>
                      <span style={{ padding: '2px 8px', borderRadius: '4px', background: '#eff4ff', border: '1px solid #d3e4fe', fontSize: '11px', color: '#0369a1' }}>
                        {tx.type}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="material-symbols-outlined text-[16px]" style={{ color: tx.channelIconColor }}>
                          {tx.channelIcon}
                        </span>
                        <span>{tx.channelName}</span>
                      </div>
                    </td>
                    <td className="mr-tx-amount">+{formatVND(tx.amount)}</td>
                    <td>
                      <span className={`mr-tx-badge ${tx.statusType}`}>
                        <span className="material-symbols-outlined text-[14px]">
                          {tx.statusType === 'success' ? 'check_circle' : 'schedule'}
                        </span>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mr-table-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-symbols-outlined text-[18px]">account_balance</span>
            <span>
              Tài khoản nhận tiền chính: <strong>MB Bank - 0988 234 9902</strong> (Chủ tài khoản NGUYEN VAN AN)
            </span>
          </div>
          <div>Hiển thị {sortedTransactions.length} giao dịch</div>
        </div>
      </div>
    </div>
  );
}
