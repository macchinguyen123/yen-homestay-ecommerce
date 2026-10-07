package vn.edu.hcmuaf.fit.springboot.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HomestayDTO {
    private Long id;
    private Long ownerId;
    private Long categoryId;
    private String name;
    private String city;
    private String address;
    private String location;
    private String distance;
    private Integer maxGuests;
    private Integer numRooms;
    private BigDecimal basePrice;
    private BigDecimal price; // alias for basePrice
    private String description;
    private String desc; // alias for description
    private Double rating;
    private Integer reviewCount;
    private Integer reviews; // alias for reviewCount
    private Integer stars;
    private String locationScore;
    private String status;
    private String image; // primary image
    private String primaryImage;
    private List<String> images;
    private List<String> gallery;
    private List<String> services;
    private List<String> roomAmenities;
    private List<String> amenities;
    private List<String> travelGroups;
    private List<RoomDTO> rooms;
    private Long defaultRoomId;
}
