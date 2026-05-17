CREATE TABLE IF NOT EXISTS `demo_media_assets` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `demo` VARCHAR(64) NOT NULL,
  `page` VARCHAR(64) NOT NULL,
  `url` VARCHAR(512) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_demo_media_assets_demo_page` (`demo`,`page`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `site_page_configs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `site_id` VARCHAR(64) NOT NULL,
  `page_id` VARCHAR(64) NOT NULL,
  `materials_json` JSON NULL,
  `sizes_json` JSON NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_site_page_configs_site_page` (`site_id`,`page_id`),
  KEY `idx_site_page_configs_site` (`site_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
