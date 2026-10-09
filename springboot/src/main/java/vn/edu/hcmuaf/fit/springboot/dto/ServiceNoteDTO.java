package vn.edu.hcmuaf.fit.springboot.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceNoteDTO {
    private Long id;
    private Long homestayId;
    private String icon;
    private String title;
    private String content;
    private Long createdAt;
}
