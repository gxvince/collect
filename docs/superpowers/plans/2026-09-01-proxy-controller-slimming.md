# Proxy 控制器瘦身实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 `superpowers:subagent-driven-development`（推荐）或 `superpowers:executing-plans` 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 在保持代理 API 行为不变的前提下，删除 `ProxyController` 中重复的鉴权、站点准备和 WP 请求错误处理代码。

**架构：** 继续使用现有 `ProxyController`、`AuthService`、`SiteService` 和 `WpClientService`。在控制器内增加两个最小私有辅助方法：一个准备已认证且有站点权限的上下文，另一个执行 WP JSON/Form 请求并统一返回错误；端点保留参数映射、数据整形和特殊分支。

**技术栈：** NestJS JavaScript、Babel、Jest、Prettier、mysql2/WP HTTP 封装。

---

## 文件清单

- 修改：`backend/src/proxy/proxy.controller.spec.js` —— 补足上下文鉴权、WP 错误和请求参数的回归保护。
- 修改：`backend/src/proxy/proxy.controller.js` —— 提取重复流程并替换各端点内的重复代码。

### 任务 1：补充重构前的行为保护测试

**文件：**

- 修改：`backend/src/proxy/proxy.controller.spec.js`

- [ ] **步骤 1：添加未登录、无站点权限和 WP 错误测试**

使用现有手动构造 `ProxyController` 的方式，覆盖：

```js
it('缺少 Bearer token 时返回 401', async () => {
  const controller = new ProxyController(
    { headers: {}, query: { site_id: 'site_demo' } },
    {},
    {},
    {},
  );
  await expect(controller.getPostTypes()).resolves.toEqual({
    code: 401,
    data: null,
    message: '未登录',
  });
});

it('普通用户无站点权限时不查询站点', async () => {
  const authService = {
    verifyAccessToken: jest.fn().mockResolvedValue({ user_id: 1 }),
    findUserById: jest.fn().mockResolvedValue({ id: 1, role: 'user' }),
    hasUserDisabledSites: jest.fn().mockResolvedValue(false),
    getUserSiteIds: jest.fn().mockResolvedValue([]),
  };
  const siteService = { findById: jest.fn() };
  const controller = new ProxyController(
    { headers: { authorization: 'Bearer token' }, query: { site_id: 'x' } },
    authService,
    siteService,
    {},
  );
  await expect(controller.getPostTypes()).resolves.toEqual({
    code: 403,
    data: null,
    message: '无权限',
  });
  expect(siteService.findById).not.toHaveBeenCalled();
});
```

再补一个 WP 非成功响应测试，断言 `/post_types` 的请求参数及 `wrapWpError` 结果不变。

- [ ] **步骤 2：运行测试确认测试可执行**

运行：`cd backend && npx jest src/proxy/proxy.controller.spec.js --runInBand`

预期：新增断言通过；若测试暴露现有调用契约问题，先记录实际失败，不修改生产代码绕过断言。

- [ ] **步骤 3：Commit**

```bash
git add backend/src/proxy/proxy.controller.spec.js
git commit -m "test: 补充代理控制器瘦身回归保护"
```

### 任务 2：提取站点代理上下文

**文件：**

- 修改：`backend/src/proxy/proxy.controller.js:20-112` 及各端点鉴权段

- [ ] **步骤 1：增加统一上下文方法**

增加以下方法，返回 `{ user, site, pageScope }` 或 `{ error }`；错误统一转换为当前端点使用的 `{ code, data: null, message }`，页面权限错误保留 `buildPagePermissionDenied()` 的数据结构：

```js
async getProxyContext(siteId, pageId = 0) {
  const auth = await this.getAuthUser();
  if (auth.error) return { error: this.toProxyResponse(auth.error) };
  if (!siteId) return { error: { code: 422, data: null, message: '参数错误' } };
  if (!(await this.checkSitePermission(auth.user, siteId))) {
    return { error: { code: 403, data: null, message: '无权限' } };
  }
  if (pageId && !(await this.checkPagePermission(auth.user, siteId, pageId))) {
    return { error: this.buildPagePermissionDenied(siteId, pageId) };
  }
  const target = await this.getSiteForProxy(siteId);
  if (target.error) return { error: this.toProxyResponse(target.error) };
  const pageScope = pageId ? null : await this.authService.getUserPagePermissionScope(auth.user, siteId);
  return { user: auth.user, site: target.site, pageScope };
}

toProxyResponse(error) {
  return { code: error.code, data: null, message: error.message };
}
```

如现有端点需要页面范围但不需要单页 `pageId`，保留一个明确的 `getPageScope` 调用，避免用 `pageId=0` 推断两种语义。

- [ ] **步骤 2：逐端点替换重复鉴权段**

按现有路由顺序替换 `get_pages`、Elementor、媒体、站点设置、SMTP、商品、新闻和短描述端点的重复片段。每次替换只改局部变量来源，不改端点的 WP path、method、body、分页或返回数据处理。

- [ ] **步骤 3：运行代理测试**

运行：`cd backend && npx jest src/proxy/proxy.controller.spec.js --runInBand`

预期：全部通过，且测试中的 `getUserPagePermissionScope` 调用参数保持为原用户对象和站点 ID。

- [ ] **步骤 4：Commit**

```bash
git add backend/src/proxy/proxy.controller.js
git commit -m "refactor: 提取代理站点上下文校验"
```

### 任务 3：提取 WP 请求与错误包装

**文件：**

- 修改：`backend/src/proxy/proxy.controller.js` 各 WP 请求端点

- [ ] **步骤 1：增加最小请求辅助方法**

保留 `WpClientService.requestJson()` 与 `requestForm()` 的现有选择，在 Controller 内只统一失败分支：

```js
async requestProxy(site, path, options = {}, errorPath = path) {
  const result = options.form
    ? await this.wpClientService.requestForm(site, path, options.form, options.headers)
    : await this.wpClientService.requestJson(site, path, options);
  return result.ok ? { result } : { error: this.wrapWpError(result, errorPath) };
}
```

上传端点继续传 `form`；JSON 端点继续传原有 `method`、`body` 和 `headers`。

- [ ] **步骤 2：替换可直接复用的失败分支**

替换普通 GET/POST、商品/新闻 CRUD、站点设置和上传路径。保留 Elementor fallback、媒体 fallback、列表分页和成功数据解包等特殊逻辑，不强行合并。

- [ ] **步骤 3：运行完整验证**

运行：

```bash
cd backend && npx jest --runInBand
cd backend && npm run format -- --check
node -e "require('@babel/register'); require('./backend/src/proxy/proxy.controller.js')"
```

预期：所有 Jest 测试通过，格式检查通过，控制器可被 Babel 加载。

- [ ] **步骤 4：对抗式检查并 Commit**

检查 `@Get/@Post` 路由数量、`requestJson/requestForm` 调用路径、所有 `site_id` 分支及上传/Elementor 特殊分支；确认 `git diff --check` 无空白错误后提交：

```bash
git diff --check
git add backend/src/proxy/proxy.controller.js backend/src/proxy/proxy.controller.spec.js
git commit -m "refactor: 精简代理控制器重复请求流程"
```

## 规格覆盖与自检

- 规格中的“只改 Controller 内部”由任务 2、3 覆盖；无新增 Service、Guard 或依赖。
- 规格中的“保持路由、参数、响应和 WP 路径”由任务 1 的回归测试及任务 3 的对抗式检查覆盖。
- 计划未包含删除权限校验、异常处理或输入验证；这些属于安全边界，保持原样。
- 计划中的所有方法名、文件路径和验证命令已明确，无 TODO、待定或占位步骤。
