package com.floralwhisper.dto;

import java.util.List;
import lombok.Data;

@Data
public class BrandStoryResponse {
  private String title;
  private String subtitle;
  private String content;
  private List<String> images;
}

