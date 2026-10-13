package vn.edu.hcmuaf.fit.springboot.service;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.hcmuaf.fit.springboot.dto.AdminComplaintDTO.*;
import vn.edu.hcmuaf.fit.springboot.model.Booking;
import vn.edu.hcmuaf.fit.springboot.model.Homestay;
import vn.edu.hcmuaf.fit.springboot.model.Report;
import vn.edu.hcmuaf.fit.springboot.model.User;
import vn.edu.hcmuaf.fit.springboot.repository.BookingRepository;
import vn.edu.hcmuaf.fit.springboot.repository.HomestayRepository;
import vn.edu.hcmuaf.fit.springboot.repository.ReportRepository;
import vn.edu.hcmuaf.fit.springboot.repository.UserRepository;

import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class AdminComplaintService {

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final HomestayRepository homestayRepository;
    private final BookingRepository bookingRepository;

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DecimalFormat CURRENCY_FORMAT;

    static {
        DecimalFormatSymbols symbols = new DecimalFormatSymbols(Locale.GERMANY);
        CURRENCY_FORMAT = new DecimalFormat("#,###đ", symbols);
    }

    @PostConstruct
    public void initDataEnrichment() {
        try {
            // Relax check constraint to allow standard dispute statuses
            try {
                reportRepository.dropAndRecreateStatusConstraint();
            } catch (Exception e) {
                log.warn("[AdminComplaintService] Status constraint check: {}", e.getMessage());
            }

            long count = reportRepository.count();
            log.info("[AdminComplaintService] CSDL hiện có {} hồ sơ khiếu nại (reports).", count);
            if (count == 0) {
                seedInitialDisputes();
            } else {
                enrichExistingReportsIfMissing();
            }
        } catch (Exception e) {
            log.error("[AdminComplaintService] Error initializing data enrichment: {}", e.getMessage());
        }
    }

    private void enrichExistingReportsIfMissing() {
        List<Report> list = reportRepository.findAll();
        boolean changed = false;

        for (Report r : list) {
            boolean rChanged = false;
            if (r.getComplaintCode() == null || r.getComplaintCode().isBlank()) {
                r.setComplaintCode(String.format("#KN-%04d", 1000 + r.getId()));
                rChanged = true;
            }

            // Direction
            if (r.getDirection() == null || r.getDirection().isBlank()) {
                if ("DAMAGED_PROPERTY".equalsIgnoreCase(r.getReportType())) {
                    r.setDirection("homestay_to_tourist");
                } else {
                    r.setDirection("tourist_to_homestay");
                }
                rChanged = true;
            }

            // Severity
            if (r.getSeverity() == null || r.getSeverity().isBlank()) {
                if ("REFUND_DISPUTE".equalsIgnoreCase(r.getReportType()) || "DAMAGED_PROPERTY".equalsIgnoreCase(r.getReportType())) {
                    r.setSeverity("urgent");
                } else {
                    r.setSeverity("medium");
                }
                rChanged = true;
            }

            // Lookup Booking
            if (r.getBookingId() != null && (r.getBookingCode() == null || r.getStayDates() == null)) {
                Booking bk = bookingRepository.findById(r.getBookingId()).orElse(null);
                if (bk != null) {
                    if (r.getBookingCode() == null) r.setBookingCode(bk.getBookingCode() != null ? bk.getBookingCode() : "#BK-" + bk.getId());
                    if (r.getBookingTotal() == null && bk.getTotalPrice() != null) {
                        r.setBookingTotal(CURRENCY_FORMAT.format(bk.getTotalPrice()));
                    }
                    if (r.getStayDates() == null && bk.getCheckInDate() != null && bk.getCheckOutDate() != null) {
                        r.setStayDates(bk.getCheckInDate().format(DATE_FORMATTER) + " - " + bk.getCheckOutDate().format(DATE_FORMATTER));
                    }
                    if (r.getReporterId() == null && bk.getTouristId() != null) {
                        r.setReporterId(bk.getTouristId());
                    }
                    if (r.getReportedHomestayId() == null && bk.getHomestayId() != null) {
                        r.setReportedHomestayId(bk.getHomestayId());
                    }
                    rChanged = true;
                }
            }

            // Lookup Reporter User
            if (r.getReporterId() != null && (r.getReporterName() == null || r.getReporterName().isBlank())) {
                User u = userRepository.findById(r.getReporterId()).orElse(null);
                if (u != null) {
                    r.setReporterName(u.getFullName() != null ? u.getFullName() : u.getEmail());
                    r.setReporterPhone(u.getPhoneNumber() != null ? u.getPhoneNumber() : "090" + (1000000 + (r.getReporterId() * 1234) % 9000000));
                    rChanged = true;
                }
            }

            // Lookup Reported Homestay & Owner
            if (r.getReportedHomestayId() != null && (r.getReportedHomestayName() == null || r.getReportedName() == null)) {
                Homestay hs = homestayRepository.findById(r.getReportedHomestayId()).orElse(null);
                if (hs != null) {
                    r.setReportedHomestayName(hs.getName());
                    r.setReportedRegion(hs.getCity() != null ? hs.getCity() : "Toàn quốc");
                    if (hs.getOwnerId() != null) {
                        User owner = userRepository.findById(hs.getOwnerId()).orElse(null);
                        if (owner != null) {
                            r.setReportedName(owner.getFullName() != null ? owner.getFullName() + " (Chủ nhà)" : "Chủ homestay");
                            r.setReporterReportedPhone(owner.getPhoneNumber() != null ? owner.getPhoneNumber() : "098" + (1000000 + (hs.getOwnerId() * 4321) % 9000000));
                        }
                    }
                    rChanged = true;
                }
            }

            // Demands
            if (r.getDemands() == null || r.getDemands().isBlank()) {
                if ("REFUND_DISPUTE".equalsIgnoreCase(r.getReportType())) {
                    r.setDemands("Yêu cầu hoàn trả 100% tiền cọc và xác nhận hủy phòng.");
                } else if ("DAMAGED_PROPERTY".equalsIgnoreCase(r.getReportType())) {
                    r.setDemands("Yêu cầu khách bồi thường chi phí sửa chữa / thay thế tài sản.");
                } else {
                    r.setDemands("Yêu cầu khắc phục chất lượng dịch vụ hoặc hoàn một phần tiền.");
                }
                rChanged = true;
            }

            // Timeline
            if (r.getTimeline() == null || r.getTimeline().isBlank() || "[]".equals(r.getTimeline())) {
                List<TimelineStepDTO> tl = new ArrayList<>();
                String tStr = r.getCreatedAt() != null ? r.getCreatedAt().format(DateTimeFormatter.ofPattern("dd/MM HH:mm")) : "Thời điểm gửi";
                tl.add(TimelineStepDTO.builder().time(tStr).desc("Hồ sơ khiếu nại được tiếp nhận trên hệ thống sàn YÊN").build());
                if (r.getAdminSolution() != null && !r.getAdminSolution().isBlank()) {
                    String rStr = r.getResolvedAt() != null ? r.getResolvedAt().format(DateTimeFormatter.ofPattern("dd/MM HH:mm")) : "Thời điểm xử lý";
                    tl.add(TimelineStepDTO.builder().time(rStr).desc("Admin YÊN kết luận: " + r.getAdminSolution()).build());
                }
                r.setTimeline(serializeTimeline(tl));
                rChanged = true;
            }

            if (rChanged) {
                reportRepository.save(r);
                changed = true;
            }
        }

        if (changed) {
            log.info("[AdminComplaintService] Đã đồng bộ bổ sung thông tin cho các hồ sơ khiếu nại sẵn có trong CSDL.");
        }
    }

    private void seedInitialDisputes() {
        List<Report> seeds = new ArrayList<>();

        seeds.add(Report.builder()
                .complaintCode("#KN-1048")
                .direction("tourist_to_homestay")
                .bookingCode("#BK-8841")
                .reporterName("Nguyễn Thảo Ly")
                .reporterPhone("0988 765 432")
                .reporterRole("Du khách (Tourist)")
                .reportedHomestayName("Nhà Sàn Mộc Mai Châu")
                .reportedName("Hà Văn Dũng (Chủ nhà)")
                .reporterReportedPhone("0988 234 990")
                .reportedRegion("Mai Châu")
                .reportType("Tiện nghi & Dịch vụ phòng")
                .title("Phòng không có nước nóng và sàn nhà vệ sinh bị rò rỉ ẩm mốc")
                .content("Tôi nhận phòng lúc 17h, trời vùng cao lạnh 16 độ nhưng bình nước nóng không hoạt động. Tôi đã báo với chủ nhà lúc 18h nhưng đến 22h vẫn không có thợ sửa. Sàn nhà vệ sinh bị rò rỉ nước gây mùi khó chịu.")
                .reportedResponse("Do mạng lưới điện bản Lác bị sụt áp đột ngột lúc chiều tối nên bình nóng lạnh gặp sự cố. Chúng tôi đã khắc phục xong lúc 22h30 nhưng khách đã đóng cửa ngủ nên không vào kiểm tra được.")
                .demands("Yêu cầu hoàn trả 40% tiền phòng đêm đầu tiên (520.000đ).")
                .requestedAmount(new BigDecimal("520000"))
                .bookingTotal("1.300.000đ")
                .stayDates("26/09/2026 - 28/09/2026")
                .severity("medium")
                .status("investigating")
                .proofImages("https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80,https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=400&q=80")
                .timeline("[{\"time\":\"20/09 08:30\",\"desc\":\"Du khách Nguyễn Thảo Ly gửi đơn khiếu nại kèm 2 ảnh bằng chứng\"},{\"time\":\"20/09 09:15\",\"desc\":\"Admin YÊN tiếp nhận hồ sơ, chuyển trạng thái sang Đang xác minh\"},{\"time\":\"20/09 10:00\",\"desc\":\"Chủ nhà Hà Văn Dũng đã gửi biên bản giải trình sự cố điện\"}]")
                .createdAt(LocalDateTime.now().minusDays(3).withHour(8).withMinute(30))
                .build());

        seeds.add(Report.builder()
                .complaintCode("#KN-1047")
                .direction("homestay_to_tourist")
                .bookingCode("#BK-8840")
                .reporterName("Vàng A Sáng (Chủ nhà)")
                .reporterPhone("0973 456 123")
                .reporterRole("Chủ nhà Homestay")
                .reportedHomestayName("Sa Pa Terraces Valley")
                .reportedName("Đỗ Minh Quân")
                .reporterReportedPhone("0903 112 233")
                .reportedRegion("Sa Pa")
                .reportType("Hư hỏng tài sản & Gây mất trật tự")
                .title("Khách mở nhạc loa kéo quá giờ quy định và làm gãy bàn trà gỗ pơ-mu")
                .content("Đoàn khách của anh Quân gồm 6 người tổ chức ăn nhậu, mang loa kéo hát hò đến 1h15 sáng dù nội quy cấm sau 22h. Khi say rượu đã làm xô đổ và gãy chân bàn trà gỗ pơ-mu tự nhiên tại phòng sinh hoạt chung, sáng nay check-out vội và từ chối ký biên bản đền bù.")
                .reportedResponse("Khách phản hồi rằng bàn trà đã có dấu hiệu lung lay từ trước, chỉ vô tình tì tay vào chứ không cố ý phá hoại, mức đền bù chủ nhà đưa ra 1.500.000đ là quá đắt.")
                .demands("Yêu cầu trừ tiền cọc đền bù bàn gỗ 1.500.000đ và ghi nhận vi phạm quy tắc ứng xử.")
                .requestedAmount(new BigDecimal("1500000"))
                .bookingTotal("2.850.000đ")
                .stayDates("18/09/2026 - 20/09/2026")
                .severity("urgent")
                .status("investigating")
                .proofImages("https://images.unsplash.com/photo-1540518614846-7ede433c4b13?auto=format&fit=crop&w=400&q=80,https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80")
                .timeline("[{\"time\":\"20/09 07:45\",\"desc\":\"Chủ nhà Vàng A Sáng nộp biên bản và video ghi nhận lúc 1h sáng\"},{\"time\":\"20/09 08:30\",\"desc\":\"Admin YÊN liên hệ du khách Đỗ Minh Quân để đối chất\"}]")
                .createdAt(LocalDateTime.now().minusDays(3).withHour(7).withMinute(45))
                .build());

        seeds.add(Report.builder()
                .complaintCode("#KN-1046")
                .direction("tourist_to_homestay")
                .bookingCode("#BK-8839")
                .reporterName("Trần Ánh Tuyết")
                .reporterPhone("0977 445 566")
                .reporterRole("Du khách (Tourist)")
                .reportedHomestayName("Pù Luông Eco Lodge")
                .reportedName("Triệu Văn Sản (Chủ nhà)")
                .reporterReportedPhone("0984 123 789")
                .reportedRegion("Pù Luông")
                .reportType("Sai lệch hạng phòng & Quảng cáo")
                .title("Chủ nhà tự ý đổi sang phòng view đồi thay vì Bungalow view thung lũng")
                .content("Tôi đặt và thanh toán hạng phòng Bungalow nhìn ra ruộng bậc thang, nhưng khi đến nơi chủ nhà thông báo phòng đó bị dột nên chuyển tôi sang phòng nhìn ra đồi phía sau không có ban công ngắm lúa, mà không báo trước hay giảm giá.")
                .reportedResponse("Do trận mưa lớn đêm hôm trước làm thủng mái lá phòng Bungalow VIP nên chúng tôi buộc phải chuyển khách sang phòng phụ tiêu chuẩn tương đương để đảm bảo an toàn.")
                .demands("Đòi bồi hoàn chênh lệch giá phòng 400.000đ và giải trình chính thức.")
                .requestedAmount(new BigDecimal("400000"))
                .bookingTotal("1.700.000đ")
                .stayDates("19/09/2026 - 21/09/2026")
                .severity("urgent")
                .status("pending")
                .proofImages("https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=400&q=80")
                .timeline("[{\"time\":\"20/09 10:15\",\"desc\":\"Du khách Trần Ánh Tuyết tạo khiếu nại qua ứng dụng di động\"}]")
                .createdAt(LocalDateTime.now().minusDays(2).withHour(10).withMinute(15))
                .build());

        seeds.add(Report.builder()
                .complaintCode("#KN-1044")
                .direction("homestay_to_tourist")
                .bookingCode("#BK-8842")
                .reporterName("Đinh Thị Hương (Chủ nhà)")
                .reporterPhone("0912 889 001")
                .reporterRole("Chủ nhà Homestay")
                .reportedHomestayName("Mộc Châu Bamboo Bungalow")
                .reportedName("Lê Hoàng Long")
                .reporterReportedPhone("0912 345 678")
                .reportedRegion("Mộc Châu")
                .reportType("Vi phạm an toàn PCCC")
                .title("Khách hút thuốc trong phòng tre kín làm thủng ga trải giường thổ cẩm")
                .content("Homestay có bảng cấm hút thuốc bằng 2 thứ tiếng trong phòng tre vì nguy cơ cháy rất cao. Tuy nhiên khách vẫn hút thuốc và làm tàn thuốc rơi làm thủng ga đệm dệt thổ cẩm truyền thống bản địa.")
                .reportedResponse("Khách thừa nhận có hút thuốc do trời mưa không ra ngoài được và sơ ý làm rớt tàn, đồng ý bồi thường tiền giặt hoặc may lại ga.")
                .demands("Phạt vi phạm quy định PCCC 500.000đ và chi phí phục chế ga thổ cẩm 350.000đ.")
                .requestedAmount(new BigDecimal("850000"))
                .bookingTotal("1.500.000đ")
                .stayDates("18/09/2026 - 19/09/2026")
                .severity("medium")
                .status("pending")
                .proofImages("https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=80")
                .timeline("[{\"time\":\"19/09 16:20\",\"desc\":\"Chủ nhà nộp ảnh chụp tàn thuốc và ga giường bị cháy xém\"}]")
                .createdAt(LocalDateTime.now().minusDays(4).withHour(16).withMinute(20))
                .build());

        reportRepository.saveAll(seeds);
        log.info("[AdminComplaintService] Đã tạo {} hồ sơ mẫu vào CSDL.", seeds.size());
    }

    public List<Item> getComplaints(String direction, String status, String severity, String search) {
        List<Report> all = reportRepository.findAllOrderByCreatedAtDesc();

        String dirFilter = ("all".equalsIgnoreCase(direction) || direction == null || direction.isBlank()) ? null : direction.trim().toLowerCase();
        String statusFilter = ("all".equalsIgnoreCase(status) || status == null || status.isBlank()) ? null : status.trim().toLowerCase();
        String sevFilter = ("all".equalsIgnoreCase(severity) || severity == null || severity.isBlank()) ? null : severity.trim().toLowerCase();
        String query = (search == null || search.isBlank()) ? null : search.trim().toLowerCase();

        return all.stream()
                .filter(r -> {
                    // Match direction tab
                    if (dirFilter != null) {
                        String rDir = r.getDirection() != null ? r.getDirection().toLowerCase() : "tourist_to_homestay";
                        if (!rDir.equals(dirFilter)) return false;
                    }

                    // Match status
                    if (statusFilter != null) {
                        String rStatus = r.getStatus() != null ? r.getStatus().toLowerCase() : "pending";
                        if (!rStatus.equals(statusFilter)) return false;
                    }

                    // Match severity
                    if (sevFilter != null) {
                        String rSev = r.getSeverity() != null ? r.getSeverity().toLowerCase() : "medium";
                        if (!rSev.equals(sevFilter)) return false;
                    }

                    // Match search query
                    if (query != null && !query.isEmpty()) {
                        String code = r.getComplaintCode() != null ? r.getComplaintCode().toLowerCase() : "";
                        String bk = r.getBookingCode() != null ? r.getBookingCode().toLowerCase() : "";
                        String reporter = r.getReporterName() != null ? r.getReporterName().toLowerCase() : "";
                        String reported = r.getReportedName() != null ? r.getReportedName().toLowerCase() : "";
                        String homestay = r.getReportedHomestayName() != null ? r.getReportedHomestayName().toLowerCase() : "";
                        String title = r.getTitle() != null ? r.getTitle().toLowerCase() : "";
                        String content = r.getContent() != null ? r.getContent().toLowerCase() : "";

                        boolean matched = code.contains(query) || bk.contains(query) || reporter.contains(query)
                                || reported.contains(query) || homestay.contains(query)
                                || title.contains(query) || content.contains(query);
                        if (!matched) return false;
                    }

                    return true;
                })
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public Stats getStats() {
        List<Report> all = reportRepository.findAll();
        long total = all.size();
        long pending = all.stream().filter(r -> "pending".equalsIgnoreCase(r.getStatus()) || "investigating".equalsIgnoreCase(r.getStatus())).count();
        long touristToHs = all.stream().filter(r -> "tourist_to_homestay".equalsIgnoreCase(r.getDirection())).count();
        long hsToTourist = all.stream().filter(r -> "homestay_to_tourist".equalsIgnoreCase(r.getDirection())).count();

        return Stats.builder()
                .total(total)
                .pending(pending)
                .touristToHs(touristToHs)
                .hsToTourist(hsToTourist)
                .build();
    }

    public Item getComplaintById(Long id) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hồ sơ khiếu nại với ID: " + id));
        return mapToDTO(report);
    }

    @Transactional
    public Item resolveComplaint(Long id, ResolveRequest req) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hồ sơ khiếu nại với ID: " + id));

        String action = req.getAction() != null ? req.getAction() : "mediate_ok";
        BigDecimal amount = req.getAmount() != null ? req.getAmount() : BigDecimal.ZERO;
        String note = req.getAdminNote() != null ? req.getAdminNote().trim() : "";

        String newStatus = "reject".equalsIgnoreCase(action) ? "REJECTED" : "RESOLVED";
        report.setStatus(newStatus);
        report.setResolutionAction(action);
        report.setResolutionAmount(amount);
        report.setAdminSolution(note);
        report.setResolvedAt(LocalDateTime.now());

        String decisionText = "";
        if ("refund_guest".equalsIgnoreCase(action)) {
            decisionText = String.format("Hoàn trả %,dđ cho du khách từ ví tạm giữ của chủ nhà.", amount.longValue());
        } else if ("charge_guest".equalsIgnoreCase(action)) {
            decisionText = String.format("Khấu trừ %,dđ bồi thường cho chủ nhà homestay.", amount.longValue());
        } else if ("mediate_ok".equalsIgnoreCase(action)) {
            decisionText = "Hòa giải thành công giữa 2 bên, không phát sinh chi phí phạt.";
        } else if ("reject".equalsIgnoreCase(action)) {
            decisionText = "Bác bỏ khiếu nại do không đủ căn cứ chứng minh thiệt hại.";
        }

        // Append to timeline
        List<TimelineStepDTO> currentTimeline = parseTimeline(report.getTimeline());
        String currentTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM HH:mm"));
        currentTimeline.add(TimelineStepDTO.builder()
                .time(currentTime)
                .desc("Admin YÊN đã ban hành quyết định: " + decisionText + (!note.isEmpty() ? " (Ghi chú: " + note + ")" : ""))
                .build());

        report.setTimeline(serializeTimeline(currentTimeline));
        reportRepository.save(report);
        return mapToDTO(report);
    }

    public List<BookingOptionDTO> getAvailableBookings() {
        List<Booking> bookings = bookingRepository.findAll();
        bookings.sort((a, b) -> Long.compare(b.getId(), a.getId()));

        Map<Long, User> userMap = userRepository.findAll().stream()
                .filter(u -> u.getId() != null)
                .collect(Collectors.toMap(User::getId, u -> u, (existing, replacement) -> existing));

        Map<Long, Homestay> hsMap = homestayRepository.findAll().stream()
                .filter(h -> h.getId() != null)
                .collect(Collectors.toMap(Homestay::getId, h -> h, (existing, replacement) -> existing));

        List<BookingOptionDTO> result = new ArrayList<>();
        int count = 0;
        int limit = 50;

        for (Booking b : bookings) {
            if (count++ >= limit) break;

            String touristName = "Khách hàng #" + b.getTouristId();
            String touristPhone = "0912 345 678";
            if (b.getTouristId() != null && userMap.containsKey(b.getTouristId())) {
                User u = userMap.get(b.getTouristId());
                if (u.getFullName() != null && !u.getFullName().isBlank()) touristName = u.getFullName();
                if (u.getPhoneNumber() != null && !u.getPhoneNumber().isBlank()) touristPhone = u.getPhoneNumber();
            }

            String hsName = "Homestay #" + b.getHomestayId();
            String hostName = "Chủ nhà Homestay";
            String hostPhone = "0988 765 432";
            String region = "Việt Nam";

            if (b.getHomestayId() != null && hsMap.containsKey(b.getHomestayId())) {
                Homestay hs = hsMap.get(b.getHomestayId());
                if (hs.getName() != null && !hs.getName().isBlank()) hsName = hs.getName();
                if (hs.getCity() != null && !hs.getCity().isBlank()) region = hs.getCity();
                else if (hs.getAddress() != null && !hs.getAddress().isBlank()) region = hs.getAddress();

                if (hs.getOwnerId() != null && userMap.containsKey(hs.getOwnerId())) {
                    User owner = userMap.get(hs.getOwnerId());
                    if (owner.getFullName() != null && !owner.getFullName().isBlank()) hostName = owner.getFullName();
                    if (owner.getPhoneNumber() != null && !owner.getPhoneNumber().isBlank()) hostPhone = owner.getPhoneNumber();
                }
            }

            String dates = "Theo lịch lưu trú";
            if (b.getCheckInDate() != null && b.getCheckOutDate() != null) {
                dates = b.getCheckInDate().format(DATE_FORMATTER) + " - " + b.getCheckOutDate().format(DATE_FORMATTER);
            }

            String priceStr = b.getTotalPrice() != null ? CURRENCY_FORMAT.format(b.getTotalPrice()) : "0đ";
            String bCode = (b.getBookingCode() != null && !b.getBookingCode().isBlank())
                    ? (b.getBookingCode().startsWith("#") ? b.getBookingCode() : "#" + b.getBookingCode())
                    : "#BK-" + b.getId();

            result.add(BookingOptionDTO.builder()
                    .bookingId(b.getId())
                    .bookingCode(bCode)
                    .touristId(b.getTouristId())
                    .touristName(touristName)
                    .touristPhone(touristPhone)
                    .homestayId(b.getHomestayId())
                    .homestayName(hsName)
                    .hostName(hostName)
                    .hostPhone(hostPhone)
                    .region(region)
                    .stayDates(dates)
                    .totalPrice(priceStr)
                    .totalAmount(b.getTotalPrice() != null ? b.getTotalPrice() : BigDecimal.ZERO)
                    .build());
        }

        return result;
    }

    @Transactional
    public Item createComplaint(CreateRequest req) {
        long countReports = reportRepository.count();
        long nextNum = 1048 + countReports + 1;
        String code = String.format("#KN-%04d", nextNum);

        String direction = (req.getDirection() != null && !req.getDirection().isBlank()) ? req.getDirection() : "tourist_to_homestay";
        String bookingCode = (req.getBookingCode() != null && !req.getBookingCode().isBlank()) ? req.getBookingCode().trim() : null;
        String reporterName = (req.getReporterName() != null && !req.getReporterName().isBlank()) ? req.getReporterName().trim() : "Khách hàng";
        String reportedName = (req.getReportedName() != null && !req.getReportedName().isBlank()) ? req.getReportedName().trim() : "Homestay";
        String title = (req.getTitle() != null && !req.getTitle().isBlank()) ? req.getTitle().trim() : "Khiếu nại dịch vụ";
        String content = (req.getContent() != null) ? req.getContent().trim() : "";
        String demands = (req.getDemands() != null && !req.getDemands().isBlank()) ? req.getDemands().trim() : "Hòa giải theo quy chế sàn.";
        String severity = (req.getSeverity() != null && !req.getSeverity().isBlank()) ? req.getSeverity() : "medium";
        String reportType = (req.getReportType() != null && !req.getReportType().isBlank()) ? req.getReportType().trim() : "Ghi nhận Hotline & Admin";

        Booking foundBooking = null;
        if (req.getBookingId() != null) {
            foundBooking = bookingRepository.findById(req.getBookingId()).orElse(null);
        }

        if (foundBooking == null && bookingCode != null) {
            String cleanCode = bookingCode.replace("#", "").trim();
            foundBooking = bookingRepository.findAll().stream()
                    .filter(b -> b.getBookingCode() != null && (b.getBookingCode().equalsIgnoreCase(bookingCode) || b.getBookingCode().equalsIgnoreCase(cleanCode)))
                    .findFirst().orElse(null);

            if (foundBooking == null) {
                String cleanNum = bookingCode.replaceAll("[^0-9]", "");
                if (!cleanNum.isEmpty()) {
                    try {
                        Long num = Long.parseLong(cleanNum);
                        foundBooking = bookingRepository.findById(num).orElse(null);
                    } catch (Exception ignored) {}
                }
            }
        }

        if (foundBooking == null) {
            foundBooking = bookingRepository.findAll().stream().findFirst().orElse(null);
        }

        Long bookingId = foundBooking != null ? foundBooking.getId() : 1L;
        String finalBookingCode = bookingCode != null ? bookingCode : (foundBooking != null && foundBooking.getBookingCode() != null ? "#" + foundBooking.getBookingCode() : "#BK-8850");
        String bookingTotal = (req.getBookingTotal() != null && !req.getBookingTotal().isBlank()) 
                ? req.getBookingTotal() 
                : (foundBooking != null && foundBooking.getTotalPrice() != null ? CURRENCY_FORMAT.format(foundBooking.getTotalPrice()) : "1.500.000đ");

        String stayDates = (req.getStayDates() != null && !req.getStayDates().isBlank())
                ? req.getStayDates()
                : (foundBooking != null && foundBooking.getCheckInDate() != null && foundBooking.getCheckOutDate() != null
                    ? foundBooking.getCheckInDate().format(DATE_FORMATTER) + " - " + foundBooking.getCheckOutDate().format(DATE_FORMATTER)
                    : LocalDateTime.now().format(DATE_FORMATTER) + " - " + LocalDateTime.now().plusDays(2).format(DATE_FORMATTER));

        Long touristUserId = foundBooking != null ? foundBooking.getTouristId() : 1L;
        Long homestayId = foundBooking != null ? foundBooking.getHomestayId() : 1L;
        Long ownerUserId = 2L;
        String homestayName = req.getReportedHomestayName();
        String region = "Việt Nam";

        if (homestayId != null) {
            Homestay hs = homestayRepository.findById(homestayId).orElse(null);
            if (hs != null) {
                if (homestayName == null || homestayName.isBlank()) homestayName = hs.getName();
                if (hs.getCity() != null && !hs.getCity().isBlank()) region = hs.getCity();
                else if (hs.getAddress() != null && !hs.getAddress().isBlank()) region = hs.getAddress();
                if (hs.getOwnerId() != null) ownerUserId = hs.getOwnerId();
            }
        }
        if (homestayName == null || homestayName.isBlank()) {
            homestayName = "homestay_to_tourist".equalsIgnoreCase(direction) ? reporterName : reportedName;
        }

        Long reporterId;
        Long reportedId;
        String reporterPhone = (req.getReporterPhone() != null && !req.getReporterPhone().isBlank()) ? req.getReporterPhone() : "0912 888 999";
        String reportedPhone = (req.getReportedPhone() != null && !req.getReportedPhone().isBlank()) ? req.getReportedPhone() : "0988 111 222";
        String reporterRole;

        if ("homestay_to_tourist".equalsIgnoreCase(direction)) {
            reporterId = ownerUserId;
            reportedId = touristUserId;
            reporterRole = "Chủ nhà Homestay";
        } else {
            reporterId = touristUserId;
            reportedId = ownerUserId;
            reporterRole = "Du khách (Tourist)";
        }

        List<TimelineStepDTO> initialTimeline = new ArrayList<>();
        initialTimeline.add(TimelineStepDTO.builder()
                .time("Vừa xong")
                .desc("Admin YÊN đã lập hồ sơ tiếp nhận khiếu nại qua kênh Hotline/Admin trực tiếp.")
                .build());
        String timelineJson = serializeTimeline(initialTimeline);

        BigDecimal requestedAmt = req.getRequestedAmount() != null ? req.getRequestedAmount() : BigDecimal.ZERO;

        Report newReport = Report.builder()
                .complaintCode(code)
                .direction(direction)
                .bookingId(bookingId)
                .bookingCode(finalBookingCode)
                .reporterId(reporterId != null ? reporterId : 1L)
                .reportedId(reportedId)
                .reportedHomestayId(homestayId)
                .reporterName(reporterName)
                .reporterRole(reporterRole)
                .reporterPhone(reporterPhone)
                .reportedHomestayName(homestayName)
                .reportedName(reportedName)
                .reporterReportedPhone(reportedPhone)
                .reportedRegion(region)
                .reportType(reportType)
                .title(title)
                .content(content)
                .reportedResponse("Đang chờ gửi thông báo yêu cầu giải trình cho bên bị khiếu nại.")
                .demands(demands)
                .requestedAmount(requestedAmt)
                .bookingTotal(bookingTotal)
                .stayDates(stayDates)
                .severity(severity)
                .status("PENDING")
                .timeline(timelineJson)
                .proofImages("")
                .createdAt(LocalDateTime.now())
                .build();

        Report saved = reportRepository.save(newReport);
        log.info("[AdminComplaintService] Tạo thành công hồ sơ khiếu nại ID={}, Code={}, Direction={}", saved.getId(), saved.getComplaintCode(), saved.getDirection());
        return mapToDTO(saved);
    }

    private Item mapToDTO(Report report) {
        String code = report.getComplaintCode();
        if (code == null || code.isBlank()) {
            code = String.format("#KN-%04d", 1000 + report.getId());
        }

        String direction = report.getDirection() != null ? report.getDirection().toLowerCase() : "tourist_to_homestay";
        String dirText = "tourist_to_homestay".equals(direction) ? "Khách ➔ Homestay" : "Homestay ➔ Khách";

        String sev = report.getSeverity() != null ? report.getSeverity().toLowerCase() : "medium";
        String sevText = "urgent".equals(sev) ? "Khẩn cấp" : ("low".equals(sev) ? "Bình thường" : "Trung bình");

        String st = report.getStatus() != null ? report.getStatus().toLowerCase() : "pending";
        String stText;
        switch (st) {
            case "investigating": stText = "Đang xác minh"; break;
            case "resolved": stText = "Đã giải quyết"; break;
            case "rejected": stText = "Đã bác bỏ"; break;
            default: stText = "Chờ tiếp nhận"; st = "pending"; break;
        }

        String reporterAvatar = (report.getReporterName() != null && !report.getReporterName().isBlank())
                ? report.getReporterName().substring(0, 1).toUpperCase()
                : "U";

        ReporterDTO reporter = ReporterDTO.builder()
                .name(report.getReporterName() != null ? report.getReporterName() : "Người gửi")
                .role(report.getReporterRole() != null ? report.getReporterRole() : ("tourist_to_homestay".equals(direction) ? "Du khách (Tourist)" : "Chủ nhà Homestay"))
                .phone(report.getReporterPhone() != null ? report.getReporterPhone() : "Chưa cập nhật")
                .homestay("homestay_to_tourist".equals(direction) ? report.getReportedHomestayName() : null)
                .avatar(reporterAvatar)
                .build();

        ReportedDTO reported = ReportedDTO.builder()
                .name(report.getReportedName() != null ? report.getReportedName() : "Bị đơn")
                .role("homestay_to_tourist".equals(direction) ? "Du khách (Tourist)" : "Chủ nhà Homestay")
                .phone(report.getReporterReportedPhone() != null ? report.getReporterReportedPhone() : "Chưa cập nhật")
                .homestay("tourist_to_homestay".equals(direction) ? report.getReportedHomestayName() : null)
                .region(report.getReportedRegion() != null ? report.getReportedRegion() : "Toàn quốc")
                .build();

        List<String> evidence = new ArrayList<>();
        if (report.getProofImages() != null && !report.getProofImages().isBlank()) {
            evidence = Arrays.stream(report.getProofImages().split(","))
                    .map(String::trim)
                    .filter(s -> !s.isBlank())
                    .collect(Collectors.toList());
        }

        List<TimelineStepDTO> timeline = parseTimeline(report.getTimeline());

        String createdDateStr = report.getCreatedAt() != null
                ? report.getCreatedAt().format(DATE_TIME_FORMATTER)
                : LocalDateTime.now().format(DATE_TIME_FORMATTER);

        String resolvedDateStr = report.getResolvedAt() != null
                ? report.getResolvedAt().format(DATE_TIME_FORMATTER)
                : null;

        return Item.builder()
                .id(report.getId())
                .code(code)
                .direction(direction)
                .directionText(dirText)
                .bookingCode(report.getBookingCode() != null ? report.getBookingCode() : "#BK-" + (report.getBookingId() != null ? report.getBookingId() : "8841"))
                .bookingId(report.getBookingId())
                .bookingTotal(report.getBookingTotal() != null ? report.getBookingTotal() : "1.500.000đ")
                .dates(report.getStayDates() != null ? report.getStayDates() : "Theo đơn đặt phòng")
                .reporter(reporter)
                .reported(reported)
                .topic(report.getReportType() != null ? report.getReportType() : "Khiếu nại chung")
                .title(report.getTitle() != null ? report.getTitle() : "Phản ánh dịch vụ")
                .content(report.getContent() != null ? report.getContent() : "")
                .reportedResponse(report.getReportedResponse() != null ? report.getReportedResponse() : "Chưa có phản hồi từ bên bị khiếu nại.")
                .demands(report.getDemands() != null ? report.getDemands() : "Chưa có yêu cầu cụ thể")
                .requestedAmount(report.getRequestedAmount() != null ? report.getRequestedAmount() : BigDecimal.ZERO)
                .severity(sev)
                .severityText(sevText)
                .status(st)
                .statusText(stText)
                .createdAt(createdDateStr)
                .evidence(evidence)
                .timeline(timeline)
                .resolutionAction(report.getResolutionAction())
                .resolutionAmount(report.getResolutionAmount())
                .adminSolution(report.getAdminSolution())
                .resolvedAt(resolvedDateStr)
                .build();
    }

    private List<TimelineStepDTO> parseTimeline(String timelineStr) {
        if (timelineStr == null || timelineStr.isBlank()) {
            return new ArrayList<>();
        }
        List<TimelineStepDTO> list = new ArrayList<>();
        if (timelineStr.trim().startsWith("[")) {
            Pattern pattern = Pattern.compile("\"time\"\\s*:\\s*\"([^\"]*)\"\\s*,\\s*\"desc\"\\s*:\\s*\"([^\"]*)\"");
            Matcher matcher = pattern.matcher(timelineStr);
            while (matcher.find()) {
                list.add(TimelineStepDTO.builder()
                        .time(matcher.group(1))
                        .desc(matcher.group(2).replace("\\\"", "\""))
                        .build());
            }
            if (!list.isEmpty()) return list;
        }

        String[] lines = timelineStr.split("(\r?\n|;;;)");
        for (String line : lines) {
            if (line.trim().isEmpty()) continue;
            if (line.contains(":::")) {
                String[] parts = line.split(":::", 2);
                list.add(TimelineStepDTO.builder().time(parts[0].trim()).desc(parts[1].trim()).build());
            } else {
                list.add(TimelineStepDTO.builder().time("Ghi nhận").desc(line.trim()).build());
            }
        }
        return list;
    }

    private String serializeTimeline(List<TimelineStepDTO> list) {
        if (list == null || list.isEmpty()) return "[]";
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < list.size(); i++) {
            TimelineStepDTO s = list.get(i);
            if (i > 0) sb.append(",");
            sb.append("{\"time\":\"").append(escapeJson(s.getTime()))
                    .append("\",\"desc\":\"").append(escapeJson(s.getDesc()))
                    .append("\"}");
        }
        sb.append("]");
        return sb.toString();
    }

    private String escapeJson(String str) {
        if (str == null) return "";
        return str.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", " ");
    }
}
