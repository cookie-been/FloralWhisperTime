package com.floralwhisper.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("operation_logs")
public class OperationLog {
  @TableId(type = IdType.AUTO)
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
  private LocalDateTime createdAt;
}
