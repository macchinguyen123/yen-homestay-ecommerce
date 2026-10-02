export const INITIAL_SERVICES = [
  {
    id: 1,
    name: 'Mâm cỗ đặc sản Tây Bắc (Cơm lam, lợn mán, cá suối, rau rừng)',
    category: 'food',
    status: 'Đang phục vụ',
    price: 650000,
    unit: 'Set 4 - 6 người',
    description: 'Nguyên liệu sạch thu hái trong ngày tại thung lũng Mai Châu, nấu chuẩn vị Thái bản Làng Cố cùng nếp nương thơm dẻo.',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: 2,
    name: 'Tour đạp xe bản Lác & Thung lũng Mai Châu',
    category: 'culture',
    status: 'Cần đặt trước',
    price: 180000,
    unit: 'Khách',
    description: 'Khám phá cuộc sống thanh bình của người Thái, check-in cánh đồng lúa chín và dệt thổ cẩm cổ truyền.',
    image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80',
    createdAt: Date.now() - 86400000 * 4,
  },
  {
    id: 3,
    name: 'Thuê xe máy tay ga khám phá đèo Thung Khe',
    category: 'transport',
    status: 'Đang phục vụ',
    price: 150000,
    unit: 'Ngày',
    description: 'Xe Honda Vision mới bảo dưỡng, kèm 2 mũ bảo hiểm đạt chuẩn và bản đồ du lịch độc quyền.',
    image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80',
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    id: 4,
    name: 'Tắm lá thuốc thảo dược người Dao đỏ',
    category: 'wellness',
    status: 'Đang phục vụ',
    price: 200000,
    unit: 'Lượt',
    description: 'Bài thuốc cổ truyền với hơn 20 loại thảo mộc rừng giúp giãn cơ, thông khí huyết và ngủ ngon sâu.',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: 5,
    name: 'Gói Combo Nghỉ dưỡng & Khám phá Bản địa',
    category: 'combo',
    status: 'Đang phục vụ',
    price: 890000,
    unit: 'Gói combo',
    description: 'Gói trọn gói tiết kiệm 15%: Mâm cỗ Tây Bắc + Tour đạp xe bản Lác + Tắm lá thuốc thảo dược.',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
    linkedServices: [1, 2, 4],
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
  { key: 'all', label: 'Tất cả dịch vụ' },
  { key: 'food', label: 'Ẩm thực & Bữa ăn' },
  { key: 'culture', label: 'Trải nghiệm văn hóa & Tour' },
  { key: 'transport', label: 'Thuê xe & Di chuyển' },
  { key: 'wellness', label: 'Tiện ích thư giãn' },
  { key: 'combo', label: 'Gói Combo liên kết' }
];

export const POPULAR_STATS = [
  { name: 'Mâm cỗ đặc sản Tây Bắc', percent: 42, color: '#16a34a' },
  { name: 'Tắm lá thuốc thảo dược Dao đỏ', percent: 28, color: '#059669' },
  { name: 'Tour đạp xe bản Lác', percent: 18, color: '#0d9488' },
  { name: 'Thuê xe máy đèo Thung Khe', percent: 12, color: '#0284c7' }
];

export function formatVND(amount) {
  return `${Number(amount || 0).toLocaleString('vi-VN')}đ`;
}
