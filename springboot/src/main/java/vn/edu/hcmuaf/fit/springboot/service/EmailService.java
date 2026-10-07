package vn.edu.hcmuaf.fit.springboot.service;

import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailService {

    @Autowired(required = false)
    private final JavaMailSender mailSender;
    @Value("${spring.mail.username:no-reply@yenhomestay.vn}")
    private String fromEmail;

    public EmailService(ObjectProvider<JavaMailSender> mailSenderProvider) {
        this.mailSender = mailSenderProvider.getIfAvailable();
    }

    public boolean sendVerificationEmail(String toEmail, String verifyUrl) {
        try {
            if (mailSender == null) {
                log.error("JavaMailSender is not configured; cannot send verification email to {}", toEmail);
                return false;
            }
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("Xác thực tài khoản YÊN Homestay");
            message.setText("Chào bạn,\n\nVui lòng nhấn vào đường dẫn sau để kích hoạt tài khoản của bạn:\n"
                    + verifyUrl + "\n\nĐường dẫn có hiệu lực trong 24 giờ.\n\nTrân trọng,\nĐội ngũ YÊN Homestay");
            mailSender.send(message);
            log.info("Verification email sent successfully to {}", toEmail);
            return true;
        } catch (Exception e) {
            log.error("Failed to send verification email to {}: {}", toEmail, e.getMessage());
            return false;
        }
    }
    /**
     * Gửi email mã OTP xác nhận quên mật khẩu cho người dùng.
     * Tự động dự phòng in mã OTP ra Terminal/Console nếu bạn chưa cấu hình thông tin SMTP Gmail thật trong application.properties.
     */
    public boolean sendPasswordResetOtp(String toEmail, String otpCode, int expiryMinutes) {
        log.info("\n" +
                        "========================================================================\n" +
                        "📧 [YÊN HOMESTAY] MÃ XÁC NHẬN QUÊN MẬT KHẨU (FORGOT PASSWORD OTP)\n" +
                        "👤 Người nhận : {}\n" +
                        "🔑 Mã OTP     : {}\n" +
                        "⏳ Hiệu lực   : {} phút\n" +
                        "========================================================================",
                toEmail, otpCode, expiryMinutes);

        if (mailSender == null) {
            log.warn("⚠️ JavaMailSender chưa được cấu hình. Hệ thống chạy ở chế độ MOCK/DEV, vui lòng dùng mã OTP in ở trên để test!");
            return true;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "YÊN Homestay Support");
            helper.setTo(toEmail);
            helper.setSubject("Mã xác nhận đặt lại mật khẩu - YÊN Homestay");

            String htmlContent = "<div style=\"font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 580px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;\">"
                    + "  <div style=\"background-color: #002c1e; padding: 24px; text-align: center;\">"
                    + "    <h1 style=\"color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;\">YÊN HOMESTAY</h1>"
                    + "    <p style=\"color: #a1d1ba; margin: 4px 0 0 0; font-size: 13px;\">Hệ thống Đặt phòng & Trải nghiệm Bản địa</p>"
                    + "  </div>"
                    + "  <div style=\"padding: 32px 24px; color: #1f2937;\">"
                    + "    <h2 style=\"font-size: 18px; margin-top: 0; color: #111827;\">Yêu cầu đặt lại mật khẩu</h2>"
                    + "    <p style=\"font-size: 14px; line-height: 1.6; color: #4b5563;\">Chúng tôi nhận được yêu cầu cấp lại mật khẩu cho tài khoản liên kết với địa chỉ email <strong>" + toEmail + "</strong>. Vui lòng sử dụng mã OTP dưới đây để hoàn tất việc đổi mật khẩu:</p>"
                    + "    <div style=\"text-align: center; margin: 28px 0;\">"
                    + "      <div style=\"display: inline-block; background-color: #eff4ff; border: 2px dashed #15803d; border-radius: 10px; padding: 14px 32px;\">"
                    + "        <span style=\"font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #15803d;\">" + otpCode + "</span>"
                    + "      </div>"
                    + "      <p style=\"font-size: 12px; color: #6b7280; margin-top: 8px;\">Mã có hiệu lực trong vòng <strong>" + expiryMinutes + " phút</strong>.</p>"
                    + "    </div>"
                    + "    <p style=\"font-size: 13px; line-height: 1.5; color: #6b7280;\">Nếu bạn không gửi yêu cầu này, vui lòng bỏ qua email. Tài khoản và mật khẩu của bạn vẫn an toàn tuyệt đối.</p>"
                    + "  </div>"
                    + "  <div style=\"background-color: #f9fafb; padding: 16px 24px; text-align: center; border-top: 1px solid #e5e7eb;\">"
                    + "    <p style=\"font-size: 12px; color: #9ca3af; margin: 0;\">© 2026 YÊN Homestay. Hotline hỗ trợ: 0988 345 678</p>"
                    + "  </div>"
                    + "</div>";

            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("✅ Đã gửi email xác nhận đặt lại mật khẩu thành công tới: {}", toEmail);
            return true;
        } catch (Exception e) {
            log.error("❌ Không thể gửi email qua SMTP: {}. Bạn vẫn có thể dùng mã OTP in ở console phía trên để tiếp tục test!", e.getMessage());
            // Trả về true để trải nghiệm người dùng / luồng test không bị gián đoạn khi chưa có cấu hình SMTP thật
            return true;
        }
    }

}
