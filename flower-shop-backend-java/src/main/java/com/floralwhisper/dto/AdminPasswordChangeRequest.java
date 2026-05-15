package com.floralwhisper.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AdminPasswordChangeRequest {
  @NotBlank(message = "请输入当前密码")
  private String currentPassword;

  @NotBlank(message = "请输入新密码")
  @Size(min = 8, max = 120, message = "新密码长度需为 8 到 120 个字符")
  private String newPassword;
}
