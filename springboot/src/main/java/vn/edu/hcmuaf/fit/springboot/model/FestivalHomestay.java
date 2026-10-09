package vn.edu.hcmuaf.fit.springboot.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "festival_homestays")
@Getter @Setter @NoArgsConstructor
public class FestivalHomestay {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "festival_homestay_id")
    private Long id;
    @Column(name = "festival_id", nullable = false) private Long festivalId;
    @Column(name = "homestay_id", nullable = false) private Long homestayId;
    @Column(name = "display_order", nullable = false) private Integer displayOrder = 0;
    @Column(name = "distance_label") private String distanceLabel;
}
