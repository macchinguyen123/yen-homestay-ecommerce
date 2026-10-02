export const INITIAL_VOUCHERS = [
  {
    code: "MAICHAU15",
    name: "Ưu đãi Mountain View & Garden View",
    type: "percent",
    value: 15,
    maxDiscount: 300000,
    minOrder: 0,
    usageLimit: 100,
    used: 42,
    perUser: 1,
    start: "2024-09-15",
    end: "2024-10-30",
    audience: "Công khai toàn sàn",
    status: "active",
    description: "Áp dụng độc quyền cho khách đặt phòng từ 2 đêm trở lên để trải nghiệm trọn vẹn văn hoá Tây Bắc.",
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80"
  },
  {
    code: "THOCAM10",
    name: "Tri ân du khách dệt thổ cẩm bản địa",
    type: "percent",
    value: 10,
    maxDiscount: 200000,
    minOrder: 500000,
    usageLimit: 50,
    used: 36,
    perUser: 1,
    start: "2024-09-01",
    end: "2024-10-15",
    audience: "Nhiệm vụ văn hoá bản địa",
    status: "active",
    description: "Dành riêng cho khách hoàn thành trải nghiệm học dệt thổ cẩm truyền thống tại xưởng dệt bản Lác.",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80"
  },
  {
    code: "LUACHIN2024",
    name: "Kích cầu mùa lúa chín Mai Châu",
    type: "amount",
    value: 100000,
    maxDiscount: 100000,
    minOrder: 800000,
    usageLimit: 80,
    used: 15,
    perUser: 1,
    start: "2024-09-10",
    end: "2024-10-25",
    audience: "Công khai toàn sàn",
    status: "active",
    description: "Tặng ngay 100k khi đặt phòng mùa thu lúa chín vàng óng thung lũng Mai Châu.",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=80"
  },
  {
    code: "TREKKING20",
    name: "Tour Trekking bản Bước & Hang Chiều",
    type: "percent",
    value: 20,
    maxDiscount: 400000,
    minOrder: 1000000,
    usageLimit: 60,
    used: 28,
    perUser: 1,
    start: "2024-09-05",
    end: "2024-11-05",
    audience: "Khách hàng thân thiết",
    status: "active",
    description: "Giảm 20% tổng hóa đơn phòng cho đoàn đặt thêm tour leo núi ngắm mây bản Bước.",
    image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80"
  },
  {
    code: "WELCOMEMC",
    name: "Quà tặng lần đầu đặt phòng",
    type: "amount",
    value: 50000,
    maxDiscount: 50000,
    minOrder: 400000,
    usageLimit: 120,
    used: 85,
    perUser: 1,
    start: "2024-09-01",
    end: "2024-12-31",
    audience: "Khách đặt lần đầu",
    status: "active",
    description: "Voucher chào mừng du khách mới lần đầu trải nghiệm lưu trú tại Homestay Nhà Sàn Mộc.",
    image: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=600&q=80"
  },
  {
    code: "XUAN2025",
    name: "Sớm đón mùa hoa ban Tây Bắc",
    type: "percent",
    value: 25,
    maxDiscount: 500000,
    minOrder: 1500000,
    usageLimit: 50,
    used: 0,
    perUser: 1,
    start: "2025-01-01",
    end: "2025-02-28",
    audience: "Công khai toàn sàn",
    status: "upcoming",
    description: "Đặt trước đón Tết và mùa hoa ban rực rỡ đầu xuân tại thung lũng Mai Châu.",
    image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=600&q=80"
  },
  {
    code: "HELOSUMMER",
    name: "Chào hè Tây Bắc rộn ràng",
    type: "percent",
    value: 20,
    maxDiscount: 500000,
    minOrder: 800000,
    usageLimit: 120,
    used: 118,
    perUser: 1,
    start: "2024-06-01",
    end: "2024-07-31",
    audience: "Công khai toàn sàn",
    status: "ended",
    description: "Chương trình giải nhiệt mùa hè đón du khách gia đình nghỉ ngơi tại Mai Châu.",
    image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80"
  },
  {
    code: "BANLAC5",
    name: "Voucher đoàn trekking Bản Lác",
    type: "percent",
    value: 5,
    maxDiscount: 150000,
    minOrder: 600000,
    usageLimit: 40,
    used: 24,
    perUser: 1,
    start: "2024-07-10",
    end: "2024-08-10",
    audience: "Khách hàng thân thiết",
    status: "ended",
    description: "Ưu đãi tri ân các nhóm du khách trẻ yêu thích hoạt động đi bộ thám hiểm bản làng.",
    image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80"
  }
];

export const VOUCHER_HISTORY_SEED = [
  { name: "Ưu đãi Mountain View & Garden View", code: "MAICHAU15", period: "15/09 - 30/10/2024", used: 42, limit: 100, revenue: 94500000, status: "active" },
  { name: "Tri ân du khách dệt thổ cẩm bản địa", code: "THOCAM10", period: "01/09 - 15/10/2024", used: 36, limit: 50, revenue: 38200000, status: "active" },
  { name: "Kích cầu mùa lúa chín Mai Châu", code: "LUACHIN2024", period: "10/09 - 25/10/2024", used: 15, limit: 80, revenue: 16500000, status: "active" },
  { name: "Chào hè Tây Bắc rộn ràng", code: "HELOSUMMER", period: "01/06 - 31/07/2024", used: 118, limit: 120, revenue: 132800000, status: "ended" },
  { name: "Voucher đoàn trekking Bản Lác", code: "BANLAC5", period: "10/07 - 10/08/2024", used: 24, limit: 40, revenue: 21600000, status: "ended" }
];

export function formatVND(amount) {
  return `${Number(amount || 0).toLocaleString('vi-VN')}₫`;
}

export function toVN(isoDate) {
  if (!isoDate) return "—";
  const parts = isoDate.split("-");
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}
