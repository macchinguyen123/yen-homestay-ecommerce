import { useEffect, useMemo, useState } from 'react';
import './LocalContent.css';

const API = 'http://localhost:8081/api/admin/local-content';
const EMPTY_FORM = { name: '', city: '', location: '', imageUrl: '', description: '', startDate: '', endDate: '', badgeInfo: '' };

async function readApiResponse(response, fallback) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = body.message || body.error || (body.path ? `API ${body.path} trả về lỗi ${response.status}.` : '');
    throw new Error(detail || fallback);
  }
  return body;
}

function inputDate(value) {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : '';
}

function displayDate(value) {
  const normalized = inputDate(value);
  if (!normalized) return value || '—';
  const [year, month, day] = normalized.split('-');
  return `${day}/${month}/${year}`;
}

function statusText(status) {
  return status === 'active' ? 'Đang diễn ra' : status === 'ended' ? 'Đã kết thúc' : 'Sắp diễn ra';
}

export default function LocalContent() {
  const [items, setItems] = useState([]);
  const [homestays, setHomestays] = useState([]);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [selectedHomes, setSelectedHomes] = useState([]);
  const [distanceLabels, setDistanceLabels] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [festivalResponse, homestayResponse] = await Promise.all([
        fetch(`${API}/festivals`),
        fetch(`${API}/homestays`),
      ]);
      const [festivalData, homestayData] = await Promise.all([
        readApiResponse(festivalResponse, 'Không tải được danh sách lễ hội.'),
        readApiResponse(homestayResponse, 'Không tải được danh sách homestay.'),
      ]);
      setItems(festivalData);
      setHomestays(homestayData);
    } catch (e) {
      setError(e.message || 'Không thể kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const cities = useMemo(() => [...new Set(homestays.map(home => home.city).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'vi')), [homestays]);
  const cityHomes = useMemo(() => homestays.filter(home => home.city?.toLocaleLowerCase('vi') === form.city?.toLocaleLowerCase('vi')), [homestays, form.city]);
  const filteredItems = useMemo(() => items.filter(item => {
    const matchesQuery = !query || `${item.name} ${item.city} ${item.location || ''}`.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi'));
    return matchesQuery && (statusFilter === 'all' || item.status === statusFilter);
  }), [items, query, statusFilter]);

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setSelectedHomes([]);
    setDistanceLabels({});
  };

  const createFestival = () => {
    setError('');
    setEditingId(null);
    setForm({ ...EMPTY_FORM, city: cities[0] || '' });
    setSelectedHomes([]);
    setDistanceLabels({});
    setShowModal(true);
  };

  const editFestival = item => {
    setError('');
    setEditingId(item.id);
    setForm({
      ...EMPTY_FORM,
      ...item,
      startDate: inputDate(item.startDate),
      endDate: inputDate(item.endDate),
    });
    setSelectedHomes(item.homestayIds || []);
    setDistanceLabels(Object.fromEntries((item.homestayIds || []).map((id, index) => [id, item.distanceLabels?.[index] || ''])));
    setShowModal(true);
  };

  const toggleHome = id => setSelectedHomes(current => current.includes(id) ? current.filter(selectedId => selectedId !== id) : [...current, id]);

  const saveFestival = async event => {
    event.preventDefault();
    setSaving(true);
    setError('');
    const body = {
      ...form,
      homestayIds: selectedHomes,
      distanceLabels: selectedHomes.map(id => distanceLabels[id] || ''),
    };
    try {
      const response = await fetch(`${API}/festivals${editingId ? `/${editingId}` : ''}`, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await readApiResponse(response, 'Không lưu được lễ hội.');
      const savedId = editingId;
      closeModal();
      setItems(current => {
        const saved = { ...result };
        return savedId
          ? current.map(item => item.id === savedId ? saved : item)
          : [saved, ...current];
      });
    } catch (e) {
      setError(e.message || 'Không thể kết nối máy chủ.');
    } finally {
      setSaving(false);
    }
  };

  const deleteFestival = async id => {
    if (!window.confirm('Xóa lễ hội này và các homestay gợi ý đã gán?')) return;
    setError('');
    try {
      const response = await fetch(`${API}/festivals/${id}`, { method: 'DELETE' });
      await readApiResponse(response, 'Không xóa được lễ hội.');
      await load();
    } catch (e) { setError(e.message); }
  };

  const activeCount = items.filter(item => item.status !== 'ended').length;
  const linkedCount = items.reduce((sum, item) => sum + (item.nearbyHomestays || 0), 0);

  return (
    <div className="local-content-wrapper">
      <div className="local-stats-grid">
        <Stat label="Lễ hội & sự kiện" value={items.length} icon="festival" tone="amber" />
        <Stat label="Tỉnh / thành phố" value={new Set(items.map(item => item.city).filter(Boolean)).size} icon="location_city" tone="green" />
        <Stat label="Sắp & đang diễn ra" value={activeCount} icon="event" tone="blue" />
        <Stat label="Homestay đã gán" value={linkedCount} icon="home_work" tone="rose" />
      </div>

      <div className="content-module-card">
        <div className="module-header-bar">
          <div className="module-title-group">
            <h2><span className="material-symbols-outlined" style={{ color: 'var(--primary-color)' }}>location_on</span>Quản lý nội dung địa phương</h2>
            <span className="module-subtitle">Quản lý lễ hội, thời gian tổ chức và homestay gợi ý trên trang chủ</span>
          </div>
        </div>
        <div className="module-toolbar">
          <div className="toolbar-left">
            <div className="search-box-sm"><span className="material-symbols-outlined">search</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm lễ hội, địa điểm..." /></div>
            <select className="select-filter-sm" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>
              <option value="all">Tất cả trạng thái</option><option value="upcoming">Sắp diễn ra</option><option value="active">Đang diễn ra</option><option value="ended">Đã kết thúc</option>
            </select>
          </div>
          <button type="button" className="btn-admin-primary" onClick={createFestival}><span className="material-symbols-outlined">add</span>Thêm lễ hội</button>
        </div>

        {error && <div role="alert" style={{ margin: 16, padding: 12, color: '#991b1b', background: '#fef2f2', borderRadius: 8 }}>{error}</div>}

        <div className="table-responsive">
          <table className="admin-data-table">
            <thead><tr><th>Lễ hội / Sự kiện</th><th>Tỉnh thành</th><th>Thời gian</th><th>Homestay gợi ý</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="6">Đang tải nội dung...</td></tr> : filteredItems.map(item => (
                <tr key={item.id}>
                  <td><div className="item-name-group"><span className="item-name">{item.name}</span><span className="item-location">{item.location || 'Chưa có địa điểm cụ thể'}</span></div></td>
                  <td>{item.city || '—'}</td>
                  <td>{displayDate(item.startDate)} – {displayDate(item.endDate)}</td>
                  <td><strong style={{ color: '#0284C7' }}>{item.nearbyHomestays || 0} homestay</strong></td>
                  <td><span className={`status-badge ${item.status}`}>{statusText(item.status)}</span></td>
                  <td><div className="action-btns"><button type="button" className="btn-action-icon" title="Chỉnh sửa" onClick={() => editFestival(item)}><span className="material-symbols-outlined">edit</span></button><button type="button" className="btn-action-icon danger" title="Xóa" onClick={() => deleteFestival(item.id)}><span className="material-symbols-outlined">delete</span></button></div></td>
                </tr>
              ))}
              {!loading && filteredItems.length === 0 && <tr><td colSpan="6">{items.length ? 'Không tìm thấy nội dung phù hợp.' : 'Chưa có lễ hội. Hãy thêm lễ hội đầu tiên.'}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="local-content-modal-overlay" role="dialog" aria-modal="true">
          <form className="local-content-modal-container" onSubmit={saveFestival}>
            <div className="modal-header"><h3 className="modal-title"><span className="material-symbols-outlined">{editingId ? 'edit' : 'add_circle'}</span>{editingId ? 'Chỉnh sửa lễ hội' : 'Thêm lễ hội / sự kiện'}</h3><button type="button" className="modal-close-btn" onClick={closeModal}><span className="material-symbols-outlined">close</span></button></div>
            <div className="modal-body">
              <div className="form-field full"><label className="form-label">Tên lễ hội / sự kiện *</label><input required maxLength="255" className="form-input" value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} /></div>
              <div className="form-group-grid">
                <div className="form-field"><label className="form-label">Tỉnh / Thành phố *</label><input required list="local-content-cities" maxLength="255" className="form-input" value={form.city} onChange={event => { setForm(current => ({ ...current, city: event.target.value })); setSelectedHomes([]); }} placeholder="Ví dụ: Đà Lạt" /><datalist id="local-content-cities">{cities.map(city => <option key={city} value={city} />)}</datalist></div>
                <div className="form-field"><label className="form-label">Địa điểm tổ chức</label><input maxLength="255" className="form-input" value={form.location} onChange={event => setForm(current => ({ ...current, location: event.target.value }))} placeholder="Quảng trường, khu vực..." /></div>
                <div className="form-field"><label className="form-label">Ngày bắt đầu</label><input type="date" className="form-input" value={form.startDate || ''} onChange={event => setForm(current => ({ ...current, startDate: event.target.value }))} /></div>
                <div className="form-field"><label className="form-label">Ngày kết thúc</label><input type="date" className="form-input" value={form.endDate || ''} onChange={event => setForm(current => ({ ...current, endDate: event.target.value }))} /></div>
              </div>
              <div className="form-field full"><label className="form-label">Ảnh bìa URL</label><input maxLength="255" className="form-input" value={form.imageUrl || ''} onChange={event => setForm(current => ({ ...current, imageUrl: event.target.value }))} placeholder="https://..." /></div>
              <div className="form-field full"><label className="form-label">Nhãn nổi bật</label><input maxLength="255" className="form-input" value={form.badgeInfo || ''} onChange={event => setForm(current => ({ ...current, badgeInfo: event.target.value }))} placeholder="Ví dụ: Lễ hội mùa hè" /></div>
              <div className="form-field full"><label className="form-label">Mô tả</label><textarea maxLength="512" className="form-textarea" value={form.description || ''} onChange={event => setForm(current => ({ ...current, description: event.target.value }))} /></div>
              <div className="form-field full">
                <label className="form-label">Homestay gợi ý ở {form.city || 'tỉnh/thành đã chọn'}</label>
                <div className="festival-home-picker">
                  {!form.city ? <span>Nhập tỉnh/thành để xem homestay phù hợp.</span> : cityHomes.length === 0 ? <span>Chưa có homestay thuộc tỉnh/thành này.</span> : cityHomes.map(home => (
                    <label className="festival-home-option" key={home.id}>
                      <input type="checkbox" checked={selectedHomes.includes(home.id)} onChange={() => toggleHome(home.id)} />
                      <span className="festival-home-name">{home.name}<small>{home.address || home.city}</small></span>
                      {selectedHomes.includes(home.id) && <input aria-label={`Khoảng cách ${home.name}`} className="form-input festival-distance-input" value={distanceLabels[home.id] || ''} onChange={event => setDistanceLabels(current => ({ ...current, [home.id]: event.target.value }))} placeholder="VD: Cách 500 m" />}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer"><button type="button" className="btn-admin-cancel" onClick={closeModal}>Hủy</button><button type="submit" className="btn-admin-primary" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu nội dung'}</button></div>
          </form>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, icon, tone }) {
  return <div className="stat-card"><div className="stat-info"><span className="stat-label">{label}</span><span className="stat-value">{value}</span></div><div className={`stat-icon-wrapper ${tone}`}><span className="material-symbols-outlined">{icon}</span></div></div>;
}
