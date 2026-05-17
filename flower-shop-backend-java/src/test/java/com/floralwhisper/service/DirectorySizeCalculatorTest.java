package com.floralwhisper.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class DirectorySizeCalculatorTest {

  private final DirectorySizeCalculator calculator = new DirectorySizeCalculator();

  @TempDir
  Path tempDir;

  @Test
  void calculateReturnsZeroWhenDirectoryMissing() {
    long result = calculator.calculate(tempDir.resolve("missing").toFile());

    assertEquals(0L, result);
  }

  @Test
  void calculateIncludesNestedFileSizes() throws Exception {
    Path root = Files.createDirectories(tempDir.resolve("uploads"));
    Files.writeString(root.resolve("a.txt"), "1234");
    Path nested = Files.createDirectories(root.resolve("nested"));
    Files.writeString(nested.resolve("b.txt"), "123456");

    long result = calculator.calculate(root.toFile());

    assertEquals(10L, result);
  }

  @Test
  void calculateIgnoresSymbolicLinks() throws Exception {
    Path root = Files.createDirectories(tempDir.resolve("backups"));
    Files.writeString(root.resolve("real.txt"), "1234");
    Path nested = Files.createDirectories(root.resolve("nested"));
    Files.writeString(nested.resolve("other.txt"), "12");
    Files.createSymbolicLink(root.resolve("nested-link"), nested);

    long result = calculator.calculate(root.toFile());

    assertEquals(6L, result);
  }
}
