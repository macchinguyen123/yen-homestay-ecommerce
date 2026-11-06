package vn.edu.hcmuaf.fit.springboot.config;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import vn.edu.hcmuaf.fit.springboot.model.User;
import vn.edu.hcmuaf.fit.springboot.repository.UserRepository;
import vn.edu.hcmuaf.fit.springboot.service.SessionTokenService;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class SessionTokenFilter extends OncePerRequestFilter {
    private final SessionTokenService tokens;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        Long userId = null;
        if (header != null && header.startsWith("Bearer ")) {
            userId = tokens.verify(header.substring(7).trim());
        }

        if (userId != null) {
            try {
                User user = userRepository.findById(userId).orElse(null);
                if (user != null && !"BLOCKED".equalsIgnoreCase(user.getStatus())) {
                    String rawRole = user.getRole() != null ? user.getRole().trim().toUpperCase() : "TOURIST";
                    String normalizedRole = "ADMIN".equals(rawRole) ? "ADMIN" : (("OWNER".equals(rawRole) || "HOST".equals(rawRole)) ? "OWNER" : "TOURIST");

                    List<SimpleGrantedAuthority> authorities = new ArrayList<>();
                    authorities.add(new SimpleGrantedAuthority("ROLE_" + normalizedRole));
                    if ("ADMIN".equals(normalizedRole)) {
                        authorities.add(new SimpleGrantedAuthority("ROLE_OWNER"));
                        authorities.add(new SimpleGrantedAuthority("ROLE_TOURIST"));
                    } else if ("OWNER".equals(normalizedRole)) {
                        authorities.add(new SimpleGrantedAuthority("ROLE_TOURIST"));
                    }

                    UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(user.getId().toString(), null, authorities);
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            } catch (Exception e) {
                log.warn("[SessionTokenFilter] Lỗi khi nạp quyền cho user ID {}: {}", userId, e.getMessage());
            }
        }

        chain.doFilter(request, response);
    }
}


