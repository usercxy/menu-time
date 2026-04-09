# Recipes 与 Versions 真接口联调验收单

## 1. 适用范围

本文档用于当前阶段的小程序真接口联调，覆盖：

- `recipes`
- `recipe versions`

默认前提：

- `auth + taxonomy` 已按 [Auth与Taxonomy真接口联调验收单.md](/Users/xychen/Documents/MyCode/menu-time/docs/frontend/Auth与Taxonomy真接口联调验收单.md) 验收通过
- 小程序已启用局部 mock，仅保留未完工业务域
- 前端已完成 recipes 契约收口

## 2. 推荐联调配置

```bash
TARO_APP_API_BASE_URL=http://127.0.0.1:3000
TARO_APP_ENABLE_MOCK=true
TARO_APP_MOCK_SCOPES=meal-plan
```

含义：

- `recipes` 走真接口
- `meal-plan` 继续走 mock

## 3. 联调前检查

### 后端

- [ ] `recipes` 相关 seed 数据已写入
- [ ] Swagger 中能看到以下接口：
  - `GET /api/v1/recipes`
  - `POST /api/v1/recipes`
  - `GET /api/v1/recipes/:id`
  - `PATCH /api/v1/recipes/:id`
  - `GET /api/v1/recipes/:id/versions`
  - `POST /api/v1/recipes/:id/versions`
  - `GET /api/v1/recipes/:id/versions/:versionId`
  - `GET /api/v1/recipes/:id/compare`
  - `POST /api/v1/recipes/:id/versions/:versionId/set-current`

### 前端

- [ ] 设置页中 Mock 范围不包含 `recipes`
- [ ] `npm run typecheck` 通过
- [ ] `npm run lint` 通过

## 4. 菜谱库联调验收

### R1. 列表加载

入口页面：

- 菜谱库 [index.tsx](/Users/xychen/Documents/MyCode/menu-time/miniapp/src/pages/recipe-library/index.tsx)

依赖接口：

- `GET /api/v1/recipes`

检查项：

- [ ] 首次进入能拉到真实菜谱列表
- [ ] 卡片标题、分类、标签、版本号展示正常
- [ ] 分页信息显示正常
- [ ] 上一页 / 下一页可用

预期结果：

- 页面数据来自真实数据库，而不是 recipe mock

失败优先排查：

- `TARO_APP_MOCK_SCOPES` 是否还包含 `recipes`
- [recipe.ts](/Users/xychen/Documents/MyCode/menu-time/miniapp/src/services/modules/recipe.ts) 是否命中真实接口
- 后端分页响应是否为 `PageResult`

### R2. 搜索与筛选

依赖接口：

- `GET /api/v1/recipes`

检查项：

- [ ] 输入关键字后列表重新请求
- [ ] 切换分类后列表重新请求
- [ ] 切换标签后列表重新请求
- [ ] 清空筛选后恢复全量列表

预期结果：

- `keyword / categoryId / tagIds / page / pageSize` 都能被后端正确消费

失败优先排查：

- 当前前端标签筛选已改为 `tagIds`
- 后端 `tagIds` 以逗号分隔字符串接收

### R3. 空态与错误态

检查项：

- [ ] 无结果时显示空态
- [ ] 接口失败时显示错误态
- [ ] 点击重试后可重新发请求

## 5. 菜谱详情联调验收

### D1. 详情读取

入口页面：

- 菜谱详情 [index.tsx](/Users/xychen/Documents/MyCode/menu-time/miniapp/src/packages/recipe/detail/index.tsx)

依赖接口：

- `GET /api/v1/recipes/:id`

检查项：

- [ ] 从菜谱库点击进入详情页成功
- [ ] 头图、标题、当前版本、分类、标签正常显示
- [ ] 版本数、食光数、步骤数统计正常显示
- [ ] “做法” Tab 中食材、步骤、小贴士正常显示

预期结果：

- 详情页内容以 `currentVersion` 为准，不再依赖旧顶层字段

失败优先排查：

- [index.tsx](/Users/xychen/Documents/MyCode/menu-time/miniapp/src/packages/recipe/detail/index.tsx) 是否仍读取旧字段
- 后端详情响应是否包含 `currentVersion`

### D2. 版本 Tab 读取

依赖接口：

- `GET /api/v1/recipes/:id/versions`

检查项：

- [ ] 点击“版本” Tab 后才触发版本列表请求
- [ ] 版本列表按真实数据展示
- [ ] 当前版本正确标记
- [ ] 历史版本显示差异摘要或默认说明

预期结果：

- 前端能正确消费分页结构中的 `items`

## 6. 新建菜谱联调验收

### C1. 创建菜谱

入口页面：

- 新建菜谱 [index.tsx](/Users/xychen/Documents/MyCode/menu-time/miniapp/src/packages/recipe/edit/index.tsx)

依赖接口：

- `POST /api/v1/recipes`

检查项：

- [ ] 填写名称、分类、标签、版本名、主料、步骤、小贴士后可以提交
- [ ] 支持选择已有分类/标签
- [ ] 支持新建分类名 / 新建标签名
- [ ] 创建成功后 toast 显示
- [ ] 创建成功后自动跳到详情页

预期结果：

- 后端自动创建 `V1`
- 列表页和详情页缓存被刷新

失败优先排查：

- 表单字段是否与后端 schema 对齐
- `newCategoryName / newTagNames / tagIds` 是否传递正确

### C2. 创建后的详情一致性

检查项：

- [ ] 详情页能看到刚创建的菜谱
- [ ] 当前版本内容与创建时输入一致
- [ ] 返回菜谱库后能看到新菜谱

## 7. 编辑基础信息联调验收

### E1. 编辑菜谱

入口页面：

- 编辑菜谱 [index.tsx](/Users/xychen/Documents/MyCode/menu-time/miniapp/src/packages/recipe/edit/index.tsx)

依赖接口：

- `PATCH /api/v1/recipes/:id`

检查项：

- [ ] 从详情页进入编辑页成功
- [ ] 当前菜名和版本快照能正常展示
- [ ] 修改菜名后可成功保存
- [ ] 保存成功后自动回到详情页
- [ ] 详情页与菜谱库中的名称同步更新

预期结果：

- 编辑模式只改基础信息，不误改版本内容

## 8. 新建版本联调验收

### V1. 来源版本回填

入口页面：

- 新建版本 [index.tsx](/Users/xychen/Documents/MyCode/menu-time/miniapp/src/packages/recipe/version-create/index.tsx)

依赖接口：

- `GET /api/v1/recipes/:id`
- `GET /api/v1/recipes/:id/versions/:versionId`

检查项：

- [ ] 从详情页“写新版本”进入成功
- [ ] 表单能回填来源版本的分类、标签、食材、步骤、小贴士
- [ ] 来源版本标识显示正确

### V2. 发布新版本

依赖接口：

- `POST /api/v1/recipes/:id/versions`

检查项：

- [ ] 修改版本名称、分类、标签、食材、步骤、小贴士后可发布
- [ ] 发布成功后 toast 显示
- [ ] 发布成功后回到详情页版本 Tab
- [ ] 版本列表出现新版本

预期结果：

- `recipe-detail / recipe-versions / recipes` 缓存都被刷新

## 9. 版本对比联调验收

### VC1. 发起版本对比

入口页面：

- 版本对比 [index.tsx](/Users/xychen/Documents/MyCode/menu-time/miniapp/src/packages/recipe/version-compare/index.tsx)

依赖接口：

- `GET /api/v1/recipes/:id/compare`
- `GET /api/v1/recipes/:id/versions/:versionId`

检查项：

- [ ] 从详情页版本列表点击“对比”可进入对比页
- [ ] 参数使用版本号，不再使用版本 ID
- [ ] 差异摘要正确显示
- [ ] 基准版本与目标版本内容双栏显示正常

预期结果：

- compare 请求能稳定返回 200，不再因为 UUID / number 语义不一致而 400

失败优先排查：

- 前端传的是 `versionNumber`
- 后端 compare 接口接收的是 `base / target` 整数

### VC2. 设为当前版本

依赖接口：

- `POST /api/v1/recipes/:id/versions/:versionId/set-current`

检查项：

- [ ] 点击“设为当前版本”可成功提交
- [ ] 成功后 toast 显示
- [ ] 自动回到详情页版本 Tab
- [ ] 新目标版本被标记为当前版本
- [ ] 做法 Tab 内容同步变为新当前版本内容

## 10. 页面级回归检查

### 菜谱库

- [ ] 列表加载正常
- [ ] 搜索正常
- [ ] 分类筛选正常
- [ ] 标签筛选正常
- [ ] 分页正常

### 详情页

- [ ] 做法 Tab 正常
- [ ] 版本 Tab 正常
- [ ] 页面跳转参数正常

### 编辑页

- [ ] 新建菜谱正常
- [ ] 编辑基础信息正常

### 版本页

- [ ] 新建版本正常
- [ ] 对比正常
- [ ] 设为当前版本正常

## 11. 常见失败模式

### 情况 1：版本列表报错

优先检查：

- 前端是否仍把 `/versions` 返回值当数组
- 当前消费应为 `response.items`

### 情况 2：版本对比返回 400

优先检查：

- 前端是否仍在传版本 ID
- 当前应传版本号整数

### 情况 3：详情页内容为空

优先检查：

- 页面是否还在读旧的顶层 `ingredients / steps / tips`
- 当前应从 `currentVersion` 读取

### 情况 4：新建版本成功但详情页未刷新

优先检查：

- `recipe-detail`
- `recipe-versions`
- `recipes`

这三组 query key 是否都被失效

## 12. 验收结论模板

### Recipes

- 结果：
- 问题：
- 是否可关闭该域 mock：

### Versions

- 结果：
- 问题：
- 是否可进入下一阶段：

## 13. 2026-04-09 当前执行结果

### 已完成

- 后端 Swagger 已覆盖本单列出的 `recipes / versions` 接口
- 设置页联调配置已支持 `recipes` 走真接口、`meal-plan` 继续 mock
- `miniapp` 已通过 `npm run typecheck`
- `miniapp` 已通过 `npm run build:weapp`
- `GET /api/v1/recipes?page=1&pageSize=2` 已实测通过
- `GET /api/v1/recipes?page=1&pageSize=2&categoryId=...` 已实测通过
- `GET /api/v1/recipes?page=1&pageSize=2&tagIds=...` 已实测通过
- `POST /api/v1/recipes`、`GET /api/v1/recipes/:id`、`PATCH /api/v1/recipes/:id` 已实测通过
- `GET /api/v1/recipes/:id/versions`、`GET /api/v1/recipes/:id/versions/:versionId` 已实测通过
- `POST /api/v1/recipes/:id/versions` 已实测通过
- `GET /api/v1/recipes/:id/compare?base=1&target=2` 已实测通过
- `POST /api/v1/recipes/:id/versions/:versionId/set-current` 已实测通过
- 版本差异摘要漏报“食材 rawText / 步骤文案变化”的后端问题已修复并复测通过

### 当前仍需真机点按确认

- R1 菜谱库卡片展示、分页按钮与真实数据映射
- R2 搜索框输入、分类切换、标签切换、清空筛选的页面交互体验
- D1 详情页做法 Tab 的真实显示效果
- D2 详情页版本 Tab 的真实显示效果
- VC1 从版本列表点击“对比”进入页面后的双栏展示
- VC2 点击“设为当前版本”后的 toast、返回版本 Tab、做法 Tab 同步

### 真机执行建议

1. 先在设置页确认 `Mock 范围` 不包含 `recipes`
2. 进入菜谱库，依次验证：默认列表、分类筛选、标签筛选、清空筛选、分页
3. 打开任意有两个版本以上的菜谱，进入“版本” Tab，验证版本列表与差异摘要
4. 点击“对比”，确认摘要与双栏内容正常
5. 点击“设为当前版本”，回到详情页后切到“做法” Tab，确认内容已切换

参考记录：

- [两份联调验收单走查记录.md](/Users/xychen/Documents/MyCode/menu-time/docs/frontend/两份联调验收单走查记录.md)
