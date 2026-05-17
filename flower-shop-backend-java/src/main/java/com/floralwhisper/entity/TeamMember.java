package com.floralwhisper.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("team_members")
public class TeamMember {
  @TableId
  private String id;
  private String name;
  private String title;
  private String avatar;
  private String bio;
  private Integer sort;
  @TableLogic
  private Integer deleted;
}
