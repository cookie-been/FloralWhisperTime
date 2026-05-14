package com.floralwhisper.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiFlowerSuggestionResponse {
  private String name;
  private String categoryId;
  private String description;
  private List<String> materials;
  private List<String> tags;
  private String meaning;
}
