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
        <span className="material-symbols-outlined text-success">tune</span>
        <div>
          <h2>Bộ lọc tìm kiếm</h2>
          <p>Chọn theo nhu cầu lưu trú</p>
        </div>
        <button id="clear-filters" className="filter-clear" type="button" onClick={onClearFilters}>
          Xóa lọc
        </button>
      </div>

      <div id="search-filter-groups" className="filter-groups" aria-live="polite">
        {/* Khoảng giá */}
        <section className="filter-group">
          <h3>Giá mỗi đêm</h3>
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
            <h3>Dịch vụ &amp; trải nghiệm</h3>
            {allServices.map((item) => {
              const val = typeof item === 'object' ? item.name : item;
              return (
                <label key={val} className="filter-option">
                  <input
                    type="checkbox"
                    checked={selectedServices.includes(val)}
                    onChange={() => handleToggle(selectedServices, setSelectedServices, val)}
                  />
                  <span>{val}</span>
                </label>
              );
            })}
          </section>
        )}

        {/* Tiện nghi phòng */}
        {allRoomAmenities.length > 0 && (
          <section className="filter-group">
            <h3>Tiện nghi phòng</h3>
            {allRoomAmenities.map((item) => {
              const val = typeof item === 'object' ? item.name : item;
              return (
                <label key={val} className="filter-option">
                  <input
                    type="checkbox"
                    checked={selectedRoomAmenities.includes(val)}
                    onChange={() => handleToggle(selectedRoomAmenities, setSelectedRoomAmenities, val)}
                  />
                  <span>{val}</span>
                </label>
              );
            })}
          </section>
        )}

        {/* Tiện nghi Homestay */}
        {allAmenities.length > 0 && (
          <section className="filter-group">
            <h3>Tiện nghi homestay</h3>
            {allAmenities.map((item) => {
              const val = typeof item === 'object' ? item.name : item;
              return (
                <label key={val} className="filter-option">
                  <input
                    type="checkbox"
                    checked={selectedAmenities.includes(val)}
                    onChange={() => handleToggle(selectedAmenities, setSelectedAmenities, val)}
                  />
                  <span>{val}</span>
                </label>
              );
            })}
          </section>
        )}

        {/* Nhóm du lịch phù hợp */}
        {allTravelGroups.length > 0 && (
          <section className="filter-group">
            <h3>Nhóm du lịch phù hợp</h3>
            {allTravelGroups.map((item) => {
              const val = typeof item === 'object' ? item.name : item;
              return (
                <label key={val} className="filter-option">
                  <input
                    type="checkbox"
                    checked={selectedTravelGroups.includes(val)}
                    onChange={() => handleToggle(selectedTravelGroups, setSelectedTravelGroups, val)}
                  />
                  <span>{val}</span>
                </label>
              );
            })}
          </section>
        )}
      </div>
    </aside>
  );
}
