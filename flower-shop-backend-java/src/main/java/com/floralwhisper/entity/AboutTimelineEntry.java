package com.floralwhisper.entity;

import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("about_timeline_entries")
public class AboutTimelineEntry {
  @TableId
  private String id;
  private String yearLabel;
  private String content;
  private Integer sort;
}
