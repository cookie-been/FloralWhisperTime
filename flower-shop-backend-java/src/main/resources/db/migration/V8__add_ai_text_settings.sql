ALTER TABLE ai_settings
  ADD COLUMN text_model VARCHAR(120) NOT NULL DEFAULT 'doubao-1-5-pro-32k-250115',
  ADD COLUMN text_generate_path VARCHAR(120) NOT NULL DEFAULT '/chat/completions',
  ADD COLUMN text_temperature DOUBLE NOT NULL DEFAULT 0.4,
  ADD COLUMN text_max_tokens INT NOT NULL DEFAULT 1200;

UPDATE ai_settings
SET text_model = 'doubao-1-5-pro-32k-250115',
    text_generate_path = '/chat/completions',
    text_temperature = 0.4,
    text_max_tokens = 1200
WHERE id = 1;
