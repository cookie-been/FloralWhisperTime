package com.floralwhisper.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("flower_tags")
public class FlowerTag {
  @TableId(type = IdType.AUTO)
  private Long id;
  private String flowerId;
  private String tag;
  private Integer sort;
}

