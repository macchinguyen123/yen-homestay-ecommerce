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

    @GetMapping("/categories")
    public ResponseEntity<List<Category>> getAllCategories() {
        return ResponseEntity.ok(categoryRepository.findAll());
    }
}

