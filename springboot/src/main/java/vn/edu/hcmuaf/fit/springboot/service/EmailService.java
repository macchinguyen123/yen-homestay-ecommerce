package vn.edu.hcmuaf.fit.springboot.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(ObjectProvider<JavaMailSender> mailSenderProvider) {
        this.mailSender = mailSenderProvider.getIfAvailable();
    }

    public void sendVerificationEmail(String toEmail, String verifyUrl) {
        try {
            if (mailSender == null) {
                log.warn("JavaMailSender is not configured. Verification URL for {}: {}", toEmail, verifyUrl);
                return;
            }
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("Xác thực tài khoản YÊN Homestay");
            message.setText("Chào bạn,\n\nVui lòng nhấn vào đường dẫn sau để kích hoạt tài khoản của bạn:\n"
                    + verifyUrl + "\n\nĐường dẫn có hiệu lực trong 24 giờ.\n\nTrân trọng,\nĐội ngũ YÊN Homestay");
            mailSender.send(message);
            log.info("Verification email sent successfully to {}", toEmail);
        } catch (Exception e) {
            log.warn("Failed to send verification email to {}: {}. Verification URL: {}", toEmail, e.getMessage(), verifyUrl);
        }
    }
}
