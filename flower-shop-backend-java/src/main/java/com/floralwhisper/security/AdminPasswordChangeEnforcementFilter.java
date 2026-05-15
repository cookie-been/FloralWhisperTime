package com.floralwhisper.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.floralwhisper.service.AuthService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class AdminPasswordChangeEnforcementFilter extends OncePerRequestFilter {
  private final AuthService authService;
  private final ObjectMapper objectMapper;

  public AdminPasswordChangeEnforcementFilter(AuthService authService, ObjectMapper objectMapper) {
    this.authService = authService;
    this.objectMapper = objectMapper;
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    String path = request.getRequestURI();
    if (authentication != null
        && authentication.isAuthenticated()
        && authentication.getName() != null
        && path.startsWith("/api/admin")
        && !path.equals("/api/admin/me")
        && !path.equals("/api/admin/change-password")
        && authService.isPasswordChangeRequired(authentication.getName())) {
      response.setStatus(HttpServletResponse.SC_FORBIDDEN);
      response.setContentType(MediaType.APPLICATION_JSON_VALUE);
      response.setCharacterEncoding("UTF-8");
      objectMapper.writeValue(response.getWriter(), Map.of("message", "首次登录后请先修改管理员密码"));
      return;
    }
    filterChain.doFilter(request, response);
  }
}
