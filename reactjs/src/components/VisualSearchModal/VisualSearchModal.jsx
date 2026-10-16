import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { visualSearchService } from '../../services/visualSearchService';
import './VisualSearchModal.css';

export default function VisualSearchModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'url'
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  const fileInputRef = useRef(null);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    resetState();
    onClose();
  };

  const resetState = () => {
    setSelectedFile(null);
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl('');
    setInputUrl('');
    setResults(null);
    setError('');
    setLoading(false);
    setSyncing(false);
    setSyncMessage('');
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn một tập tin hình ảnh hợp lệ (PNG, JPG, WEBP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Dung lượng ảnh tối đa là 10MB.');
      return;
    }

    setError('');
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setResults(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleExecuteSearch = async () => {
    setError('');
    setLoading(true);
    setResults(null);

    try {
      let res;
      let searchedImg = previewUrl;
      if (activeTab === 'upload') {
        if (!selectedFile) {
          setError('Vui lòng chọn hoặc tải lên một bức ảnh trước.');
          setLoading(false);
          return;
        }
        res = await visualSearchService.searchByImage(selectedFile, 12);
      } else {
        if (!inputUrl || !inputUrl.trim()) {
          setError('Vui lòng dán đường dẫn (URL) ảnh.');
          setLoading(false);
          return;
        }
        searchedImg = inputUrl.trim();
        res = await visualSearchService.searchByImageUrl(inputUrl.trim(), 12);
      }

      // Lọc các kết quả có độ tương đồng từ 65% trở lên, loại bỏ các ảnh có % thấp
      const rawList = (res && res.success && Array.isArray(res.data)) ? res.data : [];
      const qualified = rawList.filter((item) => (item.similarity ?? 0) >= 65.0);

      // Khi có kết quả phù hợp: Tự động chuyển sang trang tìm kiếm (độ tương đồng cao nhất xếp ở đầu)
      if (qualified.length > 0) {
        handleClose();
        navigate('/search', {
          state: {
            visualResults: qualified,
            visualSearchImage: searchedImg,
          }
        });
        return;
      } else {
        // Ảnh có độ tương đồng quá thấp hoặc không khớp
        setResults([]);
      }
    } catch (err) {
      console.error('Visual Search error:', err);
      setError(err.message || 'Không thể kết nối đến máy chủ tìm kiếm ảnh.');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncEmbeddings = async () => {
    try {
      setSyncing(true);
      setError('');
      setSyncMessage('Đang chuẩn bị hệ thống...');
      await visualSearchService.setupPgvector();
      
      setSyncMessage('Đang cập nhật dữ liệu hình ảnh (vui lòng chờ trong giây lát)...');
      const res = await visualSearchService.syncEmbeddings();
      
      if (res && res.report) {
        setSyncMessage(`Đã cập nhật dữ liệu thành công (${res.report.success} ảnh)! Bạn hãy bấm "Tìm kiếm ngay" lại nhé.`);
      } else {
        setSyncMessage('Đã cập nhật dữ liệu thành công! Bạn hãy bấm "Tìm kiếm ngay" lại nhé.');
      }
    } catch (err) {
      console.error('Lỗi sync:', err);
      setSyncMessage('Chưa thể cập nhật: ' + (err.message || 'Không thể kết nối'));
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="vsm-overlay" onClick={handleClose}>
      <div className="vsm-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header - Thân thiện người dùng, không thuật ngữ chuyên môn */}
        <div className="vsm-header">
          <div className="vsm-title-wrap">
            <div className="vsm-icon-badge">
              <i className="bi bi-camera-fill" />
            </div>
            <div>
              <h2 className="vsm-title">Tìm kiếm bằng hình ảnh</h2>
              <p className="vsm-subtitle">
                Tải ảnh homestay bạn thích, hệ thống sẽ tìm các chỗ nghỉ có phong cách tương tự nhất
              </p>
            </div>
          </div>
          <button type="button" className="vsm-close-btn" onClick={handleClose} title="Đóng">
            <i className="bi bi-x-lg" />
          </button>
        </div>

        {/* Body */}
        <div className="vsm-body">
          {/* Tabs */}
          <div className="vsm-tabs">
            <button
              type="button"
              className={`vsm-tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
              onClick={() => { setActiveTab('upload'); resetState(); }}
            >
              <i className="bi bi-cloud-arrow-up-fill" /> Tải ảnh từ thiết bị
            </button>
            <button
              type="button"
              className={`vsm-tab-btn ${activeTab === 'url' ? 'active' : ''}`}
              onClick={() => { setActiveTab('url'); resetState(); }}
            >
              <i className="bi bi-link-45deg" /> Dán liên kết (URL) ảnh
            </button>
          </div>

          {/* Upload Tab */}
          {activeTab === 'upload' && !selectedFile && (
            <div
              className={`vsm-dropzone ${isDragging ? 'dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                style={{ display: 'none' }}
                onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
              />
              <i className="bi bi-image vsm-dropzone-icon" />
              <div className="vsm-dropzone-text">Kéo thả ảnh vào đây hoặc bấm để chọn tệp</div>
              <div className="vsm-dropzone-hint">Hỗ trợ định dạng JPG, PNG, WEBP (Tối đa 10MB)</div>
            </div>
          )}

          {/* URL Tab */}
          {activeTab === 'url' && !previewUrl && (
            <div className="vsm-url-wrap">
              <input
                type="url"
                className="vsm-url-input"
                placeholder="Dán link ảnh tại đây (vd: https://images.unsplash.com/...)"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                onKeyDown={(e) => { 
                  if (e.key === 'Enter' && inputUrl.trim()) { 
                    setPreviewUrl(inputUrl.trim()); 
                  } 
                }}
              />
              <button
                type="button"
                className="vsm-btn-submit-url"
                onClick={() => { 
                  if (inputUrl.trim()) {
                    setPreviewUrl(inputUrl.trim()); 
                  }
                }}
              >
                Tiếp tục
              </button>
            </div>
          )}

          {/* Selected Image Preview & Action Box */}
          {previewUrl && (
            <div className="vsm-preview-container">
              <div className="vsm-preview-img-box">
                <img src={previewUrl} alt="Ảnh tìm kiếm" />
                {loading && <div className="vsm-laser-line" />}
              </div>
              <div className="vsm-preview-meta">
                <div className="vsm-preview-filename">
                  {selectedFile ? selectedFile.name : 'Ảnh từ liên kết'}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  {loading ? 'Đang tìm kiếm chỗ nghỉ có phong cách tương tự...' : 'Đã tải ảnh lên thành công'}
                </div>
                <div className="vsm-preview-actions">
                  <button
                    type="button"
                    className="vsm-btn-search"
                    disabled={loading}
                    onClick={handleExecuteSearch}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" />
                        Đang tìm kiếm...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-search" />
                        Tìm kiếm ngay
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="vsm-btn-cancel"
                    disabled={loading}
                    onClick={resetState}
                  >
                    Đổi ảnh khác
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="vsm-error-box">
              <i className="bi bi-exclamation-triangle-fill" />
              <span>{error}</span>
            </div>
          )}

          {/* Khi không tìm thấy kết quả hoặc ảnh có % thấp */}
          {results !== null && results.length === 0 && (
            <div className="vsm-empty-box">
              <i className="bi bi-image" />
              <h4>Không tìm thấy ảnh nào giống</h4>
              <p>Ảnh bạn chọn có độ tương đồng quá thấp so với các chỗ nghỉ hiện có. Bạn hãy thử tải ảnh khác rõ nét hơn về phòng ốc hoặc kiến trúc homestay nhé!</p>
              
              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={handleSyncEmbeddings}
                  disabled={syncing}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.65rem 1.25rem',
                    background: '#15803d',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: syncing ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 8px rgba(21, 128, 61, 0.25)'
                  }}
                >
                  <i className={`bi ${syncing ? 'bi-arrow-repeat spin' : 'bi-arrow-clockwise'}`} />
                  {syncing ? 'Đang cập nhật dữ liệu hình ảnh...' : '⚡ Cập nhật dữ liệu tìm kiếm ảnh'}
                </button>
                {syncMessage && (
                  <p style={{ color: '#15803d', fontSize: '0.85rem', fontWeight: 600, margin: '0.25rem 0 0' }}>
                    {syncMessage}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
