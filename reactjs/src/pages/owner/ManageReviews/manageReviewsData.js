// Mock data cho Quản lý Đánh giá & Phản hồi du khách
export const initialReviewsData = {
  stats: {
    averageRating: 4.92,
    maxRating: 5.0,
    responseRate: 98.5,
    unrepliedCount: 3,
    mediaReviewsCount: 86,
    totalReviews: 148,
    ratingDistribution: {
      5: 124,
      4: 18,
      3: 4,
      2: 1,
      1: 1
    }
  },

  criteriaAnalysis: [
    { name: 'Thái độ phục vụ & Hiếu khách', score: 5.0, max: 5.0, percentage: 100 },
    { name: 'Vị trí & Cảnh quan thiên nhiên', score: 4.95, max: 5.0, percentage: 98 },
    { name: 'Vệ sinh buồng phòng & Khuôn viên', score: 4.90, max: 5.0, percentage: 95 },
    { name: 'Dịch vụ ẩm thực bản địa', score: 4.90, max: 5.0, percentage: 95 },
    { name: 'Giá trị trải nghiệm tương xứng', score: 4.85, max: 5.0, percentage: 92 }
  ],

  frequentKeywords: [
    { text: 'Cơm lam thơm ngon', count: 42, highlight: true },
    { text: 'View mây Mai Châu', count: 38, highlight: true },
    { text: 'Chủ nhà hiếu khách', count: 35, highlight: true },
    { text: 'Suối nước trong lành', count: 28, highlight: false },
    { text: 'Đốt lửa trại vui', count: 24, highlight: false },
    { text: 'Cá suối mắc khén', count: 19, highlight: false },
    { text: 'Bình yên', count: 15, highlight: false },
    { text: 'Không gian ấm cúng', count: 12, highlight: false }
  ],

  quickTemplates: [
    {
      id: 1,
      tone: 'Cảm kích & Ấm áp',
      text: 'Dạ Nhà Sàn Mộc xin chân thành cảm ơn bạn và gia đình đã tin yêu lựa chọn homestay. Chúc bạn luôn bình an và nhiều niềm vui!'
    },
    {
      id: 2,
      tone: 'Cầu thị & Tiếp thu',
      text: 'Cảm ơn bạn đã đóng góp ý kiến rất chân thực. Mộc sẽ nhanh chóng bổ sung và nâng cấp tiện ích để phục vụ chu đáo hơn trong lần tới!'
    },
    {
      id: 3,
      tone: 'Hẹn hội ngộ',
      text: 'Rất vui khi được đón tiếp bạn! Hẹn gặp lại bạn vào mùa hoa mận và lúa chín sắp tới tại bản làng nhé!'
    }
  ],

  roomTypes: [
    'Tất cả loại phòng',
    'Mountain View 201',
    'Bungalow Ven Suối 102',
    'Nhà Sàn Tập Thể'
  ],

  reviews: [
    {
      id: 'rv-101',
      customerName: 'Nguyễn Thị Mai',
      customerInitials: 'NM',
      customerType: 'Khách quen (3 chuyến)',
      roomName: 'Mountain View 201',
      stayPeriod: '14/10 - 16/10/2024',
      rating: 5,
      createdAt: '2 ngày trước',
      content: 'Chuyến đi Mai Châu tuyệt vời hơn kỳ vọng rất nhiều! Phòng 201 có ban công ngắm trọn thung lũng, sáng sớm mở cửa mây lững lờ trôi vào tận giường luôn. Anh An chủ nhà vô cùng chu đáo, tự tay chuẩn bị món cá suối nướng mắc khén thơm lừng và chèn trà shan tuyết ấm nóng. Không gian sạch sẽ, ấm cúng và giữ được trọn vẹn nét văn hóa nhà sàn Thái cổ. Chắc chắn gia đình mình sẽ quay lại vào dịp cuối năm!',
      images: [
        {
          url: 'https://afamilycdn.com/2017/img20170804094854699.jpg',
          caption: 'Ban công ngắm mây'
        },
        {
          url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?q=80&w=600&auto=format&fit=crop',
          caption: 'Cá suối nướng'
        },
        {
          url: 'https://maichau.ecolodge.asia/ckfinder/userfiles/images/nha-san-nguoi-thai-dac-sac-3.jpg',
          caption: 'Kiến trúc Nhà Sàn'
        }
      ],
      reply: {
        hostName: 'Nhà Sàn Mộc (Chủ nhà An)',
        repliedAt: '1 ngày trước',
        voucherCode: 'TRIANMOC10',
        content: 'Dạ Nhà Sàn Mộc xin chân thành cảm ơn chị Mai và gia đình đã gửi gắm những ngày nghỉ thu trọn vẹn tại bản làng. Mộc rất vui khi chị yêu thích món cá suối nướng! Em đã gửi tặng chị mã ưu đãi TRIANMOC10 giảm 10% cho kỳ nghỉ mùa hoa mận tháng 12 tới. Chúc chị và gia đình luôn dồi dào sức khỏe và bình an!'
      }
    },
    {
      id: 'rv-102',
      customerName: 'Hoàng Minh Anh',
      customerInitials: 'HA',
      customerType: 'Khách vãng lai',
      roomName: 'Bungalow Ven Suối 102',
      stayPeriod: '16/10 - 18/10/2024',
      rating: 5,
      createdAt: 'Mới 8h trước',
      content: 'Không gian tĩnh lặng đúng nghĩa để healing. Đêm nằm trong bungalow nghe tiếng suối chảy róc rách cực kỳ dễ ngủ. Đặc biệt là bạn hướng dẫn viên người bản địa dẫn tour trekking đồi chè và thác Pùng rất nhiệt tình, am hiểu từng nếp sinh hoạt địa phương. 10/10 điểm cho sự hiếu khách!',
      images: [],
      reply: null
    },
    {
      id: 'rv-103',
      customerName: 'Trần Quốc Bảo',
      customerInitials: 'TB',
      customerType: 'Nhóm phượt 6 người',
      roomName: 'Nhà Sàn Tập Thể',
      stayPeriod: '17/10 - 18/10/2024',
      rating: 4,
      createdAt: '1 ngày trước',
      content: 'Không khí trong lành tuyệt đối, ngắm trọn cảnh đồng lúa chín vàng ươm. Đồ ăn buổi tối rất ngon và ấm cúng. Tuy nhiên vào buổi trưa mùa hè thì gian nhà sàn hơi hầm nóng một chút, homestay nên bổ sung thêm quạt cây công suất lớn hoặc bố trí rèm che nắng hướng tây để giấc trưa thoải mái hơn nhé.',
      images: [],
      reply: null
    },
    {
      id: 'rv-104',
      customerName: 'Lê Thuỳ Dung',
      customerInitials: 'TD',
      customerType: 'Cặp đôi',
      roomName: 'Bungalow Ven Suối 102',
      stayPeriod: '12/10 - 14/10/2024',
      rating: 5,
      createdAt: '4 ngày trước',
      content: 'Trải nghiệm ngâm chân thảo dược suối nước nóng và thưởng thức trà tối bên bếp than hồng cùng các cô chú bản địa là kỷ niệm không thể quên. Phòng sạch, thơm mùi gỗ pơ mu tự nhiên. Rất đáng tiền!',
      images: [
        {
          url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=600&auto=format&fit=crop',
          caption: 'Bếp than thảo dược'
        }
      ],
      reply: {
        hostName: 'Nhà Sàn Mộc (Chủ nhà An)',
        repliedAt: '3 ngày trước',
        voucherCode: null,
        content: 'Cảm ơn Thùy Dung và bạn đã dành tình cảm ấm áp cho Mộc. Hy vọng bếp lửa và tiếng suối vùng cao sẽ luôn là chốn bình yên chào đón bạn ghé về!'
      }
    },
    {
      id: 'rv-105',
      customerName: 'Phạm Duy Khoa',
      customerInitials: 'DK',
      customerType: 'Khách công tác kết hợp nghỉ dưỡng',
      roomName: 'Mountain View 201',
      stayPeriod: '10/10 - 12/10/2024',
      rating: 3,
      createdAt: '5 ngày trước',
      content: 'Cảnh đẹp và phòng ốc sạch sẽ. Nhưng wifi ở góc ban công hơi yếu lúc họp online buổi tối. Mong homestay tăng cường thêm bộ phát wifi phụ ở sảnh tầng 2.',
      images: [],
      reply: null
    }
  ]
};
