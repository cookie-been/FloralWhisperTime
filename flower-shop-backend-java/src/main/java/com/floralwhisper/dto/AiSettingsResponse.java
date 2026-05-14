package com.floralwhisper.dto;

import lombok.Data;

@Data
public class AiSettingsResponse {
  private boolean enabled;
  private String provider;
  private String apiKey;
  private String model;
  private String baseUrl;
  private String generatePath;
}
