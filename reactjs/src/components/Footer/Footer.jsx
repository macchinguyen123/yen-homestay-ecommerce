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
            Nền tảng kết nối du lịch bền vững, gìn giữ và lan tỏa
            giá trị văn hóa bản địa qua những homestay sinh thái
            và trải nghiệm chân thực khắp Việt Nam.
          </p>

          <div className="th-hotline-box">
            <span className="th-hotline-label">Tổng đài tư vấn 24/7:</span>
            <a href="tel:0949050888" className="th-hotline-number">
              0949.050.888
            </a>
          </div>

          <div className="th-social-links">
            <a href="#" aria-label="Facebook">Facebook</a>
            <a href="#" aria-label="Instagram">Instagram</a>
            <a href="#" aria-label="YouTube">YouTube</a>
          </div>
        </div>

        {/* ================= CỘT 2: KHÁM PHÁ ================= */}
        <div className="th-footer-col">
          <h3 className="th-footer-title">Khám phá & Điểm đến</h3>
          <ul className="th-footer-menu">
            <li><Link to="/homestay/ha-giang">Homestay Nhà Trình Tường Hà Giang</Link></li>
            <li><Link to="/homestay/tay-nguyen">Nhà Rông Tây Nguyên & Cồng Chiêng</Link></li>
            <li><Link to="/homestay/mien-tay">Làng Nổi Miền Tây Sông Nước</Link></li>
            <li><Link to="/homestay/trai-nghiem">Trải Nghiệm Dệt Vải & Gốm Sứ</Link></li>
            <li><Link to="/homestay/le-hoi">Lễ Hội Dân Gian & Tour Sinh Thái</Link></li>
            <li><Link to="/homestay/combo">Gói Combo Du Lịch Bản Địa</Link></li>
          </ul>
        </div>

        {/* ================= CỘT 3: VỀ CHÚNG TÔI ================= */}
        <div className="th-footer-col">
          <h3 className="th-footer-title">Về Tourist Home</h3>
          <ul className="th-footer-menu">
            <li><Link to="/about">Câu chuyện thương hiệu</Link></li>
            <li><Link to="/blog">Góc nhìn văn hóa & Blog</Link></li>
            <li><Link to="/eco-policy">Chính sách du lịch bền vững</Link></li>
            <li><Link to="/green-cert">Tiêu chuẩn Chứng nhận Xanh</Link></li>
            <li><Link to="/owner/dashboard">Dành cho chủ nhà Homestay</Link></li>
            <li><Link to="/support">Trung tâm trợ giúp & FAQ</Link></li>
          </ul>
        </div>

        {/* ================= CỘT 4: THANH TOÁN ================= */}
        <div className="th-footer-col">
          <h3 className="th-footer-title">Đối tác & Thanh toán</h3>
          <p className="th-pay-desc">
            Bảo mật đa tầng theo tiêu chuẩn quốc tế và phương thức
            thanh toán an toàn, linh hoạt:
          </p>

          <div className="th-payment-tags">
            <span className="th-badge th-pay-tag-vnpay">
              <i className="bi bi-qr-code-scan me-1" /> VNPAY
            </span>
            <span className="th-badge th-pay-tag-momo">
              <i className="bi bi-wallet2 me-1" /> MoMo
            </span>
            <span className="th-badge th-pay-tag-napas">
              <i className="bi bi-bank me-1" /> NAPAS 247
            </span>
            <span className="th-badge th-pay-tag-card">
              <i className="bi bi-credit-card me-1" /> Visa / Master
            </span>
          </div>

          <div className="th-commitment-box">
            <span className="th-leaf-icon">🌿</span>
            <span>Đối tác Liên minh Du lịch Sinh thái Việt Nam</span>
          </div>
        </div>

      </div>

      {/* ================= FOOTER BOTTOM ================= */}
      <div className="th-footer-bottom">
        <div className="th-footer-bottom-inner">
          <p className="th-copyright">
            © 2026 Tourist Home Vietnam. Giữ gìn nét đẹp bản địa – Du lịch sinh thái bền vững.
          </p>

          <div className="th-legal-links">
            <a href="#">Điều khoản sử dụng</a>
            <a href="#">Chính sách bảo mật</a>
            <a href="#">Giải quyết tranh chấp</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
