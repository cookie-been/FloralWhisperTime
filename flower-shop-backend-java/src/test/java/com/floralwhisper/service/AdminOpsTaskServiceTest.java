package com.floralwhisper.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.floralwhisper.audit.AuditLogService;
import com.floralwhisper.dto.AdminOpsTaskResponse;
import com.floralwhisper.entity.AdminOpsTask;
import com.floralwhisper.mapper.AdminOpsTaskMapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;
import org.junit.jupiter.api.Test;

class AdminOpsTaskServiceTest {

  @Test
  void createBackupTaskShouldPersistSuccessResult() {
    AdminOpsTaskMapper mapper = mock(AdminOpsTaskMapper.class);
    SiteService siteService = mock(SiteService.class);
    AuditLogService auditLogService = mock(AuditLogService.class);
    AtomicLong sequence = new AtomicLong(1L);

    doAnswer(invocation -> {
      AdminOpsTask task = invocation.getArgument(0);
      task.setId(sequence.getAndIncrement());
      return 1;
    }).when(mapper).insert(any(AdminOpsTask.class));

    when(siteService.createOnDemandBackup("admin")).thenReturn(Map.of(
        "backupName", "20260516-011500",
        "backupPath", "/app/backups/20260516-011500"));

    AdminOpsTaskService service = new AdminOpsTaskService(
        mapper,
        siteService,
        auditLogService,
        new ObjectMapper(),
        Clock.fixed(Instant.parse("2026-05-15T17:15:00Z"), ZoneId.of("Asia/Shanghai")));

    AdminOpsTaskResponse response = service.createBackupTask("admin");

    assertEquals("backup", response.getTaskType());
    assertEquals("success", response.getStatus());
    assertTrue(response.getResultSummary().contains("20260516-011500"));
    assertEquals("20260516-011500", response.getResultData().get("backupName"));
    verify(mapper).insert(any(AdminOpsTask.class));
    verify(mapper).updateById(any(AdminOpsTask.class));
  }

  @Test
  void createInspectionTaskShouldPersistSnapshotSummary() {
    AdminOpsTaskMapper mapper = mock(AdminOpsTaskMapper.class);
    SiteService siteService = mock(SiteService.class);
    AuditLogService auditLogService = mock(AuditLogService.class);
    AtomicLong sequence = new AtomicLong(2L);

    doAnswer(invocation -> {
      AdminOpsTask task = invocation.getArgument(0);
      task.setId(sequence.getAndIncrement());
      return 1;
    }).when(mapper).insert(any(AdminOpsTask.class));

    when(siteService.buildInspectionSummary()).thenReturn(Map.of(
        "databaseConnected", true,
        "uploadDirectoryReady", true,
        "securityLevel", "good"));

    AdminOpsTaskService service = new AdminOpsTaskService(
        mapper,
        siteService,
        auditLogService,
        new ObjectMapper(),
        Clock.fixed(Instant.parse("2026-05-15T17:16:00Z"), ZoneId.of("Asia/Shanghai")));

    AdminOpsTaskResponse response = service.createInspectionTask("admin");

    assertEquals("inspection", response.getTaskType());
    assertEquals("success", response.getStatus());
    assertTrue(response.getResultSummary().contains("databaseConnected"));
    assertEquals(Boolean.TRUE, response.getResultData().get("databaseConnected"));
    verify(mapper).insert(any(AdminOpsTask.class));
    verify(mapper).updateById(any(AdminOpsTask.class));
  }

  @Test
  void listRecentTasksShouldExposeStructuredResultData() {
    AdminOpsTaskMapper mapper = mock(AdminOpsTaskMapper.class);
    SiteService siteService = mock(SiteService.class);
    AuditLogService auditLogService = mock(AuditLogService.class);

    AdminOpsTask task = new AdminOpsTask();
    task.setId(9L);
    task.setTaskType("inspection");
    task.setTaskLabel("系统巡检");
    task.setStatus("success");
    task.setTriggerSource("admin_ui");
    task.setOperatorName("admin");
    task.setRequestPayload("{\"source\":\"admin_ui\"}");
    task.setResultSummary("{\"databaseConnected\":true,\"securityLevel\":\"good\"}");
    task.setLogExcerpt("");
    task.setErrorMessage("");

    when(mapper.selectList(any())).thenReturn(java.util.List.of(task));

    AdminOpsTaskService service = new AdminOpsTaskService(
        mapper,
        siteService,
        auditLogService,
        new ObjectMapper(),
        Clock.fixed(Instant.parse("2026-05-15T17:16:00Z"), ZoneId.of("Asia/Shanghai")));

    var response = service.listRecentTasks();

    assertEquals(1, response.getTotal());
    assertEquals(Boolean.TRUE, response.getList().get(0).getResultData().get("databaseConnected"));
    assertEquals("good", response.getList().get(0).getResultData().get("securityLevel"));
    assertFalse(response.getList().get(0).getResultData().isEmpty());
  }
}
