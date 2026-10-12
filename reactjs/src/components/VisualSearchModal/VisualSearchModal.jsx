import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { visualSearchService } from '../../services/visualSearchService';
import './VisualSearchModal.css';

export default function VisualSearchModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'url'
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

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
      if (activeTab === 'upload') {
        if (!selectedFile) {
          setError('Vui lòng chọn hoặc tải lên một bức ảnh trước.');
          setLoading(false);
          return;
        }
        res = await visualSearchService.searchByImage(selectedFile, 8);
      } else {
        if (!inputUrl || !inputUrl.trim()) {
          setError('Vui lòng dán đường dẫn (URL) ảnh.');
          setLoading(false);
          return;
        }
        res = await visualSearchService.searchByImageUrl(inputUrl.trim(), 8);
      }

      if (res && res.success && Array.isArray(res.data)) {
        setResults(res.data);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error('Visual Search error:', err);
      setError(err.message || 'Không thể kết nối đến máy chủ AI tìm kiếm ảnh.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vsm-overlay" onClick={handleClose}>
      <div className="vsm-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="vsm-header">
          <div className="vsm-title-wrap">
            <div className="vsm-icon-badge">
              <i className="bi bi-camera-fill" />
            </div>
            <div>
              <h2 className="vsm-title">
                Tìm kiếm bằng hình ảnh
                <span className="vsm-model-tag">AI CLIP ViT-B/32</span>
              </h2>
              <p className="vsm-subtitle">
                Tải ảnh homestay/phòng ưng ý, AI sẽ quét đặc trưng vector & gợi ý chỗ nghỉ tương đồng nhất
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
                onKeyDown={(e) => { if (e.key === 'Enter') { setPreviewUrl(inputUrl); handleExecuteSearch(); } }}
              />
              <button
                type="button"
                className="vsm-btn-submit-url"
                onClick={() => { setPreviewUrl(inputUrl); handleExecuteSearch(); }}
              >
                Tiếp tục
              </button>
            </div>
          )}

          {/* Selected Image Preview & Scan Box */}
          {previewUrl && (
            <div className="vsm-preview-container">
              <div className="vsm-preview-img-box">
                <img src={previewUrl} alt="Ảnh tìm kiếm" />
                {loading && <div className="vsm-laser-line" />}
              </div>
              <div className="vsm-preview-meta">
                <div className="vsm-preview-filename">
                  {selectedFile ? selectedFile.name : 'Ảnh từ liên kết URL'}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                  {loading ? 'AI đang phân tích đặc trưng ảnh (Vector 512)...' : 'Đã tải ảnh lên thành công'}
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
                        Đang quét vector...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-magic" />
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

          {/* Results List */}
          {results !== null && (
            <div>
              <div className="vsm-results-heading">
                <h3 className="vsm-results-title">
                  <i className="bi bi-stars text-warning" /> Homestay tương đồng nhất
                </h3>
                <span className="vsm-results-count">{results.length} kết quả</span>
              </div>

              {results.length === 0 ? (
                <div className="vsm-empty-box">
                  <i className="bi bi-search" />
                  <h4>Chưa tìm thấy homestay tương đồng</h4>
                  <p>Hãy thử tải ảnh rõ nét hơn về kiến trúc hoặc phòng ốc homestay nhé!</p>
                </div>
              ) : (
                <div className="vsm-results-grid">
                  {results.map((item) => (
                    <Link
                      key={item.homestayId}
                      to={`/homestay/${item.homestayId}`}
                      className="vsm-result-card"
                      onClick={handleClose}
                    >
                      <div className="vsm-card-thumb-wrap">
                        <img
                          src={item.matchedImageUrl || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=300&q=80'}
                          alt={item.name}
                          className="vsm-card-thumb"
                        />
                        <span className="vsm-card-match-badge">
                          {item.similarity}% Giống
                        </span>
                      </div>
                      <div className="vsm-card-info">
                        <div>
                          <h4 className="vsm-card-name" title={item.name}>
                            {item.name}
                          </h4>
                          <div className="vsm-card-loc">
                            <i className="bi bi-geo-alt-fill text-success" />
                            <span>{item.city || item.address || 'Việt Nam'}</span>
                          </div>
                        </div>
                        <div className="vsm-card-price-row">
                          <span className="vsm-card-price">
                            {item.basePrice ? Number(item.basePrice).toLocaleString('vi-VN') + 'đ' : 'Liên hệ'}
                          </span>
                          <span className="vsm-card-rating">
                            <i className="bi bi-star-fill" /> {item.rating || 5.0}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
