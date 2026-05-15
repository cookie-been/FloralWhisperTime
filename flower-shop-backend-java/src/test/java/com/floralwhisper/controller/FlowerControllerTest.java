package com.floralwhisper.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.floralwhisper.audit.AuditLogService;
import com.floralwhisper.common.ApiException;
import com.floralwhisper.common.GlobalExceptionHandler;
import com.floralwhisper.config.AppProperties;
import com.floralwhisper.config.SecurityConfig;
import com.floralwhisper.dto.FlowerResponse;
import com.floralwhisper.dto.PaginatedResult;
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
import com.floralwhisper.service.FlowerService;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(FlowerController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class, JwtService.class, GlobalExceptionHandler.class, FlowerControllerTest.TestConfig.class})
@TestPropertySource(properties = {
    "app.admin.username=admin",
    "app.admin.password=Floral@2026",
    "app.jwt.secret=12345678901234567890123456789012",
    "app.jwt.expires-in-seconds=43200",
    "app.jwt.issuer=flower-shop-backend-java"
})
class FlowerControllerTest {
  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private JwtService jwtService;

  @MockBean
  private FlowerService flowerService;
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
  void listPreservesArrayFieldsAndCreatedAtShape() throws Exception {
    FlowerResponse flower = flower("wedding_001", "2026-01-15T10:00:00Z");
    when(flowerService.list(eq("wedding"), eq(null), eq(null), eq("latest"), eq(1), eq(20)))
        .thenReturn(new PaginatedResult<>(List.of(flower), 1, 1, 20));

    mockMvc.perform(get("/api/flowers")
            .param("categoryId", "wedding")
            .param("sortBy", "latest")
            .param("page", "1")
            .param("limit", "20"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.total").value(1))
        .andExpect(jsonPath("$.list[0].id").value("wedding_001"))
        .andExpect(jsonPath("$.list[0].createdAt").value("2026-01-15T10:00:00Z"))
        .andExpect(jsonPath("$.list[0].images[0]").value("/uploads/a.jpg"))
        .andExpect(jsonPath("$.list[0].materials[1]").value("绣球"))
        .andExpect(jsonPath("$.list[0].tags[0]").value("婚礼"));
  }

  @Test
  void getByIdReturnsFrontendCompatibleErrorShape() throws Exception {
    when(flowerService.getById("missing")).thenThrow(new ApiException(HttpStatus.NOT_FOUND, "作品不存在"));

    mockMvc.perform(get("/api/flowers/missing"))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.message").value("作品不存在"));
  }

  @Test
  void createRejectsInvalidRequestBeforeWrite() throws Exception {
    mockMvc.perform(post("/api/flowers")
            .header("Authorization", "Bearer " + jwtService.createToken("admin"))
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"name":"","categoryId":"wedding","images":[],"materials":[],"tags":[]}
                """))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.message").value("花束名称不能为空"));
  }

  private FlowerResponse flower(String id, String createdAt) {
    FlowerResponse response = new FlowerResponse();
    response.setId(id);
    response.setName("永恒之约");
    response.setCategoryId("wedding");
    response.setImages(List.of("/uploads/a.jpg", "/uploads/b.jpg"));
    response.setPrice(BigDecimal.valueOf(899));
    response.setDescription("以白玫瑰与淡紫绣球构成层次");
    response.setMaterials(List.of("白玫瑰", "绣球"));
    response.setMeaning("象征纯洁的爱情与长久承诺");
    response.setTags(List.of("婚礼", "白色系"));
    response.setFeatured(true);
    response.setSort(100);
    response.setCreatedAt(createdAt);
    return response;
  }

  @TestConfiguration
  @EnableConfigurationProperties(AppProperties.class)
  static class TestConfig {}
}
