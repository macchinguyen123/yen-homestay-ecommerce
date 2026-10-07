package vn.edu.hcmuaf.fit.springboot.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

public class AdminReportDTO {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ChartDatasetDTO {
        private String label;
        private List<Object> data;
        private String backgroundColor;
        private Object backgroundColorList; // For Pie/Doughnut arrays
        private String borderColor;
        private Boolean fill;
        private Double tension;
        private List<Integer> borderDash;
        private Integer borderWidth;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ChartDataDTO {
        private List<String> labels;
        private List<ChartDatasetDTO> datasets;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RegionRevenueItem {
        private int rank;
        private String regionName;
        private int homestayCount;
        private String totalRevenue;
        private BigDecimal totalRevenueRaw;
        private String yenFee;
        private BigDecimal yenFeeRaw;
        private String growthRate;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RevenueReportSection {
        private String totalGMV;
        private String totalYenFee;
        private String escrowTotal;
        private String avgBookingValue;
        private String gmvTrend;
        private String yenFeeTrend;
        private ChartDataDTO monthlyChart;
        private ChartDataDTO regionalChart;
        private List<RegionRevenueItem> regionalTable;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BookingReportSection {
        private String totalBookings;
        private String occupancyRate;
        private String completedBookings;
        private String avgStayNights;
        private ChartDataDTO weeklyBarChart; // Column / Bar chart
        private ChartDataDTO attributionPieChart;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TouristReportSection {
        private String totalTourists;
        private String returnRate;
        private ChartDataDTO growthLineChart;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OwnerReportSection {
        private String totalOwners;
        private String activeOwners;
        private ChartDataDTO topOwnersBarChart; // Column / Bar chart
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class HomestayReportSection {
        private String totalHomestays;
        private ChartDataDTO regionalDensityBarChart; // Column / Bar chart
        private ChartDataDTO statusPieChart;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TransactionReportSection {
        private String totalTransactionValue;
        private ChartDataDTO gatewayDoughnutChart;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class VoucherReportSection {
        private String totalVoucherUses;
        private String totalDiscountAmount;
        private ChartDataDTO topVouchersBarChart; // Column / Bar chart
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AdsReportSection {
        private String totalImpressions;
        private String avgCTR;
        private ChartDataDTO adSlotsBarChart; // Column / Bar chart
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ReportSummaryResponse {
        private String period;
        private String startDate;
        private String endDate;
        private RevenueReportSection revenue;
        private BookingReportSection booking;
        private TouristReportSection tourist;
        private OwnerReportSection owner;
        private HomestayReportSection homestay;
        private TransactionReportSection transaction;
        private VoucherReportSection voucher;
        private AdsReportSection ads;
    }
}
