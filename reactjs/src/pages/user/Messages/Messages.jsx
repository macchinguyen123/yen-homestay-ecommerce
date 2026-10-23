import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { chatService } from '../../../services/chatService';
import './Messages.css';

const formatMsgTime = (timestamp) => {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const timeStr = d.toLocaleTimeString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit'
  });
  if (isToday) return timeStr;
  return `${timeStr} · ${d.getDate()}/${d.getMonth() + 1}`;
};

export default function Messages() {
  const loc = useLocation();
  const navigate = useNavigate();
  const u = JSON.parse(localStorage.getItem('user') || 'null');

  const [list, setList] = useState([]);
  const [active, setActive] = useState(loc.state?.conversation || null);
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  // Danh sách ảnh đang chờ gửi (Pending queue)
  const [pendingImages, setPendingImages] = useState([]);
  // Lightbox xem ảnh lớn
  const [lightboxImg, setLightboxImg] = useState(null);

  const fileInputRef = useRef(null);
  const listRef = useRef(null);
  const isAtBottomRef = useRef(true);
  const prevMsgCountRef = useRef(0);
  const prevConvIdRef = useRef(null);

  const handleScroll = () => {
    if (!listRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    // Người dùng được coi là ở đáy nếu cách đáy < 60px
    isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 60;
  };

  const scrollToBottom = (smooth = true) => {
    if (!listRef.current) return;
    try {
      listRef.current.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    } catch {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  };

  // Tự xóa thông báo lỗi sau 4 giây
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const load = async () => {
    if (!u?.id) return;
    try {
      const d = await chatService.list();
      if (Array.isArray(d)) {
        let combined = [...d];
        if (active?.conversation_id && !combined.some((x) => x.conversation_id === active.conversation_id)) {
          combined.unshift(active);
        }
        setList(combined);
        if (!active && combined[0]) {
          setActive(combined[0]);
        }
      }
    } catch (e) {
      console.warn('Lỗi tải danh sách chat:', e);
      setError(e.message || 'Không thể tải danh sách cuộc trò chuyện');
    }
  };

  useEffect(() => {
    if (!u?.id) {
      navigate('/login', { state: { from: loc.pathname } });
      return;
    }
    load();
  }, []);

  // Lắng nghe và cập nhật tin nhắn định kỳ
  useEffect(() => {
    if (!active?.conversation_id) return;
    let isSubscribed = true;

    const fetchMsgs = () => {
      chatService
        .messages(active.conversation_id)
        .then((data) => {
          if (!isSubscribed || !Array.isArray(data)) return;
          setMsgs((prev) => {
            if (prev.length === data.length) {
              const isUnchanged = prev.every(
                (m, idx) =>
                  m.message_id === data[idx].message_id &&
                  m.is_read === data[idx].is_read &&
                  m.image_url === data[idx].image_url
              );
              if (isUnchanged) return prev; // Giữ nguyên tham chiếu để KHÔNG kéo cuộn của user
            }
            return data;
          });
        })
        .catch((e) => {
          if (isSubscribed) setError(e.message);
        });
    };

    fetchMsgs();
    chatService.read(active.conversation_id).catch(() => {});
    const interval = setInterval(fetchMsgs, 4000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [active?.conversation_id]);

  // Cuộn ngay xuống đáy khi đổi cuộc trò chuyện
  useEffect(() => {
    if (active?.conversation_id && active.conversation_id !== prevConvIdRef.current) {
      prevConvIdRef.current = active.conversation_id;
      isAtBottomRef.current = true;
      setTimeout(() => scrollToBottom(false), 30);
    }
  }, [active?.conversation_id]);

  // CHỈ cuộn khi có tin nhắn mới VÀ người dùng đang ở đáy
  useEffect(() => {
    if (msgs.length === 0) return;
    const hasNewMessage = msgs.length > prevMsgCountRef.current;
    prevMsgCountRef.current = msgs.length;

    if (hasNewMessage && isAtBottomRef.current) {
      setTimeout(() => scrollToBottom(true), 30);
    }
  }, [msgs.length]);

  // Xử lý chọn nhiều hình ảnh
  const handleImagesSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

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
            name: file.name,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  // Nút X xóa từng ảnh khỏi hàng đợi chờ gửi
  const handleRemovePendingImage = (imgId) => {
    setPendingImages((prev) => prev.filter((img) => img.id !== imgId));
  };

  const handleClearAllPending = () => {
    setPendingImages([]);
  };

  const send = async () => {
    if ((!text.trim() && pendingImages.length === 0) || !active?.conversation_id || sending) return;
    const content = text.trim();
    const imagesToSend = [...pendingImages];

    setText('');
    setPendingImages([]);
    setSending(true);
    setError('');

    try {
      if (content) {
        const firstImg = imagesToSend.length > 0 ? imagesToSend[0].dataUrl : null;
        const m = await chatService.send(active.conversation_id, content, firstImg);
        isAtBottomRef.current = true;
        setMsgs((prev) => [...prev, m]);

        for (let i = 1; i < imagesToSend.length; i++) {
          const imgMsg = await chatService.send(active.conversation_id, '', imagesToSend[i].dataUrl);
          setMsgs((prev) => [...prev, imgMsg]);
        }
      } else {
        for (let i = 0; i < imagesToSend.length; i++) {
          const imgMsg = await chatService.send(active.conversation_id, '', imagesToSend[i].dataUrl);
          setMsgs((prev) => [...prev, imgMsg]);
        }
      }

      isAtBottomRef.current = true;
      setTimeout(() => scrollToBottom(true), 30);
      load();
    } catch (e) {
      setError(e.message || 'Không thể gửi tin nhắn.');
    } finally {
      setSending(false);
    }
  };

  const shown = list.filter((x) =>
    (x.homestay_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (x.other_party_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="messages-shell">
      <div className="messages-page">
        <aside className="messages-sidebar">
          <div className="messages-sidebar-head">
            <div>
              <small>HỘP THƯ YÊN HOMESTAY</small>
              <h1>Tin nhắn</h1>
            </div>
            <b>{list.length}</b>
          </div>

          <div className="messages-search">
            <i className="bi bi-search" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm cuộc trò chuyện, homestay..."
            />
          </div>

          <div className="conversations-scrollable">
            {shown.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 15px', color: '#889891', fontSize: '13px' }}>
                <i className="bi bi-chat-dots" style={{ fontSize: '24px', display: 'block', marginBottom: '8px', opacity: 0.5 }} />
                {search ? 'Không tìm thấy cuộc trò chuyện phù hợp' : 'Chưa có cuộc trò chuyện nào'}
              </div>
            ) : (
              shown.map((c) => (
                <button
                  className={`conversation-item ${active?.conversation_id === c.conversation_id ? 'selected' : ''}`}
                  onClick={() => {
                    setActive(c);
                    setError('');
                  }}
                  key={c.conversation_id}
                >
                  <span className="conversation-avatar">
                    <i className="bi bi-house-heart" />
                  </span>
                  <span>
                    <b>{c.homestay_name || 'Homestay'}</b>
                    <small>
                      {c.other_party_name ? `${c.other_party_name}: ` : ''}
                      {c.last_message || 'Bắt đầu trò chuyện'}
                    </small>
                  </span>
                  {c.unread_count > 0 && <span className="unread-badge">{c.unread_count}</span>}
                  <i className="bi bi-chevron-right" />
                </button>
              ))
            )}
          </div>
        </aside>

        <main className="messages-main">
          {active ? (
            <>
              <header>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#16845b',
                      cursor: 'pointer',
                      fontSize: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '4px'
                    }}
                    title="Quay lại"
                  >
                    <i className="bi bi-arrow-left" />
                  </button>
                  <span className="conversation-avatar large">
                    <i className="bi bi-house-heart" />
                  </span>
                  <div>
                    <h2>{active.homestay_name || 'Homestay'}</h2>
                    <small>
                      <i className="bi bi-circle-fill online-dot" />{' '}
                      {active.other_party_name ? `Trò chuyện với ${active.other_party_name}` : 'Đang hoạt động'}
                    </small>
                  </div>
                </div>

                {active.homestay_id && (
                  <Link
                    to={`/homestay/${active.homestay_id}`}
                    style={{
                      fontSize: '12px',
                      color: '#16845b',
                      textDecoration: 'none',
                      fontWeight: 600,
                      padding: '6px 12px',
                      borderRadius: '8px',
                      background: '#eef8f3',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <i className="bi bi-eye" /> Xem homestay
                  </Link>
                )}
              </header>

              <section className="message-list" ref={listRef} onScroll={handleScroll}>
                {msgs.length ? (
                  msgs.map((m) => {
                    const isMine = String(m.sender_id) === String(u?.id);
                    return (
                      <div className={`message-row ${isMine ? 'mine' : ''}`} key={m.message_id}>
                        <div className="message-bubble">
                          {!isMine && m.sender_name && (
                            <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: isMine ? '#fff' : '#16845b', marginBottom: '3px' }}>
                              {m.sender_name}
                            </span>
                          )}

                          {/* Hiển thị hình ảnh nếu có */}
                          {m.image_url && (
                            <div className="message-image-wrapper">
                              <img
                                src={m.image_url}
                                alt="Ảnh trò chuyện"
                                className="chat-msg-image"
                                onClick={() => setLightboxImg(m.image_url)}
                                title="Nhấp để phóng to"
                              />
                            </div>
                          )}

                          {m.content && m.content !== '[Hình ảnh]' && (
                            <div style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{m.content}</div>
                          )}
                          <time>{formatMsgTime(m.created_at)}</time>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="message-empty">
                    <i className="bi bi-chat-heart" />
                    <h3>Bắt đầu cuộc trò chuyện</h3>
                    <p>Hãy gửi lời chào hoặc hình ảnh đến chủ homestay để được hỗ trợ tốt nhất.</p>
                  </div>
                )}
              </section>

              {/* HÀNG ĐỢI XEM TRƯỚC NHIỀU ẢNH TRƯỚC KHI GỬI (PENDING QUEUE) */}
              {pendingImages.length > 0 && (
                <div className="chat-images-queue-panel">
                  <div className="queue-panel-header">
                    <span className="queue-count-tag">
                      <i className="bi bi-images" style={{ marginRight: '6px' }} />
                      Đang chờ gửi ({pendingImages.length}/10 ảnh)
                    </span>
                    <button
                      type="button"
                      className="btn-clear-queue"
                      onClick={handleClearAllPending}
                      title="Hủy toàn bộ ảnh đang chờ"
                    >
                      <i className="bi bi-trash3" style={{ marginRight: '4px' }} /> Hủy tất cả
                    </button>
                  </div>

                  <div className="queue-thumbnails-strip">
                    {pendingImages.map((img) => (
                      <div className="queue-thumb-item" key={img.id}>
                        <img src={img.dataUrl} alt={img.name} />
                        <span className="queue-status-badge">Chờ gửi</span>
                        {/* Nút X xóa ảnh khỏi hàng đợi khi đổi ý */}
                        <button
                          type="button"
                          className="btn-remove-queue-item"
                          onClick={() => handleRemovePendingImage(img.id)}
                          title="Xóa ảnh này"
                        >
                          <i className="bi bi-x-lg" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <footer>
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
                  title="Đính kèm một hoặc nhiều hình ảnh"
                  disabled={sending}
                >
                  <i className="bi bi-images" />
                  {pendingImages.length > 0 && (
                    <span className="attach-count-badge">{pendingImages.length}</span>
                  )}
                </button>

                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder={
                    pendingImages.length > 0
                      ? `Đã chọn ${pendingImages.length} ảnh. Thêm tin nhắn và nhấn Gửi...`
                      : "Nhập tin nhắn..."
                  }
                  disabled={sending}
                />
                <button onClick={send} disabled={(!text.trim() && pendingImages.length === 0) || sending}>
                  {sending ? (
                    <span className="spinner-border spinner-border-sm" role="status" />
                  ) : (
                    <i className="bi bi-send-fill" />
                  )}
                </button>
              </footer>
            </>
          ) : (
            <div className="message-welcome">
              <i className="bi bi-chat-square-heart" />
              <h2>Chọn một cuộc trò chuyện</h2>
              <p>Tin nhắn giữa bạn và chủ homestay sẽ hiển thị tại đây.</p>
            </div>
          )}

          {error && <div className="chat-error">{error}</div>}
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
