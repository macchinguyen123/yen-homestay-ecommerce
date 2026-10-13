package vn.edu.hcmuaf.fit.springboot.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.hcmuaf.fit.springboot.model.User;
import vn.edu.hcmuaf.fit.springboot.model.VerificationToken;
import vn.edu.hcmuaf.fit.springboot.repository.UserRepository;
import vn.edu.hcmuaf.fit.springboot.repository.VerificationTokenRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class VerificationTokenCleanupService {

    private final VerificationTokenRepository tokenRepository;
    private final UserRepository userRepository;

    @Scheduled(fixedDelay = 60_000)
    @Transactional
    public void deleteExpiredInactiveRegistrations() {
        List<VerificationToken> expiredTokens = tokenRepository.findByExpiryDateBefore(LocalDateTime.now());
        for (VerificationToken token : expiredTokens) {
            User user = token.getUser();
            tokenRepository.delete(token);
            if (user != null && !Boolean.TRUE.equals(user.getActive())) {
                userRepository.delete(user);
                log.info("Deleted inactive registration after verification token expired: {}", user.getEmail());
            }
        }
    }
}
