import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import SearchSidebar from '../../../components/SearchSidebar/SearchSidebar';
import { SAMPLE_HOMESTAYS } from '../../../data/sampleHomestays';
import { homestayService } from '../../../services/homestayService';
import './SearchResult.css';

// Hàm chuẩn hóa loại bỏ dấu tiếng Việt để tìm kiếm thông minh
function removeVietnameseTones(str) {
  if (!str) return '';
  let s = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  s = s.replace(/đ/g, 'd').replace(/Đ/g, 'd');
  return s.toLowerCase().trim();
}

const STOP_WORDS = new Set([
  'homestay', 'chỗ', 'cho', 'nghỉ', 'nghi', 'khách', 'khach', 'sạn', 'san',
  'phòng', 'phong', 'tại', 'tai', 'ở', 'o', 'gần', 'gan', 'và', 'va', 'các', 'cac',
  'resort', 'villa', 'nhà', 'nha', 'tìm', 'tim', 'kiếm', 'kiem', 'đặt', 'dat'
]);

// Kiểm tra homestay có khớp với từ khóa tìm kiếm hay không
function matchesQuery(item, query) {
  if (!query) return true;
  const kw = query.toLowerCase().trim();
  if (!kw || kw === 'tat ca diem den' || kw === 'tất cả điểm đến') return true;

  const rawFields = [
    item.name,
    item.homestayName,
    item.location,
    item.address,
    item.city,
    item.desc,
    item.description
  ].filter(Boolean);

  const rawTarget = rawFields.join(' ').toLowerCase();

  // 1. Khớp cụm từ trực tiếp (có dấu)
  if (rawTarget.includes(kw)) {
    if (kw.length <= 3) {
      const words = rawTarget.split(/[\s,.-]+/);
      if (words.some((w) => w === kw)) return true;
    } else {
      return true;
    }
  }

  // 2. Khớp cụm từ không dấu
  const noToneKw = removeVietnameseTones(kw);
  const noToneTarget = removeVietnameseTones(rawTarget);
  if (noToneTarget.includes(noToneKw)) {
    if (noToneKw.length <= 3) {
      const words = noToneTarget.split(/[\s,.-]+/);
      if (words.some((w) => w === noToneKw)) return true;
    } else {
      return true;
    }
  }

  // 3. Khớp không dấu và bỏ khoảng trắng (Ví dụ: "dalat" -> "da lat", "sapa" -> "sa pa", "phuquoc" -> "phu quoc", "vungtau" -> "vung tau")
  const noSpaceKw = noToneKw.replace(/\s+/g, '');
  const noSpaceTarget = noToneTarget.replace(/\s+/g, '');
  if (noSpaceKw.length >= 4 && noSpaceTarget.includes(noSpaceKw)) return true;

  // Xử lý các từ viết tắt phổ biến:
  if ((noSpaceKw === 'hcm' || noSpaceKw === 'tphcm' || noSpaceKw === 'saigon') &&
      (noToneTarget.includes('ho chi minh') || noToneTarget.includes('sai gon') || noToneTarget.includes('hcm'))) {
    return true;
  }
  if (noSpaceKw === 'hn' && (noToneTarget.includes('ha noi') || noToneTarget.includes('hanoi'))) {
    return true;
  }

  // 4. Token matching (bỏ stop words như 'homestay', 'phòng', 'tại',...)
  const tokens = noToneKw
    .split(/[\s,.-]+/)
    .filter((t) => t.length >= 2 && !STOP_WORDS.has(t));

  // Nếu người dùng chỉ gõ stop words thì khớp tất cả
  if (tokens.length === 0) return true;

  const targetWords = noToneTarget.split(/[\s,.-]+/).filter(Boolean);
  const matchedTokens = tokens.filter((t) => targetWords.some((w) => w === t || (t.length >= 3 && w.startsWith(t))));
  return matchedTokens.length === tokens.length;
}

// Cắt ngắn mô tả cho thẻ tìm kiếm để giao diện gọn gàng, bấm xem chi tiết mới hiện hết
const truncateDesc = (text, maxLength = 135) => {
  if (!text) return 'Homestay đang cập nhật thông tin chi tiết.';
  const clean = text.trim();
  if (clean.length <= maxLength) return clean;
  return clean.slice(0, maxLength).trim() + '...';
};

export default function SearchResult() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Query Params & Search keyword
  const queryDestParam = searchParams.get('q') || searchParams.get('destination') || searchParams.get('location') || '';
  const [searchInput, setSearchInput] = useState(queryDestParam);

  useEffect(() => {
    setSearchInput(queryDestParam);
  }, [queryDestParam]);

  // Sort Option & Custom dropdown
  const [sortBy, setSortBy] = useState('rating');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef(null);

  // Close sort dropdown when click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

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

  // Danh sách homestays lấy 100% từ Database thật
  const [homestays, setHomestays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchHomestays = async () => {
      setLoading(true);
      try {
        const dbList = await homestayService.getAllHomestays();
        if (isMounted) {
          if (dbList && dbList.length > 0) {
            setHomestays(dbList);
          } else {
            setHomestays(SAMPLE_HOMESTAYS);
          }
          setLoading(false);
        }
      } catch (err) {
        console.warn('Lỗi khi tải homestay từ database:', err);
        if (isMounted) {
          setHomestays(SAMPLE_HOMESTAYS);
          setLoading(false);
        }
      }
    };
    fetchHomestays();
    return () => { isMounted = false; };
  }, []);

  const clearAllFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setSelectedServices([]);
    setSelectedRoomAmenities([]);
    setSelectedAmenities([]);
    setSelectedTravelGroups([]);
    setSearchInput('');
    setSearchParams({});
    triggerToast('Đã xóa tất cả bộ lọc và hiển thị toàn bộ chỗ nghỉ!');
  };

  // Helper compute option counts for sidebar từ dữ liệu homestays
  const computeOptionsWithCounts = (key) => {
    const countsMap = {};
    homestays.forEach((item) => {
      const list = item[key] || [];
      list.forEach((val) => {
        countsMap[val] = (countsMap[val] || 0) + 1;
      });
    });
    return Object.keys(countsMap)
      .sort((a, b) => a.localeCompare(b, 'vi'))
      .map((name) => ({ name, count: countsMap[name] }));
  };

  const allServices = useMemo(() => computeOptionsWithCounts('services'), [homestays]);
  const allRoomAmenities = useMemo(() => computeOptionsWithCounts('roomAmenities'), [homestays]);
  const allAmenities = useMemo(() => computeOptionsWithCounts('amenities'), [homestays]);
  const allTravelGroups = useMemo(() => computeOptionsWithCounts('travelGroups'), [homestays]);

  // Filtered & Sorted Homestays
  const filteredHomestays = useMemo(() => {
    const list = homestays.filter((item) => {
      // 1. Keyword search (Hỗ trợ tiếng Việt đầy đủ dấu và không dấu)
      if (queryDestParam && !matchesQuery(item, queryDestParam)) {
        return false;
      }

      // 2. Price filter
      const price = Number(item.pricePerNight ?? item.price ?? item.basePrice ?? 0);
      if (minPrice !== '' && price < Number(minPrice)) return false;
      if (maxPrice !== '' && price > Number(maxPrice)) return false;

      // 3. Service filters
      if (selectedServices.length > 0) {
        const itemSv = item.services || [];
        if (!selectedServices.every((s) => itemSv.includes(s))) return false;
      }

      // 4. Room amenity filters
      if (selectedRoomAmenities.length > 0) {
        const itemRa = item.roomAmenities || [];
        if (!selectedRoomAmenities.every((a) => itemRa.includes(a))) return false;
      }

      // 5. Amenity filters
      if (selectedAmenities.length > 0) {
        const itemAm = item.amenities || [];
        if (!selectedAmenities.every((a) => itemAm.includes(a))) return false;
      }

      // 6. Travel group filters
      if (selectedTravelGroups.length > 0) {
        const itemTg = item.travelGroups || [];
        if (!selectedTravelGroups.every((g) => itemTg.includes(g))) return false;
      }

      return true;
    });

    // Sắp xếp
    return [...list].sort((a, b) => {
      const priceA = Number(a.pricePerNight ?? a.price ?? a.basePrice ?? 0);
      const priceB = Number(b.pricePerNight ?? b.price ?? b.basePrice ?? 0);
      const ratingA = Number(a.rating ?? 0);
      const ratingB = Number(b.rating ?? 0);

      switch (sortBy) {
        case 'price-asc':
          return priceA - priceB;
        case 'price-desc':
          return priceB - priceA;
        case 'name-asc':
          return String(a.name).localeCompare(String(b.name), 'vi');
        case 'name-desc':
          return String(b.name).localeCompare(String(a.name), 'vi');
        case 'rating':
        default:
          return ratingB - ratingA;
      }
    });
  }, [
    homestays,
    queryDestParam,
    minPrice,
    maxPrice,
    selectedServices,
    selectedRoomAmenities,
    selectedAmenities,
    selectedTravelGroups,
    sortBy
  ]);

  const getSortLabel = (val) => {
    switch (val) {
      case 'rating': return 'Đánh giá cao nhất';
      case 'price-asc': return 'Giá: Thấp đến Cao';
      case 'price-desc': return 'Giá: Cao đến Thấp';
      case 'name-asc': return 'Tên chỗ nghỉ: A–Z';
      case 'name-desc': return 'Tên chỗ nghỉ: Z–A';
      default: return 'Đánh giá cao nhất';
    }
  };

  const getRatingWord = (score) => {
    if (score >= 9) return 'Xuất sắc';
    if (score >= 8) return 'Rất tốt';
    if (score >= 7) return 'Tốt';
    return 'Mới';
  };

  const formatScore = (score) => {
    const num = Number(score || 0);
    if (num === 10) return '10';
    return num.toLocaleString('vi-VN', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    });
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
          {/* 1. Thanh tìm kiếm nhanh */}
          <div className="sr-quick-search-box">
            <div className="sr-search-input-wrap">
              <i className="bi bi-search"></i>
              <input
                type="text"
                placeholder="Tìm điểm đến hoặc tên homestay (Đà Lạt, Sa Pa, Nông Trại...)"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setSearchParams(searchInput.trim() ? { q: searchInput.trim() } : {});
                  }
                }}
              />
              {searchInput && (
                <button
                  type="button"
                  className="sr-clear-btn"
                  onClick={() => {
                    setSearchInput('');
                    setSearchParams({});
                  }}
                  title="Xóa tìm kiếm"
                >
                  <i className="bi bi-x-circle-fill"></i>
                </button>
              )}
            </div>
            <button
              type="button"
              className="btn sr-submit-btn"
              onClick={() => {
                setSearchParams(searchInput.trim() ? { q: searchInput.trim() } : {});
              }}
            >
              Tìm kiếm
            </button>
          </div>

          {/* 2. Gợi ý điểm đến phổ biến */}
          <div className="sr-dest-chips">
            {['Tất cả', 'Đà Lạt', 'Sa Pa', 'Ninh Bình', 'Huế', 'Phú Quốc', 'Hà Giang'].map((dest) => {
              const isAll = dest === 'Tất cả';
              const isActive = (!queryDestParam && isAll) ||
                (queryDestParam && !isAll && removeVietnameseTones(queryDestParam).includes(removeVietnameseTones(dest)));
              return (
                <button
                  key={dest}
                  type="button"
                  className={`sr-chip ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    if (isAll) {
                      setSearchInput('');
                      setSearchParams({});
                    } else {
                      setSearchInput(dest);
                      setSearchParams({ q: dest });
                    }
                  }}
                >
                  {dest}
                </button>
              );
            })}
          </div>

          {/* 3. Header toolbar */}
          <div className="results-header">
            <h2>
              {queryDestParam
                ? `${queryDestParam}: tìm thấy ${filteredHomestays.length} chỗ nghỉ`
                : `Tất cả điểm đến: tìm thấy ${filteredHomestays.length} chỗ nghỉ`}
            </h2>
          </div>

          {/* Sắp xếp Custom Dropdown */}
          <div className="sort-dropdown" ref={sortRef}>
            <div
              className={`btn-sort custom-select ${isSortOpen ? 'open' : ''}`}
              onClick={() => setIsSortOpen(!isSortOpen)}
            >
              <i className="bi bi-arrow-down-up"></i>
              <span>Sắp xếp theo</span>
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

          {/* Danh sách Homestays - Luôn hiển thị giao diện ngang chuẩn */}
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-success" role="status"></div>
              <p className="mt-2 text-muted">Đang tải danh sách chỗ nghỉ thực tế từ hệ thống...</p>
            </div>
          ) : filteredHomestays.length === 0 ? (
            <div className="empty-results">
              <i className="bi bi-geo-alt-fill display-4 text-success mb-2 d-block"></i>
              <h3>Chưa tìm thấy chỗ nghỉ phù hợp</h3>
              <p>Hãy thử đổi từ khóa tìm kiếm, mở rộng khoảng giá hoặc xóa bớt các bộ lọc tiện nghi nhé!</p>
              <button type="button" className="btn btn-outline-success mt-3" onClick={clearAllFilters}>
                Xem tất cả {homestays.length} chỗ nghỉ
              </button>
            </div>
          ) : (
            <div className="hotel-list">
              {filteredHomestays.map((item) => {
                const rating = Number(item.rating || 0);
                const rawPrice = item.pricePerNight ?? item.price ?? item.basePrice ?? 0;
                const price = Number(rawPrice).toLocaleString('vi-VN');
                const isFavorite = favorites.has(item.id);
                const imageSrc =
                  item.image ||
                  item.primaryImage ||
                  item.thumb ||
                  (item.images && item.images[0]) ||
                  '/images/categories/7_thien_nhien_sinh_thai.jpg';

                return (
                  <article key={item.id} className="hotel-card mui-shadow" data-id={item.id}>
                    <div className="hotel-image">
                      <img src={imageSrc} alt={item.name} loading="lazy" />
                      <button
                        type="button"
                        className={`btn-favorite ${isFavorite ? 'active' : ''}`}
                        onClick={(e) => toggleFavorite(item.id, e)}
                        title={isFavorite ? "Bỏ yêu thích" : "Yêu thích"}
                        aria-label="Lưu chỗ nghỉ"
                      >
                        <i className={`bi ${isFavorite ? 'bi-heart-fill' : 'bi-heart'}`}></i>
                      </button>
                    </div>

                    <div className="hotel-info">
                      <div className="info-main">
                        <h3 className="hotel-title">
                          <Link to={`/homestay/${item.id}`}>
                            {item.name}
                          </Link>
                          <span className="stars">
                            {'★'.repeat(Math.max(1, Math.min(5, Number(item.stars || 4))))}
                          </span>
                        </h3>

                        <div className="hotel-location">
                          <a
                            href="#map"
                            onClick={(e) => {
                              e.preventDefault();
                              triggerToast(`Vị trí: ${item.address || item.location}`);
                            }}
                          >
                            {item.address || item.location || 'Đang cập nhật địa chỉ'}
                          </a>
                        </div>

                        <div className="hotel-distance">{item.distance || 'Thông tin khoảng cách đang cập nhật'}</div>
                        
                        {/* Mô tả ngắn gọn 2 dòng, bấm xem chi tiết mới hiện đầy đủ */}
                        <p className="hotel-desc" title={item.description || item.desc}>
                          {truncateDesc(item.description || item.desc)}
                        </p>
                      </div>

                      <div className="info-action">
                        {/* Phần đánh giá chuẩn chống xô lệch */}
                        <div className="sr-rating-section">
                          <div className="sr-rating-text">
                            <div className="sr-rating-word">
                              {Number(item.reviewCount || 0) > 0 ? getRatingWord(rating) : 'Mới'}
                            </div>
                            <div className="sr-rating-count">
                              {Number(item.reviewCount || 0) > 0
                                ? `${item.reviewCount} đánh giá`
                                : 'Chưa có đánh giá'}
                            </div>
                          </div>
                          <div className="sr-rating-score">
                            {Number(item.reviewCount || 0) > 0 ? formatScore(rating) : '5.0'}
                          </div>
                        </div>

                        <div className="location-score">
                          {rawPrice ? (
                            <>Giá: <strong>{price} VNĐ</strong> / đêm</>
                          ) : (
                            'Chưa có giá'
                          )}
                        </div>

                        <button
                          type="button"
                          className="btn-primary mui-btn choose-stay"
                          onClick={() => navigate(`/homestay/${item.id}`)}
                        >
                          Xem chi tiết
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Toast floating */}
      <div id="result-toast" className={toast.show ? 'show' : ''} role="status" aria-live="polite">
        <i className="bi bi-check-circle-fill me-2 text-warning"></i>
        {toast.msg}
      </div>
    </main>
  );
}
