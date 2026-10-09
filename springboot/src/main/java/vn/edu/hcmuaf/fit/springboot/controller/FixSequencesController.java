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

        // Tạo các Index quan trọng giúp tăng tốc độ truy vấn 5x-10x
        String[] indexSqls = new String[]{
                "CREATE INDEX IF NOT EXISTS idx_rooms_homestay_id ON rooms(homestay_id)",
                "CREATE INDEX IF NOT EXISTS idx_room_images_room_id ON room_images(room_id)",
                "CREATE INDEX IF NOT EXISTS idx_homestay_images_homestay_id ON homestay_images(homestay_id)",
                "CREATE INDEX IF NOT EXISTS idx_reviews_homestay_id ON reviews(homestay_id)",
                "CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON reviews(booking_id)",
                "CREATE INDEX IF NOT EXISTS idx_reviews_tourist_id ON reviews(tourist_id)",
                "CREATE INDEX IF NOT EXISTS idx_bookings_tourist_id ON bookings(tourist_id)",
                "CREATE INDEX IF NOT EXISTS idx_bookings_homestay_id ON bookings(homestay_id)",
                "CREATE INDEX IF NOT EXISTS idx_bookings_room_id ON bookings(room_id)",
                "CREATE INDEX IF NOT EXISTS idx_bookings_booking_code ON bookings(booking_code)",
                "CREATE INDEX IF NOT EXISTS idx_reports_booking_id ON reports(booking_id)",
                "CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON reports(reporter_id)",
                "CREATE INDEX IF NOT EXISTS idx_guest_tasks_homestay_id ON guest_tasks(homestay_id)",
                "CREATE INDEX IF NOT EXISTS idx_vouchers_code ON vouchers(code)"
        };

        List<String> createdIndexes = new ArrayList<>();
        for (String idxSql : indexSqls) {
            try {
                jdbc.execute(idxSql);
                createdIndexes.add(idxSql.split(" ")[5]);
            } catch (Exception e) {
                // ignore if already exists
            }
        }
        res.put("indexesCreated", createdIndexes);

        return ResponseEntity.ok(res);
    }
}