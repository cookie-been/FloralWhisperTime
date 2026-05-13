package com.floralwhisper.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.math.BigDecimal;
import lombok.Data;

@Data
@TableName("shop_info")
public class ShopInfo {
  @TableId
  private Long id;
  private String name;
  private String phone;
  private String wechat;
  private String address;
  private BigDecimal latitude;
  private BigDecimal longitude;
}

