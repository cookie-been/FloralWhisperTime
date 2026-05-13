package com.floralwhisper.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("shop_hours")
public class ShopHour {
  @TableId(type = IdType.AUTO)
  private Long id;
  private String weekday;
  private String openTime;
  private String closeTime;
  private Boolean off;
}

