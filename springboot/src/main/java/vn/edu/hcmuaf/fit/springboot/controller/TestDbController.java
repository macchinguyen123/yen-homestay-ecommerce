package vn.edu.hcmuaf.fit.springboot.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.hcmuaf.fit.springboot.model.Category;
import vn.edu.hcmuaf.fit.springboot.model.User;
import vn.edu.hcmuaf.fit.springboot.repository.CategoryRepository;
import vn.edu.hcmuaf.fit.springboot.repository.UserRepository;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/public")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class TestDbController {

    private final JdbcTemplate jdbcTemplate;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;

    @GetMapping("/test-db")
    public ResponseEntity<Map<String, Object>> testDatabaseConnection() {
        Map<String, Object> response = new HashMap<>();
        try {
            String dbName = jdbcTemplate.queryForObject("SELECT current_database()", String.class);
            String dbUser = jdbcTemplate.queryForObject("SELECT current_user", String.class);
            String version = jdbcTemplate.queryForObject("SELECT version()", String.class);
            List<User> users = userRepository.findAll();
            List<Category> categories = categoryRepository.findAll();

            response.put("status", "SUCCESS");
            response.put("message", "Kết nối thành công tới Neon PostgreSQL Database!");
            response.put("databaseName", dbName);
            response.put("databaseUser", dbUser);
            response.put("postgresVersion", version);
            response.put("totalUsersInDb", users.size());
            response.put("usersData", users);
            response.put("totalCategoriesInDb", categories.size());
            response.put("categoriesData", categories);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "FAILED");
            response.put("message", "Lỗi kết nối tới cơ sở dữ liệu Neon: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/db-summary")
    public ResponseEntity<Map<String, Object>> getDbSummary() {
        Map<String, Object> map = new HashMap<>();
        try {
            map.put("totalUsers", jdbcTemplate.queryForObject("SELECT count(*) FROM users", Long.class));
            map.put("tourists", jdbcTemplate.queryForObject("SELECT count(*) FROM users WHERE UPPER(role) = 'TOURIST'", Long.class));
            map.put("owners", jdbcTemplate.queryForObject("SELECT count(*) FROM users WHERE UPPER(role) = 'OWNER'", Long.class));
            map.put("homestays", jdbcTemplate.queryForObject("SELECT count(*) FROM homestays", Long.class));
            map.put("homestaysActive", jdbcTemplate.queryForObject("SELECT count(*) FROM homestays WHERE UPPER(status) = 'ACTIVE'", Long.class));
            map.put("bookings", jdbcTemplate.queryForObject("SELECT count(*) FROM bookings", Long.class));
            map.put("bookingRevenue", jdbcTemplate.queryForObject("SELECT COALESCE(SUM(total_price), 0) FROM bookings", BigDecimal.class));
            map.put("payments", jdbcTemplate.queryForObject("SELECT count(*) FROM payments", Long.class));
            map.put("paymentRevenue", jdbcTemplate.queryForObject("SELECT COALESCE(SUM(amount), 0) FROM payments", BigDecimal.class));
            map.put("vouchers", jdbcTemplate.queryForObject("SELECT count(*) FROM vouchers", Long.class));
            map.put("ads", jdbcTemplate.queryForObject("SELECT count(*) FROM homestay_ads", Long.class));
            map.put("topCities", jdbcTemplate.queryForList("SELECT city, count(*) as count FROM homestays GROUP BY city ORDER BY count(*) DESC LIMIT 5"));
            map.put("bookingStatuses", jdbcTemplate.queryForList("SELECT status, count(*) as count FROM bookings GROUP BY status"));
        } catch (Exception e) {
            map.put("error", e.getMessage());
        }
        return ResponseEntity.ok(map);
    }

    @GetMapping("/categories")
    public ResponseEntity<List<Category>> getAllCategories() {
        return ResponseEntity.ok(categoryRepository.findAll());
    }
}

