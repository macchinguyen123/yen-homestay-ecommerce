import React from 'react';
import './SearchSidebar.css';

export default function SearchSidebar({
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  allServices = [],
  selectedServices = [],
  setSelectedServices,
  allRoomAmenities = [],
  selectedRoomAmenities = [],
  setSelectedRoomAmenities,
  allAmenities = [],
  selectedAmenities = [],
  setSelectedAmenities,
  allTravelGroups = [],
  selectedTravelGroups = [],
  setSelectedTravelGroups,
  onClearFilters
}) {
  const handleToggle = (list, setList, val) => {
    if (list.includes(val)) {
      setList(list.filter((item) => item !== val));
    } else {
      setList([...list, val]);
    }
  };

  const totalActiveFilters =
    selectedServices.length +
    selectedRoomAmenities.length +
    selectedAmenities.length +
    selectedTravelGroups.length +
    (minPrice !== '' ? 1 : 0) +
    (maxPrice !== '' ? 1 : 0);

  return (
    <aside className="search-filter-sidebar" aria-label="Bộ lọc tìm kiếm">
      <div className="filter-heading">
        <i className="bi bi-sliders fs-5 text-success"></i>
        <div>
          <h2>Bộ lọc tìm kiếm</h2>
          <p>Chọn theo nhu cầu lưu trú</p>
        </div>
        {totalActiveFilters > 0 && (
          <button id="clear-filters" className="filter-clear" type="button" onClick={onClearFilters}>
            Xóa lọc ({totalActiveFilters})
          </button>
        )}
      </div>

      {totalActiveFilters > 0 && (
        <div id="active-filter-summary" className="active-filter-summary">
          Đang áp dụng {totalActiveFilters} tiêu chí lọc
        </div>
      )}

      <div id="search-filter-groups" className="filter-groups" aria-live="polite">
        {/* Khoảng giá */}
        <section className="filter-group">
          <h3>Giá mỗi đêm (VNĐ)</h3>
          <div className="price-range">
            <input
              id="filter-min-price"
              type="number"
              min="0"
              placeholder="Từ (VNĐ)"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
            <input
              id="filter-max-price"
              type="number"
              min="0"
              placeholder="Đến (VNĐ)"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
        </section>

        {/* Dịch vụ & trải nghiệm */}
        {allServices.length > 0 && (
          <section className="filter-group">
            <h3>Dịch vụ &amp; Trải nghiệm</h3>
            {allServices.map((service) => (
              <label key={service} className="filter-option">
                <input
                  type="checkbox"
                  checked={selectedServices.includes(service)}
                  onChange={() => handleToggle(selectedServices, setSelectedServices, service)}
                />
                <span>{service}</span>
              </label>
            ))}
          </section>
        )}

        {/* Tiện nghi phòng */}
        {allRoomAmenities.length > 0 && (
          <section className="filter-group">
            <h3>Tiện nghi phòng</h3>
            {allRoomAmenities.map((roomAmenity) => (
              <label key={roomAmenity} className="filter-option">
                <input
                  type="checkbox"
                  checked={selectedRoomAmenities.includes(roomAmenity)}
                  onChange={() => handleToggle(selectedRoomAmenities, setSelectedRoomAmenities, roomAmenity)}
                />
                <span>{roomAmenity}</span>
              </label>
            ))}
          </section>
        )}

        {/* Tiện nghi Homestay */}
        {allAmenities.length > 0 && (
          <section className="filter-group">
            <h3>Tiện nghi homestay</h3>
            {allAmenities.map((amenity) => (
              <label key={amenity} className="filter-option">
                <input
                  type="checkbox"
                  checked={selectedAmenities.includes(amenity)}
                  onChange={() => handleToggle(selectedAmenities, setSelectedAmenities, amenity)}
                />
                <span>{amenity}</span>
              </label>
            ))}
          </section>
        )}

        {/* Nhóm du lịch phù hợp */}
        {allTravelGroups.length > 0 && (
          <section className="filter-group">
            <h3>Nhóm du lịch phù hợp</h3>
            {allTravelGroups.map((group) => (
              <label key={group} className="filter-option">
                <input
                  type="checkbox"
                  checked={selectedTravelGroups.includes(group)}
                  onChange={() => handleToggle(selectedTravelGroups, setSelectedTravelGroups, group)}
                />
                <span>{group}</span>
              </label>
            ))}
          </section>
        )}
      </div>
    </aside>
  );
}
