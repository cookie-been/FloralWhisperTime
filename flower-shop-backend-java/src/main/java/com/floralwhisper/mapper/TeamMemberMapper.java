package com.floralwhisper.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.floralwhisper.entity.TeamMember;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface TeamMemberMapper extends BaseMapper<TeamMember> {
  @Select("SELECT id, name, title, avatar, bio, sort, deleted FROM team_members WHERE id = #{id}")
  TeamMember selectByIdIncludingDeleted(String id);

  @Update("UPDATE team_members SET deleted = 0 WHERE id = #{id}")
  int restoreDeletedById(String id);
}
