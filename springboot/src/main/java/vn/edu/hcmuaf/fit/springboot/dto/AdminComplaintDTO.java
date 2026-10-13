package vn.edu.hcmuaf.fit.springboot.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

public class AdminComplaintDTO {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Item {
        private Long id;
        private String code;
        private String direction;
        private String directionText;
        private String bookingCode;
        private Long bookingId;
        private String bookingTotal;
        private String dates;
        private ReporterDTO reporter;
        private ReportedDTO reported;
        private String topic;
        private String title;
        private String content;
        private String reportedResponse;
        private String demands;
        private BigDecimal requestedAmount;
        private String severity;
        private String severityText;
        private String status;
        private String statusText;
        private String createdAt;
        private List<String> evidence;
        private List<TimelineStepDTO> timeline;
        private String resolutionAction;
        private BigDecimal resolutionAmount;
        private String adminSolution;
        private String resolvedAt;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ReporterDTO {
        private String name;
        private String role;
        private String phone;
        private String homestay;
        private String avatar;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ReportedDTO {
        private String name;
        private String role;
        private String phone;
        private String homestay;
        private String region;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TimelineStepDTO {
        private String time;
        private String desc;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Stats {
        private long total;
        private long pending;
        private long touristToHs;
        private long hsToTourist;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateRequest {
        private String direction;
        private String bookingCode;
        private Long bookingId;
        private String reporterName;
        private String reporterPhone;
        private String reportedName;
        private String reportedPhone;
        private String reportedHomestayName;
        private String reportType;
        private String title;
        private String content;
        private String demands;
        private BigDecimal requestedAmount;
        private String bookingTotal;
        private String stayDates;
        private String severity;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BookingOptionDTO {
        private Long bookingId;
        private String bookingCode;
        private Long touristId;
        private String touristName;
        private String touristPhone;
        private Long homestayId;
        private String homestayName;
        private String hostName;
        private String hostPhone;
        private String region;
        private String stayDates;
        private String totalPrice;
        private BigDecimal totalAmount;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResolveRequest {
        private String action; // refund_guest, charge_guest, mediate_ok, reject
        private BigDecimal amount;
        private String adminNote;
    }
}

