ALTER TABLE flowers
  ADD COLUMN deleted TINYINT NOT NULL DEFAULT 0 AFTER created_at,
  ADD INDEX idx_flowers_deleted (deleted);

ALTER TABLE contacts
  ADD COLUMN deleted TINYINT NOT NULL DEFAULT 0 AFTER read_at,
  ADD INDEX idx_contacts_deleted (deleted);

ALTER TABLE about_timeline_entries
  ADD COLUMN deleted TINYINT NOT NULL DEFAULT 0 AFTER sort,
  ADD INDEX idx_about_timeline_entries_deleted (deleted);

ALTER TABLE team_members
  ADD COLUMN deleted TINYINT NOT NULL DEFAULT 0 AFTER sort,
  ADD INDEX idx_team_members_deleted (deleted);
