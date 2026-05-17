package com.floralwhisper.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import org.junit.jupiter.api.Test;

class SystemStatusFormatterTest {

  private final ZoneId zoneId = ZoneId.of("Asia/Shanghai");
  private final Clock clock = Clock.fixed(Instant.parse("2026-05-17T04:00:00Z"), zoneId);
  private final StorageDisplayFormatter storageDisplayFormatter = new StorageDisplayFormatter(zoneId);
  private final SystemStatusFormatter formatter = new SystemStatusFormatter(storageDisplayFormatter, clock);

  @Test
  void formatBuildTimeFormatsInstant() {
    assertEquals("2026-05-17 12:00:00", formatter.formatBuildTime(Instant.parse("2026-05-17T04:00:00Z")));
  }

  @Test
  void formatBuildTimeReturnsEmptyWhenNull() {
    assertEquals("", formatter.formatBuildTime(null));
  }

  @Test
  void formatDeployedAtFormatsIsoInstant() {
    assertEquals("2026-05-17 12:00:00", formatter.formatDeployedAt("2026-05-17T04:00:00Z"));
  }

  @Test
  void formatDeployedAtReturnsTrimmedSourceWhenParseFails() {
    assertEquals("2026/05/17 12:00:00", formatter.formatDeployedAt(" 2026/05/17 12:00:00 "));
  }

  @Test
  void formatDeployedAtReturnsEmptyWhenBlank() {
    assertEquals("", formatter.formatDeployedAt(" "));
  }

  @Test
  void formatUptimeReturnsUnknownWhenStartedAtNull() {
    assertEquals("未知", formatter.formatUptime(null));
  }

  @Test
  void formatUptimeReturnsMinutes() {
    assertEquals("45分钟", formatter.formatUptime(Instant.parse("2026-05-17T03:15:00Z")));
  }

  @Test
  void formatUptimeReturnsHoursAndMinutes() {
    assertEquals("2小时30分钟", formatter.formatUptime(Instant.parse("2026-05-17T01:30:00Z")));
  }

  @Test
  void formatUptimeReturnsDaysAndHours() {
    assertEquals("1天3小时", formatter.formatUptime(Instant.parse("2026-05-16T01:00:00Z")));
  }

  @Test
  void formatUptimeReturnsUnknownWhenStartedAtAfterNow() {
    assertEquals("未知", formatter.formatUptime(Instant.parse("2026-05-17T05:00:00Z")));
  }
}
