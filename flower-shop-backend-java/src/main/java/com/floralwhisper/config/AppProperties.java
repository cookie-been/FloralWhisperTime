package com.floralwhisper.config;

import jakarta.validation.Valid;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;
import org.springframework.stereotype.Component;

@Data
@Component
@Validated
@ConfigurationProperties(prefix = "app")
public class AppProperties {
  private Admin admin = new Admin();
  private Jwt jwt = new Jwt();
  private Upload upload = new Upload();
  private Backup backup = new Backup();
  private OperationLog operationLog = new OperationLog();
  private Cors cors = new Cors();
  private Import importer = new Import();
  private Runtime runtime = new Runtime();
  private Security security = new Security();
  @Valid
  private ConcurrencyProtectionProperties protection = new ConcurrencyProtectionProperties();

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
  public static class OperationLog {
    private Integer retentionDays = 180;
    private String archiveDir = "operation-logs";
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

  @Data
  public static class Runtime {
    private String environment = "local";
    private String gitRevision = "dev";
    private String deployedAt;
  }

  @Data
  public static class Security {
    private String dataEncryptionKey = "floral-whisper-time-dev-data-key-2026";
  }
}
