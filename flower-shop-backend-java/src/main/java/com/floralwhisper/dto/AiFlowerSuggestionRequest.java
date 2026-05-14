package com.floralwhisper.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AiFlowerSuggestionRequest {
  @Size(max = 4000, message = "生成提示词不能超过 4000 个字符")
  private String prompt;

  @Size(max = 500, message = "图片地址不能超过 500 个字符")
  private String imageUrl;

  @Size(max = 40, message = "生成模式不能超过 40 个字符")
  private String mode;
}
