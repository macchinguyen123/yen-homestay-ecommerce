import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Promotions.css';

const INITIAL_VOUCHERS = [
  // --- MỤC 1: VOUCHER HOT NHẤT HÔM NAY ---
  {
    id: 'VCH-HS-001',
    homestayName: 'Han River Glass House',
    homestayImg: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
    location: 'Bờ sông Hàn, Đà Nẵng',
    city: 'danang',
    rating: '4.95',
    reviews: '184',
    code: 'HANRIVER200',
    section: 'hot',
    collectionBadge: '🔥 HOT NHẤT',
    tagClass: 'tag-red',
    discountVal: 'Giảm 200K',
    title: 'Han River Glass House',
    condition: 'Đơn từ 1.5tr · Đặt từ 2 đêm',
    isUrgent: false,
    isSaved: true,
    status: 'active',
    terms: [
      'Áp dụng tại Han River Glass House (Đà Nẵng).',
      'Đơn hàng tối thiểu từ 1.500.000đ trở lên.',
      'Mỗi tài khoản được lưu và sử dụng tối đa 1 lần.'
    ]
  },
  {
    id: 'VCH-HS-002',
    homestayName: 'The Memory Valley Villa',
    homestayImg: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=600&q=80',
    location: 'Hồ Tuyền Lâm, Đà Lạt',
    city: 'dalat',
    rating: '4.96',
    reviews: '340',
    code: 'MEMORY180',
    section: 'hot',
    collectionBadge: '🔥 HOT NHẤT',
    tagClass: 'tag-orange',
    discountVal: 'Giảm 180K',
    title: 'The Memory Valley Villa',
    condition: 'Đơn từ 1.2tr · Bể bơi nước ấm',
    isUrgent: false,
    isSaved: false,
    status: 'active',
    terms: [
      'Áp dụng tại căn Villa thung lũng Hồ Tuyền Lâm (Đà Lạt).',
      'Tự do sử dụng bể bơi nước ấm 24/7.'
    ]
  },
  {
    id: 'VCH-HS-003',
    homestayName: 'Tràng An Valley Retreat',
    homestayImg: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=80',
    location: 'Tràng An, Ninh Bình',
    city: 'ninhbinh',
    rating: '4.96',
    reviews: '175',
    code: 'TRANGAN120',
    section: 'hot',
    collectionBadge: '🔥 HOT NHẤT',
    tagClass: 'tag-teal',
    discountVal: 'Giảm 120K',
    title: 'Tràng An Valley Retreat',
    condition: 'Đơn từ 1.0tr · View núi đá vôi',
    isUrgent: false,
    isSaved: false,
    status: 'active',
    terms: [
      'Áp dụng khi đặt phòng dịp Lễ hội Khinh khí cầu Tràng An.',
      'Miễn phí mượn xe đạp dạo quanh đầm sen.'
    ]
  },
  {
    id: 'VCH-HS-004',
    homestayName: 'Topas Ecolodge Sapa',
    homestayImg: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80',
    location: 'Mường Hoa, Sapa',
    city: 'sapa',
    rating: '4.98',
    reviews: '310',
    code: 'TOPASHOT500',
    section: 'hot',
    collectionBadge: '🔥 HOT NHẤT',
    tagClass: 'tag-green',
    discountVal: 'Giảm 500K',
    title: 'Topas Ecolodge Sapa',
    condition: 'Đơn từ 3.8tr · Bể bơi vô cực',
    isUrgent: true,
    isSaved: true,
    status: 'active',
    terms: [
      'Áp dụng cho Bungalow view thung lũng Mường Hoa Sapa.',
      'Miễn phí xe đưa đón Limousine từ trung tâm Sapa.'
    ]
  },

  // --- MỤC 2: MÃ GIẢM GIÁ MỚI PHÁT HÀNH ---
  {
    id: 'VCH-HS-005',
    homestayName: 'Dalat Blooming Garden',
    homestayImg: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
    location: 'Hồ Xuân Hương, Đà Lạt',
    city: 'dalat',
    rating: '4.97',
    reviews: '230',
    code: 'BLOOMING100',
    section: 'new',
    collectionBadge: '✨ MỚI',
    tagClass: 'tag-green',
    discountVal: 'Giảm 100K',
    title: 'Dalat Blooming Garden',
    condition: 'Đơn từ 900k · Trà chiều miễn phí',
    isUrgent: false,
    isSaved: false,
    status: 'active',
    terms: [
      'Voucher áp dụng cho tất cả phòng tại Dalat Blooming Garden.',
      'Tặng 01 set trà chiều ngắm sương.'
    ]
  },
  {
    id: 'VCH-HS-006',
    homestayName: 'Nhà Rường Cổ Cố Đô',
    homestayImg: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=600&q=80',
    location: 'Đoàn Thị Điểm, TP. Huế',
    city: 'hue',
    rating: '4.94',
    reviews: '167',
    code: 'NHARUONG80',
    section: 'new',
    collectionBadge: '✨ MỚI',
    tagClass: 'tag-teal',
    discountVal: 'Giảm 80K',
    title: 'Nhà Rường Cổ Cố Đô',
    condition: 'Đơn từ 800k · Thưởng Trà Sen',
    isUrgent: false,
    isSaved: true,
    status: 'active',
    terms: [
      'Áp dụng tại Nhà Rường Cổ Cố Đô cách Đại Nội 350m.',
      'Miễn phí thử Áo dài check-in sân vườn.'
    ]
  },
  {
    id: 'VCH-HS-007',
    homestayName: 'Ninh Bình Eco Cabin',
    homestayImg: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80',
    location: 'Hoa Lư, Ninh Bình',
    city: 'ninhbinh',
    rating: '4.91',
    reviews: '138',
    code: 'NINHBINH70',
    section: 'new',
    collectionBadge: '✨ MỚI',
    tagClass: 'tag-orange',
    discountVal: 'Giảm 70K',
    title: 'Ninh Bình Eco Cabin',
    condition: 'Đơn từ 750k · Chèo Kayak miễn phí',
    isUrgent: false,
    isSaved: false,
    status: 'active',
    terms: [
      'Voucher áp dụng cho các Cabin gỗ giữa núi đá Hoa Lư.',
      'Tặng 01 lượt chèo thuyền Kayak đầm sen.'
    ]
  },
  {
    id: 'VCH-HS-008',
    homestayName: 'Rustic Pine Hill Cabin',
    homestayImg: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80',
    location: 'Bắc Sơn, Đà Lạt',
    city: 'dalat',
    rating: '4.88',
    reviews: '124',
    code: 'PINEHILL60',
    section: 'new',
    collectionBadge: '✨ MỚI',
    tagClass: 'tag-green',
    discountVal: 'Giảm 60K',
    title: 'Rustic Pine Hill Cabin',
    condition: 'Đơn từ 700k · Lửa trại nướng khoai',
    isUrgent: false,
    isSaved: false,
    status: 'active',
    terms: [
      'Áp dụng cho căn nhà gỗ dốc săn mây tại Khởi Nghĩa Bắc Sơn.'
    ]
  },

  // --- MỤC 3: VOUCHER DÙNG NHIỀU NHẤT ---
  {
    id: 'VCH-HS-009',
    homestayName: 'Danang Riverside Cozy Villa',
    homestayImg: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80',
    location: 'Trần Hưng Đạo, Đà Nẵng',
    city: 'danang',
    rating: '4.92',
    reviews: '142',
    code: 'COZYDANANG150',
    section: 'most_used',
    collectionBadge: '⚡ DÙNG NHIỀU',
    tagClass: 'tag-orange',
    discountVal: 'Giảm 150K',
    title: 'Danang Riverside Villa',
    condition: 'Đơn từ 1.3tr · Gần bờ sông Hàn',
    isUrgent: false,
    isSaved: false,
    status: 'active',
    terms: [
      'Áp dụng cho căn biệt thự Danang Riverside Cozy Villa.',
      'Tối đa 6 khách/căn, phù hợp cho nhóm bạn.'
    ]
  },
  {
    id: 'VCH-HS-010',
    homestayName: 'Sông Hương Lotus Villa',
    homestayImg: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80',
    location: 'Lê Lợi, TP. Huế',
    city: 'hue',
    rating: '4.90',
    reviews: '115',
    code: 'SONGHUONG100',
    section: 'most_used',
    collectionBadge: '⚡ DÙNG NHIỀU',
    tagClass: 'tag-teal',
    discountVal: 'Giảm 100K',
    title: 'Sông Hương Lotus Villa',
    condition: 'Đơn từ 1.0tr · Ban công ngắm sông',
    isUrgent: false,
    isSaved: false,
    status: 'active',
    terms: [
      'Áp dụng tại Villa view bờ sông Hương gần Cầu Trường Tiền.',
      'Phục vụ bữa sáng món Huế truyền thống.'
    ]
  },
  {
    id: 'VCH-HS-011',
    homestayName: 'My Khe Studio Đà Nẵng',
    homestayImg: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
    location: 'Quận Sơn Trà, Đà Nẵng',
    city: 'danang',
    rating: '4.89',
    reviews: '96',
    code: 'MYKHE50',
    section: 'most_used',
    collectionBadge: '⚡ DÙNG NHIỀU',
    tagClass: 'tag-green',
    discountVal: 'Giảm 50K',
    title: 'My Khe Studio Đà Nẵng',
    condition: 'Đơn từ 700k · Xe máy miễn phí',
    isUrgent: false,
    isSaved: true,
    status: 'active',
    terms: [
      'Áp dụng cho căn hộ Studio cách biển Mỹ Khê 300m.'
    ]
  },
  {
    id: 'VCH-HS-012',
    homestayName: 'Tam Cốc Golden Rice',
    homestayImg: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=600&q=80',
    location: 'Tam Cốc, Ninh Bình',
    city: 'ninhbinh',
    rating: '4.89',
    reviews: '112',
    code: 'TAMCOC80',
    section: 'most_used',
    collectionBadge: '⚡ DÙNG NHIỀU',
    tagClass: 'tag-orange',
    discountVal: 'Giảm 80K',
    title: 'Tam Cốc Golden Rice',
    condition: 'Đơn từ 700k · View đồng lúa chín',
    isUrgent: false,
    isSaved: false,
    status: 'active',
    terms: [
      'Áp dụng khi đặt phòng tại Tam Cốc Golden Rice Homestay.'
    ]
  },

  // --- MỤC 4: ĐẶC QUYỀN VIP & VILLA NGUYÊN CĂN ---
  {
    id: 'VCH-HS-013',
    homestayName: 'Sơn Trà Sunset Infinity Villa',
    homestayImg: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80',
    location: 'Sơn Trà, Đà Nẵng',
    city: 'danang',
    rating: '4.94',
    reviews: '215',
    code: 'SONTRA250',
    section: 'vip',
    collectionBadge: '🎁 ĐẶC QUYỀN VIP',
    tagClass: 'tag-red',
    discountVal: 'Giảm 250K',
    title: 'Sơn Trà Sunset Villa',
    condition: 'Đơn từ 2.2tr · Hồ bơi vô cực view biển',
    isUrgent: false,
    isSaved: true,
    status: 'active',
    terms: [
      'Dành riêng cho Villa bể bơi vô cực view biển Sơn Trà.',
      'Miễn phí nướng BBQ sân vườn ngoài trời.'
    ]
  },
  {
    id: 'VCH-HS-014',
    homestayName: 'Ana Mandara Villas Đà Lạt',
    homestayImg: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80',
    location: 'Lê Lai, TP. Đà Lạt',
    city: 'dalat',
    rating: '4.96',
    reviews: '195',
    code: 'ANAMANDARA300',
    section: 'vip',
    collectionBadge: '🎁 ĐẶC QUYỀN VIP',
    tagClass: 'tag-teal',
    discountVal: 'Giảm 300K',
    title: 'Ana Mandara Villas Đà Lạt',
    condition: 'Đơn từ 2.5tr · Ăn sáng tại phòng',
    isUrgent: false,
    isSaved: true,
    status: 'active',
    terms: [
      'Áp dụng cho biệt thự cổ Pháp tại Ana Mandara Đà Lạt.',
      'Miễn phí dịch vụ ăn sáng tại phòng.'
    ]
  },
  {
    id: 'VCH-HS-015',
    homestayName: 'Hang Múa Lotus View Ecolodge',
    homestayImg: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
    location: 'Khê Hạ, Ninh Bình',
    city: 'ninhbinh',
    rating: '4.93',
    reviews: '164',
    code: 'HANGMUA200',
    section: 'vip',
    collectionBadge: '🎁 ĐẶC QUYỀN VIP',
    tagClass: 'tag-orange',
    discountVal: 'Giảm 200K',
    title: 'Hang Múa Lotus View Ecolodge',
    condition: 'Đơn từ 1.8tr · View đỉnh Hang Múa',
    isUrgent: false,
    isSaved: false,
    status: 'active',
    terms: [
      'Dành riêng cho khu Ecolodge view đỉnh Hang Múa Ninh Bình.'
    ]
  },
  {
    id: 'VCH-HS-016',
    homestayName: 'Imperial Citadel Garden Villa',
    homestayImg: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80',
    location: 'Thuận Thành, TP. Huế',
    city: 'hue',
    rating: '4.92',
    reviews: '148',
    code: 'CITADEL150',
    section: 'vip',
    collectionBadge: '🎁 ĐẶC QUYỀN VIP',
    tagClass: 'tag-green',
    discountVal: 'Giảm 150K',
    title: 'Imperial Citadel Villa',
    condition: 'Đơn từ 1.5tr · Thưởng trà Ngự Hà',
    isUrgent: false,
    isSaved: false,
    status: 'active',
    terms: [
      'Áp dụng khi lưu trú tại Imperial Citadel Garden Villa Huế.'
    ]
  }
];

export default function Promotions() {
  const navigate = useNavigate();

  const [vouchers, setVouchers] = useState(INITIAL_VOUCHERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [redeemInput, setRedeemInput] = useState('');

  // Modal & Toast state
  const [selectedTermsVoucher, setSelectedTermsVoucher] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const handleToggleSave = (id) => {
    setVouchers((prev) =>
      prev.map((v) => {
        if (v.id === id) {
          const nextSaved = !v.isSaved;
          triggerToast(
            nextSaved
              ? `Đã lưu voucher "${v.code}" vào ví của bạn!`
              : `Đã bỏ lưu voucher "${v.code}".`
          );
          return { ...v, isSaved: nextSaved };
        }
        return v;
      })
    );
  };

  const handleSaveToWallet = (id) => {
    setVouchers((prev) =>
      prev.map((v) => {
        if (v.id === id) {
          triggerToast(`Đã lưu voucher "${v.code}" cho ${v.homestayName}!`);
          return { ...v, isSaved: true };
        }
        return v;
      })
    );
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    triggerToast(`Đã sao chép mã "${code}". Dán tại bước thanh toán để nhận ưu đãi!`);
  };

  const handleRedeemSubmit = (e) => {
    e.preventDefault();
    const raw = redeemInput.trim().toUpperCase();
    if (!raw) {
      triggerToast('Vui lòng nhập mã ưu đãi (Ví dụ: HANRIVER200)!');
      return;
    }

    const existing = vouchers.find((v) => v.code === raw);
    if (existing) {
      if (existing.isSaved) {
        triggerToast(`Mã "${raw}" đã có sẵn trong ví của bạn!`);
      } else {
        handleSaveToWallet(existing.id);
        triggerToast(`Kích hoạt thành công mã "${raw}" cho ${existing.homestayName}.`);
      }
    } else {
      triggerToast(`Mã "${raw}" không tồn tại hoặc đã hết thời gian áp dụng.`);
    }
    setRedeemInput('');
  };

  // Stats calculation
  const savedCount = vouchers.filter((v) => v.isSaved).length;
  const urgentCount = vouchers.filter((v) => v.isSaved && v.isUrgent).length;

  // Filter helper
  const filterBySection = (sec) => {
    return vouchers.filter((v) => {
      if (v.section !== sec) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        v.homestayName.toLowerCase().includes(q) ||
        v.code.toLowerCase().includes(q) ||
        v.location.toLowerCase().includes(q)
      );
    });
  };

  const renderGrid = (sectionKey) => {
    const items = filterBySection(sectionKey);

    if (items.length === 0) {
      return (
        <div className="empty-section-card">
          <p><i className="bi bi-info-circle me-1"></i> Chưa có voucher phù hợp trong mục này.</p>
        </div>
      );
    }

    return items.map((item) => (
      <div key={item.id} className="nearby-card compact-card">
        <div className="nearby-img-box compact-img-box">
          <span className={`nearby-tag ${item.tagClass}`}>{item.collectionBadge}</span>
          <button
            className={`nearby-heart-btn ${item.isSaved ? 'active text-danger' : ''}`}
            onClick={() => handleToggleSave(item.id)}
            title="Lưu voucher"
          >
            <i className={`bi ${item.isSaved ? 'bi-heart-fill text-danger' : 'bi-heart'}`}></i>
          </button>
          <img src={item.homestayImg} alt={item.homestayName} />
        </div>

        <div className="nearby-body compact-body">
          <div className="nearby-meta-row">
            <span className="nearby-location"><i className="bi bi-geo-alt-fill text-danger"></i> {item.location}</span>
            <span className="nearby-rating"><i className="bi bi-star-fill text-warning"></i> {item.rating}</span>
          </div>

          <h3 className="nearby-name compact-name" title={item.homestayName}>{item.homestayName}</h3>

          <div className="compact-voucher-strip">
            <div className="strip-left-val">{item.discountVal}</div>
            <div className="strip-right-code">
              <span className="code-pill">{item.code}</span>
              <span className="cond-text">{item.condition}</span>
            </div>
          </div>

          <div className="nearby-footer-row compact-footer">
            <button className="btn-terms-link" onClick={() => setSelectedTermsVoucher(item)}>Điều kiện</button>
            <div className="d-flex align-items-center gap-1.5">
              {item.isSaved ? (
                <button className="btn-voucher-action btn-use" onClick={() => handleCopyCode(item.code)} title="Sao chép mã">
                  Copy
                </button>
              ) : (
                <button className="btn-voucher-action btn-save" onClick={() => handleSaveToWallet(item.id)}>
                  Lưu
                </button>
              )}
              <Link to="/homestay" className="btn-room-detail">Xem phòng</Link>
            </div>
          </div>
        </div>
      </div>
    ));
  };

  return (
    <>
      {/* Banner Hero Khuyến Mãi */}
      <section className="promo-hero-section">
        <div className="container">
          <div className="promo-hero-wrapper">
            <div className="promo-hero-top">
              <div className="promo-hero-title-group">
                <div className="promo-badge-top">
                  <i className="bi bi-gift-fill"></i> Ưu đãi độc quyền cho du khách YÊN
                </div>
                <h1 className="promo-hero-title">Kho Mã Giảm Giá Homestay</h1>
                <p className="promo-hero-subtitle">
                  Khám phá mã giảm giá riêng cho từng Homestay tại Đà Nẵng, Đà Lạt, Sapa, Ninh Bình và Huế để tiết kiệm chi phí cho chuyến du lịch của bạn.
                </p>
              </div>

              {/* Ô Nhập Mã Khuyến Mãi */}
              <form className="promo-redeem-gold-box" onSubmit={handleRedeemSubmit}>
                <i className="bi bi-ticket-perforated-fill"></i>
                <input
                  type="text"
                  placeholder="Nhập mã ưu đãi (Ví dụ: HANRIVER200)..."
                  value={redeemInput}
                  onChange={(e) => setRedeemInput(e.target.value)}
                />
                <button type="submit" className="btn-redeem-gold">
                  Kích hoạt mã
                </button>
              </form>
            </div>

            {/* Thống Kê Nhanh */}
            <div className="promo-stats-bar">
              <div className="p-stat-item">
                <div className="p-stat-icon">
                  <i className="bi bi-wallet2"></i>
                </div>
                <div className="p-stat-info">
                  <p className="v-val">{savedCount} mã</p>
                  <p className="v-lbl">Mã đã lưu trong Ví</p>
                </div>
              </div>

              <div className="p-stat-item">
                <div className="p-stat-icon">
                  <i className="bi bi-house-heart"></i>
                </div>
                <div className="p-stat-info">
                  <p className="v-val">16 Homestay</p>
                  <p className="v-lbl">Đang có chương trình ưu đãi</p>
                </div>
              </div>

              <div className="p-stat-item">
                <div className="p-stat-icon">
                  <i className="bi bi-hourglass-split"></i>
                </div>
                <div className="p-stat-info">
                  <p className="v-val">{urgentCount} mã</p>
                  <p className="v-lbl">Mã sắp hết hạn trong 3 ngày</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="promotions-main-layout">
        <div className="container">
          {/* Thanh Tìm Kiếm */}
          <div className="promo-toolbar-wrap">
            <div className="promo-mode-row justify-content-center">
              <div className="search-hs-box" style={{ maxWidth: '540px' }}>
                <div className="search-icon-badge">
                  <i className="bi bi-search"></i>
                </div>
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên homestay, mã giảm giá hoặc địa danh (Topas, Han River, Đà Lạt)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="btn-search-clear"
                    onClick={() => setSearchQuery('')}
                    title="Xóa tìm kiếm"
                  >
                    <i className="bi bi-x-circle-fill"></i>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 1: VOUCHER HOT NHẤT HÔM NAY */}
          <section className="promo-section-block">
            <div className="section-header-hp">
              <div>
                <span className="section-badge-top">
                  <span className="nearby-dot"></span> ĐẶC BIỆT HOT
                </span>
                <h2 className="section-title">Voucher Hot Nhất Hôm Nay</h2>
                <p className="section-subtitle">Mã ưu đãi homestay siêu hot đang được nhiều du khách săn đón nhất</p>
              </div>
            </div>
            <div className="vouchers-grid">
              {renderGrid('hot')}
            </div>
          </section>

          {/* SECTION 2: MÃ GIẢM GIÁ MỚI PHÁT HÀNH */}
          <section className="promo-section-block">
            <div className="section-header-hp">
              <div>
                <span className="section-badge-top">
                  <span className="nearby-dot green"></span> CẬP NHẬT MỚI
                </span>
                <h2 className="section-title">Mã Giảm Giá Mới Phát Hành</h2>
                <p className="section-subtitle">Voucher vừa cập nhật dành riêng cho các homestay mới niêm yết trong tháng</p>
              </div>
            </div>
            <div className="vouchers-grid">
              {renderGrid('new')}
            </div>
          </section>

          {/* SECTION 3: VOUCHER ĐÃ DÙNG NHIỀU NHẤT */}
          <section className="promo-section-block">
            <div className="section-header-hp">
              <div>
                <span className="section-badge-top">
                  <span className="nearby-dot amber"></span> THÂN THIỆN DU KHÁCH
                </span>
                <h2 className="section-title">Voucher Dùng Nhiều Nhất</h2>
                <p className="section-subtitle">Top các mã được du khách quy đổi đặt phòng thành công cao nhất tuần qua</p>
              </div>
            </div>
            <div className="vouchers-grid">
              {renderGrid('most_used')}
            </div>
          </section>

          {/* SECTION 4: ĐẶC QUYỀN VIP & VILLA NGUYÊN CĂN */}
          <section className="promo-section-block">
            <div className="section-header-hp">
              <div>
                <span className="section-badge-top">
                  <span className="nearby-dot purple"></span> SANG TRỌNG &amp; RIÊNG TƯ
                </span>
                <h2 className="section-title">Đặc Quyền VIP &amp; Villa Nguyên Căn</h2>
                <p className="section-subtitle">Dành riêng cho khách lưu trú biệt thự nghỉ dưỡng và homestay cao cấp</p>
              </div>
            </div>
            <div className="vouchers-grid">
              {renderGrid('vip')}
            </div>
          </section>
        </div>
      </main>

      {/* Modal Điều Kiện */}
      {selectedTermsVoucher && (
        <div className="v-modal-overlay show" style={{ opacity: 1, visibility: 'visible' }}>
          <div className="v-modal-card">
            <div className="v-modal-header">
              <div>
                <h3>Điều Kiện Sử Dụng: <span>{selectedTermsVoucher.code} - {selectedTermsVoucher.homestayName}</span></h3>
              </div>
              <button className="v-modal-close-btn" onClick={() => setSelectedTermsVoucher(null)}>&times;</button>
            </div>

            <div className="v-modal-body">
              <p className="fw-bold text-dark mb-2">{selectedTermsVoucher.title}</p>

              <h4 className="fs-6 fw-bold text-secondary mt-3 mb-2">Quy định áp dụng:</h4>
              <ul className="terms-list">
                {selectedTermsVoucher.terms.map((t, idx) => (
                  <li key={idx}>{t}</li>
                ))}
              </ul>

              <div className="d-flex justify-content-end gap-2 mt-3">
                <button className="btn btn-sm btn-secondary" onClick={() => setSelectedTermsVoucher(null)}>Đóng</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notice */}
      <div className={`promo-toast ${showToast ? 'show' : ''}`}>
        <i className="bi bi-check-circle-fill"></i>
        <span>{toastMsg}</span>
      </div>
    </>
  );
}
