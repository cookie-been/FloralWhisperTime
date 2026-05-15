package com.floralwhisper.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.floralwhisper.audit.AuditLogCommand;
import com.floralwhisper.audit.AuditLogService;
import com.floralwhisper.dto.AdminOpsTaskListResponse;
import com.floralwhisper.dto.AdminOpsTaskResponse;
import com.floralwhisper.entity.AdminOpsTask;
import com.floralwhisper.mapper.AdminOpsTaskMapper;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Clock;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AdminOpsTaskService {
  private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

  private final AdminOpsTaskMapper adminOpsTaskMapper;
  private final SiteService siteService;
  private final AuditLogService auditLogService;
  private final ObjectMapper objectMapper;
  private final Clock clock;

  @Autowired
  public AdminOpsTaskService(
      AdminOpsTaskMapper adminOpsTaskMapper,
      SiteService siteService,
      AuditLogService auditLogService,
      ObjectMapper objectMapper) {
    this(adminOpsTaskMapper, siteService, auditLogService, objectMapper, Clock.systemDefaultZone());
  }

  AdminOpsTaskService(
      AdminOpsTaskMapper adminOpsTaskMapper,
      SiteService siteService,
      AuditLogService auditLogService,
      ObjectMapper objectMapper,
      Clock clock) {
    this.adminOpsTaskMapper = adminOpsTaskMapper;
    this.siteService = siteService;
    this.auditLogService = auditLogService;
    this.objectMapper = objectMapper == null ? new ObjectMapper().findAndRegisterModules() : objectMapper.copy().findAndRegisterModules();
    this.clock = clock == null ? Clock.systemDefaultZone() : clock;
  }

  public AdminOpsTaskListResponse listRecentTasks() {
    List<AdminOpsTaskResponse> list = adminOpsTaskMapper.selectList(
            new LambdaQueryWrapper<AdminOpsTask>()
                .orderByDesc(AdminOpsTask::getCreatedAt)
                .last("LIMIT 20"))
        .stream()
        .map(this::toResponse)
        .toList();

    AdminOpsTaskListResponse response = new AdminOpsTaskListResponse();
    response.setList(list);
    response.setTotal(list.size());
    return response;
  }

  public AdminOpsTaskResponse createBackupTask(String operatorName) {
    LocalDateTime startedAt = LocalDateTime.now(clock);
    AdminOpsTask task = createTask("backup", "手动备份", operatorName, Map.of("source", "admin_ui"), startedAt);
    try {
      Map<String, Object> backup = siteService.createOnDemandBackup(operatorName);
      completeTask(task, "success", backup, "", null);
      recordAudit("BACKUP", operatorName, true, backup, null);
    } catch (RuntimeException error) {
      completeTask(task, "failed", Map.of(), "", error.getMessage());
      recordAudit("BACKUP", operatorName, false, Map.of(), error.getMessage());
      throw error;
    }
    return toResponse(task);
  }

  public AdminOpsTaskResponse createInspectionTask(String operatorName) {
    LocalDateTime startedAt = LocalDateTime.now(clock);
    AdminOpsTask task = createTask("inspection", "系统巡检", operatorName, Map.of("source", "admin_ui"), startedAt);
    try {
      Map<String, Object> summary = siteService.buildInspectionSummary();
      String excerpt = stringify(summary);
      completeTask(task, "success", summary, excerpt, null);
      recordAudit("INSPECT", operatorName, true, summary, null);
    } catch (RuntimeException error) {
      completeTask(task, "failed", Map.of(), "", error.getMessage());
      recordAudit("INSPECT", operatorName, false, Map.of(), error.getMessage());
      throw error;
    }
    return toResponse(task);
  }

  private AdminOpsTask createTask(String taskType, String taskLabel, String operatorName, Map<String, Object> payload, LocalDateTime startedAt) {
    AdminOpsTask task = new AdminOpsTask();
    task.setTaskType(taskType);
    task.setTaskLabel(taskLabel);
    task.setStatus("running");
    task.setTriggerSource("admin_ui");
    task.setOperatorName(blankToDefault(operatorName, "admin"));
    task.setRequestPayload(stringify(payload));
    task.setResultSummary("");
    task.setLogExcerpt("");
    task.setErrorMessage("");
    task.setStartedAt(startedAt);
    adminOpsTaskMapper.insert(task);
    return task;
  }

  private void completeTask(AdminOpsTask task, String status, Map<String, Object> result, String logExcerpt, String errorMessage) {
    task.setStatus(status);
    task.setResultSummary(stringify(result));
    task.setLogExcerpt(logExcerpt == null ? "" : logExcerpt);
    task.setErrorMessage(errorMessage == null ? "" : errorMessage);
    task.setFinishedAt(LocalDateTime.now(clock));
    adminOpsTaskMapper.updateById(task);
  }

  private void recordAudit(String action, String operatorName, boolean success, Map<String, Object> afterSnapshot, String errorMessage) {
    auditLogService.record(AuditLogCommand.builder()
        .module("AUDIT")
        .action(action)
        .targetType("ADMIN_OPS_TASK")
        .targetId(blankToDefault(operatorName, "admin"))
        .operatorName(blankToDefault(operatorName, "admin"))
        .afterSnapshot(afterSnapshot)
        .success(success)
        .errorMessage(errorMessage)
        .build());
  }

  private AdminOpsTaskResponse toResponse(AdminOpsTask task) {
    AdminOpsTaskResponse response = new AdminOpsTaskResponse();
    response.setId(task.getId());
    response.setTaskType(blankToDefault(task.getTaskType(), ""));
    response.setTaskLabel(blankToDefault(task.getTaskLabel(), ""));
    response.setStatus(blankToDefault(task.getStatus(), ""));
    response.setTriggerSource(blankToDefault(task.getTriggerSource(), ""));
    response.setOperatorName(blankToDefault(task.getOperatorName(), ""));
    response.setRequestPayload(blankToDefault(task.getRequestPayload(), ""));
    response.setResultSummary(blankToDefault(task.getResultSummary(), ""));
    response.setLogExcerpt(blankToDefault(task.getLogExcerpt(), ""));
    response.setErrorMessage(blankToDefault(task.getErrorMessage(), ""));
    response.setStartedAt(format(task.getStartedAt()));
    response.setFinishedAt(format(task.getFinishedAt()));
    response.setCreatedAt(format(task.getCreatedAt()));
    response.setUpdatedAt(format(task.getUpdatedAt()));
    return response;
  }

  private String stringify(Object value) {
    if (value == null) {
      return "";
    }
    try {
      return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(value);
    } catch (JsonProcessingException error) {
      return String.valueOf(value);
    }
  }

  private String format(LocalDateTime value) {
    return value == null ? "" : DATE_TIME_FORMATTER.format(value);
  }

  private String blankToDefault(String value, String fallback) {
    return value == null || value.isBlank() ? fallback : value;
  }
}
