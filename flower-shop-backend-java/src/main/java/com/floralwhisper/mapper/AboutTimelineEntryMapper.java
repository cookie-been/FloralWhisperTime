package com.floralwhisper.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.floralwhisper.entity.AboutTimelineEntry;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface AboutTimelineEntryMapper extends BaseMapper<AboutTimelineEntry> {
  @Select("SELECT id, year_label, content, sort, deleted FROM about_timeline_entries WHERE id = #{id}")
  AboutTimelineEntry selectByIdIncludingDeleted(String id);

  @Update("UPDATE about_timeline_entries SET deleted = 0 WHERE id = #{id}")
  int restoreDeletedById(String id);
}
