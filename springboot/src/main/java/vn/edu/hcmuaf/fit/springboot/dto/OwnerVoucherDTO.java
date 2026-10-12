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
public class OwnerVoucherDTO {
    private Long id;
    private Long homestayId;
    private String homestayName;
    private String code;
    private String name;
    private String type; // "percent" | "amount"
    private BigDecimal value;
    private BigDecimal maxDiscount;
    private BigDecimal minOrder;
    private Integer usageLimit;
    private Integer used;
    private Integer perUser;
    private String start; // YYYY-MM-DD
    private String end;   // YYYY-MM-DD
    private String audience;
    private String status; // "active" | "upcoming" | "ended"
    private String description;
    private String image;
    private BigDecimal revenue;
}
