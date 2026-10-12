package vn.edu.hcmuaf.fit.springboot.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "guest_tasks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GuestTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "task_id")
    private Long id;

    @Column(name = "homestay_id", nullable = false)
    private Long homestayId;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "reward_note")
    private String rewardNote;

    @Column(name = "icon")
    private String icon;

    @Column(name = "reward_type")
    private String rewardType;

    @Column(name = "reward_value")
    private String rewardValue;

    @Column(name = "reward_extra")
    private String rewardExtra;

    @Column(name = "from_date")
    private String fromDate;

    @Column(name = "to_date")
    private String toDate;

    @Builder.Default
    @Column(name = "need_photo")
    private Boolean needPhoto = true;

    @Builder.Default
    @Column(name = "auto_approve")
    private Boolean autoApprove = false;

    @Builder.Default
    @Column(name = "given_count")
    private Integer givenCount = 0;

    @Builder.Default
    private String status = "ACTIVE";

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
}
