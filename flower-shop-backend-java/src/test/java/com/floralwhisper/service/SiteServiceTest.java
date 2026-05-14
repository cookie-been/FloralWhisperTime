package com.floralwhisper.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.floralwhisper.config.AppProperties;
import com.floralwhisper.dto.SystemStatusResponse;
import com.floralwhisper.entity.AiSettings;
import com.floralwhisper.mapper.AboutPageMapper;
import com.floralwhisper.mapper.AboutTimelineEntryMapper;
import com.floralwhisper.mapper.AiSettingsMapper;
import com.floralwhisper.mapper.BrandStoryImageMapper;
import com.floralwhisper.mapper.BrandStoryMapper;
import com.floralwhisper.mapper.CategoryMapper;
import com.floralwhisper.mapper.ShopHourMapper;
import com.floralwhisper.mapper.ShopInfoMapper;
import com.floralwhisper.mapper.SiteConfigMapper;
import com.floralwhisper.mapper.SiteConfigStatMapper;
import com.floralwhisper.mapper.TeamMemberMapper;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Clock;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.time.ZoneId;
import javax.sql.DataSource;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.boot.info.BuildProperties;

class SiteServiceTest {

  @TempDir
  Path tempDir;

  @Test
  void systemStatusReturnsResolvedRuntimeState() throws Exception {
    Path uploadsDir = Files.createDirectories(tempDir.resolve("uploads"));
    Files.writeString(uploadsDir.resolve("hero.jpg"), "demo");

    Path backupsDir = Files.createDirectories(tempDir.resolve("backups"));
    Path olderBackup = Files.createDirectories(backupsDir.resolve("20260515-002808"));
    Path latestBackup = Files.createDirectories(backupsDir.resolve("20260515-010101"));
    Files.setLastModifiedTime(olderBackup, java.nio.file.attribute.FileTime.from(Instant.parse("2026-05-15T00:28:08Z")));
    Files.setLastModifiedTime(latestBackup, java.nio.file.attribute.FileTime.from(Instant.parse("2026-05-15T01:01:01Z")));

    AiSettingsMapper aiSettingsMapper = mock(AiSettingsMapper.class);
    when(aiSettingsMapper.selectById(1L)).thenReturn(aiSettings(true, "volcengine", "secret-key", "doubao-image", "doubao-text"));

    DataSource dataSource = mock(DataSource.class);
    Connection connection = mock(Connection.class);
    java.sql.Statement statement = mock(java.sql.Statement.class);
    ResultSet resultSet = mock(ResultSet.class);
    DatabaseMetaData metaData = mock(DatabaseMetaData.class);
    when(dataSource.getConnection()).thenReturn(connection);
    when(connection.isValid(2)).thenReturn(true);
    when(connection.createStatement()).thenReturn(statement);
    when(statement.executeQuery(org.mockito.ArgumentMatchers.anyString())).thenReturn(resultSet);
    when(resultSet.next()).thenReturn(true, false);
    when(resultSet.getString(1)).thenReturn("128.50 MB");
    when(connection.getMetaData()).thenReturn(metaData);
    when(metaData.getDatabaseProductVersion()).thenReturn("8.0.36");

    BuildProperties buildProperties = new BuildProperties(new java.util.Properties() {{
      put("group", "com.floralwhisper");
      put("artifact", "flower-shop-backend-java");
      put("name", "flower-shop-backend-java");
      put("version", "1.2.3");
      put("time", "2026-05-15T00:00:00Z");
    }});

    SiteService siteService =
        new SiteService(
            mock(SiteConfigMapper.class),
            mock(SiteConfigStatMapper.class),
            mock(ShopInfoMapper.class),
            mock(ShopHourMapper.class),
            mock(AboutPageMapper.class),
            mock(AboutTimelineEntryMapper.class),
            aiSettingsMapper,
            mock(BrandStoryMapper.class),
            mock(BrandStoryImageMapper.class),
            mock(CategoryMapper.class),
            mock(TeamMemberMapper.class),
            appProperties(uploadsDir, backupsDir),
            dataSource,
            buildProperties,
            Instant.parse("2026-05-15T00:45:00Z"),
            ZoneId.of("Asia/Shanghai"),
            Clock.fixed(Instant.parse("2026-05-15T01:00:00Z"), ZoneId.of("Asia/Shanghai")));

    SystemStatusResponse response = siteService.getSystemStatus();

    assertEquals("flower-shop-backend-java", response.getService());
    assertEquals("1.2.3", response.getVersion());
    assertTrue(response.isDatabaseConnected());
    assertEquals("8.0.36", response.getDatabaseVersion());
    assertEquals("128.50 MB", response.getDatabaseSize());
    assertEquals(formatBytes(uploadsDir.toFile().getTotalSpace()), response.getDiskTotal());
    assertEquals(formatBytes(uploadsDir.toFile().getUsableSpace()), response.getDiskUsable());
    assertEquals(formatDiskUsageRate(uploadsDir.toFile()), response.getDiskUsageRate());
    assertTrue(response.isUploadDirectoryReady());
    assertEquals(1L, response.getUploadFileCount());
    assertEquals(uploadsDir.toFile().getAbsolutePath(), response.getUploadDirectoryPath());
    assertEquals(formatBytes(Files.size(uploadsDir.resolve("hero.jpg"))), response.getUploadDirectorySize());
    assertTrue(response.isAiEnabled());
    assertTrue(response.isAiKeyConfigured());
    assertEquals("volcengine", response.getAiProvider());
    assertEquals("doubao-image", response.getAiImageModel());
    assertEquals("doubao-text", response.getAiTextModel());
    assertTrue(response.isLatestBackupPresent());
    assertEquals("20260515-010101", response.getLatestBackupName());
    assertEquals(backupsDir.resolve("20260515-010101").toFile().getAbsolutePath(), response.getLatestBackupPath());
    assertEquals("2026-05-15 09:01:01", response.getLatestBackupModifiedAt());
    assertEquals("/api/admin/system/backups/latest/download", response.getLatestBackupDownloadUrl());
    assertEquals("15分钟", response.getUptimeLabel());
  }

  @Test
  void systemStatusHandlesUnavailableDatabaseAndMissingBackupDirectory() throws Exception {
    Path uploadsDir = tempDir.resolve("missing-uploads");
    Path backupsDir = tempDir.resolve("missing-backups");

    AiSettingsMapper aiSettingsMapper = mock(AiSettingsMapper.class);
    when(aiSettingsMapper.selectById(1L)).thenReturn(aiSettings(false, "volcengine", "", "doubao-image", "doubao-text"));

    DataSource dataSource = mock(DataSource.class);
    when(dataSource.getConnection()).thenThrow(new SQLException("down"));

    SiteService siteService =
        new SiteService(
            mock(SiteConfigMapper.class),
            mock(SiteConfigStatMapper.class),
            mock(ShopInfoMapper.class),
            mock(ShopHourMapper.class),
            mock(AboutPageMapper.class),
            mock(AboutTimelineEntryMapper.class),
            aiSettingsMapper,
            mock(BrandStoryMapper.class),
            mock(BrandStoryImageMapper.class),
            mock(CategoryMapper.class),
            mock(TeamMemberMapper.class),
            appProperties(uploadsDir, backupsDir),
            dataSource,
            null,
            null,
            ZoneId.of("Asia/Shanghai"),
            Clock.fixed(Instant.parse("2026-05-15T01:00:00Z"), ZoneId.of("Asia/Shanghai")));

    SystemStatusResponse response = siteService.getSystemStatus();

    assertFalse(response.isDatabaseConnected());
    assertEquals("", response.getDatabaseVersion());
    assertEquals("", response.getDatabaseSize());
    assertEquals("", response.getDiskTotal());
    assertEquals("", response.getDiskUsable());
    assertEquals("", response.getDiskUsageRate());
    assertFalse(response.isUploadDirectoryReady());
    assertEquals(0L, response.getUploadFileCount());
    assertEquals("", response.getUploadDirectorySize());
    assertFalse(response.isAiEnabled());
    assertFalse(response.isAiKeyConfigured());
    assertFalse(response.isLatestBackupPresent());
    assertEquals("", response.getLatestBackupName());
    assertEquals("", response.getLatestBackupPath());
    assertEquals("", response.getLatestBackupModifiedAt());
    assertEquals("", response.getLatestBackupDownloadUrl());
    assertEquals("未知", response.getUptimeLabel());
  }

  private AppProperties appProperties(Path uploadsDir, Path backupsDir) {
    AppProperties properties = new AppProperties();
    AppProperties.Upload upload = new AppProperties.Upload();
    upload.setDir(uploadsDir.toString());
    properties.setUpload(upload);
    AppProperties.Backup backup = new AppProperties.Backup();
    backup.setDir(backupsDir.toString());
    properties.setBackup(backup);
    return properties;
  }

  private AiSettings aiSettings(boolean enabled, String provider, String apiKey, String imageModel, String textModel) {
    AiSettings settings = new AiSettings();
    settings.setId(1L);
    settings.setEnabled(enabled);
    settings.setProvider(provider);
    settings.setApiKey(apiKey);
    settings.setModel(imageModel);
    settings.setTextModel(textModel);
    return settings;
  }

  private String formatBytes(long bytes) {
    if (bytes <= 0L) {
      return "";
    }
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
    return String.format(java.util.Locale.US, "%.2f %s", value, unit);
  }

  private String formatDiskUsageRate(java.io.File directory) {
    long total = directory.getTotalSpace();
    long usable = directory.getUsableSpace();
    if (total <= 0L) {
      return "";
    }
    double usedRate = ((double) (total - usable) / (double) total) * 100D;
    return String.format(java.util.Locale.US, "%.2f%%", usedRate);
  }
}
