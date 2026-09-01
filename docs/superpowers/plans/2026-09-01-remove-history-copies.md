# 删除历史副本实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 删除 15 个未被活跃代码引用的 Git 已跟踪历史副本，不改变运行行为。

**架构：** 不修改活跃代码。删除项均由 Git 保存历史，验证失败时停止提交并恢复本批删除。

**技术栈：** Git、rg、Jest、NestJS（JavaScript）

---

### 任务 1：删除并验证历史副本

**文件：**
- 删除：`backend/schema.sql.bak`
- 删除：所有 Git 已跟踪且文件名包含 `-vince` 的文件
- 保留：`custom-api-plugin copy.php`、`.gitignore`、`custom-api-plugin.php`

- [ ] **步骤 1：确认删除目标及活跃代码引用**

运行：

```bash
git ls-files '*-vince*' '*.bak'
rg -n "-vince|schema.sql.bak" backend/src backend/index.js backend/package.json custom-api-plugin.php --glob '!**/*-vince*'
```

预期：第一条命令列出 15 个目标；第二条命令不显示活跃代码引用。

- [ ] **步骤 2：删除精确目标**

使用补丁删除步骤 1 列出的 15 个文件，不删除未跟踪文件。

- [ ] **步骤 3：运行单元测试**

运行：`npm test -- --runInBand`

目录：`backend/`

预期：Jest 全部测试通过。

- [ ] **步骤 4：运行端到端测试**

运行：`npm run test:e2e -- --runInBand`

目录：`backend/`

预期：Jest 端到端测试通过；若因缺少外部数据库配置失败，记录原始失败原因，不声明通过。

- [ ] **步骤 5：确认提交边界并提交**

运行：

```bash
git status --short
git diff --stat -- backend/schema.sql.bak backend/src custom-api-plugin-vince.php
git add -u -- backend/schema.sql.bak backend/src custom-api-plugin-vince.php
git commit -m "chore: 删除历史代码副本"
```

预期：提交只包含 15 个历史副本的删除；用户已有改动及未跟踪插件副本保持未提交。
