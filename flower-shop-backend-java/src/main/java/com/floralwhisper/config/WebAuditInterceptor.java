package com.floralwhisper.config;

import com.floralwhisper.audit.AuditContext;
import com.floralwhisper.audit.AuditContextHolder;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class WebAuditInterceptor implements HandlerInterceptor {
  @Override
  public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    String operatorName = authentication == null ? "" : String.valueOf(authentication.getPrincipal());
    String forwardedFor = request.getHeader("X-Forwarded-For");
    String ipAddress = forwardedFor == null || forwardedFor.isBlank() ? request.getRemoteAddr() : forwardedFor.split(",")[0].trim();

    AuditContextHolder.set(AuditContext.builder()
        .operatorName(operatorName)
        .ipAddress(ipAddress)
        .userAgent(request.getHeader("User-Agent"))
        .requestPath(request.getRequestURI())
        .requestMethod(request.getMethod())
        .build());
    return true;
  }

  @Override
  public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
    AuditContextHolder.clear();
  }
}
