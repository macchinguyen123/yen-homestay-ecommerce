package vn.edu.hcmuaf.fit.springboot.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.Map;
import java.util.List;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/owner/analytics")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class OwnerAnalyticsController {
    private final JdbcTemplate jdbc;

    @GetMapping("/revenue")
    public Map<String, Object> revenue(@RequestParam Long ownerId,
                                       @RequestParam(required = false) LocalDate from,
                                       @RequestParam(required = false) LocalDate to) {
        String sql = "SELECT COALESCE(SUM(b.total_price),0) AS total, COALESCE(SUM(b.deposit_amount),0) AS deposit, COUNT(*) AS bookings, " +
                "COALESCE(SUM(CASE WHEN UPPER(b.status) IN ('PAID','COMPLETED','CONFIRMED') THEN b.total_price ELSE 0 END),0) AS paid " +
                "FROM bookings b JOIN homestays h ON h.homestay_id=b.homestay_id " +
                "WHERE h.owner_id=? AND UPPER(COALESCE(b.status,'')) NOT IN ('CANCELLED','REJECTED','REFUNDED') " +
                "AND (? IS NULL OR b.created_at >= ?) AND (? IS NULL OR b.created_at < (?::date + INTERVAL '1 day'))";
        Map<String, Object> row = jdbc.queryForMap(sql, ownerId, from, from, to, to);
        return Map.of("total", row.get("total"), "deposit", row.get("deposit"), "paid", row.get("paid"), "bookings", row.get("bookings"));
    }

    @GetMapping("/bookings")
    public List<Map<String, Object>> bookings(@RequestParam Long ownerId) {
        return jdbc.queryForList("SELECT b.booking_id AS id, b.booking_code AS code, b.check_in_date AS check_in, b.check_out_date AS check_out, b.total_price AS price, b.status, h.name AS homestay FROM bookings b JOIN homestays h ON h.homestay_id=b.homestay_id WHERE h.owner_id=? ORDER BY b.check_in_date DESC", ownerId);
    }
}
