package vn.edu.hcmuaf.fit.springboot.dto;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OwnerMissionStatsDTO {
    private long activeMissions;
    private long pendingToday;
    private long participantGuests;
    private long rewardedVouchers;
    private int interactionRate;
    private List<TopGuestDTO> topGuests;
    private List<RewardStockDTO> rewardStocks;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TopGuestDTO {
        private Long id;
        private String name;
        private Integer points;
        private Integer completed;
        private String avatar;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RewardStockDTO {
        private Long id;
        private String name;
        private String type;
        private Integer qty;
    }
}
