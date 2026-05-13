ALTER TABLE flowers
  ADD INDEX idx_flowers_created_at (created_at),
  ADD INDEX idx_flowers_category_sort (category_id, sort),
  ADD INDEX idx_flowers_featured_sort (featured, sort);

ALTER TABLE categories
  ADD INDEX idx_categories_sort (sort);

ALTER TABLE flower_images
  ADD UNIQUE KEY uk_flower_images_flower_sort (flower_id, sort);

ALTER TABLE flower_materials
  ADD UNIQUE KEY uk_flower_materials_flower_sort (flower_id, sort);

ALTER TABLE flower_tags
  ADD UNIQUE KEY uk_flower_tags_flower_sort (flower_id, sort),
  ADD INDEX idx_flower_tags_tag_flower (tag, flower_id);

ALTER TABLE site_config_stats
  ADD UNIQUE KEY uk_site_config_stats_sort (sort);

ALTER TABLE brand_story_images
  ADD UNIQUE KEY uk_brand_story_images_sort (sort);

ALTER TABLE team_members
  ADD INDEX idx_team_members_sort (sort);

ALTER TABLE contacts
  ADD INDEX idx_contacts_created_at (created_at);
