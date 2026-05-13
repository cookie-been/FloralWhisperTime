package com.floralwhisper.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("categories")
public class Category {
  @TableId
  private String id;
  private String name;
  private String icon;
  private String description;
  private Integer sort;
}

