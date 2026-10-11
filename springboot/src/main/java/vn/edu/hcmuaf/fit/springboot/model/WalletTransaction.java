package vn.edu.hcmuaf.fit.springboot.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "wallet_transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WalletTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "transaction_id")
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "date_display")
    private String dateDisplay;

    @Column(name = "amount", precision = 15, scale = 2, nullable = false)
    private BigDecimal amount;

    @Column(name = "amount_display")
    private String amountDisplay;

    @Column(name = "type", length = 10, nullable = false) // "plus" or "minus"
    private String type;

    @Column(name = "status", length = 50) // "Thành công", "Đang xử lý", "Đã chuyển khoản"
    @Builder.Default
    private String status = "Thành công";

    @Column(name = "reference_code")
    private String referenceCode;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
}
