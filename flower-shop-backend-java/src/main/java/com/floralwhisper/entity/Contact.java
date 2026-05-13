package com.floralwhisper.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("contacts")
public class Contact {
  @TableId
  private String id;
  private String name;
  private String phone;
  private String message;
  private LocalDateTime createdAt;
}
