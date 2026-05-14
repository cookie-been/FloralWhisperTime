CREATE TABLE ai_settings (
  id BIGINT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  provider VARCHAR(40) NOT NULL DEFAULT 'volcengine',
  api_key VARCHAR(255),
  model VARCHAR(120) NOT NULL DEFAULT 'Doubao-Seedream-5.0-lite',
  base_url VARCHAR(255) NOT NULL DEFAULT 'https://operator.las.cn-beijing.volces.com/api/v1',
  generate_path VARCHAR(120) NOT NULL DEFAULT '/images/generations'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO ai_settings (id, enabled, provider, api_key, model, base_url, generate_path)
VALUES (1, FALSE, 'volcengine', NULL, 'Doubao-Seedream-5.0-lite', 'https://operator.las.cn-beijing.volces.com/api/v1', '/images/generations');
