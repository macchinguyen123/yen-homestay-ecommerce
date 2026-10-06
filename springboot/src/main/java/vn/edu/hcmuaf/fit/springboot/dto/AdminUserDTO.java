package vn.edu.hcmuaf.fit.springboot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

public class AdminUserDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserStatsDTO {
        private long totalUsers;
        private long totalGuests;
        private long totalHosts;
        private long activeUsers;
        private long blockedUsers;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserResponseDTO {
        private Long id;
        private String email;
        private String fullName;
        private String phoneNumber;
        private String avatar;
        private String role; // 'TOURIST', 'OWNER', 'ADMIN'
        private String status; // 'ACTIVE', 'BLOCKED'
        private Boolean active;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserCreateRequest {
        private String email;
        private String password;
        private String fullName;
        private String phoneNumber;
        private String role;
        private String status;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserUpdateRequest {
        private String fullName;
        private String email;
        private String phoneNumber;
        private String role;
        private String status;
        private String password;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserStatusRequest {
        private String status; // 'ACTIVE' or 'BLOCKED'
        private String reason;
        private String duration;
    }
}
