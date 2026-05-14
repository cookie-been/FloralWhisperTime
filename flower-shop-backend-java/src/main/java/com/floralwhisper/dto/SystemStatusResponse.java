package com.floralwhisper.dto;

import lombok.Data;

@Data
public class SystemStatusResponse {
  private String service;
  private String version;
  private boolean databaseConnected;
  private boolean uploadDirectoryReady;
  private String uploadDirectoryPath;
  private long uploadFileCount;
  private boolean aiEnabled;
  private boolean aiKeyConfigured;
  private String aiProvider;
  private String aiImageModel;
  private String aiTextModel;
  private String latestBackupName;
  private String latestBackupPath;
  private boolean latestBackupPresent;
}
