package com.floralwhisper.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class PaginatedResult<T> {
  private List<T> list;
  private long total;
  private int page;
  private int limit;
}

