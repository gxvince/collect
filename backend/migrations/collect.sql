/*
 Navicat Premium Dump SQL

 Source Server         : wsl
 Source Server Type    : MySQL
 Source Server Version : 80045 (8.0.45-0ubuntu0.24.04.1)
 Source Host           : 127.0.0.1:3306
 Source Schema         : collect

 Target Server Type    : MySQL
 Target Server Version : 80045 (8.0.45-0ubuntu0.24.04.1)
 File Encoding         : 65001

 Date: 09/02/2026 10:11:28
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for files
-- ----------------------------
DROP TABLE IF EXISTS `files`;
CREATE TABLE `files`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `site_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `elementor_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_url` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `meta` json NULL,
  `created_by` bigint UNSIGNED NOT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_files_site_elementor`(`site_id` ASC, `elementor_id` ASC) USING BTREE,
  INDEX `idx_files_created_by`(`created_by` ASC) USING BTREE,
  INDEX `idx_files_is_deleted`(`is_deleted` ASC) USING BTREE,
  CONSTRAINT `fk_files_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of files
-- ----------------------------
INSERT INTO `files` VALUES (1, 'site_6e8419425feb44a8bca9c610d896d010', '104', 'uploads/site_6e8419425feb44a8bca9c610d896d010/20260105/1767598696360_9yle3q.jpg', NULL, 1, 0, '2026-01-05 15:38:16');

-- ----------------------------
-- Table structure for refresh_tokens
-- ----------------------------
DROP TABLE IF EXISTS `refresh_tokens`;
CREATE TABLE `refresh_tokens`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` bigint UNSIGNED NOT NULL,
  `token_hash` char(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` datetime NOT NULL,
  `revoked_at` datetime NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_refresh_tokens_hash`(`token_hash` ASC) USING BTREE,
  INDEX `idx_refresh_tokens_user`(`user_id` ASC) USING BTREE,
  INDEX `idx_refresh_tokens_expires`(`expires_at` ASC) USING BTREE,
  CONSTRAINT `fk_refresh_tokens_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 110 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of refresh_tokens
-- ----------------------------
INSERT INTO `refresh_tokens` VALUES (1, 1, '2929130779829833c3100d7f4ff82e3c6f2961597cbf043d8edeb732eae33926', '2025-12-31 16:52:29', NULL, '2025-12-24 16:52:29');
INSERT INTO `refresh_tokens` VALUES (2, 1, '2ca792be456946a3b6f18cd5894b6e7412dc030c518c06d894c199f927df61df', '2025-12-31 16:52:33', NULL, '2025-12-24 16:52:33');
INSERT INTO `refresh_tokens` VALUES (3, 1, 'd36fe132ad8dbc26035fd162323ebd6e85f352881af161d11cde232742359f30', '2025-12-31 17:50:08', NULL, '2025-12-24 17:50:08');
INSERT INTO `refresh_tokens` VALUES (4, 1, '700599483b6e16e8db03cd3fca3cce28e03f6ad700c4050dbcfc2ac82c2d5978', '2025-12-31 17:52:55', NULL, '2025-12-24 17:52:55');
INSERT INTO `refresh_tokens` VALUES (5, 1, 'e7ea5d7137763c56b717b2b739b8cddecefdc23d9b5a1c984644de224e451f6d', '2025-12-31 17:53:44', NULL, '2025-12-24 17:53:44');
INSERT INTO `refresh_tokens` VALUES (6, 1, '881d211645523d36cd2c60c549b63fd0880a0d5ebc92603c8175f5cc90b774fb', '2025-12-31 17:53:46', NULL, '2025-12-24 17:53:46');
INSERT INTO `refresh_tokens` VALUES (7, 1, '2cda38d3badb9e0625e3d510b4f9b21dc64f2202e1a20d1c5e84f1389423ceba', '2025-12-31 17:53:47', NULL, '2025-12-24 17:53:47');
INSERT INTO `refresh_tokens` VALUES (8, 1, '776ba519a61f798b1e818ccd4d6d97adb0a1b82b918b4717e2fd208c00a30ee8', '2025-12-31 17:53:48', NULL, '2025-12-24 17:53:48');
INSERT INTO `refresh_tokens` VALUES (11, 1, '22bdc9d8b49662090b4b3a0f814a5d595cfba605d7bebd32fdfe00ce2d3349aa', '2025-12-31 17:53:49', NULL, '2025-12-24 17:53:49');
INSERT INTO `refresh_tokens` VALUES (13, 1, 'c62e7af83029c3ef300e8b039b3444c275c896bfeefd4667cae51b7c1d56f7bb', '2025-12-31 17:53:51', NULL, '2025-12-24 17:53:51');
INSERT INTO `refresh_tokens` VALUES (14, 1, '64cc0e21fbd124f9ae607c2001b2d6df3432c7592aecae74e5ab28c87c42bcb7', '2025-12-31 17:53:52', NULL, '2025-12-24 17:53:52');
INSERT INTO `refresh_tokens` VALUES (17, 1, '12c5071e6ef331ccbbab84db5b617423eb0e2a7a4ef1bbfd5df64efd149e622c', '2025-12-31 17:53:56', NULL, '2025-12-24 17:53:56');
INSERT INTO `refresh_tokens` VALUES (18, 1, '4953150aa361cadb5d4ea86225773c5cf8bd5a1e9b764f13d0e293307b6389bc', '2025-12-31 17:54:00', NULL, '2025-12-24 17:54:00');
INSERT INTO `refresh_tokens` VALUES (19, 1, '1bf131c4e0014519ebf967b9085a91d2bea2d7605e25b967373cbb681c5acfae', '2026-01-01 16:26:15', NULL, '2025-12-25 16:26:15');
INSERT INTO `refresh_tokens` VALUES (20, 1, 'f6bbd221bb43fbe3a0f03ef612669e567e0059ca91eeb4d2dd0c72ec308154d3', '2026-01-01 16:32:14', NULL, '2025-12-25 16:32:14');
INSERT INTO `refresh_tokens` VALUES (21, 1, 'fb2fcbce2188393f6842a53473d6a89b621c4d95df9e84b1bb543304b374e424', '2026-01-01 17:19:35', NULL, '2025-12-25 17:19:35');
INSERT INTO `refresh_tokens` VALUES (22, 3, 'f2324194d2db7197f0434c19429950d3bede8776a5c2ae53c32b0620c1ae4a6e', '2026-01-01 17:26:41', NULL, '2025-12-25 17:26:41');
INSERT INTO `refresh_tokens` VALUES (23, 3, '29d616229ae8dcbb202b13cce7b9821009de6b9c7fba24e6461c4a6c83320e0c', '2026-01-01 17:39:20', NULL, '2025-12-25 17:39:20');
INSERT INTO `refresh_tokens` VALUES (24, 1, 'e1a1dab59045f38d794d0c14a5e951aea8714008538868cc99b574918fb81745', '2026-01-01 17:48:40', NULL, '2025-12-25 17:48:40');
INSERT INTO `refresh_tokens` VALUES (25, 1, '4354563a88fd0ddefadf3b906ceb89a222185d3713d740d529dd971771c812e4', '2026-01-01 18:11:28', NULL, '2025-12-25 18:11:28');
INSERT INTO `refresh_tokens` VALUES (26, 3, '998640c270b2c3ebe6661ce94ab118a2b6c4773d1a5075e1c4c8c283531e1f13', '2026-01-01 18:16:34', NULL, '2025-12-25 18:16:34');
INSERT INTO `refresh_tokens` VALUES (27, 1, '701b3d48da0a7614ef5264cb632a9d1084ec51c717e8b957101abd023074e944', '2026-01-11 09:53:29', NULL, '2026-01-04 09:53:29');
INSERT INTO `refresh_tokens` VALUES (28, 1, '4398a7a28962fd93f29960484dd0f1395cf836a70d8562598ebb4033e38f0f43', '2026-01-12 10:54:43', NULL, '2026-01-05 10:54:43');
INSERT INTO `refresh_tokens` VALUES (29, 1, '134fc505bbcebf814e926c607ccedcf806f6cc77578799bd5f568e6634351bd4', '2026-01-12 11:19:18', NULL, '2026-01-05 11:19:18');
INSERT INTO `refresh_tokens` VALUES (30, 1, '81c2c559eb0c437a6f7f6f5db3e988941ac8b7041c38b524def7c2cf46e04ecb', '2026-01-12 11:19:28', NULL, '2026-01-05 11:19:28');
INSERT INTO `refresh_tokens` VALUES (31, 1, 'ca6e26eef0e1b8d8408aaba9da915bbc0b6c9305b332ea36b17f594b83ad21bb', '2026-01-12 12:11:24', NULL, '2026-01-05 12:11:24');
INSERT INTO `refresh_tokens` VALUES (32, 1, 'd5a4c21aa4e8a2b0c4ce9e9790b9a24952398051d6f76b56959b440b4b00eee5', '2026-01-12 12:16:19', NULL, '2026-01-05 12:16:19');
INSERT INTO `refresh_tokens` VALUES (33, 1, 'c35575993946e0e7bd6c808cd53b81bf459e6ef24a42589439e09cb36f6ab20d', '2026-01-12 12:19:09', NULL, '2026-01-05 12:19:09');
INSERT INTO `refresh_tokens` VALUES (34, 1, 'b5957bf639a9ea891b16e76464b22ce7dfa382d36a19e2bcd8f8e131b15f1d53', '2026-01-12 12:23:32', NULL, '2026-01-05 12:23:32');
INSERT INTO `refresh_tokens` VALUES (35, 1, 'cb915a311813ecc98f491fbddb90ff55a3d1b13e2bc234d509f45e9a8d37ef8b', '2026-01-12 12:26:03', NULL, '2026-01-05 12:26:03');
INSERT INTO `refresh_tokens` VALUES (36, 1, 'be09b564be58b3595f1ff45429b49847939fbbe6ee2229a1d3797588599b1d6f', '2026-01-12 14:36:21', NULL, '2026-01-05 14:36:21');
INSERT INTO `refresh_tokens` VALUES (37, 1, 'e420d9b5a1bf7f3c4f6aff870633c3df796968af6afa260edf517a8742f7235a', '2026-01-12 15:05:17', NULL, '2026-01-05 15:05:17');
INSERT INTO `refresh_tokens` VALUES (38, 1, 'c73547a75339e75246bba240a1b40540b94972fa536166106264d35883c78b31', '2026-01-12 15:15:15', NULL, '2026-01-05 15:15:15');
INSERT INTO `refresh_tokens` VALUES (39, 1, 'd75271ab0489bb519f22a00063f66fabe972415c6bcb32646eab81dfae75930f', '2026-01-12 15:18:02', NULL, '2026-01-05 15:18:02');
INSERT INTO `refresh_tokens` VALUES (40, 1, '03fdfabdfb85cce6145f78bf2a7074b2f3b405d4832d43e897df53f4199ae3d9', '2026-01-12 15:37:07', NULL, '2026-01-05 15:37:07');
INSERT INTO `refresh_tokens` VALUES (41, 1, 'c0a056f4587937b984dbc784f66829881a80857dddc8c2c23d3223fbc65f000d', '2026-01-12 15:37:08', NULL, '2026-01-05 15:37:08');
INSERT INTO `refresh_tokens` VALUES (42, 1, '84b2ae26c9ce0c2172ead3a9082d63e607f6b7ca2feb2d0e5144e99e16cd0e4f', '2026-01-21 14:43:07', NULL, '2026-01-14 14:43:07');
INSERT INTO `refresh_tokens` VALUES (43, 1, '0b679e515f6721adf7335c8ff156888c5ead887dd95755f79cb8438d9fbb542e', '2026-01-21 15:12:23', NULL, '2026-01-14 15:12:23');
INSERT INTO `refresh_tokens` VALUES (44, 1, '6e87504bc4934dfd8e9d9a92ee581ee31a1837e4e4f9f5ce154bc7545097f33a', '2026-01-21 17:40:51', NULL, '2026-01-14 17:40:51');
INSERT INTO `refresh_tokens` VALUES (45, 1, '18e9ad0f64ac4d8a9c465f26a0e8310969e2db0bf968b75e31cdea4280586afb', '2026-01-21 17:52:22', NULL, '2026-01-14 17:52:22');
INSERT INTO `refresh_tokens` VALUES (46, 1, '697a014c169a0d2471bc9ef7d400d2bd3447494b63ea1035c7d2653884461a7f', '2026-01-21 17:55:14', NULL, '2026-01-14 17:55:14');
INSERT INTO `refresh_tokens` VALUES (47, 1, '5f4a3b983d302f91fab9dd731dcbdf04d27cc611e1f75f0c3f26297326e75676', '2026-01-21 18:05:35', NULL, '2026-01-14 18:05:35');
INSERT INTO `refresh_tokens` VALUES (48, 1, 'da093bf31ab8007b78c21f6d02b393b0bb81e8636a149afa37195dc7e6e8d41c', '2026-01-21 18:07:16', NULL, '2026-01-14 18:07:16');
INSERT INTO `refresh_tokens` VALUES (49, 1, 'aec52b4843e673ca410282236e17aaa12697f9f35eabf5a5e54fc6e2f353d81a', '2026-01-21 18:09:40', NULL, '2026-01-14 18:09:40');
INSERT INTO `refresh_tokens` VALUES (50, 1, '4697dca368854842e2188ebaf5ba0838f0eff804404f5269feed3f851d412fa4', '2026-01-21 18:13:35', NULL, '2026-01-14 18:13:35');
INSERT INTO `refresh_tokens` VALUES (51, 1, '8deb6f0a8b1a28da5dd05186029c5248ce5d59e98f7aefb8901b83f2e0dd6819', '2026-01-21 19:57:03', NULL, '2026-01-14 19:57:03');
INSERT INTO `refresh_tokens` VALUES (52, 1, 'fb12513550a6ebfa406c926098dfa376aed1ecd3a1af774b40374625668efa5c', '2026-01-21 20:10:03', NULL, '2026-01-14 20:10:03');
INSERT INTO `refresh_tokens` VALUES (53, 1, 'c31c16ace964f0ab735bc2ba50f1260cff018b5a2687cfba7faae62932799340', '2026-01-21 22:09:57', NULL, '2026-01-14 22:09:57');
INSERT INTO `refresh_tokens` VALUES (54, 1, 'e54bf5ac4478f9fade252ac75f7c0b9cbffd829da097c9ac7ede017a426d127b', '2026-01-22 09:53:38', NULL, '2026-01-15 09:53:38');
INSERT INTO `refresh_tokens` VALUES (55, 1, '671bfb463e8a25e585d9a737a9c0aa33c838c417068afa6b568ed50b7922766a', '2026-01-22 18:43:01', NULL, '2026-01-15 18:43:01');
INSERT INTO `refresh_tokens` VALUES (56, 1, 'ce28f1510a9d16c5d86387076e278e514632b43cc71a24fa9195f26a51f36316', '2026-01-24 00:43:26', NULL, '2026-01-17 00:43:26');
INSERT INTO `refresh_tokens` VALUES (57, 1, '3e4a94b7d399188c8b598a661086e48efa31e5f04eb13b938ad66c0d1baa9399', '2026-01-24 00:45:52', NULL, '2026-01-17 00:45:52');
INSERT INTO `refresh_tokens` VALUES (58, 1, 'fe6c753a503db706327aae6291be646636070ef1217b698b782497b6272c390f', '2026-01-24 00:48:05', NULL, '2026-01-17 00:48:04');
INSERT INTO `refresh_tokens` VALUES (59, 1, '1f40245c0eb87c4852e7d560ae2a14751caf5c8084f51dc165113106a227c136', '2026-01-24 01:05:18', NULL, '2026-01-17 01:05:19');
INSERT INTO `refresh_tokens` VALUES (60, 1, '5e500b1a01f6af9b5109c46626d0548749113eccb73b53a703d148f8aa0c769f', '2026-01-24 01:45:39', NULL, '2026-01-17 01:45:39');
INSERT INTO `refresh_tokens` VALUES (61, 1, 'f794c1da1e6b09315920128d600fb3d4be80e2e4a1d0461002f4b3f02dd68924', '2026-01-26 09:49:37', NULL, '2026-01-19 09:49:34');
INSERT INTO `refresh_tokens` VALUES (62, 1, 'ad9932e73d1109e0bf632a1e3e96d52c3b34730309ce434a7e790fae79152680', '2026-01-26 09:55:13', NULL, '2026-01-19 09:55:10');
INSERT INTO `refresh_tokens` VALUES (63, 1, '366432426ce45b7325226bce63808dfdcaf79f4f5b214dfab2bf4830ace46982', '2026-01-26 09:55:44', NULL, '2026-01-19 09:55:41');
INSERT INTO `refresh_tokens` VALUES (64, 1, 'd015f33c168d81d63529733b35886b099d30cfdbb379dbb83b179e1ec988a84f', '2026-01-26 10:10:49', NULL, '2026-01-19 10:10:48');
INSERT INTO `refresh_tokens` VALUES (65, 1, '997a610c377864c7c7938172d951a3ba5baa64f24f3a553027ca24380db0be2e', '2026-01-26 12:01:08', NULL, '2026-01-19 12:01:06');
INSERT INTO `refresh_tokens` VALUES (66, 1, 'bd269273af66b081cc2e0cc31191d8290a4d509ccd3a79a5f48a67f5679b09fe', '2026-01-26 12:08:46', NULL, '2026-01-19 12:08:43');
INSERT INTO `refresh_tokens` VALUES (67, 1, '02de40b2f0fd10050c764ed3b0e3707e8908aa862b7b270b09a3069d196b5905', '2026-01-26 14:10:40', NULL, '2026-01-19 14:10:38');
INSERT INTO `refresh_tokens` VALUES (68, 1, '0981c01fb8e843505f5e7d1ddee3bf2de805bf4c55a2491a9c63f97fa24dd1f3', '2026-01-26 14:35:14', NULL, '2026-01-19 14:35:12');
INSERT INTO `refresh_tokens` VALUES (69, 1, '50590d6628f1a3c0e65f0fb996092eb473da5e392dc84d43d7e0401af97ec07e', '2026-01-26 14:36:58', NULL, '2026-01-19 14:36:55');
INSERT INTO `refresh_tokens` VALUES (70, 1, 'a70ac570d3d4b54b11b8013f112326f363cd284e45f0a0ee78da493a4ba0ba31', '2026-01-26 15:11:10', NULL, '2026-01-19 15:11:08');
INSERT INTO `refresh_tokens` VALUES (71, 1, 'a53cf5265571b50a637dd4d79d0c1efb260d9d7857b5f5893db625d7d373303f', '2026-01-26 15:13:21', NULL, '2026-01-19 15:13:19');
INSERT INTO `refresh_tokens` VALUES (72, 1, 'c3ffa13da5d6130a523f36302be407330f347e32ac0d78c81def58b52f6b0788', '2026-01-26 15:24:50', NULL, '2026-01-19 15:24:48');
INSERT INTO `refresh_tokens` VALUES (73, 1, 'e009068cfacf9eebac912a99913626913848743bf3d54f2c537ce68c7683efa2', '2026-01-27 10:18:24', NULL, '2026-01-20 10:18:24');
INSERT INTO `refresh_tokens` VALUES (74, 1, '3a18a53e56ab8ed23953af6b5a537c3b858771baf113edcd93dd921b7326279e', '2026-01-27 10:26:00', NULL, '2026-01-20 10:26:00');
INSERT INTO `refresh_tokens` VALUES (75, 1, '177e496a98f4eb730123adf5d27689ca7639f9997a6b1d42b08c93e11757047a', '2026-01-27 14:12:55', NULL, '2026-01-20 14:12:55');
INSERT INTO `refresh_tokens` VALUES (76, 1, '0b2c3f9692cf06d072b3dc31b211f7a15ec0e3df264c063b63c3cd18c593d96a', '2026-01-27 22:08:35', NULL, '2026-01-20 22:08:35');
INSERT INTO `refresh_tokens` VALUES (77, 1, '931a7038e8760f7a0c6db12dfdbd119b513b27e8854b531a35ddfac4acf96735', '2026-01-28 11:01:16', NULL, '2026-01-21 11:01:16');
INSERT INTO `refresh_tokens` VALUES (78, 1, '43d8c4f323f8c17671356a83e1950864d5e681a2f26e09221da5b0ff5b162f3e', '2026-01-28 11:06:47', NULL, '2026-01-21 11:06:47');
INSERT INTO `refresh_tokens` VALUES (79, 1, 'fce6a7474c6519bf3fedddc61adf4b6b6f0277830836f1d42a213a928034b3ae', '2026-01-28 14:40:08', NULL, '2026-01-21 14:40:08');
INSERT INTO `refresh_tokens` VALUES (80, 1, '435083ea6bb2677f86745de68fa0b95aa177f9fe89d25f5c9a4e576ad694b9ef', '2026-01-28 17:01:35', NULL, '2026-01-21 17:01:35');
INSERT INTO `refresh_tokens` VALUES (81, 1, '38298fd53265ad7d7cd88ffa4294a99f6b3bb93528cd4b123811f2a4c3f0fb21', '2026-01-29 09:21:26', NULL, '2026-01-22 09:21:26');
INSERT INTO `refresh_tokens` VALUES (82, 1, '544692a8d64cd3ce775cadc16b07fecffef653414e9aaafc7d2ce89b720bcdab', '2026-01-29 15:15:17', NULL, '2026-01-22 15:15:17');
INSERT INTO `refresh_tokens` VALUES (83, 1, '6526afbe75a17db642bacb78f8d15952fa1fad49a7ef73c641dae66e314e852a', '2026-01-29 19:00:43', NULL, '2026-01-22 19:00:43');
INSERT INTO `refresh_tokens` VALUES (84, 1, '6319032eca75bdef21e8190d09adb039ea3ba09dd619b458166ab352584b9b67', '2026-01-29 20:37:28', NULL, '2026-01-22 20:37:28');
INSERT INTO `refresh_tokens` VALUES (85, 1, '1c139d7ba15811aeab6fbaf5e1ffbbd09503b989e20147b53888fe997db568b0', '2026-01-29 20:40:28', NULL, '2026-01-22 20:40:28');
INSERT INTO `refresh_tokens` VALUES (86, 1, '237217160a8b9b4b39b4d6eaafb4852c0eec8c16f1a38afda33397531063e2ad', '2026-01-29 22:35:20', NULL, '2026-01-22 22:35:20');
INSERT INTO `refresh_tokens` VALUES (87, 1, 'ac3bb155e6f33b4e69f42fb883b75c092dbcd429f7a32cf01c6b3dc7024c7d64', '2026-01-29 22:38:51', NULL, '2026-01-22 22:38:51');
INSERT INTO `refresh_tokens` VALUES (88, 1, 'bc7f13cccc0d8e2d06d7d238c6014e7874c32b759d6fb5944a6ab0dac53e182f', '2026-01-30 08:56:51', NULL, '2026-01-23 08:56:51');
INSERT INTO `refresh_tokens` VALUES (89, 1, 'a4cdcb53a9e66400e7c23d1ea247f42ab87eea668418aa19fb6c83ebdba14b09', '2026-01-30 09:15:33', NULL, '2026-01-23 09:15:33');
INSERT INTO `refresh_tokens` VALUES (90, 1, '6d07c346d7fb1a5afc8aa4a7f06e672a7592aa9a2ce5e9f19283656ee2024330', '2026-01-30 09:28:57', NULL, '2026-01-23 09:28:57');
INSERT INTO `refresh_tokens` VALUES (91, 1, '2d88b3e01b1c579338413e8632a151f78f5746cb43f3721fa413c072f07cf073', '2026-01-30 09:44:09', NULL, '2026-01-23 09:44:09');
INSERT INTO `refresh_tokens` VALUES (92, 1, '4c8283d0440e7c7272c6ea0c183d8f3e6ce0c18e36a9460caa280a1d435ca5a9', '2026-01-30 09:45:57', NULL, '2026-01-23 09:45:57');
INSERT INTO `refresh_tokens` VALUES (93, 1, '4c89451e3e8abfce1a17e0827e1d6efa74fcff81e49fc66cdb5f7b817078e653', '2026-01-30 09:47:25', NULL, '2026-01-23 09:47:25');
INSERT INTO `refresh_tokens` VALUES (94, 1, '9fd74e44bc6017ff03e8c2d3edec2c326a84e121b8c67ad9a97a9dcdaf22975e', '2026-01-30 18:48:40', NULL, '2026-01-23 18:48:40');
INSERT INTO `refresh_tokens` VALUES (95, 1, 'd57567465c359f9793bfee8e918833667c06df00794062c03958d53b76eceaa1', '2026-02-02 14:12:53', NULL, '2026-01-26 14:12:53');
INSERT INTO `refresh_tokens` VALUES (96, 1, '71a1fd56007720b90a9178f357e0c133802872935502f2a27578d74e45e4556b', '2026-02-02 14:15:03', NULL, '2026-01-26 14:15:03');
INSERT INTO `refresh_tokens` VALUES (97, 1, 'd5b06256fb8a3acb16ea7f537ff1e9f7761334bf2905d4c71ec633f6378c9f08', '2026-02-03 10:13:18', NULL, '2026-01-27 10:13:18');
INSERT INTO `refresh_tokens` VALUES (98, 1, '6920d27286a991e79131c8f3abc7c3662a381d77e5a27d3f2bf850ef10aff4d8', '2026-02-04 16:11:52', NULL, '2026-01-28 16:11:52');
INSERT INTO `refresh_tokens` VALUES (99, 1, 'b948b02ee4b71dbdc26f73f2c3cb5e82b6061ea95e06adf7c01ae0de94ac939e', '2026-02-10 10:31:41', NULL, '2026-02-03 10:31:41');
INSERT INTO `refresh_tokens` VALUES (100, 1, '414f4b31878fb4e8a5ece1fdf43288856640fc400b5f7f4d1948c6b9a65e9758', '2026-02-10 10:33:03', NULL, '2026-02-03 10:33:04');
INSERT INTO `refresh_tokens` VALUES (101, 1, '25e0516fa6760001dcfc6577dba0614398c08a70bcd20ebfdc1ed9f044aaa6b5', '2026-02-10 10:35:25', NULL, '2026-02-03 10:35:25');
INSERT INTO `refresh_tokens` VALUES (102, 1, '57249e77dca1758d3dd7183f8b090c29de2e10126823256dfedf00ad4c2ab23b', '2026-02-10 14:04:52', NULL, '2026-02-03 14:04:52');
INSERT INTO `refresh_tokens` VALUES (103, 1, '0466aa6b4c0b81849c903941f16f2ee7b96dc121c354f310c8bb4ed56a092a8a', '2026-02-10 14:17:48', NULL, '2026-02-03 14:17:48');
INSERT INTO `refresh_tokens` VALUES (104, 1, 'd697c0e085bd10a7cf12bf4e0567e2197281bf84a74f7b2ceb00c524a550e1a0', '2026-02-10 14:18:46', NULL, '2026-02-03 14:18:46');
INSERT INTO `refresh_tokens` VALUES (105, 1, 'c80efa5aa27d70241084b0ad38e122d91f815c9b4659bd1652417fde623449ae', '2026-02-10 14:19:16', NULL, '2026-02-03 14:19:16');
INSERT INTO `refresh_tokens` VALUES (106, 1, '5ad37402003a26ec0c2af580d5cc57845f923203cc689951682d31c223c00db0', '2026-02-11 10:49:45', NULL, '2026-02-04 10:49:45');
INSERT INTO `refresh_tokens` VALUES (107, 1, '729bce08f3d81a32b5c4ee8ef4faabc1fc92a1c6b89993d9668753628e643b70', '2026-02-11 18:04:38', NULL, '2026-02-04 18:04:38');
INSERT INTO `refresh_tokens` VALUES (108, 1, '5ff891d896021f6d45c6f83fd1fcf4ad7023d6a1c1c91ec6f179367acfa5457c', '2026-02-12 09:49:19', NULL, '2026-02-05 09:49:18');
INSERT INTO `refresh_tokens` VALUES (109, 1, 'f3ab6d17b250cf9584723a20dd2ccbb9398726edfb9a45107ae9a150f6cee6d5', '2026-02-12 16:18:22', NULL, '2026-02-05 16:18:22');

-- ----------------------------
-- Table structure for sites
-- ----------------------------
DROP TABLE IF EXISTS `sites`;
CREATE TABLE `sites`  (
  `site_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `site_name` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `site_status` tinyint(1) NOT NULL DEFAULT 0,
  `wp_base_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `wp_auth_type` enum('basic','jwt','app_password','api_key') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `wp_auth_token` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL,
  `wp_username` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `wp_password` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `demo_site` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`site_id`) USING BTREE,
  INDEX `idx_sites_demo_site`(`demo_site` ASC) USING BTREE,
  INDEX `idx_sites_is_deleted`(`is_deleted` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of sites
-- ----------------------------
INSERT INTO `sites` VALUES ('site_012813c23372429c83d183f96228a6f7', '仕天-中文', 0, 'https://gzsuptechcn.yhct.top', 'api_key', 'pt_07fc86725e544c9e91587e4862480043', NULL, NULL, NULL, 0, '2026-02-03 11:00:45', '2026-02-03 11:07:46');
INSERT INTO `sites` VALUES ('site_0d468d9ba4e34892825aad60b9c6fb9c', '华宏-法语', 0, 'https://bjhuahongfr.yhct.top', 'api_key', 'pt_27f08218c28043489bb074c1ffa0ed0a', NULL, NULL, NULL, 0, '2026-01-14 17:52:15', '2026-01-14 17:52:43');
INSERT INTO `sites` VALUES ('site_22e043c99616432987c003d3fdd25c1c', '世挚睿得（厦门）进出口有限公司', 0, 'https://www.trustfloral.com', 'api_key', 'pt_a8003925412246ad9f0a3df31584afc5', NULL, NULL, 'demo64', 0, '2026-01-20 10:18:48', '2026-01-20 10:19:35');
INSERT INTO `sites` VALUES ('site_25cd8d92dbad4d63bd84ffed27369c19', 'test1', 0, 'https://demo55.yhct.top', 'api_key', 'pt_561f2ecd414d45a6bcfee9cf329ec309', NULL, NULL, 'demo55', 0, '2025-12-25 18:13:31', '2026-01-04 09:54:54');
INSERT INTO `sites` VALUES ('site_5e5d6eefac8f46b8aaf1ef60746fa9cc', '水星', 0, 'https://shuixingjj.yhct.top', 'api_key', 'pt_f3dc1361f6994b88a4cdfd092fe5d819', NULL, NULL, NULL, 0, '2026-01-26 14:13:50', '2026-01-26 14:14:19');
INSERT INTO `sites` VALUES ('site_6e8419425feb44a8bca9c610d896d010', '测试', 0, 'https://test123.yhct.site', 'api_key', 'pt_0e4ceb77dff94819a20334617359fef2', NULL, NULL, 'demo66', 0, '2025-12-25 16:36:40', '2026-01-05 14:45:54');
INSERT INTO `sites` VALUES ('site_6ff22b1ce7d24354bef7310ab69bb219', '测试1', 0, 'https://test123.yhct.site', 'api_key', 'pt_5fb05c37c6a24b41ac1eaee211d17408', NULL, NULL, NULL, 1, '2026-01-05 14:36:59', '2026-01-05 14:45:38');
INSERT INTO `sites` VALUES ('site_9e0e91da6da143bc8e387fd3a7c0a881', '奥克莱-法语', 0, 'https://aokelaifr.yhct.top', 'api_key', 'pt_794417b48279468e9dd039397c8a04d1', NULL, NULL, NULL, 0, '2026-02-03 10:32:04', '2026-02-03 10:32:24');
INSERT INTO `sites` VALUES ('site_d9f0ce6013d044da8cef9bfeab185e81', '苏菲亚-阿拉伯语', 0, 'https://sofeyiaar.yhct.top', 'api_key', 'pt_f4967c19c2ab44a0b1a2d9a2377ce2c5', NULL, NULL, NULL, 0, '2026-01-19 09:56:15', '2026-01-19 10:25:32');

-- ----------------------------
-- Table structure for user_sites
-- ----------------------------
DROP TABLE IF EXISTS `user_sites`;
CREATE TABLE `user_sites`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` bigint UNSIGNED NOT NULL,
  `site_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_user_sites_user_site`(`user_id` ASC, `site_id` ASC) USING BTREE,
  INDEX `idx_user_sites_site_id`(`site_id` ASC) USING BTREE,
  CONSTRAINT `fk_user_sites_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of user_sites
-- ----------------------------
INSERT INTO `user_sites` VALUES (1, 3, 'site_6e8419425feb44a8bca9c610d896d010', '2025-12-25 17:26:18');

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('admin','user') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'user',
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_users_username`(`username` ASC) USING BTREE,
  INDEX `idx_users_is_deleted`(`is_deleted` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO `users` VALUES (1, 'yeehai', '$2b$10$VLmg/FsF6wxRQjv9duGsyu2BVMV/6qfcA3.IOrPETGO4KQghu/yym', 'admin', 0, '2025-12-24 16:51:49', '2025-12-24 16:51:49');
INSERT INTO `users` VALUES (2, 'test', '$2b$10$0Ya8JS0RErA2iNH2zWrde.ldSqCMC95Ppm3R.c9o3x/YuXrVizEM2', 'user', 1, '2025-12-24 17:50:38', '2025-12-24 17:53:07');
INSERT INTO `users` VALUES (3, 'test1', '$2b$10$zAJsuHZYt3e3rY1gfJmFl.snddjAyuKosmO.7HYc9.Dks08e.Y/OK', 'user', 0, '2025-12-25 17:26:18', '2025-12-25 17:26:18');

SET FOREIGN_KEY_CHECKS = 1;
