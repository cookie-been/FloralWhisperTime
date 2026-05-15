package com.floralwhisper.dto;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class OperationLogResponse {
  private Long id;
  private String module;
  private String action;
  private String targetType;
  private String targetId;
  private String operatorName;
  private String requestSummary;
  private Boolean success;
  private String errorMessage;
  private String ipAddress;
  private Long restoredFromLogId;
  private Boolean restorable;
  private LocalDateTime createdAt;
}
