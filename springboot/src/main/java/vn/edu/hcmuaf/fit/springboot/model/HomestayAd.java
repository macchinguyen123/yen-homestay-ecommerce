package vn.edu.hcmuaf.fit.springboot.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "homestay_ads")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HomestayAd {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ad_id")
    private Long id;

    @Column(name = "order_code", length = 50)
    private String orderCode;

    @Column(name = "owner_id", nullable = false)
    private Long ownerId;

    @Column(name = "homestay_id", nullable = false)
    private Long homestayId;

    @Column(name = "package_id")
    private Long packageId;

    @Column(name = "slot_id")
    private Long slotId;

    @Column(name = "campaign_title")
    private String campaignTitle;

    @Column(name = "target_url", columnDefinition = "TEXT")
    private String targetUrl;

    @Column(name = "banner_url", columnDefinition = "TEXT")
    private String bannerUrl;

    @Column(name = "price_paid")
    private BigDecimal pricePaid;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "payment_status")
    private String paymentStatus;

    @Builder.Default
    private String status = "ACTIVE"; // "ACTIVE" / "RUNNING", "SCHEDULED", "PAUSED", "ENDED"

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
