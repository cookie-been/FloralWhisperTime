CREATE TABLE admin_security_state (
  id BIGINT PRIMARY KEY,
  username VARCHAR(120) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  require_password_change BOOLEAN NOT NULL DEFAULT TRUE,
  password_changed_at DATETIME(3) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO admin_security_state (id, username, password_hash, require_password_change, password_changed_at)
VALUES (1, 'admin', '', TRUE, NULL);
