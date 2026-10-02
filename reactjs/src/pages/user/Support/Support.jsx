import React, { useState, useRef, useEffect } from 'react';
import './Support.css';

const FAQ_ITEMS = [
  {
    id: 'faq-1',
    category: 'booking',
    question: 'Tôi có thể hủy phòng và nhận lại tiền cọc được không?',
    answer: (
      <>
        <p>Có. Tại <strong>YÊN Homestay</strong>, hầu hết điểm lưu trú hỗ trợ <strong>Hủy phòng miễn phí trước 48 giờ</strong> so với giờ check-in tiêu chuẩn 14:00.</p>
        <p>Tiền cọc sẽ được hoàn 100% về tài khoản hoặc ví điện tử trong vòng <strong>24–48 giờ làm việc</strong>.</p>
      </>
    )
  },
  {
    id: 'faq-2',
    category: 'payment',
    question: 'YÊN Homestay hỗ trợ những phương thức thanh toán nào?',
    answer: (
      <>
        <p>Hệ thống thanh toán bảo mật chuẩn quốc tế PCI-DSS:</p>
        <ul>
          <li>Quét mã QR cổng <strong>VNPAY-QR</strong> (hơn 40 ngân hàng nội địa)</li>
          <li>Ví điện tử <strong>MoMo</strong>, ZaloPay, ShopeePay</li>
          <li>Thẻ ATM nội địa (Napas 247)</li>
          <li>Thẻ quốc tế Visa, MasterCard, JCB, UnionPay</li>
        </ul>
      </>
    )
  },
  {
    id: 'faq-3',
    category: 'booking',
    question: 'Giờ nhận phòng (check-in) và trả phòng (check-out) là mấy giờ?',
    answer: (
      <>
        <p>Nhận phòng tiêu chuẩn từ <strong>14:00</strong>, trả phòng trước <strong>12:00</strong>. Muốn check-in sớm hoặc check-out trễ, bạn nhắn trực tiếp với chủ nhà qua số điện thoại trong phiếu xác nhận — phần lớn chủ nhà YÊN sẽ hỗ trợ linh hoạt miễn phí.</p>
      </>
    )
  },
  {
    id: 'faq-4',
    category: 'experience',
    question: 'Tôi có thể ăn cơm nhà hoặc hái trái trong vườn homestay không?',
    answer: (
      <>
        <p>Hoàn toàn có! Đây chính là điểm khác biệt đặc trưng của YÊN. Nhiều chủ nhà cung cấp trải nghiệm hái trái, nấu ăn và bữa cơm gia đình bản địa theo yêu cầu. Chỉ cần báo trước khi nhận phòng để chủ nhà chuẩn bị nguyên liệu tươi nhất từ vườn.</p>
      </>
    )
  },
  {
    id: 'faq-5',
    category: 'host',
    question: 'Làm thế nào để đăng ký trở thành Chủ nhà (Host) YÊN?',
    answer: (
      <>
        <p>Vào <strong>Tài khoản &gt; Đăng ký Chủ Homestay</strong>. Đội ngũ khảo sát YÊN sẽ liên hệ tư vấn trong <strong>24 giờ</strong> và hỗ trợ hoàn thiện hồ sơ hoàn toàn miễn phí. Các homestay đạt chuẩn Xanh YÊN được ưu tiên hiển thị vị trí đầu.</p>
      </>
    )
  },
  {
    id: 'faq-6',
    category: 'payment',
    question: 'Tôi muốn lấy hóa đơn VAT cho chuyến công tác thì làm thế nào?',
    answer: (
      <>
        <p>Tại bước thanh toán, tích chọn <em>"Yêu cầu xuất hóa đơn VAT"</em> và điền MST công ty. Hóa đơn điện tử (MISA) sẽ gửi về email trong vòng <strong>48 giờ sau khi kết thúc lưu trú</strong>.</p>
      </>
    )
  },
  {
    id: 'faq-7',
    category: 'booking',
    question: 'Làm sao liên hệ trực tiếp với gia đình chủ nhà?',
    answer: (
      <>
        <p>Sau khi đặt phòng thành công, hệ thống YÊN gửi email + SMS xác nhận kèm: <strong>số điện thoại chủ nhà</strong>, địa chỉ Google Maps chính xác và ghi chú hướng dẫn di chuyển từng bước.</p>
      </>
    )
  },
  {
    id: 'faq-8',
    category: 'experience',
    question: 'Homestay YÊN có cho mang thú cưng (Pet-friendly) không?',
    answer: (
      <>
        <p>Khoảng <strong>65%</strong> homestay nhà vườn tại YÊN chào đón thú cưng nhỏ. Tìm biểu tượng 🐾 trong phần Tiện nghi hoặc dùng bộ lọc <em>"Pet-friendly"</em> khi tìm kiếm để lọc chính xác.</p>
      </>
    )
  }
];

export default function Support() {
  const [searchInput, setSearchInput] = useState('');
  const [activeFaqCategory, setActiveFaqCategory] = useState('all');
  const [openFaqIds, setOpenFaqIds] = useState(new Set(['faq-1']));
  const [toast, setToast] = useState({ show: false, msg: '' });

  // Ticket Form State
  const [ticketForm, setTicketForm] = useState({
    name: '',
    phone: '',
    email: '',
    code: '',
    topic: 'booking',
    message: '',
    fileName: ''
  });

  // Live Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Xin chào! 👋 Rất vui được đón tiếp bạn tại YÊN Homestay. Bạn cần hỗ trợ thông tin gì cho chuyến đi sắp tới?'
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const chatMsgsEndRef = useRef(null);

  const showToast = (msg) => {
    setToast({ show: true, msg });
    setTimeout(() => {
      setToast({ show: false, msg: '' });
    }, 3200);
  };

  const handleSupportSearch = (queryStr) => {
    const query = (queryStr !== undefined ? queryStr : searchInput).trim().toLowerCase();
    if (!query) {
      showToast('Vui lòng nhập từ khóa bạn muốn tìm kiếm!');
      return;
    }

    // Scroll to FAQ Section
    const faqSection = document.getElementById('faqSection');
    if (faqSection) faqSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Filter matching items
    const matches = FAQ_ITEMS.filter((item) => {
      const q = item.question.toLowerCase();
      return q.includes(query);
    });

    if (matches.length > 0) {
      setOpenFaqIds(new Set(matches.map((m) => m.id)));
      showToast(`Tìm thấy ${matches.length} câu hỏi phù hợp cho "${query}"!`);
    } else {
      showToast(`Không tìm thấy kết quả cho "${query}". Hãy thử gửi yêu cầu hỗ trợ!`);
    }
  };

  const selectSupportTag = (tag) => {
    setSearchInput(tag);
    handleSupportSearch(tag);
  };

  const toggleFaq = (id) => {
    setOpenFaqIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleTicketSubmit = (e) => {
    e.preventDefault();
    if (!ticketForm.name || !ticketForm.phone || !ticketForm.email || !ticketForm.message) {
      alert('Vui lòng điền đầy đủ các thông tin bắt buộc (*)!');
      return;
    }

    showToast('Đang gửi yêu cầu hỗ trợ của bạn...');
    setTimeout(() => {
      const ticketNum = Math.floor(100000 + Math.random() * 900000);
      showToast(`Yêu cầu #${ticketNum} đã được gửi thành công! CSKH sẽ phản hồi qua email trong 15 phút.`);
      setTicketForm({
        name: '',
        phone: '',
        email: '',
        code: '',
        topic: 'booking',
        message: '',
        fileName: ''
      });
    }, 1200);
  };

  const handleSendChat = () => {
    const text = chatInput.trim();
    if (!text) return;

    const userMsg = { id: Date.now(), sender: 'user', text };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');

    setTimeout(() => {
      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: `Cảm ơn bạn! Chuyên viên tư vấn YÊN Homestay đã nhận được tin nhắn: "${text}". Chúng tôi đang hỗ trợ bạn ngay đây!`
      };
      setChatMessages((prev) => [...prev, botMsg]);
    }, 1000);
  };

  useEffect(() => {
    if (isChatOpen && chatMsgsEndRef.current) {
      chatMsgsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatOpen]);

  const filteredFaqs = FAQ_ITEMS.filter((item) => {
    if (activeFaqCategory === 'all') return true;
    return item.category === activeFaqCategory;
  });

  return (
    <div className="sp-main">
      <main>
        {/* ── 1. HERO BANNER ── */}
        <section className="sp-hero">
          <div className="sp-container">
            <div className="sp-hero-eyebrow">
              <i className="bi bi-headset"></i>
              Trung tâm hỗ trợ khách hàng · 24/7
            </div>

            <h1>
              Chúng tôi luôn ở đây<br />
              <span>để giúp bạn</span>
            </h1>

            <p className="sp-hero-sub">
              Tìm kiếm câu trả lời cho mọi thắc mắc về đặt homestay, thanh toán, hủy phòng và trải nghiệm bản địa trên khắp Việt Nam.
            </p>

            {/* Search Bar */}
            <div className="sp-search-bar" id="searchBar">
              <i className="bi bi-search"></i>
              <input
                type="text"
                id="supportSearchInput"
                placeholder="Nhập từ khóa... (vd: hủy phòng, VNPAY, check-in, hoàn tiền)"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSupportSearch();
                }}
                autoComplete="off"
              />
              <button className="sp-search-btn" onClick={() => handleSupportSearch()} type="button">
                <i className="bi bi-search"></i> Tìm kiếm
              </button>
            </div>

            {/* Quick Pills */}
            <div className="sp-pills">
              <span className="sp-pills-label">Gợi ý:</span>
              <span className="sp-pill" onClick={() => selectSupportTag('Hủy phòng')}>
                Hủy phòng miễn phí
              </span>
              <span className="sp-pill" onClick={() => selectSupportTag('VNPAY')}>
                Thanh toán VNPAY
              </span>
              <span className="sp-pill" onClick={() => selectSupportTag('Nhận phòng')}>
                Giờ check-in
              </span>
              <span className="sp-pill" onClick={() => selectSupportTag('Hoàn tiền')}>
                Thời gian hoàn tiền
              </span>
              <span className="sp-pill" onClick={() => selectSupportTag('Chủ nhà')}>
                Liên hệ chủ nhà
              </span>
            </div>
          </div>
        </section>

        {/* ── 2. CONTACT STRIP ── */}
        <section className="sp-contact-strip">
          <div className="sp-container">
            <div className="sp-contact-grid">
              {/* Hotline */}
              <div className="sp-contact-card">
                <div className="sp-cicon sp-cicon--phone">
                  <i className="bi bi-telephone-fill"></i>
                </div>
                <div className="sp-cinfo">
                  <small>Gọi ngay · Miễn phí</small>
                  <h4>Tổng đài 24/7</h4>
                  <p>Phản hồi dưới 60 giây trong giờ cao điểm</p>
                  <a href="tel:0949050888" className="sp-clink">
                    0949.050.888 <i className="bi bi-arrow-up-right"></i>
                  </a>
                </div>
              </div>

              {/* Live Chat */}
              <div className="sp-contact-card">
                <div className="sp-cicon sp-cicon--chat">
                  <i className="bi bi-chat-dots-fill"></i>
                </div>
                <div className="sp-cinfo">
                  <small>Trực tuyến · Phản hồi &lt; 3 phút</small>
                  <h4>Chat với CSKH</h4>
                  <p>Đội ngũ chuyên viên hỗ trợ tiếng Việt &amp; tiếng Anh</p>
                  <button type="button" onClick={() => setIsChatOpen(true)} className="sp-clink">
                    Bắt đầu cuộc trò chuyện <i className="bi bi-arrow-right"></i>
                  </button>
                </div>
              </div>

              {/* Email */}
              <div className="sp-contact-card">
                <div className="sp-cicon sp-cicon--email">
                  <i className="bi bi-envelope-at-fill"></i>
                </div>
                <div className="sp-cinfo">
                  <small>Email · Phản hồi trong 15 phút</small>
                  <h4>Gửi yêu cầu hỗ trợ</h4>
                  <p>Đính kèm ảnh, video mô tả vấn đề chi tiết</p>
                  <a href="mailto:hotro@yentrip.vn" className="sp-clink">
                    hotro@yentrip.vn <i className="bi bi-arrow-up-right"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 3. TOPIC CATEGORIES ── */}
        <section className="sp-section">
          <div className="sp-container">
            <div className="sp-section-head">
              <span className="sp-section-eyebrow">
                <i className="bi bi-grid-fill"></i> Danh mục
              </span>
              <h2 className="sp-section-title">Chọn chủ đề bạn cần hỗ trợ</h2>
              <p className="sp-section-sub">Chọn đúng danh mục để được hướng dẫn nhanh nhất</p>
            </div>

            <div className="sp-topics-grid">
              {/* 1 */}
              <div className="sp-topic-card">
                <div className="sp-topic-icon ic-booking">
                  <i className="bi bi-calendar-check-fill"></i>
                </div>
                <h3 className="sp-topic-title">Đặt phòng &amp; Hủy phòng</h3>
                <p className="sp-topic-desc">Quy trình giữ chỗ, thay đổi ngày lưu trú, chính sách hủy và bồi hoàn.</p>
                <ul className="sp-topic-links">
                  <li>
                    <button type="button" onClick={() => selectSupportTag('Hủy phòng')}>
                      <span>Hủy phòng miễn phí trước 48 giờ</span>
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={() => selectSupportTag('Gia hạn')}>
                      <span>Cách gia hạn ngày ở</span>
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={() => selectSupportTag('Xác nhận')}>
                      <span>Không nhận được email xác nhận</span>
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </li>
                </ul>
              </div>

              {/* 2 */}
              <div className="sp-topic-card">
                <div className="sp-topic-icon ic-payment">
                  <i className="bi bi-wallet2"></i>
                </div>
                <h3 className="sp-topic-title">Thanh toán &amp; Hoàn tiền</h3>
                <p className="sp-topic-desc">VNPAY, MoMo, thẻ quốc tế và thời gian hoàn tiền khi hủy đặt phòng.</p>
                <ul className="sp-topic-links">
                  <li>
                    <button type="button" onClick={() => selectSupportTag('VNPAY')}>
                      <span>Thanh toán QR Code VNPAY</span>
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={() => selectSupportTag('Hoàn tiền')}>
                      <span>Lịch hoàn tiền về tài khoản</span>
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={() => selectSupportTag('Hóa đơn')}>
                      <span>Xuất hóa đơn VAT</span>
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </li>
                </ul>
              </div>

              {/* 3 */}
              <div className="sp-topic-card">
                <div className="sp-topic-icon ic-experience">
                  <i className="bi bi-compass-fill"></i>
                </div>
                <h3 className="sp-topic-title">Trải nghiệm bản địa</h3>
                <p className="sp-topic-desc">Hái trái miệt vườn, sinh hoạt cùng chủ nhà, làng nghề truyền thống.</p>
                <ul className="sp-topic-links">
                  <li>
                    <button type="button" onClick={() => selectSupportTag('Quy tắc')}>
                      <span>Văn hóa ứng xử làng quê</span>
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={() => selectSupportTag('Ẩm thực')}>
                      <span>Đặt trước bữa ăn bản địa</span>
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={() => selectSupportTag('Thú cưng')}>
                      <span>Homestay pet-friendly</span>
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </li>
                </ul>
              </div>

              {/* 4 */}
              <div className="sp-topic-card">
                <div className="sp-topic-icon ic-host">
                  <i className="bi bi-house-heart-fill"></i>
                </div>
                <h3 className="sp-topic-title">Dành cho Chủ nhà</h3>
                <p className="sp-topic-desc">Đăng ký Host, quản lý lịch phòng, nhận thanh toán, nâng hạng sao YÊN.</p>
                <ul className="sp-topic-links">
                  <li>
                    <button type="button" onClick={() => selectSupportTag('Đăng ký chủ nhà')}>
                      <span>Đăng ký trở thành đối tác</span>
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={() => selectSupportTag('Chiết khấu')}>
                      <span>Chính sách hoa hồng đối tác</span>
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={() => selectSupportTag('Chứng nhận xanh')}>
                      <span>Tiêu chuẩn Homestay Xanh</span>
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </li>
                </ul>
              </div>

              {/* 5 */}
              <div className="sp-topic-card">
                <div className="sp-topic-icon ic-account">
                  <i className="bi bi-person-lock"></i>
                </div>
                <h3 className="sp-topic-title">Tài khoản &amp; Bảo mật</h3>
                <p className="sp-topic-desc">Quản lý hồ sơ, đổi mật khẩu, xác thực hai lớp và bảo vệ dữ liệu cá nhân.</p>
                <ul className="sp-topic-links">
                  <li>
                    <button type="button" onClick={() => selectSupportTag('Đổi mật khẩu')}>
                      <span>Quên mật khẩu &amp; đặt lại OTP</span>
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={() => selectSupportTag('Cập nhật thông tin')}>
                      <span>Cập nhật số điện thoại</span>
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={() => selectSupportTag('Xác thực')}>
                      <span>Bật xác thực hai lớp (2FA)</span>
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </li>
                </ul>
              </div>

              {/* 6 */}
              <div className="sp-topic-card">
                <div className="sp-topic-icon ic-safety">
                  <i className="bi bi-shield-check"></i>
                </div>
                <h3 className="sp-topic-title">An toàn &amp; Tiêu chuẩn Xanh</h3>
                <p className="sp-topic-desc">Vệ sinh phòng, bảo hiểm lưu trú, du lịch sinh thái bền vững và sự cố.</p>
                <ul className="sp-topic-links">
                  <li>
                    <button type="button" onClick={() => selectSupportTag('Tiêu chuẩn vệ sinh')}>
                      <span>Quy trình khử khuẩn phòng</span>
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={() => selectSupportTag('Bảo hiểm')}>
                      <span>Quyền lợi bảo hiểm lưu trú</span>
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={() => selectSupportTag('Sự cố')}>
                      <span>Xử lý sự cố trong chuyến đi</span>
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── 4. FAQ SECTION ── */}
        <section className="sp-section sp-section--alt" id="faqSection">
          <div className="sp-container">
            <div className="sp-section-head">
              <span className="sp-section-eyebrow">
                <i className="bi bi-question-circle-fill"></i> FAQ
              </span>
              <h2 className="sp-section-title">Câu hỏi thường gặp</h2>
              <p className="sp-section-sub">Nhấn vào câu hỏi để xem câu trả lời chi tiết</p>
            </div>

            <div className="sp-faq-wrap">
              {/* Sidebar filter tabs */}
              <aside className="sp-faq-sidebar">
                <button
                  type="button"
                  className={`sp-faq-tab ${activeFaqCategory === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveFaqCategory('all')}
                >
                  <i className="bi bi-grid-fill"></i> Tất cả
                </button>
                <button
                  type="button"
                  className={`sp-faq-tab ${activeFaqCategory === 'booking' ? 'active' : ''}`}
                  onClick={() => setActiveFaqCategory('booking')}
                >
                  <i className="bi bi-calendar2-check"></i> Đặt &amp; Hủy phòng
                </button>
                <button
                  type="button"
                  className={`sp-faq-tab ${activeFaqCategory === 'payment' ? 'active' : ''}`}
                  onClick={() => setActiveFaqCategory('payment')}
                >
                  <i className="bi bi-credit-card"></i> Thanh toán
                </button>
                <button
                  type="button"
                  className={`sp-faq-tab ${activeFaqCategory === 'experience' ? 'active' : ''}`}
                  onClick={() => setActiveFaqCategory('experience')}
                >
                  <i className="bi bi-compass"></i> Trải nghiệm
                </button>
                <button
                  type="button"
                  className={`sp-faq-tab ${activeFaqCategory === 'host' ? 'active' : ''}`}
                  onClick={() => setActiveFaqCategory('host')}
                >
                  <i className="bi bi-house-door"></i> Chủ nhà
                </button>
              </aside>

              {/* Accordion list */}
              <div className="sp-accordion" id="faqAccordion">
                {filteredFaqs.map((faq) => {
                  const isOpen = openFaqIds.has(faq.id);
                  return (
                    <div key={faq.id} className={`sp-acc-item ${isOpen ? 'open' : ''}`}>
                      <div className="sp-acc-q" onClick={() => toggleFaq(faq.id)}>
                        <span className="sp-acc-q-text">{faq.question}</span>
                        <div className="sp-acc-icon">
                          <i className="bi bi-chevron-down"></i>
                        </div>
                      </div>
                      <div className="sp-acc-body">
                        <div className="sp-acc-body-inner">{faq.answer}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ── 5. SUPPORT TICKET FORM ── */}
        <section className="sp-section">
          <div className="sp-container">
            <div className="sp-ticket-wrap">
              {/* Left sidebar info */}
              <div className="sp-ticket-sidebar">
                <span className="sp-section-eyebrow">
                  <i className="bi bi-send-fill"></i> Gửi yêu cầu
                </span>
                <h3>
                  Chưa tìm thấy<br />
                  câu trả lời?
                </h3>
                <p>
                  Mô tả chi tiết vấn đề bạn đang gặp — đội ngũ CSKH YÊN sẽ phản hồi trong vòng <strong>15 phút</strong> trong giờ làm việc, và trong vòng <strong>1 giờ</strong> ngoài giờ.
                </p>

                <div className="sp-meta-badge">
                  <i className="bi bi-lightning-charge-fill"></i>
                  Thời gian xử lý trung bình: 11 phút
                </div>
                <div className="sp-meta-badge">
                  <i className="bi bi-patch-check-fill"></i>
                  Tỉ lệ giải quyết thành công: 98.4%
                </div>
                <div className="sp-meta-badge">
                  <i className="bi bi-translate"></i>
                  Hỗ trợ Tiếng Việt · Tiếng Anh · Tiếng Trung
                </div>
              </div>

              {/* Right form card */}
              <div className="sp-form-card">
                <form className="sp-form-grid" id="ticketForm" onSubmit={handleTicketSubmit}>
                  <div className="sp-fgroup">
                    <label className="sp-label" htmlFor="ticketName">
                      Họ và tên <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      id="ticketName"
                      className="sp-input"
                      placeholder="Nguyễn Văn A"
                      value={ticketForm.name}
                      onChange={(e) => setTicketForm({ ...ticketForm, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="sp-fgroup">
                    <label className="sp-label" htmlFor="ticketPhone">
                      Số điện thoại <span className="req">*</span>
                    </label>
                    <input
                      type="tel"
                      id="ticketPhone"
                      className="sp-input"
                      placeholder="0949 050 888"
                      value={ticketForm.phone}
                      onChange={(e) => setTicketForm({ ...ticketForm, phone: e.target.value })}
                      required
                    />
                  </div>

                  <div className="sp-fgroup">
                    <label className="sp-label" htmlFor="ticketEmail">
                      Email <span className="req">*</span>
                    </label>
                    <input
                      type="email"
                      id="ticketEmail"
                      className="sp-input"
                      placeholder="email@gmail.com"
                      value={ticketForm.email}
                      onChange={(e) => setTicketForm({ ...ticketForm, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="sp-fgroup">
                    <label className="sp-label" htmlFor="ticketCode">
                      Mã đặt phòng
                    </label>
                    <input
                      type="text"
                      id="ticketCode"
                      className="sp-input"
                      placeholder="YEN-88294 (không bắt buộc)"
                      value={ticketForm.code}
                      onChange={(e) => setTicketForm({ ...ticketForm, code: e.target.value })}
                    />
                  </div>

                  <div className="sp-fgroup sp-full">
                    <label className="sp-label" htmlFor="ticketTopic">
                      Chủ đề hỗ trợ <span className="req">*</span>
                    </label>
                    <select
                      id="ticketTopic"
                      className="sp-select sp-input"
                      value={ticketForm.topic}
                      onChange={(e) => setTicketForm({ ...ticketForm, topic: e.target.value })}
                      required
                    >
                      <option value="booking">Hủy phòng / Thay đổi ngày ở</option>
                      <option value="payment">Thanh toán &amp; Hoàn tiền</option>
                      <option value="feedback">Phản ánh chất lượng dịch vụ</option>
                      <option value="host">Tư vấn đăng ký Chủ nhà (Host)</option>
                      <option value="account">Tài khoản &amp; Bảo mật</option>
                      <option value="other">Vấn đề khác</option>
                    </select>
                  </div>

                  <div className="sp-fgroup sp-full">
                    <label className="sp-label" htmlFor="ticketMessage">
                      Nội dung chi tiết <span className="req">*</span>
                    </label>
                    <textarea
                      id="ticketMessage"
                      className="sp-textarea"
                      placeholder="Mô tả cụ thể vấn đề bạn gặp phải..."
                      value={ticketForm.message}
                      onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                      required
                    ></textarea>
                  </div>

                  <div className="sp-fgroup sp-full">
                    <label className="sp-label">Đính kèm tệp (ảnh lỗi, biên lai...)</label>
                    <div
                      className="sp-upload"
                      onClick={() => document.getElementById('ticketFile').click()}
                    >
                      <i className="bi bi-cloud-arrow-up-fill"></i>
                      <p>
                        <strong>Nhấp để chọn tệp</strong> hoặc kéo thả vào đây
                      </p>
                      {ticketForm.fileName ? (
                        <p style={{ marginTop: '4px', fontSize: '.82rem', color: '#15803d', fontWeight: 'bold' }}>
                          Đã chọn: {ticketForm.fileName}
                        </p>
                      ) : (
                        <p style={{ marginTop: '4px', fontSize: '.78rem', color: '#94a3b8' }}>
                          JPG, PNG, PDF · Tối đa 10 MB
                        </p>
                      )}
                      <input
                        type="file"
                        id="ticketFile"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setTicketForm({ ...ticketForm, fileName: e.target.files[0].name });
                            showToast(`Đã chọn tệp: ${e.target.files[0].name}`);
                          }
                        }}
                      />
                    </div>
                  </div>

                  <button type="submit" className="sp-btn-submit">
                    <i className="bi bi-send-check-fill"></i> Gửi yêu cầu hỗ trợ
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Floating Chat Button */}
      <button className="sp-chat-fab" onClick={() => setIsChatOpen(true)} title="Chat với CSKH YÊN" type="button">
        <span className="fab-dot"></span>
        <i className="bi bi-chat-heart-fill" style={{ fontSize: '1.1rem' }}></i>
        Chat trực tuyến
      </button>

      {/* Live Chat Modal */}
      <div className={`sp-chat-overlay ${isChatOpen ? 'active' : ''}`} id="liveChatModal">
        <div className="sp-chat-window">
          <div className="sp-chat-head">
            <div className="sp-chat-head-info">
              <div className="sp-chat-avatar">YÊN</div>
              <div>
                <h5>CSKH YÊN Homestay</h5>
                <span>
                  <span className="sp-online-dot"></span> Đang trực tuyến
                </span>
              </div>
            </div>
            <button className="sp-chat-close" onClick={() => setIsChatOpen(false)} type="button">
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          <div className="sp-chat-msgs" id="chatMsgs">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`sp-msg ${msg.sender === 'user' ? 'sp-msg--user' : 'sp-msg--bot'}`}
              >
                {msg.text}
              </div>
            ))}
            <div ref={chatMsgsEndRef} />
          </div>

          <div className="sp-chat-input-area">
            <input
              type="text"
              id="chatInput"
              className="sp-chat-input"
              placeholder="Nhập tin nhắn..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendChat();
              }}
            />
            <button className="sp-chat-send" onClick={handleSendChat} type="button">
              <i className="bi bi-send-fill"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <div className={`sp-toast ${toast.show ? 'show' : ''}`} id="spToast">
        <i className="bi bi-check-circle-fill"></i>
        <span>{toast.msg}</span>
      </div>
    </div>
  );
}
