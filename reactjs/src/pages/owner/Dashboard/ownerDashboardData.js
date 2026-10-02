// Dữ liệu mẫu cho Dashboard Chủ Homestay (Host Portal)

export const INITIAL_DASHBOARD_STATS = [
  {
    id: 'total-bookings',
    label: 'Tổng booking',
    value: 48,
    growth: '↑ 12%',
    desc: 'so với tháng trước',
    icon: 'bi-calendar2-check',
    color: '#11885f',
    bg: '#ddf5e9',
  },
  {
    id: 'pending-bookings',
    label: 'Booking chờ xác nhận',
    value: 6,
    growth: '↑ 2%',
    desc: 'so với tháng trước',
    icon: 'bi-clock-history',
    color: '#25a8c7',
    bg: '#ddf4fa',
  },
  {
    id: 'today-checkin',
    label: 'Check-in hôm nay',
    value: 3,
    growth: '↑ 50%',
    desc: 'so với hôm qua',
    icon: 'bi-door-open',
    color: '#7355d9',
    bg: '#ece6ff',
  },
  {
    id: 'monthly-revenue',
    label: 'Doanh thu tháng này',
    value: '28.500.000đ',
    growth: '↑ 18%',
    desc: 'so với tháng trước',
    icon: 'bi-cash-stack',
    color: '#11885f',
    bg: '#ddf5e9',
  },
];

export const INITIAL_BOOKINGS = [
  {
    id: 1,
    customerName: 'Nguyễn Thị Mai',
    avatar: 'https://i.pravatar.cc/80?img=47',
    room: 'Garden View',
    checkIn: '2026-09-17',
    checkOut: '2026-09-20',
    status: 'Đã đặt',
    statusClass: 'status-blue',
    price: 2850000,
    roomImg: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=150&q=80',
  },
  {
    id: 2,
    customerName: 'Lê Văn Hiếu',
    avatar: 'https://i.pravatar.cc/80?img=12',
    room: 'Lake View',
    checkIn: '2026-09-16',
    checkOut: '2026-09-18',
    status: 'Đang ở',
    statusClass: 'status-green',
    price: 2200000,
    roomImg: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=150&q=80',
  },
  {
    id: 3,
    customerName: 'Phạm Thị Lan',
    avatar: 'https://i.pravatar.cc/80?img=33',
    room: 'Mountain View',
    checkIn: '2026-09-14',
    checkOut: '2026-09-16',
    status: 'Đã trả',
    statusClass: 'status-orange',
    price: 3100000,
    roomImg: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=150&q=80',
  },
  {
    id: 4,
    customerName: 'Trần Quốc Bảo',
    avatar: 'https://i.pravatar.cc/80?img=15',
    room: 'Garden View',
    checkIn: '2026-09-13',
    checkOut: '2026-09-15',
    status: 'Đã trả',
    statusClass: 'status-orange',
    price: 2650000,
    roomImg: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=150&q=80',
  },
  {
    id: 5,
    customerName: 'Hoàng Minh Anh',
    avatar: 'https://i.pravatar.cc/80?img=5',
    room: 'Lake View',
    checkIn: '2026-09-12',
    checkOut: '2026-09-14',
    status: 'Đã trả',
    statusClass: 'status-orange',
    price: 2400000,
    roomImg: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=150&q=80',
  },
  {
    id: 6,
    customerName: 'Vũ Thị Yến',
    avatar: 'https://i.pravatar.cc/80?img=9',
    room: 'Mountain View',
    checkIn: '2026-09-25',
    checkOut: '2026-09-27',
    status: 'Đã đặt',
    statusClass: 'status-blue',
    price: 3500000,
    roomImg: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=150&q=80',
  },
  {
    id: 7,
    customerName: 'Đặng Ngọc Quyên',
    avatar: 'https://i.pravatar.cc/80?img=20',
    room: 'Bungalow Rừng Thông',
    checkIn: '2026-09-28',
    checkOut: '2026-09-30',
    status: 'Đã đặt',
    statusClass: 'status-blue',
    price: 4200000,
    roomImg: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=150&q=80',
  },
];

export const REVENUE_PERIODS = {
  '7days': {
    labels: ['11/09', '12/09', '13/09', '14/09', '15/09', '16/09', '17/09'],
    values: [3500000, 7000000, 5800000, 8200000, 11200000, 10500000, 15000000],
  },
  '30days': {
    labels: ['01/09', '05/09', '10/09', '15/09', '20/09', '25/09', '30/09'],
    values: [4500000, 8200000, 6900000, 12500000, 15800000, 19200000, 28500000],
  },
  'month': {
    labels: ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'],
    values: [5500000, 7200000, 8400000, 7400000],
  },
};

export const NOTIFICATIONS_DATA = [
  {
    id: 1,
    title: 'Đơn đặt phòng mới',
    message: 'Khách hàng Nguyễn Thị Mai vừa đặt phòng Garden View.',
    time: '5 phút trước',
    type: 'green',
    icon: 'bi-bell-fill',
  },
  {
    id: 2,
    title: 'Nhắc nhở nhận phòng',
    message: 'Lê Văn Hiếu sẽ check-in lúc 14:00 hôm nay.',
    time: '1 giờ trước',
    type: 'yellow',
    icon: 'bi-alarm-fill',
  },
  {
    id: 3,
    title: 'Đánh giá 5 sao mới',
    message: 'Khách hàng Hoàng Minh Anh đã để lại đánh giá 5 sao.',
    time: '3 giờ trước',
    type: 'orange',
    icon: 'bi-star-fill',
  },
  {
    id: 4,
    title: 'Gói đẩy top kích hoạt',
    message: 'Gói Top 1 Chuyên Nghiệp đang chạy hiệu quả (+35% click).',
    time: 'Hôm qua',
    type: 'blue',
    icon: 'bi-rocket-takeoff-fill',
  },
];

export const OCCUPANCY_DATA = {
  percentage: 72,
  booked: 51,
  available: 20,
  total: 72,
};

export const formatCurrency = (val) => {
  return parseInt(val || 0, 10).toLocaleString('vi-VN') + 'đ';
};

export const formatDateRange = (checkIn, checkOut) => {
  const inDate = new Date(checkIn);
  const outDate = new Date(checkOut);
  const inStr = `${String(inDate.getDate()).padStart(2, '0')}/${String(inDate.getMonth() + 1).padStart(2, '0')}`;
  const outStr = `${String(outDate.getDate()).padStart(2, '0')}/${String(outDate.getMonth() + 1).padStart(2, '0')}`;
  return `${inStr} - ${outStr}`;
};
