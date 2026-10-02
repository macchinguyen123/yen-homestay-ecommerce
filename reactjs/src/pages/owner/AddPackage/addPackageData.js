// Dữ liệu ban đầu cho trang Đăng ký Gói Quảng Cáo & Đẩy Top

export const INITIAL_PACKAGES = [
  {
    id: 'pkg-quick-push',
    name: 'Gói Đẩy Top Nhanh',
    badge: null,
    categories: ['short'],
    icon: 'bi-lightning-charge-fill',
    iconBg: '#DCFCE7',
    iconColor: '#166534',
    desc: 'Phù hợp đẩy tin cuối tuần, tăng lượt đặt khẩn cấp',
    price: 150000,
    duration: '3 ngày',
    features: [
      'Ưu tiên vị trí TOP 5 trang tìm kiếm homestay',
      'Gắn nhãn "Nổi Bật" trên danh sách kết quả',
      'Hỗ trợ thống kê lượt click cơ bản theo ngày',
    ],
    buttonText: 'Đăng ký ngay',
    isHot: false,
  },
  {
    id: 'pkg-top-1-pro',
    name: 'Gói Top 1 Chuyên Nghiệp',
    badge: 'Phổ biến nhất',
    categories: ['hot', 'long'],
    icon: 'bi-star-fill',
    iconBg: '#047857',
    iconColor: '#FFFFFF',
    desc: 'Tối ưu cho cả tháng, tiếp cận tối đa du khách tiềm năng',
    price: 990000,
    duration: '30 ngày',
    features: [
      'Hiển thị Banner đề xuất Trang Chủ Mai Châu',
      'Báo cáo hiệu quả Realtime nâng cao qua Host Portal',
      'Hỗ trợ tối ưu hình ảnh & bài viết homestay',
      'Ưu tiên xuất hiện đầu mục Homestay được yêu thích',
    ],
    buttonText: 'Kích hoạt gói',
    isHot: true,
  },
  {
    id: 'pkg-peak-season',
    name: 'Gói Mùa Cao Điểm',
    badge: null,
    categories: ['short'],
    icon: 'bi-megaphone-fill',
    iconBg: '#FEF3C7',
    iconColor: '#B45309',
    desc: 'Đột phá doanh thu trong các dịp lễ hội, sự kiện lớn',
    price: 550000,
    duration: '14 ngày',
    features: [
      'Hiển thị ưu tiên chiến dịch Mùa Lúa Chín / Lễ hội',
      'Gửi thông báo Push đến du khách đang tìm điểm đến',
      'Tặng 200 lượt Click tài trợ miễn phí trong chiến dịch',
    ],
    buttonText: 'Đăng ký ngay',
    isHot: false,
  },
  {
    id: 'pkg-vip-brand',
    name: 'Gói VIP Toàn Diện 6 Tháng',
    badge: 'Tiết kiệm 20%',
    categories: ['long'],
    icon: 'bi-gem',
    iconBg: '#EDE9FE',
    iconColor: '#6D28D9',
    desc: 'Giải pháp thương hiệu dài hạn, bảo đảm lượng khách ổn định',
    price: 2450000,
    duration: '180 ngày',
    features: [
      'Huy hiệu "Homestay Kim Cương" uy tín trên toàn sàn',
      'Bài PR chuyên mục "Khám phá bản làng" độc quyền',
      'Tư vấn trực tiếp 1-1 tối ưu công suất phòng mùa thấp điểm',
      'Không giới hạn số lượt đẩy tin ưu tiên tự động',
    ],
    buttonText: 'Đăng ký ngay',
    isHot: false,
  },
];

export const INITIAL_STATS = {
  monthlyViews: 48250,
  monthlyViewsChange: '+35.2%',
  targetViews: 50000,
  targetPercent: 96.5,
  activePackage: {
    name: 'Gói Top 1',
    status: 'Đang chạy',
    daysLeft: 4,
    campaign: 'Tiêu điểm Mùa Lúa Chín',
  },
  featuredBanner: {
    title: 'Banner Đẩy Top Trang Chủ',
    desc: 'Xuất hiện ngay vị trí đầu tiên khi du khách tìm kiếm khu vực Mai Châu',
    badge: 'VỊ TRÍ NỔI BẬT TOP 1',
    targetReach: '98% Khách tìm Mai Châu',
    cpc: '~500đ / click',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
  },
};

export const SEED_HISTORY = [
  {
    id: 1,
    pkgName: 'Gói Top 1 Chuyên Nghiệp',
    price: 990000,
    duration: '30 ngày',
    date: '28/09',
    status: 'Đang chạy',
    timestamp: Date.now() - 4 * 86400000,
  },
  {
    id: 2,
    pkgName: 'Gói Đẩy Top Nhanh',
    price: 150000,
    duration: '3 ngày',
    date: '15/09',
    status: 'Đã hoàn thành',
    timestamp: Date.now() - 17 * 86400000,
  },
  {
    id: 3,
    pkgName: 'Gói Mùa Cao Điểm',
    price: 550000,
    duration: '14 ngày',
    date: '01/09',
    status: 'Đã hoàn thành',
    timestamp: Date.now() - 31 * 86400000,
  },
];

export const FILTER_OPTIONS = [
  { id: 'all', label: 'Tất cả gói' },
  { id: 'hot', label: 'Gói HOT' },
  { id: 'short', label: 'Ngắn hạn' },
  { id: 'long', label: 'Dài hạn' },
];

export const fmtVND = (num) => {
  return parseInt(num || 0, 10).toLocaleString('vi-VN') + ' đ';
};
