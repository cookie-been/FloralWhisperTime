package com.floralwhisper.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class ConfigTransferAiSettings {
  private boolean enabled;
  private String provider;
  private String apiKey;
  private String model;
  private String baseUrl;
  private String generatePath;
  private String size;
  private String textModel;
  private String textGeneratePath;
  private Double textTemperature;
  private Integer textMaxTokens;
}
