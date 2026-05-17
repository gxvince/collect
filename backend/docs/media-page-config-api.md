# Demo 素材库与站点页面配置接口

## 设计原则
- 走最简方案，前端传什么结构，后端按 `site_id + page_id` 做整页覆盖保存。
- 不拆复杂绑定表，不做额外联表映射，优先满足“有的更新，没有的新增”。
- 素材库单独维护，站点页面配置直接存前端传入的 JSON。

## 表结构

### `demo_media_assets`
- `id`：自增主键
- `demo`：素材所属 demo
- `page`：素材所属页面标识
- `url`：图片地址，支持外部 URL 或本地上传后的相对路径

### `site_page_configs`
- `id`：自增主键
- `site_id`：站点 ID
- `page_id`：页面 ID，按字符串存储
- `materials_json`：页面素材 JSON
- `sizes_json`：页面尺寸 JSON

## 接口

### 1. 保存素材库
`POST /api/media/save`

支持两种方式：

1. `application/json`

```json
{
  "demo": "demo67",
  "page": "home",
  "url": "http://123.png"
}
```

或批量：

```json
[
  {
    "id": 1,
    "demo": "demo67",
    "page": "home",
    "url": "http://123.png"
  },
  {
    "demo": "demo68",
    "page": "home",
    "url": "http://1234.png"
  }
]
```

2. `multipart/form-data`
- 字段：`id?`、`demo`、`page`、`file`

规则：
- 有 `id`：更新该素材
- 无 `id`：新增素材
- 传 `file` 时自动写入本地并生成 `url`

### 2. 查询素材库
`GET /api/media/get`

支持：
- `?id=1`
- `?demo=demo67`
- `?demo=demo67&page=home`

规则：
- 传 `id` 时只返回单条对象
- 传 `demo` 时返回该 demo 的全部数组
- `page` 必须和 `demo` 一起使用

### 3. 保存页面素材配置
`POST /api/page_config/save_materials`

```json
{
  "site_id": "site_xxx",
  "data": {
    "page_id1": [
      {
        "id": 1,
        "demo": "demo67",
        "page": "home",
        "url": "http://123.png"
      }
    ],
    "page_id2": [
      {
        "id": 2,
        "demo": "demo67",
        "page": "about",
        "url": "http://1234.png"
      }
    ]
  }
}
```

规则：
- 后端遍历 `data`
- 按 `site_id + page_id` 查询
- 有记录就更新 `materials_json`
- 没记录就新增

### 4. 保存页面尺寸配置
`POST /api/page_config/save_sizes`

```json
{
  "site_id": "site_xxx",
  "data": {
    "page_id1": [
      {
        "module_id": 1,
        "width": 1200,
        "height": 800
      }
    ]
  }
}
```

规则：
- 按 `site_id + page_id` 保存到 `sizes_json`
- 有记录就更新，没有就新增

### 5. 查询页面配置
`GET /api/page_config/get?site_id=site_xxx&page_id=page_id1`

返回：

```json
{
  "code": 0,
  "data": {
    "site_id": "site_xxx",
    "page_id": "page_id1",
    "materials": [],
    "sizes": []
  },
  "message": "获取成功"
}
```

说明：
- 如果该页面还没保存过配置，`materials` 和 `sizes` 返回空数组
- 如果素材里的 `url` 是本地相对路径，接口会自动补成可访问地址
