package com.floralwhisper.service;

import java.io.File;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;

final class BackupFileLocator {

  File resolveLatestBackup(File backupsDir) {
    if (backupsDir == null || !backupsDir.exists() || !backupsDir.isDirectory()) {
      return null;
    }
    File[] files = backupsDir.listFiles(File::isDirectory);
    if (files == null || files.length == 0) {
      return null;
    }
    File latest = files[0];
    for (File file : files) {
      if (file.getName().compareTo(latest.getName()) > 0) {
        latest = file;
      }
    }
    return latest;
  }

  List<File> sortBackupDirectories(File backupsDir) {
    if (backupsDir == null || !backupsDir.exists() || !backupsDir.isDirectory()) {
      return List.of();
    }
    File[] files = backupsDir.listFiles(File::isDirectory);
    if (files == null || files.length == 0) {
      return List.of();
    }
    return Arrays.stream(files)
        .sorted(
            Comparator.comparingLong(File::lastModified)
                .reversed()
                .thenComparing(File::getName, Comparator.reverseOrder()))
        .toList();
  }

  List<File> listOperationLogArchiveFiles(File archiveDir) {
    if (archiveDir == null || !archiveDir.exists() || !archiveDir.isDirectory()) {
      return List.of();
    }
    File[] files = archiveDir.listFiles(file -> file.isFile() && file.getName().endsWith(".csv"));
    if (files == null || files.length == 0) {
      return List.of();
    }
    return Arrays.stream(files)
        .sorted(
            Comparator.comparingLong(File::lastModified)
                .reversed()
                .thenComparing(File::getName, Comparator.reverseOrder()))
        .toList();
  }
}
