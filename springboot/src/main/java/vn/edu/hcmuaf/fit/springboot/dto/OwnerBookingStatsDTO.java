package vn.edu.hcmuaf.fit.springboot.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OwnerBookingStatsDTO {
    private long pendingCount;
    private long checkInTodayCount;
    private long checkOutTodayCount;
    private BigDecimal heldDepositTotal;
    private String heldDepositTotalFormatted;
    private long totalBookings;
    private int occupancyRate;
    private List<RoomStatusItemDTO> roomStatuses;
    private OwnerBookingDTO todayCheckinBooking;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RoomStatusItemDTO {
        private String room;
        private String desc;
        private String color; // 'green', 'blue', 'gray', 'amber'
    }
}
