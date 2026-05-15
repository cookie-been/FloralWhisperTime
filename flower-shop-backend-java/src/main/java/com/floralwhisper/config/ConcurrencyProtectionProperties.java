package com.floralwhisper.config;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ConcurrencyProtectionProperties {
  @Valid
  private RateLimit publicRead = new RateLimit(60, 10, true);
  @Valid
  private RateLimit publicWrite = new RateLimit(12, 60, true);
  @Valid
  private RateLimit admin = new RateLimit(30, 60, true);
  @Valid
  private RateLimit heavy = new RateLimit(6, 60, true);
  @Valid
  private Concurrency concurrency = new Concurrency();

  @Data
  public static class RateLimit {
    @NotNull
    @Min(1)
    private Integer capacity;
    @NotNull
    @Min(1)
    private Integer refillSeconds;
    @NotNull
    private Boolean enabled;

    public RateLimit() {
    }

    public RateLimit(Integer capacity, Integer refillSeconds, Boolean enabled) {
      this.capacity = capacity;
      this.refillSeconds = refillSeconds;
      this.enabled = enabled;
    }
  }

  @Data
  public static class Concurrency {
    @Valid
    private ConcurrencyLimit ai = new ConcurrencyLimit(2, true);
    @Valid
    private ConcurrencyLimit upload = new ConcurrencyLimit(4, true);
    @Valid
    private ConcurrencyLimit configImport = new ConcurrencyLimit(1, true);
  }

  @Data
  public static class ConcurrencyLimit {
    @NotNull
    @Min(1)
    private Integer maxConcurrent;
    @NotNull
    private Boolean enabled;

    public ConcurrencyLimit() {
    }

    public ConcurrencyLimit(Integer maxConcurrent, Boolean enabled) {
      this.maxConcurrent = maxConcurrent;
      this.enabled = enabled;
    }
  }
}
