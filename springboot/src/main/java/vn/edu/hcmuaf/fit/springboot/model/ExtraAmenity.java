package vn.edu.hcmuaf.fit.springboot.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "extra_amenities")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExtraAmenity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "extra_id")
    private Long id;

    @Column(name = "homestay_id", nullable = false)
    private Long homestayId;

    @Column(nullable = false)
    private String name;

    private BigDecimal price;

    private String unit;

    @Builder.Default
    private String status = "ACTIVE";

    @Column(name = "category")
    private String category;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "image", columnDefinition = "TEXT")
    private String image;

    @Column(name = "linked_services")
    private String linkedServices;

    @Column(name = "created_at")
    private java.time.LocalDateTime createdAt;
}
