package vn.edu.hcmuaf.fit.springboot.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.hcmuaf.fit.springboot.dto.OwnerBookingDTO;
import vn.edu.hcmuaf.fit.springboot.model.Homestay;
import vn.edu.hcmuaf.fit.springboot.model.HomestayImage;
import vn.edu.hcmuaf.fit.springboot.repository.HomestayImageRepository;
import vn.edu.hcmuaf.fit.springboot.repository.HomestayRepository;
import vn.edu.hcmuaf.fit.springboot.repository.RoomRepository;
import vn.edu.hcmuaf.fit.springboot.service.OwnerBookingService;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;

@RestController
@RequestMapping("/api/owner")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class OwnerDashboardController {
    private final HomestayRepository homestayRepository;
    private final HomestayImageRepository homestayImageRepository;
    private final RoomRepository roomRepository;
    private final OwnerBookingService ownerBookingService;
    private final JdbcTemplate jdbcTemplate;

    @GetMapping("/homestays")
    public ResponseEntity<?> getOwnedHomestays(Authentication authentication) {
        Long ownerId = authenticatedUserId(authentication);
        if (ownerId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Vui lòng đăng nhập lại."));

        List<Map<String, Object>> result = new ArrayList<>();
        for (Homestay homestay : homestayRepository.findByOwnerId(ownerId)) {
            List<HomestayImage> images = homestayImageRepository.findByHomestayId(homestay.getId());
            String image = images.stream()
                    .sorted(Comparator.comparing((HomestayImage i) -> !Boolean.TRUE.equals(i.getIsPrimary())))
                    .map(HomestayImage::getImageUrl).filter(url -> url != null && !url.isBlank()).findFirst().orElse(null);
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", homestay.getId());
            item.put("name", homestay.getName());
            item.put("city", homestay.getCity());
            item.put("region", homestay.getCity());
            item.put("address", homestay.getAddress());
            item.put("img", image);
            result.add(item);
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboard(
            @RequestParam Long homestayId,
            @RequestParam(defaultValue = "7days") String period,
            Authentication authentication) {
        Long ownerId = authenticatedUserId(authentication);
        if (ownerId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Vui lòng đăng nhập lại."));
        Homestay homestay = homestayRepository.findById(homestayId).filter(h -> ownerId.equals(h.getOwnerId())).orElse(null);
        if (homestay == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Không tìm thấy cơ sở của bạn."));

        LocalDate today = LocalDate.now();
        List<OwnerBookingDTO> bookings = ownerBookingService.getBookings(homestayId, "all", null);
        long pending = bookings.stream().filter(b -> b.getStatus() != null && b.getStatus().toLowerCase(Locale.ROOT).contains("chờ xác nhận")).count();
        long checkIns = bookings.stream().filter(b -> today.equals(b.getCheckInDate()) && !isCancelled(b.getStatus())).count();
        long totalRooms = roomRepository.findByHomestayId(homestayId).size();
        Long occupiedRooms = jdbcTemplate.queryForObject("""
                SELECT COUNT(DISTINCT room_id) FROM bookings
                WHERE homestay_id = ? AND room_id IS NOT NULL
                  AND check_in_date <= CURRENT_DATE AND check_out_date > CURRENT_DATE
                  AND LOWER(COALESCE(status, '')) NOT LIKE '%hủy%'
                  AND LOWER(COALESCE(status, '')) NOT LIKE '%cancel%'
                """, Long.class, homestayId);
        long bookedRooms = occupiedRooms == null ? 0 : occupiedRooms;
        int occupancy = totalRooms == 0 ? 0 : (int) Math.round(bookedRooms * 100.0 / totalRooms);

        YearMonth month = YearMonth.now();
        BigDecimal monthRevenue = revenueBetween(homestayId, month.atDay(1), month.plusMonths(1).atDay(1));
        BigDecimal previousMonthRevenue = revenueBetween(homestayId, month.minusMonths(1).atDay(1), month.atDay(1));
        List<Map<String, Object>> revenue = revenueSeries(homestayId, period, today);

        List<Map<String, Object>> recent = bookings.stream().limit(5).map(this::bookingCard).toList();
        List<Map<String, Object>> upcoming = bookings.stream()
                .filter(b -> b.getCheckInDate() != null && !b.getCheckInDate().isBefore(today) && !isCancelled(b.getStatus()))
                .sorted(Comparator.comparing(OwnerBookingDTO::getCheckInDate)).limit(5).map(this::bookingCard).toList();

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalBookings", bookings.size());
        summary.put("pendingBookings", pending);
        summary.put("checkInsToday", checkIns);
        summary.put("monthRevenue", monthRevenue);
        summary.put("previousMonthRevenue", previousMonthRevenue);
        summary.put("bookedRooms", bookedRooms);
        summary.put("availableRooms", Math.max(0, totalRooms - bookedRooms));
        summary.put("totalRooms", totalRooms);
        summary.put("occupancyRate", occupancy);

        List<HomestayImage> propertyImages = homestayImageRepository.findByHomestayId(homestay.getId());
        String propertyImage = propertyImages.stream()
                .sorted(Comparator.comparing((HomestayImage i) -> !Boolean.TRUE.equals(i.getIsPrimary())))
                .map(HomestayImage::getImageUrl).filter(url -> url != null && !url.isBlank()).findFirst().orElse(null);
        Map<String, Object> homestayData = new LinkedHashMap<>();
        homestayData.put("id", homestay.getId());
        homestayData.put("name", homestay.getName());
        homestayData.put("city", homestay.getCity());
        homestayData.put("address", homestay.getAddress());
        homestayData.put("img", propertyImage);
        return ResponseEntity.ok(Map.of("homestay", homestayData,
                "summary", summary,
                "recentBookings", recent,
                "upcomingBookings", upcoming,
                "revenue", revenue));
    }

    private BigDecimal revenueBetween(Long homestayId, LocalDate from, LocalDate to) {
        return jdbcTemplate.queryForObject("""
                SELECT COALESCE(SUM(p.amount), 0)
                FROM payments p JOIN bookings b ON b.booking_id = p.booking_id
                WHERE b.homestay_id = ? AND UPPER(COALESCE(p.status, '')) IN ('PAID','COMPLETED','SUCCESS')
                  AND p.paid_at >= ? AND p.paid_at < ?
                """, BigDecimal.class, homestayId, from.atStartOfDay(), to.atStartOfDay());
    }

    private List<Map<String, Object>> revenueSeries(Long homestayId, String requestedPeriod, LocalDate today) {
        String period = Set.of("7days", "30days", "month").contains(requestedPeriod) ? requestedPeriod : "7days";
        LocalDate from = switch (period) {
            case "30days" -> today.minusDays(29);
            case "month" -> YearMonth.from(today).atDay(1);
            default -> today.minusDays(6);
        };
        List<Map<String, Object>> grouped = jdbcTemplate.queryForList("""
                SELECT CAST(p.paid_at AS DATE) AS revenue_date, COALESCE(SUM(p.amount), 0) AS amount
                FROM payments p JOIN bookings b ON b.booking_id = p.booking_id
                WHERE b.homestay_id = ? AND UPPER(COALESCE(p.status, '')) IN ('PAID','COMPLETED','SUCCESS')
                  AND p.paid_at >= ? AND p.paid_at < ?
                GROUP BY CAST(p.paid_at AS DATE) ORDER BY revenue_date
                """, homestayId, from.atStartOfDay(), today.plusDays(1).atStartOfDay());
        Map<LocalDate, BigDecimal> amounts = new HashMap<>();
        for (Map<String, Object> row : grouped) {
            Object date = row.get("revenue_date");
            LocalDate localDate = date instanceof java.sql.Date d ? d.toLocalDate() : LocalDate.parse(date.toString());
            amounts.put(localDate, row.get("amount") instanceof BigDecimal amount ? amount : BigDecimal.ZERO);
        }
        List<Map<String, Object>> points = new ArrayList<>();
        for (LocalDate day = from; !day.isAfter(today); day = day.plusDays(1)) {
            points.add(Map.of("date", day.toString(), "label", day.getDayOfMonth() + "/" + day.getMonthValue(), "amount", amounts.getOrDefault(day, BigDecimal.ZERO)));
        }
        return points;
    }

    private Map<String, Object> bookingCard(OwnerBookingDTO booking) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("id", booking.getId());
        item.put("customerName", booking.getGuestName());
        item.put("room", booking.getRoomName() != null ? booking.getRoomName() : Objects.toString(booking.getRoomCode(), ""));
        item.put("checkIn", booking.getCheckInDate());
        item.put("checkOut", booking.getCheckOutDate());
        item.put("status", booking.getStatus());
        item.put("statusClass", booking.getStatusBadge());
        item.put("price", booking.getTotalAmount());
        item.put("avatar", booking.getAvatarImg());
        return item;
    }

    private boolean isCancelled(String status) {
        if (status == null) return false;
        String value = status.toLowerCase(Locale.ROOT);
        return value.contains("hủy") || value.contains("cancel");
    }

    private Long authenticatedUserId(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) return null;
        try { return Long.valueOf(authentication.getName()); }
        catch (NumberFormatException ignored) { return null; }
    }
}
