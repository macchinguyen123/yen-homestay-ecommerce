package vn.edu.hcmuaf.fit.springboot.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateComplaintRequest {
    private Long bookingId;
    private Long reporterId;
    private Long reportedHomestayId;
    private String reportType;
    private String severity;
    private String title;
    private String content;
    private String contact;
    private String proofImages;
}
