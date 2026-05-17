package com.floralwhisper.dto;

import java.math.BigDecimal;
import java.util.List;
import lombok.Data;

@Data
public class FlowerResponse {
  private String id;
  private String name;
  private String categoryId;
  private List<String> images;
  private BigDecimal price;
  private String description;
  private List<String> materials;
  private String meaning;
  private List<String> tags;
  private Boolean featured;
  private Integer sort;
  private String createdAt;
  private Boolean deleted;
}
