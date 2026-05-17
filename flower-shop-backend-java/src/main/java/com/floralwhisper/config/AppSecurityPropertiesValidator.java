package com.floralwhisper.config;

import java.util.List;
import java.util.Locale;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class AppSecurityPropertiesValidator {
  private static final String DEFAULT_DATA_ENCRYPTION_KEY = "floral-whisper-time-dev-data-key-2026";
  private static final Set<String> NON_PRODUCTION_ENVIRONMENTS = Set.of("local", "dev", "test");

  public AppSecurityPropertiesValidator(AppProperties properties) {
    validate(properties);
  }

  void validate(AppProperties properties) {
    if (properties == null || isNonProduction(properties.getRuntime().getEnvironment())) {
      return;
    }

    String dataEncryptionKey = properties.getSecurity().getDataEncryptionKey();
    if (DEFAULT_DATA_ENCRYPTION_KEY.equals(dataEncryptionKey == null ? "" : dataEncryptionKey.trim())) {
      throw new IllegalStateException("Non-local environment requires custom APP_DATA_ENCRYPTION_KEY");
    }

    if (containsWildcard(properties.getCors().getAllowedOriginPatterns())) {
      throw new IllegalStateException("Non-local environment requires explicit CORS_ALLOWED_ORIGIN_PATTERNS");
    }

    if (containsWildcard(properties.getCors().getAllowedHeaders())) {
      throw new IllegalStateException("Non-local environment requires explicit CORS_ALLOWED_HEADERS");
    }
  }

  private boolean isNonProduction(String environment) {
    String normalized = environment == null ? "local" : environment.trim().toLowerCase(Locale.ROOT);
    return NON_PRODUCTION_ENVIRONMENTS.contains(normalized);
  }

  private boolean containsWildcard(List<String> values) {
    if (values == null) {
      return false;
    }
    return values.stream().filter(item -> item != null).map(String::trim).anyMatch("*"::equals);
  }
}
