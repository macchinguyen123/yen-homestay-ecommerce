package vn.edu.hcmuaf.fit.springboot.service;

import lombok.RequiredArgsConstructor;
import tools.jackson.databind.json.JsonMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.hcmuaf.fit.springboot.model.Notification;
import vn.edu.hcmuaf.fit.springboot.repository.NotificationRepository;
import vn.edu.hcmuaf.fit.springboot.config.NotificationWebSocketHandler;
import java.util.List;
import java.util.Map;

import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Service @RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository repository;
    private final NotificationWebSocketHandler websocket;
    private final JsonMapper objectMapper;
    public List<Notification> findForUser(Long userId) {
        if (userId == null) return List.of();
        List<Notification> list = repository.findByUserIdOrderByCreatedAtDesc(userId);
        if (list.isEmpty()) {
            seedInitialNotifications(userId);
            list = repository.findByUserIdOrderByCreatedAtDesc(userId);
        }
        return list;
    }

    private void seedInitialNotifications(Long userId) {
        try {
            repository.save(Notification.builder()
                    .userId(userId)
                    .title("Xác nhận bảo đảm tiền cọc an toàn")
                    .message("Hệ thống YÊN giữ an toàn 100% khoản cọc theo Chính Sách Bảo Vệ Khách Hàng cho đến khi bạn hoàn tất check-in thành công.")
                    .type("BOOKING")
                    .link("/bookings")
                    .read(false)
                    .build());

            repository.save(Notification.builder()
                    .userId(userId)
                    .title("Tặng bạn mã ưu đãi YENWELCOME15 giảm 15%")
                    .message("Chào mừng bạn đến với YÊN Homestay! Sử dụng ngay mã giảm giá 15% (tối đa 200.000đ) khi đặt bất kỳ homestay nào trên hệ thống.")
                    .type("PROMO")
                    .link("/search")
                    .read(false)
                    .build());

            repository.save(Notification.builder()
                    .userId(userId)
                    .title("Tự động tích lũy 5% vào Ví Hoàn Tiền")
                    .message("Mỗi đơn đặt phòng thanh toán thành công được tự động cộng điểm vào Ví YÊN để giảm giá cho lần đặt phòng tiếp theo.")
                    .type("CASHBACK")
                    .link("/personal-account")
                    .read(true)
                    .build());
        } catch (Exception ignored) {}
    }
    public long unreadCount(Long userId) { return repository.countByUserIdAndReadFalse(userId); }
    @Transactional public Notification markRead(Long id, Long userId) {
        Notification n = repository.findByIdAndUserId(id, userId).orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thông báo"));
        n.setRead(true); return repository.save(n);
    }
    @Transactional public int markAllRead(Long userId) { return repository.markAllRead(userId); }
    public void delete(Long id, Long userId) { repository.findByIdAndUserId(id, userId).ifPresent(repository::delete); }
    public Notification create(Long userId, String title, String message, String type, Long referenceId, String link) {
        if (userId == null) return null;
        Notification saved = repository.save(Notification.builder().userId(userId).title(title).message(message).type(type).referenceId(referenceId).link(link).build());
        Runnable push = () -> {
            try { websocket.sendToUser(userId, objectMapper.writeValueAsString(Map.of("event", "notification", "notification", saved, "unreadCount", unreadCount(userId)))); }
            catch (Exception ignored) { }
        };
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override public void afterCommit() { push.run(); }
            });
        } else push.run();
        return saved;
    }
}
