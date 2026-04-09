# Auth 与 Taxonomy 真接口联调验收单

## 1. 适用范围

本文档用于当前阶段的小程序真接口联调，覆盖：

- `auth`
- `taxonomy`

默认前提：

- 前端已按真实契约完成类型收口
- 后端已完成阶段 2 对应能力
- 小程序已启用“局部 mock”模式

推荐环境配置见 [局部Mock联调说明.md](/Users/xychen/Documents/MyCode/menu-time/docs/frontend/局部Mock联调说明.md)。

## 2. 推荐联调配置

```bash
TARO_APP_API_BASE_URL=http://127.0.0.1:3000
TARO_APP_ENABLE_MOCK=true
TARO_APP_MOCK_SCOPES=meal-plan
```

含义：

- `auth / taxonomy / recipes` 走真接口
- `meal-plan` 继续走 mock

## 3. 联调前检查

### 后端

- [ ] `backend/.env` 或 `backend/.env.local` 已配置数据库连接
- [ ] 已成功执行 migration
- [ ] 已成功执行 seed
- [ ] 后端服务可访问
- [ ] Swagger 可打开：
  - `/docs`
  - `/api/openapi`

### 前端

- [ ] 设置页中“API 地址”显示为真实后端地址
- [ ] 设置页中“Mock 范围”显示为 `meal-plan`
- [ ] `npm run typecheck` 通过
- [ ] `npm run lint` 通过

## 4. Auth 联调验收

### A1. 首次进入自动登录

入口页面：

- 首页 [index.tsx](/Users/xychen/Documents/MyCode/menu-time/miniapp/src/pages/home/index.tsx)
- 我的页 [index.tsx](/Users/xychen/Documents/MyCode/menu-time/miniapp/src/pages/my/index.tsx)

依赖接口：

- `POST /api/v1/auth/wechat-login`

检查项：

- [ ] 小程序首次启动时能触发登录初始化
- [ ] 登录成功后本地已写入 token bundle
- [ ] 首页欢迎语显示真实昵称
- [ ] 我的页昵称显示真实昵称

预期结果：

- 不需要手动刷新页面
- 登录成功后 UI 自动进入已登录状态

失败优先排查：

- `TARO_APP_API_BASE_URL` 是否配置正确
- `TARO_APP_MOCK_SCOPES` 是否还包含 `auth`
- 后端 `wechat-login` 是否可用
- 前端 [bootstrap.tsx](/Users/xychen/Documents/MyCode/menu-time/miniapp/src/features/auth/bootstrap.tsx) 是否进入真实分支

### A2. 会话恢复

依赖接口：

- `GET /api/v1/auth/session`

检查项：

- [ ] 已登录状态下重开小程序，能够自动恢复用户态
- [ ] 未重新走登录时也能正确显示昵称
- [ ] 请求头已带 `Authorization: Bearer ...`

预期结果：

- 本地有 token 时，页面可直接恢复已登录态

失败优先排查：

- [token-storage.ts](/Users/xychen/Documents/MyCode/menu-time/miniapp/src/utils/token-storage.ts) 是否读到 token
- [query.ts](/Users/xychen/Documents/MyCode/menu-time/miniapp/src/features/auth/query.ts) 是否触发 `getSession`
- 后端 `/api/v1/auth/session` 是否返回 200

### A3. 401 自动刷新

依赖接口：

- `POST /api/v1/auth/refresh`

检查项：

- [ ] 手工让 access token 失效后，请求会自动触发 refresh
- [ ] refresh 成功后原请求会自动重试
- [ ] 刷新后页面不需要人工重新进入

预期结果：

- 用户感知应尽量接近无感刷新

失败优先排查：

- [client.ts](/Users/xychen/Documents/MyCode/menu-time/miniapp/src/services/request/client.ts) 中的 `refreshAccessToken`
- refresh 返回是否为 `session + tokens`
- 本地 token 是否被新值覆盖

### A4. refresh 失败降级

检查项：

- [ ] refresh 失败后本地 token 被清除
- [ ] session 被清理
- [ ] 页面进入匿名态，而不是卡在半登录状态

预期结果：

- 状态清理干净，不应残留脏 token

## 5. Taxonomy 联调验收

### T1. 菜谱库筛选项读取真实分类与标签

入口页面：

- 菜谱库 [index.tsx](/Users/xychen/Documents/MyCode/menu-time/miniapp/src/pages/recipe-library/index.tsx)

依赖接口：

- `GET /api/v1/categories`
- `GET /api/v1/tags`

检查项：

- [ ] 分类筛选区显示真实分类
- [ ] 标签筛选区显示真实标签
- [ ] 切换分类后请求重新发起
- [ ] 切换标签后请求重新发起

预期结果：

- 页面不再读取 taxonomy mock
- 分类与标签内容和数据库一致

失败优先排查：

- `TARO_APP_MOCK_SCOPES` 是否还包含 `taxonomy`
- [taxonomy.ts](/Users/xychen/Documents/MyCode/menu-time/miniapp/src/services/modules/taxonomy.ts) 是否命中真接口
- 分类/标签接口是否返回统一响应包

### T2. 分类管理页创建分类

入口页面：

- 分类管理 [index.tsx](/Users/xychen/Documents/MyCode/menu-time/miniapp/src/packages/profile/category-manage/index.tsx)

依赖接口：

- `POST /api/v1/categories`

检查项：

- [ ] 输入名称与颜色后可成功创建分类
- [ ] 创建成功后 toast 正常显示
- [ ] 分类列表自动刷新
- [ ] 菜谱库筛选区也能看到新分类

预期结果：

- `taxonomy` 与 `recipes` 查询缓存都被刷新

失败优先排查：

- [index.tsx](/Users/xychen/Documents/MyCode/menu-time/miniapp/src/packages/profile/category-manage/index.tsx) 中 `invalidateQueries`
- 后端字段校验是否拒绝了 `color: null`

### T3. 分类管理页更新分类

依赖接口：

- `PATCH /api/v1/categories/:id`

检查项：

- [ ] 可编辑已有分类名称
- [ ] 可编辑已有分类颜色
- [ ] 保存后列表实时更新
- [ ] 菜谱库中的对应分类展示同步更新

### T4. 标签管理页创建标签

入口页面：

- 标签管理 [index.tsx](/Users/xychen/Documents/MyCode/menu-time/miniapp/src/packages/profile/tag-manage/index.tsx)

依赖接口：

- `POST /api/v1/tags`

检查项：

- [ ] 输入标签名后可成功创建
- [ ] 创建成功后 toast 正常显示
- [ ] 标签列表自动刷新
- [ ] 菜谱库标签筛选区也能看到新标签

### T5. 标签管理页更新标签

依赖接口：

- `PATCH /api/v1/tags/:id`

检查项：

- [ ] 可编辑已有标签名称
- [ ] 保存后列表实时更新
- [ ] 菜谱库中的对应标签展示同步更新

## 6. 页面级回归检查

### 首页

- [ ] 欢迎语显示真实昵称
- [ ] 无明显登录闪烁

### 我的页

- [ ] 昵称显示真实昵称
- [ ] 设置页显示真实 API 地址
- [ ] 设置页显示当前 mock 范围

### 菜谱库

- [ ] 分类筛选来自真接口
- [ ] 标签筛选来自真接口
- [ ] 切换筛选时页面不会报错

### 分类管理页

- [ ] 列表可读
- [ ] 新建可用
- [ ] 编辑可用

### 标签管理页

- [ ] 列表可读
- [ ] 新建可用
- [ ] 编辑可用

## 7. 常见失败模式

### 情况 1：页面看起来还是 mock 数据

优先检查：

- 设置页里的 Mock 范围是否仍包含 `auth` 或 `taxonomy`
- `resolveMockResponse()` 是否被命中

### 情况 2：登录成功但昵称不显示

优先检查：

- `GET /api/v1/auth/session` 返回是否成功
- 前端是否仍在读取旧的 `session.user.nickname`

### 情况 3：分类/标签保存成功但筛选区不更新

优先检查：

- `queryClient.invalidateQueries({ queryKey: ['taxonomy'] })`
- `queryClient.invalidateQueries({ queryKey: ['recipes'] })`

## 8. 验收结论模板

### Auth

- 结果：
- 问题：
- 是否可进入下一阶段：

### Taxonomy

- 结果：
- 问题：
- 是否可进入 recipes 真接口联调：

## 9. 2026-04-09 当前执行结果

### 已完成

- 后端服务可访问，`/docs` 与 `/api/openapi` 可打开
- `miniapp` 已通过 `npm run typecheck`
- `miniapp` 已通过 `npm run build:weapp`
- `POST /api/v1/auth/wechat-login` 已实测通过
- `GET /api/v1/auth/session` 已实测通过
- `POST /api/v1/auth/refresh` 成功链路已实测通过，返回 `session + tokens`
- `POST /api/v1/auth/refresh` 失败链路已实测通过，无效 refresh token 返回 `401`
- `GET /api/v1/categories` 与 `GET /api/v1/tags` 已实测通过
- `POST /api/v1/categories`、`PATCH /api/v1/categories/:id` 已实测通过
- `POST /api/v1/tags`、`PATCH /api/v1/tags/:id` 已实测通过
- 前端请求层已补齐 refresh 失败后的 `session` 清理，避免半登录态
- 设置页已新增“联调调试面板”，支持一键验证登录刷新链路

### 当前仍需真机点按确认

- A1 首次进入自动登录的真实体验
- A2 重开小程序后的会话恢复体验
- A3 伪造 access token 失效后的无感刷新体验
- A4 伪造 refresh 失败后的匿名态回退体验
- 首页 / 我的页昵称显示与无明显闪烁
- 菜谱库中 taxonomy 筛选项的真实页面刷新表现

### 真机执行建议

1. 打开设置页，确认 `API 地址 = http://127.0.0.1:3000`，`Mock 范围 = meal-plan`
2. 点击“重新执行微信登录”，确认首页与我的页出现真实昵称
3. 点击“伪造 access token 失效”，回首页或菜谱库触发真实请求，确认会自动恢复
4. 点击“伪造 refresh 失败场景”，再次触发真实请求，确认昵称与 token 都被清空

参考记录：

- [两份联调验收单走查记录.md](/Users/xychen/Documents/MyCode/menu-time/docs/frontend/两份联调验收单走查记录.md)
