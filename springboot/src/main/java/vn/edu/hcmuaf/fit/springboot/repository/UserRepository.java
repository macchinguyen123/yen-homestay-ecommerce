package vn.edu.hcmuaf.fit.springboot.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.hcmuaf.fit.springboot.model.User;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByPhoneNumber(String phoneNumber);
    
    // Find by email or phone number for flexible login
    Optional<User> findByEmailOrPhoneNumber(String email, String phoneNumber);
    
    boolean existsByEmail(String email);
    boolean existsByPhoneNumber(String phoneNumber);

    long countByRole(String role);
    long countByRoleIgnoreCase(String role);
    long countByStatusIgnoreCase(String status);
    long countByRoleIgnoreCaseAndStatusIgnoreCase(String role, String status);

    java.util.List<User> findByRoleIgnoreCase(String role);
    java.util.List<User> findByStatusIgnoreCase(String status);
    java.util.List<User> findByRoleIgnoreCaseAndStatusIgnoreCase(String role, String status);
}


