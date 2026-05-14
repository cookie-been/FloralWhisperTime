package com.floralwhisper.dto;

import lombok.Data;

@Data
public class AboutTimelineEntryResponse {
  private String id;
  private String yearLabel;
  private String content;
  private Integer sort;
}
