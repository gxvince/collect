# Proxy 控制器瘦身设计

## 目标

在不改变现有 API 行为的前提下，减少 `backend/src/proxy/proxy.controller.js` 中重复的鉴权、站点授权、WP 请求和错误处理代码。

## 范围

- 保留全部路由、HTTP 方法、参数名称、WP 路径和响应格式。
- 保留现有参数清洗、`site_id` 校验、payload 字段删除及异常语义。
- 只在 `ProxyController` 内提取私有辅助方法，不新增 Service、Guard 或第三方依赖。
- 不顺带调整权限架构或修改 WordPress 插件。

## 实现

1. 先为现有控制器关键路径补最小测试保护。
2. 将完全重复的用户认证、站点归属校验、WP 调用和错误包装提取为 Controller 私有方法。
3. 各端点仅保留自身的参数映射和业务差异。
4. 对比重构前后的路由与调用参数，避免把不同端点错误合并。

## 验证

- `proxy.controller.spec.js`
- 全量 Jest 单元测试
- Prettier 与 Babel 语法检查
- 检查控制器路由数量和 WP 请求路径未发生变化

## 明确不做

本轮不迁移 Nest Guard、不拆分新 Service、不统一所有领域控制器，也不追求一次性消除所有重复代码。
