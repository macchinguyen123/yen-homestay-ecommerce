package vn.edu.hcmuaf.fit.springboot.dto;

import lombok.*;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewAnalyticsDTO {
    private long totalReviews;
    private double averageRating;
    private double positivePercent;
    private double negativePercent;
    private double neutralPercent;
    private long unrepliedCount;
    private double responseRate;

    // Phân bổ khía cạnh: {"Vệ sinh": 15, "Dịch vụ": 8, ...}
    private Map<String, Long> aspectCounts;
    
    // Xếp hạng sao: {"5": 20, "4": 10, ...}
    private Map<String, Long> ratingCounts;

    // Danh sách review chi tiết
    private List<ReviewItemDTO> reviews;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReviewItemDTO {
        private Long reviewId;
        private Long homestayId;
        private String homestayName;
        private String customerName;
        private String customerAvatar;
        private Integer rating;
        private String comment;
        private String sentiment; // POSITIVE, NEGATIVE, NEUTRAL
        private Double sentimentScore;
        private List<String> aspectTags;
        private String aiSummary;
        private String ownerReply;
        private String reviewedAt;
    }
}
