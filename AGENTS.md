# Repository Guidelines


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



## 项目结构与模块组织
本仓库包含一个 NestJS（JavaScript 模式）后端与一个 WordPress 插件。后端位于 `backend/`，核心代码在 `backend/src/`，按领域拆分为 `auth/`、`user/`、`file/`、`site/`、`database/` 等模块；端到端测试在 `backend/test/`；数据库结构在 `backend/schema.sql`，迁移脚本在 `backend/migrations/`。WordPress 侧逻辑集中在根目录的 `custom-api-plugin.php`。后端需求与接口约束请先阅读 `AGENT.md`。

## 构建、测试与本地运行
在 `backend/` 目录执行命令：`npm install` 安装依赖；`npm run start` 通过 `index.js` 启动服务；`npm run start:dev` 使用 nodemon 热重载；`npm run test` 运行 Jest 单元测试；`npm run test:e2e` 运行端到端测试；`npm run test:cov` 生成覆盖率；`npm run format` 使用 Prettier 统一格式。

## 编码风格与命名规范
项目使用 JavaScript，不引入 TypeScript。格式化由 `backend/.prettierrc` 管理（单引号、尾逗号），保持 2 空格缩进并运行 `npm run format`。文件命名遵循已有风格，例如 `app.controller.js`、`*.service.js`、`*.spec.js`；模块目录使用简短名词（如 `auth`、`site`）。新增注释需简洁、中文，并避免重复描述代码本身。

## 测试指南
单元测试放在 `backend/src/**` 下，以 `.spec.js` 结尾；端到端测试放在 `backend/test/`，如 `app.e2e-spec.js`。新增接口或模块时，至少补充一个对应的单测或 e2e 校验，并保证 `npm run test` 可通过。

## 配置与安全
运行配置使用 `backend/.env`，示例模板在 `backend/.env.example`；不要在代码中硬编码密钥或站点信息。数据库表结构以 `backend/schema.sql` 为准，变更时同步更新示例配置与必要的迁移脚本。

## 提交与合并请求
当前目录未发现 `.git`，无法总结既有提交信息规范。建议提交信息使用简短动词开头（如 `feat`、`fix`、`chore`），并在合并请求中说明变更范围、关联需求/问题、以及必要的接口或截图验证。涉及 `custom-api-plugin.php` 的修改需说明对 WordPress 端兼容性的影响。
