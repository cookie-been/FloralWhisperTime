package com.floralwhisper.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "app.ai-image")
public class AiImageProperties {
  private boolean enabled;
  private String provider = "volcengine";
  private String apiKey;
  private String model = "Doubao-Seedream-5.0-lite";
  private String baseUrl = "https://operator.las.cn-beijing.volces.com/api/v1";
  private String generatePath = "/images/generations";
  private int maxReferenceFiles = 3;
  private long maxReferenceFileSizeBytes = 20L * 1024L * 1024L;
  private String downloadSubdir = "ai";
  private int requestTimeoutSeconds = 120;
  private String size = "1024x1280";
  private String responseFormat = "url";
  private boolean watermark = false;
}
