package vn.edu.hcmuaf.fit.springboot.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.hcmuaf.fit.springboot.dto.*;
import vn.edu.hcmuaf.fit.springboot.model.*;
import vn.edu.hcmuaf.fit.springboot.repository.*;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingService {

    private final JdbcTemplate jdbcTemplate;
    private final BookingRepository bookingRepository;
    private final ReportRepository reportRepository;
    private final ReviewRepository reviewRepository;
    private final GuestTaskRepository guestTaskRepository;
    private final PaymentRepository paymentRepository;
    private final HomestayRepository homestayRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final ReviewSentimentService reviewSentimentService;
    private final CashbackWalletService cashbackWalletService;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final Locale VI_LOCALE = new Locale("vi", "VN");

    public record RawBooking(
        Long bookingId, String bookingCode, Long touristId, String touristName, String touristAvatar,
        Long homestayId, String homestayName, String homestayCity, String homestayAddress,
        Long roomId, String roomName, String roomType,
        LocalDate checkInDate, LocalDate checkOutDate, int guestsCount,
        BigDecimal totalPrice, BigDecimal discountAmount, BigDecimal depositAmount, BigDecimal remainingAmount,
        String paymentType, String depositStatus, String status, LocalDateTime createdAt,
        String homestayImage, String roomImage
    ) {}

    /**
     * Lấy toàn bộ danh sách đặt phòng thực tế của người dùng từ CSDL Neon PostgreSQL
     * Bọc try-catch riêng biệt cho reports, reviews, tasks để tránh 1 lỗi phụ làm hỏng toàn bộ danh sách
     */
    public List<UserBookingDTO> getUserBookings(Long touristId) {
        if (touristId == null) {
            return Collections.emptyList();
        }

        String sql = """
            SELECT 
                b.booking_id, b.booking_code, b.tourist_id, 
                COALESCE(u.full_name, b.guest_name, 'Khách đặt phòng') as tourist_name, 
                u.avatar as tourist_avatar,
                b.homestay_id, 
                COALESCE(h.name, 'Homestay YÊN') as homestay_name, 
                h.city as homestay_city, 
                h.address as homestay_address,
                b.room_id, rm.room_name, rm.room_type,
                b.check_in_date, b.check_out_date, b.guests_count,
                b.total_price, b.discount_amount, b.deposit_amount, b.remaining_amount,
                b.payment_type, b.deposit_status, b.status, b.created_at,
                (SELECT hi.image_url FROM homestay_images hi WHERE hi.homestay_id = b.homestay_id ORDER BY hi.is_primary DESC, hi.image_id ASC LIMIT 1) as homestay_image,
                (SELECT ri.image_url FROM room_images ri WHERE ri.room_id = b.room_id ORDER BY ri.is_primary DESC, ri.image_id ASC LIMIT 1) as room_image
            FROM bookings b
            LEFT JOIN users u ON b.tourist_id = u.user_id
            LEFT JOIN homestays h ON b.homestay_id = h.homestay_id
            LEFT JOIN rooms rm ON b.room_id = rm.room_id
            WHERE b.tourist_id = ?
            ORDER BY b.created_at DESC NULLS LAST, b.booking_id DESC
        """;

        try {
            List<RawBooking> rawList = jdbcTemplate.query(sql, (rs, rowNum) -> mapRawBooking(rs), touristId);
            if (rawList == null || rawList.isEmpty()) {
                return Collections.emptyList();
            }

            List<Long> bookingIds = rawList.stream().map(RawBooking::bookingId).filter(Objects::nonNull).distinct().toList();
            List<Long> homestayIds = rawList.stream().map(RawBooking::homestayId).filter(Objects::nonNull).distinct().toList();

            // BATCH FETCH 1: Reports an toàn
            Map<Long, Report> reportMap = new HashMap<>();
            try {
                if (!bookingIds.isEmpty()) {
                    List<Report> reps = reportRepository.findByBookingIdIn(bookingIds);
                    if (reps != null) {
                        for (Report r : reps) {
                            if (r != null && r.getBookingId() != null) {
                                reportMap.putIfAbsent(r.getBookingId(), r);
                            }
                        }
                    }
                }
            } catch (Exception ex) {
                log.warn("Bỏ qua lỗi tải reports: {}", ex.getMessage());
            }

            // BATCH FETCH 2: Reviews an toàn
            Map<Long, Review> reviewMap = new HashMap<>();
            try {
                if (!bookingIds.isEmpty()) {
                    List<Review> revs = reviewRepository.findByBookingIdIn(bookingIds);
                    if (revs != null) {
                        for (Review rev : revs) {
                            if (rev != null && rev.getBookingId() != null) {
                                reviewMap.putIfAbsent(rev.getBookingId(), rev);
                            }
                        }
                    }
                }
            } catch (Exception ex) {
                log.warn("Bỏ qua lỗi tải reviews: {}", ex.getMessage());
            }

            // BATCH FETCH 3: Guest Tasks an toàn
            Map<Long, GuestTask> taskMap = new HashMap<>();
            try {
                if (!homestayIds.isEmpty()) {
                    List<GuestTask> tasks = guestTaskRepository.findByHomestayIdIn(homestayIds);
                    if (tasks != null) {
                        for (GuestTask t : tasks) {
                            if (t != null && t.getHomestayId() != null) {
                                taskMap.putIfAbsent(t.getHomestayId(), t);
                            }
                        }
                    }
                }
            } catch (Exception ex) {
                log.warn("Bỏ qua lỗi tải guest tasks: {}", ex.getMessage());
            }

            // Lắp ráp UserBookingDTO an toàn từng phần tử
            List<UserBookingDTO> result = new ArrayList<>();
            for (RawBooking raw : rawList) {
                try {
                    result.add(convertRawToDTO(raw, 
                            raw.bookingId() != null ? reportMap.get(raw.bookingId()) : null, 
                            raw.bookingId() != null ? reviewMap.get(raw.bookingId()) : null, 
                            raw.homestayId() != null ? taskMap.get(raw.homestayId()) : null));
                } catch (Exception ex) {
                    log.error("Lỗi convert đơn đặt phòng ID {}: {}", raw.bookingId(), ex.getMessage());
                    result.add(fallbackDTO(raw));
                }
            }
            return result;
        } catch (Exception e) {
            log.error("Lỗi khi truy vấn danh sách đặt phòng của người dùng {}: {}", touristId, e.getMessage(), e);
            return Collections.emptyList();
        }
    }

    /**
     * Lấy chi tiết 1 đơn đặt phòng theo mã bookingCode
     */
    public UserBookingDTO getBookingByCode(String bookingCode) {
        String sql = """
            SELECT 
                b.booking_id, b.booking_code, b.tourist_id, u.full_name as tourist_name, u.avatar as tourist_avatar,
                b.homestay_id, h.name as homestay_name, h.city as homestay_city, h.address as homestay_address,
                b.room_id, rm.room_name, rm.room_type,
                b.check_in_date, b.check_out_date, b.guests_count,
                b.total_price, b.discount_amount, b.deposit_amount, b.remaining_amount,
                b.payment_type, b.deposit_status, b.status, b.created_at,
                (SELECT hi.image_url FROM homestay_images hi WHERE hi.homestay_id = b.homestay_id ORDER BY hi.is_primary DESC, hi.image_id ASC LIMIT 1) as homestay_image,
                (SELECT ri.image_url FROM room_images ri WHERE ri.room_id = b.room_id ORDER BY ri.is_primary DESC, ri.image_id ASC LIMIT 1) as room_image
            FROM bookings b
            JOIN users u ON b.tourist_id = u.user_id
            JOIN homestays h ON b.homestay_id = h.homestay_id
            LEFT JOIN rooms rm ON b.room_id = rm.room_id
            WHERE b.booking_code = ?
            LIMIT 1
        """;

        try {
            List<RawBooking> list = jdbcTemplate.query(sql, (rs, rowNum) -> mapRawBooking(rs), bookingCode);
            if (list.isEmpty()) return null;
            RawBooking raw = list.get(0);
            Report report = reportRepository.findFirstByBookingId(raw.bookingId()).orElse(null);
            Review review = reviewRepository.findFirstByBookingId(raw.bookingId()).orElse(null);
            GuestTask task = guestTaskRepository.findByHomestayId(raw.homestayId()).stream().findFirst().orElse(null);
            return convertRawToDTO(raw, report, review, task);
        } catch (Exception e) {
            log.error("Lỗi khi truy vấn đơn đặt phòng theo mã {}: {}", bookingCode, e.getMessage());
            return null;
        }
    }

    /**
     * Tạo mới đơn đặt phòng vào Neon PostgreSQL
     */
    @CacheEvict(value = "userBookings", allEntries = true)
    @Transactional
    public Booking createBooking(CreateBookingRequest req) {
        if (req.getTouristId() == null || req.getHomestayId() == null || req.getCheckInDate() == null || req.getCheckOutDate() == null) {
            throw new IllegalArgumentException("Thiếu người đặt, homestay hoặc ngày nhận/trả phòng.");
        }
        Homestay targetHomestay = homestayRepository.findById(req.getHomestayId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy homestay được đặt."));
        String code = "YEN-" + LocalDate.now().getYear() + "-" + (1000 + new SecureRandom().nextInt(9000));

        // Chuẩn hóa theo ràng buộc Check Constraint của Neon PostgreSQL:
        // payment_type: 'FULL' hoặc 'DEPOSIT'
        String payType = "DEPOSIT".equalsIgnoreCase(req.getPaymentType()) ? "DEPOSIT" : "FULL";
        // deposit_status: 'HELD', 'REFUNDED' hoặc 'FORFEITED'
        String depStatus = "REFUNDED".equalsIgnoreCase(req.getDepositStatus()) ? "REFUNDED" :
                           ("FORFEITED".equalsIgnoreCase(req.getDepositStatus()) ? "FORFEITED" : "HELD");
        // status: 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'
        String bookingStatus = "CANCELLED".equalsIgnoreCase(req.getStatus()) ? "CANCELLED" :
                               ("COMPLETED".equalsIgnoreCase(req.getStatus()) ? "COMPLETED" :
                               ("PENDING".equalsIgnoreCase(req.getStatus()) ? "PENDING" : "CONFIRMED"));

        Booking booking = Booking.builder()
                .bookingCode(code)
                .touristId(req.getTouristId())
                .homestayId(req.getHomestayId())
                .roomId(req.getRoomId())
                .voucherId(req.getVoucherId())
                .checkInDate(req.getCheckInDate())
                .checkOutDate(req.getCheckOutDate())
                .guestsCount(req.getGuestsCount() != null ? req.getGuestsCount() : 2)
                .totalPrice(req.getTotalPrice() != null ? req.getTotalPrice() : BigDecimal.ZERO)
                .discountAmount(req.getDiscountAmount() != null ? req.getDiscountAmount() : BigDecimal.ZERO)
                .depositAmount(req.getDepositAmount() != null ? req.getDepositAmount() : BigDecimal.ZERO)
                .remainingAmount(req.getRemainingAmount() != null ? req.getRemainingAmount() : BigDecimal.ZERO)
                .paymentType(payType)
                .depositStatus(depStatus)
                .status(bookingStatus)
                .createdAt(LocalDateTime.now())
                .build();

        Booking savedBooking = bookingRepository.save(booking);

        notificationService.create(savedBooking.getTouristId(), "Đã gửi yêu cầu đặt phòng",
                "Yêu cầu đặt phòng tại " + targetHomestay.getName() + " đã được gửi thành công.",
                "BOOKING", savedBooking.getId(), "/bookings");
        notificationService.create(targetHomestay.getOwnerId(), "Bạn có yêu cầu đặt phòng mới",
                "Có yêu cầu đặt phòng mới tại " + targetHomestay.getName() + ".", "BOOKING",
                savedBooking.getId(), "/owner/bookings");

        // Tạo bản ghi giao dịch payment nếu đã thanh toán
        // payments.payment_method: 'BANK_TRANSFER', 'CASH', 'VNPAY', 'MOMO'
        // payments.status: 'PENDING', 'SUCCESS', 'FAILED'
        String rawMethod = (req.getPaymentMethod() != null ? req.getPaymentMethod() :
                           (req.getPaymentType() != null ? req.getPaymentType() : "")).toUpperCase();
        String dbMethod = "BANK_TRANSFER";
        if (rawMethod.contains("MOMO")) {
            dbMethod = "MOMO";
        } else if (rawMethod.contains("VNPAY") || rawMethod.contains("CARD") || rawMethod.contains("ZALO")) {
            dbMethod = "VNPAY";
        } else if (rawMethod.contains("CASH") || rawMethod.contains("TIEN_MAT")) {
            dbMethod = "CASH";
        } else {
            dbMethod = "BANK_TRANSFER";
        }

        if (booking.getDepositAmount() != null && booking.getDepositAmount().compareTo(BigDecimal.ZERO) > 0) {
            Payment payment = Payment.builder()
                    .bookingId(savedBooking.getId())
                    .amount(booking.getDepositAmount())
                    .paymentMethod(dbMethod)
                    .transactionCode("TXN-" + System.currentTimeMillis())
                    .status("SUCCESS")
                    .paidAt(LocalDateTime.now())
                    .build();
            paymentRepository.save(payment);
        }

        // Tự động tích lũy 5% vào Ví hoàn tiền YÊN nếu đơn phòng xác nhận thành công
        if ("CONFIRMED".equalsIgnoreCase(savedBooking.getStatus()) || "PAID".equalsIgnoreCase(savedBooking.getDepositStatus())) {
            try {
                cashbackWalletService.creditCashbackForBooking(savedBooking);
            } catch (Exception ce) {
                log.warn("Lỗi tích điểm cho đơn đặt phòng {}: {}", savedBooking.getBookingCode(), ce.getMessage());
            }
        }

        return savedBooking;
    }

    /**
     * Hủy đơn đặt phòng
     */
    @CacheEvict(value = "userBookings", allEntries = true)
    @Transactional
    public boolean cancelBooking(Long bookingId, Long touristId) {
        Optional<Booking> opt = bookingRepository.findById(bookingId);
        if (opt.isPresent()) {
            Booking b = opt.get();
            if (touristId != null && b.getTouristId().equals(touristId)) {
                b.setStatus("CANCELLED");
                bookingRepository.save(b);
                homestayRepository.findById(b.getHomestayId()).ifPresent(h -> notificationService.create(h.getOwnerId(),
                        "Khách yêu cầu hủy đặt phòng", "Khách đã gửi yêu cầu hủy đơn " + b.getBookingCode() + ".",
                        "BOOKING", b.getId(), "/owner/bookings"));
                return true;
            }
        }
        return false;
    }

    /**
     * Gửi khiếu nại thực tế liên kết với booking
     */
    @CacheEvict(value = "userBookings", allEntries = true)
    @Transactional
    public Report createComplaint(CreateComplaintRequest req) {
        Long homestayId = req.getReportedHomestayId();
        if (homestayId == null && req.getBookingId() != null) {
            homestayId = bookingRepository.findById(req.getBookingId())
                    .map(Booking::getHomestayId)
                    .orElse(1L);
        }
        if (homestayId == null) homestayId = 1L;

        Long reporterId = req.getReporterId();
        if (reporterId == null && req.getBookingId() != null) {
            reporterId = bookingRepository.findById(req.getBookingId())
                    .map(Booking::getTouristId)
                    .orElse(21L);
        }
        if (reporterId == null) reporterId = 21L;

        String touristName = "Du khách";
        String touristPhone = "0912 345 678";
        String homestayName = "Homestay YÊN";
        String hostName = "Chủ nhà Homestay";
        String hostPhone = "0988 765 432";
        String region = "Việt Nam";
        String bookingCodeStr = "#BK-" + (req.getBookingId() != null ? req.getBookingId() : "1");
        String bookingTotalStr = "1.500.000đ";
        String stayDatesStr = "Theo lịch lưu trú";

        try {
            if (req.getBookingId() != null) {
                Booking bk = bookingRepository.findById(req.getBookingId()).orElse(null);
                if (bk != null) {
                    if (bk.getBookingCode() != null) {
                        bookingCodeStr = bk.getBookingCode().startsWith("#") ? bk.getBookingCode() : "#" + bk.getBookingCode();
                    }
                    if (bk.getTotalPrice() != null) {
                        bookingTotalStr = String.format("%,dđ", bk.getTotalPrice().longValue());
                    }
                    if (bk.getCheckInDate() != null && bk.getCheckOutDate() != null) {
                        stayDatesStr = bk.getCheckInDate().format(DATE_FMT) + " - " + bk.getCheckOutDate().format(DATE_FMT);
                    }
                }
            }
            if (reporterId != null) {
                List<Map<String, Object>> uList = jdbcTemplate.queryForList("SELECT full_name, phone FROM users WHERE user_id = ?", reporterId);
                if (!uList.isEmpty()) {
                    Map<String, Object> u = uList.get(0);
                    if (u.get("full_name") != null && !u.get("full_name").toString().isBlank()) touristName = u.get("full_name").toString();
                    if (u.get("phone") != null && !u.get("phone").toString().isBlank()) touristPhone = u.get("phone").toString();
                }
            }
            if (homestayId != null) {
                List<Map<String, Object>> hList = jdbcTemplate.queryForList("SELECT h.name, h.city, h.address, u.full_name as host_name, u.phone as host_phone FROM homestays h LEFT JOIN users u ON h.owner_id = u.user_id WHERE h.homestay_id = ?", homestayId);
                if (!hList.isEmpty()) {
                    Map<String, Object> h = hList.get(0);
                    if (h.get("name") != null && !h.get("name").toString().isBlank()) homestayName = h.get("name").toString();
                    if (h.get("city") != null && !h.get("city").toString().isBlank()) region = h.get("city").toString();
                    else if (h.get("address") != null && !h.get("address").toString().isBlank()) region = h.get("address").toString();
                    if (h.get("host_name") != null && !h.get("host_name").toString().isBlank()) hostName = h.get("host_name").toString();
                    if (h.get("host_phone") != null && !h.get("host_phone").toString().isBlank()) hostPhone = h.get("host_phone").toString();
                }
            }
        } catch (Exception e) {
            log.warn("Lỗi enrich thông tin khiếu nại: {}", e.getMessage());
        }

        String nextCode = String.format("#KN-%04d", 1048 + reportRepository.count() + 1);
        String initialTimeline = "[{\"time\":\"Vừa xong\",\"desc\":\"Du khách " + touristName + " gửi đơn khiếu nại qua ứng dụng\"}]";

        Report report;
        Optional<Report> existingOpt = req.getBookingId() != null ? reportRepository.findFirstByBookingId(req.getBookingId()) : Optional.empty();
        if (existingOpt.isPresent()) {
            report = existingOpt.get();
            report.setReportType(req.getReportType() != null ? req.getReportType() : "Chất lượng phòng ở");
            report.setTitle(req.getTitle() != null ? req.getTitle() : "Khiếu nại về đơn đặt phòng " + bookingCodeStr);
            report.setContent(req.getContent());
            if (req.getProofImages() != null && !req.getProofImages().isBlank()) {
                report.setProofImages(req.getProofImages());
            }
            report.setStatus("PENDING");
            if (report.getComplaintCode() == null) report.setComplaintCode(nextCode);
            if (report.getDirection() == null) report.setDirection("tourist_to_homestay");
            report.setBookingCode(bookingCodeStr);
            report.setBookingTotal(bookingTotalStr);
            report.setStayDates(stayDatesStr);
            report.setReporterName(touristName);
            report.setReporterPhone(touristPhone);
            report.setReporterRole("Du khách (Tourist)");
            report.setReportedHomestayName(homestayName);
            report.setReportedName(hostName);
            report.setReporterReportedPhone(hostPhone);
            report.setReportedRegion(region);
        } else {
            report = Report.builder()
                    .complaintCode(nextCode)
                    .direction("tourist_to_homestay")
                    .bookingId(req.getBookingId() != null ? req.getBookingId() : 1L)
                    .bookingCode(bookingCodeStr)
                    .reporterId(reporterId)
                    .reportedHomestayId(homestayId)
                    .reporterName(touristName)
                    .reporterRole("Du khách (Tourist)")
                    .reporterPhone(touristPhone)
                    .reportedHomestayName(homestayName)
                    .reportedName(hostName)
                    .reporterReportedPhone(hostPhone)
                    .reportedRegion(region)
                    .reportType(req.getReportType() != null ? req.getReportType() : "Chất lượng phòng ở")
                    .title(req.getTitle() != null ? req.getTitle() : "Khiếu nại về đơn đặt phòng " + bookingCodeStr)
                    .content(req.getContent() != null ? req.getContent() : "Không có nội dung chi tiết")
                    .demands("Đề nghị Admin và chủ nhà hỗ trợ xử lý.")
                    .reportedResponse("Đang chờ phản hồi giải trình từ chủ nhà Homestay.")
                    .requestedAmount(BigDecimal.ZERO)
                    .bookingTotal(bookingTotalStr)
                    .stayDates(stayDatesStr)
                    .severity(req.getSeverity() != null ? req.getSeverity() : "medium")
                    .proofImages(req.getProofImages())
                    .status("PENDING")
                    .timeline(initialTimeline)
                    .createdAt(LocalDateTime.now())
                    .build();
        }

        Report savedReport = reportRepository.save(report);
        for (User admin : userRepository.findByRoleIgnoreCase("ADMIN")) {
            if ("ACTIVE".equalsIgnoreCase(admin.getStatus())) {
                notificationService.create(admin.getId(), "Có báo cáo hoặc khiếu nại mới",
                        "Có khiếu nại mới cần kiểm tra: " + savedReport.getTitle(), "REPORT",
                        savedReport.getId(), "/admin/complaints");
            }
        }
        return savedReport;
    }

    /**
     * Đăng đánh giá thực tế & hoàn thành nhiệm vụ homestay
     */
    @CacheEvict(value = "userBookings", allEntries = true)
    @Transactional
    public Review submitReviewAndCompleteTask(CreateReviewRequest req) {
        Long homestayId = req.getHomestayId();
        if (homestayId == null && req.getBookingId() != null) {
            homestayId = bookingRepository.findById(req.getBookingId())
                    .map(Booking::getHomestayId)
                    .orElse(1L);
        }
        if (homestayId == null) homestayId = 1L;

        Long touristId = req.getTouristId();
        if (touristId == null && req.getBookingId() != null) {
            touristId = bookingRepository.findById(req.getBookingId())
                    .map(Booking::getTouristId)
                    .orElse(21L);
        }
        if (touristId == null) touristId = 21L;

        Review review;
        Optional<Review> existingOpt = req.getBookingId() != null ? reviewRepository.findFirstByBookingId(req.getBookingId()) : Optional.empty();
        if (existingOpt.isPresent()) {
            review = existingOpt.get();
            review.setRating(req.getRating() != null ? req.getRating() : 5);
            review.setComment((req.getTitle() != null ? req.getTitle() + "\n" : "") + (req.getComment() != null ? req.getComment() : ""));
            if (req.getImages() != null && !req.getImages().isBlank()) {
                review.setImages(req.getImages());
            }
            review.setTaskStatus("APPROVED");
            review.setReviewedAt(LocalDateTime.now());
        } else {
            review = Review.builder()
                    .bookingId(req.getBookingId() != null ? req.getBookingId() : 1L)
                    .homestayId(homestayId)
                    .touristId(touristId)
                    .taskId(req.getTaskId())
                    .rating(req.getRating() != null ? req.getRating() : 5)
                    .comment((req.getTitle() != null ? req.getTitle() + "\n" : "") + (req.getComment() != null ? req.getComment() : ""))
                    .images(req.getImages())
                    .taskStatus("APPROVED")
                    .reviewedAt(LocalDateTime.now())
                    .createdAt(LocalDateTime.now())
                    .build();
        }

        Review savedReview = reviewRepository.save(review);
        reviewSentimentService.analyzeAsync(savedReview);
        homestayRepository.findById(homestayId).ifPresent(h -> notificationService.create(h.getOwnerId(),
                "Khách vừa gửi đánh giá mới", "Homestay " + h.getName() + " vừa nhận được đánh giá mới.",
                "REVIEW", savedReview.getId(), "/owner/reviews"));
        return savedReview;
    }

    private RawBooking mapRawBooking(ResultSet rs) throws SQLException {
        java.sql.Date cinDateSql = rs.getDate("check_in_date");
        java.sql.Date coutDateSql = rs.getDate("check_out_date");
        Timestamp createdTs = rs.getTimestamp("created_at");

        return new RawBooking(
            rs.getLong("booking_id"),
            rs.getString("booking_code"),
            rs.getLong("tourist_id"),
            rs.getString("tourist_name"),
            rs.getString("tourist_avatar"),
            rs.getLong("homestay_id"),
            rs.getString("homestay_name"),
            rs.getString("homestay_city"),
            rs.getString("homestay_address"),
            rs.getObject("room_id") != null ? rs.getLong("room_id") : null,
            rs.getString("room_name"),
            rs.getString("room_type"),
            cinDateSql != null ? cinDateSql.toLocalDate() : null,
            coutDateSql != null ? coutDateSql.toLocalDate() : null,
            rs.getInt("guests_count"),
            rs.getBigDecimal("total_price"),
            rs.getBigDecimal("discount_amount"),
            rs.getBigDecimal("deposit_amount"),
            rs.getBigDecimal("remaining_amount"),
            rs.getString("payment_type"),
            rs.getString("deposit_status"),
            rs.getString("status"),
            createdTs != null ? createdTs.toLocalDateTime() : null,
            rs.getString("homestay_image"),
            rs.getString("room_image")
        );
    }

    private UserBookingDTO convertRawToDTO(RawBooking raw, Report report, Review review, GuestTask taskEntity) {
        LocalDate checkInDate = raw.checkInDate();
        LocalDate checkOutDate = raw.checkOutDate();

        String checkInStr = checkInDate != null ? checkInDate.format(DATE_FMT) : "N/A";
        String checkOutStr = checkOutDate != null ? checkOutDate.format(DATE_FMT) : "N/A";

        int nights = 1;
        if (checkInDate != null && checkOutDate != null) {
            nights = (int) Math.max(1, ChronoUnit.DAYS.between(checkInDate, checkOutDate));
        }

        BigDecimal totalPrice = raw.totalPrice() != null ? raw.totalPrice() : BigDecimal.ZERO;
        String formattedPrice = NumberFormat.getInstance(VI_LOCALE).format(totalPrice) + "đ";

        BigDecimal depositAmount = raw.depositAmount();
        String depositStatus = raw.depositStatus();
        String paymentType = raw.paymentType();
        String rawStatus = raw.status() != null ? raw.status() : "PENDING";

        // Tính toán chuỗi hiển thị thanh toán
        String payStatus = "Chờ thanh toán";
        if (depositStatus != null && (depositStatus.equalsIgnoreCase("PAID") || depositStatus.equalsIgnoreCase("SUCCESS"))) {
            if (depositAmount != null && depositAmount.compareTo(totalPrice) >= 0) {
                payStatus = "Đã thanh toán " + (paymentType != null ? paymentType : "") + " (100%)";
            } else {
                payStatus = "Đã cọc " + (paymentType != null ? "(" + paymentType + ")" : "30%");
            }
        } else if ("PAID".equalsIgnoreCase(rawStatus) || "COMPLETED".equalsIgnoreCase(rawStatus)) {
            payStatus = "Đã thanh toán 100%";
        }

        // Lấy báo cáo / khiếu nại thực tế liên kết
        UserBookingDTO.ComplaintDTO complaintDTO = null;
        if (report != null) {
            String stText = "Đang xử lý";
            if ("RESOLVED".equalsIgnoreCase(report.getStatus())) stText = "Đã giải quyết";
            else if ("REJECTED".equalsIgnoreCase(report.getStatus())) stText = "Đã từ chối";

            complaintDTO = UserBookingDTO.ComplaintDTO.builder()
                    .id(report.getId())
                    .ticketCode("KN-" + raw.bookingId() + "-" + report.getId())
                    .typeText(report.getReportType() != null ? report.getReportType() : "Chất lượng phòng ở")
                    .severity("medium")
                    .content(report.getContent())
                    .statusText(stText)
                    .adminSolution(report.getAdminSolution())
                    .build();
        }

        UserBookingDTO.TaskDTO taskDTO = null;
        if (taskEntity != null || review != null) {
            boolean hasReviewed = review != null;
            String rewardText = taskEntity != null && taskEntity.getRewardNote() != null 
                    ? taskEntity.getRewardNote() 
                    : "🎁 Quà tặng trực tiếp từ Homestay";

            List<UserBookingDTO.ChecklistItemDTO> checklist = List.of(
                    UserBookingDTO.ChecklistItemDTO.builder()
                            .id(1)
                            .text("Chụp ảnh phòng ở thực tế & nội thất homestay")
                            .done(hasReviewed)
                            .build(),
                    UserBookingDTO.ChecklistItemDTO.builder()
                            .id(2)
                            .text("Chụp ảnh check-in khuôn viên & cảnh quan xung quanh")
                            .done(hasReviewed)
                            .build(),
                    UserBookingDTO.ChecklistItemDTO.builder()
                            .id(3)
                            .text("Đăng nhận xét & đánh giá trải nghiệm homestay")
                            .done(hasReviewed)
                            .build()
            );

            UserBookingDTO.UserReviewDTO userReviewDTO = null;
            if (hasReviewed) {
                String commentText = review.getComment() != null ? review.getComment() : "";
                String revTitle = "Đánh giá tuyệt vời!";
                if (commentText.contains("\n")) {
                    String[] parts = commentText.split("\n", 2);
                    revTitle = parts[0];
                    commentText = parts[1];
                }

                String revDate = review.getCreatedAt() != null ? review.getCreatedAt().format(DATE_FMT) : "Gần đây";

                userReviewDTO = UserBookingDTO.UserReviewDTO.builder()
                        .id(review.getId())
                        .rating(review.getRating() != null ? review.getRating() : 5)
                        .title(revTitle)
                        .content(commentText)
                        .ownerReply(review.getOwnerReply())
                        .createdAt(revDate)
                        .build();
            }

            Long taskIdVal = 1L;
            if (taskEntity != null && taskEntity.getId() != null) {
                taskIdVal = taskEntity.getId();
            } else if (review != null && review.getTaskId() != null) {
                taskIdVal = review.getTaskId();
            }

            taskDTO = UserBookingDTO.TaskDTO.builder()
                    .id(taskIdVal)
                    .title(taskEntity != null ? taskEntity.getTitle() : "Danh sách việc cần làm tại Homestay")
                    .rewardText(hasReviewed ? "🎁 Đã nhận quà tặng từ Homestay" : rewardText)
                    .status(hasReviewed ? "completed" : "pending")
                    .checklist(checklist)
                    .userReview(userReviewDTO)
                    .build();
        }

        // Chuẩn hóa status theo giao diện tab: 'active', 'upcoming', 'completed', 'cancelled', 'complaint'
        LocalDate today = LocalDate.now();
        String normalizedStatus;
        if (complaintDTO != null || "COMPLAINT".equalsIgnoreCase(rawStatus)) {
            normalizedStatus = "complaint";
        } else if ("CANCELLED".equalsIgnoreCase(rawStatus)) {
            normalizedStatus = "cancelled";
        } else if ("COMPLETED".equalsIgnoreCase(rawStatus)) {
            normalizedStatus = "completed";
        } else if (checkInDate != null && checkOutDate != null && !today.isBefore(checkInDate) && !today.isAfter(checkOutDate)) {
            normalizedStatus = "active";
        } else if (checkInDate != null && today.isBefore(checkInDate)) {
            normalizedStatus = "upcoming";
        } else {
            normalizedStatus = "completed";
        }

        String homestayImg = raw.homestayImage();
        if (homestayImg == null || homestayImg.trim().isEmpty()) {
            homestayImg = "https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=600&q=80";
        }

        String roomImg = raw.roomImage();
        if (roomImg == null || roomImg.trim().isEmpty()) {
            roomImg = homestayImg;
        }

        String roomName = raw.roomName();
        if (roomName == null || roomName.trim().isEmpty()) {
            roomName = "Phòng tiêu chuẩn";
        }

        String address = raw.homestayAddress();
        String city = raw.homestayCity();
        String locationStr = (address != null && !address.isBlank() ? address + ", " : "") + (city != null ? city : "Việt Nam");

        int guestsCount = raw.guestsCount() > 0 ? raw.guestsCount() : 2;

        return UserBookingDTO.builder()
                .id(raw.bookingId())
                .bookingCode(raw.bookingCode())
                .touristId(raw.touristId())
                .touristName(raw.touristName())
                .touristAvatar(raw.touristAvatar())
                .homestayId(raw.homestayId())
                .homestayName(raw.homestayName())
                .homestayImage(homestayImg)
                .location(locationStr)
                .roomId(raw.roomId())
                .roomName(roomName)
                .roomType(raw.roomType() != null ? raw.roomType() : roomName)
                .roomImage(roomImg)
                .checkIn(checkInStr)
                .checkOut(checkOutStr)
                .checkInDate(checkInDate)
                .checkOutDate(checkOutDate)
                .nights(nights)
                .guests(guestsCount + " người lớn")
                .guestsCount(guestsCount)
                .totalPrice(formattedPrice)
                .totalPriceRaw(totalPrice)
                .depositAmount(depositAmount)
                .remainingAmount(raw.remainingAmount())
                .paymentType(paymentType)
                .depositStatus(depositStatus)
                .payStatus(payStatus)
                .status(normalizedStatus)
                .statusRaw(rawStatus)
                .createdAt(raw.createdAt())
                .task(taskDTO)
                .complaint(complaintDTO)
                .build();
    }

    private UserBookingDTO fallbackDTO(RawBooking raw) {
        BigDecimal tp = raw.totalPrice() != null ? raw.totalPrice() : BigDecimal.ZERO;
        String formattedPrice = NumberFormat.getInstance(VI_LOCALE).format(tp) + "đ";
        String cin = raw.checkInDate() != null ? raw.checkInDate().format(DATE_FMT) : "N/A";
        String cout = raw.checkOutDate() != null ? raw.checkOutDate().format(DATE_FMT) : "N/A";
        String img = (raw.homestayImage() != null && !raw.homestayImage().isBlank()) 
                ? raw.homestayImage() 
                : "https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=600&q=80";
        String loc = (raw.homestayAddress() != null ? raw.homestayAddress() + ", " : "") + (raw.homestayCity() != null ? raw.homestayCity() : "Việt Nam");

        return UserBookingDTO.builder()
                .id(raw.bookingId())
                .bookingCode(raw.bookingCode() != null ? raw.bookingCode() : "BK-" + raw.bookingId())
                .touristId(raw.touristId())
                .touristName(raw.touristName() != null ? raw.touristName() : "Khách đặt phòng")
                .touristAvatar(raw.touristAvatar())
                .homestayId(raw.homestayId())
                .homestayName(raw.homestayName() != null ? raw.homestayName() : "Homestay YÊN")
                .homestayImage(img)
                .location(loc)
                .roomId(raw.roomId())
                .roomName(raw.roomName() != null ? raw.roomName() : "Phòng tiêu chuẩn")
                .roomType(raw.roomType() != null ? raw.roomType() : "Phòng tiêu chuẩn")
                .roomImage(raw.roomImage() != null ? raw.roomImage() : img)
                .checkIn(cin)
                .checkOut(cout)
                .checkInDate(raw.checkInDate())
                .checkOutDate(raw.checkOutDate())
                .nights(1)
                .guests((raw.guestsCount() > 0 ? raw.guestsCount() : 2) + " người lớn")
                .guestsCount(raw.guestsCount() > 0 ? raw.guestsCount() : 2)
                .totalPrice(formattedPrice)
                .totalPriceRaw(tp)
                .depositAmount(raw.depositAmount())
                .remainingAmount(raw.remainingAmount())
                .paymentType(raw.paymentType())
                .depositStatus(raw.depositStatus())
                .payStatus("Đã ghi nhận")
                .status("completed")
                .statusRaw(raw.status())
                .createdAt(raw.createdAt())
                .build();
    }
}
