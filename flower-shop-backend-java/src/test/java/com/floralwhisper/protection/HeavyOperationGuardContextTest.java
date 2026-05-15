package com.floralwhisper.protection;

import static org.assertj.core.api.Assertions.assertThat;

import com.floralwhisper.config.AppProperties;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

class HeavyOperationGuardContextTest {

  private final ApplicationContextRunner contextRunner =
      new ApplicationContextRunner()
          .withBean(AppProperties.class, AppProperties::new)
          .withBean(ProtectionMetrics.class)
          .withBean(HeavyOperationGuard.class);

  @Test
  void springContextCanCreateHeavyOperationGuardBean() {
    contextRunner.run(context -> assertThat(context).hasSingleBean(HeavyOperationGuard.class));
  }
}
