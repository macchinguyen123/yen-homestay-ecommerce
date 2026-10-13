package vn.edu.hcmuaf.fit.springboot.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "reports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "report_id")
    private Long id;

    @Column(name = "complaint_code", length = 50)
    private String complaintCode;

    @Column(name = "direction", length = 50)
    private String direction; // tourist_to_homestay, homestay_to_tourist

    @Column(name = "booking_id")
    private Long bookingId;

    @Column(name = "booking_code", length = 50)
    private String bookingCode;

    @Column(name = "reporter_id")
    private Long reporterId;

    @Column(name = "reporter_name")
    private String reporterName;

    @Column(name = "reporter_phone", length = 50)
    private String reporterPhone;

    @Column(name = "reporter_role", length = 100)
    private String reporterRole;

    @Column(name = "reported_id")
    private Long reportedId;

    @Column(name = "reported_name")
    private String reportedName;

    @Column(name = "reported_phone", length = 50)
    private String reporterReportedPhone;

    @Column(name = "reported_homestay_id")
    private Long reportedHomestayId;

    @Column(name = "reported_homestay_name")
    private String reportedHomestayName;

    @Column(name = "reported_region")
    private String reportedRegion;

    @Column(name = "report_type")
    private String reportType; // Topic: Tiện nghi, Hư hỏng tài sản, vv.

    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name = "reported_response", columnDefinition = "TEXT")
    private String reportedResponse;

    private String demands;

    @Column(name = "requested_amount", precision = 15, scale = 2)
    private BigDecimal requestedAmount;

    @Column(name = "booking_total", length = 100)
    private String bookingTotal;

    @Column(name = "stay_dates", length = 100)
    private String stayDates;

    @Builder.Default
    @Column(name = "severity", length = 50)
    private String severity = "medium"; // urgent, medium, low

    @Column(name = "proof_images", columnDefinition = "TEXT")
    private String proofImages;

    @Builder.Default
    private String status = "PENDING"; // PENDING, INVESTIGATING, RESOLVED, REJECTED

    @Column(name = "timeline", columnDefinition = "TEXT")
    private String timeline;

    @Column(name = "resolution_action", length = 100)
    private String resolutionAction; // refund_guest, charge_guest, mediate_ok, reject

    @Column(name = "resolution_amount", precision = 15, scale = 2)
    private BigDecimal resolutionAmount;

    @Column(name = "admin_solution", columnDefinition = "TEXT")
    private String adminSolution;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.status == null) {
            this.status = "PENDING";
        }
        if (this.severity == null) {
            this.severity = "medium";
        }
        if (this.direction == null) {
            this.direction = "tourist_to_homestay";
        }
        this.updatedAt = LocalDateTime.now();
    }

    public void setStatus(String status) {
        if (status != null) {
            this.status = status.toUpperCase();
        } else {
            this.status = "PENDING";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
