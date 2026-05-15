package com.floralwhisper.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.floralwhisper.audit.AuditLogService;
import com.floralwhisper.config.AppProperties;
import com.floralwhisper.mapper.AdminSecurityStateMapper;
import com.floralwhisper.security.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

class AuthServiceContextTest {

  private final ApplicationContextRunner contextRunner =
      new ApplicationContextRunner()
          .withBean(AppProperties.class, this::properties)
          .withBean(JwtService.class, () -> new JwtService(properties()))
          .withBean(AdminSecurityStateMapper.class, () -> org.mockito.Mockito.mock(AdminSecurityStateMapper.class))
          .withBean(AuditLogService.class, () -> org.mockito.Mockito.mock(AuditLogService.class))
          .withBean(AuthService.class);

  @Test
  void springContextCanCreateAuthServiceBean() {
    contextRunner.run(context -> assertThat(context).hasSingleBean(AuthService.class));
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
