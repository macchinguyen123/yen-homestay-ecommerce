package vn.edu.hcmuaf.fit.springboot.config;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

@Component @RequiredArgsConstructor
public class NotificationWebSocketHandler extends TextWebSocketHandler {
    private final ConcurrentHashMap<Long, CopyOnWriteArraySet<WebSocketSession>> sessions = new ConcurrentHashMap<>();
    @Override public void afterConnectionEstablished(WebSocketSession session) {
        Object id = session.getAttributes().get("userId");
        if (id instanceof Long userId) sessions.computeIfAbsent(userId, ignored -> new CopyOnWriteArraySet<>()).add(session);
    }
    @Override public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        Object id = session.getAttributes().get("userId");
        if (id instanceof Long userId) { var set = sessions.get(userId); if (set != null) { set.remove(session); if (set.isEmpty()) sessions.remove(userId, set); } }
    }
    public void sendToUser(Long userId, String message) {
        var userSessions = sessions.get(userId); if (userSessions == null) return;
        for (WebSocketSession session : userSessions) try { if (session.isOpen()) session.sendMessage(new TextMessage(message)); } catch (Exception ignored) { }
    }
}
