package vn.edu.hcmuaf.fit.springboot.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "ad_packages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdPackage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "package_id")
    private Long id;

    @Column(nullable = false)
    private String name;

    private BigDecimal price;

    @Column(name = "duration_days")
    private Integer durationDays;

    @Column(name = "ad_type")
    private String adType;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Builder.Default
    private String status = "ACTIVE";
}
