package com.floralwhisper.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.floralwhisper.dto.PaginatedResult;
import com.floralwhisper.dto.OperationLogDetailResponse;
import com.floralwhisper.dto.OperationLogResponse;
import com.floralwhisper.service.OperationLogQueryService;
import com.floralwhisper.security.JwtService;
import java.time.LocalDateTime;
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
    when(operationLogQueryService.list(1, 10, null, null, null, null, null, true, null, null))
        .thenReturn(new PaginatedResult<>(java.util.List.of(), 0, 1, 10));

    mockMvc.perform(get("/api/admin/operation-logs")
            .param("page", "1")
            .param("limit", "10")
            .param("restorable", "true")
            .header("Authorization", "Bearer " + jwtService.createToken("admin")))
        .andExpect(status().isOk());
  }

  @Test
  void operationLogsAcceptCreatedAtRangeFilters() throws Exception {
    when(operationLogQueryService.list(
        1,
        10,
        null,
        null,
        null,
        null,
        null,
        null,
        LocalDateTime.of(2026, 5, 14, 0, 0),
        LocalDateTime.of(2026, 5, 14, 23, 59, 59)))
        .thenReturn(new PaginatedResult<>(java.util.List.of(), 0, 1, 10));

    mockMvc.perform(get("/api/admin/operation-logs")
            .param("page", "1")
            .param("limit", "10")
            .param("createdFrom", "2026-05-14T00:00:00")
            .param("createdTo", "2026-05-14T23:59:59")
            .header("Authorization", "Bearer " + jwtService.createToken("admin")))
        .andExpect(status().isOk());
  }

  @Test
  void operationLogsExportReturnsCsvAttachment() throws Exception {
    OperationLogResponse item = new OperationLogResponse();
    item.setId(8L);
    item.setModule("FLOWER");
    item.setAction("UPDATE");
    item.setTargetType("FLOWER");
    item.setTargetId("flower_008");
    item.setOperatorName("admin");
    item.setRequestSummary("{\"name\":\"星河晨露\"}");
    item.setSuccess(true);
    item.setRestorable(true);
    item.setCreatedAt(LocalDateTime.of(2026, 5, 15, 10, 8));
    when(operationLogQueryService.listForExport(
        null, null, null, null, null, null, null, null))
        .thenReturn(java.util.List.of(item));

    mockMvc.perform(get("/api/admin/operation-logs/export")
            .header("Authorization", "Bearer " + jwtService.createToken("admin")))
        .andExpect(status().isOk())
        .andExpect(header().string("Content-Type", "text/csv;charset=UTF-8"))
        .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString("operation-logs")));
  }

  @Test
  void operationLogDetailIncludesRestoreChainLogs() throws Exception {
    OperationLogResponse source = new OperationLogResponse();
    source.setId(12L);
    source.setAction("UPDATE");
    source.setTargetId("flower_001");
    source.setCreatedAt(LocalDateTime.of(2026, 5, 15, 10, 0));

    OperationLogDetailResponse detail = new OperationLogDetailResponse();
    detail.setId(18L);
    detail.setAction("RESTORE");
    detail.setTargetId("flower_001");
    detail.setRestoredFromLogId(12L);
    detail.setRelatedLogs(java.util.List.of(source));
    when(operationLogQueryService.getDetail(18L)).thenReturn(detail);

    mockMvc.perform(get("/api/admin/operation-logs/18")
            .header("Authorization", "Bearer " + jwtService.createToken("admin")))
        .andExpect(status().isOk())
        .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath("$.relatedLogs[0].id").value(12));
  }
}
