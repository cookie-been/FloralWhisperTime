package com.floralwhisper.audit;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.floralwhisper.entity.OperationLog;
import com.floralwhisper.mapper.OperationLogMapper;
import java.time.LocalDateTime;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditLogService {
  private final OperationLogMapper operationLogMapper;
  private final ObjectMapper objectMapper;
  private final AuditPayloadSanitizer auditPayloadSanitizer;

  public AuditLogService(
      OperationLogMapper operationLogMapper,
      ObjectMapper objectMapper,
      AuditPayloadSanitizer auditPayloadSanitizer) {
    this.operationLogMapper = operationLogMapper;
    this.objectMapper = objectMapper;
    this.auditPayloadSanitizer = auditPayloadSanitizer;
  }

  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public OperationLog record(AuditLogCommand command) {
    AuditContext context = AuditContextHolder.get();
    OperationLog entity = new OperationLog();
    entity.setModule(text(command.getModule(), "UNKNOWN"));
    entity.setAction(text(command.getAction(), "UNKNOWN"));
    entity.setTargetType(text(command.getTargetType(), "unknown"));
    entity.setTargetId(text(command.getTargetId(), "unknown"));
    entity.setOperatorName(resolveOperatorName(command, context));
    entity.setRequestSummary(auditPayloadSanitizer.sanitizeForSummary(command.getRequestSummary()));
    entity.setBeforeSnapshot(writeJson(command.getBeforeSnapshot()));
    entity.setAfterSnapshot(writeJson(command.getAfterSnapshot()));
    entity.setSuccess(Boolean.TRUE.equals(command.getSuccess()));
    entity.setErrorMessage(blankToEmpty(command.getErrorMessage()));
    entity.setIpAddress(context == null ? "" : blankToEmpty(context.getIpAddress()));
    entity.setUserAgent(context == null ? "" : blankToEmpty(context.getUserAgent()));
    entity.setRestoredFromLogId(command.getRestoredFromLogId());
    entity.setCreatedAt(LocalDateTime.now());
    operationLogMapper.insert(entity);
    return entity;
  }

  private String resolveOperatorName(AuditLogCommand command, AuditContext context) {
    if (command.getOperatorName() != null && !command.getOperatorName().isBlank()) {
      return command.getOperatorName().trim();
    }
    if (context != null && context.getOperatorName() != null && !context.getOperatorName().isBlank()) {
      return context.getOperatorName().trim();
    }
    return "anonymous";
  }

  private String writeJson(Object value) {
    if (value == null) {
      return "";
    }
    try {
      return objectMapper.writeValueAsString(value);
    } catch (JsonProcessingException ignored) {
      return String.valueOf(value);
    }
  }

  private String text(String value, String fallback) {
    return value == null || value.isBlank() ? fallback : value.trim();
  }

  private String blankToEmpty(String value) {
    return value == null ? "" : value.trim();
  }
}
