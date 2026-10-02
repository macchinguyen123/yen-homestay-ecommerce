/* ==========================================================================
   MANAGE HOMESTAY DATA & CONFIGURATION
   ========================================================================== */

export const NEW_34_PROVINCES = [
  { id: "HN", name: "Thủ đô Hà Nội" },
  { id: "HUE", name: "Thành phố Huế" },
  { id: "HP", name: "Thành phố Hải Phòng (Hải Dương - Hải Phòng)" },
  { id: "DN", name: "Thành phố Đà Nẵng (Quảng Nam - Đà Nẵng)" },
  { id: "SG", name: "Thành phố Hồ Chí Minh (TPHCM - Bình Dương - Bà Rịa Vũng Tàu)" },
  { id: "CT", name: "Thành phố Cần Thơ (Cần Thơ - Sóc Trăng - Hậu Giang)" },
  { id: "AG", name: "Tỉnh An Giang (Kiên Giang - An Giang)" },
  { id: "BN", name: "Tỉnh Bắc Ninh (Bắc Giang - Bắc Ninh)" },
  { id: "CM", name: "Tỉnh Cà Mau (Bạc Liêu - Cà Mau)" },
  { id: "CB", name: "Tỉnh Cao Bằng" },
  { id: "DLK", name: "Tỉnh Đắk Lắk (Phú Yên - Đắk Lắk)" },
  { id: "DB", name: "Tỉnh Điện Biên" },
  { id: "DNA", name: "Tỉnh Đồng Nai (Bình Phước - Đồng Nai)" },
  { id: "DTP", name: "Tỉnh Đồng Tháp (Tiền Giang - Đồng Tháp)" },
  { id: "GL", name: "Tỉnh Gia Lai (Bình Định - Gia Lai)" },
  { id: "HT", name: "Tỉnh Hà Tĩnh" },
  { id: "HY", name: "Tỉnh Hưng Yên (Thái Bình - Hưng Yên)" },
  { id: "KH", name: "Tỉnh Khánh Hòa (Ninh Thuận - Khánh Hòa)" },
  { id: "LCZ", name: "Tỉnh Lai Châu" },
  { id: "LD", name: "Tỉnh Lâm Đồng (Đắk Nông - Bình Thuận - Lâm Đồng)" },
  { id: "LS", name: "Tỉnh Lạng Sơn" },
  { id: "LC", name: "Tỉnh Lào Cai (Yên Bái - Lào Cai)" },
  { id: "NA", name: "Tỉnh Nghệ An" },
  { id: "NB", name: "Tỉnh Ninh Bình (Hà Nam - Nam Định - Ninh Bình)" },
  { id: "PT", name: "Tỉnh Phú Thọ (Vĩnh Phúc - Hòa Bình - Phú Thọ)" },
  { id: "QNG", name: "Tỉnh Quảng Ngãi (Kon Tum - Quảng Ngãi)" },
  { id: "QN", name: "Tỉnh Quảng Ninh" },
  { id: "QT", name: "Tỉnh Quảng Trị (Quảng Bình - Quảng Trị)" },
  { id: "SL", name: "Tỉnh Sơn La" },
  { id: "TN", name: "Tỉnh Tây Ninh (Long An - Tây Ninh)" },
  { id: "TNG", name: "Tỉnh Thái Nguyên (Bắc Kạn - Thái Nguyên)" },
  { id: "TH", name: "Tỉnh Thanh Hóa" },
  { id: "TQ", name: "Tỉnh Tuyên Quang (Hà Giang - Tuyên Quang)" },
  { id: "VL", name: "Tỉnh Vĩnh Long (Bến Tre - Trà Vinh - Vĩnh Long)" }
];

export const SAMPLE_WARDS = [
  "Xã Chiềng Châu",
  "Xã Mường Sang",
  "Xã Tả Van",
  "Xã Bản Đôn",
  "Phường Mộc Sơn",
  "Phường Bắc Sơn",
  "Xã Đông Sang",
  "Thị trấn Mai Châu"
];

export const STANDARD_SERVICES = [
  "WiFi miễn phí",
  "Bể bơi vô cực",
  "Bữa sáng miễn phí",
  "Khu vực BBQ",
  "Đốt lửa trại",
  "Thuê xe máy"
];

export const INITIAL_HOMESTAYS = [
  {
    id: 1,
    name: "Nhà Sàn Mộc - Mai Châu",
    address: "Bản Lác 2, Chiềng Châu, Mai Châu, Hòa Bình",
    provinceId: "PT",
    ward: "Xã Chiềng Châu",
    specificAddress: "Bản Lác 2, Chiềng Châu, Mai Châu, Hòa Bình",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAGnGWIImij9NPRBfU9DeahKeC1MMScKaucpY8D_ZMNx4r9xAoUaziaeEGqzM81kX2fifUpHlam4_lEOHWgqi3-eLToUXNYsM22gaLBZ4eQBnE9IYpJPNFrx1O2U_Aj9b7fjtWuR0GccX5D3iWJQAn8kO1eOWaiZGmMMom_neKglwFHnhRV_ckaz1ok3X03kdzw_QojRSqJ3u1Nq29f6VU0x1dmk4Zw1XwU5Pyn6IsqcW26dDMGtk8",
    status: "active",
    revenue: "128.5M đ",
    occupancy: "74.2%",
    weeklyBookings: "24 đơn",
    rooms: 10,
    services: ["WiFi miễn phí", "Bữa sáng miễn phí", "Khu vực BBQ", "Đốt lửa trại"],
    customServices: ["Trekking bản làng", "Hưởng trà Shan Tuyết"],
    isCurrent: true,
  },
  {
    id: 2,
    name: "Mộc Retreat Pù Luông",
    address: "Bản Đôn, Bá Thước, Thanh Hóa",
    provinceId: "TH",
    ward: "Xã Bản Đôn",
    specificAddress: "Bản Đôn, Bá Thước, Thanh Hóa",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAn989bLjKGcMFRrMwKVMEQIMt3iLTFEKp7K4MYSMuQWu-sZNINyztXkYkSd63awFjRtTyIOJn86aCOtskgyUhAjTpKXUcoTK6VyTSg8PKYq8Z2N0mQpxB40iIs1K5812ADHq9KrbCoiMQGZUzbi8NOEFAkHmN7e67janEICbRUaJwXj_xxqvIzUqjf8WTkfQP5m30lFo400yhUWSp4CkYU8LtTA5AvggM4xoKmL00za8i5AHz9Swc",
    status: "active",
    revenue: "185.2M đ",
    occupancy: "81.5%",
    weeklyBookings: "38 đơn",
    rooms: 12,
    services: ["WiFi miễn phí", "Bể bơi vô cực", "Bữa sáng miễn phí", "Thuê xe máy"],
    customServices: ["Chèo bè mảng sông Chăm"],
    isCurrent: false,
  },
  {
    id: 3,
    name: "Bản Mộc Sapa Ecolodge",
    address: "Tả Van, Sa Pa, Lào Cai",
    provinceId: "LC",
    ward: "Xã Tả Van",
    specificAddress: "Tả Van, Sa Pa, Lào Cai",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDERh_gPlOt5_9heNTjgHPPaOckJ6ze0300GjAY1eXRwuAvnGBI85cEpscqL3hrk1KQUXbvchYGtxpt4YqKDdOenfYbw8-R9LtdUq2nPYBCGy1OKB3LbJzP2QDfGWkgEgzPaAt8kfWSYCeWjmTwoF-JNElxTBtZvqH3eL8Da3QU-mXOO0wtTt5jhBqeGhA4xQkoepUUYG2-CW9gcntgu7YbBehCqMaPEGZeSYDQXSrLqvT_luFruAU",
    status: "locked",
    revenue: "0 đ",
    occupancy: "Tạm khóa",
    weeklyBookings: "Tháng 11",
    lockType: "Bảo trì / nâng cấp cơ sở",
    lockNote: "Nâng cấp hệ thống sưởi mùa đông",
    lockUntil: "2026-11-01",
    rooms: 8,
    services: ["WiFi miễn phí", "Khu vực BBQ"],
    customServices: ["Tắm lá thuốc người Dao"],
    isCurrent: false,
  },
  {
    id: 4,
    name: "Nhà Bên Suối Mộc Châu",
    address: "Bản Áng, Đông Sang, Mộc Châu, Sơn La",
    provinceId: "SL",
    ward: "Xã Đông Sang",
    specificAddress: "Bản Áng, Đông Sang, Mộc Châu, Sơn La",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuD_egshJIKTXnjUPIqqRx6ADSxcVFL-LoCf8ElKI3eAFRLYoNEnEsLNhUiDhYfBxCe2GLIDX5VndszRBOhvMJO4URv5hrpPpVMp6pyoZviTSCpG9b8DxXLgICoJ13KygZ6-JViV1PIRjpLfM8Zf_-wAYMVNSBin0JQREbZzLQDGAPpWH5IEpqqLYT8NQfLi58Fu4S4s-442vGBhFE97dIfGeZ8KVH1aOqKYXpb9HwOul9ZG49gAAwU",
    status: "active",
    revenue: "94.0M đ",
    occupancy: "76.0%",
    weeklyBookings: "19 đơn",
    rooms: 6,
    services: ["WiFi miễn phí", "Khu vực BBQ", "Thuê xe máy"],
    customServices: ["Hái mận tại vườn"],
    isCurrent: false,
  }
];

export const STAFF_PERM_GROUPS = [
  {
    title: 'Đặt phòng & lưu trú',
    items: [
      ['booking_view', 'Xem danh sách đặt phòng'],
      ['booking_edit', 'Tạo / sửa đặt phòng'],
      ['booking_cancel', 'Hủy đặt phòng / hoàn tiền'],
      ['checkin', 'Check-in / Check-out khách']
    ]
  },
  {
    title: 'Tài chính',
    items: [
      ['fin_view', 'Xem doanh thu & báo cáo'],
      ['fin_cash', 'Thu tiền mặt'],
      ['fin_expense', 'Ghi nhận & duyệt chi']
    ]
  },
  {
    title: 'Vận hành cơ sở',
    items: [
      ['room_manage', 'Quản lý phòng & giá'],
      ['staff_manage', 'Quản lý nhân sự ca trực'],
      ['settings', 'Chỉnh sửa thông tin cơ sở']
    ]
  }
];

export const ALL_STAFF_PERMS = STAFF_PERM_GROUPS.flatMap(g => g.items.map(i => i[0]));

export const STAFF_PERM_REQUIRES = {
  booking_edit: 'booking_view',
  booking_cancel: 'booking_edit',
  fin_cash: 'fin_view',
  fin_expense: 'fin_view'
};

export const STAFF_PRESETS = {
  full: { label: 'Toàn quyền vận hành cơ sở', perms: ALL_STAFF_PERMS },
  cash: { label: 'Quyền xem & thu tiền mặt', perms: ['booking_view', 'checkin', 'fin_view', 'fin_cash'] },
  frontdesk: { label: 'Chỉ tiếp tân & check-in phòng', perms: ['booking_view', 'booking_edit', 'checkin'] },
  viewonly: { label: 'Chỉ xem', perms: ['booking_view'] },
  custom: { label: 'Tùy chỉnh', perms: null }
};

export const ROLE_DEFAULT_PRESET = {
  manager: 'full',
  receptionist: 'frontdesk',
  accountant: 'cash',
  housekeeping: 'viewonly'
};

export const INITIAL_STAFF_ASSIGNMENTS = [
  {
    id: 1,
    homestayName: 'Nhà Sàn Mộc - Mai Châu',
    manager: 'Hà Thị Mai (0984.***.219)',
    staffCount: 3,
    financeAccess: 'Quyền xem & thu tiền mặt',
    rolePreset: 'cash'
  },
  {
    id: 2,
    homestayName: 'Mộc Retreat Pù Luông',
    manager: 'Lò Văn Thao (0912.***.388)',
    staffCount: 4,
    financeAccess: 'Toàn quyền thu chi',
    rolePreset: 'full'
  },
  {
    id: 3,
    homestayName: 'Bản Mộc Sapa Ecolodge',
    manager: 'Giàng A Súa (0977.***.112)',
    staffCount: 1,
    financeAccess: 'Chỉ xem báo cáo',
    rolePreset: 'viewonly'
  },
  {
    id: 4,
    homestayName: 'Nhà Bên Suối Mộc Châu',
    manager: 'Nguyễn Thu Trang (0963.***.879)',
    staffCount: 2,
    financeAccess: 'Quyền xem & thu tiền mặt',
    rolePreset: 'cash'
  }
];
