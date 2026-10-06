package vn.edu.hcmuaf.fit.springboot.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.edu.hcmuaf.fit.springboot.dto.ChangePasswordRequest;
import vn.edu.hcmuaf.fit.springboot.dto.UserProfileDTO;
import vn.edu.hcmuaf.fit.springboot.service.UserService;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/{id}")
    public ResponseEntity<?> getUserProfile(@PathVariable Long id) {
        try {
            UserProfileDTO profile = userService.getUserProfile(id);
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<?> getUserProfileByEmail(@PathVariable String email) {
        try {
            UserProfileDTO profile = userService.getUserProfileByEmail(email);
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUserProfile(@PathVariable Long id, @RequestBody UserProfileDTO dto) {
        try {
            UserProfileDTO updatedProfile = userService.updateUserProfile(id, dto);
            return ResponseEntity.ok(updatedProfile);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PostMapping("/{id}/password")
    public ResponseEntity<?> changePassword(@PathVariable Long id, @RequestBody ChangePasswordRequest request) {
        try {
            userService.changePassword(id, request);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Đổi mật khẩu thành công!");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/{id}/verify-phone")
    public ResponseEntity<?> verifyPhone(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            String phoneNumber = body.get("phoneNumber");
            UserProfileDTO updatedProfile = userService.verifyPhone(id, phoneNumber);
            return ResponseEntity.ok(updatedProfile);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
}
