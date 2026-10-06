package vn.edu.hcmuaf.fit.springboot.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import vn.edu.hcmuaf.fit.springboot.dto.ChangePasswordRequest;
import vn.edu.hcmuaf.fit.springboot.dto.UserProfileDTO;
import vn.edu.hcmuaf.fit.springboot.model.User;
import vn.edu.hcmuaf.fit.springboot.repository.UserRepository;

@Service
@Slf4j
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserProfileDTO getUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + userId));

        return mapToProfileDTO(user);
    }

    public UserProfileDTO getUserProfileByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với Email: " + email));

        return mapToProfileDTO(user);
    }

    public UserProfileDTO updateUserProfile(Long userId, UserProfileDTO dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + userId));

        if (dto.getFullName() != null) user.setFullName(dto.getFullName());
        if (dto.getNickname() != null) user.setNickname(dto.getNickname());
        if (dto.getCccd() != null) user.setCccd(dto.getCccd());
        if (dto.getDobDay() != null) user.setDobDay(dto.getDobDay());
        if (dto.getDobMonth() != null) user.setDobMonth(dto.getDobMonth());
        if (dto.getDobYear() != null) user.setDobYear(dto.getDobYear());
        if (dto.getGender() != null) user.setGender(dto.getGender());
        if (dto.getNationality() != null) user.setNationality(dto.getNationality());
        if (dto.getStreet() != null) user.setStreet(dto.getStreet());
        if (dto.getProvinceCode() != null) user.setProvinceCode(dto.getProvinceCode());
        if (dto.getWard() != null) user.setWard(dto.getWard());
        if (dto.getTaxCode() != null) user.setTaxCode(dto.getTaxCode());
        if (dto.getBizCode() != null) user.setBizCode(dto.getBizCode());
        if (dto.getAvatar() != null) user.setAvatar(dto.getAvatar());
        if (dto.getPhoneNumber() != null) user.setPhoneNumber(dto.getPhoneNumber());
        if (dto.getPhoneVerified() != null) user.setPhoneVerified(dto.getPhoneVerified());

        User savedUser = userRepository.save(user);
        log.info("Cập nhật thông tin cá nhân thành công cho User ID: {}", userId);
        return mapToProfileDTO(savedUser);
    }

    public boolean changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + userId));

        boolean matches = passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())
                || request.getCurrentPassword().equals(user.getPassword());

        if (!matches) {
            throw new RuntimeException("Mật khẩu hiện tại không chính xác!");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        log.info("Đổi mật khẩu thành công cho User ID: {}", userId);
        return true;
    }

    public UserProfileDTO verifyPhone(Long userId, String phoneNumber) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với ID: " + userId));

        if (phoneNumber != null && !phoneNumber.trim().isEmpty()) {
            user.setPhoneNumber(phoneNumber);
        }
        user.setPhoneVerified(true);
        User savedUser = userRepository.save(user);
        log.info("Xác minh số điện thoại thành công cho User ID: {}", userId);
        return mapToProfileDTO(savedUser);
    }

    private UserProfileDTO mapToProfileDTO(User user) {
        return UserProfileDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber() != null ? user.getPhoneNumber() : "+84 912 345 678")
                .fullName(user.getFullName() != null ? user.getFullName() : "Người dùng")
                .nickname(user.getNickname() != null ? user.getNickname() : "")
                .cccd(user.getCccd() != null ? user.getCccd() : "")
                .dobDay(user.getDobDay() != null ? user.getDobDay() : "18")
                .dobMonth(user.getDobMonth() != null ? user.getDobMonth() : "08")
                .dobYear(user.getDobYear() != null ? user.getDobYear() : "1998")
                .gender(user.getGender() != null ? user.getGender() : "nu")
                .nationality(user.getNationality() != null ? user.getNationality() : "VN")
                .street(user.getStreet() != null ? user.getStreet() : "")
                .provinceCode(user.getProvinceCode() != null ? user.getProvinceCode() : "")
                .ward(user.getWard() != null ? user.getWard() : "")
                .taxCode(user.getTaxCode() != null ? user.getTaxCode() : "")
                .bizCode(user.getBizCode() != null ? user.getBizCode() : "")
                .avatar(user.getAvatar() != null ? user.getAvatar() : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80")
                .phoneVerified(user.getPhoneVerified() != null ? user.getPhoneVerified() : true)
                .role(user.getRole())
                .status(user.getStatus())
                .build();
    }
}
