package vn.edu.hcmuaf.fit.springboot.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.edu.hcmuaf.fit.springboot.dto.WishlistDTO;
import vn.edu.hcmuaf.fit.springboot.service.WishlistService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;

    /**
     * Lấy danh sách homestay yêu thích của User từ CSDL
     */
    @GetMapping("/api/users/{userId}/wishlist")
    public ResponseEntity<?> getUserWishlist(@PathVariable Long userId) {
        try {
            List<WishlistDTO> list = wishlistService.getWishlistByUserId(userId);
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    /**
     * Thêm homestay vào danh sách yêu thích trong CSDL
     */
    @PostMapping("/api/users/{userId}/wishlist")
    public ResponseEntity<?> addToWishlist(
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

            if (targetHomestayId == null || targetHomestayId <= 0) {
                throw new IllegalArgumentException("homestayId là bắt buộc");
            }

            WishlistDTO result = wishlistService.addToWishlist(userId, targetHomestayId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Đã thêm vào danh sách yêu thích!");
            response.put("data", result);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    /**
     * Xóa 1 homestay khỏi danh sách yêu thích
     */
    @DeleteMapping("/api/users/{userId}/wishlist/{homestayId}")
    public ResponseEntity<?> removeFromWishlist(
            @PathVariable Long userId,
            @PathVariable Long homestayId) {
        try {
            wishlistService.removeFromWishlist(userId, homestayId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Đã xóa homestay khỏi danh sách yêu thích!");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    /**
     * Xóa toàn bộ homestay khỏi danh sách yêu thích của user
     */
    @DeleteMapping("/api/users/{userId}/wishlist")
    public ResponseEntity<?> clearWishlist(@PathVariable Long userId) {
        try {
            wishlistService.clearWishlist(userId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Đã xóa toàn bộ danh sách yêu thích thành công!");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> err = new HashMap<>();
            err.put("success", false);
            err.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }
}
