package vn.edu.hcmuaf.fit.springboot.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OwnerServiceStatsDTO {
    private int totalServices;
    private int activeServices;
    private int monthlyGuests;
    private BigDecimal totalRevenue;
    private double rating;
    private int reviewCount;
    private List<PopularStatDTO> popularStats;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PopularStatDTO {
        private String name;
        private int percent;
        private String color;
    }
}
