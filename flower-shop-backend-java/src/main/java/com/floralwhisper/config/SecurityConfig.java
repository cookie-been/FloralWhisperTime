package com.floralwhisper.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.floralwhisper.security.AdminPasswordChangeEnforcementFilter;
import com.floralwhisper.security.JwtAuthenticationFilter;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
public class SecurityConfig {
  private final AppProperties properties;

  public SecurityConfig(AppProperties properties) {
    this.properties = properties;
  }

  @Bean
  SecurityFilterChain securityFilterChain(
      HttpSecurity http,
      JwtAuthenticationFilter jwtAuthenticationFilter,
      AdminPasswordChangeEnforcementFilter adminPasswordChangeEnforcementFilter,
      ObjectMapper objectMapper)
      throws Exception {
    http
        .csrf(csrf -> csrf.disable())
        .cors(cors -> cors.configurationSource(corsConfigurationSource()))
        .headers(headers -> headers
            .contentTypeOptions(contentTypeOptions -> {})
            .frameOptions(frameOptions -> frameOptions.sameOrigin())
            .xssProtection(xss -> xss.disable())
            .cacheControl(cache -> {})
            .addHeaderWriter((request, response) -> {
              response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
              response.setHeader("X-Permitted-Cross-Domain-Policies", "none");
            }))
        .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers(HttpMethod.POST, "/api/admin/login").permitAll()
            .requestMatchers(HttpMethod.POST, "/api/flowers").hasRole("ADMIN")
            .requestMatchers(HttpMethod.PUT, "/api/flowers/**").hasRole("ADMIN")
            .requestMatchers(HttpMethod.DELETE, "/api/flowers/**").hasRole("ADMIN")
            .requestMatchers(HttpMethod.POST, "/api/uploads").hasRole("ADMIN")
            .requestMatchers(HttpMethod.PUT, "/api/site-config").hasRole("ADMIN")
            .requestMatchers("/api/admin/**").hasRole("ADMIN")
            .requestMatchers(HttpMethod.PATCH, "/api/admin/contacts/*/read").hasRole("ADMIN")
            .requestMatchers(HttpMethod.DELETE, "/api/admin/contacts/*").hasRole("ADMIN")
            .requestMatchers("/api/admin/operation-logs/**").hasRole("ADMIN")
            .requestMatchers("/api/admin/system/**").hasRole("ADMIN")
            .requestMatchers("/api/admin/ai/**").hasRole("ADMIN")
            .requestMatchers("/api/admin/me").hasRole("ADMIN")
            .requestMatchers("/api/admin/contacts").hasRole("ADMIN")
            .anyRequest().permitAll())
        .exceptionHandling(exception -> exception.authenticationEntryPoint((request, response, authException) -> {
          response.setStatus(401);
          response.setContentType(MediaType.APPLICATION_JSON_VALUE);
          response.setCharacterEncoding("UTF-8");
          boolean expired = Boolean.TRUE.equals(request.getAttribute(JwtAuthenticationFilter.TOKEN_EXPIRED_ATTRIBUTE));
          objectMapper.writeValue(response.getWriter(), Map.of("message", expired ? "登录状态已过期，请重新登录" : "请先登录管理后台"));
        }))
        .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
        .addFilterAfter(adminPasswordChangeEnforcementFilter, JwtAuthenticationFilter.class);

    return http.build();
  }

  @Bean
  CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOriginPatterns(properties.getCors().getAllowedOriginPatterns());
    configuration.setAllowedMethods(properties.getCors().getAllowedMethods());
    configuration.setAllowedHeaders(properties.getCors().getAllowedHeaders());
    configuration.setAllowCredentials(properties.getCors().isAllowCredentials());
    configuration.setMaxAge(properties.getCors().getMaxAgeSeconds());
    configuration.setExposedHeaders(java.util.List.of(HttpHeaders.AUTHORIZATION));
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
  }
}
