package com.floralwhisper.service;

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

  public AuthService(AppProperties properties, JwtService jwtService) {
    this.properties = properties;
    this.jwtService = jwtService;
  }

  public LoginResponse login(LoginRequest request) {
    String username = request.getUsername() == null ? "" : request.getUsername();
    String password = request.getPassword() == null ? "" : request.getPassword();
    if (!properties.getAdmin().getUsername().equals(username) || !properties.getAdmin().getPassword().equals(password)) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, "账号或密码错误");
    }
    return new LoginResponse(jwtService.createToken(username), username);
  }

  public Map<String, String> currentAdmin() {
    return Map.of("username", properties.getAdmin().getUsername());
  }
}

