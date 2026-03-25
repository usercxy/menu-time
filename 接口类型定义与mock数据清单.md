# 食光记接口类型定义与 Mock 数据清单

## 1. 文档说明

本文档用于补齐前端接口类型定义、服务层签名建议、Mock 数据组织方式与示例数据，作为前后端联调前的类型基线。

输入依据：

- [前端技术方案.md](D:/AI/Menu Time/前端技术方案.md)
- [backend/API接口文档.md](D:/AI/Menu Time/backend/API接口文档.md)
- [backend/后端技术方案.md](D:/AI/Menu Time/backend/后端技术方案.md)

## 2. 类型设计原则

### 2.1 总原则

- 前端类型命名优先与后端 DTO 对齐
- `DTO` 负责承接接口结构
- `VM` 负责页面展示结构
- 服务层返回 DTO，页面层只消费 VM

### 2.2 文件结构建议

```text
src/types/
├─ api.ts
├─ session.ts
├─ taxonomy.ts
├─ media.ts
├─ recipe.ts
├─ moment.ts
├─ planner.ts
├─ shopping.ts
├─ random-pick.ts
└─ view-model.ts

src/mocks/
├─ session.ts
├─ categories.ts
├─ tags.ts
├─ recipes.ts
├─ recipe-detail.ts
├─ moments.ts
├─ planner.ts
├─ shopping.ts
└─ random-pick.ts
```

## 3. 通用类型定义

```ts
export interface ApiResponse<T> {
  success: boolean
  data: T
  requestId: string
}

export interface PageQuery {
  page?: number
  pageSize?: number
}

export interface PageResult<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
  hasMore: boolean
}
```

## 4. 会话与公共实体

```ts
export type UserRole = 'admin' | 'member'

export interface UserSession {
  user: {
    id: string
    nickname: string
    role: UserRole
  }
  household: {
    id: string
    name: string
  }
}

export interface CategoryDTO {
  id: string
  name: string
  sortOrder: number
  color?: string
  createdAt: string
  updatedAt: string
}

export interface TagDTO {
  id: string
  name: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface MediaAssetDTO {
  id: string
  url: string
  mimeType: string
  sizeBytes: number
  width?: number
  height?: number
  purpose: 'moment' | 'recipe_cover' | 'shopping_share'
}
```

## 5. 菜谱相关类型

### 5.1 列表与详情

```ts
export interface RecipeVersionBriefDTO {
  id: string
  versionNumber: number
  versionName?: string
  category?: {
    id: string
    name: string
  }
  tags: Array<{
    id: string
    name: string
  }>
}

export interface RecipeListItemDTO {
  id: string
  name: string
  coverImage?: Pick<MediaAssetDTO, 'id' | 'url'>
  currentVersion: RecipeVersionBriefDTO
  versionCount: number
  momentCount: number
  latestMomentAt?: string
  latestCookedAt?: string
  updatedAt?: string
}

export interface IngredientDTO {
  id: string
  rawText: string
  normalizedName?: string
  amountText?: string
  unit?: string
  isSeasoning?: boolean
}

export interface RecipeVersionDetailDTO {
  id: string
  recipeId: string
  versionNumber: number
  versionName?: string
  category?: {
    id: string
    name: string
  }
  tags: Array<{
    id: string
    name: string
  }>
  ingredientsText: string
  ingredients: IngredientDTO[]
  steps: string[]
  tips?: string
  createdAt?: string
}

export interface RecipeDetailDTO {
  recipe: {
    id: string
    name: string
    coverImage?: Pick<MediaAssetDTO, 'id' | 'url'>
    coverSource?: 'manual' | 'moment_latest'
    versionCount: number
    momentCount: number
    latestMomentAt?: string
    currentVersion: RecipeVersionDetailDTO
  }
}
```

### 5.2 编辑与版本提交

```ts
export interface RecipeUpsertPayload {
  name: string
  categoryId?: string
  tagIds: string[]
  ingredientsText: string
  steps: string[]
  tips?: string
}

export interface CreateRecipePayload extends RecipeUpsertPayload {}

export interface UpdateRecipePayload extends Partial<RecipeUpsertPayload> {}

export interface CreateRecipeVersionPayload {
  versionName?: string
  categoryId?: string
  tagIds: string[]
  ingredientsText: string
  steps: string[]
  tips?: string
}

export interface VersionDiffSummaryDTO {
  ingredientsChanged: boolean
  addedTags: string[]
  removedTags: string[]
  stepCountBefore: number
  stepCountAfter: number
  summary: string
}
```

## 6. 时光记录类型

```ts
export interface MomentItemDTO {
  id: string
  recipeId: string
  recipeVersionId?: string
  recipeName: string
  occurredOn: string
  content: string
  participantsText?: string
  tasteRating?: number
  difficultyRating?: number
  images: Array<Pick<MediaAssetDTO, 'id' | 'url' | 'width' | 'height'>>
  createdAt: string
}

export interface LatestMomentItemDTO {
  id: string
  recipeId: string
  recipeName: string
  occurredOn: string
  contentPreview: string
  coverImage?: Pick<MediaAssetDTO, 'id' | 'url'>
}

export interface CreateMomentPayload {
  recipeVersionId?: string
  occurredOn: string
  content: string
  participantsText?: string
  tasteRating?: number
  difficultyRating?: number
  imageAssetIds: string[]
}
```

## 7. 点菜台类型

```ts
export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface MealPlanItemDTO {
  id: string
  plannedDate: string
  mealSlot: MealSlot
  sortOrder: number
  note?: string
  sourceType: 'manual' | 'random'
  recipe: {
    id: string
    name: string
    coverImage?: Pick<MediaAssetDTO, 'id' | 'url'>
  }
  version: {
    id: string
    versionNumber: number
    versionName?: string
  }
}

export interface MealPlanWeekDTO {
  week: {
    id: string
    weekStartDate: string
    status: 'draft' | 'published'
  }
  items: MealPlanItemDTO[]
}

export interface CreateMealPlanItemPayload {
  plannedDate: string
  mealSlot: MealSlot
  recipeId: string
  recipeVersionId: string
  note?: string
  sourceType: 'manual' | 'random'
}

export interface UpdateMealPlanItemPayload {
  plannedDate?: string
  mealSlot?: MealSlot
  recipeVersionId?: string
  note?: string
}
```

## 8. 购物清单类型

```ts
export type ShoppingItemType = 'ingredient' | 'seasoning'

export interface ShoppingSourceRecipeRefDTO {
  recipeId: string
  recipeName: string
  recipeVersionId: string
  versionLabel: string
}

export interface ShoppingListItemDTO {
  id: string
  itemType: ShoppingItemType
  displayName: string
  normalizedName: string
  quantityNote?: string
  sourceCount: number
  isChecked: boolean
  sortOrder: number
  sourceRecipeRefs: ShoppingSourceRecipeRefDTO[]
}

export interface ShoppingListDetailDTO {
  id: string
  mealPlanWeekId: string
  versionNo: number
  generatedAt: string
  items: ShoppingListItemDTO[]
}

export interface UpdateShoppingListItemPayload {
  isChecked?: boolean
  quantityNote?: string
}
```

## 9. 随机点菜类型

```ts
export interface RandomPickFiltersDTO {
  categoryIds: string[]
  tagIds: string[]
  difficultyMax?: number
  excludeRecentDays?: number
  preferredMemberTagIds: string[]
}

export interface RandomPickResultDTO {
  id: string
  sequenceNo: number
  decision: 'pending' | 'accepted' | 'skipped'
  pickedForDate: string | null
  recipe: {
    id: string
    name: string
  }
  version: {
    id: string
    versionNumber: number
    versionName?: string
  }
}

export interface RandomPickSessionDetailDTO {
  id: string
  mode: 'single' | 'week'
  status: 'completed' | 'ongoing'
  filterSnapshot: RandomPickFiltersDTO
  results: RandomPickResultDTO[]
}

export interface CreateRandomPickSessionPayload {
  mode: 'single' | 'week'
  weekStartDate?: string
  filters: RandomPickFiltersDTO
}
```

## 10. 媒体上传类型

```ts
export interface UploadTokenPayload {
  purpose: 'moment' | 'recipe_cover' | 'shopping_share'
  fileName: string
  mimeType: string
  sizeBytes: number
}

export interface UploadTokenDTO {
  uploadUrl: string
  assetKey: string
  headers: Record<string, string>
}

export interface CompleteUploadPayload {
  assetKey: string
  purpose: 'moment' | 'recipe_cover' | 'shopping_share'
  mimeType: string
  sizeBytes: number
  width?: number
  height?: number
}
```

## 11. 服务层签名建议

```ts
export interface RecipeService {
  getRecipeList(query: {
    page?: number
    pageSize?: number
    keyword?: string
    categoryId?: string
    tagIds?: string[]
    sortBy?: 'updatedAt' | 'latestMomentAt'
  }): Promise<PageResult<RecipeListItemDTO>>

  getRecipeDetail(id: string): Promise<RecipeDetailDTO>
  createRecipe(payload: CreateRecipePayload): Promise<{ recipeId: string }>
  updateRecipe(id: string, payload: UpdateRecipePayload): Promise<void>
  getRecipeVersions(recipeId: string): Promise<RecipeVersionDetailDTO[]>
  createVersion(recipeId: string, payload: CreateRecipeVersionPayload): Promise<{ versionId: string }>
  compareVersions(recipeId: string, base: string, target: string): Promise<VersionDiffSummaryDTO>
}
```

## 12. ViewModel 转换建议

```ts
export interface RecipeCardVM {
  id: string
  title: string
  coverUrl?: string
  versionLabel: string
  categoryName?: string
  tagNames: string[]
  versionCount: number
  momentCount: number
  latestMomentLabel?: string
}
```

说明：

- DTO 保留接口原始表达
- VM 保留页面渲染需要的最终字段

## 13. Mock 数据组织清单

### 13.1 基础 mock 文件

| 文件 | 作用 |
| --- | --- |
| `src/mocks/session.ts` | 登录态与家庭信息 |
| `src/mocks/categories.ts` | 分类列表 |
| `src/mocks/tags.ts` | 标签列表 |
| `src/mocks/recipes.ts` | 菜谱列表 |
| `src/mocks/recipe-detail.ts` | 菜谱详情与版本详情 |
| `src/mocks/moments.ts` | 时光记录列表与首页时光流 |
| `src/mocks/planner.ts` | 当前周菜单 |
| `src/mocks/shopping.ts` | 购物清单 |
| `src/mocks/random-pick.ts` | 随机点菜 session |

### 13.2 页面级 mock 覆盖关系

| 页面 | 需要的 mock |
| --- | --- |
| 首页 | `session`, `planner`, `moments` |
| 菜谱库 | `categories`, `tags`, `recipes` |
| 菜谱详情 | `recipe-detail`, `moments` |
| 菜谱新建/编辑 | `categories`, `tags` |
| 新建版本 | `recipe-detail`, `tags`, `categories` |
| 记一笔 | `recipe-detail`, `moments` |
| 点菜台 | `planner`, `recipes` |
| 购物清单 | `shopping` |
| 随机点菜 | `random-pick`, `categories`, `tags` |

## 14. 推荐 Mock 样例

### 14.1 会话

```ts
export const mockSession: UserSession = {
  user: {
    id: 'usr_001',
    nickname: '管理员',
    role: 'admin',
  },
  household: {
    id: 'h_001',
    name: '林家厨房',
  },
}
```

### 14.2 分类与标签

```ts
export const mockCategories: CategoryDTO[] = [
  { id: 'cat_001', name: '肉菜', sortOrder: 1, color: '#D97706', createdAt: '2026-03-24T10:00:00.000Z', updatedAt: '2026-03-24T10:00:00.000Z' },
  { id: 'cat_002', name: '素菜', sortOrder: 2, color: '#596859', createdAt: '2026-03-24T10:00:00.000Z', updatedAt: '2026-03-24T10:00:00.000Z' },
]

export const mockTags: TagDTO[] = [
  { id: 'tag_001', name: '下饭', sortOrder: 1, createdAt: '2026-03-24T10:00:00.000Z', updatedAt: '2026-03-24T10:00:00.000Z' },
  { id: 'tag_002', name: '快手', sortOrder: 2, createdAt: '2026-03-24T10:00:00.000Z', updatedAt: '2026-03-24T10:00:00.000Z' },
]
```

### 14.3 菜谱列表

```ts
export const mockRecipeList: RecipeListItemDTO[] = [
  {
    id: 'recipe_001',
    name: '番茄炒蛋',
    coverImage: { id: 'media_100', url: 'https://cdn.example.com/cover.jpg' },
    currentVersion: {
      id: 'rv_003',
      versionNumber: 3,
      versionName: '少油版',
      category: { id: 'cat_002', name: '素菜' },
      tags: [{ id: 'tag_002', name: '快手' }],
    },
    versionCount: 3,
    momentCount: 5,
    latestMomentAt: '2026-03-24T10:00:00.000Z',
    latestCookedAt: '2026-03-24',
  },
]
```

### 14.4 菜谱详情

```ts
export const mockRecipeDetail: RecipeDetailDTO = {
  recipe: {
    id: 'recipe_001',
    name: '番茄炒蛋',
    coverImage: { id: 'media_100', url: 'https://cdn.example.com/cover.jpg' },
    coverSource: 'moment_latest',
    versionCount: 3,
    momentCount: 5,
    latestMomentAt: '2026-03-24T10:00:00.000Z',
    currentVersion: {
      id: 'rv_003',
      recipeId: 'recipe_001',
      versionNumber: 3,
      versionName: '少油版',
      category: { id: 'cat_002', name: '素菜' },
      tags: [{ id: 'tag_002', name: '快手' }],
      ingredientsText: '番茄 2 个，鸡蛋 3 个，盐，油',
      ingredients: [
        { id: 'ing_001', rawText: '番茄 2 个', normalizedName: '番茄', amountText: '2', unit: '个' },
        { id: 'ing_002', rawText: '鸡蛋 3 个', normalizedName: '鸡蛋', amountText: '3', unit: '个' },
      ],
      steps: ['番茄切块', '鸡蛋打散', '热锅少油炒蛋', '加入番茄翻炒'],
      tips: '控制火候',
    },
  },
}
```

### 14.5 时光记录

```ts
export const mockMoments: MomentItemDTO[] = [
  {
    id: 'moment_001',
    recipeId: 'recipe_001',
    recipeVersionId: 'rv_003',
    recipeName: '番茄炒蛋',
    occurredOn: '2026-03-24',
    content: '今天做得很成功，孩子很爱吃。',
    participantsText: '全家',
    tasteRating: 5,
    difficultyRating: 2,
    images: [
      { id: 'media_001', url: 'https://cdn.example.com/moment-1.jpg', width: 1080, height: 1440 },
    ],
    createdAt: '2026-03-24T12:00:00.000Z',
  },
]
```

### 14.6 周菜单

```ts
export const mockMealPlanWeek: MealPlanWeekDTO = {
  week: {
    id: 'mpw_001',
    weekStartDate: '2026-03-23',
    status: 'draft',
  },
  items: [
    {
      id: 'mpi_001',
      plannedDate: '2026-03-24',
      mealSlot: 'dinner',
      sortOrder: 1,
      note: '家里来客人',
      sourceType: 'manual',
      recipe: {
        id: 'recipe_001',
        name: '番茄炒蛋',
        coverImage: { id: 'media_100', url: 'https://cdn.example.com/cover.jpg' },
      },
      version: {
        id: 'rv_003',
        versionNumber: 3,
        versionName: '少油版',
      },
    },
  ],
}
```

### 14.7 购物清单

```ts
export const mockShoppingList: ShoppingListDetailDTO = {
  id: 'sl_001',
  mealPlanWeekId: 'mpw_001',
  versionNo: 1,
  generatedAt: '2026-03-24T13:00:00.000Z',
  items: [
    {
      id: 'sli_001',
      itemType: 'ingredient',
      displayName: '番茄',
      normalizedName: '番茄',
      quantityNote: '4 个',
      sourceCount: 2,
      isChecked: false,
      sortOrder: 1,
      sourceRecipeRefs: [
        {
          recipeId: 'recipe_001',
          recipeName: '番茄炒蛋',
          recipeVersionId: 'rv_003',
          versionLabel: 'V3 少油版',
        },
      ],
    },
  ],
}
```

### 14.8 随机点菜

```ts
export const mockRandomPickSession: RandomPickSessionDetailDTO = {
  id: 'rps_001',
  mode: 'single',
  status: 'completed',
  filterSnapshot: {
    categoryIds: ['cat_001'],
    tagIds: ['tag_001'],
    difficultyMax: 3,
    excludeRecentDays: 7,
    preferredMemberTagIds: [],
  },
  results: [
    {
      id: 'rpr_001',
      sequenceNo: 1,
      decision: 'pending',
      pickedForDate: null,
      recipe: {
        id: 'recipe_001',
        name: '番茄炒蛋',
      },
      version: {
        id: 'rv_003',
        versionNumber: 3,
        versionName: '少油版',
      },
    },
  ],
}
```

## 15. Mock 场景建议

至少准备以下场景：

- 空列表场景
- 单条数据场景
- 多条分页场景
- 封面缺失场景
- 无标签场景
- 图片上传失败场景
- 随机点菜无结果场景
- 购物清单全部已购场景

## 16. 联调前检查项

- 字段命名与 API 文档保持一致
- 时间字段全部使用 ISO 字符串
- 图片字段只透出前端需要的尺寸信息
- 版本、菜单、购物清单之间的 ID 关系能串起来
- mock 数据覆盖空态、正常态、异常态
