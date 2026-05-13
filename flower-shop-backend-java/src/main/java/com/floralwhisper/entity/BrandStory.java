package com.floralwhisper.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("brand_story")
public class BrandStory {
  @TableId
  private Long id;
  private String title;
  private String subtitle;
  private String content;
}

