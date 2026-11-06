package vn.edu.hcmuaf.fit.springboot.controller;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import vn.edu.hcmuaf.fit.springboot.service.NotificationService;

import java.util.*;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class ChatController {
    private final JdbcTemplate jdbc;
    private final NotificationService notificationService;

    @PostConstruct
    public void initDb() {
        try {
            jdbc.execute("CREATE TABLE IF NOT EXISTS chat_conversations (" +
                    "conversation_id BIGSERIAL PRIMARY KEY, " +
                    "homestay_id BIGINT, " +
                    "customer_id BIGINT NOT NULL, " +
                    "owner_id BIGINT NOT NULL, " +
                    "conversation_type VARCHAR(20) DEFAULT 'HOMESTAY', " +
                    "last_message TEXT, " +
                    "last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, " +
                    "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                    ")");

            try {
                jdbc.execute("ALTER TABLE chat_conversations ALTER COLUMN homestay_id DROP NOT NULL");
            } catch (Exception ignored) {}

            try {
                jdbc.execute("ALTER TABLE chat_conversations ADD COLUMN IF NOT EXISTS conversation_type VARCHAR(20) DEFAULT 'HOMESTAY'");
            } catch (Exception ignored) {}

            jdbc.execute("CREATE UNIQUE INDEX IF NOT EXISTS uk_chat_homestay_customer ON chat_conversations (homestay_id, customer_id) WHERE homestay_id IS NOT NULL");
            jdbc.execute("CREATE UNIQUE INDEX IF NOT EXISTS uk_chat_support_customer ON chat_conversations (customer_id) WHERE conversation_type = 'SUPPORT'");

            jdbc.execute("CREATE TABLE IF NOT EXISTS chat_messages (" +
                    "message_id BIGSERIAL PRIMARY KEY, " +
                    "conversation_id BIGINT NOT NULL REFERENCES chat_conversations(conversation_id) ON DELETE CASCADE, " +
                    "sender_id BIGINT NOT NULL, " +
                    "content TEXT NOT NULL, " +
                    "image_url TEXT, " +
                    "is_read BOOLEAN DEFAULT FALSE, " +
                    "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                    ")");

            jdbc.execute("CREATE INDEX IF NOT EXISTS idx_chat_messages_conv ON chat_messages(conversation_id)");
            try {
                jdbc.execute("ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS image_url TEXT");
            } catch (Exception ignored) {}
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

    private Long findDefaultAdminId() {
        try {
            List<Long> admins = jdbc.queryForList("SELECT user_id FROM users WHERE UPPER(role) = 'ADMIN' ORDER BY user_id ASC LIMIT 1", Long.class);
            if (!admins.isEmpty() && admins.get(0) != null) {
                return admins.get(0);
            }
        } catch (Exception ignored) {}
        return 1L; // Fallback admin ID
    }

    private Map<String, Object> conversation(long id, long user) {
        List<Map<String, Object>> uRows = jdbc.queryForList("SELECT role FROM users WHERE user_id=?", user);
        boolean isAdmin = !uRows.isEmpty() && "ADMIN".equalsIgnoreCase(String.valueOf(uRows.get(0).get("role")));

        String sql = isAdmin
                ? "SELECT c.*, COALESCE(h.name, CASE WHEN c.conversation_type = 'SUPPORT' THEN 'Trung tâm CSKH YÊN Homestay' ELSE 'Homestay' END) AS homestay_name FROM chat_conversations c LEFT JOIN homestays h ON h.homestay_id = c.homestay_id WHERE c.conversation_id = ?"
                : "SELECT c.*, COALESCE(h.name, CASE WHEN c.conversation_type = 'SUPPORT' THEN 'Trung tâm CSKH YÊN Homestay' ELSE 'Homestay' END) AS homestay_name FROM chat_conversations c LEFT JOIN homestays h ON h.homestay_id = c.homestay_id WHERE c.conversation_id = ? AND (c.customer_id = ? OR c.owner_id = ?)";

        List<Map<String, Object>> rows = isAdmin
                ? jdbc.queryForList(sql, id)
                : jdbc.queryForList(sql, id, user, user);

        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không thuộc cuộc trò chuyện này");
        }
        return rows.get(0);
    }

    /**
     * Mở hoặc tạo mới cuộc trò chuyện với Homestay
     */
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
                    "SELECT c.conversation_id, c.homestay_id, c.customer_id, c.owner_id, c.conversation_type, c.last_message, " +
                    "TO_CHAR(COALESCE(c.last_message_at, c.created_at) AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD\"T\"HH24:MI:SS+07:00') AS last_message_at, " +
                    "TO_CHAR(c.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD\"T\"HH24:MI:SS+07:00') AS created_at, " +
                    "h.name AS homestay_name " +
                    "FROM chat_conversations c " +
                    "LEFT JOIN homestays h ON h.homestay_id = c.homestay_id " +
                    "WHERE c.homestay_id = ? AND c.owner_id = ? " +
                    "ORDER BY c.last_message_at DESC NULLS LAST LIMIT 1",
                    hid, user);
            if (!existing.isEmpty()) {
                return existing.get(0);
            }
            long defaultCust = (user == 1L) ? 8L : 1L;
            jdbc.update(
                    "INSERT INTO chat_conversations(homestay_id, customer_id, owner_id, conversation_type, last_message) VALUES(?,?,?,'HOMESTAY',?) " +
                    "ON CONFLICT (homestay_id, customer_id) DO NOTHING",
                    hid, defaultCust, owner, "Kênh tư vấn & hỗ trợ khách hàng");
            return jdbc.queryForMap(
                    "SELECT c.conversation_id, c.homestay_id, c.customer_id, c.owner_id, c.conversation_type, c.last_message, " +
                    "TO_CHAR((COALESCE(c.last_message_at, c.created_at) AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD\"T\"HH24:MI:SS+07:00') AS last_message_at, " +
                    "TO_CHAR((c.created_at AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD\"T\"HH24:MI:SS+07:00') AS created_at, " +
                    "h.name AS homestay_name " +
                    "FROM chat_conversations c LEFT JOIN homestays h ON h.homestay_id = c.homestay_id WHERE c.homestay_id = ? AND c.owner_id = ? LIMIT 1",
                    hid, user);
        }

        jdbc.update(
                "INSERT INTO chat_conversations(homestay_id, customer_id, owner_id, conversation_type) VALUES(?,?,?,'HOMESTAY') " +
                "ON CONFLICT (homestay_id, customer_id) DO NOTHING",
                hid, user, owner);

        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT c.conversation_id, c.homestay_id, c.customer_id, c.owner_id, c.conversation_type, c.last_message, " +
                "TO_CHAR((COALESCE(c.last_message_at, c.created_at) AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD\"T\"HH24:MI:SS+07:00') AS last_message_at, " +
                "TO_CHAR((c.created_at AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD\"T\"HH24:MI:SS+07:00') AS created_at, " +
                "h.name AS homestay_name " +
                "FROM chat_conversations c " +
                "LEFT JOIN homestays h ON h.homestay_id = c.homestay_id " +
                "WHERE c.homestay_id = ? AND c.customer_id = ?",
                hid, user);
        if (rows.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Không thể mở cuộc trò chuyện");
        }
        return rows.get(0);
    }

    /**
     * Mở hoặc tạo mới cuộc trò chuyện với Bộ phận CSKH YÊN (User <-> Admin)
     */
    @PostMapping("/support")
    public Map<String, Object> openSupport(
            @RequestHeader(value = "X-User-Id", required = false) Long xUserId,
            Authentication a) {
        long user = me(a, xUserId);
        Long adminId = findDefaultAdminId();

        // Kiểm tra xem đã có cuộc trò chuyện SUPPORT của user này chưa
        List<Map<String, Object>> existing = jdbc.queryForList(
                "SELECT c.conversation_id, c.homestay_id, c.customer_id, c.owner_id, c.conversation_type, c.last_message, " +
                "TO_CHAR((COALESCE(c.last_message_at, c.created_at) AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD\"T\"HH24:MI:SS+07:00') AS last_message_at, " +
                "TO_CHAR((c.created_at AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD\"T\"HH24:MI:SS+07:00') AS created_at, " +
                "'Trung tâm CSKH YÊN Homestay' AS homestay_name, " +
                "'Bộ phận CSKH YÊN' AS other_party_name " +
                "FROM chat_conversations c " +
                "WHERE c.customer_id = ? AND c.conversation_type = 'SUPPORT' " +
                "LIMIT 1",
                user);

        if (!existing.isEmpty()) {
            return existing.get(0);
        }

        // Tạo cuộc trò chuyện CSKH mới
        String welcome = "Xin chào bạn! Đây là Trung tâm Chăm sóc khách hàng YÊN Homestay. Chúng tôi luôn sẵn sàng hỗ trợ bạn 24/7. Bạn cần giải đáp hoặc hỗ trợ vấn đề gì ạ?";
        Number newId = jdbc.queryForObject(
                "INSERT INTO chat_conversations(homestay_id, customer_id, owner_id, conversation_type, last_message, last_message_at) " +
                "VALUES(NULL, ?, ?, 'SUPPORT', ?, CURRENT_TIMESTAMP) RETURNING conversation_id",
                Long.class, user, adminId, welcome);

        if (newId != null) {
            long convId = newId.longValue();
            // Gửi tin nhắn chào mừng tự động từ Admin
            jdbc.update(
                    "INSERT INTO chat_messages(conversation_id, sender_id, content, created_at, is_read) VALUES(?,?,?, CURRENT_TIMESTAMP, FALSE)",
                    convId, adminId, welcome);

            return jdbc.queryForMap(
                    "SELECT c.conversation_id, c.homestay_id, c.customer_id, c.owner_id, c.conversation_type, c.last_message, " +
                    "TO_CHAR((COALESCE(c.last_message_at, c.created_at) AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD\"T\"HH24:MI:SS+07:00') AS last_message_at, " +
                    "TO_CHAR((c.created_at AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD\"T\"HH24:MI:SS+07:00') AS created_at, " +
                    "'Trung tâm CSKH YÊN Homestay' AS homestay_name, " +
                    "'Bộ phận CSKH YÊN' AS other_party_name " +
                    "FROM chat_conversations c WHERE c.conversation_id = ?",
                    convId);
        }

        throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Không thể kết nối đến Bộ phận CSKH");
    }

    @GetMapping("/conversations")
    public List<Map<String, Object>> list(
            @RequestHeader(value = "X-User-Id", required = false) Long xUserId,
            Authentication a) {
        long u = me(a, xUserId);
        List<Map<String, Object>> uRows = jdbc.queryForList("SELECT role FROM users WHERE user_id=?", u);
        boolean isAdmin = !uRows.isEmpty() && "ADMIN".equalsIgnoreCase(String.valueOf(uRows.get(0).get("role")));

        String sql = isAdmin
                ? "SELECT c.conversation_id, c.homestay_id, c.customer_id, c.owner_id, c.conversation_type, c.last_message, " +
                  "TO_CHAR((COALESCE(c.last_message_at, c.created_at) AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD\"T\"HH24:MI:SS+07:00') AS last_message_at, " +
                  "TO_CHAR((c.created_at AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD\"T\"HH24:MI:SS+07:00') AS created_at, " +
                  "COALESCE(h.name, CASE WHEN c.conversation_type = 'SUPPORT' THEN 'Trung tâm CSKH YÊN Homestay' ELSE 'Homestay' END) AS homestay_name, " +
                  "COALESCE((SELECT u2.full_name FROM users u2 WHERE u2.user_id = c.customer_id), 'Khách hàng') AS other_party_name, " +
                  "COALESCE((SELECT COUNT(*) FROM chat_messages m WHERE m.conversation_id = c.conversation_id AND m.is_read = FALSE AND m.sender_id <> ?), 0) AS unread_count " +
                  "FROM chat_conversations c " +
                  "LEFT JOIN homestays h ON h.homestay_id = c.homestay_id " +
                  "ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC"
                : "SELECT c.conversation_id, c.homestay_id, c.customer_id, c.owner_id, c.conversation_type, c.last_message, " +
                  "TO_CHAR((COALESCE(c.last_message_at, c.created_at) AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD\"T\"HH24:MI:SS+07:00') AS last_message_at, " +
                  "TO_CHAR((c.created_at AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD\"T\"HH24:MI:SS+07:00') AS created_at, " +
                  "COALESCE(h.name, CASE WHEN c.conversation_type = 'SUPPORT' THEN 'Trung tâm CSKH YÊN Homestay' ELSE 'Homestay' END) AS homestay_name, " +
                  "CASE WHEN c.conversation_type = 'SUPPORT' AND c.customer_id = ? THEN 'Bộ phận CSKH YÊN' " +
                  "     ELSE COALESCE((SELECT u2.full_name FROM users u2 WHERE u2.user_id = (CASE WHEN c.customer_id = ? THEN c.owner_id ELSE c.customer_id END)), 'Người dùng') END AS other_party_name, " +
                  "COALESCE((SELECT COUNT(*) FROM chat_messages m WHERE m.conversation_id = c.conversation_id AND m.is_read = FALSE AND m.sender_id <> ?), 0) AS unread_count " +
                  "FROM chat_conversations c " +
                  "LEFT JOIN homestays h ON h.homestay_id = c.homestay_id " +
                  "WHERE c.customer_id = ? OR c.owner_id = ? " +
                  "ORDER BY (CASE WHEN c.conversation_type = 'SUPPORT' THEN 1 ELSE 0 END) DESC, c.last_message_at DESC NULLS LAST, c.created_at DESC";

        return isAdmin ? jdbc.queryForList(sql, u) : jdbc.queryForList(sql, u, u, u, u, u);
    }

    @GetMapping("/conversations/{id}/messages")
    public List<Map<String, Object>> messages(
            @PathVariable long id,
            @RequestHeader(value = "X-User-Id", required = false) Long xUserId,
            Authentication a) {
        long u = me(a, xUserId);
        conversation(id, u);
        return jdbc.queryForList(
                "SELECT m.message_id, m.conversation_id, m.sender_id, m.content, m.image_url, m.is_read, " +
                "TO_CHAR((m.created_at AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD\"T\"HH24:MI:SS+07:00') AS created_at, " +
                "COALESCE(u.full_name, 'Người dùng') AS sender_name, u.avatar AS sender_avatar, u.role AS sender_role " +
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
        Map<String, Object> conv = conversation(id, u);
        String text = String.valueOf(body.getOrDefault("content", "")).trim();
        String imageUrl = body.get("imageUrl") != null ? String.valueOf(body.get("imageUrl")).trim() : null;
        if (imageUrl != null && imageUrl.isEmpty()) imageUrl = null;

        if (text.isEmpty() && imageUrl == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nội dung hoặc hình ảnh không được để trống");
        }

        String lastMsg = !text.isEmpty() ? text : "[Hình ảnh]";

        try {
            jdbc.update("INSERT INTO chat_messages(conversation_id, sender_id, content, image_url, created_at) VALUES(?,?,?,?, CURRENT_TIMESTAMP)", id, u, text, imageUrl);
        } catch (Exception ex) {
            jdbc.update("INSERT INTO chat_messages(conversation_id, sender_id, content, created_at) VALUES(?,?,?, CURRENT_TIMESTAMP)", id, u, !text.isEmpty() ? text : (imageUrl != null ? "[Hình ảnh]" : ""));
        }

        jdbc.update("UPDATE chat_conversations SET last_message=?, last_message_at=CURRENT_TIMESTAMP WHERE conversation_id=?", lastMsg, id);

        // Bắn thông báo tương ứng cho bên nhận
        try {
            String convType = String.valueOf(conv.getOrDefault("conversation_type", "HOMESTAY"));
            long customerId = ((Number) conv.get("customer_id")).longValue();
            long ownerId = ((Number) conv.get("owner_id")).longValue();
            long receiverId = (u == customerId) ? ownerId : customerId;

            String senderName = "Khách hàng";
            List<Map<String, Object>> senderRows = jdbc.queryForList("SELECT full_name, role FROM users WHERE user_id=?", u);
            boolean senderIsAdmin = false;
            if (!senderRows.isEmpty()) {
                senderName = String.valueOf(senderRows.get(0).getOrDefault("full_name", "Người dùng"));
                senderIsAdmin = "ADMIN".equalsIgnoreCase(String.valueOf(senderRows.get(0).get("role")));
            }

            if ("SUPPORT".equalsIgnoreCase(convType)) {
                if (senderIsAdmin) {
                    notificationService.create(
                            receiverId,
                            "Tin nhắn từ CSKH YÊN Homestay",
                            "Bộ phận CSKH vừa phản hồi tin nhắn của bạn: " + (text.length() > 60 ? text.substring(0, 60) + "..." : text),
                            "SUPPORT",
                            id,
                            "/messages"
                    );
                } else {
                    notificationService.create(
                            receiverId,
                            "Yêu cầu hỗ trợ từ " + senderName,
                            senderName + ": " + (text.length() > 60 ? text.substring(0, 60) + "..." : text),
                            "SUPPORT",
                            id,
                            "/admin/messages"
                    );
                }
            }
        } catch (Exception e) {
            log.warn("Lỗi khi tạo thông báo tin nhắn: {}", e.getMessage());
        }

        List<Map<String, Object>> last = jdbc.queryForList(
                "SELECT m.message_id, m.conversation_id, m.sender_id, m.content, m.image_url, m.is_read, " +
                "TO_CHAR((m.created_at AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYY-MM-DD\"T\"HH24:MI:SS+07:00') AS created_at, " +
                "u.full_name AS sender_name, u.avatar AS sender_avatar, u.role AS sender_role " +
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
