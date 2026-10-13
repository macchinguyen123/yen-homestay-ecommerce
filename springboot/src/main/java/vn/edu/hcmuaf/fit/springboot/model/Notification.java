package vn.edu.hcmuaf.fit.springboot.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications", indexes = @Index(name = "idx_notifications_user_created", columnList = "user_id, created_at"))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Notification {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "notification_id")
    private Long id;
    @Column(name = "user_id", nullable = false) private Long userId;
    @Column(nullable = false, length = 200) private String title;
    @Column(nullable = false, columnDefinition = "TEXT") private String message;
    @Column(nullable = false, length = 50) private String type;
    @Column(name = "reference_id") private Long referenceId;
    @Column(length = 500) private String link;
    @Column(name = "is_read", nullable = false) @Builder.Default private Boolean read = false;
    @Column(name = "created_at", nullable = false) @Builder.Default private LocalDateTime createdAt = LocalDateTime.now();
}
