import './OwnerDashboard.css';

export default function OwnerDashboard() {
  const stats = [
    { title: 'Tổng Homestay đang mở', value: '3 căn', icon: 'bi-house-check', color: '#15803D' },
    { title: 'Đơn đặt phòng tháng này', value: '24 đơn', icon: 'bi-calendar2-check', color: '#0369A1' },
    { title: 'Doanh thu tháng 10', value: '48.500.000đ', icon: 'bi-cash-stack', color: '#B45309' },
    { title: 'Đánh giá trung bình', value: '4.91 / 5.0', icon: 'bi-star-fill', color: '#F59E0B' },
  ];

  const recentBookings = [
    { id: 'HD-8841', guest: 'Nguyễn Văn Nam', room: 'Villa Toàn Căn Đồi Thông', checkin: '05/10/2026', checkout: '07/10/2026', price: '6.400.000đ', status: 'Đã xác nhận' },
    { id: 'HD-8842', guest: 'Trần Thị Thu', room: 'Phòng Đôi View Rừng Thông', checkin: '10/10/2026', checkout: '12/10/2026', price: '1.780.000đ', status: 'Chờ cọc' },
    { id: 'HD-8843', guest: 'Lê Hoàng Khánh', room: 'Phòng Gác Mái Gia Đình', checkin: '15/10/2026', checkout: '17/10/2026', price: '2.700.000đ', status: 'Đã xác nhận' },
  ];

  return (
    <div className="dashboard-page owner-dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Bảng quản lý Chủ Homestay (Host Dashboard)</h1>
          <p>Chào mừng Chị Lan Anh quay trở lại! Dưới đây là tình hình hoạt động homestay của bạn.</p>
        </div>
        <button type="button" className="yn-btn yn-btn--primary">
          <i className="bi bi-plus-lg" /> Đăng ký Homestay mới
        </button>
      </div>

      <div className="stats-grid">
        {stats.map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon" style={{ background: `${s.color}15`, color: s.color }}>
              <i className={`bi ${s.icon}`} />
            </div>
            <div className="stat-info">
              <span className="stat-title">{s.title}</span>
              <span className="stat-value">{s.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-section">
        <h3><i className="bi bi-clock-history" /> Đơn đặt phòng mới nhất</h3>
        <div className="table-responsive">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Phòng đặt</th>
                <th>Nhận phòng</th>
                <th>Trả phòng</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map((b) => (
                <tr key={b.id}>
                  <td><b>{b.id}</b></td>
                  <td>{b.guest}</td>
                  <td>{b.room}</td>
                  <td>{b.checkin}</td>
                  <td>{b.checkout}</td>
                  <td><b>{b.price}</b></td>
                  <td>
                    <span className={`status-badge ${b.status === 'Đã xác nhận' ? 'confirmed' : 'pending'}`}>
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
