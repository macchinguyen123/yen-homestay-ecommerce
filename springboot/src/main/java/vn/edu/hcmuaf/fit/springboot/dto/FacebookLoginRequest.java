package vn.edu.hcmuaf.fit.springboot.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FacebookLoginRequest {
    /** Email từ Facebook userinfo / Graph API */
    private String email;
    /** Tên đầy đủ từ Facebook */
    private String fullName;
    /** URL ảnh đại diện từ Facebook */
    private String avatar;
    /** Facebook User ID */
    private String facebookId;
    /** Access Token từ Facebook SDK nếu có */
    private String accessToken;
}
