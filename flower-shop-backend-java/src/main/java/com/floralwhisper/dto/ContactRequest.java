package com.floralwhisper.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ContactRequest {
  @NotBlank(message = "请填写姓名")
  private String name;
  @NotBlank(message = "请填写电话")
  private String phone;
  @NotBlank(message = "请填写留言内容")
  private String message;
}

