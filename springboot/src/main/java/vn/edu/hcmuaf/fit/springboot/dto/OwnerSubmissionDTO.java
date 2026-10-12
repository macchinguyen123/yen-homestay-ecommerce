package vn.edu.hcmuaf.fit.springboot.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OwnerSubmissionDTO {
    private String id;
    private Long rawId;
    private Long homestayId;
    private String guest;
    private String room;
    private String time;
    private String taskType;
    private String task;
    private String review;
    private String reward;
    private Integer photos;
    private String avatar;
    private String image;
    private String status;
    private String rejectReason;
    private String retakeReason;
    private String retakeDeadline;
    private String ownerNote;
}
