package com.floralwhisper.protection;

import lombok.Data;

@Data
public class ProtectionSnapshot {
  private boolean enabled;
  private int publicReadCapacity;
  private int publicWriteCapacity;
  private int adminCapacity;
  private int heavyCapacity;
  private int aiMaxConcurrent;
  private int uploadMaxConcurrent;
  private int configImportMaxConcurrent;
  private long rateLimitedCount;
  private long busyRejectedCount;
}
