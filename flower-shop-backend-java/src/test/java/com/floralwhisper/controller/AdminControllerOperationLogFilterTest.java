package com.floralwhisper.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.floralwhisper.dto.PaginatedResult;
import com.floralwhisper.service.OperationLogQueryService;
import com.floralwhisper.security.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(AdminController.class)
@Import({com.floralwhisper.config.SecurityConfig.class, com.floralwhisper.security.JwtAuthenticationFilter.class, JwtService.class, com.floralwhisper.common.GlobalExceptionHandler.class, AdminControllerTest.TestConfig.class})
@TestPropertySource(properties = {
    "app.admin.username=admin",
    "app.admin.password=Floral@2026",
    "app.jwt.secret=12345678901234567890123456789012",
    "app.jwt.expires-in-seconds=43200",
    "app.jwt.issuer=flower-shop-backend-java"
})
class AdminControllerOperationLogFilterTest {

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  private JwtService jwtService;

  @MockBean
  private com.floralwhisper.service.AuthService authService;
  @MockBean
  private com.floralwhisper.service.ContactService contactService;
  @MockBean
  private com.floralwhisper.service.SiteService siteService;
  @MockBean
  private OperationLogQueryService operationLogQueryService;
  @MockBean
  private com.floralwhisper.service.OperationLogRecoveryService operationLogRecoveryService;
  @MockBean
  private com.floralwhisper.audit.AuditLogService auditLogService;
  @MockBean
  private com.floralwhisper.mapper.OperationLogMapper operationLogMapper;
  @MockBean private com.floralwhisper.mapper.AboutPageMapper aboutPageMapper;
  @MockBean private com.floralwhisper.mapper.AboutTimelineEntryMapper aboutTimelineEntryMapper;
  @MockBean private com.floralwhisper.mapper.AiSettingsMapper aiSettingsMapper;
  @MockBean private com.floralwhisper.mapper.BrandStoryImageMapper brandStoryImageMapper;
  @MockBean private com.floralwhisper.mapper.BrandStoryMapper brandStoryMapper;
  @MockBean private com.floralwhisper.mapper.CategoryMapper categoryMapper;
  @MockBean private com.floralwhisper.mapper.ContactMapper contactMapper;
  @MockBean private com.floralwhisper.mapper.FlowerImageMapper flowerImageMapper;
  @MockBean private com.floralwhisper.mapper.FlowerMapper flowerMapper;
  @MockBean private com.floralwhisper.mapper.FlowerMaterialMapper flowerMaterialMapper;
  @MockBean private com.floralwhisper.mapper.FlowerTagMapper flowerTagMapper;
  @MockBean private com.floralwhisper.mapper.ShopHourMapper shopHourMapper;
  @MockBean private com.floralwhisper.mapper.ShopInfoMapper shopInfoMapper;
  @MockBean private com.floralwhisper.mapper.SiteConfigMapper siteConfigMapper;
  @MockBean private com.floralwhisper.mapper.SiteConfigStatMapper siteConfigStatMapper;
  @MockBean private com.floralwhisper.mapper.TeamMemberMapper teamMemberMapper;

  @Test
  void operationLogsAcceptRestorableFilter() throws Exception {
    when(operationLogQueryService.list(1, 10, null, null, null, null, null, true))
        .thenReturn(new PaginatedResult<>(java.util.List.of(), 0, 1, 10));

    mockMvc.perform(get("/api/admin/operation-logs")
            .param("page", "1")
            .param("limit", "10")
            .param("restorable", "true")
            .header("Authorization", "Bearer " + jwtService.createToken("admin")))
        .andExpect(status().isOk());
  }
}
