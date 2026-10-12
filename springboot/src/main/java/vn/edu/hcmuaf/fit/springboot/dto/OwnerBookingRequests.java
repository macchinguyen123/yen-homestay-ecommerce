package vn.edu.hcmuaf.fit.springboot.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class OwnerBookingRequests {

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateDirectBookingRequest {
        private Long homestayId;
        private Long roomId;
        private String guestName;
        private String phone;
        private String cccd;
        private String city;
        private String roomCode;
        private String roomType;
        private Integer guestsCount;
        private LocalDate checkIn;
        private LocalDate checkOut;
        private BigDecimal pricePerNight;
        private BigDecimal depositAmount;
        private String paymentMethod;
        private String specialRequest;
        private String source;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CheckinBookingRequest {
        private String cccd;
        private String paymentMethod;
        private BigDecimal amountPaid;
        private Boolean isPaid;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CheckoutBookingRequest {
        private String paymentType;
        private BigDecimal finalPaidAmount;
        private Boolean keysReturned;
        private Boolean equipmentIntact;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ApproveBookingRequest {
        private Boolean confirmDeposit;
        private String note;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RejectBookingRequest {
        private String reason;
        private String refundOption;
        private String notifyMessage;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AddServicesBookingRequest {
        private List<ServiceItem> services;

        @Getter
        @Setter
        @NoArgsConstructor
        @AllArgsConstructor
        @Builder
        public static class ServiceItem {
            private Long extraId;
            private String name;
            private Integer qty;
            private BigDecimal price;
        }
    }
}
