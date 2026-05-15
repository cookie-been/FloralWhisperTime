package com.floralwhisper.dto;

import lombok.Data;

@Data
public class AdminBackupFileResponse {
  private String backupName;
  private String path;
  private String modifiedAt;
  private String size;
  private String downloadUrl;
  private boolean latest;
}
