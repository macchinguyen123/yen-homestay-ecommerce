export const INITIAL_SERVICES = [
  {
    id: 1,
    homestayId: 1,
    name: 'Karaoke gia đình',
    category: 'culture',
    status: 'Đang phục vụ',
    price: 280000,
    unit: 'Giờ',
    description: 'Dàn âm thanh chuyên nghiệp chất lượng cao, phục vụ hát karaoke giải trí cùng gia đình tại homestay.',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80',
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: 2,
    homestayId: 1,
    name: 'Gửi hành lý thêm giờ',
    category: 'wellness',
    status: 'Đang phục vụ',
    price: 0,
    unit: 'Lượt',
    description: 'Hỗ trợ khách lưu trữ và bảo quản hành lý an toàn, tiện lợi trước giờ nhận phòng hoặc sau giờ trả phòng.',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
    createdAt: Date.now() - 86400000 * 4,
  },
  {
    id: 3,
    homestayId: 1,
    name: 'Giặt ủi',
    category: 'wellness',
    status: 'Đang phục vụ',
    price: 40000,
    unit: 'Kg',
    description: 'Dịch vụ giặt sấy thơm tho, ủi phẳng phiu, giao nhận tận phòng nhanh chóng trong ngày.',
    image: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=600&q=80',
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    id: 4,
    homestayId: 1,
    name: 'Set trà chiều & bánh',
    category: 'food',
    status: 'Tạm ngưng',
    price: 110000,
    unit: 'Bộ',
    description: 'Thưởng thức trà hoa thảo mộc thượng hạng kèm bánh ngọt thủ công giữa không gian thiên nhiên thanh bình.',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: 5,
    homestayId: 1,
    name: 'Gói chụp ảnh kỷ niệm',
    category: 'culture',
    status: 'Đang phục vụ',
    price: 660000,
    unit: 'Lượt',
    description: 'Thợ ảnh chuyên nghiệp chụp và chỉnh sửa ảnh kỷ niệm phong cảnh đẹp, trang phục dân tộc hoặc dã ngoại.',
    image: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=600&q=80',
    createdAt: Date.now() - 86400000,
  }
];

export const INITIAL_NOTES = [
  {
    id: 1,
    icon: 'soup_kitchen',
    title: 'Mâm cỗ tối đặt trước 16h',
    content: 'Bếp cần chuẩn bị cá suối tươi và cơm lam nướng than 2 tiếng.'
  },
  {
    id: 2,
    icon: 'explore',
    title: 'Tour đạp xe cần hướng dẫn viên bản địa',
    content: 'Liên hệ trước 1 ngày để bố trí người am hiểu văn hóa đi cùng đoàn.'
  },
  {
    id: 3,
    icon: 'directions_car',
    title: 'Kiểm tra xe máy trước khi bàn giao',
    content: 'Luôn kiểm tra phanh, lốp xe và đổ đầy bình xăng cho du khách.'
  }
];

export const CATEGORIES = [
  { key: 'all', label: 'Tất cả dịch vụ', icon: 'bi-grid-fill' },
  { key: 'food', label: 'Ẩm thực & Bữa ăn', icon: 'bi-cup-hot-fill' },
  { key: 'culture', label: 'Trải nghiệm văn hóa & Tour', icon: 'bi-compass-fill' },
  { key: 'transport', label: 'Thuê xe & Di chuyển', icon: 'bi-car-front-fill' },
  { key: 'wellness', label: 'Tiện ích thư giãn', icon: 'bi-heart-pulse-fill' },
  { key: 'combo', label: 'Gói Combo liên kết', icon: 'bi-collection-fill' }
];

export const POPULAR_STATS = [
  { name: 'Mâm cỗ đặc sản Tây Bắc', percent: 42, color: '#16a34a' },
  { name: 'Tắm lá thuốc thảo dược Dao đỏ', percent: 28, color: '#059669' },
  { name: 'Tour đạp xe bản Lác', percent: 18, color: '#0d9488' },
  { name: 'Thuê xe máy đèo Thung Khe', percent: 12, color: '#0284c7' }
];

export const PRESET_IMAGES = [
  {
    category: 'food',
    name: 'Mâm cỗ đặc sản Tây Bắc',
    url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80'
  },
  {
    category: 'food',
    name: 'Bữa sáng & Cafe view núi',
    url: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=600&q=80'
  },
  {
    category: 'food',
    name: 'Tiệc nướng BBQ sân vườn',
    url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80'
  },
  {
    category: 'culture',
    name: 'Tour xe đạp khám phá bản',
    url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80'
  },
  {
    category: 'culture',
    name: 'Trekking ruộng bậc thang',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80'
  },
  {
    category: 'culture',
    name: 'Lửa trại & múa xòe cổ truyền',
    url: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=600&q=80'
  },
  {
    category: 'transport',
    name: 'Thuê xe máy tay ga',
    url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80'
  },
  {
    category: 'transport',
    name: 'Xe đưa đón sân bay / bến xe',
    url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80'
  },
  {
    category: 'wellness',
    name: 'Tắm lá thảo dược cổ truyền',
    url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80'
  },
  {
    category: 'wellness',
    name: 'Ngâm chân thảo mộc ban đêm',
    url: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=600&q=80'
  },
  {
    category: 'combo',
    name: 'Gói combo trải nghiệm trọn gói',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80'
  }
];

export function formatVND(amount) {
  return `${Number(amount || 0).toLocaleString('vi-VN')}đ`;
}
