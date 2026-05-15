package com.floralwhisper.audit;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class AuditContext {
  String operatorName;
  String ipAddress;
  String userAgent;
  String requestPath;
  String requestMethod;
}
