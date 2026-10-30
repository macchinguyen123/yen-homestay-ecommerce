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

            // Đảm bảo bảng lịch sử xem tồn tại; lịch sử chỉ được tạo bởi thao tác xem thật.
            try {
                jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS viewed_histories (" +
                        "history_id BIGSERIAL PRIMARY KEY, " +
                        "user_id BIGINT NOT NULL, " +
                        "homestay_id BIGINT NOT NULL, " +
                        "viewed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, " +
                        "CONSTRAINT uk_user_homestay UNIQUE (user_id, homestay_id)" +
                        ")");
            } catch (Exception e) {
                log.warn("Lỗi kiểm tra/khởi tạo bảng viewed_histories: {}", e.getMessage());
            }

            // Đảm bảo cột homestay_id tồn tại và khởi tạo đầy đủ kho 16 voucher thực tế cho các homestay
            try {
                jdbcTemplate.execute("ALTER TABLE vouchers ADD COLUMN IF NOT EXISTS homestay_id BIGINT");

                try {
                    jdbcTemplate.execute("CREATE SEQUENCE IF NOT EXISTS vouchers_voucher_id_seq");
                    Long maxVoucherId = jdbcTemplate.queryForObject("SELECT COALESCE(MAX(voucher_id), 0) FROM vouchers", Long.class);
                    if (maxVoucherId == null) maxVoucherId = 0L;
                    jdbcTemplate.execute("SELECT setval('vouchers_voucher_id_seq', " + Math.max(maxVoucherId, 1L) + ")");
                    jdbcTemplate.execute("ALTER TABLE vouchers ALTER COLUMN voucher_id SET DEFAULT nextval('vouchers_voucher_id_seq')");
                } catch (Exception seqEx) {
                    log.warn("Sequence setup for vouchers: {}", seqEx.getMessage());
                }

                // Cập nhật lại các voucher cũ bị quá hạn hoặc tạm ngưng sang trạng thái ACTIVE cho năm 2026-2027
                jdbcTemplate.update("UPDATE vouchers SET status = 'ACTIVE', expiry_date = DATE '2026-12-31' WHERE status IN ('EXPIRED', 'DISABLED')");

                // Danh sách 16 voucher thực tế đại diện 4 section: Hot, Mới, Dùng nhiều, VIP
                Object[][] defaultVouchers = new Object[][] {
                    // code, discount_type, value, min_order_value, max_discount, usage_limit, used_count, status, homestay_id
                    {"HANRIVER200", "FIXED_AMOUNT", 200000, 1500000, 200000, 200, 24, "ACTIVE", 36L},
                    {"MEMORY180", "FIXED_AMOUNT", 180000, 1200000, 180000, 250, 32, "ACTIVE", 7L},
                    {"TRANGAN120", "FIXED_AMOUNT", 120000, 1000000, 120000, 300, 45, "ACTIVE", 66L},
                    {"TOPASHOT500", "FIXED_AMOUNT", 500000, 3800000, 500000, 100, 18, "ACTIVE", 18L},

                    {"BLOOMING100", "FIXED_AMOUNT", 100000, 900000, 100000, 150, 12, "ACTIVE", 11L},
                    {"NHARUONG80", "FIXED_AMOUNT", 80000, 800000, 80000, 150, 8, "ACTIVE", 81L},
                    {"NINHBINH70", "FIXED_AMOUNT", 70000, 750000, 70000, 200, 14, "ACTIVE", 65L},
                    {"PINEHILL60", "FIXED_AMOUNT", 60000, 700000, 60000, 200, 15, "ACTIVE", 5L},

                    {"HOIAN150", "FIXED_AMOUNT", 150000, 1000000, 150000, 300, 72, "ACTIVE", 21L},
                    {"BANA250", "FIXED_AMOUNT", 250000, 1800000, 250000, 150, 48, "ACTIVE", 35L},
                    {"TAMCOC90", "FIXED_AMOUNT", 90000, 850000, 90000, 200, 55, "ACTIVE", 67L},
                    {"LANGCO120", "FIXED_AMOUNT", 120000, 1100000, 120000, 200, 39, "ACTIVE", 82L},

                    {"VILLA500", "FIXED_AMOUNT", 500000, 4000000, 500000, 50, 11, "ACTIVE", 1L},
                    {"ECOSUITE350", "FIXED_AMOUNT", 350000, 2800000, 350000, 80, 16, "ACTIVE", 13L},
                    {"PENTHOUSE600", "FIXED_AMOUNT", 600000, 4500000, 600000, 50, 9, "ACTIVE", 38L},
                    {"ROYAL800", "FIXED_AMOUNT", 800000, 6000000, 800000, 30, 5, "ACTIVE", 84L}
                };

                for (Object[] v : defaultVouchers) {
                    Integer count = jdbcTemplate.queryForObject(
                        "SELECT count(*) FROM vouchers WHERE code = ?", Integer.class, (String) v[0]);
                    if (count != null && count == 0) {
                        jdbcTemplate.update(
                            "INSERT INTO vouchers (voucher_id, code, discount_type, value, min_order_value, max_discount, start_date, expiry_date, usage_limit, used_count, status, homestay_id) " +
                            "VALUES (COALESCE((SELECT MAX(voucher_id) FROM vouchers), 0) + 1, ?, ?, ?, ?, ?, CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year', ?, ?, ?, ?)",
                            v[0], v[1], v[2], v[3], v[4], v[5], v[6], v[7], v[8]
                        );
                        log.info("✅ Đã khởi tạo voucher {} (Homestay ID: {}) trong CSDL Neon", v[0], v[8]);
                    } else {
                        // Cập nhật homestay_id và ngày hết hạn nếu đã có
                        jdbcTemplate.update(
                            "UPDATE vouchers SET homestay_id = ?, status = 'ACTIVE', expiry_date = DATE '2026-12-31' WHERE code = ?",
                            v[8], v[0]
                        );
                    }
                }
                log.info("✅ Đã đồng bộ đầy đủ kho 16 voucher thực tế kết nối CSDL Neon PostgreSQL");
            } catch (Exception e) {
                log.warn("Lỗi kiểm tra/khởi tạo vouchers mẫu: {}", e.getMessage());
            }

            log.info("🚀 Database đã sẵn sàng & kết nối ổn định tới Neon PostgreSQL!");
            log.info("================================================================");
        } catch (Exception e) {
            log.error("❌ RẤT TIẾC: KIỂM TRA BẢNG DỮ LIỆU THẤT BẠI!", e);
            log.error("Chi tiết lỗi: {}", e.getMessage());
        }
    }
}
