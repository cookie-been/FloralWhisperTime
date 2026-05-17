package com.floralwhisper.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.time.ZoneId;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class BackupFileViewFactoryTest {

  private final StorageDisplayFormatter storageDisplayFormatter = new StorageDisplayFormatter(ZoneId.of("Asia/Shanghai"));
  private final DirectorySizeCalculator directorySizeCalculator = new DirectorySizeCalculator();
  private final BackupFileViewFactory factory =
      new BackupFileViewFactory(storageDisplayFormatter, directorySizeCalculator);

  @TempDir
  Path tempDir;

  @Test
  void createOperationLogArchiveFileResponseMapsFields() throws Exception {
    Path file = Files.writeString(tempDir.resolve("operation-logs-archive-1.csv"), "1234");
    Files.setLastModifiedTime(file, java.nio.file.attribute.FileTime.from(Instant.parse("2026-05-17T04:00:00Z")));

    var response = factory.createOperationLogArchiveFileResponse(file.toFile());

    assertEquals("operation-logs-archive-1.csv", response.getFilename());
    assertEquals(file.toFile().getAbsolutePath(), response.getPath());
    assertEquals("2026-05-17 12:00:00", response.getModifiedAt());
    assertEquals("4.00 B", response.getSize());
    assertTrue(response.getDownloadUrl().endsWith("/api/admin/system/operation-logs/archive-files/operation-logs-archive-1.csv/download"));
  }

  @Test
  void createAdminBackupFileResponseMapsFields() throws Exception {
    Path dir = Files.createDirectories(tempDir.resolve("20260517-120000"));
    Files.writeString(dir.resolve("metadata.txt"), "1234");
    Files.setLastModifiedTime(dir, java.nio.file.attribute.FileTime.from(Instant.parse("2026-05-17T04:00:00Z")));

    var response = factory.createAdminBackupFileResponse(dir.toFile(), true);

    assertEquals("20260517-120000", response.getBackupName());
    assertEquals(dir.toFile().getAbsolutePath(), response.getPath());
    assertEquals("2026-05-17 12:00:00", response.getModifiedAt());
    assertEquals("4.00 B", response.getSize());
    assertTrue(response.getDownloadUrl().endsWith("/api/admin/system/backups/20260517-120000/download"));
    assertTrue(response.isLatest());
  }

  @Test
  void createAdminBackupFileResponsePreservesLatestFlag() throws Exception {
    Path dir = Files.createDirectories(tempDir.resolve("20260517-130000"));

    var response = factory.createAdminBackupFileResponse(dir.toFile(), false);

    assertFalse(response.isLatest());
  }
}
