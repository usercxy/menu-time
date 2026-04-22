# 食光记前端开发 TODO（微信小程序 + Taro）

## Summary

这是一份面向前端开发的实施清单，基于以下文档整理：

- [前端技术方案](./前端技术方案.md)
- [页面路由与跳转图](./页面路由与跳转图.md)
- [接口类型定义与Mock数据清单](./接口类型定义与Mock数据清单.md)
- [需求文档v2](../需求文档v2.md)
- [后端开发TODO](../backend/后端开发TODO.md)
- [API 接口清单](../backend/API%20接口清单.md)

目标是把前端技术方案进一步拆成可执行、可验收、可联调的任务列表，并尽量和后端阶段保持一致，方便并行开发与阶段联调。

本文档遵循两个原则：

- 前端可以先基于 mock 和类型骨架推进页面与交互，不必完全阻塞在后端实现上。
- 真接口联调顺序以“后端阶段完成一个能力域，前端就立即接入并关闭 mock”为主，避免长期双轨。

## 当前进度快照（2026-04-22）

本次已按 `miniapp/` 现有代码重新盘点 TODO 勾选状态，结论基于源码、类型检查和构建结果，不含真机复测。

### 总体判断

- 粗略完成度约为 **84% ~ 88%**。
- **阶段 0** 基本完成：工程、路由、请求层、类型层、mock、Provider、基础组件已落地。
- **阶段 1** 已完成：登录初始化、session 管理、分类/标签字典、管理页和通用空/错/加载态组件都已落地。
- **阶段 2** 已完成：菜谱库分页/筛选/视图切换、菜谱创建、基础信息编辑、详情三段式 Tab、版本创建与对比主链路已跑通。
- **阶段 3** 已完成：已按后端接口清单接入时光记录 CRUD、文件两段式上传、详情时光轴分页和首页最新时光流。
- **阶段 4** 已完成：当前周/按周菜单、周切换、手动点菜、编辑、删除、轻量排序、首页摘要和菜谱详情入口已联调打通。
- **阶段 5 ~ 7** 仍以展示型壳页或入口预留为主，尚未进入完整业务交互阶段。

### 验证记录

- [x] `cd miniapp && npm run typecheck`
- [x] `cd miniapp && npm run build:weapp`
- [x] `cd miniapp && npm run lint`
- [x] `cd miniapp && npm run stylelint`

### 当前阶段结论

| 阶段 | 当前状态 | 说明 |
| --- | --- | --- |
| 阶段 0 | 已完成 | 工程骨架、分包、请求层、类型层、mock、基础组件都已存在 |
| 阶段 1 | 已完成 | 登录、session、分类/标签字典、管理页和通用状态组件已就绪 |
| 阶段 2 | 已完成 | 菜谱库分页/视图切换、创建/编辑、详情 Tab、版本链路和跳转失效策略已补齐 |
| 阶段 3 | 已完成 | 时光记录表单、图片上传、详情时光轴、首页动态和定位回跳已接上 |
| 阶段 4 | 已完成 | 周菜单视图、周切换、增删改排、首页摘要和菜谱详情入口已联调打通 |
| 阶段 5 | 未开始 | 仅有购物清单入口和占位页 |
| 阶段 6 | 未开始 | 仅有随机点菜入口和占位页 |
| 阶段 7 | 未开始 | 仅有 `EmptyState` / `ConfirmDialog` 等基础组件，未进入收尾阶段 |

## 默认约束

- [ ] 前端采用 `Taro + React + TypeScript`，目标端以微信小程序为主。
- [ ] 小程序主鉴权统一采用“`wx.login + code2Session + accessToken/refreshToken`”方案。
- [ ] 所有分页列表接口统一按 `PageResult<T>` 对接。
- [ ] 前端不自行生成版本号、差异摘要、购物清单聚合结果、随机点菜结果。
- [ ] 页面路由、分包、跳转关系以 `docs/frontend/页面路由与跳转图.md` 为准。
- [ ] DTO、VM、mock 数据结构以 `docs/frontend/接口类型定义与Mock数据清单.md` 为准。
- [x] MVP 先完成“菜谱 -> 版本 -> 时光记录 -> 点菜 -> 购物清单”中的前 3 段闭环，即“菜谱 -> 版本 -> 时光记录”。
- [ ] 家庭协作、全局时光轴、打印导出、复杂拖拽排序不作为首期阻塞项。

## 协同节奏

### 阶段对齐建议

| 前端阶段 | 核心目标 | 对应后端阶段 | 联调目标 |
| --- | --- | --- | --- |
| 阶段 0 | 工程骨架、路由、类型、mock、请求层 | 阶段 0 | 跑通基础工程，不联业务 |
| 阶段 1 | 鉴权、分类、标签、基础壳页 | 阶段 2 | 跑通登录与基础字典 |
| 阶段 2 | 菜谱库、菜谱创建、详情、版本 | 阶段 3 | 跑通菜谱与版本主链路 |
| 阶段 3 | 时光记录、图片上传、首页动态 | 阶段 4 | 跑通时光与媒体链路 |
| 阶段 4 | 点菜台、周菜单 | 阶段 5 | 跑通周菜单增删改查 |
| 阶段 5 | 购物清单 | 阶段 6 | 跑通清单生成、勾选、导出 |
| 阶段 6 | 随机点菜 | 阶段 7 | 跑通随机 session 流程 |
| 阶段 7 | 权限扩展与上线准备 | 阶段 8-9 | 跑通权限差异与上线检查 |

### 联调原则

- 一个业务域在 mock 下跑通后，尽快切真接口。
- 同一页面不要长期同时维护 mock 逻辑和真接口逻辑。
- 每阶段至少完成一次“页面走查 + 接口联调 + 真机验证”。

## Todo 清单

### 阶段 0：工程初始化与前端底座

**阶段目标**

搭好小程序前端工程骨架、分包结构、请求层、类型层与 mock 体系，让后续业务开发可以并行推进。

- [x] 初始化 Taro 工程，建立 `miniapp/` 目录骨架。
- [x] 配置 TypeScript、ESLint、Prettier、Stylelint、路径别名。
- [x] 建立 `app.config.ts`、主包和三个分包结构：`recipe / planner / profile`。
- [x] 建立全局样式入口：`tokens.scss`、`mixins.scss`、`reset.scss`。
- [x] 建立全局路由常量与统一跳转工具。
- [x] 建立请求层封装，支持统一 header、错误处理、`requestId` 透出。
- [x] 建立 token 存储、注入、刷新和登出清理的基础能力。
- [x] 建立 `services/types` 目录，落首批通用类型和 `PageResult<T>`。
- [x] 建立 `mocks/` 目录和 mock 切换机制。
- [x] 建立 Query Client、Zustand store 和基础 Provider。
- [x] 建立基础通用组件骨架：`PageContainer`、`TopNavBar`、`EmptyState`、`ConfirmDialog`。
- [x] 配置真机调试、环境变量和开发环境 API 地址。

**当前代码状态（2026-04-09）**

- `miniapp/src/app.config.ts`、`src/constants/routes.ts`、`src/utils/navigation.ts` 已完成主包/分包和统一跳转配置。
- `src/services/request/client.ts`、`src/services/types/`、`src/mocks/`、`src/providers/AppProviders.tsx`、`src/store/session.ts` 已构成阶段 0 底座。
- 代码层面已通过 `npm run typecheck` 与 `npm run build:weapp`；真机展示本次未复测，因此“完成标准”中的真机项仍视为待验证。

**与后端协同**

- 对应后端阶段 0。
- 这一阶段前端不依赖业务接口，但需要和后端确认：
  - 鉴权头格式
  - `PageResult<T>` 分页结构
  - 统一错误码

**完成标准**

- 项目可启动并正常分包编译。
- 页面可以跳转。
- 请求层、类型层、mock 机制可用。
- 真机上能看到至少 1 个 tab 页面和 1 个分包页面。

### 阶段 1：鉴权、分类、标签与页面壳层

**阶段目标**

完成登录态初始化、全局会话管理和基础字典能力，并搭出首页、菜谱库、点菜台、我的的页面壳层。

- [x] 接入 `wx.login`，完成前端登录初始化流程。
- [x] 对接 `POST /api/v1/auth/wechat-login`、`POST /api/v1/auth/refresh`、`GET /api/v1/auth/session`。
- [x] 实现登录态恢复、token 过期刷新和失败回退策略。
- [x] 建立全局 `session` store 与 `useSessionQuery`。
- [x] 对接分类列表接口。
- [x] 对接标签列表接口。
- [x] 完成首页、菜谱库、点菜台、我的四个 tab 页壳层。
- [x] 完成“我的”页到分类管理、标签管理、设置页的导航。
- [x] 实现分类管理页基础列表与表单弹层。
- [x] 实现标签管理页基础列表与表单弹层。
- [x] 实现通用空态、加载态、错误态组件。
- [x] 完成列表筛选区和搜索区基础交互框架。

**当前代码状态（2026-04-09）**

- `src/features/auth/bootstrap.tsx`、`src/features/auth/query.ts`、`src/store/session.ts`、`src/services/modules/auth.ts` 已形成启动登录、session 查询、token 恢复与 401 刷新重试基础链路。
- `AppProviders` 启动时会优先恢复本地 token；若无 token，则在微信环境自动触发 `wx.login -> wechat-login`。
- `src/components/base/EmptyState`、`src/components/base/LoadingState`、`src/components/base/ErrorState` 已补齐通用空/载入/错误态组件。
- `src/pages/recipe-library/index.tsx` 已接分类筛选、标签筛选、分页和视图切换，分类/标签字典都已消费到菜谱库 UI。
- `src/packages/profile/category-manage/index.tsx`、`src/packages/profile/tag-manage/index.tsx` 已补齐基础列表、新建/编辑弹层，并通过 mock 写接口打通保存后刷新。

**与后端协同**

- 对应后端阶段 2。
- 阻塞接口：
  - `POST /api/v1/auth/wechat-login`
  - `POST /api/v1/auth/refresh`
  - `GET /api/v1/auth/session`
  - `GET /api/v1/categories`
  - `GET /api/v1/tags`

**联调完成标准**

- 真机首次进入可拿到会话。
- 分类、标签接口返回后能驱动筛选组件。
- 会话失效时可自动刷新或清理状态。

### 阶段 2：菜谱与版本主链路

**阶段目标**

打通菜谱库、菜谱创建、菜谱详情、新建版本、版本对比的前端主链路。

- [x] 实现菜谱库列表页。
- [x] 支持菜名搜索、分类筛选、标签筛选。
- [x] 对接菜谱列表分页。
- [x] 实现菜谱卡片组件与网格/列表展示切换。
- [x] 实现新建菜谱页。
- [x] 完成菜谱创建表单：名称、分类、标签、版本名、主料、步骤、小贴士。
- [x] 支持“选择现有分类/标签 + 临时新建”交互。
- [x] 实现编辑菜谱基础信息页。
- [x] 实现菜谱详情页顶部信息区与三 Tab 骨架。
- [x] 对接菜谱详情接口。
- [x] 对接版本列表接口。
- [x] 实现新建版本页，并默认回填源版本内容。
- [x] 对接版本详情接口。
- [x] 实现版本对比页，并展示差异摘要。
- [x] 对接“设为当前版本”操作。
- [x] 完成创建、更新、切换版本后的缓存失效和返回跳转。

**当前代码状态（2026-04-09）**

- `src/pages/recipe-library/index.tsx` 已实现列表查询、搜索框、分类筛选、标签筛选、分页和本地视图切换；`src/components/recipe/RecipeCard` 已作为菜谱卡片展示组件落地。
- `src/packages/recipe/edit/index.tsx` 已实现 mock 可用的新建菜谱表单，支持名称、分类、标签、版本名、主料、步骤、小贴士输入，并在保存后跳转详情页。
- `src/packages/recipe/edit/index.tsx` 现已支持编辑模式，能够读取现有菜谱并通过 `PATCH /api/v1/recipes/:id` 更新基础信息。
- `src/packages/recipe/version-create/index.tsx` 已实现基于来源版本回填的 mock 新建版本页，支持修改版本名、分类、标签、主料、步骤、小贴士并发布后回跳详情页。
- `src/packages/recipe/detail/index.tsx` 已补齐顶部信息区、操作区和“做法 / 版本 / 时光轴”三 Tab 骨架，并在版本页中发起对比。
- `src/packages/recipe/version-compare/index.tsx` 已实现差异摘要、双栏版本内容展示，并接上“设为当前版本”的 mock 操作。

**与后端协同**

- 对应后端阶段 3。
- 阻塞接口：
  - `GET /api/v1/recipes`
  - `POST /api/v1/recipes`
  - `GET /api/v1/recipes/:id`
  - `PATCH /api/v1/recipes/:id`
  - `GET /api/v1/recipes/:id/versions`
  - `POST /api/v1/recipes/:id/versions`
  - `GET /api/v1/recipes/:id/versions/:versionId`
  - `GET /api/v1/recipes/:id/compare`
  - `POST /api/v1/recipes/:id/versions/:versionId/set-current`

**联调完成标准**

- 用户可从菜谱库创建一条菜谱并进入详情。
- 新建版本后版本列表刷新，差异摘要正确展示。
- 历史版本切换为当前版本后，详情页刷新正确。

### 阶段 3：时光记录、图片上传与首页动态

**阶段目标**

完成时光记录表单、图片上传链路、详情页时光轴和首页动态流。

- [x] 实现图片选择、预览、删除和上传队列。
- [x] 对接 `upload-token -> uploadFile -> files/assets` 两段式上传。
- [x] 实现记一笔页面的新建模式。
- [x] 实现记一笔页面的编辑模式。
- [x] 实现评分组件、参与人输入、日期选择。
- [x] 对接菜谱时光轴接口。
- [x] 实现时光轴卡片和分页加载。
- [x] 实现首页最新时光流。
- [x] 支持从首页时光流跳到菜谱详情并定位时光记录。
- [x] 完成上传失败、超张数、表单校验、保存成功回跳处理。
- [x] 新增时光记录后刷新首页和菜谱详情缓存。

**当前代码状态（2026-04-22）**

- `src/packages/recipe/moment-edit/index.tsx` 已落地新建 / 编辑双模式表单，支持版本选择、日期选择、参与人、风味评分、难度评分、封面候选开关、图片队列选择与预览。
- `src/services/modules/moment.ts`、`src/services/types/moment.ts`、`src/mocks/moment.mock.ts` 已补齐时光记录、首页动态和文件上传联调所需 service / DTO / mock。
- `src/packages/recipe/detail/index.tsx` 已接 `GET /api/v1/recipes/:id/moments`、`PATCH /api/v1/moments/:id`、`DELETE /api/v1/moments/:id`，支持分页、编辑、删除与 `momentId` 高亮定位。
- `src/pages/home/index.tsx` 已切到 `GET /api/v1/moments/latest` 驱动首页“时光锦囊”，并支持跳转菜谱详情 `tab=moments&momentId=...`。
- 图片上传链路已按后端接口清单改为 `POST /api/v1/files/upload-token -> 上传文件 -> POST /api/v1/files/assets`。

**与后端协同**

- 对应后端阶段 4。
- 已完成联调接口：
  - `POST /api/v1/files/upload-token`
  - `POST /api/v1/files/assets`
  - `GET /api/v1/recipes/:id/moments`
  - `POST /api/v1/recipes/:id/moments`
  - `PATCH /api/v1/moments/:id`
  - `DELETE /api/v1/moments/:id`
  - `GET /api/v1/moments/latest`

**联调完成标准**

- 真机上可以选择图片并成功提交时光记录。
- 首页最新时光流能展示新记录。
- 菜谱详情时光轴排序正确，分页正常。

### 阶段 4：周菜单与点菜台

**阶段目标**

完成周菜单视图、菜单项新增/更新/删除/重排，以及首页本周摘要联动。

- [x] 实现点菜台周视图。
- [x] 支持切换当前周、上一周、下一周。
- [x] 对接当前周菜单接口和按周菜单接口。
- [x] 实现点菜入口和选择菜谱/版本交互。
- [x] 对接新增菜单项接口。
- [x] 对接更新菜单项接口。
- [x] 对接删除菜单项接口。
- [x] 实现同日同餐次的轻量排序交互。
- [x] 对接重排接口。
- [x] 首页展示“本周已规划 X 道菜”摘要并跳转点菜台。
- [x] 处理空周菜单、空餐次、周切换中的加载态和错误态。

**当前代码状态（2026-04-22）**

- `src/services/modules/meal-plan.ts` 已接入 `GET /api/v1/menu-plans/current-week`、`GET /api/v1/menu-plans/weeks/:weekStartDate`、`POST /api/v1/menu-plans/weeks/:weekStartDate/items`、`PATCH /api/v1/menu-plans/items/:id`、`DELETE /api/v1/menu-plans/items/:id`、`POST /api/v1/menu-plans/weeks/:weekStartDate/reorder`，并统一映射成点菜台页面所需 VM。
- `src/pages/meal-planner/index.tsx` 已支持周切换、按天查看、手动点菜、版本选择、编辑、删除、同餐次内上移/下移排序和空态/错误态处理。
- `src/packages/recipe/detail/index.tsx` 已新增“加入点菜台”入口，并通过本地草稿把当前菜谱/版本带到点菜台编辑器。
- `src/pages/home/index.tsx` 的首页摘要已消费真实周菜单统计，不再依赖阶段 1 的展示型假数据。
- `miniapp/config/dev.ts` 已切到 `TARO_APP_MOCK_SCOPES=\"none\"`，开发环境默认走真实后端联调。

**与后端协同**

- 对应后端阶段 5。
- 已完成联调接口：
  - `GET /api/v1/menu-plans/current-week`
  - `GET /api/v1/menu-plans/weeks/:weekStartDate`
  - `POST /api/v1/menu-plans/weeks/:weekStartDate/items`
  - `PATCH /api/v1/menu-plans/items/:id`
  - `DELETE /api/v1/menu-plans/items/:id`
  - `POST /api/v1/menu-plans/weeks/:weekStartDate/reorder`

**验证记录（2026-04-22）**

- [x] 使用开发态 `mock:` 微信 code 走真实后端登录，获取 access token。
- [x] 通过真实 HTTP 请求验证 `current-week / week / create / update / reorder / delete` 全链路。
- [x] 创建、更新、重排、删除后再次查询周菜单，结果与预期一致。

**联调完成标准**

- 从菜谱详情加入点菜台后，周菜单可见。
- 修改、删除、排序后页面状态与刷新后结果一致。
- 首页本周摘要与点菜台数据一致。

### 阶段 5：购物清单

**阶段目标**

完成购物清单生成、详情、勾选、备注、复制文本和分享图占位流程。

- [ ] 从点菜台接入“生成购物清单”入口。
- [ ] 对接购物清单生成接口。
- [ ] 实现购物清单详情页。
- [ ] 按 `ingredientItems / seasoningItems` 展示分组。
- [ ] 对接清单项勾选和备注更新接口。
- [ ] 实现勾选的乐观更新与失败回滚。
- [ ] 对接复制文本接口并接入剪贴板。
- [ ] 对接分享图接口并实现处理中状态。
- [ ] 处理“无菜单不可生成清单”“已有清单版本更新”等提示。

**当前代码状态（2026-04-09）**

- `src/packages/planner/shopping-list/index.tsx` 仍是占位页。
- 点菜台页面已有购物清单入口，但还没有“生成清单”的业务动作和接口接入。

**与后端协同**

- 对应后端阶段 6。
- 阻塞接口：
  - `POST /api/v1/shopping-lists/generate`
  - `GET /api/v1/shopping-lists/:id`
  - `PATCH /api/v1/shopping-lists/items/:id`
  - `POST /api/v1/shopping-lists/:id/copy-text`
  - `POST /api/v1/shopping-lists/:id/share-image`

**联调完成标准**

- 当前周菜单可生成购物清单。
- 勾选和备注刷新后仍保留。
- 复制文本内容和页面展示一致。

### 阶段 6：随机点菜

**阶段目标**

完成随机点菜筛选、结果展示、接受、跳过、再抽一次与接入点菜台。

- [ ] 实现随机点菜页筛选表单。
- [ ] 支持分类、标签、难度、排除最近 N 天等条件输入。
- [ ] 对接创建 session 接口。
- [ ] 实现结果展示卡片与基础动画容器。
- [ ] 对接再抽一次接口。
- [ ] 对接跳过接口。
- [ ] 对接受结果并加入点菜台的接口。
- [ ] 展示本次 session 历史结果。
- [ ] 对空候选场景展示“放宽条件”提示。
- [ ] 接入震动反馈和结果过渡动画。

**当前代码状态（2026-04-09）**

- `src/packages/planner/random-pick/index.tsx` 仍是占位页。
- 点菜台页面已提供随机点菜入口，但随机 session、结果卡片、接受/跳过流程尚未开始实现。

**与后端协同**

- 对应后端阶段 7。
- 阻塞接口：
  - `POST /api/v1/random-picks/sessions`
  - `POST /api/v1/random-picks/sessions/:id/redraw`
  - `POST /api/v1/random-picks/sessions/:id/results/:resultId/accept`
  - `POST /api/v1/random-picks/sessions/:id/results/:resultId/skip`
  - `GET /api/v1/random-picks/sessions/:id`

**联调完成标准**

- 结果可接受、可跳过、可重抽。
- 接受后可直接写入点菜台。
- session 历史和页面展示一致。

### 阶段 7：体验收尾、权限差异与上线准备

**阶段目标**

补齐容错、权限差异、性能优化和上线前检查项。

- [ ] 补齐所有页面的空状态、错误态、骨架屏或加载态。
- [ ] 为删除、切换版本、清空已购等高风险操作增加二次确认。
- [ ] 补齐表单校验和 toast 文案。
- [ ] 优化长列表滚动和分页加载体验。
- [ ] 检查分包体积和主包首屏性能。
- [ ] 完善 token 过期、刷新失败、网络失败等异常链路。
- [ ] 对接 `member/admin` 权限差异后的页面禁用和兜底提示。
- [ ] 真机验证安全区、导航栏、图片上传、剪贴板、震动反馈。
- [ ] 准备演示数据和上线前走查清单。

**当前代码状态（2026-04-08）**

- 已有 `EmptyState`、`ConfirmDialog` 和基础页面容器，但还没有系统性覆盖到所有页面的空态、错误态和加载态。
- token 401 刷新重试已在请求层实现，但权限差异、网络失败兜底、真机专项验证仍未开始。

**与后端协同**

- 对应后端阶段 8-9。
- 重点配合：
  - 权限差异接口行为
  - 异步任务状态表现
  - 统一错误码和失败场景

**联调完成标准**

- 核心页面在异常场景下可恢复。
- 管理员和成员权限表现一致且可解释。
- 能完成一次完整真机业务闭环演示。

## Test Plan

### 当前构建与规范校验

- [x] `cd miniapp && npm run typecheck`
- [x] `cd miniapp && npm run build:weapp`
- [x] `cd miniapp && npm run lint`
- [x] `cd miniapp && npm run stylelint`

### 核心链路测试

- [ ] 登录后能稳定恢复会话，刷新 token 后业务不中断。
- [ ] 创建第一道菜谱后，列表和详情都能看到 V1。
- [ ] 新建版本后，版本列表、详情、对比页数据一致。
- [ ] 新增时光记录后，详情时光轴和首页最新动态都能看到。
- [ ] 从菜谱详情加入点菜台后，首页本周摘要同步更新。
- [ ] 根据周菜单生成购物清单后，勾选和备注可稳定保存。
- [ ] 随机点菜接受结果后能写入点菜台。

### 边界场景测试

- [ ] 无分类、无标签时也能创建菜谱。
- [ ] 主料为空、步骤为空时仍可保存。
- [ ] 图片上传失败后页面可恢复重试。
- [ ] 周菜单为空时生成购物清单给出明确提示。
- [ ] 随机点菜无结果时给出明确提示。
- [ ] token 刷新失败时，前端能正确清理登录态。

### 真机测试

- [ ] `wx.login`、token 刷新、会话恢复。
- [ ] 图片选择、上传、预览。
- [ ] 剪贴板复制。
- [ ] 不同机型顶部安全区和底部 tabBar 展示。
- [ ] 网络较慢情况下的页面反馈。

## Assumptions

- 本文档作为 `docs/frontend/` 目录下的前端文档维护。
- 当前以单管理员 MVP 为主，不要求一次性做完成员协作。
- 随机点菜可在主闭环稳定后接入，不阻塞菜谱、时光、点菜、购物清单主线。
- 如果某个交互动效实现成本过高，优先保证业务能力和联调稳定性。
