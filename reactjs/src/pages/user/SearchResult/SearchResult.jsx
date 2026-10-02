import React, { useState, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import SearchSidebar from '../../../components/SearchSidebar/SearchSidebar';
import './SearchResult.css';

const SAMPLE_HOMESTAYS = [
  {
    id: 'HS-001',
    name: 'A&L Service Apartment - Rivergate Residence',
    location: 'Quận 4, TP. Hồ Chí Minh (Bach Dang Riverside)',
    city: 'hcm',
    distance: 'Cách trung tâm 1km',
    desc: 'Tọa lạc cách Bến cảng Nhà Rồng 16 phút đi bộ, A&L Service Apartment - Rivergate Residence cung cấp chỗ nghỉ có hồ bơi ngoài trời, khu vườn và dịch vụ phòng.',
    rating: 9.5,
    reviews: 81,
    stars: 4,
    price: 1250000,
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
    services: ['Hồ bơi ngoài trời', 'Đưa đón sân bay', 'Ăn sáng miễn phí'],
    roomAmenities: ['Ban công view sông', 'Bếp riêng', 'Máy giặt'],
    amenities: ['Wifi tốc độ cao', 'Thang máy', 'Bãi đậu xe'],
    travelGroups: ['Cặp đôi', 'Gia đình', 'Nhóm bạn'],
    capacity: 4
  },
  {
    id: 'HS-002',
    name: 'OlaStay Serviced Apartments Free Pool',
    location: 'Quận 4, TP. Hồ Chí Minh (Bach Dang Riverside)',
    city: 'hcm',
    distance: 'Cách trung tâm 1km',
    desc: 'Tọa lạc ở TP. Hồ Chí Minh, OlaStay Serviced Apartments Free Pool cung cấp chỗ nghỉ có hồ bơi ngoài trời mở quanh năm. Chỗ đậu xe riêng có sẵn trong khuôn viên.',
    rating: 10,
    reviews: 7,
    stars: 5,
    price: 1680000,
    image: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=600&q=80',
    services: ['Hồ bơi vô cực', 'Lễ tân 24/7', 'Cho thuê xe máy'],
    roomAmenities: ['Bồn tắm ngâm', 'Smart TV 55 inch', 'Bếp hiện đại'],
    amenities: ['Phòng Gym', 'Sân thượng view toàn cảnh', 'Wifi miễn phí'],
    travelGroups: ['Cặp đôi', 'Khách công tác'],
    capacity: 2
  },
  {
    id: 'HS-003',
    name: 'Han River Glass House Đà Nẵng',
    location: 'Bờ sông Hàn, Quận Hải Châu, Đà Nẵng',
    city: 'danang',
    distance: 'Cách Cầu Rồng 500m',
    desc: 'Căn hộ panorama mặt kính view trọn bờ sông Hàn và cầu Rồng phun lửa. Không gian nội thất gỗ mộc mạc kết hợp phong cách hiện đại.',
    rating: 9.8,
    reviews: 184,
    stars: 5,
    price: 1150000,
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
    services: ['Đón sân bay miễn phí', 'Cho thuê xe máy', 'Thưởng trà chiều'],
    roomAmenities: ['Cửa kính Panorama', 'Bếp full trang thiết bị', 'Máy sấy quần áo'],
    amenities: ['Hồ bơi sân thượng', 'Khu nướng BBQ', 'Bãi đỗ xe ô tô'],
    travelGroups: ['Cặp đôi', 'Gia đình', 'Nhóm bạn'],
    capacity: 4
  },
  {
    id: 'HS-004',
    name: 'The Memory Valley Villa Đà Lạt',
    location: 'Hồ Tuyền Lâm, Phường 3, TP. Đà Lạt',
    city: 'dalat',
    distance: 'Cách trung tâm 3.5km',
    desc: 'Biệt thự thung lũng giữa rừng thông Đà Lạt với hồ bơi nước ấm ngâm chân ngoài trời. View săn mây sáng sớm siêu lãng mạn.',
    rating: 9.7,
    reviews: 340,
    stars: 5,
    price: 1450000,
    image: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=600&q=80',
    services: ['Hồ bơi nước ấm', 'Đốt lửa trại nướng khoai', 'Dịch vụ chụp ảnh'],
    roomAmenities: ['Lò sưởi ấm áp', 'Ban công ngắm mây', 'Bồn tắm gỗ sồi'],
    amenities: ['Sân vườn nướng BBQ', 'Quán cà phê sân thượng', 'Bãi đỗ xe'],
    travelGroups: ['Gia đình', 'Nhóm bạn', 'Cặp đôi'],
    capacity: 8
  },
  {
    id: 'HS-005',
    name: 'Topas Ecolodge Sapa Homestay',
    location: 'Thung lũng Mường Hoa, Sa Pa, Lào Cai',
    city: 'sapa',
    distance: 'Cách thị trấn Sa Pa 12km',
    desc: 'Bungalow đá tự nhiên nằm trên đỉnh đồi nhìn thẳng ra thung lũng Mường Hoa. Bể bơi vô cực nước ấm giữa mây ngàn tây bắc.',
    rating: 9.9,
    reviews: 310,
    stars: 5,
    price: 4590000,
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80',
    services: ['Xe Limousine đưa đón', 'Spa massage thảo mộc', 'Bữa sáng bản địa'],
    roomAmenities: ['Ban công ruộng bậc thang', 'Nội thất gỗ tre', 'Sưởi sàn'],
    amenities: ['Bể bơi vô cực nước ấm', 'Nhà hàng ẩm thực H’Mông', 'Sân hiên ngắm mây'],
    travelGroups: ['Cặp đôi', 'Gia đình nghỉ dưỡng'],
    capacity: 2
  },
  {
    id: 'HS-006',
    name: 'Tràng An Valley Retreat Ninh Bình',
    location: 'Xã Trường Yên, Huyện Hoa Lư, Ninh Bình',
    city: 'ninhbinh',
    distance: 'Cách danh thắng Tràng An 1.2km',
    desc: 'Khu bungalow nằm tựa lưng vào dãy núi đá vôi trập trùng. Bao quanh bởi đầm sen ngát hương và đồng lúa chín vàng.',
    rating: 9.6,
    reviews: 175,
    stars: 4,
    price: 1050000,
    image: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=80',
    services: ['Mượn xe đạp miễn phí', 'Chèo thuyền Kayak', 'Dịch vụ ngâm chân thảo dược'],
    roomAmenities: ['View núi đá vôi', 'Máy lạnh 2 chiều', 'Trà sen thủ công'],
    amenities: ['Hồ bơi ngoài trời', 'Sân vườn đầm sen', 'Bãi đỗ xe miễn phí'],
    travelGroups: ['Cặp đôi', 'Gia đình', 'Nhóm bạn'],
    capacity: 3
  }
];

export default function SearchResult() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Query Params
  const queryDest = searchParams.get('q') || searchParams.get('destination') || searchParams.get('location') || '';
  const queryGuests = searchParams.get('guests') || '';

  // View Layout Mode: 'horizontal' (xem ngang) | 'vertical' (xem dọc)
  const [viewMode, setViewMode] = useState('horizontal');

  // Sort Option
  const [sortBy, setSortBy] = useState('rating');
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Filters State
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedRoomAmenities, setSelectedRoomAmenities] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [selectedTravelGroups, setSelectedTravelGroups] = useState([]);

  // Favorites
  const [favorites, setFavorites] = useState(new Set());

  // Toast notice
  const [toast, setToast] = useState({ show: false, msg: '' });

  const triggerToast = (msg) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: '' }), 2600);
  };

  const toggleFavorite = (id, e) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        triggerToast('Đã bỏ chỗ nghỉ khỏi danh sách yêu thích.');
      } else {
        next.add(id);
        triggerToast('Đã thêm chỗ nghỉ vào danh sách yêu thích!');
      }
      return next;
    });
  };

  const handleFilterToggle = (list, setList, val) => {
    if (list.includes(val)) {
      setList(list.filter((item) => item !== val));
    } else {
      setList([...list, val]);
    }
  };

  const clearAllFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setSelectedServices([]);
    setSelectedRoomAmenities([]);
    setSelectedAmenities([]);
    setSelectedTravelGroups([]);
    triggerToast('Đã xóa toàn bộ bộ lọc!');
  };

  // Extract unique options for filters
  const allServices = useMemo(() => [...new Set(SAMPLE_HOMESTAYS.flatMap((h) => h.services))], []);
  const allRoomAmenities = useMemo(() => [...new Set(SAMPLE_HOMESTAYS.flatMap((h) => h.roomAmenities))], []);
  const allAmenities = useMemo(() => [...new Set(SAMPLE_HOMESTAYS.flatMap((h) => h.amenities))], []);
  const allTravelGroups = useMemo(() => [...new Set(SAMPLE_HOMESTAYS.flatMap((h) => h.travelGroups))], []);

  // Filtered & Sorted Homestays
  const filteredHomestays = useMemo(() => {
    return SAMPLE_HOMESTAYS.filter((item) => {
      // Search keyword matching
      if (queryDest) {
        const kw = queryDest.toLowerCase();
        const matchText = [item.name, item.location, item.desc].join(' ').toLowerCase();
        if (!matchText.includes(kw)) return false;
      }

      // Price filter
      if (minPrice !== '' && item.price < Number(minPrice)) return false;
      if (maxPrice !== '' && item.price > Number(maxPrice)) return false;

      // Category filters
      if (selectedServices.length > 0 && !selectedServices.every((s) => item.services.includes(s))) return false;
      if (selectedRoomAmenities.length > 0 && !selectedRoomAmenities.every((r) => item.roomAmenities.includes(r))) return false;
      if (selectedAmenities.length > 0 && !selectedAmenities.every((a) => item.amenities.includes(a))) return false;
      if (selectedTravelGroups.length > 0 && !selectedTravelGroups.every((g) => item.travelGroups.includes(g))) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name, 'vi');
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name, 'vi');
      return b.rating - a.rating; // default: rating
    });
  }, [queryDest, minPrice, maxPrice, selectedServices, selectedRoomAmenities, selectedAmenities, selectedTravelGroups, sortBy]);

  const getSortLabel = (val) => {
    switch (val) {
      case 'price-asc': return 'Giá: Thấp đến Cao';
      case 'price-desc': return 'Giá: Cao đến Thấp';
      case 'name-asc': return 'Tên chỗ nghỉ: A–Z';
      case 'name-desc': return 'Tên chỗ nghỉ: Z–A';
      default: return 'Đánh giá cao nhất';
    }
  };

  const getRatingWord = (score) => {
    if (score >= 9.5) return 'Xuất sắc';
    if (score >= 9.0) return 'Tuyệt vời';
    if (score >= 8.5) return 'Rất tốt';
    return 'Tốt';
  };

  return (
    <main className="search-page-main">
      <div className="search-page-layout">
        {/* 1. FILTER SIDEBAR BÊN TRÁI */}
        <SearchSidebar
          minPrice={minPrice}
          setMinPrice={setMinPrice}
          maxPrice={maxPrice}
          setMaxPrice={setMaxPrice}
          allServices={allServices}
          selectedServices={selectedServices}
          setSelectedServices={setSelectedServices}
          allRoomAmenities={allRoomAmenities}
          selectedRoomAmenities={selectedRoomAmenities}
          setSelectedRoomAmenities={setSelectedRoomAmenities}
          allAmenities={allAmenities}
          selectedAmenities={selectedAmenities}
          setSelectedAmenities={setSelectedAmenities}
          allTravelGroups={allTravelGroups}
          selectedTravelGroups={selectedTravelGroups}
          setSelectedTravelGroups={setSelectedTravelGroups}
          onClearFilters={clearAllFilters}
        />

        {/* 2. KHU VỰC KẾT QUẢ TÌM KIẾM BÊN PHẢI */}
        <div className="search-results-container">
          {/* Header toolbar */}
          <div className="results-header">
            <h2>{queryDest ? `${queryDest}: tìm thấy ${filteredHomestays.length} chỗ nghỉ` : `Tìm thấy ${filteredHomestays.length} chỗ nghỉ`}</h2>
            <div className="view-toggle">
              <button
                type="button"
                className={`btn-view ${viewMode === 'horizontal' ? 'active' : ''}`}
                onClick={() => setViewMode('horizontal')}
              >
                <i className="bi bi-list-task me-1"></i> Xem ngang
              </button>
              <button
                type="button"
                className={`btn-view ${viewMode === 'vertical' ? 'active' : ''}`}
                onClick={() => setViewMode('vertical')}
              >
                <i className="bi bi-grid-3x3-gap-fill me-1"></i> Xem dọc
              </button>
            </div>
          </div>

          {/* Sắp xếp Custom Dropdown */}
          <div className="sort-dropdown">
            <div
              className={`btn-sort custom-select ${isSortOpen ? 'open' : ''}`}
              onClick={() => setIsSortOpen(!isSortOpen)}
            >
              <i className="bi bi-arrow-down-up"></i>
              <span>Sắp xếp theo:</span>
              <div className="selected-option">{getSortLabel(sortBy)}</div>
              <i className="bi bi-chevron-down arrow-icon"></i>

              <div className={`select-items ${isSortOpen ? '' : 'hide'}`}>
                {[
                  { key: 'rating', label: 'Đánh giá cao nhất' },
                  { key: 'price-asc', label: 'Giá: Thấp đến Cao' },
                  { key: 'price-desc', label: 'Giá: Cao đến Thấp' },
                  { key: 'name-asc', label: 'Tên chỗ nghỉ: A–Z' },
                  { key: 'name-desc', label: 'Tên chỗ nghỉ: Z–A' }
                ].map((opt) => (
                  <div
                    key={opt.key}
                    className={`select-option ${sortBy === opt.key ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSortBy(opt.key);
                      setIsSortOpen(false);
                    }}
                  >
                    {opt.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Lưới Homestays */}
          {filteredHomestays.length === 0 ? (
            <div className="empty-results">
              <i className="bi bi-geo-alt-fill display-4 text-success mb-2 d-block"></i>
              <h3>Chưa tìm thấy chỗ nghỉ phù hợp</h3>
              <p>Hãy thử đổi từ khóa tìm kiếm, mở rộng khoảng giá hoặc xóa bớt các bộ lọc tiện nghi nhé!</p>
              <button type="button" className="btn btn-outline-success mt-3" onClick={clearAllFilters}>
                Xóa tất cả bộ lọc
              </button>
            </div>
          ) : (
            <div className={`hotel-list ${viewMode === 'vertical' ? 'compact-view' : ''}`}>
              {filteredHomestays.map((item) => (
                <article key={item.id} className="hotel-card mui-shadow">
                  <div className="hotel-image">
                    <img src={item.image} alt={item.name} />
                    <button
                      type="button"
                      className={`btn-favorite ${favorites.has(item.id) ? 'active' : ''}`}
                      onClick={(e) => toggleFavorite(item.id, e)}
                      title="Yêu thích"
                    >
                      <i className={`bi ${favorites.has(item.id) ? 'bi-heart-fill text-danger' : 'bi-heart'}`}></i>
                    </button>
                  </div>

                  <div className="hotel-info">
                    <div className="info-main">
                      <h3 className="hotel-title">
                        <Link to="/homestay" className="text-decoration-none">{item.name}</Link>
                        <span className="stars">
                          {Array.from({ length: item.stars }).map((_, idx) => (
                            <i key={idx} className="bi bi-star-fill text-warning me-0.5"></i>
                          ))}
                        </span>
                      </h3>
                      <div className="hotel-location">
                        <a href="#map" onClick={(e) => e.preventDefault()}>{item.location}</a>
                      </div>
                      <div className="hotel-distance text-muted">{item.distance}</div>
                      <p className="hotel-desc">{item.desc}</p>
                    </div>

                    <div className="info-action">
                      <div className="rating-section">
                        <div className="rating-text">
                          <div className="rating-word">{getRatingWord(item.rating)}</div>
                          <div className="rating-count">{item.reviews} đánh giá</div>
                        </div>
                        <div className="rating-score">{item.rating}</div>
                      </div>

                      <div className="location-score">
                        Giá từ: <strong className="fs-5 text-success">{item.price.toLocaleString('vi-VN')} VNĐ</strong> / đêm
                      </div>

                      <button
                        type="button"
                        className="btn-primary mui-btn choose-stay"
                        onClick={() => navigate('/homestay')}
                      >
                        Xem chi tiết
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Toast floating */}
      <div id="result-toast" className={toast.show ? 'show' : ''}>
        <i className="bi bi-check-circle-fill me-2 text-warning"></i>
        {toast.msg}
      </div>
    </main>
  );
}
