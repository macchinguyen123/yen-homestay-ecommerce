import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { chatService } from '../../../services/chatService';
import './Messages.css';

// Chuyển đổi timestamp ISO / string sang giờ Việt Nam (UTC+7) chuẩn xác
const formatVNTime = (timeStr) => {
  if (!timeStr) return '';
  try {
    let dateStr = String(timeStr).trim();
    // Nếu chuỗi datetime không có timezone indicator (không có Z hay +/-offset),
    // cơ sở dữ liệu đã lưu theo UTC, thêm 'Z' để JS parse đúng UTC rồi convert sang VN (UTC+7)
    if (!dateStr.endsWith('Z') && !dateStr.includes('+') && !dateStr.includes('-')) {
      dateStr += 'Z';
    } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(dateStr)) {
      dateStr += 'Z';
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      // Fallback parse thông thường
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
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  
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

  // Cuộn xuống đáy một cách thông minh (chỉ cuộn khi vào phòng hoặc có tin nhắn mới tăng lên)
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
          // Chỉ cuộn xuống khi:
          // 1. Mới load cuộc trò chuyện (isInitialLoadRef)
          // 2. Số lượng tin nhắn tăng lên (có tin nhắn mới gửi hoặc nhận)
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

  const send = async () => {
    if (!text.trim() || !active) return;
    try {
      const sentText = text.trim();
      setText('');
      const m = await chatService.send(active.conversation_id, sentText);
      setMsgs((prev) => {
        const next = [...prev, m];
        prevMsgCountRef.current = next.length;
        setTimeout(() => scrollToBottom('smooth'), 50);
        return next;
      });
      load();
    } catch (e) {
      setError(e.message);
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
              placeholder="Tìm homestay hoặc chủ nhà..."
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
                            <span className="message-text">{m.content}</span>
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
                    <p>Hãy gửi lời chào hoặc đặt câu hỏi trực tiếp cho chủ homestay nhé!</p>
                  </div>
                )}
              </section>

              <footer className="messages-chat-footer">
                <div className="input-field-wrapper">
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && send()}
                    placeholder="Nhập tin nhắn trao đổi cùng chủ homestay..."
                  />
                  <button
                    type="button"
                    onClick={send}
                    disabled={!text.trim()}
                    className="btn-send-message"
                    title="Gửi tin nhắn"
                  >
                    <i className="bi bi-send-fill" />
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
              <p>Tin nhắn giữa bạn và các chủ homestay sẽ hiển thị tại đây.</p>
            </div>
          )}

          {error && <div className="chat-error"><i className="bi bi-exclamation-triangle-fill me-2" />{error}</div>}
        </main>
      </div>
    </div>
  );
}
