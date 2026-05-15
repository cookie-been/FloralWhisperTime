package com.floralwhisper.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.floralwhisper.audit.AuditLogCommand;
import com.floralwhisper.audit.AuditLogService;
import com.floralwhisper.common.ApiException;
import com.floralwhisper.config.AppProperties;
import com.floralwhisper.crypto.SecretCryptoService;
import com.floralwhisper.dto.AdminPasswordChangeRequest;
import com.floralwhisper.dto.AdminPasswordChangeResponse;
import com.floralwhisper.dto.AdminSessionResponse;
import com.floralwhisper.dto.LoginRequest;
import com.floralwhisper.dto.LoginResponse;
import com.floralwhisper.entity.AdminSecurityState;
import com.floralwhisper.mapper.AdminSecurityStateMapper;
import com.floralwhisper.security.JwtService;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.junit.jupiter.api.Test;

class AuthServiceTest {

  @Test
  void firstLoginRequiresPasswordChangeWhenUsingInitialPassword() {
    AdminSecurityStateMapper mapper = mock(AdminSecurityStateMapper.class);
    AuditLogService auditLogService = mock(AuditLogService.class);
    AppProperties properties = properties();
    JwtService jwtService = new JwtService(properties);

    AdminSecurityState state = new AdminSecurityState();
    state.setId(1L);
    state.setUsername("admin");
    state.setPasswordHash("");
    state.setRequirePasswordChange(true);
    when(mapper.selectById(1L)).thenReturn(state);

    AuthService authService = new AuthService(
        properties,
        jwtService,
        auditLogService,
        mapper,
        new BCryptPasswordEncoder(),
        Clock.fixed(Instant.parse("2026-05-15T04:00:00Z"), ZoneId.of("Asia/Shanghai")),
        ZoneId.of("Asia/Shanghai"));

    LoginRequest request = new LoginRequest();
    request.setUsername("admin");
    request.setPassword("Floral@2026");

    LoginResponse response = authService.login(request);

    assertEquals("admin", response.getUsername());
    assertTrue(response.isRequirePasswordChange());
    assertTrue(authService.isPasswordChangeRequired("admin"));
    AdminSessionResponse session = authService.currentAdmin();
    assertEquals("", session.getPasswordChangedAt());
    verify(auditLogService, times(1)).record(any(AuditLogCommand.class));
  }

  @Test
  void changePasswordPersistsHashAndSubsequentLoginUsesNewPassword() {
    AdminSecurityStateMapper mapper = mock(AdminSecurityStateMapper.class);
    AuditLogService auditLogService = mock(AuditLogService.class);
    AppProperties properties = properties();
    JwtService jwtService = new JwtService(properties);

    AdminSecurityState state = new AdminSecurityState();
    state.setId(1L);
    state.setUsername("admin");
    state.setPasswordHash("");
    state.setRequirePasswordChange(true);
    when(mapper.selectById(1L)).thenReturn(state);

    AuthService authService = new AuthService(
        properties,
        jwtService,
        auditLogService,
        mapper,
        new BCryptPasswordEncoder(),
        Clock.fixed(Instant.parse("2026-05-15T04:30:00Z"), ZoneId.of("Asia/Shanghai")),
        ZoneId.of("Asia/Shanghai"));

    AdminPasswordChangeRequest changeRequest = new AdminPasswordChangeRequest();
    changeRequest.setCurrentPassword("Floral@2026");
    changeRequest.setNewPassword("Floral@2026#New");

    AdminPasswordChangeResponse changeResponse = authService.changePassword("admin", changeRequest);

    assertEquals("admin", changeResponse.getUsername());
    assertFalse(changeResponse.isRequirePasswordChange());
    assertFalse(state.getPasswordHash().isBlank());
    assertTrue(state.getPasswordHash().startsWith("$2"));
    assertFalse(Boolean.TRUE.equals(state.getRequirePasswordChange()));
    verify(mapper, times(1)).updateById(state);

    LoginRequest oldLogin = new LoginRequest();
    oldLogin.setUsername("admin");
    oldLogin.setPassword("Floral@2026");
    assertThrows(ApiException.class, () -> authService.login(oldLogin));

    LoginRequest newLogin = new LoginRequest();
    newLogin.setUsername("admin");
    newLogin.setPassword("Floral@2026#New");
    LoginResponse loginResponse = authService.login(newLogin);
    assertFalse(loginResponse.isRequirePasswordChange());
    AdminSessionResponse session = authService.currentAdmin();
    assertEquals("2026-05-15 12:30:00", session.getPasswordChangedAt());
  }

  @Test
  void changePasswordRejectsWeakPassword() {
    AdminSecurityStateMapper mapper = mock(AdminSecurityStateMapper.class);
    AuditLogService auditLogService = mock(AuditLogService.class);
    AppProperties properties = properties();
    JwtService jwtService = new JwtService(properties);

    AdminSecurityState state = new AdminSecurityState();
    state.setId(1L);
    state.setUsername("admin");
    state.setPasswordHash("");
    state.setRequirePasswordChange(true);
    when(mapper.selectById(1L)).thenReturn(state);

    AuthService authService = new AuthService(
        properties,
        jwtService,
        auditLogService,
        mapper,
        new BCryptPasswordEncoder(),
        Clock.fixed(Instant.parse("2026-05-15T04:30:00Z"), ZoneId.of("Asia/Shanghai")),
        ZoneId.of("Asia/Shanghai"));

    AdminPasswordChangeRequest changeRequest = new AdminPasswordChangeRequest();
    changeRequest.setCurrentPassword("Floral@2026");
    changeRequest.setNewPassword("weakpass");

    ApiException error = assertThrows(ApiException.class, () -> authService.changePassword("admin", changeRequest));

    assertEquals("新密码需同时包含字母、数字和特殊字符", error.getMessage());
  }

  @Test
  void loginSupportsLegacySha256HashAndUpgradesAfterPasswordChange() {
    AdminSecurityStateMapper mapper = mock(AdminSecurityStateMapper.class);
    AuditLogService auditLogService = mock(AuditLogService.class);
    AppProperties properties = properties();
    JwtService jwtService = new JwtService(properties);

    AdminSecurityState state = new AdminSecurityState();
    state.setId(1L);
    state.setUsername("admin");
    state.setPasswordHash("e9cbe6af22e24e3ee04da6c9ee107add5813fafd4c7a653e362750c6a284ad53");
    state.setRequirePasswordChange(false);
    when(mapper.selectById(1L)).thenReturn(state);

    AuthService authService = new AuthService(
        properties,
        jwtService,
        auditLogService,
        mapper,
        new BCryptPasswordEncoder(),
        Clock.fixed(Instant.parse("2026-05-15T04:30:00Z"), ZoneId.of("Asia/Shanghai")),
        ZoneId.of("Asia/Shanghai"));

    LoginRequest loginRequest = new LoginRequest();
    loginRequest.setUsername("admin");
    loginRequest.setPassword("Floral@2026");

    LoginResponse response = authService.login(loginRequest);

    assertEquals("admin", response.getUsername());

    AdminPasswordChangeRequest changeRequest = new AdminPasswordChangeRequest();
    changeRequest.setCurrentPassword("Floral@2026");
    changeRequest.setNewPassword("Floral@2026#Rotate");
    authService.changePassword("admin", changeRequest);

    assertTrue(state.getPasswordHash().startsWith("$2"));
  }

  private AppProperties properties() {
    AppProperties properties = new AppProperties();
    properties.getAdmin().setUsername("admin");
    properties.getAdmin().setPassword("Floral@2026");
    properties.getJwt().setSecret("12345678901234567890123456789012");
    properties.getJwt().setExpiresInSeconds(43200L);
    properties.getJwt().setIssuer("flower-shop-backend-java");
    return properties;
  }
}
