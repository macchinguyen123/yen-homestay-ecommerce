package vn.edu.hcmuaf.fit.springboot.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.*;
import org.springframework.web.socket.server.HandshakeInterceptor;
import vn.edu.hcmuaf.fit.springboot.service.SessionTokenService;
import java.util.Map;

@Configuration @EnableWebSocket @RequiredArgsConstructor
public class NotificationWebSocketConfig implements WebSocketConfigurer {
    private final NotificationWebSocketHandler handler;
    private final SessionTokenService tokens;
    @Override public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        HandshakeInterceptor auth = new HandshakeInterceptor() {
            @Override public boolean beforeHandshake(org.springframework.http.server.ServerHttpRequest request, org.springframework.http.server.ServerHttpResponse response, WebSocketHandler ws, Map<String,Object> attrs) {
                String query = request.getURI().getQuery(); if (query == null) return false;
                for (String part : query.split("&")) if (part.startsWith("token=")) {
                    Long id = tokens.verify(java.net.URLDecoder.decode(part.substring(6), java.nio.charset.StandardCharsets.UTF_8));
                    if (id != null) { attrs.put("userId", id); return true; }
                }
                return false;
            }
            @Override public void afterHandshake(org.springframework.http.server.ServerHttpRequest request, org.springframework.http.server.ServerHttpResponse response, WebSocketHandler ws, Exception ex) { }
        };
        registry.addHandler(handler, "/ws/notifications").addInterceptors(auth).setAllowedOriginPatterns("*");
    }
}
