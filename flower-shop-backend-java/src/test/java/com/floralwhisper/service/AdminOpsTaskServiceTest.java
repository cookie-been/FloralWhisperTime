package com.floralwhisper.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
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
    verify(mapper).insert(any(AdminOpsTask.class));
    verify(mapper).updateById(any(AdminOpsTask.class));
  }
}
