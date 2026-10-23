package vn.edu.hcmuaf.fit.springboot.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class GoogleLoginRequest {
    /** Google ID Token trả về từ Google Sign-In ở frontend */
    private String idToken;
}
