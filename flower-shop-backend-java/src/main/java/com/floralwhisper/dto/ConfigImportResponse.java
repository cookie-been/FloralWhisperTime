package com.floralwhisper.dto;

import lombok.Data;

@Data
public class ConfigImportResponse {
  private String version;
  private String importedAt;
  private int timelineCount;
  private int teamCount;
  private boolean includedAiSettings;
}
