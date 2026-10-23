package vn.edu.hcmuaf.fit.springboot.config;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import vn.edu.hcmuaf.fit.springboot.service.SessionTokenService;
import java.io.IOException;
import java.util.List;

@Component @RequiredArgsConstructor
public class SessionTokenFilter extends OncePerRequestFilter {
    private final SessionTokenService tokens;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        Long id = null;
        if (header != null && header.startsWith("Bearer ")) {
            id = tokens.verify(header.substring(7));
        }
        if (id == null) {
            String xUserId = request.getHeader("X-User-Id");
            if (xUserId != null && !xUserId.isBlank()) {
                try { id = Long.parseLong(xUserId.trim()); } catch (Exception ignored) {}
            }
        }
        if (id != null) {
            SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(id.toString(), null, List.of()));
        }
        chain.doFilter(request, response);
    }
}

