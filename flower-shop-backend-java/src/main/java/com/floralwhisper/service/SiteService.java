package com.floralwhisper.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.floralwhisper.audit.AuditLogCommand;
import com.floralwhisper.audit.AuditLogService;
import com.floralwhisper.common.ApiException;
import com.floralwhisper.config.AppProperties;
import com.floralwhisper.crypto.SecretCryptoService;
import com.floralwhisper.dto.AboutPageResponse;
import com.floralwhisper.dto.AboutPageUpdateRequest;
import com.floralwhisper.dto.AboutTimelineEntryRequest;
import com.floralwhisper.dto.AboutTimelineEntryResponse;
import com.floralwhisper.dto.AiSettingsResponse;
import com.floralwhisper.dto.AiSettingsUpdateRequest;
import com.floralwhisper.dto.BrandStoryResponse;
import com.floralwhisper.dto.BusinessHoursResponse;
import com.floralwhisper.dto.ConfigImportResponse;
import com.floralwhisper.dto.ConfigTransferAiSettings;
import com.floralwhisper.dto.ConfigTransferPayload;
import com.floralwhisper.dto.OperationLogArchiveResponse;
import com.floralwhisper.dto.OperationLogArchiveFileResponse;
import com.floralwhisper.dto.ShopInfoResponse;
import com.floralwhisper.dto.SiteConfigResponse;
import com.floralwhisper.dto.SiteConfigUpdateRequest;
import com.floralwhisper.dto.SiteConfigUpdateResponse;
import com.floralwhisper.dto.SystemStatusResponse;
import com.floralwhisper.dto.TeamMemberRequest;
import com.floralwhisper.dto.TimeRangeResponse;
import com.floralwhisper.entity.AboutPage;
import com.floralwhisper.entity.AboutTimelineEntry;
import com.floralwhisper.entity.AdminSecurityState;
import com.floralwhisper.entity.AiSettings;
import com.floralwhisper.entity.BrandStory;
import com.floralwhisper.entity.BrandStoryImage;
import com.floralwhisper.entity.Category;
import com.floralwhisper.entity.OperationLog;
import com.floralwhisper.entity.ShopHour;
import com.floralwhisper.entity.ShopInfo;
import com.floralwhisper.entity.SiteConfig;
import com.floralwhisper.entity.TeamMember;
import com.floralwhisper.mapper.AboutPageMapper;
import com.floralwhisper.mapper.AboutTimelineEntryMapper;
import com.floralwhisper.mapper.AdminSecurityStateMapper;
import com.floralwhisper.mapper.AiSettingsMapper;
import com.floralwhisper.mapper.BrandStoryImageMapper;
import com.floralwhisper.mapper.BrandStoryMapper;
import com.floralwhisper.mapper.CategoryMapper;
import com.floralwhisper.mapper.OperationLogMapper;
import com.floralwhisper.mapper.ShopHourMapper;
import com.floralwhisper.mapper.ShopInfoMapper;
import com.floralwhisper.mapper.SiteConfigMapper;
import com.floralwhisper.mapper.TeamMemberMapper;
import com.floralwhisper.protection.ProtectionMetrics;
import com.floralwhisper.protection.ProtectionSnapshot;
import com.floralwhisper.protection.RouteProtectionGroup;
import java.math.BigDecimal;
import java.io.File;
import java.io.BufferedInputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.time.Clock;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.util.zip.GZIPOutputStream;
import org.apache.commons.compress.archivers.tar.TarArchiveEntry;
import org.apache.commons.compress.archivers.tar.TarArchiveOutputStream;
import javax.sql.DataSource;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.boot.info.BuildProperties;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class SiteService {
  private static final long SINGLETON_ID = 1L;
  private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

  private final SiteConfigMapper siteConfigMapper;
  private final ShopInfoMapper shopInfoMapper;
  private final ShopHourMapper shopHourMapper;
  private final AboutPageMapper aboutPageMapper;
  private final AdminSecurityStateMapper adminSecurityStateMapper;
  private final AboutTimelineEntryMapper aboutTimelineEntryMapper;
  private final AiSettingsMapper aiSettingsMapper;
  private final BrandStoryMapper brandStoryMapper;
  private final BrandStoryImageMapper brandStoryImageMapper;
  private final CategoryMapper categoryMapper;
  private final OperationLogMapper operationLogMapper;
  private final TeamMemberMapper teamMemberMapper;
  private final AppProperties appProperties;
  private final DataSource dataSource;
  private final BuildProperties buildProperties;
  private final Instant startedAt;
  private final ZoneId zoneId;
  private final Clock clock;
  private final AuditLogService auditLogService;
  private final ObjectMapper objectMapper;
  private final ProtectionMetrics protectionMetrics;
  private final SecretCryptoService secretCryptoService;

  @Autowired
  public SiteService(
      SiteConfigMapper siteConfigMapper,
      ShopInfoMapper shopInfoMapper,
      ShopHourMapper shopHourMapper,
      AboutPageMapper aboutPageMapper,
      AdminSecurityStateMapper adminSecurityStateMapper,
      AboutTimelineEntryMapper aboutTimelineEntryMapper,
      AiSettingsMapper aiSettingsMapper,
      BrandStoryMapper brandStoryMapper,
      BrandStoryImageMapper brandStoryImageMapper,
      CategoryMapper categoryMapper,
      OperationLogMapper operationLogMapper,
      TeamMemberMapper teamMemberMapper,
      AppProperties appProperties,
      DataSource dataSource,
      @Nullable BuildProperties buildProperties,
      ProtectionMetrics protectionMetrics,
      AuditLogService auditLogService,
      ObjectMapper objectMapper,
      SecretCryptoService secretCryptoService) {
    this(
        siteConfigMapper,
        shopInfoMapper,
        shopHourMapper,
        aboutPageMapper,
        adminSecurityStateMapper,
        aboutTimelineEntryMapper,
        aiSettingsMapper,
        brandStoryMapper,
        brandStoryImageMapper,
        categoryMapper,
        operationLogMapper,
        teamMemberMapper,
        appProperties,
        dataSource,
        buildProperties,
        protectionMetrics,
        auditLogService,
        objectMapper,
        secretCryptoService,
        Instant.now(),
        ZoneId.systemDefault(),
        Clock.systemDefaultZone());
  }

  SiteService(
      SiteConfigMapper siteConfigMapper,
      ShopInfoMapper shopInfoMapper,
      ShopHourMapper shopHourMapper,
      AboutPageMapper aboutPageMapper,
      AdminSecurityStateMapper adminSecurityStateMapper,
      AboutTimelineEntryMapper aboutTimelineEntryMapper,
      AiSettingsMapper aiSettingsMapper,
      BrandStoryMapper brandStoryMapper,
      BrandStoryImageMapper brandStoryImageMapper,
      CategoryMapper categoryMapper,
      OperationLogMapper operationLogMapper,
      TeamMemberMapper teamMemberMapper,
      AppProperties appProperties,
      DataSource dataSource,
      @Nullable BuildProperties buildProperties,
      AuditLogService auditLogService,
      @Nullable Instant startedAt,
      ZoneId zoneId,
      Clock clock) {
    this(
        siteConfigMapper,
        shopInfoMapper,
        shopHourMapper,
        aboutPageMapper,
        adminSecurityStateMapper,
        aboutTimelineEntryMapper,
        aiSettingsMapper,
        brandStoryMapper,
        brandStoryImageMapper,
        categoryMapper,
        operationLogMapper,
        teamMemberMapper,
        appProperties,
        dataSource,
        buildProperties,
        new ProtectionMetrics(),
        auditLogService,
        startedAt,
        zoneId,
        clock);
  }

  SiteService(
      SiteConfigMapper siteConfigMapper,
      ShopInfoMapper shopInfoMapper,
      ShopHourMapper shopHourMapper,
      AboutPageMapper aboutPageMapper,
      AdminSecurityStateMapper adminSecurityStateMapper,
      AboutTimelineEntryMapper aboutTimelineEntryMapper,
      AiSettingsMapper aiSettingsMapper,
      BrandStoryMapper brandStoryMapper,
      BrandStoryImageMapper brandStoryImageMapper,
      CategoryMapper categoryMapper,
      OperationLogMapper operationLogMapper,
      TeamMemberMapper teamMemberMapper,
      AppProperties appProperties,
      DataSource dataSource,
      @Nullable BuildProperties buildProperties,
      ProtectionMetrics protectionMetrics,
      AuditLogService auditLogService,
      @Nullable Instant startedAt,
      ZoneId zoneId,
      Clock clock) {
    this(
        siteConfigMapper,
        shopInfoMapper,
        shopHourMapper,
        aboutPageMapper,
        adminSecurityStateMapper,
        aboutTimelineEntryMapper,
        aiSettingsMapper,
        brandStoryMapper,
        brandStoryImageMapper,
        categoryMapper,
        operationLogMapper,
        teamMemberMapper,
        appProperties,
        dataSource,
        buildProperties,
        protectionMetrics,
        auditLogService,
        new ObjectMapper(),
        new SecretCryptoService(appProperties),
        startedAt,
        zoneId,
        clock);
  }

  SiteService(
      SiteConfigMapper siteConfigMapper,
      ShopInfoMapper shopInfoMapper,
      ShopHourMapper shopHourMapper,
      AboutPageMapper aboutPageMapper,
      AdminSecurityStateMapper adminSecurityStateMapper,
      AboutTimelineEntryMapper aboutTimelineEntryMapper,
      AiSettingsMapper aiSettingsMapper,
      BrandStoryMapper brandStoryMapper,
      BrandStoryImageMapper brandStoryImageMapper,
      CategoryMapper categoryMapper,
      OperationLogMapper operationLogMapper,
      TeamMemberMapper teamMemberMapper,
      AppProperties appProperties,
      DataSource dataSource,
      @Nullable BuildProperties buildProperties,
      @Nullable ProtectionMetrics protectionMetrics,
      AuditLogService auditLogService,
      ObjectMapper objectMapper,
      SecretCryptoService secretCryptoService,
      @Nullable Instant startedAt,
      ZoneId zoneId,
      Clock clock) {
    this.siteConfigMapper = siteConfigMapper;
    this.shopInfoMapper = shopInfoMapper;
    this.shopHourMapper = shopHourMapper;
    this.aboutPageMapper = aboutPageMapper;
    this.adminSecurityStateMapper = adminSecurityStateMapper;
    this.aboutTimelineEntryMapper = aboutTimelineEntryMapper;
    this.aiSettingsMapper = aiSettingsMapper;
    this.brandStoryMapper = brandStoryMapper;
    this.brandStoryImageMapper = brandStoryImageMapper;
    this.categoryMapper = categoryMapper;
    this.operationLogMapper = operationLogMapper;
    this.teamMemberMapper = teamMemberMapper;
    this.appProperties = appProperties;
    this.dataSource = dataSource;
    this.buildProperties = buildProperties;
    this.protectionMetrics = protectionMetrics == null ? new ProtectionMetrics() : protectionMetrics;
    this.auditLogService = auditLogService;
    this.objectMapper = (objectMapper == null ? new ObjectMapper() : objectMapper.copy()).findAndRegisterModules();
    this.secretCryptoService = secretCryptoService == null ? new SecretCryptoService(appProperties) : secretCryptoService;
    this.startedAt = startedAt;
    this.zoneId = zoneId;
    this.clock = clock;
  }

  @Cacheable("siteConfig")
  public SiteConfigResponse getSiteConfig() {
    SiteConfig config = ensureSiteConfig();
    SiteConfigResponse response = new SiteConfigResponse();
    response.setBrandName(config.getBrandName());
    response.setHeroEyebrow(config.getHeroEyebrow());
    response.setHeroTitle(config.getHeroTitle());
    response.setHeroDescription(config.getHeroDescription());
    response.setHeroImage(config.getHeroImage());
    response.setPrimaryCtaText(config.getPrimaryCtaText());
    response.setSecondaryCtaText(config.getSecondaryCtaText());
    response.setContactIntro(config.getContactIntro());
    response.setBusinessHoursText(config.getBusinessHoursText());
    response.setFooterDescription(config.getFooterDescription());
    return response;
  }

  public SiteConfigResponse getAdminSiteConfig() {
    SiteConfigResponse response = getSiteConfig();
    SiteConfig config = ensureSiteConfig();
    response.setLicenseCustomerName(config.getLicenseCustomerName());
    response.setLicenseCode(config.getLicenseCode());
    response.setLicenseType(config.getLicenseType());
    response.setLicenseExpiresAt(config.getLicenseExpiresAt());
    response.setLicenseWarningDays(resolveLicenseWarningDays(config));
    response.setLicenseNotes(config.getLicenseNotes());
    return response;
  }

  public AiSettingsResponse getAdminAiSettings() {
    return toAiSettingsResponse(ensureAiSettings());
  }

  public SystemStatusResponse getSystemStatus() {
    SystemStatusResponse response = new SystemStatusResponse();
    AiSettings aiSettings = ensureAiSettings();
    AdminSecurityState adminSecurityState = adminSecurityStateMapper.selectById(SINGLETON_ID);
    File uploadsDir = resolveDirectory(appProperties.getUpload().getDir(), "uploads");
    File backupsDir = resolveDirectory(appProperties.getBackup().getDir(), "../backups");
    File latestBackup = resolveLatestBackup(backupsDir);
    DatabaseStatus databaseStatus = inspectDatabaseStatus();
    SiteConfig config = ensureSiteConfig();
    LicenseStatus licenseStatus = resolveLicenseStatus(config);

    response.setService(resolveServiceName());
    response.setVersion(resolveVersion());
    response.setDeploymentEnvironment(resolveDeploymentEnvironment());
    response.setGitRevision(resolveGitRevision());
    response.setBuildTime(resolveBuildTime());
    response.setDeployedAt(resolveDeployedAt());
    response.setLicenseCustomerName(nullToEmpty(config.getLicenseCustomerName()));
    response.setLicenseCode(nullToEmpty(config.getLicenseCode()));
    response.setLicenseType(nullToEmpty(config.getLicenseType()));
    response.setLicenseExpiresAt(formatDateTime(config.getLicenseExpiresAt()));
    response.setLicenseWarningDays(resolveLicenseWarningDays(config));
    response.setLicenseNotes(nullToEmpty(config.getLicenseNotes()));
    response.setLicenseStatus(licenseStatus.code());
    response.setLicenseStatusLabel(licenseStatus.label());
    response.setDatabaseConnected(databaseStatus.connected());
    response.setDatabaseVersion(databaseStatus.version());
    response.setDatabaseSize(databaseStatus.size());
    response.setDiskTotal(formatBytes(uploadsDir.getTotalSpace()));
    response.setDiskUsable(formatBytes(uploadsDir.getUsableSpace()));
    response.setDiskUsageRate(formatDiskUsageRate(uploadsDir));
    response.setUploadDirectoryReady(uploadsDir.exists() && uploadsDir.isDirectory() && uploadsDir.canWrite());
    response.setUploadDirectoryPath(uploadsDir.getAbsolutePath());
    response.setUploadFileCount(countFiles(uploadsDir));
    response.setUploadDirectorySize(formatBytes(calculateDirectorySize(uploadsDir)));
    response.setUptimeLabel(formatUptime());
    response.setAiEnabled(Boolean.TRUE.equals(aiSettings.getEnabled()));
    response.setAiKeyConfigured(notBlank(aiSettings.getApiKey()));
    response.setAiProvider(aiSettings.getProvider());
    response.setAiImageModel(aiSettings.getModel());
    response.setAiTextModel(aiSettings.getTextModel());
    response.setLatestBackupPresent(latestBackup != null);
    response.setLatestBackupName(latestBackup == null ? "" : latestBackup.getName());
    response.setLatestBackupPath(latestBackup == null ? "" : latestBackup.getAbsolutePath());
    response.setLatestBackupModifiedAt(formatBackupModifiedAt(latestBackup));
    response.setLatestBackupDownloadUrl(latestBackup == null ? "" : "/api/admin/system/backups/latest/download");
    response.setAdminPasswordChangedAt(adminSecurityState == null ? "" : formatDateTime(adminSecurityState.getPasswordChangedAt()));
    response.setOperationLogCount(resolveOperationLogCount());
    response.setOperationLogRetentionDays(resolveOperationLogRetentionDays());
    response.setOperationLogArchiveBefore(resolveOperationLogArchiveBefore());
    response.setRequirePasswordChange(adminSecurityState == null || Boolean.TRUE.equals(adminSecurityState.getRequirePasswordChange()));
    response.setDeliveryInitialized(adminSecurityState != null && !Boolean.TRUE.equals(adminSecurityState.getRequirePasswordChange()));
    response.setProtection(buildProtectionSnapshot());
    response.setSecurity(buildSecurityOverview(adminSecurityState, aiSettings));
    return response;
  }

  private SystemStatusResponse.SecurityOverview buildSecurityOverview(
      AdminSecurityState adminSecurityState,
      AiSettings aiSettings) {
    SystemStatusResponse.SecurityOverview overview = new SystemStatusResponse.SecurityOverview();
    boolean adminPasswordInitialized =
        adminSecurityState != null && !Boolean.TRUE.equals(adminSecurityState.getRequirePasswordChange());
    boolean usingDefaultAdminPassword = !adminPasswordInitialized;
    boolean jwtSecretCustomized =
        notBlank(appProperties.getJwt().getSecret())
            && !"floral-whisper-time-java-dev-secret-change-me".equals(appProperties.getJwt().getSecret().trim());
    boolean dataEncryptionKeyCustomized =
        notBlank(appProperties.getSecurity().getDataEncryptionKey())
            && !"floral-whisper-time-dev-data-key-2026".equals(appProperties.getSecurity().getDataEncryptionKey().trim());
    boolean aiKeyEncryptedAtRest =
        !notBlank(aiSettings.getApiKey()) || secretCryptoService.isEncrypted(aiSettings.getApiKey());

    overview.setAdminPasswordInitialized(adminPasswordInitialized);
    overview.setUsingDefaultAdminPassword(usingDefaultAdminPassword);
    overview.setJwtSecretCustomized(jwtSecretCustomized);
    overview.setDataEncryptionKeyCustomized(dataEncryptionKeyCustomized);
    overview.setAiKeyEncryptedAtRest(aiKeyEncryptedAtRest);

    int passedChecks = 0;
    if (adminPasswordInitialized) passedChecks++;
    if (jwtSecretCustomized) passedChecks++;
    if (dataEncryptionKeyCustomized) passedChecks++;
    if (aiKeyEncryptedAtRest) passedChecks++;

    if (passedChecks == 4) {
      overview.setSecurityLevel("good");
      overview.setSecuritySummary("管理员密码、JWT 密钥、数据加密密钥和 AI 密钥存储状态均符合交付要求。");
    } else if (passedChecks >= 2) {
      overview.setSecurityLevel("warning");
      overview.setSecuritySummary("当前已完成部分安全初始化，但仍建议补齐默认密钥替换或管理员密码初始化。");
    } else {
      overview.setSecurityLevel("risk");
      overview.setSecuritySummary("当前仍存在默认密码或默认密钥配置，暂不建议直接用于正式商业交付。");
    }
    return overview;
  }

  private ProtectionSnapshot buildProtectionSnapshot() {
    ProtectionSnapshot snapshot = new ProtectionSnapshot();
    var protection = appProperties.getProtection();
    snapshot.setEnabled(isProtectionEnabled());
    snapshot.setPublicReadCapacity(protection.getPublicRead().getCapacity());
    snapshot.setPublicWriteCapacity(protection.getPublicWrite().getCapacity());
    snapshot.setAdminCapacity(protection.getAdmin().getCapacity());
    snapshot.setHeavyCapacity(protection.getHeavy().getCapacity());
    snapshot.setAiMaxConcurrent(protection.getConcurrency().getAi().getMaxConcurrent());
    snapshot.setUploadMaxConcurrent(protection.getConcurrency().getUpload().getMaxConcurrent());
    snapshot.setConfigImportMaxConcurrent(protection.getConcurrency().getConfigImport().getMaxConcurrent());
    snapshot.setRateLimitedCount(protectionMetrics.totalRejectedCount());
    snapshot.setBusyRejectedCount(protectionMetrics.busyRejectedCount());
    return snapshot;
  }

  private boolean isProtectionEnabled() {
    var protection = appProperties.getProtection();
    return Boolean.TRUE.equals(protection.getPublicRead().getEnabled())
        || Boolean.TRUE.equals(protection.getPublicWrite().getEnabled())
        || Boolean.TRUE.equals(protection.getAdmin().getEnabled())
        || Boolean.TRUE.equals(protection.getHeavy().getEnabled())
        || Boolean.TRUE.equals(protection.getConcurrency().getAi().getEnabled())
        || Boolean.TRUE.equals(protection.getConcurrency().getUpload().getEnabled())
        || Boolean.TRUE.equals(protection.getConcurrency().getConfigImport().getEnabled());
  }

  @Transactional
  public OperationLogArchiveResponse archiveOperationLogs(LocalDateTime before) {
    if (before == null) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "请提供归档截止时间");
    }

    List<OperationLog> logs = operationLogMapper.selectList(new LambdaQueryWrapper<OperationLog>()
        .lt(OperationLog::getCreatedAt, before)
        .orderByAsc(OperationLog::getCreatedAt)
        .orderByAsc(OperationLog::getId));
    if (logs.isEmpty()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "当前没有可归档的操作日志");
    }

    File backupDir = resolveDirectory(appProperties.getBackup().getDir(), "../backups");
    File archiveDir = resolveDirectory(
        backupDir.toPath().resolve(appProperties.getOperationLog().getArchiveDir()).toString(),
        backupDir.toPath().resolve("operation-logs").toString());
    if (!archiveDir.exists() && !archiveDir.mkdirs()) {
      throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "操作日志归档目录创建失败");
    }

    String filename = "operation-logs-archive-" + DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss").format(LocalDateTime.now(clock)) + ".csv";
    File archiveFile = new File(archiveDir, filename);
    try {
      java.nio.file.Files.writeString(archiveFile.toPath(), buildOperationLogCsv(logs));
    } catch (IOException exception) {
      throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "写入操作日志归档文件失败");
    }

    operationLogMapper.delete(new LambdaQueryWrapper<OperationLog>().lt(OperationLog::getCreatedAt, before));

    OperationLogArchiveResponse response = new OperationLogArchiveResponse();
    response.setArchivedCount(logs.size());
    response.setArchiveFilename(filename);
    response.setArchivePath(archiveFile.getAbsolutePath());
    response.setArchiveBefore(DATE_TIME_FORMATTER.format(before));
    auditLogService.record(AuditLogCommand.builder()
        .module("AUDIT")
        .action("ARCHIVE")
        .targetType("OPERATION_LOG_ARCHIVE")
        .targetId(filename)
        .requestSummary(java.util.Map.of(
            "archiveBefore", response.getArchiveBefore(),
            "archivedCount", response.getArchivedCount(),
            "archivePath", response.getArchivePath()))
        .beforeSnapshot(java.util.Map.of(
            "operationLogCount", logs.size(),
            "archiveBefore", response.getArchiveBefore()))
        .afterSnapshot(response)
        .success(true)
        .build());
    return response;
  }

  public List<OperationLogArchiveFileResponse> listOperationLogArchiveFiles() {
    File archiveDir = resolveOperationLogArchiveDirectory();
    if (!archiveDir.exists() || !archiveDir.isDirectory()) {
      return List.of();
    }

    File[] files = archiveDir.listFiles(file -> file.isFile() && file.getName().endsWith(".csv"));
    if (files == null || files.length == 0) {
      return List.of();
    }

    return java.util.Arrays.stream(files)
        .sorted(
            Comparator.comparingLong(File::lastModified)
                .reversed()
                .thenComparing(File::getName, Comparator.reverseOrder()))
        .map(this::toOperationLogArchiveFileResponse)
        .toList();
  }

  public String writeOperationLogArchiveFile(String filename, OutputStream outputStream) throws IOException {
    File archiveDir = resolveOperationLogArchiveDirectory();
    File target = new File(archiveDir, filename == null ? "" : filename);
    if (!target.exists() || !target.isFile()) {
      throw new ApiException(HttpStatus.NOT_FOUND, "操作日志归档文件不存在");
    }
    if (!target.getCanonicalPath().startsWith(archiveDir.getCanonicalPath())) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "非法的归档文件路径");
    }
    try (BufferedInputStream inputStream = new BufferedInputStream(java.nio.file.Files.newInputStream(target.toPath()))) {
      inputStream.transferTo(outputStream);
    }
    return target.getName();
  }

  public String writeLatestBackupArchive(OutputStream outputStream) throws IOException {
    File backupsDir = resolveDirectory(appProperties.getBackup().getDir(), "../backups");
    File latestBackup = resolveLatestBackup(backupsDir);
    if (latestBackup == null) {
      throw new ApiException(HttpStatus.NOT_FOUND, "暂无可下载备份");
    }

    try (TarArchiveOutputStream tarOutputStream =
        new TarArchiveOutputStream(new GZIPOutputStream(outputStream))) {
      tarOutputStream.setLongFileMode(TarArchiveOutputStream.LONGFILE_POSIX);
      writeDirectoryToTar(latestBackup, latestBackup.getName(), tarOutputStream);
      tarOutputStream.finish();
    }

    return latestBackup.getName() + ".tar.gz";
  }

  public String writeConfigExport(OutputStream outputStream) throws IOException {
    ConfigTransferPayload payload = buildConfigTransferPayload(true);
    objectMapper.writerWithDefaultPrettyPrinter().writeValue(outputStream, payload);

    String filename = "site-config-export-" + DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss").format(LocalDateTime.now(clock)) + ".json";
    auditLogService.record(AuditLogCommand.builder()
        .module("SITE")
        .action("EXPORT")
        .targetType("SITE_CONFIG_PACKAGE")
        .targetId(filename)
        .requestSummary(Map.of("filename", filename))
        .afterSnapshot(Map.of(
            "version", payload.getVersion(),
            "timelineCount", payload.getTimeline() == null ? 0 : payload.getTimeline().size(),
            "teamCount", payload.getTeam() == null ? 0 : payload.getTeam().size(),
            "includedAiSettings", payload.getAiSettings() != null))
        .success(true)
        .build());
    return filename;
  }

  @Transactional
  @CacheEvict(
      cacheNames = {"siteConfig", "shopInfo", "brandStory", "aboutPage", "aboutTimeline", "team"},
      allEntries = true)
  public ConfigImportResponse importConfig(MultipartFile file) throws IOException {
    if (file == null || file.isEmpty()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "请上传配置文件");
    }

    ConfigTransferPayload payload;
    try {
      payload = objectMapper.readValue(file.getInputStream(), ConfigTransferPayload.class);
    } catch (Exception exception) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "配置文件格式无效");
    }

    if (payload == null) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "配置文件内容为空");
    }

    ConfigTransferPayload before = buildConfigTransferPayload(false);
    applyConfigTransferPayload(payload);

    ConfigImportResponse response = new ConfigImportResponse();
    response.setVersion(notBlank(payload.getVersion()) ? payload.getVersion().trim() : "1.0.0");
    response.setImportedAt(DATE_TIME_FORMATTER.format(LocalDateTime.now(clock)));
    response.setTimelineCount(payload.getTimeline() == null ? 0 : payload.getTimeline().size());
    response.setTeamCount(payload.getTeam() == null ? 0 : payload.getTeam().size());
    response.setIncludedAiSettings(payload.getAiSettings() != null);

    auditLogService.record(AuditLogCommand.builder()
        .module("SITE")
        .action("IMPORT")
        .targetType("SITE_CONFIG_PACKAGE")
        .targetId(file.getOriginalFilename() == null ? "uploaded-config.json" : file.getOriginalFilename())
        .requestSummary(Map.of(
            "filename", file.getOriginalFilename() == null ? "uploaded-config.json" : file.getOriginalFilename(),
            "size", file.getSize(),
            "version", response.getVersion()))
        .beforeSnapshot(before)
        .afterSnapshot(buildConfigTransferPayload(false))
        .success(true)
        .build());
    return response;
  }

  @Cacheable("categories")
  public List<Category> getCategories() {
    return categoryMapper.selectList(new LambdaQueryWrapper<Category>().orderByDesc(Category::getSort));
  }

  @Cacheable("shopInfo")
  public ShopInfoResponse getShopInfo() {
    ShopInfo shopInfo = ensureShopInfo();
    ShopInfoResponse response = new ShopInfoResponse();
    response.setName(shopInfo.getName());
    response.setPhone(shopInfo.getPhone());
    response.setWechat(shopInfo.getWechat());
    response.setAddress(shopInfo.getAddress());
    response.setLatitude(shopInfo.getLatitude());
    response.setLongitude(shopInfo.getLongitude());
    response.setHours(getBusinessHours());
    return response;
  }

  @Cacheable("brandStory")
  public BrandStoryResponse getBrandStory() {
    BrandStory story = ensureBrandStory();
    BrandStoryResponse response = new BrandStoryResponse();
    response.setTitle(story.getTitle());
    response.setSubtitle(story.getSubtitle());
    response.setContent(story.getContent());
    response.setImages(brandStoryImageMapper.selectList(new LambdaQueryWrapper<BrandStoryImage>().orderByAsc(BrandStoryImage::getSort))
        .stream().map(BrandStoryImage::getImageUrl).toList());
    return response;
  }

  @Cacheable("aboutPage")
  public AboutPageResponse getAboutPage() {
    return toAboutPageResponse(ensureAboutPage());
  }

  @Cacheable("aboutTimeline")
  public List<AboutTimelineEntryResponse> getAboutTimeline() {
    return aboutTimelineEntryMapper.selectList(new LambdaQueryWrapper<AboutTimelineEntry>().orderByAsc(AboutTimelineEntry::getSort))
        .stream().map(this::toAboutTimelineEntryResponse).toList();
  }

  @Cacheable("team")
  public List<TeamMember> getAdminTeamMembers() {
    return teamMemberMapper.selectList(new LambdaQueryWrapper<TeamMember>().orderByDesc(TeamMember::getSort));
  }

  @Transactional
  @CacheEvict(cacheNames = {"siteConfig", "shopInfo", "brandStory"}, allEntries = true)
  public SiteConfigUpdateResponse updateSiteConfig(SiteConfigUpdateRequest request) {
    SiteConfigUpdateResponse before = new SiteConfigUpdateResponse(getAdminSiteConfig(), getShopInfo(), getBrandStory());
    SiteConfig config = ensureSiteConfig();
    config.setBrandName(text(request.getBrandName(), config.getBrandName()));
    config.setHeroEyebrow(text(request.getHeroEyebrow(), config.getHeroEyebrow()));
    config.setHeroTitle(text(request.getHeroTitle(), config.getHeroTitle()));
    config.setHeroDescription(text(request.getHeroDescription(), config.getHeroDescription()));
    config.setHeroImage(text(request.getHeroImage(), config.getHeroImage()));
    config.setPrimaryCtaText(text(request.getPrimaryCtaText(), config.getPrimaryCtaText()));
    config.setSecondaryCtaText(text(request.getSecondaryCtaText(), config.getSecondaryCtaText()));
    config.setContactIntro(text(request.getContactIntro(), config.getContactIntro()));
    config.setBusinessHoursText(text(request.getBusinessHoursText(), config.getBusinessHoursText()));
    config.setFooterDescription(text(request.getFooterDescription(), config.getFooterDescription()));
    config.setLicenseCustomerName(text(request.getLicenseCustomerName(), config.getLicenseCustomerName()));
    config.setLicenseCode(text(request.getLicenseCode(), config.getLicenseCode()));
    config.setLicenseType(text(request.getLicenseType(), config.getLicenseType()));
    config.setLicenseExpiresAt(request.getLicenseExpiresAt() != null ? request.getLicenseExpiresAt() : config.getLicenseExpiresAt());
    config.setLicenseWarningDays(request.getLicenseWarningDays() != null ? request.getLicenseWarningDays() : resolveLicenseWarningDays(config));
    config.setLicenseNotes(text(request.getLicenseNotes(), config.getLicenseNotes()));
    siteConfigMapper.updateById(config);

    ShopInfo shopInfo = ensureShopInfo();
    shopInfo.setName(config.getBrandName());
    shopInfo.setPhone(text(request.getPhone(), shopInfo.getPhone()));
    shopInfo.setWechat(text(request.getWechat(), shopInfo.getWechat()));
    shopInfo.setAddress(text(request.getAddress(), shopInfo.getAddress()));
    shopInfo.setLatitude(decimal(request.getLatitude(), shopInfo.getLatitude()));
    shopInfo.setLongitude(decimal(request.getLongitude(), shopInfo.getLongitude()));
    shopInfoMapper.updateById(shopInfo);

    BrandStory story = ensureBrandStory();
    story.setTitle(text(request.getStoryTitle(), story.getTitle()));
    story.setSubtitle(text(request.getStorySubtitle(), story.getSubtitle()));
    story.setContent(text(request.getStoryContent(), story.getContent()));
    brandStoryMapper.updateById(story);
    if (request.getStoryImages() != null) {
      replaceStoryImages(request.getStoryImages());
    }

    SiteConfigUpdateResponse after = new SiteConfigUpdateResponse(getAdminSiteConfig(), getShopInfo(), getBrandStory());
    auditLogService.record(AuditLogCommand.builder()
        .module("SITE")
        .action("UPDATE")
        .targetType("SITE_CONFIG")
        .targetId(String.valueOf(SINGLETON_ID))
        .requestSummary(request)
        .beforeSnapshot(before)
        .afterSnapshot(after)
        .success(true)
        .build());
    return after;
  }

  @Transactional
  public AiSettingsResponse updateAdminAiSettings(AiSettingsUpdateRequest request) {
    AiSettings before = ensureAiSettings();
    AiSettings beforeCopy = cloneAiSettings(before);
    updateAiSettings(request);
    AiSettingsResponse after = getAdminAiSettings();
    auditLogService.record(AuditLogCommand.builder()
        .module("AI")
        .action("UPDATE")
        .targetType("AI_SETTINGS")
        .targetId(String.valueOf(SINGLETON_ID))
        .requestSummary(request)
        .beforeSnapshot(beforeCopy)
        .afterSnapshot(ensureAiSettings())
        .success(true)
        .build());
    return after;
  }

  @Transactional
  @CacheEvict(cacheNames = "aboutPage", allEntries = true)
  public AboutPageResponse updateAboutPage(AboutPageUpdateRequest request) {
    AboutPage current = ensureAboutPage();
    AboutPageResponse before = toAboutPageResponse(current);
    current.setHeroImage(text(request.getHeroImage(), current.getHeroImage()));
    current.setHeroEyebrow(text(request.getHeroEyebrow(), current.getHeroEyebrow()));
    current.setHeroTitle(text(request.getHeroTitle(), current.getHeroTitle()));
    current.setHeroSubtitle(text(request.getHeroSubtitle(), current.getHeroSubtitle()));
    current.setStoryTitle(text(request.getStoryTitle(), current.getStoryTitle()));
    current.setStoryContent(text(request.getStoryContent(), current.getStoryContent()));
    aboutPageMapper.updateById(current);
    AboutPageResponse after = toAboutPageResponse(current);
    auditLogService.record(AuditLogCommand.builder()
        .module("ABOUT")
        .action("UPDATE")
        .targetType("ABOUT_PAGE")
        .targetId(String.valueOf(SINGLETON_ID))
        .requestSummary(request)
        .beforeSnapshot(before)
        .afterSnapshot(after)
        .success(true)
        .build());
    return after;
  }

  @Transactional
  @CacheEvict(cacheNames = "aboutTimeline", allEntries = true)
  public AboutTimelineEntryResponse createAboutTimelineEntry(AboutTimelineEntryRequest request) {
    AboutTimelineEntry entity = new AboutTimelineEntry();
    entity.setId(notBlank(request.getId()) ? request.getId().trim() : "timeline_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12));
    entity.setYearLabel(requiredText(request.getYearLabel(), "请输入时间轴年份"));
    entity.setContent(requiredText(request.getContent(), "请输入时间轴内容"));
    entity.setSort(request.getSort() == null ? nextTimelineSort() : request.getSort());
    aboutTimelineEntryMapper.insert(entity);
    AboutTimelineEntryResponse created = toAboutTimelineEntryResponse(entity);
    auditLogService.record(AuditLogCommand.builder()
        .module("ABOUT")
        .action("CREATE")
        .targetType("ABOUT_TIMELINE")
        .targetId(entity.getId())
        .requestSummary(request)
        .afterSnapshot(created)
        .success(true)
        .build());
    return created;
  }

  @Transactional
  @CacheEvict(cacheNames = "aboutTimeline", allEntries = true)
  public AboutTimelineEntryResponse updateAboutTimelineEntry(String id, AboutTimelineEntryRequest request) {
    AboutTimelineEntry current = requireTimelineEntry(id);
    AboutTimelineEntryResponse before = toAboutTimelineEntryResponse(current);
    current.setYearLabel(requiredText(request.getYearLabel(), "请输入时间轴年份"));
    current.setContent(requiredText(request.getContent(), "请输入时间轴内容"));
    current.setSort(request.getSort() == null ? current.getSort() : request.getSort());
    aboutTimelineEntryMapper.updateById(current);
    AboutTimelineEntryResponse after = toAboutTimelineEntryResponse(current);
    auditLogService.record(AuditLogCommand.builder()
        .module("ABOUT")
        .action("UPDATE")
        .targetType("ABOUT_TIMELINE")
        .targetId(id)
        .requestSummary(request)
        .beforeSnapshot(before)
        .afterSnapshot(after)
        .success(true)
        .build());
    return after;
  }

  @Transactional
  @CacheEvict(cacheNames = "aboutTimeline", allEntries = true)
  public void deleteAboutTimelineEntry(String id) {
    AboutTimelineEntry current = requireTimelineEntry(id);
    AboutTimelineEntryResponse before = toAboutTimelineEntryResponse(current);
    if (aboutTimelineEntryMapper.deleteById(id) == 0) {
      throw new ApiException(HttpStatus.NOT_FOUND, "时间轴条目不存在");
    }
    auditLogService.record(AuditLogCommand.builder()
        .module("ABOUT")
        .action("DELETE")
        .targetType("ABOUT_TIMELINE")
        .targetId(id)
        .requestSummary(java.util.Map.of("id", id))
        .beforeSnapshot(before)
        .afterSnapshot(null)
        .success(true)
        .build());
  }

  @Transactional
  @CacheEvict(cacheNames = "team", allEntries = true)
  public TeamMember createTeamMember(TeamMemberRequest request) {
    TeamMember entity = new TeamMember();
    entity.setId(notBlank(request.getId()) ? request.getId().trim() : "team_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12));
    entity.setName(requiredText(request.getName(), "请输入团队成员姓名"));
    entity.setTitle(requiredText(request.getTitle(), "请输入团队成员职务"));
    entity.setAvatar(requiredText(request.getAvatar(), "请上传团队成员头像"));
    entity.setBio(optionalText(request.getBio()));
    entity.setSort(request.getSort() == null ? nextTeamSort() : request.getSort());
    teamMemberMapper.insert(entity);
    auditLogService.record(AuditLogCommand.builder()
        .module("TEAM")
        .action("CREATE")
        .targetType("TEAM_MEMBER")
        .targetId(entity.getId())
        .requestSummary(request)
        .afterSnapshot(entity)
        .success(true)
        .build());
    return entity;
  }

  @Transactional
  @CacheEvict(cacheNames = "team", allEntries = true)
  public TeamMember updateTeamMember(String id, TeamMemberRequest request) {
    TeamMember current = requireTeamMember(id);
    TeamMember before = cloneTeamMember(current);
    current.setName(requiredText(request.getName(), "请输入团队成员姓名"));
    current.setTitle(requiredText(request.getTitle(), "请输入团队成员职务"));
    current.setAvatar(requiredText(request.getAvatar(), "请上传团队成员头像"));
    current.setBio(optionalText(request.getBio()));
    current.setSort(request.getSort() == null ? current.getSort() : request.getSort());
    teamMemberMapper.updateById(current);
    auditLogService.record(AuditLogCommand.builder()
        .module("TEAM")
        .action("UPDATE")
        .targetType("TEAM_MEMBER")
        .targetId(id)
        .requestSummary(request)
        .beforeSnapshot(before)
        .afterSnapshot(current)
        .success(true)
        .build());
    return current;
  }

  @Transactional
  @CacheEvict(cacheNames = "team", allEntries = true)
  public void deleteTeamMember(String id) {
    TeamMember current = requireTeamMember(id);
    TeamMember before = cloneTeamMember(current);
    if (teamMemberMapper.deleteById(id) == 0) {
      throw new ApiException(HttpStatus.NOT_FOUND, "团队成员不存在");
    }
    auditLogService.record(AuditLogCommand.builder()
        .module("TEAM")
        .action("DELETE")
        .targetType("TEAM_MEMBER")
        .targetId(id)
        .requestSummary(java.util.Map.of("id", id))
        .beforeSnapshot(before)
        .afterSnapshot(null)
        .success(true)
        .build());
  }

  private TeamMember cloneTeamMember(TeamMember source) {
    TeamMember copy = new TeamMember();
    copy.setId(source.getId());
    copy.setName(source.getName());
    copy.setTitle(source.getTitle());
    copy.setAvatar(source.getAvatar());
    copy.setBio(source.getBio());
    copy.setSort(source.getSort());
    return copy;
  }

  private AiSettings cloneAiSettings(AiSettings source) {
    AiSettings copy = new AiSettings();
    copy.setId(source.getId());
    copy.setEnabled(source.getEnabled());
    copy.setProvider(source.getProvider());
    copy.setApiKey(resolveAiApiKey(source));
    copy.setModel(source.getModel());
    copy.setBaseUrl(source.getBaseUrl());
    copy.setGeneratePath(source.getGeneratePath());
    copy.setSize(source.getSize());
    copy.setTextModel(source.getTextModel());
    copy.setTextGeneratePath(source.getTextGeneratePath());
    copy.setTextTemperature(source.getTextTemperature());
    copy.setTextMaxTokens(source.getTextMaxTokens());
    return copy;
  }

  private ConfigTransferPayload buildConfigTransferPayload(boolean includeSecrets) {
    ConfigTransferPayload payload = new ConfigTransferPayload();
    payload.setVersion("1.0.0");
    payload.setGeneratedAt(DATE_TIME_FORMATTER.format(LocalDateTime.now(clock)));
    payload.setSiteConfig(getAdminSiteConfig());
    payload.setShopInfo(getShopInfo());
    payload.setBrandStory(getBrandStory());
    payload.setAboutPage(getAboutPage());
    payload.setTimeline(getAboutTimeline());
    payload.setTeam(getAdminTeamMembers().stream().map(this::cloneTeamMember).toList());
    payload.setAiSettings(toConfigTransferAiSettings(ensureAiSettings(), includeSecrets));
    return payload;
  }

  private void applyConfigTransferPayload(ConfigTransferPayload payload) {
    if (payload.getSiteConfig() != null) {
      SiteConfigResponse source = payload.getSiteConfig();
      SiteConfig current = ensureSiteConfig();
      current.setBrandName(text(source.getBrandName(), current.getBrandName()));
      current.setHeroEyebrow(text(source.getHeroEyebrow(), current.getHeroEyebrow()));
      current.setHeroTitle(text(source.getHeroTitle(), current.getHeroTitle()));
      current.setHeroDescription(text(source.getHeroDescription(), current.getHeroDescription()));
      current.setHeroImage(text(source.getHeroImage(), current.getHeroImage()));
      current.setPrimaryCtaText(text(source.getPrimaryCtaText(), current.getPrimaryCtaText()));
      current.setSecondaryCtaText(text(source.getSecondaryCtaText(), current.getSecondaryCtaText()));
      current.setContactIntro(text(source.getContactIntro(), current.getContactIntro()));
      current.setBusinessHoursText(text(source.getBusinessHoursText(), current.getBusinessHoursText()));
      current.setFooterDescription(text(source.getFooterDescription(), current.getFooterDescription()));
      current.setLicenseCustomerName(text(source.getLicenseCustomerName(), current.getLicenseCustomerName()));
      current.setLicenseCode(text(source.getLicenseCode(), current.getLicenseCode()));
      current.setLicenseType(text(source.getLicenseType(), current.getLicenseType()));
      current.setLicenseExpiresAt(source.getLicenseExpiresAt() == null ? current.getLicenseExpiresAt() : source.getLicenseExpiresAt());
      current.setLicenseWarningDays(source.getLicenseWarningDays() == null ? current.getLicenseWarningDays() : source.getLicenseWarningDays());
      current.setLicenseNotes(text(source.getLicenseNotes(), current.getLicenseNotes()));
      siteConfigMapper.updateById(current);
    }

    if (payload.getShopInfo() != null) {
      ShopInfoResponse source = payload.getShopInfo();
      ShopInfo current = ensureShopInfo();
      current.setName(text(source.getName(), current.getName()));
      current.setPhone(text(source.getPhone(), current.getPhone()));
      current.setWechat(text(source.getWechat(), current.getWechat()));
      current.setAddress(text(source.getAddress(), current.getAddress()));
      current.setLatitude(source.getLatitude() == null ? current.getLatitude() : source.getLatitude());
      current.setLongitude(source.getLongitude() == null ? current.getLongitude() : source.getLongitude());
      shopInfoMapper.updateById(current);
      replaceBusinessHours(source.getHours());
    }

    if (payload.getBrandStory() != null) {
      BrandStoryResponse source = payload.getBrandStory();
      BrandStory current = ensureBrandStory();
      current.setTitle(text(source.getTitle(), current.getTitle()));
      current.setSubtitle(text(source.getSubtitle(), current.getSubtitle()));
      current.setContent(text(source.getContent(), current.getContent()));
      brandStoryMapper.updateById(current);
      replaceStoryImages(source.getImages());
    }

    if (payload.getAboutPage() != null) {
      AboutPageResponse source = payload.getAboutPage();
      AboutPage current = ensureAboutPage();
      current.setHeroImage(text(source.getHeroImage(), current.getHeroImage()));
      current.setHeroEyebrow(text(source.getHeroEyebrow(), current.getHeroEyebrow()));
      current.setHeroTitle(text(source.getHeroTitle(), current.getHeroTitle()));
      current.setHeroSubtitle(text(source.getHeroSubtitle(), current.getHeroSubtitle()));
      current.setStoryTitle(text(source.getStoryTitle(), current.getStoryTitle()));
      current.setStoryContent(text(source.getStoryContent(), current.getStoryContent()));
      aboutPageMapper.updateById(current);
    }

    if (payload.getTimeline() != null) {
      aboutTimelineEntryMapper.delete(null);
      for (AboutTimelineEntryResponse item : payload.getTimeline()) {
        if (item == null || !notBlank(item.getYearLabel()) || !notBlank(item.getContent())) {
          continue;
        }
        AboutTimelineEntry entity = new AboutTimelineEntry();
        entity.setId(notBlank(item.getId()) ? item.getId().trim() : "timeline_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12));
        entity.setYearLabel(item.getYearLabel().trim());
        entity.setContent(item.getContent().trim());
        entity.setSort(item.getSort() == null ? 0 : item.getSort());
        aboutTimelineEntryMapper.insert(entity);
      }
    }

    if (payload.getTeam() != null) {
      teamMemberMapper.delete(null);
      for (TeamMember item : payload.getTeam()) {
        if (item == null || !notBlank(item.getName()) || !notBlank(item.getTitle()) || !notBlank(item.getAvatar())) {
          continue;
        }
        TeamMember entity = new TeamMember();
        entity.setId(notBlank(item.getId()) ? item.getId().trim() : "team_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12));
        entity.setName(item.getName().trim());
        entity.setTitle(item.getTitle().trim());
        entity.setAvatar(item.getAvatar().trim());
        entity.setBio(optionalText(item.getBio()));
        entity.setSort(item.getSort() == null ? 0 : item.getSort());
        teamMemberMapper.insert(entity);
      }
    }

    if (payload.getAiSettings() != null) {
      ConfigTransferAiSettings source = payload.getAiSettings();
      AiSettings current = ensureAiSettings();
      current.setEnabled(source.isEnabled());
      current.setProvider(text(source.getProvider(), current.getProvider()));
      current.setApiKey(secretConfigText(source.getApiKey(), current.getApiKey()));
      current.setModel(text(source.getModel(), current.getModel()));
      current.setBaseUrl(text(source.getBaseUrl(), current.getBaseUrl()));
      current.setGeneratePath(text(source.getGeneratePath(), current.getGeneratePath()));
      current.setSize(text(source.getSize(), current.getSize()));
      current.setTextModel(text(source.getTextModel(), current.getTextModel()));
      current.setTextGeneratePath(text(source.getTextGeneratePath(), current.getTextGeneratePath()));
      current.setTextTemperature(source.getTextTemperature() == null ? current.getTextTemperature() : source.getTextTemperature());
      current.setTextMaxTokens(source.getTextMaxTokens() == null ? current.getTextMaxTokens() : source.getTextMaxTokens());
      aiSettingsMapper.updateById(current);
    }
  }

  private void replaceStoryImages(List<String> images) {
    if (images == null) return;
    brandStoryImageMapper.delete(null);
    for (int i = 0; i < images.size(); i++) {
      String image = images.get(i);
      if (image == null || image.isBlank()) continue;
      BrandStoryImage entity = new BrandStoryImage();
      entity.setImageUrl(image.trim());
      entity.setSort(i);
      brandStoryImageMapper.insert(entity);
    }
  }

  private void replaceBusinessHours(BusinessHoursResponse hours) {
    if (hours == null) {
      return;
    }
    shopHourMapper.delete(null);
    insertHour("monday", hours.getMonday());
    insertHour("tuesday", hours.getTuesday());
    insertHour("wednesday", hours.getWednesday());
    insertHour("thursday", hours.getThursday());
    insertHour("friday", hours.getFriday());
    insertHour("saturday", hours.getSaturday());
    insertHour("sunday", hours.getSunday());
  }

  private void insertHour(String weekday, TimeRangeResponse source) {
    if (source == null) {
      return;
    }
    ShopHour entity = new ShopHour();
    entity.setWeekday(weekday);
    entity.setOpenTime(text(source.getOpen(), "09:00"));
    entity.setCloseTime(text(source.getClose(), "21:00"));
    entity.setOff(Boolean.TRUE.equals(source.getOff()));
    shopHourMapper.insert(entity);
  }

  private BusinessHoursResponse getBusinessHours() {
    BusinessHoursResponse hours = new BusinessHoursResponse();
    List<ShopHour> rows = shopHourMapper.selectList(new LambdaQueryWrapper<ShopHour>().orderByAsc(ShopHour::getId));
    for (ShopHour row : rows) {
      TimeRangeResponse range = new TimeRangeResponse();
      range.setOpen(row.getOpenTime());
      range.setClose(row.getCloseTime());
      range.setOff(row.getOff());
      switch (row.getWeekday()) {
        case "monday" -> hours.setMonday(range);
        case "tuesday" -> hours.setTuesday(range);
        case "wednesday" -> hours.setWednesday(range);
        case "thursday" -> hours.setThursday(range);
        case "friday" -> hours.setFriday(range);
        case "saturday" -> hours.setSaturday(range);
        case "sunday" -> hours.setSunday(range);
        default -> {
        }
      }
    }
    return hours;
  }

  private void updateAiSettings(AiSettingsUpdateRequest request) {
    if (request == null) {
      return;
    }
    AiSettings current = ensureAiSettings();
    current.setEnabled(request.getEnabled() == null ? current.getEnabled() : request.getEnabled());
    current.setProvider(text(request.getProvider(), current.getProvider()));
    current.setApiKey(secretConfigText(request.getApiKey(), current.getApiKey()));
    current.setModel(text(request.getModel(), current.getModel()));
    current.setBaseUrl(text(request.getBaseUrl(), current.getBaseUrl()));
    current.setGeneratePath(text(request.getGeneratePath(), current.getGeneratePath()));
    current.setSize(text(request.getSize(), current.getSize()));
    current.setTextModel(text(request.getTextModel(), current.getTextModel()));
    current.setTextGeneratePath(text(request.getTextGeneratePath(), current.getTextGeneratePath()));
    current.setTextTemperature(request.getTextTemperature() == null ? current.getTextTemperature() : request.getTextTemperature());
    current.setTextMaxTokens(request.getTextMaxTokens() == null ? current.getTextMaxTokens() : request.getTextMaxTokens());
    aiSettingsMapper.updateById(current);
  }

  private AiSettingsResponse toAiSettingsResponse(AiSettings settings) {
    String apiKey = resolveAiApiKey(settings);
    AiSettingsResponse response = new AiSettingsResponse();
    response.setEnabled(Boolean.TRUE.equals(settings.getEnabled()));
    response.setProvider(settings.getProvider());
    response.setApiKeyConfigured(notBlank(apiKey));
    response.setApiKeyMasked(maskApiKey(apiKey));
    response.setModel(settings.getModel());
    response.setBaseUrl(settings.getBaseUrl());
    response.setGeneratePath(settings.getGeneratePath());
    response.setSize(settings.getSize());
    response.setTextModel(settings.getTextModel());
    response.setTextGeneratePath(settings.getTextGeneratePath());
    response.setTextTemperature(settings.getTextTemperature());
    response.setTextMaxTokens(settings.getTextMaxTokens());
    return response;
  }

  private ConfigTransferAiSettings toConfigTransferAiSettings(AiSettings settings, boolean includeSecrets) {
    String apiKey = resolveAiApiKey(settings);
    ConfigTransferAiSettings response = new ConfigTransferAiSettings();
    response.setEnabled(Boolean.TRUE.equals(settings.getEnabled()));
    response.setProvider(settings.getProvider());
    response.setApiKey(includeSecrets ? apiKey : "");
    response.setModel(settings.getModel());
    response.setBaseUrl(settings.getBaseUrl());
    response.setGeneratePath(settings.getGeneratePath());
    response.setSize(settings.getSize());
    response.setTextModel(settings.getTextModel());
    response.setTextGeneratePath(settings.getTextGeneratePath());
    response.setTextTemperature(settings.getTextTemperature());
    response.setTextMaxTokens(settings.getTextMaxTokens());
    return response;
  }

  private AboutPageResponse toAboutPageResponse(AboutPage page) {
    AboutPageResponse response = new AboutPageResponse();
    response.setHeroImage(page.getHeroImage());
    response.setHeroEyebrow(page.getHeroEyebrow());
    response.setHeroTitle(page.getHeroTitle());
    response.setHeroSubtitle(page.getHeroSubtitle());
    response.setStoryTitle(page.getStoryTitle());
    response.setStoryContent(page.getStoryContent());
    return response;
  }

  private AboutTimelineEntryResponse toAboutTimelineEntryResponse(AboutTimelineEntry entry) {
    AboutTimelineEntryResponse response = new AboutTimelineEntryResponse();
    response.setId(entry.getId());
    response.setYearLabel(entry.getYearLabel());
    response.setContent(entry.getContent());
    response.setSort(entry.getSort());
    return response;
  }

  private String text(String next, String current) {
    return next == null ? current : next.trim();
  }

  private String secretText(String next, String current) {
    if (next == null) {
      return current;
    }
    String trimmed = next.trim();
    return trimmed.isEmpty() ? current : trimmed;
  }

  private String secretConfigText(String next, String currentEncrypted) {
    if (next == null) {
      return currentEncrypted;
    }
    String trimmed = next.trim();
    if (trimmed.isEmpty()) {
      return currentEncrypted;
    }
    return secretCryptoService.encrypt(trimmed);
  }

  private String maskApiKey(String apiKey) {
    if (!notBlank(apiKey)) {
      return "";
    }
    String trimmed = apiKey.trim();
    if (trimmed.length() <= 8) {
      return "****";
    }
    int prefix = Math.min(8, trimmed.length());
    int suffix = Math.min(4, trimmed.length() - prefix);
    return trimmed.substring(0, prefix) + "-****-****-****-" + trimmed.substring(trimmed.length() - suffix);
  }

  private String optionalText(String value) {
    return value == null ? null : value.trim();
  }

  private String requiredText(String value, String message) {
    if (value == null || value.isBlank()) throw new ApiException(HttpStatus.BAD_REQUEST, message);
    return value.trim();
  }

  private BigDecimal decimal(BigDecimal next, BigDecimal current) {
    return next == null ? current : next;
  }

  private SiteConfig ensureSiteConfig() {
    SiteConfig current = siteConfigMapper.selectById(SINGLETON_ID);
    if (current != null) return current;
    SiteConfig created = new SiteConfig();
    created.setId(SINGLETON_ID);
    ShopInfo shopInfo = shopInfoMapper.selectById(SINGLETON_ID);
    created.setBrandName(shopInfo != null && notBlank(shopInfo.getName()) ? shopInfo.getName() : "花语时光");
    created.setHeroEyebrow("");
    created.setHeroTitle(created.getBrandName());
    created.setHeroDescription("");
    created.setHeroImage("");
    created.setPrimaryCtaText("浏览作品");
    created.setSecondaryCtaText("联系门店");
    created.setContactIntro("");
    created.setBusinessHoursText("");
    created.setFooterDescription("");
    created.setLicenseWarningDays(30);
    siteConfigMapper.insert(created);
    return created;
  }

  private int resolveLicenseWarningDays(SiteConfig config) {
    if (config != null && config.getLicenseWarningDays() != null && config.getLicenseWarningDays() > 0) {
      return config.getLicenseWarningDays();
    }
    return 30;
  }

  private LicenseStatus resolveLicenseStatus(SiteConfig config) {
    if (config == null
        || !notBlank(config.getLicenseCustomerName())
        || !notBlank(config.getLicenseCode())
        || config.getLicenseExpiresAt() == null) {
      return new LicenseStatus("missing", "未配置授权信息");
    }

    LocalDateTime now = LocalDateTime.ofInstant(Instant.now(clock), zoneId == null ? ZoneId.systemDefault() : zoneId);
    if (config.getLicenseExpiresAt().isBefore(now)) {
      return new LicenseStatus("expired", "授权已到期");
    }

    long daysUntilExpiry = java.time.temporal.ChronoUnit.DAYS.between(now.toLocalDate(), config.getLicenseExpiresAt().toLocalDate());
    if (daysUntilExpiry <= resolveLicenseWarningDays(config)) {
      return new LicenseStatus("expiring", "授权将在 " + resolveLicenseWarningDays(config) + " 天内到期");
    }

    return new LicenseStatus("active", "授权有效");
  }

  private String formatDateTime(LocalDateTime value) {
    if (value == null) {
      return "";
    }
    return DATE_TIME_FORMATTER.format(value);
  }

  private String nullToEmpty(String value) {
    return value == null ? "" : value;
  }

  private String resolveAiApiKey(AiSettings settings) {
    if (settings == null || !notBlank(settings.getApiKey())) {
      return "";
    }
    return nullToEmpty(secretCryptoService.decrypt(settings.getApiKey()));
  }

  private AiSettings ensureAiSettings() {
    AiSettings current = aiSettingsMapper.selectById(SINGLETON_ID);
    if (current != null) {
      if (notBlank(current.getApiKey()) && !secretCryptoService.isEncrypted(current.getApiKey())) {
        current.setApiKey(secretCryptoService.encrypt(current.getApiKey()));
        aiSettingsMapper.updateById(current);
      }
      return current;
    }
    AiSettings created = new AiSettings();
    created.setId(SINGLETON_ID);
    created.setEnabled(false);
    created.setProvider("volcengine");
    created.setModel("Doubao-Seedream-5.0-lite");
    created.setBaseUrl("https://operator.las.cn-beijing.volces.com/api/v1");
    created.setGeneratePath("/images/generations");
    created.setSize("1920x1920");
    created.setTextModel("doubao-1-5-pro-32k-250115");
    created.setTextGeneratePath("/chat/completions");
    created.setTextTemperature(0.4D);
    created.setTextMaxTokens(1200);
    aiSettingsMapper.insert(created);
    return created;
  }

  private ShopInfo ensureShopInfo() {
    ShopInfo current = shopInfoMapper.selectById(SINGLETON_ID);
    if (current != null) return current;
    ShopInfo created = new ShopInfo();
    created.setId(SINGLETON_ID);
    created.setName("花语时光");
    created.setPhone("");
    created.setWechat("");
    created.setAddress("");
    created.setLatitude(BigDecimal.ZERO);
    created.setLongitude(BigDecimal.ZERO);
    shopInfoMapper.insert(created);
    return created;
  }

  private BrandStory ensureBrandStory() {
    BrandStory current = brandStoryMapper.selectById(SINGLETON_ID);
    if (current != null) return current;
    BrandStory created = new BrandStory();
    created.setId(SINGLETON_ID);
    created.setTitle("");
    created.setSubtitle("");
    created.setContent("");
    brandStoryMapper.insert(created);
    return created;
  }

  private AboutPage ensureAboutPage() {
    AboutPage current = aboutPageMapper.selectById(SINGLETON_ID);
    if (current != null) return current;
    AboutPage created = new AboutPage();
    created.setId(SINGLETON_ID);
    created.setHeroImage("");
    created.setHeroEyebrow("");
    created.setHeroTitle("关于我们");
    created.setHeroSubtitle("");
    created.setStoryTitle("品牌故事");
    created.setStoryContent("");
    aboutPageMapper.insert(created);
    return created;
  }

  private AboutTimelineEntry requireTimelineEntry(String id) {
    AboutTimelineEntry current = aboutTimelineEntryMapper.selectById(id);
    if (current == null) throw new ApiException(HttpStatus.NOT_FOUND, "时间轴条目不存在");
    return current;
  }

  private int nextTimelineSort() {
    return aboutTimelineEntryMapper.selectList(new LambdaQueryWrapper<AboutTimelineEntry>().orderByDesc(AboutTimelineEntry::getSort))
        .stream().map(AboutTimelineEntry::getSort).filter(value -> value != null).findFirst().orElse(-1) + 1;
  }

  private TeamMember requireTeamMember(String id) {
    TeamMember current = teamMemberMapper.selectById(id);
    if (current == null) throw new ApiException(HttpStatus.NOT_FOUND, "团队成员不存在");
    return current;
  }

  private int nextTeamSort() {
    return teamMemberMapper.selectList(new LambdaQueryWrapper<TeamMember>().orderByDesc(TeamMember::getSort))
        .stream().map(TeamMember::getSort).filter(value -> value != null).findFirst().orElse(-1) + 1;
  }

  private boolean notBlank(String value) {
    return value != null && !value.isBlank();
  }

  private String resolveServiceName() {
    if (buildProperties != null && notBlank(buildProperties.getName())) {
      return buildProperties.getName().trim();
    }
    return "flower-shop-backend-java";
  }

  private String resolveVersion() {
    if (buildProperties != null && notBlank(buildProperties.getVersion())) {
      return buildProperties.getVersion().trim();
    }
    Package pkg = SiteService.class.getPackage();
    if (pkg != null && notBlank(pkg.getImplementationVersion())) {
      return pkg.getImplementationVersion().trim();
    }
    return "dev";
  }

  private String resolveDeploymentEnvironment() {
    if (appProperties.getRuntime() != null && notBlank(appProperties.getRuntime().getEnvironment())) {
      return appProperties.getRuntime().getEnvironment().trim();
    }
    return "local";
  }

  private String resolveGitRevision() {
    if (appProperties.getRuntime() != null && notBlank(appProperties.getRuntime().getGitRevision())) {
      return appProperties.getRuntime().getGitRevision().trim();
    }
    return "dev";
  }

  private String resolveBuildTime() {
    if (buildProperties != null && buildProperties.getTime() != null) {
      return formatInstant(buildProperties.getTime());
    }
    return "";
  }

  private String resolveDeployedAt() {
    if (appProperties.getRuntime() != null && notBlank(appProperties.getRuntime().getDeployedAt())) {
      try {
        return formatInstant(Instant.parse(appProperties.getRuntime().getDeployedAt().trim()));
      } catch (Exception ignored) {
        return appProperties.getRuntime().getDeployedAt().trim();
      }
    }
    return "";
  }

  private DatabaseStatus inspectDatabaseStatus() {
    try (Connection connection = dataSource.getConnection()) {
      if (connection == null || !connection.isValid(2)) {
        return new DatabaseStatus(false, "", "");
      }
      String version = "";
      if (connection.getMetaData() != null && notBlank(connection.getMetaData().getDatabaseProductVersion())) {
        version = connection.getMetaData().getDatabaseProductVersion().trim();
      }
      return new DatabaseStatus(true, version, resolveDatabaseSize(connection));
    } catch (Exception exception) {
      return new DatabaseStatus(false, "", "");
    }
  }

  private String resolveDatabaseSize(Connection connection) {
    try (Statement statement = connection.createStatement();
         ResultSet resultSet =
             statement.executeQuery(
                 "SELECT CONCAT(FORMAT(IFNULL(SUM(data_length + index_length) / 1024 / 1024, 0), 2), ' MB') "
                     + "FROM information_schema.TABLES "
                     + "WHERE table_schema = DATABASE()")) {
      if (resultSet.next()) {
        String value = resultSet.getString(1);
        return value == null ? "" : value.trim();
      }
    } catch (Exception exception) {
      return "";
    }
    return "";
  }

  private File resolveDirectory(String configuredPath, String fallbackPath) {
    String path = notBlank(configuredPath) ? configuredPath.trim() : fallbackPath;
    return new File(path).getAbsoluteFile();
  }

  private String formatDiskUsageRate(File directory) {
    long total = directory.getTotalSpace();
    long usable = directory.getUsableSpace();
    if (total <= 0L) {
      return "";
    }
    double usedRate = ((double) (total - usable) / (double) total) * 100D;
    return String.format(java.util.Locale.US, "%.2f%%", usedRate);
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

  private long calculateDirectorySize(File directory) {
    if (!directory.exists() || !directory.isDirectory()) {
      return 0L;
    }
    File[] files = directory.listFiles();
    if (files == null) {
      return 0L;
    }
    long total = 0L;
    for (File file : files) {
      if (file.isDirectory()) {
        total += calculateDirectorySize(file);
      } else {
        total += file.length();
      }
    }
    return total;
  }

  private String formatUptime() {
    if (startedAt == null) {
      return "未知";
    }
    Duration duration = Duration.between(startedAt, Instant.now(clock));
    if (duration.isNegative()) {
      return "未知";
    }
    long totalMinutes = duration.toMinutes();
    if (totalMinutes < 60) {
      return totalMinutes + "分钟";
    }
    long hours = totalMinutes / 60;
    long minutes = totalMinutes % 60;
    if (hours < 24) {
      return minutes == 0 ? hours + "小时" : hours + "小时" + minutes + "分钟";
    }
    long days = hours / 24;
    long remainHours = hours % 24;
    return remainHours == 0 ? days + "天" : days + "天" + remainHours + "小时";
  }

  private String formatBackupModifiedAt(File backupDirectory) {
    if (backupDirectory == null || !backupDirectory.exists()) {
      return "";
    }
    return formatInstant(Instant.ofEpochMilli(backupDirectory.lastModified()));
  }

  private String formatInstant(Instant instant) {
    if (instant == null) {
      return "";
    }
    return DATE_TIME_FORMATTER.format(instant.atZone(zoneId == null ? ZoneId.systemDefault() : zoneId));
  }

  private File resolveOperationLogArchiveDirectory() {
    File backupDir = resolveDirectory(appProperties.getBackup().getDir(), "../backups");
    return resolveDirectory(
        backupDir.toPath().resolve(appProperties.getOperationLog().getArchiveDir()).toString(),
        backupDir.toPath().resolve("operation-logs").toString());
  }

  private long resolveOperationLogCount() {
    return operationLogMapper.selectCount(new LambdaQueryWrapper<>());
  }

  private int resolveOperationLogRetentionDays() {
    Integer retentionDays = appProperties.getOperationLog() == null ? null : appProperties.getOperationLog().getRetentionDays();
    return retentionDays == null || retentionDays < 1 ? 180 : retentionDays;
  }

  private String resolveOperationLogArchiveBefore() {
    OperationLog earliest = operationLogMapper.selectOne(new LambdaQueryWrapper<OperationLog>()
        .orderByAsc(OperationLog::getCreatedAt)
        .orderByAsc(OperationLog::getId)
        .last("limit 1"));
    if (earliest == null || earliest.getCreatedAt() == null) {
      return "";
    }
    return DATE_TIME_FORMATTER.format(earliest.getCreatedAt().minusDays(resolveOperationLogRetentionDays()));
  }

  private String buildOperationLogCsv(List<OperationLog> logs) {
    StringBuilder builder = new StringBuilder("\uFEFF");
    builder.append("ID,模块,动作,目标类型,目标ID,操作人,结果,请求摘要,失败原因,IP,恢复来源日志ID,创建时间\n");
    for (OperationLog item : logs) {
      builder
          .append(csv(item.getId()))
          .append(',').append(csv(item.getModule()))
          .append(',').append(csv(item.getAction()))
          .append(',').append(csv(item.getTargetType()))
          .append(',').append(csv(item.getTargetId()))
          .append(',').append(csv(item.getOperatorName()))
          .append(',').append(csv(Boolean.TRUE.equals(item.getSuccess()) ? "SUCCESS" : "FAILED"))
          .append(',').append(csv(item.getRequestSummary()))
          .append(',').append(csv(item.getErrorMessage()))
          .append(',').append(csv(item.getIpAddress()))
          .append(',').append(csv(item.getRestoredFromLogId()))
          .append(',').append(csv(item.getCreatedAt()))
          .append('\n');
    }
    return builder.toString();
  }

  private OperationLogArchiveFileResponse toOperationLogArchiveFileResponse(File file) {
    OperationLogArchiveFileResponse response = new OperationLogArchiveFileResponse();
    response.setFilename(file.getName());
    response.setPath(file.getAbsolutePath());
    response.setModifiedAt(formatBackupModifiedAt(file));
    response.setSize(formatBytes(file.length()));
    response.setDownloadUrl("/api/admin/system/operation-logs/archive-files/" + file.getName() + "/download");
    return response;
  }

  private String csv(Object value) {
    if (value == null) {
      return "\"\"";
    }
    String raw = String.valueOf(value).replace("\"", "\"\"");
    return "\"" + raw + "\"";
  }

  private long countFiles(File directory) {
    if (!directory.exists() || !directory.isDirectory()) {
      return 0;
    }
    File[] files = directory.listFiles();
    if (files == null) {
      return 0;
    }
    long total = 0;
    for (File file : files) {
      if (file.isDirectory()) {
        total += countFiles(file);
      } else {
        total++;
      }
    }
    return total;
  }

  private File resolveLatestBackup(File backupsDir) {
    if (!backupsDir.exists() || !backupsDir.isDirectory()) {
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

  private void writeDirectoryToTar(File source, String entryName, TarArchiveOutputStream outputStream) throws IOException {
    TarArchiveEntry entry = new TarArchiveEntry(source, entryName);
    outputStream.putArchiveEntry(entry);
    outputStream.closeArchiveEntry();

    if (!source.isDirectory()) {
      try (BufferedInputStream inputStream = new BufferedInputStream(java.nio.file.Files.newInputStream(source.toPath()))) {
        inputStream.transferTo(outputStream);
      }
      return;
    }

    File[] files = source.listFiles();
    if (files == null) {
      return;
    }
    for (File file : files) {
      writeDirectoryToTar(file, entryName + "/" + file.getName(), outputStream);
    }
  }

  private record DatabaseStatus(boolean connected, String version, String size) {}
  private record LicenseStatus(String code, String label) {}
}
