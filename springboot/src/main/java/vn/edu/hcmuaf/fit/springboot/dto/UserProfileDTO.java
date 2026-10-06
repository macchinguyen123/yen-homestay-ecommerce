package vn.edu.hcmuaf.fit.springboot.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileDTO {
    private Long id;
    private String email;
    private String phoneNumber;
    private String fullName;
    private String nickname;
    private String cccd;
    private String dobDay;
    private String dobMonth;
    private String dobYear;
    private String gender;
    private String nationality;
    private String street;
    private String provinceCode;
    private String ward;
    private String taxCode;
    private String bizCode;
    private String avatar;
    private Boolean phoneVerified;
    private String role;
    private String status;
}
