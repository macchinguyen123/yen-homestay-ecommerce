import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import './Notifications.css';

const INITIAL_NOTIFICATIONS = [
  {
    id: 'noti-101',
    category: 'trip',
    title: 'Nhắc lịch check-in: Sapa Cloud Forest Lodge ngày mai',
    desc: 'Chuyến đi Sapa của bạn sắp bắt đầu! Thời gian nhận phòng là 14:00 ngày mai (21/09/2026). Phòng Bungalow view thung lũng Mường Hoa & bồn tắm lá thuốc Dao Đỏ đã sẵn sàng đón bạn.',
    timestamp: '5 phút trước',
    unread: true,
    iconClass: 'trip',
    icon: 'bi-calendar-event-fill',
    meta: [
      { icon: 'bi-geo-alt-fill', text: 'Bản Tả Van, Sapa' },
      { icon: 'bi-hash', text: 'Mã booking #BK-8102' },
      { icon: 'bi-clock-fill', text: 'Nhận phòng: 14:00 (21/09)' }
    ],
    details: [
      { label: 'Homestay:', val: 'Sapa Cloud Forest Lodge' },
      { label: 'Địa chỉ:', val: 'Bản Tả Van, Huyện Sa Pa, Lào Cai' },
      { label: 'Mã đặt phòng:', val: '#BK-8102', copyable: true },
      { label: 'Thời gian ở:', val: '21/09/2026 - 23/09/2026 (2 đêm)' },
      { label: 'Trạng thái cọc:', val: 'Đã thanh toán cọc 100%' }
    ],
    mainActionText: 'Xem lịch trình chuyến đi',
    mainActionUrl: '/bookings'
  },
  {
    id: 'noti-102',
    category: 'booking',
    title: 'Xác nhận đặt phòng & giữ cọc thành công #BK-9042',
    desc: 'Đơn đặt phòng tại Pù Luông Eco Lodge cho 2 đêm (24/09 - 26/09/2026) đã được xác nhận thành công. Số tiền cọc 850.000đ được sàn YÊN giữ an toàn theo chính sách Bảo Vệ Khách Hàng.',
    timestamp: '30 phút trước',
    unread: true,
    iconClass: 'booking',
    icon: 'bi-check-circle-fill',
    meta: [
      { icon: 'bi-house-heart-fill', text: 'Pù Luông Eco Lodge' },
      { icon: 'bi-shield-check', text: 'Cọc YÊN bảo đảm 50%' },
      { icon: 'bi-credit-card-2-front', text: 'VNPay QR (850.000đ)' }
    ],
    details: [
      { label: 'Tên Homestay:', val: 'Pù Luông Eco Lodge' },
      { label: 'Khu vực:', val: 'Bản Đôn, Thanh Hóa' },
      { label: 'Mã Booking:', val: '#BK-9042', copyable: true },
      { label: 'Tiền cọc đã giữ:', val: '850.000đ (50% giá phòng)' },
      { label: 'Tiền thanh toán tại nơi:', val: '850.000đ (Trả khi check-in)' }
    ],
    mainActionText: 'Xem phiếu đặt phòng',
    mainActionUrl: '/bookings'
  },
  {
    id: 'noti-103',
    category: 'promo',
    title: 'Tặng riêng bạn voucher YENAUTUMN2026 giảm 15%',
    desc: 'Sắc thu Đà Lạt rực rỡ đang chờ đón bạn! Tặng riêng bạn mã giảm giá 15% (tối đa 200.000đ) khi đặt phòng tại các biệt thự & bungalow đồi thông Đà Lạt.',
    timestamp: '2 giờ trước',
    unread: true,
    iconClass: 'promo',
    icon: 'bi-gift-fill',
    meta: [
      { icon: 'bi-tag-fill', text: 'Mã: YENAUTUMN2026' },
      { icon: 'bi-clock-history', text: 'Hạn dùng: 31/10/2026' },
      { icon: 'bi-ticket-perforated', text: 'Áp dụng đơn từ 800k' }
    ],
    details: [
      { label: 'Mã ưu đãi:', val: 'YENAUTUMN2026', copyable: true },
      { label: 'Mức giảm:', val: 'Giảm 15% (Tối đa 200.000đ)' },
      { label: 'Điều kiện áp dụng:', val: 'Đơn từ 800.000đ tại Homestay Đà Lạt' },
      { label: 'Hạn sử dụng:', val: '31/10/2026 (Còn 40 ngày)' }
    ],
    mainActionText: 'Áp dụng mã & Đặt Đà Lạt',
    mainActionUrl: '/bookings'
  },
  {
    id: 'noti-104',
    category: 'payment',
    title: 'Hoàn tiền thành công 1.500.000đ về Ví MoMo',
    desc: 'Giao dịch hoàn tiền #GD-88198 đã hoàn tất thành công. Số tiền 1.500.000đ đã được chuyển trực tiếp về ví MoMo của bạn do đơn hủy phòng Mộc Châu đáp ứng đúng điều kiện hủy trước 48h.',
    timestamp: 'Hôm qua',
    unread: false,
    iconClass: 'payment',
    icon: 'bi-wallet2',
    meta: [
      { icon: 'bi-receipt', text: 'Mã GD: #GD-88198' },
      { icon: 'bi-currency-exchange', text: 'Số tiền: 1.500.000đ' },
      { icon: 'bi-patch-check', text: 'MoMo Trace ID: MOMO-77281049' }
    ],
    details: [
      { label: 'Loại giao dịch:', val: 'Hoàn tiền cọc hủy phòng' },
      { label: 'Mã Giao Dịch:', val: '#GD-88198', copyable: true },
      { label: 'Số tiền hoàn lại:', val: '1.500.000đ' },
      { label: 'Kênh nhận tiền:', val: 'Ví Điện Tử MoMo' },
      { label: 'Trace Reference ID:', val: 'MOMO-77281049' }
    ],
    mainActionText: 'Xem chi tiết đơn hàng',
    mainActionUrl: '/bookings'
  },
  {
    id: 'noti-105',
    category: 'promo',
    title: 'Tặng 50.000 YÊN Point khi viết đánh giá chuyến đi',
    desc: 'Bạn vừa hoàn thành chuyến đi 3N2Đ tại Nhà Sàn Mộc Mai Châu! Hãy chia sẻ cảm nhận & 1 bức ảnh trải nghiệm thực tế để nhận ngay 50.000 YÊN Point tích lũy.',
    timestamp: '3 ngày trước',
    unread: false,
    iconClass: 'review',
    icon: 'bi-star-fill',
    meta: [
      { icon: 'bi-house-check', text: 'Nhà Sàn Mộc Mai Châu' },
      { icon: 'bi-coin', text: '+50.000 YÊN Point' }
    ],
    details: [
      { label: 'Chuyến đi vừa qua:', val: 'Nhà Sàn Mộc Mai Châu (3N2Đ)' },
      { label: 'Quà tặng đánh giá:', val: '+50.000 YÊN Point (Đổi 50k khi đặt đơn sau)' },
      { label: 'Yêu cầu:', val: 'Viết từ 20 từ & Kèm 1 ảnh thực tế' }
    ],
    mainActionText: 'Viết đánh giá ngay',
    mainActionUrl: '/bookings'
  }
];

export default function Notifications() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [activeCategory, setActiveCategory] = useState('all');

  // Modal Detail State
  const [modalItem, setModalItem] = useState(null);

  // Toast State
  const [toast, setToast] = useState({ show: false, msg: '' });

  const triggerToast = (msg) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: '' }), 2800);
  };

  // Filtered Notifications
  const filteredList = useMemo(() => {
    return notifications.filter((item) => {
      if (activeCategory === 'all') return true;
      if (activeCategory === 'trip') return item.category === 'trip' || item.category === 'booking';
      return item.category === activeCategory;
    });
  }, [notifications, activeCategory]);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => n.unread).length;
  }, [notifications]);

  const counts = useMemo(() => {
    return {
      all: notifications.length,
      trip: notifications.filter((n) => n.category === 'trip' || n.category === 'booking').length,
      promo: notifications.filter((n) => n.category === 'promo').length,
      payment: notifications.filter((n) => n.category === 'payment').length,
    };
  }, [notifications]);

  const handleMarkAllRead = () => {
    if (unreadCount === 0) {
      triggerToast('Tất cả thông báo đã được đọc!');
      return;
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    triggerToast('Đã đánh dấu tất cả thông báo là đã đọc!');
  };

  const handleDeleteNoti = (id, e) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    triggerToast('Đã xóa thông báo.');
  };

  const handleOpenDetail = (item) => {
    if (item.unread) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, unread: false } : n))
      );
    }
    setModalItem(item);
  };

  const copyToClipboard = (text, e) => {
    e?.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
      triggerToast(`Đã sao chép: "${text}" vào bộ nhớ tạm!`);
    } else {
      triggerToast(`Mã: ${text}`);
    }
  };

  return (
    <main className="notifications-page">
      <div className="notifications-main-layout">

        {/* HEADER CARD */}
        <div className="noti-header-card">
          <div className="noti-header-title-group">
            <h1>
              <span className="bell-icon-badge">
                <i className="bi bi-bell-fill" />
              </span>
              Trung Tâm Thông Báo
              {unreadCount > 0 && (
                <span className="unread-pill-badge">{unreadCount} thông báo mới</span>
              )}
            </h1>
            <p className="noti-header-subtitle">Theo dõi lịch check-in, cọc phòng, ưu đãi khuyến mãi & thông tin hoàn tiền</p>
          </div>

          <div className="noti-header-toolbar">
            <button type="button" className="btn-noti-tool btn-primary-mark" onClick={handleMarkAllRead}>
              <i className="bi bi-check2-all" /> Đánh dấu đã đọc tất cả
            </button>
          </div>
        </div>

        {/* TABS BAR */}
        <div className="noti-tabs-bar">
          <button
            type="button"
            className={`noti-tab-btn ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            <i className="bi bi-layers-fill" /> Tất cả thông báo
            <span className="tab-count-tag">{counts.all}</span>
          </button>
          <button
            type="button"
            className={`noti-tab-btn ${activeCategory === 'trip' ? 'active' : ''}`}
            onClick={() => setActiveCategory('trip')}
          >
            <i className="bi bi-calendar-check-fill" /> Đặt phòng & Lịch trình
            <span className="tab-count-tag">{counts.trip}</span>
          </button>
          <button
            type="button"
            className={`noti-tab-btn ${activeCategory === 'promo' ? 'active' : ''}`}
            onClick={() => setActiveCategory('promo')}
          >
            <i className="bi bi-gift-fill" /> Khuyến mãi & Voucher
            <span className="tab-count-tag">{counts.promo}</span>
          </button>
          <button
            type="button"
            className={`noti-tab-btn ${activeCategory === 'payment' ? 'active' : ''}`}
            onClick={() => setActiveCategory('payment')}
          >
            <i className="bi bi-wallet2" /> Thanh toán & Hoàn tiền
            <span className="tab-count-tag">{counts.payment}</span>
          </button>
        </div>

        {/* NOTIFICATIONS CONTAINER */}
        <div className="noti-card-container">
          {filteredList.length === 0 ? (
            <div className="empty-noti-box">
              <div className="empty-noti-icon"><i className="bi bi-bell-slash" /></div>
              <h3>Không có thông báo nào</h3>
              <p>Bạn đã xem hết thông báo trong chuyên mục này.</p>
            </div>
          ) : (
            filteredList.map((item) => (
              <div
                key={item.id}
                className={`noti-card-item ${item.unread ? 'unread' : ''}`}
                onClick={() => handleOpenDetail(item)}
              >
                <div className={`noti-type-icon ${item.iconClass}`}>
                  <i className={`bi ${item.icon}`} />
                </div>

                <div className="noti-item-content">
                  <div className="noti-item-header">
                    <div className="noti-item-title-wrap">
                      {item.unread && <span className="unread-dot" title="Chưa đọc" />}
                      <span className="noti-item-title">{item.title}</span>
                    </div>
                    <span className="noti-item-timestamp">{item.timestamp}</span>
                  </div>

                  <div className="noti-item-desc">{item.desc}</div>

                  {item.meta && item.meta.length > 0 && (
                    <div className="noti-meta-box">
                      {item.meta.map((m, idx) => (
                        <span key={idx}><i className={`bi ${m.icon}`} /> {m.text}</span>
                      ))}
                    </div>
                  )}

                  <div className="noti-item-footer">
                    <div className="noti-action-btns">
                      {item.mainActionText && (
                        <Link
                          to={item.mainActionUrl || '/bookings'}
                          className="btn-noti-link-main"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {item.mainActionText} <i className="bi bi-arrow-right" />
                        </Link>
                      )}
                    </div>

                    <button
                      type="button"
                      className="btn-item-dismiss"
                      onClick={(e) => handleDeleteNoti(item.id, e)}
                    >
                      <i className="bi bi-x-lg" /> Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

      {/* DETAIL MODAL */}
      {modalItem && (
        <div className="noti-modal-overlay show" onClick={() => setModalItem(null)}>
          <div className="noti-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="noti-modal-header">
              <div className="noti-modal-header-left">
                <div className={`modal-type-icon ${modalItem.iconClass}`}>
                  <i className={`bi ${modalItem.icon}`} />
                </div>
                <div>
                  <h3>Chi Tiết Thông Báo</h3>
                  <span className="noti-modal-time">{modalItem.timestamp}</span>
                </div>
              </div>
              <button
                type="button"
                className="noti-modal-close-btn"
                onClick={() => setModalItem(null)}
              >
                ×
              </button>
            </div>

            <div className="noti-modal-body">
              <div className="noti-modal-desc">
                {modalItem.desc}
              </div>

              <div className="noti-modal-details-grid">
                {modalItem.details.map((d, idx) => (
                  <div key={idx} className="detail-info-row">
                    <span className="lbl"><i className="bi bi-chevron-right" style={{ fontSize: 11, color: '#15803D' }} /> {d.label}</span>
                    {d.copyable ? (
                      <span className="copy-badge-code" onClick={(e) => copyToClipboard(d.val, e)}>
                        {d.val} <i className="bi bi-copy" style={{ fontSize: 12 }} />
                      </span>
                    ) : (
                      <span className="val">{d.val}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="noti-modal-footer">
              <button type="button" className="btn-noti-tool" onClick={() => setModalItem(null)}>
                Đóng
              </button>
              <Link
                to={modalItem.mainActionUrl || '/bookings'}
                className="btn-noti-link-main"
                onClick={() => setModalItem(null)}
              >
                {modalItem.mainActionText || 'Trở về'} <i className="bi bi-arrow-right" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notice */}
      <div className={`toast-notice ${toast.show ? 'show' : ''}`}>
        <i className="bi bi-info-circle-fill" />
        <span>{toast.msg}</span>
      </div>
    </main>
  );
}
