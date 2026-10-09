package vn.edu.hcmuaf.fit.springboot.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomDTO {
    private Long id;
    private Long homestayId;
    private String homestayName;
    private String roomName;
    private String name; // alias for roomName
    private String roomType;
    private Integer bedCount;
    private Integer capacity;
    private BigDecimal pricePerNight;
    private BigDecimal price; // alias for pricePerNight
    private BigDecimal cleaningFee;
    private String status;
    private Integer availableCount;
    private String description;
    private String thumb;
    private String primaryImage;
    private List<String> gallery;
    private List<String> images;
    private List<String> amenities;
    private RoomSpecsDTO specs;
    private Double rating;
    private Integer reviewCount;
    private List<GuestTaskDTO> tasks;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RoomSpecsDTO {
        private String area;
        private Integer guests;
        private String beds;
    }
}
