DELETE FROM flower_tags
WHERE flower_id IN ('wedding_001', 'daily_001', 'opening_001', 'seasonal_001');

DELETE FROM flower_materials
WHERE flower_id IN ('wedding_001', 'daily_001', 'opening_001', 'seasonal_001');

DELETE FROM flower_images
WHERE flower_id IN ('wedding_001', 'daily_001', 'opening_001', 'seasonal_001');

DELETE FROM flowers
WHERE id IN ('wedding_001', 'daily_001', 'opening_001', 'seasonal_001');

DELETE FROM brand_story_images
WHERE image_url IN (
  'https://picsum.photos/seed/shop-front/1200/800',
  'https://picsum.photos/seed/florist-table/1200/800'
);

DELETE FROM team_members
WHERE id IN ('tang', 'lin', 'designer_01', 'designer_02');

DELETE FROM about_timeline_entries
WHERE id IN ('timeline_2021', 'timeline_2023', 'timeline_2026');

DELETE FROM shop_hours
WHERE weekday IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')
  AND (
    (weekday = 'monday' AND open_time = '09:30' AND close_time = '21:00' AND off = FALSE) OR
    (weekday = 'tuesday' AND open_time = '09:30' AND close_time = '21:00' AND off = FALSE) OR
    (weekday = 'wednesday' AND open_time = '09:30' AND close_time = '21:00' AND off = FALSE) OR
    (weekday = 'thursday' AND open_time = '09:30' AND close_time = '21:00' AND off = FALSE) OR
    (weekday = 'friday' AND open_time = '09:30' AND close_time = '21:30' AND off = FALSE) OR
    (weekday = 'saturday' AND open_time = '10:00' AND close_time = '21:30' AND off = FALSE) OR
    (weekday = 'sunday' AND open_time = '10:00' AND close_time = '20:30' AND off = FALSE)
  );

UPDATE shop_info
SET phone = '',
    wechat = '',
    address = '',
    latitude = 0,
    longitude = 0
WHERE id = 1
  AND name = '花语时光'
  AND phone = '021-6688-5200'
  AND wechat = 'FloralWhisperTime'
  AND address = '上海市徐汇区衡山路 88 号 1 层'
  AND latitude = 31.204700
  AND longitude = 121.444200;

UPDATE brand_story
SET title = '',
    subtitle = '',
    content = ''
WHERE id = 1
  AND title = '让花束像一封慢慢抵达的信'
  AND subtitle = '花语时光相信，每一束花都应该有清楚的情绪和自然的呼吸。'
  AND content = '我们从季节花材出发，为婚礼、日常赠礼、商业空间和私人宴会设计花艺。店铺坚持少量精选、手工制作，用克制的色彩和舒展的结构表达真诚心意。';

UPDATE about_page
SET hero_image = '',
    hero_eyebrow = '',
    hero_title = '关于我们',
    hero_subtitle = '',
    story_title = '品牌故事',
    story_content = ''
WHERE id = 1
  AND hero_image = 'https://picsum.photos/seed/floral-about/1920/1080'
  AND hero_eyebrow = 'About Floral Whisper Time'
  AND hero_title = '让花束像一封慢慢抵达的信'
  AND hero_subtitle = '花语时光相信，每一束花都应该有清楚的情绪和自然的呼吸。'
  AND story_title = '品牌故事'
  AND story_content = '我们从季节花材出发，为婚礼、日常赠礼、商业空间和私人宴会设计花艺。店铺坚持少量精选、手工制作，用克制的色彩和舒展的结构表达真诚心意。';

UPDATE site_config
SET hero_eyebrow = '',
    hero_description = '',
    hero_image = '',
    contact_intro = '',
    business_hours_text = '',
    footer_description = ''
WHERE id = 1
  AND brand_name = '花语时光'
  AND hero_eyebrow = '清新文艺 · 自然温暖'
  AND hero_title = '花语时光'
  AND hero_description = '用季节花材和克制色彩，制作适合婚礼、日常赠礼与空间陈列的鲜花作品。'
  AND hero_image = 'https://picsum.photos/seed/floral-hero/1920/1080'
  AND primary_cta_text = '浏览作品'
  AND secondary_cta_text = '联系门店'
  AND contact_intro = '欢迎预约花束、婚礼花艺、商业空间花艺和节日定制服务。'
  AND business_hours_text = '周一至周五 09:30-21:00，周末 10:00-21:30'
  AND footer_description = '纯展示型鲜花店窗口，展示婚礼、日常花礼、开业花篮、节气花束与定制花艺。';
