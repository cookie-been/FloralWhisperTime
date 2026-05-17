package com.floralwhisper.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.floralwhisper.entity.Contact;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface ContactMapper extends BaseMapper<Contact> {
  @Select("SELECT id, name, phone, message, created_at, read_at, deleted FROM contacts WHERE id = #{id}")
  Contact selectByIdIncludingDeleted(String id);

  @Update("UPDATE contacts SET deleted = 0 WHERE id = #{id}")
  int restoreDeletedById(String id);
}
