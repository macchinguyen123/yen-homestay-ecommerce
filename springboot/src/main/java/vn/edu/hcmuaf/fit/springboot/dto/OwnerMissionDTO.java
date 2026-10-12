package vn.edu.hcmuaf.fit.springboot.dto;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OwnerMissionDTO {
    private String id;
    private Long rawId;
    private Long homestayId;
    private String title;
    private String desc;
    private String icon;
    private String rewardType;
    private String rewardValue;
    private String rewardExtra;
    private String from;
    private String to;
    private Boolean needPhoto;
    private Boolean autoApprove;
    private Integer given;
    private String status;
}
