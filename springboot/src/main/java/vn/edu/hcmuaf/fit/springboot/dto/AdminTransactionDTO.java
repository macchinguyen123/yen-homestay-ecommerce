package vn.edu.hcmuaf.fit.springboot.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class AdminTransactionDTO {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TransactionItem {
        private Long id;
        private String txCode;
        private String bookingCode;
        private String guest;
        private String guestPhone;
        private String homestay;
        private String owner;
        private String total;
        private BigDecimal totalRaw;
        private String deposit;
        private BigDecimal depositRaw;
        private String netPayout;
        private BigDecimal netPayoutRaw;
        private String platformFee;
        private String gateway;
        private String gatewayClass;
        private String status;
        private String statusText;
        private String traceId;
        private String guestBankInfo;
        private String ownerBankInfo;
        private String refundReason;
        private LocalDateTime createdAt;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class FinancialStats {
        private String yenFeeMonth;
        private String escrowDepositTotal;
        private long refundRequestsCount;
        private long payoutPendingCount;
        private long totalCount;
        private long escrowCount;
        private long refundCount;
        private long payoutCount;
        private long completedCount;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TransactionResponse {
        private List<TransactionItem> content;
        private int currentPage;
        private int totalPages;
        private long totalElements;
        private FinancialStats stats;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StatusUpdateRequest {
        private String status;
        private String traceId;
        private String note;
    }
}
