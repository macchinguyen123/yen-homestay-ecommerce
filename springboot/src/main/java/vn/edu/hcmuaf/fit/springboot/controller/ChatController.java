package vn.edu.hcmuaf.fit.springboot.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.core.Authentication;
import java.util.*;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ChatController {
    private final JdbcTemplate jdbc;

    private long me(Authentication a) {
        try { if (a == null || !a.isAuthenticated()) throw new Exception(); return Long.parseLong(a.getName()); }
        catch (Exception e) { throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Bạn cần đăng nhập"); }
    }

    private Map<String,Object> conversation(long id, long user) {
        List<Map<String,Object>> rows = jdbc.queryForList("SELECT c.*, h.name homestay_name FROM chat_conversations c JOIN homestays h ON h.homestay_id=c.homestay_id WHERE c.conversation_id=? AND (c.customer_id=? OR c.owner_id=?)", id,user,user);
        if (rows.isEmpty()) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không thuộc cuộc trò chuyện này");
        return rows.get(0);
    }

    @PostMapping("/conversations")
    public Map<String,Object> open(@RequestBody Map<String,Object> body, Authentication a) {
        long user=me(a), hid=Long.parseLong(String.valueOf(body.get("homestayId")));
        List<Map<String,Object>> hs=jdbc.queryForList("SELECT owner_id FROM homestays WHERE homestay_id=?",hid);
        if(hs.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Homestay không tồn tại");
        long owner=((Number)hs.get(0).get("owner_id")).longValue();
        if(owner==user) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Bạn chính là chủ homestay bạn không thể chat với bản thân");
        jdbc.update("INSERT INTO chat_conversations(homestay_id,customer_id,owner_id) VALUES(?,?,?) ON CONFLICT(homestay_id,customer_id) DO NOTHING",hid,user,owner);
        return jdbc.queryForMap("SELECT c.*,h.name homestay_name FROM chat_conversations c JOIN homestays h ON h.homestay_id=c.homestay_id WHERE c.homestay_id=? AND c.customer_id=?",hid,user);
    }

    @GetMapping("/conversations")
    public List<Map<String,Object>> list(Authentication a){long u=me(a); return jdbc.queryForList("SELECT c.*,h.name homestay_name FROM chat_conversations c JOIN homestays h ON h.homestay_id=c.homestay_id WHERE c.customer_id=? OR c.owner_id=? ORDER BY c.last_message_at DESC NULLS LAST,c.created_at DESC",u,u);}

    @GetMapping("/conversations/{id}/messages")
    public List<Map<String,Object>> messages(@PathVariable long id, Authentication a){long u=me(a);conversation(id,u);return jdbc.queryForList("SELECT * FROM chat_messages WHERE conversation_id=? ORDER BY created_at ASC",id);}

    @PostMapping("/conversations/{id}/messages")
    public Map<String,Object> send(@PathVariable long id,@RequestBody Map<String,Object> body,Authentication a){long u=me(a);Map<String,Object> c=conversation(id,u);String text=String.valueOf(body.getOrDefault("content","")).trim();if(text.isEmpty())throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Nội dung không được để trống");jdbc.update("INSERT INTO chat_messages(conversation_id,sender_id,content) VALUES(?,?,?)",id,u,text);jdbc.update("UPDATE chat_conversations SET last_message=?,last_message_at=CURRENT_TIMESTAMP WHERE conversation_id=?",text,id);return jdbc.queryForMap("SELECT * FROM chat_messages WHERE conversation_id=? ORDER BY message_id DESC LIMIT 1",id);}

    @PatchMapping("/conversations/{id}/read")
    public Map<String,Object> read(@PathVariable long id,Authentication a){long u=me(a);Map<String,Object> c=conversation(id,u);jdbc.update("UPDATE chat_messages SET is_read=TRUE WHERE conversation_id=? AND sender_id<>?",id,u);return Map.of("success",true);}
}
