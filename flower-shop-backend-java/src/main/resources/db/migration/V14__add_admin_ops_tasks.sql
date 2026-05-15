CREATE TABLE admin_ops_tasks (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    task_type VARCHAR(64) NOT NULL,
    task_label VARCHAR(128) NOT NULL,
    status VARCHAR(32) NOT NULL,
    trigger_source VARCHAR(32) NOT NULL,
    operator_name VARCHAR(128) NOT NULL,
    request_payload LONGTEXT NULL,
    result_summary LONGTEXT NULL,
    log_excerpt LONGTEXT NULL,
    error_message VARCHAR(500) NULL,
    started_at DATETIME NOT NULL,
    finished_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_admin_ops_tasks_created_at (created_at DESC),
    INDEX idx_admin_ops_tasks_type (task_type),
    INDEX idx_admin_ops_tasks_status (status)
);
