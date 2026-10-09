package vn.edu.hcmuaf.fit.springboot.controller;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/public/debug-schema")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class DebugSchemaController {
    private final JdbcTemplate jdbc;

    @GetMapping
    public ResponseEntity<?> check() {
        Map<String, Object> m = new HashMap<>();
        String sql = "SELECT table_name, column_name, column_default, is_nullable, data_type " +
                     "FROM information_schema.columns " +
                     "WHERE table_schema = 'public' AND table_name IN ('reviews', 'reports', 'bookings', 'payments') " +
                     "ORDER BY table_name, ordinal_position";
        m.put("columns", jdbc.queryForList(sql));
        m.put("sequences", jdbc.queryForList("SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public'"));
        m.put("payment_constraints", jdbc.queryForList("SELECT conname, pg_get_constraintdef(c.oid) FROM pg_constraint c JOIN pg_class t ON c.conrelid = t.oid WHERE t.relname = 'payments'"));
        m.put("distinct_payment_method", jdbc.queryForList("SELECT DISTINCT payment_method FROM payments"));
        m.put("distinct_payment_status", jdbc.queryForList("SELECT DISTINCT status FROM payments"));
        return ResponseEntity.ok(m);
    }
}