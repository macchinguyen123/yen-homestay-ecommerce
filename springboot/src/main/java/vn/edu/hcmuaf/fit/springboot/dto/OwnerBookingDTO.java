package vn.edu.hcmuaf.fit.springboot.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OwnerBookingDTO {
    private Long id;
    private String bookingCode;
    private String source;
    private Long touristId;
    private String guestName;
    private String phone;
    private String email;
    private String cccd;
    private String avatar;
    private String avatarBg;
    private String avatarImg;
    private String city;

    private Long homestayId;
    private String homestayName;
    private Long roomId;
    private String roomCode;
    private String roomName;
    private String roomType;

    private Integer guestsCount;
    private String guestsLabel;

    private LocalDate checkInDate;
    private LocalDate checkOutDate;
    private String checkIn;
    private String checkInTime;
    private String checkOut;
    private String checkOutTime;
    private Integer nights;

    private String depositStatus;
    private BigDecimal depositAmount;
    private BigDecimal totalAmount;
    private BigDecimal remainAmount;
    private String paymentType;

    private String status;
    private String statusBadge;
    private String specialRequest;
    private String notes;

    private List<OwnerBookingServiceItemDTO> services;
    private List<OwnerBookingTimelineItemDTO> timeline;
    private BankTransferInfoDTO bankTransferInfo;

    private String invoiceNo;
    private String invoiceDate;
    private LocalDateTime createdAt;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OwnerBookingServiceItemDTO {
        private String name;
        private Integer qty;
        private BigDecimal price;
        private BigDecimal total;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OwnerBookingTimelineItemDTO {
        private String title;
        private String time;
        private String status; // 'done' | 'current' | 'pending'
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BankTransferInfoDTO {
        private String bankName;
        private String accountNumber;
        private String accountName;
        private String amountTransferred;
        private String transferContent;
        private String transferDate;
        private String transferCode;
    }
}
