package com.floralwhisper.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("flowers")
public class Flower {
  @TableId
  private String id;
  private String name;
  private String categoryId;
  private BigDecimal price;
  private String description;
  private String meaning;
  private Boolean featured;
  private Integer sort;
  private LocalDateTime createdAt;
}
