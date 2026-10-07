package vn.edu.hcmuaf.fit.springboot.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.edu.hcmuaf.fit.springboot.dto.AdminUserDTO.*;
import vn.edu.hcmuaf.fit.springboot.service.AdminUserService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/admin/users", "/api/public/admin/users"})
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping("/stats")
    public ResponseEntity<UserStatsDTO> getUserStats() {
        return ResponseEntity.ok(adminUserService.getUserStats());
    }

    @GetMapping
    public ResponseEntity<List<UserResponseDTO>> getUsers(
            @RequestParam(name = "role", defaultValue = "all") String role,
            @RequestParam(name = "status", defaultValue = "all") String status,
            @RequestParam(name = "keyword", required = false) String keyword) {
        return ResponseEntity.ok(adminUserService.getUsers(role, status, keyword));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(adminUserService.getUserById(id));
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody UserCreateRequest req) {
        try {
            return ResponseEntity.ok(adminUserService.createUser(req));
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody UserUpdateRequest req) {
        try {
            return ResponseEntity.ok(adminUserService.updateUser(id, req));
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateUserStatus(@PathVariable Long id, @RequestBody UserStatusRequest req) {
        try {
            return ResponseEntity.ok(adminUserService.updateUserStatusWithReason(id, req.getStatus(), req.getReason(), req.getDuration()));
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            adminUserService.deleteUser(id);
            Map<String, Object> res = new HashMap<>();
            res.put("success", true);
            res.put("message", "Đã xóa người dùng với ID: " + id);
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            Map<String, String> err = new HashMap<>();
            err.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }
}
