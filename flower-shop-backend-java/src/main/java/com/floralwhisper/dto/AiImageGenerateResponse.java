package com.floralwhisper.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AiImageGenerateResponse {
  private boolean success;
  private String imageUrl;
  private String source;
  private String mode;
}
