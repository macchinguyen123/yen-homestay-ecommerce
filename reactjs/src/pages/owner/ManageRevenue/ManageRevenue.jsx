import { useState, useMemo, useRef } from 'react';
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
  const [filterMode, setFilterMode] = useState('month_year'); // 'month_year' | 'quarter_year' | 'calendar'
  const [selectedMonth, setSelectedMonth] = useState(9);
  const [selectedQuarter, setSelectedQuarter] = useState(3);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [customDate, setCustomDate] = useState('');

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
    let seed = 1;

    if (filterMode === 'month_year') {
      const mStr = String(selectedMonth).padStart(2, '0');
      title = `Tháng ${mStr}/${selectedYear}`;
      seed = selectedMonth * 7 + (selectedYear % 100);
    } else if (filterMode === 'quarter_year') {
      title = `Quý ${selectedQuarter}/${selectedYear}`;
      seed = selectedQuarter * 13 + (selectedYear % 100);
    } else {
      if (customDate) {
        const [y, m, d] = customDate.split('-');
        title = `Ngày ${d}/${m}/${y}`;
        seed = Number(d) * 5 + Number(m) * 3;
      } else {
        title = `Thời gian tùy chỉnh (Lịch)`;
        seed = 42;
      }
    }

    const baseTotal = (100 + (seed % 45)) * 1000000;
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
  }, [filterMode, selectedMonth, selectedQuarter, selectedYear, customDate]);

  // ── Transactions Filtering & Sorting ─────────────────────────────────
  const sortedTransactions = useMemo(() => {
    let list = transactions.filter((tx) => {
      const q = searchTx.toLowerCase();
      return (
        tx.id.toLowerCase().includes(q) ||
        tx.customer.toLowerCase().includes(q) ||
        tx.detail.toLowerCase().includes(q)
      );
    });

    list.sort((a, b) => {
      if (sortOption === 'newest') return new Date(b.timestamp) - new Date(a.timestamp);
      if (sortOption === 'oldest') return new Date(a.timestamp) - new Date(b.timestamp);
      if (sortOption === 'highest') return b.amount - a.amount;
      if (sortOption === 'lowest') return a.amount - b.amount;
      return 0;
    });

    return list;
  }, [transactions, searchTx, sortOption]);

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
          <span className="mr-tag-homestay">Nhà Sàn Mộc • Mai Châu</span>
          <h1 className="mr-hero-title">Doanh thu &amp; Báo cáo thống kê</h1>
        </div>

        <div className="mr-hero-right">
          {/* Dynamic Filter Controls */}
          <div className="mr-filter-toolbar">
            {/* Month Filter */}
            <div className={`mr-filter-group ${filterMode !== 'month_year' ? 'disabled' : ''}`}>
              <button
                type="button"
                className={`mr-filter-btn ${filterMode === 'month_year' ? 'active' : ''}`}
                onClick={() => setFilterMode('month_year')}
              >
                Tháng
              </button>
              <select
                className="mr-filter-select"
                disabled={filterMode !== 'month_year'}
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(Number(e.target.value));
                  setFilterMode('month_year');
                }}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    Tháng {String(m).padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>

            {/* Quarter Filter */}
            <div className={`mr-filter-group ${filterMode !== 'quarter_year' ? 'disabled' : ''}`}>
              <button
                type="button"
                className={`mr-filter-btn ${filterMode === 'quarter_year' ? 'active' : ''}`}
                onClick={() => setFilterMode('quarter_year')}
              >
                Quý
              </button>
              <select
                className="mr-filter-select"
                disabled={filterMode !== 'quarter_year'}
                value={selectedQuarter}
                onChange={(e) => {
                  setSelectedQuarter(Number(e.target.value));
                  setFilterMode('quarter_year');
                }}
              >
                <option value={1}>Quý 1</option>
                <option value={2}>Quý 2</option>
                <option value={3}>Quý 3</option>
                <option value={4}>Quý 4</option>
              </select>
            </div>

            {/* Year Filter */}
            <div className={`mr-filter-group ${filterMode === 'calendar' ? 'disabled' : ''}`}>
              <button
                type="button"
                className={`mr-filter-btn ${filterMode !== 'calendar' ? 'active' : ''}`}
                onClick={() => {
                  if (filterMode === 'calendar') setFilterMode('month_year');
                }}
              >
                Năm
              </button>
              <select
                className="mr-filter-select"
                disabled={filterMode === 'calendar'}
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {[2026, 2025, 2024, 2023].map((y) => (
                  <option key={y} value={y}>
                    Năm {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Calendar Custom Date Picker */}
            <label
              className={`mr-filter-btn-calendar ${filterMode === 'calendar' ? 'active' : ''}`}
              title="Chọn khoảng thời gian theo lịch"
            >
              <span className="material-symbols-outlined text-[18px]">calendar_month</span>
              <input
                type="date"
                style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
                value={customDate}
                onChange={(e) => {
                  setCustomDate(e.target.value);
                  setFilterMode('calendar');
                }}
              />
            </label>
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
