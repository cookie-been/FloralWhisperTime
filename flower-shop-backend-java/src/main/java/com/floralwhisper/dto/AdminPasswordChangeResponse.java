package com.floralwhisper.dto;

import lombok.Data;

@Data
public class AdminPasswordChangeResponse {
  private String username;
  private boolean requirePasswordChange;
  private String changedAt;
}
