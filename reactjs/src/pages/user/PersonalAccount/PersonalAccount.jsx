import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./PersonalAccount.css";
import { userService } from "../../../services/userService";
import { authService } from "../../../services/authService";

const PROVINCES_DATA = [
  { code: "HN", name: "Hà Nội", wards: ["Ba Đình", "Hoàn Kiếm", "Tây Hồ", "Cầu Giấy"] },
  { code: "DN", name: "Đà Nẵng", wards: ["Hải Châu", "Sơn Trà", "Ngũ Hành Sơn", "Thanh Khê"] },
  { code: "HCM", name: "TP. Hồ Chí Minh", wards: ["Quận 1", "Quận 3", "Quận 7", "Bình Thạnh", "Thủ Đức"] },
  { code: "LD", name: "Lâm Đồng", wards: ["Phường 1 (Đà Lạt)", "Phường 2 (Đà Lạt)", "Phường 10 (Đà Lạt)", "Xã Xuân Thọ"] },
  { code: "LC", name: "Lào Cai", wards: ["Phường Sa Pa", "Xã Tả Van", "Xã Hầu Thào", "Xã Mường Hoa"] },
  { code: "TH", name: "Thanh Hóa", wards: ["Thị trấn Cành Nàng", "Xã Thành Lâm (Pù Luông)", "Xã Cổ Lũng"] },
  { code: "NB", name: "Ninh Bình", wards: ["Xã Ninh Hải (Tam Cốc)", "Xã Trường Yên (Tràng An)", "Xã Ninh Xuân"] }
];

const INITIAL_VIEWED_LIST = [
  {
    id: 1,
    name: "Han River Glass House",
    location: "Đà Nẵng",
    timeAgo: "Vừa xem 15 phút trước",
    rating: "4.95",
    reviews: "184",
    specs: "2 phòng ngủ • 4 khách",
    amenities: "Bờ sông Hàn · Căn hộ kính panorama · Đặt gần đây",
    price: "1.150.000đ",
    img: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80",
    isFav: true
  },
  {
    id: 2,
    name: "The Memory Valley Villa",
    location: "Đà Lạt",
    timeAgo: "Vừa xem 2 giờ trước",
    rating: "4.96",
    reviews: "340",
    specs: "3 phòng ngủ • 8 khách",
    amenities: "Săn mây Đà Lạt · Bể bơi nước ấm · BBQ sân vườn",
    price: "1.450.000đ",
    img: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=600&q=80",
    isFav: false
  },
  {
    id: 3,
    name: "Topas Ecolodge Sapa",
    location: "Sapa",
    timeAgo: "Xem hôm qua",
    rating: "4.98",
    reviews: "310",
    specs: "Bungalow • 2 khách",
    amenities: "Bể bơi vô cực nước ấm · Mường Hoa · Đưa đón Limousine",
    price: "4.590.000đ",
    img: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80",
    isFav: true
  },
  {
    id: 4,
    name: "Tràng An Valley Retreat",
    location: "Ninh Bình",
    timeAgo: "Xem 2 ngày trước",
    rating: "4.96",
    reviews: "175",
    specs: "Bungalow núi • 2 khách",
    amenities: "View núi đá vôi · Khinh khí cầu · Xe đạp dạo đầm sen",
    price: "1.050.000đ",
    img: "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=80",
    isFav: false
  },
  {
    id: 5,
    name: "Nhà Rường Cổ Cố Đô",
    location: "Huế",
    timeAgo: "Xem 3 ngày trước",
    rating: "4.94",
    reviews: "167",
    specs: "Nhà Rường • 4 khách",
    amenities: "Cách Đại Nội 350m · Thưởng trà sen · Thử áo dài miễn phí",
    price: "890.000đ",
    img: "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=600&q=80",
    isFav: false
  },
  {
    id: 6,
    name: "Sơn Trà Sunset Villa",
    location: "Đà Nẵng",
    timeAgo: "Xem 5 ngày trước",
    rating: "4.94",
    reviews: "215",
    specs: "Villa 4 phòng • 10 khách",
    amenities: "Bể bơi vô cực view biển · Nướng BBQ sân vườn · VIP",
    price: "2.750.000đ",
    img: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80",
    isFav: true
  }
];

const INITIAL_VOUCHERS = [
  {
    id: 1,
    code: "HANRIVER200",
    title: "Han River Glass House",
    location: "Bờ sông Hàn, Đà Nẵng",
    rating: "4.95",
    discountText: "Giảm 200K",
    condText: "Đơn từ 1.5tr · Đặt từ 2 đêm",
    tag: "🔥 HOT NHẤT",
    tagClass: "tag-red",
    img: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 2,
    code: "MEMORY180",
    title: "The Memory Valley Villa",
    location: "Hồ Tuyền Lâm, Đà Lạt",
    rating: "4.96",
    discountText: "Giảm 180K",
    condText: "Đơn từ 1.2tr · Bể bơi nước ấm",
    tag: "🔥 HOT NHẤT",
    tagClass: "tag-orange",
    img: "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 3,
    code: "TOPASHOT500",
    title: "Topas Ecolodge Sapa",
    location: "Mường Hoa, Sapa",
    rating: "4.98",
    discountText: "Giảm 500K",
    condText: "Đơn từ 3.8tr · Bể bơi vô cực",
    tag: "⚡ SẮP HẾT HẠN",
    tagClass: "tag-green",
    img: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 4,
    code: "SONTRA250",
    title: "Sơn Trà Sunset Villa",
    location: "Sơn Trà, Đà Nẵng",
    rating: "4.94",
    discountText: "Giảm 250K",
    condText: "Đơn từ 2.2tr · Hồ bơi view biển",
    tag: "🎁 ĐẶC QUYỀN VIP",
    tagClass: "tag-red",
    img: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80"
  }
];

export default function PersonalAccount() {
  const navigate = useNavigate();

  // Active Sidebar Tab
  const [activeTab, setActiveTab] = useState("tab-profile");

  // User Profile State
  const [profile, setProfile] = useState({
    fullName: "Lê Hoàng Mai Chi",
    nickname: "Mai Chi Homestay",
    cccd: "001203004005",
    dobDay: "18",
    dobMonth: "08",
    dobYear: "1998",
    gender: "nu",
    nationality: "",
    street: "123 Đường Lê Lợi",
    provinceCode: "",
    ward: "",
    taxCode: "0312345678",
    bizCode: "41A8012345",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    phoneVerified: true,
    phone: "+84 912 345 678",
    email: "maichi.lehoang@gmail.com"
  });

  // Viewed Homestays State
  const [viewedList, setViewedList] = useState([]);
  const [searchViewed, setSearchViewed] = useState("");

  // Vouchers State
  const [vouchers, setVouchers] = useState(INITIAL_VOUCHERS);
  const [redeemCode, setRedeemCode] = useState("");

  // Transactions Filter
  const [txnFilter, setTxnFilter] = useState("all");

  // Cashback Wallet Balance & Transactions
  const [balance, setBalance] = useState(350000);
  const [walletLedger, setWalletLedger] = useState([
    {
      id: 1,
      title: "Hoàn tiền 5% đơn đặt phòng #HS-98234",
      date: "12/08/2026 10:15 • Pù Luông Eco Garden Homestay",
      amount: "+65.000 VNĐ",
      type: "plus",
      status: "Thành công"
    },
    {
      id: 2,
      title: "Hoàn tiền 5% đơn đặt phòng #HS-87112",
      date: "24/05/2026 16:40 • The Memory Valley Villa Đà Lạt",
      amount: "+72.500 VNĐ",
      type: "plus",
      status: "Thành công"
    },
    {
      id: 3,
      title: "Rút tiền số dư về ngân hàng Vietcombank",
      date: "01/05/2026 09:30 • Mã giao dịch VCB991203",
      amount: "-200.000 VNĐ",
      type: "minus",
      status: "Đã chuyển khoản"
    }
  ]);

  // Modal States
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showClearHistoryModal, setShowClearHistoryModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({ bank: "Vietcombank", accNum: "991203004005", amount: "100000" });
  const [termsModalVoucher, setTermsModalVoucher] = useState(null);

  // Toast Notice State
  const [toast, setToast] = useState({ show: false, title: "", body: "" });

  const triggerToast = (title, body) => {
    setToast({ show: true, title, body });
    setTimeout(() => {
      setToast({ show: false, title: "", body: "" });
    }, 3500);
  };

  // Loading & Saving States
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pwdForm, setPwdForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  // Load user profile from Spring Boot backend (Neon PostgreSQL)
  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      const currentUser = authService.getCurrentUser();
      const userId = currentUser?.id || 10; // Fallback to User ID 10

      const res = await userService.getUserProfile(userId);
      if (res.success && res.data) {
        setProfile((prev) => ({
          ...prev,
          fullName: res.data.fullName || prev.fullName,
          nickname: res.data.nickname || "",
          cccd: res.data.cccd || "",
          dobDay: res.data.dobDay || "18",
          dobMonth: res.data.dobMonth || "08",
          dobYear: res.data.dobYear || "1998",
          gender: res.data.gender || "nu",
          nationality: res.data.nationality || "VN",
          street: res.data.street || "",
          provinceCode: res.data.provinceCode || "",
          ward: res.data.ward || "",
          taxCode: res.data.taxCode || "",
          bizCode: res.data.bizCode || "",
          avatar: res.data.avatar || prev.avatar,
          phoneVerified: res.data.phoneVerified !== undefined ? res.data.phoneVerified : true,
          phone: res.data.phoneNumber || prev.phone,
          email: res.data.email || prev.email,
        }));
      }
      setLoading(false);
    };

    fetchUserProfile();
  }, []);

  // Load viewed history from Spring Boot backend (Neon PostgreSQL)
  useEffect(() => {
    const fetchViewedHistory = async () => {
      const currentUser = authService.getCurrentUser();
      const userId = currentUser?.id || 10;

      const res = await viewedHistoryService.getViewedHistory(userId);
      if (res.success && Array.isArray(res.data)) {
        setViewedList(res.data);
      }
    };

    fetchViewedHistory();
  }, [activeTab]);

  // Handlers
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const currentUser = authService.getCurrentUser();
    const userId = currentUser?.id || 1;

    const payload = {
      fullName: profile.fullName,
      nickname: profile.nickname,
      cccd: profile.cccd,
      dobDay: profile.dobDay,
      dobMonth: profile.dobMonth,
      dobYear: profile.dobYear,
      gender: profile.gender,
      nationality: profile.nationality,
      street: profile.street,
      provinceCode: profile.provinceCode,
      ward: profile.ward,
      taxCode: profile.taxCode,
      bizCode: profile.bizCode,
      avatar: profile.avatar,
      phoneNumber: profile.phone,
      phoneVerified: profile.phoneVerified,
    };

    const res = await userService.updateUserProfile(userId, payload);
    setSaving(false);

    if (res.success) {
      if (currentUser) {
        const updatedUser = {
          ...currentUser,
          fullName: profile.fullName,
          avatar: profile.avatar,
          phoneNumber: profile.phone,
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        sessionStorage.setItem("userName", profile.fullName);
      }
      triggerToast("Cập nhật thông tin", "Thông tin cá nhân đã lưu thành công vào cơ sở dữ liệu Neon PostgreSQL!");
    } else {
      triggerToast("Lỗi kết nối", res.error || "Không thể lưu thông tin lên máy chủ!");
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setProfile((prev) => ({ ...prev, avatar: url }));

      const currentUser = authService.getCurrentUser();
      const userId = currentUser?.id || 1;
      await userService.updateUserProfile(userId, { avatar: url });

      if (currentUser) {
        localStorage.setItem("user", JSON.stringify({ ...currentUser, avatar: url }));
      }
      triggerToast("Cập nhật ảnh", "Đã cập nhật ảnh đại diện mới thành công!");
    }
  };

  const handlePhoneVerifySubmit = async () => {
    if (otpInput.length === 6) {
      const currentUser = authService.getCurrentUser();
      const userId = currentUser?.id || 1;

      const res = await userService.verifyPhone(userId, profile.phone);
      if (res.success) {
        setProfile((prev) => ({ ...prev, phoneVerified: true }));
      }
      setShowPhoneModal(false);
      setOtpInput("");
      triggerToast("Xác minh sđt", "Số điện thoại đã được xác minh thành công!");
    } else {
      alert("Vui lòng nhập đủ 6 chữ số mã OTP!");
    }
  };

  const handlePasswordSubmit = async () => {
    if (!pwdForm.currentPassword || !pwdForm.newPassword) {
      alert("Vui lòng điền đầy đủ mật khẩu hiện tại và mật khẩu mới!");
      return;
    }
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      alert("Mật khẩu xác nhận không trùng khớp!");
      return;
    }
    const currentUser = authService.getCurrentUser();
    const userId = currentUser?.id || 1;

    const res = await userService.changePassword(userId, pwdForm.currentPassword, pwdForm.newPassword);
    if (res.success) {
      setShowPwdModal(false);
      setPwdForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      triggerToast("Đổi mật khẩu", res.message);
    } else {
      alert(res.message);
    }
  };

  const toggleWishlist = (id) => {
    setViewedList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isFav: !item.isFav } : item))
    );
    const target = viewedList.find((i) => i.id === id);
    if (target) {
      triggerToast(
        !target.isFav ? "Đã thêm yêu thích" : "Đã bỏ yêu thích",
        `${target.name} đã được cập nhật vào danh sách yêu thích.`
      );
    }
  };

  const confirmClearHistory = async () => {
    const currentUser = authService.getCurrentUser();
    if (currentUser && currentUser.id) {
      await viewedHistoryService.clearViewedHistory(currentUser.id);
    }
    setViewedList([]);
    setShowClearHistoryModal(false);
    triggerToast("Xóa lịch sử", "Đã xóa toàn bộ lịch sử homestay đã xem gần đây.");
  };

  const handleRedeemVoucher = () => {
    if (!redeemCode.trim()) {
      alert("Vui lòng nhập mã ưu đãi!");
      return;
    }
    const newCode = redeemCode.trim().toUpperCase();
    if (vouchers.some((v) => v.code === newCode)) {
      triggerToast("Mã đã có", "Mã này đã có trong ví voucher của bạn!");
      return;
    }
    const newVoucher = {
      id: Date.now(),
      code: newCode,
      title: "Ưu Đãi Đặc Biệt " + newCode,
      location: "Toàn quốc",
      rating: "5.0",
      discountText: "Giảm 150K",
      condText: "Áp dụng cho mọi đơn đặt homestay",
      tag: "🎁 MỚI THÊM",
      tagClass: "tag-teal",
      img: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80"
    };
    setVouchers([newVoucher, ...vouchers]);
    setRedeemCode("");
    triggerToast("Thành công", `Đã lưu mã giảm giá ${newCode} vào ví của bạn!`);
  };

  const copyVoucherCode = (code) => {
    navigator.clipboard.writeText(code);
    triggerToast("Đã copy", `Đã sao chép mã ${code} vào bộ nhớ tạm!`);
  };

  const handleWithdrawSubmit = (e) => {
    e.preventDefault();
    const amt = parseInt(withdrawForm.amount, 10);
    if (isNaN(amt) || amt < 50000) {
      alert("Số tiền rút tối thiểu là 50.000 VNĐ");
      return;
    }
    if (amt > balance) {
      alert("Số dư không đủ để thực hiện giao dịch!");
      return;
    }
    setBalance((prev) => prev - amt);
    const newTxn = {
      id: Date.now(),
      title: `Rút tiền về ngân hàng ${withdrawForm.bank}`,
      date: new Date().toLocaleString("vi-VN") + ` • STK: ${withdrawForm.accNum}`,
      amount: `-${amt.toLocaleString("vi-VN")} VNĐ`,
      type: "minus",
      status: "Đang xử lý"
    };
    setWalletLedger([newTxn, ...walletLedger]);
    setShowWithdrawModal(false);
    triggerToast("Yêu cầu rút tiền", `Đã gửi yêu cầu rút ${amt.toLocaleString("vi-VN")}đ thành công!`);
  };

  const openInvoice = (code, name, loc, dates, paid, subTotal, discount, method, status, txnId) => {
    setSelectedInvoice({ code, name, loc, dates, paid, subTotal, discount, method, status, txnId });
    setShowInvoiceModal(true);
  };

  // Filtered lists
  const currentProvince = PROVINCES_DATA.find((p) => p.code === profile.provinceCode);

  const filteredViewed = viewedList.filter((item) =>
    item.name.toLowerCase().includes(searchViewed.toLowerCase()) ||
    item.location.toLowerCase().includes(searchViewed.toLowerCase())
  );

  return (
    <main className="container py-4 py-md-5 personal-account-page">
      {/* Header at top */}
      <div className="account-header-box mb-4 mb-md-5">
        <h1 className="h3 fw-bold text-dark tracking-tight mb-2">Tài khoản cá nhân</h1>
        <p className="text-muted mb-0">Quản lý thông tin cá nhân và các hoạt động của bạn trên hệ thống Homestay Cộng đồng</p>
      </div>

      {/* 2-Column Main Layout */}
      <div className="account-page-grid">
        {/* 1. SIDEBAR BÊN TRÁI */}
        <aside className="account-sidebar-wrapper">
          <div className="account-sidebar-card">
            <div className="sidebar-title">
              <span className="sidebar-title-dot"></span>
              Quản lý tài khoản
            </div>

            <nav className="sidebar-nav-container">
              <button
                type="button"
                className={`account-nav-item ${activeTab === "tab-profile" ? "active" : ""}`}
                onClick={() => setActiveTab("tab-profile")}
              >
                <i className="bi bi-person-fill nav-item-icon"></i>
                <span className="nav-item-label">Thông tin cá nhân</span>
              </button>

              <button
                type="button"
                className={`account-nav-item ${activeTab === "tab-viewed" ? "active" : ""}`}
                onClick={() => setActiveTab("tab-viewed")}
              >
                <i className="bi bi-eye-fill nav-item-icon"></i>
                <span className="nav-item-label">Sản phẩm bạn đã xem</span>
              </button>

              <button
                type="button"
                className={`account-nav-item ${activeTab === "tab-vouchers" ? "active" : ""}`}
                onClick={() => setActiveTab("tab-vouchers")}
              >
                <i className="bi bi-ticket-perforated-fill nav-item-icon"></i>
                <span className="nav-item-label">Mã giảm giá</span>
                <span className="voucher-badge">{vouchers.length}</span>
              </button>

              <button
                type="button"
                className={`account-nav-item ${activeTab === "tab-transactions" ? "active" : ""}`}
                onClick={() => setActiveTab("tab-transactions")}
              >
                <i className="bi bi-card-list nav-item-icon"></i>
                <span className="nav-item-label">Danh sách giao dịch</span>
              </button>

              <button
                type="button"
                className={`account-nav-item ${activeTab === "tab-cashback" ? "active" : ""}`}
                onClick={() => setActiveTab("tab-cashback")}
              >
                <i className="bi bi-cash-coin nav-item-icon"></i>
                <span className="nav-item-label">Hoàn tiền</span>
              </button>

              <div className="sidebar-divider"></div>

              <button
                type="button"
                className="account-nav-item logout-item"
                onClick={() => setShowLogoutModal(true)}
              >
                <i className="bi bi-box-arrow-right nav-item-icon"></i>
                <span className="nav-item-label">Đăng xuất</span>
              </button>
            </nav>
          </div>
        </aside>

        {/* 2. KHU VỰC NỘI DUNG BÊN PHẢI */}
        <section className="account-content-wrapper">
          {/* TAB 1: THÔNG TIN CÁ NHÂN */}
          {activeTab === "tab-profile" && (
            <div className="animate-fade-in">
              <div className="eco-card">
                <div className="eco-card-title">
                  <span><i className="bi bi-person-fill text-success me-2"></i>Thông tin cá nhân</span>
                </div>

                <div className="row g-4 align-items-start">
                  {/* Avatar Upload */}
                  <div className="col-md-4 col-lg-3 text-center">
                    <div className="avatar-wrapper mb-3">
                      <img src={profile.avatar} alt="Ảnh đại diện" className="avatar-img" />
                      <label htmlFor="avatarFileInput" className="btn-avatar-edit" title="Thay đổi ảnh đại diện">
                        <i className="bi bi-camera-fill"></i>
                      </label>
                      <input
                        type="file"
                        id="avatarFileInput"
                        accept="image/png, image/jpeg"
                        style={{ display: "none" }}
                        onChange={handleAvatarChange}
                      />
                    </div>
                    <div>
                      <span className="badge-member mb-2">
                        <i className="bi bi-check-circle-fill text-success me-1"></i> Thành viên thân thiết
                      </span>
                      <p className="text-muted text-xs mb-0 mt-2">Dung lượng tối đa 5MB<br />Định dạng: .JPEG, .PNG</p>
                    </div>
                  </div>

                  {/* Form fields */}
                  <div className="col-md-8 col-lg-9">
                    <form onSubmit={handleProfileSubmit} className="row g-3">
                      {/* Họ & Tên */}
                      <div className="col-12">
                        <div className="row align-items-center">
                          <label className="col-sm-3 form-label-custom mb-1 mb-sm-0">Họ &amp; Tên</label>
                          <div className="col-sm-9">
                            <input
                              type="text"
                              className="form-control form-control-custom"
                              value={profile.fullName}
                              onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                              placeholder="Nhập họ và tên"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      {/* Nickname */}
                      <div className="col-12">
                        <div className="row align-items-center">
                          <label className="col-sm-3 form-label-custom mb-1 mb-sm-0">Nickname</label>
                          <div className="col-sm-9">
                            <input
                              type="text"
                              className="form-control form-control-custom"
                              value={profile.nickname}
                              onChange={(e) => setProfile({ ...profile, nickname: e.target.value })}
                              placeholder="Thêm nickname"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Số CCCD / CMND */}
                      <div className="col-12">
                        <div className="row align-items-center">
                          <label className="col-sm-3 form-label-custom mb-1 mb-sm-0">Số CCCD / CMND</label>
                          <div className="col-sm-9">
                            <input
                              type="text"
                              className="form-control form-control-custom"
                              value={profile.cccd}
                              onChange={(e) => setProfile({ ...profile, cccd: e.target.value })}
                              placeholder="Nhập 12 số CCCD / CMND"
                              maxLength="12"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Ngày sinh */}
                      <div className="col-12">
                        <div className="row align-items-center">
                          <label className="col-sm-3 form-label-custom mb-1 mb-sm-0">Ngày sinh</label>
                          <div className="col-sm-9">
                            <div className="row g-2">
                              <div className="col-4">
                                <select
                                  className="form-select form-select-custom"
                                  value={profile.dobDay}
                                  onChange={(e) => setProfile({ ...profile, dobDay: e.target.value })}
                                >
                                  {Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, "0")).map((d) => (
                                    <option key={d} value={d}>{d}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-4">
                                <select
                                  className="form-select form-select-custom"
                                  value={profile.dobMonth}
                                  onChange={(e) => setProfile({ ...profile, dobMonth: e.target.value })}
                                >
                                  {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0")).map((m) => (
                                    <option key={m} value={m}>Tháng {m}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-4">
                                <select
                                  className="form-select form-select-custom"
                                  value={profile.dobYear}
                                  onChange={(e) => setProfile({ ...profile, dobYear: e.target.value })}
                                >
                                  {Array.from({ length: 60 }, (_, i) => 2005 - i).map((y) => (
                                    <option key={y} value={y.toString()}>{y}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Giới tính */}
                      <div className="col-12">
                        <div className="row align-items-center">
                          <label className="col-sm-3 form-label-custom mb-1 mb-sm-0">Giới tính</label>
                          <div className="col-sm-9">
                            <div className="d-flex align-items-center gap-4 pt-1">
                              <div className="form-check custom-radio-item">
                                <input
                                  className="form-check-input custom-radio-input"
                                  type="radio"
                                  name="gender"
                                  id="genderMale"
                                  value="nam"
                                  checked={profile.gender === "nam"}
                                  onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                                />
                                <label className="form-check-label text-sm text-secondary ms-1" htmlFor="genderMale">Nam</label>
                              </div>
                              <div className="form-check custom-radio-item">
                                <input
                                  className="form-check-input custom-radio-input"
                                  type="radio"
                                  name="gender"
                                  id="genderFemale"
                                  value="nu"
                                  checked={profile.gender === "nu"}
                                  onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                                />
                                <label className="form-check-label text-sm text-secondary ms-1" htmlFor="genderFemale">Nữ</label>
                              </div>
                              <div className="form-check custom-radio-item">
                                <input
                                  className="form-check-input custom-radio-input"
                                  type="radio"
                                  name="gender"
                                  id="genderOther"
                                  value="khac"
                                  checked={profile.gender === "khac"}
                                  onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                                />
                                <label className="form-check-label text-sm text-secondary ms-1" htmlFor="genderOther">Khác</label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Quốc tịch */}
                      <div className="col-12">
                        <div className="row align-items-center">
                          <label className="col-sm-3 form-label-custom mb-1 mb-sm-0">Quốc tịch</label>
                          <div className="col-sm-9">
                            <select
                              className="form-select form-select-custom"
                              value={profile.nationality}
                              onChange={(e) => setProfile({ ...profile, nationality: e.target.value })}
                            >
                              <option value="">-- Chọn Quốc tịch --</option>
                              <option value="VN">Việt Nam</option>
                              <option value="US">Mỹ (United States)</option>
                              <option value="JP">Nhật Bản (Japan)</option>
                              <option value="KR">Hàn Quốc (Korea)</option>
                              <option value="FR">Pháp (France)</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Địa chỉ */}
                      <div className="col-12">
                        <div className="row align-items-start">
                          <label className="col-sm-3 form-label-custom mb-1 mb-sm-0 pt-2">Địa chỉ</label>
                          <div className="col-sm-9">
                            <input
                              type="text"
                              className="form-control form-control-custom mb-2"
                              placeholder="Số nhà, tên đường"
                              value={profile.street}
                              onChange={(e) => setProfile({ ...profile, street: e.target.value })}
                            />
                            <div className="row g-2">
                              <div className="col-6">
                                <select
                                  className="form-select form-select-custom"
                                  value={profile.provinceCode}
                                  onChange={(e) => {
                                    const code = e.target.value;
                                    const p = PROVINCES_DATA.find((item) => item.code === code);
                                    setProfile({
                                      ...profile,
                                      provinceCode: code,
                                      ward: p ? p.wards[0] : ""
                                    });
                                  }}
                                >
                                  <option value="">-- Chọn Tỉnh / Thành phố --</option>
                                  {PROVINCES_DATA.map((p) => (
                                    <option key={p.code} value={p.code}>{p.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-6">
                                <select
                                  className="form-select form-select-custom"
                                  value={profile.ward}
                                  onChange={(e) => setProfile({ ...profile, ward: e.target.value })}
                                >
                                  <option value="">-- Chọn Phường / Xã --</option>
                                  {currentProvince?.wards?.map((w) => (
                                    <option key={w} value={w}>{w}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Save Button */}
                      <div className="col-12 pt-3">
                        <div className="row">
                          <div className="col-sm-9 offset-sm-3">
                            <button type="submit" className="btn btn-eco-save d-inline-flex align-items-center gap-2" disabled={saving}>
                              {saving ? (
                                <>
                                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                  Đang lưu...
                                </>
                              ) : (
                                <>
                                  <i className="bi bi-floppy-fill"></i> Lưu thay đổi
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>

              {/* SĐT & Email Verification */}
              <div className="eco-card">
                <div className="d-flex align-items-center justify-content-between mb-4">
                  <div>
                    <h2 className="h5 fw-bold text-dark mb-1">Số điện thoại và Email</h2>
                    <p className="text-xs text-muted mb-0">Xác thực đầy đủ thông tin để tăng cường độ tin cậy khi đặt phòng homestay</p>
                  </div>
                  {!profile.phoneVerified && (
                    <span className="badge badge-warning-custom px-3 py-1.5 rounded-pill text-xs fw-bold">
                      Cần hoàn tất 1 mục
                    </span>
                  )}
                </div>

                <div className="verification-box">
                  {/* Phone Item */}
                  <div className="verification-item">
                    <div className="d-flex align-items-center gap-3">
                      <div className="icon-box-amber">
                        <i className="bi bi-telephone-fill"></i>
                      </div>
                      <div>
                        <div className="d-flex align-items-center gap-2">
                          <span className="fw-semibold text-dark text-sm">Số điện thoại</span>
                          {profile.phoneVerified ? (
                            <span className="badge-verified"><i className="bi bi-check-circle-fill"></i> Đã xác minh</span>
                          ) : (
                            <span className="badge-unverified">Chưa xác minh</span>
                          )}
                        </div>
                        <p className="text-muted text-sm mb-0 mt-0.5">{profile.phone}</p>
                      </div>
                    </div>
                    {!profile.phoneVerified ? (
                      <button type="button" className="btn btn-eco-action" onClick={() => setShowPhoneModal(true)}>
                        Xác minh ngay
                      </button>
                    ) : (
                      <button type="button" className="btn btn-outline-custom" onClick={() => triggerToast("Số điện thoại", "Số điện thoại của bạn đã xác minh chính chủ.")}>
                        Đã xác minh
                      </button>
                    )}
                  </div>

                  {/* Email Item */}
                  <div className="verification-item">
                    <div className="d-flex align-items-center gap-3">
                      <div className="icon-box-emerald">
                        <i className="bi bi-envelope-check-fill"></i>
                      </div>
                      <div>
                        <div className="d-flex align-items-center gap-2">
                          <span className="fw-semibold text-dark text-sm">Địa chỉ email</span>
                          <span className="badge-verified"><i className="bi bi-check-circle-fill"></i> Đã xác minh</span>
                        </div>
                        <p className="text-muted text-sm mb-0 mt-0.5">{profile.email}</p>
                      </div>
                    </div>
                    <button type="button" className="btn btn-outline-custom" onClick={() => triggerToast("Email", "Địa chỉ email đã được cập nhật thành công!")}>
                      Cập nhật
                    </button>
                  </div>
                </div>
              </div>

              {/* Security Block */}
              <div className="eco-card mb-0">
                <h2 className="h5 fw-bold text-dark mb-1">Bảo mật</h2>
                <p className="text-xs text-muted mb-4">Quản lý phương thức đăng nhập và các thiết lập an toàn cho tài khoản</p>

                <div className="d-flex flex-column">
                  <div className="security-item">
                    <div className="d-flex align-items-center gap-3">
                      <div className="security-icon">
                        <i className="bi bi-shield-lock-fill"></i>
                      </div>
                      <div>
                        <h3 className="h6 fw-semibold text-dark mb-0">Thiết lập mật khẩu</h3>
                        <p className="text-xs text-muted mb-0 mt-0.5">Đổi mật khẩu định kỳ để bảo vệ tài khoản và lịch sử đặt phòng của bạn</p>
                      </div>
                    </div>
                    <button type="button" className="btn btn-secondary-custom shrink-0" onClick={() => setShowPwdModal(true)}>
                      Cập nhật mật khẩu
                    </button>
                  </div>

                  <div className="security-item">
                    <div className="d-flex align-items-center gap-3">
                      <div className="security-icon">
                        <i className="bi bi-hash"></i>
                      </div>
                      <div>
                        <h3 className="h6 fw-semibold text-dark mb-0">Thiết lập mã PIN</h3>
                        <p className="text-xs text-muted mb-0 mt-0.5">Mã PIN 6 chữ số dùng để xác thực nhanh khi hoàn tiền hoặc thanh toán homestay</p>
                      </div>
                    </div>
                    <button type="button" className="btn btn-secondary-custom shrink-0" onClick={() => setShowPinModal(true)}>
                      Cài đặt mã PIN
                    </button>
                  </div>

                  <div className="security-item">
                    <div className="d-flex align-items-center gap-3">
                      <div className="security-icon rose">
                        <i className="bi bi-trash3-fill"></i>
                      </div>
                      <div>
                        <h3 className="h6 fw-semibold text-danger mb-0">Yêu cầu xóa tài khoản</h3>
                        <p className="text-xs text-muted mb-0 mt-0.5">Xóa vĩnh viễn tài khoản cùng toàn bộ thông tin cá nhân và điểm tích lũy homestay</p>
                      </div>
                    </div>
                    <button type="button" className="btn btn-rose-outline shrink-0" onClick={() => setShowDeleteModal(true)}>
                      Yêu cầu xóa
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SẢN PHẨM BẠN ĐÃ XEM */}
          {activeTab === "tab-viewed" && (
            <div className="animate-fade-in">
              <div className="eco-card">
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 pb-3 border-bottom mb-4">
                  <div>
                    <h2 className="h5 fw-bold text-dark mb-1"><i className="bi bi-eye-fill text-info me-2"></i>Homestay bạn đã xem gần đây</h2>
                    <p className="text-xs text-muted mb-0">Danh sách homestay bạn vừa xem</p>
                  </div>
                  {viewedList.length > 0 && (
                    <button className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1" onClick={() => setShowClearHistoryModal(true)}>
                      <i className="bi bi-trash3"></i> Xóa toàn bộ lịch sử
                    </button>
                  )}
                </div>

                <div className="mb-4">
                  <div className="search-hs-box">
                    <div className="search-icon-badge">
                      <i className="bi bi-search"></i>
                    </div>
                    <input
                      type="text"
                      placeholder="Tìm kiếm trong danh sách đã xem (Topas, Han River, Đà Lạt)..."
                      value={searchViewed}
                      onChange={(e) => setSearchViewed(e.target.value)}
                    />
                  </div>
                </div>

                {filteredViewed.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="bi bi-eye-slash display-4 text-muted mb-3 d-block"></i>
                    <h5 className="fw-bold text-dark">Chưa có homestay nào trong danh sách đã xem</h5>
                    <p className="text-muted text-sm mb-3">Hãy dạo quanh trang chủ để khám phá hàng trăm homestay độc đáo nhé!</p>
                    <Link to="/" className="btn btn-eco-save px-4">Khám phá ngay</Link>
                  </div>
                ) : (
                  <div className="row g-3">
                    {filteredViewed.map((item) => (
                      <div key={item.id} className="col-md-6 col-lg-4">
                        <div className="homestay-card h-100">
                          <div className="card-img-wrapper">
                            <span className="card-top-tag">
                              <i className="bi bi-eye me-1"></i> {item.timeAgo}
                            </span>
                            <button
                              type="button"
                              className={`card-wishlist-btn ${item.isFav ? "active" : ""}`}
                              onClick={() => toggleWishlist(item.id)}
                              title="Yêu thích"
                            >
                              <i className={`bi ${item.isFav ? "bi-heart-fill text-danger" : "bi-heart"}`}></i>
                            </button>
                            <Link to={`/homestay/${item.homestayId || item.id}`}>
                              <img src={item.img} alt={item.name} />
                            </Link>
                          </div>

                          <div className="card-body">
                            <div className="card-location-rating">
                              <span className="card-location">
                                <i className="bi bi-geo-alt-fill text-success me-1"></i> {item.location}
                              </span>
                              <span className="card-rating">
                                <i className="bi bi-star-fill text-warning me-1"></i> {item.rating}{" "}
                                <span className="review-count">({item.reviews || 120})</span>
                              </span>
                            </div>

                            <h3 className="card-title">
                              <Link to={`/homestay/${item.homestayId || item.id}`}>{item.name}</Link>
                            </h3>

                            <div className="card-specs">
                              <span>{item.specs}</span>
                            </div>

                            <div className="card-amenities-box">
                              <span className="amenities-label">Tiện nghi nổi bật:</span>
                              <p className="amenities-items">{item.amenities}</p>
                            </div>

                            <div className="card-footer-row">
                              <div className="card-price-group">
                                <span className="price-label">Giá từ:</span>
                                <span className="card-price">{item.price}</span>
                              </div>
                              <Link to={`/homestay/${item.homestayId || item.id}`} className="btn-view-room">
                                Đặt ngay
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: MÃ GIẢM GIÁ */}
          {activeTab === "tab-vouchers" && (
            <div className="animate-fade-in">
              <div className="voucher-hero-banner mb-4">
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                  <div>
                    <span className="voucher-hero-badge mb-2 d-inline-block"><i className="bi bi-wallet2 me-1"></i> Ví voucher cá nhân</span>
                    <h2 className="h4 fw-bold text-white mb-1">Mã Giảm Giá Đã Lưu Trong Ví</h2>
                    <p className="text-xs text-light mb-0">Bạn có {vouchers.length} voucher khả dụng</p>
                  </div>
                  <Link to="/promotions" className="btn-discover">
                    <i className="bi bi-grid-fill me-1"></i> Khám phá thêm kho mã
                  </Link>
                </div>
              </div>

              {/* Gold Redeem Input */}
              <div className="eco-card mb-4">
                <h6 className="fw-bold text-dark mb-2"><i className="bi bi-ticket-perforated-fill text-warning me-2"></i>Kích hoạt mã khuyến mãi mới</h6>
                <div className="promo-redeem-gold-box">
                  <i className="bi bi-ticket-perforated-fill text-success"></i>
                  <input
                    type="text"
                    placeholder="Nhập mã ưu đãi (Ví dụ: HANRIVER200, TOPASHOT500)..."
                    value={redeemCode}
                    onChange={(e) => setRedeemCode(e.target.value)}
                  />
                  <button className="btn-redeem-gold" onClick={handleRedeemVoucher}>Kích hoạt ngay</button>
                </div>
              </div>

              {/* Vouchers Grid */}
              <div className="eco-card">
                <div className="eco-card-title">
                  <span><i className="bi bi-bookmark-star-fill text-success me-2"></i>Danh sách mã trong ví của bạn</span>
                  <span className="badge bg-success text-white">{vouchers.length} Mã khả dụng</span>
                </div>

                <div className="row g-3">
                  {vouchers.map((v) => (
                    <div key={v.id} className="col-md-6 col-lg-4">
                      <div className="voucher-card-item h-100">
                        <div className="voucher-card-img-wrapper">
                          <span className={`voucher-tag ${v.tagClass}`}>{v.tag}</span>
                          <button type="button" className="voucher-wishlist-btn" title="Lưu voucher">
                            <i className="bi bi-heart-fill text-danger"></i>
                          </button>
                          <img src={v.img} alt={v.title} />
                        </div>

                        <div className="voucher-card-body">
                          <div className="voucher-meta-row">
                            <span className="voucher-location">
                              <i className="bi bi-geo-alt-fill text-danger me-1"></i> {v.location}
                            </span>
                            <span className="voucher-rating">
                              <i className="bi bi-star-fill text-warning me-1"></i> {v.rating}
                            </span>
                          </div>

                          <h3 className="voucher-title" title={v.title}>{v.title}</h3>

                          <div className="voucher-strip-box">
                            <div className="voucher-strip-left">{v.discountText}</div>
                            <div className="voucher-strip-right">
                              <span className="voucher-code-label">MÃ: {v.code}</span>
                              <span className="voucher-cond-text">{v.condText}</span>
                            </div>
                          </div>

                          <div className="voucher-card-footer">
                            <button
                              type="button"
                              className="btn btn-voucher-copy fw-bold"
                              onClick={() => copyVoucherCode(v.code)}
                            >
                              <i className="bi bi-clipboard me-1"></i> Copy
                            </button>
                            <Link to="/homestay-detail" className="btn btn-voucher-use fw-bold">
                              Xem phòng
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DANH SÁCH GIAO DỊCH */}
          {activeTab === "tab-transactions" && (
            <div className="animate-fade-in">
              {/* Header Banner */}
              <div className="txn-hero-banner mb-4">
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                  <div>
                    <span className="txn-hero-badge mb-2 d-inline-block">
                      <i className="bi bi-receipt me-1"></i> Lịch sử đặt phòng
                    </span>
                    <h2 className="h4 fw-bold text-white mb-1">Danh Sách Giao Dịch</h2>
                    <p className="text-xs mb-0" style={{color:"#DCFCE7"}}>Toàn bộ lịch sử đặt phòng và thanh toán của bạn</p>
                  </div>
                  <div className="txn-summary-chips">
                    <div className="txn-chip txn-chip-success">
                      <i className="bi bi-check-circle-fill"></i>
                      <span>2 Thành công</span>
                    </div>
                    <div className="txn-chip txn-chip-refund">
                      <i className="bi bi-arrow-return-left"></i>
                      <span>1 Hoàn tiền</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="eco-card">
                <div className="eco-card-title">
                  <span><i className="bi bi-card-list text-success me-2"></i>Lịch sử giao dịch &amp; Đặt phòng</span>
                  <span className="txn-count-badge">3 Giao dịch</span>
                </div>

                {/* Filter Bar */}
                <div className="txn-filter-bar mb-4">
                  <button
                    className={`txn-filter-btn ${txnFilter === "all" ? "active" : ""}`}
                    onClick={() => setTxnFilter("all")}
                  >
                    <i className="bi bi-grid-3x2-gap-fill me-1"></i> Tất cả (3)
                  </button>
                  <button
                    className={`txn-filter-btn ${txnFilter === "success" ? "active" : ""}`}
                    onClick={() => setTxnFilter("success")}
                  >
                    <i className="bi bi-check-circle-fill me-1"></i> Thành công (2)
                  </button>
                  <button
                    className={`txn-filter-btn ${txnFilter === "refund" ? "active" : ""}`}
                    onClick={() => setTxnFilter("refund")}
                  >
                    <i className="bi bi-arrow-return-left me-1"></i> Đã hoàn hủy (1)
                  </button>
                </div>

                {/* Transaction Cards */}
                <div className="txn-list">
                  {(txnFilter === "all" || txnFilter === "success") && (
                    <div className="txn-row-card txn-status-success">
                      <div className="txn-row-left">
                        <div className="txn-order-col">
                          <span className="txn-order-id">#HS-98234</span>
                          <span className="txn-date-pill"><i className="bi bi-calendar3 me-1"></i>12/08/2026</span>
                        </div>
                        <div className="txn-info-col">
                          <span className="txn-name">Pù Luông Eco Garden</span>
                          <span className="txn-loc"><i className="bi bi-geo-alt-fill me-1 text-danger"></i>Bá Thước, Thanh Hóa</span>
                        </div>
                        <div className="txn-method-col">
                          <span className="txn-method-badge"><i className="bi bi-qr-code-scan me-1 text-success"></i>Chuyển khoản QR</span>
                        </div>
                      </div>
                      <div className="txn-row-right">
                        <span className="txn-amount txn-amount-success">1.300.000đ</span>
                        <span className="txn-status-badge status-success"><i className="bi bi-check-circle-fill me-1"></i>Thành công</span>
                        <button className="btn-txn-invoice" onClick={() => openInvoice("HS-98234", "Pù Luông Eco Garden Homestay", "Bá Thước, Thanh Hóa", "12/08/2026 - 14/08/2026 (2 đêm)", "1.300.000đ", "1.500.000đ", "200.000đ", "Chuyển khoản QR Vietcombank", "Đã xác nhận thanh toán", "VCB9823412")}>
                          <i className="bi bi-receipt me-1"></i> Xem hóa đơn
                        </button>
                      </div>
                    </div>
                  )}

                  {(txnFilter === "all" || txnFilter === "success") && (
                    <div className="txn-row-card txn-status-success">
                      <div className="txn-row-left">
                        <div className="txn-order-col">
                          <span className="txn-order-id">#HS-87112</span>
                          <span className="txn-date-pill"><i className="bi bi-calendar3 me-1"></i>24/05/2026</span>
                        </div>
                        <div className="txn-info-col">
                          <span className="txn-name">The Memory Villa</span>
                          <span className="txn-loc"><i className="bi bi-geo-alt-fill me-1 text-danger"></i>Hồ Tuyền Lâm, Đà Lạt</span>
                        </div>
                        <div className="txn-method-col">
                          <span className="txn-method-badge"><i className="bi bi-credit-card-2-front me-1 text-primary"></i>Thẻ Visa / Master</span>
                        </div>
                      </div>
                      <div className="txn-row-right">
                        <span className="txn-amount txn-amount-success">1.450.000đ</span>
                        <span className="txn-status-badge status-success"><i className="bi bi-check-circle-fill me-1"></i>Thành công</span>
                        <button className="btn-txn-invoice" onClick={() => openInvoice("HS-87112", "The Memory Valley Villa", "Hồ Tuyền Lâm, Đà Lạt", "24/05/2026 - 26/05/2026 (2 đêm)", "1.450.000đ", "1.630.000đ", "180.000đ", "Thẻ Visa Quốc tế (*8899)", "Đã xác nhận thanh toán", "VISA8711200")}>
                          <i className="bi bi-receipt me-1"></i> Xem hóa đơn
                        </button>
                      </div>
                    </div>
                  )}

                  {(txnFilter === "all" || txnFilter === "refund") && (
                    <div className="txn-row-card txn-status-refund">
                      <div className="txn-row-left">
                        <div className="txn-order-col">
                          <span className="txn-order-id txn-order-muted">#HS-76501</span>
                          <span className="txn-date-pill"><i className="bi bi-calendar3 me-1"></i>10/01/2026</span>
                        </div>
                        <div className="txn-info-col">
                          <span className="txn-name">Tràng An Retreat</span>
                          <span className="txn-loc"><i className="bi bi-geo-alt-fill me-1 text-danger"></i>Tràng An, Ninh Bình</span>
                        </div>
                        <div className="txn-method-col">
                          <span className="txn-method-badge"><i className="bi bi-wallet2 me-1 text-warning"></i>Ví e-Wallet</span>
                        </div>
                      </div>
                      <div className="txn-row-right">
                        <span className="txn-amount txn-amount-refund">1.050.000đ</span>
                        <span className="txn-status-badge status-refund"><i className="bi bi-arrow-return-left me-1"></i>Đã hoàn tiền</span>
                        <button className="btn-txn-invoice btn-txn-invoice-muted" onClick={() => openInvoice("HS-76501", "Tràng An Valley Retreat", "Tràng An, Ninh Bình", "10/01/2026 - 11/01/2026 (1 đêm)", "1.050.000đ", "1.170.000đ", "120.000đ", "Ví e-Wallet YÊN", "Đã hủy & Hoàn trả 100% tiền", "REF7650199")}>
                          <i className="bi bi-receipt me-1"></i> Xem hóa đơn
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: VÍ HOÀN TIỀN */}
          {activeTab === "tab-cashback" && (
            <div className="animate-fade-in">
              {/* Hero Banner Card */}
              <div className="wallet-hero-card">
                <div className="wallet-hero-top">
                  <div className="wallet-hero-brand">
                    <div className="wallet-hero-icon-wrapper">
                      <i className="bi bi-wallet2"></i>
                    </div>
                    <div>
                      <div className="wallet-verified-badge">
                        <i className="bi bi-shield-check"></i>
                        <span>Ví YÊN Pay • Đã xác thực</span>
                      </div>
                      <h2 className="wallet-hero-title">Ví Hoàn Tiền Cá Nhân</h2>
                    </div>
                  </div>
                  <button className="btn-withdraw-action" onClick={() => setShowWithdrawModal(true)}>
                    <i className="bi bi-bank me-2"></i>
                    <span>Rút tiền về Ngân hàng</span>
                  </button>
                </div>

                <div className="wallet-hero-body">
                  <div className="wallet-main-stat">
                    <span className="wallet-stat-label">
                      <i className="bi bi-piggy-bank me-1"></i> SỐ DƯ KHẢ DỤNG
                    </span>
                    <div className="wallet-balance-display">
                      <span className="wallet-balance-number">{balance.toLocaleString("vi-VN")}</span>
                      <span className="wallet-balance-currency">VNĐ</span>
                    </div>
                    <p className="wallet-balance-note">
                      <i className="bi bi-info-circle me-1.5"></i>
                      Dùng để thanh toán đặt phòng hoặc rút tiền trực tiếp về ngân hàng
                    </p>
                  </div>

                  <div className="wallet-sub-stats">
                    <div className="wallet-sub-stat-card">
                      <span className="sub-stat-title">TỔNG HOÀN LŨY KẾ</span>
                      <span className="sub-stat-value text-emerald">1.250.000đ</span>
                    </div>
                    <div className="wallet-sub-stat-card">
                      <span className="sub-stat-title">TỶ LỆ HOÀN TIỀN</span>
                      <span className="sub-stat-badge">5% / Đơn phòng</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bank & PIN Information Cards */}
              <div className="wallet-info-grid">
                <div className="wallet-info-card">
                  <div className="wallet-info-icon bg-emerald-light">
                    <i className="bi bi-bank2 text-emerald"></i>
                  </div>
                  <div className="wallet-info-content">
                    <span className="wallet-info-label">Ngân hàng liên kết</span>
                    <h6 className="wallet-info-title">Vietcombank •••• 6868</h6>
                    <span className="wallet-info-sub">Chủ tài khoản: <strong>Lê Hoàng Mai Chi</strong></span>
                  </div>
                  <span className="wallet-status-pill pill-success">
                    <i className="bi bi-check-circle-fill me-1"></i>Đã liên kết
                  </span>
                </div>

                <div className="wallet-info-card">
                  <div className="wallet-info-icon bg-amber-light">
                    <i className="bi bi-shield-lock-fill text-amber"></i>
                  </div>
                  <div className="wallet-info-content">
                    <span className="wallet-info-label">Bảo mật giao dịch</span>
                    <h6 className="wallet-info-title">Mã PIN Ví 6 chữ số</h6>
                    <span className="wallet-info-sub">Xác thực nhanh khi hoàn tiền & rút tiền</span>
                  </div>
                  <span className="wallet-status-pill pill-amber">
                    <i className="bi bi-shield-check me-1"></i>Đã kích hoạt
                  </span>
                </div>
              </div>

              {/* Transactions Ledger */}
              <div className="wallet-ledger-card">
                <div className="wallet-ledger-header">
                  <div className="d-flex align-items-center gap-2">
                    <div className="ledger-header-icon">
                      <i className="bi bi-journal-text"></i>
                    </div>
                    <div>
                      <h5 className="ledger-title">Lịch sử biến động số dư</h5>
                      <span className="ledger-subtitle">Các giao dịch nhận hoàn tiền và rút tiền</span>
                    </div>
                  </div>
                  <span className="ledger-count-badge">{walletLedger.length} giao dịch</span>
                </div>

                <div className="wallet-ledger-list">
                  {walletLedger.map((item) => (
                    <div key={item.id} className={`wallet-ledger-item ${item.type}`}>
                      <div className="ledger-item-left">
                        <div className={`ledger-type-circle ${item.type}`}>
                          <i className={`bi ${item.type === "plus" ? "bi-arrow-down-left" : "bi-arrow-up-right"}`}></i>
                        </div>
                        <div className="ledger-item-details">
                          <div className="ledger-item-title">{item.title}</div>
                          <div className="ledger-item-date">
                            <i className="bi bi-clock me-1"></i>
                            {item.date}
                          </div>
                        </div>
                      </div>

                      <div className="ledger-item-right">
                        <div className={`ledger-amount ${item.type}`}>
                          {item.amount}
                        </div>
                        <span className={`ledger-status-tag ${item.type}`}>
                          <i className={`bi ${item.type === "plus" ? "bi-check-circle-fill" : "bi-arrow-right-circle-fill"} me-1`}></i>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* --- MODALS --- */}

      {/* 1. Modal Phone OTP */}
      {showPhoneModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} tabindex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-dark"><i className="bi bi-shield-check text-success me-2"></i>Xác minh số điện thoại</h5>
                <button type="button" className="btn-close" onClick={() => setShowPhoneModal(false)}></button>
              </div>
              <div className="modal-body py-4">
                <p className="text-sm text-secondary mb-3">Mã xác thực OTP 6 chữ số đã được gửi tới số <strong>{profile.phone}</strong>.</p>
                <div className="mb-3">
                  <label className="form-label text-sm fw-semibold">Nhập mã OTP</label>
                  <input
                    type="text"
                    className="form-control form-control-custom text-center fs-4 tracking-widest"
                    placeholder="• • • • • •"
                    maxLength="6"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                  />
                </div>
                <p className="text-xs text-muted mb-0">Chưa nhận được mã? <a href="#resend" onClick={(e) => { e.preventDefault(); alert('Đã gửi lại mã OTP!'); }} className="text-success fw-semibold">Gửi lại mã (59s)</a></p>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button type="button" className="btn btn-light" onClick={() => setShowPhoneModal(false)}>Hủy</button>
                <button type="button" className="btn btn-eco-save" onClick={handlePhoneVerifySubmit}>Xác nhận OTP</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal Password */}
      {showPwdModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} tabindex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-dark"><i className="bi bi-key-fill text-success me-2"></i>Cập nhật mật khẩu</h5>
                <button type="button" className="btn-close" onClick={() => setShowPwdModal(false)}></button>
              </div>
              <div className="modal-body py-3">
                <div className="mb-3">
                  <label className="form-label text-sm fw-semibold">Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    className="form-control form-control-custom"
                    placeholder="••••••••"
                    value={pwdForm.currentPassword}
                    onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label text-sm fw-semibold">Mật khẩu mới</label>
                  <input
                    type="password"
                    className="form-control form-control-custom"
                    placeholder="Mật khẩu từ 8 ký tự"
                    value={pwdForm.newPassword}
                    onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label text-sm fw-semibold">Xác nhận mật khẩu mới</label>
                  <input
                    type="password"
                    className="form-control form-control-custom"
                    placeholder="Nhập lại mật khẩu mới"
                    value={pwdForm.confirmPassword}
                    onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button type="button" className="btn btn-light" onClick={() => setShowPwdModal(false)}>Đóng</button>
                <button
                  type="button"
                  className="btn btn-eco-save"
                  onClick={handlePasswordSubmit}
                >
                  Lưu mật khẩu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal PIN */}
      {showPinModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} tabindex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-dark"><i className="bi bi-hash text-success me-2"></i>Cài đặt mã PIN thanh toán</h5>
                <button type="button" className="btn-close" onClick={() => setShowPinModal(false)}></button>
              </div>
              <div className="modal-body py-4">
                <p className="text-sm text-secondary mb-3">Tạo mã PIN 6 chữ số để xác thực nhanh khi hoàn tiền hoặc đặt Homestay nhanh.</p>
                <div className="mb-3">
                  <input type="password" className="form-control form-control-custom text-center fs-4" placeholder="• • • • • •" maxLength="6" />
                </div>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button type="button" className="btn btn-light" onClick={() => setShowPinModal(false)}>Hủy</button>
                <button
                  type="button"
                  className="btn btn-eco-save"
                  onClick={() => {
                    setShowPinModal(false);
                    triggerToast("Mã PIN", "Đã thiết lập mã PIN Ví YÊN Pay thành công!");
                  }}
                >
                  Tạo mã PIN
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Modal Delete Account */}
      {showDeleteModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} tabindex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-danger"><i className="bi bi-exclamation-triangle-fill me-2"></i>Cảnh báo xóa tài khoản</h5>
                <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)}></button>
              </div>
              <div className="modal-body py-3">
                <p className="text-sm text-secondary">Hành động này sẽ <strong>xóa vĩnh viễn</strong> tài khoản cùng lịch sử đặt homestay và điểm thưởng tích lũy của bạn. Hành động này không thể hoàn tác!</p>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button type="button" className="btn btn-light" onClick={() => setShowDeleteModal(false)}>Hủy bỏ</button>
                <button
                  type="button"
                  className="btn btn-danger fw-semibold"
                  onClick={() => {
                    setShowDeleteModal(false);
                    alert("Yêu cầu xóa tài khoản đã gửi tới ban quản trị.");
                  }}
                >
                  Đồng ý xóa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal Logout Confirmation */}
      {showLogoutModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} tabindex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-dark"><i className="bi bi-box-arrow-right text-danger me-2"></i>Xác nhận đăng xuất</h5>
                <button type="button" className="btn-close" onClick={() => setShowLogoutModal(false)}></button>
              </div>
              <div className="modal-body py-4">
                <p className="text-secondary text-sm mb-0">
                  Bạn có chắc chắn muốn đăng xuất khỏi tài khoản <strong>YÊN Homestay</strong> không?
                </p>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button type="button" className="btn btn-light rounded-3 px-4" onClick={() => setShowLogoutModal(false)}>Hủy bỏ</button>
                <button
                  type="button"
                  className="btn btn-danger rounded-3 px-4 fw-semibold d-inline-flex align-items-center gap-2"
                  onClick={() => {
                    authService.logout();
                    setShowLogoutModal(false);
                    navigate("/login");
                  }}
                >
                  <i className="bi bi-box-arrow-right"></i> Đăng xuất
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Modal Clear History */}
      {showClearHistoryModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} tabindex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-danger"><i className="bi bi-trash3-fill me-2"></i>Xác nhận xóa lịch sử xem</h5>
                <button type="button" className="btn-close" onClick={() => setShowClearHistoryModal(false)}></button>
              </div>
              <div className="modal-body py-3">
                <p className="text-sm text-secondary mb-0">Bạn có chắc chắn muốn xóa toàn bộ danh sách Homestay đã xem gần đây không?</p>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button type="button" className="btn btn-light" onClick={() => setShowClearHistoryModal(false)}>Hủy bỏ</button>
                <button type="button" className="btn btn-danger fw-semibold" onClick={confirmClearHistory}>Đồng ý xóa</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal Invoice */}
      {showInvoiceModal && selectedInvoice && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} tabindex="-1">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header bg-light border-bottom p-4">
                <div className="d-flex align-items-center justify-content-between w-100">
                  <div className="d-flex align-items-center gap-3">
                    <div className="bg-success text-white rounded-3 p-2 d-flex align-items-center justify-content-center" style={{ width: "44px", height: "44px" }}>
                      <i className="bi bi-receipt-cutoff fs-4"></i>
                    </div>
                    <div>
                      <h5 className="fw-extrabold text-dark mb-0">HÓA ĐƠN XÁC NHẬN THANH TOÁN</h5>
                      <p className="text-xs text-muted mb-0">Mã hóa đơn: <strong className="text-success">#{selectedInvoice.code}</strong> • YÊN Homestay Booking System</p>
                    </div>
                  </div>
                  <button type="button" className="btn-close" onClick={() => setShowInvoiceModal(false)}></button>
                </div>
              </div>
              <div className="modal-body p-4">
                <div className="row g-3 mb-4 pb-3 border-bottom">
                  <div className="col-6">
                    <small className="text-muted text-uppercase text-xs fw-bold">Thông tin khách hàng</small>
                    <h6 className="fw-bold text-dark mb-1 mt-1">{profile.fullName}</h6>
                    <p className="text-xs text-muted mb-0"><i className="bi bi-telephone me-1"></i>{profile.phone}</p>
                    <p className="text-xs text-muted mb-0"><i className="bi bi-envelope me-1"></i>{profile.email}</p>
                  </div>
                  <div className="col-6 text-end">
                    <small className="text-muted text-uppercase text-xs fw-bold">Thông tin thanh toán</small>
                    <p className="text-xs mb-1 mt-1">Phương thức: <strong className="text-dark">{selectedInvoice.method}</strong></p>
                    <span className="badge bg-success text-white px-2.5 py-1">{selectedInvoice.status}</span>
                  </div>
                </div>

                <div className="p-3 rounded-3 bg-light border mb-4">
                  <small className="text-muted text-uppercase text-xs fw-bold d-block mb-1">Cơ sở lưu trú homestay</small>
                  <h5 className="fw-extrabold text-dark mb-1">{selectedInvoice.name}</h5>
                  <p className="text-xs text-muted mb-0">
                    <i className="bi bi-geo-alt-fill text-danger me-1"></i>{selectedInvoice.loc} • Thời gian: <strong className="text-dark">{selectedInvoice.dates}</strong>
                  </p>
                </div>

                <h6 className="fw-bold text-dark mb-2 text-xs text-uppercase">Chi tiết các khoản phí thanh toán</h6>
                <div className="table-responsive mb-3">
                  <table className="table table-bordered align-middle text-sm mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Hạng mục dịch vụ</th>
                        <th className="text-end">Đơn giá</th>
                        <th className="text-end">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Tiền phòng lưu trú homestay</td>
                        <td className="text-end">{selectedInvoice.subTotal}</td>
                        <td className="text-end fw-bold">{selectedInvoice.subTotal}</td>
                      </tr>
                      <tr>
                        <td>Phí bảo vệ &amp; Dịch vụ dọn dẹp vệ sinh</td>
                        <td className="text-end">Miễn phí</td>
                        <td className="text-end text-success fw-bold">0đ</td>
                      </tr>
                      <tr>
                        <td>Áp dụng Mã giảm giá KH</td>
                        <td className="text-end text-danger">-{selectedInvoice.discount}</td>
                        <td className="text-end text-danger fw-bold">-{selectedInvoice.discount}</td>
                      </tr>
                      <tr className="table-success bg-opacity-10 fw-bold fs-6">
                        <td colSpan="2" className="text-end text-dark">TỔNG TIỀN THANH TOÁN CHI TRẢ:</td>
                        <td className="text-end text-success fs-5">{selectedInvoice.paid}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="p-3 rounded-3 bg-success bg-opacity-10 border border-success border-opacity-25 d-flex align-items-center justify-content-between">
                  <small className="text-success text-xs"><i className="bi bi-shield-check me-1 fs-6"></i>Hóa đơn điện tử hợp lệ được phát hành bởi Hệ thống Du lịch Homestay YÊN.</small>
                  <span className="text-xs text-muted">Mã Txn: {selectedInvoice.txnId}</span>
                </div>
              </div>
              <div className="modal-footer bg-light border-top p-3">
                <button type="button" className="btn btn-outline-secondary fw-semibold" onClick={() => setShowInvoiceModal(false)}>Đóng</button>
                <button type="button" className="btn btn-outline-success fw-semibold" onClick={() => window.print()}><i className="bi bi-printer me-1"></i> In hóa đơn</button>
                <button type="button" className="btn btn-eco-save fw-bold" onClick={() => alert('Đã tải file Hóa đơn PDF thành công!')}><i className="bi bi-download me-1"></i> Tải PDF</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. Modal Withdraw */}
      {showWithdrawModal && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} tabindex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-dark"><i className="bi bi-bank text-success me-2"></i>Rút tiền số dư về ngân hàng</h5>
                <button type="button" className="btn-close" onClick={() => setShowWithdrawModal(false)}></button>
              </div>
              <form onSubmit={handleWithdrawSubmit}>
                <div className="modal-body py-3">
                  <div className="mb-3">
                    <label className="form-label text-sm fw-semibold">Ngân hàng thụ hưởng</label>
                    <select
                      className="form-select form-select-custom"
                      value={withdrawForm.bank}
                      onChange={(e) => setWithdrawForm({ ...withdrawForm, bank: e.target.value })}
                    >
                      <option value="Vietcombank">Vietcombank (Ngân hàng TMCP Ngoại Thương)</option>
                      <option value="Techcombank">Techcombank (Ngân hàng Kỹ Thương)</option>
                      <option value="MBBank">MBBank (Ngân hàng Quân Đội)</option>
                      <option value="BIDV">BIDV (Ngân hàng Đầu tư &amp; Phát triển)</option>
                      <option value="VietinBank">VietinBank (Ngân hàng Công Thương)</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-sm fw-semibold">Số tài khoản nhận tiền</label>
                    <input
                      type="text"
                      className="form-control form-control-custom"
                      value={withdrawForm.accNum}
                      onChange={(e) => setWithdrawForm({ ...withdrawForm, accNum: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-sm fw-semibold">Số tiền muốn rút (VNĐ)</label>
                    <input
                      type="number"
                      className="form-control form-control-custom"
                      value={withdrawForm.amount}
                      onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                      min="50000"
                      max={balance}
                      required
                    />
                    <small className="text-muted text-xs mt-1 d-block">
                      Số dư hiện tại: <strong className="text-success">{balance.toLocaleString("vi-VN")}đ</strong>
                    </small>
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-light" onClick={() => setShowWithdrawModal(false)}>Hủy</button>
                  <button type="submit" className="btn btn-eco-save">Rút ngay</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 9. Modal Voucher Terms */}
      {termsModalVoucher && (
        <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} tabindex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-dark"><i className="bi bi-info-circle-fill text-success me-2"></i>Điều kiện sử dụng Voucher</h5>
                <button type="button" className="btn-close" onClick={() => setTermsModalVoucher(null)}></button>
              </div>
              <div className="modal-body py-3">
                <h6 className="fw-bold text-success">{termsModalVoucher.code} - {termsModalVoucher.discountText}</h6>
                <p className="text-sm text-secondary mb-2">{termsModalVoucher.title}</p>
                <ul className="text-xs text-muted mb-0 ps-3">
                  <li>{termsModalVoucher.condText}</li>
                  <li>Áp dụng khi thanh toán trực tuyến qua Ví YÊN Pay hoặc Chuyển khoản QR.</li>
                  <li>Mỗi tài khoản chỉ áp dụng mã 1 lần cho mỗi chuyến đi.</li>
                  <li>Không áp dụng đồng thời với các chương trình khuyến mãi đặc biệt khác.</li>
                </ul>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button type="button" className="btn btn-eco-save" onClick={() => setTermsModalVoucher(null)}>Đã hiểu</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Render */}
      {toast.show && (
        <div className="toast-container position-fixed bottom-0 end-0 p-3 z-3">
          <div className="toast toast-eco show border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div className="toast-header">
              <i className="bi bi-check-circle-fill me-2 text-white"></i>
              <strong className="me-auto text-white">{toast.title}</strong>
              <small className="text-white-50">vừa xong</small>
            </div>
            <div className="toast-body bg-success text-white rounded-bottom">
              {toast.body}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
