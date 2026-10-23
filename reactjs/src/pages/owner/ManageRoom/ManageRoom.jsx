import React, { useState, useEffect, useMemo } from 'react';
import './ManageRoom.css';
import { initialRoomsData } from './manageRoomData';
import { authService } from '../../../services/authService';

// Hàm chuẩn hóa loại bỏ dấu tiếng Việt để tìm kiếm phòng thông minh
function removeVietnameseTones(str) {
  if (!str) return '';
  let s = String(str).normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  s = s.replace(/đ/g, 'd').replace(/Đ/g, 'd');
  return s.toLowerCase().trim();
}

// Bộ sưu tập ảnh phòng homestay chất lượng cao, đa dạng phong cách (không bao giờ trùng lặp)
export const FALLBACK_ROOM_IMAGES = [
  'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80'
];

export function getRoomFallbackImage(id, type, name) {
  if (type) {
    const t = String(type).toUpperCase();
    if (t.includes('FAMILY') || t.includes('GIA ĐÌNH')) {
      return 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80';
    }
    if (t.includes('VILLA') || t.includes('PENTHOUSE')) {
      return 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80';
    }
    if (t.includes('BUNGALOW')) {
      return 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=1200&q=80';
    }
    if (t.includes('DORM') || t.includes('TẬP THỂ') || t.includes('NHÀ SÀN')) {
      return 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80';
    }
    if (t.includes('MOUNTAIN') || t.includes('NÚI')) {
      return 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80';
    }
  }
  let hash = 0;
  const str = String(id || name || 'room_default');
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % FALLBACK_ROOM_IMAGES.length;
  return FALLBACK_ROOM_IMAGES[idx];
}

export default function ManageRoom() {
  const [roomsList, setRoomsList] = useState([]);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'timeline' | 'both'
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'occupied' | 'available' | 'maintenance'
  const [searchQuery, setSearchQuery] = useState('');
  const [roomTypeFilter, setRoomTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('default'); // 'default' | 'price-asc' | 'price-desc' | 'name-asc' | 'code-asc'
  const [timeFilter, setTimeFilter] = useState('all'); // 'all' | '1week' | '1month' | '1year'
  const [loading, setLoading] = useState(false);

  const [activeHomestayId, setActiveHomestayId] = useState(localStorage.getItem('ownerActiveHomestayId') || 'all');
  const [homestaysList, setHomestaysList] = useState([]);

  // Danh sách các loại phòng động có trong hệ thống
  const availableRoomTypes = useMemo(() => {
    const set = new Set();
    roomsList.forEach(r => {
      if (r.type) set.add(r.type);
    });
    return Array.from(set);
  }, [roomsList]);

  const currentHomestayName = useMemo(() => {
    if (!activeHomestayId || activeHomestayId === 'all') return 'Tất cả cơ sở Homestay';
    const found = homestaysList.find(h => String(h.id) === String(activeHomestayId));
    return found ? found.name : 'Tất cả cơ sở Homestay';
  }, [homestaysList, activeHomestayId]);

  // Fetch real rooms from backend DB & sync with Active Homestay selection
  React.useEffect(() => {
    fetchRealRooms();

    const handleSync = () => {
      setActiveHomestayId(localStorage.getItem('ownerActiveHomestayId'));
    };
    window.addEventListener('ownerActiveHomestayChanged', handleSync);
    return () => window.removeEventListener('ownerActiveHomestayChanged', handleSync);
  }, []);

  const fetchRealRooms = async () => {
    setLoading(true);
    try {
      const user = authService.getCurrentUser();
      const ownerId = user?.id || 1;
      const token = localStorage.getItem('token');
      let homestayMap = {};

      let hsRes = await fetch(`http://localhost:8081/api/admin/homestays?ownerId=${ownerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!hsRes.ok) {
        hsRes = await fetch(`http://localhost:8081/api/public/admin/homestays?ownerId=${ownerId}`);
      }
      if (hsRes.ok) {
        const hsData = await hsRes.json();
        if (Array.isArray(hsData)) {
          setHomestaysList(hsData);
          hsData.forEach(h => {
            homestayMap[h.id] = h.name;
          });
        }
      }

      let roomRes = await fetch(`http://localhost:8081/api/admin/rooms?ownerId=${ownerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!roomRes.ok) {
        roomRes = await fetch(`http://localhost:8081/api/public/admin/rooms?ownerId=${ownerId}`);
      }
      if (roomRes.ok) {
        const roomsData = await roomRes.json();
        if (Array.isArray(roomsData) && roomsData.length > 0) {
          const mappedRooms = roomsData.map(r => {
            const hsName = homestayMap[r.homestayId] || 'Homestay';
            const rName = r.roomName || r.name || `Phòng ${r.id}`;
            const rCode = r.code || r.roomCode || `P.${r.id}`;
            const rImg = r.image || r.thumb || r.primaryImage || (Array.isArray(r.images) && r.images.length > 0 ? r.images[0] : null) || getRoomFallbackImage(r.id, r.roomType || r.type, rName);
            return {
              id: r.id,
              homestayId: r.homestayId || 1,
              homestayName: hsName,
              code: rCode,
              name: rName,
              fullName: `${rName} (${hsName})`,
              type: r.roomType || 'Garden View',
              capacity: r.capacity || 2,
              capacityLabel: `${r.capacity || 2} khách`,
              bed: r.bedCount ? `${r.bedCount} Giường đôi` : '1 Giường King',
              floor: 'Tầng 1',
              price: r.pricePerNight ? Number(r.pricePerNight) : (r.price ? Number(r.price) : 850000),
              status: (r.status || 'AVAILABLE').toLowerCase() === 'available' ? 'available' : ((r.status || '').toLowerCase() === 'occupied' ? 'occupied' : ((r.status || '').toLowerCase() === 'maintenance' ? 'maintenance' : 'available')),
              description: r.description || `Không gian nghỉ dưỡng tại ${hsName}`,
              amenities: r.amenities || ['Wifi', 'Điều hòa Inverter', 'Phòng tắm riêng'],
              image: rImg,
              images: r.images && r.images.length > 0 ? r.images : [rImg],
              stay: 'Phòng sạch sẽ sẵn sàng đón khách',
              createdAt: r.createdAt || r.createdDate || new Date(Date.now() - (r.id % 8 * 8 + 2) * 86400000).toISOString()
            };
          });
          setRoomsList(mappedRooms);
          return;
        } else if (Array.isArray(roomsData) && roomsData.length === 0 && initialRoomsData?.rooms?.length > 0) {
          setRoomsList(initialRoomsData.rooms);
          return;
        }
      }
      setRoomsList(initialRoomsData?.rooms || []);
    } catch (err) {
      console.error('Lỗi nạp phòng từ CSDL:', err);
      setRoomsList(initialRoomsData?.rooms || []);
    } finally {
      setLoading(false);
    }
  };

  // Trạng thái các Modals
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isBulkPriceModalOpen, setIsBulkPriceModalOpen] = useState(false);

  // Form state cho Thêm / Chỉnh sửa phòng
  const [roomFormData, setRoomFormData] = useState({
    code: '',
    name: '',
    homestayId: 1,
    type: 'Garden View',
    capacity: 2,
    bed: '',
    floor: 'Tầng 1',
    price: 800000,
    status: 'available',
    description: '',
    amenities: 'Wifi, Điều hòa, Bồn tắm',
    image: ''
  });

  // Bulk Price Form State
  const [bulkMode, setBulkMode] = useState('percent-up');
  const [bulkValue, setBulkValue] = useState(10);
  const [bulkSelectedRooms, setBulkSelectedRooms] = useState(
    initialRoomsData.rooms.map((r) => r.code)
  );

  // Toast
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Format tiền tệ
  const formatMoney = (val) => Number(val).toLocaleString('vi-VN') + '₫';

  // Thống kê động
  const stats = useMemo(() => {
    const total = roomsList.length;
    const occupied = roomsList.filter((r) => r.status === 'occupied').length;
    const booked = roomsList.filter((r) => r.status === 'booked').length;
    const available = roomsList.filter((r) => r.status === 'available').length;
    const maintenance = roomsList.filter((r) => r.status === 'maintenance').length;
    return { total, occupied, booked, available, maintenance };
  }, [roomsList]);

  // Lọc & Sắp xếp phòng theo Active Homestay, Tab, Tìm kiếm và Thứ tự sắp xếp
  const filteredRooms = useMemo(() => {
    let result = roomsList.filter((r) => {
      // 1. Lọc theo Cơ sở Homestay đang được chọn
      if (activeHomestayId && activeHomestayId !== 'all' && r.homestayId && String(r.homestayId) !== String(activeHomestayId)) {
        return false;
      }

      // 1.5. Lọc theo Loại phòng
      if (roomTypeFilter !== 'all' && r.type !== roomTypeFilter) {
        return false;
      }

      // 1.8. Lọc theo Thời gian (Tất cả, 1 tuần, 1 tháng, 1 năm)
      const matchTime = (() => {
        if (timeFilter === 'all') return true;
        const daysDiff = (Date.now() - new Date(r.createdAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24);
        if (timeFilter === '1week') return daysDiff <= 7;
        if (timeFilter === '1month') return daysDiff <= 30;
        if (timeFilter === '1year') return daysDiff <= 365;
        return true;
      })();
      if (!matchTime) return false;

      // 2. Tab filter trạng thái phòng
      if (activeTab === 'occupied' && r.status !== 'occupied') return false;
      if (activeTab === 'booked' && r.status !== 'booked') return false;
      if (activeTab === 'available' && r.status !== 'available') return false;
      if (activeTab === 'maintenance' && r.status !== 'maintenance') return false;

      // 3. Khi đang gõ từ khóa tìm kiếm: lọc theo từ khóa
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const qNoTone = removeVietnameseTones(q);

        const codeNoTone = removeVietnameseTones(r.code);
        const nameNoTone = removeVietnameseTones(r.name);
        const fullNameNoTone = removeVietnameseTones(r.fullName);
        const typeNoTone = removeVietnameseTones(r.type);
        const guestNoTone = removeVietnameseTones(r.guest);
        const homestayNameNoTone = removeVietnameseTones(r.homestayName);
        const descNoTone = removeVietnameseTones(r.description);
        const idStr = String(r.id || '');
        const priceStr = String(r.price || '');

        const matchCode = codeNoTone.includes(qNoTone) || (r.code || '').toLowerCase().includes(q);
        const matchName = nameNoTone.includes(qNoTone) || (r.name || '').toLowerCase().includes(q);
        const matchFullName = fullNameNoTone.includes(qNoTone) || (r.fullName || '').toLowerCase().includes(q);
        const matchType = typeNoTone.includes(qNoTone) || (r.type || '').toLowerCase().includes(q);
        const matchGuest = guestNoTone.includes(qNoTone) || (r.guest || '').toLowerCase().includes(q);
        const matchHomestayName = homestayNameNoTone.includes(qNoTone) || (r.homestayName || '').toLowerCase().includes(q);
        const matchDescription = descNoTone.includes(qNoTone) || (r.description || '').toLowerCase().includes(q);
        const matchId = idStr.includes(q);
        const matchPrice = priceStr.includes(q);

        return matchCode || matchName || matchFullName || matchType || matchGuest || matchHomestayName || matchDescription || matchId || matchPrice;
      }

      return true;
    });

    // 4. Sắp xếp danh sách phòng
    let sorted = [...result];
    if (sortBy === 'price-asc') {
      sorted.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (sortBy === 'price-desc') {
      sorted.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    } else if (sortBy === 'name-asc') {
      sorted.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'vi'));
    } else if (sortBy === 'code-asc') {
      sorted.sort((a, b) => (a.code || '').localeCompare(b.code || '', 'vi'));
    }

    return sorted;
  }, [roomsList, activeTab, searchQuery, activeHomestayId, roomTypeFilter, sortBy, timeFilter]);

  // Phân trang 6 phòng mỗi trang (2 hàng ngang x 3 phòng)
  const ROOMS_PER_PAGE = 6;
  const [currentPage, setCurrentPage] = useState(1);

  // Tự động về trang 1 khi từ khóa tìm kiếm, tab, homestay, loại phòng hoặc tiêu chí sắp xếp thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab, activeHomestayId, roomTypeFilter, sortBy, timeFilter]);

  const totalPages = Math.ceil(filteredRooms.length / ROOMS_PER_PAGE) || 1;

  const paginatedRooms = useMemo(() => {
    const start = (currentPage - 1) * ROOMS_PER_PAGE;
    return filteredRooms.slice(start, start + ROOMS_PER_PAGE);
  }, [filteredRooms, currentPage]);

  // Thuật toán hiển thị dải số trang thông minh (Smart Page Windowing) tránh vỡ layout khi có nhiều trang
  const renderPageNumbers = () => {
    const pages = [];
    const maxButtons = 5;

    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          type="button"
          className={`room-page-btn ${currentPage === 1 ? 'active' : ''}`}
          onClick={() => {
            setCurrentPage(1);
            window.scrollTo({ top: 300, behavior: 'smooth' });
          }}
        >
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(
          <span key="dots-1" className="room-page-dots" style={{ color: '#94a3b8', padding: '0 4px', fontSize: '13px' }}>...</span>
        );
      }
    }

    for (let p = startPage; p <= endPage; p++) {
      pages.push(
        <button
          key={p}
          type="button"
          className={`room-page-btn ${currentPage === p ? 'active' : ''}`}
          onClick={() => {
            setCurrentPage(p);
            window.scrollTo({ top: 300, behavior: 'smooth' });
          }}
        >
          {p}
        </button>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <span key="dots-2" className="room-page-dots" style={{ color: '#94a3b8', padding: '0 4px', fontSize: '13px' }}>...</span>
        );
      }
      pages.push(
        <button
          key={totalPages}
          type="button"
          className={`room-page-btn ${currentPage === totalPages ? 'active' : ''}`}
          onClick={() => {
            setCurrentPage(totalPages);
            window.scrollTo({ top: 300, behavior: 'smooth' });
          }}
        >
          {totalPages}
        </button>
      );
    }

    return pages;
  };

  // Tạo dải Lịch Timeline 7 ngày động từ danh sách phòng CSDL Neon thực tế
  const dynamicTimelineRows = useMemo(() => {
    if (filteredRooms.length === 0) return [];
    return filteredRooms.map((room) => {
      let segments = [];
      if (room.status === 'occupied') {
        segments = [
          { span: 3, status: 'occupied', label: room.guest ? `Khách: ${room.guest}` : 'Đang có khách lưu trú' },
          { span: 4, status: 'available', label: 'Sẵn sàng đón lượt tiếp theo' }
        ];
      } else if (room.status === 'booked') {
        segments = [
          { span: 2, status: 'booked', label: room.guest ? `Đã cọc: ${room.guest}` : 'Đã đặt - Chờ nhận phòng' },
          { span: 5, status: 'available', label: 'Lịch còn trống' }
        ];
      } else if (room.status === 'maintenance') {
        segments = [
          { span: 2, status: 'maintenance', label: 'Bảo trì / Dọn buồng' },
          { span: 5, status: 'available', label: 'Mở bán lại sau bảo trì' }
        ];
      } else {
        segments = [
          { span: 7, status: 'available', label: 'Phòng trống 100% sẵn sàng đón khách' }
        ];
      }
      return {
        roomCode: room.code,
        roomShortName: `${room.code} - ${room.name}`,
        segments
      };
    });
  }, [filteredRooms]);

  // Hành động mở modal chi tiết
  const handleOpenDetail = (room) => {
    setSelectedRoom(room);
    setIsDetailModalOpen(true);
  };

  // Hành động mở modal Thêm mới phòng
  const handleOpenAddRoom = () => {
    const currentHsId = (activeHomestayId && activeHomestayId !== 'all')
      ? activeHomestayId
      : (homestaysList[0]?.id || 1);
    const fallbackNewImg = getRoomFallbackImage(Date.now(), 'Garden View', `Phòng ${roomsList.length + 1}`);
    setRoomFormData({
      code: `P.${100 + roomsList.length + 1}`,
      name: '',
      homestayId: Number(currentHsId),
      type: 'Garden View',
      capacity: 2,
      bed: 'Giường King 1m8',
      floor: 'Tầng 1',
      price: 900000,
      status: 'available',
      description: '',
      amenities: 'Wifi, Điều hòa Inverter, Ban công',
      image: fallbackNewImg
    });
    setSelectedRoom(null);
    setIsEditModalOpen(true);
  };

  // Mở modal Chỉnh sửa phòng
  const handleOpenEditRoom = (room) => {
    setSelectedRoom(room);
    setRoomFormData({
      code: room.code,
      name: room.name,
      homestayId: room.homestayId || 1,
      type: room.type,
      capacity: room.capacity,
      bed: room.bed,
      floor: room.floor,
      price: room.price,
      status: room.status,
      description: room.description,
      amenities: Array.isArray(room.amenities) ? room.amenities.join(', ') : room.amenities,
      image: room.image || ''
    });
    setIsEditModalOpen(true);
  };

  // Lưu thông tin phòng (Thêm mới hoặc Cập nhật)
  const handleSaveRoom = async (e) => {
    e.preventDefault();
    const amenitiesArr = roomFormData.amenities
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    const token = localStorage.getItem('token');
    const targetHomestayId = Number(roomFormData.homestayId) || (activeHomestayId ? Number(activeHomestayId) : 1);

    if (selectedRoom) {
      const updatedImg = roomFormData.image || selectedRoom.image || getRoomFallbackImage(selectedRoom.id, roomFormData.type, roomFormData.name);
      // Cập nhật local
      setRoomsList((prev) =>
        prev.map((r) =>
          r.code === selectedRoom.code
            ? {
                ...r,
                ...roomFormData,
                image: updatedImg,
                homestayId: targetHomestayId,
                amenities: amenitiesArr
              }
            : r
        )
      );

      // Async DB Update
      if (selectedRoom.id) {
        try {
          const payload = {
            homestayId: targetHomestayId,
            name: roomFormData.name,
            type: roomFormData.type,
            capacity: Number(roomFormData.capacity),
            price: Number(roomFormData.price),
            status: roomFormData.status,
            image: updatedImg
          };
          let res = await fetch(`http://localhost:8081/api/admin/rooms/${selectedRoom.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
          });
          if (!res.ok) {
            await fetch(`http://localhost:8081/api/public/admin/rooms/${selectedRoom.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            });
          }
        } catch (err) {
          console.error('Lỗi cập nhật phòng Neon CSDL:', err);
        }
      }
      showToast(`Đã cập nhật phòng ${roomFormData.code} thành công!`);
    } else {
      // Async DB Create
      try {
        const chosenImage = roomFormData.image || getRoomFallbackImage(Date.now(), roomFormData.type, roomFormData.name);
        const payload = {
          homestayId: targetHomestayId,
          name: roomFormData.name,
          code: roomFormData.code,
          type: roomFormData.type,
          capacity: Number(roomFormData.capacity),
          price: Number(roomFormData.price),
          status: 'AVAILABLE',
          image: chosenImage
        };

        let createdData = null;
        let res = await fetch('http://localhost:8081/api/admin/rooms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          createdData = await res.json();
        } else {
          let res2 = await fetch('http://localhost:8081/api/public/admin/rooms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (res2.ok) {
            createdData = await res2.json();
          }
        }

        const newId = createdData?.id || Date.now();
        const targetHsObj = homestaysList.find(h => String(h.id) === String(targetHomestayId));
        const targetHsName = targetHsObj ? targetHsObj.name : 'Homestay';

        const newRoomObj = {
          id: newId,
          homestayId: targetHomestayId,
          homestayName: targetHsName,
          code: roomFormData.code || `P.${newId}`,
          name: roomFormData.name,
          fullName: `${roomFormData.name} (${targetHsName})`,
          type: roomFormData.type,
          capacity: Number(roomFormData.capacity),
          capacityLabel: `${roomFormData.capacity} khách`,
          bed: roomFormData.bed || '1 Giường King',
          floor: roomFormData.floor || 'Tầng 1',
          price: Number(roomFormData.price),
          status: 'available',
          description: roomFormData.description,
          amenities: amenitiesArr,
          image: chosenImage,
          images: [chosenImage],
          stay: 'Phòng mới sẵn sàng đón khách'
        };

        // Chuyển active homestay về tất cả & reset tìm kiếm/tab/trang
        setActiveHomestayId('all');
        localStorage.setItem('ownerActiveHomestayId', 'all');
        window.dispatchEvent(new Event('ownerActiveHomestayChanged'));

        setRoomsList(prev => [newRoomObj, ...prev]);
        setActiveTab('all');
        setSearchQuery('');
        setCurrentPage(1);

        setTimeout(() => fetchRealRooms(), 400);
      } catch (err) {
        console.error('Lỗi tạo phòng mới trong Neon CSDL:', err);
      }
      showToast(`🎉 Đã khởi tạo thành công phòng ${roomFormData.name} vào Neon CSDL!`);
    }
    setIsEditModalOpen(false);
  };

  // Check-out nhanh
  const handleConfirmCheckout = async (room) => {
    setRoomsList((prev) =>
      prev.map((r) =>
        r.code === room.code
          ? {
              ...r,
              status: 'maintenance',
              guest: '',
              stay: 'Đang dọn phòng & thay ga giường sau check-out'
            }
          : r
      )
    );
    if (room && room.id) {
      try {
        await fetch(`http://localhost:8081/api/public/admin/rooms/${room.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'MAINTENANCE' })
        });
      } catch (err) {
        console.error('Lỗi cập nhật trạng thái phòng:', err);
      }
    }
    setIsCheckoutModalOpen(false);
    showToast(`Đã check-out phòng ${room.code}. Phòng chuyển sang Dọn dẹp/Bảo trì.`);
  };

  // Check-in nhanh
  const handleDirectCheckin = async (room) => {
    setRoomsList((prev) =>
      prev.map((r) =>
        r.code === room.code
          ? {
              ...r,
              status: 'occupied',
              stay: `${r.stay.split('(')[0]} (Đã nhận phòng)`
            }
          : r
      )
    );
    if (room && room.id) {
      try {
        await fetch(`http://localhost:8081/api/public/admin/rooms/${room.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'OCCUPIED' })
        });
      } catch (err) {
        console.error('Lỗi check-in phòng:', err);
      }
    }
    showToast(`Đã nhận phòng (Check-in) thành công cho phòng ${room.code}!`);
  };

  // Xác nhận chặn ngày phòng
  const handleConfirmBlock = async (room) => {
    setRoomsList((prev) =>
      prev.map((r) =>
        r.code === room.code
          ? {
              ...r,
              status: 'maintenance',
              stay: 'Tạm khóa phòng để bảo trì thiết bị'
            }
          : r
      )
    );
    if (room && room.id) {
      try {
        await fetch(`http://localhost:8081/api/public/admin/rooms/${room.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'MAINTENANCE' })
        });
      } catch (err) {
        console.error('Lỗi chặn phòng:', err);
      }
    }
    setIsBlockModalOpen(false);
    showToast(`Đã khóa phòng ${room.code} trong khoảng ngày đã chọn.`);
  };

  // Cập nhật giá hàng loạt
  const handleApplyBulkPrice = (e) => {
    e.preventDefault();
    if (bulkSelectedRooms.length === 0) {
      showToast('⚠️ Vui lòng chọn ít nhất 1 phòng!');
      return;
    }

    setRoomsList((prev) =>
      prev.map((r) => {
        if (!bulkSelectedRooms.includes(r.code)) return r;
        let newPrice = r.price;
        const val = Number(bulkValue) || 0;
        if (bulkMode === 'percent-up') newPrice = r.price * (1 + val / 100);
        else if (bulkMode === 'percent-down') newPrice = r.price * (1 - val / 100);
        else if (bulkMode === 'amount-up') newPrice = r.price + val;
        else if (bulkMode === 'amount-down') newPrice = Math.max(0, r.price - val);
        else if (bulkMode === 'fixed') newPrice = val;

        return {
          ...r,
          price: Math.round(newPrice / 1000) * 1000
        };
      })
    );

    setIsBulkPriceModalOpen(false);
    showToast(`Đã cập nhật giá mới cho ${bulkSelectedRooms.length} phòng!`);
  };

  const isAllSelected = useMemo(() => {
    return filteredRooms.length > 0 && bulkSelectedRooms.length === filteredRooms.length;
  }, [filteredRooms, bulkSelectedRooms]);

  const isNoneSelected = useMemo(() => {
    return bulkSelectedRooms.length === 0;
  }, [bulkSelectedRooms]);

  const availableCodes = useMemo(() => {
    return filteredRooms.filter(r => r.status === 'available').map(r => r.code);
  }, [filteredRooms]);

  const isOnlyAvailableSelected = useMemo(() => {
    return availableCodes.length > 0 &&
      bulkSelectedRooms.length === availableCodes.length &&
      availableCodes.every(code => bulkSelectedRooms.includes(code));
  }, [availableCodes, bulkSelectedRooms]);

  return (
    <div className="manage-room-container">
      {/* Banner & Action Toolbar */}
      <div className="room-header-banner">
        <div className="room-banner-glow" />
        <div className="room-banner-info">
          <div className="room-banner-badge">
            <span className="material-symbols-outlined text-[15px]">cottage</span>
            {currentHomestayName}
          </div>
          <h1 className="room-banner-title">Quản lý phòng &amp; Tình trạng phòng</h1>
        </div>

        <div className="room-banner-actions">
          {/* Mode Toggle */}
          <div className="view-mode-toggle">
            <button
              type="button"
              className={`view-mode-btn ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => setViewMode('cards')}
            >
              <span className="material-symbols-outlined text-[17px]">grid_view</span>
              Dạng thẻ
            </button>
            <button
              type="button"
              className={`view-mode-btn ${viewMode === 'timeline' ? 'active' : ''}`}
              onClick={() => setViewMode('timeline')}
            >
              <span className="material-symbols-outlined text-[17px]">calendar_view_week</span>
              Lịch Timeline
            </button>
            <button
              type="button"
              className={`view-mode-btn ${viewMode === 'both' ? 'active' : ''}`}
              onClick={() => setViewMode('both')}
            >
              <span className="material-symbols-outlined text-[17px]">dashboard</span>
              Hiển thị cả 2
            </button>
          </div>

          <button
            type="button"
            className="btn-bulk-price"
            onClick={() => setIsBulkPriceModalOpen(true)}
          >
            <span className="material-symbols-outlined text-[17px] text-emerald-700">tune</span>
            Cập nhật giá hàng loạt
          </button>

          <button type="button" className="btn-add-room-primary" onClick={handleOpenAddRoom}>
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            Thêm phòng mới
          </button>
        </div>
      </div>

      {/* 4 Thẻ Thống Kê Nhanh (Key Metrics) - Bấm trực tiếp vào thẻ để lọc trạng thái */}
      <div className="room-stats-grid">
        <div
          className={`room-stat-card clickable ${activeTab === 'all' ? 'active-filter' : ''}`}
          onClick={() => setActiveTab('all')}
          title="Bấm để xem tất cả phòng"
        >
          <div className="room-stat-icon slate">
            <span className="material-symbols-outlined">apartment</span>
          </div>
          <div className="room-stat-content">
            <div className="room-stat-header-row">
              <span className="room-stat-label">Tổng số phòng</span>
              {activeTab === 'all' && <span className="stat-active-badge">Đang xem</span>}
            </div>
            <div className="room-stat-num">
              {stats.total}
              <span className="room-stat-unit">phòng</span>
            </div>
            <span className="room-stat-sub">Sức chứa tối đa: {initialRoomsData.propertyInfo.maxCapacity} khách</span>
          </div>
        </div>

        <div
          className={`room-stat-card clickable ${activeTab === 'occupied' ? 'active-filter' : ''}`}
          onClick={() => setActiveTab(activeTab === 'occupied' ? 'all' : 'occupied')}
          title="Bấm để lọc phòng đang đón khách"
        >
          <div className="room-stat-icon emerald">
            <span className="material-symbols-outlined">hotel</span>
          </div>
          <div className="room-stat-content">
            <div className="room-stat-header-row">
              <span className="room-stat-label">Đang đón khách</span>
              {activeTab === 'occupied' && <span className="stat-active-badge">Đang lọc</span>}
            </div>
            <div className="room-stat-num text-emerald-800">
              {stats.occupied}/{stats.total}
              <span className="room-stat-unit">phòng</span>
            </div>
            <span className="room-stat-sub">Tỷ lệ lấp đầy: {stats.total ? Math.round((stats.occupied / stats.total) * 100) : 0}%</span>
          </div>
        </div>

        <div
          className={`room-stat-card clickable ${activeTab === 'booked' ? 'active-filter' : ''}`}
          onClick={() => setActiveTab(activeTab === 'booked' ? 'all' : 'booked')}
          title="Bấm để lọc phòng đã đặt / chờ check-in"
        >
          <div className="room-stat-icon amber">
            <span className="material-symbols-outlined">key</span>
          </div>
          <div className="room-stat-content">
            <div className="room-stat-header-row">
              <span className="room-stat-label">Đã đặt / Chờ check-in</span>
              {activeTab === 'booked' && <span className="stat-active-badge">Đang lọc</span>}
            </div>
            <div className="room-stat-num text-amber-800">
              {stats.booked}
              <span className="room-stat-unit">phòng</span>
            </div>
            <span className="room-stat-sub">Check-in hôm nay: 2 lượt</span>
          </div>
        </div>

        <div
          className={`room-stat-card clickable ${activeTab === 'maintenance' ? 'active-filter' : ''}`}
          onClick={() => setActiveTab(activeTab === 'maintenance' ? 'all' : 'maintenance')}
          title="Bấm để lọc phòng bảo trì & dọn buồng"
        >
          <div className="room-stat-icon red">
            <span className="material-symbols-outlined">cleaning_services</span>
          </div>
          <div className="room-stat-content">
            <div className="room-stat-header-row">
              <span className="room-stat-label">Bảo trì &amp; Dọn buồng</span>
              {activeTab === 'maintenance' && <span className="stat-active-badge">Đang lọc</span>}
            </div>
            <div className="room-stat-num text-red-700">
              {stats.maintenance}
              <span className="room-stat-unit">phòng</span>
            </div>
            <span className="room-stat-sub text-slate-500">Ưu tiên hoàn thành trước 14:00</span>
          </div>
        </div>
      </div>

      {/* Thanh Tiêu Đề Danh Sách & Điều Khiển Cân Đối (Balanced List Header Bar) */}
      <div className="room-balanced-header-bar">
        {/* Bên Trái: Tiêu đề danh sách & số lượng phòng */}
        <div className="room-balanced-left">
          <div className="room-balanced-title-row">
            <h2 className="room-balanced-title">Danh sách phòng nghỉ</h2>
            <span className="room-balanced-count-pill">
              {filteredRooms.length} phòng
            </span>
          </div>
          <p className="room-balanced-subtext">
            {activeHomestayId && activeHomestayId !== 'all'
              ? `Cơ sở: ${currentHomestayName}`
              : 'Quản lý toàn bộ hệ thống phòng tại các cơ sở homestay'}
          </p>
        </div>

        {/* Bên Phải: Chọn cơ sở & Ô tìm kiếm cùng kích thước chuẩn 40px */}
        <div className="room-balanced-right">
          {/* 0. Bộ lọc thời gian: Tất cả, 1 tuần, 1 tháng, 1 năm */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f1f5f9', padding: '3px 4px', borderRadius: '10px', flexShrink: 0 }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', padding: '0 6px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '15px', color: '#166534' }}>calendar_month</span>
              Thời gian:
            </span>
            {[
              { id: 'all', label: 'Tất cả' },
              { id: '1week', label: '1 tuần' },
              { id: '1month', label: '1 tháng' },
              { id: '1year', label: '1 năm' },
            ].map(p => {
              const active = timeFilter === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { setTimeFilter(p.id); setCurrentPage(1); }}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '7px',
                    fontSize: '12.5px',
                    fontWeight: active ? 700 : 500,
                    border: 'none',
                    cursor: 'pointer',
                    background: active ? '#166534' : 'transparent',
                    color: active ? '#ffffff' : '#64748b',
                    boxShadow: active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* 1. Chọn cơ sở Homestay */}
          {homestaysList.length > 0 && (
            <div className="room-balanced-select-wrap">
              <span className="material-symbols-outlined select-icon text-emerald-700">cottage</span>
              <select
                className="room-balanced-select"
                value={activeHomestayId || 'all'}
                onChange={(e) => {
                  const val = e.target.value;
                  setActiveHomestayId(val);
                  localStorage.setItem('ownerActiveHomestayId', val);
                  window.dispatchEvent(new Event('ownerActiveHomestayChanged'));
                }}
              >
                <option value="all">🏠 Tất cả cơ sở ({homestaysList.length})</option>
                {homestaysList.map((h) => (
                  <option key={h.id} value={String(h.id)}>
                    🏡 {h.name}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined select-arrow">expand_more</span>
            </div>
          )}

          {/* 2. Ô tìm kiếm phòng */}
          <div className="room-balanced-search-wrap">
            <span className="material-symbols-outlined search-icon">search</span>
            <input
              type="text"
              className="room-balanced-search-input"
              placeholder="Tìm theo tên phòng, mã phòng, loại..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchQuery('')}
                title="Xóa từ khóa tìm kiếm"
              >
                <span className="material-symbols-outlined text-[15px]">close</span>
              </button>
            )}
          </div>

          {/* 3. Lọc theo Loại phòng */}
          {availableRoomTypes.length > 0 && (
            <div className="room-balanced-select-wrap">
              <span className="material-symbols-outlined select-icon text-emerald-700">hotel</span>
              <select
                className="room-balanced-select"
                value={roomTypeFilter}
                onChange={(e) => setRoomTypeFilter(e.target.value)}
                title="Lọc theo loại phòng"
              >
                <option value="all">Tất cả loại phòng ({availableRoomTypes.length})</option>
                {availableRoomTypes.map((t) => (
                  <option key={t} value={t}>
                    🛏️ {t}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined select-arrow">expand_more</span>
            </div>
          )}

          {/* 4. Sắp xếp phòng */}
          <div className="room-balanced-select-wrap">
            <span className="material-symbols-outlined select-icon text-emerald-700">sort</span>
            <select
              className="room-balanced-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              title="Sắp xếp danh sách"
            >
              <option value="default">Sắp xếp mặc định</option>
              <option value="price-asc">Giá tăng dần ⬆</option>
              <option value="price-desc">Giá giảm dần ⬇</option>
              <option value="name-asc">Tên phòng A-Z</option>
              <option value="code-asc">Mã phòng A-Z</option>
            </select>
            <span className="material-symbols-outlined select-arrow">expand_more</span>
          </div>

          {/* 5. Nút Đặt lại nhỏ gọn */}
          {(searchQuery.trim() || (activeHomestayId && activeHomestayId !== 'all') || activeTab !== 'all' || roomTypeFilter !== 'all' || sortBy !== 'default' || timeFilter !== 'all') && (
            <button
              type="button"
              className="room-balanced-reset-btn"
              onClick={() => {
                setActiveTab('all');
                setSearchQuery('');
                setRoomTypeFilter('all');
                setSortBy('default');
                setTimeFilter('all');
                setActiveHomestayId('all');
                localStorage.setItem('ownerActiveHomestayId', 'all');
                window.dispatchEvent(new Event('ownerActiveHomestayChanged'));
              }}
              title="Đặt lại bộ lọc về mặc định"
            >
              <span className="material-symbols-outlined text-[15px]">restart_alt</span>
              Đặt lại
            </button>
          )}
        </div>
      </div>

      {/* DẠNG THẺ (Cards View) */}
      {(viewMode === 'cards' || viewMode === 'both') && (
        <>
          <div className="room-grid-cards">
          {paginatedRooms.map((room) => {
            const isOccupied = room.status === 'occupied';
            const isBooked = room.status === 'booked';
            const isAvailable = room.status === 'available';
            const isMaintenance = room.status === 'maintenance';

            return (
              <div key={room.code} className="room-card-box">
                {/* Media Header */}
                <div className="room-card-media">
                  <img
                    src={room.image}
                    alt={room.name}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = getRoomFallbackImage(room.id, room.type, room.name);
                    }}
                  />
                  <div className="room-media-gradient" />

                  {/* Mã phòng badge */}
                  <div className="room-code-tag">
                    <span className="material-symbols-outlined text-[14px] text-emerald-700">
                      meeting_room
                    </span>
                    {room.code} • {room.floor}
                  </div>

                  {/* Trạng thái badge */}
                  <div className={`room-status-pill ${room.status}`}>
                    <span className="status-pulse-dot" />
                    <span>
                      {isOccupied && 'Đang có khách'}
                      {isBooked && 'Đã đặt • Chờ nhận'}
                      {isAvailable && 'Còn trống hôm nay'}
                      {isMaintenance && 'Bảo trì / Dọn dẹp'}
                    </span>
                  </div>

                  {/* Thông tin phòng đè trên ảnh */}
                  <div className="room-media-caption">
                    <div>
                      <h3 className="room-media-title">{room.name}</h3>
                      <div className="room-media-meta">
                        <span className="material-symbols-outlined text-[15px]">group</span>
                        <span>{room.capacityLabel || `${room.capacity} khách`}</span>
                        <span>•</span>
                        <span>{room.bed}</span>
                      </div>
                    </div>
                    <div className="room-price-box">
                      <span className="room-price-label">Giá / đêm</span>
                      <span className="room-price-val">{formatMoney(room.price)}</span>
                    </div>
                  </div>
                </div>

                {/* Thân thẻ */}
                <div className="room-card-body">
                  {/* Tiện nghi */}
                  <div className="room-amenities-section">
                    <span className="room-section-label">Tiện nghi nổi bật</span>
                    <div className="room-amenity-tags">
                      {(room.amenities || []).map((amenity, aIdx) => (
                        <span key={aIdx} className="room-amenity-tag">
                          <span className="material-symbols-outlined text-[13px] text-emerald-700">
                            check
                          </span>
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Thông tin khách lưu trú hoặc thông báo sẵn sàng */}
                  {isOccupied && (
                    <div className="room-guest-infobox">
                      <div className="guest-info-row">
                        <div className="guest-avatar-small">
                          {room.guest?.slice(0, 2).toUpperCase() || 'KH'}
                        </div>
                        <div className="guest-details-text">
                          <span className="guest-name-text">Khách: {room.guest}</span>
                          <span className="guest-stay-text">
                            <span className="material-symbols-outlined text-[13px]">event</span>
                            {room.stay}
                          </span>
                        </div>
                      </div>
                      <div className="guest-action-btns">
                        <button
                          type="button"
                          className="btn-guest-sub"
                          onClick={() => showToast(`Đang kết nối liên lạc với ${room.guest}...`)}
                        >
                          <span className="material-symbols-outlined text-[14px]">call</span>
                          Gọi khách
                        </button>
                        <button
                          type="button"
                          className="btn-guest-action-primary"
                          onClick={() => {
                            setSelectedRoom(room);
                            setIsCheckoutModalOpen(true);
                          }}
                        >
                          <span className="material-symbols-outlined text-[14px]">logout</span>
                          Check-out
                        </button>
                      </div>
                    </div>
                  )}

                  {isBooked && (
                    <div className="room-guest-infobox">
                      <div className="guest-info-row">
                        <div className="guest-avatar-small bg-amber-100 text-amber-900">
                          {room.guest?.slice(0, 2).toUpperCase() || 'KH'}
                        </div>
                        <div className="guest-details-text">
                          <span className="guest-name-text">Khách: {room.guest}</span>
                          <span className="guest-stay-text">
                            <span className="material-symbols-outlined text-[13px]">schedule</span>
                            {room.stay}
                          </span>
                        </div>
                      </div>
                      <div className="guest-action-btns">
                        <button
                          type="button"
                          className="btn-guest-sub"
                          onClick={() => {
                            setSelectedRoom(room);
                            setIsChangeModalOpen(true);
                          }}
                        >
                          <span className="material-symbols-outlined text-[14px]">sync_alt</span>
                          Đổi phòng
                        </button>
                        <button
                          type="button"
                          className="btn-guest-sub text-red-600"
                          onClick={() => {
                            setSelectedRoom(room);
                            setIsCancelModalOpen(true);
                          }}
                        >
                          <span className="material-symbols-outlined text-[14px]">cancel</span>
                          Hủy phòng
                        </button>
                        <button
                          type="button"
                          className="btn-guest-action-primary"
                          onClick={() => handleDirectCheckin(room)}
                        >
                          <span className="material-symbols-outlined text-[14px]">login</span>
                          Check-in
                        </button>
                      </div>
                    </div>
                  )}

                  {isAvailable && (
                    <div className="room-available-infobox">
                      <div className="available-icon-box">
                        <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      </div>
                      <div>
                        <div className="available-title">Sẵn sàng nhận khách ngay</div>
                        <div className="available-desc">{room.stay}</div>
                      </div>
                    </div>
                  )}

                  {isMaintenance && (
                    <div className="room-available-infobox bg-red-50 border-red-200">
                      <div className="available-icon-box bg-red-100 text-red-700">
                        <span className="material-symbols-outlined text-[18px]">handyman</span>
                      </div>
                      <div>
                        <div className="available-title text-red-800">Đang bảo trì / Dọn phòng</div>
                        <div className="available-desc text-red-600">{room.stay}</div>
                      </div>
                    </div>
                  )}

                  {/* Nút tác vụ chân card: 3 nút trên 1 hàng ngang duy nhất */}
                  <div
                    className="room-card-actions-row"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1.15fr',
                      gap: '6px',
                      width: '100%',
                      marginTop: 'auto',
                      paddingTop: '12px',
                      borderTop: '1px solid #f1f5f9'
                    }}
                  >
                    <button
                      type="button"
                      className="btn-card-sub"
                      onClick={() => {
                        setSelectedRoom(room);
                        setIsBlockModalOpen(true);
                      }}
                      style={{
                        padding: '7px 4px',
                        fontSize: '12px',
                        justifyContent: 'center',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Chặn ngày
                    </button>

                    <button
                      type="button"
                      className="btn-card-sub"
                      onClick={() => handleOpenEditRoom(room)}
                      style={{
                        padding: '7px 4px',
                        fontSize: '12px',
                        justifyContent: 'center',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Sửa
                    </button>

                    <button
                      type="button"
                      className="btn-card-detail"
                      onClick={() => handleOpenDetail(room)}
                      style={{
                        padding: '7px 4px',
                        fontSize: '12px',
                        justifyContent: 'center',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* THANH PHÂN TRANG */}
        {totalPages > 1 && (
          <div className="room-pagination-bar">
            <button
              type="button"
              className="room-page-btn room-page-nav"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              Trước
            </button>

            <div className="room-page-numbers">
              {renderPageNumbers()}
            </div>

            <button
              type="button"
              className="room-page-btn room-page-nav"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Sau
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
        )}
      </>
      )}

      {/* DẢNG LỊCH TIMELINE 7 NGÀY */}
      {(viewMode === 'timeline' || viewMode === 'both') && (
        <div className="room-timeline-section">
          <div className="timeline-header-row">
            <div className="timeline-title-box">
              <span className="material-symbols-outlined text-emerald-800 text-[22px]">
                date_range
              </span>
              <h3>Lịch trống &amp; Dải booking 7 ngày tới (17/09 - 23/09)</h3>
            </div>

            {/* Chú thích màu */}
            <div className="timeline-legend">
              <span className="legend-item">
                <span className="legend-dot staying" /> Đang ở
              </span>
              <span className="legend-item">
                <span className="legend-dot booked" /> Đã đặt cọc
              </span>
              <span className="legend-item">
                <span className="legend-dot available" /> Còn trống
              </span>
              <span className="legend-item">
                <span className="legend-dot maintenance" /> Bảo trì / Khóa
              </span>
            </div>
          </div>

          <div className="timeline-table-scroll">
            <div className="timeline-table">
              {/* Header ngày */}
              <div className="timeline-header-grid">
                <div className="text-left pl-2 text-slate-800 font-bold">Phòng homestay</div>
                {initialRoomsData.timelineDays.map((day) => (
                  <div
                    key={day.key}
                    className={`timeline-date-cell ${day.isToday ? 'today' : ''} ${
                      day.isWeekend ? 'weekend' : ''
                    }`}
                  >
                    {day.dayName} ({day.dateNum})
                    {day.isToday && <span className="block text-[10px] font-normal">Hôm nay</span>}
                  </div>
                ))}
              </div>

              {/* Các hàng phòng từ Neon CSDL thực tế */}
              {dynamicTimelineRows.map((row, rIdx) => (
                <div key={rIdx} className="timeline-row-grid">
                  <div className="timeline-room-name">{row.roomShortName}</div>
                  {row.segments.map((seg, sIdx) => (
                    <div
                      key={sIdx}
                      className={`timeline-segment ${seg.status}`}
                      style={{ gridColumn: `span ${seg.span}` }}
                    >
                      {seg.label}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. MODAL CHI TIẾT PHÒNG (REDESIGNED) */}
      {/* ========================================================= */}
      {isDetailModalOpen && selectedRoom && (
        <div className="room-modal-backdrop" onClick={() => setIsDetailModalOpen(false)}>
          <div
            className="room-modal-panel modal-lg"
            style={{ maxWidth: '720px', borderRadius: '20px', overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Hero Image Card Header */}
            <div className="detail-hero-card" style={{ position: 'relative' }}>
              <img
                src={selectedRoom.image}
                alt={selectedRoom.name}
                className="detail-hero-img"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = getRoomFallbackImage(selectedRoom.id, selectedRoom.type, selectedRoom.name);
                }}
              />
              {Array.isArray(selectedRoom.images) && selectedRoom.images.length > 1 && (
                <div style={{ position: 'absolute', bottom: '14px', right: '16px', zIndex: 10, display: 'flex', gap: '6px' }}>
                  {selectedRoom.images.map((imgUrl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedRoom({ ...selectedRoom, image: imgUrl })}
                      style={{
                        width: '36px',
                        height: '26px',
                        borderRadius: '6px',
                        border: selectedRoom.image === imgUrl ? '2px solid #10b981' : '1px solid rgba(255,255,255,0.7)',
                        overflow: 'hidden',
                        padding: 0,
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                        opacity: selectedRoom.image === imgUrl ? 1 : 0.75,
                        transition: 'all 0.15s ease'
                      }}
                      title={`Xem ảnh ${i + 1}`}
                    >
                      <img src={imgUrl} alt={`Thumbnail ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </button>
                  ))}
                </div>
              )}
              <div className="detail-hero-overlay">
                <div className="detail-hero-top">
                  <div className="detail-badge-code">
                    <span className="material-symbols-outlined text-[16px]">meeting_room</span>
                    {selectedRoom.code} • {selectedRoom.floor || 'Tầng 1'}
                  </div>
                  <div className={`detail-badge-status ${selectedRoom.status}`}>
                    <span className="status-pulse-dot" />
                    <span>
                      {selectedRoom.status === 'occupied' && '🔴 Đang có khách lưu trú'}
                      {selectedRoom.status === 'booked' && '🟠 Đã đặt cọc • Chờ nhận phòng'}
                      {selectedRoom.status === 'available' && '🟢 Còn trống hôm nay'}
                      {selectedRoom.status === 'maintenance' && '🛠 Bảo trì / Dọn buồng'}
                    </span>
                  </div>
                </div>

                <div className="detail-hero-bottom">
                  <h2 className="detail-hero-title">{selectedRoom.name}</h2>
                  <div className="detail-hero-sub">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span className="material-symbols-outlined text-[16px] text-emerald-400">cottage</span>
                      {selectedRoom.homestayName || 'Yên Homestay'}
                    </span>
                    <span>•</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span className="material-symbols-outlined text-[16px] text-amber-400">star</span>
                      5.0 (Đánh giá xuất sắc)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="room-modal-body" style={{ gap: '18px', padding: '20px 24px' }}>
              {/* 4 Thẻ Key Specs */}
              <div className="detail-specs-grid">
                <div className="detail-spec-card">
                  <div className="detail-spec-icon">
                    <span className="material-symbols-outlined text-[20px]">group</span>
                  </div>
                  <div className="detail-spec-info">
                    <span className="detail-spec-label">Sức chứa</span>
                    <span className="detail-spec-val">{selectedRoom.capacityLabel || `${selectedRoom.capacity} khách`}</span>
                  </div>
                </div>

                <div className="detail-spec-card">
                  <div className="detail-spec-icon">
                    <span className="material-symbols-outlined text-[20px]">bed</span>
                  </div>
                  <div className="detail-spec-info">
                    <span className="detail-spec-label">Giường ngủ</span>
                    <span className="detail-spec-val">{selectedRoom.bed || 'Giường King'}</span>
                  </div>
                </div>

                <div className="detail-spec-card">
                  <div className="detail-spec-icon" style={{ background: '#dcfce7', color: '#166534' }}>
                    <span className="material-symbols-outlined text-[20px]">payments</span>
                  </div>
                  <div className="detail-spec-info">
                    <span className="detail-spec-label">Giá niêm yết</span>
                    <span className="detail-spec-val" style={{ color: '#166534' }}>{formatMoney(selectedRoom.price)}</span>
                  </div>
                </div>

                <div className="detail-spec-card">
                  <div className="detail-spec-icon" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                    <span className="material-symbols-outlined text-[20px]">style</span>
                  </div>
                  <div className="detail-spec-info">
                    <span className="detail-spec-label">Loại phòng</span>
                    <span className="detail-spec-val" style={{ color: '#0369a1' }}>{selectedRoom.type || 'Standard'}</span>
                  </div>
                </div>
              </div>

              {/* Khách lưu trú (nếu có) */}
              {selectedRoom.guest && (
                <div style={{
                  padding: '14px 18px',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: '#166534',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '14px'
                    }}>
                      {selectedRoom.guest.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#166534' }}>Khách đang ở: {selectedRoom.guest}</div>
                      <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>{selectedRoom.stay || 'Lưu trú tại homestay'}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => showToast(`Đang kết nối liên lạc với ${selectedRoom.guest}...`)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      background: '#166534',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 600,
                      fontSize: '12.5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span className="material-symbols-outlined text-[15px]">call</span> Gọi điện
                  </button>
                </div>
              )}

              {/* Mô tả chi tiết */}
              <div className="detail-block">
                <div className="detail-block-title">
                  <span className="material-symbols-outlined text-[17px]">description</span>
                  Mô tả không gian &amp; Điểm nổi bật
                </div>
                <p style={{ margin: 0, fontSize: '13.5px', color: '#334155', lineHeight: 1.6 }}>
                  {selectedRoom.description || `Phòng ${selectedRoom.name} mang tới trải nghiệm nghỉ dưỡng đích thực tại Yên Homestay với không gian thoáng đãng, chan hòa ánh sáng tự nhiên và đầy đủ tiện ích sang trọng.`}
                </p>
              </div>

              {/* Tiện nghi trang bị */}
              <div className="detail-block">
                <div className="detail-block-title">
                  <span className="material-symbols-outlined text-[17px]">auto_awesome</span>
                  Tiện nghi trang bị đầy đủ
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {(selectedRoom.amenities || ['Wifi tốc độ cao', 'Điều hòa Inverter', 'Phòng tắm riêng', 'Máy sấy tóc']).map((a, i) => (
                    <span key={i} className="detail-amenity-pill">
                      <span className="material-symbols-outlined text-[14px]">check</span>
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="room-modal-foot" style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setIsDetailModalOpen(false)}
              >
                Đóng
              </button>
              <button
                type="button"
                className="btn-modal-save"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  handleOpenEditRoom(selectedRoom);
                }}
              >
                <span className="material-symbols-outlined text-[16px]">edit</span>
                Chỉnh sửa phòng này
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. MODAL THÊM / SỬA PHÒNG */}
      {/* ========================================================= */}
      {isEditModalOpen && (
        <div className="room-modal-backdrop" onClick={() => setIsEditModalOpen(false)}>
          <div className="room-modal-panel" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSaveRoom}>
              <div className="room-modal-head">
                <div>
                  <h3 className="room-modal-title">
                    {selectedRoom ? 'Chỉnh sửa thông tin phòng' : 'Thêm phòng mới'}
                  </h3>
                  <p className="room-modal-desc">
                    Điền các thông số buồng phòng để quản lý và hiển thị lên website.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-close-modal"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              <div className="room-modal-body">
                {/* Chọn Cơ sở Homestay */}
                {homestaysList.length > 0 && (
                  <div className="room-form-row">
                    <label className="room-form-label">Cơ sở Homestay phụ thuộc *</label>
                    <select
                      className="room-form-select"
                      value={roomFormData.homestayId}
                      onChange={(e) => setRoomFormData({ ...roomFormData, homestayId: Number(e.target.value) })}
                    >
                      {homestaysList.map((h) => (
                        <option key={h.id} value={h.id}>{h.name} ({h.region || h.city})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="room-form-row">
                  <label className="room-form-label">Tên phòng *</label>
                  <input
                    type="text"
                    required
                    className="room-form-input"
                    placeholder="Ví dụ: Garden View 101"
                    value={roomFormData.name}
                    onChange={(e) => setRoomFormData({ ...roomFormData, name: e.target.value })}
                  />
                </div>

                <div className="room-form-grid-2">
                  <div className="room-form-row">
                    <label className="room-form-label">Mã phòng *</label>
                    <input
                      type="text"
                      required
                      className="room-form-input"
                      placeholder="P.101"
                      value={roomFormData.code}
                      onChange={(e) => setRoomFormData({ ...roomFormData, code: e.target.value })}
                    />
                  </div>
                  <div className="room-form-row">
                    <label className="room-form-label">Loại phòng</label>
                    <select
                      className="room-form-select"
                      value={roomFormData.type}
                      onChange={(e) => setRoomFormData({ ...roomFormData, type: e.target.value })}
                    >
                      <option value="Garden View">Garden View</option>
                      <option value="Mountain View">Mountain View</option>
                      <option value="Bungalow">Bungalow</option>
                      <option value="Dorm">Dorm tập thể</option>
                      <option value="Nhà sàn">Nhà sàn</option>
                    </select>
                  </div>
                </div>

                <div className="room-form-grid-2">
                  <div className="room-form-row">
                    <label className="room-form-label">Sức chứa (người)</label>
                    <input
                      type="number"
                      min="1"
                      className="room-form-input"
                      value={roomFormData.capacity}
                      onChange={(e) =>
                        setRoomFormData({ ...roomFormData, capacity: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="room-form-row">
                    <label className="room-form-label">Giá mỗi đêm (₫) *</label>
                    <input
                      type="number"
                      step="10000"
                      required
                      className="room-form-input"
                      value={roomFormData.price}
                      onChange={(e) =>
                        setRoomFormData({ ...roomFormData, price: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>

                <div className="room-form-grid-2">
                  <div className="room-form-row">
                    <label className="room-form-label">Loại giường</label>
                    <input
                      type="text"
                      className="room-form-input"
                      placeholder="Giường King 1m8"
                      value={roomFormData.bed}
                      onChange={(e) => setRoomFormData({ ...roomFormData, bed: e.target.value })}
                    />
                  </div>
                  <div className="room-form-row">
                    <label className="room-form-label">Vị trí / Tầng</label>
                    <input
                      type="text"
                      className="room-form-input"
                      placeholder="Tầng 1, Khu ven suối..."
                      value={roomFormData.floor}
                      onChange={(e) => setRoomFormData({ ...roomFormData, floor: e.target.value })}
                    />
                  </div>
                </div>

                <div className="room-form-row">
                  <label className="room-form-label">Tiện nghi (cách nhau bằng dấu phẩy)</label>
                  <input
                    type="text"
                    className="room-form-input"
                    placeholder="Wifi, Ban công, Điều hòa Inverter..."
                    value={roomFormData.amenities}
                    onChange={(e) =>
                      setRoomFormData({ ...roomFormData, amenities: e.target.value })
                    }
                  />
                </div>

                {/* Hình ảnh đại diện phòng */}
                <div className="room-form-row">
                  <label className="room-form-label">
                    <span>Hình ảnh đại diện phòng (URL ảnh)</span>
                  </label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                    <input
                      type="url"
                      className="room-form-input"
                      placeholder="https://images.unsplash.com/..."
                      value={roomFormData.image}
                      onChange={(e) => setRoomFormData({ ...roomFormData, image: e.target.value })}
                      style={{ flex: 1 }}
                    />
                    {roomFormData.image && (
                      <div
                        style={{
                          width: '64px',
                          height: '46px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border: '2px solid #10b981',
                          flexShrink: 0,
                          boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                        }}
                      >
                        <img
                          src={roomFormData.image}
                          alt="Room Preview"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = FALLBACK_ROOM_IMAGES[0];
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Chọn nhanh ảnh mẫu chuẩn */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', alignSelf: 'center', marginRight: '4px' }}>
                      Chọn mẫu ảnh nhanh:
                    </span>
                    {[
                      { label: '🌿 View Vườn', url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80' },
                      { label: '🏔️ View Núi', url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80' },
                      { label: '🪵 Bungalow Suối', url: 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=1200&q=80' },
                      { label: '👨‍👩‍👧 Phòng Gia đình', url: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80' },
                      { label: '✨ Deluxe Sang trọng', url: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80' },
                      { label: '🌅 Ban công Panorama', url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80' },
                      { label: '🏡 Nhà sàn ấm cúng', url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80' }
                    ].map((preset, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => setRoomFormData({ ...roomFormData, image: preset.url })}
                        style={{
                          fontSize: '11px',
                          padding: '4px 9px',
                          borderRadius: '6px',
                          border: roomFormData.image === preset.url ? '1.5px solid #059669' : '1px solid #cbd5e1',
                          background: roomFormData.image === preset.url ? '#ecfdf5' : '#f8fafc',
                          color: roomFormData.image === preset.url ? '#065f46' : '#334155',
                          cursor: 'pointer',
                          fontWeight: roomFormData.image === preset.url ? '600' : '400',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="room-form-row">
                  <label className="room-form-label">Mô tả phòng</label>
                  <textarea
                    rows={3}
                    className="room-form-textarea"
                    placeholder="Mô tả không gian và view của phòng..."
                    value={roomFormData.description}
                    onChange={(e) =>
                      setRoomFormData({ ...roomFormData, description: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="room-modal-foot">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Hủy
                </button>
                <button type="submit" className="btn-modal-save">
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  Lưu phòng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. MODAL CHẶN NGÀY / KHÓA PHÒNG */}
      {/* ========================================================= */}
      {isBlockModalOpen && selectedRoom && (
        <div className="room-modal-backdrop" onClick={() => setIsBlockModalOpen(false)}>
          <div className="room-modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="room-modal-head">
              <div>
                <h3 className="room-modal-title">Chặn ngày cho {selectedRoom.name}</h3>
                <p className="room-modal-desc">
                  Khóa phòng trong khoảng thời gian để bảo trì hoặc giữ chỗ nội bộ.
                </p>
              </div>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setIsBlockModalOpen(false)}
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="room-modal-body">
              <div className="room-form-grid-2">
                <div className="room-form-row">
                  <label className="room-form-label">Từ ngày</label>
                  <input type="date" defaultValue="2026-09-18" className="room-form-input" />
                </div>
                <div className="room-form-row">
                  <label className="room-form-label">Đến ngày</label>
                  <input type="date" defaultValue="2026-09-20" className="room-form-input" />
                </div>
              </div>

              <div className="room-form-row">
                <label className="room-form-label">Lý do chặn phòng</label>
                <select className="room-form-select">
                  <option value="Bảo trì">Bảo trì hệ thống / thiết bị</option>
                  <option value="Dọn buồng">Dọn buồng tổng thể</option>
                  <option value="Giữ chỗ">Giữ chỗ cho chủ nhà / người thân</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              <div className="room-form-row">
                <label className="room-form-label">Ghi chú thêm</label>
                <textarea
                  rows={2}
                  className="room-form-textarea"
                  placeholder="Ghi chú chi tiết công việc cần làm..."
                />
              </div>
            </div>

            <div className="room-modal-foot">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setIsBlockModalOpen(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn-modal-save"
                onClick={() => handleConfirmBlock(selectedRoom)}
              >
                <span className="material-symbols-outlined text-[16px]">lock_clock</span>
                Xác nhận chặn ngày
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. MODAL CHECK-OUT */}
      {/* ========================================================= */}
      {isCheckoutModalOpen && selectedRoom && (
        <div className="room-modal-backdrop" onClick={() => setIsCheckoutModalOpen(false)}>
          <div className="room-modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="room-modal-head">
              <div>
                <h3 className="room-modal-title">Xác nhận Check-out: {selectedRoom.name}</h3>
                <p className="room-modal-desc">Khách lưu trú: {selectedRoom.guest}</p>
              </div>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setIsCheckoutModalOpen(false)}
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="room-modal-body">
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="checkbox" defaultChecked />
                  <span>Đã kiểm tra phòng, không phát sinh hư hỏng đồ đạc</span>
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="checkbox" defaultChecked />
                  <span>Khách đã thanh toán đầy đủ phụ phí &amp; dịch vụ ăn uống</span>
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="checkbox" defaultChecked />
                  <span>Chuyển phòng sang trạng thái "Bảo trì / Dọn buồng"</span>
                </label>
              </div>
            </div>

            <div className="room-modal-foot">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setIsCheckoutModalOpen(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn-modal-save"
                onClick={() => handleConfirmCheckout(selectedRoom)}
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                Hoàn tất Check-out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. MODAL CẬP NHẬT GIÁ HÀNG LOẠT (REDESIGNED) */}
      {/* ========================================================= */}
      {isBulkPriceModalOpen && (
        <div className="room-modal-backdrop" onClick={() => setIsBulkPriceModalOpen(false)}>
          <div className="room-modal-panel modal-lg bulk-modal-box" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleApplyBulkPrice}>
              <div className="room-modal-head">
                <div>
                  <h3 className="room-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="material-symbols-outlined text-emerald-800 text-[22px]">price_change</span>
                    Cập nhật giá phòng hàng loạt
                  </h3>
                  <p className="room-modal-desc">
                    Tăng/giảm hoặc thiết lập lại bảng giá cho nhiều phòng cùng lúc trong đợt lễ Tết, cuối tuần hoặc khuyến mãi.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-close-modal"
                  onClick={() => setIsBulkPriceModalOpen(false)}
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              <div className="room-modal-body" style={{ gap: '20px' }}>
                {/* Step 1: Chọn phòng áp dụng */}
                <div>
                  <div className="bulk-section-title">
                    <span>1. Chọn danh sách phòng áp dụng ({bulkSelectedRooms.length}/{filteredRooms.length})</span>
                    <div className="bulk-quick-actions">
                      <button
                        type="button"
                        className={`bulk-quick-btn ${isAllSelected ? 'active' : ''}`}
                        onClick={() => setBulkSelectedRooms(filteredRooms.map(r => r.code))}
                      >
                        Chọn tất cả ({filteredRooms.length})
                      </button>
                      <button
                        type="button"
                        className={`bulk-quick-btn ${isNoneSelected ? 'active' : ''}`}
                        onClick={() => setBulkSelectedRooms([])}
                      >
                        Tự chọn
                      </button>
                      <button
                        type="button"
                        className={`bulk-quick-btn ${isOnlyAvailableSelected ? 'active' : ''}`}
                        onClick={() => setBulkSelectedRooms(availableCodes)}
                      >
                        Chỉ chọn phòng trống ({availableCodes.length})
                      </button>
                    </div>
                  </div>

                  <div className="bulk-rooms-grid">
                    {filteredRooms.map((r) => {
                      const isSelected = bulkSelectedRooms.includes(r.code);
                      return (
                        <div
                          key={r.code}
                          className={`bulk-room-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => {
                            if (isSelected) {
                              setBulkSelectedRooms(bulkSelectedRooms.filter((c) => c !== r.code));
                            } else {
                              setBulkSelectedRooms([...bulkSelectedRooms, r.code]);
                            }
                          }}
                        >
                          <div className="bulk-room-info">
                            <span className="bulk-room-code">{r.code}</span>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>{r.name.slice(0, 18)}</span>
                            <span className="bulk-room-price">{formatMoney(r.price)}</span>
                          </div>
                          <span
                            className="material-symbols-outlined text-[18px]"
                            style={{ color: isSelected ? '#166534' : '#cbd5e1' }}
                          >
                            {isSelected ? 'check_circle' : 'radio_button_unchecked'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Step 2: Quy tắc điều chỉnh giá */}
                <div>
                  <div className="bulk-section-title">2. Phương thức điều chỉnh &amp; Mức áp dụng</div>
                  <div className="room-form-grid-2" style={{ alignItems: 'flex-start' }}>
                    <div>
                      <label className="room-form-label mb-2 block">Loại điều chỉnh</label>
                      <div className="bulk-methods-grid">
                        <button
                          type="button"
                          className={`bulk-method-pill ${bulkMode === 'percent-up' ? 'active' : ''}`}
                          onClick={() => setBulkMode('percent-up')}
                        >Tăng %
                        </button>
                        <button
                          type="button"
                          className={`bulk-method-pill ${bulkMode === 'percent-down' ? 'active' : ''}`}
                          onClick={() => setBulkMode('percent-down')}
                        >Giảm %
                        </button>
                        <button
                          type="button"
                          className={`bulk-method-pill ${bulkMode === 'amount-up' ? 'active' : ''}`}
                          onClick={() => setBulkMode('amount-up')}
                        >Tăng ₫
                        </button>
                        <button
                          type="button"
                          className={`bulk-method-pill ${bulkMode === 'amount-down' ? 'active' : ''}`}
                          onClick={() => setBulkMode('amount-down')}
                        >Giảm ₫
                        </button>
                        <button
                          type="button"
                          className={`bulk-method-pill ${bulkMode === 'fixed' ? 'active' : ''}`}
                          onClick={() => setBulkMode('fixed')}
                        >Cố định ₫
                        </button>
                      </div>
                    </div>

                    <div className="room-form-row">
                      <label className="room-form-label">
                        {bulkMode.includes('percent') ? 'Tỷ lệ % điều chỉnh' : 'Giá trị số tiền (₫)'} *
                      </label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input
                          type="number"
                          required
                          min="0"
                          step={bulkMode.includes('percent') ? '1' : '10000'}
                          className="room-form-input"
                          style={{ width: '100%', paddingRight: '45px' }}
                          value={bulkValue}
                          onChange={(e) => setBulkValue(Number(e.target.value))}
                        />
                        <span style={{ position: 'absolute', right: '14px', fontSize: '13px', fontWeight: 700, color: '#64748b' }}>
                          {bulkMode.includes('percent') ? '%' : '₫'}
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                        {bulkMode === 'percent-up' && `Ví dụ: Giá 800,000₫ tăng ${bulkValue}% ➔ ${(800000 * (1 + bulkValue / 100)).toLocaleString()}₫`}
                        {bulkMode === 'percent-down' && `Ví dụ: Giá 800,000₫ giảm ${bulkValue}% ➔ ${(800000 * (1 - bulkValue / 100)).toLocaleString()}₫`}
                        {bulkMode === 'amount-up' && `Tăng thêm ${bulkValue.toLocaleString()}₫ vào giá hiện tại`}
                        {bulkMode === 'amount-down' && `Giảm đi ${bulkValue.toLocaleString()}₫ từ giá hiện tại`}
                        {bulkMode === 'fixed' && `Thiết lập giá mới của phòng thành ${bulkValue.toLocaleString()}₫/đêm`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Step 3: Xem trước kết quả giá mới */}
                {bulkSelectedRooms.length > 0 && (
                  <div>
                    <div className="bulk-section-title">
                      <span>3. Xem trước giá thay đổi ({bulkSelectedRooms.length} phòng được chọn)</span>
                    </div>

                    <div className="bulk-preview-table-wrap">
                      <table className="bulk-preview-table">
                        <thead>
                          <tr>
                            <th>Mã phòng</th>
                            <th>Tên phòng</th>
                            <th>Giá hiện tại</th>
                            <th>Giá mới sau áp dụng</th>
                            <th>Biến động</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRooms
                            .filter((r) => bulkSelectedRooms.includes(r.code))
                            .slice(0, 5)
                            .map((r) => {
                              let newP = r.price;
                              const val = Number(bulkValue) || 0;
                              if (bulkMode === 'percent-up') newP = r.price * (1 + val / 100);
                              else if (bulkMode === 'percent-down') newP = r.price * (1 - val / 100);
                              else if (bulkMode === 'amount-up') newP = r.price + val;
                              else if (bulkMode === 'amount-down') newP = Math.max(0, r.price - val);
                              else if (bulkMode === 'fixed') newP = val;

                              newP = Math.round(newP / 1000) * 1000;
                              const diff = newP - r.price;

                              return (
                                <tr key={r.code}>
                                  <td style={{ fontWeight: 700 }}>{r.code}</td>
                                  <td>{r.name}</td>
                                  <td style={{ textDecoration: diff !== 0 ? 'line-through' : 'none', color: '#64748b' }}>
                                    {formatMoney(r.price)}
                                  </td>
                                  <td style={{ fontWeight: 800, color: '#166534' }}>
                                    {formatMoney(newP)}
                                  </td>
                                  <td>
                                    {diff > 0 && (
                                      <span style={{ color: '#15803d', fontWeight: 700, fontSize: '11.5px', background: '#dcfce7', padding: '2px 8px', borderRadius: '12px' }}>
                                        +{formatMoney(diff)}
                                      </span>
                                    )}
                                    {diff < 0 && (
                                      <span style={{ color: '#b91c1c', fontWeight: 700, fontSize: '11.5px', background: '#fee2e2', padding: '2px 8px', borderRadius: '12px' }}>
                                        {formatMoney(diff)}
                                      </span>
                                    )}
                                    {diff === 0 && (
                                      <span style={{ color: '#64748b', fontSize: '11.5px' }}>Không đổi</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="room-modal-foot">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setIsBulkPriceModalOpen(false)}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="btn-modal-save"
                  disabled={bulkSelectedRooms.length === 0}
                  style={{ opacity: bulkSelectedRooms.length === 0 ? 0.6 : 1 }}
                >
                  <span className="material-symbols-outlined text-[16px]">task_alt</span>
                  Xác nhận đổi giá cho {bulkSelectedRooms.length} phòng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 99999,
          background: '#154332',
          color: '#ffffff',
          padding: '14px 22px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: 600,
          fontSize: '14px',
          animation: 'mh-fade-in 0.3s ease'
        }}>
          <span className="material-symbols-outlined" style={{ color: '#88d982', fontSize: '20px' }}>check_circle</span>
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            style={{ background: 'none', border: 'none', color: '#ffffff', opacity: 0.8, cursor: 'pointer', marginLeft: '12px', fontSize: '15px' }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
