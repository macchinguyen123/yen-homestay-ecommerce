package vn.edu.hcmuaf.fit.springboot.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String password;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "phone")
    private String phoneNumber;

    private String avatar;

    @Column(name = "nickname")
    private String nickname;

    @Column(name = "cccd")
    private String cccd;

    @Column(name = "dob_day")
    private String dobDay;

    @Column(name = "dob_month")
    private String dobMonth;

    @Column(name = "dob_year")
    private String dobYear;

    @Column(name = "gender")
    private String gender;

    @Column(name = "nationality")
    private String nationality;

    @Column(name = "street")
    private String street;

    @Column(name = "province_code")
    private String provinceCode;

    @Column(name = "ward")
    private String ward;

    @Column(name = "tax_code")
    private String taxCode;

    @Column(name = "biz_code")
    private String bizCode;

    @Column(name = "phone_verified")
    @Builder.Default
    private Boolean phoneVerified = false;

    @Column(nullable = false)
    private String role; // 'USER', 'OWNER', 'ADMIN'

    @Column(name = "status")
    @Builder.Default
    private String status = "ACTIVE";

    @Transient
    @Builder.Default
    private Boolean active = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        if (this.status == null) {
            this.status = "ACTIVE";
        }
    }

    public Boolean getActive() {
        if (status != null) {
            return "ACTIVE".equalsIgnoreCase(status) || "TRUE".equalsIgnoreCase(status) || "1".equals(status);
        }
        return active != null ? active : true;
    }

    public void setActive(Boolean active) {
        this.active = active;
        if (active != null && !active) {
            this.status = "INACTIVE";
        } else {
            this.status = "ACTIVE";
        }
    }
}

