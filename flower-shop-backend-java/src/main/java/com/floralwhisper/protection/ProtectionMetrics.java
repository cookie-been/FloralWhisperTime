package com.floralwhisper.protection;

import java.util.EnumMap;
import java.util.Map;
import java.util.concurrent.atomic.LongAdder;
import org.springframework.stereotype.Component;

@Component
public class ProtectionMetrics {
  private final Map<RouteProtectionGroup, LongAdder> allowedCounters = new EnumMap<>(RouteProtectionGroup.class);
  private final Map<RouteProtectionGroup, LongAdder> rejectedCounters = new EnumMap<>(RouteProtectionGroup.class);
  private final LongAdder busyRejectedCounter = new LongAdder();

  public ProtectionMetrics() {
    for (RouteProtectionGroup group : RouteProtectionGroup.values()) {
      allowedCounters.put(group, new LongAdder());
      rejectedCounters.put(group, new LongAdder());
    }
  }

  public void recordAllowed(RouteProtectionGroup group) {
    allowedCounters.get(group).increment();
  }

  public void recordRejected(RouteProtectionGroup group) {
    rejectedCounters.get(group).increment();
  }

  public long allowedCount(RouteProtectionGroup group) {
    return allowedCounters.get(group).sum();
  }

  public long rejectedCount(RouteProtectionGroup group) {
    return rejectedCounters.get(group).sum();
  }

  public long totalRejectedCount() {
    long total = 0L;
    for (RouteProtectionGroup group : RouteProtectionGroup.values()) {
      total += rejectedCounters.get(group).sum();
    }
    return total;
  }

  public void recordBusyRejected() {
    busyRejectedCounter.increment();
  }

  public long busyRejectedCount() {
    return busyRejectedCounter.sum();
  }
}
