// ============================================================
// YÊN Homestay – Dữ liệu trang Chi Tiết Homestay
// ============================================================

export const SERVICE_FEE_RATE = 0.05;

export const fmtVND = (n) => n.toLocaleString('vi-VN') + 'đ';

// ─── 1. PHÒNG ────────────────────────────────────────────────
export const roomsData = [
  {
    id: 'doi',
    reviewGroup: 'doi',
    shortName: 'Phòng Đôi',
    name: 'Phòng Đôi View Rừng Thông',
    availableCount: 2,
    rating: 4.92,
    reviewCount: 58,
    specs: { area: '28m²', guests: 2, beds: '1 giường đôi' },
    price: 890000,
    cleaningFee: 100000,
    thumb: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=700&q=80',
    description: 'Phòng ấm cúng dành cho 2 người, view thẳng ra rừng thông, có ban công riêng để ngắm bình minh và uống trà sáng.',
    gallery: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?auto=format&fit=crop&w=1200&q=80',
    ],
    amenities: ['Ban công riêng', 'Lò sưởi mini', 'Bồn tắm gỗ', 'Wifi tốc độ cao', 'Máy sấy tóc', 'Nước suối miễn phí'],
  },
  {
    id: 'giadinh',
    reviewGroup: 'giadinh',
    shortName: 'Phòng Gia Đình',
    name: 'Phòng Gác Mái Gia Đình',
    availableCount: 1,
    rating: 4.90,
    reviewCount: 41,
    specs: { area: '42m²', guests: 4, beds: '1 giường đôi + 2 giường đơn' },
    price: 1350000,
    cleaningFee: 130000,
    thumb: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=700&q=80',
    description: 'Không gian 2 tầng ấm cúng cho gia đình, tầng trệt là phòng ngủ chính, gác mái nhỏ xinh dành riêng cho các bé, có bếp mini để tự nấu ăn nhẹ.',
    gallery: [
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80',
    ],
    amenities: ['Gác mái riêng cho trẻ em', 'Bếp mini', 'Tủ lạnh mini', 'Wifi tốc độ cao', 'Máy sưởi phòng', 'Sân chơi nhỏ ngoài trời'],
  },
  {
    id: 'villa',
    reviewGroup: 'villa',
    shortName: 'Villa Toàn Căn',
    name: 'Villa Toàn Căn Đồi Thông',
    availableCount: 1,
    rating: 4.85,
    reviewCount: 27,
    specs: { area: '95m²', guests: 8, beds: '3 phòng ngủ · 4 giường' },
    price: 3200000,
    cleaningFee: 250000,
    thumb: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=700&q=80',
    description: 'Thuê trọn căn nhà gỗ 3 phòng ngủ, có phòng khách và sân BBQ riêng biệt — lựa chọn lý tưởng cho nhóm bạn hoặc gia đình lớn muốn có không gian riêng tư tuyệt đối.',
    gallery: [
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
    ],
    amenities: ['Sân BBQ riêng', 'Bếp đầy đủ dụng cụ', 'Phòng khách riêng', 'Lò sưởi củi lớn', 'Chỗ đậu 2 ô tô', 'Máy giặt'],
  },
];

// ─── 2. ẢNH GALLERY TOÀN HOMESTAY ────────────────────────────
export const galleryImages = [
  'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1470770903676-69b98201ea1c?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1400&q=80',
  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1400&q=80',
];

// ─── 3. TIỆN NGHI ─────────────────────────────────────────────
export const AMENITY_GROUPS = [
  { id: 'ngoaitroi', label: 'Ngoài trời & thiên nhiên', icon: 'bi-tree' },
  { id: 'bep',       label: 'Bếp & ăn uống',            icon: 'bi-cup-straw' },
  { id: 'phong',     label: 'Phòng ngủ & phòng tắm',    icon: 'bi-moon-stars' },
  { id: 'tienich',   label: 'Tiện ích & an toàn',       icon: 'bi-shield-check' },
];

export const amenitiesData = [
  { id: 'bontam',  group: 'ngoaitroi', icon: 'bi-cup-hot',          name: 'Bồn tắm gỗ ngắm mây',          note: 'Hẹn giờ với chủ nhà để có nước nóng sẵn sàng.', preview: 2 },
  { id: 'bbq',     group: 'ngoaitroi', icon: 'bi-egg-fried',        name: 'Sân BBQ chung',                  note: 'Villa Toàn Căn có sân BBQ riêng.', preview: 3 },
  { id: 'luatrai', group: 'ngoaitroi', icon: 'bi-fire',             name: 'Khu lửa trại ngoài sân' },
  { id: 'vuon',    group: 'ngoaitroi', icon: 'bi-flower1',          name: 'Vườn rau, vườn hoa trước nhà' },
  { id: 'hien',    group: 'ngoaitroi', icon: 'bi-tree',             name: 'Hiên gỗ nhìn ra đồi thông' },
  { id: 'vong',    group: 'ngoaitroi', icon: 'bi-cloud-sun',        name: 'Võng và ghế thư giãn ngoài sân' },
  { id: 'bep',     group: 'bep',       icon: 'bi-cup-straw',        name: 'Bếp chung đầy đủ dụng cụ',       preview: 6 },
  { id: 'tulanh',  group: 'bep',       icon: 'bi-snow2',            name: 'Tủ lạnh' },
  { id: 'vivi',    group: 'bep',       icon: 'bi-lightning-charge', name: 'Lò vi sóng và ấm siêu tốc' },
  { id: 'tra',     group: 'bep',       icon: 'bi-cup-hot',          name: 'Bộ ấm trà và cà phê' },
  { id: 'banan',   group: 'bep',       icon: 'bi-table',            name: 'Bàn ăn ngoài trời' },
  { id: 'nuoc',    group: 'bep',       icon: 'bi-droplet',          name: 'Nước lọc miễn phí' },
  { id: 'losuoi',  group: 'phong',     icon: 'bi-fire',             name: 'Lò sưởi củi',                    preview: 1 },
  { id: 'maysuoi', group: 'phong',     icon: 'bi-snow',             name: 'Máy sưởi phòng',                 preview: 8 },
  { id: 'changa',  group: 'phong',     icon: 'bi-moon',             name: 'Chăn ga gối sạch, thơm mùi gỗ thông' },
  { id: 'chan',    group: 'phong',     icon: 'bi-moon-stars',       name: 'Chăn dày bổ sung cho đêm lạnh' },
  { id: 'saytoc',  group: 'phong',     icon: 'bi-wind',             name: 'Máy sấy tóc' },
  { id: 'khan',    group: 'phong',     icon: 'bi-droplet-half',     name: 'Khăn tắm và đồ vệ sinh cá nhân' },
  { id: 'wifi',    group: 'tienich',   icon: 'bi-wifi',             name: 'Wifi tốc độ cao',                preview: 4 },
  { id: 'dauxe',   group: 'tienich',   icon: 'bi-car-front',        name: 'Chỗ đậu xe miễn phí',            note: 'Villa Toàn Căn có chỗ đậu 2 ô tô ngay trong sân.', preview: 5 },
  { id: 'tv',      group: 'tienich',   icon: 'bi-tv',               name: 'Smart TV',                       preview: 7 },
  { id: 'khoama',  group: 'tienich',   icon: 'bi-key',              name: 'Tự nhận phòng bằng mã số' },
  { id: 'camera',  group: 'tienich',   icon: 'bi-camera-video',     name: 'Camera ở khu vực ngoài trời' },
  { id: 'yte',     group: 'tienich',   icon: 'bi-bandaid',          name: 'Bình chữa cháy và hộp sơ cứu' },
];

// ─── 4. TRẢI NGHIỆM ───────────────────────────────────────────
export const EXPERIENCE_CATEGORIES = [
  { id: 'thiennhien', label: 'Thiên nhiên',         icon: 'bi-tree' },
  { id: 'nongtrai',   label: 'Vườn & nông trại',    icon: 'bi-basket' },
  { id: 'amthuc',     label: 'Ẩm thực',             icon: 'bi-cup-hot' },
  { id: 'thugian',    label: 'Thư giãn & giao lưu', icon: 'bi-fire' },
];

export const EXPERIENCE_COSTS = [
  { id: 'all',  label: 'Tất cả' },
  { id: 'free', label: 'Miễn phí' },
  { id: 'paid', label: 'Có phí' },
];

export const EXPERIENCE_PREVIEW_IDS = ['sanmay', 'hairau', 'naucom', 'luatrai'];
export const EXPERIENCE_FALLBACK_IMG = '1470071459604-3b5ec3a7fe05';

export const experiencesData = [
  { id: 'sanmay',   category: 'thiennhien', title: 'Săn mây bình minh trên đồi thông', summary: 'Dậy sớm cùng chủ nhà lên điểm ngắm mây phía sau đồi, vừa nhâm nhi trà gừng nóng vừa chờ mặt trời ló dạng.', img: '1470770903676-69b98201ea1c', duration: '90 phút', time: '05:30 – 07:00', people: 'Mọi lứa tuổi', price: 0, unit: '', includes: ['Trà gừng nóng', 'Chủ nhà chỉ đường lên điểm ngắm mây', 'Góc chụp ảnh nhìn ra biển mây'], note: 'Sáng sớm ở Đà Lạt khá lạnh, bạn nhớ mang áo ấm.', booking: 'Không cần đặt trước' },
  { id: 'trekking', category: 'thiennhien', title: 'Đi bộ xuyên rừng thông', summary: 'Cung đường mòn nhẹ nhàng quanh đồi, chủ nhà dẫn bạn đi qua những góc rừng yên tĩnh ít người biết đến.', img: '1441974231531-c6227db76b6e', duration: '2 giờ', time: 'Sáng hoặc chiều', people: 'Từ 6 tuổi', price: 100000, unit: '/ nhóm', includes: ['Chủ nhà dẫn đường', 'Nước suối', 'Gậy đi bộ'], note: 'Nên mang giày thể thao hoặc giày đế bám.', booking: 'Đặt trước 1 ngày' },
  { id: 'hairau',   category: 'nongtrai',   title: 'Hái rau, dâu tại vườn nhà', summary: 'Tự tay chọn rau củ và dâu tây trong vườn hữu cơ của gia đình, rồi mang về bếp chung nấu ngay trong bữa.', img: '1464965911861-746a04b4bca6', duration: '60 phút', time: '08:00 – 10:00', people: 'Mọi lứa tuổi', price: 60000, unit: '/ khách', includes: ['Giỏ và kéo cắt rau', 'Mang về tối đa 1kg rau, quả', 'Găng tay cho bé'], note: 'Rau, quả theo mùa vụ nên có thể thay đổi giữa các tháng.', booking: 'Đặt trước 1 ngày' },
  { id: 'nongtrai', category: 'nongtrai',   title: 'Cho gà, thỏ ăn & chơi vườn cùng bé', summary: 'Góc nông trại nhỏ trong sân vườn: các bé cho gà, thỏ ăn, nhặt trứng và chạy nhảy thoải mái, an toàn.', img: '1500382017468-9049fed747ef', duration: '45 phút', time: 'Cả ngày', people: 'Gia đình có trẻ nhỏ', price: 0, unit: '', includes: ['Thức ăn cho vật nuôi', 'Nước rửa tay sau khi chơi'], note: 'Trẻ nhỏ cần có người lớn đi cùng.', booking: 'Không cần đặt trước' },
  { id: 'naucom',   category: 'amthuc',     title: 'Học nấu bữa cơm quê cùng chủ nhà', summary: 'Cùng chị Lan Anh vào bếp làm 3 món quê từ rau vườn nhà, rồi ngồi ăn quây quần như bữa cơm gia đình.', img: '1414235077428-338989a2e8c0', duration: '2 giờ', time: '16:00 – 18:00', people: 'Từ 2 khách', price: 180000, unit: '/ khách', includes: ['Nguyên liệu tươi từ vườn', 'Chủ nhà hướng dẫn từng món', 'Bữa cơm thưởng thức tại chỗ'], note: 'Báo trước nếu có khách ăn chay hoặc dị ứng thực phẩm.', booking: 'Đặt trước 1 ngày' },
  { id: 'tradacphe',category: 'amthuc',     title: 'Trà atiso & cà phê rang xay buổi sáng', summary: 'Ngồi hiên nhà gỗ thưởng thức trà atiso và cà phê xay tay, kèm bánh ngọt chủ nhà làm từ sáng.', img: '1495474472287-4d71bcdd2085', duration: '45 phút', time: '07:00 – 09:00', people: 'Mọi lứa tuổi', price: 0, unit: '', includes: ['Ly trà hoặc cà phê đầu tiên miễn phí', 'Bánh ngọt làm tại nhà', 'Chỗ ngồi hiên nhìn ra đồi'], note: 'Từ ly thứ hai, mỗi ly tính thêm 25.000đ.', booking: 'Không cần đặt trước' },
  { id: 'luatrai',  category: 'thugian',    title: 'Lửa trại & nướng BBQ đêm đồi thông', summary: 'Quây quần bên đống lửa nướng đồ, hát hò và kể chuyện dưới trời se lạnh, một buổi tối rất Đà Lạt.', img: '1584622650111-993a426fbf0a', duration: '2 giờ', time: '18:30 – 21:00', people: 'Từ 2 khách', price: 250000, unit: '/ nhóm', includes: ['Củi và than', 'Bếp nướng, vỉ nướng, dụng cụ', 'Bàn ghế ngoài trời'], note: 'Khách tự mang thực phẩm hoặc đặt combo BBQ với chủ nhà. Kết thúc trước 21:00 để giữ yên tĩnh cho cả khu.', booking: 'Đặt trước 1 ngày' },
  { id: 'bontam2',  category: 'thugian',    title: 'Ngâm bồn tắm gỗ ngắm mây, ngắm sao', summary: 'Ngâm nước ấm trong bồn tắm gỗ ngoài trời, ngắm mây trôi ban ngày hoặc bầu trời sao ban đêm.', img: '1560448204-e02f11c3d0e2', duration: '60 phút', time: 'Cả ngày', people: 'Khách lưu trú', price: 0, unit: '', includes: ['Nước nóng sẵn sàng', 'Khăn tắm và muối thảo mộc'], note: 'Hãy báo giờ với chủ nhà trước để có nước nóng đúng lúc.', booking: 'Hẹn giờ với chủ nhà' },
];

// ─── 5. ĐÁNH GIÁ ──────────────────────────────────────────────
export const REVIEW_GROUPS = [
  { id: 'doi',     label: 'Phòng Đôi',      total: 58 },
  { id: 'giadinh', label: 'Phòng Gia Đình', total: 41 },
  { id: 'villa',   label: 'Villa Toàn Căn', total: 27 },
];
export const TOTAL_REVIEWS = REVIEW_GROUPS.reduce((s, g) => s + g.total, 0);

const reviewTexts = {
  doi: [
    'Ban công nhìn thẳng ra rừng thông, sáng dậy uống trà mà không muốn về.',
    'Bồn tắm gỗ ngoài trời là điểm cộng lớn nhất, tối ngâm mình ngắm sao rất chill.',
    'Phòng nhỏ xinh, ấm áp, lò sưởi mini bật lên là ngủ ngon ngay.',
    'Đi cùng người yêu, không gian riêng tư và lãng mạn đúng như hình.',
    'Giường êm, chăn dày, đêm Đà Lạt lạnh mấy cũng không thấy lạnh.',
    'Phòng sạch, thơm mùi gỗ thông, decor đơn giản mà tinh tế.',
    'Buổi sáng săn mây ngay từ ban công, chụp ảnh lên rất đẹp.',
    'Vị trí yên tĩnh nhưng ra chợ đêm chỉ mất vài phút đi xe.',
    'Chúng mình đi kỷ niệm ngày cưới, chủ nhà còn gửi thêm bình trà nóng buổi tối.',
    'Nhận phòng bằng mã số rất tiện, đến muộn cũng không lo.',
    'Phòng đúng như mô tả, view đẹp hơn cả mong đợi.',
    'Lò sưởi và bồn tắm gỗ khiến chuyến đi 2 ngày 1 đêm như một kỳ nghỉ dài.',
  ],
  giadinh: [
    'Nhà mình có 2 bé nhỏ, các bé mê gác mái riêng và ngủ rất ngoan.',
    'Phòng rộng rãi, bếp mini tiện nấu đồ ăn dặm cho bé.',
    'Sân chơi nhỏ ngoài trời an toàn, con chạy nhảy cả buổi chiều.',
    'Ba thế hệ đi cùng nhau vẫn thoải mái, giường đủ cho cả nhà.',
    'Không gian ấm cúng, có máy sưởi nên bé không bị lạnh về đêm.',
    'Gác mái được chăng đèn nhỏ xinh, bọn trẻ nhất quyết không chịu xuống.',
    'Tủ lạnh mini và bếp giúp gia đình tự chuẩn bị bữa sáng rất tiện.',
    'Chủ nhà chuẩn bị sẵn ghế ăn cho bé, rất chu đáo.',
    'Sân BBQ chung sạch sẽ, cả nhà nướng đồ ăn buổi tối vui hết ý.',
    'Phòng sạch sẽ, chăn ga thơm, không có mùi ẩm dù Đà Lạt hay mưa.',
    'Cách trung tâm gần, đi chợ đêm xong về nghỉ ngơi rất nhanh.',
    'Đây là lần thứ hai gia đình mình quay lại, vẫn hài lòng như lần đầu.',
  ],
  villa: [
    'Nhóm 8 người ở vừa vặn, mỗi cặp có phòng riêng mà vẫn có phòng khách chung.',
    'Sân BBQ riêng nên cả nhóm nướng đồ ăn ngay tại chỗ, không cần đi đâu.',
    'Villa riêng biệt hoàn toàn, sang trọng mà vẫn ấm cúng.',
    'Lò sưởi củi lớn ở phòng khách là tâm điểm của cả buổi tối.',
    'Bếp đầy đủ dụng cụ, cả nhóm tự nấu lẩu rất tiện.',
    'Chỗ đậu 2 ô tô ngay trong sân, đi nhóm không lo chỗ để xe.',
    'Đi nhóm bạn thân, không gian rộng để chơi board game và tán gẫu suốt đêm.',
    'Chia đều tiền phòng cho 8 người thì rất hợp lý so với chất lượng.',
    'Máy giặt trong nhà giúp chuyến đi dài ngày nhẹ nhàng hơn nhiều.',
    'Sáng dậy mở cửa là thấy đồi thông, cả nhóm ngồi cà phê ngoài sân đến trưa.',
    'Nhà rộng, sạch, ba phòng ngủ đều có cửa sổ nhìn ra rừng thông.',
    'Mùa hoa mai anh đào quay lại chắc chắn sẽ đặt villa này lần nữa.',
  ],
};
const reviewTails = ['', ' Chủ nhà hỗ trợ rất nhiệt tình.', '', ' Sẽ quay lại lần sau!', ' Wifi mạnh, mọi thứ đều sạch sẽ.', ' Rất đáng tiền.'];
const reviewFirstNames = ['Minh', 'Bảo', 'Ngọc', 'Thanh', 'Quốc', 'Đức', 'Hoàng', 'Khánh', 'Phương', 'Tuấn', 'Thu', 'Hải', 'Mai', 'Linh'];
const reviewLastNames = ['Thư', 'Anh', 'Trâm', 'Hằng', 'Huy', 'Lan', 'Nam', 'Vy', 'Quân', 'Trang', 'Khoa', 'Chi'];
export const avatarColors = ['#15803D', '#0F766E', '#B45309', '#BE123C', '#4338CA', '#0369A1', '#7C3AED'];

const reviewPhotoPool = {
  doi:     ['1522708323590-d24dbb6b0267', '1560448204-e02f11c3d0e2', '1560185893-a55cbc8c57e8', '1470770903676-69b98201ea1c'],
  giadinh: ['1505691938895-1758d7feb511', '1522708323590-d24dbb6b0267', '1584622650111-993a426fbf0a', '1470071459604-3b5ec3a7fe05'],
  villa:   ['1584622650111-993a426fbf0a', '1542314831-068cd1dbfeeb', '1518780664697-55e3ad937233', '1520250497591-112f2f40a3f4'],
};
export const unsplashUrl = (id, w) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

function buildReviewPhotos(groupId, k, gi) {
  if ((k * 7 + gi) % 5 >= 3) return [];
  const pool = reviewPhotoPool[groupId];
  const count = 1 + (k % 3);
  return Array.from({ length: count }, (_, i) => {
    const id = pool[(k + i * 2) % pool.length];
    return { thumb: unsplashUrl(id, 400), full: unsplashUrl(id, 1400) };
  });
}

function buildAllReviews() {
  const list = [];
  let counter = 0;
  const base = new Date(2026, 7, 28).getTime();
  REVIEW_GROUPS.forEach((group, gi) => {
    for (let k = 0; k < group.total; k++) {
      const daysBack = Math.floor((k / group.total) * 540) + ((k * 7 + gi * 3) % 9);
      const ts = base - daysBack * 86400000;
      const d = new Date(ts);
      list.push({
        id: `${group.id}-${k}`,
        group: group.id,
        room: group.label,
        name: `${reviewFirstNames[(counter * 3 + gi) % reviewFirstNames.length]} ${reviewLastNames[(counter * 5 + Math.floor(counter / 14)) % reviewLastNames.length]}`,
        ts,
        date: `Tháng ${d.getMonth() + 1}, ${d.getFullYear()}`,
        stars: k % 10 === 6 ? 4 : 5,
        text: reviewTexts[group.id][k % 12] + reviewTails[(k * 5 + 3) % reviewTails.length],
        photos: buildReviewPhotos(group.id, k, gi),
      });
      counter++;
    }
  });
  return list;
}
export const allReviews = buildAllReviews();

export function getFilteredReviews(group, stars, sort, onlyPhotos) {
  let list = allReviews.filter(
    (r) =>
      (group === 'all' || r.group === group) &&
      (stars === 'all' || r.stars === Number(stars)) &&
      (!onlyPhotos || r.photos.length > 0)
  );
  if (sort === 'high') list.sort((a, b) => b.stars - a.stars || b.ts - a.ts);
  else if (sort === 'low') list.sort((a, b) => a.stars - b.stars || b.ts - a.ts);
  else list.sort((a, b) => b.ts - a.ts);
  return list;
}

// ─── 6. HOMESTAY TƯƠNG TỰ ─────────────────────────────────────
export const similarHomestaysData = [
  { name: 'Xuan Huong Lake View House', location: 'Đà Lạt', rating: '4.91', reviews: '158', specs: '3 phòng ngủ · 6 khách', amenities: 'View toàn cảnh hồ · Sân BBQ rộng · Gần chợ đêm', price: '1.250.000đ', img: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=600&q=80' },
  { name: 'Rustic Pine Hill Cabin', location: 'Đà Lạt', rating: '4.88', reviews: '124', specs: '1 phòng ngủ · 2 khách', amenities: 'Nhà gỗ mái dốc · Săn mây ban mai · Lửa trại', price: '790.000đ', img: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80' },
  { name: 'Thung Lũng Mơ Màng Homestay', location: 'Đà Lạt', rating: '4.88', reviews: '112', specs: '1 phòng ngủ · 2 khách', amenities: 'Vườn cúc hoạ mi · Kính ngắm thung lũng đèn', price: '850.000đ', img: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80' },
  { name: 'The Memory Valley Villa', location: 'Đà Lạt', rating: '4.96', reviews: '340', specs: '3 phòng ngủ · 6 khách', amenities: 'Bể bơi nước ấm · Lò sưởi củi · Sân BBQ đồi thông', price: '1.450.000đ', img: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=600&q=80' },
];
