# 健康调试页瘦身设计

## 目标

将 `backend/src/health.view.html` 从专用 API 管理台缩减为健康状态页与通用请求器，在不改变 `/health/view` 路由的前提下降低维护成本。

## 页面能力

- 页面加载时请求 `/health`，展示整体状态与 checks。
- 登录表单调用 `/api/auth/login`，访问令牌仅保存在页面内存。
- 通用请求器支持 GET、POST、任意相对路径、JSON 请求体、FormData 字段和单文件上传。
- 输出请求摘要、HTTP 状态、格式化响应及网络错误。

## 删除范围

- 删除用户、文件、素材、页面配置、站点、WordPress 和翻译接口的专用表单。
- 删除与专用表单绑定的 DOM 查询、文案注入、请求函数和事件监听。
- 不增加接口预设、OpenAPI、前端框架或第三方依赖。

## 安全边界

- 仅允许请求当前站点的相对路径，拒绝绝对 URL。
- 密码和访问令牌不写入 localStorage、sessionStorage 或页面输出。
- 文件上传沿用浏览器原生 FormData，不手写 multipart 边界。

## 文件与验证

- 重写 `backend/src/health.view.html`，目标不超过 250 行。
- 扩展 `backend/test/app.e2e-spec.js`，验证 HTML、Content-Type 及三个核心区域。
- 更新 `AGENT.md` 变更记录，说明专用表单由通用请求器替代。
- 运行单元测试、E2E 和 Prettier 检查。

## 验收标准

- `/health/view` 返回 200 和 `text/html; charset=utf-8`。
- 页面包含健康状态、登录和通用请求器区域。
- GET、JSON POST 和 FormData/文件请求均由同一个提交函数处理。
- 文件总行数不超过 250，测试全部通过。
