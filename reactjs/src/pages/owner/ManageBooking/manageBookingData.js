export const INITIAL_BOOKINGS_DATA = [
  {
    id: "BK-9842",
    source: "OTA Sàn VN",
    guestName: "Nguyễn Thị Mai",
    phone: "0982 341 112",
    email: "mai.nguyen@gmail.com",
    cccd: "001198034521",
    avatar: "M",
    avatarBg: "bg-secondary",
    avatarImg: "https://lh3.googleusercontent.com/aida-public/AB6AXuA0LFSerZuRWRa-xYFKGn0v9Z7yaO3TJcniYry7vFR_CNLVdUzBx82AtU9qTsUosSm_cVRV-LR_jKwTuoFPG-EeKZkuXgN-XFKhCKmGUPU95IYF-Neyeva84ZwupG97XUHWs8qt5O8BKkpjXazR3XTGVmtlpdT64Cal4NtBQx_mNvBXaGg33t8hGkimNQpk6iGHK7QXHMZkp17dvnr72Tgr-dgQV9ur5Zr1URU3oLW1q2Pndz6dbLs",
    city: "Quận Cầu Giấy, Hà Nội",
    roomType: "Phòng Mountain View (Nhà Gỗ)",
    roomCode: "Mountain View #01",
    guestsCount: "2 người lớn",
    checkIn: "17/09/2024",
    checkInTime: "14:00 (Hôm nay)",
    checkOut: "20/09/2024",
    checkOutTime: "12:00",
    nights: 3,
    depositStatus: "Đã thanh toán sàn",
    depositAmount: 1500000,
    totalAmount: 2850000,
    remainAmount: 1350000,
    status: "Chờ Check-in",
    statusBadge: "status-checkin",
    specialRequest: "Ăn tối cơm lam thịt nướng tại homestay lúc 18h30. Nhờ chuẩn bị trước lò nướng than mộc ngoài sân.",
    services: [
      { name: "Cơm lam thịt nướng Mai Châu", qty: 2, price: 180000, total: 360000 }
    ],
    timeline: [
      { title: "Đặt phòng trực tuyến qua Sàn OTA", time: "15/09/2024 10:20", status: "done" },
      { title: "Sàn xác nhận giữ cọc 1.500.000đ", time: "15/09/2024 10:25", status: "done" },
      { title: "Chuẩn bị phòng Mountain View #01", time: "17/09/2024 11:30", status: "done" },
      { title: "Chờ khách check-in và nhận phòng", time: "Hôm nay 14:00", status: "current" }
    ]
  },
  {
    id: "BK-9839",
    source: "Trực tiếp",
    guestName: "Lê Văn Hiếu",
    phone: "0915 884 920",
    email: "hieule.van@outlook.com",
    cccd: "034093012845",
    avatar: "H",
    avatarBg: "bg-primary",
    city: "TP. Nam Định",
    roomType: "Phòng Lake View (Ven Hồ)",
    roomCode: "Lake View #02",
    guestsCount: "2 người lớn",
    checkIn: "16/09/2024",
    checkInTime: "14:00",
    checkOut: "18/09/2024",
    checkOutTime: "12:00 (Mai trả phòng)",
    nights: 2,
    depositStatus: "Đã cọc 50% tiền mặt",
    depositAmount: 1000000,
    totalAmount: 2200000,
    remainAmount: 1200000,
    status: "Đang ở",
    statusBadge: "status-staying",
    specialRequest: "Bổ sung thêm củi lửa trại và ngô nướng ngoài thềm tối nay lúc 20h00.",
    services: [
      { name: "Thuê xe máy dạo bản Lác (1 ngày)", qty: 1, price: 150000, total: 150000 },
      { name: "Set lửa trại & bắp khoai nướng", qty: 1, price: 250000, total: 250000 }
    ],
    timeline: [
      { title: "Tạo đơn đặt phòng trực tiếp qua Zalo", time: "12/09/2024 14:00", status: "done" },
      { title: "Đã nhận cọc chuyển khoản 1.000.000đ", time: "12/09/2024 14:15", status: "done" },
      { title: "Đã Check-in nhận phòng Lake View #02", time: "16/09/2024 14:10", status: "done" },
      { title: "Đang lưu trú tại Homestay", time: "Hiện tại", status: "current" }
    ]
  },
  {
    id: "BK-9830",
    source: "OTA Sàn VN",
    guestName: "Phạm Thị Lan",
    phone: "0903 442 771",
    email: "lanpham.vn@gmail.com",
    cccd: "025091004523",
    avatar: "L",
    avatarBg: "bg-gray",
    city: "Quận 1, TP. Hồ Chí Minh",
    roomType: "Bungalow Suối",
    roomCode: "Bungalow Suối #01",
    guestsCount: "4 người lớn",
    checkIn: "14/09/2024",
    checkInTime: "14:00",
    checkOut: "16/09/2024",
    checkOutTime: "12:00 (Đã trả hôm qua)",
    nights: 2,
    depositStatus: "Đã quyết toán",
    depositAmount: 1500000,
    totalAmount: 3100000,
    remainAmount: 0,
    status: "Đã hoàn tất",
    statusBadge: "status-completed",
    specialRequest: "Đoàn gia đình có trẻ em, nhờ chuẩn bị bữa sáng xôi nếp nương Mai Châu.",
    services: [
      { name: "Phòng Bungalow Suối (2 đêm)", qty: 2, price: 1250000, total: 2500000 },
      { name: "Mẹt ẩm thực Tây Bắc & Gà đồi nướng", qty: 1, price: 600000, total: 600000 }
    ],
    invoiceNo: "HD-20240916-003",
    invoiceDate: "16/09/2024 11:45",
    timeline: [
      { title: "Khách đặt phòng trên OTA Sàn VN", time: "10/09/2024 09:12", status: "done" },
      { title: "Check-in Bungalow Suối #01", time: "14/09/2024 14:05", status: "done" },
      { title: "Sử dụng set ẩm thực gà đồi xôi nếp", time: "15/09/2024 19:00", status: "done" },
      { title: "Check-out & Thanh toán hoàn tất", time: "16/09/2024 11:45", status: "done" }
    ]
  },
  {
    id: "BK-9850",
    source: "Web Homestay",
    guestName: "Trần Tuấn Kiệt",
    phone: "0977 123 445",
    email: "tuankiet.tran@gmail.com",
    cccd: "031094002931",
    avatar: "K",
    avatarBg: "bg-amber",
    city: "TP. Hải Phòng",
    roomType: "Nhà Sàn Trải Nghiệm",
    roomCode: "Nhà Sàn Tập Thể",
    guestsCount: "6 khách đoàn",
    checkIn: "18/09/2024",
    checkInTime: "14:00 (Ngày mai đến)",
    checkOut: "20/09/2024",
    checkOutTime: "12:00",
    nights: 2,
    depositStatus: "Chờ duyệt cọc",
    depositAmount: 2100000,
    totalAmount: 4200000,
    remainAmount: 2100000,
    status: "Chờ xác nhận",
    statusBadge: "status-pending",
    specialRequest: "Đoàn chụp ảnh kỷ yếu, nhờ hỗ trợ 6 bộ trang phục Thái và chuẩn bị loa kéo hát giao lưu.",
    bankTransferInfo: {
      bankName: "Vietcombank - Chi nhánh Tây Hà Nội",
      accountNumber: "0491000128932",
      accountName: "HOMESTAY NHA SAN MOC",
      amountTransferred: "2.100.000 VNĐ",
      transferContent: "BK9850 Tran Tuan Kiet dat phong nha san",
      transferDate: "17/09/2024 08:35:12",
      transferCode: "FT24261899201"
    },
    services: [],
    timeline: [
      { title: "Khách gửi yêu cầu đặt phòng trên Website", time: "17/09/2024 08:20", status: "done" },
      { title: "Khách chuyển khoản tiền cọc 50%", time: "17/09/2024 08:35", status: "done" },
      { title: "Chờ chủ Homestay đối soát ngân hàng", time: "Hiện tại", status: "current" }
    ]
  }
];

export const AVAILABLE_SERVICES = [
  { name: "Cơm lam & Thịt nướng Mai Châu", price: 180000, unit: "suất (kèm muối vừng)", icon: "restaurant", color: "#16a34a" },
  { name: "Gà đồi nướng than mộc mắc khén", price: 280000, unit: "con (nướng nguyên con)", icon: "local_fire_department", color: "#ea580c" },
  { name: "Thuê xe máy dạo bản Lác", price: 150000, unit: "ngày (đầy bình xăng)", icon: "two_wheeler", color: "#0284c7" },
  { name: "Set lửa trại & bắp khoai nướng", price: 250000, unit: "set (củi nứa + 10 bắp khoai)", icon: "camping", color: "#d97706" },
  { name: "Thuê trang phục dân tộc Thái chụp ảnh", price: 80000, unit: "bộ (kèm khăn piêu & phụ kiện)", icon: "styler", color: "#9333ea" }
];

export const ROOM_STATUS_TODAY = [
  { room: "P. Mountain 01", desc: "Chờ Mai (14h00)", color: "green" },
  { room: "P. Lake View 02", desc: "Lê Văn Hiếu (Đang ở)", color: "blue" },
  { room: "Bungalow Suối 01", desc: "Trống (Đã dọn dẹp)", color: "gray" },
  { room: "Nhà Sàn Tập Thể", desc: "Khách mai đến (6 ng)", color: "amber" }
];

export function formatVND(amount) {
  return `${Number(amount || 0).toLocaleString('vi-VN')}đ`;
}
