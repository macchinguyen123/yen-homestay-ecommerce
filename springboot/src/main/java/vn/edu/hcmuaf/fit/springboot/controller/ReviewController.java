package vn.edu.hcmuaf.fit.springboot.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.edu.hcmuaf.fit.springboot.dto.ReviewDTO;
import vn.edu.hcmuaf.fit.springboot.dto.ReviewStatsDTO;
import vn.edu.hcmuaf.fit.springboot.service.ReviewService;

import java.util.List;

@RestController
@RequestMapping("/api/public/reviews")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping("/homestay/{homestayId}")
    public ResponseEntity<List<ReviewDTO>> getReviewsByHomestay(@PathVariable Long homestayId) {
        return ResponseEntity.ok(reviewService.getReviewsByHomestayId(homestayId));
    }

    @GetMapping("/room/{roomId}")
    public ResponseEntity<List<ReviewDTO>> getReviewsByRoom(@PathVariable Long roomId) {
        return ResponseEntity.ok(reviewService.getReviewsByRoomId(roomId));
    }

    @GetMapping("/stats/{homestayId}")
    public ResponseEntity<ReviewStatsDTO> getReviewStats(@PathVariable Long homestayId) {
        return ResponseEntity.ok(reviewService.getReviewStatsByHomestayId(homestayId));
    }

    @GetMapping("/all")
    public ResponseEntity<List<ReviewDTO>> getAllReviews() {
        return ResponseEntity.ok(reviewService.getAllReviews());
    }

    @GetMapping("/owner")
    public ResponseEntity<List<ReviewDTO>> getReviewsByOwner(
            @RequestParam(required = false) Long ownerId,
            @RequestParam(required = false) String email
    ) {
        if (email != null && !email.isBlank()) {
            return ResponseEntity.ok(reviewService.getReviewsByOwnerEmail(email));
        }
        if (ownerId != null) {
            return ResponseEntity.ok(reviewService.getReviewsByOwnerId(ownerId));
        }
        return ResponseEntity.ok(reviewService.getReviewsByOwnerEmail("lethimai86@gmail.com"));
    }

    @PostMapping("/{reviewId}/reply")
    public ResponseEntity<?> replyReview(
            @PathVariable Long reviewId,
            @RequestBody java.util.Map<String, String> payload
    ) {
        String replyText = payload != null ? payload.get("reply") : null;
        if (replyText == null || replyText.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(java.util.Map.of("success", false, "message", "Nội dung phản hồi không được để trống"));
        }
        boolean ok = reviewService.saveOwnerReply(reviewId, replyText.trim());
        if (ok) {
            return ResponseEntity.ok(java.util.Map.of("success", true, "message", "Đã lưu phản hồi thành công"));
        } else {
            return ResponseEntity.badRequest().body(java.util.Map.of("success", false, "message", "Không tìm thấy đánh giá hoặc lỗi cập nhật"));
        }
    }
}

