CREATE TABLE categories (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(64) NOT NULL,
  description VARCHAR(255),
  sort INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE flowers (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  category_id VARCHAR(64) NOT NULL,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  description TEXT,
  meaning TEXT,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  sort INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL,
  INDEX idx_flowers_category (category_id),
  INDEX idx_flowers_sort (sort),
  INDEX idx_flowers_featured (featured),
  CONSTRAINT fk_flowers_category FOREIGN KEY (category_id) REFERENCES categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE flower_images (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  flower_id VARCHAR(100) NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  sort INT NOT NULL DEFAULT 0,
  INDEX idx_flower_images_flower (flower_id),
  CONSTRAINT fk_flower_images_flower FOREIGN KEY (flower_id) REFERENCES flowers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE flower_materials (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  flower_id VARCHAR(100) NOT NULL,
  material VARCHAR(100) NOT NULL,
  sort INT NOT NULL DEFAULT 0,
  INDEX idx_flower_materials_flower (flower_id),
  CONSTRAINT fk_flower_materials_flower FOREIGN KEY (flower_id) REFERENCES flowers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE flower_tags (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  flower_id VARCHAR(100) NOT NULL,
  tag VARCHAR(100) NOT NULL,
  sort INT NOT NULL DEFAULT 0,
  INDEX idx_flower_tags_flower (flower_id),
  INDEX idx_flower_tags_tag (tag),
  CONSTRAINT fk_flower_tags_flower FOREIGN KEY (flower_id) REFERENCES flowers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE shop_info (
  id BIGINT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(60) NOT NULL,
  wechat VARCHAR(120),
  address VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 6) NOT NULL DEFAULT 0,
  longitude DECIMAL(10, 6) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE shop_hours (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  weekday VARCHAR(20) NOT NULL,
  open_time VARCHAR(10) NOT NULL,
  close_time VARCHAR(10) NOT NULL,
  off BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE KEY uk_shop_hours_weekday (weekday)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE brand_story (
  id BIGINT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  subtitle VARCHAR(255),
  content TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE brand_story_images (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  image_url VARCHAR(500) NOT NULL,
  sort INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE team_members (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  title VARCHAR(120) NOT NULL,
  avatar VARCHAR(500) NOT NULL,
  bio VARCHAR(500),
  sort INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE contacts (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(60) NOT NULL,
  message TEXT NOT NULL,
  created_at DATETIME(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE site_config (
  id BIGINT PRIMARY KEY,
  brand_name VARCHAR(120) NOT NULL,
  hero_eyebrow VARCHAR(120),
  hero_title VARCHAR(160) NOT NULL,
  hero_description TEXT,
  hero_image VARCHAR(500),
  primary_cta_text VARCHAR(80),
  secondary_cta_text VARCHAR(80),
  contact_intro TEXT,
  business_hours_text VARCHAR(200),
  footer_description TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE site_config_stats (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  value VARCHAR(60) NOT NULL,
  label VARCHAR(100) NOT NULL,
  sort INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

