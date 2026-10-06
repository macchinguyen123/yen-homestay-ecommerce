import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Homepage.css';

const HERO_SLIDES = [
  { id: 1, img: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1920&q=80', title: 'Homestay giữa núi rừng bản địa chân thực' },
  { id: 2, img: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1600&q=80', title: 'Homestay Sapa bồng bềnh mây ngàn' },
  { id: 3, img: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1600&q=80', title: 'Homestay Hội An cổ kính thơ mộng' },
];

const EXPERIENCES = [
  { id: 1, title: 'Miệt vườn', desc: 'Ở giữa vườn cây, hái trái, làm vườn', tag: 'Miệt vườn', img: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=600&q=80' },
  { id: 2, title: 'Nông trại', desc: 'Trồng rau, thu hoạch, chăm vật nuôi, làm ruộng', tag: 'Nông trại', img: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=600&q=80' },
  { id: 3, title: 'Sông nước', desc: 'Đi xuồng, chèo ghe, câu cá, ngắm sông', tag: 'Sông nước', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80' },
  { id: 4, title: 'Nhà quê truyền thống', desc: 'Nhà gỗ, nhà vườn, nhà cổ địa phương', tag: 'Nhà quê', img: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=600&q=80' },
  { id: 5, title: 'Ẩm thực quê', desc: 'Nấu ăn cùng chủ nhà, làm bánh dân gian', tag: 'Ẩm thực', img: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80' },
  { id: 6, title: 'Làng nghề truyền thống', desc: 'Đan lát, làm gốm, dệt đồ thủ công', tag: 'Làng nghề', img: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80' },
  { id: 7, title: 'Thiên nhiên sinh thái', desc: 'Rừng, đồng ruộng, hồ, suối sinh thái', tag: 'Thiên nhiên', img: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80' },
  { id: 8, title: 'Trải nghiệm đời sống', desc: 'Bắt cá, hái rau, đi chợ quê, chăm vườn', tag: 'Đời sống', img: 'https://images.unsplash.com/photo-1516253593875-bd7ba052fbc5?auto=format&fit=crop&w=600&q=80' },
];

const COMBOS = [
  {
    id: 1,
    title: 'INTERCONTINENTAL ĐÀ NẴNG',
    discount: 'Combo tiết kiệm đến 34%',
    days: 'Combo 3N2Đ',
    desc: 'Bay khứ hồi · Phòng ban công toàn cảnh · Ăn sáng buffet cao cấp',
    price: '14.799.000đ',
    img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 2,
    title: 'TOPAS ECOLODGE SAPA',
    discount: 'Tiết kiệm 28%',
    days: 'Combo 3N2Đ Săn Mây',
    desc: 'Xe Limousine đón tiễn · Bungalow thung lũng Mường Hoa · Hồ bơi nước ấm',
    price: '4.590.000đ',
    img: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 3,
    title: 'ANA MANDARA VILLAS ĐÀ LẠT',
    discount: 'Ưu đãi mùa thu 30%',
    days: 'Combo 2N1Đ Sang Trọng',
    desc: 'Biệt thự cổ phong cách Pháp · Trà chiều hoàng gia · Ăn sáng tại phòng riêng',
    price: '2.890.000đ',
    img: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1600&q=80',
  },
];

const FESTIVALS = {
  diff: {
    badge: 'Sắp diễn ra vào tháng 6',
    name: 'Lễ Hội Pháo Hoa Quốc Tế Đà Nẵng (DIFF)',
    location: 'Sân khấu bờ sông Hàn, TP. Đà Nẵng',
    date: '08/06 - 13/07/2026',
    homestays: [
      { id: 'f1', name: 'Han River Glass House', location: 'Bờ sông Hàn, Đà Nẵng', distance: 'Cách điểm bắn pháo hoa 450m', rating: '4.95', reviews: '184', price: '1.150.000đ', tag: 'Gần khán đài pháo hoa', img: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80' },
      { id: 'f2', name: 'Danang Riverside Cozy Villa', location: 'Đường Trần Hưng Đạo, Đà Nẵng', distance: 'Cách điểm tổ chức 700m', rating: '4.92', reviews: '142', price: '1.450.000đ', tag: 'Đi bộ ra lễ hội', img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80' },
      { id: 'f3', name: 'Sơn Trà Sunset Infinity Villa', location: 'Quận Sơn Trà, Đà Nẵng', distance: 'Cách điểm tổ chức 1.2km', rating: '4.94', reviews: '215', price: '2.750.000đ', tag: 'View biển vô cực', img: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80' },
    ],
  },
  dalat: {
    badge: 'Khai mạc cuối năm',
    name: 'Festival Hoa Đà Lạt Sắc Màu Xứ Ngàn Hoa',
    location: 'Quảng trường Lâm Viên & Hồ Xuân Hương, Đà Lạt',
    date: '18/12 - 31/12/2026',
    homestays: [
      { id: 'f4', name: 'Dalat Blooming Garden Homestay', location: 'Hồ Xuân Hương, Đà Lạt', distance: 'Cách Quảng trường 400m', rating: '4.97', reviews: '230', price: '950.000đ', tag: 'Đi bộ ra Festival', img: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80' },
      { id: 'f5', name: 'The Memory Valley Villa', location: 'Hồ Tuyền Lâm, Đà Lạt', distance: 'Cách điểm tổ chức 1.5km', rating: '4.96', reviews: '340', price: '1.450.000đ', tag: 'Săn mây thung lũng', img: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=600&q=80' },
    ],
  },
};

const HOT_HOMESTAYS = [
  { id: 1, name: 'The Memory Valley Villa', city: 'dalat', location: 'Đà Lạt', rating: 4.96, reviews: 340, specs: '3 phòng ngủ · 6 khách', amenities: 'Bể bơi nước ấm · Lò sưởi củi · Sân BBQ đồi thông', price: '1.450.000đ', tag: 'Top 1 Bán Chạy', img: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=600&q=80' },
  { id: 2, name: 'An Bàng Seaside Haven', city: 'hoian', location: 'Hội An', rating: 4.93, reviews: 285, specs: '2 phòng ngủ · 4 khách', amenities: 'Sát biển 50m · Xe đạp miễn phí · Bữa sáng miền Trung', price: '1.550.000đ', tag: 'Đã đặt 31 lần', img: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80' },
  { id: 3, name: 'Mây Lang Thang Eco Lodge', city: 'sapa', location: 'Sapa', rating: 4.90, reviews: 198, specs: '1 phòng ngủ · 2 khách', amenities: 'View thung lũng Mường Hoa · Lẩu cá hồi · Tắm bồn gỗ', price: '1.100.000đ', tag: 'Đã đặt 29 lần', img: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=600&q=80' },
  { id: 4, name: 'Sơn Trà Sunset Infinity Villa', city: 'danang', location: 'Đà Nẵng', rating: 4.94, reviews: 215, specs: '4 phòng ngủ · 8 khách', amenities: 'Hồ bơi vô cực view biển · Bếp nướng BBQ · Karaoke', price: '2.750.000đ', tag: 'Đã đặt 26 lần', img: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80' },
];

const FAVORITES_HOMESTAYS = [
  { id: 101, name: 'The Pine Hill Retreat', city: 'dalat', location: 'Đà Lạt', rating: 4.90, reviews: 126, specs: '2 phòng ngủ · 4 khách', amenities: 'BBQ sân vườn · Lò sưởi củi · Bồn tắm ngắm mây', price: '1.200.000đ', tag: 'Chủ nhà tận tâm', img: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80' },
  { id: 102, name: 'Lạc Vào Phố Cổ Heritage', city: 'hoian', location: 'Hội An', rating: 4.95, reviews: 215, specs: '3 phòng ngủ · 6 khách', amenities: 'Bể bơi riêng · Xe đạp miễn phí · Trà chiều bản địa', price: '1.650.000đ', tag: 'Điểm kiến trúc', img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80' },
  { id: 103, name: 'Sapa Cloud Forest Lodge', city: 'sapa', location: 'Tả Van, Sapa', rating: 4.91, reviews: 154, specs: '1 phòng ngủ · 2 khách', amenities: 'Ban công săn mây · Tắm thuốc Dao Đỏ · Ăn tối gia đình', price: '980.000đ', tag: 'Trải nghiệm Dao Đỏ', img: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80' },
  { id: 104, name: 'Danang Ocean Horizon', city: 'danang', location: 'Bán đảo Sơn Trà, Đà Nẵng', rating: 4.94, reviews: 178, specs: '2 phòng ngủ · 4 khách', amenities: 'Bể bơi vô cực ngắm vịnh · Bếp BBQ · Đón tiễn sân bay', price: '1.450.000đ', tag: 'View biển triệu đô', img: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80' },
];

export default function Homepage() {
  const navigate = useNavigate();

  // Hero Slider
  const [currentSlide, setCurrentSlide] = useState(0);

  // Search Form State
  const [destination, setDestination] = useState('');
  const [checkin, setCheckin] = useState('2026-10-15');
  const [checkout, setCheckout] = useState('2026-10-18');
  const [guests, setGuests] = useState(2);
  const [rooms, setRooms] = useState(1);
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Featured Combo Slider
  const [comboIndex, setComboIndex] = useState(0);

  // Festival Section State
  const [activeFestivalKey, setActiveFestivalKey] = useState('diff');

  // Favorites Filter City State
  const [favCityFilter, setFavCityFilter] = useState('all');

  // Wishlist State
  const [wishlist, setWishlist] = useState(new Set());
  const [toast, setToast] = useState({ show: false, msg: '' });

  // Dynamic Data State
  const [homeData, setHomeData] = useState({
    heroSlides: HERO_SLIDES,
    experiences: EXPERIENCES,
    combos: COMBOS,
    festivals: FESTIVALS,
    hotHomestays: HOT_HOMESTAYS,
    favoritesHomestays: FAVORITES_HOMESTAYS
  });
  const [isLoading, setIsLoading] = useState(true);

  const expGridRef = useRef(null);

  // Fetch dynamic data
  useEffect(() => {
    fetch('http://localhost:8081/api/public/home')
      .then(res => res.json())
      .then(data => {
        if (data.heroSlides) {
          setHomeData(data);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.warn('Failed to fetch dynamic home data, using fallback:', err);
        setIsLoading(false);
      });
  }, []);

  // Hero slider auto-play
  useEffect(() => {
    if (homeData.heroSlides.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % homeData.heroSlides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [homeData.heroSlides.length]);

  // Combo slider auto-play
  useEffect(() => {
    if (homeData.combos.length === 0) return;
    const timer = setInterval(() => {
      setComboIndex((prev) => (prev + 1) % homeData.combos.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [homeData.combos.length]);

  const triggerToast = (msg) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: '' }), 2800);
  };

  const toggleWishlist = (name) => {
    setWishlist((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
        triggerToast(`Đã bỏ lưu "${name}" khỏi Wishlist.`);
      } else {
        next.add(name);
        triggerToast(`Đã thêm "${name}" vào danh sách Yêu thích!`);
      }
      return next;
    });
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    triggerToast(`Đang tìm kiếm homestay tại: ${destination || 'Tất cả điểm đến'}...`);
    setTimeout(() => {
      navigate(`/search?q=${encodeURIComponent(destination)}`);
    }, 800);
  };

  const scrollExperience = (direction) => {
    if (expGridRef.current) {
      expGridRef.current.scrollBy({ left: direction * 260, behavior: 'smooth' });
    }
  };

  const filteredFavorites = homeData.favoritesHomestays.filter((h) => {
    if (favCityFilter === 'all') return true;
    return h.city === favCityFilter;
  });

  const activeFestData = homeData.festivals[activeFestivalKey] || homeData.festivals.diff || FESTIVALS.diff;

  return (
    <div className="homepage-wrapper">
      {/* 1. BANNER HERO SLIDER */}
      <section className="hero-section">
        <div className="hero-slider-wrapper">
          <div className="hero-slider">
            {homeData.heroSlides.map((slide, i) => (
              <div key={slide.id} className={`hero-slide ${i === currentSlide ? 'active' : ''}`}>
                <img src={slide.img} alt={slide.title} className="hero-slide-img" />
              </div>
            ))}
          </div>

          <div className="hero-overlay-content">
            <div className="hero-badge">
              <i className="bi bi-compass" /> Du lịch gắn kết văn hóa bản địa chân thực
            </div>
            <h1 className="hero-slogan">Đi đâu không chỉ để ở – mà để<br />trải nghiệm.</h1>
            <p className="hero-subslogan">Tìm một nơi lưu trú phù hợp và bắt đầu hành trình khám phá những câu chuyện văn hóa độc bản khắp mọi miền Việt Nam.</p>

            {/* THANH TÌM KIẾM HERO */}
            <div className="hero-search-wrapper">
              <div className="search-box modern-gold-box">
                <form className="search-form" onSubmit={handleSearchSubmit}>
                  {/* Điểm đến */}
                  <div className="search-field field-with-border field-destination">
                    <i className="bi bi-geo-alt search-field-icon" />
                    <div className="field-content">
                      <label className="field-label" htmlFor="searchDest">Điểm đến hoặc tên homestay</label>
                      <input
                        type="text"
                        id="searchDest"
                        className="field-input"
                        placeholder="Bạn muốn đến đâu?"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Nhận phòng */}
                  <div className="search-field field-with-border field-checkin">
                    <i className="bi bi-calendar-check search-field-icon" />
                    <div className="field-content">
                      <label className="field-label" htmlFor="checkIn">Nhận phòng</label>
                      <input
                        type="date"
                        id="checkIn"
                        className="field-input"
                        value={checkin}
                        onChange={(e) => setCheckin(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Trả phòng */}
                  <div className="search-field field-with-border field-checkout">
                    <i className="bi bi-calendar-x search-field-icon" />
                    <div className="field-content">
                      <label className="field-label" htmlFor="checkOut">Trả phòng</label>
                      <input
                        type="date"
                        id="checkOut"
                        className="field-input"
                        value={checkout}
                        onChange={(e) => setCheckout(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Khách & Phòng Popover Stepper */}
                  <div className="search-field field-guests-rooms">
                    <button
                      type="button"
                      className="guests-toggle-btn"
                      onClick={() => setPopoverOpen(!popoverOpen)}
                    >
                      <i className="bi bi-people-fill search-field-icon" />
                      <div className="field-content">
                        <span className="field-label">Khách & phòng</span>
                        <span className="field-input">{guests} khách · {rooms} phòng</span>
                      </div>
                      <i className="bi bi-chevron-down" style={{ fontSize: '0.75rem', color: '#94A3B8' }} />
                    </button>

                    {popoverOpen && (
                      <div className="guests-popover">
                        <div className="stepper-row">
                          <div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Số khách</div>
                            <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Tối đa 20 khách</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <button
                              type="button"
                              className="stepper-btn"
                              disabled={guests <= 1}
                              onClick={() => setGuests((g) => Math.max(1, g - 1))}
                            >-</button>
                            <span style={{ fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{guests}</span>
                            <button
                              type="button"
                              className="stepper-btn"
                              onClick={() => setGuests((g) => Math.min(20, g + 1))}
                            >+</button>
                          </div>
                        </div>

                        <div className="stepper-row">
                          <div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Số phòng</div>
                            <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>Tối đa 10 phòng</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <button
                              type="button"
                              className="stepper-btn"
                              disabled={rooms <= 1}
                              onClick={() => setRooms((r) => Math.max(1, r - 1))}
                            >-</button>
                            <span style={{ fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{rooms}</span>
                            <button
                              type="button"
                              className="stepper-btn"
                              onClick={() => setRooms((r) => Math.min(10, r + 1))}
                            >+</button>
                          </div>
                        </div>

                        <button type="button" className="guests-done-btn" onClick={() => setPopoverOpen(false)}>
                          Xong
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Submit */}
                  <button type="submit" className="search-submit-btn">
                    <i className="bi bi-search" /><span>Tìm kiếm</span>
                  </button>
                </form>
              </div>

              {/* Quick tags */}
              <div className="modern-hero-tags">
                <span className="tags-label"><i className="bi bi-fire" /> Gợi ý:</span>
                {['Đà Lạt', 'Đà Nẵng', 'Hội An', 'Sapa', 'Ninh Bình', 'Phú Quốc'].map((tag) => (
                  <span
                    key={tag}
                    className="quick-tag"
                    onClick={() => { setDestination(tag); triggerToast(`Đã chọn điểm đến: ${tag}`); }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Slider Arrows */}
          <button
            type="button"
            className="slider-arrow prev"
            onClick={() => setCurrentSlide((prev) => (prev - 1 + homeData.heroSlides.length) % homeData.heroSlides.length)}
          >
            <i className="bi bi-chevron-left" />
          </button>
          <button
            type="button"
            className="slider-arrow next"
            onClick={() => setCurrentSlide((prev) => (prev + 1) % homeData.heroSlides.length)}
          >
            <i className="bi bi-chevron-right" />
          </button>

          <div className="slider-dots">
            {homeData.heroSlides.map((_, i) => (
              <span
                key={i}
                className={`dot ${i === currentSlide ? 'active' : ''}`}
                onClick={() => setCurrentSlide(i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 2. CATEGORIES: EXPERIENCES */}
      <section className="categories-section">
        <div className="hp-container">
          <div className="exp-header-wrap">
            <div>
              <span className="section-badge-top"><i className="bi bi-compass-fill" /> Danh mục trải nghiệm</span>
              <h2 className="section-title">Ý Tưởng Trải Nghiệm Bản Địa</h2>
              <p className="section-subtitle">Chạm vào nét mộc mạc, yên bình và hòa mình cùng thiên nhiên, đời sống làng quê</p>
            </div>
          </div>

          <div className="experience-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px', paddingBottom: '12px' }}>
            {homeData.experiences.slice(0, 12).map((exp) => {
              // Guess icon from title if not provided
              let iconClass = 'bi-tree';
              const t = (exp.title || '').toLowerCase();
              if (t.includes('nông') || t.includes('trại')) iconClass = 'bi-brightness-high';
              else if (t.includes('sông') || t.includes('nước')) iconClass = 'bi-water';
              else if (t.includes('nhà quê')) iconClass = 'bi-house';
              else if (t.includes('ẩm thực') || t.includes('ăn')) iconClass = 'bi-cup-hot';
              else if (t.includes('nghề')) iconClass = 'bi-brush';
              else if (t.includes('thiên nhiên')) iconClass = 'bi-compass';
              else if (t.includes('đời sống')) iconClass = 'bi-basket';
              else if (t.includes('văn hóa')) iconClass = 'bi-music-note-beamed';
              else if (t.includes('khám phá')) iconClass = 'bi-bicycle';
              else if (t.includes('nghỉ dưỡng') || t.includes('thư giãn')) iconClass = 'bi-cloud-sun';
              else if (t.includes('bản địa')) iconClass = 'bi-people';

              return (
                <div key={exp.id} className="experience-card" onClick={() => navigate('/booking')}>
                  <div className="exp-img-wrapper">
                    <img src={exp.img} alt={exp.title} loading="lazy" />
                    <span className="exp-badge">
                      <i className={`bi ${iconClass}`} style={{ marginRight: '4px' }} />
                      {exp.tag || exp.title}
                    </span>
                  </div>
                  <div className="exp-content">
                    <h4 className="exp-title">
                      <i className={`bi ${iconClass}`} style={{ color: '#15803D', marginRight: '6px' }} />
                      {exp.title}
                    </h4>
                    <p className="exp-desc">{exp.desc}</p>
                    <div className="exp-action">
                      <span>Khám phá ngay</span>
                      <i className="bi bi-arrow-right" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. FEATURED COMBO BANNER */}
      <section className="combo-section">
        <div className="hp-container">
          <div style={{ marginBottom: 20 }}>
            <span className="section-badge-top" style={{ color: '#D97706' }}>
              <i className="bi bi-fire" /> 522 khách đã đặt phòng trong 24h qua
            </span>
            <h2 className="section-title">Homestay tốt nhất hôm nay</h2>
            <p className="section-subtitle">Nhanh tay đặt ngay. Để mai sẽ lỡ</p>
          </div>

          <div className="combo-fullwidth-wrap">
            {homeData.combos.map((c, idx) => {
              if (idx !== comboIndex) return null;
              return (
                <div key={c.id} className="combo-card-banner">
                  <img src={c.img} alt={c.title} className="combo-bg-img" />
                  <div className="combo-card-overlay" />

                  <div className="combo-content">
                    <div>
                      <span className="combo-badge-discount">{c.discount}</span>
                      <span className="combo-badge-days">{c.days}</span>
                    </div>
                    <h3 className="combo-hotel-name">{c.title}</h3>
                    <p className="combo-description">{c.desc}</p>
                    <div className="combo-price-action">
                      <div className="combo-price">{c.price} <span>/ khách</span></div>
                      <Link to="/homestay/doi" className="btn-combo-arrow">
                        <i className="bi bi-arrow-right" style={{ fontSize: '1.2rem' }} />
                      </Link>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="combo-nav-btn combo-prev"
                    onClick={() => setComboIndex((prev) => (prev - 1 + homeData.combos.length) % homeData.combos.length)}
                  >
                    <i className="bi bi-chevron-left" />
                  </button>
                  <button
                    type="button"
                    className="combo-nav-btn combo-next"
                    onClick={() => setComboIndex((prev) => (prev + 1) % homeData.combos.length)}
                  >
                    <i className="bi bi-chevron-right" />
                  </button>
                </div>
              );
            })}

            <div className="combo-pagination">
              {homeData.combos.map((_, idx) => (
                <span
                  key={idx}
                  className={`combo-dot ${idx === comboIndex ? 'active' : ''}`}
                  onClick={() => setComboIndex(idx)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. FESTIVAL HOMESTAY */}
      <section className="festival-section">
        <div className="hp-container">
          <div className="festival-header-badge">
            <i className="bi bi-balloon-fill" /> Sôi động mùa lễ hội
          </div>
          <h2 className="section-title">Homestay theo lễ hội</h2>

          <div className="festival-concept-box">
            <span style={{ color: '#B45309' }}><i className="bi bi-calendar-event-fill" /> Lễ hội sắp diễn ra</span>
            <span>→</span>
            <span style={{ color: '#B45309' }}><i className="bi bi-geo-alt-fill" /> Địa điểm tổ chức</span>
            <span>→</span>
            <span style={{ color: '#15803D' }}><i className="bi bi-house-heart-fill" /> Homestay gần đó dễ dàng di chuyển</span>
          </div>

          <div className="festival-tabs">
            <button
              type="button"
              className={`festival-tab-btn ${activeFestivalKey === 'diff' ? 'active' : ''}`}
              onClick={() => setActiveFestivalKey('diff')}
            >
              <i className="bi bi-fire" /> Lễ Hội Pháo Hoa Quốc Tế DIFF (Đà Nẵng)
            </button>
            <button
              type="button"
              className={`festival-tab-btn ${activeFestivalKey === 'dalat' ? 'active' : ''}`}
              onClick={() => setActiveFestivalKey('dalat')}
            >
              <i className="bi bi-flower1" /> Festival Hoa Đà Lạt (Lâm Viên)
            </button>
          </div>

          <div className="festival-banner-card">
            <div>
              <span className="fest-badge">{activeFestData.badge}</span>
              <h3 className="fest-name">{activeFestData.name}</h3>
              <div className="fest-meta">
                <span><i className="bi bi-geo-alt-fill" /> <strong>{activeFestData.location}</strong></span>
                <span><i className="bi bi-clock-fill" /> <strong>{activeFestData.date}</strong></span>
              </div>
            </div>
            <Link to="/homestay/doi" className="btn-view-room" style={{ background: '#D97706', whiteSpace: 'nowrap' }}>
              Xem homestay gần nhất
            </Link>
          </div>

          <div className="festival-homestays-grid">
            {activeFestData.homestays.map((h) => (
              <div key={h.id} className="homestay-card">
                <div className="card-img-wrapper">
                  <span className="card-top-tag">{h.tag}</span>
                  <button
                    type="button"
                    className={`card-wishlist-btn ${wishlist.has(h.name) ? 'active' : ''}`}
                    onClick={() => toggleWishlist(h.name)}
                  >
                    <i className={`bi ${wishlist.has(h.name) ? 'bi-heart-fill' : 'bi-heart'}`} />
                  </button>
                  <img src={h.img} alt={h.name} />
                </div>
                <div className="card-body">
                  <div className="card-location-rating">
                    <span className="card-location"><i className="bi bi-geo-alt-fill text-success" /> {h.location}</span>
                    <span className="card-rating"><i className="bi bi-star-fill" /> {h.rating} ({h.reviews})</span>
                  </div>
                  <h3 className="card-title"><Link to="/homestay/doi">{h.name}</Link></h3>
                  <div className="card-specs">{h.distance}</div>
                  <div className="card-footer-row">
                    <div>
                      <span className="price-label">Giá từ:</span>
                      <span className="card-price">{h.price}</span>
                    </div>
                    <Link to="/homestay/doi" className="btn-view-room">Xem homestay</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. HOT HOMESTAYS */}
      <section className="hot-section">
        <div className="hp-container">
          <span className="section-badge-top" style={{ color: '#E11D48' }}><i className="bi bi-graph-up-arrow" /> Xu hướng đặt phòng</span>
          <h2 className="section-title">Homestay hot được đặt nhiều nhất hôm nay</h2>
          <p className="section-subtitle">Top 4 căn homestay được khách hàng chốt phòng liên tục trong 24 giờ qua</p>

          <div className="hot-grid">
            {homeData.hotHomestays.map((h) => (
              <div key={h.id} className="homestay-card">
                <div className="card-img-wrapper">
                  <span className="card-top-tag tag-hot"><i className="bi bi-fire" /> {h.tag}</span>
                  <button
                    type="button"
                    className={`card-wishlist-btn ${wishlist.has(h.name) ? 'active' : ''}`}
                    onClick={() => toggleWishlist(h.name)}
                  >
                    <i className={`bi ${wishlist.has(h.name) ? 'bi-heart-fill' : 'bi-heart'}`} />
                  </button>
                  <img src={h.img} alt={h.name} />
                </div>
                <div className="card-body">
                  <div className="card-location-rating">
                    <span className="card-location"><i className="bi bi-geo-alt-fill text-success" /> {h.location}</span>
                    <span className="card-rating"><i className="bi bi-star-fill" /> {h.rating} ({h.reviews})</span>
                  </div>
                  <h3 className="card-title"><Link to="/homestay/doi">{h.name}</Link></h3>
                  <div className="card-specs"><span>{h.specs}</span></div>
                  <div className="card-amenities-box">
                    <span className="amenities-label">Tiện nghi nổi bật:</span>
                    <p className="amenities-items">{h.amenities}</p>
                  </div>
                  <div className="card-footer-row">
                    <div>
                      <span className="price-label">Giá từ:</span>
                      <span className="card-price">{h.price}</span>
                    </div>
                    <Link to="/homestay/doi" className="btn-view-room">Xem homestay</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. FAVORITES BY CITY */}
      <section className="favorites-section">
        <div className="hp-container">
          <span className="section-badge-top"><i className="bi bi-patch-check-fill" /> DU KHÁCH BÌNH CHỌN</span>
          <h2 className="section-title">Những homestay được yêu thích</h2>
          <p className="section-subtitle">Đánh giá thực tế từ hàng ngàn du khách đã trải nghiệm trọn vẹn sự tận tâm của chủ nhà</p>

          <div className="filter-tabs-wrapper">
            <div className="city-filter-tabs">
              {[
                { key: 'all', label: 'Tất cả' },
                { key: 'dalat', label: 'Đà Lạt' },
                { key: 'danang', label: 'Đà Nẵng' },
                { key: 'hoian', label: 'Hội An' },
                { key: 'sapa', label: 'Sapa' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={`city-tab ${favCityFilter === tab.key ? 'active' : ''}`}
                  onClick={() => setFavCityFilter(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="favorites-grid">
            {filteredFavorites.map((h) => (
              <div key={h.id} className="homestay-card">
                <div className="card-img-wrapper">
                  <span className="card-top-tag">{h.tag}</span>
                  <button
                    type="button"
                    className={`card-wishlist-btn ${wishlist.has(h.name) ? 'active' : ''}`}
                    onClick={() => toggleWishlist(h.name)}
                  >
                    <i className={`bi ${wishlist.has(h.name) ? 'bi-heart-fill' : 'bi-heart'}`} />
                  </button>
                  <img src={h.img} alt={h.name} />
                </div>
                <div className="card-body">
                  <div className="card-location-rating">
                    <span className="card-location"><i className="bi bi-geo-alt-fill text-success" /> {h.location}</span>
                    <span className="card-rating"><i className="bi bi-star-fill" /> {h.rating} ({h.reviews})</span>
                  </div>
                  <h3 className="card-title"><Link to="/homestay/doi">{h.name}</Link></h3>
                  <div className="card-specs"><span>{h.specs}</span></div>
                  <div className="card-amenities-box">
                    <span className="amenities-label">Tiện nghi nổi bật:</span>
                    <p className="amenities-items">{h.amenities}</p>
                  </div>
                  <div className="card-footer-row">
                    <div>
                      <span className="price-label">Giá từ:</span>
                      <span className="card-price">{h.price}</span>
                    </div>
                    <Link to="/homestay/doi" className="btn-view-room">Xem homestay</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Toast Notice */}
      <div className={`toast-notice ${toast.show ? 'show' : ''}`}>
        <i className="bi bi-check-circle-fill" />
        <span>{toast.msg}</span>
      </div>
    </div>
  );
}
