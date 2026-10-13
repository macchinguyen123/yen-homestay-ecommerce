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
    private Long userId(Authentication auth) { try { if (auth != null && auth.isAuthenticated()) return Long.valueOf(auth.getName()); } catch (Exception ignored) {} throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Phiên đăng nhập không hợp lệ"); }
    @GetMapping public List<Notification> list(Authentication auth) { return service.findForUser(userId(auth)); }
    @GetMapping("/unread-count") public Map<String, Long> unread(Authentication auth) { return Map.of("count", service.unreadCount(userId(auth))); }
    @PatchMapping("/{id}/read") public Notification read(@PathVariable Long id, Authentication auth) { return service.markRead(id, userId(auth)); }
    @PatchMapping("/read-all") public Map<String, Integer> readAll(Authentication auth) { return Map.of("updated", service.markAllRead(userId(auth))); }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void delete(@PathVariable Long id, Authentication auth) { service.delete(id, userId(auth)); }
}
