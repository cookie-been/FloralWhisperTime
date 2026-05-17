package com.floralwhisper.config;

import static org.assertj.core.api.Assertions.assertThat;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import java.util.Objects;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

class AppSecurityPropertiesValidatorTest {

  private final ApplicationContextRunner contextRunner = new ApplicationContextRunner();

  @Test
  void localEnvironmentAllowsDevelopmentDefaults() {
    contextRunner
        .withBean(AppProperties.class, AppProperties::new)
        .withBean(AppSecurityPropertiesValidator.class)
        .run(context -> assertThat(context).hasSingleBean(AppSecurityPropertiesValidator.class));
  }

  @Test
  void productionEnvironmentRejectsDefaultEncryptionKey() {
    runContextWithWarnSuppressed(() ->
        contextRunner
            .withBean(AppProperties.class, () -> {
              AppProperties properties = new AppProperties();
              properties.getRuntime().setEnvironment("production");
              return properties;
            })
            .withBean(AppSecurityPropertiesValidator.class)
            .run(context -> {
              assertThat(context).hasFailed();
              assertThat(rootCauseMessage(context.getStartupFailure())).contains("APP_DATA_ENCRYPTION_KEY");
            }));
  }

  @Test
  void productionEnvironmentRejectsWildcardCorsDefaults() {
    runContextWithWarnSuppressed(() ->
        contextRunner
            .withBean(AppProperties.class, () -> {
              AppProperties properties = new AppProperties();
              properties.getRuntime().setEnvironment("prod");
              properties.getSecurity().setDataEncryptionKey("12345678901234567890123456789012");
              return properties;
            })
            .withBean(AppSecurityPropertiesValidator.class)
            .run(context -> {
              assertThat(context).hasFailed();
              assertThat(rootCauseMessage(context.getStartupFailure())).contains("CORS_ALLOWED_ORIGIN_PATTERNS");
            }));
  }

  private void runContextWithWarnSuppressed(Runnable assertion) {
    Logger logger = (Logger) LoggerFactory.getLogger("org.springframework.context.annotation.AnnotationConfigApplicationContext");
    Level originalLevel = logger.getLevel();
    logger.setLevel(Level.ERROR);
    try {
      assertion.run();
    } finally {
      logger.setLevel(originalLevel);
    }
  }

  private String rootCauseMessage(Throwable throwable) {
    Throwable current = throwable;
    while (current.getCause() != null) {
      current = current.getCause();
    }
    return Objects.toString(current.getMessage(), "");
  }
}
