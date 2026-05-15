package com.floralwhisper.dto;

import java.util.List;
import lombok.Data;

@Data
public class AdminOpsTaskListResponse {
  private List<AdminOpsTaskResponse> list;
  private long total;
}
