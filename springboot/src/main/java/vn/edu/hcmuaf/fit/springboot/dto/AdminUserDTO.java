package vn.edu.hcmuaf.fit.springboot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

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
        private String nickname;
        private String cccd;
        private String role; // 'TOURIST', 'OWNER', 'ADMIN'
        private String roleText; // 'Khách lưu trú', 'Chủ Homestay (Owner)', 'System Admin'
        private String permission; // 'Người Dùng Phổ Thông', 'Đối Tác Kinh Doanh', 'Toàn Quyền Quản Trị Hệ Thống'
        private String status; // 'ACTIVE', 'BLOCKED'
        private String statusText; // 'Đang hoạt động', 'Bị khóa'
        private Boolean active;
        private String kycStatus; // 'verified', 'unverified'
        private String kycText; // 'Đã xác minh KYC', 'Chưa KYC'
        private String memberTier; // 'SuperHost', 'Thành viên thân thiết', etc.
        private List<String> homestays;
        private Integer homestayCount;
        private Integer bookingsCount;
        private String dobDay;
        private String dobMonth;
        private String dobYear;
        private String gender;
        private String nationality;
        private String street;
        private String province;
        private String ward;
        private String taxCode;
        private String bizCode;
        private Boolean phoneVerified;
        private Boolean emailVerified;
        private String lockReason;
        private String adminNotes;
        private String joinDate;
        private String lastLogin;
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
        private String cccd;
        private String nickname;
        private String avatar;
        private String dobDay;
        private String dobMonth;
        private String dobYear;
        private String gender;
        private String nationality;
        private String street;
        private String province;
        private String ward;
        private String taxCode;
        private String bizCode;
        private Boolean phoneVerified;
        private Boolean emailVerified;
        private String adminNotes;
        private String memberTier;
        private String permission;
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
        private String cccd;
        private String nickname;
        private String avatar;
        private String dobDay;
        private String dobMonth;
        private String dobYear;
        private String gender;
        private String nationality;
        private String street;
        private String province;
        private String ward;
        private String taxCode;
        private String bizCode;
        private Boolean phoneVerified;
        private Boolean emailVerified;
        private String lockReason;
        private String adminNotes;
        private String memberTier;
        private String permission;
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
