package vn.edu.hcmuaf.fit.springboot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VisualSearchItemDTO {
    private Long homestayId;
    private String name;
    private String city;
    private String address;
    private BigDecimal basePrice;
    private Double rating;
    private String matchedImageUrl;
    private Double similarity;      // Điểm tương đồng dạng phần trăm: ví dụ 92.5 (%)
    private Double distance;        // Khoảng cách Cosine (0.0 đến 2.0, càng nhỏ càng giống)
}
