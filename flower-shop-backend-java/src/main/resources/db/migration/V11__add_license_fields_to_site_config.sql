ALTER TABLE site_config
  ADD COLUMN license_customer_name VARCHAR(120) NULL,
  ADD COLUMN license_code VARCHAR(120) NULL,
  ADD COLUMN license_type VARCHAR(60) NULL,
  ADD COLUMN license_expires_at DATETIME(3) NULL,
  ADD COLUMN license_warning_days INT NOT NULL DEFAULT 30,
  ADD COLUMN license_notes VARCHAR(500) NULL;
