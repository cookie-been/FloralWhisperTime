package com.floralwhisper.dto;

import lombok.Data;

@Data
public class AiSettingsResponse {
  private boolean enabled;
  private String provider;
  private boolean apiKeyConfigured;
  private String apiKeyMasked;
  private String model;
  private String baseUrl;
  private String generatePath;
  private String size;
  private String textModel;
  private String textGeneratePath;
  private Double textTemperature;
  private Integer textMaxTokens;
}
