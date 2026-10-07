package vn.edu.hcmuaf.fit.springboot.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.edu.hcmuaf.fit.springboot.dto.*;
import vn.edu.hcmuaf.fit.springboot.service.AuthService;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        if (!response.isSuccess()) {
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<LoginResponse> register(@RequestBody RegisterRequest request) {
        LoginResponse response = authService.register(request);
        if (!response.isSuccess()) {
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/verify")
    public ResponseEntity<LoginResponse> verify(@RequestParam String token) {
        LoginResponse response = authService.verifyEmail(token);
        if (!response.isSuccess()) {
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }

    /**
     * API Quên mật khẩu: Kiểm tra email trong hệ thống và gửi mã OTP nếu có
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<AuthMessageResponse> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        AuthMessageResponse response = authService.forgotPassword(request);
        if (!response.isSuccess()) {
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }

    /**
     * API Xác thực mã OTP
     */
    @PostMapping("/verify-reset-otp")
    public ResponseEntity<AuthMessageResponse> verifyResetOtp(@RequestBody VerifyResetOtpRequest request) {
        AuthMessageResponse response = authService.verifyResetOtp(request);
        if (!response.isSuccess()) {
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }

    /**
     * API Đặt lại mật khẩu mới
     */
    @PostMapping("/reset-password")
    public ResponseEntity<AuthMessageResponse> resetPassword(@RequestBody ResetPasswordRequest request) {
        AuthMessageResponse response = authService.resetPassword(request);
        if (!response.isSuccess()) {
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }
}
