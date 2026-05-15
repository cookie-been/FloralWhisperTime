package com.floralwhisper.dto;

import lombok.Data;

@Data
public class OperationLogArchiveFileResponse {
  private String filename;
  private String path;
  private String modifiedAt;
  private String size;
  private String downloadUrl;
}
