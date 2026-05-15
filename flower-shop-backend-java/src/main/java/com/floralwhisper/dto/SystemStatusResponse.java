package com.floralwhisper.dto;

import com.floralwhisper.protection.ProtectionSnapshot;
import lombok.Data;

@Data
public class SystemStatusResponse {
  private String service;
  private String version;
  private String deploymentEnvironment;
  private String gitRevision;
  private String buildTime;
  private String deployedAt;
  private String licenseCustomerName;
  private String licenseCode;
  private String licenseType;
  private String licenseExpiresAt;
  private int licenseWarningDays;
  private String licenseNotes;
  private String licenseStatus;
  private String licenseStatusLabel;
  private boolean databaseConnected;
  private String databaseVersion;
  private String databaseSize;
  private String diskTotal;
  private String diskUsable;
  private String diskUsageRate;
  private boolean uploadDirectoryReady;
  private String uploadDirectoryPath;
  private long uploadFileCount;
  private String uploadDirectorySize;
  private String uptimeLabel;
  private boolean aiEnabled;
  private boolean aiKeyConfigured;
  private String aiProvider;
  private String aiImageModel;
  private String aiTextModel;
  private String latestBackupName;
  private String latestBackupPath;
  private String latestBackupModifiedAt;
  private String latestBackupDownloadUrl;
  private boolean latestBackupPresent;
  private long operationLogCount;
  private int operationLogRetentionDays;
  private String operationLogArchiveBefore;
  private ProtectionSnapshot protection;
}
