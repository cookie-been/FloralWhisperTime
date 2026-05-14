ALTER TABLE contacts
  ADD COLUMN read_at DATETIME(3) NULL AFTER created_at,
  ADD INDEX idx_contacts_read_at (read_at);
