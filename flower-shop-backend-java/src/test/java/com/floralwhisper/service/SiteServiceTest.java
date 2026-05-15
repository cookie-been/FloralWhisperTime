package com.floralwhisper.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.atLeast;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.floralwhisper.audit.AuditLogCommand;
import com.floralwhisper.audit.AuditLogService;
import com.floralwhisper.config.AppProperties;
import com.floralwhisper.config.CacheConfig;
import com.floralwhisper.dto.ConfigImportResponse;
import com.floralwhisper.dto.AboutPageResponse;
import com.floralwhisper.dto.BrandStoryResponse;
import com.floralwhisper.dto.SystemStatusResponse;
import com.floralwhisper.dto.SiteConfigUpdateRequest;
import com.floralwhisper.dto.ShopInfoResponse;
import com.floralwhisper.dto.SiteConfigResponse;
import com.floralwhisper.dto.AboutTimelineEntryResponse;
import com.floralwhisper.protection.ProtectionMetrics;
import com.floralwhisper.protection.RouteProtectionGroup;
import com.floralwhisper.entity.AboutPage;
import com.floralwhisper.entity.AboutTimelineEntry;
import com.floralwhisper.entity.BrandStory;
import com.floralwhisper.entity.AiSettings;
import com.floralwhisper.entity.OperationLog;
import com.floralwhisper.entity.ShopHour;
import com.floralwhisper.entity.ShopInfo;
import com.floralwhisper.entity.SiteConfig;
import com.floralwhisper.entity.TeamMember;
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
import com.floralwhisper.mapper.TeamMemberMapper;
import java.nio.file.Files;
import java.nio.file.Path;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.time.Clock;
import java.time.LocalDateTime;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import javax.sql.DataSource;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.cache.CacheManager;
import org.springframework.cache.interceptor.SimpleKey;
import org.springframework.boot.info.BuildProperties;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.boot.context.properties.source.MapConfigurationPropertySource;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.mock.web.MockMultipartFile;

class SiteServiceTest {

  @TempDir
  Path tempDir;

  @Test
  void protectionDefaultsExposeExpectedThresholds() {
    AppProperties properties = new AppProperties();

    assertEquals(60, properties.getProtection().getPublicRead().getCapacity());
    assertEquals(2, properties.getProtection().getConcurrency().getAi().getMaxConcurrent());
  }

  @Test
  void protectionBindingMapsKebabCaseKeysToConcurrencySettings() {
    Binder binder = new Binder(new MapConfigurationPropertySource(Map.of(
        "app.protection.heavy.capacity", "9",
        "app.protection.concurrency.config-import.max-concurrent", "3")));

    AppProperties properties = binder.bind("app", AppProperties.class).orElseThrow(IllegalStateException::new);

    assertEquals(9, properties.getProtection().getHeavy().getCapacity());
    assertEquals(3, properties.getProtection().getConcurrency().getConfigImport().getMaxConcurrent());
  }

  @Test
  void getSiteConfigUsesCacheForRepeatedReads() {
    SiteConfigMapper siteConfigMapper = mock(SiteConfigMapper.class);
    when(siteConfigMapper.selectById(1L)).thenReturn(siteConfigForExport());

    try (AnnotationConfigApplicationContext context = createCachedSiteServiceContext(
        siteConfigMapper,
        mock(ShopInfoMapper.class),
        mock(ShopHourMapper.class),
        mock(AboutPageMapper.class),
        mock(AboutTimelineEntryMapper.class),
        mock(AiSettingsMapper.class),
        mock(BrandStoryMapper.class),
        mock(BrandStoryImageMapper.class),
        mock(CategoryMapper.class),
        mock(OperationLogMapper.class),
        mock(TeamMemberMapper.class),
        mock(AuditLogService.class))) {
      SiteService siteService = context.getBean(SiteService.class);

      siteService.getSiteConfig();
      siteService.getSiteConfig();

      verify(siteConfigMapper, times(1)).selectById(1L);
    }
  }

  @Test
  void updateSiteConfigEvictsCachedSiteConfig() {
    SiteConfigMapper siteConfigMapper = mock(SiteConfigMapper.class);
    ShopInfoMapper shopInfoMapper = mock(ShopInfoMapper.class);
    BrandStoryMapper brandStoryMapper = mock(BrandStoryMapper.class);
    BrandStoryImageMapper brandStoryImageMapper = mock(BrandStoryImageMapper.class);
    AuditLogService auditLogService = mock(AuditLogService.class);

    when(siteConfigMapper.selectById(1L)).thenReturn(siteConfigForExport());
    when(shopInfoMapper.selectById(1L)).thenReturn(shopInfoForExport());
    when(brandStoryMapper.selectById(1L)).thenReturn(brandStoryForExport());
    when(brandStoryImageMapper.selectList(any())).thenReturn(List.of());

    try (AnnotationConfigApplicationContext context = createCachedSiteServiceContext(
        siteConfigMapper,
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
        auditLogService)) {
      SiteService siteService = context.getBean(SiteService.class);
      CacheManager cacheManager = context.getBean(CacheManager.class);

      siteService.getSiteConfig();
      assertNotNull(cacheManager.getCache("siteConfig"));
      assertNotNull(cacheManager.getCache("siteConfig").get(SimpleKey.EMPTY));

      SiteConfigUpdateRequest request = new SiteConfigUpdateRequest();
      request.setBrandName("花语时光 PRO");
      siteService.updateSiteConfig(request);

      assertNull(cacheManager.getCache("siteConfig").get(SimpleKey.EMPTY));
    }
  }

  @Test
  void updateSiteConfigNoLongerWritesLegacyStatsTable() {
    SiteConfigMapper siteConfigMapper = mock(SiteConfigMapper.class);
    ShopInfoMapper shopInfoMapper = mock(ShopInfoMapper.class);
    BrandStoryMapper brandStoryMapper = mock(BrandStoryMapper.class);
    BrandStoryImageMapper brandStoryImageMapper = mock(BrandStoryImageMapper.class);
    AuditLogService auditLogService = mock(AuditLogService.class);

    SiteConfig siteConfig = new SiteConfig();
    siteConfig.setId(1L);
    siteConfig.setBrandName("花语时光");
    siteConfig.setHeroTitle("花语时光");
    siteConfig.setLicenseCustomerName("演示客户");
    siteConfig.setLicenseCode("FWT-DEMO-001");
    siteConfig.setLicenseType("正式版");
    siteConfig.setLicenseExpiresAt(LocalDateTime.of(2026, 6, 1, 0, 0));
    siteConfig.setLicenseWarningDays(30);
    siteConfig.setLicenseNotes("演示授权");
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
            appProperties(tempDir.resolve("uploads"), tempDir.resolve("backups"), "local", "dev", ""),
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
    verify(auditLogService, times(1)).record(any(AuditLogCommand.class));
  }

  @Test
  void cleanReleaseDefaultsDoNotSeedDemoContent() {
    SiteConfigMapper siteConfigMapper = mock(SiteConfigMapper.class);
    ShopInfoMapper shopInfoMapper = mock(ShopInfoMapper.class);
    ShopHourMapper shopHourMapper = mock(ShopHourMapper.class);
    AboutPageMapper aboutPageMapper = mock(AboutPageMapper.class);
    AboutTimelineEntryMapper aboutTimelineEntryMapper = mock(AboutTimelineEntryMapper.class);
    AiSettingsMapper aiSettingsMapper = mock(AiSettingsMapper.class);
    BrandStoryMapper brandStoryMapper = mock(BrandStoryMapper.class);
    BrandStoryImageMapper brandStoryImageMapper = mock(BrandStoryImageMapper.class);
    TeamMemberMapper teamMemberMapper = mock(TeamMemberMapper.class);

    when(siteConfigMapper.selectById(1L)).thenReturn(null);
    when(shopInfoMapper.selectById(1L)).thenReturn(null);
    when(aboutPageMapper.selectById(1L)).thenReturn(null);
    when(aiSettingsMapper.selectById(1L)).thenReturn(null);
    when(brandStoryMapper.selectById(1L)).thenReturn(null);
    when(shopHourMapper.selectList(any())).thenReturn(List.of());
    when(aboutTimelineEntryMapper.selectList(any())).thenReturn(List.of());
    when(teamMemberMapper.selectList(any())).thenReturn(List.of());
    when(brandStoryImageMapper.selectList(any())).thenReturn(List.of());

    SiteService siteService = createSiteService(
        siteConfigMapper,
        shopInfoMapper,
        shopHourMapper,
        aboutPageMapper,
        aboutTimelineEntryMapper,
        aiSettingsMapper,
        brandStoryMapper,
        brandStoryImageMapper,
        mock(OperationLogMapper.class),
        teamMemberMapper,
        mock(AuditLogService.class));

    SiteConfigResponse siteConfig = siteService.getSiteConfig();
    ShopInfoResponse shopInfo = siteService.getShopInfo();
    BrandStoryResponse brandStory = siteService.getBrandStory();
    AboutPageResponse aboutPage = siteService.getAboutPage();
    List<AboutTimelineEntryResponse> timeline = siteService.getAboutTimeline();
    List<TeamMember> teamMembers = siteService.getAdminTeamMembers();

    assertEquals("花语时光", siteConfig.getBrandName());
    assertEquals("花语时光", siteConfig.getHeroTitle());
    assertEquals("", siteConfig.getHeroEyebrow());
    assertEquals("", siteConfig.getHeroDescription());
    assertEquals("", siteConfig.getHeroImage());
    assertEquals("浏览作品", siteConfig.getPrimaryCtaText());
    assertEquals("联系门店", siteConfig.getSecondaryCtaText());
    assertEquals("", siteConfig.getContactIntro());
    assertEquals("", siteConfig.getBusinessHoursText());
    assertEquals("", siteConfig.getFooterDescription());

    assertEquals("花语时光", shopInfo.getName());
    assertEquals("", shopInfo.getPhone());
    assertEquals("", shopInfo.getWechat());
    assertEquals("", shopInfo.getAddress());
    assertEquals(java.math.BigDecimal.ZERO, shopInfo.getLatitude());
    assertEquals(java.math.BigDecimal.ZERO, shopInfo.getLongitude());
    assertNotNull(shopInfo.getHours());
    assertNull(shopInfo.getHours().getMonday());
    assertNull(shopInfo.getHours().getSunday());

    assertEquals("", brandStory.getTitle());
    assertEquals("", brandStory.getSubtitle());
    assertEquals("", brandStory.getContent());
    assertTrue(brandStory.getImages().isEmpty());

    assertEquals("", aboutPage.getHeroImage());
    assertEquals("", aboutPage.getHeroEyebrow());
    assertEquals("关于我们", aboutPage.getHeroTitle());
    assertEquals("", aboutPage.getHeroSubtitle());
    assertEquals("品牌故事", aboutPage.getStoryTitle());
    assertEquals("", aboutPage.getStoryContent());

    assertTrue(timeline.isEmpty());
    assertTrue(teamMembers.isEmpty());

    verify(siteConfigMapper, times(1)).insert(any(SiteConfig.class));
    verify(shopInfoMapper, times(1)).insert(any(ShopInfo.class));
    verify(brandStoryMapper, times(1)).insert(any(BrandStory.class));
    verify(aboutPageMapper, times(1)).insert(any(AboutPage.class));
    verify(aiSettingsMapper, never()).insert(any(AiSettings.class));
    verify(shopHourMapper, never()).insert(any(ShopHour.class));
    verify(aboutTimelineEntryMapper, never()).insert(any(AboutTimelineEntry.class));
    verify(teamMemberMapper, never()).insert(any(TeamMember.class));
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
    SiteConfigMapper siteConfigMapper = mock(SiteConfigMapper.class);
    SiteConfig siteConfig = new SiteConfig();
    siteConfig.setId(1L);
    siteConfig.setBrandName("花语时光");
    siteConfig.setHeroTitle("花语时光");
    siteConfig.setLicenseCustomerName("演示客户");
    siteConfig.setLicenseCode("FWT-DEMO-001");
    siteConfig.setLicenseType("正式版");
    siteConfig.setLicenseExpiresAt(LocalDateTime.of(2026, 6, 1, 0, 0));
    siteConfig.setLicenseWarningDays(30);
    siteConfig.setLicenseNotes("演示授权");
    when(siteConfigMapper.selectById(1L)).thenReturn(siteConfig);

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
            siteConfigMapper,
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
            appProperties(uploadsDir, backupsDir, "production", "abc123def456", "2026-05-15T01:30:00Z"),
            dataSource,
            buildProperties,
            mock(AuditLogService.class),
            Instant.parse("2026-05-15T00:45:00Z"),
            ZoneId.of("Asia/Shanghai"),
            Clock.fixed(Instant.parse("2026-05-15T01:00:00Z"), ZoneId.of("Asia/Shanghai")));

    SystemStatusResponse response = siteService.getSystemStatus();

    assertEquals("flower-shop-backend-java", response.getService());
    assertEquals("1.2.3", response.getVersion());
    assertEquals("production", response.getDeploymentEnvironment());
    assertEquals("abc123def456", response.getGitRevision());
    assertEquals("2026-05-15 08:00:00", response.getBuildTime());
    assertEquals("2026-05-15 09:30:00", response.getDeployedAt());
    assertEquals("演示客户", response.getLicenseCustomerName());
    assertEquals("FWT-DEMO-001", response.getLicenseCode());
    assertEquals("正式版", response.getLicenseType());
    assertEquals("2026-06-01 00:00:00", response.getLicenseExpiresAt());
    assertEquals(30, response.getLicenseWarningDays());
    assertEquals("演示授权", response.getLicenseNotes());
    assertEquals("expiring", response.getLicenseStatus());
    assertEquals("授权将在 30 天内到期", response.getLicenseStatusLabel());
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
    SiteConfigMapper siteConfigMapper = mock(SiteConfigMapper.class);
    when(siteConfigMapper.selectById(1L)).thenReturn(null);

    DataSource dataSource = mock(DataSource.class);
    when(dataSource.getConnection()).thenThrow(new SQLException("down"));

    SiteService siteService =
        new SiteService(
            siteConfigMapper,
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
            appProperties(uploadsDir, backupsDir, "local", "dev", ""),
            dataSource,
            null,
            mock(AuditLogService.class),
            null,
            ZoneId.of("Asia/Shanghai"),
            Clock.fixed(Instant.parse("2026-05-15T01:00:00Z"), ZoneId.of("Asia/Shanghai")));

    SystemStatusResponse response = siteService.getSystemStatus();

    assertFalse(response.isDatabaseConnected());
    assertEquals("local", response.getDeploymentEnvironment());
    assertEquals("dev", response.getGitRevision());
    assertEquals("", response.getBuildTime());
    assertEquals("", response.getDeployedAt());
    assertEquals("", response.getLicenseCustomerName());
    assertEquals("", response.getLicenseCode());
    assertEquals("", response.getLicenseType());
    assertEquals("", response.getLicenseExpiresAt());
    assertEquals(30, response.getLicenseWarningDays());
    assertEquals("", response.getLicenseNotes());
    assertEquals("missing", response.getLicenseStatus());
    assertEquals("未配置授权信息", response.getLicenseStatusLabel());
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
  void systemStatusIncludesProtectionSnapshot() throws Exception {
    Path uploadsDir = Files.createDirectories(tempDir.resolve("uploads"));
    Path backupsDir = Files.createDirectories(tempDir.resolve("backups"));

    AiSettingsMapper aiSettingsMapper = mock(AiSettingsMapper.class);
    when(aiSettingsMapper.selectById(1L)).thenReturn(aiSettings(true, "volcengine", "secret-key", "doubao-image", "doubao-text"));
    OperationLogMapper operationLogMapper = mock(OperationLogMapper.class);
    when(operationLogMapper.selectCount(any())).thenReturn(0L);
    when(operationLogMapper.selectOne(any())).thenReturn(null);
    SiteConfigMapper siteConfigMapper = mock(SiteConfigMapper.class);
    when(siteConfigMapper.selectById(1L)).thenReturn(siteConfigForExport());

    ProtectionMetrics protectionMetrics = new ProtectionMetrics();
    protectionMetrics.recordRejected(RouteProtectionGroup.PUBLIC_READ);
    protectionMetrics.recordRejected(RouteProtectionGroup.ADMIN);
    protectionMetrics.recordBusyRejected();

    SiteService siteService =
        new SiteService(
            siteConfigMapper,
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
            appProperties(uploadsDir, backupsDir, "production", "abc123def456", "2026-05-15T01:30:00Z"),
            mock(DataSource.class),
            null,
            protectionMetrics,
            mock(AuditLogService.class),
            Instant.parse("2026-05-15T00:45:00Z"),
            ZoneId.of("Asia/Shanghai"),
            Clock.fixed(Instant.parse("2026-05-15T01:00:00Z"), ZoneId.of("Asia/Shanghai")));

    SystemStatusResponse response = siteService.getSystemStatus();

    assertNotNull(response.getProtection());
    assertTrue(response.getProtection().isEnabled());
    assertEquals(60, response.getProtection().getPublicReadCapacity());
    assertEquals(12, response.getProtection().getPublicWriteCapacity());
    assertEquals(30, response.getProtection().getAdminCapacity());
    assertEquals(6, response.getProtection().getHeavyCapacity());
    assertEquals(2, response.getProtection().getAiMaxConcurrent());
    assertEquals(4, response.getProtection().getUploadMaxConcurrent());
    assertEquals(1, response.getProtection().getConfigImportMaxConcurrent());
    assertEquals(2L, response.getProtection().getRateLimitedCount());
    assertEquals(1L, response.getProtection().getBusyRejectedCount());
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
            appProperties(uploadsDir, backupsDir, "local", "dev", ""),
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
            appProperties(uploadsDir, backupsDir, "local", "dev", ""),
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

  @Test
  void configExportWritesCompleteSnapshotJson() throws Exception {
    SiteConfigMapper siteConfigMapper = mock(SiteConfigMapper.class);
    ShopInfoMapper shopInfoMapper = mock(ShopInfoMapper.class);
    ShopHourMapper shopHourMapper = mock(ShopHourMapper.class);
    AboutPageMapper aboutPageMapper = mock(AboutPageMapper.class);
    AboutTimelineEntryMapper aboutTimelineEntryMapper = mock(AboutTimelineEntryMapper.class);
    AiSettingsMapper aiSettingsMapper = mock(AiSettingsMapper.class);
    BrandStoryMapper brandStoryMapper = mock(BrandStoryMapper.class);
    BrandStoryImageMapper brandStoryImageMapper = mock(BrandStoryImageMapper.class);
    TeamMemberMapper teamMemberMapper = mock(TeamMemberMapper.class);
    AuditLogService auditLogService = mock(AuditLogService.class);

    when(siteConfigMapper.selectById(1L)).thenReturn(siteConfigForExport());
    when(shopInfoMapper.selectById(1L)).thenReturn(shopInfoForExport());
    when(shopHourMapper.selectList(any())).thenReturn(defaultHours());
    when(aboutPageMapper.selectById(1L)).thenReturn(aboutPageForExport());
    when(aboutTimelineEntryMapper.selectList(any())).thenReturn(List.of(timelineEntry("timeline_2024", "2024", "完成品牌升级", 0)));
    when(aiSettingsMapper.selectById(1L)).thenReturn(aiSettings(true, "volcengine", "secret-key", "doubao-image", "doubao-text"));
    when(brandStoryMapper.selectById(1L)).thenReturn(brandStoryForExport());
    when(brandStoryImageMapper.selectList(any())).thenReturn(List.of(brandStoryImage("https://example.com/story-1.jpg", 0)));
    when(teamMemberMapper.selectList(any())).thenReturn(List.of(teamMember("team_01", "林汐", "主理花艺师", "https://example.com/team-1.jpg", 5)));

    SiteService siteService = createSiteService(
        siteConfigMapper,
        shopInfoMapper,
        shopHourMapper,
        aboutPageMapper,
        aboutTimelineEntryMapper,
        aiSettingsMapper,
        brandStoryMapper,
        brandStoryImageMapper,
        mock(OperationLogMapper.class),
        teamMemberMapper,
        auditLogService);

    ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
    String filename = siteService.writeConfigExport(outputStream);
    String payload = outputStream.toString(java.nio.charset.StandardCharsets.UTF_8);

    assertTrue(filename.startsWith("site-config-export-"));
    assertTrue(filename.endsWith(".json"));
    assertTrue(payload.contains("\"version\""));
    assertTrue(payload.contains("\"siteConfig\""));
    assertTrue(payload.contains("\"aboutPage\""));
    assertTrue(payload.contains("\"timeline\""));
    assertTrue(payload.contains("\"team\""));
    assertTrue(payload.contains("\"aiSettings\""));
    verify(auditLogService, times(1)).record(any(AuditLogCommand.class));
  }

  @Test
  void importConfigRestoresAllManagedSections() throws Exception {
    SiteConfigMapper siteConfigMapper = mock(SiteConfigMapper.class);
    ShopInfoMapper shopInfoMapper = mock(ShopInfoMapper.class);
    ShopHourMapper shopHourMapper = mock(ShopHourMapper.class);
    AboutPageMapper aboutPageMapper = mock(AboutPageMapper.class);
    AboutTimelineEntryMapper aboutTimelineEntryMapper = mock(AboutTimelineEntryMapper.class);
    AiSettingsMapper aiSettingsMapper = mock(AiSettingsMapper.class);
    BrandStoryMapper brandStoryMapper = mock(BrandStoryMapper.class);
    BrandStoryImageMapper brandStoryImageMapper = mock(BrandStoryImageMapper.class);
    TeamMemberMapper teamMemberMapper = mock(TeamMemberMapper.class);
    AuditLogService auditLogService = mock(AuditLogService.class);

    SiteConfig existingSiteConfig = siteConfigForExport();
    ShopInfo existingShopInfo = shopInfoForExport();
    AboutPage existingAboutPage = aboutPageForExport();
    BrandStory existingStory = brandStoryForExport();
    AiSettings existingAiSettings = aiSettings(true, "volcengine", "old-key", "old-image", "old-text");

    when(siteConfigMapper.selectById(1L)).thenReturn(existingSiteConfig);
    when(shopInfoMapper.selectById(1L)).thenReturn(existingShopInfo);
    when(shopHourMapper.selectList(any())).thenReturn(defaultHours());
    when(aboutPageMapper.selectById(1L)).thenReturn(existingAboutPage);
    when(aboutTimelineEntryMapper.selectList(any())).thenReturn(List.of());
    when(aiSettingsMapper.selectById(1L)).thenReturn(existingAiSettings);
    when(brandStoryMapper.selectById(1L)).thenReturn(existingStory);
    when(brandStoryImageMapper.selectList(any())).thenReturn(List.of());
    when(teamMemberMapper.selectList(any())).thenReturn(List.of());

    SiteService siteService = createSiteService(
        siteConfigMapper,
        shopInfoMapper,
        shopHourMapper,
        aboutPageMapper,
        aboutTimelineEntryMapper,
        aiSettingsMapper,
        brandStoryMapper,
        brandStoryImageMapper,
        mock(OperationLogMapper.class),
        teamMemberMapper,
        auditLogService);

    String importJson = """
        {
          "version": "1.0.0",
          "siteConfig": {
            "brandName": "花语时光 Pro",
            "heroEyebrow": "企业交付版",
            "heroTitle": "花语时光 Pro",
            "heroDescription": "升级后的首页文案",
            "heroImage": "https://example.com/hero.jpg",
            "primaryCtaText": "浏览作品",
            "secondaryCtaText": "联系顾问",
            "contactIntro": "欢迎咨询商业部署",
            "businessHoursText": "每天 09:00-22:00",
            "footerDescription": "商业交付示例",
            "licenseCustomerName": "商业客户",
            "licenseCode": "FWT-BIZ-001",
            "licenseType": "商业授权",
            "licenseExpiresAt": "2027-05-15T00:00:00",
            "licenseWarningDays": 45,
            "licenseNotes": "需年度巡检"
          },
          "shopInfo": {
            "name": "花语时光 Pro",
            "phone": "13800138000",
            "wechat": "floral-pro",
            "address": "上海市静安区花语路 88 号",
            "latitude": 31.2304,
            "longitude": 121.4737,
            "hours": {
              "monday": {"open":"09:00","close":"22:00","off":false},
              "tuesday": {"open":"09:00","close":"22:00","off":false},
              "wednesday": {"open":"09:00","close":"22:00","off":false},
              "thursday": {"open":"09:00","close":"22:00","off":false},
              "friday": {"open":"09:00","close":"22:00","off":false},
              "saturday": {"open":"10:00","close":"22:00","off":false},
              "sunday": {"open":"10:00","close":"21:00","off":false}
            }
          },
          "brandStory": {
            "title": "升级后的品牌故事",
            "subtitle": "商业版副标题",
            "content": "商业交付后的品牌故事正文",
            "images": ["https://example.com/story-1.jpg", "https://example.com/story-2.jpg"]
          },
          "aboutPage": {
            "heroImage": "https://example.com/about-hero.jpg",
            "heroEyebrow": "About",
            "heroTitle": "关于花语时光 Pro",
            "heroSubtitle": "交付升级后的关于页副标题",
            "storyTitle": "新的故事标题",
            "storyContent": "新的关于页正文"
          },
          "timeline": [
            {"id":"timeline_2024","yearLabel":"2024","content":"完成品牌升级","sort":0},
            {"id":"timeline_2026","yearLabel":"2026","content":"上线商业化交付版本","sort":1}
          ],
          "team": [
            {"id":"team_01","name":"林汐","title":"主理花艺师","avatar":"https://example.com/team-1.jpg","bio":"负责品牌花艺方向","sort":5},
            {"id":"team_02","name":"周宁","title":"婚礼花艺师","avatar":"https://example.com/team-2.jpg","bio":"负责婚礼项目","sort":4}
          ],
          "aiSettings": {
            "enabled": true,
            "provider": "volcengine",
            "apiKeyMasked": "ignored",
            "model": "doubao-seedream-5-0-260128",
            "baseUrl": "https://ark.cn-beijing.volces.com/api/v3",
            "generatePath": "/images/generations",
            "size": "1920x1920",
            "textModel": "doubao-1-5-pro-32k-250115",
            "textGeneratePath": "/chat/completions",
            "textTemperature": 0.4,
            "textMaxTokens": 1200,
            "apiKey": "new-secret-key"
          }
        }
        """;

    MockMultipartFile file = new MockMultipartFile(
        "file",
        "site-config-export.json",
        "application/json",
        new ByteArrayInputStream(importJson.getBytes(java.nio.charset.StandardCharsets.UTF_8)));

    ConfigImportResponse result = siteService.importConfig(file);

    assertEquals("1.0.0", result.getVersion());
    assertEquals(2, result.getTimelineCount());
    assertEquals(2, result.getTeamCount());
    assertTrue(result.isIncludedAiSettings());
    verify(siteConfigMapper, times(1)).updateById(any(SiteConfig.class));
    verify(shopInfoMapper, times(1)).updateById(any(ShopInfo.class));
    verify(aboutPageMapper, times(1)).updateById(any(AboutPage.class));
    verify(brandStoryMapper, times(1)).updateById(any(BrandStory.class));
    verify(brandStoryImageMapper, times(1)).delete(any());
    verify(brandStoryImageMapper, times(2)).insert(org.mockito.ArgumentMatchers.<com.floralwhisper.entity.BrandStoryImage>any());
    verify(aboutTimelineEntryMapper, times(1)).delete(any());
    verify(aboutTimelineEntryMapper, atLeast(2)).insert(org.mockito.ArgumentMatchers.<AboutTimelineEntry>any());
    verify(teamMemberMapper, times(1)).delete(any());
    verify(teamMemberMapper, atLeast(2)).insert(org.mockito.ArgumentMatchers.<TeamMember>any());
    verify(aiSettingsMapper, times(1)).updateById(any(AiSettings.class));
    verify(auditLogService, times(1)).record(any(AuditLogCommand.class));
  }

  private AppProperties appProperties(Path uploadsDir, Path backupsDir, String environment, String gitRevision, String deployedAt) {
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
    AppProperties.Runtime runtime = new AppProperties.Runtime();
    runtime.setEnvironment(environment);
    runtime.setGitRevision(gitRevision);
    runtime.setDeployedAt(deployedAt);
    properties.setRuntime(runtime);
    return properties;
  }

  private SiteService createSiteService(
      SiteConfigMapper siteConfigMapper,
      ShopInfoMapper shopInfoMapper,
      ShopHourMapper shopHourMapper,
      AboutPageMapper aboutPageMapper,
      AboutTimelineEntryMapper aboutTimelineEntryMapper,
      AiSettingsMapper aiSettingsMapper,
      BrandStoryMapper brandStoryMapper,
      BrandStoryImageMapper brandStoryImageMapper,
      OperationLogMapper operationLogMapper,
      TeamMemberMapper teamMemberMapper,
      AuditLogService auditLogService) {
    return new SiteService(
        siteConfigMapper,
        shopInfoMapper,
        shopHourMapper,
        aboutPageMapper,
        aboutTimelineEntryMapper,
        aiSettingsMapper,
        brandStoryMapper,
        brandStoryImageMapper,
        mock(CategoryMapper.class),
        operationLogMapper,
        teamMemberMapper,
        appProperties(tempDir.resolve("uploads"), tempDir.resolve("backups"), "local", "dev", ""),
        mock(DataSource.class),
        null,
        new ProtectionMetrics(),
        auditLogService,
        Instant.parse("2026-05-15T00:45:00Z"),
        ZoneId.of("Asia/Shanghai"),
        Clock.fixed(Instant.parse("2026-05-15T01:00:00Z"), ZoneId.of("Asia/Shanghai")));
  }

  private AnnotationConfigApplicationContext createCachedSiteServiceContext(
      SiteConfigMapper siteConfigMapper,
      ShopInfoMapper shopInfoMapper,
      ShopHourMapper shopHourMapper,
      AboutPageMapper aboutPageMapper,
      AboutTimelineEntryMapper aboutTimelineEntryMapper,
      AiSettingsMapper aiSettingsMapper,
      BrandStoryMapper brandStoryMapper,
      BrandStoryImageMapper brandStoryImageMapper,
      CategoryMapper categoryMapper,
      OperationLogMapper operationLogMapper,
      TeamMemberMapper teamMemberMapper,
      AuditLogService auditLogService) {
    AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext();
    context.register(CacheConfig.class);
    context.registerBean(SiteConfigMapper.class, () -> siteConfigMapper);
    context.registerBean(ShopInfoMapper.class, () -> shopInfoMapper);
    context.registerBean(ShopHourMapper.class, () -> shopHourMapper);
    context.registerBean(AboutPageMapper.class, () -> aboutPageMapper);
    context.registerBean(AboutTimelineEntryMapper.class, () -> aboutTimelineEntryMapper);
    context.registerBean(AiSettingsMapper.class, () -> aiSettingsMapper);
    context.registerBean(BrandStoryMapper.class, () -> brandStoryMapper);
    context.registerBean(BrandStoryImageMapper.class, () -> brandStoryImageMapper);
    context.registerBean(CategoryMapper.class, () -> categoryMapper);
    context.registerBean(OperationLogMapper.class, () -> operationLogMapper);
    context.registerBean(TeamMemberMapper.class, () -> teamMemberMapper);
    context.registerBean(AppProperties.class, () -> appProperties(
        tempDir.resolve("uploads"),
        tempDir.resolve("backups"),
        "local",
        "dev",
        ""));
    context.registerBean(DataSource.class, () -> mock(DataSource.class));
    context.registerBean(ProtectionMetrics.class, ProtectionMetrics::new);
    context.registerBean(AuditLogService.class, () -> auditLogService);
    context.registerBean(com.fasterxml.jackson.databind.ObjectMapper.class, () -> new com.fasterxml.jackson.databind.ObjectMapper());
    context.registerBean(SiteService.class);
    context.refresh();
    return context;
  }

  private SiteConfig siteConfigForExport() {
    SiteConfig config = new SiteConfig();
    config.setId(1L);
    config.setBrandName("花语时光");
    config.setHeroEyebrow("自然温暖");
    config.setHeroTitle("花语时光");
    config.setHeroDescription("品牌首页文案");
    config.setHeroImage("https://example.com/hero.jpg");
    config.setPrimaryCtaText("浏览作品");
    config.setSecondaryCtaText("联系门店");
    config.setContactIntro("欢迎预约");
    config.setBusinessHoursText("每天 09:00-22:00");
    config.setFooterDescription("页脚文案");
    config.setLicenseCustomerName("演示客户");
    config.setLicenseCode("FWT-DEMO-001");
    config.setLicenseType("正式版");
    config.setLicenseExpiresAt(LocalDateTime.of(2026, 6, 1, 0, 0));
    config.setLicenseWarningDays(30);
    config.setLicenseNotes("演示授权");
    return config;
  }

  private ShopInfo shopInfoForExport() {
    ShopInfo shopInfo = new ShopInfo();
    shopInfo.setId(1L);
    shopInfo.setName("花语时光");
    shopInfo.setPhone("13800138000");
    shopInfo.setWechat("floral");
    shopInfo.setAddress("上海市静安区花语路 88 号");
    shopInfo.setLatitude(new java.math.BigDecimal("31.2304"));
    shopInfo.setLongitude(new java.math.BigDecimal("121.4737"));
    return shopInfo;
  }

  private AboutPage aboutPageForExport() {
    AboutPage aboutPage = new AboutPage();
    aboutPage.setId(1L);
    aboutPage.setHeroImage("https://example.com/about-hero.jpg");
    aboutPage.setHeroEyebrow("About");
    aboutPage.setHeroTitle("关于花语时光");
    aboutPage.setHeroSubtitle("副标题");
    aboutPage.setStoryTitle("品牌故事");
    aboutPage.setStoryContent("关于页正文");
    return aboutPage;
  }

  private BrandStory brandStoryForExport() {
    BrandStory story = new BrandStory();
    story.setId(1L);
    story.setTitle("品牌故事");
    story.setSubtitle("故事副标题");
    story.setContent("故事正文");
    return story;
  }

  private com.floralwhisper.entity.BrandStoryImage brandStoryImage(String imageUrl, int sort) {
    com.floralwhisper.entity.BrandStoryImage image = new com.floralwhisper.entity.BrandStoryImage();
    image.setImageUrl(imageUrl);
    image.setSort(sort);
    return image;
  }

  private List<ShopHour> defaultHours() {
    return List.of(
        shopHour("monday", "09:00", "22:00", false),
        shopHour("tuesday", "09:00", "22:00", false),
        shopHour("wednesday", "09:00", "22:00", false),
        shopHour("thursday", "09:00", "22:00", false),
        shopHour("friday", "09:00", "22:00", false),
        shopHour("saturday", "10:00", "22:00", false),
        shopHour("sunday", "10:00", "21:00", false));
  }

  private ShopHour shopHour(String weekday, String open, String close, boolean off) {
    ShopHour hour = new ShopHour();
    hour.setWeekday(weekday);
    hour.setOpenTime(open);
    hour.setCloseTime(close);
    hour.setOff(off);
    return hour;
  }

  private AboutTimelineEntry timelineEntry(String id, String yearLabel, String content, int sort) {
    AboutTimelineEntry entry = new AboutTimelineEntry();
    entry.setId(id);
    entry.setYearLabel(yearLabel);
    entry.setContent(content);
    entry.setSort(sort);
    return entry;
  }

  private TeamMember teamMember(String id, String name, String title, String avatar, int sort) {
    TeamMember member = new TeamMember();
    member.setId(id);
    member.setName(name);
    member.setTitle(title);
    member.setAvatar(avatar);
    member.setSort(sort);
    return member;
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
