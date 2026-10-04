package vn.edu.hcmuaf.fit.springboot.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponse {
    private boolean success;
    private String message;
    private Long id;
    private String email;
    private String phoneNumber;
    private String fullName;
    private String role;
    private String avatar;
    private String token;
}
