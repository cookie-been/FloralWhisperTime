package com.floralwhisper.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.floralwhisper.common.GlobalExceptionHandler;
import com.floralwhisper.config.AppProperties;
import com.floralwhisper.config.SecurityConfig;
import com.floralwhisper.dto.AiSettingsResponse;
import com.floralwhisper.dto.BrandStoryResponse;
import com.floralwhisper.dto.ShopInfoResponse;
import com.floralwhisper.dto.SiteConfigResponse;
import com.floralwhisper.dto.SiteConfigUpdateResponse;
import com.floralwhisper.dto.SiteStatResponse;
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
import com.floralwhisper.service.ContactService;
import com.floralwhisper.service.SiteService;
import com.floralwhisper.storage.FileStorageService;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(SiteController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtService.class, GlobalExceptionHandler.class, SiteControllerTest.TestConfig.class})
@TestPropertySource(properties = {
    "app.admin.username=admin",
    "app.admin.password=Floral@2026",
    "app.jwt.secret=12345678901234567890123456789012",
    "app.jwt.expires-in-seconds=43200",
    "app.jwt.issuer=flower-shop-backend-java"
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
  @MockBean private SiteConfigStatMapper siteConfigStatMapper;

  @MockBean
  private SiteService siteService;

  @MockBean
  private ContactService contactService;

  @MockBean
  private FileStorageService fileStorageService;

  @Test
  void siteConfigReturnsStableStatsArray() throws Exception {
    SiteConfigResponse response = new SiteConfigResponse();
    response.setBrandName("花语时光");
    response.setHeroTitle("花语时光");
    AiSettingsResponse aiSettings = new AiSettingsResponse();
    aiSettings.setEnabled(true);
    aiSettings.setProvider("volcengine");
    aiSettings.setModel("Doubao-Seedream-5.0-lite");
    response.setAiSettings(aiSettings);
    response.setStats(List.of(stat("860+", "已服务客户"), stat("320+", "花艺作品")));
    when(siteService.getSiteConfig()).thenReturn(response);

    mockMvc.perform(get("/api/site-config"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.brandName").value("花语时光"))
        .andExpect(jsonPath("$.aiSettings.enabled").value(true))
        .andExpect(jsonPath("$.aiSettings.model").value("Doubao-Seedream-5.0-lite"))
        .andExpect(jsonPath("$.stats[0].value").value("860+"))
        .andExpect(jsonPath("$.stats[1].label").value("花艺作品"));
  }

  @Test
  void updateSiteConfigRequiresValidPayload() throws Exception {
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
    SiteConfigResponse siteConfig = new SiteConfigResponse();
    siteConfig.setBrandName("花语时光");
    AiSettingsResponse aiSettings = new AiSettingsResponse();
    aiSettings.setEnabled(true);
    aiSettings.setProvider("volcengine");
    aiSettings.setApiKey("db-key");
    aiSettings.setModel("Doubao-Seedream-5.0-lite");
    siteConfig.setAiSettings(aiSettings);
    siteConfig.setStats(List.of(stat("860+", "已服务客户")));
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
        .andExpect(jsonPath("$.siteConfig.aiSettings.apiKey").value("db-key"))
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
  void contactRejectsBlankNameWithMessageShape() throws Exception {
    mockMvc.perform(post("/api/contact")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"name":"","phone":"123456","message":"想预约花束"}
                """))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.message").value("请填写姓名"));
  }

  private SiteStatResponse stat(String value, String label) {
    SiteStatResponse response = new SiteStatResponse();
    response.setValue(value);
    response.setLabel(label);
    return response;
  }

  @TestConfiguration
  @EnableConfigurationProperties(AppProperties.class)
  static class TestConfig {}
}
