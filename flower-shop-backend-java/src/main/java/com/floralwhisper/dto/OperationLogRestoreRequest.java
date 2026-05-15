package com.floralwhisper.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class OperationLogRestoreRequest {
  @NotBlank(message = "请填写恢复原因")
  private String reason;
}
