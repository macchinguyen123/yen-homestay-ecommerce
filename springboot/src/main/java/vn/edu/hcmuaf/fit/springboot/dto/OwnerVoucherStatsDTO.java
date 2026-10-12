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
public class OwnerVoucherStatsDTO {
    private long totalVouchers;
    private long activeCount;
    private long totalUsed;
    private BigDecimal totalRevenue;
    private BigDecimal totalDiscountGiven;
    private double roi;
    private String topVoucherCode;
    private String topVoucherName;
    private long topVoucherUsed;
    private int newGuestPercent;
    private int returningGuestPercent;
}
