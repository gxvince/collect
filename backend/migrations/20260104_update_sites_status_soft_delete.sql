ALTER TABLE `sites`
  ADD COLUMN `site_status_tmp` TINYINT(1) NOT NULL DEFAULT 0 AFTER `site_name`;

UPDATE `sites`
SET site_status_tmp = CASE
  WHEN CAST(site_status AS CHAR) IN ('online', '1') THEN 1
  ELSE 0
END;

ALTER TABLE `sites`
  DROP COLUMN `site_status`;

ALTER TABLE `sites`
  CHANGE `site_status_tmp` `site_status` TINYINT(1) NOT NULL DEFAULT 0;

ALTER TABLE `sites`
  ADD COLUMN `is_deleted` TINYINT(1) NOT NULL DEFAULT 0 AFTER `demo_site`;

ALTER TABLE `sites`
  ADD KEY `idx_sites_is_deleted` (`is_deleted`);
