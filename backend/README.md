# backend

## Description



## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## 内容创建接口开关

`POST /api/proxy/content_create` 默认关闭。修改后端实际使用的 `.env` 或部署环境变量：

```dotenv
# 关闭（未配置或非 true 也会关闭）
PROXY_CONTENT_CREATE_ENABLED=false
# 开启时改为
# PROXY_CONTENT_CREATE_ENABLED=true
```

修改后通过现有进程管理器重启后端；多实例部署需更新并重启全部实例。
无需重新发布代码（首次部署本改动后），无需数据库迁移。
此开关为启动配置，不支持仅保存 `.env` 即热更新；部署平台注入的同名环境变量优先于 `.env`。
关闭时返回 `{ code: 503, data: null, message: '内容创建接口暂时禁用' }`，不转发 WordPress 请求。
这里的 503 为统一响应体中的业务码，HTTP 状态沿用现有接口约定。
开启后仍按原有登录和站点权限规则校验。开关不取消已发往 WordPress 的在途请求，也不影响直接调用 WordPress 插件接口。
