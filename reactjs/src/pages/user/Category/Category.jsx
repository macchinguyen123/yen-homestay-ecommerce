import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useSearchParams, useNavigate, useParams } from 'react-router-dom';
import './Category.css';
import { homestayService } from '../../../services/homestayService';
import { wishlistService } from '../../../services/wishlistService';
import { authService } from '../../../services/authService';
import { TiltedGridHero } from '@/components/ui/tilted-grid-hero';

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
  { id: 'all', dbId: null, name: 'Tất cả danh mục', icon: 'bi-grid-fill' },
  { id: 'miet-vuan', dbId: 1, name: 'Miệt vườn', icon: 'bi-tree-fill', keyword: 'miệt vườn' },
  { id: 'nong-trai', dbId: 2, name: 'Nông trại', icon: 'bi-brightness-high-fill', keyword: 'nông trại' },
  { id: 'song-nuoc', dbId: 3, name: 'Sông nước', icon: 'bi-water', keyword: 'sông nước' },
  { id: 'nha-que', dbId: 4, name: 'Nhà quê truyền thống', icon: 'bi-house-heart-fill', keyword: 'nhà quê' },
  { id: 'am-thuc', dbId: 5, name: 'Ẩm thực quê', icon: 'bi-cup-hot-fill', keyword: 'ẩm thực' },
  { id: 'lang-nghe', dbId: 6, name: 'Làng nghề truyền thống', icon: 'bi-brush-fill', keyword: 'làng nghề' },
  { id: 'thien-nhien', dbId: 7, name: 'Thiên nhiên sinh thái', icon: 'bi-compass-fill', keyword: 'thiên nhiên' },
  { id: 'doi-song', dbId: 8, name: 'Trải nghiệm đời sống quê', icon: 'bi-basket-fill', keyword: 'đời sống' },
  { id: 'van-hoa', dbId: 9, name: 'Văn hóa địa phương', icon: 'bi-people-fill', keyword: 'văn hóa' },
  { id: 'kham-pha', dbId: 10, name: 'Khám phá làng quê', icon: 'bi-bicycle', keyword: 'khám phá' },
  { id: 'thu-gian', dbId: 11, name: 'Chậm thư giãn', icon: 'bi-cloud-sun-fill', keyword: 'thư giãn' },
  { id: 'ban-dia', dbId: 12, name: 'Ở cùng người bản địa', icon: 'bi-house-heart', keyword: 'bản địa' },
];

// Ảnh đại diện cho từng danh mục chiếu lên dải vòm 3D khi ở mục "Tất cả danh mục"
const ALL_CATEGORIES_HERO_IMAGES = [
  { src: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80', alt: 'Miệt vườn cây trái miền Tây' },
  { src: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=800&q=80', alt: 'Nông trại thảo nguyên sinh thái' },
  { src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', alt: 'Sông nước miền Tây hữu tình' },
  { src: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80', alt: 'Nhà quê truyền thống ba gian' },
  { src: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80', alt: 'Ẩm thực quê mộc mạc thơm ngon' },
  { src: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=800&q=80', alt: 'Làng nghề thủ công độc bản' },
  { src: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80', alt: 'Thiên nhiên sinh thái trong lành' },
  { src: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80', alt: 'Trải nghiệm đời sống quê dân dã' },
  { src: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80', alt: 'Nét đẹp văn hóa bản địa lâu đời' },
  { src: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80', alt: 'Khám phá làng quê thanh bình' },
  { src: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80', alt: 'Chậm rãi thư giãn ngắm cảnh' },
  { src: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80', alt: 'Ở cùng người bản địa mến khách' },
];

// Danh sách ~10 ảnh đặc trưng cho từng danh mục riêng biệt khi được chọn
const CATEGORY_SPECIFIC_IMAGES = {
  'miet-vuan': [
    { src: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80', alt: 'Vườn sầu riêng Cái Mơn trĩu quả' },
    { src: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=800&q=80', alt: 'Vườn chôm chôm Chợ Lách xum xuê' },
    { src: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80', alt: 'Vườn bưởi da xanh Bến Tre' },
    { src: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80', alt: 'Vườn dâu Phong Điền Cần Thơ' },
    { src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', alt: 'Miệt vườn sông nước Tiền Giang' },
    { src: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80', alt: 'Rặng dừa nước Bến Tre xanh ngát' },
    { src: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80', alt: 'Hiên nhà vườn ngập gió trong lành' },
    { src: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80', alt: 'Không gian nghỉ dưỡng miệt vườn thanh tịnh' },
    { src: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80', alt: 'Vườn cây sum suê trĩu hạt Cái Bè' },
    { src: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80', alt: 'Lối đi lát gạch quanh vườn hoa' },
  ],
  'nong-trai': [
    { src: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=800&q=80', alt: 'Nông trại rau hữu cơ Đà Lạt' },
    { src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', alt: 'Đồi chè Cầu Đất bát ngát nắng mai' },
    { src: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80', alt: 'Thảo nguyên bò sữa Mộc Châu' },
    { src: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80', alt: 'Vườn dâu tây trĩu quả chín mọng' },
    { src: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80', alt: 'Nông trại sinh thái Tam Đảo' },
    { src: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80', alt: 'Đồng cừu Phan Rang nắng ấm' },
    { src: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80', alt: 'Cánh đồng hoa oải hương thơ mộng' },
    { src: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80', alt: 'Nhà kính nông nghiệp công nghệ cao' },
    { src: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80', alt: 'Bungalow gỗ ấm cúng giữa cánh đồng' },
    { src: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80', alt: 'Bình minh rực rỡ trên trang trại xanh' },
  ],
  'song-nuoc': [
    { src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', alt: 'Chợ nổi Cái Răng Cần Thơ rộn rã' },
    { src: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80', alt: 'Chèo SUP hoàng hôn Đầm Chuồn Huế' },
    { src: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80', alt: 'Nhà sàn ven sông Hàn Đà Nẵng' },
    { src: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80', alt: 'Xuồng ba lá qua rừng tràm Trà Sư' },
    { src: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80', alt: 'Bến đò Tràng An non nước Ninh Bình' },
    { src: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80', alt: 'Ngắm bình minh êm đềm trên sông Hương' },
    { src: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=800&q=80', alt: 'Bungalow nổi mặt hồ Thác Bà' },
    { src: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80', alt: 'Làng chài Cửa Vạn bồng bềnh' },
    { src: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80', alt: 'Homestay ven bờ sông Tiền hiền hòa' },
    { src: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80', alt: 'Cầu khỉ bắc qua dòng kênh xanh mát' },
  ],
  'nha-que': [
    { src: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80', alt: 'Nhà ba gian Bắc Bộ ngói đỏ' },
    { src: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80', alt: 'Nhà sàn gỗ Pơ-mu Tây Bắc' },
    { src: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80', alt: 'Nhà cổ lợp ngói âm dương Nam Bộ' },
    { src: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=800&q=80', alt: 'Sân gạch đỏ rợp bóng cây xanh' },
    { src: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=800&q=80', alt: 'Gian bếp củi đượm khói lam chiều' },
    { src: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80', alt: 'Hiên nhà gỗ lim chạm khắc tinh tế' },
    { src: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80', alt: 'Cổng tre vào nhà quê mộc mạc' },
    { src: 'https://images.unsplash.com/photo-1507525428033-b723cf961d3e?auto=format&fit=crop&w=800&q=80', alt: 'Giàn mướp và ao sen trước ngõ' },
    { src: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80', alt: 'Bộ bàn ghế tre uống trà sớm' },
    { src: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80', alt: 'Phòng ngủ ấm cúng mùng vải trắng' },
  ],
  'am-thuc': [
    { src: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80', alt: 'Mâm cơm niêu cá kho tộ đậm đà' },
    { src: 'https://images.unsplash.com/photo-1516253593875-bd7ba052fbc5?auto=format&fit=crop&w=800&q=80', alt: 'Trà sen Cung đình Huế thơm ngát' },
    { src: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80', alt: 'Bánh xèo giòn rụm miền Tây' },
    { src: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80', alt: 'Rau rừng luộc chấm kho quẹt' },
    { src: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80', alt: 'Canh chua cá lóc bông điên điển' },
    { src: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80', alt: 'Thịt trâu gác bếp Tây Bắc' },
    { src: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80', alt: 'Bánh cuốn nóng tráng tay Cát Cát' },
    { src: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80', alt: 'Tiệc nướng BBQ khoai bắp đồi thông' },
    { src: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=800&q=80', alt: 'Chè hạt sen long nhãn ngọt mát' },
    { src: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=800&q=80', alt: 'Bữa sáng đậm đà hương vị đồng quê' },
  ],
  'lang-nghe': [
    { src: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=800&q=80', alt: 'Làng gốm Bát Tràng tráng men' },
    { src: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80', alt: 'Xoay gốm thủ công Thanh Hà' },
    { src: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80', alt: 'Khung cửi dệt thổ cẩm Tả Phìn' },
    { src: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80', alt: 'Làng nón lá Thủy Thanh xứ Huế' },
    { src: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=800&q=80', alt: 'Làng thêu ren Văn Lâm Ninh Bình' },
    { src: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80', alt: 'Đan lát mây tre đan Phú Vinh' },
    { src: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80', alt: 'Làng tranh dân gian Đông Hồ' },
    { src: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80', alt: 'Lò đúc đồng cổ truyền Ngũ Xã' },
    { src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', alt: 'Chạm khắc gỗ Kim Bồng Hội An' },
    { src: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80', alt: 'Làng làm hương Thủy Xuân rực rỡ' },
  ],
  'thien-nhien': [
    { src: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80', alt: 'Rừng thông Đà Lạt ngát hương' },
    { src: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80', alt: 'Ruộng bậc thang Mù Cang Chải' },
    { src: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=800&q=80', alt: 'Đỉnh núi Fansipan chạm mây' },
    { src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', alt: 'Hồ Tuyền Lâm xanh biếc' },
    { src: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80', alt: 'Rừng nguyên sinh Cúc Phương' },
    { src: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80', alt: 'Thác Bản Giốc trắng xóa' },
    { src: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80', alt: 'Hang động kỳ vĩ Phong Nha' },
    { src: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80', alt: 'Đồi cỏ hồng Lạc Dương' },
    { src: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80', alt: 'Vịnh Lan Hạ nước xanh ngọc' },
    { src: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80', alt: 'Hoàng hôn thung lũng Mai Châu' },
  ],
  'doi-song': [
    { src: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80', alt: 'Bắt cá mương tát gàu sòng' },
    { src: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80', alt: 'Gặt lúa mùa vàng ấm áp' },
    { src: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=800&q=80', alt: 'Cấy lúa cùng nông dân bản địa' },
    { src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', alt: 'Đi chợ phiên vùng cao sớm mai' },
    { src: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80', alt: 'Hái chè cùng đồng bào miền núi' },
    { src: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80', alt: 'Chăn thả bò sữa trên thảo nguyên' },
    { src: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=800&q=80', alt: 'Đan lưới vá chài ven sông' },
    { src: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80', alt: 'Nấu kẹo dừa thủ công Bến Tre' },
    { src: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80', alt: 'Gói bánh chưng xanh thơm nồng' },
    { src: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80', alt: 'Bữa cơm sum vầy gia đình bản địa' },
  ],
  'van-hoa': [
    { src: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80', alt: 'Lễ hội Cồng Chiêng Tây Nguyên' },
    { src: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80', alt: 'Đờn ca tài tử Nam Bộ trên sông' },
    { src: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=800&q=80', alt: 'Múa khèn Mông đón xuân sang' },
    { src: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80', alt: 'Hát bài chòi Hội An phố cổ' },
    { src: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80', alt: 'Lễ cấp sắc người Dao đỏ' },
    { src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', alt: 'Kiến trúc nhà Rông Kon Klor' },
    { src: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80', alt: 'Nhã nhạc cung đình Huế' },
    { src: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=800&q=80', alt: 'Trang phục thổ cẩm người Thái' },
    { src: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80', alt: 'Hát then đàn tính Tày Nùng' },
    { src: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80', alt: 'Lễ hội hoa ban Tây Bắc' },
  ],
  'kham-pha': [
    { src: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80', alt: 'Đạp xe xuyên rừng cao su' },
    { src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', alt: 'Trekking khám phá bản làng Sapa' },
    { src: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80', alt: 'Dạo bộ đường làng hoa mười giờ' },
    { src: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80', alt: 'Chinh phục cung đèo Mã Pí Lèng' },
    { src: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80', alt: 'Khám phá đồi chè Ô Long rực rỡ' },
    { src: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=800&q=80', alt: 'Thám hiểm thung lũng Nà Ka' },
    { src: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80', alt: 'Chèo kayak sông Son Quảng Bình' },
    { src: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80', alt: 'Đạp xe quanh hồ Tuyền Lâm' },
    { src: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80', alt: 'Cắm trại ngắm sao trời đỉnh đèo' },
    { src: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=800&q=80', alt: 'Lặn ngắm rạn san hô Cù Lao Chàm' },
  ],
  'thu-gian': [
    { src: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80', alt: 'Bồn tắm gỗ ngoài trời ngắm mây' },
    { src: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80', alt: 'Nằm võng đung đưa dưới bóng dừa' },
    { src: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80', alt: 'Đọc sách bên hiên ngập nắng vàng' },
    { src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', alt: 'Yoga đón bình minh thung lũng' },
    { src: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80', alt: 'Thưởng trà thảo mộc bên lò sưởi' },
    { src: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=800&q=80', alt: 'Bể bơi nước ấm view đồi thông' },
    { src: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80', alt: 'Nghe tiếng mưa rơi trên mái ngói' },
    { src: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80', alt: 'Liệu trình tắm lá thuốc thư giãn' },
    { src: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80', alt: 'Cà phê ban công sáng sớm mát lành' },
    { src: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80', alt: 'Ngắm hoàng hôn tím buông trên đồi' },
  ],
  'ban-dia': [
    { src: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80', alt: 'Chủ nhà đón khách thân thiện nồng hậu' },
    { src: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80', alt: 'Cùng nấu ăn bên bếp lửa gia đình' },
    { src: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=800&q=80', alt: 'Nghe kể chuyện tích xưa bản làng' },
    { src: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=800&q=80', alt: 'Uống rượu cần cùng gia chủ bản địa' },
    { src: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80', alt: 'Tham gia thu hoạch mùa cùng nông dân' },
    { src: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80', alt: 'Tập nói tiếng bản địa giao lưu vui vẻ' },
    { src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80', alt: 'Được hướng dẫn tham quan bí mật địa phương' },
    { src: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80', alt: 'Mặc thử trang phục truyền thống' },
    { src: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80', alt: 'Bữa cơm đãi khách thịnh tình' },
    { src: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80', alt: 'Món quà đặc sản tự làm tiễn biệt' },
  ],
};



// Hàm chuẩn hóa linh hoạt URL param thành Category Tab ID (hỗ trợ slug, id số, tên tiếng Việt)
export const resolveCategoryTab = (param) => {
  if (!param || param === 'all') return 'all';
  const foundById = CATEGORY_TABS.find(t => t.id === param);
  if (foundById) return foundById.id;

  const num = Number(param);
  if (!isNaN(num) && num > 0) {
    const foundByDbId = CATEGORY_TABS.find(t => t.dbId === num);
    if (foundByDbId) return foundByDbId.id;
  }

  const lower = String(param).toLowerCase().trim();
  const foundByName = CATEGORY_TABS.find(t => 
    t.name.toLowerCase().includes(lower) || 
    lower.includes(t.name.toLowerCase()) ||
    (t.keyword && lower.includes(t.keyword.toLowerCase()))
  );
  if (foundByName) return foundByName.id;

  return 'all';
};

const ITEMS_PER_PAGE = 16;

export default function Category() {
  const navigate = useNavigate();
  const { id: pathId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlCategoryParam = pathId || searchParams.get('cat') || searchParams.get('type') || 'all';

  // Filters State
  const [activeCategory, setActiveCategory] = useState(resolveCategoryTab(urlCategoryParam));
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [sortBy, setSortBy] = useState('rating-desc');
  const [currentPage, setCurrentPage] = useState(1);

  // Wishlist state (Đồng bộ trực tiếp với CSDL)
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUser());
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [toast, setToast] = useState({ show: false, msg: '' });

  // Tải danh sách yêu thích từ CSDL
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

  // Homestays data list from DB
  const [homestays, setHomestays] = useState([]);
  const [rawHomestays, setRawHomestays] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const targetCat = resolveCategoryTab(urlCategoryParam);
    setActiveCategory(targetCat);
    setCurrentPage(1);
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [urlCategoryParam]);

  useEffect(() => {
    let isMounted = true;
    const loadHomestays = async () => {
      setLoading(true);
      try {
        const [dbListResult, catResult] = await Promise.allSettled([
          homestayService.getAllHomestays(),
          fetch('http://localhost:8081/api/public/categories').then(r => r.json())
        ]);

        const dbList = dbListResult.status === 'fulfilled' && Array.isArray(dbListResult.value) ? dbListResult.value : [];
        const cats = catResult.status === 'fulfilled' && Array.isArray(catResult.value) ? catResult.value : [];

        if (isMounted) {
          if (dbList.length > 0) setRawHomestays(dbList);
          if (cats.length > 0) setDbCategories(cats);

          if (dbList.length > 0) {
            const catKeys = ['miet-vuan', 'nong-trai', 'song-nuoc', 'nha-que', 'am-thuc', 'lang-nghe', 'thien-nhien', 'doi-song', 'san-may', 'bien-dao', 'van-hoa', 'villa'];
            const mapped = dbList.map((h, i) => {
              const rawPrice = h.basePrice || h.pricePerNight || h.price || 1500000;
              const numPrice = Number(rawPrice);
              const imgUrl = (Array.isArray(h.images) && h.images.length > 0)
                ? (typeof h.images[0] === 'string' ? h.images[0] : h.images[0].imageUrl)
                : (h.thumbnail || h.primaryImage || h.image || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80');

              return {
                id: h.id || h.homestayId || (i + 1),
                categoryId: h.categoryId,
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
                img: imgUrl
              };
            });
            setHomestays(mapped);
          } else {
            setHomestays([]);
          }
        }
      } catch (err) {
        console.warn('Lỗi tải dữ liệu danh mục:', err);
        if (isMounted) setHomestays([]);
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
        triggerToast(`Đã bỏ "${name}" khỏi danh sách yêu thích.`);
      } else {
        triggerToast(`Đã thêm "${name}" vào danh sách yêu thích!`);
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
        const targetDbId = selectedTab?.dbId;
        const kw = (selectedTab?.keyword || activeCategory).toLowerCase();
        
        const isDbIdMatch = targetDbId && Number(item.categoryId) === Number(targetDbId);
        const catSlug = (item.category || '').toLowerCase();
        const isExactCat = catSlug === activeCategory || catSlug.includes(activeCategory);
        const targetStr = (catSlug + ' ' + item.name + ' ' + item.amenities + ' ' + item.location + ' ' + (item.tag || '')).toLowerCase();
        const isKwMatch = targetStr.includes(kw);

        if (!isDbIdMatch && !isExactCat && !isKwMatch) {
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

  const scrollToTop = () => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    } catch {
      window.scrollTo(0, 0);
    }
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
    if (document.scrollingElement) document.scrollingElement.scrollTop = 0;
  };

  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    scrollToTop();
    const timer = setTimeout(scrollToTop, 60);
    return () => clearTimeout(timer);
  }, [currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      scrollToTop();
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

  // Lấy ảnh động trên dải băng từ CSDL:
  // - Ở mục "Tất cả danh mục" (activeCategory === 'all'): Lấy ảnh đại diện của từng danh mục
  // - Ở từng danh mục (activeCategory !== 'all'): Lấy đúng 10 ảnh đại diện của các sản phẩm thuộc danh mục đó từ CSDL
  const heroImages = useMemo(() => {
    // 1. MỤC TẤT CẢ DANH MỤC -> Lấy ảnh danh mục
    if (activeCategory === 'all') {
      const categoryTabs = CATEGORY_TABS.filter(t => t.id !== 'all');
      const catImages = categoryTabs.map((tab, idx) => {
        // Tìm category trong dbCategories
        const dbCat = dbCategories.find(c => c.id === tab.dbId || c.name?.toLowerCase().includes(tab.name.toLowerCase()));
        if (dbCat && dbCat.imageUrl && dbCat.imageUrl.trim() !== '') {
          return {
            src: dbCat.imageUrl,
            alt: `Danh mục ${tab.name}`
          };
        }

        // Nếu bảng category chưa có imageUrl, lấy ảnh của homestay đầu tiên thuộc danh mục đó trong CSDL
        const firstProd = rawHomestays.find(h => Number(h.categoryId) === Number(tab.dbId));
        if (firstProd) {
          const imgSrc = firstProd.image || (Array.isArray(firstProd.images) && firstProd.images[0]);
          if (imgSrc) {
            return {
              src: imgSrc,
              alt: `Danh mục ${tab.name} - ${firstProd.name}`
            };
          }
        }

        // Fallback nếu CSDL đang tải
        return ALL_CATEGORIES_HERO_IMAGES[idx % ALL_CATEGORIES_HERO_IMAGES.length];
      });

      return catImages.filter(img => Boolean(img?.src));
    }

    // 2. TỪNG DANH MỤC CỤ THỂ -> Lấy 10 ảnh đại diện của các sản phẩm thuộc danh mục đó từ CSDL
    const currentTab = CATEGORY_TABS.find(t => t.id === activeCategory);
    const targetDbId = currentTab?.dbId;

    if (rawHomestays.length > 0) {
      // Lọc các homestay thuộc danh mục đó từ CSDL
      const matchedProducts = rawHomestays.filter(h => {
        if (targetDbId && Number(h.categoryId) === Number(targetDbId)) return true;
        const kw = (currentTab?.keyword || '').toLowerCase();
        const fullStr = `${h.name || ''} ${h.description || ''} ${h.categorySlug || ''}`.toLowerCase();
        return kw && fullStr.includes(kw);
      });

      if (matchedProducts.length > 0) {
        const productList = [];

        // Lấy ảnh đại diện chính của từng sản phẩm trong danh mục
        matchedProducts.forEach(p => {
          const mainImg = p.image || (Array.isArray(p.images) && p.images[0]);
          if (mainImg) {
            productList.push({
              src: mainImg,
              alt: p.name || `Homestay ${currentTab?.name}`
            });
          }
        });

        // Nếu danh mục có ít hơn 10 sản phẩm trong DB, lấy thêm ảnh trong bộ sưu tập (images) của các sản phẩm đó
        if (productList.length < 10) {
          for (const p of matchedProducts) {
            if (Array.isArray(p.images) && p.images.length > 1) {
              for (let imgIdx = 1; imgIdx < p.images.length; imgIdx++) {
                if (productList.length >= 10) break;
                if (p.images[imgIdx]) {
                  productList.push({
                    src: p.images[imgIdx],
                    alt: `${p.name} - Ảnh ${imgIdx + 1}`
                  });
                }
              }
            }
            if (productList.length >= 10) break;
          }
        }

        // Nếu vẫn chưa đủ 10 ảnh, lặp xoay vòng để đủ đúng 10 ảnh đại diện sản phẩm
        let loopCount = 0;
        while (productList.length < 10 && productList.length > 0) {
          productList.push({ ...productList[loopCount % productList.length] });
          loopCount++;
        }

        if (productList.length > 0) {
          return productList.slice(0, 10);
        }
      }
    }

    // Fallback ảnh danh mục cụ thể nếu chưa load xong CSDL
    return (CATEGORY_SPECIFIC_IMAGES[activeCategory] || ALL_CATEGORIES_HERO_IMAGES).slice(0, 10);
  }, [activeCategory, rawHomestays, dbCategories]);

  return (
    <div className="category-page-wrapper">
      {/* 1. HERO HEADER 3D TILTED CYLINDRICAL GRID */}
      <section className="cat-hero-banner">
        <TiltedGridHero
          key={activeCategory}
          images={heroImages}
          className="cat-tilted-hero-container"
          speed={28}
          gap={16}
          fade={14}
        >
          <div className="cat-hero-overlay">
            <div className="cat-hero-header-block">
              <span className="cat-hero-badge">
                <i className={`bi ${currentTabInfo.icon}`} /> Trải nghiệm nghỉ dưỡng độc bản
              </span>
              <h1 className="cat-hero-title">
                Danh Mục Homestay {currentTabInfo.id !== 'all' ? `· ${currentTabInfo.name}` : ''}
              </h1>
              <p className="cat-hero-subtitle">
                {currentTabInfo.id === 'all'
                  ? 'Hơn +100 căn homestay miệt vườn, nông trại, sông nước chuẩn phong cách bản địa Việt Nam.'
                  : `Khám phá không gian homestay ${currentTabInfo.name} mộc mạc, đậm chất bản địa.`}
              </p>
            </div>

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
        </TiltedGridHero>
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
                        className={`card-wishlist-btn ${isWishlisted(h.id, h.name) ? 'active' : ''}`}
                        onClick={(e) => toggleWishlist(h, e)}
                        title={isWishlisted(h.id, h.name) ? 'Bỏ yêu thích' : 'Yêu thích'}
                      >
                        <i className={`bi ${isWishlisted(h.id, h.name) ? 'bi-heart-fill' : 'bi-heart'}`} />
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
