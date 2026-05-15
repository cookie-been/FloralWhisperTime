package com.floralwhisper.controller;

import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.floralwhisper.audit.AuditLogService;
import com.floralwhisper.common.GlobalExceptionHandler;
import com.floralwhisper.config.AiImageProperties;
import com.floralwhisper.config.AppProperties;
import com.floralwhisper.config.SecurityConfig;
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
import com.floralwhisper.dto.AiFlowerSuggestionResponse;
import com.floralwhisper.service.ai.AiGeneratedImageStorageService;
import com.floralwhisper.service.ai.AiSettingsResolver;
import com.floralwhisper.service.ai.GeneratedAiImageResult;
import com.floralwhisper.service.ai.ResolvedAiImageSettings;
import com.floralwhisper.service.ai.VolcengineFlowerSuggestionService;
import com.floralwhisper.service.ai.VolcengineImageGenerationService;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(AdminAiController.class)
@Import({
    SecurityConfig.class,
    JwtAuthenticationFilter.class,
    JwtService.class,
    GlobalExceptionHandler.class,
    AdminAiControllerTest.TestConfig.class
})
@TestPropertySource(properties = {
    "app.admin.username=admin",
    "app.admin.password=Floral@2026",
    "app.jwt.secret=12345678901234567890123456789012",
    "app.jwt.expires-in-seconds=43200",
    "app.jwt.issuer=flower-shop-backend-java",
    "app.ai-image.enabled=true",
    "app.ai-image.max-reference-files=3",
    "app.ai-image.max-reference-file-size-bytes=20971520"
})
class AdminAiControllerTest {
  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private JwtService jwtService;

  @Autowired
  private AppProperties properties;

  @MockBean
  private VolcengineImageGenerationService volcengineImageGenerationService;

  @MockBean
  private AiGeneratedImageStorageService aiGeneratedImageStorageService;

  @MockBean
  private VolcengineFlowerSuggestionService volcengineFlowerSuggestionService;

  @MockBean
  private AiImageProperties aiImageProperties;

  @MockBean
  private AiSettingsResolver aiSettingsResolver;
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

  @SuppressWarnings("unused")
  @Autowired
  private ObjectMapper objectMapper;

  @Test
  void generateRejectsMissingTokenWithFrontendCompatibleMessage() throws Exception {
    mockMvc.perform(multipart("/api/admin/ai/images/generate")
            .param("prompt", "一束白绿色婚礼花束")
            .with(request -> {
              request.setMethod("POST");
              return request;
            }))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.message").value("请先登录管理后台"));
  }

  @Test
  void generateRejectsBlankPrompt() throws Exception {
    mockMvc.perform(multipart("/api/admin/ai/images/generate")
            .param("prompt", "   ")
            .header("Authorization", "Bearer " + jwtService.createToken("admin"))
            .with(request -> {
              request.setMethod("POST");
              return request;
            }))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.message").value("请输入生成提示词"));
  }

  @Test
  void generateRejectsTooManyReferenceFiles() throws Exception {
    when(aiSettingsResolver.resolve()).thenReturn(settings());

    mockMvc.perform(multipart("/api/admin/ai/images/generate")
            .file(image("referenceFiles", "a.png", 16))
            .file(image("referenceFiles", "b.png", 16))
            .file(image("referenceFiles", "c.png", 16))
            .file(image("referenceFiles", "d.png", 16))
            .param("prompt", "生成一束开业花篮")
            .header("Authorization", "Bearer " + jwtService.createToken("admin"))
            .with(request -> {
              request.setMethod("POST");
              return request;
            }))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.message").value("参考图最多上传 3 张"));
  }

  @Test
  void generateRejectsOversizedReferenceFile() throws Exception {
    when(aiSettingsResolver.resolve()).thenReturn(settings());

    byte[] bytes = new byte[(20 * 1024 * 1024) + 1];
    MockMultipartFile oversized = new MockMultipartFile("referenceFiles", "large.png", "image/png", bytes);

    mockMvc.perform(multipart("/api/admin/ai/images/generate")
            .file(oversized)
            .param("prompt", "生成一束生日花束")
            .header("Authorization", "Bearer " + jwtService.createToken("admin"))
            .with(request -> {
              request.setMethod("POST");
              return request;
            }))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.message").value("参考图单张大小不能超过 20MB"));
  }

  @Test
  void generateReturnsImageResultWhenTokenIsValid() throws Exception {
    when(aiSettingsResolver.resolve()).thenReturn(settings());
    when(volcengineImageGenerationService.generate(eq("生成一束白绿色婚礼花束"), anyList()))
        .thenReturn(new GeneratedAiImageResult("https://example.com/generated.png", "text_to_image", "Doubao-Seedream-5.0-lite"));
    when(aiGeneratedImageStorageService.downloadToLocal("https://example.com/generated.png"))
        .thenReturn("/uploads/ai/generated.png");

    mockMvc.perform(multipart("/api/admin/ai/images/generate")
            .param("prompt", "生成一束白绿色婚礼花束")
            .header("Authorization", "Bearer " + jwtService.createToken("admin"))
            .with(request -> {
              request.setMethod("POST");
              return request;
            }))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.success").value(true))
        .andExpect(jsonPath("$.imageUrl").value("/uploads/ai/generated.png"))
        .andExpect(jsonPath("$.source").value("Doubao-Seedream-5.0-lite"))
        .andExpect(jsonPath("$.mode").value("text_to_image"));
  }

  @Test
  void suggestRejectsBlankPrompt() throws Exception {
    mockMvc.perform(post("/api/admin/ai/flowers/suggestions")
            .contentType(MediaType.APPLICATION_JSON)
            .header("Authorization", "Bearer " + jwtService.createToken("admin"))
            .content("""
                {"prompt":"   "}
                """))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.message").value("请输入生成提示词"));
  }

  @Test
  void suggestReturnsStructuredSuggestionWhenTokenIsValid() throws Exception {
    when(volcengineFlowerSuggestionService.suggest(eq("生成一束白绿色婚礼花束"), anyString(), anyString()))
        .thenReturn(new AiFlowerSuggestionResponse(
            "晨雾誓约",
            "wedding",
            "以奶油白玫瑰和轻盈绿植构成干净克制的婚礼手捧花。",
            java.util.List.of("白玫瑰", "洋牡丹", "尤加利"),
            java.util.List.of("婚礼", "白绿色", "现代感"),
            "象征纯净承诺与温柔陪伴"));

    mockMvc.perform(post("/api/admin/ai/flowers/suggestions")
            .contentType(MediaType.APPLICATION_JSON)
            .header("Authorization", "Bearer " + jwtService.createToken("admin"))
            .content("""
                {
                  "prompt":"生成一束白绿色婚礼花束",
                  "imageUrl":"/uploads/ai/generated.png",
                  "mode":"text_to_image"
                }
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.name").value("晨雾誓约"))
        .andExpect(jsonPath("$.categoryId").value("wedding"))
        .andExpect(jsonPath("$.materials[0]").value("白玫瑰"))
        .andExpect(jsonPath("$.tags[1]").value("白绿色"))
        .andExpect(jsonPath("$.meaning").value("象征纯净承诺与温柔陪伴"));
  }

  private ResolvedAiImageSettings settings() {
    return new ResolvedAiImageSettings(
        true,
        "volcengine",
        "test-key",
        "Doubao-Seedream-5.0-lite",
        "https://operator.las.cn-beijing.volces.com/api/v1",
        "/images/generations",
        "1024x1280",
        3,
        20L * 1024L * 1024L,
        "ai",
        120,
        "url",
        false);
  }

  private MockMultipartFile image(String name, String filename, int bytes) {
    return new MockMultipartFile(name, filename, "image/png", new byte[bytes]);
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
