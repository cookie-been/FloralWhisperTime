package com.floralwhisper.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.floralwhisper.audit.AuditLogCommand;
import com.floralwhisper.audit.AuditLogService;
import com.floralwhisper.common.ApiException;
import com.floralwhisper.config.AppProperties;
import com.floralwhisper.dto.AboutPageResponse;
import com.floralwhisper.dto.AboutPageUpdateRequest;
import com.floralwhisper.dto.AboutTimelineEntryRequest;
import com.floralwhisper.dto.AboutTimelineEntryResponse;
import com.floralwhisper.dto.AiSettingsResponse;
import com.floralwhisper.dto.AiSettingsUpdateRequest;
import com.floralwhisper.dto.BrandStoryResponse;
import com.floralwhisper.dto.BusinessHoursResponse;
import com.floralwhisper.dto.OperationLogArchiveResponse;
import com.floralwhisper.dto.ShopInfoResponse;
import com.floralwhisper.dto.SiteConfigResponse;
import com.floralwhisper.dto.SiteConfigUpdateRequest;
import com.floralwhisper.dto.SiteConfigUpdateResponse;
import com.floralwhisper.dto.SiteStatResponse;
import com.floralwhisper.dto.SystemStatusResponse;
import com.floralwhisper.dto.TeamMemberRequest;
import com.floralwhisper.dto.TimeRangeResponse;
import com.floralwhisper.entity.AboutPage;
import com.floralwhisper.entity.AboutTimelineEntry;
import com.floralwhisper.entity.AiSettings;
import com.floralwhisper.entity.Category;
import com.floralwhisper.entity.BrandStory;
import com.floralwhisper.entity.BrandStoryImage;
import com.floralwhisper.entity.OperationLog;
import com.floralwhisper.entity.ShopHour;
import com.floralwhisper.entity.ShopInfo;
import com.floralwhisper.entity.SiteConfig;
import com.floralwhisper.entity.SiteConfigStat;
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
import com.floralwhisper.mapper.SiteConfigStatMapper;
import com.floralwhisper.mapper.TeamMemberMapper;
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
import java.util.UUID;
import java.util.zip.GZIPOutputStream;
import org.apache.commons.compress.archivers.tar.TarArchiveEntry;
import org.apache.commons.compress.archivers.tar.TarArchiveOutputStream;
import javax.sql.DataSource;
import org.springframework.http.HttpStatus;
import org.springframework.boot.info.BuildProperties;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SiteService {
  private static final long SINGLETON_ID = 1L;
  private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

  private final SiteConfigMapper siteConfigMapper;
  private final SiteConfigStatMapper siteConfigStatMapper;
  private final ShopInfoMapper shopInfoMapper;
  private final ShopHourMapper shopHourMapper;
  private final AboutPageMapper aboutPageMapper;
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

  @Autowired
  public SiteService(
      SiteConfigMapper siteConfigMapper,
      SiteConfigStatMapper siteConfigStatMapper,
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
      AppProperties appProperties,
      DataSource dataSource,
      @Nullable BuildProperties buildProperties,
      AuditLogService auditLogService) {
    this(
        siteConfigMapper,
        siteConfigStatMapper,
        shopInfoMapper,
        shopHourMapper,
        aboutPageMapper,
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
        auditLogService,
        Instant.now(),
        ZoneId.systemDefault(),
        Clock.systemDefaultZone());
  }

  SiteService(
      SiteConfigMapper siteConfigMapper,
      SiteConfigStatMapper siteConfigStatMapper,
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
      AppProperties appProperties,
      DataSource dataSource,
      @Nullable BuildProperties buildProperties,
      AuditLogService auditLogService,
      @Nullable Instant startedAt,
      ZoneId zoneId,
      Clock clock) {
    this.siteConfigMapper = siteConfigMapper;
    this.siteConfigStatMapper = siteConfigStatMapper;
    this.shopInfoMapper = shopInfoMapper;
    this.shopHourMapper = shopHourMapper;
    this.aboutPageMapper = aboutPageMapper;
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
    this.auditLogService = auditLogService;
    this.startedAt = startedAt;
    this.zoneId = zoneId;
    this.clock = clock;
  }

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
    response.setStats(siteConfigStatMapper.selectList(new LambdaQueryWrapper<SiteConfigStat>().orderByAsc(SiteConfigStat::getSort))
        .stream().map(this::toStatResponse).toList());
    return response;
  }

  public AiSettingsResponse getAdminAiSettings() {
    return toAiSettingsResponse(ensureAiSettings());
  }

  public SystemStatusResponse getSystemStatus() {
    SystemStatusResponse response = new SystemStatusResponse();
    AiSettings aiSettings = ensureAiSettings();
    File uploadsDir = resolveDirectory(appProperties.getUpload().getDir(), "uploads");
    File backupsDir = resolveDirectory(appProperties.getBackup().getDir(), "../backups");
    File latestBackup = resolveLatestBackup(backupsDir);
    DatabaseStatus databaseStatus = inspectDatabaseStatus();

    response.setService(resolveServiceName());
    response.setVersion(resolveVersion());
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
    response.setOperationLogCount(resolveOperationLogCount());
    response.setOperationLogRetentionDays(resolveOperationLogRetentionDays());
    response.setOperationLogArchiveBefore(resolveOperationLogArchiveBefore());
    return response;
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

  public List<Category> getCategories() {
    return categoryMapper.selectList(new LambdaQueryWrapper<Category>().orderByDesc(Category::getSort));
  }

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

  public AboutPageResponse getAboutPage() {
    return toAboutPageResponse(ensureAboutPage());
  }

  public List<AboutTimelineEntryResponse> getAboutTimeline() {
    ensureDefaultTimelineEntries();
    return aboutTimelineEntryMapper.selectList(new LambdaQueryWrapper<AboutTimelineEntry>().orderByAsc(AboutTimelineEntry::getSort))
        .stream().map(this::toAboutTimelineEntryResponse).toList();
  }

  public List<TeamMember> getAdminTeamMembers() {
    ensureDefaultTeamMembers();
    return teamMemberMapper.selectList(new LambdaQueryWrapper<TeamMember>().orderByDesc(TeamMember::getSort));
  }

  @Transactional
  public SiteConfigUpdateResponse updateSiteConfig(SiteConfigUpdateRequest request) {
    SiteConfigUpdateResponse before = new SiteConfigUpdateResponse(getSiteConfig(), getShopInfo(), getBrandStory());
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
    siteConfigMapper.updateById(config);
    if (request.getStats() != null) {
      replaceStats(request.getStats());
    }

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

    SiteConfigUpdateResponse after = new SiteConfigUpdateResponse(getSiteConfig(), getShopInfo(), getBrandStory());
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
    copy.setApiKey(source.getApiKey());
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

  private void replaceStats(List<SiteStatResponse> stats) {
    if (stats == null) return;
    siteConfigStatMapper.delete(null);
    for (int i = 0; i < stats.size(); i++) {
      SiteStatResponse stat = stats.get(i);
      if (stat.getValue() == null || stat.getValue().isBlank() || stat.getLabel() == null || stat.getLabel().isBlank()) continue;
      SiteConfigStat entity = new SiteConfigStat();
      entity.setValue(stat.getValue().trim());
      entity.setLabel(stat.getLabel().trim());
      entity.setSort(i);
      siteConfigStatMapper.insert(entity);
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

  private BusinessHoursResponse getBusinessHours() {
    ensureDefaultHours();
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

  private SiteStatResponse toStatResponse(SiteConfigStat stat) {
    SiteStatResponse response = new SiteStatResponse();
    response.setValue(stat.getValue());
    response.setLabel(stat.getLabel());
    return response;
  }

  private void updateAiSettings(AiSettingsUpdateRequest request) {
    if (request == null) {
      return;
    }
    AiSettings current = ensureAiSettings();
    current.setEnabled(request.getEnabled() == null ? current.getEnabled() : request.getEnabled());
    current.setProvider(text(request.getProvider(), current.getProvider()));
    current.setApiKey(secretText(request.getApiKey(), current.getApiKey()));
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
    AiSettingsResponse response = new AiSettingsResponse();
    response.setEnabled(Boolean.TRUE.equals(settings.getEnabled()));
    response.setProvider(settings.getProvider());
    response.setApiKeyConfigured(notBlank(settings.getApiKey()));
    response.setApiKeyMasked(maskApiKey(settings.getApiKey()));
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
    created.setHeroEyebrow("清新文艺 · 自然温暖");
    created.setHeroTitle(created.getBrandName());
    created.setHeroDescription("用季节花材和克制色彩，制作适合婚礼、日常赠礼与空间陈列的鲜花作品。");
    created.setHeroImage("https://picsum.photos/seed/floral-hero/1920/1080");
    created.setPrimaryCtaText("浏览作品");
    created.setSecondaryCtaText("联系门店");
    created.setContactIntro("欢迎预约花束、婚礼花艺、商业空间花艺和节日定制服务。");
    created.setBusinessHoursText("周一至周五 09:30-21:00，周末 10:00-21:30");
    created.setFooterDescription("纯展示型鲜花店窗口，展示婚礼、日常花礼、开业花篮、节气花束与定制花艺。");
    siteConfigMapper.insert(created);
    ensureDefaultStats();
    return created;
  }

  private AiSettings ensureAiSettings() {
    AiSettings current = aiSettingsMapper.selectById(SINGLETON_ID);
    if (current != null) return current;
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
    ensureDefaultHours();
    return created;
  }

  private BrandStory ensureBrandStory() {
    BrandStory current = brandStoryMapper.selectById(SINGLETON_ID);
    if (current != null) return current;
    BrandStory created = new BrandStory();
    created.setId(SINGLETON_ID);
    created.setTitle("让花束像一封慢慢抵达的信");
    created.setSubtitle("花语时光相信，每一束花都应该有清楚的情绪和自然的呼吸。");
    created.setContent("我们从季节花材出发，为婚礼、日常赠礼、商业空间和私人宴会设计花艺。店铺坚持少量精选、手工制作，用克制的色彩和舒展的结构表达真诚心意。");
    brandStoryMapper.insert(created);
    return created;
  }

  private AboutPage ensureAboutPage() {
    AboutPage current = aboutPageMapper.selectById(SINGLETON_ID);
    if (current != null) return current;
    AboutPage created = new AboutPage();
    created.setId(SINGLETON_ID);
    created.setHeroImage("https://picsum.photos/seed/floral-about/1920/1080");
    created.setHeroEyebrow("About Floral Whisper Time");
    created.setHeroTitle("让花束像一封慢慢抵达的信");
    created.setHeroSubtitle("花语时光相信，每一束花都应该有清楚的情绪和自然的呼吸。");
    created.setStoryTitle("品牌故事");
    created.setStoryContent("我们从季节花材出发，为婚礼、日常赠礼、商业空间和私人宴会设计花艺。店铺坚持少量精选、手工制作，用克制的色彩和舒展的结构表达真诚心意。");
    aboutPageMapper.insert(created);
    return created;
  }

  private void ensureDefaultTimelineEntries() {
    if (!aboutTimelineEntryMapper.selectList(null).isEmpty()) return;
    insertTimelineEntry("timeline_2021", "2021", "花语时光第一间工作室成立，专注日常花礼。", 0);
    insertTimelineEntry("timeline_2023", "2023", "开始承接婚礼、展陈与品牌活动花艺设计。", 1);
    insertTimelineEntry("timeline_2026", "2026", "升级双端展示系统，统一展示作品与门店信息。", 2);
  }

  private void insertTimelineEntry(String id, String yearLabel, String content, int sort) {
    AboutTimelineEntry entity = new AboutTimelineEntry();
    entity.setId(id);
    entity.setYearLabel(yearLabel);
    entity.setContent(content);
    entity.setSort(sort);
    aboutTimelineEntryMapper.insert(entity);
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

  private void ensureDefaultTeamMembers() {
    if (!teamMemberMapper.selectList(null).isEmpty()) return;
    TeamMember one = new TeamMember();
    one.setId("designer_01");
    one.setName("林汐");
    one.setTitle("主理花艺师");
    one.setAvatar("https://picsum.photos/seed/team-1/600/600");
    one.setBio("负责品牌花艺风格、季节系列与空间陈列方向。");
    one.setSort(2);
    teamMemberMapper.insert(one);

    TeamMember two = new TeamMember();
    two.setId("designer_02");
    two.setName("周宁");
    two.setTitle("婚礼与活动花艺师");
    two.setAvatar("https://picsum.photos/seed/team-2/600/600");
    two.setBio("负责婚礼花艺、品牌活动现场和大型空间花艺布置。");
    two.setSort(1);
    teamMemberMapper.insert(two);
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

  private void ensureDefaultStats() {
    if (!siteConfigStatMapper.selectList(null).isEmpty()) return;
    insertDefaultStat(0, "860+", "已服务客户");
    insertDefaultStat(1, "320+", "花艺作品");
    insertDefaultStat(2, String.valueOf(defaultCategoryCount()), "主题分类");
  }

  private void insertDefaultStat(int sort, String value, String label) {
    SiteConfigStat entity = new SiteConfigStat();
    entity.setSort(sort);
    entity.setValue(value);
    entity.setLabel(label);
    siteConfigStatMapper.insert(entity);
  }

  private int defaultCategoryCount() {
    return (int) categoryMapper.selectList(null).stream().map(Category::getId).filter(id -> id != null && !"all".equals(id)).count();
  }

  private void ensureDefaultHours() {
    if (!shopHourMapper.selectList(null).isEmpty()) return;
    insertDefaultHour("monday", "09:30", "21:00", false);
    insertDefaultHour("tuesday", "09:30", "21:00", false);
    insertDefaultHour("wednesday", "09:30", "21:00", false);
    insertDefaultHour("thursday", "09:30", "21:00", false);
    insertDefaultHour("friday", "09:30", "21:30", false);
    insertDefaultHour("saturday", "10:00", "21:30", false);
    insertDefaultHour("sunday", "10:00", "20:30", false);
  }

  private void insertDefaultHour(String weekday, String openTime, String closeTime, boolean off) {
    ShopHour entity = new ShopHour();
    entity.setWeekday(weekday);
    entity.setOpenTime(openTime);
    entity.setCloseTime(closeTime);
    entity.setOff(off);
    shopHourMapper.insert(entity);
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
    return DATE_TIME_FORMATTER.format(
        Instant.ofEpochMilli(backupDirectory.lastModified()).atZone(zoneId == null ? ZoneId.systemDefault() : zoneId));
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
}
