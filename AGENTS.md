# Repository Guidelines

## 项目结构

NestJS（JavaScript 模式）后端 + WordPress 插件。需求基线见 `AGENT.md`。

- `backend/src/` — 核心代码，按领域拆分：`auth/`、`user/`、`file/`、`site/`、`proxy/`、`media/`、`pageconfig/`、`translate/`、`database/`
- `backend/test/` — 端到端测试
- `backend/schema.sql` — 数据库表结构；`backend/migrations/` — 迁移脚本
- `custom-api-plugin.php`（根目录）— WordPress 插件，所有 WP 对接统一通过此插件

## 架构要点（非显而易见）

- **无 TypeScript**：Babel 转译装饰器语法（`.babelrc` + `@babel/plugin-proposal-decorators`）。不能用 TypeScript 参数装饰器，NestJS 装饰器用法需适配 JS 模式。
- **入口链**：`backend/index.js` → `@babel/register` → `src/main.js`（`npm run start`）；`nodemon` 开发模式另走 `node index --exec babel-node`。默认端口 3501，可通过 `PORT` 覆盖。
- **无 ORM，直写 SQL**：Service 层使用 `mysql2/promise` 连接池，通过 NestJS provider token `'DB_POOL'` 注入（见 `database.providers.js`）。新增 Service 需 `@Inject('DB_POOL')` 获取连接池。
- **`-vince` 后缀文件**：开发变体/备份（如 `main-vince.js`、`auth.service-vince.js`），非活跃代码，不要修改或引用。
- **权限两层**：角色守卫（admin 全权限）→ 站点授权守卫（user_sites 多对多校验）。普通用户访问站点接口必须校验 `site_id` 归属。
- **WP 代理**：所有 WordPress 请求通过 `WpClientService` 统一封装（fetch + AbortController 超时 + 鉴权头），插件端点前缀 `/wp-json/custom-db-api/v1/*`。
- **响应格式**：统一 `{ code, data, message }`，`code=0` 成功；分页参数 `page`/`page_size`，上限 100。

## 命令（在 `backend/` 目录执行）

```bash
npm install              # 安装依赖
npm run start            # babel-node 启动（端口 3501）
npm run start:dev        # nodemon 热重载（自动 kill 旧端口）
npm run test             # Jest 单元测试（匹配 src/**/*.spec.js）
npm run test:e2e         # 端到端测试（test/jest-e2e.json）
npm run format           # Prettier 格式化
```

运行单个测试：`npx jest --testPathPattern <pattern>`（在 `backend/` 下）。

## 编码风格

JavaScript，2 空格缩进。Prettier 配置（`backend/.prettierrc`）：`singleQuote: true`、`trailingComma: "all"`。文件命名：`*.controller.js`、`*.service.js`、`*.module.js`、`*.spec.js`。注释中文简洁，不重复描述代码本身。

## 配置与安全

运行配置用 `backend/.env`，示例模板 `backend/.env.example`。不要硬编码密钥或站点信息。数据库表结构以 `backend/schema.sql` 为准，变更时同步 `.env.example` 与迁移脚本。

## 提交

提交信息用简短动词前缀（`feat`、`fix`、`chore`）。涉及 `custom-api-plugin.php` 的修改需说明对 WordPress 端兼容性的影响。
