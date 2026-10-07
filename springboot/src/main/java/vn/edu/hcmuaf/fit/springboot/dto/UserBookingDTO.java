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
public class UserBookingDTO {

    private Long id;
    private String bookingCode;
    private Long touristId;
    private String touristName;
    private String touristAvatar;
    private Long homestayId;
    private String homestayName;
    private String homestayImage;
    private String location;
    private Long roomId;
    private String roomName;
    private String roomType;
    private String roomImage;

    private String checkIn;
    private String checkOut;
    private LocalDate checkInDate;
    private LocalDate checkOutDate;
    private Integer nights;
    private String guests;
    private Integer guestsCount;

    private String totalPrice;
    private BigDecimal totalPriceRaw;
    private BigDecimal depositAmount;
    private BigDecimal remainingAmount;
    private String paymentType;
    private String depositStatus;
    private String payStatus;

    private String status; // 'active', 'upcoming', 'completed', 'cancelled', 'complaint'
    private String statusRaw; // DB status
    private LocalDateTime createdAt;

    private TaskDTO task;
    private ComplaintDTO complaint;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TaskDTO {
        private Long id;
        private String title;
        private String rewardText;
        private String status; // 'pending' or 'completed'
        private List<ChecklistItemDTO> checklist;
        private UserReviewDTO userReview;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ChecklistItemDTO {
        private Integer id;
        private String text;
        private Boolean done;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserReviewDTO {
        private Long id;
        private Integer rating;
        private String title;
        private String content;
        private String ownerReply;
        private String createdAt;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ComplaintDTO {
        private Long id;
        private String ticketCode;
        private String typeText;
        private String severity;
        private String content;
        private String statusText;
        private String adminSolution;
    }
}
