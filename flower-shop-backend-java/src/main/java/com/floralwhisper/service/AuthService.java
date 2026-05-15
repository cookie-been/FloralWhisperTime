package com.floralwhisper.service;

import com.floralwhisper.audit.AuditLogCommand;
import com.floralwhisper.audit.AuditLogService;
import com.floralwhisper.common.ApiException;
import com.floralwhisper.config.AppProperties;
import com.floralwhisper.dto.LoginRequest;
import com.floralwhisper.dto.LoginResponse;
import com.floralwhisper.security.JwtService;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
  private final AppProperties properties;
  private final JwtService jwtService;
  private final AuditLogService auditLogService;

  public AuthService(AppProperties properties, JwtService jwtService, AuditLogService auditLogService) {
    this.properties = properties;
    this.jwtService = jwtService;
    this.auditLogService = auditLogService;
  }

  public LoginResponse login(LoginRequest request) {
    String username = request.getUsername() == null ? "" : request.getUsername();
    String password = request.getPassword() == null ? "" : request.getPassword();
    if (!properties.getAdmin().getUsername().equals(username) || !properties.getAdmin().getPassword().equals(password)) {
      auditLogService.record(AuditLogCommand.builder()
          .module("AUTH")
          .action("LOGIN")
          .targetType("AUTH")
          .targetId(username.isBlank() ? "unknown" : username)
          .requestSummary(Map.of("username", username))
          .success(false)
          .errorMessage("账号或密码错误")
          .build());
      throw new ApiException(HttpStatus.UNAUTHORIZED, "账号或密码错误");
    }
    LoginResponse response = new LoginResponse(jwtService.createToken(username), username);
    auditLogService.record(AuditLogCommand.builder()
        .module("AUTH")
        .action("LOGIN")
        .targetType("AUTH")
        .targetId(username)
        .requestSummary(Map.of("username", username))
        .afterSnapshot(Map.of("username", username, "result", "success"))
        .success(true)
        .build());
    return response;
  }

  public Map<String, String> currentAdmin() {
    return Map.of("username", properties.getAdmin().getUsername());
  }
}
