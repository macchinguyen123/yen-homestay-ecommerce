package vn.edu.hcmuaf.fit.springboot.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.edu.hcmuaf.fit.springboot.dto.OwnerBookingDTO;
import vn.edu.hcmuaf.fit.springboot.dto.OwnerBookingRequests.*;
import vn.edu.hcmuaf.fit.springboot.dto.OwnerBookingStatsDTO;
import vn.edu.hcmuaf.fit.springboot.service.OwnerBookingService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/owner/bookings", "/api/public/owner/bookings"})
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class OwnerBookingController {

    private final OwnerBookingService ownerBookingService;

    /**
     * Lấy danh sách đơn đặt phòng từ CSDL Neon PostgreSQL
     */
    @GetMapping
    public ResponseEntity<List<OwnerBookingDTO>> getBookings(
            @RequestParam(value = "homestayId", required = false) Long homestayId,
            @RequestParam(value = "status", required = false, defaultValue = "all") String status,
            @RequestParam(value = "search", required = false) String search) {
        log.info("Lấy danh sách đặt phòng owner: homestayId={}, status={}, search={}", homestayId, status, search);
        return ResponseEntity.ok(ownerBookingService.getBookings(homestayId, status, search));
    }

    /**
     * Lấy thống kê KPI và phòng hôm nay
     */
    @GetMapping("/stats")
    public ResponseEntity<OwnerBookingStatsDTO> getStats(
            @RequestParam(value = "homestayId", required = false) Long homestayId) {
        return ResponseEntity.ok(ownerBookingService.getStats(homestayId));
    }

    /**
     * Tra cứu 1 đơn đặt phòng theo id hoặc mã booking
     */
    @GetMapping("/{idOrCode}")
    public ResponseEntity<?> getBookingDetail(@PathVariable String idOrCode) {
        OwnerBookingDTO dto = ownerBookingService.getBookingByIdOrCode(idOrCode);
        if (dto == null) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", "Không tìm thấy đơn đặt phòng: " + idOrCode);
            return ResponseEntity.status(404).body(err);
        }
        return ResponseEntity.ok(dto);
    }

    /**
     * Tạo đơn đặt phòng trực tiếp lưu vào CSDL
     */
    @PostMapping
    public ResponseEntity<?> createDirectBooking(@RequestBody CreateDirectBookingRequest request) {
        try {
            OwnerBookingDTO created = ownerBookingService.createDirectBooking(request);
            Map<String, Object> resp = new HashMap<>();
            resp.put("success", true);
            resp.put("message", "Tạo đơn đặt phòng trực tiếp thành công!");
            resp.put("booking", created);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            log.error("Lỗi tạo đơn đặt phòng trực tiếp: {}", e.getMessage(), e);
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", "Lỗi tạo đơn: " + e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    /**
     * Xác nhận Check-in nhận phòng
     */
    @PutMapping("/{id}/checkin")
    public ResponseEntity<?> checkinBooking(
            @PathVariable Long id,
            @RequestBody(required = false) CheckinBookingRequest request) {
        try {
            OwnerBookingDTO updated = ownerBookingService.checkinBooking(id, request);
            Map<String, Object> resp = new HashMap<>();
            resp.put("success", true);
            resp.put("message", "Check-in thành công cho khách " + updated.getGuestName() + "!");
            resp.put("booking", updated);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            log.error("Lỗi Check-in: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /**
     * Xác nhận Check-out & quyết toán
     */
    @PutMapping("/{id}/checkout")
    public ResponseEntity<?> checkoutBooking(
            @PathVariable Long id,
            @RequestBody(required = false) CheckoutBookingRequest request) {
        try {
            OwnerBookingDTO updated = ownerBookingService.checkoutBooking(id, request);
            Map<String, Object> resp = new HashMap<>();
            resp.put("success", true);
            resp.put("message", "Check-out và quyết toán thành công đơn #" + updated.getBookingCode() + "!");
            resp.put("booking", updated);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            log.error("Lỗi Check-out: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /**
     * Duyệt đơn đặt phòng & xác nhận đối soát cọc
     */
    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approveBooking(
            @PathVariable Long id,
            @RequestBody(required = false) ApproveBookingRequest request) {
        try {
            OwnerBookingDTO updated = ownerBookingService.approveBooking(id, request);
            Map<String, Object> resp = new HashMap<>();
            resp.put("success", true);
            resp.put("message", "Đã duyệt đơn #" + updated.getBookingCode() + " & xác nhận giữ phòng!");
            resp.put("booking", updated);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            log.error("Lỗi duyệt đơn: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /**
     * Từ chối / Hủy đơn đặt phòng
     */
    @PutMapping("/{id}/reject")
    public ResponseEntity<?> rejectBooking(
            @PathVariable Long id,
            @RequestBody(required = false) RejectBookingRequest request) {
        try {
            OwnerBookingDTO updated = ownerBookingService.rejectBooking(id, request);
            Map<String, Object> resp = new HashMap<>();
            resp.put("success", true);
            resp.put("message", "Đã từ chối đơn #" + updated.getBookingCode() + "!");
            resp.put("booking", updated);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            log.error("Lỗi từ chối đơn: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /**
     * Thêm dịch vụ / trải nghiệm bản địa vào đơn
     */
    @PostMapping("/{id}/services")
    public ResponseEntity<?> addServices(
            @PathVariable Long id,
            @RequestBody AddServicesBookingRequest request) {
        try {
            OwnerBookingDTO updated = ownerBookingService.addServices(id, request);
            Map<String, Object> resp = new HashMap<>();
            resp.put("success", true);
            resp.put("message", "Đã thêm dịch vụ vào đơn #" + updated.getBookingCode() + " thành công!");
            resp.put("booking", updated);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            log.error("Lỗi thêm dịch vụ: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}
