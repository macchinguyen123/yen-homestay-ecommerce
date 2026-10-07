package vn.edu.hcmuaf.fit.springboot.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.hcmuaf.fit.springboot.model.PasswordResetToken;

import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByEmailAndTokenAndUsedFalse(String email, String token);

    Optional<PasswordResetToken> findTopByEmailAndUsedFalseOrderByExpiryDateDesc(String email);

    void deleteByEmail(String email);
}
