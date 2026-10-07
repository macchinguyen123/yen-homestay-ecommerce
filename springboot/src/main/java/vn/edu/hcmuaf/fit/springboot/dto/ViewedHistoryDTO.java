package vn.edu.hcmuaf.fit.springboot.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ViewedHistoryDTO {
    private Long id;
    private Long userId;
    private Long homestayId;
    private String name;
    private String location;
    private String timeAgo;
    private String rating;
    private String reviews;
    private String specs;
    private String amenities;
    private String price;
    private String img;
    private Boolean isFav;
    private LocalDateTime viewedAt;
}
