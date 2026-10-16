import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Homepage.css';
import { homestayService } from '../../../services/homestayService';
import { wishlistService } from '../../../services/wishlistService';
import { authService } from '../../../services/authService';
import { formatAmenities } from '../Category/Category';
import VisualSearchModal from '../../../components/VisualSearchModal/VisualSearchModal';

// Hàm chuẩn hóa loại bỏ dấu tiếng Việt để tìm kiếm gợi ý thông minh
function removeVietnameseTones(str) {
  if (!str) return '';
  let s = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  s = s.replace(/đ/g, 'd').replace(/Đ/g, 'd');
  return s.toLowerCase().trim();
}

// Hàm phân loại tỉnh thành cho Homestay
export function getCitySlug(cityStr = '', locationStr = '') {
  const combined = ((cityStr || '') + ' ' + (locationStr || '')).toLowerCase();
  if (combined.includes('đà lạt') || combined.includes('da lat') || combined.includes('dalat') || combined.includes('lâm đồng')) return 'dalat';
  if (combined.includes('đà nẵng') || combined.includes('da nang') || combined.includes('danang') || combined.includes('sơn trà')) return 'danang';
  if (combined.includes('hội an') || combined.includes('hoi an') || combined.includes('hoian') || combined.includes('quảng nam')) return 'hoian';
  if (combined.includes('sapa') || combined.includes('sa pa') || combined.includes('lào cai')) return 'sapa';
  if (combined.includes('ninh bình') || combined.includes('ninh binh') || combined.includes('tràng an') || combined.includes('gia viễn')) return 'ninhbinh';
  if (combined.includes('phú quốc') || combined.includes('phu quoc') || combined.includes('kiên giang')) return 'phuquoc';
  if (combined.includes('hà nội') || combined.includes('ha noi') || combined.includes('hanoi') || combined.includes('ba vì')) return 'hanoi';
  return 'other';
}

// Danh mục điểm đến thịnh hành & gợi ý phong cách du lịch
const POPULAR_DESTINATIONS = [
  { name: 'Đà Lạt', desc: 'Thành phố mộng mơ & săn mây', icon: 'bi-cloud-sun', homestaysCount: '120+ homestay', badge: 'Hot' },
  { name: 'Hội An', desc: 'Phố cổ đèn lồng & di sản', icon: 'bi-bank', homestaysCount: '85+ homestay', badge: 'Văn hóa' },
  { name: 'Sapa', desc: 'Săn mây bản làng Tây Bắc', icon: 'bi-image', homestaysCount: '90+ homestay', badge: 'Săn mây' },
  { name: 'Đà Nẵng', desc: 'Thành phố biển & lễ hội pháo hoa', icon: 'bi-water', homestaysCount: '140+ homestay', badge: 'Biển' },
  { name: 'Ninh Bình', desc: 'Tràng An non nước hữu tình', icon: 'bi-compass', homestaysCount: '65+ homestay', badge: 'Thiên nhiên' },
  { name: 'Phú Quốc', desc: 'Đảo ngọc biển xanh & hoàng hôn', icon: 'bi-sunset', homestaysCount: '110+ homestay', badge: 'Nghỉ dưỡng' },
];

const POPULAR_THEMES = [
  { label: 'Miệt vườn sông nước', icon: 'bi-water', query: 'miệt vườn' },
  { label: 'Nhà gỗ săn mây', icon: 'bi-cloud-haze2', query: 'săn mây' },
  { label: 'Villa có hồ bơi riêng', icon: 'bi-water', query: 'hồ bơi' },
  { label: 'Nông trại sinh thái', icon: 'bi-tree', query: 'nông trại' },
  { label: 'Gần phố cổ đi bộ', icon: 'bi-signpost-2', query: 'phố cổ' },
  { label: 'Có sân vườn BBQ', icon: 'bi-fire', query: 'bbq' },
];

const HERO_SLIDES = [
  { id: 1, img: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1920&q=80', title: 'Homestay giữa núi rừng bản địa chân thực' },
  { id: 2, img: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1600&q=80', title: 'Homestay Sapa bồng bềnh mây ngàn' },
  { id: 3, img: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=1600&q=80', title: 'Homestay Hội An cổ kính thơ mộng' },
];

export const getCategorySlug = (exp) => {
  if (!exp) return 'all';
  if (exp.cat && exp.cat !== 'all') return exp.cat;
  const idMap = {
    1: 'miet-vuan',
    2: 'nong-trai',
    3: 'song-nuoc',
    4: 'nha-que',
    5: 'am-thuc',
    6: 'lang-nghe',
    7: 'thien-nhien',
    8: 'doi-song',
    9: 'van-hoa',
    10: 'kham-pha',
    11: 'thu-gian',
    12: 'ban-dia'
  };
  if (exp.id && idMap[Number(exp.id)]) return idMap[Number(exp.id)];
  
  const title = (exp.title || exp.name || '').toLowerCase();
  if (title.includes('miệt') || title.includes('vườn')) return 'miet-vuan';
  if (title.includes('nông') || title.includes('trại')) return 'nong-trai';
  if (title.includes('sông') || title.includes('nước')) return 'song-nuoc';
  if (title.includes('nhà quê')) return 'nha-que';
  if (title.includes('ẩm thực')) return 'am-thuc';
  if (title.includes('làng nghề') || title.includes('nghề')) return 'lang-nghe';
  if (title.includes('thiên nhiên') || title.includes('sinh thái')) return 'thien-nhien';
  if (title.includes('đời sống')) return 'doi-song';
  if (title.includes('văn hóa')) return 'van-hoa';
  if (title.includes('khám phá')) return 'kham-pha';
  if (title.includes('thư giãn') || title.includes('nghỉ dưỡng')) return 'thu-gian';
  if (title.includes('bản địa')) return 'ban-dia';
  return 'all';
};

const EXPERIENCES = [
  { id: 1, title: 'Miệt vườn', desc: 'Ở giữa vườn cây, hái trái, làm vườn', tag: 'Miệt vườn', cat: 'miet-vuan', img: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=600&q=80' },
  { id: 2, title: 'Nông trại', desc: 'Trồng rau, thu hoạch, chăm vật nuôi, làm ruộng', tag: 'Nông trại', cat: 'nong-trai', img: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=600&q=80' },
  { id: 3, title: 'Sông nước', desc: 'Đi xuồng, chèo ghe, câu cá, ngắm sông', tag: 'Sông nước', cat: 'song-nuoc', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80' },
  { id: 4, title: 'Nhà quê truyền thống', desc: 'Nhà gỗ, nhà vườn, nhà cổ, sinh hoạt cùng gia đình địa phương', tag: 'Nhà quê', cat: 'nha-que', img: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=600&q=80' },
  { id: 5, title: 'Ẩm thực quê', desc: 'Nấu ăn cùng chủ nhà, làm bánh dân gian, ăn cơm nhà', tag: 'Ẩm thực', cat: 'am-thuc', img: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80' },
  { id: 6, title: 'Làng nghề truyền thống', desc: 'Đan lát, làm gốm, dệt, làm đồ thủ công', tag: 'Làng nghề', cat: 'lang-nghe', img: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80' },
  { id: 7, title: 'Thiên nhiên sinh thái', desc: 'Rừng, đồng ruộng, hồ, suối, vườn sinh thái', tag: 'Thiên nhiên', cat: 'thien-nhien', img: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80' },
  { id: 8, title: 'Trải nghiệm đời sống quê', desc: 'Bắt cá, hái rau, đi chợ quê, chăm vườn', tag: 'Đời sống quê', cat: 'doi-song', img: 'https://images.unsplash.com/photo-1516253593875-bd7ba052fbc5?auto=format&fit=crop&w=600&q=80' },
  { id: 9, title: 'Văn hóa địa phương', desc: 'Đờn ca, hát dân gian, lễ hội, kể chuyện địa phương', tag: 'Văn hóa', cat: 'van-hoa', img: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=600&q=80' },
  { id: 10, title: 'Khám phá làng quê', desc: 'Đạp xe, đi bộ, tham quan xóm làng', tag: 'Khám phá', cat: 'kham-pha', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80' },
  { id: 11, title: 'Chậm thư giãn', desc: 'Võng, uống trà, ngắm hoàng hôn, đọc sách, nghỉ ngơi', tag: 'Nghỉ dưỡng', cat: 'thu-gian', img: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=80' },
  { id: 12, title: 'Ở cùng người bản địa', desc: 'Sinh hoạt, ăn uống và trò chuyện cùng gia đình chủ nhà', tag: 'Người bản địa', cat: 'ban-dia', img: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80' },
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

const DEFAULT_FESTIVALS = [
  {
    key: 'diff',
    id: 'diff',
    badge: 'Sắp diễn ra vào tháng 6',
    name: 'Lễ Hội Pháo Hoa Quốc Tế Đà Nẵng (DIFF)',
    location: 'Sân khấu bờ sông Hàn, TP. Đà Nẵng',
    date: '08/06 - 13/07/2026',
    imageUrl: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1200&q=80',
    homestays: [
      { id: 'f1', name: 'Han River Glass House', location: 'Bờ sông Hàn, Đà Nẵng', distance: 'Cách điểm bắn pháo hoa 450m', rating: '4.95', reviews: '184', price: '1.150.000đ', tag: 'Gần khán đài pháo hoa', img: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80' },
      { id: 'f2', name: 'Danang Riverside Cozy Villa', location: 'Đường Trần Hưng Đạo, Đà Nẵng', distance: 'Cách điểm tổ chức 700m', rating: '4.92', reviews: '142', price: '1.450.000đ', tag: 'Đi bộ ra lễ hội', img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80' },
      { id: 'f3', name: 'Sơn Trà Sunset Infinity Villa', location: 'Quận Sơn Trà, Đà Nẵng', distance: 'Cách điểm tổ chức 1.2km', rating: '4.94', reviews: '215', price: '2.750.000đ', tag: 'View biển vô cực', img: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80' },
      { id: 'f4', name: 'Dragon Bridge Boutique Stay', location: 'Cầu Rồng, Đà Nẵng', distance: 'Cách điểm tổ chức 550m', rating: '4.91', reviews: '168', price: '1.250.000đ', tag: 'View Cầu Rồng phun lửa', img: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80' },
      { id: 'f5', name: 'Bạch Đằng Riverside Luxury', location: 'Đường Bạch Đằng, Đà Nẵng', distance: 'Cách điểm tổ chức 300m', rating: '4.96', reviews: '290', price: '1.850.000đ', tag: 'Ngắm pháo hoa trực tiếp', img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80' },
      { id: 'f6', name: 'Mỹ Khê Beachside Green Villa', location: 'Bãi biển Mỹ Khê, Đà Nẵng', distance: 'Cách điểm tổ chức 1.5km', rating: '4.89', reviews: '115', price: '1.050.000đ', tag: 'Gần biển thoáng mát', img: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80' },
    ],
  },
  {
    key: 'dalat',
    id: 'dalat',
    badge: 'Khai mạc cuối năm',
    name: 'Festival Hoa Đà Lạt Sắc Màu Xứ Ngàn Hoa',
    location: 'Quảng trường Lâm Viên & Hồ Xuân Hương, Đà Lạt',
    date: '18/12 - 31/12/2026',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    homestays: [
      { id: 'f7', name: 'Dalat Blooming Garden Homestay', location: 'Hồ Xuân Hương, Đà Lạt', distance: 'Cách Quảng trường 400m', rating: '4.97', reviews: '230', price: '950.000đ', tag: 'Đi bộ ra Festival', img: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80' },
      { id: 'f8', name: 'The Memory Valley Villa', location: 'Hồ Tuyền Lâm, Đà Lạt', distance: 'Cách điểm tổ chức 1.5km', rating: '4.96', reviews: '340', price: '1.450.000đ', tag: 'Săn mây thung lũng', img: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=600&q=80' },
      { id: 'f9', name: 'Mimosa Forest Wooden Cottage', location: 'Đèo Mimosa, Đà Lạt', distance: 'Cách điểm tổ chức 2km', rating: '4.93', reviews: '175', price: '1.150.000đ', tag: 'Rừng hoa Mimosa', img: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80' },
      { id: 'f10', name: 'Cẩm Tú Cầu Hillside Villa', location: 'Trại Mát, Đà Lạt', distance: 'Cách điểm tổ chức 2.5km', rating: '4.90', reviews: '142', price: '1.200.000đ', tag: 'Cánh đồng cẩm tú cầu', img: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=600&q=80' },
      { id: 'f11', name: 'Thung Lũng Mây Warm Cabin', location: 'Hồ Than Thở, Đà Lạt', distance: 'Cách điểm tổ chức 1.8km', rating: '4.92', reviews: '160', price: '1.050.000đ', tag: 'Lò sưởi củi ấm cúng', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80' },
      { id: 'f12', name: 'Pine Hill Retreat Dalat', location: 'Phường 4, Đà Lạt', distance: 'Cách Quảng trường 1km', rating: '4.95', reviews: '210', price: '1.350.000đ', tag: 'Đồi thông thơ mộng', img: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80' },
    ],
  },
];

const HOT_HOMESTAYS = [
  { id: 1, name: 'The Memory Valley Villa', city: 'dalat', location: 'Đà Lạt', rating: 4.96, reviews: 340, specs: '3 phòng ngủ · 6 khách', amenities: 'Bể bơi nước ấm · Lò sưởi củi · Sân BBQ đồi thông', price: '1.450.000đ', tag: 'Top 1 Bán Chạy', img: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=600&q=80' },
  { id: 2, name: 'An Bàng Seaside Haven', city: 'hoian', location: 'Hội An', rating: 4.93, reviews: 285, specs: '2 phòng ngủ · 4 khách', amenities: 'Sát biển 50m · Xe đạp miễn phí · Bữa sáng miền Trung', price: '1.550.000đ', tag: 'Đã đặt 31 lần', img: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80' },
  { id: 3, name: 'Mây Lang Thang Eco Lodge', city: 'sapa', location: 'Sapa', rating: 4.90, reviews: 198, specs: '1 phòng ngủ · 2 khách', amenities: 'View thung lũng Mường Hoa · Lẩu cá hồi · Tắm bồn gỗ', price: '1.100.000đ', tag: 'Đã đặt 29 lần', img: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=600&q=80' },
  { id: 4, name: 'Sơn Trà Sunset Infinity Villa', city: 'danang', location: 'Đà Nẵng', rating: 4.94, reviews: 215, specs: '4 phòng ngủ · 8 khách', amenities: 'Hồ bơi vô cực view biển · Bếp nướng BBQ · Karaoke', price: '2.750.000đ', tag: 'Đã đặt 26 lần', img: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80' },
  { id: 5, name: 'Rừng Sương Glamping & Cabin', city: 'dalat', location: 'Đà Lạt', rating: 4.92, reviews: 182, specs: '2 phòng ngủ · 4 khách', amenities: 'Chèo thuyền SUP · Tiệc nướng BBQ · Lửa trại đêm', price: '1.100.000đ', tag: 'Săn mây cực chill', img: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80' },
  { id: 6, name: 'Làng Nắng Vintage Homestay', city: 'hoian', location: 'Hội An', rating: 4.88, reviews: 145, specs: '1 phòng ngủ · 2 khách', amenities: 'Vườn cây nhiệt đới · Trà chiều miễn phí · Xe đạp dạo phố', price: '890.000đ', tag: 'Phố cổ 500m', img: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=600&q=80' },
  { id: 7, name: 'Fansipan Panorama Eco House', city: 'sapa', location: 'Sapa', rating: 4.95, reviews: 260, specs: '2 phòng ngủ · 4 khách', amenities: 'Ban công săn mây toàn cảnh · Tắm lá thuốc Dao Đỏ · Bếp củi', price: '1.350.000đ', tag: 'View Fansipan', img: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=80' },
  { id: 8, name: 'Mỹ Khê Horizon Coastal Villa', city: 'danang', location: 'Đà Nẵng', rating: 4.91, reviews: 195, specs: '3 phòng ngủ · 6 khách', amenities: 'Sát biển 100m · Sân thượng ngắm bình minh · Bếp nướng hải sản', price: '1.650.000đ', tag: 'Biển Mỹ Khê', img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80' },
  { id: 9, name: 'Hồ Tuyền Lâm Forest Lodge', city: 'dalat', location: 'Hồ Tuyền Lâm, Đà Lạt', rating: 4.94, reviews: 230, specs: '2 phòng ngủ · 4 khách', amenities: 'Bến thuyền riêng · Đốt lửa trại ngắm sao · Trà chiều miễn phí', price: '1.380.000đ', tag: 'Ven hồ bình yên', img: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80' },
  { id: 10, name: 'Cẩm Thanh Riverside Cottage', city: 'hoian', location: 'Rừng dừa Bảy Mẫu, Hội An', rating: 4.90, reviews: 172, specs: '2 phòng ngủ · 4 khách', amenities: 'Thuyền thúng miễn phí · Bếp nướng sân vườn · Bữa sáng miền quê', price: '920.000đ', tag: 'Rừng dừa Bảy Mẫu', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80' },
  { id: 11, name: 'Cát Cát Wooden Chalet', city: 'sapa', location: 'Bản Cát Cát, Sapa', rating: 4.93, reviews: 210, specs: '1 phòng ngủ · 2 khách', amenities: 'Bồn tắm nước suối khoáng · Ngắm thác Tiên Sa · Trang phục dân tộc', price: '1.050.000đ', tag: 'Gần suối Cát Cát', img: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80' },
  { id: 12, name: 'Non Nước Sunlit Garden Villa', city: 'danang', location: 'Ngũ Hành Sơn, Đà Nẵng', rating: 4.92, reviews: 165, specs: '3 phòng ngủ · 6 khách', amenities: 'Hồ bơi riêng biệt lập · Sân bóng chuyền bãi biển · Bếp BBQ hải sản', price: '2.250.000đ', tag: 'Sát bãi tắm Non Nước', img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80' },
];

const FAVORITES_HOMESTAYS = [
  { id: 101, name: 'The Pine Hill Retreat', city: 'dalat', location: 'Đà Lạt', rating: 4.90, reviews: 126, specs: '2 phòng ngủ · 4 khách', amenities: 'BBQ sân vườn · Lò sưởi củi · Bồn tắm ngắm mây', price: '1.200.000đ', tag: 'Chủ nhà tận tâm', img: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80' },
  { id: 102, name: 'Lạc Vào Phố Cổ Heritage', city: 'hoian', location: 'Hội An', rating: 4.95, reviews: 215, specs: '3 phòng ngủ · 6 khách', amenities: 'Bể bơi riêng · Xe đạp miễn phí · Trà chiều bản địa', price: '1.650.000đ', tag: 'Điểm kiến trúc', img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=600&q=80' },
  { id: 103, name: 'Sapa Cloud Forest Lodge', city: 'sapa', location: 'Tả Van, Sapa', rating: 4.91, reviews: 154, specs: '1 phòng ngủ · 2 khách', amenities: 'Ban công săn mây · Tắm thuốc Dao Đỏ · Ăn tối gia đình', price: '980.000đ', tag: 'Trải nghiệm Dao Đỏ', img: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80' },
  { id: 104, name: 'Danang Ocean Horizon', city: 'danang', location: 'Bán đảo Sơn Trà, Đà Nẵng', rating: 4.94, reviews: 178, specs: '2 phòng ngủ · 4 khách', amenities: 'Bể bơi vô cực ngắm vịnh · Bếp BBQ · Đón tiễn sân bay', price: '1.450.000đ', tag: 'View biển triệu đô', img: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80' },
  { id: 105, name: 'Mộc Trà Hillside Villa', city: 'dalat', location: 'Cầu Đất, Đà Lạt', rating: 4.93, reviews: 168, specs: '3 phòng ngủ · 6 khách', amenities: 'Đồi chè Cầu Đất · Thưởng trà ngắm hoàng hôn · Sân vườn rộng', price: '1.350.000đ', tag: 'Đồi chè xanh mướt', img: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=600&q=80' },
  { id: 106, name: 'Cổ Trấn Lồng Đèn House', city: 'hoian', location: 'Cẩm Châu, Hội An', rating: 4.89, reviews: 130, specs: '2 phòng ngủ · 4 khách', amenities: 'Phong cách Đông Dương · Hồ cá koi sân vườn · Gần chợ quê', price: '1.050.000đ', tag: 'Phong cách Indochine', img: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80' },
  { id: 107, name: 'Tả Van Bamboo Eco Homestay', city: 'sapa', location: 'Tả Van, Sapa', rating: 4.92, reviews: 175, specs: '1 phòng ngủ · 2 khách', amenities: 'Bungalow tre tự nhiên · Suối Mường Hoa chảy qua · Bữa sáng bản địa', price: '850.000đ', tag: 'Bên bờ suối Mường Hoa', img: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=600&q=80' },
  { id: 108, name: 'Bán Đảo Xanh Luxury Suite', city: 'danang', location: 'Sơn Trà, Đà Nẵng', rating: 4.96, reviews: 210, specs: '3 phòng ngủ · 6 khách', amenities: 'Hồ bơi nước mặn · Bếp BBQ gia đình · Trọn vẹn view biển Mỹ Khê', price: '2.100.000đ', tag: 'Nghỉ dưỡng thượng lưu', img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80' },
  { id: 109, name: 'Đồi Thông Hoàng Hôn Cabin', city: 'dalat', location: 'Trại Mát, Đà Lạt', rating: 4.95, reviews: 195, specs: '2 phòng ngủ · 4 khách', amenities: 'Kính ngắm thung lũng đèn đêm · Bếp sưởi gỗ · Ban công thưởng trà', price: '1.250.000đ', tag: 'Ngắm thung lũng đèn', img: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=600&q=80' },
  { id: 110, name: 'An Bàng Secret Garden', city: 'hoian', location: 'Biển An Bàng, Hội An', rating: 4.91, reviews: 140, specs: '2 phòng ngủ · 4 khách', amenities: 'Lối đi bộ ra biển 30m · Sân vườn chuối nhiệt đới · Đạp xe dạo biển', price: '1.300.000đ', tag: 'Gần biển An Bàng', img: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80' },
  { id: 111, name: 'Thung Lũng Mường Hoa Chalet', city: 'sapa', location: 'Hầu Thào, Sapa', rating: 4.94, reviews: 188, specs: '2 phòng ngủ · 4 khách', amenities: 'Săn mây ban công toàn cảnh · Bữa tối lẩu gà đen bản địa · Lò sưởi ấm', price: '1.150.000đ', tag: 'Săn mây Hầu Thào', img: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=80' },
  { id: 112, name: 'Sơn Trà Green Bay Villa', city: 'danang', location: 'Bãi Bụt, Đà Nẵng', rating: 4.97, reviews: 225, specs: '3 phòng ngủ · 6 khách', amenities: 'Hồ bơi nhìn thẳng vịnh Đà Nẵng · Dịch vụ đầu bếp tại gia · Trà chiều', price: '2.450.000đ', tag: 'Vịnh Sơn Trà ngắm biển', img: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80' },
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
  const [isVisualSearchOpen, setIsVisualSearchOpen] = useState(false);

  // Search History & Suggestion Popover State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchHistory, setSearchHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('yen_search_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return ['Đà Lạt', 'Hội An', 'Sapa săn mây', 'Đà Nẵng'];
  });
  const searchBoxRef = useRef(null);
  const searchInputRef = useRef(null);

  // Xử lý đóng popover khi click ra ngoài hoặc bấm Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Featured Combo Slider
  const [comboIndex, setComboIndex] = useState(0);

  // Festival Section State
  const [activeFestivalKey, setActiveFestivalKey] = useState('diff');
  const [databaseFestivals, setDatabaseFestivals] = useState(DEFAULT_FESTIVALS);
  const [festivalLoading, setFestivalLoading] = useState(false);

  // Favorites Filter City State
  const [favCityFilter, setFavCityFilter] = useState('all');

  // Homestay Sliders: Refs & Smooth Scroll Controls
  const hotSliderRef = useRef(null);
  const favSliderRef = useRef(null);
  const festSliderRef = useRef(null);

  const scrollSlider = (ref, direction) => {
    if (ref && ref.current) {
      const containerWidth = ref.current.clientWidth;
      const scrollStep = containerWidth > 768 ? Math.floor(containerWidth * 0.75) : 300;
      ref.current.scrollBy({
        left: direction * scrollStep,
        behavior: 'smooth'
      });
    }
  };



  // Wishlist State (Đồng bộ trực tiếp với CSDL)
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser());
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [toast, setToast] = useState({ show: false, msg: '' });

  // Tải danh sách homestay yêu thích từ CSDL
  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
    const cached = wishlistService.getCachedWishlist(user ? user.id : null);
    if (cached && Array.isArray(cached)) {
      setWishlistIds(new Set(cached.map(item => Number(item.id || item.homestayId))));
    }

    wishlistService.getWishlist(user ? user.id : null).then(res => {
      if (res && Array.isArray(res.data)) {
        setWishlistIds(new Set(res.data.map(item => Number(item.id || item.homestayId))));
      }
    });
  }, []);

  // Dynamic Data State
  const [homeData, setHomeData] = useState({
    heroSlides: HERO_SLIDES,
    experiences: EXPERIENCES,
    combos: COMBOS,
    festivals: DEFAULT_FESTIVALS,
    hotHomestays: HOT_HOMESTAYS,
    favoritesHomestays: FAVORITES_HOMESTAYS
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    fetch('http://localhost:8081/api/public/festivals', { signal: controller.signal })
      .then(response => response.ok ? response.json() : Promise.reject(new Error('Festival API unavailable')))
      .then(rows => {
        clearTimeout(timeoutId);
        if (cancelled) return;
        if (!Array.isArray(rows) || rows.length === 0) return;
        const mapped = rows.map(festival => {
          let homestays = festival.homestays || [];
          if (homestays.length === 0 && DEFAULT_FESTIVALS[0]?.homestays) {
            homestays = DEFAULT_FESTIVALS[0].homestays;
          }
          return {
            ...festival,
            key: String(festival.id || festival.key),
            badge: festival.badgeInfo || 'Sắp diễn ra',
            date: [festival.startDate, festival.endDate].filter(Boolean).join(' – ') || 'Sắp diễn ra',
            location: [festival.location, festival.city].filter(Boolean).join(', ') || 'Việt Nam',
            imageUrl: festival.imageUrl || 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1200&q=80',
            homestays: homestays.map(h => ({
              ...h,
              price: typeof h.price === 'number' ? h.price.toLocaleString('vi-VN') + 'đ' : (h.price ? (h.price.toString().includes('đ') ? h.price : Number(h.price).toLocaleString('vi-VN') + 'đ') : '1.200.000đ'),
              img: h.imageUrl || h.img || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80',
              distance: h.distanceLabel || h.distance || 'Cách điểm tổ chức 500m'
            })),
          };
        });
        setDatabaseFestivals(mapped);
        if (mapped.length > 0) {
          setActiveFestivalKey(prev => mapped.some(m => m.key === prev) ? prev : mapped[0].key);
        }
      })
      .catch(() => {})
      .finally(() => {
        clearTimeout(timeoutId);
        if (!cancelled) setFestivalLoading(false);
      });
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  const expGridRef = useRef(null);

  // Fetch dynamic data
  useEffect(() => {
    let isMounted = true;
    const fetchHomeData = async () => {
      setIsLoading(true);
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        const [homeRes, realHomestays] = await Promise.all([
          fetch('http://localhost:8081/api/public/home', { signal: controller.signal })
            .then(res => res.ok ? res.json() : null)
            .catch(() => null),
          homestayService.getAllHomestays().catch(() => null)
        ]);
        clearTimeout(timeoutId);

        if (!isMounted) return;

        let mappedHomestays = [];
        if (Array.isArray(realHomestays) && realHomestays.length > 0) {
          mappedHomestays = realHomestays.map((h, i) => {
            const citySlug = getCitySlug(h.city, h.address || h.location);
            let ratingVal = h.rating ? (h.rating > 5 ? (h.rating / 2).toFixed(1) : Number(h.rating).toFixed(1)) : '5';
            if (ratingVal.endsWith('.0')) ratingVal = ratingVal.slice(0, -2);
            const reviewsVal = h.reviewCount || h.reviews || h.totalReviews || (h.id ? ((Number(String(h.id).replace(/\D/g, '')) || 1) * 7) % 65 + 18 : 25);
            const priceVal = Number(h.price || h.basePrice || h.pricePerNight || 1200000);
            const priceFormatted = Number(priceVal).toLocaleString('vi-VN') + 'đ';

            const numRooms = h.rooms?.length || h.numRooms || (h.id ? ((Number(String(h.id).replace(/\D/g, '')) || 2) % 4 + 2) : 3);
            const numGuests = h.maxGuests || (numRooms * 2 + 2);
            const specsVal = `${numRooms} phòng ngủ · ${numGuests} khách`;

            const amenitiesVal = h.amenities || h.tags || 'Sân gạch & giếng nước · Bếp củi truyền thống · Không gian xanh';
            const imgVal = (h.images && h.images.length > 0 ? h.images[0] : null) || h.image || h.primaryImage || h.thumb || h.gallery?.[0] || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80';
            const tagVal = i % 4 === 0 ? 'Top 1 Bán Chạy' : (i % 4 === 1 ? 'Du khách yêu thích' : (i % 4 === 2 ? 'Chủ nhà tận tâm' : 'Đã đặt 30+ lần'));

            return {
              id: h.id || h.homestayId,
              name: h.name,
              city: citySlug,
              location: h.city || h.address || 'Việt Nam',
              rating: ratingVal,
              reviews: reviewsVal,
              specs: specsVal,
              amenities: amenitiesVal,
              price: priceFormatted,
              tag: tagVal,
              img: imgVal
            };
          });
        }

        if (homeRes) {
          const mappedExperiences = (homeRes.experiences || []).map(exp => ({
            ...exp,
            cat: exp.cat || getCategorySlug(exp)
          }));

          setHomeData(prev => ({
            ...prev,
            ...homeRes,
            experiences: mappedExperiences.length > 0 ? mappedExperiences : prev.experiences,
            hotHomestays: mappedHomestays.length > 0 ? mappedHomestays.slice(0, 16) : (homeRes.hotHomestays && homeRes.hotHomestays.length > 0 ? homeRes.hotHomestays : prev.hotHomestays),
            favoritesHomestays: mappedHomestays.length > 0 ? mappedHomestays : (homeRes.favoritesHomestays && homeRes.favoritesHomestays.length > 0 ? homeRes.favoritesHomestays : prev.favoritesHomestays)
          }));
        } else if (mappedHomestays.length > 0) {
          setHomeData(prev => ({
            ...prev,
            hotHomestays: mappedHomestays.slice(0, 16),
            favoritesHomestays: mappedHomestays
          }));
        }
      } catch (err) {
        console.warn('Lỗi khi tải dữ liệu trang chủ:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchHomeData();
    return () => { isMounted = false; };
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

  const isWishlisted = (id, name) => {
    return wishlistIds.has(Number(id)) || (name && wishlistIds.has(name));
  };

  const toggleWishlist = async (h, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const id = Number(h.id || h.homestayId || 1);
    const name = h.name || h.title || 'Homestay';
    const alreadyLiked = isWishlisted(id, name);

    setWishlistIds((prev) => {
      const next = new Set(prev);
      if (alreadyLiked) {
        next.delete(id);
        next.delete(name);
      } else {
        next.add(id);
      }
      return next;
    });

    try {
      if (alreadyLiked) {
        await wishlistService.removeFromWishlist(currentUser ? currentUser.id : null, id);
        triggerToast(`Đã bỏ lưu "${name}" khỏi Wishlist.`);
      } else {
        triggerToast(`Đã thêm "${name}" vào danh sách Yêu thích!`);
        await wishlistService.addToWishlist(currentUser ? currentUser.id : null, id, h);
      }
    } catch (err) {
      console.warn('Lỗi lưu CSDL wishlist:', err);
      setWishlistIds((prev) => {
        const next = new Set(prev);
        if (alreadyLiked) next.add(id); else { next.delete(id); next.delete(name); }
        return next;
      });
      triggerToast(err.message || 'Không thể cập nhật danh sách yêu thích.', 'bi-exclamation-circle-fill text-danger');
    }
  };

  const saveToHistory = (term) => {
    if (!term || !term.trim()) return;
    const clean = term.trim();
    setSearchHistory((prev) => {
      const next = [clean, ...prev.filter((i) => i.toLowerCase() !== clean.toLowerCase())].slice(0, 8);
      try {
        localStorage.setItem('yen_search_history', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const removeFromHistory = (termToRemove, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setSearchHistory((prev) => {
      const next = prev.filter((i) => i !== termToRemove);
      try {
        localStorage.setItem('yen_search_history', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const clearAllHistory = (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setSearchHistory([]);
    try {
      localStorage.removeItem('yen_search_history');
    } catch (e) {}
    triggerToast('Đã xóa tất cả lịch sử tìm kiếm');
  };

  const handleSelectQuery = (term, autoSubmit = false) => {
    setDestination(term);
    setIsSearchOpen(false);
    saveToHistory(term);
    if (autoSubmit) {
      triggerToast(`Đang tìm kiếm homestay tại: ${term}...`);
      setTimeout(() => {
        navigate(`/search?q=${encodeURIComponent(term)}`);
      }, 350);
    }
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setIsSearchOpen(false);
    const term = destination.trim();
    if (term) {
      saveToHistory(term);
    }
    triggerToast(`Đang tìm kiếm homestay tại: ${term || 'Tất cả điểm đến'}...`);
    setTimeout(() => {
      navigate(`/search?q=${encodeURIComponent(term)}`);
    }, 450);
  };

  // Danh sách homestay tổng hợp để gợi ý trực tiếp
  const allAvailableHomestays = useMemo(() => {
    const map = new Map();
    [...(homeData.hotHomestays || []), ...(homeData.favoritesHomestays || [])].forEach((h) => {
      if (h && (h.id || h.name) && !map.has(h.id || h.name)) {
        map.set(h.id || h.name, h);
      }
    });
    return Array.from(map.values());
  }, [homeData.hotHomestays, homeData.favoritesHomestays]);

  // Gợi ý homestay theo từ khóa đang gõ
  const matchingHomestays = useMemo(() => {
    if (!destination || !destination.trim()) return [];
    const q = removeVietnameseTones(destination);
    return allAvailableHomestays
      .filter((h) => {
        const target = removeVietnameseTones(`${h.name || ''} ${h.location || ''} ${h.city || ''}`);
        return target.includes(q);
      })
      .slice(0, 4);
  }, [destination, allAvailableHomestays]);

  // Gợi ý địa điểm theo từ khóa đang gõ
  const matchingDestinations = useMemo(() => {
    if (!destination || !destination.trim()) return POPULAR_DESTINATIONS;
    const q = removeVietnameseTones(destination);
    return POPULAR_DESTINATIONS.filter((d) =>
      removeVietnameseTones(`${d.name} ${d.desc}`).includes(q)
    );
  }, [destination]);

  const scrollExperience = (direction) => {
    if (expGridRef.current) {
      expGridRef.current.scrollBy({ left: direction * 260, behavior: 'smooth' });
    }
  };

  const filteredFavorites = useMemo(() => {
    const list = homeData.favoritesHomestays || [];
    if (favCityFilter === 'all') {
      return list.slice(0, 32);
    }
    return list.filter((h) => h.city === favCityFilter);
  }, [homeData.favoritesHomestays, favCityFilter]);

  const festivalTabs = (databaseFestivals && databaseFestivals.length > 0) ? databaseFestivals : DEFAULT_FESTIVALS;
  const activeFestData = festivalTabs.find(festival => festival.key === activeFestivalKey) || festivalTabs[0];

  // Drag-to-scroll (kéo kéo qua) trên máy tính
  useEffect(() => {
    const attachSliderDrag = (slider) => {
      if (!slider) return () => {};
      let isDown = false;
      let startX = 0;
      let scrollLeft = 0;
      let hasDragged = false;

      const handleMouseDown = (e) => {
        isDown = true;
        hasDragged = false;
        slider.style.cursor = 'grabbing';
        slider.style.userSelect = 'none';
        slider.style.scrollSnapType = 'none';
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
      };

      const handleMouseLeave = () => {
        if (!isDown) return;
        isDown = false;
        slider.style.cursor = '';
        slider.style.userSelect = '';
        slider.style.scrollSnapType = 'x mandatory';
      };

      const handleMouseUp = () => {
        if (!isDown) return;
        isDown = false;
        slider.style.cursor = '';
        slider.style.userSelect = '';
        slider.style.scrollSnapType = 'x mandatory';
      };

      const handleMouseMove = (e) => {
        if (!isDown) return;
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 1.3;
        if (Math.abs(walk) > 6) {
          hasDragged = true;
        }
        slider.scrollLeft = scrollLeft - walk;
      };

      const handleClickCapture = (e) => {
        if (hasDragged) {
          e.preventDefault();
          e.stopPropagation();
          hasDragged = false;
        }
      };

      slider.addEventListener('mousedown', handleMouseDown);
      slider.addEventListener('mouseleave', handleMouseLeave);
      slider.addEventListener('mouseup', handleMouseUp);
      slider.addEventListener('mousemove', handleMouseMove);
      slider.addEventListener('click', handleClickCapture, true);

      return () => {
        slider.removeEventListener('mousedown', handleMouseDown);
        slider.removeEventListener('mouseleave', handleMouseLeave);
        slider.removeEventListener('mouseup', handleMouseUp);
        slider.removeEventListener('mousemove', handleMouseMove);
        slider.removeEventListener('click', handleClickCapture, true);
      };
    };

    const cleanupHot = attachSliderDrag(hotSliderRef.current);
    const cleanupFav = attachSliderDrag(favSliderRef.current);
    const cleanupFest = attachSliderDrag(festSliderRef.current);

    return () => {
      cleanupHot();
      cleanupFav();
      cleanupFest();
    };
  }, [favCityFilter, activeFestivalKey, homeData]);

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
              <div className={`search-box modern-gold-box ${isSearchOpen ? 'is-focused' : ''}`} ref={searchBoxRef}>
                <form className="search-form" onSubmit={handleSearchSubmit}>
                  {/* Điểm đến */}
                  <div
                    className={`search-field field-with-border field-destination ${isSearchOpen ? 'field-active' : ''}`}
                    onClick={() => {
                      setIsSearchOpen(true);
                      setPopoverOpen(false);
                      if (searchInputRef.current) searchInputRef.current.focus();
                    }}
                  >
                    <i className="bi bi-geo-alt search-field-icon" />
                    <div className="field-content">
                      <label className="field-label" htmlFor="searchDest">Điểm đến hoặc homestay</label>
                      <input
                        type="text"
                        id="searchDest"
                        ref={searchInputRef}
                        className="field-input"
                        placeholder="Bạn muốn đi đâu? (Đà Lạt, Hội An...)"
                        value={destination}
                        autoComplete="off"
                        onChange={(e) => {
                          setDestination(e.target.value);
                          if (!isSearchOpen) setIsSearchOpen(true);
                        }}
                        onFocus={() => {
                          setIsSearchOpen(true);
                          setPopoverOpen(false);
                        }}
                      />
                    </div>

                    {/* Nút Xóa nhanh từ khóa */}
                    {destination && (
                      <button
                        type="button"
                        className="clear-search-btn"
                        title="Xóa tìm kiếm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDestination('');
                          if (searchInputRef.current) searchInputRef.current.focus();
                        }}
                      >
                        <i className="bi bi-x-circle-fill" />
                      </button>
                    )}
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
                      onClick={() => {
                        setPopoverOpen(!popoverOpen);
                        setIsSearchOpen(false);
                      }}
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

                  {/* Camera / Visual Search button */}
                  <button
                    type="button"
                    className="search-visual-btn"
                    title="Tìm kiếm bằng hình ảnh"
                    onClick={() => {
                      setIsVisualSearchOpen(true);
                      setIsSearchOpen(false);
                    }}
                  >
                    <i className="bi bi-camera-fill" />
                  </button>

                  {/* Submit */}
                  <button type="submit" className="search-submit-btn">
                    <i className="bi bi-search" /><span>Tìm kiếm</span>
                  </button>
                </form>

                {/* DROPDOWN GỢI Ý & LỊCH SỬ TÌM KIẾM - ĐẶT TẠI CẤP SEARCH-BOX ĐỂ RỘNG RÃI & KHÔNG BỊ BÓ HẸP BỞI CỘT ĐIỂM ĐẾN */}
                {isSearchOpen && (
                  <div className="search-suggestion-dropdown" onClick={(e) => e.stopPropagation()}>
                    {!destination.trim() ? (
                      <>
                        {/* 1. LỊCH SỬ TÌM KIẾM */}
                        {searchHistory.length > 0 && (
                          <div className="dropdown-section history-section">
                            <div className="dropdown-section-header">
                              <span className="sug-section-title">
                                <i className="bi bi-clock-history text-emerald" /> Lịch sử tìm kiếm gần đây
                              </span>
                              <button
                                type="button"
                                className="btn-clear-all-history"
                                onClick={clearAllHistory}
                              >
                                Xóa tất cả
                              </button>
                            </div>
                            <div className="search-history-tags">
                              {searchHistory.map((term, idx) => (
                                <div
                                  key={idx}
                                  className="search-history-tag"
                                  onClick={() => handleSelectQuery(term, true)}
                                >
                                  <i className="bi bi-clock history-icon" />
                                  <span className="history-text">{term}</span>
                                  <button
                                    type="button"
                                    className="history-remove-btn"
                                    title="Xóa mục này"
                                    onClick={(e) => removeFromHistory(term, e)}
                                  >
                                    <i className="bi bi-x" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 2. ĐIỂM ĐẾN THỊNH HÀNH */}
                        <div className="dropdown-section destinations-section">
                          <div className="dropdown-section-header">
                            <span className="sug-section-title">
                              <i className="bi bi-fire text-amber" /> Điểm đến thịnh hành nhất
                            </span>
                            <span className="section-hint">Chọn để khám phá</span>
                          </div>
                          <div className="popular-destinations-grid">
                            {POPULAR_DESTINATIONS.map((dest) => (
                              <div
                                key={dest.name}
                                className="popular-dest-card"
                                onClick={() => handleSelectQuery(dest.name, true)}
                              >
                                <div className="dest-icon-wrap">
                                  <i className={`bi ${dest.icon}`} />
                                </div>
                                <div className="dest-info">
                                  <div className="dest-name-row">
                                    <span className="dest-name">{dest.name}</span>
                                    <span className="dest-badge">{dest.badge}</span>
                                  </div>
                                  <div className="dest-desc">{dest.desc}</div>
                                </div>
                                <span className="dest-count">{dest.homestaysCount}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 3. PHONG CÁCH DU LỊCH */}
                        <div className="dropdown-section themes-section">
                          <div className="dropdown-section-header">
                            <span className="sug-section-title">
                              <i className="bi bi-compass-fill text-emerald" /> Khám phá theo trải nghiệm
                            </span>
                          </div>
                          <div className="theme-chips-list">
                            {POPULAR_THEMES.map((theme) => (
                              <button
                                key={theme.label}
                                type="button"
                                className="theme-chip-btn"
                                onClick={() => handleSelectQuery(theme.query, true)}
                              >
                                <i className={`bi ${theme.icon}`} />
                                <span>{theme.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      /* KHI ĐANG GÕ TỪ KHÓA */
                      <div className="dropdown-live-results">
                        {/* Khớp trực tiếp */}
                        <div
                          className="search-direct-action"
                          onClick={() => handleSelectQuery(destination, true)}
                        >
                          <div className="action-icon">
                            <i className="bi bi-search" />
                          </div>
                          <div className="action-text">
                            Tìm kiếm homestay tại <strong>"{destination}"</strong>
                          </div>
                          <i className="bi bi-arrow-right action-arrow" />
                        </div>

                        {/* Địa điểm gợi ý khớp */}
                        {matchingDestinations.length > 0 && (
                          <div className="dropdown-section">
                            <div className="dropdown-section-header">
                              <span className="sug-section-title">
                                <i className="bi bi-geo-alt-fill text-emerald" /> Địa điểm phù hợp ({matchingDestinations.length})
                              </span>
                            </div>
                            <div className="matching-destinations-list">
                              {matchingDestinations.map((dest) => (
                                <div
                                  key={dest.name}
                                  className="matching-dest-row"
                                  onClick={() => handleSelectQuery(dest.name, true)}
                                >
                                  <i className="bi bi-geo-alt text-emerald" />
                                  <span className="matching-dest-name">{dest.name}</span>
                                  <span className="matching-dest-desc">— {dest.desc}</span>
                                  <span className="matching-dest-count">{dest.homestaysCount}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Homestay gợi ý khớp */}
                        {matchingHomestays.length > 0 && (
                          <div className="dropdown-section">
                            <div className="dropdown-section-header">
                              <span className="sug-section-title">
                                <i className="bi bi-house-heart-fill text-emerald" /> Homestay nổi bật ({matchingHomestays.length})
                              </span>
                              <span className="section-hint">Bấm xem chi tiết</span>
                            </div>
                            <div className="suggested-homestays-list">
                              {matchingHomestays.map((h) => (
                                <div
                                  key={h.id}
                                  className="suggested-homestay-card"
                                  onClick={() => {
                                    setIsSearchOpen(false);
                                    saveToHistory(h.name);
                                    navigate(`/homestay/${h.id}`);
                                  }}
                                >
                                  <img
                                    src={h.img || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=120&q=80'}
                                    alt={h.name}
                                    className="suggested-hs-img"
                                  />
                                  <div className="suggested-hs-info">
                                    <div className="suggested-hs-name">{h.name}</div>
                                    <div className="suggested-hs-loc">
                                      <i className="bi bi-geo-alt" /> {h.location || h.city}
                                    </div>
                                  </div>
                                  <div className="suggested-hs-price-meta">
                                    <div className="suggested-hs-rating">
                                      <i className="bi bi-star-fill text-warning" /> {h.rating || 5.0}
                                    </div>
                                    <div className="suggested-hs-price">{h.price}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Không tìm thấy gợi ý cụ thể */}
                        {matchingHomestays.length === 0 && matchingDestinations.length === 0 && (
                          <div className="dropdown-empty-state">
                            <div className="empty-icon-circle">
                              <i className="bi bi-search-heart" />
                            </div>
                            <div className="empty-title">Tìm kiếm mở rộng</div>
                            <p className="empty-desc">
                              Nhấn <strong>Enter</strong> hoặc bấm nút <strong>Tìm kiếm</strong> để duyệt tất cả homestay phù hợp với từ khóa "<strong>{destination}</strong>".
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Quick tags */}
              <div className="modern-hero-tags">
                <span className="tags-label"><i className="bi bi-fire" /> Gợi ý nhanh:</span>
                {['Đà Lạt', 'Đà Nẵng', 'Hội An', 'Sapa', 'Ninh Bình', 'Phú Quốc'].map((tag) => (
                  <span
                    key={tag}
                    className="quick-tag"
                    onClick={() => handleSelectQuery(tag, true)}
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
            onClick={() => setCurrentSlide((prev) => (prev === 0 ? homeData.heroSlides.length - 1 : prev - 1))}
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
                <div 
                  key={exp.id} 
                  className="experience-card" 
                  onClick={() => {
                    const targetCat = getCategorySlug(exp);
                    navigate(`/category?cat=${targetCat}`);
                  }} 
                  style={{ cursor: 'pointer' }}
                >
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
                      <Link to={`/homestay/${c.id || 1}`} className="btn-combo-arrow">
                        <i className="bi bi-arrow-right" style={{ fontSize: '1.2rem' }} />
                      </Link>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="combo-nav-btn combo-prev"
                    onClick={() => setComboIndex((prev) => (prev === 0 ? homeData.combos.length - 1 : prev - 1))}
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
            {festivalTabs.map(festival => (
              <button
                key={festival.key}
                type="button"
                className={`festival-tab-btn ${activeFestivalKey === festival.key ? 'active' : ''}`}
                onClick={() => {
                  setActiveFestivalKey(festival.key);
                  if (festSliderRef.current) festSliderRef.current.scrollLeft = 0;
                }}
              >
                <i className="bi bi-calendar-event" /> {festival.name}
              </button>
            ))}
          </div>

          {activeFestData && (
            <>
              <div className="festival-banner-card">
                <div className="festival-banner-backdrop" style={{ backgroundImage: `url(${activeFestData.imageUrl || 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1200&q=80'})` }} />
                <div>
                  <span className="fest-badge">{activeFestData.badge || 'Sôi động mùa lễ hội'}</span>
                  <h3 className="fest-name">{activeFestData.name}</h3>
                  <div className="fest-meta">
                    <span><i className="bi bi-geo-alt-fill" /> <strong>{activeFestData.location || 'Việt Nam'}</strong></span>
                    <span><i className="bi bi-clock-fill" /> <strong>{activeFestData.date || 'Sắp diễn ra'}</strong></span>
                  </div>
                </div>
                <Link to="/search" className="btn-view-room" style={{ background: '#D97706', whiteSpace: 'nowrap' }}>
                  Xem tất cả homestay gần nhất
                </Link>
              </div>

              <div className="homestay-slider-wrap" style={{ position: 'relative', width: '100%' }}>
                <button
                  type="button"
                  className="homestay-slider-arrow arrow-prev"
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '-20px',
                    transform: 'translateY(-50%)',
                    zIndex: 35,
                    width: '44px',
                    height: '52px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.75)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1.5px solid rgba(255, 255, 255, 0.85)',
                    boxShadow: '0 6px 20px rgba(15, 23, 42, 0.14)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    color: '#1E293B',
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  onClick={() => scrollSlider(festSliderRef, -1)}
                  aria-label="Xem homestay trước"
                >
                  <i className="bi bi-chevron-left" />
                </button>

                <div className="homestay-slider-track" ref={festSliderRef}>
                  {(activeFestData.homestays || []).map((h) => (
                    <div key={h.id} className="homestay-slider-item">
                      <div className="homestay-card">
                        <div className="card-img-wrapper">
                          <span className="card-top-tag">{h.tag || 'Gần điểm lễ hội'}</span>
                          <button
                            type="button"
                            className={`card-wishlist-btn ${isWishlisted(h.id, h.name) ? 'active' : ''}`}
                            onClick={(e) => toggleWishlist(h, e)}
                            title={isWishlisted(h.id, h.name) ? 'Bỏ yêu thích' : 'Lưu vào yêu thích'}
                          >
                            <i className={`bi ${isWishlisted(h.id, h.name) ? 'bi-heart-fill' : 'bi-heart'}`} />
                          </button>
                          <Link to={`/homestay/${h.id || 'doi'}`} state={{ homestay: h }} style={{ display: 'block', height: '100%' }}>
                            <img src={h.img || h.imageUrl || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80'} alt={h.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </Link>
                        </div>
                        <div className="card-body">
                          <div className="card-location-rating">
                            <span className="card-location"><i className="bi bi-geo-alt-fill text-success" /> {h.location}</span>
                            <span className="card-rating"><i className="bi bi-star-fill" /> {h.rating || '5.0'} ({h.reviews || 0})</span>
                          </div>
                          <h3 className="card-title"><Link to={`/homestay/${h.id}`} state={{ homestay: h }}>{h.name}</Link></h3>
                          <div className="card-specs">{h.distance || h.distanceLabel || 'Cách điểm tổ chức 500m'}</div>
                          <div className="card-footer-row">
                            <div>
                              <span className="price-label">Giá từ:</span>
                              <span className="card-price">{typeof h.price === 'number' ? h.price.toLocaleString('vi-VN') + 'đ' : (h.price ? (h.price.toString().includes('đ') ? h.price : Number(h.price).toLocaleString('vi-VN') + 'đ') : '1.200.000đ')}</span>
                            </div>
                            <Link to={`/homestay/${h.id}`} state={{ homestay: h }} className="btn-view-room">Xem homestay</Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="homestay-slider-arrow arrow-next"
                  style={{
                    position: 'absolute',
                    top: '50%',
                    right: '-20px',
                    transform: 'translateY(-50%)',
                    zIndex: 35,
                    width: '44px',
                    height: '52px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.75)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1.5px solid rgba(255, 255, 255, 0.85)',
                    boxShadow: '0 6px 20px rgba(15, 23, 42, 0.14)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    color: '#1E293B',
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  onClick={() => scrollSlider(festSliderRef, 1)}
                  aria-label="Xem homestay tiếp theo"
                >
                  <i className="bi bi-chevron-right" />
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* 5. HOT HOMESTAYS */}
      <section className="hot-section">
        <div className="hp-container">
          <span className="section-badge-top" style={{ color: '#E11D48' }}><i className="bi bi-graph-up-arrow" /> Xu hướng đặt phòng</span>
          <h2 className="section-title">Homestay hot được đặt nhiều nhất hôm nay</h2>
          <p className="section-subtitle">Danh sách các căn homestay được khách hàng chốt phòng liên tục trong 24 giờ qua</p>

          <div className="homestay-slider-wrap" style={{ position: 'relative', width: '100%' }}>
            <button
              type="button"
              className="homestay-slider-arrow arrow-prev"
              style={{
                position: 'absolute',
                top: '50%',
                left: '-20px',
                transform: 'translateY(-50%)',
                zIndex: 35,
                width: '44px',
                height: '52px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.75)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1.5px solid rgba(255, 255, 255, 0.85)',
                boxShadow: '0 6px 20px rgba(15, 23, 42, 0.14)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                color: '#1E293B',
                cursor: 'pointer',
                outline: 'none',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onClick={() => scrollSlider(hotSliderRef, -1)}
              aria-label="Xem homestay trước"
            >
              <i className="bi bi-chevron-left" />
            </button>

            <div className="homestay-slider-track" ref={hotSliderRef}>
              {(homeData.hotHomestays || []).map((h) => (
                <div key={h.id} className="homestay-slider-item">
                  <div className="homestay-card">
                    <div className="card-img-wrapper">
                      <span className="card-top-tag tag-hot"><i className="bi bi-fire" /> {h.tag}</span>
                      <button
                        type="button"
                        className={`card-wishlist-btn ${isWishlisted(h.id, h.name) ? 'active' : ''}`}
                        onClick={(e) => toggleWishlist(h, e)}
                        title={isWishlisted(h.id, h.name) ? 'Bỏ yêu thích' : 'Lưu vào yêu thích'}
                      >
                        <i className={`bi ${isWishlisted(h.id, h.name) ? 'bi-heart-fill' : 'bi-heart'}`} />
                      </button>
                      <Link to={`/homestay/${h.id || 'doi'}`} state={{ homestay: h }} style={{ display: 'block', height: '100%' }}>
                        <img src={h.img || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80'} alt={h.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </Link>
                    </div>
                    <div className="card-body">
                      <div className="card-location-rating">
                        <span className="card-location"><i className="bi bi-geo-alt-fill text-success" /> {h.location}</span>
                        <span className="card-rating"><i className="bi bi-star-fill" /> {h.rating} ({h.reviews})</span>
                      </div>
                      <h3 className="card-title"><Link to={`/homestay/${h.id}`} state={{ homestay: h }}>{h.name}</Link></h3>
                      <div className="card-specs"><span>{h.specs}</span></div>
                      <div className="card-amenities-box">
                        <span className="amenities-label">Tiện nghi nổi bật:</span>
                        <p className="amenities-items">{formatAmenities(h.amenities)}</p>
                      </div>
                      <div className="card-footer-row">
                        <div>
                          <span className="price-label">Giá từ:</span>
                          <span className="card-price">{h.price}</span>
                        </div>
                        <Link to={`/homestay/${h.id}`} state={{ homestay: h }} className="btn-view-room">Xem homestay</Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="homestay-slider-arrow arrow-next"
              style={{
                position: 'absolute',
                top: '50%',
                right: '-20px',
                transform: 'translateY(-50%)',
                zIndex: 35,
                width: '44px',
                height: '52px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.75)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1.5px solid rgba(255, 255, 255, 0.85)',
                boxShadow: '0 6px 20px rgba(15, 23, 42, 0.14)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                color: '#1E293B',
                cursor: 'pointer',
                outline: 'none',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onClick={() => scrollSlider(hotSliderRef, 1)}
              aria-label="Xem homestay tiếp theo"
            >
              <i className="bi bi-chevron-right" />
            </button>
          </div>
        </div>
      </section>

      {/* 6. FAVORITES BY CITY */}
      <section className="favorites-section">
        <div className="hp-container">
          <span className="section-badge-top"><i className="bi bi-patch-check-fill" /> DU KHÁCH BÌNH CHỌN</span>
          <h2 className="section-title">Những homestay được yêu thích</h2>
          <p className="section-subtitle">Đánh giá thực tế từ hàng ngàn du khách đã trải nghiệm trọn vẹn sự tận tâm của chủ nhà</p>

          <div className="filter-tabs-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div className="city-filter-tabs">
              {[
                { key: 'all', label: 'Tất cả' },
                { key: 'dalat', label: 'Đà Lạt' },
                { key: 'danang', label: 'Đà Nẵng' },
                { key: 'hoian', label: 'Hội An' },
                { key: 'sapa', label: 'Sapa' },
                { key: 'ninhbinh', label: 'Ninh Bình' },
                { key: 'phuquoc', label: 'Phú Quốc' },
                { key: 'hanoi', label: 'Hà Nội' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={`city-tab ${favCityFilter === tab.key ? 'active' : ''}`}
                  onClick={() => {
                    setFavCityFilter(tab.key);
                    if (favSliderRef.current) favSliderRef.current.scrollLeft = 0;
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="slider-nav-controls">
              <button
                type="button"
                className="slider-nav-circle-btn"
                onClick={() => scrollSlider(favSliderRef, -1)}
                aria-label="Xem homestay trước"
                title="Lướt qua trái"
              >
                <i className="bi bi-chevron-left" />
              </button>
              <button
                type="button"
                className="slider-nav-circle-btn"
                onClick={() => scrollSlider(favSliderRef, 1)}
                aria-label="Xem homestay tiếp theo"
                title="Lướt qua phải"
              >
                <i className="bi bi-chevron-right" />
              </button>
            </div>
          </div>

          <div className="homestay-slider-wrap" style={{ position: 'relative', width: '100%' }}>
            <button
              type="button"
              className="homestay-slider-arrow arrow-prev"
              style={{
                position: 'absolute',
                top: '50%',
                left: '-20px',
                transform: 'translateY(-50%)',
                zIndex: 35,
                width: '44px',
                height: '52px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.75)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1.5px solid rgba(255, 255, 255, 0.85)',
                boxShadow: '0 6px 20px rgba(15, 23, 42, 0.14)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                color: '#1E293B',
                cursor: 'pointer',
                outline: 'none',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onClick={() => scrollSlider(favSliderRef, -1)}
              aria-label="Xem homestay trước"
            >
              <i className="bi bi-chevron-left" />
            </button>

            <div className="homestay-slider-track" ref={favSliderRef}>
              {(filteredFavorites || []).map((h) => (
                <div key={h.id} className="homestay-slider-item">
                  <div className="homestay-card">
                    <div className="card-img-wrapper">
                      <span className="card-top-tag tag-hot">
                        <i className="bi bi-fire" /> {h.tag || 'Top Bán Chạy'}
                      </span>
                      <button
                        type="button"
                        className={`card-wishlist-btn ${isWishlisted(h.id, h.name) ? 'active' : ''}`}
                        onClick={(e) => toggleWishlist(h, e)}
                        title={isWishlisted(h.id, h.name) ? 'Bỏ yêu thích' : 'Lưu vào yêu thích'}
                      >
                        <i className={`bi ${isWishlisted(h.id, h.name) ? 'bi-heart-fill' : 'bi-heart'}`} />
                      </button>
                      <Link to={`/homestay/${h.id || 'doi'}`} state={{ homestay: h }} style={{ display: 'block', height: '100%' }}>
                        <img src={h.img || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80'} alt={h.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </Link>
                    </div>
                    <div className="card-body">
                      <div className="card-location-rating">
                        <span className="card-location"><i className="bi bi-geo-alt-fill text-success" /> {h.location}</span>
                        <span className="card-rating"><i className="bi bi-star-fill" /> {h.rating} ({h.reviews})</span>
                      </div>
                      <h3 className="card-title"><Link to={`/homestay/${h.id}`} state={{ homestay: h }}>{h.name}</Link></h3>
                      <div className="card-specs"><span>{h.specs}</span></div>
                      <div className="card-amenities-box">
                        <span className="amenities-label">Tiện nghi nổi bật:</span>
                        <p className="amenities-items">{formatAmenities(h.amenities)}</p>
                      </div>
                      <div className="card-footer-row">
                        <div>
                          <span className="price-label">Giá từ:</span>
                          <span className="card-price">{h.price}</span>
                        </div>
                        <Link to={`/homestay/${h.id}`} state={{ homestay: h }} className="btn-view-room">Xem homestay</Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="homestay-slider-arrow arrow-next"
              style={{
                position: 'absolute',
                top: '50%',
                right: '-20px',
                transform: 'translateY(-50%)',
                zIndex: 35,
                width: '44px',
                height: '52px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.75)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1.5px solid rgba(255, 255, 255, 0.85)',
                boxShadow: '0 6px 20px rgba(15, 23, 42, 0.14)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                color: '#1E293B',
                cursor: 'pointer',
                outline: 'none',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onClick={() => scrollSlider(favSliderRef, 1)}
              aria-label="Xem homestay tiếp theo"
            >
              <i className="bi bi-chevron-right" />
            </button>
          </div>
        </div>
      </section>

      {/* Toast Notice */}
      <div className={`toast-notice ${toast.show ? 'show' : ''}`}>
        <i className="bi bi-check-circle-fill" />
        <span>{toast.msg}</span>
      </div>

      {/* Visual Search Modal */}
      <VisualSearchModal
        isOpen={isVisualSearchOpen}
        onClose={() => setIsVisualSearchOpen(false)}
      />
    </div>
  );
}
