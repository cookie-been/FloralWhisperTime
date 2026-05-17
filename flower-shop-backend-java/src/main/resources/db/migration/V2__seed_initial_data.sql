INSERT INTO categories (id, name, icon, description, sort) VALUES
('all', '全部', 'leaf', '花语时光全部作品', 999),
('wedding', '婚礼系列', 'rings', '仪式感与浪漫并存', 100),
('daily', '日常花礼', 'gift', '适合生日、探望与日常惊喜', 90),
('opening', '开业花篮', 'store', '明亮体面的商务花礼', 80),
('seasonal', '节气花束', 'sun', '顺应季节的自然花材', 70),
('custom', '定制花艺', 'scissors', '空间、宴会与专属主题定制', 60),
('preserved', '永生花系列', 'sparkles', '长久保存的温柔纪念', 50);

INSERT INTO flowers (id, name, category_id, price, description, meaning, featured, sort, created_at) VALUES
('wedding_001', '永恒之约', 'wedding', 899, '以白玫瑰与淡紫绣球构成层次，适合户外婚礼、求婚和纪念日。', '象征纯洁的爱情与长久承诺。', TRUE, 100, '2026-01-15 10:00:00.000'),
('daily_001', '晨光奶油', 'daily', 268, '奶油色玫瑰搭配洋桔梗，柔和明亮，是日常表达心意的轻盈选择。', '把平凡一天变成值得收藏的片刻。', TRUE, 95, '2026-02-03 10:00:00.000'),
('opening_001', '绿野启程', 'opening', 688, '绿色系叶材和跳色花材组合，适合新店开业、品牌活动和展厅布置。', '寓意生长、繁盛与新的开始。', TRUE, 88, '2026-02-14 10:00:00.000'),
('seasonal_001', '春日来信', 'seasonal', 328, '以郁金香、风信子和小苍兰表现春天的轻盈气息。', '适合把春天和问候一起送达。', FALSE, 78, '2026-03-01 10:00:00.000');

INSERT INTO flower_images (flower_id, image_url, sort) VALUES
('wedding_001', 'https://picsum.photos/seed/wedding-rose-1/900/1100', 0),
('wedding_001', 'https://picsum.photos/seed/wedding-rose-2/900/1100', 1),
('wedding_001', 'https://picsum.photos/seed/wedding-rose-3/900/1100', 2),
('daily_001', 'https://picsum.photos/seed/daily-cream-1/900/1100', 0),
('daily_001', 'https://picsum.photos/seed/daily-cream-2/900/1100', 1),
('opening_001', 'https://picsum.photos/seed/opening-green-1/900/1100', 0),
('opening_001', 'https://picsum.photos/seed/opening-green-2/900/1100', 1),
('seasonal_001', 'https://picsum.photos/seed/spring-letter-1/900/1100', 0),
('seasonal_001', 'https://picsum.photos/seed/spring-letter-2/900/1100', 1);

INSERT INTO flower_materials (flower_id, material, sort) VALUES
('wedding_001', '白玫瑰', 0),
('wedding_001', '绣球', 1),
('wedding_001', '尤加利叶', 2),
('wedding_001', '满天星', 3),
('daily_001', '奶油玫瑰', 0),
('daily_001', '洋桔梗', 1),
('daily_001', '小菊', 2),
('daily_001', '银叶菊', 3),
('opening_001', '向日葵', 0),
('opening_001', '跳舞兰', 1),
('opening_001', '龟背竹', 2),
('opening_001', '散尾葵', 3),
('seasonal_001', '郁金香', 0),
('seasonal_001', '风信子', 1),
('seasonal_001', '小苍兰', 2),
('seasonal_001', '蕾丝花', 3);

INSERT INTO flower_tags (flower_id, tag, sort) VALUES
('wedding_001', '婚礼', 0),
('wedding_001', '白色系', 1),
('wedding_001', '清新', 2),
('wedding_001', '户外', 3),
('daily_001', '生日', 0),
('daily_001', '奶油色', 1),
('daily_001', '温柔', 2),
('opening_001', '开业', 0),
('opening_001', '商务', 1),
('opening_001', '绿色系', 2),
('seasonal_001', '节气', 0),
('seasonal_001', '春日', 1),
('seasonal_001', '浅色系', 2);

INSERT INTO shop_info (id, name, phone, wechat, address, latitude, longitude) VALUES
(1, '花语时光', '021-6688-5200', 'FloralWhisperTime', '上海市徐汇区衡山路 88 号 1 层', 31.204700, 121.444200);

INSERT INTO shop_hours (weekday, open_time, close_time, off) VALUES
('monday', '09:30', '21:00', FALSE),
('tuesday', '09:30', '21:00', FALSE),
('wednesday', '09:30', '21:00', FALSE),
('thursday', '09:30', '21:00', FALSE),
('friday', '09:30', '21:30', FALSE),
('saturday', '10:00', '21:30', FALSE),
('sunday', '10:00', '20:30', FALSE);

INSERT INTO brand_story (id, title, subtitle, content) VALUES
(1, '让花束像一封慢慢抵达的信', '花语时光相信，每一束花都应该有清楚的情绪和自然的呼吸。', '我们从季节花材出发，为婚礼、日常赠礼、商业空间和私人宴会设计花艺。店铺坚持少量精选、手工制作，用克制的色彩和舒展的结构表达真诚心意。');

INSERT INTO brand_story_images (image_url, sort) VALUES
('https://picsum.photos/seed/shop-front/1200/800', 0),
('https://picsum.photos/seed/florist-table/1200/800', 1);

INSERT INTO team_members (id, name, title, avatar, bio, sort) VALUES
('tang', '唐予安', '主理人 / 花艺设计师', 'https://picsum.photos/seed/florist-tang/600/600', '擅长自然系婚礼花艺和空间花艺，偏爱低饱和配色。', 100),
('lin', '林向晚', '花束设计师', 'https://picsum.photos/seed/florist-lin/600/600', '负责日常花礼与节气花束，让小束花也拥有完整的故事。', 90);

INSERT INTO site_config (
  id,
  brand_name,
  hero_eyebrow,
  hero_title,
  hero_description,
  hero_image,
  primary_cta_text,
  secondary_cta_text,
  contact_intro,
  business_hours_text,
  footer_description
) VALUES (
  1,
  '花语时光',
  '清新文艺 · 自然温暖',
  '花语时光',
  '用季节花材和克制色彩，制作适合婚礼、日常赠礼与空间陈列的鲜花作品。',
  'https://picsum.photos/seed/floral-hero/1920/1080',
  '浏览作品',
  '联系门店',
  '欢迎预约花束、婚礼花艺、商业空间花艺和节日定制服务。',
  '周一至周五 09:30-21:00，周末 10:00-21:30',
  '纯展示型鲜花店窗口，展示婚礼、日常花礼、开业花篮、节气花束与定制花艺。'
);

INSERT INTO site_config_stats (value, label, sort) VALUES
('860+', '已服务客户', 0),
('320+', '花艺作品', 1),
('6', '主题分类', 2);
