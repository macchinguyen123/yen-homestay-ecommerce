import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="th-footer">
      <div className="th-footer-container">

        {/* ================= CỘT 1: THƯƠNG HIỆU ================= */}
        <div className="th-footer-col th-col-brand">
          <div className="th-brand-logo">
            <Link to="/" className="th-footer-logo-brand" title="YÊN - Homestay Booking">
              <i className="bi bi-house-heart-fill" style={{ color: '#fef08a' }} /> YÊN <span>Homestay</span>
            </Link>
          </div>

          <p className="th-brand-desc">
            Nền tảng kết nối du lịch nghỉ dưỡng mộc mạc, gìn giữ và lan tỏa
            giá trị văn hóa bản địa qua những homestay sinh thái
            và trải nghiệm chân thực khắp Việt Nam.
          </p>

          <div className="th-hotline-box">
            <span className="th-hotline-label">
              <i className="bi bi-headset me-1" /> Tổng đài tư vấn 24/7:
            </span>
            <a href="tel:0949050888" className="th-hotline-number">
              0949.050.888
            </a>
            <span className="th-hotline-email">
              <i className="bi bi-envelope-fill me-1" /> hotro@yenhomestay.vn
            </span>
          </div>

          <div className="th-social-links">
            <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook" title="Facebook YÊN Homestay">
              <i className="bi bi-facebook" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" title="Instagram YÊN Homestay">
              <i className="bi bi-instagram" />
            </a>
            <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube" title="YouTube YÊN Homestay">
              <i className="bi bi-youtube" />
            </a>
            <a href="https://tiktok.com" target="_blank" rel="noreferrer" aria-label="TikTok" title="TikTok YÊN Homestay">
              <i className="bi bi-tiktok" />
            </a>
          </div>
        </div>

        {/* ================= CỘT 2: KHÁM PHÁ & ĐIỂM ĐẾN ================= */}
        <div className="th-footer-col">
          <h3 className="th-footer-title">Khám phá & Điểm đến</h3>
          <ul className="th-footer-menu">
            <li>
              <Link to="/search?location=Đà Lạt">
                <i className="bi bi-geo-alt me-1.5" /> Đà Lạt – Ngắm mây & Đồi thông
              </Link>
            </li>
            <li>
              <Link to="/search?location=Sa Pa">
                <i className="bi bi-geo-alt me-1.5" /> Sa Pa – Bản Lao Chải & Tả Van
              </Link>
            </li>
            <li>
              <Link to="/search?location=Ninh Bình">
                <i className="bi bi-geo-alt me-1.5" /> Ninh Bình – Tràng An & Tam Cốc
              </Link>
            </li>
            <li>
              <Link to="/search?location=Hà Giang">
                <i className="bi bi-geo-alt me-1.5" /> Hà Giang – Cao nguyên đá hùng vĩ
              </Link>
            </li>
            <li>
              <Link to="/category/miet-vuan">
                <i className="bi bi-tree me-1.5" /> Miệt vườn & Sông nước Nam Bộ
              </Link>
            </li>
            <li>
              <Link to="/category/lang-nghe">
                <i className="bi bi-brush me-1.5" /> Làng nghề truyền thống độc bản
              </Link>
            </li>
            <li>
              <Link to="/category">
                <i className="bi bi-grid me-1.5" /> Tất cả 12 danh mục trải nghiệm
              </Link>
            </li>
          </ul>
        </div>

        {/* ================= CỘT 3: VỀ YÊN & KHÁCH HÀNG ================= */}
        <div className="th-footer-col">
          <h3 className="th-footer-title">Về YÊN & Hỗ trợ</h3>
          <ul className="th-footer-menu">
            <li>
              <Link to="/support">
                <i className="bi bi-compass me-1.5" /> Câu chuyện thương hiệu YÊN
              </Link>
            </li>
            <li>
              <Link to="/promotions">
                <i className="bi bi-ticket-perforated me-1.5" /> Mã giảm giá & Kho voucher
              </Link>
            </li>
            <li>
              <Link to="/personal-account">
                <i className="bi bi-cash-coin me-1.5" /> Ví YÊN – Hoàn tiền 5% mọi đơn
              </Link>
            </li>
            <li>
              <Link to="/bookings">
                <i className="bi bi-calendar-check me-1.5" /> Quản lý & Tra cứu đặt phòng
              </Link>
            </li>
            <li>
              <Link to="/owner/dashboard">
                <i className="bi bi-house-door me-1.5" /> Dành cho chủ nhà (Kênh đối tác)
              </Link>
            </li>
            <li>
              <Link to="/support">
                <i className="bi bi-question-circle me-1.5" /> Trung tâm trợ giúp & FAQ
              </Link>
            </li>
          </ul>
        </div>

        {/* ================= CỘT 4: THANH TOÁN & CAM KẾT ================= */}
        <div className="th-footer-col">
          <h3 className="th-footer-title">Thanh toán an toàn</h3>
          <p className="th-pay-desc">
            Bảo vệ 100% tiền cọc với cơ chế ký quỹ YÊN Care cho tới khi bạn hoàn tất nhận phòng thành công.
          </p>

          <div className="th-payment-tags">
            <span className="th-badge th-pay-tag-vnpay" title="Cổng VNPAY Sandbox">
              <i className="bi bi-shield-check me-1" /> VNPAY
            </span>
            <span className="th-badge th-pay-tag-vietqr" title="Chuyển khoản VietQR 24/7">
              <i className="bi bi-qr-code-scan me-1" /> VietQR
            </span>
            <span className="th-badge th-pay-tag-momo" title="Ví MoMo">
              <i className="bi bi-wallet2 me-1" /> MoMo
            </span>
            <span className="th-badge th-pay-tag-card" title="Thẻ thanh toán quốc tế Visa/Master">
              <i className="bi bi-credit-card me-1" /> Visa / Master
            </span>
          </div>

          <div className="th-commitment-box mb-2">
            <span className="th-leaf-icon">🛡️</span>
            <span>Bảo vệ khách hàng 100% với YÊN Care</span>
          </div>
          <div className="th-commitment-box">
            <span className="th-leaf-icon">🌿</span>
            <span>Liên minh Du lịch Sinh thái Bền vững</span>
          </div>
        </div>

      </div>

      {/* ================= FOOTER BOTTOM ================= */}
      <div className="th-footer-bottom">
        <div className="th-footer-bottom-inner">
          <p className="th-copyright">
            © 2026 YÊN Homestay Việt Nam. Giữ gìn nét đẹp bản địa – Nghỉ dưỡng mộc mạc.
          </p>

          <div className="th-legal-links">
            <Link to="/support">Điều khoản dịch vụ</Link>
            <span className="th-legal-sep">·</span>
            <Link to="/support">Chính sách bảo mật</Link>
            <span className="th-legal-sep">·</span>
            <Link to="/support">Chính sách hoàn hủy</Link>
            <span className="th-legal-sep">·</span>
            <Link to="/support">Giải quyết khiếu nại</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
