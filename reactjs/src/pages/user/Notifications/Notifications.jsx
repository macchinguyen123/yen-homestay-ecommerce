import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Notifications.css';

const DEFAULT_NOTIFICATIONS = [
  {
    id: 'noti-101',
    category: 'trip',
    title: 'Xác nhận đặt phòng & bảo đảm cọc an toàn #YEN-2026-9042',
    desc: 'Đơn đặt phòng tại Rừng Sương Glamping & Cabin đã được hệ thống YÊN xác nhận. Tiền cọc được giữ an toàn theo chính sách Bảo Vệ Du Khách.',
    timestamp: '5 phút trước',
    unread: true,
    iconClass: 'booking',
    icon: 'bi-check-circle-fill',
    meta: [
      { icon: 'bi-house-heart-fill', text: 'Rừng Sương Glamping & Cabin' },
      { icon: 'bi-shield-check', text: 'Cọc YÊN bảo đảm 100%' },
      { icon: 'bi-credit-card-2-front', text: 'VNPAY Sandbox' }
    ],
    details: [
      { label: 'Tên Homestay:', val: 'Rừng Sương Glamping & Cabin' },
      { label: 'Khu vực:', val: 'Hồ Tuyền Lâm, Đà Lạt' },
      { label: 'Mã Booking:', val: '#YEN-2026-9042', copyable: true },
      { label: 'Trạng thái cọc:', val: 'Đã thanh toán an toàn qua VNPAY' },
      { label: 'Thanh toán tại nơi:', val: 'Trả phần còn lại khi nhận phòng' }
    ],
    mainActionText: 'Xem phiếu đặt phòng',
    mainActionUrl: '/bookings'
  },
  {
    id: 'noti-102',
    category: 'promo',
    title: 'Tặng riêng bạn voucher YENAUTUMN2026 giảm 15%',
    desc: 'Sắc thu Đà Lạt & Sa Pa rực rỡ đang chờ đón bạn! Tặng riêng bạn mã giảm giá 15% (tối đa 200.000đ) khi đặt phòng tại các bungalow và homestay trên hệ thống.',
    timestamp: '2 giờ trước',
    unread: true,
    iconClass: 'promo',
    icon: 'bi-gift-fill',
    meta: [
      { icon: 'bi-tag-fill', text: 'Mã: YENAUTUMN2026' },
      { icon: 'bi-clock-history', text: 'Hạn dùng: 31/12/2026' },
      { icon: 'bi-ticket-perforated', text: 'Áp dụng đơn từ 800k' }
    ],
    details: [
      { label: 'Mã ưu đãi:', val: 'YENAUTUMN2026', copyable: true },
      { label: 'Mức giảm:', val: 'Giảm 15% (Tối đa 200.000đ)' },
      { label: 'Điều kiện áp dụng:', val: 'Áp dụng cho mọi homestay trên YÊN' },
      { label: 'Hạn sử dụng:', val: '31/12/2026' }
    ],
    mainActionText: 'Áp dụng mã & Đặt phòng ngay',
    mainActionUrl: '/search'
  },
  {
    id: 'noti-103',
    category: 'payment',
    title: 'Tự động tích lũy 5% vào Ví Hoàn Tiền YÊN',
    desc: 'Mỗi khi đặt phòng thành công, 5% giá trị đơn phòng sẽ được tự động hoàn vào Ví YÊN của bạn để rút về ngân hàng liên kết hoặc trừ tiền lần đặt sau.',
    timestamp: 'Hôm qua',
    unread: false,
    iconClass: 'payment',
    icon: 'bi-wallet2',
    meta: [
      { icon: 'bi-cash-coin', text: 'Tỷ lệ hoàn: 5%' },
      { icon: 'bi-currency-exchange', text: 'Rút về mọi ngân hàng 24/7' },
      { icon: 'bi-patch-check', text: 'Tích lũy tự động' }
    ],
    details: [
      { label: 'Chương trình:', val: 'YÊN Cashback & Loyalty Rewards' },
      { label: 'Kênh tích lũy:', val: 'Ví hoàn tiền cá nhân' },
      { label: 'Hạn mức rút tối thiểu:', val: '50.000 VNĐ' }
    ],
    mainActionText: 'Kiểm tra Ví hoàn tiền',
    mainActionUrl: '/personal-account'
  },
  {
    id: 'noti-104',
    category: 'trip',
    title: 'Nhắc lịch check-in: Trải nghiệm ẩm thực & văn hóa bản địa',
    desc: 'Đừng quên chuẩn bị hành lý và xem qua các hướng dẫn check-in xanh để nhận voucher thưởng từ chủ nhà homestay nhé!',
    timestamp: '2 ngày trước',
    unread: false,
    iconClass: 'trip',
    icon: 'bi-calendar-event-fill',
    meta: [
      { icon: 'bi-geo-alt-fill', text: 'Đà Lạt, Lâm Đồng' },
      { icon: 'bi-clock-fill', text: 'Giờ check-in: 14:00' }
    ],
    details: [
      { label: 'Thời gian nhận phòng:', val: 'Từ 14:00 ngày nhận phòng' },
      { label: 'Hỗ trợ du khách:', val: 'Hotline YÊN 1900 6868 hoạt động 24/7' }
    ],
    mainActionText: 'Xem hướng dẫn chuyến đi',
    mainActionUrl: '/bookings'
  }
];

export default function Notifications() {
  const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS);
  const [activeCategory, setActiveCategory] = useState('all');

  // Modal Detail State
  const [modalItem, setModalItem] = useState(null);

  // Toast State
  const [toast, setToast] = useState({ show: false, msg: '' });

  const currentUser = JSON.parse(localStorage.getItem('user') || 'null');
  const apiBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/auth\/?$/, '') || 'http://localhost:8081/api';
  const headers = {
    Authorization: `Bearer ${currentUser?.token || ''}`,
    'X-User-Id': String(currentUser?.id || '1'),
    'Content-Type': 'application/json'
  };

  const mapNotification = (n) => {
    const rawType = (n.type || 'SYSTEM').toUpperCase();
    const isTrip = ['BOOKING', 'TRIP'].includes(rawType);
    const isPromo = ['PROMO', 'VOUCHER'].includes(rawType);
    const isPayment = ['PAYMENT', 'CASHBACK', 'WALLET'].includes(rawType);

    const category = isTrip ? 'trip' : (isPromo ? 'promo' : (isPayment ? 'payment' : 'system'));
    const iconClass = isTrip ? 'booking' : (isPromo ? 'promo' : (isPayment ? 'payment' : 'trip'));
    const icon = isTrip ? 'bi-check-circle-fill' : (isPromo ? 'bi-gift-fill' : (isPayment ? 'bi-wallet2' : 'bi-bell-fill'));

    return {
      ...n,
      id: n.id,
      category,
      desc: n.message || n.desc,
      unread: !n.read,
      timestamp: n.createdAt ? new Date(n.createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : 'Gần đây',
      iconClass,
      icon,
      meta: n.meta && n.meta.length > 0 ? n.meta : [
        { icon: isTrip ? 'bi-house-heart-fill' : (isPromo ? 'bi-tag-fill' : 'bi-patch-check'), text: isTrip ? 'Đặt phòng an toàn' : (isPromo ? 'Ưu đãi YÊN' : 'Ví Hoàn Tiền') }
      ],
      details: n.details && n.details.length > 0 ? n.details : [
        { label: 'Tiêu đề:', val: n.title },
        { label: 'Nội dung:', val: n.message || n.desc },
        { label: 'Thời gian:', val: n.createdAt ? new Date(n.createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : 'Hôm nay' }
      ],
      mainActionText: isTrip ? 'Xem đơn đặt phòng' : (isPromo ? 'Sử dụng ngay' : (isPayment ? 'Xem Ví hoàn tiền' : 'Xem chi tiết')),
      mainActionUrl: n.link || (isTrip ? '/bookings' : (isPromo ? '/search' : (isPayment ? '/personal-account' : '/notifications')))
    };
  };

  useEffect(() => {
    const loadNotifications = () => {
      fetch(`${apiBase}/notifications`, { headers })
        .then((r) => r.ok ? r.json() : [])
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setNotifications(data.map(mapNotification));
          } else {
            setNotifications(DEFAULT_NOTIFICATIONS);
          }
        })
        .catch(() => {
          setNotifications(DEFAULT_NOTIFICATIONS);
        });
    };

    loadNotifications();

    if (currentUser?.id) {
      const socketBase = (import.meta.env.VITE_WS_BASE_URL || apiBase.replace(/^http/, 'ws').replace(/\/api$/, ''));
      try {
        const socket = new WebSocket(`${socketBase}/ws/notifications?token=${encodeURIComponent(currentUser.token || '')}`);
        socket.onmessage = () => loadNotifications();
        return () => socket.close();
      } catch (e) {}
    }
  }, [currentUser?.id]);

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
    fetch(`${apiBase}/notifications/read-all`, { method: 'PATCH', headers }).catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    triggerToast('Đã đánh dấu tất cả thông báo là đã đọc!');
  };

  const handleDeleteNoti = (id, e) => {
    e.stopPropagation();
    fetch(`${apiBase}/notifications/${id}`, { method: 'DELETE', headers }).catch(() => {});
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    triggerToast('Đã xóa thông báo.');
  };

  const handleOpenDetail = (item) => {
    if (item.unread) {
      fetch(`${apiBase}/notifications/${item.id}/read`, { method: 'PATCH', headers }).catch(() => {});
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
