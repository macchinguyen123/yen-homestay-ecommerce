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
  const timeStr = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
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
                (m, idx) => m.message_id === data[idx].message_id && m.is_read === data[idx].is_read
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

  const send = async () => {
    if (!text.trim() || !active?.conversation_id || sending) return;
    const content = text.trim();
    setText('');
    setSending(true);
    setError('');

    try {
      const m = await chatService.send(active.conversation_id, content);
      isAtBottomRef.current = true;
      setMsgs((prev) => [...prev, m]);
      prevMsgCountRef.current += 1;
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
                            <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#16845b', marginBottom: '3px' }}>
                              {m.sender_name}
                            </span>
                          )}
                          <div style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{m.content}</div>
                          <time>{formatMsgTime(m.created_at)}</time>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="message-empty">
                    <i className="bi bi-chat-heart" />
                    <h3>Bắt đầu cuộc trò chuyện</h3>
                    <p>Hãy gửi lời chào đến chủ homestay để được hỗ trợ tốt nhất.</p>
                  </div>
                )}
              </section>

              <footer>
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  placeholder="Nhập tin nhắn..."
                  disabled={sending}
                />
                <button onClick={send} disabled={!text.trim() || sending}>
                  <i className="bi bi-send-fill" />
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
    </div>
  );
}
