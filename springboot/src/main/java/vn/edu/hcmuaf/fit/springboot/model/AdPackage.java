package vn.edu.hcmuaf.fit.springboot.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

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

    @Column(name = "code", length = 50)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(name = "package_type", length = 50)
    private String packageType; // "hot", "short", "long", "seasonal", "vip"

    private BigDecimal price;

    @Column(name = "extra_fee")
    private BigDecimal extraFee;

    @Column(name = "duration_value")
    private Integer durationValue;

    @Column(name = "duration_type", length = 20)
    private String durationType; // "DAY", "WEEK", "MONTH"

    @Column(name = "duration_days")
    private Integer durationDays;

    @Column(name = "ad_type")
    private String adType;

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String benefits;

    @Column(name = "ad_position")
    private String adPosition;

    @Column(name = "supported_formats")
    private String supportedFormats;

    @Column(name = "max_slots")
    private Integer maxSlots;

    @Column(name = "target_audience")
    private String targetAudience;

    @Builder.Default
    private String status = "ACTIVE"; // "ACTIVE", "PAUSED", "INACTIVE"

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
