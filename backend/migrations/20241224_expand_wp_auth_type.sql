ALTER TABLE `sites`
  MODIFY COLUMN `wp_auth_type` ENUM('basic','jwt','app_password','api_key') NOT NULL;
