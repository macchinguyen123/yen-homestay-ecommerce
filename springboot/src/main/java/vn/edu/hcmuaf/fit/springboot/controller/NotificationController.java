package vn.edu.hcmuaf.fit.springboot.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import vn.edu.hcmuaf.fit.springboot.model.Notification;
import vn.edu.hcmuaf.fit.springboot.service.NotificationService;
import java.util.*;
import org.springframework.security.core.Authentication;

@RestController @RequestMapping("/api/notifications") @CrossOrigin(origins = "*") @RequiredArgsConstructor
public class NotificationController {
    private final NotificationService service;
    private Long userId(Authentication auth, String xUserId) {
        try {
            if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName())) {
                return Long.valueOf(auth.getName());
            }
        } catch (Exception ignored) {}
        if (xUserId != null && !xUserId.isBlank()) {
            try { return Long.valueOf(xUserId.trim()); } catch (Exception ignored) {}
        }
        return 1L; // Fallback du khách mặc định
    }

    @GetMapping
    public List<Notification> list(Authentication auth, @RequestHeader(value = "X-User-Id", required = false) String xUserId) {
        return service.findForUser(userId(auth, xUserId));
    }

    @GetMapping("/unread-count")
    public Map<String, Long> unread(Authentication auth, @RequestHeader(value = "X-User-Id", required = false) String xUserId) {
        return Map.of("count", service.unreadCount(userId(auth, xUserId)));
    }

    @PatchMapping("/{id}/read")
    public Notification read(@PathVariable Long id, Authentication auth, @RequestHeader(value = "X-User-Id", required = false) String xUserId) {
        return service.markRead(id, userId(auth, xUserId));
    }

    @PatchMapping("/read-all")
    public Map<String, Integer> readAll(Authentication auth, @RequestHeader(value = "X-User-Id", required = false) String xUserId) {
        return Map.of("updated", service.markAllRead(userId(auth, xUserId)));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, Authentication auth, @RequestHeader(value = "X-User-Id", required = false) String xUserId) {
        service.delete(id, userId(auth, xUserId));
    }
}
