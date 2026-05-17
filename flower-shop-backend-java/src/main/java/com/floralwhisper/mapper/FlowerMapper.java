package com.floralwhisper.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.floralwhisper.entity.Flower;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface FlowerMapper extends BaseMapper<Flower> {
  @Select("SELECT id, name, category_id, price, description, meaning, featured, sort, created_at, deleted FROM flowers WHERE id = #{id}")
  Flower selectByIdIncludingDeleted(String id);

  @Update("UPDATE flowers SET deleted = 0 WHERE id = #{id}")
  int restoreDeletedById(String id);
}
