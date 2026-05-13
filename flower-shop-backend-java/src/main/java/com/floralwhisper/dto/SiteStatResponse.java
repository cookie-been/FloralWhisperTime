package com.floralwhisper.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SiteStatResponse {
  @Size(max = 20, message = "统计数值不能超过 20 个字符")
  private String value;
  @Size(max = 40, message = "统计说明不能超过 40 个字符")
  private String label;
}
