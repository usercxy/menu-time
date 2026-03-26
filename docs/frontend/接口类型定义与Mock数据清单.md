# 食光记接口类型定义与 Mock 数据清单

## 1. 文档说明

本文档补齐前端接口类型定义、服务层签名建议、DTO 与 ViewModel 边界、Mock 数据组织方式与样例数据，作为前后端联调前的类型基线。

输入依据：

- [前端技术方案](D:/AI/Menu%20Time/docs/frontend/前端技术方案.md)
- [页面路由与跳转图](D:/AI/Menu%20Time/docs/frontend/页面路由与跳转图.md)
- [API 接口清单](D:/AI/Menu%20Time/docs/backend/API%20接口清单.md)
- [后端技术方案](D:/AI/Menu%20Time/docs/backend/后端技术方案.md)

## 2. 类型设计原则

### 2.1 总原则

- 前端类型命名尽量与后端 DTO 对齐。
- `DTO` 承接接口结构，`VM` 承接页面展示结构。
- 服务层负责 DTO 到 VM 的轻量转换。
- 页面层不直接处理接口“脏结构”，例如分页、空值兼容、日期格式化。
- Mock 数据必须严格对齐 DTO，而不是只对齐页面视觉。

### 2.2 目录建议

```text
miniapp/src/
  services/
    types/
      api.ts
      auth.ts
      taxonomy.ts
      recipe.ts
      moment.ts
      meal-plan.ts
      shopping.ts
      random-pick.ts
      media.ts
  features/
    recipe/
      mapper.ts
      vm.ts
    moment/
      mapper.ts
      vm.ts
    meal-plan/
      mapper.ts
      vm.ts
  mocks/
    session.mock.ts
    taxonomy.mock.ts
    recipe.mock.ts
    moment.mock.ts
    meal-plan.mock.ts
    shopping.mock.ts
    random-pick.mock.ts
```

## 3. 通用类型定义

### 3.1 统一响应

```ts
export interface ApiSuccess<T> {
  success: true
  data: T
  requestId: string
}

export interface ApiFailure {
  success: false
  error: {
    code:
      | 'UNAUTHORIZED'
      | 'FORBIDDEN'
      | 'VALIDATION_ERROR'
      | 'NOT_FOUND'
      | 'CONFLICT'
      | 'BUSINESS_RULE_VIOLATION'
      | 'INTERNAL_ERROR'
    message: string
    details?: unknown
  }
  requestId: string
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure
```

### 3.2 分页与列表

前后端已统一冻结分页响应格式，所有分页列表接口统一采用 `PageResult<T>`：

```ts
export interface PaginationQuery {
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

## 4. 认证与基础实体类型

```ts
export type UserRole = 'admin' | 'member'

export interface SessionUserDTO {
  id: string
  nickname: string
  role: UserRole
  householdId: string
}

export interface SessionDTO {
  user: SessionUserDTO
}

export interface TokenBundleDTO {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface WechatLoginPayload {
  code: string
}

export interface WechatLoginDTO extends TokenBundleDTO {
  user: SessionUserDTO
}

export interface RefreshTokenPayload {
  refreshToken: string
}

export interface CategoryDTO {
  id: string
  name: string
  sortOrder: number
  color?: string
}

export interface TagDTO {
  id: string
  name: string
  sortOrder: number
}

export interface NamedRefDTO {
  id: string
  name: string
}
```

## 5. 媒体类型

```ts
export type MediaPurpose = 'moment' | 'cover' | 'share'

export interface MediaAssetDTO {
  id: string
  assetUrl: string
  mimeType: string
  sizeBytes: number
  width?: number
  height?: number
  purpose: MediaPurpose
}

export interface UploadTokenPayload {
  filename: string
  contentType: string
  sizeBytes: number
  purpose: MediaPurpose
}

export interface UploadTokenDTO {
  uploadUrl: string
  assetKey: string
  headers?: Record<string, string>
  expiresIn: number
}

export interface CompleteUploadPayload {
  assetKey: string
  assetUrl: string
  mimeType: string
  sizeBytes: number
  width?: number
  height?: number
  purpose: MediaPurpose
}

export interface CompleteUploadDTO {
  assetId: string
  assetUrl: string
}
```

## 6. 菜谱域类型

### 6.1 版本与食材基础类型

```ts
export interface RecipeTagDTO {
  id: string
  name: string
}

export interface RecipeCategoryDTO {
  id: string
  name: string
}

export interface IngredientLineDTO {
  rawText: string
  normalizedName?: string
  amountText?: string
  unit?: string
  isSeasoning?: boolean
}

export interface RecipeStepDTO {
  sortOrder: number
  content: string
}
```

### 6.2 菜谱列表与详情

```ts
export interface RecipeVersionBriefDTO {
  id: string
  versionNumber: number
  versionName?: string
  category?: RecipeCategoryDTO
  tags: RecipeTagDTO[]
}

export interface RecipeListItemDTO {
  id: string
  name: string
  coverImageUrl?: string
  currentVersion: RecipeVersionBriefDTO
  versionCount: number
  momentCount: number
  latestMomentAt?: string
  latestCookedAt?: string
}

export interface GetRecipesQuery extends PaginationQuery {
  keyword?: string
  categoryId?: string
  tagIds?: string[]
  sortBy?: 'updatedAt' | 'latestMomentAt' | 'name'
}

export interface RecipeVersionDetailDTO {
  id: string
  versionNumber: number
  versionName?: string
  sourceVersionId?: string
  diffSummaryText?: string
  diffSummaryJson?: VersionDiffSummaryDTO
  category?: RecipeCategoryDTO
  tags: RecipeTagDTO[]
  ingredientsText?: string
  ingredients: IngredientLineDTO[]
  steps: RecipeStepDTO[]
  tips?: string
}

export interface RecipeDetailDTO {
  id: string
  name: string
  coverImageUrl?: string
  coverSource?: 'custom' | 'moment_latest' | 'none'
  versionCount: number
  momentCount: number
  latestMomentAt?: string
  currentVersion: RecipeVersionDetailDTO
}
```

### 6.3 创建与编辑

```ts
export interface CreateRecipePayload {
  name: string
  categoryId?: string | null
  newCategoryName?: string | null
  tagIds: string[]
  newTagNames?: string[]
  versionName?: string
  ingredientsText?: string
  ingredients: IngredientLineDTO[]
  steps: RecipeStepDTO[]
  tips?: string
}

export interface CreateRecipeResultDTO {
  recipeId: string
  currentVersionId: string
  versionNumber: number
}

export interface UpdateRecipePayload {
  name?: string
  coverImageId?: string
  status?: 'active' | 'archived'
}
```

### 6.4 版本管理

```ts
export interface RecipeVersionListItemDTO {
  id: string
  versionNumber: number
  versionName?: string
  isCurrent: boolean
  diffSummaryText?: string
  createdAt: string
}

export interface CreateVersionPayload {
  sourceVersionId: string
  versionName?: string
  categoryId?: string
  tagIds: string[]
  ingredientsText?: string
  ingredients?: IngredientLineDTO[]
  steps: RecipeStepDTO[]
  tips?: string
}

export interface CreateVersionResultDTO {
  versionId: string
  versionNumber: number
  diffSummaryText?: string
}

export interface VersionDiffSummaryDTO {
  ingredientsChanged?: boolean
  addedTags?: string[]
  removedTags?: string[]
  stepCountBefore?: number
  stepCountAfter?: number
  summary?: string
}

export interface CompareVersionsDTO {
  baseVersion: {
    id?: string
    versionNumber: number
    versionName?: string
  }
  targetVersion: {
    id?: string
    versionNumber: number
    versionName?: string
  }
  summaryText: string
  summaryJson?: VersionDiffSummaryDTO
}
```

## 7. 时光记录域类型

```ts
export interface MomentImageDTO {
  id: string
  url: string
  width?: number
  height?: number
}

export interface MomentRecipeVersionRefDTO {
  id: string
  versionNumber: number
  versionName?: string
}

export interface MomentItemDTO {
  id: string
  occurredOn: string
  content?: string
  participantsText?: string
  tasteRating?: number
  difficultyRating?: number
  images: MomentImageDTO[]
  recipeVersion?: MomentRecipeVersionRefDTO
}

export interface LatestMomentItemDTO {
  momentId: string
  recipeId: string
  recipeName: string
  coverImageUrl?: string
  occurredOn: string
  previewText?: string
}

export interface CreateMomentPayload {
  recipeVersionId?: string
  occurredOn: string
  content?: string
  participantsText?: string
  tasteRating?: number
  difficultyRating?: number
  isCoverCandidate?: boolean
  imageAssetIds: string[]
}

export interface UpdateMomentPayload extends Partial<CreateMomentPayload> {}
```

## 8. 周菜单域类型

```ts
export type MealSlot = 'lunch' | 'dinner' | 'extra'
export type MealSourceType = 'manual' | 'random'

export interface MealPlanItemDTO {
  id: string
  recipeId: string
  recipeVersionId: string
  plannedDate: string
  mealSlot: MealSlot
  sortOrder: number
  sourceType: MealSourceType
  note?: string
  recipe?: {
    id: string
    name: string
    coverImageUrl?: string
  }
  version?: {
    id: string
    versionNumber: number
    versionName?: string
  }
}

export interface MealPlanWeekDTO {
  week: {
    id: string
    weekStartDate: string
    status: 'draft' | 'finalized'
  }
  items: MealPlanItemDTO[]
}

export interface CreateMealPlanItemPayload {
  recipeId: string
  recipeVersionId: string
  plannedDate: string
  mealSlot: MealSlot
  note?: string
  sourceType: MealSourceType
}

export interface UpdateMealPlanItemPayload {
  recipeVersionId?: string
  plannedDate?: string
  mealSlot?: MealSlot
  note?: string
}

export interface ReorderMealPlanPayload {
  plannedDate: string
  mealSlot: MealSlot
  items: Array<{
    id: string
    sortOrder: number
  }>
}
```

## 9. 随机点菜域类型

```ts
export interface RandomPickFiltersDTO {
  categoryIds?: string[]
  tagIds?: string[]
  maxDifficulty?: number
  excludeRecentDays?: number
  excludeCurrentWeekPlanned?: boolean
  preferredMemberTags?: string[]
}

export interface RandomPickRecipeRefDTO {
  id: string
  name: string
  coverImageUrl?: string
}

export interface RandomPickVersionRefDTO {
  id: string
  versionNumber: number
  versionName?: string
}

export interface RandomPickResultDTO {
  id: string
  sequenceNo: number
  decision: 'accepted' | 'skipped' | 'pending'
  pickedForDate?: string | null
  recipe: RandomPickRecipeRefDTO
  version: RandomPickVersionRefDTO
}

export interface CreateRandomPickSessionPayload {
  mode: 'single' | 'week'
  filters: RandomPickFiltersDTO
}

export interface CreateRandomPickSessionDTO {
  sessionId: string
  mode: 'single' | 'week'
  results: RandomPickResultDTO[]
}

export interface RandomPickSessionDetailDTO {
  session: {
    id: string
    mode: 'single' | 'week'
    status: 'running' | 'completed' | 'abandoned'
    filterSnapshot: RandomPickFiltersDTO
  }
  results: RandomPickResultDTO[]
}

export interface AcceptRandomPickPayload {
  plannedDate: string
  mealSlot: MealSlot
}
```

## 10. 购物清单域类型

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
  weekStartDate: string
  versionNo: number
  generatedAt: string
  ingredientItems: ShoppingListItemDTO[]
  seasoningItems: ShoppingListItemDTO[]
}

export interface GenerateShoppingListPayload {
  weekStartDate: string
  generatedFrom: 'manual' | 'auto_refresh'
}

export interface GenerateShoppingListDTO {
  shoppingListId: string
  versionNo: number
}

export interface UpdateShoppingListItemPayload {
  isChecked?: boolean
  quantityNote?: string
}

export interface CopyShoppingListTextDTO {
  text: string
}

export interface ShareShoppingListImageDTO {
  taskAccepted: boolean
  imageAssetId?: string
}
```

## 11. 服务层签名建议

### 11.1 认证与基础字典

```ts
export interface AuthService {
  wechatLogin(payload: WechatLoginPayload): Promise<WechatLoginDTO>
  refresh(payload: RefreshTokenPayload): Promise<TokenBundleDTO>
  logout(payload: RefreshTokenPayload): Promise<void>
  getSession(): Promise<SessionDTO>
}

export interface TaxonomyService {
  getCategories(): Promise<CategoryDTO[]>
  createCategory(payload: { name: string; color?: string }): Promise<CategoryDTO>
  updateCategory(id: string, payload: { name?: string; color?: string }): Promise<CategoryDTO>
  deleteCategory(id: string): Promise<void>
  reorderCategories(payload: { items: Array<{ id: string; sortOrder: number }> }): Promise<void>
  getTags(): Promise<TagDTO[]>
  createTag(payload: { name: string }): Promise<TagDTO>
  updateTag(id: string, payload: { name?: string }): Promise<TagDTO>
  deleteTag(id: string): Promise<void>
}
```

### 11.2 菜谱与版本

```ts
export interface RecipeService {
  getRecipeList(query: GetRecipesQuery): Promise<PageResult<RecipeListItemDTO>>
  createRecipe(payload: CreateRecipePayload): Promise<CreateRecipeResultDTO>
  getRecipeDetail(id: string): Promise<RecipeDetailDTO>
  updateRecipe(id: string, payload: UpdateRecipePayload): Promise<void>
  deleteRecipe(id: string): Promise<void>
  getRecipeVersions(recipeId: string): Promise<RecipeVersionListItemDTO[]>
  getRecipeVersion(recipeId: string, versionId: string): Promise<RecipeVersionDetailDTO>
  createVersion(recipeId: string, payload: CreateVersionPayload): Promise<CreateVersionResultDTO>
  setCurrentVersion(recipeId: string, versionId: string): Promise<{ recipeId: string; currentVersionId: string }>
  compareVersions(recipeId: string, base: number, target: number): Promise<CompareVersionsDTO>
}
```

### 11.3 时光、点菜、购物、随机

```ts
export interface MomentService {
  getRecipeMoments(recipeId: string, query?: PaginationQuery): Promise<PageResult<MomentItemDTO>>
  createMoment(recipeId: string, payload: CreateMomentPayload): Promise<void>
  updateMoment(id: string, payload: UpdateMomentPayload): Promise<void>
  deleteMoment(id: string): Promise<void>
  getLatestMoments(limit?: number): Promise<LatestMomentItemDTO[]>
}

export interface MealPlanService {
  getCurrentWeek(): Promise<MealPlanWeekDTO>
  getWeek(weekStartDate: string): Promise<MealPlanWeekDTO>
  createItem(weekStartDate: string, payload: CreateMealPlanItemPayload): Promise<void>
  updateItem(id: string, payload: UpdateMealPlanItemPayload): Promise<void>
  deleteItem(id: string): Promise<void>
  reorderWeek(weekStartDate: string, payload: ReorderMealPlanPayload): Promise<void>
}

export interface ShoppingService {
  generate(payload: GenerateShoppingListPayload): Promise<GenerateShoppingListDTO>
  getDetail(id: string): Promise<ShoppingListDetailDTO>
  updateItem(id: string, payload: UpdateShoppingListItemPayload): Promise<void>
  copyText(id: string): Promise<CopyShoppingListTextDTO>
  shareImage(id: string): Promise<ShareShoppingListImageDTO>
}

export interface RandomPickService {
  createSession(payload: CreateRandomPickSessionPayload): Promise<CreateRandomPickSessionDTO>
  redraw(sessionId: string): Promise<CreateRandomPickSessionDTO>
  accept(sessionId: string, resultId: string, payload: AcceptRandomPickPayload): Promise<{ accepted: boolean; mealPlanItemId: string }>
  skip(sessionId: string, resultId: string): Promise<void>
  getSession(sessionId: string): Promise<RandomPickSessionDetailDTO>
}
```

## 12. ViewModel 建议

页面层不应直接吃 DTO，可以保留最小 VM：

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

export interface TimelineCardVM {
  id: string
  recipeId: string
  recipeName: string
  coverUrl?: string
  dateLabel: string
  previewText?: string
}

export interface ShoppingGroupVM {
  title: '原料' | '调料'
  items: ShoppingListItemDTO[]
}
```

说明：

- DTO 负责和接口对齐。
- VM 负责页面友好展示，如版本标签、日期文案、空值兜底。
- 不要把“昨天”“今天”这类展示字段混进 DTO。

## 13. Mock 数据组织清单

### 13.1 基础文件

| 文件 | 作用 |
| --- | --- |
| `session.mock.ts` | 登录态和会话信息 |
| `taxonomy.mock.ts` | 分类、标签 |
| `recipe.mock.ts` | 菜谱列表、菜谱详情、版本列表、版本详情、对比结果 |
| `moment.mock.ts` | 菜谱时光轴、首页最新时光流 |
| `meal-plan.mock.ts` | 当前周菜单、指定周菜单 |
| `shopping.mock.ts` | 购物清单详情、复制文本、分享图结果 |
| `random-pick.mock.ts` | 随机点菜 session 和结果 |
| `media.mock.ts` | 上传 token 与上传完成结果 |

### 13.2 页面级覆盖关系

| 页面 | 需要的 mock |
| --- | --- |
| 首页 | `session`, `meal-plan`, `moment` |
| 菜谱库 | `taxonomy`, `recipe` |
| 菜谱详情 | `recipe`, `moment` |
| 新建菜谱 / 编辑 | `taxonomy`, `recipe` |
| 新建版本 | `recipe`, `taxonomy` |
| 记一笔 | `recipe`, `moment`, `media` |
| 点菜台 | `meal-plan`, `recipe` |
| 购物清单 | `shopping` |
| 随机点菜 | `random-pick`, `taxonomy` |
| 我的 / 管理页 | `session`, `taxonomy` |

## 14. 推荐 Mock 样例

### 14.1 会话

```ts
export const mockSession: SessionDTO = {
  user: {
    id: 'usr_001',
    nickname: '管理员',
    role: 'admin',
    householdId: 'house_001',
  },
}

export const mockWechatLogin: WechatLoginDTO = {
  accessToken: 'mock_access_token',
  refreshToken: 'mock_refresh_token',
  expiresIn: 7200,
  user: {
    id: 'usr_001',
    nickname: '管理员',
    role: 'admin',
    householdId: 'house_001',
  },
}
```

### 14.2 分类与标签

```ts
export const mockCategories: CategoryDTO[] = [
  { id: 'cat_001', name: '肉菜', sortOrder: 1, color: '#D97706' },
  { id: 'cat_002', name: '素菜', sortOrder: 2, color: '#596859' },
  { id: 'cat_003', name: '汤', sortOrder: 3, color: '#6e6353' },
]

export const mockTags: TagDTO[] = [
  { id: 'tag_001', name: '下饭', sortOrder: 1 },
  { id: 'tag_002', name: '快手', sortOrder: 2 },
  { id: 'tag_003', name: '孩子爱吃', sortOrder: 3 },
]
```

### 14.3 菜谱列表

```ts
export const mockRecipeList: PageResult<RecipeListItemDTO> = {
  items: [
    {
      id: 'recipe_001',
      name: '番茄炒蛋',
      coverImageUrl: 'https://cdn.example.com/recipe_001-cover.jpg',
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
  ],
  page: 1,
  pageSize: 20,
  total: 1,
  hasMore: false,
}
```

### 14.4 菜谱详情

```ts
export const mockRecipeDetail: RecipeDetailDTO = {
  id: 'recipe_001',
  name: '番茄炒蛋',
  coverImageUrl: 'https://cdn.example.com/recipe_001-cover.jpg',
  coverSource: 'moment_latest',
  versionCount: 3,
  momentCount: 5,
  latestMomentAt: '2026-03-24T10:00:00.000Z',
  currentVersion: {
    id: 'rv_003',
    versionNumber: 3,
    versionName: '少油版',
    category: { id: 'cat_002', name: '素菜' },
    tags: [{ id: 'tag_002', name: '快手' }],
    ingredientsText: '番茄 2 个，鸡蛋 3 个，盐，油',
    ingredients: [
      { rawText: '番茄 2 个', normalizedName: '番茄', amountText: '2', unit: '个', isSeasoning: false },
      { rawText: '鸡蛋 3 个', normalizedName: '鸡蛋', amountText: '3', unit: '个', isSeasoning: false },
      { rawText: '盐 少许', normalizedName: '盐', amountText: '少许', isSeasoning: true },
    ],
    steps: [
      { sortOrder: 1, content: '番茄切块' },
      { sortOrder: 2, content: '鸡蛋打散' },
      { sortOrder: 3, content: '热锅少油炒蛋' },
      { sortOrder: 4, content: '加入番茄翻炒' },
    ],
    tips: '出锅前少许糖提鲜。',
  },
}
```

### 14.5 时光记录

```ts
export const mockRecipeMoments: PageResult<MomentItemDTO> = {
  items: [
    {
      id: 'moment_001',
      occurredOn: '2026-03-24',
      content: '今天做得很成功，孩子特别爱吃。',
      participantsText: '全家',
      tasteRating: 5,
      difficultyRating: 2,
      images: [
        {
          id: 'asset_001',
          url: 'https://cdn.example.com/moment_001.jpg',
          width: 1080,
          height: 1440,
        },
      ],
      recipeVersion: {
        id: 'rv_003',
        versionNumber: 3,
        versionName: '少油版',
      },
    },
  ],
  page: 1,
  pageSize: 20,
  total: 1,
  hasMore: false,
}
```

### 14.6 周菜单

```ts
export const mockMealPlanWeek: MealPlanWeekDTO = {
  week: {
    id: 'week_001',
    weekStartDate: '2026-03-23',
    status: 'draft',
  },
  items: [
    {
      id: 'plan_001',
      recipeId: 'recipe_001',
      recipeVersionId: 'rv_003',
      plannedDate: '2026-03-24',
      mealSlot: 'dinner',
      sortOrder: 1,
      sourceType: 'manual',
      note: '周二晚饭',
      recipe: {
        id: 'recipe_001',
        name: '番茄炒蛋',
        coverImageUrl: 'https://cdn.example.com/recipe_001-cover.jpg',
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
  id: 'shop_001',
  weekStartDate: '2026-03-23',
  versionNo: 1,
  generatedAt: '2026-03-24T13:00:00.000Z',
  ingredientItems: [
    {
      id: 'item_001',
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
  seasoningItems: [
    {
      id: 'item_002',
      itemType: 'seasoning',
      displayName: '盐',
      normalizedName: '盐',
      quantityNote: '家里有就不买',
      sourceCount: 1,
      isChecked: true,
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
export const mockRandomSession: RandomPickSessionDetailDTO = {
  session: {
    id: 'session_001',
    mode: 'single',
    status: 'completed',
    filterSnapshot: {
      categoryIds: ['cat_002'],
      tagIds: ['tag_002'],
      maxDifficulty: 3,
      excludeRecentDays: 7,
      excludeCurrentWeekPlanned: true,
      preferredMemberTags: [],
    },
  },
  results: [
    {
      id: 'result_001',
      sequenceNo: 1,
      decision: 'pending',
      recipe: {
        id: 'recipe_001',
        name: '番茄炒蛋',
        coverImageUrl: 'https://cdn.example.com/recipe_001-cover.jpg',
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
- 无封面场景
- 无标签场景
- 新建分类/标签冲突场景
- 图片上传失败场景
- 随机点菜无结果场景
- 购物清单全部已购场景
- 会话失效场景

## 16. 联调前检查项

- 字段命名与后端 API 文档一致。
- 日期字段全部使用 `YYYY-MM-DD` 或 ISO 字符串，不混用本地格式。
- 分页列表接口是否统一返回 `PageResult<T>`。
- 购物清单是否分为 `ingredientItems` 和 `seasoningItems`。
- 版本列表、时光轴、周菜单三条链路的 ID 是否能串起来。
- Mock 数据是否覆盖空态、正常态和异常态。
- 小程序端 token 刷新与失效策略是否已冻结。
