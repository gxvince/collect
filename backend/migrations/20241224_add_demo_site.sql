ALTER TABLE `sites`
  ADD COLUMN `demo_site` VARCHAR(64) NULL AFTER `wp_password`,
  ADD KEY `idx_sites_demo_site` (`demo_site`);
