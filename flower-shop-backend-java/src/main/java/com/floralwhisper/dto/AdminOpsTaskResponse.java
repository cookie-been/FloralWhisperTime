package com.floralwhisper.dto;

import lombok.Data;

@Data
public class AdminOpsTaskResponse {
  private Long id;
  private String taskType;
  private String taskLabel;
  private String status;
  private String triggerSource;
  private String operatorName;
  private String requestPayload;
  private String resultSummary;
  private String logExcerpt;
  private String errorMessage;
  private String startedAt;
  private String finishedAt;
  private String createdAt;
  private String updatedAt;
}
