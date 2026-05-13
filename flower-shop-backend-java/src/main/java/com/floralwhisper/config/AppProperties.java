package com.floralwhisper.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "app")
public class AppProperties {
  private Admin admin = new Admin();
  private Jwt jwt = new Jwt();
  private Upload upload = new Upload();

  @Data
  public static class Admin {
    private String username;
    private String password;
  }

  @Data
  public static class Jwt {
    private String secret;
    private Long expiresInSeconds;
  }

  @Data
  public static class Upload {
    private String dir;
    private String publicBaseUrl;
  }
}

