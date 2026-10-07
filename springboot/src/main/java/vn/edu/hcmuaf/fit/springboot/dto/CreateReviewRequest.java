package vn.edu.hcmuaf.fit.springboot.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateReviewRequest {
    private Long bookingId;
    private Long touristId;
    private Long homestayId;
    private Long taskId;
    private Integer rating;
    private String title;
    private String comment;
    private String images;
}
