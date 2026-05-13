package com.floralwhisper.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("brand_story_images")
public class BrandStoryImage {
  @TableId(type = IdType.AUTO)
  private Long id;
  private String imageUrl;
  private Integer sort;
}

