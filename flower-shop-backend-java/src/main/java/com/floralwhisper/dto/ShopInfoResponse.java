package com.floralwhisper.dto;

import java.math.BigDecimal;
import lombok.Data;

@Data
public class ShopInfoResponse {
  private String name;
  private String phone;
  private String wechat;
  private String address;
  private BigDecimal latitude;
  private BigDecimal longitude;
  private BusinessHoursResponse hours;
}

