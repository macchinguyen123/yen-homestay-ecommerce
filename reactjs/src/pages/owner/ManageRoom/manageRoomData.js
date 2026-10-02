// Mock data cho Quản lý phòng & Tình trạng phòng (Nhà Sàn Mộc • Mai Châu)

export const initialRoomsData = {
  propertyInfo: {
    name: 'Nhà Sàn Mộc • Mai Châu',
    maxCapacity: 32
  },

  rooms: [
    {
      code: 'P.101',
      name: 'Phòng Garden View 101',
      type: 'Garden View',
      capacity: 3,
      capacityLabel: '2 người lớn, 1 trẻ em',
      bed: 'Giường King 1m8',
      floor: 'Tầng 1',
      price: 850000,
      status: 'occupied', // occupied | booked | available | maintenance
      guest: 'Lê Văn Hiếu',
      stay: '16/09 → 18/09 (2 đêm • Check-out mai)',
      description: 'Phòng hướng vườn bưởi, ban công gỗ, phù hợp cho gia đình nhỏ.',
      amenities: ['View vườn bưởi', 'Ban công gỗ', 'Điều hòa Inverter', 'Bồn thảo dược Mai Châu'],
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA92VX9N0UDeWwWCIKjLehBZXqx8o90G5vq3LcG_Tv0TlKZ9rEJ77YoL_ic27GRSnIMBYyV_hPitG43lJozoYkKMt4F4Y7wzS4YPVqq_MN6AAReFtqmQ_Qu-xdxFAFbZ9xj_AL3rI1Hv1uCJLz-BKK40SYyXjnkf6G_WKzgCm_eBrS-GHlu3kwoI38m9ujg_5UmlnI_FmInPuwLvZuARdlOIv0nmTsucIfBFKIImzuftsaBcKWW9n8',
      videos: []
    },
    {
      code: 'P.201',
      name: 'Phòng Mountain View 201',
      type: 'Mountain View',
      capacity: 4,
      capacityLabel: '4 người (Gia đình)',
      bed: '2 Giường Queen gỗ pơmu',
      floor: 'Tầng 2',
      price: 1200000,
      status: 'booked',
      guest: 'Nguyễn Thị Mai (Đã cọc 50%)',
      stay: '17/09 → 20/09 (Dự kiến đến: 16:30 chiều nay)',
      description: 'Phòng view thung lũng lúa, 2 giường Queen gỗ pơmu, dành cho gia đình.',
      amenities: ['View thung lũng lúa', 'Giường King Pơmu', 'Trà Shan tuyết cổ thụ', 'Wifi vệ tinh tốc độ cao'],
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDvwt_LAypkngMfvKDDOYdct2L-JFaJmze6APU8kMIvzwODRa_h5_ep_EukGGhnOY86dp_l0loMQxsXTFSa5NzplVG4c9jBSX5SUO8fF7GkyfaoEGuMtJL-cpZ5uR1ASJBlmOnSaCVFsBD9kKoRE1OiTImP7OK7u27yodqXuT-4vnkRyWt5EZ7OSWBxZck046_lx5GOSdM43jQoLlU4RtloR61HbMgHu1DU13-aYGLO-TAAYSe95HI',
      videos: []
    },
    {
      code: 'BUNG.102',
      name: 'Bungalow Ven Suối 102',
      type: 'Bungalow',
      capacity: 2,
      capacityLabel: '2 người lớn (Cặp đôi)',
      bed: 'Giường tròn lãng mạn',
      floor: 'Khu ven suối',
      price: 1350000,
      status: 'occupied',
      guest: 'Hoàng Minh Anh',
      stay: '16/09 → 19/09 (3 đêm)',
      description: 'Không gian tĩnh lặng đúng nghĩa healing, ban công sát suối nghe nước chảy róc rách.',
      amenities: ['View suối tự nhiên', 'Bồn tắm lộ thiên', 'Bữa sáng tại phòng', 'Loa Bluetooth'],
      image: 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=800&q=80',
      videos: []
    },
    {
      code: 'DORM.01',
      name: 'Nhà Sàn Trải Nghiệm Bản Đạo',
      type: 'Dorm',
      capacity: 12,
      capacityLabel: '10 - 12 khách (Đoàn tập thể)',
      bed: '10 Đệm đơn thổ cẩm',
      floor: 'Toàn sàn',
      price: 350000,
      status: 'available',
      guest: '',
      stay: 'Lịch trống liên tục từ: 17/09 đến 22/09',
      description: 'Nhà sàn tập thể, bếp củi giao lưu, không gian BBQ, nhận đoàn tour và trekking.',
      amenities: ['Bếp củi giao lưu', 'Không gian tiệc BBQ sàn gỗ', '4 Buồng tắm riêng biệt', 'Đệm thổ cẩm Thái'],
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBG_MU48hzMQCyOhQjXMvJGqzt-Py1zvLIKdJxQSDTxbSE7QFP2vJjB9mDbcUYJLJqaC3JtSepgaFuDuU4fq9isiJfqTU8A3vE2yVcYPpMMb6VjetGR6nDaojf8gVynYqRPemLgYKJQxuP-dLld77rT4avkl2Nybfhcf8SMnDh39PJFgUbN8E0t5PfUHgP9RLlTL1RAJzlVia4IsO_kMnl9HllAv9kj71hnmBxXa6Mw1n38jFb7zQM',
      videos: []
    },
    {
      code: 'P.103',
      name: 'Phòng Deluxe Nhìn Thác Nước',
      type: 'Deluxe',
      capacity: 2,
      capacityLabel: '2 người lớn',
      bed: 'Giường Queen 1m6',
      floor: 'Tầng 1',
      price: 950000,
      status: 'occupied',
      guest: 'Trần Bảo An',
      stay: '17/09 → 20/09 (3 đêm)',
      description: 'Phòng có ban công hướng trực tiếp ra thác nước nhân tạo và tiểu cảnh hoa rừng.',
      amenities: ['Ban công thác nước', 'Máy pha trà hữu cơ', 'Điều hòa 2 chiều', 'Smart TV'],
      image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
      videos: []
    },
    {
      code: 'P.202',
      name: 'Phòng Superior Hoàng Hôn',
      type: 'Superior',
      capacity: 3,
      capacityLabel: '2 - 3 khách',
      bed: '1 Giường đôi + 1 Giường đơn',
      floor: 'Tầng 2',
      price: 900000,
      status: 'available',
      guest: '',
      stay: 'Trống từ hôm nay đến cuối tuần',
      description: 'Cửa sổ lớn hướng tây đón trọn hoàng hôn thung lũng Bản Lác cực kỳ ấn tượng.',
      amenities: ['View hoàng hôn', 'Sàn gỗ pơmu tự nhiên', 'Bình nóng lạnh', 'Bàn trà gỗ lũa'],
      image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80',
      videos: []
    },
    {
      code: 'P.104',
      name: 'Nhà Sàn Gỗ Lớn (Cổ Điển)',
      type: 'Nhà sàn',
      capacity: 6,
      capacityLabel: '5 - 6 khách',
      bed: '3 Giường Queen',
      floor: 'Tầng 1',
      price: 1500000,
      status: 'maintenance',
      guest: '',
      stay: 'Bảo trì hệ thống điện & quạt trần (17/09 - 18/09)',
      description: 'Không gian nhà sàn cổ của người Thái Trắng, thoáng mát, giữ nguyên vẹn cột gỗ nguyên khối.',
      amenities: ['Kiến trúc cổ', 'Quạt trần cổ điển', 'Hiên ngắm cảnh', 'Bếp nướng ngoài trời'],
      image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80',
      videos: []
    },
    {
      code: 'BUNG.105',
      name: 'Bungalow Tổ Chim Trên Đồi',
      type: 'Bungalow',
      capacity: 2,
      capacityLabel: '2 khách',
      bed: 'Giường tròn King',
      floor: 'Đỉnh đồi chè',
      price: 1600000,
      status: 'occupied',
      guest: 'Đặng Tuấn Kiệt',
      stay: '16/09 → 18/09 (Check-out mai)',
      description: 'Thiết kế tổ chim độc bản trên triền đồi, bao quát 360 độ thiên nhiên Mai Châu.',
      amenities: ['View 360 độ', 'Lưới ngắm mây ban công', 'Minibar miễn phí', 'Xe đạp địa hình'],
      image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80',
      videos: []
    }
  ],

  // Dữ liệu timeline 7 ngày (17/09 đến 23/09)
  timelineDays: [
    { key: '2026-09-17', dateNum: '17/09', dayName: 'T.3', isToday: true, isWeekend: false },
    { key: '2026-09-18', dateNum: '18/09', dayName: 'T.4', isToday: false, isWeekend: false },
    { key: '2026-09-19', dateNum: '19/09', dayName: 'T.5', isToday: false, isWeekend: false },
    { key: '2026-09-20', dateNum: '20/09', dayName: 'T.6', isToday: false, isWeekend: false },
    { key: '2026-09-21', dateNum: '21/09', dayName: 'T.7', isToday: false, isWeekend: true },
    { key: '2026-09-22', dateNum: '22/09', dayName: 'CN', isToday: false, isWeekend: true },
    { key: '2026-09-23', dateNum: '23/09', dayName: 'T.2', isToday: false, isWeekend: false }
  ],

  timelineRows: [
    {
      roomCode: 'P.101',
      roomShortName: 'P.101 - Garden',
      segments: [
        { span: 2, status: 'occupied', label: 'Lê Văn Hiếu (Check-out 12h)' },
        { span: 2, status: 'available', label: 'Trống' },
        { span: 2, status: 'booked', label: 'Đoàn anh Hưng (HN)' },
        { span: 1, status: 'available', label: 'Trống' }
      ]
    },
    {
      roomCode: 'P.201',
      roomShortName: 'P.201 - Mountain',
      segments: [
        { span: 4, status: 'booked', label: 'Nguyễn Thị Mai (Chờ nhận 16h)' },
        { span: 2, status: 'available', label: 'Ưu tiên đẩy bán cuối tuần' },
        { span: 1, status: 'available', label: 'Trống' }
      ]
    },
    {
      roomCode: 'BUNG.102',
      roomShortName: 'Bungalow Ven Suối',
      segments: [
        { span: 3, status: 'occupied', label: 'Hoàng Minh Anh' },
        { span: 3, status: 'booked', label: 'Trần Bảo An (3 đêm)' },
        { span: 1, status: 'available', label: 'Trống' }
      ]
    },
    {
      roomCode: 'DORM.01',
      roomShortName: 'Dorm Bản Đạo (12k)',
      segments: [
        { span: 5, status: 'available', label: 'Còn trống cả sàn (Nhận tour / trekking)' },
        { span: 2, status: 'booked', label: 'CLB Phượt Tây Bắc' }
      ]
    },
    {
      roomCode: 'P.104',
      roomShortName: 'Nhà Sàn Gỗ Lớn',
      segments: [
        { span: 2, status: 'maintenance', label: 'Bảo trì hệ thống điện & quạt trần' },
        { span: 5, status: 'available', label: 'Mở bán trở lại từ 19/09' }
      ]
    }
  ]
};
