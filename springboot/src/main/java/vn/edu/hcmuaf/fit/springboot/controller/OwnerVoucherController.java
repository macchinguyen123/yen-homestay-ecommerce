package vn.edu.hcmuaf.fit.springboot.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.edu.hcmuaf.fit.springboot.dto.OwnerVoucherDTO;
import vn.edu.hcmuaf.fit.springboot.dto.OwnerVoucherStatsDTO;
import vn.edu.hcmuaf.fit.springboot.service.OwnerVoucherService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/owner/vouchers", "/api/public/owner/vouchers"})
@CrossOrigin(origins = "*")
@Slf4j
public class OwnerVoucherController {

    private final OwnerVoucherService ownerVoucherService;

    public OwnerVoucherController(OwnerVoucherService ownerVoucherService) {
        this.ownerVoucherService = ownerVoucherService;
    }

    /**
     * Lấy danh sách voucher theo cơ sở homestay hoặc toàn hệ thống
     */
    @GetMapping
    public ResponseEntity<List<OwnerVoucherDTO>> getVouchers(
            @RequestParam(value = "homestayId", required = false) Long homestayId,
            @RequestParam(value = "ownerId", required = false) Long ownerId) {
        return ResponseEntity.ok(ownerVoucherService.getVouchers(homestayId, ownerId));
    }

    /**
     * Lấy thống kê KPI voucher (lượt dùng, doanh thu ảnh hưởng, chi phí giảm giá, ROI)
     */
    @GetMapping("/stats")
    public ResponseEntity<OwnerVoucherStatsDTO> getStats(
            @RequestParam(value = "homestayId", required = false) Long homestayId,
            @RequestParam(value = "ownerId", required = false) Long ownerId) {
        return ResponseEntity.ok(ownerVoucherService.getStats(homestayId, ownerId));
    }

    /**
     * Lấy lịch sử các đợt phát hành voucher
     */
    @GetMapping("/history")
    public ResponseEntity<List<Map<String, Object>>> getHistory(
            @RequestParam(value = "homestayId", required = false) Long homestayId,
            @RequestParam(value = "ownerId", required = false) Long ownerId) {
        return ResponseEntity.ok(ownerVoucherService.getHistory(homestayId, ownerId));
    }

    /**
     * Tạo mã giảm giá mới
     */
    @PostMapping
    public ResponseEntity<?> createVoucher(
            @RequestBody OwnerVoucherDTO dto,
            @RequestParam(value = "ownerId", required = false) Long ownerId) {
        try {
            if (dto.getOwnerId() == null && ownerId != null) {
                dto.setOwnerId(ownerId);
            }
            OwnerVoucherDTO created = ownerVoucherService.createVoucher(dto);
            return ResponseEntity.ok(created);
        } catch (IllegalArgumentException e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        } catch (Exception e) {
            log.error("Lỗi khi tạo voucher: {}", e.getMessage(), e);
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", "Lỗi tạo voucher: " + e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    /**
     * Cập nhật mã giảm giá
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateVoucher(@PathVariable Long id, @RequestBody OwnerVoucherDTO dto) {
        try {
            OwnerVoucherDTO updated = ownerVoucherService.updateVoucher(id, dto);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        } catch (Exception e) {
            log.error("Lỗi khi cập nhật voucher: {}", e.getMessage(), e);
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", "Lỗi cập nhật voucher: " + e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    /**
     * Bật / tắt trạng thái mã giảm giá (kích hoạt / tạm ngưng)
     */
    @RequestMapping(value = "/{id}/toggle", method = {RequestMethod.PATCH, RequestMethod.PUT, RequestMethod.POST})
    public ResponseEntity<?> toggleStatus(@PathVariable Long id) {
        try {
            OwnerVoucherDTO updated = ownerVoucherService.toggleStatus(id);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /**
     * Xoá mã giảm giá
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteVoucher(@PathVariable Long id) {
        boolean ok = ownerVoucherService.deleteVoucher(id);
        return ok ? ResponseEntity.ok(Map.of("success", true, "message", "Đã xoá mã giảm giá thành công"))
                  : ResponseEntity.badRequest().body(Map.of("success", false, "message", "Không tìm thấy mã giảm giá để xoá"));
    }
}
