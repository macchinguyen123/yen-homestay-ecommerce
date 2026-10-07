package vn.edu.hcmuaf.fit.springboot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthMessageResponse {
    private boolean success;
    private String message;
    private String email;
}
