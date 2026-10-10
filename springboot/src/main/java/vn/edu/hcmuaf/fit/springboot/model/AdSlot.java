package vn.edu.hcmuaf.fit.springboot.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "ad_slots")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "slot_id")
    private Long id;

    @Column(nullable = false, length = 50)
    private String code; // e.g. "SLOT-HRO", "SLOT-TOP5"

    @Column(nullable = false)
    private String name; // e.g. "Hero Slider Trang Chủ"

    @Column(name = "page_area", length = 100)
    private String pageArea; // "trang_chu", "chi_tiet_homestay", "tim_kiem", "kham_pha"

    @Column(name = "position_type", length = 100)
    private String positionType; // "banner_dau_trang", "banner_giua_trang", "banner_cuoi_trang", "khu_vuc_noi_bat", "khu_vuc_de_xuat"

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

    @Column(length = 100)
    private String dimensions; // "1920x600px"

    @Column(name = "allowed_types")
    private String allowedTypes; // "Hình ảnh", "Banner", "Nội dung quảng bá", "Liên kết"

    @Column(name = "max_ads")
    private Integer maxAds; // Max active ads allowed in slot

    @Column(name = "min_duration_days")
    private Integer minDurationDays; // Min days allowed for booking

    @Column(name = "price_daily")
    private BigDecimal priceDaily;

    @Column(name = "price_weekly")
    private BigDecimal priceWeekly;

    @Column(name = "price_monthly")
    private BigDecimal priceMonthly;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "avg_ctr")
    private BigDecimal avgCtr; // Average Click-Through-Rate percentage

    @Builder.Default
    private String status = "SELLING"; // "SELLING" (Đang bán), "BOOKED" (Đã được đặt), "LOCKED" (Tạm khóa), "STOPPED" (Ngừng kinh doanh)

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
