# 食光记 API 接口清单

## 1. 文档说明

本文档基于 `docs/backend/后端技术方案.md` 的 API 章节进一步细化路径、参数、响应、错误码与联调注意事项，默认接口前缀为 `/api/v1`，小程序端鉴权方式为 `Authorization: Bearer <accessToken>`。

统一成功格式：

```json
{
  "success": true,
  "data": {},
  "requestId": "req_xxx"
}
```

统一错误格式：

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "参数错误",
    "details": null
  },
  "requestId": "req_xxx"
}
```

通用约定：

- 日期格式统一 `YYYY-MM-DD`
- 时间格式统一 ISO 8601
- 列表接口默认支持 `page`、`pageSize`
- 所有分页列表接口统一返回 `PageResult<T>`：

```json
{
  "items": [],
  "page": 1,
  "pageSize": 20,
  "total": 0,
  "hasMore": false
}
```
- 受保护接口统一从 token 中解析 `userId`、`householdId`
- 当前 auth、taxonomy、recipes、files、moments 接口均已接入统一 `createRouteHandler`

常用错误码：

| 错误码 | HTTP 状态码 | 说明 |
| --- | --- | --- |
| `UNAUTHORIZED` | `401` | 未登录或会话失效 |
| `FORBIDDEN` | `403` | 无权限 |
| `VALIDATION_ERROR` | `400` | 参数不合法 |
| `NOT_FOUND` | `404` | 资源不存在 |
| `CONFLICT` | `409` | 唯一约束或状态冲突 |
| `BUSINESS_RULE_VIOLATION` | `422` | 业务规则不满足 |
| `INTERNAL_ERROR` | `500` | 系统异常 |

## 2. 鉴权接口

### `POST /api/v1/auth/wechat-login`

用途：小程序端使用 `wx.login` 获取 `code` 后，换取业务登录态。

请求体：

```json
{
  "code": "wx_login_code"
}
```

成功响应：

```json
{
  "success": true,
  "data": {
    "session": {
      "userId": "uuid",
      "householdId": "uuid",
      "householdName": "Default Household",
      "nickname": "本地测试用户",
      "role": "member"
    },
    "tokens": {
      "accessToken": "jwt",
      "refreshToken": "jwt",
      "accessTokenExpiresIn": 900,
      "refreshTokenExpiresIn": 2592000
    }
  },
  "requestId": "req_xxx"
}
```

### `POST /api/v1/auth/refresh`

用途：刷新 access token。

请求体：

```json
{
  "refreshToken": "refresh_token_xxx"
}
```

成功响应字段：

- `data.session.userId`
- `data.session.householdId`
- `data.session.householdName`
- `data.session.nickname`
- `data.session.role`
- `data.tokens.accessToken`
- `data.tokens.refreshToken`
- `data.tokens.accessTokenExpiresIn`
- `data.tokens.refreshTokenExpiresIn`

### `POST /api/v1/auth/logout`

用途：退出登录并使 refresh token 失效。

请求体：

```json
{
  "refreshToken": "refresh_token_xxx"
}
```

### `GET /api/v1/auth/session`

用途：获取当前会话。

请求头：

- `Authorization: Bearer <accessToken>`

成功响应字段：

- `data.userId`
- `data.householdId`
- `data.householdName`
- `data.nickname`
- `data.role`

## 3. 分类与标签接口

### `GET /api/v1/categories`

用途：分类列表。

查询参数：

- `includeArchived?: boolean`

返回字段：

- `data[].id`
- `data[].name`
- `data[].sortOrder`
- `data[].color`

返回结构：

- `data` 为 `CategoryDto[]`

### `POST /api/v1/categories`

用途：新建分类。

请求体：

```json
{
  "name": "肉菜",
  "color": "#E07A5F"
}
```

错误码：

- `CONFLICT`：当前家庭已有同名有效分类

### `PATCH /api/v1/categories/:id`

用途：更新分类。

请求体：

```json
{
  "name": "家常肉菜",
  "color": "#D97706"
}
```

### `DELETE /api/v1/categories/:id`

用途：软删除分类。

### `POST /api/v1/categories/reorder`

用途：重排分类。

请求体：

```json
{
  "items": [
    { "id": "uuid-1", "sortOrder": 1 },
    { "id": "uuid-2", "sortOrder": 2 }
  ]
}
```

### `GET /api/v1/tags`

用途：标签列表。

查询参数：

- `includeArchived?: boolean`

返回字段：

- `data[].id`
- `data[].name`
- `data[].sortOrder`

返回结构：

- `data` 为 `TagDto[]`

### `POST /api/v1/tags`

用途：新建标签。

请求体：

```json
{
  "name": "快手"
}
```

### `PATCH /api/v1/tags/:id`

用途：更新标签。

请求体：

```json
{
  "name": "孩子爱吃"
}
```

### `DELETE /api/v1/tags/:id`

用途：软删除标签。

## 4. 菜谱接口

### `GET /api/v1/recipes`

用途：菜谱分页列表。

查询参数：

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `page` | `number` | 页码 |
| `pageSize` | `number` | 每页条数 |
| `keyword` | `string` | 按菜名搜索 |
| `categoryId` | `uuid` | 按当前版本分类筛选 |
| `tagIds` | `string` | 逗号分隔标签 ID |
| `sortBy` | `string` | `updatedAt/latestMomentAt/name` |

返回摘要字段：

- `items[].id`
- `items[].name`
- `items[].coverImageUrl`
- `items[].currentVersion.id`
- `items[].currentVersion.versionNumber`
- `items[].currentVersion.versionName`
- `items[].currentVersion.category`
- `items[].currentVersion.tags`
- `items[].versionCount`
- `items[].momentCount`
- `items[].latestMomentAt`
- `items[].latestCookedAt`

返回结构：

- `data` 为 `PageResult<RecipeListItemDTO>`

错误码：

- `UNAUTHORIZED`：未登录
- `VALIDATION_ERROR`：查询参数不合法

### `POST /api/v1/recipes`

用途：创建菜谱并自动生成 `V1`。

请求体：

```json
{
  "name": "糖醋排骨",
  "slug": "sweet-sour-ribs",
  "categoryId": "uuid",
  "newCategoryName": null,
  "tagIds": ["uuid-1"],
  "newTagNames": ["孩子爱吃"],
  "versionName": "山楂版",
  "ingredientsText": "排骨500g、山楂10颗",
  "ingredients": [
    {
      "rawText": "排骨500g",
      "normalizedName": "排骨",
      "amountText": "500",
      "unit": "g",
      "isSeasoning": false,
      "parseSource": "manual"
    }
  ],
  "steps": [
    { "sortOrder": 0, "content": "排骨焯水" }
  ],
  "tips": "山楂用新鲜的更酸爽",
  "isMajor": true
}
```

成功响应：

```json
{
  "success": true,
  "data": {
    "recipeId": "uuid",
    "currentVersionId": "uuid",
    "versionNumber": 1
  },
  "requestId": "req_xxx"
}
```

### `GET /api/v1/recipes/:id`

用途：菜谱详情。

返回字段：

- `id`
- `name`
- `slug`
- `coverImageUrl`
- `coverSource`
- `versionCount`
- `momentCount`
- `latestMomentAt`
- `latestCookedAt`
- `status`
- `currentVersion`

`currentVersion` 包含：

- `id`
- `versionNumber`
- `versionName`
- `sourceVersionId`
- `isCurrent`
- `diffSummaryText`
- `diffSummaryJson`
- `category`
- `tags`
- `ingredientsText`
- `ingredients`
- `steps`
- `tips`

### `PATCH /api/v1/recipes/:id`

用途：更新菜谱基础信息，不修改版本内容。

请求体：

```json
{
  "name": "酸甜排骨",
  "slug": "sweet-sour-ribs-v2",
  "coverImageId": "uuid",
  "coverSource": "custom",
  "status": "active"
}
```

说明：

- 至少传一个字段
- `coverSource` 允许值：`custom`、`moment_latest`、`none`
- `status` 允许值：`active`、`archived`

### `DELETE /api/v1/recipes/:id`

用途：软删除菜谱。

### `GET /api/v1/recipes/:id/versions`

用途：版本列表。

返回字段：

- `items[].id`
- `items[].versionNumber`
- `items[].versionName`
- `items[].isCurrent`
- `items[].diffSummaryText`
- `items[].createdAt`

返回结构：

- `data` 为 `PageResult<RecipeVersionListItemDTO>`

查询参数：

- `page?: number`
- `pageSize?: number`

### `POST /api/v1/recipes/:id/versions`

用途：新建版本。

请求体：

```json
{
  "sourceVersionId": "uuid",
  "versionName": "菠萝版",
  "categoryId": "uuid",
  "tagIds": ["uuid"],
  "newTagNames": ["下饭"],
  "ingredientsText": "排骨500g、菠萝200g",
  "ingredients": [
    {
      "rawText": "排骨500g",
      "normalizedName": "排骨",
      "amountText": "500",
      "unit": "g",
      "isSeasoning": false,
      "parseSource": "manual"
    }
  ],
  "steps": [
    { "sortOrder": 0, "content": "排骨焯水备用" }
  ],
  "tips": "最后加菠萝",
  "isMajor": true
}
```

成功响应：

- `versionId`
- `versionNumber`
- `diffSummaryText`

### `GET /api/v1/recipes/:id/versions/:versionId`

用途：版本详情。

返回字段：

- `id`
- `versionNumber`
- `versionName`
- `sourceVersionId`
- `isCurrent`
- `diffSummaryText`
- `diffSummaryJson`
- `category`
- `tags`
- `ingredientsText`
- `ingredients`
- `steps`
- `tips`

### `POST /api/v1/recipes/:id/versions/:versionId/set-current`

用途：切换当前版本。

请求体：无

成功响应：

- `recipeId`
- `currentVersionId`

### `GET /api/v1/recipes/:id/compare`

用途：版本对比摘要。

查询参数：

- `base: number`
- `target: number`

返回字段：

- `baseVersion`
- `targetVersion`
- `summaryText`
- `summaryJson`

`summaryJson` 当前结构：

```json
{
  "ingredientsChanged": true,
  "ingredientsTextBefore": "排骨500g",
  "ingredientsTextAfter": "排骨500g、菠萝200g",
  "addedTags": ["下饭"],
  "removedTags": ["快手"],
  "stepCountBefore": 2,
  "stepCountAfter": 3,
  "summary": "主料有调整；新增标签：下饭；步骤数由 2 步调整为 3 步"
}
```

recipes 模块统一错误码补充：

- `NOT_FOUND`：菜谱或版本不存在，或不属于当前家庭
- `CONFLICT`：`slug` 冲突
- `BUSINESS_RULE_VIOLATION`：无可复制来源版本等业务规则不满足

## 5. 时光记录接口

### `GET /api/v1/recipes/:id/moments`

用途：获取某菜谱时光轴。

查询参数：

- `page?: number`
- `pageSize?: number`

返回字段：

- `items[].id`
- `items[].occurredOn`
- `items[].content`
- `items[].participantsText`
- `items[].tasteRating`
- `items[].difficultyRating`
- `items[].images`
- `items[].recipeVersion`

返回结构：

- `data` 为 `PageResult<MomentItemDTO>`

### `POST /api/v1/recipes/:id/moments`

用途：新增时光记录。

请求体：

```json
{
  "recipeVersionId": "uuid",
  "occurredOn": "2026-03-20",
  "content": "第一次做菠萝版，全家都说更清爽。",
  "participantsText": "全家",
  "tasteRating": 5,
  "difficultyRating": 3,
  "isCoverCandidate": true,
  "imageAssetIds": ["uuid-1", "uuid-2"]
}
```

业务校验：

- 图片最多 9 张
- 评分范围 `1-5`

### `GET /api/v1/moments/latest`

用途：首页最新时光流。

查询参数：

- `limit?: number`

返回字段：

- `items[].momentId`
- `items[].recipeId`
- `items[].recipeName`
- `items[].coverImageUrl`
- `items[].occurredOn`
- `items[].previewText`

### `PATCH /api/v1/moments/:id`

用途：编辑时光记录。

请求体字段与创建接口一致，但全部可选。

### `DELETE /api/v1/moments/:id`

用途：软删除时光记录。

## 6. 周菜单接口

### `GET /api/v1/menu-plans/current-week`

用途：获取当前周菜单。

返回字段：

- `id`
- `weekStartDate`
- `status`
- `plannedItemCount`
- `items`

### `GET /api/v1/menu-plans/weeks/:weekStartDate`

用途：获取指定周菜单。

路径参数：

- `weekStartDate: YYYY-MM-DD`

说明：

- 若该周菜单不存在，后端会懒创建空周计划并返回。
- `weekStartDate` 必须为周一，否则返回 `BUSINESS_RULE_VIOLATION`。

### `POST /api/v1/menu-plans/weeks/:weekStartDate/items`

用途：新增菜单项。

请求体：

```json
{
  "recipeId": "uuid",
  "recipeVersionId": "uuid",
  "plannedDate": "2026-03-24",
  "mealSlot": "dinner",
  "note": "周二晚饭",
  "sourceType": "manual"
}
```

业务校验：

- `plannedDate` 必须落在目标周内
- `recipeVersionId` 必须属于 `recipeId`
- 若目标周不存在，后端会自动初始化空周计划

### `PATCH /api/v1/menu-plans/items/:id`

用途：更新菜单项日期、版本或备注。

请求体：

```json
{
  "recipeVersionId": "uuid",
  "plannedDate": "2026-03-25",
  "mealSlot": "lunch",
  "note": "改到周三"
}
```

说明：

- 若 `plannedDate` 或 `mealSlot` 发生变化，后端会把该项移动到新桶末尾，并自动重排旧桶和新桶的 `sortOrder`。

### `DELETE /api/v1/menu-plans/items/:id`

用途：删除菜单项。

说明：

- 删除后会自动压紧同日同餐次下剩余菜单项的 `sortOrder`。

### `POST /api/v1/menu-plans/weeks/:weekStartDate/reorder`

用途：重排同日菜单项。

请求体：

```json
{
  "plannedDate": "2026-03-24",
  "mealSlot": "dinner",
  "items": [
    { "id": "uuid-1", "sortOrder": 1 },
    { "id": "uuid-2", "sortOrder": 2 }
  ]
}
```

说明：

- `items` 必须覆盖目标 `plannedDate + mealSlot` 桶内的全部菜单项。
- 后端会按提交顺序重新归一化为从 `0` 开始的连续 `sortOrder`。

## 7. 随机点菜接口

### `POST /api/v1/random-picks/sessions`

用途：创建随机 session 并返回结果。

请求体：

```json
{
  "mode": "single",
  "filters": {
    "categoryIds": ["uuid"],
    "tagIds": ["uuid"],
    "maxDifficulty": 3,
    "excludeRecentDays": 7,
    "excludeCurrentWeekPlanned": true,
    "preferredMemberTags": ["孩子爱吃"]
  }
}
```

返回字段：

- `sessionId`
- `mode`
- `results`

### `POST /api/v1/random-picks/sessions/:id/redraw`

用途：同条件再抽一次。

请求体：无

### `POST /api/v1/random-picks/sessions/:id/results/:resultId/accept`

用途：接受结果并加入周菜单。

请求体：

```json
{
  "plannedDate": "2026-03-26",
  "mealSlot": "dinner"
}
```

成功响应：

- `accepted`
- `mealPlanItemId`

### `POST /api/v1/random-picks/sessions/:id/results/:resultId/skip`

用途：跳过结果。

请求体：无

### `GET /api/v1/random-picks/sessions/:id`

用途：查看本次抽取记录。

返回字段：

- `session.id`
- `session.mode`
- `session.status`
- `session.filterSnapshot`
- `results[]`

## 8. 购物清单接口

### `POST /api/v1/shopping-lists/generate`

用途：根据周菜单生成购物清单。

请求体：

```json
{
  "weekStartDate": "2026-03-23",
  "generatedFrom": "manual"
}
```

成功响应：

- `shoppingListId`
- `versionNo`

### `GET /api/v1/shopping-lists/:id`

用途：获取购物清单详情。

返回字段：

- `id`
- `weekStartDate`
- `versionNo`
- `generatedAt`
- `ingredientItems`
- `seasoningItems`

### `PATCH /api/v1/shopping-lists/items/:id`

用途：更新勾选状态或数量备注。

请求体：

```json
{
  "isChecked": true,
  "quantityNote": "500g"
}
```

### `POST /api/v1/shopping-lists/:id/copy-text`

用途：生成可复制文本。

成功响应：

- `text`

### `POST /api/v1/shopping-lists/:id/share-image`

用途：触发生成分享图。

成功响应：

- `taskAccepted`
- `imageAssetId`

## 9. 文件接口

### `POST /api/v1/files/upload-token`

用途：获取上传签名或临时凭证。

请求体：

```json
{
  "fileName": "IMG_001.jpg",
  "contentType": "image/jpeg",
  "sizeBytes": 345678
}
```

返回字段：

- `uploadUrl`
- `assetKey`
- `headers`
- `expiresInSeconds`
- `maxSizeBytes`

说明：

- 当前后端实现沿用项目既有 `files` 两段式上传链路，不额外引入 `media/*` 新路由。
- 当前图片文件 `purpose` 由后端固定登记为 `image`，前端请求体无需再传 `purpose`。

### `POST /api/v1/files/assets`

用途：上传完成后登记媒体资源。

请求体：

```json
{
  "assetKey": "households/{householdId}/files/images/2026/04/uuid.jpg",
  "mimeType": "image/jpeg",
  "sizeBytes": 345678,
  "width": 1280,
  "height": 960
}
```

成功响应：

- `id`
- `assetKey`
- `assetUrl`
- `mimeType`
- `sizeBytes`

## 10. 健康检查

### `GET /api/health`

用途：健康检查。

返回字段：

- `status`
- `time`

## 11. 联调约定

- 前端不要自行计算版本号、差异摘要、购物清单聚合结果、随机点菜规则。
- 图片上传统一走“两段式”：先调用 `/files/upload-token` 拿凭证，再上传对象存储，最后调用 `/files/assets` 登记资源。
- 日期字段统一传 `YYYY-MM-DD`，不要混用本地时间字符串。
- 小程序端统一走 `wx.login -> /auth/wechat-login -> Authorization Bearer Token` 链路，不以 Cookie 作为默认登录态假设。
- 首期建议联调顺序：微信登录 -> 分类标签 -> 菜谱版本 -> 时光记录 -> 周菜单 -> 购物清单 -> 随机点菜。
