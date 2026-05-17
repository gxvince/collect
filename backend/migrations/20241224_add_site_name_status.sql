ALTER TABLE `sites`
  ADD COLUMN `site_name` VARCHAR(128) NOT NULL AFTER `site_id`,
  ADD COLUMN `site_status` VARCHAR(32) NOT NULL DEFAULT 'building' AFTER `site_name`,
  ADD KEY `idx_sites_status` (`site_status`);
