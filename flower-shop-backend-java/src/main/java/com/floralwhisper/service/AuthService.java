package com.floralwhisper.service;

import com.floralwhisper.audit.AuditLogCommand;
import com.floralwhisper.audit.AuditLogService;
import com.floralwhisper.common.ApiException;
import com.floralwhisper.config.AppProperties;
import com.floralwhisper.dto.AdminPasswordChangeRequest;
import com.floralwhisper.dto.AdminPasswordChangeResponse;
import com.floralwhisper.dto.AdminSessionResponse;
import com.floralwhisper.dto.LoginRequest;
import com.floralwhisper.dto.LoginResponse;
import com.floralwhisper.entity.AdminSecurityState;
import com.floralwhisper.mapper.AdminSecurityStateMapper;
import com.floralwhisper.security.JwtService;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HexFormat;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
  private static final long SINGLETON_ID = 1L;
  private final AppProperties properties;
  private final JwtService jwtService;
  private final AuditLogService auditLogService;
  private final AdminSecurityStateMapper adminSecurityStateMapper;
  private final Clock clock;
  private final ZoneId zoneId;

  public AuthService(
      AppProperties properties,
      JwtService jwtService,
      AuditLogService auditLogService,
      AdminSecurityStateMapper adminSecurityStateMapper) {
    this(properties, jwtService, auditLogService, adminSecurityStateMapper, Clock.systemDefaultZone(), ZoneId.systemDefault());
  }

  AuthService(
      AppProperties properties,
      JwtService jwtService,
      AuditLogService auditLogService,
      AdminSecurityStateMapper adminSecurityStateMapper,
      Clock clock,
      ZoneId zoneId) {
    this.properties = properties;
    this.jwtService = jwtService;
    this.auditLogService = auditLogService;
    this.adminSecurityStateMapper = adminSecurityStateMapper;
    this.clock = clock;
    this.zoneId = zoneId;
  }

  public LoginResponse login(LoginRequest request) {
    String username = request.getUsername() == null ? "" : request.getUsername();
    String password = request.getPassword() == null ? "" : request.getPassword();
    AdminSecurityState state = ensureAdminSecurityState();
    if (!properties.getAdmin().getUsername().equals(username) || !passwordMatches(state, password)) {
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
    boolean requirePasswordChange = Boolean.TRUE.equals(state.getRequirePasswordChange());
    LoginResponse response = new LoginResponse(jwtService.createToken(username), username, requirePasswordChange);
    auditLogService.record(AuditLogCommand.builder()
        .module("AUTH")
        .action("LOGIN")
        .targetType("AUTH")
        .targetId(username)
        .requestSummary(Map.of("username", username))
        .afterSnapshot(Map.of("username", username, "result", "success", "requirePasswordChange", requirePasswordChange))
        .success(true)
        .build());
    return response;
  }

  public AdminSessionResponse currentAdmin() {
    AdminSecurityState state = ensureAdminSecurityState();
    AdminSessionResponse response = new AdminSessionResponse();
    response.setUsername(properties.getAdmin().getUsername());
    response.setRequirePasswordChange(Boolean.TRUE.equals(state.getRequirePasswordChange()));
    return response;
  }

  public boolean isPasswordChangeRequired(String username) {
    if (!properties.getAdmin().getUsername().equals(username)) {
      return false;
    }
    return Boolean.TRUE.equals(ensureAdminSecurityState().getRequirePasswordChange());
  }

  public AdminPasswordChangeResponse changePassword(String username, AdminPasswordChangeRequest request) {
    if (!properties.getAdmin().getUsername().equals(username)) {
      throw new ApiException(HttpStatus.FORBIDDEN, "仅支持修改当前管理员密码");
    }
    AdminSecurityState state = ensureAdminSecurityState();
    if (!passwordMatches(state, request.getCurrentPassword())) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "当前密码不正确");
    }
    if (request.getNewPassword().equals(request.getCurrentPassword())) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "新密码不能与当前密码相同");
    }

    LocalDateTime changedAt = LocalDateTime.now(clock.withZone(zoneId));
    state.setPasswordHash(hashPassword(request.getNewPassword()));
    state.setRequirePasswordChange(false);
    state.setPasswordChangedAt(changedAt);
    adminSecurityStateMapper.updateById(state);

    AdminPasswordChangeResponse response = new AdminPasswordChangeResponse();
    response.setUsername(username);
    response.setRequirePasswordChange(false);
    response.setChangedAt(changedAt.format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));

    auditLogService.record(AuditLogCommand.builder()
        .module("AUTH")
        .action("CHANGE_PASSWORD")
        .targetType("AUTH")
        .targetId(username)
        .requestSummary(Map.of("username", username))
        .afterSnapshot(Map.of("username", username, "requirePasswordChange", false, "changedAt", response.getChangedAt()))
        .success(true)
        .build());
    return response;
  }

  private AdminSecurityState ensureAdminSecurityState() {
    AdminSecurityState current = adminSecurityStateMapper.selectById(SINGLETON_ID);
    if (current != null) {
      boolean changed = false;
      if (current.getUsername() == null || current.getUsername().isBlank()) {
        current.setUsername(properties.getAdmin().getUsername());
        changed = true;
      }
      if (current.getPasswordHash() == null) {
        current.setPasswordHash("");
        changed = true;
      }
      if (current.getRequirePasswordChange() == null) {
        current.setRequirePasswordChange(true);
        changed = true;
      }
      if (changed) {
        adminSecurityStateMapper.updateById(current);
      }
      return current;
    }

    AdminSecurityState created = new AdminSecurityState();
    created.setId(SINGLETON_ID);
    created.setUsername(properties.getAdmin().getUsername());
    created.setPasswordHash("");
    created.setRequirePasswordChange(true);
    created.setPasswordChangedAt(null);
    adminSecurityStateMapper.insert(created);
    return created;
  }

  private boolean passwordMatches(AdminSecurityState state, String rawPassword) {
    String storedHash = state.getPasswordHash() == null ? "" : state.getPasswordHash().trim();
    if (storedHash.isBlank()) {
      return properties.getAdmin().getPassword().equals(rawPassword);
    }
    return storedHash.equals(hashPassword(rawPassword));
  }

  private String hashPassword(String rawPassword) {
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-256");
      byte[] hashed = digest.digest(rawPassword.getBytes(StandardCharsets.UTF_8));
      return HexFormat.of().formatHex(hashed);
    } catch (Exception error) {
      throw new IllegalStateException("密码摘要计算失败", error);
    }
  }
}
