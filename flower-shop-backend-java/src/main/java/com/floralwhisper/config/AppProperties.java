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
  private Backup backup = new Backup();
  private Cors cors = new Cors();
  private Import importer = new Import();

  @Data
  public static class Admin {
    private String username;
    private String password;
  }

  @Data
  public static class Jwt {
    private String secret;
    private Long expiresInSeconds;
    private String issuer;
  }

  @Data
  public static class Upload {
    private String dir;
    private String publicBaseUrl;
  }

  @Data
  public static class Backup {
    private String dir;
  }

  @Data
  public static class Cors {
    private java.util.List<String> allowedOriginPatterns = java.util.List.of("*");
    private java.util.List<String> allowedMethods = java.util.List.of("GET", "POST", "PUT", "DELETE", "OPTIONS");
    private java.util.List<String> allowedHeaders = java.util.List.of("*");
    private boolean allowCredentials;
    private Long maxAgeSeconds = 3600L;
  }

  @Data
  public static class Import {
    private boolean enabled;
    private String jsonPath;
    private boolean replaceExisting;
  }
}
