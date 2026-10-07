package vn.edu.hcmuaf.fit.springboot.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.edu.hcmuaf.fit.springboot.dto.*;
import vn.edu.hcmuaf.fit.springboot.model.Booking;
import vn.edu.hcmuaf.fit.springboot.model.Report;
import vn.edu.hcmuaf.fit.springboot.model.Review;
import vn.edu.hcmuaf.fit.springboot.service.BookingService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/public/bookings")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class BookingController {

    private final BookingService bookingService;

    /**
     * Lấy toàn bộ lịch sử đặt phòng thật của người dùng
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<UserBookingDTO>> getUserBookings(@PathVariable Long userId) {
        log.info("Lấy danh sách đặt phòng thật cho user id: {}", userId);
        List<UserBookingDTO> list = bookingService.getUserBookings(userId);
        return ResponseEntity.ok(list);
    }

    /**
     * Tra cứu thông tin đặt phòng theo mã bookingCode (VD: YEN-2026-8892)
     */
    @GetMapping("/code/{bookingCode}")
    public ResponseEntity<?> getBookingByCode(@PathVariable String bookingCode) {
        UserBookingDTO dto = bookingService.getBookingByCode(bookingCode);
        if (dto == null) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", "Không tìm thấy thông tin đơn đặt phòng mã: " + bookingCode);
            return ResponseEntity.status(404).body(err);
        }
        return ResponseEntity.ok(dto);
    }

    /**
     * Tạo mới đơn đặt phòng vào cơ sở dữ liệu thật Neon PostgreSQL
     */
    @PostMapping
    public ResponseEntity<?> createBooking(@RequestBody CreateBookingRequest request) {
        try {
            Booking created = bookingService.createBooking(request);
            Map<String, Object> resp = new HashMap<>();
            resp.put("success", true);
            resp.put("message", "Đặt phòng thành công!");
            resp.put("bookingId", created.getId());
            resp.put("bookingCode", created.getBookingCode());
            resp.put("booking", created);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            log.error("Lỗi tạo đặt phòng: {}", e.getMessage(), e);
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", "Lỗi tạo đơn đặt phòng: " + e.getMessage());
            return ResponseEntity.internalServerError().body(err);
        }
    }

    /**
     * Hủy đơn đặt phòng
     */
    @PutMapping("/{bookingId}/cancel")
    public ResponseEntity<?> cancelBooking(@PathVariable Long bookingId, @RequestParam(required = false) Long touristId) {
        boolean ok = bookingService.cancelBooking(bookingId, touristId);
        Map<String, Object> resp = new HashMap<>();
        resp.put("success", ok);
        resp.put("message", ok ? "Hủy đơn đặt phòng thành công" : "Không tìm thấy đơn hoặc không có quyền hủy");
        return ok ? ResponseEntity.ok(resp) : ResponseEntity.badRequest().body(resp);
    }

    /**
     * Gửi khiếu nại thực tế liên kết với đơn đặt phòng
     */
    @PostMapping("/complaint")
    public ResponseEntity<?> createComplaint(@RequestBody CreateComplaintRequest request) {
        try {
            Report report = bookingService.createComplaint(request);
            Map<String, Object> resp = new HashMap<>();
            resp.put("success", true);
            resp.put("message", "Gửi khiếu nại thành công! Chúng tôi sẽ phản hồi trong 24h.");
            resp.put("reportId", report.getId());
            resp.put("ticketCode", "KN-" + (request.getBookingId() != null ? request.getBookingId() : "0") + "-" + report.getId());
            resp.put("report", report);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            log.error("Lỗi gửi khiếu nại: {}", e.getMessage(), e);
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", "Lỗi gửi khiếu nại: " + e.getMessage());
            return ResponseEntity.internalServerError().body(err);
        }
    }

    /**
     * Gửi đánh giá thực tế & hoàn thành danh sách nhiệm vụ homestay
     */
    @PostMapping("/review")
    public ResponseEntity<?> submitReview(@RequestBody CreateReviewRequest request) {
        try {
            Review review = bookingService.submitReviewAndCompleteTask(request);
            Map<String, Object> resp = new HashMap<>();
            resp.put("success", true);
            resp.put("message", "Gửi đánh giá và hoàn thành nhiệm vụ thành công!");
            resp.put("reviewId", review.getId());
            resp.put("review", review);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            log.error("Lỗi gửi đánh giá: {}", e.getMessage(), e);
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", "Lỗi gửi đánh giá: " + e.getMessage());
            return ResponseEntity.internalServerError().body(err);
        }
    }
}
