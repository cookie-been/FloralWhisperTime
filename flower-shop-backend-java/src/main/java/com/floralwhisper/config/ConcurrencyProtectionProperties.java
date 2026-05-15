package com.floralwhisper.config;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
public class ConcurrencyProtectionProperties {
  private RouteLimit publicRead = new RouteLimit(60, 10, 0, 0, true);
  private RouteLimit publicWrite = new RouteLimit(12, 60, 0, 0, true);
  private RouteLimit admin = new RouteLimit(30, 60, 0, 0, true);
  private RouteLimit heavy = new RouteLimit(6, 60, 2, 4, true);
  private Integer configImportConcurrent = 1;

  @Data
  @AllArgsConstructor
  @NoArgsConstructor
  public static class RouteLimit {
    private Integer capacity;
    private Integer refillSeconds;
    private Integer aiConcurrent;
    private Integer uploadConcurrent;
    private Boolean enabled;
  }
}
