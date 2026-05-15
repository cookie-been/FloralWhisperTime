package com.floralwhisper.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.floralwhisper.audit.AuditPayloadSanitizer;
import com.floralwhisper.common.ApiException;
import com.floralwhisper.dto.OperationLogDetailResponse;
import com.floralwhisper.dto.OperationLogResponse;
import com.floralwhisper.dto.PaginatedResult;
import com.floralwhisper.entity.OperationLog;
import com.floralwhisper.mapper.OperationLogMapper;
import java.util.List;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class OperationLogQueryService {
  private static final Set<String> RESTORABLE_TARGET_TYPES = Set.of(
      "FLOWER",
      "SITE_CONFIG",
      "ABOUT_PAGE",
      "ABOUT_TIMELINE",
      "TEAM_MEMBER",
      "CONTACT",
      "AI_SETTINGS");

  private final OperationLogMapper operationLogMapper;
  private final AuditPayloadSanitizer auditPayloadSanitizer;

  public OperationLogQueryService(OperationLogMapper operationLogMapper, AuditPayloadSanitizer auditPayloadSanitizer) {
    this.operationLogMapper = operationLogMapper;
    this.auditPayloadSanitizer = auditPayloadSanitizer;
  }

  public PaginatedResult<OperationLogResponse> list(
      Integer page,
      Integer limit,
      String module,
      String action,
      String operatorName,
      Boolean success,
      String keyword) {
    int currentPage = page == null || page < 1 ? 1 : page;
    int pageSize = limit == null || limit < 1 ? 20 : limit;
    String normalizedKeyword = keyword == null ? "" : keyword.trim();

    LambdaQueryWrapper<OperationLog> query = new LambdaQueryWrapper<OperationLog>()
        .eq(module != null && !module.isBlank(), OperationLog::getModule, module == null ? null : module.trim())
        .eq(action != null && !action.isBlank(), OperationLog::getAction, action == null ? null : action.trim())
        .eq(operatorName != null && !operatorName.isBlank(), OperationLog::getOperatorName, operatorName == null ? null : operatorName.trim())
        .eq(success != null, OperationLog::getSuccess, success)
        .and(!normalizedKeyword.isBlank(), wrapper -> wrapper
            .like(OperationLog::getTargetId, normalizedKeyword)
            .or()
            .like(OperationLog::getRequestSummary, normalizedKeyword)
            .or()
            .like(OperationLog::getErrorMessage, normalizedKeyword))
        .orderByDesc(OperationLog::getCreatedAt)
        .orderByDesc(OperationLog::getId);

    List<OperationLog> all = operationLogMapper.selectList(query);
    int from = Math.min((currentPage - 1) * pageSize, all.size());
    int to = Math.min(from + pageSize, all.size());
    List<OperationLogResponse> items = all.subList(from, to).stream().map(this::toResponse).toList();
    return new PaginatedResult<>(items, all.size(), currentPage, pageSize);
  }

  public OperationLogDetailResponse getDetail(Long id) {
    OperationLog entity = operationLogMapper.selectById(id);
    if (entity == null) {
      throw new ApiException(HttpStatus.NOT_FOUND, "操作日志不存在");
    }
    OperationLogDetailResponse response = new OperationLogDetailResponse();
    response.setId(entity.getId());
    response.setModule(entity.getModule());
    response.setAction(entity.getAction());
    response.setTargetType(entity.getTargetType());
    response.setTargetId(entity.getTargetId());
    response.setOperatorName(entity.getOperatorName());
    response.setRequestSummary(auditPayloadSanitizer.sanitizeForDisplay(entity.getRequestSummary()));
    response.setBeforeSnapshot(auditPayloadSanitizer.sanitizeForDisplay(entity.getBeforeSnapshot()));
    response.setAfterSnapshot(auditPayloadSanitizer.sanitizeForDisplay(entity.getAfterSnapshot()));
    response.setSuccess(Boolean.TRUE.equals(entity.getSuccess()));
    response.setErrorMessage(entity.getErrorMessage());
    response.setIpAddress(entity.getIpAddress());
    response.setUserAgent(entity.getUserAgent());
    response.setRestoredFromLogId(entity.getRestoredFromLogId());
    response.setRestorable(isRestorable(entity));
    response.setCreatedAt(entity.getCreatedAt());
    return response;
  }

  public boolean isRestorable(OperationLog entity) {
    return entity != null
        && Boolean.TRUE.equals(entity.getSuccess())
        && RESTORABLE_TARGET_TYPES.contains(entity.getTargetType())
        && !"RESTORE".equalsIgnoreCase(entity.getAction());
  }

  private OperationLogResponse toResponse(OperationLog entity) {
    OperationLogResponse response = new OperationLogResponse();
    response.setId(entity.getId());
    response.setModule(entity.getModule());
    response.setAction(entity.getAction());
    response.setTargetType(entity.getTargetType());
    response.setTargetId(entity.getTargetId());
    response.setOperatorName(entity.getOperatorName());
    response.setRequestSummary(auditPayloadSanitizer.sanitizeForDisplay(entity.getRequestSummary()));
    response.setSuccess(Boolean.TRUE.equals(entity.getSuccess()));
    response.setErrorMessage(entity.getErrorMessage());
    response.setIpAddress(entity.getIpAddress());
    response.setRestoredFromLogId(entity.getRestoredFromLogId());
    response.setRestorable(isRestorable(entity));
    response.setCreatedAt(entity.getCreatedAt());
    return response;
  }
}
