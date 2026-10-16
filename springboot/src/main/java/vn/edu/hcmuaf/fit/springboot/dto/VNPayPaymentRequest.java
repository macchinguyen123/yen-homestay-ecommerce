package vn.edu.hcmuaf.fit.springboot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VNPayPaymentRequest {
    private String bookingCode;
    private Long amount;
    private String orderInfo;
    private String returnUrl;
    private String bankCode;
}
