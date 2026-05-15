package com.floralwhisper.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.floralwhisper.audit.AuditLogService;
import com.floralwhisper.common.GlobalExceptionHandler;
import com.floralwhisper.config.AppProperties;
import com.floralwhisper.config.SecurityConfig;
import com.floralwhisper.dto.AboutPageResponse;
import com.floralwhisper.dto.AboutTimelineEntryResponse;
import com.floralwhisper.dto.AiSettingsResponse;
import com.floralwhisper.dto.LoginResponse;
import com.floralwhisper.dto.OperationLogDetailResponse;
import com.floralwhisper.dto.OperationLogResponse;
import com.floralwhisper.dto.PaginatedResult;
import com.floralwhisper.dto.SystemStatusResponse;
import com.floralwhisper.entity.TeamMember;
import com.floralwhisper.entity.Contact;
import com.floralwhisper.mapper.AboutPageMapper;
import com.floralwhisper.mapper.AboutTimelineEntryMapper;
import com.floralwhisper.mapper.AiSettingsMapper;
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
import com.floralwhisper.mapper.SiteConfigStatMapper;
import com.floralwhisper.mapper.TeamMemberMapper;
import com.floralwhisper.security.JwtAuthenticationFilter;
import com.floralwhisper.security.JwtService;
import com.floralwhisper.service.AuthService;
import com.floralwhisper.service.ContactService;
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
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.boot.test.mock.mockito.MockBean;

@WebMvcTest(AdminController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtService.class, GlobalExceptionHandler.class, AdminControllerTest.TestConfig.class})
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
  private ObjectMapper objectMapper;

  @Autowired
  private JwtService jwtService;

  @Autowired
  private AppProperties properties;

  @MockBean
  private AuthService authService;
  @MockBean
  private ContactService contactService;
  @MockBean
  private SiteService siteService;
  @MockBean
  private OperationLogQueryService operationLogQueryService;
  @MockBean
  private OperationLogRecoveryService operationLogRecoveryService;
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
  @MockBean private SiteConfigStatMapper siteConfigStatMapper;
  @MockBean private TeamMemberMapper teamMemberMapper;

  @Test
  void loginReturnsTokenAndUsername() throws Exception {
    when(authService.login(any())).thenReturn(new LoginResponse("jwt-token", "admin"));

    mockMvc.perform(post("/api/admin/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"username":"admin","password":"Floral@2026"}
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.token").value("jwt-token"))
        .andExpect(jsonPath("$.username").value("admin"));
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
    when(authService.currentAdmin()).thenReturn(Map.of("username", "admin"));

    mockMvc.perform(get("/api/admin/me")
            .header("Authorization", "Bearer " + jwtService.createToken("admin")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.username").value("admin"));
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

    when(siteService.getSystemStatus()).thenReturn(response);

    mockMvc.perform(get("/api/admin/system/status")
            .header("Authorization", "Bearer " + jwtService.createToken("admin")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.service").value("flower-shop-backend-java"))
        .andExpect(jsonPath("$.version").value("1.0.0"))
        .andExpect(jsonPath("$.databaseConnected").value(true))
        .andExpect(jsonPath("$.databaseVersion").value("8.0.36"))
        .andExpect(jsonPath("$.databaseSize").value("128.50 MB"))
        .andExpect(jsonPath("$.diskTotal").value("120.00 GB"))
        .andExpect(jsonPath("$.diskUsable").value("78.40 GB"))
        .andExpect(jsonPath("$.diskUsageRate").value("34.67%"))
        .andExpect(jsonPath("$.uploadDirectorySize").value("256.00 MB"))
        .andExpect(jsonPath("$.uptimeLabel").value("15分钟"))
        .andExpect(jsonPath("$.aiKeyConfigured").value(true))
        .andExpect(jsonPath("$.latestBackupName").value("20260515-002808"))
        .andExpect(jsonPath("$.latestBackupModifiedAt").value("2026-05-15 08:28:08"))
        .andExpect(jsonPath("$.latestBackupDownloadUrl").value("/api/admin/system/backups/latest/download"));
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
    when(operationLogQueryService.list(1, 10, "FLOWER", null, null, true, "wedding", null))
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
