/* ==========================================================================
   MANAGE REVENUE DATA & CONFIGURATION
   ========================================================================== */

export const INITIAL_REVENUE_METRICS = {
  totalRevenue: 128500000,
  roomRevenue: 82300000,
  serviceRevenue: 46200000,
  depositSettled: 32400000,
};

export const INITIAL_ROOM_REVENUES = [
  {
    id: 1,
    name: "Phòng Mountain View 201",
    rank: "Top 1",
    bookings: 28,
    occupancy: "92% lấp đầy",
    revenue: 38400000,
    percentage: "46.6%",
    image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: 2,
    name: "Bungalow Ven Suối",
    rank: "Top 2",
    bookings: 14,
    occupancy: "85% lấp đầy",
    revenue: 32000000,
    percentage: "38.8%",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=300&q=80"
  },
  {
    id: 3,
    name: "Nhà Sàn Tập Thể (Dorm)",
    rank: null,
    bookings: "4 đoàn",
    occupancy: "Phượt & gia đình lớn",
    revenue: 28000000,
    percentage: "34.0%",
    icon: "groups"
  },
  {
    id: 4,
    name: "Garden View 102",
    rank: null,
    bookings: 12,
    occupancy: "View suối róc rách",
    revenue: 22000000,
    percentage: "26.7%",
    icon: "apartment"
  }
];

export const INITIAL_SERVICE_REVENUES = [
  {
    id: 1,
    name: "Mâm cỗ đặc sản Tây Bắc",
    icon: "🍱",
    revenue: 19400000,
    percentage: 42,
    detail: "Gà đồi nướng mắc khén, xôi ngũ sắc, cá suối",
    countDisplay: "45 mâm phục vụ",
    color: "#f59e0b"
  },
  {
    id: 2,
    name: "Thuê xe máy cào cào vượt đèo",
    icon: "🛵",
    revenue: 11500000,
    percentage: 25,
    detail: "Bản Thung Khe, bản Hang Kia - Pà Cò",
    countDisplay: "67 lượt thuê xe",
    color: "#3b82f6"
  },
  {
    id: 3,
    name: "Đốt lửa trại & Rượu cần Thái",
    icon: "🔥",
    revenue: 8300000,
    percentage: 18,
    detail: "Giao lưu văn nghệ múa xòe người Thái",
    countDisplay: "15 đêm sự kiện",
    color: "#ef4444"
  },
  {
    id: 4,
    name: "Trekking bản Lác Cổ & Tắm suối",
    icon: "🚶",
    revenue: 4600000,
    percentage: 10,
    detail: "Hướng dẫn viên người Thái bản địa",
    countDisplay: "16 lượt tour",
    color: "#15803d"
  }
];

export const INITIAL_TRANSACTIONS = [
  {
    id: "#TX-8403",
    timestamp: "2026-09-28T09:35:00",
    timeDisplay: "28/09/2026 • 09:35",
    customer: "Hoàng Thu Thảo",
    detail: "Bungalow Ven Suối (2 đêm)",
    type: "Cọc booking 50%",
    channelIcon: "qr_code_scanner",
    channelIconColor: "#15803d",
    channelName: "Chuyển khoản VietQR",
    amount: 2850000,
    status: "Đã vào MB Bank",
    statusType: "success"
  },
  {
    id: "#TX-8404",
    timestamp: "2026-09-27T20:15:00",
    timeDisplay: "27/09/2026 • 20:15",
    customer: "Đoàn Phượt Trần Vũ",
    detail: "Nhà Sàn + Mâm Lợn Bản",
    type: "Thanh toán tại quầy",
    channelIcon: "payments",
    channelIconColor: "#b45309",
    channelName: "Tiền mặt lễ tân",
    amount: 7420000,
    status: "Thu ngân nộp két",
    statusType: "success"
  },
  {
    id: "#TX-8405",
    timestamp: "2026-09-27T14:00:00",
    timeDisplay: "27/09/2026 • 14:00",
    customer: "Booking.com Batch #44",
    detail: "Đối soát định kỳ sàn OTA",
    type: "Tiền hoàn sàn OTA",
    channelIcon: "account_balance",
    channelIconColor: "#2563eb",
    channelName: "Ví Sàn Booking.com",
    amount: 18350000,
    status: "Đã quyết toán MB Bank",
    statusType: "success"
  },
  {
    id: "#TX-8402",
    timestamp: "2026-09-26T15:40:00",
    timeDisplay: "26/09/2026 • 15:40",
    customer: "Gia đình anh David Miller",
    detail: "Mountain View 201 + Tour suối",
    type: "Cọc booking 50%",
    channelIcon: "credit_card",
    channelIconColor: "#64748b",
    channelName: "Agoda Virtual Card",
    amount: 3600000,
    status: "Chờ sao kê thẻ (Check-in)",
    statusType: "pending"
  },
  {
    id: "#TX-8406",
    timestamp: "2026-09-26T11:20:00",
    timeDisplay: "26/09/2026 • 11:20",
    customer: "Lê Quỳnh Mai",
    detail: "Garden View 102",
    type: "Thanh toán tại quầy",
    channelIcon: "qr_code_scanner",
    channelIconColor: "#15803d",
    channelName: "Chuyển khoản VietQR",
    amount: 1650000,
    status: "Đã vào MB Bank",
    statusType: "success"
  }
];

export const CHART_POINTS = [
  { label: "Đầu kỳ", date: "01/09", value: 3200000, x: 0, y: 150 },
  { label: "05/09", date: "05/09", value: 7800000, x: 150, y: 50 },
  { label: "10/09", date: "10/09", value: 2100000, x: 300, y: 180 },
  { label: "15/09", date: "15/09", value: 6400000, x: 480, y: 80 },
  { label: "20/09", date: "20/09", value: 2900000, x: 630, y: 160 },
  { label: "25/09", date: "25/09", value: 9200000, x: 800, y: 20 },
  { label: "Cuối kỳ", date: "30/09", value: 4500000, x: 1000, y: 120 }
];
