ALTER TABLE site_config
  ADD COLUMN brand_logo VARCHAR(500) NULL AFTER footer_description,
  ADD COLUMN hero_slides_json JSON NULL AFTER brand_logo,
  ADD COLUMN admin_login_slides_json JSON NULL AFTER hero_slides_json,
  ADD COLUMN contact_images_json JSON NULL AFTER admin_login_slides_json;
