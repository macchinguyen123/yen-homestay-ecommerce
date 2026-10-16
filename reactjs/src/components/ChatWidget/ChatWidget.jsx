import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { 
  X, Send, Bot, Sparkles, MapPin, Star, ArrowRight, RotateCcw, ChevronDown
} from 'lucide-react';
import { chatbotService } from '../../services/chatbotService';
import './ChatWidget.css';

const SUGGESTIONS = [
  'Tìm phòng Đà Lạt cho 2 người tầm 800k',
  'Homestay ở Vũng Tàu gần biển',
  'Tìm homestay Sa Pa view núi đẹp',
  'Hệ thống có voucher giảm giá nào không?'
];

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: 'Xin chào bạn! 🌿 Mình là trợ lý AI của Yên Homestay. Mình có thể giúp bạn tìm phòng theo địa điểm (Đà Lạt, Vũng Tàu, Sa Pa, Hà Nội...), mức giá và số lượng khách. Bạn đang dự định đi đâu thế ạ?',
      homestays: []
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Lắng nghe sự kiện click từ nút Trợ lý AI trên Header
  useEffect(() => {
    const handleToggle = () => setIsOpen((prev) => !prev);
    window.addEventListener('toggle-yen-chat', handleToggle);
    return () => window.removeEventListener('toggle-yen-chat', handleToggle);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, loading]);

  const handleSend = async (messageText) => {
    const textToSend = messageText || input;
    if (!textToSend || !textToSend.trim() || loading) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: textToSend.trim(),
      homestays: []
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await chatbotService.sendMessage(userMsg.text);
      const botMsg = {
        id: Date.now() + 1,
        sender: 'assistant',
        text: res.message || 'Dạ mình đã nhận thông tin!',
        homestays: res.homestays || []
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'assistant',
          text: 'Dạ hiện tại đường truyền tới trợ lý AI đang bận một chút, bạn thử lại sau vài giây nhé!',
          homestays: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCardClick = (homestayId) => {
    navigate(`/homestay/${homestayId}`);
    if (window.innerWidth < 640) {
      setIsOpen(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: Date.now(),
        sender: 'assistant',
        text: 'Cuộc trò chuyện đã được làm mới. Bạn cần hỗ trợ tìm kiếm homestay nào nữa không ạ? 🌿',
        homestays: []
      }
    ]);
  };

  // Render text kèm thẻ [[card:ID]]
  const renderMessageContent = (text, homestays = []) => {
    if (!text) return null;

    const parts = text.split(/(\[\[card:\d+\]\])/g);
    const renderedCardIds = new Set();

    return (
      <div className="yen-message-content-wrapper">
        {parts.map((part, idx) => {
          const match = part.match(/\[\[card:(\d+)\]\]/);
          if (match) {
            const id = parseInt(match[1], 10);
            renderedCardIds.add(id);
            const item = homestays.find((h) => h.id === id);
            if (item) {
              return (
                <HomestayMiniCard
                  key={`inline-card-${id}-${idx}`}
                  homestay={item}
                  onClick={() => handleCardClick(item.id)}
                />
              );
            }
            return null;
          }
          return (
            <span key={idx} style={{ whiteSpace: 'pre-wrap' }}>
              {part}
            </span>
          );
        })}

        {/* Nếu homestays có kết quả mà chưa được render thẻ inline, hiển thị bổ sung ở cuối */}
        {homestays && homestays.length > 0 && (
          <div className="yen-cards-extra-container">
            {homestays
              .filter((h) => !renderedCardIds.has(h.id))
              .map((h) => (
                <HomestayMiniCard
                  key={`extra-card-${h.id}`}
                  homestay={h}
                  onClick={() => handleCardClick(h.id)}
                />
              ))}
          </div>
        )}
      </div>
    );
  };

  return createPortal(
    <div className="yen-chat-root">
      {/* Floating Action Button - Tròn xịn sò, luôn nằm bên phải màn hình */}
      {!isOpen && (
        <button
          className="yen-chat-float-circle"
          onClick={() => setIsOpen(true)}
          title="Trò chuyện với Trợ lý AI Yên Homestay"
          aria-label="Mở Trợ lý AI Yên Homestay"
        >
          <div className="yen-chat-pulse-ring"></div>
          <div className="yen-chat-float-inner">
            <Bot size={26} className="yen-bot-svg" />
            <span className="yen-sparkle-badge">✨</span>
          </div>
          <span className="yen-chat-tooltip">Trợ lý AI Yên</span>
        </button>
      )}

      {/* Floating Chat Modal - Bo tròn viền mềm mại */}
      {isOpen && (
        <div className="yen-chat-window-luxury">
          {/* Header */}
          <div className="yen-chat-header-luxury">
            <div className="yen-header-brand-block">
              <div className="yen-avatar-circle">
                <Bot size={22} color="#ffffff" />
                <span className="yen-online-indicator"></span>
              </div>
              <div className="yen-header-titles">
                <h4 className="yen-main-title">
                  Trợ lý Yên Homestay
                  <Sparkles size={14} className="yen-sparkle-icon" />
                </h4>
                <p className="yen-sub-title">Hỏi đáp & Tìm phòng thông minh</p>
              </div>
            </div>
            <div className="yen-header-control-btns">
              <button
                type="button"
                className="yen-ctrl-btn"
                onClick={handleReset}
                title="Làm mới cuộc trò chuyện"
              >
                <RotateCcw size={16} />
              </button>
              <button
                type="button"
                className="yen-ctrl-btn"
                onClick={() => setIsOpen(false)}
                title="Đóng cửa sổ chat"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="yen-chat-body-luxury">
            {messages.map((m) => (
              <div key={m.id} className={`yen-bubble-row ${m.sender}`}>
                {m.sender === 'assistant' && (
                  <div className="yen-bot-avatar-mini">
                    <Bot size={14} />
                  </div>
                )}
                <div className="yen-bubble-card">
                  {m.sender === 'assistant'
                    ? renderMessageContent(m.text, m.homestays)
                    : m.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="yen-bubble-row assistant">
                <div className="yen-bot-avatar-mini">
                  <Bot size={14} />
                </div>
                <div className="yen-typing-pill">
                  <span className="yen-bounce-dot"></span>
                  <span className="yen-bounce-dot"></span>
                  <span className="yen-bounce-dot"></span>
                  <span className="yen-typing-label">Đang tra cứu dữ liệu...</span>
                </div>
              </div>
            )}

            {/* Quick Suggestions Chips */}
            {messages.length <= 2 && !loading && (
              <div className="yen-suggestions-wrapper">
                <p className="yen-suggestions-title">💡 Gợi ý câu hỏi nhanh:</p>
                <div className="yen-suggestions-chips">
                  {SUGGESTIONS.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="yen-rounded-chip"
                      onClick={() => handleSend(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <div className="yen-chat-footer-luxury">
            <input
              ref={inputRef}
              type="text"
              className="yen-round-input"
              placeholder="Nhập yêu cầu tìm phòng (VD: Đà Lạt cho 2 người tầm 800k)..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button
              type="button"
              className="yen-round-send-btn"
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              title="Gửi tin nhắn"
            >
              <Send size={17} />
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}

// Subcomponent: Mini Card Homestay Bo tròn siêu đẹp
function HomestayMiniCard({ homestay, onClick }) {
  if (!homestay) return null;

  return (
    <div className="yen-mini-homestay-card" onClick={onClick} role="button" tabIndex={0}>
      <div className="yen-mini-img-wrap">
        <img
          src={homestay.imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=300&q=80'}
          alt={homestay.name}
          className="yen-mini-thumb"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=300&q=80';
          }}
        />
        {homestay.rating && (
          <span className="yen-mini-rating-badge">
            <Star size={10} fill="#f59e0b" color="#f59e0b" />
            {typeof homestay.rating === 'number' ? homestay.rating.toFixed(1) : homestay.rating}
          </span>
        )}
      </div>

      <div className="yen-mini-info">
        <h5 className="yen-mini-name" title={homestay.name}>
          {homestay.name}
        </h5>
        <div className="yen-mini-loc">
          <MapPin size={12} className="yen-pin-icon" />
          <span>{homestay.city || homestay.address || 'Việt Nam'}</span>
        </div>
        <div className="yen-mini-bottom">
          <span className="yen-mini-price">
            {homestay.formattedPrice || `${homestay.price}đ`}
            <span className="yen-price-unit">/đêm</span>
          </span>
          <span className="yen-mini-action-pill">
            Xem phòng <ArrowRight size={11} />
          </span>
        </div>
      </div>
    </div>
  );
}
