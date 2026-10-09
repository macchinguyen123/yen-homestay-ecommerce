import React, { useState, useEffect, useMemo } from 'react';
import './ManageRoom.css';
import { initialRoomsData } from './manageRoomData';

export default function ManageRoom() {
  const [roomsList, setRoomsList] = useState(initialRoomsData.rooms);
  const [viewMode, setViewMode] = useState('both'); // 'cards' | 'timeline' | 'both'
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'occupied' | 'available' | 'maintenance'
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch real rooms from backend DB
  React.useEffect(() => {
    fetchRealRooms();
  }, []);

  const fetchRealRooms = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8081/api/public/homestays');
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const allFetchedRooms = [];
          data.forEach(hs => {
            if (hs.rooms && hs.rooms.length > 0) {
              hs.rooms.forEach(r => {
                allFetchedRooms.push({
                  code: `P.${r.id || Math.floor(Math.random()*100+100)}`,
                  name: `${r.name || r.roomName} (${hs.name})`,
                  type: r.roomType || 'Garden View',
                  capacity: r.capacity || 2,
                  capacityLabel: `${r.capacity || 2} khách`,
                  bed: r.specs?.beds || '1 Giường đôi',
                  floor: 'Tầng 1',
                  price: r.price || r.pricePerNight || 850000,
                  status: (r.status || 'AVAILABLE').toLowerCase() === 'available' ? 'available' : ((r.status || '').toLowerCase() === 'occupied' ? 'occupied' : 'available'),
                  description: r.description || `Không gian nghỉ dưỡng tại ${hs.name}`,
                  amenities: r.amenities || ['Wifi', 'Điều hòa', 'Phòng tắm riêng'],
                  image: r.thumb || r.primaryImage || hs.image || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
                  stay: 'Phòng sạch sẽ sẵn sàng đón khách'
                });
              });
            }
          });
          if (allFetchedRooms.length > 0) {
            setRoomsList(allFetchedRooms);
          }
        }
      }
    } catch (err) {
      console.error('Lỗi nạp phòng từ CSDL:', err);
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
    type: 'Garden View',
    capacity: 2,
    bed: '',
    floor: 'Tầng 1',
    price: 800000,
    status: 'available',
    description: '',
    amenities: 'Wifi, Điều hòa, Bồn tắm'
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

  // Lọc phòng theo Tab và Tìm kiếm
  const filteredRooms = useMemo(() => {
    return roomsList.filter((r) => {
      // Tab filter
      if (activeTab === 'occupied' && r.status !== 'occupied') return false;
      if (activeTab === 'available' && r.status !== 'available') return false;
      if (activeTab === 'maintenance' && r.status !== 'maintenance') return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCode = r.code.toLowerCase().includes(q);
        const matchName = r.name.toLowerCase().includes(q);
        const matchType = r.type.toLowerCase().includes(q);
        const matchGuest = r.guest?.toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchType && !matchGuest) return false;
      }
      return true;
    });
  }, [roomsList, activeTab, searchQuery]);

  // Hành động mở modal chi tiết
  const handleOpenDetail = (room) => {
    setSelectedRoom(room);
    setIsDetailModalOpen(true);
  };

  // Hành động mở modal Thêm mới phòng
  const handleOpenAddRoom = () => {
    setRoomFormData({
      code: `P.${100 + roomsList.length + 1}`,
      name: '',
      type: 'Garden View',
      capacity: 2,
      bed: 'Giường King 1m8',
      floor: 'Tầng 1',
      price: 900000,
      status: 'available',
      description: '',
      amenities: 'Wifi, Điều hòa Inverter, Ban công'
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
      type: room.type,
      capacity: room.capacity,
      bed: room.bed,
      floor: room.floor,
      price: room.price,
      status: room.status,
      description: room.description,
      amenities: Array.isArray(room.amenities) ? room.amenities.join(', ') : room.amenities
    });
    setIsEditModalOpen(true);
  };

  // Lưu thông tin phòng (Thêm mới hoặc Cập nhật)
  const handleSaveRoom = (e) => {
    e.preventDefault();
    const amenitiesArr = roomFormData.amenities
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    if (selectedRoom) {
      // Cập nhật
      setRoomsList((prev) =>
        prev.map((r) =>
          r.code === selectedRoom.code
            ? {
                ...r,
                ...roomFormData,
                amenities: amenitiesArr
              }
            : r
        )
      );
      showToast(`Đã cập nhật phòng ${roomFormData.code} thành công!`);
    } else {
      // Thêm mới
      const newRoom = {
        ...roomFormData,
        capacityLabel: `${roomFormData.capacity} khách`,
        amenities: amenitiesArr,
        image:
          'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
        stay: 'Phòng mới sẵn sàng đón khách'
      };
      setRoomsList((prev) => [newRoom, ...prev]);
      showToast(`Đã thêm phòng mới ${roomFormData.name} thành công!`);
    }
    setIsEditModalOpen(false);
  };

  // Check-out nhanh
  const handleConfirmCheckout = (room) => {
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
    setIsCheckoutModalOpen(false);
    showToast(`Đã check-out phòng ${room.code}. Phòng chuyển sang Dọn dẹp/Bảo trì.`);
  };

  // Check-in nhanh
  const handleDirectCheckin = (room) => {
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
    showToast(`Đã nhận phòng (Check-in) thành công cho phòng ${room.code}!`);
  };

  // Xác nhận chặn ngày phòng
  const handleConfirmBlock = (room) => {
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

  return (
    <div className="manage-room-container">
      {/* Banner & Action Toolbar */}
      <div className="room-header-banner">
        <div className="room-banner-glow" />
        <div className="room-banner-info">
          <div className="room-banner-badge">
            <span className="material-symbols-outlined text-[15px]">cottage</span>
            {initialRoomsData.propertyInfo.name}
          </div>
          <h1 className="room-banner-title">Quản lý phòng &amp; Tình trạng phòng</h1>
        </div>

        <div className="room-banner-actions">
          {/* Mode Toggle */}
          <div className="view-mode-toggle">
            <button
              type="button"
              className={`view-mode-btn ${viewMode === 'cards' || viewMode === 'both' ? 'active' : ''}`}
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

      {/* 4 Thẻ Thống Kê Nhanh (Key Metrics) */}
      <div className="room-stats-grid">
        <div className="room-stat-card">
          <div className="room-stat-icon slate">
            <span className="material-symbols-outlined">apartment</span>
          </div>
          <div className="room-stat-content">
            <span className="room-stat-label">Tổng số phòng</span>
            <div className="room-stat-num">
              {stats.total}
              <span className="room-stat-unit">phòng</span>
            </div>
            <span className="room-stat-sub">Sức chứa tối đa: {initialRoomsData.propertyInfo.maxCapacity} khách</span>
          </div>
        </div>

        <div className="room-stat-card">
          <div className="room-stat-icon emerald">
            <span className="material-symbols-outlined">hotel</span>
          </div>
          <div className="room-stat-content">
            <span className="room-stat-label">Đang đón khách</span>
            <div className="room-stat-num text-emerald-800">
              {stats.occupied}/{stats.total}
              <span className="room-stat-unit">phòng</span>
            </div>
            <span className="room-stat-sub">Tỷ lệ lấp đầy: {Math.round((stats.occupied / stats.total) * 100)}%</span>
          </div>
        </div>

        <div className="room-stat-card">
          <div className="room-stat-icon amber">
            <span className="material-symbols-outlined">key</span>
          </div>
          <div className="room-stat-content">
            <span className="room-stat-label">Đã đặt / Chờ check-in</span>
            <div className="room-stat-num text-amber-800">
              {stats.booked}
              <span className="room-stat-unit">phòng</span>
            </div>
            <span className="room-stat-sub">Check-in hôm nay: 2 lượt</span>
          </div>
        </div>

        <div className="room-stat-card">
          <div className="room-stat-icon red">
            <span className="material-symbols-outlined">cleaning_services</span>
          </div>
          <div className="room-stat-content">
            <span className="room-stat-label">Bảo trì &amp; Dọn buồng</span>
            <div className="room-stat-num text-red-700">
              {stats.maintenance}
              <span className="room-stat-unit">phòng</span>
            </div>
            <span className="room-stat-sub text-slate-500">Ưu tiên hoàn thành trước 14:00</span>
          </div>
        </div>
      </div>

      {/* Thanh Bộ Lọc & Tìm Kiếm */}
      <div className="room-filter-toolbar">
        <div className="room-tabs-group">
          <button
            type="button"
            className={`room-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            Tất cả
            <span className="tab-badge-pill">{stats.total}</span>
          </button>
          <button
            type="button"
            className={`room-tab-btn ${activeTab === 'occupied' ? 'active' : ''}`}
            onClick={() => setActiveTab('occupied')}
          >
            Đang đón khách
            <span className="tab-badge-pill">{stats.occupied}</span>
          </button>
          <button
            type="button"
            className={`room-tab-btn ${activeTab === 'available' ? 'active' : ''}`}
            onClick={() => setActiveTab('available')}
          >
            Còn trống hôm nay
            <span className="tab-badge-pill">{stats.available}</span>
          </button>
          <button
            type="button"
            className={`room-tab-btn ${activeTab === 'maintenance' ? 'active' : ''}`}
            onClick={() => setActiveTab('maintenance')}
          >
            Bảo trì / Dọn phòng
            <span className="tab-badge-pill">{stats.maintenance}</span>
          </button>
        </div>

        <div className="room-search-wrapper">
          <span className="material-symbols-outlined">search</span>
          <input
            type="text"
            className="room-search-input"
            placeholder="Tìm theo tên/mã phòng/khách..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* DẠNG THẺ (Cards View) */}
      {(viewMode === 'cards' || viewMode === 'both') && (
        <div className="room-grid-cards">
          {filteredRooms.map((room) => {
            const isOccupied = room.status === 'occupied';
            const isBooked = room.status === 'booked';
            const isAvailable = room.status === 'available';
            const isMaintenance = room.status === 'maintenance';

            return (
              <div key={room.code} className="room-card-box">
                {/* Media Header */}
                <div className="room-card-media">
                  <img src={room.image} alt={room.name} />
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

                  {/* Nút tác vụ chân card */}
                  <div className="room-card-actions-row">
                    <div className="room-sub-actions-group">
                      <button
                        type="button"
                        className="btn-card-sub"
                        onClick={() => {
                          setSelectedRoom(room);
                          setIsBlockModalOpen(true);
                        }}
                      >
                        <span className="material-symbols-outlined text-[15px]">lock_clock</span>
                        Chặn ngày
                      </button>
                      <button
                        type="button"
                        className="btn-card-sub"
                        onClick={() => handleOpenEditRoom(room)}
                      >
                        <span className="material-symbols-outlined text-[15px]">edit</span>
                        Sửa
                      </button>
                    </div>

                    <button
                      type="button"
                      className="btn-card-detail"
                      onClick={() => handleOpenDetail(room)}
                    >
                      <span>Xem chi tiết</span>
                      <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
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

              {/* Các hàng phòng */}
              {initialRoomsData.timelineRows.map((row, rIdx) => (
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
      {/* 1. MODAL CHI TIẾT PHÒNG */}
      {/* ========================================================= */}
      {isDetailModalOpen && selectedRoom && (
        <div className="room-modal-backdrop" onClick={() => setIsDetailModalOpen(false)}>
          <div
            className="room-modal-panel modal-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="room-modal-head">
              <div>
                <h3 className="room-modal-title">Chi tiết {selectedRoom.name}</h3>
                <p className="room-modal-desc">
                  Mã phòng: {selectedRoom.code} • {selectedRoom.floor}
                </p>
              </div>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setIsDetailModalOpen(false)}
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="room-modal-body">
              <div className="rounded-xl overflow-hidden h-64 relative">
                <img
                  src={selectedRoom.image}
                  alt={selectedRoom.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-3 rounded-lg">
                  <span className="text-xs text-slate-500 block">Sức chứa</span>
                  <strong className="text-sm text-slate-800">
                    {selectedRoom.capacityLabel || `${selectedRoom.capacity} khách`}
                  </strong>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <span className="text-xs text-slate-500 block">Giường ngủ</span>
                  <strong className="text-sm text-slate-800">{selectedRoom.bed}</strong>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <span className="text-xs text-slate-500 block">Giá gốc / đêm</span>
                  <strong className="text-sm text-emerald-800">
                    {formatMoney(selectedRoom.price)}
                  </strong>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <span className="text-xs text-slate-500 block">Trạng thái</span>
                  <strong className="text-sm text-slate-800 capitalize">
                    {selectedRoom.status}
                  </strong>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-600 uppercase block mb-1">
                  Mô tả không gian
                </span>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {selectedRoom.description || 'Chưa cập nhật mô tả chi tiết cho phòng này.'}
                </p>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-600 uppercase block mb-2">
                  Tiện nghi trang bị
                </span>
                <div className="flex flex-wrap gap-2">
                  {(selectedRoom.amenities || []).map((a, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg text-xs font-semibold"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="room-modal-foot">
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
      {/* 5. MODAL CẬP NHẬT GIÁ HÀNG LOẠT */}
      {/* ========================================================= */}
      {isBulkPriceModalOpen && (
        <div className="room-modal-backdrop" onClick={() => setIsBulkPriceModalOpen(false)}>
          <div className="room-modal-panel modal-lg" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleApplyBulkPrice}>
              <div className="room-modal-head">
                <div>
                  <h3 className="room-modal-title">Cập nhật giá hàng loạt</h3>
                  <p className="room-modal-desc">
                    Tăng/giảm giá đồng loạt cho các phòng trong mùa cao điểm hoặc khuyến mãi.
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

              <div className="room-modal-body">
                <div>
                  <label className="room-form-label mb-2 block">Chọn danh sách phòng áp dụng</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {roomsList.map((r) => (
                      <label
                        key={r.code}
                        className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 text-xs font-semibold cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={bulkSelectedRooms.includes(r.code)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setBulkSelectedRooms([...bulkSelectedRooms, r.code]);
                            } else {
                              setBulkSelectedRooms(bulkSelectedRooms.filter((c) => c !== r.code));
                            }
                          }}
                        />
                        <span>{r.code}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="room-form-grid-2">
                  <div className="room-form-row">
                    <label className="room-form-label">Phương thức điều chỉnh</label>
                    <select
                      className="room-form-select"
                      value={bulkMode}
                      onChange={(e) => setBulkMode(e.target.value)}
                    >
                      <option value="percent-up">Tăng theo %</option>
                      <option value="percent-down">Giảm theo %</option>
                      <option value="amount-up">Tăng số tiền cố định (₫)</option>
                      <option value="amount-down">Giảm số tiền cố định (₫)</option>
                      <option value="fixed">Đặt giá cố định (₫)</option>
                    </select>
                  </div>
                  <div className="room-form-row">
                    <label className="room-form-label">Giá trị áp dụng</label>
                    <input
                      type="number"
                      required
                      min="0"
                      className="room-form-input"
                      value={bulkValue}
                      onChange={(e) => setBulkValue(Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              <div className="room-modal-foot">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setIsBulkPriceModalOpen(false)}
                >
                  Hủy
                </button>
                <button type="submit" className="btn-modal-save">
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  Áp dụng cho {bulkSelectedRooms.length} phòng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="review-toast">
          <span className="material-symbols-outlined text-emerald-400">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
