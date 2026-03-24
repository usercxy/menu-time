# 食光记 API 接口文档

## 1. 文档说明

### 1.1 文档目标

本文档基于 [后端技术方案.md](D:\AI\Menu%20Time\backend\后端技术方案.md)、[后端开发TODO.md](D:\AI\Menu%20Time\backend\后端开发TODO.md) 和 [需求文档v2.md](D:\AI\Menu%20Time\需求文档v2.md) 输出，作为前后端联调的接口约定文档。

本文档重点约定：

- API 路径、方法、鉴权方式。
- 请求参数与响应结构。
- 公共字段、枚举值、分页格式。
- 关键业务规则在接口层的体现方式。
- 前端需要依赖的展示字段和交互状态字段。

### 1.2 适用范围

- 当前接口版本：`v1`
- 当前技术基线：`Next.js + TypeScript + PostgreSQL + Prisma`
- 当前优先范围：MVP 闭环优先，同时预留随机点菜、成员协作等后续接口

### 1.3 设计原则

- 接口统一以资源视角设计，尽量保持 REST 风格。
- 响应体统一返回 `success/data/requestId`。
- 字段命名统一使用 `camelCase`。
- 时间统一返回 ISO 8601 字符串，日期字段使用 `YYYY-MM-DD`。
- 前端只依赖 DTO，不直接依赖数据库表结构。

## 2. 通用约定

### 2.1 Base URL

```text
/api/v1
```

### 2.2 鉴权方式

- 使用 Cookie Session。
- 未登录时返回 `401 UNAUTHORIZED`。
- 无权限时返回 `403 FORBIDDEN`。
- 所有受保护资源默认按当前登录用户的 `householdId` 做数据隔离。

### 2.3 通用响应格式

成功响应：

```json
{
  "success": true,
  "data": {},
  "requestId": "req_01HXYZ..."
}
```

失败响应：

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "菜谱名称不能为空",
    "details": {
      "field": "name"
    }
  },
  "requestId": "req_01HXYZ..."
}
```

### 2.4 分页格式

分页列表统一返回：

```json
{
  "items": [],
  "page": 1,
  "pageSize": 20,
  "total": 125,
  "hasMore": true
}
```

查询参数约定：

| 参数 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `page` | number | `1` | 页码，从 1 开始 |
| `pageSize` | number | `20` | 每页数量，建议最大 50 |

### 2.5 错误码约定

| 错误码 | HTTP 状态码 | 说明 |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400 | 参数校验失败 |
| `UNAUTHORIZED` | 401 | 未登录或会话失效 |
| `FORBIDDEN` | 403 | 当前角色无权限 |
| `NOT_FOUND` | 404 | 资源不存在 |
| `CONFLICT` | 409 | 资源状态冲突 |
| `BUSINESS_RULE_VIOLATION` | 422 | 业务规则不满足 |
| `INTERNAL_ERROR` | 500 | 服务内部错误 |

### 2.6 通用枚举

#### 用户角色

| 值 | 说明 |
| --- | --- |
| `admin` | 管理员 |
| `member` | 家庭成员 |

#### 菜谱封面来源

| 值 | 说明 |
| --- | --- |
| `custom` | 用户自定义封面 |
| `moment_latest` | 最新时光图片回填 |
| `none` | 暂无封面 |

#### 周菜单餐次

| 值 | 说明 |
| --- | --- |
| `lunch` | 午餐 |
| `dinner` | 晚餐 |
| `extra` | 额外餐次 |

#### 随机点菜模式

| 值 | 说明 |
| --- | --- |
| `single` | 单抽 |
| `week` | 连抽一周 |

#### 随机结果决策

| 值 | 说明 |
| --- | --- |
| `pending` | 待处理 |
| `accepted` | 已接受 |
| `skipped` | 已跳过 |

#### 购物清单项类型

| 值 | 说明 |
| --- | --- |
| `ingredient` | 原料/菜品 |
| `seasoning` | 调料 |

## 3. 公共实体 DTO

### 3.1 UserSession

```json
{
  "user": {
    "id": "usr_001",
    "nickname": "小厨",
    "role": "admin"
  },
  "household": {
    "id": "h_001",
    "name": "我的家庭"
  }
}
```

### 3.2 Category

```json
{
  "id": "cat_001",
  "name": "肉菜",
  "sortOrder": 1,
  "color": "#D97706",
  "createdAt": "2026-03-24T10:00:00.000Z",
  "updatedAt": "2026-03-24T10:00:00.000Z"
}
```

### 3.3 Tag

```json
{
  "id": "tag_001",
  "name": "下饭",
  "sortOrder": 1,
  "createdAt": "2026-03-24T10:00:00.000Z",
  "updatedAt": "2026-03-24T10:00:00.000Z"
}
```

### 3.4 MediaAsset

```json
{
  "id": "media_001",
  "url": "https://cdn.example.com/households/h_001/moments/m_001/1.jpg",
  "mimeType": "image/jpeg",
  "sizeBytes": 102400,
  "width": 1080,
  "height": 1440,
  "purpose": "moment"
}
```

### 3.5 RecipeListItem

```json
{
  "id": "recipe_001",
  "name": "番茄炒蛋",
  "coverImage": {
    "id": "media_100",
    "url": "https://cdn.example.com/cover.jpg"
  },
  "currentVersion": {
    "id": "rv_003",
    "versionNumber": 3,
    "versionName": "少油版",
    "category": {
      "id": "cat_002",
      "name": "素菜"
    },
    "tags": [
      {
        "id": "tag_003",
        "name": "快手"
      }
    ]
  },
  "versionCount": 3,
  "momentCount": 8,
  "latestMomentAt": "2026-03-24T12:00:00.000Z",
  "latestCookedOn": "2026-03-24"
}
```

### 3.6 RecipeVersionDetail

```json
{
  "id": "rv_003",
  "recipeId": "recipe_001",
  "versionNumber": 3,
  "versionName": "少油版",
  "category": {
    "id": "cat_002",
    "name": "素菜"
  },
  "tags": [
    {
      "id": "tag_003",
      "name": "快手"
    }
  ],
  "ingredientsText": "番茄 2 个，鸡蛋 3 个，盐，油",
  "ingredients": [
    {
      "id": "ing_001",
      "rawText": "番茄 2 个",
      "normalizedName": "番茄",
      "amountText": "2",
      "unit": "个",
      "isSeasoning": false
    }
  ],
  "steps": [
    {
      "id": "step_001",
      "sortOrder": 1,
      "content": "番茄切块"
    }
  ],
  "tips": "鸡蛋提前打散更松软",
  "diffSummary": {
    "ingredientsChanged": true,
    "addedTags": [
      "清淡"
    ],
    "removedTags": [],
    "stepCountBefore": 3,
    "stepCountAfter": 4,
    "summary": "新增标签“清淡”，步骤由 3 步调整为 4 步。"
  },
  "createdAt": "2026-03-24T12:00:00.000Z"
}
```

### 3.7 MomentItem

```json
{
  "id": "moment_001",
  "recipeId": "recipe_001",
  "recipeVersionId": "rv_003",
  "recipeName": "番茄炒蛋",
  "occurredOn": "2026-03-24",
  "content": "今天做得很成功，孩子很爱吃。",
  "participantsText": "全家",
  "tasteRating": 5,
  "difficultyRating": 2,
  "images": [
    {
      "id": "media_001",
      "url": "https://cdn.example.com/moment-1.jpg",
      "width": 1080,
      "height": 1440
    }
  ],
  "createdAt": "2026-03-24T12:00:00.000Z"
}
```

### 3.8 MealPlanItem

```json
{
  "id": "mpi_001",
  "plannedDate": "2026-03-24",
  "mealSlot": "dinner",
  "sortOrder": 1,
  "note": "家里来客人",
  "sourceType": "manual",
  "recipe": {
    "id": "recipe_001",
    "name": "番茄炒蛋",
    "coverImage": {
      "id": "media_100",
      "url": "https://cdn.example.com/cover.jpg"
    }
  },
  "version": {
    "id": "rv_003",
    "versionNumber": 3,
    "versionName": "少油版"
  }
}
```

### 3.9 ShoppingListDetail

```json
{
  "id": "sl_001",
  "mealPlanWeekId": "mpw_001",
  "versionNo": 2,
  "generatedAt": "2026-03-24T13:00:00.000Z",
  "items": [
    {
      "id": "sli_001",
      "itemType": "ingredient",
      "displayName": "番茄",
      "normalizedName": "番茄",
      "quantityNote": "4 个",
      "sourceCount": 2,
      "isChecked": false,
      "sortOrder": 1,
      "sourceRecipeRefs": [
        {
          "recipeId": "recipe_001",
          "recipeName": "番茄炒蛋",
          "recipeVersionId": "rv_003",
          "versionLabel": "V3 少油版"
        }
      ]
    }
  ]
}
```

### 3.10 RandomPickSessionDetail

```json
{
  "id": "rps_001",
  "mode": "single",
  "status": "completed",
  "filterSnapshot": {
    "categoryIds": [
      "cat_001"
    ],
    "tagIds": [],
    "difficultyMax": 3,
    "excludeRecentDays": 7
  },
  "results": [
    {
      "id": "rpr_001",
      "sequenceNo": 1,
      "decision": "pending",
      "pickedForDate": null,
      "recipe": {
        "id": "recipe_001",
        "name": "番茄炒蛋"
      },
      "version": {
        "id": "rv_003",
        "versionNumber": 3,
        "versionName": "少油版"
      },
      "reasonMeta": {
        "matchedBy": [
          "category"
        ]
      }
    }
  ],
  "createdAt": "2026-03-24T14:00:00.000Z"
}
```

## 4. 鉴权接口

### 4.1 管理员登录

`POST /api/v1/auth/login`

请求体：

```json
{
  "email": "admin@example.com",
  "password": "123456"
}
```

响应体：

```json
{
  "success": true,
  "data": {
    "session": {
      "user": {
        "id": "usr_001",
        "nickname": "管理员",
        "role": "admin"
      },
      "household": {
        "id": "h_001",
        "name": "我的家庭"
      }
    }
  },
  "requestId": "req_001"
}
```

### 4.2 退出登录

`POST /api/v1/auth/logout`

响应体：

```json
{
  "success": true,
  "data": {
    "ok": true
  },
  "requestId": "req_001"
}
```

### 4.3 获取当前会话

`GET /api/v1/auth/session`

响应体：

```json
{
  "success": true,
  "data": {
    "session": {
      "user": {
        "id": "usr_001",
        "nickname": "管理员",
        "role": "admin"
      },
      "household": {
        "id": "h_001",
        "name": "我的家庭"
      }
    }
  },
  "requestId": "req_001"
}
```

## 5. 分类与标签接口

### 5.1 获取分类列表

`GET /api/v1/categories`

响应体：

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "cat_001",
        "name": "肉菜",
        "sortOrder": 1,
        "color": "#DC2626",
        "createdAt": "2026-03-24T10:00:00.000Z",
        "updatedAt": "2026-03-24T10:00:00.000Z"
      }
    ]
  },
  "requestId": "req_001"
}
```

### 5.2 创建分类

`POST /api/v1/categories`

请求体：

```json
{
  "name": "汤",
  "color": "#0EA5E9"
}
```

### 5.3 更新分类

`PATCH /api/v1/categories/:id`

请求体：

```json
{
  "name": "靓汤",
  "color": "#0284C7"
}
```

### 5.4 删除分类

`DELETE /api/v1/categories/:id`

响应体：

```json
{
  "success": true,
  "data": {
    "ok": true
  },
  "requestId": "req_001"
}
```

### 5.5 分类重排

`POST /api/v1/categories/reorder`

请求体：

```json
{
  "items": [
    {
      "id": "cat_002",
      "sortOrder": 1
    },
    {
      "id": "cat_001",
      "sortOrder": 2
    }
  ]
}
```

### 5.6 标签接口

标签接口与分类接口保持同构：

- `GET /api/v1/tags`
- `POST /api/v1/tags`
- `PATCH /api/v1/tags/:id`
- `DELETE /api/v1/tags/:id`

标签 DTO 见 [Tag](D:\AI\Menu%20Time\backend\API接口文档.md) 第 3.3 节。

## 6. 菜谱与版本接口

### 6.1 获取菜谱列表

`GET /api/v1/recipes`

查询参数：

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `page` | number | 页码 |
| `pageSize` | number | 每页数量 |
| `keyword` | string | 菜名关键词 |
| `categoryId` | string | 当前版本分类筛选 |
| `tagIds` | string | 多个标签 ID，逗号分隔 |
| `sortBy` | string | 当前支持 `updatedAt`、`latestMomentAt` |

响应体：

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "recipe_001",
        "name": "番茄炒蛋",
        "coverImage": {
          "id": "media_100",
          "url": "https://cdn.example.com/cover.jpg"
        },
        "currentVersion": {
          "id": "rv_003",
          "versionNumber": 3,
          "versionName": "少油版",
          "category": {
            "id": "cat_002",
            "name": "素菜"
          },
          "tags": [
            {
              "id": "tag_001",
              "name": "快手"
            }
          ]
        },
        "versionCount": 3,
        "momentCount": 5,
        "latestMomentAt": "2026-03-24T10:00:00.000Z",
        "latestCookedOn": "2026-03-24"
      }
    ],
    "page": 1,
    "pageSize": 20,
    "total": 1,
    "hasMore": false
  },
  "requestId": "req_001"
}
```

### 6.2 创建菜谱

`POST /api/v1/recipes`

请求体：

```json
{
  "name": "番茄炒蛋",
  "categoryId": "cat_002",
  "newCategoryName": "",
  "tagIds": [
    "tag_001",
    "tag_002"
  ],
  "newTagNames": [],
  "ingredientsText": "番茄 2 个，鸡蛋 3 个，盐，油",
  "steps": [
    "番茄切块",
    "鸡蛋打散",
    "热锅下蛋"
  ],
  "tips": "鸡蛋先炒再盛出"
}
```

字段说明：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `name` | 是 | 菜谱名称 |
| `categoryId` | 否 | 已存在分类 ID |
| `newCategoryName` | 否 | 新分类名称，与 `categoryId` 二选一 |
| `tagIds` | 否 | 已存在标签 ID 列表 |
| `newTagNames` | 否 | 新标签名称列表 |
| `ingredientsText` | 否 | 原始主料文本 |
| `steps` | 否 | 步骤文本数组 |
| `tips` | 否 | 小贴士 |

响应体：

```json
{
  "success": true,
  "data": {
    "recipe": {
      "id": "recipe_001",
      "name": "番茄炒蛋",
      "currentVersionId": "rv_001"
    }
  },
  "requestId": "req_001"
}
```

### 6.3 获取菜谱详情

`GET /api/v1/recipes/:id`

响应体：

```json
{
  "success": true,
  "data": {
    "recipe": {
      "id": "recipe_001",
      "name": "番茄炒蛋",
      "coverImage": {
        "id": "media_100",
        "url": "https://cdn.example.com/cover.jpg"
      },
      "coverSource": "moment_latest",
      "versionCount": 3,
      "momentCount": 5,
      "latestMomentAt": "2026-03-24T10:00:00.000Z",
      "currentVersion": {
        "id": "rv_003",
        "versionNumber": 3,
        "versionName": "少油版",
        "category": {
          "id": "cat_002",
          "name": "素菜"
        },
        "tags": [
          {
            "id": "tag_001",
            "name": "快手"
          }
        ],
        "ingredientsText": "番茄 2 个，鸡蛋 3 个，盐，油",
        "ingredients": [],
        "steps": [],
        "tips": "鸡蛋先炒再盛出",
        "diffSummary": null,
        "createdAt": "2026-03-24T10:00:00.000Z"
      }
    }
  },
  "requestId": "req_001"
}
```

### 6.4 更新菜谱基础信息

`PATCH /api/v1/recipes/:id`

说明：

- 此接口只更新菜谱主表级别信息。
- 若变更分类、标签、步骤、主料、小贴士，应通过新建版本实现，而不是直接改当前版本。
- 当前版本分类和标签展示以前端读取 `currentVersion` 为准。

请求体：

```json
{
  "name": "番茄炒蛋（家常版）",
  "coverImageId": "media_200"
}
```

### 6.5 删除菜谱

`DELETE /api/v1/recipes/:id`

说明：

- 采用软删除。
- 若存在仍被周菜单引用的数据，后端应返回明确业务错误或容错策略说明。

### 6.6 获取版本列表

`GET /api/v1/recipes/:id/versions`

响应体：

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "rv_003",
        "versionNumber": 3,
        "versionName": "少油版",
        "diffSummaryText": "新增标签“清淡”，步骤由 3 步调整为 4 步。",
        "createdAt": "2026-03-24T12:00:00.000Z",
        "isCurrent": true
      }
    ]
  },
  "requestId": "req_001"
}
```

### 6.7 创建新版本

`POST /api/v1/recipes/:id/versions`

请求体：

```json
{
  "versionName": "少油版",
  "categoryId": "cat_002",
  "tagIds": [
    "tag_001",
    "tag_003"
  ],
  "ingredientsText": "番茄 2 个，鸡蛋 3 个，盐少许，油少许",
  "steps": [
    "番茄切块",
    "鸡蛋打散",
    "热锅少油炒蛋",
    "加入番茄翻炒"
  ],
  "tips": "控制火候"
}
```

响应体：

```json
{
  "success": true,
  "data": {
    "version": {
      "id": "rv_003",
      "versionNumber": 3,
      "versionName": "少油版",
      "diffSummary": {
        "ingredientsChanged": true,
        "addedTags": [
          "清淡"
        ],
        "removedTags": [],
        "stepCountBefore": 3,
        "stepCountAfter": 4,
        "summary": "新增标签“清淡”，步骤由 3 步调整为 4 步。"
      }
    }
  },
  "requestId": "req_001"
}
```

### 6.8 获取版本详情

`GET /api/v1/recipes/:id/versions/:versionId`

响应体使用 [RecipeVersionDetail](D:\AI\Menu%20Time\backend\API接口文档.md) 结构。

### 6.9 版本对比摘要

`GET /api/v1/recipes/:id/compare?base=rv_002&target=rv_003`

响应体：

```json
{
  "success": true,
  "data": {
    "baseVersionId": "rv_002",
    "targetVersionId": "rv_003",
    "diffSummary": {
      "ingredientsChanged": true,
      "addedTags": [
        "清淡"
      ],
      "removedTags": [
        "下饭"
      ],
      "stepCountBefore": 3,
      "stepCountAfter": 4,
      "summary": "新增标签“清淡”，移除标签“下饭”，步骤由 3 步调整为 4 步。"
    }
  },
  "requestId": "req_001"
}
```

### 6.10 切换当前版本

`POST /api/v1/recipes/:id/versions/:versionId/set-current`

请求体：

```json
{}
```

响应体：

```json
{
  "success": true,
  "data": {
    "recipeId": "recipe_001",
    "currentVersionId": "rv_002"
  },
  "requestId": "req_001"
}
```

## 7. 时光记录接口

### 7.1 获取某菜谱时光轴

`GET /api/v1/recipes/:id/moments`

查询参数：

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `page` | number | 页码 |
| `pageSize` | number | 每页数量 |

响应体：

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "moment_001",
        "recipeId": "recipe_001",
        "recipeVersionId": "rv_003",
        "recipeName": "番茄炒蛋",
        "occurredOn": "2026-03-24",
        "content": "今天做得很成功，孩子很爱吃。",
        "participantsText": "全家",
        "tasteRating": 5,
        "difficultyRating": 2,
        "images": [
          {
            "id": "media_001",
            "url": "https://cdn.example.com/moment-1.jpg",
            "width": 1080,
            "height": 1440
          }
        ],
        "createdAt": "2026-03-24T12:00:00.000Z"
      }
    ],
    "page": 1,
    "pageSize": 20,
    "total": 1,
    "hasMore": false
  },
  "requestId": "req_001"
}
```

### 7.2 创建时光记录

`POST /api/v1/recipes/:id/moments`

请求体：

```json
{
  "recipeVersionId": "rv_003",
  "occurredOn": "2026-03-24",
  "content": "今天做得很成功，孩子很爱吃。",
  "participantsText": "全家",
  "tasteRating": 5,
  "difficultyRating": 2,
  "imageIds": [
    "media_001",
    "media_002"
  ]
}
```

字段说明：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `recipeVersionId` | 否 | 关联具体版本 |
| `occurredOn` | 是 | 日期，格式 `YYYY-MM-DD` |
| `content` | 否 | 文本内容 |
| `participantsText` | 否 | 参与人文本 |
| `tasteRating` | 否 | 1-5 |
| `difficultyRating` | 否 | 1-5 |
| `imageIds` | 否 | 媒体资源 ID 数组，最多 9 个 |

### 7.3 获取首页最新时光流

`GET /api/v1/moments/latest`

查询参数：

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `limit` | number | 默认 20 |

响应体：

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "moment_001",
        "recipeId": "recipe_001",
        "recipeName": "番茄炒蛋",
        "occurredOn": "2026-03-24",
        "contentPreview": "今天做得很成功，孩子很爱吃。",
        "coverImage": {
          "id": "media_001",
          "url": "https://cdn.example.com/moment-1.jpg"
        }
      }
    ]
  },
  "requestId": "req_001"
}
```

### 7.4 编辑时光记录

`PATCH /api/v1/moments/:id`

请求体与创建接口同构，但支持部分字段更新。

### 7.5 删除时光记录

`DELETE /api/v1/moments/:id`

采用软删除。

## 8. 周菜单接口

### 8.1 获取当前周菜单

`GET /api/v1/menu-plans/current-week`

响应体：

```json
{
  "success": true,
  "data": {
    "week": {
      "id": "mpw_001",
      "weekStartDate": "2026-03-23",
      "status": "draft"
    },
    "items": [
      {
        "id": "mpi_001",
        "plannedDate": "2026-03-24",
        "mealSlot": "dinner",
        "sortOrder": 1,
        "note": "家里来客人",
        "sourceType": "manual",
        "recipe": {
          "id": "recipe_001",
          "name": "番茄炒蛋",
          "coverImage": {
            "id": "media_100",
            "url": "https://cdn.example.com/cover.jpg"
          }
        },
        "version": {
          "id": "rv_003",
          "versionNumber": 3,
          "versionName": "少油版"
        }
      }
    ],
    "plannedCount": 1
  },
  "requestId": "req_001"
}
```

### 8.2 获取指定周菜单

`GET /api/v1/menu-plans/weeks/:weekStartDate`

路径参数 `weekStartDate` 格式为 `YYYY-MM-DD`，要求传入周一日期。

### 8.3 新增菜单项

`POST /api/v1/menu-plans/weeks/:weekStartDate/items`

请求体：

```json
{
  "plannedDate": "2026-03-24",
  "mealSlot": "dinner",
  "recipeId": "recipe_001",
  "recipeVersionId": "rv_003",
  "note": "家里来客人",
  "sourceType": "manual"
}
```

### 8.4 更新菜单项

`PATCH /api/v1/menu-plans/items/:id`

请求体：

```json
{
  "plannedDate": "2026-03-25",
  "mealSlot": "dinner",
  "recipeVersionId": "rv_002",
  "note": "改成清淡版"
}
```

### 8.5 删除菜单项

`DELETE /api/v1/menu-plans/items/:id`

### 8.6 重排同日菜单项

`POST /api/v1/menu-plans/weeks/:weekStartDate/reorder`

请求体：

```json
{
  "plannedDate": "2026-03-24",
  "mealSlot": "dinner",
  "itemIds": [
    "mpi_003",
    "mpi_001",
    "mpi_002"
  ]
}
```

说明：

- 前端提交完整排序后的 `itemIds` 数组。
- 后端按数组顺序重写 `sortOrder`。

## 9. 购物清单接口

### 9.1 生成购物清单

`POST /api/v1/shopping-lists/generate`

请求体：

```json
{
  "mealPlanWeekId": "mpw_001"
}
```

响应体：

```json
{
  "success": true,
  "data": {
    "shoppingList": {
      "id": "sl_001",
      "mealPlanWeekId": "mpw_001",
      "versionNo": 1,
      "generatedAt": "2026-03-24T13:00:00.000Z"
    }
  },
  "requestId": "req_001"
}
```

### 9.2 获取购物清单详情

`GET /api/v1/shopping-lists/:id`

响应体使用 [ShoppingListDetail](D:\AI\Menu%20Time\backend\API接口文档.md) 结构。

建议前端本地按 `itemType` 分栏展示：

- `ingredient`
- `seasoning`

### 9.3 更新购物清单项

`PATCH /api/v1/shopping-lists/items/:id`

请求体：

```json
{
  "isChecked": true,
  "quantityNote": "4 个"
}
```

说明：

- 支持只更新 `isChecked` 或只更新 `quantityNote`。

### 9.4 生成复制文本

`POST /api/v1/shopping-lists/:id/copy-text`

响应体：

```json
{
  "success": true,
  "data": {
    "text": "菜品：\n番茄 4 个\n鸡蛋 6 个\n\n调料：\n盐\n油"
  },
  "requestId": "req_001"
}
```

### 9.5 生成分享图

`POST /api/v1/shopping-lists/:id/share-image`

说明：

- 推荐后端异步处理。
- 若异步，则首次返回任务受理状态。

建议响应体：

```json
{
  "success": true,
  "data": {
    "jobId": "job_001",
    "status": "queued"
  },
  "requestId": "req_001"
}
```

## 10. 随机点菜接口

### 10.1 创建随机点菜 session

`POST /api/v1/random-picks/sessions`

请求体：

```json
{
  "mode": "single",
  "weekStartDate": "2026-03-23",
  "filters": {
    "categoryIds": [
      "cat_001"
    ],
    "tagIds": [
      "tag_001"
    ],
    "difficultyMax": 3,
    "excludeRecentDays": 7,
    "preferredMemberTagIds": []
  }
}
```

字段说明：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `mode` | 是 | `single` 或 `week` |
| `weekStartDate` | 否 | 若要直接结合周菜单推荐，建议传入当前周一 |
| `filters.categoryIds` | 否 | 分类过滤 |
| `filters.tagIds` | 否 | 标签过滤 |
| `filters.difficultyMax` | 否 | 难度上限，1-5 |
| `filters.excludeRecentDays` | 否 | 排除最近 N 天吃过的菜 |
| `filters.preferredMemberTagIds` | 否 | 特定成员偏好标签，预留字段 |

响应体：

```json
{
  "success": true,
  "data": {
    "session": {
      "id": "rps_001",
      "mode": "single",
      "status": "completed",
      "filterSnapshot": {
        "categoryIds": [
          "cat_001"
        ],
        "tagIds": [
          "tag_001"
        ],
        "difficultyMax": 3,
        "excludeRecentDays": 7
      },
      "results": [
        {
          "id": "rpr_001",
          "sequenceNo": 1,
          "decision": "pending",
          "pickedForDate": null,
          "recipe": {
            "id": "recipe_001",
            "name": "番茄炒蛋"
          },
          "version": {
            "id": "rv_003",
            "versionNumber": 3,
            "versionName": "少油版"
          },
          "reasonMeta": {
            "matchedBy": [
              "category",
              "tag"
            ]
          }
        }
      ]
    }
  },
  "requestId": "req_001"
}
```

当候选池为空时：

```json
{
  "success": false,
  "error": {
    "code": "BUSINESS_RULE_VIOLATION",
    "message": "当前条件下没有可抽取的菜谱，请放宽筛选条件。"
  },
  "requestId": "req_001"
}
```

### 10.2 同条件重抽

`POST /api/v1/random-picks/sessions/:id/redraw`

请求体：

```json
{}
```

响应体：

- 返回更新后的 session 结果，结构与创建 session 相同。

### 10.3 接受随机结果

`POST /api/v1/random-picks/sessions/:id/results/:resultId/accept`

请求体：

```json
{
  "weekStartDate": "2026-03-23",
  "plannedDate": "2026-03-24",
  "mealSlot": "dinner"
}
```

说明：

- 对于单抽，接受结果后直接加入周菜单。
- 对于连抽，若 `pickedForDate` 已存在，后端可自动推入对应日期。

响应体：

```json
{
  "success": true,
  "data": {
    "resultId": "rpr_001",
    "decision": "accepted",
    "mealPlanItemId": "mpi_101"
  },
  "requestId": "req_001"
}
```

### 10.4 跳过随机结果

`POST /api/v1/random-picks/sessions/:id/results/:resultId/skip`

响应体：

```json
{
  "success": true,
  "data": {
    "resultId": "rpr_001",
    "decision": "skipped"
  },
  "requestId": "req_001"
}
```

### 10.5 获取随机 session 详情

`GET /api/v1/random-picks/sessions/:id`

响应体使用 [RandomPickSessionDetail](D:\AI\Menu%20Time\backend\API接口文档.md) 结构。

## 11. 媒体接口

### 11.1 获取上传凭证

`POST /api/v1/media/upload-token`

请求体：

```json
{
  "purpose": "moment",
  "fileName": "image.jpg",
  "mimeType": "image/jpeg",
  "sizeBytes": 102400
}
```

响应体：

```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://storage.example.com/presigned-url",
    "assetKey": "households/h_001/moments/temp/image.jpg",
    "headers": {
      "Content-Type": "image/jpeg"
    }
  },
  "requestId": "req_001"
}
```

### 11.2 完成上传并登记媒体

`POST /api/v1/media/complete`

请求体：

```json
{
  "assetKey": "households/h_001/moments/temp/image.jpg",
  "purpose": "moment",
  "mimeType": "image/jpeg",
  "sizeBytes": 102400,
  "width": 1080,
  "height": 1440
}
```

响应体：

```json
{
  "success": true,
  "data": {
    "asset": {
      "id": "media_001",
      "url": "https://cdn.example.com/households/h_001/moments/temp/image.jpg",
      "mimeType": "image/jpeg",
      "sizeBytes": 102400,
      "width": 1080,
      "height": 1440,
      "purpose": "moment"
    }
  },
  "requestId": "req_001"
}
```

## 12. 成员协作接口

说明：

- 以下接口为二期预留。
- 若当前版本未实现，可在文档中保留为 `planned` 状态。

### 12.1 获取成员列表

`GET /api/v1/members`

响应体：

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "usr_002",
        "nickname": "小明",
        "role": "member",
        "status": "active"
      }
    ]
  },
  "requestId": "req_001"
}
```

### 12.2 邀请成员

`POST /api/v1/members/invite`

请求体：

```json
{
  "nickname": "小明",
  "email": "xiaoming@example.com",
  "role": "member"
}
```

## 13. 前端联调建议

### 13.1 建议优先联调顺序

1. `auth`
2. `categories/tags`
3. `recipes`
4. `recipe versions`
5. `moments`
6. `menu plans`
7. `shopping lists`
8. `random picks`

### 13.2 建议前端先抽公共类型

- `ApiResponse<T>`
- `PaginatedResponse<T>`
- `Category`
- `Tag`
- `MediaAsset`
- `RecipeListItem`
- `RecipeVersionDetail`
- `MomentItem`
- `MealPlanItem`
- `ShoppingListDetail`
- `RandomPickSessionDetail`

### 13.3 建议前端关注的状态约定

- 菜谱详情页使用 `recipe.currentVersion` 作为默认展示版本。
- 版本页使用 `isCurrent` 区分当前版本。
- 购物清单页以前端按 `itemType` 分栏。
- 首页的时光流使用 `contentPreview`，无需再自行截断原文。
- 随机点菜结果页以 `decision` 驱动按钮状态。

## 14. 当前未定或可后续补充的点

- 登录账号体系最终是否只保留邮箱密码，还是支持微信登录。
- 菜谱搜索是否增加拼音、模糊匹配或全文检索。
- 食材数量是否在首版就做严格结构化解析。
- 分享图接口最终采用同步返回还是异步任务查询模式。
- 成员偏好标签的建模与接口是否单独拆成成员偏好模块。

