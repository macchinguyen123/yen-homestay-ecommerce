import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import './Category.css';
import { homestayService } from '../../../services/homestayService';

// Hàm chuẩn hóa làm sạch chuỗi tiện nghi nổi bật (loại bỏ {" ", " }, "...")
export function formatAmenities(raw) {
  if (!raw) return 'Tiện nghi tiêu chuẩn';
  if (Array.isArray(raw)) {
    return raw.map(s => String(s).trim()).filter(Boolean).join(' · ');
  }
  let str = String(raw).trim();
  // Loại bỏ ngoặc {, }, [, ] và dấu kép " ở đầu và cuối
  str = str.replace(/^[{\[\s"]+/, '').replace(/[}\]\s"]+$/, '');
  // Thay thế các dấu phân cách mảng JSON như '", "' hoặc '","' bằng ' · '
  str = str.replace(/"\s*,\s*"/g, ' · ').replace(/"\s*/g, '').replace(/\s*"/g, '');
  str = str.replace(/[{}[\]"]/g, '');
  str = str.replace(/,\s*/g, ' · ');
  return str.trim() || 'Tiện nghi tiêu chuẩn';
}

const CATEGORY_TABS = [
  { id: 'all', name: 'Tất cả danh mục', icon: 'bi-grid-fill' },
  { id: 'miet-vuan', name: 'Miệt vườn', icon: 'bi-tree-fill', keyword: 'miệt vườn' },
  { id: 'nong-trai', name: 'Nông trại', icon: 'bi-brightness-high-fill', keyword: 'nông trại' },
  { id: 'song-nuoc', name: 'Sông nước', icon: 'bi-water', keyword: 'sông nước' },
  { id: 'nha-que', name: 'Nhà quê truyền thống', icon: 'bi-house-heart-fill', keyword: 'nhà quê' },
  { id: 'am-thuc', name: 'Ẩm thực quê', icon: 'bi-cup-hot-fill', keyword: 'ẩm thực' },
  { id: 'lang-nghe', name: 'Làng nghề truyền thống', icon: 'bi-brush-fill', keyword: 'làng nghề' },
  { id: 'thien-nhien', name: 'Thiên nhiên sinh thái', icon: 'bi-compass-fill', keyword: 'thiên nhiên' },
  { id: 'doi-song', name: 'Trải nghiệm đời sống quê', icon: 'bi-basket-fill', keyword: 'đời sống' },
  { id: 'van-hoa', name: 'Văn hóa địa phương', icon: 'bi-people-fill', keyword: 'văn hóa' },
  { id: 'kham-pha', name: 'Khám phá làng quê', icon: 'bi-bicycle', keyword: 'khám phá' },
  { id: 'thu-gian', name: 'Chậm thư giãn', icon: 'bi-cloud-sun-fill', keyword: 'thư giãn' },
  { id: 'ban-dia', name: 'Ở cùng người bản địa', icon: 'bi-house-heart', keyword: 'bản địa' },
];

const SAMPLE_CATEGORY_HOMESTAYS = [
  { id: 201, name: 'Nông Trại Rau Xuân Thọ', city: 'dalat', location: 'Đà Lạt', rating: 5.0, reviews: 1, rooms: 6, maxGuests: 15, specs: '6 phòng ngủ · 15 khách', amenities: '{"Vườn rau hữu cơ", "Khu chăn nuôi t..."}', price: '4.200.000đ', basePriceNum: 4200000, tag: 'Top Bán Chạy', category: 'nong-trai', img: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=600&q=80' },
  { id: 202, name: 'Đồi Thông Võng Chiếu', city: 'dalat', location: 'Đà Lạt', rating: 5.0, reviews: 1, rooms: 5, maxGuests: 9, specs: '5 phòng ngủ · 9 khách', amenities: '{"Võng ngoài hiên", "Góc đọc sách"...}', price: '2.650.000đ', basePriceNum: 2650000, tag: 'Top Bán Chạy', category: 'thien-nhien', img: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80' },
  { id: 203, name: 'Nhà Sàn Mường Hoa Hát Giao Duyên', city: 'sapa', location: 'Sa Pa', rating: 5.0, reviews: 1, rooms: 3, maxGuests: 12, specs: '3 phòng ngủ · 12 khách', amenities: '{"Sân khấu nhỏ ngoài trời", "Nhạc cụ..."}', price: '1.350.000đ', basePriceNum: 1350000, tag: 'Top Bán Chạy', category: 'nha-que', img: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=600&q=80' },
  { id: 204, name: 'Vườn Rau Trà Quế Homestay', city: 'hoian', location: 'Hội An', rating: 5.0, reviews: 1, rooms: 3, maxGuests: 5, specs: '3 phòng ngủ · 5 khách', amenities: '{"Sân vườn", "Vườn trái cây tự hái", "BBQ ngoài trời"}', price: '3.100.000đ', basePriceNum: 3100000, tag: 'Top Bán Chạy', category: 'miet-vuan', img: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80' },
  { id: 205, name: 'Miệt Vườn Phong Điền Eco Villa', city: 'cantho', location: 'Cần Thơ', rating: 4.95, reviews: 32, rooms: 4, maxGuests: 10, specs: '4 phòng ngủ · 10 khách', amenities: '{"Đi xuồng chèo", "Hái trái cây tại vườn", "Nấu ăn mộc mạc"}', price: '1.850.000đ', basePriceNum: 1850000, tag: 'Ưu Đãi Đặt Sớm', category: 'song-nuoc', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80' },
  { id: 206, name: 'Làng Nghề Gốm Thanh Hà Lodge', city: 'hoian', location: 'Hội An', rating: 4.92, reviews: 24, rooms: 3, maxGuests: 6, specs: '3 phòng ngủ · 6 khách', amenities: '{"Học xoay gốm thủ công", "Trà đạo", "Xe đạp dạo phố"}', price: '2.200.000đ', basePriceNum: 2200000, tag: 'Làng Nghề Độc Bản', category: 'lang-nghe', img: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80' },
  { id: 207, name: 'Mây Thung Lũng Sapa Ecolodge', city: 'sapa', location: 'Sa Pa', rating: 4.98, reviews: 45, rooms: 2, maxGuests: 4, specs: '2 phòng ngủ · 4 khách', amenities: '{"Bồn tắm gỗ Pơ-mu", "Săn mây thung lũng", "Lò sưởi củi"}', price: '2.950.000đ', basePriceNum: 2950000, tag: 'View Tuyệt Đẹp', category: 'san-may', img: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=80' },
  { id: 208, name: 'Nhà Cổ Nam Bộ Bến Tre', city: 'bentre', location: 'Bến Tre', rating: 4.90, reviews: 19, rooms: 5, maxGuests: 12, specs: '5 phòng ngủ · 12 khách', amenities: '{"Bánh xèo miền Tây", "Bắt cá mương", "Đi xuồng dừa"}', price: '1.600.000đ', basePriceNum: 1600000, tag: 'Đời Sống Dân Dã', category: 'doi-song', img: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=600&q=80' },
  { id: 209, name: 'Nông Trại Dâu Tây Cầu Đất', city: 'dalat', location: 'Đà Lạt', rating: 4.96, reviews: 58, rooms: 4, maxGuests: 8, specs: '4 phòng ngủ · 8 khách', amenities: '{"Hái dâu tại vườn", "BBQ ngoài trời", "Bể bơi nước ấm"}', price: '3.400.000đ', basePriceNum: 3400000, tag: 'Top Nông Trại', category: 'nong-trai', img: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80' },
  { id: 210, name: 'Nhà Thủy Tạ Sông Hàn Villa', city: 'danang', location: 'Đà Nẵng', rating: 4.94, reviews: 67, rooms: 4, maxGuests: 10, specs: '4 phòng ngủ · 10 khách', amenities: '{"View sông trực diện", "Bể bơi vô cực", "Đón tiễn sân bay"}', price: '3.800.000đ', basePriceNum: 3800000, tag: 'Sang Trọng', category: 'song-nuoc', img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80' },
  { id: 211, name: 'Bếp Quê Mẹ Nấu Homestay', city: 'hue', location: 'Huế', rating: 4.91, reviews: 29, rooms: 3, maxGuests: 6, specs: '3 phòng ngủ · 6 khách', amenities: '{"Học nấu món Cố Đô", "Trà sen ngự uyển", "Áo dài chụp ảnh"}', price: '1.750.000đ', basePriceNum: 1750000, tag: 'Ẩm Thực Đậm Chất', category: 'am-thuc', img: 'https://images.unsplash.com/photo-1516253593875-bd7ba052fbc5?auto=format&fit=crop&w=600&q=80' },
  { id: 212, name: 'Làng Dệt Thổ Cẩm Tả Phìn', city: 'sapa', location: 'Sa Pa', rating: 4.89, reviews: 21, rooms: 2, maxGuests: 4, specs: '2 phòng ngủ · 4 khách', amenities: '{"Tắm lá thuốc Dao Đỏ", "Dệt thổ cẩm", "Ăn tối cùng gia chủ"}', price: '1.200.000đ', basePriceNum: 1200000, tag: 'Làng Nghề Thổ Cẩm', category: 'lang-nghe', img: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=600&q=80' },
  { id: 213, name: 'Rừng Thông Hoàng Anh Villa', city: 'dalat', location: 'Đà Lạt', rating: 4.97, reviews: 88, rooms: 5, maxGuests: 12, specs: '5 phòng ngủ · 12 khách', amenities: '{"Sân BBQ đồi thông", "Lò sưởi củi", "Xe máy miễn phí"}', price: '3.900.000đ', basePriceNum: 3900000, tag: 'Hot Đặt Nhiều', category: 'thien-nhien', img: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80' },
  { id: 214, name: 'Vườn Trái Cây Cái Mơn', city: 'bentre', location: 'Bến Tre', rating: 4.93, reviews: 40, rooms: 3, maxGuests: 8, specs: '3 phòng ngủ · 8 khách', amenities: '{"Thưởng thức sầu riêng tại vườn", "Câu cá giải trí", "Võng dừa"}', price: '1.900.000đ', basePriceNum: 1900000, tag: 'Miệt Vườn Xanh', category: 'miet-vuan', img: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=600&q=80' },
  { id: 215, name: 'Nông Trại Trà Xanh Tam Đảo', city: 'tamdao', location: 'Vĩnh Phúc', rating: 4.88, reviews: 18, rooms: 3, maxGuests: 6, specs: '3 phòng ngủ · 6 khách', amenities: '{"Đồi trà xanh ngát", "Tiệc nướng đêm", "Bể bơi mây"}', price: '2.100.000đ', basePriceNum: 2100000, tag: 'Gần Hà Nội', category: 'nong-trai', img: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=600&q=80' },
  { id: 216, name: 'Nhà Ba Căn Cổ Truyền Bắc Bộ', city: 'hanoi', location: 'Hà Nội', rating: 4.92, reviews: 35, rooms: 4, maxGuests: 8, specs: '4 phòng ngủ · 8 khách', amenities: '{"Sân gạch ngói đỏ", "Ao cá ao sen", "Cơm quê niêu đất"}', price: '2.450.000đ', basePriceNum: 2450000, tag: 'Nét Cổ Bắc Bộ', category: 'nha-que', img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80' },
  { id: 217, name: 'Miệt Vườn Chợ Lách Homestay', city: 'bentre', location: 'Bến Tre', rating: 4.90, reviews: 26, rooms: 3, maxGuests: 6, specs: '3 phòng ngủ · 6 khách', amenities: '{"Vườn chôm chôm bưởi da xanh", "Đờn ca tài tử", "Bánh xèo"}', price: '1.500.000đ', basePriceNum: 1500000, tag: 'Miệt Vườn', category: 'miet-vuan', img: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=600&q=80' },
  { id: 218, name: 'Nông Trại Bò Sữa Mộc Châu', city: 'mocchau', location: 'Sơn La', rating: 4.94, reviews: 52, rooms: 4, maxGuests: 10, specs: '4 phòng ngủ · 10 khách', amenities: '{"Vắt sữa bò trải nghiệm", "Đồi cải trắng", "Lửa trại"}', price: '2.300.000đ', basePriceNum: 2300000, tag: 'Khám Phá Mộc Châu', category: 'nong-trai', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80' },
  { id: 219, name: 'Chèo Sub Đầm Chuồn Huế', city: 'hue', location: 'Thừa Thiên Huế', rating: 4.96, reviews: 61, rooms: 3, maxGuests: 6, specs: '3 phòng ngủ · 6 khách', amenities: '{"Chèo SUP ngắm bình minh", "Hải sản đầm phá tươi sống", "Nhà chồ"}', price: '2.800.000đ', basePriceNum: 2800000, tag: 'Sông Nước Đầm Phá', category: 'song-nuoc', img: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80' },
  { id: 220, name: 'Làng Nón Lá Thủy Thanh', city: 'hue', location: 'Huế', rating: 4.87, reviews: 15, rooms: 2, maxGuests: 4, specs: '2 phòng ngủ · 4 khách', amenities: '{"Làm nón bài thơ", "Thăm cầu ngói Thanh Toàn", "Cơm hến"}', price: '1.100.000đ', basePriceNum: 1100000, tag: 'Làng Nghề', category: 'lang-nghe', img: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80' },
  { id: 221, name: 'Sapa Cloud Hunting Lodge', city: 'sapa', location: 'Sa Pa', rating: 4.98, reviews: 74, rooms: 3, maxGuests: 6, specs: '3 phòng ngủ · 6 khách', amenities: '{"Ban công săn mây toàn cảnh", "Bồn tắm ngoài trời", "Lò sưởi củi"}', price: '2.850.000đ', basePriceNum: 2850000, tag: 'Săn Mây Độc Bản', category: 'san-may', img: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=80' },
  { id: 222, name: 'An Bàng Seaside Ocean Villa', city: 'hoian', location: 'Hội An', rating: 4.95, reviews: 89, rooms: 4, maxGuests: 8, specs: '4 phòng ngủ · 8 khách', amenities: '{"Sát biển 20m", "Bể bơi riêng ngắm biển", "Xe đạp dạo phố"}', price: '3.600.000đ', basePriceNum: 3600000, tag: 'Nghỉ Dưỡng Biển', category: 'bien-dao', img: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80' },
  { id: 223, name: 'Nhà Sàn Dao Đỏ Tả Phìn', city: 'sapa', location: 'Sa Pa', rating: 4.91, reviews: 42, rooms: 4, maxGuests: 10, specs: '4 phòng ngủ · 10 khách', amenities: '{"Tắm lá thuốc người Dao", "Trải nghiệm dệt vải", "Lễ hội lửa trại"}', price: '1.400.000đ', basePriceNum: 1400000, tag: 'Văn Hóa Bản Địa', category: 'van-hoa', img: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=600&q=80' },
  { id: 224, name: 'Sơn Trà Infinity Luxury Resort', city: 'danang', location: 'Đà Nẵng', rating: 4.99, reviews: 112, rooms: 5, maxGuests: 12, specs: '5 phòng ngủ · 12 khách', amenities: '{"Bể bơi vô cực triệu đô", "Quản gia riêng 24/7", "BBQ hải sản tươi"}', price: '5.500.000đ', basePriceNum: 5500000, tag: 'Villa Thượng Đỉnh', category: 'villa', img: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80' },
];

const ITEMS_PER_PAGE = 16;

export default function Category() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlCategoryParam = searchParams.get('cat') || searchParams.get('type') || 'all';

  // Filters State
  const [activeCategory, setActiveCategory] = useState(urlCategoryParam);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [sortBy, setSortBy] = useState('rating-desc');
  const [currentPage, setCurrentPage] = useState(1);

  // Wishlist state
  const [wishlist, setWishlist] = useState(new Set());
  const [toast, setToast] = useState({ show: false, msg: '' });

  // Homestays data list from DB & fallback
  const [homestays, setHomestays] = useState(SAMPLE_CATEGORY_HOMESTAYS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setActiveCategory(urlCategoryParam);
    setCurrentPage(1);
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [urlCategoryParam]);

  useEffect(() => {
    let isMounted = true;
    const loadHomestays = async () => {
      setLoading(true);
      try {
        const dbList = await homestayService.getAllHomestays();
        if (isMounted && dbList && dbList.length > 0) {
          const catKeys = ['miet-vuan', 'nong-trai', 'song-nuoc', 'nha-que', 'am-thuc', 'lang-nghe', 'thien-nhien', 'doi-song', 'san-may', 'bien-dao', 'van-hoa', 'villa'];
          const mapped = dbList.map((h, i) => {
            const rawPrice = h.basePrice || h.pricePerNight || h.price || 1500000;
            const numPrice = Number(rawPrice);
            return {
              id: h.id || h.homestayId || (i + 1),
              name: h.name,
              city: (h.city || 'dalat').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/ /g, ''),
              location: h.address || h.city || 'Việt Nam',
              rating: h.rating || 5.0,
              reviews: h.reviews || h.reviewCount || 1,
              specs: `${h.numRooms || 3} phòng ngủ · ${h.maxGuests || 6} khách`,
              amenities: h.amenities || '{"Sân vườn", "Tiện nghi tiêu chuẩn"}',
              price: numPrice.toLocaleString('vi-VN') + 'đ',
              basePriceNum: numPrice,
              tag: i % 3 === 0 ? 'Top Bán Chạy' : (i % 2 === 0 ? 'Ưu Đãi' : 'Nổi Bật'),
              category: h.categorySlug || catKeys[i % catKeys.length],
              img: (h.images && h.images.length > 0) ? h.images[0] : (h.image || h.primaryImage || SAMPLE_CATEGORY_HOMESTAYS[i % SAMPLE_CATEGORY_HOMESTAYS.length].img)
            };
          });
          // Gộp cả dữ liệu thật và sample để đảm bảo luôn đủ 16+ homestay cho người dùng phân trang
          setHomestays([...mapped, ...SAMPLE_CATEGORY_HOMESTAYS]);
        } else {
          setHomestays(SAMPLE_CATEGORY_HOMESTAYS);
        }
      } catch (err) {
        console.warn('Lỗi tải dữ liệu danh mục:', err);
        setHomestays(SAMPLE_CATEGORY_HOMESTAYS);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadHomestays();
    return () => { isMounted = false; };
  }, []);

  const triggerToast = (msg) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: '' }), 2500);
  };

  const toggleWishlist = (nameOrId, e) => {
    if (e) e.stopPropagation();
    setWishlist((prev) => {
      const next = new Set(prev);
      if (next.has(nameOrId)) {
        next.delete(nameOrId);
        triggerToast('Đã bỏ homestay khỏi danh sách yêu thích.');
      } else {
        next.add(nameOrId);
        triggerToast('Đã thêm homestay vào danh sách yêu thích!');
      }
      return next;
    });
  };

  // Switch category tab
  const handleCategorySelect = (catId) => {
    setActiveCategory(catId);
    setSearchParams(catId === 'all' ? {} : { cat: catId });
    setCurrentPage(1);
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  // Filter & Sort Logic
  const filteredHomestays = useMemo(() => {
    return homestays.filter((item) => {
      // 1. Lọc theo danh mục
      if (activeCategory !== 'all') {
        const selectedTab = CATEGORY_TABS.find(t => t.id === activeCategory);
        const kw = (selectedTab?.keyword || activeCategory).toLowerCase();
        
        const catSlug = (item.category || '').toLowerCase();
        const isExactCat = catSlug === activeCategory || catSlug.includes(activeCategory);
        const targetStr = (catSlug + ' ' + item.name + ' ' + item.amenities + ' ' + item.location + ' ' + (item.tag || '')).toLowerCase();
        const isKwMatch = targetStr.includes(kw);

        if (!isExactCat && !isKwMatch) {
          return false;
        }
      }

      // 2. Lọc từ khóa tìm kiếm
      if (searchKeyword.trim()) {
        const kw = searchKeyword.toLowerCase().trim();
        const fullText = (item.name + ' ' + item.location + ' ' + item.amenities).toLowerCase();
        if (!fullText.includes(kw)) return false;
      }

      // 3. Lọc theo địa điểm
      if (selectedCity !== 'all') {
        const loc = (item.location + ' ' + item.city).toLowerCase();
        if (!loc.includes(selectedCity.toLowerCase())) return false;
      }

      // 4. Lọc theo khoảng giá
      const price = item.basePriceNum || 0;
      if (priceRange === 'under-1m' && price >= 1000000) return false;
      if (priceRange === '1m-2m' && (price < 1000000 || price > 2000000)) return false;
      if (priceRange === '2m-4m' && (price < 2000000 || price > 4000000)) return false;
      if (priceRange === 'above-4m' && price <= 4000000) return false;

      return true;
    }).sort((a, b) => {
      const priceA = a.basePriceNum || 0;
      const priceB = b.basePriceNum || 0;
      const ratingA = Number(a.rating || 0);
      const ratingB = Number(b.rating || 0);

      switch (sortBy) {
        case 'price-asc': return priceA - priceB;
        case 'price-desc': return priceB - priceA;
        case 'rating-desc': return ratingB - ratingA;
        case 'name-asc': return String(a.name).localeCompare(String(b.name), 'vi');
        default: return ratingB - ratingA;
      }
    });
  }, [homestays, activeCategory, searchKeyword, selectedCity, priceRange, sortBy]);

  // Pagination calculation: 16 items / page
  const totalPages = Math.max(1, Math.ceil(filteredHomestays.length / ITEMS_PER_PAGE));
  const currentHomestays = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredHomestays.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredHomestays, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  };

  const clearFilters = () => {
    setActiveCategory('all');
    setSearchKeyword('');
    setSelectedCity('all');
    setPriceRange('all');
    setSortBy('rating-desc');
    setSearchParams({});
    setCurrentPage(1);
    triggerToast('Đã xóa tất cả bộ lọc!');
  };

  const currentTabInfo = CATEGORY_TABS.find(t => t.id === activeCategory) || CATEGORY_TABS[0];

  return (
    <div className="category-page-wrapper">
      {/* 1. HERO HEADER SANGBẢN */}
      <section className="cat-hero-banner">
        <div className="cat-container">
          <span className="cat-hero-badge">
            <i className={`bi ${currentTabInfo.icon}`} /> Trải nghiệm nghỉ dưỡng độc bản
          </span>
          <h1 className="cat-hero-title">
            Danh Mục Homestay {currentTabInfo.id !== 'all' ? `· ${currentTabInfo.name}` : ''}
          </h1>
          <p className="cat-hero-subtitle">
            Hơn +100 căn homestay miệt vườn, nông trại, sông nước và nhà quê truyền thống chuẩn phong cách bản địa Việt Nam.
          </p>

          {/* BAR CHIPS DANH MỤC KHÁM PHÁ NHANH */}
          <div className="cat-chips-scroll">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`cat-chip-btn ${activeCategory === tab.id ? 'active' : ''}`}
                onClick={() => handleCategorySelect(tab.id)}
              >
                <i className={`bi ${tab.icon}`} />
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 2. THANH BỘ LỌC THÔNG MINH */}
      <section className="cat-filter-section">
        <div className="cat-container">
          <div className="cat-filter-bar">
            {/* Tìm theo từ khóa */}
            <div className="filter-item search-item">
              <i className="bi bi-search search-icon" />
              <input
                type="text"
                placeholder="Tìm tên homestay, địa điểm, tiện nghi..."
                value={searchKeyword}
                onChange={(e) => { setSearchKeyword(e.target.value); setCurrentPage(1); }}
              />
              {searchKeyword && (
                <button type="button" className="btn-clear-search" onClick={() => setSearchKeyword('')}>
                  <i className="bi bi-x-circle-fill" />
                </button>
              )}
            </div>

            {/* Lọc theo Địa điểm */}
            <div className="filter-item select-item">
              <i className="bi bi-geo-alt-fill select-icon text-success" />
              <select value={selectedCity} onChange={(e) => { setSelectedCity(e.target.value); setCurrentPage(1); }}>
                <option value="all">Tất cả điểm đến</option>
                <option value="dalat">Đà Lạt</option>
                <option value="sapa">Sa Pa</option>
                <option value="hoian">Hội An</option>
                <option value="danang">Đà Nẵng</option>
                <option value="cantho">Cần Thơ / Miền Tây</option>
                <option value="hue">Huế</option>
                <option value="bentre">Bến Tre</option>
              </select>
            </div>

            {/* Lọc theo Giá */}
            <div className="filter-item select-item">
              <i className="bi bi-cash-stack select-icon text-warning" />
              <select value={priceRange} onChange={(e) => { setPriceRange(e.target.value); setCurrentPage(1); }}>
                <option value="all">Tất cả mức giá</option>
                <option value="under-1m">Dưới 1.000.000đ / đêm</option>
                <option value="1m-2m">1.000.000đ – 2.000.000đ</option>
                <option value="2m-4m">2.000.000đ – 4.000.000đ</option>
                <option value="above-4m">Trên 4.000.000đ / đêm</option>
              </select>
            </div>

            {/* Sắp xếp */}
            <div className="filter-item select-item">
              <i className="bi bi-arrow-down-up select-icon text-primary" />
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="rating-desc">Đánh giá cao nhất</option>
                <option value="price-asc">Giá: Thấp đến Cao</option>
                <option value="price-desc">Giá: Cao đến Thấp</option>
                <option value="name-asc">Tên homestay A–Z</option>
              </select>
            </div>

            {/* Nút xóa bộ lọc */}
            {(searchKeyword || selectedCity !== 'all' || priceRange !== 'all' || activeCategory !== 'all') && (
              <button type="button" className="btn-reset-filters" onClick={clearFilters} title="Xóa tất cả bộ lọc">
                <i className="bi bi-arrow-counterclockwise" /> Xóa bộ lọc
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 3. KHU VỰC HIỂN THỊ 16 SẢN PHẨM KHUNG CHUẨN MẪU */}
      <section className="cat-products-section">
        <div className="cat-container">
          {/* Header kết quả */}
          <div className="cat-results-header">
            <h2>
              Hiển thị <strong>{filteredHomestays.length}</strong> homestay phù hợp 
              {activeCategory !== 'all' ? ` trong danh mục "${currentTabInfo.name}"` : ''}
            </h2>
            <span className="results-count-badge">
              Trang {currentPage} / {totalPages} (16 sản phẩm / trang)
            </span>
          </div>

          {loading ? (
            <div className="cat-loading-box">
              <div className="spinner-border text-success" role="status" />
              <p>Đang tải danh mục chỗ nghỉ từ hệ thống...</p>
            </div>
          ) : filteredHomestays.length === 0 ? (
            <div className="cat-empty-box">
              <i className="bi bi-house-x display-3 text-muted mb-3 d-block" />
              <h3>Không tìm thấy homestay phù hợp</h3>
              <p>Hãy thử thay đổi từ khóa, đổi danh mục hoặc mở rộng khoảng giá lọc xem nhé!</p>
              <button type="button" className="btn btn-success mt-2" onClick={clearFilters}>
                Xem tất cả homestay
              </button>
            </div>
          ) : (
            <>
              {/* LƯỚI 16 KHUNG SẢN PHẨM GIỐNG 100% ẢNH MẪU */}
              <div className="cat-products-grid">
                {currentHomestays.map((h) => (
                  <div key={h.id} className="cat-homestay-card">
                    {/* KHU VỰC ẢNH */}
                    <div className="card-img-wrapper">
                      <span className="card-top-tag">
                        <i className="bi bi-fire" /> {h.tag || 'Top Bán Chạy'}
                      </span>
                      <button
                        type="button"
                        className={`card-wishlist-btn ${wishlist.has(h.name || h.id) ? 'active' : ''}`}
                        onClick={(e) => toggleWishlist(h.name || h.id, e)}
                        title={wishlist.has(h.name || h.id) ? 'Bỏ yêu thích' : 'Yêu thích'}
                      >
                        <i className={`bi ${wishlist.has(h.name || h.id) ? 'bi-heart-fill' : 'bi-heart'}`} />
                      </button>
                      <Link to={`/homestay/${h.id}`} style={{ display: 'block', height: '100%' }}>
                        <img src={h.img} alt={h.name} loading="lazy" />
                      </Link>
                    </div>

                    {/* KHU VỰC THÔNG TIN (MATCHING MẪU ẢNH CHUẨN) */}
                    <div className="card-body">
                      {/* Vị trí & Đánh giá */}
                      <div className="card-location-rating">
                        <span className="card-location">
                          <i className="bi bi-geo-alt-fill text-dark" /> {h.location}
                        </span>
                        <span className="card-rating">
                          <i className="bi bi-star-fill text-warning" /> {h.rating} ({h.reviews})
                        </span>
                      </div>

                      {/* Tên Homestay */}
                      <h3 className="card-title">
                        <Link to={`/homestay/${h.id}`}>{h.name}</Link>
                      </h3>

                      {/* Số phòng & Khách */}
                      <div className="card-specs">{h.specs}</div>

                      {/* Tiện nghi nổi bật - ĐÃ LÀM SẠCH BỎ {" "}, QUOTES */}
                      <div className="card-amenities-box">
                        <span className="amenities-label">Tiện nghi nổi bật:</span>
                        <p className="amenities-items">{formatAmenities(h.amenities)}</p>
                      </div>

                      {/* Chân thẻ: Giá & Nút bấm Xem homestay */}
                      <div className="card-footer-row">
                        <div>
                          <span className="price-label">Giá từ:</span>
                          <div className="card-price">{h.price}</div>
                        </div>
                        <Link to={`/homestay/${h.id}`} className="btn-view-room">
                          Xem homestay
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 4. THANH PHÂN TRANG (PAGINATION CONTROLS) */}
              {totalPages > 1 && (
                <div className="cat-pagination-wrapper">
                  <button
                    type="button"
                    className="pagination-btn prev-btn"
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    <i className="bi bi-chevron-left" /> Trước
                  </button>

                  <div className="pagination-numbers">
                    {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        type="button"
                        className={`page-num-btn ${currentPage === pageNum ? 'active' : ''}`}
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="pagination-btn next-btn"
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    Sau <i className="bi bi-chevron-right" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* TOAST THÔNG BÁO Floating */}
      <div className={`toast-notice ${toast.show ? 'show' : ''}`}>
        <i className="bi bi-check-circle-fill text-warning" />
        <span>{toast.msg}</span>
      </div>
    </div>
  );
}
