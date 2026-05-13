package com.floralwhisper.migration;

import com.floralwhisper.config.AppProperties;
import java.nio.file.Path;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class JsonImportRunner implements ApplicationRunner {
  private static final Logger log = LoggerFactory.getLogger(JsonImportRunner.class);

  private final AppProperties properties;
  private final JsonImportService jsonImportService;

  public JsonImportRunner(AppProperties properties, JsonImportService jsonImportService) {
    this.properties = properties;
    this.jsonImportService = jsonImportService;
  }

  @Override
  public void run(ApplicationArguments args) {
    if (!properties.getImporter().isEnabled()) {
      return;
    }
    Path jsonPath = Path.of(properties.getImporter().getJsonPath()).toAbsolutePath().normalize();
    log.info("Starting legacy JSON import from {}", jsonPath);
    JsonImportService.ImportSummary summary =
        jsonImportService.importFromJson(jsonPath, properties.getImporter().isReplaceExisting());
    log.info("Legacy JSON import finished: {}", summary);
  }
}
