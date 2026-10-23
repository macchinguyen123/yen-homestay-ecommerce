package vn.edu.hcmuaf.fit.springboot.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class GoogleUserInfoRequest {
    /** Email từ Google userinfo */
    private String email;
    /** Tên đầy đủ từ Google */
    private String fullName;
    /** URL ảnh đại diện từ Google */
    private String avatar;
    /** Google Subject ID (unique user ID) */
    private String googleId;
}
