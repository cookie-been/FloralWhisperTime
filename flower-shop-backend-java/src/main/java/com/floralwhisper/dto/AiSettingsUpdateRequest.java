package com.floralwhisper.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AiSettingsUpdateRequest {
  private Boolean enabled;

  @Size(max = 40, message = "AI 提供商名称不能超过 40 个字符")
  private String provider;

  @Size(max = 255, message = "AI 密钥不能超过 255 个字符")
  private String apiKey;

  @Size(max = 120, message = "AI 模型名称不能超过 120 个字符")
  private String model;

  @Size(max = 255, message = "AI 服务地址不能超过 255 个字符")
  private String baseUrl;

  @Size(max = 120, message = "AI 生成路径不能超过 120 个字符")
  private String generatePath;
}
