# 菜谱封面上传接口对接清单

本文档用于前端对接“菜谱封面上传、登记、绑定、展示”能力。

适用范围：

- 本期仅支持菜谱封面
- `purpose` 固定为 `cover`
- 图片格式仅支持 `jpg/png/webp`
- 业务链路为：申请上传授权 -> 直传 COS -> 登记资源 -> 绑定菜谱封面 -> 读取展示

## 1. 通用说明

### 1.1 鉴权

除直传 COS 外，本文档中的后端接口均需携带：

```http
Authorization: Bearer <token>
```

### 1.2 请求体格式

涉及请求体的后端接口统一使用：

```http
Content-Type: application/json
```

### 1.3 统一响应格式

后端接口统一返回以下结构：

成功：

```json
{
  "success": true,
  "data": {},
  "requestId": "req_xxx"
}
```

失败：

```json
{
  "success": false,
  "error": {
    "code": "BUSINESS_RULE_VIOLATION",
    "message": "图片大小超过限制",
    "details": {}
  },
  "requestId": "req_xxx"
}
```

---

## 2. 接口清单总览

| 接口名 | 请求方法 | 路径 | 用途 |
| --- | --- | --- | --- |
| 创建菜谱封面上传授权 | `POST` | `/api/v1/media/upload-token` | 获取直传 COS 的上传地址 |
| 直传 COS 对象存储 | `PUT` | `uploadUrl` | 将图片文件直接上传到 COS |
| 登记已上传封面资源 | `POST` | `/api/v1/media/assets` | 将已上传文件登记为 `media_assets` |
| 更新菜谱封面 | `PATCH` | `/api/v1/recipes/:id` | 将 `mediaAssetId` 绑定到菜谱 |
| 获取菜谱列表 | `GET` | `/api/v1/recipes` | 列表页展示封面图 |
| 获取菜谱详情 | `GET` | `/api/v1/recipes/:id` | 详情页展示封面图 |

---

## 3. 创建菜谱封面上传授权

### 接口名

- 创建菜谱封面上传授权

### 请求方法

- `POST`

### 请求路径

- `/api/v1/media/upload-token`

### 请求参数

#### Header

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `Authorization` | `string` | 是 | Bearer Token |
| `Content-Type` | `string` | 是 | 固定为 `application/json` |

#### Body

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `purpose` | `string` | 是 | 固定传 `cover` |
| `fileName` | `string` | 是 | 原始文件名，如 `fish.webp` |
| `contentType` | `string` | 是 | 文件 MIME，如 `image/webp` |
| `sizeBytes` | `number` | 是 | 文件大小，单位字节 |

### 请求示例

```json
{
  "purpose": "cover",
  "fileName": "hongshaorou.webp",
  "contentType": "image/webp",
  "sizeBytes": 1234567
}
```

### 响应参数

#### 顶层响应

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| `success` | `boolean` | 是否成功 |
| `data` | `object` | 业务数据 |
| `requestId` | `string` | 请求追踪 ID |

#### `data` 字段

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| `uploadUrl` | `string` | 直传 COS 的完整上传地址 |
| `headers` | `object` | 上传到 COS 时需要带上的请求头 |
| `assetKey` | `string` | 资源唯一 key，后续登记资源时必传 |
| `expiresInSeconds` | `number` | 上传授权有效期，单位秒 |
| `maxSizeBytes` | `number` | 当前服务端允许的最大图片大小 |

### 响应示例

```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://menu-time-1310659978.cos.ap-guangzhou.myqcloud.com/...",
    "headers": {
      "Content-Type": "image/webp"
    },
    "assetKey": "households/{householdId}/recipes/covers/2026/04/uuid.webp",
    "expiresInSeconds": 900,
    "maxSizeBytes": 52428800
  },
  "requestId": "req_xxx"
}
```

---

## 4. 直传 COS 对象存储

### 接口名

- 直传 COS 对象存储

### 请求方法

- `PUT`

### 请求路径

- 使用“创建菜谱封面上传授权”接口返回的 `uploadUrl`

### 请求参数

#### Header

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `Content-Type` | `string` | 是 | 使用后端返回的 `headers.Content-Type` |

#### Body

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| 文件二进制 | `File / Blob` | 是 | 浏览器选择的图片文件 |

### 请求示例

```ts
await fetch(uploadUrl, {
  method: "PUT",
  headers: {
    "Content-Type": "image/webp",
  },
  body: file,
});
```

### 响应参数

COS 直传不是本项目后端接口，通常只需关注 HTTP 状态码：

| 参数 | 说明 |
| --- | --- |
| `200` / `204` | 上传成功 |
| 其他状态码 | 上传失败，前端应提示并终止后续登记流程 |

---

## 5. 登记已上传封面资源

### 接口名

- 登记已上传封面资源

### 请求方法

- `POST`

### 请求路径

- `/api/v1/media/assets`

### 请求参数

#### Header

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `Authorization` | `string` | 是 | Bearer Token |
| `Content-Type` | `string` | 是 | 固定为 `application/json` |

#### Body

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `assetKey` | `string` | 是 | 第一步接口返回的 `assetKey` |
| `mimeType` | `string` | 是 | 文件 MIME，如 `image/png` |
| `sizeBytes` | `number` | 是 | 文件大小，单位字节 |
| `width` | `number` | 否 | 图片宽度 |
| `height` | `number` | 否 | 图片高度 |
| `purpose` | `string` | 是 | 固定传 `cover` |

### 请求示例

```json
{
  "assetKey": "households/{householdId}/recipes/covers/2026/04/uuid.webp",
  "mimeType": "image/webp",
  "sizeBytes": 1234567,
  "width": 1200,
  "height": 900,
  "purpose": "cover"
}
```

### 响应参数

#### 顶层响应

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| `success` | `boolean` | 是否成功 |
| `data` | `object` | 业务数据 |
| `requestId` | `string` | 请求追踪 ID |

#### `data` 字段

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `string` | 媒体资源 ID，后续作为 `coverImageId` 使用 |
| `assetKey` | `string` | 资源 key |
| `assetUrl` | `string` | 资源公开访问地址 |
| `mimeType` | `string` | 文件 MIME |
| `sizeBytes` | `number` | 文件大小，单位字节 |
| `width` | `number \| null` | 图片宽度 |
| `height` | `number \| null` | 图片高度 |
| `purpose` | `string` | 固定为 `cover` |
| `createdAt` | `string` | 创建时间，ISO 字符串 |

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "media-asset-id",
    "assetKey": "households/{householdId}/recipes/covers/2026/04/uuid.webp",
    "assetUrl": "https://menu-time-1310659978.cos.ap-guangzhou.myqcloud.com/households/{householdId}/recipes/covers/2026/04/uuid.webp",
    "mimeType": "image/webp",
    "sizeBytes": 1234567,
    "width": 1200,
    "height": 900,
    "purpose": "cover",
    "createdAt": "2026-04-17T12:34:56.000Z"
  },
  "requestId": "req_xxx"
}
```

---

## 6. 更新菜谱封面

### 接口名

- 更新菜谱封面

### 请求方法

- `PATCH`

### 请求路径

- `/api/v1/recipes/:id`

### 请求参数

#### Path

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | `string` | 是 | 菜谱 ID |

#### Header

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `Authorization` | `string` | 是 | Bearer Token |
| `Content-Type` | `string` | 是 | 固定为 `application/json` |

#### Body

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `coverImageId` | `string` | 是 | 第三步返回的媒体资源 ID |
| `coverSource` | `string` | 是 | 固定传 `custom` |

### 请求示例

```json
{
  "coverImageId": "media-asset-id",
  "coverSource": "custom"
}
```

### 响应参数

该接口返回完整菜谱详情，前端至少关注以下字段：

#### 顶层响应

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| `success` | `boolean` | 是否成功 |
| `data` | `object` | 菜谱详情 |
| `requestId` | `string` | 请求追踪 ID |

#### `data` 关键字段

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `string` | 菜谱 ID |
| `name` | `string` | 菜谱名称 |
| `coverImageUrl` | `string \| null` | 当前封面图 URL |
| `coverSource` | `string` | 封面来源 |
| `status` | `string` | 菜谱状态 |

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "recipe-id",
    "name": "红烧肉",
    "coverImageUrl": "https://menu-time-1310659978.cos.ap-guangzhou.myqcloud.com/households/{householdId}/recipes/covers/2026/04/uuid.webp",
    "coverSource": "custom",
    "status": "active"
  },
  "requestId": "req_xxx"
}
```

---

## 7. 获取菜谱列表

### 接口名

- 获取菜谱列表

### 请求方法

- `GET`

### 请求路径

- `/api/v1/recipes`

### 请求参数

#### Header

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `Authorization` | `string` | 是 | Bearer Token |

#### Query

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `page` | `number` | 否 | 页码，默认 `1` |
| `pageSize` | `number` | 否 | 每页数量，默认 `20` |
| `keyword` | `string` | 否 | 关键字搜索 |
| `categoryId` | `string` | 否 | 分类 ID |
| `tagIds` | `string` | 否 | 标签 ID 列表，逗号分隔 |
| `sortBy` | `string` | 否 | `updatedAt` / `latestMomentAt` / `name` |

### 响应参数

列表页重点关注以下字段：

#### `data` 字段

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| `items` | `array` | 菜谱列表 |
| `page` | `number` | 当前页 |
| `pageSize` | `number` | 每页条数 |
| `total` | `number` | 总数 |
| `hasMore` | `boolean` | 是否还有下一页 |

#### `items[]` 关键字段

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `string` | 菜谱 ID |
| `name` | `string` | 菜谱名称 |
| `coverImageUrl` | `string \| null` | 封面图 URL |
| `versionCount` | `number` | 版本数 |
| `momentCount` | `number` | 动态数 |

### 响应示例

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "recipe-id",
        "name": "红烧肉",
        "coverImageUrl": "https://menu-time-1310659978.cos.ap-guangzhou.myqcloud.com/households/{householdId}/recipes/covers/2026/04/uuid.webp",
        "versionCount": 1,
        "momentCount": 0
      }
    ],
    "page": 1,
    "pageSize": 20,
    "total": 1,
    "hasMore": false
  },
  "requestId": "req_xxx"
}
```

---

## 8. 获取菜谱详情

### 接口名

- 获取菜谱详情

### 请求方法

- `GET`

### 请求路径

- `/api/v1/recipes/:id`

### 请求参数

#### Path

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | `string` | 是 | 菜谱 ID |

#### Header

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `Authorization` | `string` | 是 | Bearer Token |

### 响应参数

详情页重点关注以下字段：

#### `data` 关键字段

| 参数名 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `string` | 菜谱 ID |
| `name` | `string` | 菜谱名称 |
| `slug` | `string \| null` | 菜谱 slug |
| `coverImageUrl` | `string \| null` | 封面图 URL |
| `coverSource` | `string` | 封面来源 |
| `versionCount` | `number` | 版本数 |
| `momentCount` | `number` | 动态数 |
| `status` | `string` | 菜谱状态 |

### 响应示例

```json
{
  "success": true,
  "data": {
    "id": "recipe-id",
    "name": "红烧肉",
    "slug": "hong-shao-rou",
    "coverImageUrl": "https://menu-time-1310659978.cos.ap-guangzhou.myqcloud.com/households/{householdId}/recipes/covers/2026/04/uuid.webp",
    "coverSource": "custom",
    "versionCount": 1,
    "momentCount": 0,
    "status": "active"
  },
  "requestId": "req_xxx"
}
```

---

## 9. 前端推荐对接顺序

```text
1. 用户选择图片
2. 前端校验格式/大小
3. POST /api/v1/media/upload-token
4. PUT 到 uploadUrl 直传 COS
5. 获取图片 width / height
6. POST /api/v1/media/assets
7. PATCH /api/v1/recipes/:id
8. 重新读取详情或直接使用返回的 coverImageUrl 刷新页面
```

---

## 10. 前端本地校验建议

建议前端在调用后端前先校验：

- 文件类型仅允许：
  - `image/jpeg`
  - `image/png`
  - `image/webp`
- 文件大小不超过服务端限制
- 建议上传前做压缩，避免封面图过大影响体验

---

## 11. 前端最终需要保存的关键字段

| 阶段 | 字段名 | 用途 |
| --- | --- | --- |
| 申请上传授权 | `uploadUrl` | 用于直传 COS |
| 申请上传授权 | `headers` | 用于直传 COS 请求头 |
| 申请上传授权 | `assetKey` | 用于登记资源 |
| 登记资源 | `id` | 作为 `coverImageId` 绑定到菜谱 |
| 登记资源 | `assetUrl` | 可用于上传后即时预览 |
| 菜谱详情/列表 | `coverImageUrl` | 页面最终展示封面图 |
