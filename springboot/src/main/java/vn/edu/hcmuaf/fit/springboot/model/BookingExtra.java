package vn.edu.hcmuaf.fit.springboot.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "booking_extras")
@IdClass(BookingExtraId.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingExtra {

    @Id
    @Column(name = "booking_id")
    private Long bookingId;

    @Id
    @Column(name = "extra_id")
    private Long extraId;

    private Integer quantity;

    private BigDecimal price;
}
