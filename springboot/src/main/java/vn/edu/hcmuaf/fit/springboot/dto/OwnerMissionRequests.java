package vn.edu.hcmuaf.fit.springboot.dto;

import lombok.*;
import java.util.List;

public class OwnerMissionRequests {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateMissionRequest {
        private Long homestayId;
        private String title;
        private String desc;
        private String icon;
        private String rewardType;
        private String rewardValue;
        private String rewardExtra;
        private String from;
        private String to;
        private Boolean needPhoto;
        private Boolean autoApprove;
        private String status;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ApproveSubmissionRequest {
        private String reward;
        private String note;
        private Boolean notify;
        private Boolean featurePhoto;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RejectSubmissionRequest {
        private String reason;
        private String note;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RetakeSubmissionRequest {
        private String reason;
        private String note;
        private String deadline;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SaveStockRequest {
        private Long homestayId;
        private List<StockItem> items;

        @Getter
        @Setter
        @NoArgsConstructor
        @AllArgsConstructor
        @Builder
        public static class StockItem {
            private Long id;
            private String name;
            private String type;
            private Integer qty;
        }
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SendGiftRequest {
        private Long homestayId;
        private List<String> selectedGuests;
        private String giftItem;
        private String message;
    }
}
