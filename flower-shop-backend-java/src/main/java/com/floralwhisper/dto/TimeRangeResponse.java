package com.floralwhisper.dto;

import lombok.Data;

@Data
public class TimeRangeResponse {
  private String open;
  private String close;
  private Boolean off;
}

