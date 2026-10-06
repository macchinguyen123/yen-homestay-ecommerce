package vn.edu.hcmuaf.fit.springboot.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
@Slf4j
@RequiredArgsConstructor
public class DbConnectionTestRunner implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            log.info("================================================================");
            log.info("🔍 KIỂM TRA DỮ LIỆU DÒNG ĐẦU TIÊN CỦA 18 BẢNG TRÊN NEON POSTGRESQL...");
            
            String dbName = jdbcTemplate.queryForObject("SELECT current_database()", String.class);
            String dbUser = jdbcTemplate.queryForObject("SELECT current_user", String.class);
            String version = jdbcTemplate.queryForObject("SELECT version()", String.class);

            log.info("✅ KẾT NỐI THÀNH CÔNG TỚI NEON DATABASE [{}] (User: {})", dbName, dbUser);
            log.info("📌 DB Version: {}", version != null && version.length() > 60 ? version.substring(0, 60) + "..." : version);
            log.info("----------------------------------------------------------------");

            // Đảm bảo tài khoản mẫu có mặt trong bảng users của CSDL Neon PostgreSQL
            try {
                Integer maichiCount = jdbcTemplate.queryForObject("SELECT count(*) FROM users WHERE email = 'maichi.lehoang@gmail.com'", Integer.class);
                if (maichiCount != null && maichiCount == 0) {
                    jdbcTemplate.update("INSERT INTO users (user_id, email, password_hash, full_name, phone, role, status) VALUES ((SELECT COALESCE(MAX(user_id), 0) + 1 FROM users), 'maichi.lehoang@gmail.com', '12345678', 'Lê Hoàng Mai Chi', '0912345678', 'TOURIST', 'ACTIVE')");
                    log.info("✅ Đã khởi tạo tài khoản maichi.lehoang@gmail.com trong bảng users");
                }
                Integer chuhoangCount = jdbcTemplate.queryForObject("SELECT count(*) FROM users WHERE email = 'chuhoang.homestay@gmail.com'", Integer.class);
                if (chuhoangCount != null && chuhoangCount == 0) {
                    jdbcTemplate.update("INSERT INTO users (user_id, email, password_hash, full_name, phone, role, status) VALUES ((SELECT COALESCE(MAX(user_id), 0) + 1 FROM users), 'chuhoang.homestay@gmail.com', '12345678', 'Nguyễn Văn Hoàng (Chủ Homestay)', '0987654321', 'OWNER', 'ACTIVE')");
                    log.info("✅ Đã khởi tạo tài khoản chuhoang.homestay@gmail.com trong bảng users");
                }
            } catch (Exception e) {
                log.warn("Lỗi kiểm tra/thêm tài khoản mẫu vào CSDL: {}", e.getMessage());
            }

            String[] tables = {
                "users", "categories", "homestays", "homestay_images", "rooms", 
                "room_images", "extra_amenities", "guest_tasks", "ad_packages", 
                "homestay_ads", "bookings", "booking_extras", "payments", "reports", 
                "reviews", "vouchers", "festivals", "wishlists"
            };

            for (String table : tables) {
                try {
                    Long count = jdbcTemplate.queryForObject("SELECT count(*) FROM " + table, Long.class);
                    if (count != null && count > 0) {
                        List<Map<String, Object>> rows = jdbcTemplate.queryForList("SELECT * FROM " + table + " LIMIT 1");
                        Map<String, Object> firstRow = rows.isEmpty() ? Map.of() : rows.get(0);
                        log.info("🔹 {:<18} | {} bản ghi | Dòng đầu: {}", table, String.format("%3d", count), firstRow);
                    } else {
                        log.info("🔹 {:<18} |   0 bản ghi | (Bảng trống)", table);
                    }
                } catch (Exception e) {
                    log.warn("⚠️ {:<18} | Lỗi truy vấn: {}", table, e.getMessage());
                }
            }

            log.info("================================================================");
        } catch (Exception e) {
            log.error("❌ RẤT TIẾC: KIỂM TRA BẢNG DỮ LIỆU THẤT BẠI!", e);
            log.error("Chi tiết lỗi: {}", e.getMessage());
        }
    }
}
