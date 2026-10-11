package vn.edu.hcmuaf.fit.springboot.dto;

import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class WithdrawRequestDTO {
    private String bank;
    private String accNum;
    private BigDecimal amount;
    private String pin;
}
