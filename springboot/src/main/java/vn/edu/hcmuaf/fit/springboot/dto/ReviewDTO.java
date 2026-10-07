package vn.edu.hcmuaf.fit.springboot.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewDTO {
    private Long id;
    private Long bookingId;
    private Long homestayId;
    private String homestayName;
    private Long roomId;
    private String roomName;
    private Long touristId;
    private String touristName;
    private String touristEmail;
    private String touristAvatar;
    private Integer rating;
    private String comment;
    private List<String> images;
    private String ownerReply;
    private LocalDateTime createdAt;
    private String formattedDate;
}
