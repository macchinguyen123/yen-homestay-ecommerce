package vn.edu.hcmuaf.fit.springboot.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_wallets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserWallet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "wallet_id")
    private Long id;

    @Column(name = "user_id", unique = true, nullable = false)
    private Long userId;

    @Column(name = "balance", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal balance = BigDecimal.valueOf(350000);

    @Column(name = "total_cashback", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal totalCashback = BigDecimal.valueOf(1250000);

    @Column(name = "cashback_rate", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal cashbackRate = BigDecimal.valueOf(5.0);

    @Column(name = "bank_name")
    @Builder.Default
    private String bankName = "Vietcombank";

    @Column(name = "account_number")
    @Builder.Default
    private String accountNumber = "991203004005";

    @Column(name = "account_holder")
    @Builder.Default
    private String accountHolder = "Lê Hoàng Mai Chi";

    @Column(name = "is_linked")
    @Builder.Default
    private Boolean isLinked = true;

    @Column(name = "wallet_pin")
    @Builder.Default
    private String walletPin = "123456";

    @Column(name = "is_pin_set")
    @Builder.Default
    private Boolean isPinSet = true;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
