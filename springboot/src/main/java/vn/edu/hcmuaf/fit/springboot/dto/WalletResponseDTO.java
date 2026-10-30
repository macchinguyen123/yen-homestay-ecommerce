package vn.edu.hcmuaf.fit.springboot.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WalletResponseDTO {
    private Long walletId;
    private Long userId;
    private BigDecimal balance;
    private BigDecimal totalCashback;
    private BigDecimal cashbackRate;
    private List<WalletTransactionDTO> transactions;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WalletTransactionDTO {
        private Long id;
        private String title;
        private String date;
        private String amount;
        private BigDecimal rawAmount;
        private String type; // "plus" | "minus"
        private String status;
        private String referenceCode;
    }
}
