package vn.edu.hcmuaf.fit.springboot.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.edu.hcmuaf.fit.springboot.dto.ViewedHistoryDTO;
import vn.edu.hcmuaf.fit.springboot.service.ViewedHistoryService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ViewedHistoryController {

    private final ViewedHistoryService viewedHistoryService;

    /**
     * Ghi nhận lượt xem homestay của user.
     * Tự động tạo mới hoặc cập nhật thời gian xem gần nhất nếu đã xem trước đó.
     */
    @PostMapping("/{userId}/viewed-history")
    public ResponseEntity<?> recordViewHistory(
            @PathVariable Long userId,
            @RequestBody(required = false) Map<String, Object> body,
            @RequestParam(required = false) Long homestayId) {
        try {
            Long targetHomestayId = homestayId;
            if (targetHomestayId == null && body != null && body.containsKey("homestayId")) {
                Object val = body.get("homestayId");
                if (val instanceof Number) {
                    targetHomestayId = ((Number) val).longValue();
                } else if (val != null) {
                    targetHomestayId = Long.parseLong(val.toString());
                }
            }

            if (targetHomestayId == null) {
                targetHomestayId = 1L; // Fallback default homestay
            }

            ViewedHistoryDTO result = viewedHistoryService.recordView(userId, targetHomestayId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Đã lưu lịch sử xem sản phẩm!");
            response.put("data", result);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Lấy danh sách lịch sử sản phẩm đã xem của user, sắp xếp thời gian xem mới nhất lên đầu.
     */
    @GetMapping("/{userId}/viewed-history")
    public ResponseEntity<?> getViewedHistory(@PathVariable Long userId) {
        try {
            List<ViewedHistoryDTO> history = viewedHistoryService.getViewedHistory(userId);
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Xóa 1 sản phẩm khỏi lịch sử xem của user.
     */
    @DeleteMapping("/{userId}/viewed-history/{homestayId}")
    public ResponseEntity<?> deleteViewedItem(@PathVariable Long userId, @PathVariable Long homestayId) {
        try {
            viewedHistoryService.deleteViewedItem(userId, homestayId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Đã xóa sản phẩm khỏi lịch sử xem!");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Xóa toàn bộ lịch sử xem của user.
     */
    @DeleteMapping("/{userId}/viewed-history")
    public ResponseEntity<?> clearViewedHistory(@PathVariable Long userId) {
        try {
            viewedHistoryService.clearViewedHistory(userId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Đã xóa toàn bộ lịch sử xem thành công!");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
}
