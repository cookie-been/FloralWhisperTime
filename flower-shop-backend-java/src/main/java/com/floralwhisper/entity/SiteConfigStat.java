package com.floralwhisper.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("site_config_stats")
public class SiteConfigStat {
  @TableId(type = IdType.AUTO)
  private Long id;
  private String value;
  private String label;
  private Integer sort;
}

