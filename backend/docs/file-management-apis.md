# 文件管理 API 清单

本文档整理后端统一文件管理接口（上传、登记、预览、下载），用于前后端联调与业务接入。

## 1. 基本约定

- 接口前缀：`/api/v1/files`
- 鉴权：默认都需要登录，Header 传 `Authorization: Bearer <accessToken>`
- 文件范围：当前仅支持图片
  - `image/jpeg`
  - `image/png`
  - `image/webp`
- 家庭隔离：所有文件对象 key 由后端生成并归档到家庭目录
  - `households/{householdId}/files/images/{yyyy}/{mm}/{uuid}.{ext}`

## 2. 统一响应格式

### 成功响应

```json
{
  "success": true,
  "data": {},
  "requestId": "req_xxx"
}
```

### 失败响应

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求参数校验失败",
    "details": {}
  },
  "requestId": "req_xxx"
}
```

### 常见错误码

- `VALIDATION_ERROR`：参数校验失败
- `UNAUTHORIZED`：未登录或 token 失效
- `FORBIDDEN`：资源归属不匹配
- `NOT_FOUND`：文件不存在
- `BUSINESS_RULE_VIOLATION`：业务规则不满足（类型/大小/路径不合法）
- `INTERNAL_ERROR`：服务内部异常

## 3. API 清单

## 3.1 申请上传授权

- 路径：`POST /api/v1/files/upload-token`
- 用途：后端校验图片类型与大小后，签发 COS 直传临时授权

### 请求体

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `fileName` | `string` | 是 | 文件名，1~255 字符 |
| `contentType` | `string` | 是 | MIME 类型 |
| `sizeBytes` | `number` | 是 | 文件大小（字节），正整数 |

### 成功响应 `data`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `uploadUrl` | `string` | 预签名上传 URL |
| `headers` | `object` | 直传时需要附带的请求头（通常含 `Content-Type`） |
| `assetKey` | `string` | 后端生成的对象 key |
| `expiresInSeconds` | `number` | 上传 URL 过期秒数 |
| `maxSizeBytes` | `number` | 当前允许的最大文件大小 |

### 示例

请求：

```json
{
  "fileName": "cover.png",
  "contentType": "image/png",
  "sizeBytes": 245678
}
```

响应：

```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://...",
    "headers": {
      "Content-Type": "image/png"
    },
    "assetKey": "households/xxx/files/images/2026/04/uuid.png",
    "expiresInSeconds": 900,
    "maxSizeBytes": 52428800
  },
  "requestId": "req_xxx"
}
```

## 3.2 登记已上传文件

- 路径：`POST /api/v1/files/assets`
- 用途：前端上传完成后，通知后端登记文件元信息；后端会二次校验对象是否存在、大小和 MIME 是否匹配

### 请求体

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `assetKey` | `string` | 是 | 上传授权返回的 key，必须匹配家庭路径规则 |
| `mimeType` | `string` | 是 | 文件 MIME |
| `sizeBytes` | `number` | 是 | 文件大小（字节） |
| `width` | `number` | 否 | 图片宽度，正整数，最大 20000 |
| `height` | `number` | 否 | 图片高度，正整数，最大 20000 |

### 成功响应 `data`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `string` | 文件记录 ID（数据库主键） |
| `assetKey` | `string` | 对象 key |
| `assetUrl` | `string` | 文件公网 URL（静态地址） |
| `mimeType` | `string` | MIME |
| `sizeBytes` | `number` | 大小（字节） |
| `width` | `number \| null` | 宽度 |
| `height` | `number \| null` | 高度 |
| `purpose` | `"image"` | 当前固定值 |
| `createdAt` | `string` | ISO 时间 |

## 3.3 获取预览链接

- 路径：`GET /api/v1/files/{id}/preview`
- 用途：获取可直接打开图片的临时链接（`inline`）

### 路径参数

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | `string(uuid)` | 是 | 文件记录 ID |

### 成功响应 `data`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `url` | `string` | 预览签名 URL |
| `expiresInSeconds` | `number` | 过期秒数 |

## 3.4 获取下载链接

- 路径：`GET /api/v1/files/{id}/download?filename=xxx`
- 用途：获取附件下载临时链接（`attachment`）

### 路径参数

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `id` | `string(uuid)` | 是 | 文件记录 ID |

### Query 参数

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `filename` | `string` | 否 | 下载文件名，1~255 字符 |

### 成功响应 `data`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `url` | `string` | 下载签名 URL |
| `expiresInSeconds` | `number` | 过期秒数 |

## 4. 业务接入方式

推荐采用以下标准流程：

1. 调用 `POST /api/v1/files/upload-token` 获取 `uploadUrl` 与 `assetKey`。
2. 前端使用 `PUT uploadUrl` 直传 COS（带上返回的 `headers`）。
3. 上传成功后调用 `POST /api/v1/files/assets` 登记资源，拿到 `fileId`。
4. 业务表（例如菜谱）存 `fileId`（当前 recipes 使用 `coverImageId`）。
5. 展示预览时调用 `GET /api/v1/files/{id}/preview` 拿临时 URL。
6. 需要下载时调用 `GET /api/v1/files/{id}/download` 拿下载 URL。

## 5. 联调示例（curl）

## 5.1 申请上传授权

```bash
curl -X POST http://127.0.0.1:3000/api/v1/files/upload-token \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fileName":"cover.png",
    "contentType":"image/png",
    "sizeBytes":245678
  }'
```

## 5.2 直传 COS

```bash
curl -X PUT "UPLOAD_URL" \
  -H "Content-Type: image/png" \
  --data-binary @./cover.png
```

## 5.3 登记文件

```bash
curl -X POST http://127.0.0.1:3000/api/v1/files/assets \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "assetKey":"households/xxx/files/images/2026/04/uuid.png",
    "mimeType":"image/png",
    "sizeBytes":245678,
    "width":1080,
    "height":1080
  }'
```

## 5.4 预览与下载

```bash
curl -X GET "http://127.0.0.1:3000/api/v1/files/FILE_ID/preview" \
  -H "Authorization: Bearer TOKEN"

curl -X GET "http://127.0.0.1:3000/api/v1/files/FILE_ID/download?filename=menu-cover.png" \
  -H "Authorization: Bearer TOKEN"
```

## 6. 注意事项

- `assetKey` 必须使用上传授权返回值，不要前端自行拼接。
- 文件访问是家庭隔离的，跨家庭 `id` 访问会返回 `404`。
- 预览/下载 URL 是短时有效链接，前端应按需实时获取，不要长期缓存。
