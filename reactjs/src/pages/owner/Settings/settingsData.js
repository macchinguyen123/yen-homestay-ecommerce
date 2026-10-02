// Mock data cho Cài đặt tài khoản chủ nhà (Owner Settings)

export const initialSettingsData = {
  profile: {
    fullName: 'Nguyễn Hòa',
    initials: 'NH',
    role: 'Chủ homestay',
    email: 'nguyenhoa@nhasanmoc.vn',
    phone: '0912 345 678',
    birthday: '1990-05-20',
    address: 'Bản Lác, Chiềng Châu, Mai Châu, Hòa Bình',
    joinDate: '12/03/2024',
    status: 'Đang hoạt động',
    isVerified: true,
    avatarUrl: null
  },

  bankAccounts: [
    {
      id: 'bank-1',
      bankName: 'Vietcombank',
      accountNumber: '0123456789',
      accountName: 'NGUYEN HOA',
      branch: 'Chi nhánh Hòa Bình',
      isDefault: true,
      verified: true
    },
    {
      id: 'bank-2',
      bankName: 'MB Bank',
      accountNumber: '9988776655',
      accountName: 'NGUYEN HOA',
      branch: 'Chi nhánh Mai Châu',
      isDefault: false,
      verified: false
    }
  ],

  notifications: [
    {
      id: 'noti-1',
      category: 'booking',
      icon: 'event_available',
      title: 'Đặt phòng mới • Mountain View 201',
      message: 'Nguyễn Thị Mai vừa đặt phòng cho 17/09 → 20/09 và đã cọc 50%.',
      minutesAgo: 12,
      unread: true
    },
    {
      id: 'noti-2',
      category: 'payment',
      icon: 'payments',
      title: 'Thanh toán thành công',
      message: 'Đã nhận 600.000₫ tiền cọc từ khách Lê Văn Hiếu qua Vietcombank.',
      minutesAgo: 48,
      unread: true
    },
    {
      id: 'noti-3',
      category: 'system',
      icon: 'build',
      title: 'Nhắc lịch bảo trì',
      message: 'Nhà Sàn Gỗ Lớn đang trong thời gian bảo trì điện & quạt trần đến 19/09.',
      minutesAgo: 130,
      unread: true
    },
    {
      id: 'noti-4',
      category: 'booking',
      icon: 'cancel',
      title: 'Khách hủy đặt phòng',
      message: 'Một lượt đặt phòng Dorm Bản Đạo đã bị hủy do khách đổi lịch trình.',
      minutesAgo: 620,
      unread: false
    },
    {
      id: 'noti-5',
      category: 'system',
      icon: 'campaign',
      title: 'Cập nhật chính sách hoa hồng',
      message: 'Chính sách hoa hồng kênh OTA sẽ điều chỉnh từ ngày 01/10.',
      minutesAgo: 1600,
      unread: false
    }
  ],

  notificationChannels: [
    {
      id: 'booking',
      label: 'Đặt phòng & hủy phòng',
      desc: 'Khi có đặt phòng mới, đổi phòng hoặc huỷ phòng.',
      email: true,
      sms: true,
      push: true
    },
    {
      id: 'payment',
      label: 'Thanh toán & hoàn tiền',
      desc: 'Khi nhận cọc, thanh toán hoặc xử lý hoàn tiền.',
      email: true,
      sms: true,
      push: true
    },
    {
      id: 'promotion',
      label: 'Khuyến mãi & tiếp thị',
      desc: 'Gợi ý chương trình ưu đãi để tăng tỉ lệ lấp đầy phòng.',
      email: true,
      sms: false,
      push: false
    },
    {
      id: 'system',
      label: 'Hệ thống & bảo trì',
      desc: 'Nhắc lịch bảo trì, thay đổi chính sách nền tảng.',
      email: true,
      sms: false,
      push: true
    }
  ]
};
