# 食光记组件清单与设计 Token 表

## 1. 文档说明

本文档用于明确前端组件分层、组件库归属、组件命名、复用边界，以及视觉系统中的设计 token，作为页面开发、样式实现和设计还原的统一依据。

输入依据：

- [前端技术方案.md](D:/AI/Menu Time/前端技术方案.md)
- [页面路由与跳转图.md](D:/AI/Menu Time/页面路由与跳转图.md)
- `stitch_prd/heritage_hearth/DESIGN.md`

## 2. 组件设计原则

### 2.1 组件分层

- 基础组件
  - 只处理视觉壳与基础交互
  - 不直接请求接口
- 领域组件
  - 组合多个基础组件
  - 面向菜谱、时光、点菜、购物清单等业务域
- 页面组件
  - 只在页面内使用
  - 负责组织布局和局部状态

### 2.2 组件来源策略

| 组件来源 | 适用范围 | 原则 |
| --- | --- | --- |
| `Taroify` | 通用结构和交互 | 能用则用，减少重复造轮子 |
| 小程序原生组件 | 输入、图片、滚动容器、表单原语 | 优先保证稳定与性能 |
| 自定义业务组件 | 手账风格卡片、版本差异块、时光卡片、购物项 | 保持项目辨识度 |

### 2.3 组件命名建议

- 基础组件：`BaseXxx` 或 `AppXxx`
- 领域组件：`RecipeXxx`、`MomentXxx`、`PlannerXxx`、`ShoppingXxx`
- 弹层组件：`XxxSheet`、`XxxDialog`
- 页面片段：`XxxSection`

## 3. 基础组件清单

| 组件名 | 归属 | 实现来源 | 主要职责 | 主要页面 |
| --- | --- | --- | --- | --- |
| `AppPage` | 基础 | 自定义 | 统一页面安全区、背景和滚动区 | 全部 |
| `GlassHeader` | 基础 | 自定义 | 半透明顶栏、返回、标题、右侧操作 | 详情、编辑、管理 |
| `TabBarShell` | 基础 | 小程序配置 + 自定义 icon | 自定义 tab 风格资源映射 | tab 页 |
| `PrimaryButton` | 基础 | 自定义 | 主按钮样式 | 全部 |
| `SecondaryButton` | 基础 | 自定义 | 次按钮样式 | 全部 |
| `TextButton` | 基础 | 自定义 | 文本按钮样式 | 全部 |
| `TagChip` | 基础 | `Taroify Tag` 二次封装 | 标签、筛选项、角标 | 菜谱库、详情、随机页 |
| `BadgePill` | 基础 | `Taroify Badge` 二次封装 | 数量、状态、版本角标 | 列表、详情 |
| `SectionTitle` | 基础 | 自定义 | 模块标题和左侧装饰条 | 详情、购物清单 |
| `SkeletonBlock` | 基础 | `Taroify Skeleton` | 骨架屏 | 列表、详情 |
| `EmptyState` | 基础 | `Taroify Empty` + 自定义 | 空状态 | 全部 |
| `ConfirmDialog` | 基础 | `Taroify Dialog` 二次封装 | 删除、切换确认 | 管理页、详情页 |
| `BottomSheet` | 基础 | `Taroify Popup` | 底部弹层容器 | 点菜、筛选、版本选择 |
| `ActionMenu` | 基础 | `Taroify ActionSheet` | 快捷操作菜单 | 卡片操作 |
| `NoticeToast` | 基础 | Taro API 二次封装 | 提示反馈 | 全部 |

## 4. 表单与输入组件

| 组件名 | 实现来源 | 说明 |
| --- | --- | --- |
| `FormField` | 自定义 | 统一 label、错误提示、帮助文案 |
| `TextInput` | 小程序原生 `Input` | 单行输入 |
| `TextAreaField` | 小程序原生 `Textarea` | 大段描述 |
| `PickerField` | `Taroify Picker` | 分类、版本、日期等选择 |
| `TagSelector` | 自定义 + `TagChip` | 标签多选 |
| `IngredientEditor` | 自定义 | 配料列表增删改 |
| `StepEditor` | 自定义 | 步骤列表排序与增删改 |
| `ImageUploader` | 自定义 + `Taro.chooseImage` | 最多 9 张图 |
| `ScoreStars` | 自定义 | 好吃程度评分 |
| `DifficultySelector` | 自定义 | 难度分档选择 |

## 5. 领域组件清单

### 5.1 菜谱域

| 组件名 | 说明 | 主要页面 |
| --- | --- | --- |
| `RecipeCard` | 菜谱库卡片，展示封面、版本、最近记录、计数 | 菜谱库 |
| `RecipeFilterBar` | 搜索、分类 Tab、标签筛选 | 菜谱库 |
| `RecipeHero` | 详情封面和标题区域 | 菜谱详情 |
| `RecipeStatsRow` | 准备时间、烹饪时间、难度等摘要 | 菜谱详情 |
| `RecipeVersionCard` | 版本列表项 | 菜谱详情 |
| `VersionDiffSummaryCard` | 版本差异摘要 | 版本对比 |
| `IngredientListCard` | 配料列表 | 详情、版本页 |
| `StepListCard` | 步骤列表 | 详情、版本页 |

### 5.2 时光域

| 组件名 | 说明 | 主要页面 |
| --- | --- | --- |
| `MomentFeedCard` | 首页手账式卡片 | 首页 |
| `MomentTimelineItem` | 菜谱详情时间轴项 | 菜谱详情 |
| `MomentImageGrid` | 时光照片网格 | 详情、记一笔 |
| `MomentMetaRow` | 日期、参与人、评分信息 | 详情、记一笔 |

### 5.3 点菜域

| 组件名 | 说明 | 主要页面 |
| --- | --- | --- |
| `WeeklyCalendarStrip` | 一周日期条 | 点菜台 |
| `MealSlotCard` | 单个餐次卡片 | 点菜台 |
| `RecipePickerSheet` | 从菜谱库选择菜 | 点菜台 |
| `VersionPickerSheet` | 选择加入菜单的版本 | 点菜台 |
| `PlannerSummaryCard` | 本周完成度摘要 | 首页、点菜台 |

### 5.4 购物清单域

| 组件名 | 说明 | 主要页面 |
| --- | --- | --- |
| `ShoppingTabSwitch` | 食材 / 调料切换 | 购物清单 |
| `ShoppingItemCard` | 单项清单卡片 | 购物清单 |
| `ShoppingGroupCard` | 按菜谱或类型聚合的区块 | 购物清单 |
| `ShoppingActionBar` | 清除已购、复制、分享 | 购物清单 |

### 5.5 随机点菜域

| 组件名 | 说明 | 主要页面 |
| --- | --- | --- |
| `RandomFilterPanel` | 筛选条件面板 | 随机点菜 |
| `RandomRoller` | 抽取动画容器 | 随机点菜 |
| `RandomResultCard` | 结果展示卡 | 随机点菜 |
| `RandomHistoryGrid` | 当前 session 历史 | 随机点菜 |

## 6. 设计 Token 结构

建议同时维护：

- `src/styles/tokens.scss`
- `src/styles/theme.ts`

其中：

- `scss` 用于样式层
- `theme.ts` 用于运行时组件映射、图表或脚本逻辑

## 7. 颜色 Token 表

### 7.1 品牌与表面色

| Token | 值 | 用途 |
| --- | --- | --- |
| `$color-brand-primary` | `#A84533` | 主按钮、主标题、关键高亮 |
| `$color-brand-primary-dim` | `#983A28` | 按压、hover、深色强调 |
| `$color-brand-secondary` | `#596859` | 标签、辅助强调、自然系信息 |
| `$color-brand-tertiary` | `#6E6353` | 中性强调、说明文字 |
| `$color-surface-page` | `#FFFCF7` | 页面背景 |
| `$color-surface-section` | `#FCF9F3` | 区块背景 |
| `$color-surface-card` | `#FFFFFF` | 卡片背景 |
| `$color-surface-high` | `#F0EEE4` | 次级容器 |
| `$color-surface-highest` | `#EAE9DD` | 吸顶、弱分隔、容器嵌套 |

### 7.2 文本色

| Token | 值 | 用途 |
| --- | --- | --- |
| `$color-text-primary` | `#373831` | 主文本 |
| `$color-text-secondary` | `#64655C` | 次文本 |
| `$color-text-tertiary` | `#818178` | 占位、说明、禁用弱态 |
| `$color-text-on-primary` | `#FFFFFF` | 主色背景上的文字 |

### 7.3 业务状态色

| Token | 值 | 用途 |
| --- | --- | --- |
| `$color-success-soft` | `#E8F2E9` | 版本新增、成功状态背景 |
| `$color-success-text` | `#4F5E4F` | 成功状态文字 |
| `$color-warning-soft` | `#FEEFDA` | 提示、贴士、待确认 |
| `$color-warning-text` | `#635949` | 提示文字 |
| `$color-danger-soft` | `#F5E6E1` | 版本移除、危险提示背景 |
| `$color-danger-text` | `#721E10` | 危险提示文字 |
| `$color-error` | `#B3374E` | 错误状态 |

### 7.4 边框与阴影

| Token | 值 | 用途 |
| --- | --- | --- |
| `$color-outline-weak` | `rgba(186, 186, 175, 0.3)` | 弱边框 |
| `$color-outline-medium` | `#BABAaf` | 中边框 |
| `$shadow-card` | `0 12px 32px rgba(55, 56, 49, 0.06)` | 卡片阴影 |
| `$shadow-fab` | `0 12px 32px rgba(168, 69, 51, 0.25)` | 浮动按钮 |
| `$shadow-topbar` | `0 4px 16px rgba(55, 56, 49, 0.04)` | 顶底栏 |

## 8. 字体与排版 Token

| Token | 建议值 | 用途 |
| --- | --- | --- |
| `$font-family-title` | `serif` 降级链 | 标题、菜名、版本名 |
| `$font-family-body` | `sans-serif` 降级链 | 正文 |
| `$font-size-xs` | `20rpx` | 辅助标签 |
| `$font-size-sm` | `24rpx` | 说明文案 |
| `$font-size-md` | `28rpx` | 正文 |
| `$font-size-lg` | `32rpx` | 小标题 |
| `$font-size-xl` | `40rpx` | 一级模块标题 |
| `$font-size-display` | `52rpx` | 首页主标题、核心视觉标题 |
| `$font-weight-medium` | `500` | 标签、按钮 |
| `$font-weight-semibold` | `600` | 小标题 |
| `$font-weight-bold` | `700` | 重点标题 |

## 9. 间距与圆角 Token

| Token | 值 | 用途 |
| --- | --- | --- |
| `$space-1` | `8rpx` | 极小间距 |
| `$space-2` | `12rpx` | 紧凑元素间距 |
| `$space-3` | `16rpx` | 常规内边距 |
| `$space-4` | `24rpx` | 模块内间距 |
| `$space-5` | `32rpx` | 卡片内边距 |
| `$space-6` | `40rpx` | 模块间距 |
| `$space-8` | `56rpx` | 大区块间距 |
| `$radius-sm` | `12rpx` | 标签、输入框 |
| `$radius-md` | `16rpx` | 常规卡片 |
| `$radius-lg` | `24rpx` | 主卡片 |
| `$radius-xl` | `32rpx` | 弹层、特色卡片 |
| `$radius-full` | `9999rpx` | 胶囊、FAB |

## 10. 层级与动效 Token

### 10.1 层级

| Token | 值 | 用途 |
| --- | --- | --- |
| `$z-page` | `1` | 页面内容 |
| `$z-header` | `10` | 吸顶栏 |
| `$z-tabbar` | `20` | 底部导航 |
| `$z-fab` | `30` | 浮动按钮 |
| `$z-sheet` | `40` | BottomSheet |
| `$z-dialog` | `50` | 对话框 |
| `$z-toast` | `60` | 提示 |

### 10.2 动效

| Token | 值 | 用途 |
| --- | --- | --- |
| `$duration-fast` | `160ms` | 点击反馈 |
| `$duration-normal` | `240ms` | 卡片、标签切换 |
| `$duration-slow` | `360ms` | 页面过渡、弹层 |
| `$ease-standard` | `ease` | 常规过渡 |
| `$scale-press` | `0.98` | 按压态 |

## 11. 业务 Token

### 11.1 版本差异

| Token | 值 | 说明 |
| --- | --- | --- |
| `$diff-added-bg` | `#E8F2E9` | 新增项背景 |
| `$diff-added-text` | `#4F5E4F` | 新增项文本 |
| `$diff-removed-bg` | `#F5E6E1` | 移除项背景 |
| `$diff-removed-text` | `#721E10` | 移除项文本 |
| `$diff-neutral-bg` | `#F6F4EC` | 未变化项背景 |

### 11.2 评分

| Token | 值 | 说明 |
| --- | --- | --- |
| `$rating-taste-active` | `#A84533` | 好吃星级 |
| `$rating-difficulty-active` | `#596859` | 难度高亮 |
| `$rating-inactive` | `#BABAaf` | 未选中状态 |

### 11.3 餐次

| Token | 值 | 说明 |
| --- | --- | --- |
| `$meal-breakfast` | `#A84533` | 早餐角标 |
| `$meal-lunch` | `#596859` | 午餐角标 |
| `$meal-dinner` | `#6E6353` | 晚餐角标 |
| `$meal-snack` | `#D97706` | 加餐角标 |

## 12. Token 落地示例

```scss
// src/styles/tokens.scss
$color-brand-primary: #A84533;
$color-surface-page: #FFFCF7;
$color-text-primary: #373831;
$radius-lg: 24rpx;
$shadow-card: 0 12px 32px rgba(55, 56, 49, 0.06);
```

```ts
// src/styles/theme.ts
export const theme = {
  colors: {
    primary: '#A84533',
    secondary: '#596859',
    surface: '#FFFCF7',
    textPrimary: '#373831',
  },
  radius: {
    lg: '24rpx',
    xl: '32rpx',
  },
} as const
```

## 13. 组件与页面映射表

| 页面 | 必需组件 |
| --- | --- |
| 首页 | `AppPage`、`GlassHeader`、`PlannerSummaryCard`、`MomentFeedCard`、`PrimaryButton` |
| 菜谱库 | `RecipeFilterBar`、`RecipeCard`、`TagChip`、`SkeletonBlock`、`EmptyState` |
| 菜谱详情 | `RecipeHero`、`RecipeStatsRow`、`IngredientListCard`、`StepListCard`、`RecipeVersionCard`、`MomentTimelineItem` |
| 菜谱新建 | `FormField`、`IngredientEditor`、`StepEditor`、`TagSelector`、`PrimaryButton` |
| 新建版本 | `IngredientEditor`、`StepEditor`、`VersionDiffSummaryCard` |
| 记一笔 | `TextAreaField`、`ImageUploader`、`ScoreStars`、`DifficultySelector` |
| 点菜台 | `WeeklyCalendarStrip`、`MealSlotCard`、`RecipePickerSheet`、`VersionPickerSheet` |
| 购物清单 | `ShoppingTabSwitch`、`ShoppingGroupCard`、`ShoppingItemCard`、`ShoppingActionBar` |
| 分类管理 | `ConfirmDialog`、`PrimaryButton`、`TextInput` |
| 标签管理 | `TagChip`、`ActionMenu`、`TextInput` |

## 14. 不建议事项

- 不建议把业务卡片直接写死在页面内
- 不建议所有页面都直接覆写 `Taroify` 默认样式
- 不建议既用一套 token 又在页面里继续写大量 magic number
- 不建议同一个语义色在不同页面里反复改值

## 15. 后续落地顺序

1. 先实现 token 文件
2. 再实现基础组件
3. 再实现领域组件
4. 最后批量拼装页面
