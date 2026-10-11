package vn.edu.hcmuaf.fit.springboot.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateBankRequestDTO {
    private String bankName;
    private String accountNumber;
    private String accountHolder;
}
