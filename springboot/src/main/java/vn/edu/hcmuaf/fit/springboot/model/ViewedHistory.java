package vn.edu.hcmuaf.fit.springboot.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "viewed_histories",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_user_homestay", columnNames = {"user_id", "homestay_id"})
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ViewedHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "history_id")
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "homestay_id", nullable = false)
    private Long homestayId;

    @Column(name = "viewed_at", nullable = false)
    private LocalDateTime viewedAt;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "homestay_id", insertable = false, updatable = false)
    private Homestay homestay;

    @PrePersist
    protected void onCreate() {
        if (this.viewedAt == null) {
            this.viewedAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.viewedAt = LocalDateTime.now();
    }
}
