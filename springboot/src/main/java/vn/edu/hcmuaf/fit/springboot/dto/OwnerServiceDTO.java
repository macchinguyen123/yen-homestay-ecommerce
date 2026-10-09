package vn.edu.hcmuaf.fit.springboot.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OwnerServiceDTO {
    private Long id;
    private Long homestayId;
    private String name;
    private String category;
    private String status;
    private BigDecimal price;
    private String unit;
    private String description;
    private String image;
    private List<Long> linkedServices;
    private Long createdAt;
}
