package vn.edu.hcmuaf.fit.springboot.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginRequest {
    private String username; // Email or phone number
    private String password;
    private String role;     // Optional: 'tourist' / 'USER' or 'owner' / 'OWNER'
}
