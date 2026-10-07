package vn.edu.hcmuaf.fit.springboot.controller;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/public/fix-sequences")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class FixSequencesController {
    private final JdbcTemplate jdbc;

    @GetMapping
    public ResponseEntity<?> fix() {
        Map<String, Object> res = new HashMap<>();
        String[] tables = new String[]{"reviews", "reports", "bookings", "payments", "users", "homestays", "rooms", "guest_tasks"};
        String[] pks = new String[]{"review_id", "report_id", "booking_id", "payment_id", "user_id", "homestay_id", "room_id", "task_id"};

        for (int i = 0; i < tables.length; i++) {
            String table = tables[i];
            String pk = pks[i];
            String seq = table + "_" + pk + "_seq";
            try {
                jdbc.execute("CREATE SEQUENCE IF NOT EXISTS " + seq);
                Long maxId = jdbc.queryForObject("SELECT COALESCE(MAX(" + pk + "), 0) FROM " + table, Long.class);
                if (maxId == null) maxId = 0L;
                jdbc.execute("SELECT setval('" + seq + "', " + Math.max(maxId, 1L) + ")");
                jdbc.execute("ALTER TABLE " + table + " ALTER COLUMN " + pk + " SET DEFAULT nextval('" + seq + "')");
                res.put(table, "OK (maxId=" + maxId + ", seq=" + seq + ")");
            } catch (Exception e) {
                res.put(table, "ERR: " + e.getMessage());
            }
        }
        return ResponseEntity.ok(res);
    }
}