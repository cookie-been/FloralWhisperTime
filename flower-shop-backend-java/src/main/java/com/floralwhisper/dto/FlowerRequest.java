package com.floralwhisper.dto;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import lombok.Data;

@Data
public class FlowerRequest {
  private String id;
  @NotBlank(message = "花束名称不能为空")
  private String name;
  @NotBlank(message = "分类不能为空")
  private String categoryId;
  private List<String> images = new ArrayList<>();
  private BigDecimal price = BigDecimal.ZERO;
  private String description;
  private List<String> materials = new ArrayList<>();
  private String meaning;
  private List<String> tags = new ArrayList<>();
  private Boolean featured = false;
  private Integer sort = 0;
  private String createdAt;
}

