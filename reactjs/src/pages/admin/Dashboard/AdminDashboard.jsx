import './AdminDashboard.css';

export default function AdminDashboard() {
  const systemStats = [
    { title: 'Tổng số Người dùng', value: '1.240 user', icon: 'bi-people', color: '#4338CA' },
    { title: 'Chủ Homestay (Host)', value: '85 chủ nhà', icon: 'bi-house-heart', color: '#0F766E' },
    { title: 'Homestay trên hệ thống', value: '142 homestay', icon: 'bi-building', color: '#15803D' },
    { title: 'Tổng giao dịch sàn', value: '382.000.000đ', icon: 'bi-wallet2', color: '#B45309' },
  ];

  const pendingApprovals = [
    { id: 'HS-109', name: 'Mây Lang Thang Homestay', owner: 'Phạm Thị Mai', location: 'Đà Lạt', date: '01/10/2026', status: 'Chờ duyệt' },
    { id: 'HS-110', name: 'Valley View Lodge', owner: 'Trần Văn Tùng', location: 'Sapa', date: '02/10/2026', status: 'Chờ duyệt' },
  ];

  return (
    <div className="dashboard-page admin-dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Bảng điều khiển Admin Hệ thống (System Admin)</h1>
          <p>Quản lý toàn bộ người dùng, đối tác homestay và giám sát hoạt động nền tảng YÊN.</p>
        </div>
        <button type="button" className="yn-btn yn-btn--primary">
          <i className="bi bi-shield-lock" /> Cấu hình hệ thống
        </button>
      </div>

      <div className="stats-grid">
        {systemStats.map((s, i) => (
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
        <h3><i className="bi bi-hourglass-split" /> Danh sách Homestay mới chờ duyệt</h3>
        <div className="table-responsive">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Mã HS</th>
                <th>Tên Homestay</th>
                <th>Chủ sở hữu</th>
                <th>Khu vực</th>
                <th>Ngày đăng ký</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {pendingApprovals.map((h) => (
                <tr key={h.id}>
                  <td><b>{h.id}</b></td>
                  <td><b>{h.name}</b></td>
                  <td>{h.owner}</td>
                  <td>{h.location}</td>
                  <td>{h.date}</td>
                  <td>
                    <div className="admin-actions">
                      <button type="button" className="action-btn approve"><i className="bi bi-check-lg" /> Duyệt</button>
                      <button type="button" className="action-btn reject"><i className="bi bi-x-lg" /> Từ chối</button>
                    </div>
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
