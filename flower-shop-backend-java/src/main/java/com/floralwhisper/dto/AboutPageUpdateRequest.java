package com.floralwhisper.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AboutPageUpdateRequest {
  @Size(max = 1024, message = "关于页首图地址不能超过 1024 个字符")
  private String heroImage;
  @Size(max = 120, message = "关于页小标语不能超过 120 个字符")
  private String heroEyebrow;
  @Size(max = 120, message = "关于页标题不能超过 120 个字符")
  private String heroTitle;
  @Size(max = 300, message = "关于页副标题不能超过 300 个字符")
  private String heroSubtitle;
  @Size(max = 120, message = "故事标题不能超过 120 个字符")
  private String storyTitle;
  @Size(max = 4000, message = "故事正文不能超过 4000 个字符")
  private String storyContent;
}
