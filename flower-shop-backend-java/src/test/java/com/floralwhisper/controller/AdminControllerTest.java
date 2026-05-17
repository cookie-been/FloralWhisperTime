package com.floralwhisper.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.floralwhisper.audit.AuditLogService;
import com.floralwhisper.common.GlobalExceptionHandler;
import com.floralwhisper.config.AppProperties;
import com.floralwhisper.config.SecurityConfig;
import com.floralwhisper.protection.HeavyOperationGuard;
import com.floralwhisper.protection.RateLimitInterceptor;
import com.floralwhisper.protection.ServiceBusyException;
import com.floralwhisper.dto.AboutPageResponse;
import com.floralwhisper.dto.AboutTimelineEntryResponse;
import com.floralwhisper.dto.AdminBackupFileListResponse;
import com.floralwhisper.dto.AdminBackupFileResponse;
import com.floralwhisper.dto.AiSettingsResponse;
import com.floralwhisper.dto.ConfigImportResponse;
import com.floralwhisper.dto.AdminPasswordChangeResponse;
import com.floralwhisper.dto.AdminSessionResponse;
import com.floralwhisper.dto.AdminOpsTaskListResponse;
import com.floralwhisper.dto.AdminOpsTaskResponse;
import com.floralwhisper.dto.LoginResponse;
import com.floralwhisper.dto.OperationLogArchiveResponse;
import com.floralwhisper.dto.OperationLogArchiveFileResponse;
import com.floralwhisper.dto.OperationLogDetailResponse;
import com.floralwhisper.dto.OperationLogResponse;
import com.floralwhisper.dto.PaginatedResult;
import com.floralwhisper.dto.SiteConfigResponse;
import com.floralwhisper.dto.SystemStatusResponse;
import com.floralwhisper.entity.Contact;
import com.floralwhisper.entity.TeamMember;
import com.floralwhisper.mapper.AboutPageMapper;
import com.floralwhisper.mapper.AboutTimelineEntryMapper;
import com.floralwhisper.mapper.AdminOpsTaskMapper;
import com.floralwhisper.mapper.AiSettingsMapper;
import com.floralwhisper.mapper.AdminSecurityStateMapper;
import com.floralwhisper.mapper.BrandStoryImageMapper;
import com.floralwhisper.mapper.BrandStoryMapper;
import com.floralwhisper.mapper.CategoryMapper;
import com.floralwhisper.mapper.ContactMapper;
import com.floralwhisper.mapper.FlowerImageMapper;
import com.floralwhisper.mapper.FlowerMapper;
import com.floralwhisper.mapper.FlowerMaterialMapper;
import com.floralwhisper.mapper.FlowerTagMapper;
import com.floralwhisper.mapper.ShopHourMapper;
import com.floralwhisper.mapper.ShopInfoMapper;
import com.floralwhisper.mapper.SiteConfigMapper;
import com.floralwhisper.mapper.TeamMemberMapper;
import com.floralwhisper.security.JwtAuthenticationFilter;
import com.floralwhisper.security.AdminPasswordChangeEnforcementFilter;
import com.floralwhisper.security.JwtService;
import com.floralwhisper.service.AuthService;
import com.floralwhisper.service.ContactService;
import com.floralwhisper.service.AdminOpsTaskService;
import com.floralwhisper.service.FlowerService;
import com.floralwhisper.service.OperationLogQueryService;
import com.floralwhisper.service.OperationLogRecoveryService;
import com.floralwhisper.service.SiteService;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.io.OutputStream;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;
import java.util.Map;
import javax.crypto.SecretKey;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.test.context.TestPropertySource;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.boot.test.mock.mockito.MockBean;

@WebMvcTest(
    controllers = AdminController.class,
    excludeAutoConfiguration = UserDetailsServiceAutoConfiguration.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, AdminPasswordChangeEnforcementFilter.class, JwtService.class, GlobalExceptionHandler.class, AdminControllerTest.TestConfig.class})
@TestPropertySource(properties = {
    "app.admin.username=admin",
    "app.admin.password=Floral@2026",
    "app.jwt.secret=12345678901234567890123456789012",
    "app.jwt.expires-in-seconds=43200",
    "app.jwt.issuer=flower-shop-backend-java"
})
class AdminControllerTest {
  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private JwtService jwtService;

  @Autowired
  private AppProperties properties;

  @MockBean
  private AuthService authService;
  @MockBean
  private AdminSecurityStateMapper adminSecurityStateMapper;
  @MockBean
  private AdminOpsTaskMapper adminOpsTaskMapper;
  @MockBean
  private ContactService contactService;
  @MockBean
  private FlowerService flowerService;
  @MockBean
  private SiteService siteService;
  @MockBean
  private AdminOpsTaskService adminOpsTaskService;
  @MockBean
  private OperationLogQueryService operationLogQueryService;
  @MockBean
  private OperationLogRecoveryService operationLogRecoveryService;
  @MockBean
  private HeavyOperationGuard heavyOperationGuard;
  @MockBean
  private RateLimitInterceptor rateLimitInterceptor;
  @MockBean
  private AuditLogService auditLogService;
  @MockBean
  private com.floralwhisper.mapper.OperationLogMapper operationLogMapper;
  @MockBean private AboutPageMapper aboutPageMapper;
  @MockBean private AboutTimelineEntryMapper aboutTimelineEntryMapper;
  @MockBean private AiSettingsMapper aiSettingsMapper;
  @MockBean private BrandStoryImageMapper brandStoryImageMapper;
  @MockBean private BrandStoryMapper brandStoryMapper;
  @MockBean private CategoryMapper categoryMapper;
  @MockBean private ContactMapper contactMapper;
  @MockBean private FlowerImageMapper flowerImageMapper;
  @MockBean private FlowerMapper flowerMapper;
  @MockBean private FlowerMaterialMapper flowerMaterialMapper;
  @MockBean private FlowerTagMapper flowerTagMapper;
  @MockBean private ShopHourMapper shopHourMapper;
  @MockBean private ShopInfoMapper shopInfoMapper;
  @MockBean private SiteConfigMapper siteConfigMapper;
  @MockBean private TeamMemberMapper teamMemberMapper;

  @BeforeEach
  void setUpInterceptors() throws Exception {
    when(rateLimitInterceptor.preHandle(any(), any(), any())).thenReturn(true);
  }

  @Test
  void loginReturnsTokenAndUsername() throws Exception {
    when(authService.login(any())).thenReturn(new LoginResponse("jwt-token", "admin", false));

    mockMvc.perform(post("/api/admin/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"username":"admin","password":"Floral@2026"}
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.token").value("jwt-token"))
        .andExpect(jsonPath("$.username").value("admin"))
        .andExpect(jsonPath("$.requirePasswordChange").value(false));
  }

  @Test
  void loginRejectsBlankUsernameWithMessageShape() throws Exception {
    mockMvc.perform(post("/api/admin/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"username":"","password":"Floral@2026"}
                """))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.message").value("请输入账号"));
  }

  @Test
  void meRejectsMissingTokenWithFrontendCompatibleMessage() throws Exception {
    mockMvc.perform(get("/api/admin/me"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.message").value("请先登录管理后台"));
  }

  @Test
  void meRejectsExpiredTokenWithFrontendCompatibleMessage() throws Exception {
    mockMvc.perform(get("/api/admin/me")
            .header("Authorization", "Bearer " + expiredToken()))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.message").value("登录状态已过期，请重新登录"));
  }

  @Test
  void meReturnsCurrentAdminWhenTokenIsValid() throws Exception {
    AdminSessionResponse response = new AdminSessionResponse();
    response.setUsername("admin");
    response.setRequirePasswordChange(false);
    response.setPasswordChangedAt("2026-05-15 12:30:00");
    when(authService.currentAdmin()).thenReturn(response);

    mockMvc.perform(get("/api/admin/me")
            .header("Authorization", "Bearer " + jwtService.createToken("admin")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.username").value("admin"))
        .andExpect(jsonPath("$.requirePasswordChange").value(false))
        .andExpect(jsonPath("$.passwordChangedAt").value("2026-05-15 12:30:00"));
  }

  @Test
  void systemStatusRejectsWhenPasswordChangeIsRequired() throws Exception {
    when(authService.isPasswordChangeRequired("admin")).thenReturn(true);

    mockMvc.perform(get("/api/admin/system/status")
            .header("Authorization", "Bearer " + jwtService.createToken("admin")))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.message").value("首次登录后请先修改管理员密码"));
  }

  @Test
  void meStillAccessibleWhenPasswordChangeIsRequired() throws Exception {
    AdminSessionResponse response = new AdminSessionResponse();
    response.setUsername("admin");
    response.setRequirePasswordChange(true);
    response.setPasswordChangedAt("");
    when(authService.currentAdmin()).thenReturn(response);
    when(authService.isPasswordChangeRequired("admin")).thenReturn(true);

    mockMvc.perform(get("/api/admin/me")
            .header("Authorization", "Bearer " + jwtService.createToken("admin")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.username").value("admin"))
        .andExpect(jsonPath("$.requirePasswordChange").value(true))
        .andExpect(jsonPath("$.passwordChangedAt").value(""));
  }

  @Test
  void changePasswordReturnsSuccessWhenTokenIsValid() throws Exception {
    AdminPasswordChangeResponse response = new AdminPasswordChangeResponse();
    response.setUsername("admin");
    response.setRequirePasswordChange(false);
    response.setChangedAt("2026-05-15 12:30:00");
    when(authService.changePassword(eq("admin"), any())).thenReturn(response);

    mockMvc.perform(post("/api/admin/change-password")
            .header("Authorization", "Bearer " + jwtService.createToken("admin"))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"currentPassword":"Floral@2026","newPassword":"Floral@2026#New"}
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.username").value("admin"))
        .andExpect(jsonPath("$.requirePasswordChange").value(false))
        .andExpect(jsonPath("$.changedAt").value("2026-05-15 12:30:00"));
  }

  @Test
  void systemStatusRequiresAdminToken() throws Exception {
    mockMvc.perform(get("/api/admin/system/status"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.message").value("请先登录管理后台"));
  }

  @Test
  void systemStatusReturnsStatusPayloadWhenTokenIsValid() throws Exception {
    SystemStatusResponse response = new SystemStatusResponse();
    response.setService("flower-shop-backend-java");
    response.setVersion("1.0.0");
    response.setDeploymentEnvironment("production");
    response.setGitRevision("abc123def456");
    response.setBuildTime("2026-05-15 08:00:00");
    response.setDeployedAt("2026-05-15 09:30:00");
    response.setDatabaseConnected(true);
    response.setDatabaseVersion("8.0.36");
    response.setDatabaseSize("128.50 MB");
    response.setDiskTotal("120.00 GB");
    response.setDiskUsable("78.40 GB");
    response.setDiskUsageRate("34.67%");
    response.setUploadDirectoryReady(true);
    response.setUploadDirectoryPath("/app/uploads");
    response.setUploadFileCount(24);
    response.setUploadDirectorySize("256.00 MB");
    response.setUptimeLabel("15分钟");
    response.setAiEnabled(true);
    response.setAiKeyConfigured(true);
    response.setAiProvider("volcengine");
    response.setAiImageModel("doubao-seedream-5-0-260128");
    response.setAiTextModel("doubao-1-5-pro-32k-250115");
    response.setLatestBackupPresent(true);
    response.setLatestBackupName("20260515-002808");
    response.setLatestBackupPath("/app/backups/20260515-002808");
    response.setLatestBackupModifiedAt("2026-05-15 08:28:08");
    response.setLatestBackupDownloadUrl("/api/admin/system/backups/latest/download");
    response.setAdminPasswordChangedAt("2026-05-15 12:30:00");
    response.setOperationLogCount(128L);
    response.setOperationLogRetentionDays(180);
    response.setOperationLogArchiveBefore("2025-11-16 08:15:00");
    response.setRequirePasswordChange(false);
    response.setDeliveryInitialized(true);

    when(siteService.getSystemStatus()).thenReturn(response);

    mockMvc.perform(get("/api/admin/system/status")
            .header("Authorization", "Bearer " + jwtService.createToken("admin")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.service").value("flower-shop-backend-java"))
        .andExpect(jsonPath("$.version").value("1.0.0"))
        .andExpect(jsonPath("$.deploymentEnvironment").value("production"))
        .andExpect(jsonPath("$.gitRevision").value("abc123def456"))
        .andExpect(jsonPath("$.buildTime").value("2026-05-15 08:00:00"))
        .andExpect(jsonPath("$.deployedAt").value("2026-05-15 09:30:00"))
        .andExpect(jsonPath("$.licenseCustomerName").doesNotExist())
        .andExpect(jsonPath("$.licenseCode").doesNotExist())
        .andExpect(jsonPath("$.licenseType").doesNotExist())
        .andExpect(jsonPath("$.licenseExpiresAt").doesNotExist())
        .andExpect(jsonPath("$.licenseWarningDays").doesNotExist())
        .andExpect(jsonPath("$.licenseNotes").doesNotExist())
        .andExpect(jsonPath("$.licenseStatus").doesNotExist())
        .andExpect(jsonPath("$.licenseStatusLabel").doesNotExist())
        .andExpect(jsonPath("$.databaseConnected").value(true))
        .andExpect(jsonPath("$.databaseVersion").value("8.0.36"))
        .andExpect(jsonPath("$.databaseSize").value("128.50 MB"))
        .andExpect(jsonPath("$.diskTotal").value("120.00 GB"))
        .andExpect(jsonPath("$.diskUsable").value("78.40 GB"))
        .andExpect(jsonPath("$.diskUsageRate").value("34.67%"))
        .andExpect(jsonPath("$.uploadDirectorySize").value("256.00 MB"))
        .andExpect(jsonPath("$.uptimeLabel").value("15分钟"))
        .andExpect(jsonPath("$.aiKeyConfigured").value(true))
        .andExpect(jsonPath("$.operationLogCount").value(128))
        .andExpect(jsonPath("$.operationLogRetentionDays").value(180))
        .andExpect(jsonPath("$.operationLogArchiveBefore").value("2025-11-16 08:15:00"))
        .andExpect(jsonPath("$.latestBackupName").value("20260515-002808"))
        .andExpect(jsonPath("$.latestBackupModifiedAt").value("2026-05-15 08:28:08"))
        .andExpect(jsonPath("$.latestBackupDownloadUrl").value("/api/admin/system/backups/latest/download"))
        .andExpect(jsonPath("$.adminPasswordChangedAt").value("2026-05-15 12:30:00"))
        .andExpect(jsonPath("$.requirePasswordChange").value(false))
        .andExpect(jsonPath("$.deliveryInitialized").value(true));
  }

  @Test
  void contactsSupportsDeletedFilter() throws Exception {
    PaginatedResult<Contact> response = new PaginatedResult<>(List.of(), 0, 1, 10);
    when(contactService.listContacts(eq(1), eq(10), eq("rose"), eq("all"), eq("deleted"))).thenReturn(response);

    mockMvc.perform(get("/api/admin/contacts")
            .header("Authorization", "Bearer " + jwtService.createToken("admin"))
            .param("page", "1")
            .param("limit", "10")
            .param("keyword", "rose")
            .param("status", "all")
            .param("deleted", "deleted"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.total").value(0));
  }

  @Test
  void restoreDeletedContactReturnsUpdatedContact() throws Exception {
    Contact contact = new Contact();
    contact.setId("contact_001");
    contact.setName("张三");
    contact.setPhone("13800000000");
    contact.setMessage("测试留言");
    contact.setDeleted(0);
    when(contactService.restore("contact_001")).thenReturn(contact);

    mockMvc.perform(post("/api/admin/contacts/contact_001/restore")
            .header("Authorization", "Bearer " + jwtService.createToken("admin")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value("contact_001"))
        .andExpect(jsonPath("$.name").value("张三"));
  }

  @Test
  void aboutTimelineSupportsDeletedFilter() throws Exception {
    AboutTimelineEntryResponse item = new AboutTimelineEntryResponse();
    item.setId("timeline_001");
    item.setYearLabel("2024");
    item.setContent("deleted item");
    item.setSort(1);
    when(siteService.getAdminAboutTimeline("deleted")).thenReturn(List.of(item));

    mockMvc.perform(get("/api/admin/about-timeline")
            .header("Authorization", "Bearer " + jwtService.createToken("admin"))
            .param("deleted", "deleted"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].id").value("timeline_001"));
  }

  @Test
  void restoreDeletedTimelineReturnsUpdatedEntry() throws Exception {
    AboutTimelineEntryResponse item = new AboutTimelineEntryResponse();
    item.setId("timeline_001");
    item.setYearLabel("2024");
    item.setContent("restored");
    item.setSort(1);
    when(siteService.restoreAboutTimelineEntry("timeline_001")).thenReturn(item);

    mockMvc.perform(post("/api/admin/about-timeline/timeline_001/restore")
            .header("Authorization", "Bearer " + jwtService.createToken("admin")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value("timeline_001"));
  }

  @Test
  void teamSupportsDeletedFilter() throws Exception {
    TeamMember member = new TeamMember();
    member.setId("team_001");
    member.setName("李四");
    member.setTitle("主理人");
    when(siteService.getAdminTeamMembers("deleted")).thenReturn(List.of(member));

    mockMvc.perform(get("/api/admin/team")
            .header("Authorization", "Bearer " + jwtService.createToken("admin"))
            .param("deleted", "deleted"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].id").value("team_001"));
  }

  @Test
  void restoreDeletedTeamMemberReturnsUpdatedMember() throws Exception {
    TeamMember member = new TeamMember();
    member.setId("team_001");
    member.setName("李四");
    member.setTitle("主理人");
    when(siteService.restoreTeamMember("team_001")).thenReturn(member);

    mockMvc.perform(post("/api/admin/team/team_001/restore")
            .header("Authorization", "Bearer " + jwtService.createToken("admin")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value("team_001"));
  }

  @Test
  void opsTasksReturnsRecentTaskListWhenTokenIsValid() throws Exception {
    AdminOpsTaskResponse item = new AdminOpsTaskResponse();
    item.setId(1L);
    item.setTaskType("backup");
    item.setTaskLabel("手动备份");
    item.setStatus("success");
    item.setTriggerSource("admin_ui");
    item.setOperatorName("admin");
    item.setRequestPayload("{\"source\":\"admin_ui\"}");
    item.setResultSummary("{\"backupName\":\"20260516-011500\"}");
    item.setResultData(Map.of("backupName", "20260516-011500"));
    item.setLogExcerpt("");
    item.setErrorMessage("");
    item.setStartedAt("2026-05-16 01:15:00");
    item.setFinishedAt("2026-05-16 01:15:08");
    item.setCreatedAt("2026-05-16 01:15:00");
    item.setUpdatedAt("2026-05-16 01:15:08");

    AdminOpsTaskListResponse response = new AdminOpsTaskListResponse();
    response.setList(List.of(item));
    response.setTotal(1L);

    when(adminOpsTaskService.listRecentTasks()).thenReturn(response);

    mockMvc.perform(get("/api/admin/system/ops-tasks")
            .header("Authorization", "Bearer " + jwtService.createToken("admin")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.total").value(1))
        .andExpect(jsonPath("$.list[0].taskType").value("backup"))
        .andExpect(jsonPath("$.list[0].status").value("success"))
        .andExpect(jsonPath("$.list[0].resultData.backupName").value("20260516-011500"));
  }

  @Test
  void backupsReturnsBackupListWhenTokenIsValid() throws Exception {
    AdminBackupFileResponse item = new AdminBackupFileResponse();
    item.setBackupName("20260516-011500");
    item.setPath("/app/backups/20260516-011500");
    item.setModifiedAt("2026-05-16 01:15:08");
    item.setSize("2.00 MB");
    item.setDownloadUrl("/api/admin/system/backups/20260516-011500/download");
    item.setLatest(true);

    AdminBackupFileListResponse response = new AdminBackupFileListResponse();
    response.setList(List.of(item));
    response.setTotal(1L);

    when(siteService.listBackupFiles()).thenReturn(response);

    mockMvc.perform(get("/api/admin/system/backups")
            .header("Authorization", "Bearer " + jwtService.createToken("admin")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.total").value(1))
        .andExpect(jsonPath("$.list[0].backupName").value("20260516-011500"))
        .andExpect(jsonPath("$.list[0].latest").value(true));
  }

  @Test
  void createBackupTaskReturnsTaskWhenTokenIsValid() throws Exception {
    AdminOpsTaskResponse response = new AdminOpsTaskResponse();
    response.setId(11L);
    response.setTaskType("backup");
    response.setTaskLabel("手动备份");
    response.setStatus("success");
    response.setTriggerSource("admin_ui");
    response.setOperatorName("admin");
    response.setResultSummary("{\"backupName\":\"20260516-011500\"}");
    response.setStartedAt("2026-05-16 01:15:00");
    response.setFinishedAt("2026-05-16 01:15:08");

    when(adminOpsTaskService.createBackupTask("admin")).thenReturn(response);

    mockMvc.perform(post("/api/admin/system/ops-tasks/backup")
            .header("Authorization", "Bearer " + jwtService.createToken("admin")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(11))
        .andExpect(jsonPath("$.taskType").value("backup"))
        .andExpect(jsonPath("$.status").value("success"));
  }

  @Test
  void createInspectionTaskReturnsTaskWhenTokenIsValid() throws Exception {
    AdminOpsTaskResponse response = new AdminOpsTaskResponse();
    response.setId(12L);
    response.setTaskType("inspection");
    response.setTaskLabel("系统巡检");
    response.setStatus("success");
    response.setTriggerSource("admin_ui");
    response.setOperatorName("admin");
    response.setResultSummary("{\"databaseConnected\":true}");
    response.setStartedAt("2026-05-16 01:16:00");
    response.setFinishedAt("2026-05-16 01:16:02");

    when(adminOpsTaskService.createInspectionTask("admin")).thenReturn(response);

    mockMvc.perform(post("/api/admin/system/ops-tasks/inspection")
            .header("Authorization", "Bearer " + jwtService.createToken("admin")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(12))
        .andExpect(jsonPath("$.taskType").value("inspection"))
        .andExpect(jsonPath("$.status").value("success"));
  }

  @Test
  void adminSiteConfigReturnsLicenseFieldsWhenTokenIsValid() throws Exception {
    SiteConfigResponse response = new SiteConfigResponse();
    response.setBrandName("花语时光");
    response.setHeroTitle("花语时光");
    response.setBrandLogo("https://example.com/logo.png");
    response.setHeroSlides(List.of("https://example.com/home-1.jpg", "https://example.com/home-2.jpg"));
    response.setAdminLoginSlides(List.of("https://example.com/admin-1.jpg"));
    response.setContactImages(List.of("https://example.com/contact-1.jpg"));
    response.setAdminBrandTitle("花语时光后台");
    response.setHomeStorySectionTitle("品牌故事");
    response.setHomeFeaturedSectionTitle("精选作品");
    response.setHomeServiceSectionTitle("服务场景");
    response.setGalleryPageTitle("作品画廊");
    response.setGallerySearchPlaceholder("搜索花束、花材或标签");
    response.setGalleryEmptyText("没有找到匹配的花束作品");
    response.setGalleryLoadErrorText("作品列表加载失败，请稍后刷新重试");
    response.setContactPageTitle("联系我们");
    response.setContactSubmitSuccessText("留言已提交，我们会尽快联系你");
    response.setConsultButtonText("咨询花艺");
    when(siteService.getAdminSiteConfig()).thenReturn(response);

    mockMvc.perform(get("/api/admin/site-config")
            .header("Authorization", "Bearer " + jwtService.createToken("admin")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.brandName").value("花语时光"))
        .andExpect(jsonPath("$.brandLogo").value("https://example.com/logo.png"))
        .andExpect(jsonPath("$.heroSlides[0]").value("https://example.com/home-1.jpg"))
        .andExpect(jsonPath("$.adminLoginSlides[0]").value("https://example.com/admin-1.jpg"))
        .andExpect(jsonPath("$.contactImages[0]").value("https://example.com/contact-1.jpg"))
        .andExpect(jsonPath("$.adminBrandTitle").value("花语时光后台"))
        .andExpect(jsonPath("$.homeStorySectionTitle").value("品牌故事"))
        .andExpect(jsonPath("$.homeFeaturedSectionTitle").value("精选作品"))
        .andExpect(jsonPath("$.homeServiceSectionTitle").value("服务场景"))
        .andExpect(jsonPath("$.galleryPageTitle").value("作品画廊"))
        .andExpect(jsonPath("$.gallerySearchPlaceholder").value("搜索花束、花材或标签"))
        .andExpect(jsonPath("$.galleryEmptyText").value("没有找到匹配的花束作品"))
        .andExpect(jsonPath("$.galleryLoadErrorText").value("作品列表加载失败，请稍后刷新重试"))
        .andExpect(jsonPath("$.contactPageTitle").value("联系我们"))
        .andExpect(jsonPath("$.contactSubmitSuccessText").value("留言已提交，我们会尽快联系你"))
        .andExpect(jsonPath("$.consultButtonText").value("咨询花艺"))
        .andExpect(jsonPath("$.licenseCustomerName").doesNotExist())
        .andExpect(jsonPath("$.licenseCode").doesNotExist())
        .andExpect(jsonPath("$.licenseType").doesNotExist())
        .andExpect(jsonPath("$.licenseExpiresAt").doesNotExist())
        .andExpect(jsonPath("$.licenseWarningDays").doesNotExist())
        .andExpect(jsonPath("$.licenseNotes").doesNotExist());
  }

  @Test
  void archiveOperationLogsReturnsSummaryWhenTokenIsValid() throws Exception {
    OperationLogArchiveResponse response = new OperationLogArchiveResponse();
    response.setArchivedCount(24);
    response.setArchiveFilename("operation-logs-archive-20260515-090000.csv");
    response.setArchivePath("/app/backups/operation-logs/operation-logs-archive-20260515-090000.csv");
    response.setArchiveBefore("2025-11-16 00:00:00");

    when(siteService.archiveOperationLogs(eq(LocalDateTime.of(2025, 11, 16, 0, 0)))).thenReturn(response);

    mockMvc.perform(post("/api/admin/system/operation-logs/archive")
            .param("before", "2025-11-16T00:00:00")
            .header("Authorization", "Bearer " + jwtService.createToken("admin")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.archivedCount").value(24))
        .andExpect(jsonPath("$.archiveFilename").value("operation-logs-archive-20260515-090000.csv"))
        .andExpect(jsonPath("$.archiveBefore").value("2025-11-16 00:00:00"));
  }

  @Test
  void latestBackupDownloadRequiresAdminToken() throws Exception {
    mockMvc.perform(get("/api/admin/system/backups/latest/download"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.message").value("请先登录管理后台"));
  }

  @Test
  void latestBackupDownloadStreamsArchiveWhenTokenIsValid() throws Exception {
    doAnswer(invocation -> {
      OutputStream outputStream = invocation.getArgument(0);
      outputStream.write("archive-demo".getBytes(StandardCharsets.UTF_8));
      return "latest-backup.tar.gz";
    }).when(siteService).writeLatestBackupArchive(any(OutputStream.class));

    mockMvc.perform(get("/api/admin/system/backups/latest/download")
            .header("Authorization", "Bearer " + jwtService.createToken("admin")))
        .andExpect(status().isOk())
        .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header().string("Content-Type", "application/gzip"))
        .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header().string("Content-Disposition", "attachment; filename=\"latest-backup.tar.gz\""))
        .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.content().bytes("archive-demo".getBytes(StandardCharsets.UTF_8)));
  }

  @Test
  void configExportStreamsJsonWhenTokenIsValid() throws Exception {
    doAnswer(invocation -> {
      OutputStream outputStream = invocation.getArgument(0);
      outputStream.write("{\"version\":\"1.0.0\"}".getBytes(StandardCharsets.UTF_8));
      return "site-config-export-20260515-101010.json";
    }).when(siteService).writeConfigExport(any(OutputStream.class));

    mockMvc.perform(get("/api/admin/system/config-export")
            .header("Authorization", "Bearer " + jwtService.createToken("admin")))
        .andExpect(status().isOk())
        .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header().string("Content-Type", "application/json"))
        .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header().string("Content-Disposition", "attachment; filename=\"site-config-export-20260515-101010.json\""))
        .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.content().json("""
            {"version":"1.0.0"}
            """));
  }

  @Test
  void configImportReturnsSummaryWhenTokenIsValid() throws Exception {
    ConfigImportResponse response = new ConfigImportResponse();
    response.setVersion("1.0.0");
    response.setImportedAt("2026-05-15 10:20:30");
    response.setTimelineCount(3);
    response.setTeamCount(2);
    response.setIncludedAiSettings(true);
    when(siteService.importConfig(any())).thenReturn(response);

    MockMultipartFile file = new MockMultipartFile(
        "file",
        "site-config-export.json",
        "application/json",
        """
        {"version":"1.0.0"}
        """.getBytes(StandardCharsets.UTF_8));

    mockMvc.perform(multipart("/api/admin/system/config-import")
            .file(file)
            .with(request -> {
              request.setMethod("POST");
              return request;
            })
            .header("Authorization", "Bearer " + jwtService.createToken("admin")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.version").value("1.0.0"))
        .andExpect(jsonPath("$.importedAt").value("2026-05-15 10:20:30"))
        .andExpect(jsonPath("$.timelineCount").value(3))
        .andExpect(jsonPath("$.teamCount").value(2))
        .andExpect(jsonPath("$.includedAiSettings").value(true));
  }

  @Test
  void configImportReturns503WhenGuardIsBusy() throws Exception {
    when(heavyOperationGuard.acquireConfigImportPermit())
        .thenThrow(new ServiceBusyException("当前导入任务较多，请稍后再试"));

    MockMultipartFile file = new MockMultipartFile(
        "file",
        "site-config-export.json",
        "application/json",
        """
        {"version":"1.0.0"}
        """.getBytes(StandardCharsets.UTF_8));

    mockMvc.perform(multipart("/api/admin/system/config-import")
            .file(file)
            .with(request -> {
              request.setMethod("POST");
              return request;
            })
            .header("Authorization", "Bearer " + jwtService.createToken("admin")))
        .andExpect(status().isServiceUnavailable())
        .andExpect(jsonPath("$.message").value("当前导入任务较多，请稍后再试"));
  }

  @Test
  void operationLogArchiveFilesReturnsListWhenTokenIsValid() throws Exception {
    OperationLogArchiveFileResponse item = new OperationLogArchiveFileResponse();
    item.setFilename("operation-logs-archive-20260515-090000.csv");
    item.setPath("/app/backups/operation-logs/operation-logs-archive-20260515-090000.csv");
    item.setModifiedAt("2026-05-15 09:00:00");
    item.setSize("8.00 KB");
    item.setDownloadUrl("/api/admin/system/operation-logs/archive-files/operation-logs-archive-20260515-090000.csv/download");

    when(siteService.listOperationLogArchiveFiles()).thenReturn(List.of(item));

    mockMvc.perform(get("/api/admin/system/operation-logs/archive-files")
            .header("Authorization", "Bearer " + jwtService.createToken("admin")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].filename").value("operation-logs-archive-20260515-090000.csv"))
        .andExpect(jsonPath("$[0].downloadUrl").value("/api/admin/system/operation-logs/archive-files/operation-logs-archive-20260515-090000.csv/download"));
  }

  @Test
  void operationLogArchiveFileDownloadStreamsFileWhenTokenIsValid() throws Exception {
    doAnswer(invocation -> {
      OutputStream outputStream = invocation.getArgument(1);
      outputStream.write("csv-demo".getBytes(StandardCharsets.UTF_8));
      return "operation-logs-archive-20260515-090000.csv";
    }).when(siteService).writeOperationLogArchiveFile(eq("operation-logs-archive-20260515-090000.csv"), any(OutputStream.class));

    mockMvc.perform(get("/api/admin/system/operation-logs/archive-files/operation-logs-archive-20260515-090000.csv/download")
            .header("Authorization", "Bearer " + jwtService.createToken("admin")))
        .andExpect(status().isOk())
        .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header().string("Content-Disposition", "attachment; filename=\"operation-logs-archive-20260515-090000.csv\""))
        .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.content().bytes("csv-demo".getBytes(StandardCharsets.UTF_8)));
  }

  @Test
  void aiSettingsRejectsMissingTokenWithFrontendCompatibleMessage() throws Exception {
    mockMvc.perform(get("/api/admin/system/ai-settings"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.message").value("请先登录管理后台"));
  }

  @Test
  void aiSettingsReturnsMaskedPayloadWhenTokenIsValid() throws Exception {
    AiSettingsResponse response = new AiSettingsResponse();
    response.setEnabled(true);
    response.setProvider("volcengine");
    response.setApiKeyMasked("3798ed26-****-****-****-84463770f183");
    response.setApiKeyConfigured(true);
    response.setModel("doubao-seedream-5-0-260128");
    response.setBaseUrl("https://ark.cn-beijing.volces.com/api/v3");
    response.setGeneratePath("/images/generations");
    response.setSize("1920x1920");
    response.setTextModel("doubao-1-5-pro-32k-250115");
    response.setTextGeneratePath("/chat/completions");
    response.setTextTemperature(0.4D);
    response.setTextMaxTokens(1200);

    when(siteService.getAdminAiSettings()).thenReturn(response);

    mockMvc.perform(get("/api/admin/system/ai-settings")
            .header("Authorization", "Bearer " + jwtService.createToken("admin")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.enabled").value(true))
        .andExpect(jsonPath("$.apiKeyConfigured").value(true))
        .andExpect(jsonPath("$.apiKeyMasked").value("3798ed26-****-****-****-84463770f183"))
        .andExpect(jsonPath("$.apiKey").doesNotExist())
        .andExpect(jsonPath("$.textModel").value("doubao-1-5-pro-32k-250115"));
  }

  @Test
  void updateAiSettingsReturnsMaskedPayloadWhenTokenIsValid() throws Exception {
    AiSettingsResponse response = new AiSettingsResponse();
    response.setEnabled(true);
    response.setProvider("volcengine");
    response.setApiKeyMasked("3798ed26-****-****-****-84463770f183");
    response.setApiKeyConfigured(true);
    response.setModel("doubao-seedream-5-0-260128");
    response.setBaseUrl("https://ark.cn-beijing.volces.com/api/v3");
    response.setGeneratePath("/images/generations");
    response.setSize("1920x1920");

    when(siteService.updateAdminAiSettings(any())).thenReturn(response);

    mockMvc.perform(put("/api/admin/system/ai-settings")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"enabled":true,"provider":"volcengine","model":"doubao-seedream-5-0-260128"}
                """)
            .header("Authorization", "Bearer " + jwtService.createToken("admin")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.enabled").value(true))
        .andExpect(jsonPath("$.apiKeyConfigured").value(true))
        .andExpect(jsonPath("$.apiKeyMasked").value("3798ed26-****-****-****-84463770f183"));
  }

  @Test
  void contactsRejectsMissingTokenWithFrontendCompatibleMessage() throws Exception {
    mockMvc.perform(get("/api/admin/contacts"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.message").value("请先登录管理后台"));
  }

  @Test
  void contactsReturnsPaginatedListWhenTokenIsValid() throws Exception {
    Contact contact = new Contact();
    contact.setId("contact_001");
    contact.setName("林小姐");
    contact.setPhone("13800138000");
    contact.setMessage("想预约母亲节花束");
    contact.setCreatedAt(LocalDateTime.of(2026, 5, 14, 11, 30));
    contact.setReadAt(LocalDateTime.of(2026, 5, 14, 12, 0));

    when(contactService.listContacts(2, 10, "母亲节", "read")).thenReturn(new PaginatedResult<>(List.of(contact), 1, 2, 10));

    mockMvc.perform(get("/api/admin/contacts")
            .param("page", "2")
            .param("limit", "10")
            .param("keyword", "母亲节")
            .param("status", "read")
            .header("Authorization", "Bearer " + jwtService.createToken("admin")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.list[0].id").value("contact_001"))
        .andExpect(jsonPath("$.list[0].name").value("林小姐"))
        .andExpect(jsonPath("$.list[0].phone").value("13800138000"))
        .andExpect(jsonPath("$.list[0].message").value("想预约母亲节花束"))
        .andExpect(jsonPath("$.list[0].readAt").value("2026-05-14T12:00:00"))
        .andExpect(jsonPath("$.total").value(1))
        .andExpect(jsonPath("$.page").value(2))
        .andExpect(jsonPath("$.limit").value(10));
  }

  @Test
  void markContactReadRejectsMissingTokenWithFrontendCompatibleMessage() throws Exception {
    mockMvc.perform(patch("/api/admin/contacts/contact_001/read"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.message").value("请先登录管理后台"));
  }

  @Test
  void markContactReadReturnsUpdatedContactWhenTokenIsValid() throws Exception {
    Contact updated = new Contact();
    updated.setId("contact_001");
    updated.setName("林小姐");
    updated.setPhone("13800138000");
    updated.setMessage("想预约母亲节花束");
    updated.setCreatedAt(LocalDateTime.of(2026, 5, 14, 11, 30));
    updated.setReadAt(LocalDateTime.of(2026, 5, 14, 12, 10));

    when(contactService.markAsRead(eq("contact_001"))).thenReturn(updated);

    mockMvc.perform(patch("/api/admin/contacts/contact_001/read")
            .header("Authorization", "Bearer " + jwtService.createToken("admin")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value("contact_001"))
        .andExpect(jsonPath("$.readAt").value("2026-05-14T12:10:00"));
  }

  @Test
  void deleteContactRejectsMissingTokenWithFrontendCompatibleMessage() throws Exception {
    mockMvc.perform(delete("/api/admin/contacts/contact_001"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.message").value("请先登录管理后台"));
  }

  @Test
  void deleteContactReturnsNoContentWhenTokenIsValid() throws Exception {
    mockMvc.perform(delete("/api/admin/contacts/contact_001")
            .header("Authorization", "Bearer " + jwtService.createToken("admin")))
        .andExpect(status().isNoContent());

    verify(contactService).delete("contact_001");
  }

  @Test
  void updateAboutPageReturnsUpdatedConfigWhenTokenIsValid() throws Exception {
    AboutPageResponse response = new AboutPageResponse();
    response.setHeroTitle("让花束像一封慢慢抵达的信");
    response.setStoryTitle("品牌故事");

    when(siteService.updateAboutPage(any())).thenReturn(response);

    mockMvc.perform(put("/api/admin/about-page")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"heroTitle":"让花束像一封慢慢抵达的信","storyTitle":"品牌故事"}
                """)
            .header("Authorization", "Bearer " + jwtService.createToken("admin")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.heroTitle").value("让花束像一封慢慢抵达的信"))
        .andExpect(jsonPath("$.storyTitle").value("品牌故事"));
  }

  @Test
  void createAboutTimelineReturnsCreatedWhenTokenIsValid() throws Exception {
    AboutTimelineEntryResponse response = new AboutTimelineEntryResponse();
    response.setId("timeline_2028");
    response.setYearLabel("2028");
    response.setContent("门店升级新空间。");
    response.setSort(3);

    when(siteService.createAboutTimelineEntry(any())).thenReturn(response);

    mockMvc.perform(post("/api/admin/about-timeline")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"yearLabel":"2028","content":"门店升级新空间。","sort":3}
                """)
            .header("Authorization", "Bearer " + jwtService.createToken("admin")))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.id").value("timeline_2028"))
        .andExpect(jsonPath("$.yearLabel").value("2028"));
  }

  @Test
  void updateAboutTimelineReturnsUpdatedWhenTokenIsValid() throws Exception {
    AboutTimelineEntryResponse response = new AboutTimelineEntryResponse();
    response.setId("timeline_2026");
    response.setYearLabel("2026");
    response.setContent("升级双端展示系统。");
    response.setSort(2);

    when(siteService.updateAboutTimelineEntry(eq("timeline_2026"), any())).thenReturn(response);

    mockMvc.perform(put("/api/admin/about-timeline/timeline_2026")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"yearLabel":"2026","content":"升级双端展示系统。","sort":2}
                """)
            .header("Authorization", "Bearer " + jwtService.createToken("admin")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value("timeline_2026"))
        .andExpect(jsonPath("$.content").value("升级双端展示系统。"));
  }

  @Test
  void deleteAboutTimelineReturnsNoContentWhenTokenIsValid() throws Exception {
    mockMvc.perform(delete("/api/admin/about-timeline/timeline_2026")
            .header("Authorization", "Bearer " + jwtService.createToken("admin")))
        .andExpect(status().isNoContent());
  }

  @Test
  void createTeamMemberReturnsCreatedWhenTokenIsValid() throws Exception {
    TeamMember member = new TeamMember();
    member.setId("team_001");
    member.setName("林汐");
    member.setTitle("主理花艺师");
    member.setAvatar("/uploads/team-001.jpg");
    member.setBio("负责品牌花艺方向。");
    member.setSort(2);

    when(siteService.createTeamMember(any())).thenReturn(member);

    mockMvc.perform(post("/api/admin/team")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"name":"林汐","title":"主理花艺师","avatar":"/uploads/team-001.jpg","bio":"负责品牌花艺方向。","sort":2}
                """)
            .header("Authorization", "Bearer " + jwtService.createToken("admin")))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.id").value("team_001"))
        .andExpect(jsonPath("$.name").value("林汐"));
  }

  @Test
  void updateTeamMemberReturnsUpdatedWhenTokenIsValid() throws Exception {
    TeamMember member = new TeamMember();
    member.setId("team_001");
    member.setName("林汐");
    member.setTitle("主理花艺师");
    member.setAvatar("/uploads/team-001.jpg");
    member.setBio("负责品牌花艺方向。");
    member.setSort(3);

    when(siteService.updateTeamMember(eq("team_001"), any())).thenReturn(member);

    mockMvc.perform(put("/api/admin/team/team_001")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"name":"林汐","title":"主理花艺师","avatar":"/uploads/team-001.jpg","bio":"负责品牌花艺方向。","sort":3}
                """)
            .header("Authorization", "Bearer " + jwtService.createToken("admin")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.sort").value(3));
  }

  @Test
  void deleteTeamMemberReturnsNoContentWhenTokenIsValid() throws Exception {
    mockMvc.perform(delete("/api/admin/team/team_001")
            .header("Authorization", "Bearer " + jwtService.createToken("admin")))
        .andExpect(status().isNoContent());
  }

  @Test
  void operationLogsRequireAdminToken() throws Exception {
    mockMvc.perform(get("/api/admin/operation-logs"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.message").value("请先登录管理后台"));
  }

  @Test
  void operationLogsReturnPaginatedPayloadWhenTokenIsValid() throws Exception {
    OperationLogResponse item = new OperationLogResponse();
    item.setId(1L);
    item.setModule("FLOWER");
    item.setAction("UPDATE");
    item.setTargetType("FLOWER");
    item.setTargetId("wedding_001");
    item.setOperatorName("admin");
    item.setRequestSummary("{\"name\":\"晨雾誓约\"}");
    item.setSuccess(true);
    item.setRestorable(true);
    item.setCreatedAt(LocalDateTime.of(2026, 5, 15, 9, 30));
    when(operationLogQueryService.list(1, 10, "FLOWER", null, null, true, "wedding", null, null, null))
        .thenReturn(new PaginatedResult<>(List.of(item), 1, 1, 10));

    mockMvc.perform(get("/api/admin/operation-logs")
            .param("page", "1")
            .param("limit", "10")
            .param("module", "FLOWER")
            .param("success", "true")
            .param("keyword", "wedding")
            .header("Authorization", "Bearer " + jwtService.createToken("admin")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.list[0].module").value("FLOWER"))
        .andExpect(jsonPath("$.list[0].targetId").value("wedding_001"))
        .andExpect(jsonPath("$.list[0].restorable").value(true))
        .andExpect(jsonPath("$.total").value(1));
  }

  @Test
  void operationLogDetailReturnsPayloadWhenTokenIsValid() throws Exception {
    OperationLogDetailResponse detail = new OperationLogDetailResponse();
    detail.setId(12L);
    detail.setModule("SITE");
    detail.setAction("UPDATE");
    detail.setTargetType("SITE_CONFIG");
    detail.setTargetId("1");
    detail.setOperatorName("admin");
    detail.setRequestSummary("{\"brandName\":\"花语时光\"}");
    detail.setBeforeSnapshot("{\"brandName\":\"旧名称\"}");
    detail.setAfterSnapshot("{\"brandName\":\"花语时光\"}");
    detail.setSuccess(true);
    detail.setRestorable(true);
    detail.setCreatedAt(LocalDateTime.of(2026, 5, 15, 9, 40));
    when(operationLogQueryService.getDetail(12L)).thenReturn(detail);

    mockMvc.perform(get("/api/admin/operation-logs/12")
            .header("Authorization", "Bearer " + jwtService.createToken("admin")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value(12))
        .andExpect(jsonPath("$.beforeSnapshot").value("{\"brandName\":\"旧名称\"}"))
        .andExpect(jsonPath("$.restorable").value(true));
  }

  @Test
  void restoreOperationLogReturnsRecoveryPayloadWhenTokenIsValid() throws Exception {
    OperationLogDetailResponse detail = new OperationLogDetailResponse();
    detail.setId(18L);
    detail.setModule("FLOWER");
    detail.setAction("RESTORE");
    detail.setTargetType("FLOWER");
    detail.setTargetId("wedding_001");
    detail.setOperatorName("admin");
    detail.setSuccess(true);
    detail.setRestorable(false);
    detail.setRestoredFromLogId(12L);
    when(operationLogRecoveryService.restore(eq(12L), eq("后台人工确认恢复"))).thenReturn(detail);

    mockMvc.perform(post("/api/admin/operation-logs/12/restore")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"reason":"后台人工确认恢复"}
                """)
            .header("Authorization", "Bearer " + jwtService.createToken("admin")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.action").value("RESTORE"))
        .andExpect(jsonPath("$.restoredFromLogId").value(12));
  }

  @Test
  void restoreOperationLogRejectsBlankReason() throws Exception {
    mockMvc.perform(post("/api/admin/operation-logs/12/restore")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"reason":"   "}
                """)
            .header("Authorization", "Bearer " + jwtService.createToken("admin")))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.message").value("请填写恢复原因"));
  }

  private String expiredToken() {
    return Jwts.builder()
        .issuer(properties.getJwt().getIssuer())
        .subject(properties.getAdmin().getUsername())
        .issuedAt(Date.from(Instant.now().minusSeconds(3600)))
        .expiration(Date.from(Instant.now().minusSeconds(60)))
        .signWith(secretKey())
        .compact();
  }

  private SecretKey secretKey() {
    byte[] bytes = properties.getJwt().getSecret().getBytes(StandardCharsets.UTF_8);
    return Keys.hmacShaKeyFor(bytes.length >= 32 ? bytes : (properties.getJwt().getSecret() + "00000000000000000000000000000000").getBytes(StandardCharsets.UTF_8));
  }

  @TestConfiguration
  @EnableConfigurationProperties(AppProperties.class)
  static class TestConfig {}
}
