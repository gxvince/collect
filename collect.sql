/*
 Navicat Premium Dump SQL

 Source Server         : localhost
 Source Server Type    : MySQL
 Source Server Version : 80041 (8.0.41)
 Source Host           : 127.0.0.1:3306
 Source Schema         : collect

 Target Server Type    : MySQL
 Target Server Version : 80041 (8.0.41)
 File Encoding         : 65001

 Date: 13/03/2026 18:27:47
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for files
-- ----------------------------
DROP TABLE IF EXISTS `files`;
CREATE TABLE `files` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `site_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `elementor_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_url` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `meta` json DEFAULT NULL,
  `created_by` bigint unsigned NOT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  KEY `idx_files_site_elementor` (`site_id`,`elementor_id`) USING BTREE,
  KEY `idx_files_created_by` (`created_by`) USING BTREE,
  KEY `idx_files_is_deleted` (`is_deleted`) USING BTREE,
  CONSTRAINT `fk_files_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- ----------------------------
-- Records of files
-- ----------------------------
BEGIN;
INSERT INTO `files` (`id`, `site_id`, `elementor_id`, `file_url`, `meta`, `created_by`, `is_deleted`, `created_at`) VALUES (1, 'site_6e8419425feb44a8bca9c610d896d010', '104', 'uploads/site_6e8419425feb44a8bca9c610d896d010/20260105/1767598696360_9yle3q.jpg', NULL, 1, 0, '2026-01-05 15:38:16');
INSERT INTO `files` (`id`, `site_id`, `elementor_id`, `file_url`, `meta`, `created_by`, `is_deleted`, `created_at`) VALUES (2, 'site_3904a69785b241f59b54cd517b6b4d4a', '112', 'uploads/site_3904a69785b241f59b54cd517b6b4d4a/20260312/1773310083515_ibgezo.png', NULL, 1, 0, '2026-03-12 18:08:03');
COMMIT;

-- ----------------------------
-- Table structure for refresh_tokens
-- ----------------------------
DROP TABLE IF EXISTS `refresh_tokens`;
CREATE TABLE `refresh_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `token_hash` char(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `revoked_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uk_refresh_tokens_hash` (`token_hash`) USING BTREE,
  KEY `idx_refresh_tokens_user` (`user_id`) USING BTREE,
  KEY `idx_refresh_tokens_expires` (`expires_at`) USING BTREE,
  CONSTRAINT `fk_refresh_tokens_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=222 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- ----------------------------
-- Records of refresh_tokens
-- ----------------------------
BEGIN;
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (1, 1, '2929130779829833c3100d7f4ff82e3c6f2961597cbf043d8edeb732eae33926', '2025-12-31 16:52:29', NULL, '2025-12-24 16:52:29');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (2, 1, '2ca792be456946a3b6f18cd5894b6e7412dc030c518c06d894c199f927df61df', '2025-12-31 16:52:33', NULL, '2025-12-24 16:52:33');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (3, 1, 'd36fe132ad8dbc26035fd162323ebd6e85f352881af161d11cde232742359f30', '2025-12-31 17:50:08', NULL, '2025-12-24 17:50:08');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (4, 1, '700599483b6e16e8db03cd3fca3cce28e03f6ad700c4050dbcfc2ac82c2d5978', '2025-12-31 17:52:55', NULL, '2025-12-24 17:52:55');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (5, 1, 'e7ea5d7137763c56b717b2b739b8cddecefdc23d9b5a1c984644de224e451f6d', '2025-12-31 17:53:44', NULL, '2025-12-24 17:53:44');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (6, 1, '881d211645523d36cd2c60c549b63fd0880a0d5ebc92603c8175f5cc90b774fb', '2025-12-31 17:53:46', NULL, '2025-12-24 17:53:46');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (7, 1, '2cda38d3badb9e0625e3d510b4f9b21dc64f2202e1a20d1c5e84f1389423ceba', '2025-12-31 17:53:47', NULL, '2025-12-24 17:53:47');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (8, 1, '776ba519a61f798b1e818ccd4d6d97adb0a1b82b918b4717e2fd208c00a30ee8', '2025-12-31 17:53:48', NULL, '2025-12-24 17:53:48');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (11, 1, '22bdc9d8b49662090b4b3a0f814a5d595cfba605d7bebd32fdfe00ce2d3349aa', '2025-12-31 17:53:49', NULL, '2025-12-24 17:53:49');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (13, 1, 'c62e7af83029c3ef300e8b039b3444c275c896bfeefd4667cae51b7c1d56f7bb', '2025-12-31 17:53:51', NULL, '2025-12-24 17:53:51');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (14, 1, '64cc0e21fbd124f9ae607c2001b2d6df3432c7592aecae74e5ab28c87c42bcb7', '2025-12-31 17:53:52', NULL, '2025-12-24 17:53:52');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (17, 1, '12c5071e6ef331ccbbab84db5b617423eb0e2a7a4ef1bbfd5df64efd149e622c', '2025-12-31 17:53:56', NULL, '2025-12-24 17:53:56');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (18, 1, '4953150aa361cadb5d4ea86225773c5cf8bd5a1e9b764f13d0e293307b6389bc', '2025-12-31 17:54:00', NULL, '2025-12-24 17:54:00');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (19, 1, '1bf131c4e0014519ebf967b9085a91d2bea2d7605e25b967373cbb681c5acfae', '2026-01-01 16:26:15', NULL, '2025-12-25 16:26:15');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (20, 1, 'f6bbd221bb43fbe3a0f03ef612669e567e0059ca91eeb4d2dd0c72ec308154d3', '2026-01-01 16:32:14', NULL, '2025-12-25 16:32:14');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (21, 1, 'fb2fcbce2188393f6842a53473d6a89b621c4d95df9e84b1bb543304b374e424', '2026-01-01 17:19:35', NULL, '2025-12-25 17:19:35');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (22, 3, 'f2324194d2db7197f0434c19429950d3bede8776a5c2ae53c32b0620c1ae4a6e', '2026-01-01 17:26:41', NULL, '2025-12-25 17:26:41');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (23, 3, '29d616229ae8dcbb202b13cce7b9821009de6b9c7fba24e6461c4a6c83320e0c', '2026-01-01 17:39:20', NULL, '2025-12-25 17:39:20');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (24, 1, 'e1a1dab59045f38d794d0c14a5e951aea8714008538868cc99b574918fb81745', '2026-01-01 17:48:40', NULL, '2025-12-25 17:48:40');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (25, 1, '4354563a88fd0ddefadf3b906ceb89a222185d3713d740d529dd971771c812e4', '2026-01-01 18:11:28', NULL, '2025-12-25 18:11:28');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (26, 3, '998640c270b2c3ebe6661ce94ab118a2b6c4773d1a5075e1c4c8c283531e1f13', '2026-01-01 18:16:34', NULL, '2025-12-25 18:16:34');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (27, 1, '701b3d48da0a7614ef5264cb632a9d1084ec51c717e8b957101abd023074e944', '2026-01-11 09:53:29', NULL, '2026-01-04 09:53:29');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (28, 1, '4398a7a28962fd93f29960484dd0f1395cf836a70d8562598ebb4033e38f0f43', '2026-01-12 10:54:43', NULL, '2026-01-05 10:54:43');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (29, 1, '134fc505bbcebf814e926c607ccedcf806f6cc77578799bd5f568e6634351bd4', '2026-01-12 11:19:18', NULL, '2026-01-05 11:19:18');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (30, 1, '81c2c559eb0c437a6f7f6f5db3e988941ac8b7041c38b524def7c2cf46e04ecb', '2026-01-12 11:19:28', NULL, '2026-01-05 11:19:28');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (31, 1, 'ca6e26eef0e1b8d8408aaba9da915bbc0b6c9305b332ea36b17f594b83ad21bb', '2026-01-12 12:11:24', NULL, '2026-01-05 12:11:24');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (32, 1, 'd5a4c21aa4e8a2b0c4ce9e9790b9a24952398051d6f76b56959b440b4b00eee5', '2026-01-12 12:16:19', NULL, '2026-01-05 12:16:19');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (33, 1, 'c35575993946e0e7bd6c808cd53b81bf459e6ef24a42589439e09cb36f6ab20d', '2026-01-12 12:19:09', NULL, '2026-01-05 12:19:09');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (34, 1, 'b5957bf639a9ea891b16e76464b22ce7dfa382d36a19e2bcd8f8e131b15f1d53', '2026-01-12 12:23:32', NULL, '2026-01-05 12:23:32');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (35, 1, 'cb915a311813ecc98f491fbddb90ff55a3d1b13e2bc234d509f45e9a8d37ef8b', '2026-01-12 12:26:03', NULL, '2026-01-05 12:26:03');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (36, 1, 'be09b564be58b3595f1ff45429b49847939fbbe6ee2229a1d3797588599b1d6f', '2026-01-12 14:36:21', NULL, '2026-01-05 14:36:21');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (37, 1, 'e420d9b5a1bf7f3c4f6aff870633c3df796968af6afa260edf517a8742f7235a', '2026-01-12 15:05:17', NULL, '2026-01-05 15:05:17');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (38, 1, 'c73547a75339e75246bba240a1b40540b94972fa536166106264d35883c78b31', '2026-01-12 15:15:15', NULL, '2026-01-05 15:15:15');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (39, 1, 'd75271ab0489bb519f22a00063f66fabe972415c6bcb32646eab81dfae75930f', '2026-01-12 15:18:02', NULL, '2026-01-05 15:18:02');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (40, 1, '03fdfabdfb85cce6145f78bf2a7074b2f3b405d4832d43e897df53f4199ae3d9', '2026-01-12 15:37:07', NULL, '2026-01-05 15:37:07');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (41, 1, 'c0a056f4587937b984dbc784f66829881a80857dddc8c2c23d3223fbc65f000d', '2026-01-12 15:37:08', NULL, '2026-01-05 15:37:08');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (42, 1, '84b2ae26c9ce0c2172ead3a9082d63e607f6b7ca2feb2d0e5144e99e16cd0e4f', '2026-01-21 14:43:07', NULL, '2026-01-14 14:43:07');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (43, 1, '0b679e515f6721adf7335c8ff156888c5ead887dd95755f79cb8438d9fbb542e', '2026-01-21 15:12:23', NULL, '2026-01-14 15:12:23');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (44, 1, '6e87504bc4934dfd8e9d9a92ee581ee31a1837e4e4f9f5ce154bc7545097f33a', '2026-01-21 17:40:51', NULL, '2026-01-14 17:40:51');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (45, 1, '18e9ad0f64ac4d8a9c465f26a0e8310969e2db0bf968b75e31cdea4280586afb', '2026-01-21 17:52:22', NULL, '2026-01-14 17:52:22');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (46, 1, '697a014c169a0d2471bc9ef7d400d2bd3447494b63ea1035c7d2653884461a7f', '2026-01-21 17:55:14', NULL, '2026-01-14 17:55:14');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (47, 1, '5f4a3b983d302f91fab9dd731dcbdf04d27cc611e1f75f0c3f26297326e75676', '2026-01-21 18:05:35', NULL, '2026-01-14 18:05:35');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (48, 1, 'da093bf31ab8007b78c21f6d02b393b0bb81e8636a149afa37195dc7e6e8d41c', '2026-01-21 18:07:16', NULL, '2026-01-14 18:07:16');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (49, 1, 'aec52b4843e673ca410282236e17aaa12697f9f35eabf5a5e54fc6e2f353d81a', '2026-01-21 18:09:40', NULL, '2026-01-14 18:09:40');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (50, 1, '4697dca368854842e2188ebaf5ba0838f0eff804404f5269feed3f851d412fa4', '2026-01-21 18:13:35', NULL, '2026-01-14 18:13:35');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (51, 1, '8deb6f0a8b1a28da5dd05186029c5248ce5d59e98f7aefb8901b83f2e0dd6819', '2026-01-21 19:57:03', NULL, '2026-01-14 19:57:03');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (52, 1, 'fb12513550a6ebfa406c926098dfa376aed1ecd3a1af774b40374625668efa5c', '2026-01-21 20:10:03', NULL, '2026-01-14 20:10:03');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (53, 1, 'c31c16ace964f0ab735bc2ba50f1260cff018b5a2687cfba7faae62932799340', '2026-01-21 22:09:57', NULL, '2026-01-14 22:09:57');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (54, 1, 'e54bf5ac4478f9fade252ac75f7c0b9cbffd829da097c9ac7ede017a426d127b', '2026-01-22 09:53:38', NULL, '2026-01-15 09:53:38');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (55, 1, '671bfb463e8a25e585d9a737a9c0aa33c838c417068afa6b568ed50b7922766a', '2026-01-22 18:43:01', NULL, '2026-01-15 18:43:01');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (56, 1, 'ce28f1510a9d16c5d86387076e278e514632b43cc71a24fa9195f26a51f36316', '2026-01-24 00:43:26', NULL, '2026-01-17 00:43:26');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (57, 1, '3e4a94b7d399188c8b598a661086e48efa31e5f04eb13b938ad66c0d1baa9399', '2026-01-24 00:45:52', NULL, '2026-01-17 00:45:52');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (58, 1, 'fe6c753a503db706327aae6291be646636070ef1217b698b782497b6272c390f', '2026-01-24 00:48:05', NULL, '2026-01-17 00:48:04');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (59, 1, '1f40245c0eb87c4852e7d560ae2a14751caf5c8084f51dc165113106a227c136', '2026-01-24 01:05:18', NULL, '2026-01-17 01:05:19');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (60, 1, '5e500b1a01f6af9b5109c46626d0548749113eccb73b53a703d148f8aa0c769f', '2026-01-24 01:45:39', NULL, '2026-01-17 01:45:39');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (61, 1, 'f794c1da1e6b09315920128d600fb3d4be80e2e4a1d0461002f4b3f02dd68924', '2026-01-26 09:49:37', NULL, '2026-01-19 09:49:34');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (62, 1, 'ad9932e73d1109e0bf632a1e3e96d52c3b34730309ce434a7e790fae79152680', '2026-01-26 09:55:13', NULL, '2026-01-19 09:55:10');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (63, 1, '366432426ce45b7325226bce63808dfdcaf79f4f5b214dfab2bf4830ace46982', '2026-01-26 09:55:44', NULL, '2026-01-19 09:55:41');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (64, 1, 'd015f33c168d81d63529733b35886b099d30cfdbb379dbb83b179e1ec988a84f', '2026-01-26 10:10:49', NULL, '2026-01-19 10:10:48');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (65, 1, '997a610c377864c7c7938172d951a3ba5baa64f24f3a553027ca24380db0be2e', '2026-01-26 12:01:08', NULL, '2026-01-19 12:01:06');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (66, 1, 'bd269273af66b081cc2e0cc31191d8290a4d509ccd3a79a5f48a67f5679b09fe', '2026-01-26 12:08:46', NULL, '2026-01-19 12:08:43');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (67, 1, '02de40b2f0fd10050c764ed3b0e3707e8908aa862b7b270b09a3069d196b5905', '2026-01-26 14:10:40', NULL, '2026-01-19 14:10:38');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (68, 1, '0981c01fb8e843505f5e7d1ddee3bf2de805bf4c55a2491a9c63f97fa24dd1f3', '2026-01-26 14:35:14', NULL, '2026-01-19 14:35:12');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (69, 1, '50590d6628f1a3c0e65f0fb996092eb473da5e392dc84d43d7e0401af97ec07e', '2026-01-26 14:36:58', NULL, '2026-01-19 14:36:55');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (70, 1, 'a70ac570d3d4b54b11b8013f112326f363cd284e45f0a0ee78da493a4ba0ba31', '2026-01-26 15:11:10', NULL, '2026-01-19 15:11:08');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (71, 1, 'a53cf5265571b50a637dd4d79d0c1efb260d9d7857b5f5893db625d7d373303f', '2026-01-26 15:13:21', NULL, '2026-01-19 15:13:19');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (72, 1, 'c3ffa13da5d6130a523f36302be407330f347e32ac0d78c81def58b52f6b0788', '2026-01-26 15:24:50', NULL, '2026-01-19 15:24:48');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (73, 1, 'e009068cfacf9eebac912a99913626913848743bf3d54f2c537ce68c7683efa2', '2026-01-27 10:18:24', NULL, '2026-01-20 10:18:24');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (74, 1, '3a18a53e56ab8ed23953af6b5a537c3b858771baf113edcd93dd921b7326279e', '2026-01-27 10:26:00', NULL, '2026-01-20 10:26:00');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (75, 1, '177e496a98f4eb730123adf5d27689ca7639f9997a6b1d42b08c93e11757047a', '2026-01-27 14:12:55', NULL, '2026-01-20 14:12:55');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (76, 1, '0b2c3f9692cf06d072b3dc31b211f7a15ec0e3df264c063b63c3cd18c593d96a', '2026-01-27 22:08:35', NULL, '2026-01-20 22:08:35');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (77, 1, '931a7038e8760f7a0c6db12dfdbd119b513b27e8854b531a35ddfac4acf96735', '2026-01-28 11:01:16', NULL, '2026-01-21 11:01:16');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (78, 1, '43d8c4f323f8c17671356a83e1950864d5e681a2f26e09221da5b0ff5b162f3e', '2026-01-28 11:06:47', NULL, '2026-01-21 11:06:47');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (79, 1, 'fce6a7474c6519bf3fedddc61adf4b6b6f0277830836f1d42a213a928034b3ae', '2026-01-28 14:40:08', NULL, '2026-01-21 14:40:08');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (80, 1, '435083ea6bb2677f86745de68fa0b95aa177f9fe89d25f5c9a4e576ad694b9ef', '2026-01-28 17:01:35', NULL, '2026-01-21 17:01:35');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (81, 1, '38298fd53265ad7d7cd88ffa4294a99f6b3bb93528cd4b123811f2a4c3f0fb21', '2026-01-29 09:21:26', NULL, '2026-01-22 09:21:26');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (82, 1, '544692a8d64cd3ce775cadc16b07fecffef653414e9aaafc7d2ce89b720bcdab', '2026-01-29 15:15:17', NULL, '2026-01-22 15:15:17');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (83, 1, '6526afbe75a17db642bacb78f8d15952fa1fad49a7ef73c641dae66e314e852a', '2026-01-29 19:00:43', NULL, '2026-01-22 19:00:43');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (84, 1, '6319032eca75bdef21e8190d09adb039ea3ba09dd619b458166ab352584b9b67', '2026-01-29 20:37:28', NULL, '2026-01-22 20:37:28');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (85, 1, '1c139d7ba15811aeab6fbaf5e1ffbbd09503b989e20147b53888fe997db568b0', '2026-01-29 20:40:28', NULL, '2026-01-22 20:40:28');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (86, 1, '237217160a8b9b4b39b4d6eaafb4852c0eec8c16f1a38afda33397531063e2ad', '2026-01-29 22:35:20', NULL, '2026-01-22 22:35:20');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (87, 1, 'ac3bb155e6f33b4e69f42fb883b75c092dbcd429f7a32cf01c6b3dc7024c7d64', '2026-01-29 22:38:51', NULL, '2026-01-22 22:38:51');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (88, 1, 'bc7f13cccc0d8e2d06d7d238c6014e7874c32b759d6fb5944a6ab0dac53e182f', '2026-01-30 08:56:51', NULL, '2026-01-23 08:56:51');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (89, 1, 'a4cdcb53a9e66400e7c23d1ea247f42ab87eea668418aa19fb6c83ebdba14b09', '2026-01-30 09:15:33', NULL, '2026-01-23 09:15:33');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (90, 1, '6d07c346d7fb1a5afc8aa4a7f06e672a7592aa9a2ce5e9f19283656ee2024330', '2026-01-30 09:28:57', NULL, '2026-01-23 09:28:57');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (91, 1, '2d88b3e01b1c579338413e8632a151f78f5746cb43f3721fa413c072f07cf073', '2026-01-30 09:44:09', NULL, '2026-01-23 09:44:09');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (92, 1, '4c8283d0440e7c7272c6ea0c183d8f3e6ce0c18e36a9460caa280a1d435ca5a9', '2026-01-30 09:45:57', NULL, '2026-01-23 09:45:57');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (93, 1, '4c89451e3e8abfce1a17e0827e1d6efa74fcff81e49fc66cdb5f7b817078e653', '2026-01-30 09:47:25', NULL, '2026-01-23 09:47:25');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (94, 1, '9fd74e44bc6017ff03e8c2d3edec2c326a84e121b8c67ad9a97a9dcdaf22975e', '2026-01-30 18:48:40', NULL, '2026-01-23 18:48:40');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (95, 1, 'd57567465c359f9793bfee8e918833667c06df00794062c03958d53b76eceaa1', '2026-02-02 14:12:53', NULL, '2026-01-26 14:12:53');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (96, 1, '71a1fd56007720b90a9178f357e0c133802872935502f2a27578d74e45e4556b', '2026-02-02 14:15:03', NULL, '2026-01-26 14:15:03');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (97, 1, 'd5b06256fb8a3acb16ea7f537ff1e9f7761334bf2905d4c71ec633f6378c9f08', '2026-02-03 10:13:18', NULL, '2026-01-27 10:13:18');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (98, 1, '6920d27286a991e79131c8f3abc7c3662a381d77e5a27d3f2bf850ef10aff4d8', '2026-02-04 16:11:52', NULL, '2026-01-28 16:11:52');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (99, 1, 'b948b02ee4b71dbdc26f73f2c3cb5e82b6061ea95e06adf7c01ae0de94ac939e', '2026-02-10 10:31:41', NULL, '2026-02-03 10:31:41');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (100, 1, '414f4b31878fb4e8a5ece1fdf43288856640fc400b5f7f4d1948c6b9a65e9758', '2026-02-10 10:33:03', NULL, '2026-02-03 10:33:04');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (101, 1, '25e0516fa6760001dcfc6577dba0614398c08a70bcd20ebfdc1ed9f044aaa6b5', '2026-02-10 10:35:25', NULL, '2026-02-03 10:35:25');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (102, 1, '57249e77dca1758d3dd7183f8b090c29de2e10126823256dfedf00ad4c2ab23b', '2026-02-10 14:04:52', NULL, '2026-02-03 14:04:52');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (103, 1, '0466aa6b4c0b81849c903941f16f2ee7b96dc121c354f310c8bb4ed56a092a8a', '2026-02-10 14:17:48', NULL, '2026-02-03 14:17:48');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (104, 1, 'd697c0e085bd10a7cf12bf4e0567e2197281bf84a74f7b2ceb00c524a550e1a0', '2026-02-10 14:18:46', NULL, '2026-02-03 14:18:46');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (105, 1, 'c80efa5aa27d70241084b0ad38e122d91f815c9b4659bd1652417fde623449ae', '2026-02-10 14:19:16', NULL, '2026-02-03 14:19:16');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (106, 1, '5ad37402003a26ec0c2af580d5cc57845f923203cc689951682d31c223c00db0', '2026-02-11 10:49:45', NULL, '2026-02-04 10:49:45');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (107, 1, '729bce08f3d81a32b5c4ee8ef4faabc1fc92a1c6b89993d9668753628e643b70', '2026-02-11 18:04:38', NULL, '2026-02-04 18:04:38');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (108, 1, '5ff891d896021f6d45c6f83fd1fcf4ad7023d6a1c1c91ec6f179367acfa5457c', '2026-02-12 09:49:19', NULL, '2026-02-05 09:49:18');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (109, 1, 'f3ab6d17b250cf9584723a20dd2ccbb9398726edfb9a45107ae9a150f6cee6d5', '2026-02-12 16:18:22', NULL, '2026-02-05 16:18:22');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (110, 1, '6fc95c495c8f50e91ae620ebb987aedf47f049418aff65cd1f1bc1edc80f31e3', '2026-03-04 18:12:32', NULL, '2026-02-25 18:12:32');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (111, 1, 'e3c1f5408a25c78dd932b6f1f18516d35f9f85d811a75384e3d9c81cebc34eb2', '2026-03-04 18:13:24', NULL, '2026-02-25 18:13:24');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (112, 1, '08045f390740d47f88652c4b01142b956fe3ea4d559c6b9c87c032e6e9a3fcf8', '2026-03-05 09:29:04', NULL, '2026-02-26 09:29:04');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (113, 1, '7638bad394b2992c17029e6288bab7a38f9b1338024dc9110acb6cecd487dd8c', '2026-03-05 22:57:43', NULL, '2026-02-26 22:57:43');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (114, 1, '11430d715abb217e39e58a2a4cb72000f15cd9f37edcf5ae3665d19adac514ff', '2026-03-05 23:01:29', NULL, '2026-02-26 23:01:29');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (115, 1, 'b30c5ef081b24a2396e12bcc2dcf530b18d626f031d456fd21a16c27cd0ba5f7', '2026-03-05 23:01:30', NULL, '2026-02-26 23:01:30');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (116, 1, '8ae5130e009d6fcaa3ce179bd57d99a050c57e78658bf6cb4cd24ed57907b98f', '2026-03-05 23:01:31', NULL, '2026-02-26 23:01:31');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (119, 1, 'd21eb7044734b45f344778e639239f0f6edbf20b1a1d261e101c20003aa40dd1', '2026-03-05 23:01:51', NULL, '2026-02-26 23:01:51');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (120, 1, '705f6aaa86f262e65d769cda36ff45cbf33b736dce70352e8ddd3f09009c6e23', '2026-03-06 09:14:54', NULL, '2026-02-27 09:14:54');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (121, 1, '2264deb6d2f640bb15dea1308868397b7cd042f674578425eb3c708489e27af1', '2026-03-06 11:36:40', NULL, '2026-02-27 11:36:40');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (122, 1, '498e8216c751ffe0b6afe2f686ee444db6734c0950b3b6730ebf006b1f073883', '2026-03-06 17:59:34', NULL, '2026-02-27 17:59:34');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (123, 1, '07fda8c16232fef4a82323312163868de42b7f9ad3e7468fc3c4b64282bbc4ef', '2026-03-06 18:02:33', NULL, '2026-02-27 18:02:33');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (124, 1, 'bca9ec4730de74a95d84f5db0772244a753bdf48e2a1fb86e1e98dbfe86b1f03', '2026-03-07 17:51:44', NULL, '2026-02-28 17:51:44');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (125, 1, '87b0db18cbd931945b17f711aa4915eb43a6785508a9d2c21511abfd02f7d656', '2026-03-07 17:55:15', NULL, '2026-02-28 17:55:15');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (126, 5, 'b2fc500b9293b9bd54d548b2f77617fdb1a37f63d18ee73d9d824bca3cd6a156', '2026-03-07 18:14:39', NULL, '2026-02-28 18:14:39');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (127, 5, '81fb898792c4937fcec1b6835824933b88ef1b856cc34d7c877ae91ae7ab6731', '2026-03-07 18:16:33', NULL, '2026-02-28 18:16:33');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (128, 5, 'd8dd03be8708ee738e337e18bf97e87a478b0ee07905e45a8f7feeacbd5a02b9', '2026-03-07 18:18:29', NULL, '2026-02-28 18:18:29');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (129, 5, '4b4c1b4db1edcaa8539a4f1000eb4c9c933b28c7b1bcc5f92841d023112d4af7', '2026-03-07 18:18:36', NULL, '2026-02-28 18:18:36');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (130, 5, '0d11bfea7b0b2b6b14ad00f82ebc4866cb8acec9bb75d76a832a71f4ab4f7644', '2026-03-09 22:17:15', NULL, '2026-03-02 22:17:15');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (131, 1, '4eb826ef4f8cf2f5e917c678121dc327485f202623ad14dd284a008455937045', '2026-03-09 22:17:59', NULL, '2026-03-02 22:17:59');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (132, 1, '93e76e43b25742fc7a6544f2495bf643feb68e95cb81b8d3091eb17463547cf1', '2026-03-09 22:18:02', NULL, '2026-03-02 22:18:02');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (133, 5, '9d24a25fb29c22b6b030373647a38d335b03a39b257e85ce301fe4223e09ad60', '2026-03-09 22:19:13', NULL, '2026-03-02 22:19:13');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (134, 5, 'c9e929d680e39fa5a6745533f5e84aabeda643f7757687167c9f54715bed5d9f', '2026-03-09 22:22:41', NULL, '2026-03-02 22:22:41');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (135, 5, '0a64e76baf7bc782fc4f4267da3c4d740e9ff7d51f75fa3cef3773ee03ac6bc4', '2026-03-09 22:25:57', NULL, '2026-03-02 22:25:57');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (136, 5, 'db08ec1beade2fcbcb66dcae56dbcb075bfe52b91bcb7ec9fea3da036e46922e', '2026-03-09 22:27:43', NULL, '2026-03-02 22:27:43');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (137, 5, 'daff5731d6253d5f9c361834e0a2e51d02620b52bffa478529b67fa9270d6be5', '2026-03-09 22:33:16', NULL, '2026-03-02 22:33:16');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (138, 5, '3e41e8264f587ae9b07a637b97ca508bd2ca258ec0e628087f025a736220141d', '2026-03-09 22:35:48', NULL, '2026-03-02 22:35:48');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (139, 5, '55169035054e09c5dac3d901f2a5b502e68860148f940460086d8ebf2b162092', '2026-03-10 22:35:17', NULL, '2026-03-03 22:35:17');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (140, 1, '7bb6f0f46865b1c0c8588fe604306c7b6be0eda961452178e31b985ab9f70884', '2026-03-10 22:35:50', NULL, '2026-03-03 22:35:50');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (141, 1, '00f46f0c66ebd3fe9ff87288c4471b83414dfb0066a96e6d5bf4a7a83c3db7a7', '2026-03-10 22:45:09', NULL, '2026-03-03 22:45:09');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (142, 1, 'a3d45e6486587fe53ef98dd7c0658d1ac2d5940ca36ad9f27f7237c0d7657b78', '2026-03-11 12:15:36', NULL, '2026-03-04 12:15:36');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (143, 1, 'dfb3f2d3f46e4d6d5585aecf8ef666f4a84d6b182b815e405c27ed76b3c5a8fd', '2026-03-11 18:16:42', NULL, '2026-03-04 18:16:42');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (144, 1, 'ad0bcc08774b477b91101f7b790730122a2de13ecc3b51e7fcc81f787acb0def', '2026-03-11 21:27:54', NULL, '2026-03-04 21:27:54');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (145, 1, 'ba9bce57b9d0f694f94f0c45bd88f1264b977a02bdf6589658c7256c0fa8856a', '2026-03-11 21:28:11', NULL, '2026-03-04 21:28:11');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (146, 1, 'c4bb26239b95185df3f358c571ca69bded70c6d5e0fe7f710e88ccd73a2c2566', '2026-03-13 11:21:40', NULL, '2026-03-06 11:21:40');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (147, 1, '5f05e3bce2c7195e246ae6ed84b660599eb2adcdfe1a02823487c044f518f730', '2026-03-13 11:22:34', NULL, '2026-03-06 11:22:34');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (148, 1, '4636b9d7bfb80ffd26ec0713ad27d28af6972187669331cae55d187dd64366e4', '2026-03-13 19:03:24', NULL, '2026-03-06 19:03:24');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (149, 1, '68ccea7275170d849d8e0665a878ff0c82f0a3d8a2821aa24799ce95589ca395', '2026-03-16 08:51:28', NULL, '2026-03-09 08:51:28');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (150, 1, '0cba8b68eb11baa9efd316cc340873d6b2eac90ac46c91111ccbb395cd9f1c46', '2026-03-16 08:51:29', NULL, '2026-03-09 08:51:29');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (151, 3, 'ca2c8afb471eee7a68cce4865ce310a8e23a80a986204c35a8607d303200e1e0', '2026-03-16 09:06:34', NULL, '2026-03-09 09:06:34');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (152, 1, 'b55efdfd95532514e7ed000905d35fa9da08bf8dcf8397db1c21e9ed43c3e028', '2026-03-16 09:07:12', NULL, '2026-03-09 09:07:12');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (153, 1, 'b95310218a049aeda096158a622bae448355fdb7cf5fc3b37c4c04f92e425adb', '2026-03-16 09:37:59', NULL, '2026-03-09 09:37:59');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (154, 1, 'ac4f6a9c84d89a787a45d7336bde5959912cfa03de4120f315f8318b917f1ef9', '2026-03-16 09:40:37', NULL, '2026-03-09 09:40:37');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (155, 1, 'e58c6e2a663f2068a00c7d933615867f1475ffd5bd49dce0f0a425ead9366a43', '2026-03-16 11:43:06', NULL, '2026-03-09 11:43:06');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (156, 1, '71cc02dde73a88198a0e18f63e4d225ffb021faae50852ede6cbe5792c3651a1', '2026-03-16 11:50:32', NULL, '2026-03-09 11:50:32');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (157, 1, 'e2ef25da4c918bf1fdff7737016d43d74c9e76bbc9cf93316c8f3354a2caed67', '2026-03-16 11:50:50', NULL, '2026-03-09 11:50:50');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (158, 5, '41560a143691f09956ce366ef0c3cd135f4ca6e10128c1a28b2d911239bda48c', '2026-03-16 12:27:07', NULL, '2026-03-09 12:27:07');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (159, 1, '246fc5b351e01c16db12a57104df3e86fdfc6ef673a9169eb499412a3e8ac7bf', '2026-03-16 14:02:15', NULL, '2026-03-09 14:02:15');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (160, 1, '3ea1ab78b744806d85665bb98eb947fef29d580c9cc7b22455b572a556c7abf4', '2026-03-16 14:13:22', NULL, '2026-03-09 14:13:22');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (161, 1, 'f185710e97cf6200583223c73a6a2438aa962c2f7ec2f5603dfc5ce4b9a6534b', '2026-03-16 14:17:58', NULL, '2026-03-09 14:17:58');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (162, 6, 'ceb31e7c355d7b0e5da28aa3d8409bd5ee99d7cd8bd4210db9f8e22e69f46115', '2026-03-16 14:24:25', NULL, '2026-03-09 14:24:25');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (163, 6, '772527c6754fab867d34718ad88fdb87b8d281c76ae06155987354f630a8706e', '2026-03-16 14:25:44', NULL, '2026-03-09 14:25:44');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (164, 1, '5dcad98310670b7d2d232c2916b6d6161f6dbef0cc0d8fb4150f4842d0836701', '2026-03-16 14:28:30', NULL, '2026-03-09 14:28:30');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (165, 3, 'be5ffe22c85ee5f24aec213eed8431f5d174f78c647aa0ebfefe349c73750fc1', '2026-03-16 14:40:19', NULL, '2026-03-09 14:40:19');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (166, 1, '0985300d11a97b4bb6c8319504efbdbb6e7563961313f5b2764f83694d41c0de', '2026-03-16 14:58:33', NULL, '2026-03-09 14:58:33');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (167, 5, '5df2f5f667d69112998a07da762b7debafa871a0b7097287fa294770d3c751cf', '2026-03-16 15:51:06', NULL, '2026-03-09 15:51:06');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (168, 5, '945275bcdcccc11b58978520b305ea97a8029d0b0b292f86e8701c163cdaac0b', '2026-03-16 15:51:26', NULL, '2026-03-09 15:51:26');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (169, 5, '34d129ba70cfbf4d26cebcb2d03e39c8d28932841102aab2ff43761d3fee3242', '2026-03-16 15:52:32', NULL, '2026-03-09 15:52:32');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (170, 1, 'd58f45065080391da48954103dbf70f8023bb8c9c728f0f6e87be1d63d70c4f0', '2026-03-16 15:52:37', NULL, '2026-03-09 15:52:37');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (171, 5, '45c435138bdcaa0a3641e701d64ea569638bd865e72129e9bfde65d722ba5b50', '2026-03-16 15:52:58', NULL, '2026-03-09 15:52:58');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (172, 1, '589535cad6a8b036b23dc765d7dcaf52fa5138964472e7eaaa2a674b4e1baf39', '2026-03-16 15:53:13', NULL, '2026-03-09 15:53:13');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (173, 5, '8ce9425572963b561a6f6ac81a9e1423d548f07c9fe0ae50fb56d8111efb3394', '2026-03-16 17:34:42', NULL, '2026-03-09 17:34:42');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (174, 5, '3ed1c2a4a2577791b2f57a40a2da67366a1740549923d07cedf1e52570c2de33', '2026-03-16 17:41:05', NULL, '2026-03-09 17:41:05');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (175, 1, '6c2c96c6d06875eeb9eaea541ccb904af2c4ff7b264c27444116b2b6e0794801', '2026-03-16 17:47:22', NULL, '2026-03-09 17:47:22');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (176, 5, '477baa17d741a8947af35e8f0278c223b54726000885eabe21d6eb03dc0db2bb', '2026-03-16 17:51:51', NULL, '2026-03-09 17:51:51');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (177, 5, '6b6e8e3e1c173962b5e0b94e48b7b77835886e270d20a674b4ef191437bc84c9', '2026-03-16 18:00:13', NULL, '2026-03-09 18:00:13');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (178, 1, '97427a27dd50a6d43e073efb27865806ac0a233621291c5da998b53a4631f8b1', '2026-03-16 18:12:06', NULL, '2026-03-09 18:12:06');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (179, 1, '3f436576a892ead5fdda9a168d13aa1b9124291cb20dad7576927b62468c3dce', '2026-03-16 18:43:55', NULL, '2026-03-09 18:43:55');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (180, 5, '2ad9840dbcb2703b7a7533a41df5df0485acd50aeecc4fff43a79bbe58895277', '2026-03-16 18:44:06', NULL, '2026-03-09 18:44:06');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (181, 1, '9fa800d35a2511a2c92a331a057cf1c43b54c28218e986f7c413b01d67e5e1de', '2026-03-17 09:25:03', NULL, '2026-03-10 09:25:03');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (182, 1, '97f655264c7c5c5d63a46ecb8bdfa4ed39c271839786eff2663b22b1c3d22058', '2026-03-17 12:20:38', NULL, '2026-03-10 12:20:38');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (183, 1, '79481e068a02bd58fe874ef61c50603042f411bcd2164464323d253ef34ca387', '2026-03-18 15:33:01', NULL, '2026-03-11 15:33:01');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (184, 5, '1917004837cc210b8cfc0456555f8cccf24efe5ccc2ab58fa3ed0005e2b615bd', '2026-03-18 15:56:51', NULL, '2026-03-11 15:56:51');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (185, 1, '7e1208ba188f824b359f094a7fb74fb6d973fa250c08f55b73ed1707cb54d6bc', '2026-03-18 16:05:46', NULL, '2026-03-11 16:05:46');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (186, 1, '8a39e946520f16b41675f053f31c26e8a66694caeef532125bb471d2f949f135', '2026-03-18 16:06:14', NULL, '2026-03-11 16:06:14');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (187, 5, '3732a0a510fc443533716c4820776a68f83bb20ceb77752dadd15fdd3050c515', '2026-03-18 16:08:32', NULL, '2026-03-11 16:08:32');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (188, 1, '65cbac8726d672612b3c27a35898c52756581cd7db3ffe5dd151b6a239f647f8', '2026-03-18 16:52:34', NULL, '2026-03-11 16:52:34');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (189, 5, '8402e85b9f70945e634b85ef22b4a3e1ec41bef45ecb9dae899b4cd506d34a39', '2026-03-18 16:53:47', NULL, '2026-03-11 16:53:47');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (190, 1, '29fb52450ce28228115dc4e3e0e0d756d49108784cbb04d266917cb1cc49d1fd', '2026-03-18 17:02:16', NULL, '2026-03-11 17:02:16');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (191, 5, 'ba54853d0ce7c56542ed4d6cb6d566045d0a217a8b606c665645b63c39f27dc1', '2026-03-18 17:04:32', NULL, '2026-03-11 17:04:32');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (192, 5, '65d5ec6e6bb564406022865a2ddcf4bba3346b2d07ec24c5b30cd4106c7aca82', '2026-03-18 17:27:38', NULL, '2026-03-11 17:27:38');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (193, 1, '0050e91961787bce342101a1ab6e239e31a934c8befbf98a1e61e597bbf10639', '2026-03-18 22:18:23', NULL, '2026-03-11 22:18:23');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (194, 1, 'b7206511070775e5ce5a1bf89847486a2586edab66aa7c8f3135a137a412cab5', '2026-03-18 22:18:43', NULL, '2026-03-11 22:18:43');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (195, 1, 'efd66aa7b2a23020253a844edf6245f6a8da5203395f37828531c47134c94b9b', '2026-03-18 22:18:57', NULL, '2026-03-11 22:18:57');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (196, 1, '9cf0a3facb048f1695e169550df96e7c6f2eb830f5720594cbceb9bd56149831', '2026-03-18 22:25:40', NULL, '2026-03-11 22:25:40');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (197, 1, '03d0af1fe66295d9542e51ca681e4b73b1f9012f28cabf8038cf241393c78d80', '2026-03-18 22:27:33', NULL, '2026-03-11 22:27:33');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (198, 1, 'f88ff256279fd4a883e7df0765b608c828c7307abe44894305420f61326a5f36', '2026-03-18 22:30:48', NULL, '2026-03-11 22:30:48');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (199, 1, 'ac82fd67ef330e375f11d2ca10f3512727320bd39a6a9a67a3160448b6df4075', '2026-03-18 22:30:54', NULL, '2026-03-11 22:30:54');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (200, 5, 'ade473a944bf01037a9670023910f51d901d9ffdf7024d866d91feb6f6b8575c', '2026-03-19 09:47:18', NULL, '2026-03-12 09:47:18');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (201, 5, '0d01a284b755a8fd175a90ef7851502f8032ea76aa1ee1b035b64b1112f365f9', '2026-03-19 09:56:17', NULL, '2026-03-12 09:56:17');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (202, 5, 'eb6586bffda39bb96885545bef121fffbeff3fede02156d459e80f6778c4aae9', '2026-03-19 10:00:51', NULL, '2026-03-12 10:00:51');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (203, 1, 'b0c7c763a4243d9a23cec26bbc5d8a6325261717a0cbbd50952b4dc55bd2d33d', '2026-03-19 10:24:59', NULL, '2026-03-12 10:24:59');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (204, 1, 'a539db081f5c94d9a2e715f055a33082acc68e5491a8b214a65812bf458e45cb', '2026-03-19 12:03:13', NULL, '2026-03-12 12:03:13');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (205, 5, 'b4d4bb1d2a53769ab149f03e48a3a8d17bae06bd369311325e8343821c3bc0f3', '2026-03-19 12:03:25', NULL, '2026-03-12 12:03:25');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (206, 5, '922e7eb3aed9fe233c8ba6045406fbfd8248d831ca30633f39be4d5043642e85', '2026-03-19 17:20:51', NULL, '2026-03-12 17:20:51');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (207, 1, 'b71d6d741253254dfa2c9312a9f38688fa85c75043fcea1d81b60c4e7938f674', '2026-03-19 18:03:16', NULL, '2026-03-12 18:03:16');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (208, 1, 'f4996c8aa5adb203a76d395c95221fb1cc54c649e0b3163f13738156810ab60d', '2026-03-19 22:10:01', NULL, '2026-03-12 22:10:01');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (209, 1, 'c15a2caddfb765a4e4a45d19cb8293fdb3ba8fd3bc40550b49c2e670c0a02a9e', '2026-03-19 22:11:05', NULL, '2026-03-12 22:11:05');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (210, 1, '829daabf80f25d73389a53b4aa111cf38354bd6a21f3d7fec53d9c03b4819582', '2026-03-19 22:23:58', NULL, '2026-03-12 22:23:58');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (211, 1, '152dae1eb97ee24ba0c30e68ed5b507167e6a862f49489fee3ab10b7a1d3f2db', '2026-03-19 22:41:27', NULL, '2026-03-12 22:41:27');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (212, 1, '213dd1fe13fc07b943c2c2d493b9d11ceba14a8e6badfb723abfd6a4ca9b5535', '2026-03-19 22:46:30', NULL, '2026-03-12 22:46:30');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (213, 1, '52d8f3afa0f590c6480ac3d26b5a6274c3ff531cced26147f805fbffc03420b8', '2026-03-19 22:47:27', NULL, '2026-03-12 22:47:27');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (214, 1, '8705e590ef61115530bdcf2d8b2a5cda5ed15369b10c9dabd8746b1d82337674', '2026-03-20 12:19:36', NULL, '2026-03-13 12:19:36');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (215, 5, 'a16baccd0d486cc7588886510ea2530e2d4cfb6fa7d98f1b693ed6911b1ed5c5', '2026-03-20 12:21:45', NULL, '2026-03-13 12:21:45');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (216, 5, '40fc03ff8602cd494909c19141c996834d3584d1cdd82b42c6e3f483da1329df', '2026-03-20 14:07:43', NULL, '2026-03-13 14:07:43');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (217, 1, '54da08ec64095715e22dafe6434ff6f06f69cef90d8852e2e38d502a111b0b3e', '2026-03-20 15:16:39', NULL, '2026-03-13 15:16:39');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (218, 5, '5b39a48c0a7074056d9cc3efd7ff114e32bcff68fcc876d0863d08b19b69d3ca', '2026-03-20 15:21:42', NULL, '2026-03-13 15:21:42');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (219, 1, '14d67e52fd549efceea60fac592bc29906941e8c9d248a5d6aed7c6b6a217a43', '2026-03-20 16:47:23', NULL, '2026-03-13 16:47:23');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (220, 1, '1d405595a823e2d664530cdafc8d78037b9e7707dc3d989e5f8e8c51751cb2d6', '2026-03-20 17:36:01', NULL, '2026-03-13 17:36:01');
INSERT INTO `refresh_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `revoked_at`, `created_at`) VALUES (221, 1, 'b93681c6c9254727c4423a2048044e70de824a70c020fd1648316bb2154559a9', '2026-03-20 17:39:23', NULL, '2026-03-13 17:39:23');
COMMIT;

-- ----------------------------
-- Table structure for sites
-- ----------------------------
DROP TABLE IF EXISTS `sites`;
CREATE TABLE `sites` (
  `site_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `site_name` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `site_status` tinyint(1) NOT NULL DEFAULT '0',
  `wp_base_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `wp_auth_type` enum('basic','jwt','app_password','api_key') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `wp_auth_token` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `wp_username` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `wp_password` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `demo_site` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`site_id`) USING BTREE,
  KEY `idx_sites_demo_site` (`demo_site`) USING BTREE,
  KEY `idx_sites_is_deleted` (`is_deleted`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- ----------------------------
-- Records of sites
-- ----------------------------
BEGIN;
INSERT INTO `sites` (`site_id`, `site_name`, `site_status`, `wp_base_url`, `wp_auth_type`, `wp_auth_token`, `wp_username`, `wp_password`, `demo_site`, `is_deleted`, `created_at`, `updated_at`) VALUES ('site_012813c23372429c83d183f96228a6f7', '仕天-中文', 0, 'https://gzsuptechcn.yhct.top', 'api_key', 'pt_07fc86725e544c9e91587e4862480043', NULL, NULL, NULL, 0, '2026-02-03 11:00:45', '2026-02-03 11:07:46');
INSERT INTO `sites` (`site_id`, `site_name`, `site_status`, `wp_base_url`, `wp_auth_type`, `wp_auth_token`, `wp_username`, `wp_password`, `demo_site`, `is_deleted`, `created_at`, `updated_at`) VALUES ('site_0d468d9ba4e34892825aad60b9c6fb9c', '华宏-法语', 0, 'https://bjhuahongfr.yhct.top', 'api_key', 'pt_27f08218c28043489bb074c1ffa0ed0a', NULL, NULL, NULL, 0, '2026-01-14 17:52:15', '2026-01-14 17:52:43');
INSERT INTO `sites` (`site_id`, `site_name`, `site_status`, `wp_base_url`, `wp_auth_type`, `wp_auth_token`, `wp_username`, `wp_password`, `demo_site`, `is_deleted`, `created_at`, `updated_at`) VALUES ('site_22e043c99616432987c003d3fdd25c1c', '世挚睿得（厦门）进出口有限公司', 0, 'https://www.trustfloral.com', 'api_key', 'pt_a8003925412246ad9f0a3df31584afc5', NULL, NULL, 'demo64', 0, '2026-01-20 10:18:48', '2026-01-20 10:19:35');
INSERT INTO `sites` (`site_id`, `site_name`, `site_status`, `wp_base_url`, `wp_auth_type`, `wp_auth_token`, `wp_username`, `wp_password`, `demo_site`, `is_deleted`, `created_at`, `updated_at`) VALUES ('site_2480eaf09bdb4382b38749dd26d3faaa', '123', 0, '', 'api_key', 'pt_04837a44f1884719bc060c1228427ebf', NULL, NULL, '123', 0, '2026-02-28 18:05:13', '2026-02-28 18:05:13');
INSERT INTO `sites` (`site_id`, `site_name`, `site_status`, `wp_base_url`, `wp_auth_type`, `wp_auth_token`, `wp_username`, `wp_password`, `demo_site`, `is_deleted`, `created_at`, `updated_at`) VALUES ('site_25cd8d92dbad4d63bd84ffed27369c19', 'test1', 0, 'https://demo55.yhct.top', 'api_key', 'pt_561f2ecd414d45a6bcfee9cf329ec309', NULL, NULL, 'demo55', 0, '2025-12-25 18:13:31', '2026-01-04 09:54:54');
INSERT INTO `sites` (`site_id`, `site_name`, `site_status`, `wp_base_url`, `wp_auth_type`, `wp_auth_token`, `wp_username`, `wp_password`, `demo_site`, `is_deleted`, `created_at`, `updated_at`) VALUES ('site_2dc250e3e22341d0a79512dba2274c7c', '杭州沃桥俄语', 0, 'https://hzwoqiaoru.yhct.top', 'api_key', 'pt_8f19ba1857a74b5aa5d4683001c250b8', NULL, NULL, 'demo999', 0, '2026-03-09 09:45:37', '2026-03-09 09:46:38');
INSERT INTO `sites` (`site_id`, `site_name`, `site_status`, `wp_base_url`, `wp_auth_type`, `wp_auth_token`, `wp_username`, `wp_password`, `demo_site`, `is_deleted`, `created_at`, `updated_at`) VALUES ('site_3904a69785b241f59b54cd517b6b4d4a', 'demo67测试专用', 0, 'https://material67.yhct.site', 'api_key', 'pt_23110e993cf04796bc7ec06d6356815c', NULL, NULL, 'demo67', 0, '2026-02-28 18:07:54', '2026-02-28 18:09:42');
INSERT INTO `sites` (`site_id`, `site_name`, `site_status`, `wp_base_url`, `wp_auth_type`, `wp_auth_token`, `wp_username`, `wp_password`, `demo_site`, `is_deleted`, `created_at`, `updated_at`) VALUES ('site_5e5d6eefac8f46b8aaf1ef60746fa9cc', '水星', 0, 'https://shuixingjj.yhct.top', 'api_key', 'pt_f3dc1361f6994b88a4cdfd092fe5d819', NULL, NULL, NULL, 0, '2026-01-26 14:13:50', '2026-01-26 14:14:19');
INSERT INTO `sites` (`site_id`, `site_name`, `site_status`, `wp_base_url`, `wp_auth_type`, `wp_auth_token`, `wp_username`, `wp_password`, `demo_site`, `is_deleted`, `created_at`, `updated_at`) VALUES ('site_6e8419425feb44a8bca9c610d896d010', '测试', 0, 'https://test123.yhct.site', 'api_key', 'pt_0e4ceb77dff94819a20334617359fef2', NULL, NULL, 'demo66', 0, '2025-12-25 16:36:40', '2026-01-05 14:45:54');
INSERT INTO `sites` (`site_id`, `site_name`, `site_status`, `wp_base_url`, `wp_auth_type`, `wp_auth_token`, `wp_username`, `wp_password`, `demo_site`, `is_deleted`, `created_at`, `updated_at`) VALUES ('site_6ff22b1ce7d24354bef7310ab69bb219', '测试1', 0, 'https://test123.yhct.site', 'api_key', 'pt_5fb05c37c6a24b41ac1eaee211d17408', NULL, NULL, NULL, 1, '2026-01-05 14:36:59', '2026-01-05 14:45:38');
INSERT INTO `sites` (`site_id`, `site_name`, `site_status`, `wp_base_url`, `wp_auth_type`, `wp_auth_token`, `wp_username`, `wp_password`, `demo_site`, `is_deleted`, `created_at`, `updated_at`) VALUES ('site_9e0e91da6da143bc8e387fd3a7c0a881', '奥克莱-法语', 0, 'https://aokelaifr.yhct.top', 'api_key', 'pt_794417b48279468e9dd039397c8a04d1', NULL, NULL, NULL, 0, '2026-02-03 10:32:04', '2026-02-03 10:32:24');
INSERT INTO `sites` (`site_id`, `site_name`, `site_status`, `wp_base_url`, `wp_auth_type`, `wp_auth_token`, `wp_username`, `wp_password`, `demo_site`, `is_deleted`, `created_at`, `updated_at`) VALUES ('site_d9f0ce6013d044da8cef9bfeab185e81', '苏菲亚-阿拉伯语', 0, 'https://sofeyiaar.yhct.top', 'api_key', 'pt_f4967c19c2ab44a0b1a2d9a2377ce2c5', NULL, NULL, NULL, 0, '2026-01-19 09:56:15', '2026-01-19 10:25:32');
COMMIT;

-- ----------------------------
-- Table structure for user_sites
-- ----------------------------
DROP TABLE IF EXISTS `user_sites`;
CREATE TABLE `user_sites` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `site_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uk_user_sites_user_site` (`user_id`,`site_id`) USING BTREE,
  KEY `idx_user_sites_site_id` (`site_id`) USING BTREE,
  CONSTRAINT `fk_user_sites_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- ----------------------------
-- Records of user_sites
-- ----------------------------
BEGIN;
INSERT INTO `user_sites` (`id`, `user_id`, `site_id`, `created_at`) VALUES (3, 6, 'site_2dc250e3e22341d0a79512dba2274c7c', '2026-03-09 14:23:39');
INSERT INTO `user_sites` (`id`, `user_id`, `site_id`, `created_at`) VALUES (6, 5, 'site_3904a69785b241f59b54cd517b6b4d4a', '2026-03-09 14:32:55');
INSERT INTO `user_sites` (`id`, `user_id`, `site_id`, `created_at`) VALUES (8, 3, 'site_2dc250e3e22341d0a79512dba2274c7c', '2026-03-09 14:39:30');
COMMIT;

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('admin','user') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'user',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uk_users_username` (`username`) USING BTREE,
  KEY `idx_users_is_deleted` (`is_deleted`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC;

-- ----------------------------
-- Records of users
-- ----------------------------
BEGIN;
INSERT INTO `users` (`id`, `username`, `password_hash`, `role`, `is_deleted`, `created_at`, `updated_at`) VALUES (1, 'yeehai', '$2b$10$VLmg/FsF6wxRQjv9duGsyu2BVMV/6qfcA3.IOrPETGO4KQghu/yym', 'admin', 0, '2025-12-24 16:51:49', '2025-12-24 16:51:49');
INSERT INTO `users` (`id`, `username`, `password_hash`, `role`, `is_deleted`, `created_at`, `updated_at`) VALUES (2, 'test', '$2b$10$0Ya8JS0RErA2iNH2zWrde.ldSqCMC95Ppm3R.c9o3x/YuXrVizEM2', 'user', 1, '2025-12-24 17:50:38', '2025-12-24 17:53:07');
INSERT INTO `users` (`id`, `username`, `password_hash`, `role`, `is_deleted`, `created_at`, `updated_at`) VALUES (3, 'test1', '$2b$10$s/0JYuhyb3n88EhBhv05teOsKX6cPZwVPoL/ilrCxy2cKzSFcaIC6', 'user', 0, '2025-12-25 17:26:18', '2026-03-09 09:05:09');
INSERT INTO `users` (`id`, `username`, `password_hash`, `role`, `is_deleted`, `created_at`, `updated_at`) VALUES (4, 'test2', '$2b$10$Hi/D4NoOY4dvxN7rPPGkWOb8cTN6PGw8.VXdgFajLBRnJEtZpMU6S', 'user', 0, '2026-02-28 18:02:10', '2026-02-28 18:02:10');
INSERT INTO `users` (`id`, `username`, `password_hash`, `role`, `is_deleted`, `created_at`, `updated_at`) VALUES (5, 'demo67', '$2b$10$cf.YvXzvoEg1OKkYubcOOuiNOvqxokVw/rr7U71ZfadpeuHVmO/uW', 'user', 0, '2026-02-28 18:14:27', '2026-02-28 18:14:27');
INSERT INTO `users` (`id`, `username`, `password_hash`, `role`, `is_deleted`, `created_at`, `updated_at`) VALUES (6, 'faiztest', '$2b$10$B7H5H1H/WPAmYlIDOgBxlegzXwnDuoghqX6yl0Gjs1DS5Ax0QLFse', 'user', 0, '2026-03-09 14:23:39', '2026-03-09 14:23:39');
COMMIT;

SET FOREIGN_KEY_CHECKS = 1;
