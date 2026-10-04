package vn.edu.hcmuaf.fit.springboot.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import vn.edu.hcmuaf.fit.springboot.dto.LoginRequest;
import vn.edu.hcmuaf.fit.springboot.dto.LoginResponse;
import vn.edu.hcmuaf.fit.springboot.dto.RegisterRequest;
import vn.edu.hcmuaf.fit.springboot.model.User;
import vn.edu.hcmuaf.fit.springboot.repository.UserRepository;

import jakarta.annotation.PostConstruct;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @PostConstruct
    public void initDefaultUsers() {
        // Seed default demo accounts into Supabase database if empty
        if (userRepository.count() == 0) {
            // Demo Tourist user
            User tourist = User.builder()
                    .email("maichi.lehoang@gmail.com")
                    .phoneNumber("0912345678")
                    .fullName("Lê Hoàng Mai Chi")
                    .password(passwordEncoder.encode("123456"))
                    .role("USER")
                    .avatar("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80")
                    .active(true)
                    .build();
            userRepository.save(tourist);

            // Demo Owner user
            User owner = User.builder()
                    .email("chuhoang.homestay@gmail.com")
                    .phoneNumber("0987654321")
                    .fullName("Nguyễn Văn Hoàng (Chủ Homestay)")
                    .password(passwordEncoder.encode("123456"))
                    .role("OWNER")
                    .avatar("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80")
                    .active(true)
                    .build();
            userRepository.save(owner);

            // Demo Admin user
            User admin = User.builder()
                    .email("admin@yenhomestay.com")
                    .phoneNumber("0900000000")
                    .fullName("Quản trị viên YÊN Homestay")
                    .password(passwordEncoder.encode("admin123"))
                    .role("ADMIN")
                    .avatar("https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80")
                    .active(true)
                    .build();
            userRepository.save(admin);
        }
    }

    public LoginResponse login(LoginRequest request) {
        String input = request.getUsername().trim();
        Optional<User> userOpt = userRepository.findByEmailOrPhoneNumber(input, input);

        if (userOpt.isEmpty()) {
            return LoginResponse.builder()
                    .success(false)
                    .message("Tài khoản (Email hoặc SĐT) không tồn tại trong hệ thống!")
                    .build();
        }

        User user = userOpt.get();

        // Check password matching (supports both encoded and plain passwords for smooth transition)
        boolean isMatch = passwordEncoder.matches(request.getPassword(), user.getPassword()) || 
                          request.getPassword().equals(user.getPassword());

        if (!isMatch) {
            return LoginResponse.builder()
                    .success(false)
                    .message("Mật khẩu không chính xác! Vui lòng kiểm tra lại.")
                    .build();
        }

        if (!user.getActive()) {
            return LoginResponse.builder()
                    .success(false)
                    .message("Tài khoản của bạn đã bị khóa hoặc tạm ngưng!")
                    .build();
        }

        return LoginResponse.builder()
                .success(true)
                .message("Đăng nhập thành công!")
                .id(user.getId())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .fullName(user.getFullName())
                .role(user.getRole())
                .avatar(user.getAvatar())
                .token("DEMO_JWT_TOKEN_" + user.getId() + "_" + System.currentTimeMillis())
                .build();
    }

    public LoginResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            return LoginResponse.builder()
                    .success(false)
                    .message("Email này đã được sử dụng!")
                    .build();
        }

        if (request.getPhoneNumber() != null && userRepository.existsByPhoneNumber(request.getPhoneNumber())) {
            return LoginResponse.builder()
                    .success(false)
                    .message("Số điện thoại này đã được sử dụng!")
                    .build();
        }

        String targetRole = request.getRole() != null ? request.getRole().toUpperCase() : "USER";
        if (targetRole.equals("HOST") || targetRole.equals("TOURIST")) {
            targetRole = targetRole.equals("HOST") ? "OWNER" : "USER";
        }

        User newUser = User.builder()
                .email(request.getEmail())
                .phoneNumber(request.getPhoneNumber())
                .fullName(request.getFullName())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(targetRole)
                .active(true)
                .build();

        userRepository.save(newUser);

        return LoginResponse.builder()
                .success(true)
                .message("Đăng ký tài khoản thành công!")
                .id(newUser.getId())
                .email(newUser.getEmail())
                .fullName(newUser.getFullName())
                .role(newUser.getRole())
                .build();
    }
}
