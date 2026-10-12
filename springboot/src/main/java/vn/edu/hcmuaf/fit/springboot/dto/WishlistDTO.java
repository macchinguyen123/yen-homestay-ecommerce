package vn.edu.hcmuaf.fit.springboot.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WishlistDTO {
    private Long id;
    private Long homestayId;
    private Long touristId;
    private String name;
    private String title;
    private String city;
    private String region;
    private String location;
    private String address;
    private Double rating;
    private Integer reviews;
    private String specs;
    private String amenities;
    private String features;
    private String price;
    private BigDecimal rawPrice;
    private String img;
    private String image;
    private String tag;
    private String badge;
    private Long date;
    private LocalDateTime createdAt;
}
