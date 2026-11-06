import React from 'react';
import './SearchSidebar.css';

const QUICK_PRICE_RANGES = [
  { label: 'Tất cả', min: '', max: '' },
  { label: '< 500k', min: '0', max: '500000' },
  { label: '500k – 1tr', min: '500000', max: '1000000' },
  { label: '1tr – 2tr', min: '1000000', max: '2000000' },
  { label: '> 2tr', min: '2000000', max: '' },
];

const getFilterIconClass = (name) => {
  const n = (name || '').toLowerCase();
  if (n.includes('ăn sáng')) return 'bi-cup-hot';
  if (n.includes('đưa đón') || n.includes('sân bay')) return 'bi-airplane';
  if (n.includes('thuê xe') || n.includes('xe máy')) return 'bi-scooter';
  if (n.includes('săn mây')) return 'bi-cloud-sun';
  if (n.includes('lò sưởi') || n.includes('lửa trại')) return 'bi-fire';
  if (n.includes('bồn tắm')) return 'bi-water';
  if (n.includes('ban công') || n.includes('view')) return 'bi-sunset';
  if (n.includes('bếp')) return 'bi-egg-fried';
  if (n.includes('hồ bơi')) return 'bi-water';
  if (n.includes('bãi đậu') || n.includes('đậu xe') || n.includes('đỗ xe')) return 'bi-p-circle';
  if (n.includes('wifi')) return 'bi-wifi';
  if (n.includes('bbq') || n.includes('nướng')) return 'bi-fire';
  if (n.includes('cặp đôi')) return 'bi-heart';
  if (n.includes('gia đình')) return 'bi-people';
  if (n.includes('nhóm')) return 'bi-person-badge';
  if (n.includes('một mình') || n.includes('đơn')) return 'bi-person';
  if (n.includes('thú cưng')) return 'bi-balloon-heart';
  if (n.includes('vườn') || n.includes('nông trại')) return 'bi-tree';
  if (n.includes('máy lạnh') || n.includes('điều hòa')) return 'bi-snow';
  return 'bi-check2-circle';
};

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

  const isQuickPriceActive = (item) => {
    return String(minPrice || '') === String(item.min) && String(maxPrice || '') === String(item.max);
  };

  const handleQuickPrice = (item) => {
    setMinPrice(item.min);
    setMaxPrice(item.max);
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
      {/* Header bộ lọc */}
      <div className="filter-heading">
        <div className="filter-heading-icon">
          <i className="bi bi-sliders2-vertical" />
        </div>
        <div className="filter-heading-text">
          <div className="filter-title-row">
            <h2>Bộ lọc tìm kiếm</h2>
            {totalActiveFilters > 0 && (
              <span className="active-filter-badge">{totalActiveFilters}</span>
            )}
          </div>
          <p>Tùy chọn chỗ nghỉ theo nhu cầu</p>
        </div>
        {totalActiveFilters > 0 && (
          <button id="clear-filters" className="filter-clear" type="button" onClick={onClearFilters} title="Xóa tất cả bộ lọc">
            <i className="bi bi-arrow-counterclockwise" /> Xóa lọc
          </button>
        )}
      </div>

      <div id="search-filter-groups" className="filter-groups" aria-live="polite">
        {/* Khoảng giá */}
        <section className="filter-group">
          <div className="filter-group-header">
            <i className="bi bi-cash-coin group-icon" />
            <h3>Giá mỗi đêm</h3>
          </div>

          {/* Quick chips chọn nhanh khoảng giá */}
          <div className="quick-price-chips">
            {QUICK_PRICE_RANGES.map((range, idx) => (
              <button
                key={idx}
                type="button"
                className={`quick-price-chip ${isQuickPriceActive(range) ? 'active' : ''}`}
                onClick={() => handleQuickPrice(range)}
              >
                {range.label}
              </button>
            ))}
          </div>

          <div className="price-range">
            <div className="price-input-wrapper">
              <span className="price-prefix">Từ</span>
              <input
                id="filter-min-price"
                type="number"
                min="0"
                step="50000"
                placeholder="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
              <span className="price-unit">₫</span>
            </div>
            <div className="price-separator">—</div>
            <div className="price-input-wrapper">
              <span className="price-prefix">Đến</span>
              <input
                id="filter-max-price"
                type="number"
                min="0"
                step="50000"
                placeholder="Tối đa"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
              <span className="price-unit">₫</span>
            </div>
          </div>
        </section>

        {/* Dịch vụ & trải nghiệm */}
        {allServices.length > 0 && (
          <section className="filter-group">
            <div className="filter-group-header">
              <i className="bi bi-stars group-icon" />
              <h3>Dịch vụ &amp; trải nghiệm</h3>
              {selectedServices.length > 0 && (
                <span className="group-active-count">{selectedServices.length}</span>
              )}
            </div>
            <div className="filter-options-list">
              {allServices.map((item) => {
                const val = typeof item === 'object' ? item.name : item;
                const count = typeof item === 'object' ? item.count : null;
                const isChecked = selectedServices.includes(val);
                return (
                  <label key={val} className={`filter-option ${isChecked ? 'selected' : ''}`}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggle(selectedServices, setSelectedServices, val)}
                    />
                    <span className="filter-custom-checkbox">
                      <i className="bi bi-check-lg" />
                    </span>
                    <i className={`bi ${getFilterIconClass(val)} filter-item-icon`} />
                    <span className="filter-item-label">{val}</span>
                    {count !== null && <span className="filter-item-count">{count}</span>}
                  </label>
                );
              })}
            </div>
          </section>
        )}

        {/* Tiện nghi phòng */}
        {allRoomAmenities.length > 0 && (
          <section className="filter-group">
            <div className="filter-group-header">
              <i className="bi bi-door-open group-icon" />
              <h3>Tiện nghi phòng</h3>
              {selectedRoomAmenities.length > 0 && (
                <span className="group-active-count">{selectedRoomAmenities.length}</span>
              )}
            </div>
            <div className="filter-options-list">
              {allRoomAmenities.map((item) => {
                const val = typeof item === 'object' ? item.name : item;
                const count = typeof item === 'object' ? item.count : null;
                const isChecked = selectedRoomAmenities.includes(val);
                return (
                  <label key={val} className={`filter-option ${isChecked ? 'selected' : ''}`}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggle(selectedRoomAmenities, setSelectedRoomAmenities, val)}
                    />
                    <span className="filter-custom-checkbox">
                      <i className="bi bi-check-lg" />
                    </span>
                    <i className={`bi ${getFilterIconClass(val)} filter-item-icon`} />
                    <span className="filter-item-label">{val}</span>
                    {count !== null && <span className="filter-item-count">{count}</span>}
                  </label>
                );
              })}
            </div>
          </section>
        )}

        {/* Tiện nghi Homestay */}
        {allAmenities.length > 0 && (
          <section className="filter-group">
            <div className="filter-group-header">
              <i className="bi bi-house-heart group-icon" />
              <h3>Tiện nghi homestay</h3>
              {selectedAmenities.length > 0 && (
                <span className="group-active-count">{selectedAmenities.length}</span>
              )}
            </div>
            <div className="filter-options-list">
              {allAmenities.map((item) => {
                const val = typeof item === 'object' ? item.name : item;
                const count = typeof item === 'object' ? item.count : null;
                const isChecked = selectedAmenities.includes(val);
                return (
                  <label key={val} className={`filter-option ${isChecked ? 'selected' : ''}`}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggle(selectedAmenities, setSelectedAmenities, val)}
                    />
                    <span className="filter-custom-checkbox">
                      <i className="bi bi-check-lg" />
                    </span>
                    <i className={`bi ${getFilterIconClass(val)} filter-item-icon`} />
                    <span className="filter-item-label">{val}</span>
                    {count !== null && <span className="filter-item-count">{count}</span>}
                  </label>
                );
              })}
            </div>
          </section>
        )}

        {/* Nhóm du lịch phù hợp */}
        {allTravelGroups.length > 0 && (
          <section className="filter-group">
            <div className="filter-group-header">
              <i className="bi bi-people group-icon" />
              <h3>Nhóm du lịch phù hợp</h3>
              {selectedTravelGroups.length > 0 && (
                <span className="group-active-count">{selectedTravelGroups.length}</span>
              )}
            </div>
            <div className="filter-options-list">
              {allTravelGroups.map((item) => {
                const val = typeof item === 'object' ? item.name : item;
                const count = typeof item === 'object' ? item.count : null;
                const isChecked = selectedTravelGroups.includes(val);
                return (
                  <label key={val} className={`filter-option ${isChecked ? 'selected' : ''}`}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggle(selectedTravelGroups, setSelectedTravelGroups, val)}
                    />
                    <span className="filter-custom-checkbox">
                      <i className="bi bi-check-lg" />
                    </span>
                    <i className={`bi ${getFilterIconClass(val)} filter-item-icon`} />
                    <span className="filter-item-label">{val}</span>
                    {count !== null && <span className="filter-item-count">{count}</span>}
                  </label>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </aside>
  );
}
