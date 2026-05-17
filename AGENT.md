# WordPress Elementor 素材管理系统 - 后端实施需求基线
本文件为后续开发的唯一需求基线，所有实现必须严格遵循；若需变更必须在此文件中更新并记录原因与影响。

## 0. 目标与范围
- 为 Elementor 素材管理提供登录、用户管理、截图上传绑定、WordPress 代理与翻译能力。
- 前端已完成 Vue 框架；后端负责 REST API 与数据存储。
- 以 KISS/YAGNI/SOLID/DRY 为工程准则，优先完成明确需求，拒绝过度设计。

## 1. 技术选型与约束
- 框架：NestJS（JavaScript 模式，不使用 TypeScript）。
- 数据库：MySQL（utf8mb4，InnoDB）。
- 运行环境：Node.js LTS。
- 配置：`.env` + ConfigModule，禁止在代码内硬编码密钥或站点信息。
- 编码：UTF-8（无 BOM）。
- 响应语言：接口返回消息使用中文；日志可中英混合但需清晰可读。

## 2. 角色与权限模型
- 仅两类角色：`admin`、`user`。
- `admin` 具备全部权限，不受站点授权限制。
- `user` 仅能访问授权站点（`site_id` 级别授权）。
- 站点授权为用户与站点多对多关系（`user_sites` 表）。
- 所有站点相关接口必须显式传入 `site_id`，不得使用默认站点。

## 3. 站点与 WordPress 配置
- 站点由 `site_id` 唯一标识；域名变更不影响 `site_id`。
- 每个站点需配置 WordPress 访问信息（建议表 `sites` 维护）：
  - `site_id`（主键）
  - `site_name`
  - `site_status`（0=建站中，1=可上线）
  - `wp_base_url`
  - `wp_auth_type`（basic / jwt / app_password / api_key）
  - `wp_auth_token` 或 `wp_username/wp_password`（按认证方式存储）
  - `demo_site`（所属 demo，可空）
- 所有 WP 代理请求必须基于 `site_id` 读取站点配置。
- 默认不对外提供站点配置的增删改接口，站点数据由运维/管理员在数据库中维护。
- 所有 WordPress 相关对接统一通过 `custom-api-plugin.php` 插件提供的接口进行。

## 4. 数据模型（必备表）
1) `users`
- `id` (pk)
- `username` (unique)
- `password_hash`
- `role` enum('admin','user')
- `is_deleted` tinyint(1)
- `created_at`, `updated_at`

2) `user_sites`
- `id` (pk)
- `user_id` (fk -> users.id)
- `site_id` (varchar)
- `created_at`

3) `files`
- `id` (pk)
- `site_id`
- `elementor_id`
- `file_url`（本地路径或可访问 URL）
- `meta` (json, 可空)
- `created_by` (fk -> users.id)
- `is_deleted` tinyint(1)
- `created_at`

4) `sites`
- `site_id` (pk)
- `site_name`
- `site_status` tinyint(1)（0=建站中，1=可上线）
- `wp_base_url`
- `wp_auth_type`
- `wp_auth_token` 或 `wp_username`/`wp_password`
- `demo_site`（所属 demo，可空）
- `is_deleted` tinyint(1)
- `created_at`, `updated_at`

5) `refresh_tokens`
- `id` (pk)
- `user_id` (fk -> users.id)
- `token_hash`（sha256）
- `expires_at`
- `revoked_at` (可空)
- `created_at`

6) `demo_media_assets`
- `id` (pk)
- `demo`
- `page`
- `url`
- `created_at`, `updated_at`

7) `site_page_configs`
- `id` (pk)
- `site_id`
- `page_id`
- `materials_json`（json，可空）
- `sizes_json`（json，可空）
- `created_at`, `updated_at`

## 5. 接口清单（必须实现）
### 5.1 认证授权
- `POST /api/auth/login`：`{ username, password }` -> `{ access_token, refresh_token, user }`
- `POST /api/auth/refresh`：`{ refresh_token }` -> `{ access_token }`
- `GET /api/auth/me`：返回当前用户信息与授权站点列表
- `POST /api/auth/change_password`：`{ old_password, new_password }`

兼容：
- 保留 `POST /api/login` 作为兼容入口，最终转发到 `/api/auth/login`。

### 5.2 用户管理
- `GET /api/user/list`：仅管理员
- `GET /api/user/deleted`：仅管理员，查询已删除用户
- `GET /api/user/:id`：管理员任意；普通用户仅能访问自己
- `POST /api/user/add`：管理员，支持 `site_ids` 写入 `user_sites`
- `POST /api/user/update`：管理员可修改任意；普通用户仅修改自己且限制字段
- `POST /api/user/delete`：软删，管理员专属
- `POST /api/user/restore`：管理员恢复软删用户

### 5.3 截图与 Elementor 绑定
- `POST /api/file/upload`：multipart，`site_id` + `elementor_id` + 文件
- `GET /api/file/get`：query `site_id`, `elementor_id?`, `page?`, `page_size?`

### 5.3.1 Demo 素材库与页面配置
- `POST /api/media/save`：保存素材库，支持 JSON 或 multipart（`demo`、`page`、`url/file`）
- `GET /api/media/get`：query `id` 或 `demo` + `page?`
- `POST /api/media/delete`：body `{ id }`，硬删除（DB 记录 + 本地文件），仅管理员
- `POST /api/page_config/save_materials`：body `{ site_id, data }`
- `POST /api/page_config/save_sizes`：body `{ site_id, data }`
- `GET /api/page_config/get`：query `site_id`, `page_id`

### 5.4 WordPress 代理
- `GET /api/proxy/get_pages`：query `site_id`
- `GET /api/proxy/elementor_data/:id`：query `site_id`
- `POST /api/proxy/update_elementor_data`：body `{ site_id, id, data }`
- `POST /api/proxy/upload_image`：multipart + `site_id`

### 5.4.1 站点创建与绑定
- `POST /api/site/create`：管理员创建站点，填入 `site_url` 后自动向插件发起一键注册，返回 `plugin_token`
- `POST /api/site/update`：管理员更新站点（`site_name`、`site_url`、`demo_site`、`site_status`）
- `POST /api/site/bind`：管理员手动触发后端向插件注册（用于 URL 变更后重新绑定）
- `POST /api/site/bind_url`：插件端向系统发起绑定（旧版兼容，保留）
- `POST /api/site/delete`：管理员软删站点
- `GET /api/site/list`：站点列表（支持 `keyword` 模糊查询、`site_status`/`demo_site` 筛选、`include_deleted=1` 查询已删站点）

### 5.5 翻译
- `POST /api/proxy/translate`：`{ text, target_lang, source_lang? }`

### 5.6 系统状态
- `GET /health`：`{ code, data: { status, checks }, message }`，checks 包含应用、数据库、认证与用户模块依赖状态；后续接口状态以此为准
- `GET /health/view`：HTML 展示页（与 `/health` 数据一致），用于排障查看细节与调试入口

## 6. 鉴权与会话规则
- JWT payload 必含 `user_id`、`role`。
- access token 默认 2 小时过期；refresh token 默认 7 天过期（可在 `.env` 调整）。
- refresh token 必须可撤销：采用数据库 `refresh_tokens` 存储（sha256 hash + 过期与撤销字段）。
- 密码必须使用 bcrypt 哈希存储。
- 登录失败需统一错误，不泄露“账号存在性”。

## 7. 权限校验规则
- 普通用户访问站点接口必须校验 `site_id` ∈ `user_sites`。
- 管理员跳过站点校验。
- 软删记录（`is_deleted=1`）不得出现在列表或查询结果中（管理员可用 `include_deleted=1` 查看）。
- `/api/user/update` 必须限制普通用户可更新字段（禁止修改角色与站点授权）。

## 8. 文件上传与存储
- 初期采用本地存储：`uploads/{site_id}/{yyyyMMdd}/`。
- 允许格式：png/jpg/jpeg/webp；默认单文件 ≤ 10MB（可配置）。
- 记录 `file_url` 与 `site_id`、`elementor_id`、`created_by` 绑定。
- 文件软删：仅标记记录，不立即物理删除。
- 命名冲突需自动处理（追加时间戳或随机串）。

## 9. WordPress 代理与安全
- 统一 `WpClientService` 封装请求、鉴权、超时（10-15s）、错误转换。
- WP 错误需转换为 502，并保留可诊断 message（不泄露凭证）。
- 禁止跳过 `sites` 配置直接访问 WP。

## 10. 翻译实现约束
- 翻译服务必须可配置（`.env` 指定 provider 与密钥）。
- 若未配置 provider，接口返回 501 并提示“未配置翻译服务”。
- 响应结构与其他接口一致。

## 11. 统一响应与分页
- 统一响应：`{ code, data, message }`。
- `code=0` 表示成功；非 0 为错误。
- 分页参数：`page`（默认 1）、`page_size`（默认 20，上限 100）。
- 统一时间字段格式：ISO 8601 字符串（UTC）。

## 12. 错误码（最小集合）
- 401 未登录
- 403 无权限（含站点未授权）
- 404 资源不存在或已软删
- 409 冲突（如用户名已存在）
- 422 参数错误
- 500 服务端错误
- 502 WP 代理错误
- 501 未实现/未配置（如翻译未配置）

## 13. 安全与运维
- 登录接口需最小限流（每 IP 每分钟 10 次，可配置）。
- 关键操作记录审计日志：登录、用户增删改、文件上传、代理更新。
- CORS 仅允许前端域名白名单（配置项）。
- 日志需包含 request_id 便于追踪。

## 14. 配置项（.env.example 必须提供）
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`
- `JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`
- `UPLOAD_DIR`, `UPLOAD_MAX_SIZE_MB`
- `TRANSLATE_PROVIDER`, `TRANSLATE_API_KEY`（如需要）
- `CORS_ORIGIN`
- `WP_REQUEST_TIMEOUT_MS`

## 15. 交付标准
- 所有接口按本文件实现并通过最小验证：
  - 登录与鉴权
  - 普通用户站点越权拦截
  - 用户增改删（软删）
  - 文件上传与绑定查询
  - WP 代理成功/失败处理
  - 翻译接口可配置与未配置时的明确错误
- 提供 `.env.example` 与启动说明（不含敏感信息）。

## 16. 实施计划（里程碑）
1) 基础工程与依赖
   - 初始化 NestJS（JS 模式）
   - 配置 `.env` 与 ConfigModule
   - 建立 MySQL 连接与迁移方案
2) 认证与权限
   - JWT 登录/刷新/me
   - 角色守卫与站点授权守卫
   - 登录限流与审计日志
3) 用户与站点授权
   - 用户增删改查（含软删）
   - 普通用户字段限制
   - `user_sites` 授权维护
4) 文件上传与绑定
   - multer 上传与本地存储
   - `files` 表记录与查询
   - 站点权限校验与分页
5) WP 代理能力
   - `WpClientService` 封装
   - 页面列表/单页数据/更新/媒体上传
   - 超时与错误转换
6) 翻译服务
   - Provider 配置与接口实现
   - 未配置时 501 行为
7) 验证与交付
   - 最小接口验证脚本或说明
   - `.env.example` 与启动文档

### 当前进度（同步）
- 已生成 NestJS JS 项目骨架（`backend/`）。
- 已安装 `@nestjs/config`、`mysql2`、`@nestjs/jwt`、`bcrypt`、`multer` 依赖。
- 已接入 ConfigModule（全局）与 MySQL 连接池 `DB_POOL`。
- 已提供 `backend/.env`、`backend/.env.example` 与 `backend/schema.sql`（含 `refresh_tokens`）。
- 已新增 `/health` 状态接口（含数据库探活）与 `/health/view` 排障展示页。
- 已实现认证基础接口：`/api/auth/login`、`/api/auth/refresh`、`/api/auth/me`、`/api/auth/change_password`，并保留 `/api/login` 兼容入口。
- 已实现用户管理接口：`/api/user/list`、`/api/user/:id`、`/api/user/add`、`/api/user/update`、`/api/user/delete`、`/api/user/deleted`、`/api/user/restore`。
- 已实现文件上传与绑定接口：`/api/file/upload`、`/api/file/get`（含权限校验与分页）。
- 已实现 Demo 素材库与页面配置接口：`/api/media/save`、`/api/media/get`、`/api/page_config/save_materials`、`/api/page_config/save_sizes`、`/api/page_config/get`。
- 已实现站点创建与绑定接口：`/api/site/create`、`/api/site/bind_url`、`/api/site/delete`、`/api/site/list`（支持模糊查询与筛选）。
- `/health/view` 已补充用户、文件与站点的调试入口（含筛选与软删查询）。

## 17. 变更记录
- 初始版本：由项目负责人确认后生效。
- 2025-12-24：同步当前进度，新增 `/health` 状态接口；影响：提供健康检查入口，不影响既有接口。
- 2025-12-24：`/health` 增加数据库探活与依赖检查输出；影响：后续接口状态检测统一入口。
- 2025-12-24：新增 `refresh_tokens` 表并采用数据库存储 refresh token；影响：满足可撤销与持久化要求。
- 2025-12-24：`/health` 增加展示页 `/health/view`；影响：便于排障查看细节。
- 2025-12-24：实现认证基础接口与 `/api/login` 兼容入口；影响：登录与会话能力可用。
- 2025-12-24：移除参数装饰器用法以适配 JS 模式运行；影响：避免启动时报语法错误。
- 2025-12-24：实现用户管理接口模块；影响：支持用户增删改查并执行权限控制与软删。
- 2025-12-24：`/health` 增加认证与用户模块依赖检测；影响：统一接口状态检查入口更完整。
- 2025-12-24：`/health/view` 增加认证与用户模块调试按钮；影响：可在同一页面触发登录与用户列表测试。
- 2025-12-24：`/health` 表结构检测改为 `SHOW TABLES` 并补全当前库名；影响：避免权限导致的误报，排障更清晰。
- 2025-12-24：`/health/view` 调试脚本增强可视化反馈与错误提示；影响：按钮点击无反应问题可排查。
- 2025-12-24：WordPress 插件启用 API Key 鉴权并修复 SQL 注入与上传校验问题；影响：提升接口安全性与稳定性。
- 2025-12-24：明确 WordPress 相关对接统一使用 `custom-api-plugin.php` 插件；影响：对接路径单一化，便于管理。
- 2025-12-24：WordPress 插件新增媒体删除接口 `/delete_file`；影响：支持替换场景的旧文件清理。
- 2025-12-24：实现文件上传与绑定模块并纳入 `/health` 检测；影响：支持文件上传与查询，便于运行监测。
- 2025-12-24：`/health/view` 增加文件上传与查询调试入口；影响：可一页完成上传与查询验证。
- 2025-12-24：`/health/view` 增加用户与站点授权调试入口；影响：可在页面完成用户增删改查与授权维护测试。
- 2025-12-24：`/health/view` 用户查询支持用户名过滤与重置按钮；影响：调试更高效。
- 2025-12-24：站点创建与绑定流程改为 `plugin_token` 绑定；影响：对接流程简化。
- 2025-12-24：新增 `site_name` 与 `demo_site` 字段并支持站点列表接口；影响：站点信息更完整。
- 2026-01-04：站点状态改为数值（0/1）并新增 `sites.is_deleted` 软删；影响：站点状态统一与软删查询可用。
- 2026-01-04：`/api/site/list` 支持模糊查询、状态与 demo 筛选及 `include_deleted`；影响：站点查询更灵活。
- 2026-01-04：新增 `/api/site/delete` 与 `/health/view` 站点调试入口扩展；影响：支持站点软删与排障调试。
- 2026-01-04：/health/view 文本改为脚本注入中文；影响：Windows 环境下中文不再乱码。
- 2026-01-04：/health/view 调试页改为全中文显示；影响：避免界面出现英文与乱码混杂。
- 2026-01-05：移除 AGENT.md 末尾 5 行乱码变更记录（内容已损坏）；影响：待确认原始内容后再补录。
- 2026-01-05：中文乱码原因与修复：原因多为 UTF-8 内容被非 UTF-8（如 ANSI/Latin-1）保存或显示导致；修复为统一以 UTF-8（无 BOM）读写并避免翻译工具改写引号/编码。预防：编辑器固定 UTF-8、禁止自动转码、翻译后做编码与语法校验。
- 2026-01-05：新增 WP 代理模块，统一封装插件 API 请求、鉴权与超时处理，并提供 `/api/proxy/*` 对接入口；影响：开始对接 WordPress 插件接口。
- 2026-05-15：新增一键注册机制。插件端新增 `/register` 端点（REGISTER_KEY 鉴权），后端 `create` 支持填入 URL 自动注册、新增 `/api/site/update` 和 `/api/site/bind`；Demo 素材库新增 `/api/media/delete` 硬删除接口。影响：站点对接流程从双向手动简化为后端单向推送，插件设置页保留但非必需。



## 18. WordPress 插件对接
- 站点侧插件使用 API Key 进行鉴权，所有对外接口必须校验。
- API Key 由系统生成（`plugin_token`），在插件后台配置后生效（写入 `custom_db_api_key`）。
- 可选：在 `wp-config.php` 配置 `CUSTOM_DB_API_KEY` 覆盖站点配置。
- 后续所有 WordPress 相关对接均通过 `custom-api-plugin.php` 插件接口完成。
- 插件支持媒体上传与删除：`/upload_file`、`/delete_file`（按 `attachment_id` 物理删除）。
- 插件后台可配置“系统地址”，并手动触发“绑定站点 URL”。
- 插件后台支持配置“所属 Demo”与“插件对接 Token”，绑定时使用 `plugin_token` 校验。
