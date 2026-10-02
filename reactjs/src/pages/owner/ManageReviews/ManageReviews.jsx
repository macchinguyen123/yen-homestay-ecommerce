import React, { useState, useMemo } from 'react';
import './ManageReviews.css';
import { initialReviewsData } from './manageReviewsData';

export default function ManageReviews() {
  const [reviewsList, setReviewsList] = useState(initialReviewsData.reviews);
  const [activeFilter, setActiveFilter] = useState('all'); // all, unreplied, 5, 4, 3, 2, 1
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('Tất cả loại phòng');

  // Quản lý input phản hồi từng review (theo review ID)
  const [replyInputs, setReplyInputs] = useState({});
  const [replyVoucher, setReplyVoucher] = useState({});
  const [toastMessage, setToastMessage] = useState(null);

  // Hiển thị toast thông báo
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Tính toán số liệu thống kê realtime theo danh sách reviews
  const dynamicStats = useMemo(() => {
    const total = reviewsList.length;
    const unreplied = reviewsList.filter((r) => !r.reply).length;
    const replied = total - unreplied;
    const responseRate = total > 0 ? ((replied / total) * 100).toFixed(1) : 100;
    const mediaCount = reviewsList.filter((r) => r.images && r.images.length > 0).length;
    const avgScore = (
      reviewsList.reduce((sum, r) => sum + r.rating, 0) / (total || 1)
    ).toFixed(2);

    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviewsList.forEach((r) => {
      if (counts[r.rating] !== undefined) {
        counts[r.rating]++;
      }
    });

    return {
      total,
      unreplied,
      responseRate,
      mediaCount,
      avgScore,
      counts
    };
  }, [reviewsList]);

  // Bộ lọc reviews
  const filteredReviews = useMemo(() => {
    return reviewsList.filter((r) => {
      // 1. Lọc theo tab
      if (activeFilter === 'unreplied' && r.reply) return false;
      if (['5', '4', '3', '2', '1'].includes(activeFilter) && r.rating !== parseInt(activeFilter, 10)) {
        return false;
      }

      // 2. Lọc theo phòng
      if (selectedRoom !== 'Tất cả loại phòng' && !r.roomName.toLowerCase().includes(selectedRoom.toLowerCase())) {
        return false;
      }

      // 3. Tìm kiếm theo tên khách hoặc nội dung
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = r.customerName.toLowerCase().includes(q);
        const matchContent = r.content.toLowerCase().includes(q);
        const matchRoom = r.roomName.toLowerCase().includes(q);
        if (!matchName && !matchContent && !matchRoom) return false;
      }

      return true;
    });
  }, [reviewsList, activeFilter, selectedRoom, searchQuery]);

  // Cập nhật textarea phản hồi
  const handleReplyChange = (reviewId, text) => {
    setReplyInputs((prev) => ({ ...prev, [reviewId]: text }));
  };

  // Chọn mẫu câu phản hồi nhanh
  const handleSelectQuickTemplate = (reviewId, templateText) => {
    setReplyInputs((prev) => ({
      ...prev,
      [reviewId]: templateText
    }));
  };

  // Tùy chọn đính kèm voucher tri ân
  const handleToggleVoucher = (reviewId) => {
    setReplyVoucher((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId]
    }));
  };

  // Gửi phản hồi
  const handleSendReply = (reviewId, customerName) => {
    const text = replyInputs[reviewId]?.trim();
    if (!text) {
      showToast('⚠️ Vui lòng nhập nội dung phản hồi trước khi gửi!');
      return;
    }

    const attachVoucher = replyVoucher[reviewId];

    setReviewsList((prev) =>
      prev.map((r) => {
        if (r.id === reviewId) {
          return {
            ...r,
            reply: {
              hostName: 'Nhà Sàn Mộc (Chủ nhà An)',
              repliedAt: 'Vừa xong',
              voucherCode: attachVoucher ? 'TRIANMOC10' : null,
              content: text
            }
          };
        }
        return r;
      })
    );

    // Clear input
    setReplyInputs((prev) => ({ ...prev, [reviewId]: '' }));
    showToast(`Đã gửi phản hồi thành công đến du khách ${customerName}! 🎉`);
  };

  // Màu sắc avatar khách hàng theo initial
  const getAvatarColorClass = (index) => {
    const classes = ['c1', 'c2', 'c3', 'c4', 'c5'];
    return classes[index % classes.length];
  };

  return (
    <div className="manage-reviews-container">
      {/* Banner Giới Thiệu */}
      <div className="reviews-banner">
        <div className="banner-glow" />
        <div className="banner-content">
          <div className="banner-tag">
            <span className="material-symbols-outlined text-[15px]">verified</span>
            Trung tâm chăm sóc du khách
          </div>
          <h1 className="banner-title">Quản lý Đánh giá &amp; Phản hồi du khách</h1>
          <p className="banner-subtitle">
            Lắng nghe trải nghiệm thực tế, tương tác gắn kết và nâng cấp chất lượng dịch vụ lưu trú.
          </p>
        </div>
        <div className="banner-actions">
          <button
            type="button"
            className="btn-send-reply"
            onClick={() => showToast('Đang đồng bộ dữ liệu đánh giá từ OTA và Website...')}
          >
            <span className="material-symbols-outlined text-[16px]">sync</span>
            Đồng bộ đánh giá
          </button>
        </div>
      </div>

      {/* Thẻ Thống Kê Nhanh (Metric Highlights) */}
      <div className="reviews-stats-grid">
        {/* Điểm TB */}
        <div className="stat-card-modern">
          <div>
            <div className="stat-header-modern">
              <span className="stat-title-modern">Điểm đánh giá TB</span>
              <div className="stat-icon-wrapper amber">
                <span className="material-symbols-outlined">grade</span>
              </div>
            </div>
            <div className="stat-value-modern primary-green">
              {dynamicStats.avgScore}
              <span className="stat-unit">/5.0</span>
            </div>
          </div>
          <div className="stat-subtext">Xếp hạng Xuất Sắc tại Mai Châu</div>
        </div>

        {/* Tỷ Lệ Phản Hồi */}
        <div className="stat-card-modern">
          <div>
            <div className="stat-header-modern">
              <span className="stat-title-modern">Tỷ lệ phản hồi</span>
              <div className="stat-icon-wrapper emerald">
                <span className="material-symbols-outlined">forum</span>
              </div>
            </div>
            <div className="stat-value-modern">{dynamicStats.responseRate}%</div>
          </div>
          <div className="stat-subtext">Thời gian phản hồi TB: &lt; 2 giờ</div>
        </div>

        {/* Chưa Phản Hồi */}
        <div className="stat-card-modern">
          <div>
            <div className="stat-header-modern">
              <span className="stat-title-modern">Chưa phản hồi</span>
              <div className="stat-icon-wrapper red">
                <span className="material-symbols-outlined">error</span>
              </div>
            </div>
            <div className="stat-value-modern alert-red">
              {String(dynamicStats.unreplied).padStart(2, '0')}
              <span className="stat-unit"> lượt</span>
            </div>
          </div>
          <div className="stat-subtext">Cần ưu tiên xử lý trong ngày</div>
        </div>

        {/* Có Ảnh & Video */}
        <div className="stat-card-modern">
          <div>
            <div className="stat-header-modern">
              <span className="stat-title-modern">Có ảnh &amp; video</span>
              <div className="stat-icon-wrapper sky">
                <span className="material-symbols-outlined">photo_library</span>
              </div>
            </div>
            <div className="stat-value-modern">
              {dynamicStats.mediaCount}
              <span className="stat-unit"> lượt</span>
            </div>
          </div>
          <div className="stat-subtext">Nguồn tư liệu thực tế dồi dào</div>
        </div>
      </div>

      {/* Thanh Bộ Lọc & Tìm Kiếm */}
      <div className="reviews-filter-bar">
        <div className="filter-btn-group">
          <button
            type="button"
            className={`filter-tab-btn ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            Tất cả đánh giá ({dynamicStats.total})
          </button>
          <button
            type="button"
            className={`filter-tab-btn ${activeFilter === 'unreplied' ? 'active' : ''}`}
            onClick={() => setActiveFilter('unreplied')}
          >
            Chưa phản hồi
            {dynamicStats.unreplied > 0 && (
              <span className="filter-badge-unreplied">{dynamicStats.unreplied}</span>
            )}
          </button>
          <button
            type="button"
            className={`filter-tab-btn ${activeFilter === '5' ? 'active' : ''}`}
            onClick={() => setActiveFilter('5')}
          >
            5 Sao ({dynamicStats.counts[5]})
          </button>
          <button
            type="button"
            className={`filter-tab-btn ${activeFilter === '4' ? 'active' : ''}`}
            onClick={() => setActiveFilter('4')}
          >
            4 Sao ({dynamicStats.counts[4]})
          </button>
          <button
            type="button"
            className={`filter-tab-btn ${activeFilter === '3' ? 'active' : ''}`}
            onClick={() => setActiveFilter('3')}
          >
            3 Sao ({dynamicStats.counts[3]})
          </button>
          <button
            type="button"
            className={`filter-tab-btn ${activeFilter === '2' ? 'active' : ''}`}
            onClick={() => setActiveFilter('2')}
          >
            2 Sao ({dynamicStats.counts[2]})
          </button>
          <button
            type="button"
            className={`filter-tab-btn ${activeFilter === '1' ? 'active' : ''}`}
            onClick={() => setActiveFilter('1')}
          >
            1 Sao ({dynamicStats.counts[1]})
          </button>
        </div>

        <div className="filter-tools">
          <div className="search-input-box">
            <span className="material-symbols-outlined">search</span>
            <input
              type="text"
              placeholder="Tìm theo tên khách, nội dung..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            className="select-room-filter"
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
          >
            {initialReviewsData.roomTypes.map((type, idx) => (
              <option key={idx} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Khung Nội Dung Chính: 2 Cột */}
      <div className="reviews-main-grid">
        {/* Cột Trái (8 phần): Danh Sách Đánh Giá */}
        <div className="reviews-list-col">
          {filteredReviews.length === 0 ? (
            <div className="empty-reviews-state">
              <span className="material-symbols-outlined">sentiment_dissatisfied</span>
              <p>Không tìm thấy đánh giá nào phù hợp với bộ lọc hiện tại.</p>
            </div>
          ) : (
            filteredReviews.map((review, index) => {
              const hasReplied = Boolean(review.reply);
              const isUnreplied = !hasReplied;

              return (
                <div key={review.id} className="review-item-card">
                  {/* Tiêu đề & Thông tin khách */}
                  <div className="review-user-row">
                    <div className="reviewer-meta-box">
                      <div className={`reviewer-avatar-circle ${getAvatarColorClass(index)}`}>
                        {review.customerInitials}
                      </div>
                      <div className="reviewer-details">
                        <h4>
                          {review.customerName}
                          <span
                            className={`customer-tag ${
                              review.customerType.includes('quen') ? 'vip' : ''
                            }`}
                          >
                            {review.customerType}
                          </span>
                        </h4>
                        <p className="stay-subinfo">
                          <span className="material-symbols-outlined text-[15px]">door_open</span>
                          {review.roomName} • Lưu trú: {review.stayPeriod}
                        </p>
                      </div>
                    </div>

                    <div className="review-stars-box">
                      <div className="star-rating-icons">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <i
                            key={s}
                            className={`bi ${s <= review.rating ? 'bi-star-fill' : 'bi-star'}`}
                          />
                        ))}
                      </div>
                      <span className="time-label">{review.createdAt}</span>
                      {isUnreplied && (
                        <span className="badge-unreplied-pill">Chưa phản hồi</span>
                      )}
                    </div>
                  </div>

                  {/* Nội dung đánh giá */}
                  <p className="review-comment-body">{review.content}</p>

                  {/* Ảnh đính kèm (nếu có) */}
                  {review.images && review.images.length > 0 && (
                    <div className="review-media-gallery">
                      {review.images.map((img, imgIdx) => (
                        <div key={imgIdx} className="media-thumbnail-wrap">
                          <img src={img.url} alt={img.caption || 'Ảnh review'} />
                          {img.caption && (
                            <span className="media-caption-badge">{img.caption}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Nếu ĐÃ phản hồi: Hiển thị hộp phản hồi của Chủ nhà */}
                  {hasReplied && (
                    <div className="existing-reply-box">
                      <div className="existing-reply-header">
                        <span className="host-signature">
                          <span className="material-symbols-outlined text-[16px]">
                            subheader_pawn
                          </span>
                          Phản hồi từ {review.reply.hostName} • {review.reply.repliedAt}
                        </span>
                        {review.reply.voucherCode && (
                          <span className="voucher-badge">
                            Đã gửi voucher {review.reply.voucherCode}
                          </span>
                        )}
                      </div>
                      <p className="existing-reply-text">{review.reply.content}</p>
                    </div>
                  )}

                  {/* Nếu CHƯA phản hồi: Hiển thị form soạn phản hồi nhanh */}
                  {isUnreplied && (
                    <div className="reply-input-section">
                      <div className="reply-input-header">
                        <span className="target-customer-label">
                          <span className="material-symbols-outlined text-[16px] text-secondary">
                            chat
                          </span>
                          Gửi phản hồi cho bạn {review.customerName}
                        </span>
                        <span className="quick-templates-title">Gợi ý câu mẫu nhanh:</span>
                      </div>

                      {/* Gợi ý mẫu phản hồi nhanh */}
                      <div className="quick-templates-list">
                        {initialReviewsData.quickTemplates.map((tpl) => (
                          <button
                            key={tpl.id}
                            type="button"
                            className="quick-template-chip"
                            onClick={() => handleSelectQuickTemplate(review.id, tpl.text)}
                          >
                            {tpl.tone}
                          </button>
                        ))}
                      </div>

                      {/* Textarea nhập nội dung */}
                      <textarea
                        className="reply-textarea"
                        placeholder="Nhập lời cảm ơn hoặc giải đáp của Nhà Sàn Mộc tới du khách..."
                        value={replyInputs[review.id] || ''}
                        onChange={(e) => handleReplyChange(review.id, e.target.value)}
                      />

                      {/* Thanh công cụ phụ */}
                      <div className="reply-footer-bar">
                        <div className="flex items-center gap-3">
                          <span className="ai-tone-hint">
                            <span className="material-symbols-outlined text-[15px]">
                              auto_awesome
                            </span>
                            AI Tone: Lịch thiệp &amp; Mộc mạc
                          </span>
                          <label className="voucher-checkbox-label">
                            <input
                              type="checkbox"
                              checked={Boolean(replyVoucher[review.id])}
                              onChange={() => handleToggleVoucher(review.id)}
                            />
                            Tặng voucher tri ân (10%)
                          </label>
                        </div>

                        <div className="reply-action-btns">
                          <button
                            type="button"
                            className="btn-draft"
                            onClick={() => showToast('Đã lưu bản nháp thành công!')}
                          >
                            Lưu nháp
                          </button>
                          <button
                            type="button"
                            className="btn-send-reply"
                            onClick={() => handleSendReply(review.id, review.customerName)}
                          >
                            Gửi phản hồi
                            <span className="material-symbols-outlined text-[15px]">send</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Cột Phải (4 phần): Phân Tích Tiêu Chí & Thẻ Superhost */}
        <div className="reviews-side-col">
          {/* Phân Tích Tiêu Chí Đánh Giá */}
          <div className="side-panel-card">
            <div className="panel-card-header">
              <h3>Phân tích chi tiết tiêu chí</h3>
              <span className="badge-verified-guest">100% Khách thật</span>
            </div>

            <div className="criteria-list-modern">
              {initialReviewsData.criteriaAnalysis.map((item, idx) => (
                <div key={idx} className="criteria-row-modern">
                  <div className="criteria-label-row">
                    <span className="criteria-title">{item.name}</span>
                    <strong className="criteria-score">
                      {item.score.toFixed(2)} / {item.max.toFixed(1)}
                    </strong>
                  </div>
                  <div className="criteria-track">
                    <div
                      className="criteria-fill"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="positive-trend-pill">
              <span>Đánh giá tích cực tháng này:</span>
              <strong>
                +24 lượt mới
                <span className="material-symbols-outlined text-[16px]">trending_up</span>
              </strong>
            </div>
          </div>

          {/* Từ Khóa Nhắc Nhiều Nhất */}
          <div className="side-panel-card">
            <div className="panel-card-header">
              <h3>Từ khóa nhắc nhiều nhất</h3>
              <span className="material-symbols-outlined text-slate-400 text-[18px]">tag</span>
            </div>

            <div className="keywords-bubble-group">
              {initialReviewsData.frequentKeywords.map((kw, idx) => (
                <span
                  key={idx}
                  className={`keyword-bubble ${kw.highlight ? 'highlight' : 'normal'}`}
                >
                  {kw.text}
                  <small>{kw.count}x</small>
                </span>
              ))}
            </div>
          </div>

          {/* Banner Huy Hiệu Host Xuất Sắc */}
          <div className="superhost-banner-card">
            <div className="superhost-icon-circle">
              <span className="material-symbols-outlined">workspace_premium</span>
            </div>
            <h4>Huy hiệu Chủ Nhà Ưu Tú (Superhost)</h4>
            <p>
              Homestay của bạn duy trì mức phản hồi trên 98% và điểm trung bình 4.9+ trong 3 quý liên tiếp.
            </p>
            <button
              type="button"
              className="btn-superhost-share"
              onClick={() => showToast('Đã sao chép link chứng nhận Chủ nhà ưu tú!')}
            >
              Chia sẻ huy hiệu
            </button>
          </div>
        </div>
      </div>

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
