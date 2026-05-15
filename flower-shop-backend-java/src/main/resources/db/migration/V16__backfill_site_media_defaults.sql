UPDATE site_config
SET
  brand_logo = COALESCE(brand_logo, ''),
  hero_slides_json = COALESCE(hero_slides_json, JSON_ARRAY()),
  admin_login_slides_json = COALESCE(admin_login_slides_json, JSON_ARRAY()),
  contact_images_json = COALESCE(contact_images_json, JSON_ARRAY()),
  license_warning_days = COALESCE(NULLIF(license_warning_days, 0), 30);
