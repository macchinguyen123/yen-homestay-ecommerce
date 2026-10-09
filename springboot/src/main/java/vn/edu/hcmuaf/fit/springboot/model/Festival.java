package vn.edu.hcmuaf.fit.springboot.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "festivals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Festival {

    @Id
    @Column(name = "festival_id")
    private Long id;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(length = 255)
    private String city;

    @Column(length = 255)
    private String location;

    @Column(name = "image_url", length = 255)
    private String imageUrl;

    @Column(length = 512)
    private String description;

    @Column(name = "start_date", length = 512)
    private String startDate;

    @Column(name = "end_date", length = 512)
    private String endDate;

    @Column(name = "badge_info", length = 255)
    private String badgeInfo;
}
