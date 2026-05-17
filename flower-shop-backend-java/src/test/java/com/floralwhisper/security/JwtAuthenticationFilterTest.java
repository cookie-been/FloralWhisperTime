package com.floralwhisper.security;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.floralwhisper.config.AppProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Header;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

class JwtAuthenticationFilterTest {

  @Test
  void expiredTokenMarksRequestAndClearsContextWithoutWarningLog() throws Exception {
    JwtService jwtService = mock(JwtService.class);
    AppProperties properties = new AppProperties();
    properties.getAdmin().setUsername("admin");
    JwtAuthenticationFilter filter = new JwtAuthenticationFilter(jwtService, properties);

    when(jwtService.parseUsername("expired-token"))
        .thenThrow(new ExpiredJwtException(mock(Header.class), mock(Claims.class), "expired"));

    Logger logger = (Logger) LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    ListAppender<ILoggingEvent> appender = new ListAppender<>();
    appender.start();
    logger.addAppender(appender);
    try {
      MockHttpServletRequest request = new MockHttpServletRequest();
      request.addHeader("Authorization", "Bearer expired-token");
      SecurityContextHolder.getContext().setAuthentication(
          new org.springframework.security.authentication.UsernamePasswordAuthenticationToken("admin", null));

      filter.doFilterInternal(request, new MockHttpServletResponse(), mock(FilterChain.class));

      assertTrue(Boolean.TRUE.equals(request.getAttribute(JwtAuthenticationFilter.TOKEN_EXPIRED_ATTRIBUTE)));
      assertFalse(appender.list.stream().anyMatch(event -> event.getLevel().isGreaterOrEqual(Level.WARN)));
      assertTrue(SecurityContextHolder.getContext().getAuthentication() == null);
    } finally {
      logger.detachAppender(appender);
      SecurityContextHolder.clearContext();
    }
  }

  @Test
  void invalidTokenWritesSanitizedWarningLog() throws Exception {
    JwtService jwtService = mock(JwtService.class);
    AppProperties properties = new AppProperties();
    properties.getAdmin().setUsername("admin");
    JwtAuthenticationFilter filter = new JwtAuthenticationFilter(jwtService, properties);

    when(jwtService.parseUsername("invalid-token"))
        .thenThrow(new JwtException("signature validation failed"));

    Logger logger = (Logger) LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    ListAppender<ILoggingEvent> appender = new ListAppender<>();
    appender.start();
    logger.addAppender(appender);
    try {
      MockHttpServletRequest request = new MockHttpServletRequest();
      request.addHeader("Authorization", "Bearer invalid-token");

      filter.doFilterInternal(request, new MockHttpServletResponse(), mock(FilterChain.class));

      assertTrue(appender.list.stream().anyMatch(event ->
          event.getLevel() == Level.WARN
              && event.getFormattedMessage().contains("JWT authentication failed")
              && !event.getFormattedMessage().contains("invalid-token")));
    } finally {
      logger.detachAppender(appender);
      SecurityContextHolder.clearContext();
    }
  }
}
