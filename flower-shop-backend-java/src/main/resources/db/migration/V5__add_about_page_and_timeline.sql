CREATE TABLE about_page (
  id BIGINT NOT NULL PRIMARY KEY,
  hero_image VARCHAR(1024) NOT NULL,
  hero_eyebrow VARCHAR(255) NOT NULL,
  hero_title VARCHAR(255) NOT NULL,
  hero_subtitle VARCHAR(1024) NOT NULL,
  story_title VARCHAR(255) NOT NULL,
  story_content TEXT NOT NULL
);

CREATE TABLE about_timeline_entries (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  year_label VARCHAR(64) NOT NULL,
  content VARCHAR(1024) NOT NULL,
  sort INT NOT NULL DEFAULT 0,
  INDEX idx_about_timeline_sort (sort)
);
