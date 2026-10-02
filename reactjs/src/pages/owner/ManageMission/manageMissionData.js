/* ==========================================================================
   MANAGE MISSION DATA & CONFIGURATION
   ========================================================================== */

export const INITIAL_METRICS = {
  activeMissions: 4,
  pendingToday: 8,
  participantGuests: 142,
  rewardedVouchers: 96,
};

export const INITIAL_SUBMISSIONS = [
  {
    id: "S001",
    guest: "Trần Thị Hương",
    room: "Phòng Garden View",
    time: "09:12 • 17/09/2026",
    taskType: "costume",
    task: "Mặc trang phục dân tộc Thái chụp ảnh bên khung dệt thổ cẩm Nhà Sàn Mộc",
    review: "Không gian nhà sàn Mai Châu quá tuyệt vời, cô chủ chỉ cách dệt vải rất tận tình! Mùa lúa chín này chắc chắn nhóm mình sẽ rủ bạn bè quay lại.",
    reward: "Voucher 15% + 1 túi trà gạo lứt Mộc Châu",
    photos: 1,
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDtBD2J0dMb6ui-jzFd-s3WAOrIcULKNiD9XtfnGxQMKSTx355Pf1EjERQXBHDwHrcQ0Rorvh9B6EK8HB6KmTt_y_Vmq08HXH1mv79H5Vu9HA98ZemUl4gMQKLX8UE6D4XyoH4aj98giLTIomA-cZpFPmBtgmFxgoZt0ZKA5x-4LkgkGP-hJ2DyiPrZOmmqIdCcd6okDRUACpFaDNJU99_AMzc9ReyPXk77zeU4Z5vnxIG6w4_nVg8",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAwxRCSb8O0TEvP8qWKkyBWYmOPRU7CAe-lU0L0LMkQVLCWwT-WPYALrACR8Db8vw3_4jArbeXHHO_9d76yf7xm93aRwrudcovcbdkH-3EQrrGzyVg0iJ-Mvu69r8SV1GpbtRs1onXyn8r2zhoo3AUha2-9zCn4Myw7IYvyDRyt2uYN6sGiBB77aieKV_8H49oOFbrdmjYwsetb-x5cKFX4PCfWM-yOuk8sjzC85RU_W3_1EPQSU6E",
    status: "pending" // 'pending' | 'approved' | 'rejected' | 'retake'
  },
  {
    id: "S002",
    guest: "Lê Văn Hiếu",
    room: "Phòng Lake View",
    time: "08:35 • 17/09/2026",
    taskType: "food",
    task: "Thưởng thức và đánh giá mâm cơm lam cá suối nướng",
    review: "Cá suối ướp mắc khén nướng than giòn bì thơm nức mũi, ăn cùng cơm lam dẻo quánh đúng điệu bản Mường - Thái. Điểm 10 chất lượng!",
    reward: "Voucher giảm 50.000đ dịch vụ ăn uống lần sau",
    photos: 2,
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCf_GZrWvs5PbldzGsECiknjV3jiAuHqF3qQ0vTTpwxRImEmzWcmrBQnpJQPLCNdqaSQyoDm9EP7lyCzAelYHSu6XVwxZuLvuR4SmH4_n1_jLQqsked0ttQNeszq6kP3dH8Eg7Q0znPXhxfzPh9u3nJRtVOB9jjoxAwXHammtyBVEsTPjxOl7oC4sF5gCPWoEmUCpzteXKyDXMyoeC4SLHip0BteQKWK18gnncNJ8HpdsRhQh3I9Kk",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDdBW9ILAd7dvQBEAbmNPGGhivvXfCDDDvtJC4zDg-IGR1XGnQHtA4M57KLjUy_o5-9yqHoF2Uw6AzbXIbXr5JqBg7pqGmVdmi9S8BlHDTQdO6pnk9LM39hh_l_uGgmUtz0c2c8-reOCnTG3SQFP-16zq1RahEvEE-quDqEvGgOYS040aA0FBxBWtVpWrgycH8PZGR5baQ2OB7L6FqQiMNaMef1HWMQ97YLH41-3qmRgcbG08VxzIo",
    status: "pending"
  }
];

export const INITIAL_MISSIONS = [
  {
    id: "M001",
    title: "Check-in bình minh thung lũng Mai Châu",
    desc: "Chụp ảnh góc ban công hoặc sân vườn lúc sương sớm, gắn thẻ định vị Nhà Sàn Mộc kèm hashtag #NhaSanMoc.",
    icon: "wb_sunny",
    rewardType: "voucher-percent",
    rewardValue: "10",
    rewardExtra: "",
    given: 48,
    status: "active" // 'active' | 'paused'
  },
  {
    id: "M002",
    title: "Làm cơm lam cùng nghệ nhân Làng Cố",
    desc: "Trải nghiệm tự tay cho gạo nếp nương vào ống tre và nướng bên bếp lửa hồng cùng đồng bào dân tộc Thái.",
    icon: "outdoor_grill",
    rewardType: "points",
    rewardValue: "50",
    rewardExtra: "Quà nông sản lưu niệm",
    given: 32,
    status: "active"
  },
  {
    id: "M003",
    title: "Đánh giá 5 sao kèm 3 ảnh thực tế",
    desc: "Để lại nhận xét chân thực trên Google Maps hoặc nền tảng Booking về trải nghiệm bình yên tại Nhà Sàn Mộc.",
    icon: "star",
    rewardType: "voucher-amount",
    rewardValue: "100000",
    rewardExtra: "",
    given: 16,
    status: "active"
  },
  {
    id: "M004",
    title: "Trekking khám phá bản Lác 2 mùa lúa chín",
    desc: "Ghi lại 3 khoảnh khắc đẹp trên cung đường ruộng bậc thang và chia sẻ vị trí bản Lác 2.",
    icon: "hiking",
    rewardType: "gift",
    rewardValue: "Khăn thổ cẩm thủ công",
    rewardExtra: "",
    given: 24,
    status: "active"
  }
];

export const INITIAL_TOP_GUESTS = [
  {
    id: 1,
    name: "Hoàng Lan Anh",
    points: 280,
    completed: 5,
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBM2p3xVWdv84AVmzpSgASDhrTJWBslvj9gqrIocFGTSa80ihcG4lcehUXD1yur0QqYvgSIR0sfQCQbHDpnxmX1B0NbaARMi116qNnbisQ0_sqa7JgXnyQMhoHPY3Iaa6L9k-FDayYklK7Ks29G59GDVm9uzDeX5qG0840EGEfjLUks1387sY1oCLzpTjUC20f3HXCH8CWYiCNJN_ZJn-tL-9zKgl6nGoxmg9otBPZcuWuo7KO-gIs"
  },
  {
    id: 2,
    name: "Đặng Quốc Tuấn",
    points: 210,
    completed: 4,
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuA0rpyMEE5nGfTtsGVNH0sMheHl0xL1Nh0I0T-S0mogDCf6_L8_WRKYd64wVjiFp7cvZSEDHbFEWziQgnMt0GhnTe0edIUHtKRJm83_Sv89eOqGYW7W2BMeTfOVi4kk4Ibmmx6vMgct7iPbSym5riRvts5r-eU0BoWYXDTjuaJ_PEZKAK1RwD3k5-xXkPa90Nu_AOfJjC5EqzLDQQ83CfkChif6Q4OZqPNIoovOTXyj_auiAKAO_7A"
  },
  {
    id: 3,
    name: "Nguyễn Phương Linh",
    points: 160,
    completed: 3,
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuD9O0vFuEGIJVTJSeQK1Jsp5j_IwhXL8ChEXsaM2bcG8OloI7TUCJqlm1Elu0BoIc245q_cEfERzfQklJm6qzTuFaMFG40CKliwBhKhDEUEzQwIS7TvPbSs8K83acaQrBvueOnC0JnWBpBNoyTDir47BjOTPRqu0JzImfPchOEaGcPvrymkvuwOa3BGdP-3q1W7vVYFHRay8HiBPzs0SozC7OxtIDZT_uOXzNdiKbM26xrEKZHRyWY"
  }
];

export const INITIAL_REWARD_STOCK = [
  { id: 1, name: 'Voucher giảm 10%', type: 'Voucher', qty: 60 },
  { id: 2, name: 'Voucher 100.000₫ trừ thẳng', type: 'Voucher', qty: 40 },
  { id: 3, name: 'Túi trà gạo lứt Mộc Châu', type: 'Quà tặng', qty: 25 },
  { id: 4, name: 'Quà nông sản lưu niệm', type: 'Quà tặng', qty: 30 }
];
