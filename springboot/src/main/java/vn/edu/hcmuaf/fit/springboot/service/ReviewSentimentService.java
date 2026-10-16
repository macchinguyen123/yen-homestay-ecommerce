package vn.edu.hcmuaf.fit.springboot.service;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import vn.edu.hcmuaf.fit.springboot.model.Review;
import vn.edu.hcmuaf.fit.springboot.repository.ReviewRepository;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReviewSentimentService {

    private final ReviewRepository reviewRepository;
    private final JdbcTemplate jdbcTemplate;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${ai.service.url:http://localhost:8000}")
    private String aiServiceUrl;

    /**
     * Tự động khởi tạo schema cột sentiment trong Neon PostgreSQL khi Spring Boot khởi động
     */
    @PostConstruct
    public void setupSentimentSchema() {
        try {
            jdbcTemplate.execute("ALTER TABLE reviews ADD COLUMN IF NOT EXISTS sentiment VARCHAR(20);");
            jdbcTemplate.execute("ALTER TABLE reviews ADD COLUMN IF NOT EXISTS sentiment_score FLOAT;");
            jdbcTemplate.execute("ALTER TABLE reviews ADD COLUMN IF NOT EXISTS aspect_tags VARCHAR(255);");
            jdbcTemplate.execute("ALTER TABLE reviews ADD COLUMN IF NOT EXISTS ai_summary TEXT;");
            log.info("Schema sentiment columns trong bảng reviews đã sẵn sàng.");
        } catch (Exception e) {
            log.warn("Lỗi kiểm tra/tạo cột sentiment: {}", e.getMessage());
        }
    }

    /**
     * Gọi AI Service phân tích cảm xúc và lưu vào Review
     */
    public void analyzeAndApplySentiment(Review review) {
        if (review == null || review.getComment() == null) return;
        try {
            String url = aiServiceUrl + "/analyze-review";
            Map<String, Object> req = Map.of(
                "rating", review.getRating() != null ? review.getRating() : 5,
                "comment", review.getComment()
            );

            Map<?, ?> resp = restTemplate.postForObject(url, req, Map.class);
            if (resp != null) {
                review.setSentiment((String) resp.get("sentiment"));
                if (resp.get("sentiment_score") != null) {
                    review.setSentimentScore(Double.valueOf(resp.get("sentiment_score").toString()));
                }
                List<?> tags = (List<?>) resp.get("aspect_tags");
                if (tags != null && !tags.isEmpty()) {
                    review.setAspectTags(String.join(", ", tags.stream().map(Object::toString).toList()));
                } else {
                    review.setAspectTags("Chung");
                }
                review.setAiSummary((String) resp.get("ai_summary"));
                reviewRepository.save(review);
            }
        } catch (Exception e) {
            log.warn("Không thể gọi AI Service phân tích review ID {}: {}", review.getId(), e.getMessage());
        }
    }

    @Async
    public void analyzeAsync(Review review) {
        analyzeAndApplySentiment(review);
    }

    /**
     * Quét và phân tích toàn bộ review cũ chưa có sentiment trong Database
     */
    public Map<String, Object> syncOldReviewsSentiment() {
        List<Review> pendingReviews = reviewRepository.findAll().stream()
                .filter(r -> r.getSentiment() == null || r.getSentiment().isBlank())
                .toList();

        int success = 0;
        for (Review r : pendingReviews) {
            analyzeAndApplySentiment(r);
            success++;
        }
        return Map.of("totalScanned", pendingReviews.size(), "successCount", success);
    }
}
