package com.floralwhisper.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.floralwhisper.audit.AuditPayloadSanitizer;
import com.floralwhisper.dto.OperationLogResponse;
import com.floralwhisper.dto.PaginatedResult;
import com.floralwhisper.entity.OperationLog;
import com.floralwhisper.mapper.OperationLogMapper;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;

class OperationLogQueryServiceTest {

  @Test
  void listCanFilterOnlyRestorableLogs() {
    OperationLogMapper mapper = mock(OperationLogMapper.class);
    AuditPayloadSanitizer sanitizer = mock(AuditPayloadSanitizer.class);
    when(sanitizer.sanitizeForDisplay(any())).thenAnswer(invocation -> invocation.getArgument(0));
    when(mapper.selectList(any())).thenReturn(List.of(
        createLog(1L, "FLOWER", "UPDATE", "FLOWER", true),
        createLog(2L, "FLOWER", "RESTORE", "FLOWER", true),
        createLog(3L, "FLOWER", "DELETE", "FLOWER", false),
        createLog(4L, "SITE", "UPDATE", "SITE_CONFIG", true)));

    OperationLogQueryService service = new OperationLogQueryService(mapper, sanitizer);

    PaginatedResult<OperationLogResponse> result = service.list(1, 20, null, null, null, null, null, true);

    assertEquals(2, result.getTotal());
    assertEquals(List.of(1L, 4L), result.getList().stream().map(OperationLogResponse::getId).toList());
    assertTrue(result.getList().stream().allMatch(OperationLogResponse::getRestorable));
  }

  @Test
  void listCanExcludeRestorableLogs() {
    OperationLogMapper mapper = mock(OperationLogMapper.class);
    AuditPayloadSanitizer sanitizer = mock(AuditPayloadSanitizer.class);
    when(sanitizer.sanitizeForDisplay(any())).thenAnswer(invocation -> invocation.getArgument(0));
    when(mapper.selectList(any())).thenReturn(List.of(
        createLog(1L, "FLOWER", "UPDATE", "FLOWER", true),
        createLog(2L, "FLOWER", "RESTORE", "FLOWER", true),
        createLog(3L, "FLOWER", "DELETE", "FLOWER", false),
        createLog(4L, "AUTH", "LOGIN", "AUTH", true)));

    OperationLogQueryService service = new OperationLogQueryService(mapper, sanitizer);

    PaginatedResult<OperationLogResponse> result = service.list(1, 20, null, null, null, null, null, false);

    assertEquals(3, result.getTotal());
    assertEquals(List.of(2L, 3L, 4L), result.getList().stream().map(OperationLogResponse::getId).toList());
    assertFalse(result.getList().stream().anyMatch(OperationLogResponse::getRestorable));
  }

  private OperationLog createLog(Long id, String module, String action, String targetType, boolean success) {
    OperationLog log = new OperationLog();
    log.setId(id);
    log.setModule(module);
    log.setAction(action);
    log.setTargetType(targetType);
    log.setTargetId("target_" + id);
    log.setOperatorName("admin");
    log.setRequestSummary("{\"id\":" + id + "}");
    log.setSuccess(success);
    log.setCreatedAt(LocalDateTime.of(2026, 5, 15, 10, id.intValue()));
    return log;
  }
}
