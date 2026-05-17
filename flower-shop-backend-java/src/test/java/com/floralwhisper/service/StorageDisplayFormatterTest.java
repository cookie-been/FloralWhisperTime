package com.floralwhisper.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.time.ZoneId;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class StorageDisplayFormatterTest {

  private final StorageDisplayFormatter formatter = new StorageDisplayFormatter(ZoneId.of("Asia/Shanghai"));

  @TempDir
  Path tempDir;

  @Test
  void formatBytesUsesExpectedUnits() {
    assertEquals("512.00 B", formatter.formatBytes(512));
    assertEquals("1.00 KB", formatter.formatBytes(1024));
    assertEquals("1.00 MB", formatter.formatBytes(1024 * 1024));
    assertEquals("1.00 GB", formatter.formatBytes(1024L * 1024L * 1024L));
  }

  @Test
  void formatInstantUsesConfiguredZone() {
    String result = formatter.formatInstant(Instant.parse("2026-05-17T04:00:00Z"));

    assertEquals("2026-05-17 12:00:00", result);
  }

  @Test
  void formatBackupModifiedAtReturnsEmptyWhenFileMissing() {
    File missing = tempDir.resolve("missing.txt").toFile();

    assertEquals("", formatter.formatBackupModifiedAt(missing));
  }

  @Test
  void formatBackupModifiedAtUsesFileTimestamp() throws Exception {
    Path file = Files.writeString(tempDir.resolve("backup.txt"), "ok");
    Files.setLastModifiedTime(file, java.nio.file.attribute.FileTime.from(Instant.parse("2026-05-17T04:00:00Z")));

    assertEquals("2026-05-17 12:00:00", formatter.formatBackupModifiedAt(file.toFile()));
  }
}
