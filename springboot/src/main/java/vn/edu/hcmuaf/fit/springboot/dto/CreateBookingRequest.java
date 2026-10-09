package vn.edu.hcmuaf.fit.springboot.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateBookingRequest {
    private Long touristId;
    private Long homestayId;
    private Long roomId;
    private Long voucherId;
    private LocalDate checkInDate;
    private LocalDate checkOutDate;
    private Integer guestsCount;
    private BigDecimal totalPrice;
    private BigDecimal discountAmount;
    private String paymentType;
    private BigDecimal depositAmount;
    private BigDecimal remainingAmount;
    private String depositStatus;
    private String status;
    private String customerName;
    private String customerPhone;
    private String customerEmail;
    private String paymentMethod;
}
