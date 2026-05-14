ALTER TABLE ai_settings
  ADD COLUMN size VARCHAR(40) NOT NULL DEFAULT '1920x1920';

UPDATE ai_settings
SET provider = 'volcengine',
    model = 'doubao-seedream-5-0-260128',
    base_url = 'https://ark.cn-beijing.volces.com/api/v3',
    generate_path = '/images/generations',
    size = '1920x1920'
WHERE id = 1;
