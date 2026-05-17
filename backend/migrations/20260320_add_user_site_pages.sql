CREATE TABLE IF NOT EXISTS `user_site_pages` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `site_id` VARCHAR(64) NOT NULL,
  `page_id` BIGINT UNSIGNED NOT NULL,
  `allow` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_site_pages_user_site_page` (`user_id`,`site_id`,`page_id`),
  KEY `idx_user_site_pages_user_site` (`user_id`,`site_id`),
  KEY `idx_user_site_pages_site_page` (`site_id`,`page_id`),
  CONSTRAINT `fk_user_site_pages_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
