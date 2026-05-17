package com.floralwhisper.security;

import com.floralwhisper.config.AppProperties;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
  public static final String TOKEN_EXPIRED_ATTRIBUTE = "jwt.tokenExpired";
  private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

  private final JwtService jwtService;
  private final AppProperties properties;

  public JwtAuthenticationFilter(JwtService jwtService, AppProperties properties) {
    this.jwtService = jwtService;
    this.properties = properties;
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {
    String header = request.getHeader("Authorization");
    if (header != null && header.startsWith("Bearer ")) {
      try {
        String username = jwtService.parseUsername(header.substring(7));
        if (properties.getAdmin().getUsername().equals(username)) {
          UsernamePasswordAuthenticationToken authentication =
              new UsernamePasswordAuthenticationToken(username, null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
          SecurityContextHolder.getContext().setAuthentication(authentication);
        }
      } catch (ExpiredJwtException error) {
        request.setAttribute(TOKEN_EXPIRED_ATTRIBUTE, true);
        SecurityContextHolder.clearContext();
      } catch (JwtException error) {
        log.warn(
            "JWT authentication failed: type={}, path={}",
            error.getClass().getSimpleName(),
            request.getRequestURI());
        SecurityContextHolder.clearContext();
      }
    }
    filterChain.doFilter(request, response);
  }
}
