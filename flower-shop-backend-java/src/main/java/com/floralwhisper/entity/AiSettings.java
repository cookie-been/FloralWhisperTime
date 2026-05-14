package com.floralwhisper.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("ai_settings")
public class AiSettings {
  @TableId
  private Long id;
  private Boolean enabled;
  private String provider;
  private String apiKey;
  private String model;
  private String baseUrl;
  private String generatePath;
  private String size;
  private String textModel;
  private String textGeneratePath;
  private Double textTemperature;
  private Integer textMaxTokens;
}
