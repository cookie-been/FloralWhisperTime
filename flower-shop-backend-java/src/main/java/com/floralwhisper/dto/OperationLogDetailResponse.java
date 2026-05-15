package com.floralwhisper.dto;

import java.time.LocalDateTime;
import java.util.List;
import lombok.Data;

@Data
public class OperationLogDetailResponse {
  private Long id;
  private String module;
  private String action;
  private String targetType;
  private String targetId;
  private String operatorName;
  private String requestSummary;
  private String beforeSnapshot;
  private String afterSnapshot;
  private Boolean success;
  private String errorMessage;
  private String ipAddress;
  private String userAgent;
  private Long restoredFromLogId;
  private Boolean restorable;
  private List<OperationLogResponse> relatedLogs;
  private LocalDateTime createdAt;
}
