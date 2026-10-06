package vn.edu.hcmuaf.fit.springboot.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import vn.edu.hcmuaf.fit.springboot.dto.AdminUserDTO.*;
import vn.edu.hcmuaf.fit.springboot.model.User;
import vn.edu.hcmuaf.fit.springboot.repository.UserRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserStatsDTO getUserStats() {
        long totalUsers = userRepository.count();
        long totalGuests = userRepository.countByRoleIgnoreCase("TOURIST") + userRepository.countByRoleIgnoreCase("USER");
        long totalHosts = userRepository.countByRoleIgnoreCase("OWNER");
        long activeUsers = userRepository.countByStatusIgnoreCase("ACTIVE");
        long blockedUsers = userRepository.countByStatusIgnoreCase("BLOCKED");

        return UserStatsDTO.builder()
                .totalUsers(totalUsers)
                .totalGuests(totalGuests)
                .totalHosts(totalHosts)
                .activeUsers(activeUsers)
                .blockedUsers(blockedUsers)
                .build();
    }

    public List<UserResponseDTO> getUsers(String role, String status, String keyword) {
        List<User> allUsers = userRepository.findAll();

        return allUsers.stream()
                .filter(u -> {
                    // Filter by role
                    if (role != null && !role.trim().isEmpty() && !"all".equalsIgnoreCase(role)) {
                        String userRole = u.getRole() != null ? u.getRole().toUpperCase() : "";
                        if ("guest".equalsIgnoreCase(role) || "tourist".equalsIgnoreCase(role)) {
                            if (!userRole.equals("TOURIST") && !userRole.equals("USER")) return false;
                        } else if ("host".equalsIgnoreCase(role) || "owner".equalsIgnoreCase(role)) {
                            if (!userRole.equals("OWNER")) return false;
                        } else if ("admin".equalsIgnoreCase(role)) {
                            if (!userRole.equals("ADMIN")) return false;
                        }
                    }
                    return true;
                })
                .filter(u -> {
                    // Filter by status
                    if (status != null && !status.trim().isEmpty() && !"all".equalsIgnoreCase(status)) {
                        String userStatus = u.getStatus() != null ? u.getStatus().toUpperCase() : "ACTIVE";
                        if ("active".equalsIgnoreCase(status)) {
                            if (!userStatus.equals("ACTIVE")) return false;
                        } else if ("blocked".equalsIgnoreCase(status)) {
                            if (!userStatus.equals("BLOCKED") && !userStatus.equals("INACTIVE")) return false;
                        }
                    }
                    return true;
                })
                .filter(u -> {
                    // Filter by keyword
                    if (keyword != null && !keyword.trim().isEmpty()) {
                        String kw = keyword.trim().toLowerCase();
                        boolean matchName = u.getFullName() != null && u.getFullName().toLowerCase().contains(kw);
                        boolean matchEmail = u.getEmail() != null && u.getEmail().toLowerCase().contains(kw);
                        boolean matchPhone = u.getPhoneNumber() != null && u.getPhoneNumber().toLowerCase().contains(kw);
                        return matchName || matchEmail || matchPhone;
                    }
                    return true;
                })
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public UserResponseDTO getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + id));
        return mapToDTO(user);
    }

    public UserResponseDTO createUser(UserCreateRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new RuntimeException("Email '" + req.getEmail() + "' đã tồn tại trong hệ thống!");
        }

        String role = normalizeRole(req.getRole());
        String rawPassword = req.getPassword() != null && !req.getPassword().trim().isEmpty() ? req.getPassword() : "12345678";
        String encodedPassword = passwordEncoder.encode(rawPassword);

        String status = req.getStatus() != null && !req.getStatus().trim().isEmpty() ? req.getStatus().toUpperCase() : "ACTIVE";

        User user = User.builder()
                .email(req.getEmail())
                .password(encodedPassword)
                .fullName(req.getFullName())
                .phoneNumber(req.getPhoneNumber())
                .role(role)
                .status(status)
                .active("ACTIVE".equalsIgnoreCase(status))
                .build();

        User saved = userRepository.save(user);
        log.info("Admin created new user ID: {}, Email: {}, Role: {}", saved.getId(), saved.getEmail(), saved.getRole());
        return mapToDTO(saved);
    }

    public UserResponseDTO updateUser(Long id, UserUpdateRequest req) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + id));

        if (req.getFullName() != null) user.setFullName(req.getFullName());
        if (req.getEmail() != null) user.setEmail(req.getEmail());
        if (req.getPhoneNumber() != null) user.setPhoneNumber(req.getPhoneNumber());
        if (req.getRole() != null) user.setRole(normalizeRole(req.getRole()));
        if (req.getStatus() != null) {
            user.setStatus(req.getStatus().toUpperCase());
            user.setActive("ACTIVE".equalsIgnoreCase(req.getStatus()));
        }
        if (req.getPassword() != null && !req.getPassword().trim().isEmpty()) {
            user.setPassword(passwordEncoder.encode(req.getPassword()));
        }

        User updated = userRepository.save(user);
        log.info("Admin updated user ID: {}", updated.getId());
        return mapToDTO(updated);
    }

    public UserResponseDTO updateUserStatus(Long id, String status) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + id));

        String newStatus = status != null ? status.toUpperCase() : "ACTIVE";
        user.setStatus(newStatus);
        user.setActive("ACTIVE".equalsIgnoreCase(newStatus));

        User updated = userRepository.save(user);
        log.info("Admin updated user ID: {} status to: {}", updated.getId(), newStatus);
        return mapToDTO(updated);
    }

    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy người dùng với ID: " + id);
        }
        userRepository.deleteById(id);
        log.info("Admin deleted user ID: {}", id);
    }

    private String normalizeRole(String role) {
        if (role == null) return "TOURIST";
        String r = role.trim().toUpperCase();
        if ("GUEST".equals(r) || "USER".equals(r) || "TOURIST".equals(r)) return "TOURIST";
        if ("HOST".equals(r) || "OWNER".equals(r)) return "OWNER";
        if ("ADMIN".equals(r)) return "ADMIN";
        return r;
    }

    private UserResponseDTO mapToDTO(User u) {
        return UserResponseDTO.builder()
                .id(u.getId())
                .email(u.getEmail())
                .fullName(u.getFullName())
                .phoneNumber(u.getPhoneNumber())
                .avatar(u.getAvatar())
                .role(u.getRole() != null ? u.getRole() : "TOURIST")
                .status(u.getStatus() != null ? u.getStatus() : "ACTIVE")
                .active(u.getActive())
                .createdAt(u.getCreatedAt())
                .build();
    }
}
