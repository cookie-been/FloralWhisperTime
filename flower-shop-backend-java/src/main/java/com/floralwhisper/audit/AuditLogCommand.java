package com.floralwhisper.audit;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class AuditLogCommand {
  String module;
  String action;
  String targetType;
  String targetId;
  String operatorName;
  Object requestSummary;
  Object beforeSnapshot;
  Object afterSnapshot;
  Boolean success;
  String errorMessage;
  Long restoredFromLogId;
}
