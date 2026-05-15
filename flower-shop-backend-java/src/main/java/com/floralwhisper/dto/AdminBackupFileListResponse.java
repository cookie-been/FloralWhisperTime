package com.floralwhisper.dto;

import java.util.List;
import lombok.Data;

@Data
public class AdminBackupFileListResponse {
  private List<AdminBackupFileResponse> list;
  private long total;
}
