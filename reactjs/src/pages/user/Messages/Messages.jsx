import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { chatService } from '../../../services/chatService';
import './Messages.css';

// Chuyển đổi timestamp ISO / string sang giờ Việt Nam (UTC+7) chuẩn xác
const formatVNTime = (timeStr) => {
  if (!timeStr) return '';
  try {
    let dateStr = String(timeStr).trim();
    if (!dateStr.endsWith('Z') && !dateStr.includes('+') && !dateStr.includes('-')) {
      dateStr += 'Z';
    } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(dateStr)) {
      dateStr += 'Z';
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      return new Date(timeStr).toLocaleTimeString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return d.toLocaleTimeString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '';
  }
};

const formatVNDate = (timeStr) => {
  if (!timeStr) return '';
  try {
    let dateStr = String(timeStr).trim();
    if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/.test(dateStr) && !dateStr.endsWith('Z') && !dateStr.includes('+')) {
      dateStr = dateStr.replace(' ', 'T') + 'Z';
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '' : d.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  } catch {
    return '';
  }
};

export default function Messages() {
  const loc = useLocation();
  const u = JSON.parse(localStorage.getItem('user') || '{}');
  const [list, setList] = useState([]);
  const [active, setActive] = useState(loc.state?.conversation || null);
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  
  // Danh sách các ảnh đang ở hàng đợi (pending queue trước khi gửi)
  // Mỗi item: { id: string, dataUrl: string, name: string }
  const [pendingImages, setPendingImages] = useState([]);
  
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);
  
  const fileInputRef = useRef(null);
  const messageListRef = useRef(null);
  const isInitialLoadRef = useRef(true);
  const prevMsgCountRef = useRef(0);

  const load = async () => {
    try {
      const d = await chatService.list();
      setList(d);
      if (!active && d[0]) setActive(d[0]);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const scrollToBottom = (behavior = 'smooth') => {
    if (messageListRef.current) {
      messageListRef.current.scrollTo({
        top: messageListRef.current.scrollHeight,
        behavior
      });
    }
  };

  useEffect(() => {
    if (!active) return;
    isInitialLoadRef.current = true;
    prevMsgCountRef.current = 0;

    const fetchMsgs = async (isPolling = false) => {
      try {
        const data = await chatService.messages(active.conversation_id);
        setMsgs((prev) => {
          const isFirstTime = isInitialLoadRef.current;
          const hasNewMessages = data.length > prevMsgCountRef.current;

          if (isFirstTime) {
            isInitialLoadRef.current = false;
            setTimeout(() => scrollToBottom('auto'), 50);
          } else if (hasNewMessages) {
            setTimeout(() => scrollToBottom('smooth'), 50);
          }

          prevMsgCountRef.current = data.length;
          return data;
        });
      } catch (e) {
        if (!isPolling) setError(e.message);
      }
    };

    fetchMsgs(false);
    chatService.read(active.conversation_id);
    const timer = setInterval(() => fetchMsgs(true), 4000);
    return () => clearInterval(timer);
  }, [active?.conversation_id]);

  // Xử lý chọn nhiều ảnh cùng một lúc từ máy
  const handleImagesSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Giới hạn số lượng ảnh trong hàng đợi (tối đa 10 ảnh một lượt)
    if (pendingImages.length + files.length > 10) {
      alert('Bạn chỉ có thể đính kèm tối đa 10 ảnh trong một lần gửi!');
      return;
    }

    files.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        alert(`Tệp "${file.name}" không phải là ảnh hợp lệ!`);
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        alert(`Ảnh "${file.name}" vượt quá dung lượng tối đa 8MB!`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target.result;
        setPendingImages((prev) => [
          ...prev,
          {
            id: `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            dataUrl,
            name: file.name
          }
        ]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input để người dùng có thể bấm chọn tiếp
    e.target.value = '';
  };

  // Xóa 1 ảnh cụ thể khỏi hàng đợi chờ gửi
  const handleRemovePendingImage = (imgId) => {
    setPendingImages((prev) => prev.filter((img) => img.id !== imgId));
  };

  // Xóa toàn bộ ảnh đang chờ
  const handleClearAllPending = () => {
    setPendingImages([]);
  };

  // Gửi tin nhắn và các hình ảnh trong hàng đợi
  const send = async () => {
    if ((!text.trim() && pendingImages.length === 0) || !active || sending) return;
    
    try {
      setSending(true);
      const sentText = text.trim();
      const imagesToSend = [...pendingImages];

      // Dọn ô input và hàng đợi ngay lập tức cho trải nghiệm nhanh nhạy
      setText('');
      setPendingImages([]);

      // 1. Nếu có kèm văn bản text
      if (sentText) {
        // Nếu chỉ có text hoặc text gửi kèm ảnh đầu tiên
        const firstImg = imagesToSend.length > 0 ? imagesToSend[0].dataUrl : null;
        const m = await chatService.send(active.conversation_id, sentText, firstImg);
        setMsgs((prev) => [...prev, m]);
        
        // Gửi các ảnh còn lại (nếu có từ ảnh thứ 2 trở đi)
        for (let i = 1; i < imagesToSend.length; i++) {
          const nextImg = imagesToSend[i].dataUrl;
          const imgMsg = await chatService.send(active.conversation_id, '', nextImg);
          setMsgs((prev) => [...prev, imgMsg]);
        }
      } else {
        // Chỉ gửi ảnh (không có văn bản text)
        for (let i = 0; i < imagesToSend.length; i++) {
          const imgUrl = imagesToSend[i].dataUrl;
          const imgMsg = await chatService.send(active.conversation_id, '', imgUrl);
          setMsgs((prev) => [...prev, imgMsg]);
        }
      }

      setTimeout(() => scrollToBottom('smooth'), 80);
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  const shown = list.filter((x) =>
    (x.homestay_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="messages-shell">
      <div className="messages-page">
        {/* SIDEBAR DANH SÁCH CUỘC TRÒ CHUYỆN */}
        <aside className="messages-sidebar">
          <div className="messages-sidebar-head">
            <div className="messages-brand-col">
              <span className="messages-badge-tag">
                <i className="bi bi-chat-dots-fill me-1"></i> TRÒ CHUYỆN TRỰC TIẾP
              </span>
              <h1 className="messages-title">Hộp thư</h1>
            </div>
            <div className="messages-count-pill" title="Tổng số cuộc trò chuyện">
              <b>{list.length}</b>
            </div>
          </div>

          <div className="messages-search">
            <i className="bi bi-search" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm homestay hoặc khách hàng..."
            />
            {search && (
              <button
                type="button"
                className="btn-clear-search"
                onClick={() => setSearch('')}
                title="Xóa tìm kiếm"
              >
                <i className="bi bi-x-circle-fill" />
              </button>
            )}
          </div>

          <div className="conversation-list-scroll">
            {shown.length > 0 ? (
              shown.map((c) => (
                <button
                  type="button"
                  className={`conversation-item ${active?.conversation_id === c.conversation_id ? 'selected' : ''}`}
                  onClick={() => setActive(c)}
                  key={c.conversation_id}
                >
                  <div className="conversation-avatar">
                    <i className="bi bi-house-door-fill" />
                  </div>
                  <div className="conversation-info">
                    <div className="conversation-header-row">
                      <b className="conversation-name">{c.homestay_name}</b>
                      {c.last_message_at && (
                        <span className="conversation-time">
                          {formatVNTime(c.last_message_at)}
                        </span>
                      )}
                    </div>
                    <small className="conversation-preview">
                      {c.last_message || 'Bắt đầu trò chuyện...'}
                    </small>
                  </div>
                </button>
              ))
            ) : (
              <div className="conversation-empty-state">
                <i className="bi bi-chat-left-dots text-muted fs-3 mb-2" />
                <p>Không tìm thấy cuộc trò chuyện nào</p>
              </div>
            )}
          </div>
        </aside>

        {/* KHUNG NỘI DUNG TIN NHẮN */}
        <main className="messages-main">
          {active ? (
            <>
              <header className="messages-chat-header">
                <div className="conversation-avatar large">
                  <i className="bi bi-house-door-fill" />
                </div>
                <div className="messages-header-info">
                  <h2>{active.homestay_name}</h2>
                  <div className="messages-online-status">
                    <span className="online-indicator"></span>
                    <span>Đang kết nối cùng Homestay • Giờ Việt Nam (GMT+7)</span>
                  </div>
                </div>
              </header>

              <section className="message-list" ref={messageListRef}>
                {msgs.length > 0 ? (
                  msgs.map((m) => {
                    const isMine = String(m.sender_id) === String(u.id);
                    return (
                      <div
                        className={`message-row ${isMine ? 'mine' : ''}`}
                        key={m.message_id}
                      >
                        {!isMine && (
                          <div className="message-sender-avatar" title={active.homestay_name}>
                            <i className="bi bi-house-heart-fill" />
                          </div>
                        )}
                        <div className="message-bubble-container">
                          <div className="message-bubble">
                            {/* Hiển thị hình ảnh đã gửi (bảo lưu minh bạch, không xóa hay thu hồi sau khi gửi) */}
                            {m.image_url && (
                              <div className="message-image-wrapper">
                                <img
                                  src={m.image_url}
                                  alt="Hình ảnh trò chuyện"
                                  className="chat-msg-image"
                                  onClick={() => setLightboxImg(m.image_url)}
                                  title="Nhấp để xem kích thước lớn"
                                />
                              </div>
                            )}

                            {/* Nội dung văn bản */}
                            {m.content && m.content !== '[Hình ảnh]' && (
                              <span className="message-text">{m.content}</span>
                            )}

                            <time
                              className="message-time"
                              title={formatVNDate(m.created_at)}
                            >
                              <i className="bi bi-clock me-1"></i>
                              {formatVNTime(m.created_at)}
                            </time>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="message-empty">
                    <div className="empty-chat-icon">
                      <i className="bi bi-chat-quote-fill" />
                    </div>
                    <h3>Bắt đầu cuộc trò chuyện</h3>
                    <p>Hãy gửi lời chào hoặc hình ảnh trao đổi trực tiếp nhé!</p>
                  </div>
                )}
              </section>

              {/* HÀNG ĐỢI XEM TRƯỚC NHIỀU ẢNH TRƯỚC KHI GỬI (PENDING QUEUE) */}
              {pendingImages.length > 0 && (
                <div className="chat-images-queue-panel">
                  <div className="queue-panel-header">
                    <span className="queue-count-tag">
                      <i className="bi bi-images me-1.5" />
                      Đang chờ gửi ({pendingImages.length}/10 ảnh)
                    </span>
                    <button
                      type="button"
                      className="btn-clear-queue"
                      onClick={handleClearAllPending}
                      title="Xóa toàn bộ ảnh đang chờ"
                    >
                      <i className="bi bi-trash3 me-1" /> Hủy tất cả
                    </button>
                  </div>

                  <div className="queue-thumbnails-strip">
                    {pendingImages.map((img) => (
                      <div className="queue-thumb-item" key={img.id}>
                        <img src={img.dataUrl} alt={img.name} />
                        <span className="queue-status-badge" title="Đang ở hàng đợi gửi">
                          Chờ gửi
                        </span>
                        {/* Nút X xóa ảnh khỏi hàng đợi khi đổi ý */}
                        <button
                          type="button"
                          className="btn-remove-queue-item"
                          onClick={() => handleRemovePendingImage(img.id)}
                          title="Xóa ảnh này khỏi hàng đợi"
                        >
                          <i className="bi bi-x-lg" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FOOTER NHẬP TIN NHẮN & NÚT TẢI NHIỀU ẢNH */}
              <footer className="messages-chat-footer">
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  multiple
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                  onChange={handleImagesSelect}
                />

                <button
                  type="button"
                  className={`btn-attach-image ${pendingImages.length > 0 ? 'has-pending' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                  title="Chọn một hoặc nhiều hình ảnh để gửi"
                  disabled={sending}
                >
                  <i className="bi bi-images" />
                  {pendingImages.length > 0 && (
                    <span className="attach-count-badge">{pendingImages.length}</span>
                  )}
                </button>

                <div className="input-field-wrapper">
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
                    placeholder={
                      pendingImages.length > 0
                        ? `Đã chọn ${pendingImages.length} ảnh. Thêm lời nhắn và bấm Gửi...`
                        : "Nhập tin nhắn trao đổi hoặc đính kèm nhiều ảnh..."
                    }
                    disabled={sending}
                  />
                  <button
                    type="button"
                    onClick={send}
                    disabled={(!text.trim() && pendingImages.length === 0) || sending}
                    className="btn-send-message"
                    title="Gửi tin nhắn & hình ảnh"
                  >
                    {sending ? (
                      <span className="spinner-border spinner-border-sm" role="status" />
                    ) : (
                      <i className="bi bi-send-fill" />
                    )}
                  </button>
                </div>
              </footer>
            </>
          ) : (
            <div className="message-welcome">
              <div className="welcome-chat-icon">
                <i className="bi bi-chat-square-text-fill" />
              </div>
              <h2>Chọn một cuộc trò chuyện</h2>
              <p>Tin nhắn và hình ảnh giữa bạn và homestay sẽ hiển thị tại đây.</p>
            </div>
          )}

          {error && (
            <div className="chat-error">
              <i className="bi bi-exclamation-triangle-fill me-2" />
              {error}
            </div>
          )}
        </main>
      </div>

      {/* LIGHTBOX XEM ẢNH FULLSCREEN */}
      {lightboxImg && (
        <div className="chat-lightbox-overlay" onClick={() => setLightboxImg(null)}>
          <button
            type="button"
            className="chat-lightbox-close"
            onClick={() => setLightboxImg(null)}
            title="Đóng (Esc)"
          >
            <i className="bi bi-x-lg" />
          </button>
          <img
            src={lightboxImg}
            alt="Phóng to ảnh trò chuyện"
            className="chat-lightbox-img"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
