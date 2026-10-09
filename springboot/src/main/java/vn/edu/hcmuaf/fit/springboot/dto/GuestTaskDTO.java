package vn.edu.hcmuaf.fit.springboot.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GuestTaskDTO {
    private Long id;
    private Long homestayId;
    private String title;
    private String description;
    private String rewardNote;
    private String status;
}
