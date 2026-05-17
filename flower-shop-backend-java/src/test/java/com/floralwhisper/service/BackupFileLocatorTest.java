package com.floralwhisper.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class BackupFileLocatorTest {

  private final BackupFileLocator locator = new BackupFileLocator();

  @TempDir
  Path tempDir;

  @Test
  void resolveLatestBackupReturnsNullForMissingDirectory() {
    assertNull(locator.resolveLatestBackup(tempDir.resolve("missing").toFile()));
  }

  @Test
  void resolveLatestBackupUsesLargestDirectoryName() throws Exception {
    Path backups = Files.createDirectories(tempDir.resolve("backups"));
    Files.createDirectories(backups.resolve("20260516-120000"));
    Path latest = Files.createDirectories(backups.resolve("20260517-090000"));
    Files.createDirectories(backups.resolve("20260515-080000"));

    assertEquals(latest.toFile().getAbsolutePath(), locator.resolveLatestBackup(backups.toFile()).getAbsolutePath());
  }

  @Test
  void sortBackupDirectoriesOrdersByModifiedTimeThenNameDescending() throws Exception {
    Path backups = Files.createDirectories(tempDir.resolve("backups"));
    Path second = Files.createDirectories(backups.resolve("20260517-100000"));
    Path first = Files.createDirectories(backups.resolve("20260517-090000"));
    Path tieWinner = Files.createDirectories(backups.resolve("20260517-110000"));
    Files.setLastModifiedTime(first, java.nio.file.attribute.FileTime.from(Instant.parse("2026-05-17T01:00:00Z")));
    Files.setLastModifiedTime(second, java.nio.file.attribute.FileTime.from(Instant.parse("2026-05-17T02:00:00Z")));
    Files.setLastModifiedTime(tieWinner, java.nio.file.attribute.FileTime.from(Instant.parse("2026-05-17T02:00:00Z")));

    List<String> names = locator.sortBackupDirectories(backups.toFile()).stream().map(file -> file.getName()).toList();

    assertEquals(List.of("20260517-110000", "20260517-100000", "20260517-090000"), names);
  }

  @Test
  void listOperationLogArchiveFilesOnlyReturnsCsvSortedByModifiedTimeThenNameDescending() throws Exception {
    Path archiveDir = Files.createDirectories(tempDir.resolve("operation-logs"));
    Path ignored = Files.writeString(archiveDir.resolve("note.txt"), "ignore");
    Path first = Files.writeString(archiveDir.resolve("b.csv"), "b");
    Path second = Files.writeString(archiveDir.resolve("c.csv"), "c");
    Path third = Files.writeString(archiveDir.resolve("a.csv"), "a");
    Files.setLastModifiedTime(first, java.nio.file.attribute.FileTime.from(Instant.parse("2026-05-17T01:00:00Z")));
    Files.setLastModifiedTime(second, java.nio.file.attribute.FileTime.from(Instant.parse("2026-05-17T02:00:00Z")));
    Files.setLastModifiedTime(third, java.nio.file.attribute.FileTime.from(Instant.parse("2026-05-17T02:00:00Z")));
    Files.setLastModifiedTime(ignored, java.nio.file.attribute.FileTime.from(Instant.parse("2026-05-17T03:00:00Z")));

    List<String> names = locator.listOperationLogArchiveFiles(archiveDir.toFile()).stream().map(file -> file.getName()).toList();

    assertEquals(List.of("c.csv", "a.csv", "b.csv"), names);
  }
}
