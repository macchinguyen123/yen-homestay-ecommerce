package vn.edu.hcmuaf.fit.springboot.dto;

import lombok.*;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewStatsDTO {
    private Long homestayId;
    private long totalReviews;
    private double averageRating;
    private Map<Integer, Long> starCounts;
}
