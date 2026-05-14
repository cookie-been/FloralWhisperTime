package com.floralwhisper.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("about_page")
public class AboutPage {
  @TableId
  private Long id;
  private String heroImage;
  private String heroEyebrow;
  private String heroTitle;
  private String heroSubtitle;
  private String storyTitle;
  private String storyContent;
}
