package vn.edu.hcmuaf.fit.springboot.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.edu.hcmuaf.fit.springboot.dto.ReviewAnalyticsDTO;
import vn.edu.hcmuaf.fit.springboot.model.Homestay;
import vn.edu.hcmuaf.fit.springboot.model.Review;
import vn.edu.hcmuaf.fit.springboot.model.User;
import vn.edu.hcmuaf.fit.springboot.repository.HomestayRepository;
import vn.edu.hcmuaf.fit.springboot.repository.ReviewRepository;
import vn.edu.hcmuaf.fit.springboot.repository.UserRepository;
import vn.edu.hcmuaf.fit.springboot.service.ReviewSentimentService;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ReviewAnalyticsController {

    private final ReviewRepository reviewRepository;
    private final HomestayRepository homestayRepository;
    private final UserRepository userRepository;
    private final ReviewSentimentService reviewSentimentService;

    // ── 1. API CHO OWNER ──────────────────────────────────────────────────────────
    @GetMapping("/api/owner/reviews/analytics")
    public ResponseEntity<ReviewAnalyticsDTO> getOwnerAnalytics(
            @RequestParam(value = "ownerId", required = false) Long ownerId,
            @RequestParam(value = "email", required = false) String email,
            @RequestParam(value = "homestayId", required = false) Long homestayId
    ) {
        Long targetOwnerId = ownerId;
        if (email != null && !email.isBlank()) {
            User owner = userRepository.findByEmail(email).orElse(null);
            if (owner != null) {
                targetOwnerId = owner.getId();
            }
        }
        if (targetOwnerId == null || targetOwnerId <= 0) {
            User owner = userRepository.findByEmail("lethimai86@gmail.com").orElse(null);
            if (owner != null) {
                targetOwnerId = owner.getId();
            } else {
                targetOwnerId = 2L;
            }
        }

        List<Homestay> homestays = homestayRepository.findByOwnerId(targetOwnerId);
        // Nếu chủ nhà này chưa có homestay nào trong DB, gán tạm homestay đầu tiên để test
        if (homestays.isEmpty()) {
            List<Homestay> allHs = homestayRepository.findAll();
            if (!allHs.isEmpty()) {
                Homestay first = allHs.get(0);
                first.setOwnerId(targetOwnerId);
                homestayRepository.save(first);
                homestays = List.of(first);
            }
        }

        List<Long> hsIds = homestays.stream().map(Homestay::getId).toList();

        List<Review> list = hsIds.isEmpty() ? Collections.emptyList() : reviewRepository.findByHomestayIdIn(hsIds);
        if (homestayId != null && homestayId > 0) {
            list = list.stream().filter(r -> Objects.equals(r.getHomestayId(), homestayId)).toList();
        }

        return ResponseEntity.ok(buildAnalyticsDTO(list, homestays));
    }

    // ── SEED DỮ LIỆU ĐÁNH GIÁ XẤU CHO lethimai86@gmail.com & ADMIN ─────────────────
    @RequestMapping(value = "/api/public/reviews/seed-negative-sample", method = {RequestMethod.GET, RequestMethod.POST})
    public ResponseEntity<?> seedNegativeReviewSample() {
        // 1. Tìm hoặc tạo user lethimai86@gmail.com
        User owner = userRepository.findByEmail("lethimai86@gmail.com").orElseGet(() -> {
            User newOwner = new User();
            newOwner.setEmail("lethimai86@gmail.com");
            newOwner.setPassword("$2a$10$wKxN74jX3B.1HhPcm6qVvO9s9z6uNnUo9z7L4t4pQG1mQv7u4K.9m"); // default 123456
            newOwner.setFullName("Lê Thị Mai");
            newOwner.setRole("OWNER");
            newOwner.setStatus("ACTIVE");
            return userRepository.save(newOwner);
        });

        // 2. Tìm homestay của owner, nếu chưa có thì gán homestay đầu tiên hoặc tạo mới
        List<Homestay> ownerHomestays = homestayRepository.findByOwnerId(owner.getId());
        Homestay targetHomestay;
        if (ownerHomestays.isEmpty()) {
            List<Homestay> allHs = homestayRepository.findAll();
            if (!allHs.isEmpty()) {
                targetHomestay = allHs.get(0);
                targetHomestay.setOwnerId(owner.getId());
                targetHomestay = homestayRepository.save(targetHomestay);
            } else {
                targetHomestay = new Homestay();
                targetHomestay.setName("Yên Homestay - Chi nhánh Đà Lạt");
                targetHomestay.setOwnerId(owner.getId());
                targetHomestay.setCity("Lâm Đồng");
                targetHomestay.setAddress("12 Hoàng Hoa Thám, Phường 10, Đà Lạt");
                targetHomestay.setStatus("ACTIVE");
                targetHomestay = homestayRepository.save(targetHomestay);
            }
        } else {
            targetHomestay = ownerHomestays.get(0);
        }

        // 3. Tìm khách du lịch để đánh giá (tourist)
        User tourist = userRepository.findAll().stream()
                .filter(u -> !Objects.equals(u.getId(), owner.getId()))
                .findFirst()
                .orElseGet(() -> {
                    User t = new User();
                    t.setEmail("khach.hang.trainghiem@gmail.com");
                    t.setPassword("$2a$10$wKxN74jX3B.1HhPcm6qVvO9s9z6uNnUo9z7L4t4pQG1mQv7u4K.9m"); // default 123456
                    t.setFullName("Nguyễn Văn Hoàng");
                    t.setRole("TOURIST");
                    t.setStatus("ACTIVE");
                    return userRepository.save(t);
                });

        // 4. Tạo đánh giá xấu tiêu biểu (1 sao)
        Review badReview = Review.builder()
                .homestayId(targetHomestay.getId())
                .touristId(tourist.getId())
                .rating(1)
                .comment("Phòng không giống như quảng cáo! Nhà vệ sinh rất bẩn, có mùi ẩm mốc khó chịu. Điều hòa thì chảy nước kêu ồn ào cả đêm không ngủ được, wifi thì chập chờn. Nhân viên thái độ phục vụ khó chịu, giá tiền hoàn toàn không xứng đáng!")
                .sentiment("NEGATIVE")
                .sentimentScore(0.98)
                .aspectTags("Vệ sinh, Dịch vụ, Tiện nghi, Giá cả")
                .aiSummary("Khách phàn nàn gay gắt về Vệ sinh, Tiện nghi (điều hòa hỏng, wifi yếu), Dịch vụ kém và Giá cả (1⭐).")
                .taskStatus("APPROVED")
                .reviewedAt(java.time.LocalDateTime.now())
                .createdAt(java.time.LocalDateTime.now())
                .build();

        badReview = reviewRepository.save(badReview);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Đã tạo thành công dữ liệu đánh giá xấu giả định cho chủ nhà lethimai86@gmail.com và hiển thị trên Admin!",
                "reviewId", badReview.getId(),
                "homestayId", targetHomestay.getId(),
                "homestayName", targetHomestay.getName(),
                "ownerEmail", owner.getEmail(),
                "ownerName", owner.getFullName(),
                "rating", badReview.getRating(),
                "sentiment", badReview.getSentiment(),
                "aspectTags", badReview.getAspectTags(),
                "comment", badReview.getComment()
        ));
    }

    // Owner gửi phản hồi review
    @PostMapping("/api/owner/reviews/{reviewId}/reply")
    public ResponseEntity<?> replyReview(
            @PathVariable Long reviewId,
            @RequestBody Map<String, String> payload
    ) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đánh giá"));
        review.setOwnerReply(payload.get("reply"));
        reviewRepository.save(review);
        return ResponseEntity.ok(Map.of("success", true, "message", "Đã gửi phản hồi thành công"));
    }

    // ── 2. API CHO ADMIN ──────────────────────────────────────────────────────────
    @GetMapping("/api/admin/reviews/analytics")
    public ResponseEntity<ReviewAnalyticsDTO> getAdminAnalytics() {
        List<Review> list = reviewRepository.findAll();
        List<Homestay> allHomestays = homestayRepository.findAll();
        return ResponseEntity.ok(buildAnalyticsDTO(list, allHomestays));
    }

    // Quét phân tích hàng loạt cho review cũ
    @PostMapping("/api/public/reviews/sync-sentiment")
    public ResponseEntity<?> syncAllOldReviews() {
        return ResponseEntity.ok(reviewSentimentService.syncOldReviewsSentiment());
    }

    // ── HELPER FUNCTION ────────────────────────────────────────────────────────
    private ReviewAnalyticsDTO buildAnalyticsDTO(List<Review> reviews, List<Homestay> homestays) {
        long total = reviews.size();
        if (total == 0) {
            return ReviewAnalyticsDTO.builder()
                    .totalReviews(0).averageRating(5.0).positivePercent(100.0)
                    .negativePercent(0.0).neutralPercent(0.0).unrepliedCount(0).responseRate(100.0)
                    .aspectCounts(Collections.emptyMap()).ratingCounts(Collections.emptyMap())
                    .reviews(Collections.emptyList()).build();
        }

        Map<Long, String> hsNameMap = homestays.stream()
                .collect(Collectors.toMap(Homestay::getId, Homestay::getName, (a, b) -> a));

        List<Long> touristIds = reviews.stream().map(Review::getTouristId).distinct().toList();
        Map<Long, User> userMap = userRepository.findAllById(touristIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u, (a, b) -> a));

        long pos = reviews.stream().filter(r -> "POSITIVE".equalsIgnoreCase(r.getSentiment())).count();
        long neg = reviews.stream().filter(r -> "NEGATIVE".equalsIgnoreCase(r.getSentiment())).count();
        long neu = total - pos - neg;
        long unreplied = reviews.stream().filter(r -> r.getOwnerReply() == null || r.getOwnerReply().isBlank()).count();

        double avgRating = reviews.stream().mapToInt(r -> r.getRating() != null ? r.getRating() : 5).average().orElse(5.0);

        Map<String, Long> aspectCounts = new LinkedHashMap<>();
        // Mặc định các khía cạnh
        aspectCounts.put("Vệ sinh", 0L);
        aspectCounts.put("Dịch vụ", 0L);
        aspectCounts.put("Tiện nghi", 0L);
        aspectCounts.put("Giá cả", 0L);
        aspectCounts.put("Vị trí", 0L);

        reviews.forEach(r -> {
            if (r.getAspectTags() != null) {
                Arrays.stream(r.getAspectTags().split(","))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .forEach(tag -> aspectCounts.put(tag, aspectCounts.getOrDefault(tag, 0L) + 1));
            }
        });

        Map<String, Long> ratingCounts = new HashMap<>();
        for (int i = 1; i <= 5; i++) {
            final int star = i;
            ratingCounts.put(String.valueOf(star), reviews.stream().filter(r -> r.getRating() != null && r.getRating() == star).count());
        }

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
        List<ReviewAnalyticsDTO.ReviewItemDTO> items = reviews.stream().map(r -> {
            User user = userMap.get(r.getTouristId());
            String dateStr = r.getReviewedAt() != null ? r.getReviewedAt().format(dtf) :
                    (r.getCreatedAt() != null ? r.getCreatedAt().format(dtf) : "Vừa xong");

            List<String> tags = r.getAspectTags() != null ?
                    Arrays.stream(r.getAspectTags().split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList() : Collections.emptyList();

            return ReviewAnalyticsDTO.ReviewItemDTO.builder()
                    .reviewId(r.getId())
                    .homestayId(r.getHomestayId())
                    .homestayName(hsNameMap.getOrDefault(r.getHomestayId(), "Homestay #" + r.getHomestayId()))
                    .customerName(user != null ? user.getFullName() : "Khách lưu trú #" + r.getTouristId())
                    .customerAvatar(user != null ? user.getAvatar() : null)
                    .rating(r.getRating() != null ? r.getRating() : 5)
                    .comment(r.getComment())
                    .sentiment(r.getSentiment() != null ? r.getSentiment() : "POSITIVE")
                    .sentimentScore(r.getSentimentScore() != null ? r.getSentimentScore() : 0.85)
                    .aspectTags(tags)
                    .aiSummary(r.getAiSummary() != null ? r.getAiSummary() : "Đánh giá của khách lưu trú.")
                    .ownerReply(r.getOwnerReply())
                    .reviewedAt(dateStr)
                    .build();
        }).toList();

        return ReviewAnalyticsDTO.builder()
                .totalReviews(total)
                .averageRating(Math.round(avgRating * 10.0) / 10.0)
                .positivePercent(Math.round((double) pos / total * 1000.0) / 10.0)
                .negativePercent(Math.round((double) neg / total * 1000.0) / 10.0)
                .neutralPercent(Math.round((double) neu / total * 1000.0) / 10.0)
                .unrepliedCount(unreplied)
                .responseRate(Math.round((double) (total - unreplied) / total * 1000.0) / 10.0)
                .aspectCounts(aspectCounts)
                .ratingCounts(ratingCounts)
                .reviews(items)
                .build();
    }
}
