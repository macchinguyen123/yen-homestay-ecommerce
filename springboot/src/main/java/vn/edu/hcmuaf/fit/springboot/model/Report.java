package vn.edu.hcmuaf.fit.springboot.model;

import jakarta.persistence.*;
import lombok.*;
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

    @Column(name = "booking_id")
    private Long bookingId;

    @Column(name = "reporter_id", nullable = false)
    private Long reporterId;

    @Column(name = "reported_homestay_id")
    private Long reportedHomestayId;

    @Column(name = "report_type")
    private String reportType;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name = "proof_images", columnDefinition = "TEXT")
    private String proofImages;

    @Builder.Default
    private String status = "PENDING";

    @Column(name = "admin_solution", columnDefinition = "TEXT")
    private String adminSolution;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
}
