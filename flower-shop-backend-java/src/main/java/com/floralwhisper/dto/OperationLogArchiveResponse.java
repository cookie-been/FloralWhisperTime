package com.floralwhisper.dto;

import lombok.Data;

@Data
public class OperationLogArchiveResponse {
  private int archivedCount;
  private String archiveFilename;
  private String archivePath;
  private String archiveBefore;
}
