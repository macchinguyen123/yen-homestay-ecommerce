package vn.edu.hcmuaf.fit.springboot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class AdminDashboardDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OverviewResponse {
        private String period;
        private String periodLabel;
        private Map<String, MetricItemDTO> metrics;
        private GrowthChartDTO growthChart;
        private DistributionChartDTO distributionChart;
        private SystemStatusDTO systemStatus;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MetricItemDTO {
        private String val;
        private String trend;
        private String trendType; // 'up', 'down', 'neutral'
        private String sub;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GrowthChartDTO {
        private List<String> labels;
        private List<BigDecimal> revenueData;
        private List<Integer> bookingData;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DistributionChartDTO {
        private List<String> labels;
        private List<Long> data;
        private List<DistributionItemDTO> items;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DistributionItemDTO {
        private String name;
        private Long count;
        private Integer percentage;
        private String color;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SystemStatusDTO {
        private String status;
        private String databaseName;
        private String databaseStatus;
        private String latency;
        private String uptime;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentActivityDTO {
        private Long id;
        private String code;
        private String user;
        private String avatar;
        private String homestay;
        private String amount;
        private BigDecimal amountRaw;
        private String time;
        private String status; // 'paid', 'pending', 'refunded'
        private String statusText;
        private String gateway;
        private ActivityDetailDTO details;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ActivityDetailDTO {
        private String dates;
        private String room;
        private String phone;
        private String host;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MetricDetailResponse {
        private String key;
        private String title;
        private String icon;
        private String accentColor;
        private String currentValue;
        private String periodLabel;
        private List<MetricRowDTO> rows;
        private String actionLink;
        private String actionText;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MetricRowDTO {
        private String label;
        private String val;
    }
}
