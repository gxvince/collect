# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.



## 项目概述

WordPress Elementor 素材管理系统。后端 NestJS（JavaScript 模式）+ WordPress 插件 `custom-api-plugin.php`，前端 Vue（不在本仓库）。核心能力：多站点管理、用户权限（admin/user）、Elementor 数据代理读写、文件上传绑定、翻译。

## 命令（在 `backend/` 下执行）

```bash
npm install                           # 安装依赖
npm run start                         # 生产启动（babel-node index.js，端口 3501）
npm run start:dev                     # nodemon 热重载开发
npm run test                          # Jest 单元测试（.spec.js）
npm run test:e2e                      # 端到端测试
npm run test:cov                      # 测试覆盖率
npm run format                        # Prettier 格式化（单引号、尾逗号、2空格缩进）
```

数据库：MySQL `collect` 库，表结构见 `backend/schema.sql`，迁移脚本见 `backend/migrations/`。

## 架构

### 模块分层

```
backend/src/
├── main.js                          # 入口：CORS、静态资源 /uploads、JSON body 限制 10MB
├── app.module.js                    # 根模块，导入所有子模块，ConfigModule 全局
├── database/                        # MySQL 连接池（mysql2/promise），provide 'DB_POOL'
├── auth/                            # JWT 登录/刷新/me/改密，bcrypt 密码哈希，refresh_tokens 表存储
├── user/                            # 用户增删改查（软删 is_deleted），user_sites 多对多授权
├── site/                            # 站点创建/绑定/删除/列表，plugin_token 机制
├── proxy/                           # WordPress 代理（核心模块）
│   ├── wp-client.service.js         #   统一封装：fetch + AbortController 超时、鉴权头构建、JSON/Form 请求
│   └── proxy.controller.js          #   代理接口：页面列表、Elementor CRUD、媒体、产品、新闻、SMTP 等
├── file/                            # 文件上传（multer），本地存储 uploads/{site_id}/{yyyyMMdd}/
├── media/                           # Demo 素材库
├── pageconfig/                      # 站点页面配置（materials_json / sizes_json）
└── translate/                       # 阿里云机器翻译（可配置 provider）
```

### 关键设计

- **不用 TypeScript**，Babel 转译装饰器语法。入口 `backend/index.js` → `@babel/register` → `main.js`。
- **响应格式统一**：`{ code, data, message }`，`code=0` 成功，分页参数 `page`/`page_size`（上限100）。
- **鉴权**：JWT access token（2h）+ refresh token（7d），Bearer 头。refresh token 存库可撤销（sha256 hash）。
- **权限两层**：角色（admin 全权限）→ 站点授权（user_sites 多对多）→ 页面级授权（user_site_pages 表的 allow 字段）。
- **WP 代理**：所有 WP 请求通过 `WpClientService` → WordPress 插件 REST API `/wp-json/custom-db-api/v1/*`。支持完美链接（pretty permalink）和 `?rest_route=` 回退。认证类型：api_key / basic / jwt。
- **数据库直连**：不用 ORM，Service 层直接写 SQL，通过 `'DB_POOL'` 注入连接池。
- **`-vince` 后缀文件**：开发变体/备份（如 `main-vince.js`、`auth.service-vince.js`），非活跃代码。

### WordPress 插件对接

插件 `custom-api-plugin.php` 部署在 WordPress 站点侧，提供：
- `/wp-json/custom-db-api/v1/*` REST 端点
- API Key 鉴权（通过 `plugin_token` 配置）
- 后台设置页：系统地址、所属 Demo、插件对接 Token、手动绑定站点 URL
- 端点：`publish_pages`、`elementor_data`、`update_elementor_data`、`upload_file`、`delete_file`、`product*`、`news*`、`site_icon`、`site_title`、`smtp_*`、`post_types`、`content_create` 等

### 数据表核心关系

```
users ──< user_sites >── sites
users ──< user_site_pages (page_id 级细粒度权限)
files (site_id + elementor_id + file_url)
demo_media_assets (demo + page + url)
site_page_configs (site_id + page_id + materials/sizes JSON)
refresh_tokens (user_id + sha256 hash + 过期/撤销)
```

## AGENT.md

仓库根目录的 `AGENT.md` 是需求基线文档，包含完整接口清单、数据模型、错误码定义和实施计划。所有接口变更应以该文件为参照。
