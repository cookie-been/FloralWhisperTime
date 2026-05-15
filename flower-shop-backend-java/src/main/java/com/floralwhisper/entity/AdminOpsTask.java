package com.floralwhisper.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("admin_ops_tasks")
public class AdminOpsTask {
  @TableId(type = IdType.AUTO)
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
  private LocalDateTime startedAt;
  private LocalDateTime finishedAt;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
}
