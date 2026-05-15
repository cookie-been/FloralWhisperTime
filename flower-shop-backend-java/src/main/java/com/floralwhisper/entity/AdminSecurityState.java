package com.floralwhisper.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("admin_security_state")
public class AdminSecurityState {
  @TableId
  private Long id;
  private String username;
  private String passwordHash;
  private Boolean requirePasswordChange;
  private LocalDateTime passwordChangedAt;
}
