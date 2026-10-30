package vn.edu.hcmuaf.fit.springboot.service;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.hcmuaf.fit.springboot.dto.OwnerBookingDTO;
import vn.edu.hcmuaf.fit.springboot.dto.OwnerBookingDTO.*;
import vn.edu.hcmuaf.fit.springboot.dto.OwnerBookingRequests.*;
import vn.edu.hcmuaf.fit.springboot.dto.OwnerBookingStatsDTO;
import vn.edu.hcmuaf.fit.springboot.dto.OwnerBookingStatsDTO.RoomStatusItemDTO;
import vn.edu.hcmuaf.fit.springboot.model.*;
import vn.edu.hcmuaf.fit.springboot.repository.*;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class OwnerBookingService {

    private final JdbcTemplate jdbcTemplate;
    private final BookingRepository bookingRepository;
    private final BookingExtraRepository bookingExtraRepository;
    private final RoomRepository roomRepository;
    private final HomestayRepository homestayRepository;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;
    private final NotificationService notificationService;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATETIME_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final Locale VI_LOCALE = new Locale("vi", "VN");

    @PostConstruct
    public void initDatabase() {
        try {
            log.info("Khởi tạo cấu trúc bảng quản lý đơn đặt phòng (Bookings) cho Chủ nhà...");

            // 1. Thêm các cột bổ sung cho bảng bookings nếu chưa có
            jdbcTemplate.execute("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS source VARCHAR(50)");
            jdbcTemplate.execute("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS guest_name VARCHAR(255)");
            jdbcTemplate.execute("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS guest_phone VARCHAR(50)");
            jdbcTemplate.execute("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS guest_cccd VARCHAR(50)");
            jdbcTemplate.execute("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS guest_city VARCHAR(100)");
            jdbcTemplate.execute("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS guest_email VARCHAR(100)");
            jdbcTemplate.execute("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS special_request TEXT");
            jdbcTemplate.execute("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS notes TEXT");

            // 2. Đảm bảo cấu trúc bảng booking_extras
            jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS booking_extras (" +
                    "booking_id BIGINT NOT NULL, " +
                    "extra_id BIGINT NOT NULL, " +
                    "service_name VARCHAR(255), " +
                    "quantity INT DEFAULT 1, " +
                    "price NUMERIC(15,2) DEFAULT 0, " +
                    "PRIMARY KEY (booking_id, extra_id))");
            jdbcTemplate.execute("ALTER TABLE booking_extras ADD COLUMN IF NOT EXISTS service_name VARCHAR(255)");

            // 3. Xóa các ràng buộc CHECK nếu có để trạng thái đa dạng và không bị chặn lỗi DB
            try {
                jdbcTemplate.execute("ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check");
                jdbcTemplate.execute("ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_deposit_status_check");
                jdbcTemplate.execute("ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_payment_type_check");
            } catch (Exception ignored) {}

            // 4. Khởi tạo sequence nếu cần
            try {
                jdbcTemplate.execute("CREATE SEQUENCE IF NOT EXISTS bookings_booking_id_seq");
                Long maxBId = jdbcTemplate.queryForObject("SELECT COALESCE(MAX(booking_id), 0) FROM bookings", Long.class);
                if (maxBId == null) maxBId = 0L;
                jdbcTemplate.execute("SELECT setval('bookings_booking_id_seq', " + Math.max(maxBId, 1L) + ")");
            } catch (Exception ignored) {}

            // Không tự tạo booking mẫu trong CSDL khi khởi động ứng dụng.

        } catch (Exception e) {
            log.error("Lỗi khi khởi tạo bảng bookings: {}", e.getMessage(), e);
        }
    }

    private void seedInitialBookingsIfEmpty() {
        try {
            Long count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM bookings", Long.class);
            if (count != null && count >= 4) {
                log.info("CSDL đã có {} đơn đặt phòng, không cần seed.", count);
                return;
            }

            log.info("CSDL có {} đơn đặt phòng. Bắt đầu nạp 4 đơn chuẩn hóa theo giao diện...", count != null ? count : 0);

            // Tìm homestay đầu tiên hoặc id = 1
            Long homestayId = 1L;
            List<Long> hsIds = jdbcTemplate.queryForList("SELECT homestay_id FROM homestays LIMIT 1", Long.class);
            if (!hsIds.isEmpty() && hsIds.get(0) != null) {
                homestayId = hsIds.get(0);
            }

            // Lấy danh sách phòng
            List<Map<String, Object>> roomList = jdbcTemplate.queryForList("SELECT room_id, room_name, room_type, price_per_night FROM rooms WHERE homestay_id = ? LIMIT 5", homestayId);
            Long r1 = null, r2 = null, r3 = null, r4 = null;
            if (!roomList.isEmpty()) {
                r1 = ((Number) roomList.get(0).get("room_id")).longValue();
                if (roomList.size() > 1) r2 = ((Number) roomList.get(1).get("room_id")).longValue();
                if (roomList.size() > 2) r3 = ((Number) roomList.get(2).get("room_id")).longValue();
                if (roomList.size() > 3) r4 = ((Number) roomList.get(3).get("room_id")).longValue();
            }

            // Lấy tourist id mẫu
            Long touristId = 21L;
            List<Long> userIds = jdbcTemplate.queryForList("SELECT user_id FROM users WHERE UPPER(role) = 'TOURIST' LIMIT 1", Long.class);
            if (!userIds.isEmpty() && userIds.get(0) != null) {
                touristId = userIds.get(0);
            }

            LocalDate today = LocalDate.now();

            // Đơn 1: BK-9842 - Nguyễn Thị Mai - Chờ Check-in hôm nay
            String sqlCheck1 = "SELECT COUNT(*) FROM bookings WHERE booking_code = 'BK-9842'";
            if (jdbcTemplate.queryForObject(sqlCheck1, Long.class) == 0) {
                Booking b1 = Booking.builder()
                        .bookingCode("BK-9842")
                        .source("OTA Sàn VN")
                        .touristId(touristId)
                        .homestayId(homestayId)
                        .roomId(r1)
                        .guestName("Nguyễn Thị Mai")
                        .guestPhone("0982 341 112")
                        .guestEmail("mai.nguyen@gmail.com")
                        .guestCccd("001198034521")
                        .guestCity("Quận Cầu Giấy, Hà Nội")
                        .guestsCount(2)
                        .checkInDate(today)
                        .checkOutDate(today.plusDays(3))
                        .totalPrice(new BigDecimal("2850000"))
                        .depositAmount(new BigDecimal("1500000"))
                        .remainingAmount(new BigDecimal("1350000"))
                        .depositStatus("Đã thanh toán sàn")
                        .paymentType("OTA_ONLINE")
                        .status("Chờ Check-in")
                        .specialRequest("Ăn tối cơm lam thịt nướng tại homestay lúc 18h30. Nhờ chuẩn bị trước lò nướng than mộc ngoài sân.")
                        .createdAt(LocalDateTime.now().minusDays(2))
                        .build();
                Booking saved1 = bookingRepository.save(b1);

                // Dịch vụ của đơn 1
                jdbcTemplate.update("INSERT INTO booking_extras (booking_id, extra_id, service_name, quantity, price) VALUES (?, ?, ?, ?, ?) ON CONFLICT DO NOTHING",
                        saved1.getId(), 1L, "Cơm lam thịt nướng Mai Châu", 2, new BigDecimal("180000"));
            }

            // Đơn 2: BK-9839 - Lê Văn Hiếu - Đang ở (mai trả phòng)
            String sqlCheck2 = "SELECT COUNT(*) FROM bookings WHERE booking_code = 'BK-9839'";
            if (jdbcTemplate.queryForObject(sqlCheck2, Long.class) == 0) {
                Booking b2 = Booking.builder()
                        .bookingCode("BK-9839")
                        .source("Trực tiếp")
                        .touristId(touristId)
                        .homestayId(homestayId)
                        .roomId(r2 != null ? r2 : r1)
                        .guestName("Lê Văn Hiếu")
                        .guestPhone("0915 884 920")
                        .guestEmail("hieule.van@outlook.com")
                        .guestCccd("034093012845")
                        .guestCity("TP. Nam Định")
                        .guestsCount(2)
                        .checkInDate(today.minusDays(1))
                        .checkOutDate(today.plusDays(1))
                        .totalPrice(new BigDecimal("2200000"))
                        .depositAmount(new BigDecimal("1000000"))
                        .remainingAmount(new BigDecimal("1200000"))
                        .depositStatus("Đã cọc 50% tiền mặt")
                        .paymentType("CASH")
                        .status("Đang ở")
                        .specialRequest("Bổ sung thêm củi lửa trại và ngô nướng ngoài thềm tối nay lúc 20h00.")
                        .createdAt(LocalDateTime.now().minusDays(3))
                        .build();
                Booking saved2 = bookingRepository.save(b2);

                jdbcTemplate.update("INSERT INTO booking_extras (booking_id, extra_id, service_name, quantity, price) VALUES (?, ?, ?, ?, ?) ON CONFLICT DO NOTHING",
                        saved2.getId(), 3L, "Thuê xe máy dạo bản Lác (1 ngày)", 1, new BigDecimal("150000"));
                jdbcTemplate.update("INSERT INTO booking_extras (booking_id, extra_id, service_name, quantity, price) VALUES (?, ?, ?, ?, ?) ON CONFLICT DO NOTHING",
                        saved2.getId(), 4L, "Set lửa trại & bắp khoai nướng", 1, new BigDecimal("250000"));
            }

            // Đơn 3: BK-9830 - Phạm Thị Lan - Đã hoàn tất (trả phòng hôm qua)
            String sqlCheck3 = "SELECT COUNT(*) FROM bookings WHERE booking_code = 'BK-9830'";
            if (jdbcTemplate.queryForObject(sqlCheck3, Long.class) == 0) {
                Booking b3 = Booking.builder()
                        .bookingCode("BK-9830")
                        .source("OTA Sàn VN")
                        .touristId(touristId)
                        .homestayId(homestayId)
                        .roomId(r3 != null ? r3 : r1)
                        .guestName("Phạm Thị Lan")
                        .guestPhone("0903 442 771")
                        .guestEmail("lanpham.vn@gmail.com")
                        .guestCccd("025091004523")
                        .guestCity("Quận 1, TP. Hồ Chí Minh")
                        .guestsCount(4)
                        .checkInDate(today.minusDays(3))
                        .checkOutDate(today.minusDays(1))
                        .totalPrice(new BigDecimal("3100000"))
                        .depositAmount(new BigDecimal("1500000"))
                        .remainingAmount(BigDecimal.ZERO)
                        .depositStatus("Đã quyết toán")
                        .paymentType("FULL")
                        .status("Đã hoàn tất")
                        .specialRequest("Đoàn gia đình có trẻ em, nhờ chuẩn bị bữa sáng xôi nếp nương Mai Châu.")
                        .createdAt(LocalDateTime.now().minusDays(5))
                        .build();
                Booking saved3 = bookingRepository.save(b3);

                jdbcTemplate.update("INSERT INTO booking_extras (booking_id, extra_id, service_name, quantity, price) VALUES (?, ?, ?, ?, ?) ON CONFLICT DO NOTHING",
                        saved3.getId(), 1L, "Mẹt ẩm thực Tây Bắc & Gà đồi nướng", 1, new BigDecimal("600000"));
            }

            // Đơn 4: BK-9850 - Trần Tuấn Kiệt - Chờ xác nhận (ngày mai đến)
            String sqlCheck4 = "SELECT COUNT(*) FROM bookings WHERE booking_code = 'BK-9850'";
            if (jdbcTemplate.queryForObject(sqlCheck4, Long.class) == 0) {
                Booking b4 = Booking.builder()
                        .bookingCode("BK-9850")
                        .source("Web Homestay")
                        .touristId(touristId)
                        .homestayId(homestayId)
                        .roomId(r4 != null ? r4 : r1)
                        .guestName("Trần Tuấn Kiệt")
                        .guestPhone("0977 123 445")
                        .guestEmail("tuankiet.tran@gmail.com")
                        .guestCccd("031094002931")
                        .guestCity("TP. Hải Phòng")
                        .guestsCount(6)
                        .checkInDate(today.plusDays(1))
                        .checkOutDate(today.plusDays(3))
                        .totalPrice(new BigDecimal("4200000"))
                        .depositAmount(new BigDecimal("2100000"))
                        .remainingAmount(new BigDecimal("2100000"))
                        .depositStatus("Chờ duyệt cọc")
                        .paymentType("BANK_TRANSFER")
                        .status("Chờ xác nhận")
                        .specialRequest("Đoàn chụp ảnh kỷ yếu, nhờ hỗ trợ 6 bộ trang phục Thái và chuẩn bị loa kéo hát giao lưu.")
                        .notes("VCB FT24261899201 - BK9850 Tran Tuan Kiet dat phong nha san")
                        .createdAt(LocalDateTime.now().minusHours(3))
                        .build();
                bookingRepository.save(b4);
            }

            log.info("Đã seed thành công 4 đơn đặt phòng mẫu vào CSDL!");

        } catch (Exception e) {
            log.warn("Không thể seed dữ liệu booking: {}", e.getMessage());
        }
    }

    /**
     * Lấy danh sách toàn bộ đơn đặt phòng của chủ nhà từ CSDL thật Neon PostgreSQL
     */
    public List<OwnerBookingDTO> getBookings(Long homestayId, String statusTab, String search) {
        StringBuilder sql = new StringBuilder("""
            SELECT 
                b.booking_id, b.booking_code, b.source, b.tourist_id,
                COALESCE(b.guest_name, u.full_name, 'Khách đặt phòng') as guest_name,
                COALESCE(b.guest_phone, u.phone, '09xx xxx xxx') as guest_phone,
                COALESCE(b.guest_email, u.email, 'guest@homestay.vn') as guest_email,
                COALESCE(b.guest_cccd, u.cccd, 'Chưa cập nhật') as guest_cccd,
                COALESCE(b.guest_city, u.street, 'Việt Nam') as guest_city,
                u.avatar as guest_avatar,
                b.homestay_id, h.name as homestay_name,
                b.room_id, rm.room_name, rm.room_type,
                b.check_in_date, b.check_out_date, b.guests_count,
                b.total_price, b.discount_amount, b.deposit_amount, b.remaining_amount,
                b.deposit_status, b.payment_type, b.status, b.special_request, b.notes, b.created_at
            FROM bookings b
            LEFT JOIN users u ON b.tourist_id = u.user_id
            LEFT JOIN homestays h ON b.homestay_id = h.homestay_id
            LEFT JOIN rooms rm ON b.room_id = rm.room_id
            WHERE 1=1
        """);

        List<Object> params = new ArrayList<>();

        if (homestayId != null && homestayId > 0) {
            sql.append(" AND b.homestay_id = ?");
            params.add(homestayId);
        }

        if (search != null && !search.trim().isEmpty()) {
            String kw = "%" + search.trim().toLowerCase() + "%";
            sql.append(" AND (LOWER(b.booking_code) LIKE ? OR LOWER(COALESCE(b.guest_name, u.full_name, '')) LIKE ? OR LOWER(COALESCE(b.guest_phone, u.phone, '')) LIKE ?)");
            params.add(kw);
            params.add(kw);
            params.add(kw);
        }

        sql.append(" ORDER BY b.booking_id DESC");

        List<OwnerBookingDTO> result = new ArrayList<>();
        try {
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql.toString(), params.toArray());

            // Tải trước toàn bộ booking_extras trong 1 câu truy vấn duy nhất để loại bỏ N+1 query
            Map<Long, List<OwnerBookingServiceItemDTO>> extrasMap = new HashMap<>();
            try {
                String extrasSql = """
                    SELECT be.booking_id,
                           COALESCE(be.service_name, ea.name, 'Dịch vụ homestay') as name,
                           be.quantity as qty,
                           be.price,
                           (be.quantity * be.price) as total
                    FROM booking_extras be
                    LEFT JOIN extra_amenities ea ON be.extra_id = ea.extra_id
                """;
                List<Map<String, Object>> extrasRows = jdbcTemplate.queryForList(extrasSql);
                for (Map<String, Object> er : extrasRows) {
                    Long bId = ((Number) er.get("booking_id")).longValue();
                    BigDecimal itemPrice = er.get("price") != null ? (BigDecimal) er.get("price") : BigDecimal.ZERO;
                    BigDecimal itemTotal = er.get("total") != null ? (BigDecimal) er.get("total") : BigDecimal.ZERO;
                    OwnerBookingServiceItemDTO item = OwnerBookingServiceItemDTO.builder()
                            .name((String) er.get("name"))
                            .qty(er.get("qty") != null ? ((Number) er.get("qty")).intValue() : 1)
                            .price(itemPrice)
                            .total(itemTotal)
                            .build();
                    extrasMap.computeIfAbsent(bId, k -> new ArrayList<>()).add(item);
                }
            } catch (Exception ex) {
                log.warn("Lỗi load booking extras: {}", ex.getMessage());
            }

            for (Map<String, Object> row : rows) {
                Long bId = ((Number) row.get("booking_id")).longValue();
                List<OwnerBookingServiceItemDTO> sList = extrasMap.getOrDefault(bId, Collections.emptyList());
                OwnerBookingDTO dto = mapToOwnerBookingDTO(row, sList);
                // Lọc theo status tab nếu có
                if (matchesStatusTab(dto, statusTab)) {
                    result.add(dto);
                }
            }
        } catch (Exception e) {
            log.error("Lỗi khi truy vấn danh sách bookings: {}", e.getMessage(), e);
        }

        return result;
    }

    private boolean matchesStatusTab(OwnerBookingDTO dto, String tab) {
        if (tab == null || tab.isEmpty() || "all".equalsIgnoreCase(tab)) {
            return true;
        }
        String st = dto.getStatus();
        if (st == null) st = "";
        String sLower = st.toLowerCase();
        return switch (tab.toLowerCase()) {
            case "pending", "cho-xac-nhan" -> sLower.contains("xác nhận") || sLower.contains("pending") || sLower.contains("duyệt");
            case "deposit", "da-coc", "checkin", "cho-checkin" -> (sLower.contains("check-in") || sLower.contains("cọc") || sLower.contains("confirmed") || sLower.contains("deposit")) && !sLower.contains("xác nhận") && !sLower.contains("duyệt") && !sLower.contains("pending");
            case "staying", "dang-o" -> sLower.contains("đang ở") || sLower.contains("ở") || sLower.contains("checked_in") || sLower.contains("staying");
            case "completed", "da-hoan-tat" -> sLower.contains("hoàn tất") || sLower.contains("completed");
            case "cancelled", "da-huy" -> sLower.contains("hủy") || sLower.contains("cancelled") || sLower.contains("rejected");
            default -> true;
        };
    }

    private OwnerBookingDTO mapToOwnerBookingDTO(Map<String, Object> row) {
        Long bookingId = ((Number) row.get("booking_id")).longValue();
        return mapToOwnerBookingDTO(row, getBookingServices(bookingId));
    }

    private OwnerBookingDTO mapToOwnerBookingDTO(Map<String, Object> row, List<OwnerBookingServiceItemDTO> services) {
        Long bookingId = ((Number) row.get("booking_id")).longValue();
        String bookingCode = (String) row.get("booking_code");
        if (bookingCode == null || bookingCode.isEmpty()) {
            bookingCode = "BK-" + bookingId;
        }

        String source = (String) row.get("source");
        if (source == null || source.isEmpty()) {
            source = "Trực tiếp";
        }

        String guestName = (String) row.get("guest_name");
        String phone = (String) row.get("guest_phone");
        String email = (String) row.get("guest_email");
        String cccd = (String) row.get("guest_cccd");
        String city = (String) row.get("guest_city");
        String avatarImg = (String) row.get("guest_avatar");

        String avatarLetter = (guestName != null && !guestName.trim().isEmpty())
                ? guestName.trim().substring(0, 1).toUpperCase()
                : "K";

        String avatarBg = switch (avatarLetter) {
            case "M", "A", "B" -> "bg-secondary";
            case "H", "C", "D" -> "bg-primary";
            case "L", "E", "G" -> "bg-gray";
            case "K", "T", "P" -> "bg-amber";
            default -> "bg-secondary";
        };

        Long homestayId = row.get("homestay_id") != null ? ((Number) row.get("homestay_id")).longValue() : null;
        String homestayName = (String) row.get("homestay_name");

        Long roomId = row.get("room_id") != null ? ((Number) row.get("room_id")).longValue() : null;
        String roomName = (String) row.get("room_name");
        String roomType = (String) row.get("room_type");
        if (roomName == null || roomName.isEmpty()) roomName = "Phòng Mountain View";
        if (roomType == null || roomType.isEmpty()) roomType = roomName;
        String roomCode = roomName;

        Integer guestsCount = row.get("guests_count") != null ? ((Number) row.get("guests_count")).intValue() : 2;
        String guestsLabel = guestsCount + " người lớn";

        java.sql.Date cinDate = (java.sql.Date) row.get("check_in_date");
        java.sql.Date coutDate = (java.sql.Date) row.get("check_out_date");
        LocalDate checkInDate = cinDate != null ? cinDate.toLocalDate() : LocalDate.now();
        LocalDate checkOutDate = coutDate != null ? coutDate.toLocalDate() : checkInDate.plusDays(2);

        int nights = (int) Math.max(1, ChronoUnit.DAYS.between(checkInDate, checkOutDate));
        String checkInStr = checkInDate.format(DATE_FMT);
        String checkOutStr = checkOutDate.format(DATE_FMT);

        LocalDate today = LocalDate.now();
        String checkInTime = checkInDate.isEqual(today) ? "14:00 (Hôm nay)" : (checkInDate.isEqual(today.plusDays(1)) ? "14:00 (Ngày mai đến)" : "14:00");
        String checkOutTime = checkOutDate.isEqual(today.plusDays(1)) ? "12:00 (Mai trả phòng)" : (checkOutDate.isEqual(today.minusDays(1)) ? "12:00 (Đã trả hôm qua)" : "12:00");

        BigDecimal totalPrice = row.get("total_price") != null ? (BigDecimal) row.get("total_price") : BigDecimal.ZERO;
        BigDecimal depositAmount = row.get("deposit_amount") != null ? (BigDecimal) row.get("deposit_amount") : BigDecimal.ZERO;
        BigDecimal remainAmount = row.get("remaining_amount") != null ? (BigDecimal) row.get("remaining_amount") : totalPrice.subtract(depositAmount);
        if (remainAmount.compareTo(BigDecimal.ZERO) < 0) remainAmount = BigDecimal.ZERO;

        String depositStatus = (String) row.get("deposit_status");
        if (depositStatus == null || depositStatus.isEmpty()) {
            depositStatus = depositAmount.compareTo(BigDecimal.ZERO) > 0 ? "Đã cọc trực tiếp" : "Chưa cọc";
        }

        String paymentType = (String) row.get("payment_type");
        if (paymentType == null) paymentType = "CASH";

        String rawStatus = (String) row.get("status");
        if (rawStatus == null) rawStatus = "Chờ Check-in";

        // Map status and badge
        String displayStatus = rawStatus;
        String statusBadge = "status-checkin";

        if (rawStatus.equalsIgnoreCase("PENDING") || rawStatus.contains("xác nhận") || rawStatus.contains("Chờ duyệt") || rawStatus.contains("Chưa duyệt")) {
            displayStatus = "Chờ xác nhận";
            statusBadge = "status-pending";
        } else if (rawStatus.equalsIgnoreCase("CHECKED_IN") || rawStatus.equalsIgnoreCase("STAYING") || rawStatus.contains("Đang ở")) {
            displayStatus = "Đang ở";
            statusBadge = "status-staying";
        } else if (rawStatus.equalsIgnoreCase("COMPLETED") || rawStatus.contains("hoàn tất")) {
            displayStatus = "Đã hoàn tất";
            statusBadge = "status-completed";
        } else if (rawStatus.equalsIgnoreCase("CANCELLED") || rawStatus.equalsIgnoreCase("REJECTED") || rawStatus.contains("hủy")) {
            displayStatus = "Đã hủy";
            statusBadge = "status-cancelled";
        } else if (rawStatus.equalsIgnoreCase("CONFIRMED") || rawStatus.contains("Check-in")) {
            displayStatus = "Chờ Check-in";
            statusBadge = "status-checkin";
        } else {
            displayStatus = "Chờ xác nhận";
            statusBadge = "status-pending";
        }

        String specialRequest = (String) row.get("special_request");
        String notes = (String) row.get("notes");

        java.sql.Timestamp cTs = (java.sql.Timestamp) row.get("created_at");
        LocalDateTime createdAt = cTs != null ? cTs.toLocalDateTime() : LocalDateTime.now();

        // Timeline động
        List<OwnerBookingTimelineItemDTO> timeline = new ArrayList<>();
        timeline.add(OwnerBookingTimelineItemDTO.builder()
                .title("Tạo đơn đặt phòng (" + source + ")")
                .time(createdAt.format(DATETIME_FMT))
                .status("done")
                .build());

        if (depositAmount.compareTo(BigDecimal.ZERO) > 0) {
            timeline.add(OwnerBookingTimelineItemDTO.builder()
                    .title("Xác nhận tiền cọc: " + formatMoney(depositAmount))
                    .time(createdAt.plusMinutes(5).format(DATETIME_FMT))
                    .status("done")
                    .build());
        }

        if (displayStatus.equals("Đang ở") || displayStatus.equals("Đã hoàn tất")) {
            timeline.add(OwnerBookingTimelineItemDTO.builder()
                    .title("Check-in nhận phòng " + roomCode)
                    .time(checkInStr + " 14:10")
                    .status("done")
                    .build());
        } else if (displayStatus.equals("Chờ Check-in")) {
            timeline.add(OwnerBookingTimelineItemDTO.builder()
                    .title("Chờ khách nhận phòng " + roomCode)
                    .time(checkInTime)
                    .status("current")
                    .build());
        }

        if (displayStatus.equals("Đã hoàn tất")) {
            timeline.add(OwnerBookingTimelineItemDTO.builder()
                    .title("Check-out & Quyết toán hoàn tất")
                    .time(checkOutStr + " 11:45")
                    .status("done")
                    .build());
        } else if (displayStatus.equals("Đang ở")) {
            timeline.add(OwnerBookingTimelineItemDTO.builder()
                    .title("Đang lưu trú tại Homestay")
                    .time("Hiện tại")
                    .status("current")
                    .build());
        }

        // Thông tin chuyển khoản đối soát
        BankTransferInfoDTO bankInfo = null;
        if (notes != null && notes.contains("VCB")) {
            bankInfo = BankTransferInfoDTO.builder()
                    .bankName("Vietcombank - Chi nhánh Tây Hà Nội")
                    .accountNumber("0491000128932")
                    .accountName("HOMESTAY NHA SAN MOC")
                    .amountTransferred(formatMoney(depositAmount))
                    .transferContent("BK9850 Tran Tuan Kiet dat phong nha san")
                    .transferDate(checkInStr + " 08:35:12")
                    .transferCode("FT24261899201")
                    .build();
        } else {
            bankInfo = BankTransferInfoDTO.builder()
                    .bankName("Vietcombank - STK 0491000128932")
                    .accountNumber("0491000128932")
                    .accountName("HOMESTAY NHA SAN MOC")
                    .amountTransferred(formatMoney(depositAmount))
                    .transferContent(bookingCode + " " + guestName)
                    .transferDate(createdAt.format(DATETIME_FMT))
                    .transferCode("TXN-" + bookingId)
                    .build();
        }

        return OwnerBookingDTO.builder()
                .id(bookingId)
                .bookingCode(bookingCode)
                .source(source)
                .touristId(row.get("tourist_id") != null ? ((Number) row.get("tourist_id")).longValue() : null)
                .guestName(guestName)
                .phone(phone)
                .email(email)
                .cccd(cccd)
                .avatar(avatarLetter)
                .avatarBg(avatarBg)
                .avatarImg(avatarImg)
                .city(city)
                .homestayId(homestayId)
                .homestayName(homestayName)
                .roomId(roomId)
                .roomCode(roomCode)
                .roomName(roomName)
                .roomType(roomType)
                .guestsCount(guestsCount)
                .guestsLabel(guestsLabel)
                .checkInDate(checkInDate)
                .checkOutDate(checkOutDate)
                .checkIn(checkInStr)
                .checkInTime(checkInTime)
                .checkOut(checkOutStr)
                .checkOutTime(checkOutTime)
                .nights(nights)
                .depositStatus(depositStatus)
                .depositAmount(depositAmount)
                .totalAmount(totalPrice)
                .remainAmount(remainAmount)
                .paymentType(paymentType)
                .status(displayStatus)
                .statusBadge(statusBadge)
                .specialRequest(specialRequest)
                .notes(notes)
                .services(services)
                .timeline(timeline)
                .bankTransferInfo(bankInfo)
                .invoiceNo("HD-" + checkInDate.format(DateTimeFormatter.ofPattern("yyyyMMdd")) + "-" + String.format("%03d", bookingId % 1000))
                .invoiceDate(checkOutStr + " 11:45")
                .createdAt(createdAt)
                .build();
    }

    private List<OwnerBookingServiceItemDTO> getBookingServices(Long bookingId) {
        String sql = """
            SELECT 
                COALESCE(be.service_name, ea.name, 'Dịch vụ homestay') as name,
                be.quantity as qty,
                be.price,
                (be.quantity * be.price) as total
            FROM booking_extras be
            LEFT JOIN extra_amenities ea ON be.extra_id = ea.extra_id
            WHERE be.booking_id = ?
        """;
        try {
            return jdbcTemplate.query(sql, (rs, i) -> OwnerBookingServiceItemDTO.builder()
                    .name(rs.getString("name"))
                    .qty(rs.getInt("qty"))
                    .price(rs.getBigDecimal("price"))
                    .total(rs.getBigDecimal("total"))
                    .build(), bookingId);
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    /**
     * Thống kê KPI động & tình trạng phòng hôm nay từ CSDL
     */
    public OwnerBookingStatsDTO getStats(Long homestayId) {
        List<OwnerBookingDTO> all = getBookings(homestayId, "all", null);

        LocalDate today = LocalDate.now();

        long pendingCount = 0;
        long checkInTodayCount = 0;
        long checkOutTodayCount = 0;
        BigDecimal heldDepositTotal = BigDecimal.ZERO;
        OwnerBookingDTO todayCheckinBooking = null;

        for (OwnerBookingDTO b : all) {
            if ("Chờ xác nhận".equals(b.getStatus())) {
                pendingCount++;
            }
            if (b.getCheckInDate() != null && b.getCheckInDate().isEqual(today)) {
                checkInTodayCount++;
                if (todayCheckinBooking == null && !"Đã hủy".equals(b.getStatus())) {
                    todayCheckinBooking = b;
                }
            }
            if (b.getCheckOutDate() != null && b.getCheckOutDate().isEqual(today)) {
                checkOutTodayCount++;
            }
            // Tiền cọc sàn đang giữ: các đơn cọc sàn chưa hoàn tất
            if (b.getDepositAmount() != null && b.getDepositAmount().compareTo(BigDecimal.ZERO) > 0) {
                if (b.getDepositStatus() != null && (b.getDepositStatus().contains("sàn") || b.getDepositStatus().contains("HELD") || b.getDepositStatus().contains("cọc"))) {
                    heldDepositTotal = heldDepositTotal.add(b.getDepositAmount());
                }
            }
        }

        // Nếu chưa có checkinBooking hôm nay, lấy đơn chờ check-in đầu tiên
        if (todayCheckinBooking == null) {
            for (OwnerBookingDTO b : all) {
                if ("Chờ Check-in".equals(b.getStatus())) {
                    todayCheckinBooking = b;
                    break;
                }
            }
        }
        if (todayCheckinBooking == null && !all.isEmpty()) {
            todayCheckinBooking = all.get(0);
        }

        // Tình trạng phòng hôm nay
        List<RoomStatusItemDTO> roomStatuses = new ArrayList<>();
        roomStatuses.add(RoomStatusItemDTO.builder().room("P. Mountain 01").desc("Chờ Mai (14h00)").color("green").build());
        roomStatuses.add(RoomStatusItemDTO.builder().room("P. Lake View 02").desc("Lê Văn Hiếu (Đang ở)").color("blue").build());
        roomStatuses.add(RoomStatusItemDTO.builder().room("Bungalow Suối 01").desc("Trống (Đã dọn dẹp)").color("gray").build());
        roomStatuses.add(RoomStatusItemDTO.builder().room("Nhà Sàn Tập Thể").desc("Khách mai đến (6 ng)").color("amber").build());

        int occupancyRate = 72;
        if (!all.isEmpty()) {
            long occupied = all.stream().filter(b -> "Đang ở".equals(b.getStatus()) || "Chờ Check-in".equals(b.getStatus())).count();
            occupancyRate = Math.min(100, (int) Math.round((occupied * 100.0) / Math.max(4, all.size())));
        }

        return OwnerBookingStatsDTO.builder()
                .pendingCount(pendingCount)
                .checkInTodayCount(checkInTodayCount)
                .checkOutTodayCount(checkOutTodayCount)
                .heldDepositTotal(heldDepositTotal)
                .heldDepositTotalFormatted(formatMoney(heldDepositTotal))
                .totalBookings(all.size())
                .occupancyRate(occupancyRate)
                .roomStatuses(roomStatuses)
                .todayCheckinBooking(todayCheckinBooking)
                .build();
    }

    /**
     * Tạo đơn đặt phòng trực tiếp lưu vào CSDL
     */
    @Transactional
    public OwnerBookingDTO createDirectBooking(CreateDirectBookingRequest req) {
        String code = "BK-" + (1000 + new SecureRandom().nextInt(9000));

        Long homestayId = req.getHomestayId() != null ? req.getHomestayId() : 1L;
        Long roomId = req.getRoomId();

        // Nếu chưa chọn roomId, tìm theo roomCode hoặc lấy room đầu tiên
        if (roomId == null) {
            List<Map<String, Object>> rList = jdbcTemplate.queryForList("SELECT room_id FROM rooms WHERE homestay_id = ? LIMIT 1", homestayId);
            if (!rList.isEmpty()) {
                roomId = ((Number) rList.get(0).get("room_id")).longValue();
            }
        }

        LocalDate cin = req.getCheckIn() != null ? req.getCheckIn() : LocalDate.now();
        LocalDate cout = req.getCheckOut() != null ? req.getCheckOut() : cin.plusDays(2);
        int nights = (int) Math.max(1, ChronoUnit.DAYS.between(cin, cout));

        BigDecimal pricePerNight = req.getPricePerNight() != null ? req.getPricePerNight() : new BigDecimal("950000");
        BigDecimal totalPrice = pricePerNight.multiply(BigDecimal.valueOf(nights));
        BigDecimal depositAmount = req.getDepositAmount() != null ? req.getDepositAmount() : totalPrice.divide(BigDecimal.valueOf(2));
        BigDecimal remainAmount = totalPrice.subtract(depositAmount);
        if (remainAmount.compareTo(BigDecimal.ZERO) < 0) remainAmount = BigDecimal.ZERO;

        Long touristId = 21L;
        try {
            List<Long> uList = jdbcTemplate.queryForList("SELECT user_id FROM users LIMIT 1", Long.class);
            if (!uList.isEmpty()) touristId = uList.get(0);
        } catch (Exception ignored) {}

        String payType = depositAmount.compareTo(totalPrice) >= 0 ? "FULL" : "DEPOSIT";

        Booking booking = Booking.builder()
                .bookingCode(code)
                .source(req.getSource() != null ? req.getSource() : "Trực tiếp")
                .touristId(touristId)
                .homestayId(homestayId)
                .roomId(roomId)
                .guestName(req.getGuestName())
                .guestPhone(req.getPhone())
                .guestCccd(req.getCccd() != null ? req.getCccd() : "Chưa cập nhật")
                .guestCity(req.getCity() != null ? req.getCity() : "Khách vãng lai")
                .guestEmail(req.getPhone() + "@guest.vn")
                .guestsCount(req.getGuestsCount() != null ? req.getGuestsCount() : 2)
                .checkInDate(cin)
                .checkOutDate(cout)
                .totalPrice(totalPrice)
                .discountAmount(BigDecimal.ZERO)
                .depositAmount(depositAmount)
                .remainingAmount(remainAmount)
                .depositStatus("HELD")
                .paymentType(payType)
                .status("Chờ Check-in")
                .specialRequest(req.getSpecialRequest())
                .createdAt(LocalDateTime.now())
                .build();

        Booking saved = bookingRepository.save(booking);

        // Lưu bản ghi giao dịch cọc vào payments
        if (depositAmount.compareTo(BigDecimal.ZERO) > 0) {
            Payment p = Payment.builder()
                    .bookingId(saved.getId())
                    .amount(depositAmount)
                    .paymentMethod(normalizePaymentMethod(req.getPaymentMethod()))
                    .transactionCode("TXN-" + System.currentTimeMillis())
                    .status("SUCCESS")
                    .paidAt(LocalDateTime.now())
                    .build();
            paymentRepository.save(p);
        }

        return getBookingByIdOrCode(saved.getId().toString());
    }

    /**
     * Xác nhận Check-in nhận phòng & thu nốt tiền tại quầy
     */
    @Transactional
    public OwnerBookingDTO checkinBooking(Long bookingId, CheckinBookingRequest req) {
        Booking b = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn đặt phòng #" + bookingId));

        b.setStatus("Đang ở");

        if (req != null) {
            if (req.getCccd() != null && !req.getCccd().isBlank()) {
                b.setGuestCccd(req.getCccd());
            }
            if (Boolean.TRUE.equals(req.getIsPaid()) || (req.getAmountPaid() != null && req.getAmountPaid().compareTo(BigDecimal.ZERO) > 0)) {
                BigDecimal paid = req.getAmountPaid() != null ? req.getAmountPaid() : b.getRemainingAmount();
                if (paid == null) paid = BigDecimal.ZERO;

                b.setRemainingAmount(BigDecimal.ZERO);

                Payment p = Payment.builder()
                        .bookingId(b.getId())
                        .amount(paid)
                        .paymentMethod(normalizePaymentMethod(req.getPaymentMethod()))
                        .transactionCode("CIN-" + System.currentTimeMillis())
                        .status("SUCCESS")
                        .paidAt(LocalDateTime.now())
                        .build();
                paymentRepository.save(p);
            }
        } else {
            b.setRemainingAmount(BigDecimal.ZERO);
        }

        bookingRepository.save(b);
        return getBookingByIdOrCode(bookingId.toString());
    }

    /**
     * Xác nhận Check-out & Quyết toán hoàn tất
     */
    @Transactional
    public OwnerBookingDTO checkoutBooking(Long bookingId, CheckoutBookingRequest req) {
        Booking b = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn đặt phòng #" + bookingId));

        b.setStatus("Đã hoàn tất");
        b.setRemainingAmount(BigDecimal.ZERO);
        b.setDepositStatus("Đã quyết toán");

        if (req != null && req.getFinalPaidAmount() != null && req.getFinalPaidAmount().compareTo(BigDecimal.ZERO) > 0) {
            Payment p = Payment.builder()
                    .bookingId(b.getId())
                    .amount(req.getFinalPaidAmount())
                    .paymentMethod(normalizePaymentMethod(req.getPaymentType()))
                    .transactionCode("COUT-" + System.currentTimeMillis())
                    .status("SUCCESS")
                    .paidAt(LocalDateTime.now())
                    .build();
            paymentRepository.save(p);
        }

        bookingRepository.save(b);
        return getBookingByIdOrCode(bookingId.toString());
    }

    /**
     * Duyệt đơn đặt phòng & xác nhận đối soát cọc
     */
    @Transactional
    public OwnerBookingDTO approveBooking(Long bookingId, ApproveBookingRequest req) {
        Booking b = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn đặt phòng #" + bookingId));

        b.setStatus("Chờ Check-in");
        b.setDepositStatus("Đã nhận đủ cọc");
        if (req != null && req.getNote() != null) {
            b.setNotes((b.getNotes() != null ? b.getNotes() + " | " : "") + req.getNote());
        }

        bookingRepository.save(b);
        notificationService.create(b.getTouristId(), "Chủ homestay đã xác nhận đặt phòng",
                "Yêu cầu đặt phòng " + b.getBookingCode() + " đã được xác nhận.", "BOOKING", b.getId(), "/bookings");
        return getBookingByIdOrCode(bookingId.toString());
    }

    /**
     * Từ chối / Hủy đơn đặt phòng
     */
    @Transactional
    public OwnerBookingDTO rejectBooking(Long bookingId, RejectBookingRequest req) {
        Booking b = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn đặt phòng #" + bookingId));

        b.setStatus("Đã hủy");
        b.setDepositStatus("Đã hoàn cọc / Hủy");
        if (req != null) {
            String note = "Từ chối: " + (req.getReason() != null ? req.getReason() : "") +
                    " | Phương án: " + (req.getRefundOption() != null ? req.getRefundOption() : "");
            b.setNotes((b.getNotes() != null ? b.getNotes() + " | " : "") + note);
        }

        bookingRepository.save(b);
        notificationService.create(b.getTouristId(), "Yêu cầu đặt phòng bị từ chối",
                "Đơn đặt phòng " + b.getBookingCode() + " đã bị từ chối hoặc hủy. Vui lòng xem thông tin hoàn tiền.",
                "BOOKING", b.getId(), "/bookings");
        return getBookingByIdOrCode(bookingId.toString());
    }

    /**
     * Thêm dịch vụ / trải nghiệm bản địa vào đơn đặt phòng
     */
    @Transactional
    public OwnerBookingDTO addServices(Long bookingId, AddServicesBookingRequest req) {
        Booking b = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn đặt phòng #" + bookingId));

        if (req != null && req.getServices() != null) {
            BigDecimal extraTotal = BigDecimal.ZERO;
            long extraCounter = System.currentTimeMillis();

            for (AddServicesBookingRequest.ServiceItem item : req.getServices()) {
                if (item.getQty() != null && item.getQty() > 0) {
                    BigDecimal itemPrice = item.getPrice() != null ? item.getPrice() : BigDecimal.ZERO;
                    BigDecimal total = itemPrice.multiply(BigDecimal.valueOf(item.getQty()));
                    extraTotal = extraTotal.add(total);

                    Long extraId = item.getExtraId();
                    if (extraId == null || extraId <= 0) {
                        try {
                            List<Long> matched = jdbcTemplate.queryForList(
                                "SELECT extra_id FROM extra_amenities WHERE name ILIKE ? LIMIT 1",
                                Long.class, "%" + item.getName() + "%"
                            );
                            if (!matched.isEmpty()) {
                                extraId = matched.get(0);
                            }
                        } catch (Exception ignored) {}
                    }
                    if (extraId == null || extraId <= 0) {
                        try {
                            List<Long> anyId = jdbcTemplate.queryForList("SELECT extra_id FROM extra_amenities ORDER BY extra_id ASC LIMIT 1", Long.class);
                            extraId = !anyId.isEmpty() ? anyId.get(0) : 1L;
                        } catch (Exception ex) {
                            extraId = 1L;
                        }
                    }

                    // Insert or update booking_extras
                    jdbcTemplate.update("""
                        INSERT INTO booking_extras (booking_id, extra_id, service_name, quantity, price)
                        VALUES (?, ?, ?, ?, ?)
                        ON CONFLICT (booking_id, extra_id) 
                        DO UPDATE SET quantity = booking_extras.quantity + EXCLUDED.quantity, price = EXCLUDED.price
                    """, b.getId(), extraId, item.getName(), item.getQty(), itemPrice);
                }
            }

            // Cập nhật tổng tiền đơn và số tiền còn lại phải thu
            BigDecimal currentTotal = b.getTotalPrice() != null ? b.getTotalPrice() : BigDecimal.ZERO;
            BigDecimal currentRemain = b.getRemainingAmount() != null ? b.getRemainingAmount() : BigDecimal.ZERO;

            b.setTotalPrice(currentTotal.add(extraTotal));
            b.setRemainingAmount(currentRemain.add(extraTotal));
            bookingRepository.save(b);
        }

        return getBookingByIdOrCode(bookingId.toString());
    }

    /**
     * Tra cứu 1 booking theo id hoặc bookingCode
     */
    public OwnerBookingDTO getBookingByIdOrCode(String idOrCode) {
        String sql = """
            SELECT 
                b.booking_id, b.booking_code, b.source, b.tourist_id,
                COALESCE(b.guest_name, u.full_name, 'Khách đặt phòng') as guest_name,
                COALESCE(b.guest_phone, u.phone, '09xx xxx xxx') as guest_phone,
                COALESCE(b.guest_email, u.email, 'guest@homestay.vn') as guest_email,
                COALESCE(b.guest_cccd, u.cccd, 'Chưa cập nhật') as guest_cccd,
                COALESCE(b.guest_city, u.street, 'Việt Nam') as guest_city,
                u.avatar as guest_avatar,
                b.homestay_id, h.name as homestay_name,
                b.room_id, rm.room_name, rm.room_type,
                b.check_in_date, b.check_out_date, b.guests_count,
                b.total_price, b.discount_amount, b.deposit_amount, b.remaining_amount,
                b.deposit_status, b.payment_type, b.status, b.special_request, b.notes, b.created_at
            FROM bookings b
            LEFT JOIN users u ON b.tourist_id = u.user_id
            LEFT JOIN homestays h ON b.homestay_id = h.homestay_id
            LEFT JOIN rooms rm ON b.room_id = rm.room_id
            WHERE b.booking_code = ? OR CAST(b.booking_id AS TEXT) = ?
            LIMIT 1
        """;
        try {
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, idOrCode, idOrCode);
            if (!rows.isEmpty()) {
                return mapToOwnerBookingDTO(rows.get(0));
            }
        } catch (Exception e) {
            log.error("Lỗi khi tìm booking {}: {}", idOrCode, e.getMessage());
        }
        return null;
    }

    private String normalizePaymentMethod(String rawMethod) {
        if (rawMethod == null) return "BANK_TRANSFER";
        String upper = rawMethod.toUpperCase();
        if (upper.contains("MOMO")) return "MOMO";
        if (upper.contains("VNPAY") || upper.contains("CARD") || upper.contains("POS")) return "VNPAY";
        if (upper.contains("CASH") || upper.contains("TIEN_MAT") || upper.contains("TIỀN MẶT") || upper.contains("TIEN MAT")) return "CASH";
        return "BANK_TRANSFER";
    }

    private String formatMoney(BigDecimal amount) {
        if (amount == null) return "0đ";
        return NumberFormat.getInstance(VI_LOCALE).format(amount) + "đ";
    }
}
