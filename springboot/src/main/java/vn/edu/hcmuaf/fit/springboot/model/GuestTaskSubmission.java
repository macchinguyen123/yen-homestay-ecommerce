package vn.edu.hcmuaf.fit.springboot.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "guest_task_submissions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GuestTaskSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "submission_id")
    private Long id;

    @Column(name = "submission_code")
    private String submissionCode;

    @Column(name = "homestay_id", nullable = false)
    private Long homestayId;

    @Column(name = "tourist_id")
    private Long touristId;

    @Column(name = "guest_name")
    private String guestName;

    @Column(name = "room_name")
    private String roomName;

    @Column(name = "task_id")
    private Long taskId;

    @Column(name = "task_title")
    private String taskTitle;

    @Column(name = "task_type")
    private String taskType;

    @Column(name = "review_text", columnDefinition = "TEXT")
    private String reviewText;

    @Column(name = "reward_text")
    private String rewardText;

    @Builder.Default
    @Column(name = "photos_count")
    private Integer photosCount = 1;

    @Column(name = "guest_avatar", columnDefinition = "TEXT")
    private String guestAvatar;

    @Column(name = "submission_image", columnDefinition = "TEXT")
    private String submissionImage;

    @Builder.Default
    @Column(name = "status")
    private String status = "pending";

    @Column(name = "reject_reason")
    private String rejectReason;

    @Column(name = "retake_reason")
    private String retakeReason;

    @Column(name = "retake_deadline")
    private String retakeDeadline;

    @Column(name = "owner_note", columnDefinition = "TEXT")
    private String ownerNote;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @PrePersist
    protected void onCreate() {
        if (this.submittedAt == null) {
            this.submittedAt = LocalDateTime.now();
        }
        if (this.status == null) {
            this.status = "pending";
        }
    }
}
