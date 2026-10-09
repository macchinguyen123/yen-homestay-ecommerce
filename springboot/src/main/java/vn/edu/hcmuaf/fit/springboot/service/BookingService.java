package vn.edu.hcmuaf.fit.springboot.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final Locale VI_LOCALE = new Locale("vi", "VN");

    /**
     * Lấy toàn bộ danh sách đặt phòng thực tế của người dùng từ CSDL Neon PostgreSQL
     */
    public List<UserBookingDTO> getUserBookings(Long touristId) {
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
            WHERE b.tourist_id = ?
            ORDER BY b.created_at DESC
        """;

        try {
            return jdbcTemplate.query(sql, this::mapRowToUserBookingDTO, touristId);
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
            List<UserBookingDTO> list = jdbcTemplate.query(sql, this::mapRowToUserBookingDTO, bookingCode);
            return list.isEmpty() ? null : list.get(0);
        } catch (Exception e) {
            log.error("Lỗi khi truy vấn đơn đặt phòng theo mã {}: {}", bookingCode, e.getMessage());
            return null;
        }
    }

    /**
     * Tạo mới đơn đặt phòng vào Neon PostgreSQL
     */
    @Transactional
    public Booking createBooking(CreateBookingRequest req) {
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
                .touristId(req.getTouristId() != null ? req.getTouristId() : 21L) // Mặc định du khách
                .homestayId(req.getHomestayId() != null ? req.getHomestayId() : 1L)
                .roomId(req.getRoomId())
                .voucherId(req.getVoucherId())
                .checkInDate(req.getCheckInDate() != null ? req.getCheckInDate() : LocalDate.now().plusDays(2))
                .checkOutDate(req.getCheckOutDate() != null ? req.getCheckOutDate() : LocalDate.now().plusDays(5))
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

        return savedBooking;
    }

    /**
     * Hủy đơn đặt phòng
     */
    @Transactional
    public boolean cancelBooking(Long bookingId, Long touristId) {
        Optional<Booking> opt = bookingRepository.findById(bookingId);
        if (opt.isPresent()) {
            Booking b = opt.get();
            if (touristId == null || b.getTouristId().equals(touristId)) {
                b.setStatus("CANCELLED");
                bookingRepository.save(b);
                return true;
            }
        }
        return false;
    }

    /**
     * Gửi khiếu nại thực tế liên kết với booking
     */
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

        Report report;
        Optional<Report> existingOpt = req.getBookingId() != null ? reportRepository.findFirstByBookingId(req.getBookingId()) : Optional.empty();
        if (existingOpt.isPresent()) {
            report = existingOpt.get();
            report.setReportType(req.getReportType() != null ? req.getReportType() : "Chất lượng phòng ở");
            report.setTitle(req.getTitle() != null ? req.getTitle() : "Khiếu nại về đơn đặt phòng #" + req.getBookingId());
            report.setContent(req.getContent());
            if (req.getProofImages() != null && !req.getProofImages().isBlank()) {
                report.setProofImages(req.getProofImages());
            }
            report.setStatus("PENDING");
        } else {
            report = Report.builder()
                    .bookingId(req.getBookingId() != null ? req.getBookingId() : 1L)
                    .reporterId(reporterId)
                    .reportedHomestayId(homestayId)
                    .reportType(req.getReportType() != null ? req.getReportType() : "Chất lượng phòng ở")
                    .title(req.getTitle() != null ? req.getTitle() : "Khiếu nại về đơn đặt phòng #" + req.getBookingId())
                    .content(req.getContent() != null ? req.getContent() : "Không có nội dung")
                    .proofImages(req.getProofImages())
                    .status("PENDING")
                    .createdAt(LocalDateTime.now())
                    .build();
        }

        Report savedReport = reportRepository.save(report);
        return savedReport;
    }

    /**
     * Đăng đánh giá thực tế & hoàn thành nhiệm vụ homestay
     */
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

        return reviewRepository.save(review);
    }

    private UserBookingDTO mapRowToUserBookingDTO(ResultSet rs, int rowNum) throws SQLException {
        Long bookingId = rs.getLong("booking_id");
        Long homestayId = rs.getLong("homestay_id");
        Long touristId = rs.getLong("tourist_id");

        java.sql.Date cinDateSql = rs.getDate("check_in_date");
        java.sql.Date coutDateSql = rs.getDate("check_out_date");
        LocalDate checkInDate = cinDateSql != null ? cinDateSql.toLocalDate() : null;
        LocalDate checkOutDate = coutDateSql != null ? coutDateSql.toLocalDate() : null;

        String checkInStr = checkInDate != null ? checkInDate.format(DATE_FMT) : "N/A";
        String checkOutStr = checkOutDate != null ? checkOutDate.format(DATE_FMT) : "N/A";

        int nights = 1;
        if (checkInDate != null && checkOutDate != null) {
            nights = (int) Math.max(1, ChronoUnit.DAYS.between(checkInDate, checkOutDate));
        }

        BigDecimal totalPrice = rs.getBigDecimal("total_price");
        if (totalPrice == null) totalPrice = BigDecimal.ZERO;
        String formattedPrice = NumberFormat.getInstance(VI_LOCALE).format(totalPrice) + "đ";

        BigDecimal depositAmount = rs.getBigDecimal("deposit_amount");
        String depositStatus = rs.getString("deposit_status");
        String paymentType = rs.getString("payment_type");
        String rawStatus = rs.getString("status");
        if (rawStatus == null) rawStatus = "PENDING";

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
        Optional<Report> reportOpt = reportRepository.findFirstByBookingId(bookingId);
        if (reportOpt.isPresent()) {
            Report r = reportOpt.get();
            String stText = "Đang xử lý";
            if ("RESOLVED".equalsIgnoreCase(r.getStatus())) stText = "Đã giải quyết";
            else if ("REJECTED".equalsIgnoreCase(r.getStatus())) stText = "Đã từ chối";

            complaintDTO = UserBookingDTO.ComplaintDTO.builder()
                    .id(r.getId())
                    .ticketCode("KN-" + bookingId + "-" + r.getId())
                    .typeText(r.getReportType() != null ? r.getReportType() : "Chất lượng phòng ở")
                    .severity("medium")
                    .content(r.getContent())
                    .statusText(stText)
                    .adminSolution(r.getAdminSolution())
                    .build();
        }

        // Lấy đánh giá thực tế của booking nếu có
        Optional<Review> reviewOpt = reviewRepository.findFirstByBookingId(bookingId);

        // Lấy danh sách nhiệm vụ của Homestay
        List<GuestTask> tasks = guestTaskRepository.findByHomestayId(homestayId);
        GuestTask taskEntity = tasks.isEmpty() ? null : tasks.get(0);

        UserBookingDTO.TaskDTO taskDTO = null;
        if (taskEntity != null || reviewOpt.isPresent()) {
            boolean hasReviewed = reviewOpt.isPresent();
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
                Review rev = reviewOpt.get();
                String commentText = rev.getComment() != null ? rev.getComment() : "";
                String revTitle = "Đánh giá tuyệt vời!";
                if (commentText.contains("\n")) {
                    String[] parts = commentText.split("\n", 2);
                    revTitle = parts[0];
                    commentText = parts[1];
                }

                String revDate = rev.getCreatedAt() != null ? rev.getCreatedAt().format(DATE_FMT) : "Gần đây";

                userReviewDTO = UserBookingDTO.UserReviewDTO.builder()
                        .id(rev.getId())
                        .rating(rev.getRating() != null ? rev.getRating() : 5)
                        .title(revTitle)
                        .content(commentText)
                        .ownerReply(rev.getOwnerReply())
                        .createdAt(revDate)
                        .build();
            }

            taskDTO = UserBookingDTO.TaskDTO.builder()
                    .id(taskEntity != null ? taskEntity.getId() : (reviewOpt.map(Review::getTaskId).orElse(1L)))
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

        String homestayImg = rs.getString("homestay_image");
        if (homestayImg == null || homestayImg.trim().isEmpty()) {
            homestayImg = "https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=600&q=80";
        }

        String roomImg = rs.getString("room_image");
        if (roomImg == null || roomImg.trim().isEmpty()) {
            roomImg = homestayImg;
        }

        String roomName = rs.getString("room_name");
        if (roomName == null || roomName.trim().isEmpty()) {
            roomName = "Phòng tiêu chuẩn";
        }

        String address = rs.getString("homestay_address");
        String city = rs.getString("homestay_city");
        String locationStr = (address != null && !address.isBlank() ? address + ", " : "") + (city != null ? city : "Việt Nam");

        int guestsCount = rs.getInt("guests_count");
        if (guestsCount <= 0) guestsCount = 2;

        Timestamp createdTs = rs.getTimestamp("created_at");
        LocalDateTime createdAt = createdTs != null ? createdTs.toLocalDateTime() : null;

        return UserBookingDTO.builder()
                .id(bookingId)
                .bookingCode(rs.getString("booking_code"))
                .touristId(touristId)
                .touristName(rs.getString("tourist_name"))
                .touristAvatar(rs.getString("tourist_avatar"))
                .homestayId(homestayId)
                .homestayName(rs.getString("homestay_name"))
                .homestayImage(homestayImg)
                .location(locationStr)
                .roomId(rs.getObject("room_id") != null ? rs.getLong("room_id") : null)
                .roomName(roomName)
                .roomType(rs.getString("room_type") != null ? rs.getString("room_type") : roomName)
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
                .remainingAmount(rs.getBigDecimal("remaining_amount"))
                .paymentType(paymentType)
                .depositStatus(depositStatus)
                .payStatus(payStatus)
                .status(normalizedStatus)
                .statusRaw(rawStatus)
                .createdAt(createdAt)
                .task(taskDTO)
                .complaint(complaintDTO)
                .build();
    }
}
