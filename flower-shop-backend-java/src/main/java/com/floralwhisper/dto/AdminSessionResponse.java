package com.floralwhisper.dto;

import lombok.Data;

@Data
public class AdminSessionResponse {
  private String username;
  private boolean requirePasswordChange;
  private String passwordChangedAt;
}
