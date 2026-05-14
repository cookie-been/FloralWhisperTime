package com.floralwhisper.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class TeamMemberRequest {
  @Size(max = 64, message = "团队成员编号不能超过 64 个字符")
  private String id;
  @NotBlank(message = "请输入团队成员姓名")
  @Size(max = 80, message = "团队成员姓名不能超过 80 个字符")
  private String name;
  @NotBlank(message = "请输入团队成员职务")
  @Size(max = 120, message = "团队成员职务不能超过 120 个字符")
  private String title;
  @NotBlank(message = "请上传团队成员头像")
  @Size(max = 1024, message = "团队成员头像地址不能超过 1024 个字符")
  private String avatar;
  @Size(max = 2000, message = "团队成员简介不能超过 2000 个字符")
  private String bio;
  private Integer sort;
}
