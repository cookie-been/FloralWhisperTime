package com.floralwhisper.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AboutTimelineEntryRequest {
  @Size(max = 64, message = "时间轴编号不能超过 64 个字符")
  private String id;
  @NotBlank(message = "请输入时间轴年份")
  @Size(max = 64, message = "时间轴年份不能超过 64 个字符")
  private String yearLabel;
  @NotBlank(message = "请输入时间轴内容")
  @Size(max = 1024, message = "时间轴内容不能超过 1024 个字符")
  private String content;
  private Integer sort;
}
