package vn.edu.hcmuaf.fit.springboot.controller;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class ChatController {
    private final JdbcTemplate jdbc;

    @PostConstruct
    public void initDb() {
        try {
            jdbc.execute("CREATE TABLE IF NOT EXISTS chat_conversations (" +
                    "conversation_id BIGSERIAL PRIMARY KEY, " +
                    "homestay_id BIGINT NOT NULL, " +
                    "customer_id BIGINT NOT NULL, " +
                    "owner_id BIGINT NOT NULL, " +
                    "last_message TEXT, " +
                    "last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, " +
                    "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                    ")");

            jdbc.execute("CREATE UNIQUE INDEX IF NOT EXISTS uk_chat_homestay_customer ON chat_conversations (homestay_id, customer_id)");

            jdbc.execute("CREATE TABLE IF NOT EXISTS chat_messages (" +
                    "message_id BIGSERIAL PRIMARY KEY, " +
                    "conversation_id BIGINT NOT NULL REFERENCES chat_conversations(conversation_id) ON DELETE CASCADE, " +
                    "sender_id BIGINT NOT NULL, " +
                    "content TEXT NOT NULL, " +
                    "is_read BOOLEAN DEFAULT FALSE, " +
                    "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                    ")");

            jdbc.execute("CREATE INDEX IF NOT EXISTS idx_chat_messages_conv ON chat_messages(conversation_id)");
        } catch (Exception e) {
            log.warn("Lưu ý cấu trúc bảng chat: {}", e.getMessage());
        }
    }

    private long me(Authentication a, Long xUserId) {
        if (a != null && a.isAuthenticated() && !"anonymousUser".equalsIgnoreCase(String.valueOf(a.getName()))) {
            try {
                return Long.parseLong(a.getName());
            } catch (Exception ignored) {}
        }
        if (xUserId != null && xUserId > 0) {
            return xUserId;
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Bạn cần đăng nhập để sử dụng tính năng nhắn tin");
    }

    private Map<String, Object> conversation(long id, long user) {
        List<Map<String, Object>> uRows = jdbc.queryForList("SELECT role FROM users WHERE user_id=?", user);
        boolean isAdmin = !uRows.isEmpty() && "ADMIN".equalsIgnoreCase(String.valueOf(uRows.get(0).get("role")));

        String sql = isAdmin
                ? "SELECT c.*, h.name AS homestay_name FROM chat_conversations c JOIN homestays h ON h.homestay_id = c.homestay_id WHERE c.conversation_id = ?"
                : "SELECT c.*, h.name AS homestay_name FROM chat_conversations c JOIN homestays h ON h.homestay_id = c.homestay_id WHERE c.conversation_id = ? AND (c.customer_id = ? OR c.owner_id = ?)";

        List<Map<String, Object>> rows = isAdmin
                ? jdbc.queryForList(sql, id)
                : jdbc.queryForList(sql, id, user, user);

        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không thuộc cuộc trò chuyện này");
        }
        return rows.get(0);
    }

    @PostMapping("/conversations")
    public Map<String, Object> open(
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "X-User-Id", required = false) Long xUserId,
            Authentication a) {
        long user = me(a, xUserId);
        if (body == null || body.get("homestayId") == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu mã homestay");
        }
        long hid = Long.parseLong(String.valueOf(body.get("homestayId")));

        List<Map<String, Object>> hs = jdbc.queryForList("SELECT owner_id, name FROM homestays WHERE homestay_id=?", hid);
        if (hs.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Homestay không tồn tại");
        }
        long owner = ((Number) hs.get(0).get("owner_id")).longValue();

        if (owner == user) {
            List<Map<String, Object>> existing = jdbc.queryForList(
                    "SELECT c.conversation_id, c.homestay_id, c.customer_id, c.owner_id, c.last_message, " +
                    "TO_CHAR(COALESCE(c.last_message_at, c.created_at) AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD\"T\"HH24:MI:SS+07:00') AS last_message_at, " +
                    "TO_CHAR(c.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD\"T\"HH24:MI:SS+07:00') AS created_at, " +
                    "h.name AS homestay_name " +
                    "FROM chat_conversations c " +
                    "JOIN homestays h ON h.homestay_id = c.homestay_id " +
                    "WHERE c.homestay_id = ? AND c.owner_id = ? " +
                    "ORDER BY c.last_message_at DESC NULLS LAST LIMIT 1",
                    hid, user);
            if (!existing.isEmpty()) {
                return existing.get(0);
            }
            long defaultCust = (user == 1L) ? 8L : 1L;
            jdbc.update(
                    "INSERT INTO chat_conversations(homestay_id, customer_id, owner_id, last_message) VALUES(?,?,?,?) " +
                    "ON CONFLICT (homestay_id, customer_id) DO NOTHING",
                    hid, defaultCust, owner, "Kênh tư vấn & hỗ trợ khách hàng");
            return jdbc.queryForMap(
                    "SELECT c.conversation_id, c.homestay_id, c.customer_id, c.owner_id, c.last_message, " +
                    "TO_CHAR((COALESCE(c.last_message_at, c.created_at) AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD\"T\"HH24:MI:SS+07:00') AS last_message_at, " +
                    "TO_CHAR((c.created_at AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD\"T\"HH24:MI:SS+07:00') AS created_at, " +
                    "h.name AS homestay_name " +
                    "FROM chat_conversations c JOIN homestays h ON h.homestay_id = c.homestay_id WHERE c.homestay_id = ? AND c.owner_id = ? LIMIT 1",
                    hid, user);
        }

        jdbc.update(
                "INSERT INTO chat_conversations(homestay_id, customer_id, owner_id) VALUES(?,?,?) " +
                "ON CONFLICT (homestay_id, customer_id) DO NOTHING",
                hid, user, owner);

        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT c.conversation_id, c.homestay_id, c.customer_id, c.owner_id, c.last_message, " +
                "TO_CHAR((COALESCE(c.last_message_at, c.created_at) AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD\"T\"HH24:MI:SS+07:00') AS last_message_at, " +
                "TO_CHAR((c.created_at AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD\"T\"HH24:MI:SS+07:00') AS created_at, " +
                "h.name AS homestay_name " +
                "FROM chat_conversations c " +
                "JOIN homestays h ON h.homestay_id = c.homestay_id " +
                "WHERE c.homestay_id = ? AND c.customer_id = ?",
                hid, user);
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Không thể mở cuộc trò chuyện");
        }
        return rows.get(0);
    }

    @GetMapping("/conversations")
    public List<Map<String, Object>> list(
            @RequestHeader(value = "X-User-Id", required = false) Long xUserId,
            Authentication a) {
        long u = me(a, xUserId);
        List<Map<String, Object>> uRows = jdbc.queryForList("SELECT role FROM users WHERE user_id=?", u);
        boolean isAdmin = !uRows.isEmpty() && "ADMIN".equalsIgnoreCase(String.valueOf(uRows.get(0).get("role")));

        String sql = isAdmin
                ? "SELECT c.conversation_id, c.homestay_id, c.customer_id, c.owner_id, c.last_message, " +
                  "TO_CHAR((COALESCE(c.last_message_at, c.created_at) AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD\"T\"HH24:MI:SS+07:00') AS last_message_at, " +
                  "TO_CHAR((c.created_at AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD\"T\"HH24:MI:SS+07:00') AS created_at, " +
                  "h.name AS homestay_name, " +
                  "COALESCE((SELECT u2.full_name FROM users u2 WHERE u2.user_id = c.customer_id), 'Khách hàng') AS other_party_name, " +
                  "COALESCE((SELECT COUNT(*) FROM chat_messages m WHERE m.conversation_id = c.conversation_id AND m.is_read = FALSE), 0) AS unread_count " +
                  "FROM chat_conversations c " +
                  "JOIN homestays h ON h.homestay_id = c.homestay_id " +
                  "ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC"
                : "SELECT c.conversation_id, c.homestay_id, c.customer_id, c.owner_id, c.last_message, " +
                  "TO_CHAR((COALESCE(c.last_message_at, c.created_at) AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD\"T\"HH24:MI:SS+07:00') AS last_message_at, " +
                  "TO_CHAR((c.created_at AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD\"T\"HH24:MI:SS+07:00') AS created_at, " +
                  "h.name AS homestay_name, " +
                  "COALESCE((SELECT u2.full_name FROM users u2 WHERE u2.user_id = (CASE WHEN c.customer_id = ? THEN c.owner_id ELSE c.customer_id END)), 'Người dùng') AS other_party_name, " +
                  "COALESCE((SELECT COUNT(*) FROM chat_messages m WHERE m.conversation_id = c.conversation_id AND m.is_read = FALSE AND m.sender_id <> ?), 0) AS unread_count " +
                  "FROM chat_conversations c " +
                  "JOIN homestays h ON h.homestay_id = c.homestay_id " +
                  "WHERE c.customer_id = ? OR c.owner_id = ? " +
                  "ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC";

        return isAdmin ? jdbc.queryForList(sql) : jdbc.queryForList(sql, u, u, u, u);
    }

    @GetMapping("/conversations/{id}/messages")
    public List<Map<String, Object>> messages(
            @PathVariable long id,
            @RequestHeader(value = "X-User-Id", required = false) Long xUserId,
            Authentication a) {
        long u = me(a, xUserId);
        conversation(id, u);
        return jdbc.queryForList(
                "SELECT m.message_id, m.conversation_id, m.sender_id, m.content, m.is_read, " +
                "TO_CHAR((m.created_at AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD\"T\"HH24:MI:SS+07:00') AS created_at, " +
                "u.full_name AS sender_name, u.avatar AS sender_avatar " +
                "FROM chat_messages m " +
                "LEFT JOIN users u ON u.user_id = m.sender_id " +
                "WHERE m.conversation_id = ? " +
                "ORDER BY m.created_at ASC, m.message_id ASC",
                id);
    }

    @PostMapping("/conversations/{id}/messages")
    public Map<String, Object> send(
            @PathVariable long id,
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "X-User-Id", required = false) Long xUserId,
            Authentication a) {
        long u = me(a, xUserId);
        conversation(id, u);
        String text = String.valueOf(body.getOrDefault("content", "")).trim();
        if (text.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nội dung không được để trống");
        }
        jdbc.update("INSERT INTO chat_messages(conversation_id, sender_id, content, created_at) VALUES(?,?,?, CURRENT_TIMESTAMP)", id, u, text);
        jdbc.update("UPDATE chat_conversations SET last_message=?, last_message_at=CURRENT_TIMESTAMP WHERE conversation_id=?", text, id);
        List<Map<String, Object>> last = jdbc.queryForList(
                "SELECT m.message_id, m.conversation_id, m.sender_id, m.content, m.is_read, " +
                "TO_CHAR((m.created_at AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD\"T\"HH24:MI:SS+07:00') AS created_at, " +
                "u.full_name AS sender_name, u.avatar AS sender_avatar " +
                "FROM chat_messages m " +
                "LEFT JOIN users u ON u.user_id = m.sender_id " +
                "WHERE m.conversation_id = ? ORDER BY m.message_id DESC LIMIT 1",
                id);
        return last.isEmpty() ? Map.of("content", text, "sender_id", u) : last.get(0);
    }

    @PatchMapping("/conversations/{id}/read")
    public Map<String, Object> read(
            @PathVariable long id,
            @RequestHeader(value = "X-User-Id", required = false) Long xUserId,
            Authentication a) {
        long u = me(a, xUserId);
        conversation(id, u);
        jdbc.update("UPDATE chat_messages SET is_read=TRUE WHERE conversation_id=? AND sender_id<>?", id, u);
        return Map.of("success", true);
    }
}
