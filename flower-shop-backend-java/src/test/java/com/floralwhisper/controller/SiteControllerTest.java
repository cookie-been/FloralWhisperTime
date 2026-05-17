package com.floralwhisper.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.floralwhisper.audit.AuditLogService;
import com.floralwhisper.common.GlobalExceptionHandler;
import com.floralwhisper.config.AppProperties;
import com.floralwhisper.config.ProtectionWebMvcConfigurer;
import com.floralwhisper.config.SecurityConfig;
import com.floralwhisper.protection.ClientIdentityResolver;
import com.floralwhisper.protection.HeavyOperationGuard;
import com.floralwhisper.protection.ProtectionMetrics;
import com.floralwhisper.protection.RateLimitInterceptor;
import com.floralwhisper.protection.RateLimitService;
import com.floralwhisper.protection.RouteProtectionClassifier;
import com.floralwhisper.protection.ServiceBusyException;
import com.floralwhisper.dto.BrandStoryResponse;
import com.floralwhisper.dto.ShopInfoResponse;
import com.floralwhisper.dto.SiteConfigResponse;
import com.floralwhisper.dto.SiteConfigUpdateResponse;
import com.floralwhisper.mapper.AboutPageMapper;
import com.floralwhisper.mapper.AboutTimelineEntryMapper;
import com.floralwhisper.mapper.AdminOpsTaskMapper;
import com.floralwhisper.mapper.AdminSecurityStateMapper;
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
import com.floralwhisper.mapper.TeamMemberMapper;
import com.floralwhisper.security.JwtAuthenticationFilter;
import com.floralwhisper.security.JwtService;
import com.floralwhisper.service.AuthService;
import com.floralwhisper.service.ContactService;
import com.floralwhisper.service.SiteService;
import com.floralwhisper.storage.FileStorageService;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(
    controllers = SiteController.class,
    excludeAutoConfiguration = UserDetailsServiceAutoConfiguration.class)
@Import({
    SecurityConfig.class,
    JwtAuthenticationFilter.class,
    JwtService.class,
    GlobalExceptionHandler.class,
    ProtectionWebMvcConfigurer.class,
    RouteProtectionClassifier.class,
    ClientIdentityResolver.class,
    ProtectionMetrics.class,
    RateLimitService.class,
    RateLimitInterceptor.class,
    SiteControllerTest.TestConfig.class
})
@TestPropertySource(properties = {
    "app.admin.username=admin",
    "app.admin.password=Floral@2026",
    "app.jwt.secret=12345678901234567890123456789012",
    "app.jwt.expires-in-seconds=43200",
    "app.jwt.issuer=flower-shop-backend-java",
    "app.protection.public-read.capacity=2",
    "app.protection.public-read.refill-seconds=60",
    "app.protection.public-read.enabled=true"
})
class SiteControllerTest {
  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private JwtService jwtService;

  @MockBean
  private CategoryMapper categoryMapper;

  @MockBean
  private TeamMemberMapper teamMemberMapper;
  @MockBean
  private AdminOpsTaskMapper adminOpsTaskMapper;
  @MockBean
  private AdminSecurityStateMapper adminSecurityStateMapper;
  @MockBean
  private AuditLogService auditLogService;
  @MockBean
  private com.floralwhisper.mapper.OperationLogMapper operationLogMapper;
  @MockBean private AboutPageMapper aboutPageMapper;
  @MockBean private AboutTimelineEntryMapper aboutTimelineEntryMapper;
  @MockBean private AiSettingsMapper aiSettingsMapper;
  @MockBean private BrandStoryImageMapper brandStoryImageMapper;
  @MockBean private BrandStoryMapper brandStoryMapper;
  @MockBean private ContactMapper contactMapper;
  @MockBean private FlowerImageMapper flowerImageMapper;
  @MockBean private FlowerMapper flowerMapper;
  @MockBean private FlowerMaterialMapper flowerMaterialMapper;
  @MockBean private FlowerTagMapper flowerTagMapper;
  @MockBean private ShopHourMapper shopHourMapper;
  @MockBean private ShopInfoMapper shopInfoMapper;
  @MockBean private SiteConfigMapper siteConfigMapper;

  @MockBean
  private SiteService siteService;

  @MockBean
  private AuthService authService;

  @MockBean
  private ContactService contactService;

  @MockBean
  private FileStorageService fileStorageService;
  @MockBean
  private HeavyOperationGuard heavyOperationGuard;

  @Test
  void siteConfigDoesNotExposeLegacyStatsField() throws Exception {
    when(authService.isPasswordChangeRequired(any())).thenReturn(false);
    SiteConfigResponse response = new SiteConfigResponse();
    response.setBrandName("花语时光");
    response.setHeroTitle("花语时光");
    response.setBrandLogo("https://example.com/logo.png");
    response.setHeroSlides(List.of("https://example.com/home-1.jpg"));
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
    when(siteService.getSiteConfig()).thenReturn(response);

    mockMvc.perform(get("/api/site-config").header("X-Forwarded-For", "198.51.100.10"))
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
        .andExpect(jsonPath("$.aiSettings").doesNotExist())
        .andExpect(jsonPath("$.stats").doesNotExist())
        .andExpect(jsonPath("$.licenseCustomerName").doesNotExist())
        .andExpect(jsonPath("$.licenseCode").doesNotExist())
        .andExpect(jsonPath("$.licenseType").doesNotExist())
        .andExpect(jsonPath("$.licenseExpiresAt").doesNotExist())
        .andExpect(jsonPath("$.licenseWarningDays").doesNotExist())
        .andExpect(jsonPath("$.licenseNotes").doesNotExist());
  }

  @Test
  void publicReadRequestsReturn429WhenRateLimitExceeded() throws Exception {
    when(authService.isPasswordChangeRequired(any())).thenReturn(false);
    SiteConfigResponse response = new SiteConfigResponse();
    response.setBrandName("花语时光");
    when(siteService.getSiteConfig()).thenReturn(response);

    for (int i = 0; i < 2; i++) {
      mockMvc.perform(get("/api/site-config").header("X-Forwarded-For", "198.51.100.20"))
          .andExpect(status().isOk());
    }

    mockMvc.perform(get("/api/site-config").header("X-Forwarded-For", "198.51.100.20"))
        .andExpect(status().isTooManyRequests())
        .andExpect(jsonPath("$.message").value("当前请求较多，请稍后重试"));
  }

  @Test
  void updateSiteConfigRequiresValidPayload() throws Exception {
    when(authService.isPasswordChangeRequired(any())).thenReturn(false);
    mockMvc.perform(put("/api/site-config")
            .header("Authorization", "Bearer " + jwtService.createToken("admin"))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"latitude":181}
                """))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.message").value("纬度超出允许范围"));
  }

  @Test
  void updateSiteConfigReturnsMergedSitePayload() throws Exception {
    when(authService.isPasswordChangeRequired(any())).thenReturn(false);
    SiteConfigResponse siteConfig = new SiteConfigResponse();
    siteConfig.setBrandName("花语时光");
    ShopInfoResponse shopInfo = new ShopInfoResponse();
    shopInfo.setName("花语时光");
    BrandStoryResponse brandStory = new BrandStoryResponse();
    brandStory.setTitle("让花束像一封慢慢抵达的信");
    brandStory.setImages(List.of("/uploads/story-1.jpg"));
    when(siteService.updateSiteConfig(any())).thenReturn(new SiteConfigUpdateResponse(siteConfig, shopInfo, brandStory));

    mockMvc.perform(put("/api/site-config")
            .header("Authorization", "Bearer " + jwtService.createToken("admin"))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"brandName":"花语时光","storyTitle":"让花束像一封慢慢抵达的信"}
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.siteConfig.brandName").value("花语时光"))
        .andExpect(jsonPath("$.siteConfig.aiSettings").doesNotExist())
        .andExpect(jsonPath("$.siteConfig.stats").doesNotExist())
        .andExpect(jsonPath("$.brandStory.images[0]").value("/uploads/story-1.jpg"));
  }

  @Test
  void uploadReturnsFrontendCompatibleUrlShape() throws Exception {
    MockMultipartFile file = new MockMultipartFile("file", "test.jpg", "image/jpeg", "demo".getBytes());
    when(fileStorageService.store(any())).thenReturn(Map.of("url", "/uploads/test.jpg"));

    mockMvc.perform(multipart("/api/uploads")
            .file(file)
            .header("Authorization", "Bearer " + jwtService.createToken("admin")))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.url").value("/uploads/test.jpg"));
  }

  @Test
  void uploadReturns503WhenGuardIsBusy() throws Exception {
    MockMultipartFile file = new MockMultipartFile("file", "test.jpg", "image/jpeg", "demo".getBytes());
    when(heavyOperationGuard.acquireUploadPermit())
        .thenThrow(new ServiceBusyException("当前上传任务较多，请稍后再试"));

    mockMvc.perform(multipart("/api/uploads")
            .file(file)
            .header("Authorization", "Bearer " + jwtService.createToken("admin")))
        .andExpect(status().isServiceUnavailable())
        .andExpect(jsonPath("$.message").value("当前上传任务较多，请稍后再试"));
  }

  @Test
  void contactRejectsBlankNameWithMessageShape() throws Exception {
    mockMvc.perform(post("/api/contact")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"name":"","phone":"123456","message":"想预约花束"}
                """))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.message").value("请填写姓名"));
  }

  @TestConfiguration
  @EnableConfigurationProperties(AppProperties.class)
  static class TestConfig {}
}
