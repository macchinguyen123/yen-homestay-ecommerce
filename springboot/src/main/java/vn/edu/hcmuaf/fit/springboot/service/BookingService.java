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
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingService {

    private final JdbcTemplate jdbcTemplate;
    private final BookingRepository bookingRepository;
    private final ReportRepository reportRepository;
    private final ReviewRepository reviewRepository;
    private final GuestTaskRepository guestTaskRepository;
    private final GuestTaskSubmissionRepository guestTaskSubmissionRepository;
    private final RoomRepository roomRepository;
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

            // BATCH FETCH 3: Guest Tasks thực tế từ CSDL Neon PostgreSQL (không lấy dữ liệu giả)
            Map<Long, List<GuestTask>> tasksByHomestay = new HashMap<>();
            try {
                if (!homestayIds.isEmpty()) {
                    List<GuestTask> allTasks = guestTaskRepository.findByHomestayIdIn(homestayIds);
                    if (allTasks != null) {
                        for (GuestTask t : allTasks) {
                            if (t != null && t.getHomestayId() != null && !"INACTIVE".equalsIgnoreCase(t.getStatus())) {
                                tasksByHomestay.computeIfAbsent(t.getHomestayId(), k -> new ArrayList<>()).add(t);
                            }
                        }
                    }
                }
            } catch (Exception ex) {
                log.warn("Bỏ qua lỗi tải guest tasks: {}", ex.getMessage());
            }

            // BATCH FETCH 4: Submissions / Reviews của du khách để đối soát trạng thái hoàn thành từng nhiệm vụ
            Map<String, Boolean> completedTasksMap = new HashMap<>();
            try {
                List<Review> userReviews = reviewRepository.findByTouristId(touristId);
                if (userReviews != null) {
                    for (Review r : userReviews) {
                        if (r.getHomestayId() != null && r.getTaskId() != null) {
                            completedTasksMap.put(r.getHomestayId() + "_" + r.getTaskId(), true);
                        }
                        if (r.getBookingId() != null && r.getTaskId() != null) {
                            completedTasksMap.put("b_" + r.getBookingId() + "_" + r.getTaskId(), true);
                        }
                    }
                }
                List<GuestTaskSubmission> userSubs = guestTaskSubmissionRepository.findByTouristId(touristId);
                if (userSubs != null) {
                    for (GuestTaskSubmission s : userSubs) {
                        if (s.getHomestayId() != null && s.getTaskId() != null) {
                            if ("approved".equalsIgnoreCase(s.getStatus()) || "pending".equalsIgnoreCase(s.getStatus())) {
                                completedTasksMap.put(s.getHomestayId() + "_" + s.getTaskId(), true);
                            }
                        }
                    }
                }
            } catch (Exception ex) {
                log.warn("Bỏ qua lỗi tải submissions: {}", ex.getMessage());
            }

            // Lắp ráp UserBookingDTO an toàn từng phần tử
            List<UserBookingDTO> result = new ArrayList<>();
            for (RawBooking raw : rawList) {
                try {
                    result.add(convertRawToDTO(raw, 
                            raw.bookingId() != null ? reportMap.get(raw.bookingId()) : null, 
                            raw.bookingId() != null ? reviewMap.get(raw.bookingId()) : null, 
                            raw.homestayId() != null ? tasksByHomestay.get(raw.homestayId()) : null,
                            completedTasksMap));
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
            List<GuestTask> tasks = guestTaskRepository.findByHomestayId(raw.homestayId()).stream()
                    .filter(t -> !"INACTIVE".equalsIgnoreCase(t.getStatus()))
                    .collect(Collectors.toList());
            Map<String, Boolean> completedTasksMap = new HashMap<>();
            if (review != null && review.getTaskId() != null) {
                completedTasksMap.put(raw.homestayId() + "_" + review.getTaskId(), true);
                completedTasksMap.put("b_" + raw.bookingId() + "_" + review.getTaskId(), true);
            }
            try {
                if (raw.touristId() != null) {
                    List<GuestTaskSubmission> userSubs = guestTaskSubmissionRepository.findByTouristIdAndHomestayId(raw.touristId(), raw.homestayId());
                    for (GuestTaskSubmission s : userSubs) {
                        if (s.getTaskId() != null) {
                            completedTasksMap.put(raw.homestayId() + "_" + s.getTaskId(), true);
                        }
                    }
                }
            } catch (Exception ignored) {}
            return convertRawToDTO(raw, report, review, tasks, completedTasksMap);
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
        if (!req.getCheckOutDate().isAfter(req.getCheckInDate())) {
            throw new IllegalArgumentException("Ngày trả phòng phải sau ngày nhận phòng ít nhất 1 đêm.");
        }

        // KIỂM TRA CHỐNG TRÙNG LỊCH ĐẶT PHÒNG (DOUBLE-BOOKING)
        if (req.getRoomId() != null) {
            List<Booking> conflicts = bookingRepository.findConflictsByRoom(
                    req.getRoomId(), req.getCheckInDate(), req.getCheckOutDate());
            if (!conflicts.isEmpty()) {
                Booking firstConflict = conflicts.get(0);
                String startStr = firstConflict.getCheckInDate() != null ? firstConflict.getCheckInDate().format(DATE_FMT) : "N/A";
                String endStr = firstConflict.getCheckOutDate() != null ? firstConflict.getCheckOutDate().format(DATE_FMT) : "N/A";
                throw new IllegalArgumentException("Phòng này đã có khách đặt trong khoảng thời gian từ " + startStr + " đến " + endStr + ". Vui lòng chọn khoảng thời gian khác hoặc chọn phòng khác.");
            }
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
        // status: 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED' - Mặc định đơn mới tạo/thanh toán luôn là PENDING chờ chủ nhà duyệt
        String bookingStatus = "CANCELLED".equalsIgnoreCase(req.getStatus()) ? "CANCELLED" :
                               ("COMPLETED".equalsIgnoreCase(req.getStatus()) ? "COMPLETED" :
                               ("CONFIRMED".equalsIgnoreCase(req.getStatus()) ? "CONFIRMED" : "PENDING"));

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

        // Khấu trừ điểm tích lũy ví nếu du khách áp dụng giảm giá
        if (req.getPointsUsed() != null && req.getPointsUsed().compareTo(BigDecimal.ZERO) > 0) {
            try {
                cashbackWalletService.deductCashbackForBooking(savedBooking.getTouristId(), req.getPointsUsed(), savedBooking.getBookingCode());
            } catch (Exception de) {
                log.warn("Lỗi khấu trừ điểm tích lũy cho đơn {}: {}", savedBooking.getBookingCode(), de.getMessage());
            }
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

        // Lưu bản ghi vào guest_task_submissions từ CSDL thật để liên kết trực tiếp với Quản lý nhiệm vụ của Chủ nhà
        try {
            Long taskIdToRecord = req.getTaskId() != null ? req.getTaskId() : savedReview.getTaskId();
            GuestTask task = taskIdToRecord != null ? guestTaskRepository.findById(taskIdToRecord).orElse(null) : null;
            Booking bk = req.getBookingId() != null ? bookingRepository.findById(req.getBookingId()).orElse(null) : null;
            String guestName = "Du khách";
            String guestAvatar = null;
            if (touristId != null) {
                User u = userRepository.findById(touristId).orElse(null);
                if (u != null) {
                    if (u.getFullName() != null && !u.getFullName().isBlank()) guestName = u.getFullName();
                    guestAvatar = u.getAvatar();
                }
            }
            String roomName = "Phòng nghỉ";
            if (bk != null && bk.getRoomId() != null) {
                roomName = roomRepository.findById(bk.getRoomId()).map(Room::getRoomName).orElse("Phòng nghỉ");
            }
            String subCode = "SUB-" + (task != null ? task.getId() : (taskIdToRecord != null ? taskIdToRecord : 1)) + "-" + (System.currentTimeMillis() % 100000);
            GuestTaskSubmission sub = GuestTaskSubmission.builder()
                    .submissionCode(subCode)
                    .homestayId(homestayId)
                    .touristId(touristId)
                    .guestName(guestName)
                    .guestAvatar(guestAvatar)
                    .roomName(roomName)
                    .taskId(task != null ? task.getId() : taskIdToRecord)
                    .taskTitle(task != null ? task.getTitle() : (req.getTitle() != null ? req.getTitle() : "Nhiệm vụ homestay"))
                    .taskType(task != null && task.getRewardType() != null ? task.getRewardType() : "review")
                    .reviewText(savedReview.getComment())
                    .rewardText(task != null && task.getRewardNote() != null ? task.getRewardNote() : "Voucher homestay")
                    .photosCount(req.getImages() != null && !req.getImages().isBlank() ? req.getImages().split(",").length : 1)
                    .submissionImage(req.getImages())
                    .status(task != null && Boolean.TRUE.equals(task.getAutoApprove()) ? "approved" : "pending")
                    .submittedAt(LocalDateTime.now())
                    .build();
            guestTaskSubmissionRepository.save(sub);
        } catch (Exception subEx) {
            log.warn("Không thể lưu guest_task_submission: {}", subEx.getMessage());
        }

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

    public GuestTask ensureTaskForHomestay(Long homestayId) {
        if (homestayId == null) return null;
        try {
            List<GuestTask> existing = guestTaskRepository.findByHomestayId(homestayId);
            if (!existing.isEmpty()) {
                return existing.stream()
                        .filter(t -> "ACTIVE".equalsIgnoreCase(t.getStatus()))
                        .findFirst()
                        .orElse(existing.get(0));
            }

            String homestayName = homestayRepository.findById(homestayId).map(Homestay::getName).orElse("Homestay");
            GuestTask task = GuestTask.builder()
                    .homestayId(homestayId)
                    .title("Check-in & Khám phá trải nghiệm tại " + homestayName)
                    .description("1. Chụp ảnh check-in thực tế phòng và khuôn viên tại " + homestayName + "\n" +
                                 "2. Trải nghiệm dịch vụ tiện ích và lưu giữ khoảnh khắc đẹp\n" +
                                 "3. Đăng nhận xét & đánh giá chân thực trên hệ thống YÊN")
                    .rewardNote("Voucher giảm 10% cho lần đặt phòng tiếp theo")
                    .icon("bi-camera-fill")
                    .rewardType("voucher-percent")
                    .rewardValue("10")
                    .needPhoto(true)
                    .autoApprove(false)
                    .givenCount(0)
                    .status("ACTIVE")
                    .createdAt(LocalDateTime.now())
                    .build();
            return guestTaskRepository.save(task);
        } catch (Exception ex) {
            log.warn("Không thể tạo task mặc định cho homestay {}: {}", homestayId, ex.getMessage());
            return null;
        }
    }

    private UserBookingDTO.TaskDTO buildTaskDTO(RawBooking raw, Review review, List<GuestTask> homestayTasks, Map<String, Boolean> completedTasksMap) {
        if ((homestayTasks == null || homestayTasks.isEmpty()) && review == null) {
            return null;
        }

        boolean hasReviewed = review != null;
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

        List<UserBookingDTO.ChecklistItemDTO> checklist = new ArrayList<>();
        int doneCount = 0;

        if (homestayTasks != null && !homestayTasks.isEmpty()) {
            for (int i = 0; i < homestayTasks.size(); i++) {
                GuestTask t = homestayTasks.get(i);
                boolean isDone = false;
                if (review != null) {
                    if (review.getTaskId() == null || review.getTaskId().equals(t.getId())) {
                        isDone = true;
                    }
                }
                if (!isDone && completedTasksMap != null) {
                    if (raw.bookingId() != null && Boolean.TRUE.equals(completedTasksMap.get("b_" + raw.bookingId() + "_" + t.getId()))) {
                        isDone = true;
                    } else if (raw.homestayId() != null && Boolean.TRUE.equals(completedTasksMap.get(raw.homestayId() + "_" + t.getId()))) {
                        isDone = true;
                    }
                }
                if (isDone) doneCount++;

                String rw = t.getRewardNote();
                if (rw == null || rw.isBlank()) {
                    if ("voucher-percent".equalsIgnoreCase(t.getRewardType()) && t.getRewardValue() != null) {
                        rw = "Voucher giảm " + t.getRewardValue() + "%";
                    } else if ("voucher-amount".equalsIgnoreCase(t.getRewardType()) && t.getRewardValue() != null) {
                        rw = "Voucher " + t.getRewardValue() + "đ";
                    } else if (t.getRewardValue() != null && !t.getRewardValue().isBlank()) {
                        rw = t.getRewardValue();
                    } else {
                        rw = "Quà tặng tri ân";
                    }
                }

                String displayText = t.getTitle();
                if (rw != null && !rw.isBlank()) {
                    displayText += " (" + rw + ")";
                }

                checklist.add(UserBookingDTO.ChecklistItemDTO.builder()
                        .id(i + 1)
                        .taskId(t.getId())
                        .text(displayText)
                        .title(t.getTitle())
                        .description(t.getDescription())
                        .rewardText(rw)
                        .icon(t.getIcon() != null && !t.getIcon().isBlank() ? t.getIcon() : "bi-gift-fill")
                        .needPhoto(t.getNeedPhoto() != null ? t.getNeedPhoto() : Boolean.TRUE)
                        .done(isDone)
                        .build());
            }
        }

        if (checklist.isEmpty()) {
            return null;
        }

        boolean isAllDone = (doneCount == checklist.size()) || hasReviewed;

        String headerTitle;
        String headerDesc;
        String headerReward;
        String headerIcon = "bi-gift-fill";
        Long primaryTaskId = homestayTasks != null && !homestayTasks.isEmpty() ? homestayTasks.get(0).getId() : 1L;

        if (homestayTasks != null && homestayTasks.size() == 1) {
            GuestTask single = homestayTasks.get(0);
            headerTitle = single.getTitle();
            headerDesc = single.getDescription();
            headerReward = checklist.get(0).getRewardText();
            if (single.getIcon() != null && !single.getIcon().isBlank()) {
                headerIcon = single.getIcon();
            }
        } else {
            headerTitle = "Nhiệm vụ trải nghiệm nhận quà tại " + (raw.homestayName() != null ? raw.homestayName() : "Homestay");
            headerDesc = "Hoàn thành các nhiệm vụ trải nghiệm thực tế do chủ homestay thiết lập trong CSDL để nhận quà tặng & voucher ưu đãi!";
            headerReward = (homestayTasks != null ? homestayTasks.size() : 1) + " phần quà ưu đãi";
        }

        return UserBookingDTO.TaskDTO.builder()
                .id(primaryTaskId)
                .title(headerTitle)
                .description(headerDesc)
                .icon(headerIcon)
                .needPhoto(Boolean.TRUE)
                .rewardText(isAllDone ? "🎁 Đã nhận quà tặng từ Homestay" : headerReward)
                .status(isAllDone ? "completed" : "pending")
                .checklist(checklist)
                .userReview(userReviewDTO)
                .build();
    }

    private UserBookingDTO convertRawToDTO(RawBooking raw, Report report, Review review, GuestTask singleTask) {
        List<GuestTask> list = singleTask != null ? List.of(singleTask) : Collections.emptyList();
        return convertRawToDTO(raw, report, review, list, Collections.emptyMap());
    }

    private UserBookingDTO convertRawToDTO(RawBooking raw, Report report, Review review, List<GuestTask> homestayTasks, Map<String, Boolean> completedTasksMap) {
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

        // Xây dựng TaskDTO 100% từ dữ liệu thật trong bảng guest_tasks
        UserBookingDTO.TaskDTO taskDTO = buildTaskDTO(raw, review, homestayTasks, completedTasksMap);

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

    /**
     * Lấy danh sách các khoảng ngày đã kín lịch của một phòng
     */
    public List<Map<String, Object>> getRoomBusyDates(Long roomId) {
        if (roomId == null) return List.of();
        LocalDate today = LocalDate.now();
        List<Booking> list = bookingRepository.findBusyBookingsByRoom(roomId, today);
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        return list.stream().map(b -> {
            Map<String, Object> item = new HashMap<>();
            item.put("bookingId", b.getId());
            item.put("checkInDate", b.getCheckInDate() != null ? b.getCheckInDate().format(dtf) : null);
            item.put("checkOutDate", b.getCheckOutDate() != null ? b.getCheckOutDate().format(dtf) : null);
            item.put("displayRange", (b.getCheckInDate() != null ? b.getCheckInDate().format(DATE_FMT) : "") 
                    + " - " + (b.getCheckOutDate() != null ? b.getCheckOutDate().format(DATE_FMT) : ""));
            item.put("status", b.getStatus());
            return item;
        }).collect(Collectors.toList());
    }

    /**
     * Lấy danh sách các khoảng ngày đã kín lịch của cả homestay
     */
    public List<Map<String, Object>> getHomestayBusyDates(Long homestayId) {
        if (homestayId == null) return List.of();
        LocalDate today = LocalDate.now();
        List<Booking> list = bookingRepository.findBusyBookingsByHomestay(homestayId, today);
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        return list.stream().map(b -> {
            Map<String, Object> item = new HashMap<>();
            item.put("bookingId", b.getId());
            item.put("roomId", b.getRoomId());
            item.put("checkInDate", b.getCheckInDate() != null ? b.getCheckInDate().format(dtf) : null);
            item.put("checkOutDate", b.getCheckOutDate() != null ? b.getCheckOutDate().format(dtf) : null);
            item.put("displayRange", (b.getCheckInDate() != null ? b.getCheckInDate().format(DATE_FMT) : "") 
                    + " - " + (b.getCheckOutDate() != null ? b.getCheckOutDate().format(DATE_FMT) : ""));
            item.put("status", b.getStatus());
            return item;
        }).collect(Collectors.toList());
    }
}
