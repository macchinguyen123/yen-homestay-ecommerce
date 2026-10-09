package vn.edu.hcmuaf.fit.springboot.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.edu.hcmuaf.fit.springboot.dto.OwnerServiceDTO;
import vn.edu.hcmuaf.fit.springboot.dto.OwnerServiceStatsDTO;
import vn.edu.hcmuaf.fit.springboot.dto.ServiceNoteDTO;
import vn.edu.hcmuaf.fit.springboot.service.OwnerServiceService;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/owner/services", "/api/public/owner/services"})
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class OwnerServiceController {

    private final OwnerServiceService ownerServiceService;

    /**
     * Lấy danh sách dịch vụ theo homestay (nhanh, tối ưu index)
     */
    @GetMapping
    public ResponseEntity<List<OwnerServiceDTO>> getServices(
            @RequestParam(value = "homestayId", required = false) Long homestayId) {
        return ResponseEntity.ok(ownerServiceService.getServicesByHomestay(homestayId));
    }

    /**
     * Thống kê dịch vụ & KPI động từ CSDL
     */
    @GetMapping("/stats")
    public ResponseEntity<OwnerServiceStatsDTO> getStats(
            @RequestParam(value = "homestayId", required = false) Long homestayId) {
        return ResponseEntity.ok(ownerServiceService.getStats(homestayId));
    }

    /**
     * Tạo dịch vụ mới lưu vào CSDL
     */
    @PostMapping
    public ResponseEntity<?> createService(@RequestBody OwnerServiceDTO dto) {
        try {
            OwnerServiceDTO created = ownerServiceService.createService(dto);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            log.error("Lỗi tạo dịch vụ: {}", e.getMessage(), e);
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", "Lỗi tạo dịch vụ: " + e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    /**
     * Cập nhật dịch vụ hiện có
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateService(@PathVariable Long id, @RequestBody OwnerServiceDTO dto) {
        try {
            OwnerServiceDTO updated = ownerServiceService.updateService(id, dto);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            log.error("Lỗi cập nhật dịch vụ: {}", e.getMessage(), e);
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", "Lỗi cập nhật dịch vụ: " + e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    /**
     * Bật / tắt trạng thái nhận khách
     */
    @RequestMapping(value = "/{id}/toggle-status", method = {RequestMethod.PATCH, RequestMethod.PUT, RequestMethod.POST})
    public ResponseEntity<?> toggleStatus(@PathVariable Long id) {
        try {
            OwnerServiceDTO updated = ownerServiceService.toggleStatus(id);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /**
     * Cập nhật nhanh giá tiền
     */
    @RequestMapping(value = "/{id}/price", method = {RequestMethod.PATCH, RequestMethod.PUT, RequestMethod.POST})
    public ResponseEntity<?> updatePrice(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            Object priceObj = body.get("price");
            BigDecimal price = new BigDecimal(String.valueOf(priceObj));
            OwnerServiceDTO updated = ownerServiceService.updatePrice(id, price);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /**
     * Xóa dịch vụ
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteService(@PathVariable Long id) {
        boolean ok = ownerServiceService.deleteService(id);
        return ok ? ResponseEntity.ok(Map.of("success", true, "message", "Đã xóa dịch vụ"))
                  : ResponseEntity.badRequest().body(Map.of("success", false, "message", "Không tìm thấy dịch vụ"));
    }

    /**
     * Quản lý ghi chú vận hành
     */
    @GetMapping("/notes")
    public ResponseEntity<List<ServiceNoteDTO>> getNotes(
            @RequestParam(value = "homestayId", required = false) Long homestayId) {
        return ResponseEntity.ok(ownerServiceService.getNotesByHomestay(homestayId));
    }

    @PostMapping("/notes")
    public ResponseEntity<?> createNote(@RequestBody ServiceNoteDTO dto) {
        try {
            ServiceNoteDTO created = ownerServiceService.createNote(dto);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PutMapping("/notes/{id}")
    public ResponseEntity<?> updateNote(@PathVariable Long id, @RequestBody ServiceNoteDTO dto) {
        try {
            ServiceNoteDTO updated = ownerServiceService.updateNote(id, dto);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @DeleteMapping("/notes/{id}")
    public ResponseEntity<?> deleteNote(@PathVariable Long id) {
        boolean ok = ownerServiceService.deleteNote(id);
        return ok ? ResponseEntity.ok(Map.of("success", true, "message", "Đã xóa ghi chú"))
                  : ResponseEntity.badRequest().body(Map.of("success", false, "message", "Không tìm thấy"));
    }
}
