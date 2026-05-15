package com.floralwhisper.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.floralwhisper.audit.AuditLogCommand;
import com.floralwhisper.audit.AuditLogService;
import com.floralwhisper.config.AppProperties;
import com.floralwhisper.dto.SystemStatusResponse;
import com.floralwhisper.dto.SiteConfigUpdateRequest;
import com.floralwhisper.entity.BrandStory;
import com.floralwhisper.entity.AiSettings;
import com.floralwhisper.entity.OperationLog;
import com.floralwhisper.entity.ShopInfo;
import com.floralwhisper.entity.SiteConfig;
import com.floralwhisper.entity.SiteConfigStat;
import com.floralwhisper.mapper.AboutPageMapper;
import com.floralwhisper.mapper.AboutTimelineEntryMapper;
import com.floralwhisper.mapper.AiSettingsMapper;
import com.floralwhisper.mapper.BrandStoryImageMapper;
import com.floralwhisper.mapper.BrandStoryMapper;
import com.floralwhisper.mapper.CategoryMapper;
import com.floralwhisper.mapper.OperationLogMapper;
import com.floralwhisper.mapper.ShopHourMapper;
import com.floralwhisper.mapper.ShopInfoMapper;
import com.floralwhisper.mapper.SiteConfigMapper;
import com.floralwhisper.mapper.SiteConfigStatMapper;
import com.floralwhisper.mapper.TeamMemberMapper;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Clock;
import java.time.LocalDateTime;
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
  void updateSiteConfigNoLongerWritesLegacyStatsTable() {
    SiteConfigMapper siteConfigMapper = mock(SiteConfigMapper.class);
    SiteConfigStatMapper siteConfigStatMapper = mock(SiteConfigStatMapper.class);
    ShopInfoMapper shopInfoMapper = mock(ShopInfoMapper.class);
    BrandStoryMapper brandStoryMapper = mock(BrandStoryMapper.class);
    BrandStoryImageMapper brandStoryImageMapper = mock(BrandStoryImageMapper.class);
    AuditLogService auditLogService = mock(AuditLogService.class);

    SiteConfig siteConfig = new SiteConfig();
    siteConfig.setId(1L);
    siteConfig.setBrandName("花语时光");
    siteConfig.setHeroTitle("花语时光");
    when(siteConfigMapper.selectById(1L)).thenReturn(siteConfig);

    ShopInfo shopInfo = new ShopInfo();
    shopInfo.setId(1L);
    shopInfo.setName("花语时光");
    when(shopInfoMapper.selectById(1L)).thenReturn(shopInfo);

    BrandStory story = new BrandStory();
    story.setId(1L);
    story.setTitle("品牌故事");
    when(brandStoryMapper.selectById(1L)).thenReturn(story);
    when(brandStoryImageMapper.selectList(any())).thenReturn(java.util.List.of());

    SiteService siteService =
        new SiteService(
            siteConfigMapper,
            siteConfigStatMapper,
            shopInfoMapper,
            mock(ShopHourMapper.class),
            mock(AboutPageMapper.class),
            mock(AboutTimelineEntryMapper.class),
            mock(AiSettingsMapper.class),
            brandStoryMapper,
            brandStoryImageMapper,
            mock(CategoryMapper.class),
            mock(OperationLogMapper.class),
            mock(TeamMemberMapper.class),
            appProperties(tempDir.resolve("uploads"), tempDir.resolve("backups")),
            mock(DataSource.class),
            null,
            auditLogService,
            Instant.parse("2026-05-15T00:45:00Z"),
            ZoneId.of("Asia/Shanghai"),
            Clock.fixed(Instant.parse("2026-05-15T01:00:00Z"), ZoneId.of("Asia/Shanghai")));

    SiteConfigUpdateRequest request = new SiteConfigUpdateRequest();
    request.setBrandName("花语时光 Pro");

    siteService.updateSiteConfig(request);

    verify(siteConfigMapper).updateById(any(SiteConfig.class));
    verify(siteConfigStatMapper, never()).delete(any());
    verify(siteConfigStatMapper, never()).insert(any(SiteConfigStat.class));
    verify(auditLogService, times(1)).record(any(AuditLogCommand.class));
  }

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
    OperationLogMapper operationLogMapper = mock(OperationLogMapper.class);
    when(operationLogMapper.selectCount(any())).thenReturn(128L);
    when(operationLogMapper.selectOne(any())).thenReturn(operationLogAt(LocalDateTime.of(2026, 5, 15, 8, 15)));

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
            operationLogMapper,
            mock(TeamMemberMapper.class),
            appProperties(uploadsDir, backupsDir),
            dataSource,
            buildProperties,
            mock(AuditLogService.class),
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
    assertEquals(128L, response.getOperationLogCount());
    assertEquals(180, response.getOperationLogRetentionDays());
    assertEquals("2025-11-16 08:15:00", response.getOperationLogArchiveBefore());
  }

  @Test
  void systemStatusHandlesUnavailableDatabaseAndMissingBackupDirectory() throws Exception {
    Path uploadsDir = tempDir.resolve("missing-uploads");
    Path backupsDir = tempDir.resolve("missing-backups");

    AiSettingsMapper aiSettingsMapper = mock(AiSettingsMapper.class);
    when(aiSettingsMapper.selectById(1L)).thenReturn(aiSettings(false, "volcengine", "", "doubao-image", "doubao-text"));
    OperationLogMapper operationLogMapper = mock(OperationLogMapper.class);
    when(operationLogMapper.selectCount(any())).thenReturn(0L);
    when(operationLogMapper.selectOne(any())).thenReturn(null);

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
            operationLogMapper,
            mock(TeamMemberMapper.class),
            appProperties(uploadsDir, backupsDir),
            dataSource,
            null,
            mock(AuditLogService.class),
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
    assertEquals(0L, response.getOperationLogCount());
    assertEquals(180, response.getOperationLogRetentionDays());
    assertEquals("", response.getOperationLogArchiveBefore());
  }

  @Test
  void archiveOperationLogsWritesCsvAndDeletesArchivedRows() throws Exception {
    Path uploadsDir = Files.createDirectories(tempDir.resolve("uploads"));
    Path backupsDir = Files.createDirectories(tempDir.resolve("backups"));
    Path archiveDir = Files.createDirectories(backupsDir.resolve("operation-logs"));

    AiSettingsMapper aiSettingsMapper = mock(AiSettingsMapper.class);
    when(aiSettingsMapper.selectById(1L)).thenReturn(aiSettings(false, "volcengine", "", "doubao-image", "doubao-text"));

    OperationLogMapper operationLogMapper = mock(OperationLogMapper.class);
    when(operationLogMapper.selectList(any())).thenReturn(java.util.List.of(
        operationLog(7L, "FLOWER", "UPDATE", "FLOWER", "daily-001", LocalDateTime.of(2025, 10, 1, 10, 0)),
        operationLog(8L, "SITE", "UPDATE", "SITE_CONFIG", "1", LocalDateTime.of(2025, 10, 2, 11, 30))));
    when(operationLogMapper.delete(any())).thenReturn(2);

    AuditLogService auditLogService = mock(AuditLogService.class);

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
            operationLogMapper,
            mock(TeamMemberMapper.class),
            appProperties(uploadsDir, backupsDir),
            mock(DataSource.class),
            null,
            auditLogService,
            Instant.parse("2026-05-15T00:45:00Z"),
            ZoneId.of("Asia/Shanghai"),
            Clock.fixed(Instant.parse("2026-05-15T01:00:00Z"), ZoneId.of("Asia/Shanghai")));

    var archive = siteService.archiveOperationLogs(LocalDateTime.of(2025, 12, 1, 0, 0));

    assertTrue(archive.getArchiveFilename().startsWith("operation-logs-archive-"));
    assertTrue(archive.getArchiveFilename().endsWith(".csv"));
    assertEquals(2, archive.getArchivedCount());
    Path archivedFile = archiveDir.resolve(archive.getArchiveFilename());
    assertTrue(Files.exists(archivedFile));
    String content = Files.readString(archivedFile);
    assertTrue(content.contains("daily-001"));
    assertTrue(content.contains("SITE_CONFIG"));
    verify(operationLogMapper).delete(any());
    verify(auditLogService, times(1)).record(any(AuditLogCommand.class));
  }

  @Test
  void listOperationLogArchiveFilesReturnsSortedFiles() throws Exception {
    Path uploadsDir = Files.createDirectories(tempDir.resolve("uploads"));
    Path backupsDir = Files.createDirectories(tempDir.resolve("backups"));
    Path archiveDir = Files.createDirectories(backupsDir.resolve("operation-logs"));
    Path older = archiveDir.resolve("operation-logs-archive-20260514-090000.csv");
    Path latest = archiveDir.resolve("operation-logs-archive-20260515-090000.csv");
    Files.writeString(older, "older");
    Files.writeString(latest, "latest");
    Files.setLastModifiedTime(older, java.nio.file.attribute.FileTime.from(Instant.parse("2026-05-14T01:00:00Z")));
    Files.setLastModifiedTime(latest, java.nio.file.attribute.FileTime.from(Instant.parse("2026-05-15T01:00:00Z")));

    AiSettingsMapper aiSettingsMapper = mock(AiSettingsMapper.class);
    when(aiSettingsMapper.selectById(1L)).thenReturn(aiSettings(false, "volcengine", "", "doubao-image", "doubao-text"));

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
            mock(OperationLogMapper.class),
            mock(TeamMemberMapper.class),
            appProperties(uploadsDir, backupsDir),
            mock(DataSource.class),
            null,
            mock(AuditLogService.class),
            Instant.parse("2026-05-15T00:45:00Z"),
            ZoneId.of("Asia/Shanghai"),
            Clock.fixed(Instant.parse("2026-05-15T01:00:00Z"), ZoneId.of("Asia/Shanghai")));

    var files = siteService.listOperationLogArchiveFiles();

    assertEquals(2, files.size());
    assertEquals("operation-logs-archive-20260515-090000.csv", files.get(0).getFilename());
    assertTrue(files.get(0).getDownloadUrl().contains("/api/admin/system/operation-logs/archive-files/operation-logs-archive-20260515-090000.csv/download"));
  }

  private AppProperties appProperties(Path uploadsDir, Path backupsDir) {
    AppProperties properties = new AppProperties();
    AppProperties.Upload upload = new AppProperties.Upload();
    upload.setDir(uploadsDir.toString());
    properties.setUpload(upload);
    AppProperties.Backup backup = new AppProperties.Backup();
    backup.setDir(backupsDir.toString());
    properties.setBackup(backup);
    AppProperties.OperationLog operationLog = new AppProperties.OperationLog();
    operationLog.setRetentionDays(180);
    operationLog.setArchiveDir("operation-logs");
    properties.setOperationLog(operationLog);
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

  private OperationLog operationLogAt(LocalDateTime createdAt) {
    OperationLog log = new OperationLog();
    log.setId(99L);
    log.setCreatedAt(createdAt);
    return log;
  }

  private OperationLog operationLog(Long id, String module, String action, String targetType, String targetId, LocalDateTime createdAt) {
    OperationLog log = new OperationLog();
    log.setId(id);
    log.setModule(module);
    log.setAction(action);
    log.setTargetType(targetType);
    log.setTargetId(targetId);
    log.setOperatorName("admin");
    log.setRequestSummary("{\"id\":\"" + targetId + "\"}");
    log.setSuccess(true);
    log.setCreatedAt(createdAt);
    return log;
  }
}
