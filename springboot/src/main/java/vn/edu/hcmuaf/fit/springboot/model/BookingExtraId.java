package vn.edu.hcmuaf.fit.springboot.model;

import lombok.*;
import java.io.Serializable;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class BookingExtraId implements Serializable {
    private Long bookingId;
    private Long extraId;
}
