package com.floralwhisper.service;

import java.io.File;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

final class StorageDisplayFormatter {

  private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

  private final ZoneId zoneId;

  StorageDisplayFormatter(ZoneId zoneId) {
    this.zoneId = zoneId == null ? ZoneId.systemDefault() : zoneId;
  }

  String formatBytes(long bytes) {
    double value = bytes;
    String unit = "B";
    if (value >= 1024D) {
      value /= 1024D;
      unit = "KB";
    }
    if (value >= 1024D && !"B".equals(unit)) {
      value /= 1024D;
      unit = "MB";
    }
    if (value >= 1024D && "MB".equals(unit)) {
      value /= 1024D;
      unit = "GB";
    }
    return String.format(Locale.US, "%.2f %s", value, unit);
  }

  String formatBackupModifiedAt(File backupDirectory) {
    if (backupDirectory == null || !backupDirectory.exists()) {
      return "";
    }
    return formatInstant(Instant.ofEpochMilli(backupDirectory.lastModified()));
  }

  String formatInstant(Instant instant) {
    if (instant == null) {
      return "";
    }
    return DATE_TIME_FORMATTER.format(instant.atZone(zoneId));
  }
}
