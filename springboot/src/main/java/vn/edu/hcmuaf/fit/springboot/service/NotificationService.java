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
    public List<Notification> findForUser(Long userId) { return repository.findByUserIdOrderByCreatedAtDesc(userId); }
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
