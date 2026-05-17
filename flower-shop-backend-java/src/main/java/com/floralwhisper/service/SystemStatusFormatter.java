package com.floralwhisper.service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.format.DateTimeParseException;

final class SystemStatusFormatter {

  private final StorageDisplayFormatter storageDisplayFormatter;
  private final Clock clock;

  SystemStatusFormatter(StorageDisplayFormatter storageDisplayFormatter, Clock clock) {
    this.storageDisplayFormatter = storageDisplayFormatter;
    this.clock = clock;
  }

  String formatBuildTime(Instant buildTime) {
    if (buildTime == null) {
      return "";
    }
    return storageDisplayFormatter.formatInstant(buildTime);
  }

  String formatDeployedAt(String deployedAt) {
    if (deployedAt == null || deployedAt.isBlank()) {
      return "";
    }
    String trimmed = deployedAt.trim();
    try {
      return storageDisplayFormatter.formatInstant(Instant.parse(trimmed));
    } catch (DateTimeParseException ignored) {
      return trimmed;
    }
  }

  String formatUptime(Instant startedAt) {
    if (startedAt == null) {
      return "未知";
    }
    Duration duration = Duration.between(startedAt, Instant.now(clock));
    if (duration.isNegative()) {
      return "未知";
    }
    long totalMinutes = duration.toMinutes();
    if (totalMinutes < 60) {
      return totalMinutes + "分钟";
    }
    long hours = totalMinutes / 60;
    long minutes = totalMinutes % 60;
    if (hours < 24) {
      return minutes == 0 ? hours + "小时" : hours + "小时" + minutes + "分钟";
    }
    long days = hours / 24;
    long remainHours = hours % 24;
    return remainHours == 0 ? days + "天" : days + "天" + remainHours + "小时";
  }
}
