ALTER TABLE flowers
  ADD COLUMN code VARCHAR(64) NULL AFTER id,
  ADD UNIQUE INDEX uk_flowers_code (code);

UPDATE flowers target
JOIN (
  SELECT
    id,
    CONCAT(
      'HW-',
      DATE_FORMAT(created_at, '%Y%m%d'),
      '-',
      LPAD(
        ROW_NUMBER() OVER (
          PARTITION BY DATE_FORMAT(created_at, '%Y%m%d')
          ORDER BY created_at, sort DESC, id
        ),
        3,
        '0'
      )
    ) AS generated_code
  FROM flowers
) source ON source.id = target.id
SET target.code = source.generated_code
WHERE target.code IS NULL OR TRIM(target.code) = '';

ALTER TABLE flowers
  MODIFY COLUMN code VARCHAR(64) NOT NULL;
