package com.floralwhisper.service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.util.HashSet;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

final class DirectorySizeCalculator {

  private static final Logger log = LoggerFactory.getLogger(DirectorySizeCalculator.class);

  long calculate(File directory) {
    return calculate(directory, new HashSet<>());
  }

  private long calculate(File directory, Set<Path> visitedPaths) {
    if (directory == null || !directory.exists() || !directory.isDirectory()) {
      return 0L;
    }
    Path directoryPath = directory.toPath().toAbsolutePath().normalize();
    if (!visitedPaths.add(directoryPath)) {
      return 0L;
    }
    File[] files = directory.listFiles();
    if (files == null) {
      return 0L;
    }
    long total = 0L;
    for (File file : files) {
      try {
        Path filePath = file.toPath();
        if (Files.isSymbolicLink(filePath)) {
          continue;
        }
        if (Files.isDirectory(filePath, LinkOption.NOFOLLOW_LINKS)) {
          total += calculate(file, visitedPaths);
        } else {
          total += Files.size(filePath);
        }
      } catch (IOException | SecurityException exception) {
        log.warn("Skipping backup file while calculating size: {}", file.getAbsolutePath(), exception);
      }
    }
    return total;
  }
}
