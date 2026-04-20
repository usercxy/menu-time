# Menu Time Backend

食光记后端，基于 `Next.js App Router + TypeScript + PostgreSQL + Prisma`。

## 当前进度

- 阶段 0 已完成：工程底座、统一响应 / 错误、日志、健康检查、Prisma、鉴权基础设施已落地。
- 阶段 1 部分完成：已落地 `households`、`users`、`wechat_accounts`、`refresh_tokens`、`categories`、`tags`、`media_assets`、`recipes`、`recipe_versions`、`recipe_version_steps`、`recipe_version_ingredients`、`recipe_version_tags` 共 12 个 Prisma 模型，并补齐两次 migration。
- 阶段 2 已完成：auth 主链路、taxonomy 的 household-scoped 查询基础设施、`schema / mapper / service / repository` 模块实现，以及分类 / 标签 API 路由均已可用。
- 阶段 3 已完成：里程碑 A/B/C/D/E/F 已完成，recipes 域数据模型、索引、双向关系、migration、模块抽象、菜谱 CRUD、版本管理、API 路由、recipes 演示 seed、自测与阶段验收均已落地。
- 阶段 3 补充完成：菜谱封面上传链路已落地，包含 COS/S3 兼容对象存储适配器、上传授权、资源登记、封面绑定与前端对接文档。

## 当前已验证

以下校验已在当前代码基线上通过：

- `npx prisma validate --schema prisma/schema.prisma`
- `npx prisma generate --schema prisma/schema.prisma`
- `npx prisma migrate dev --schema prisma/schema.prisma`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run start -- --port 3141`，并验证 `GET /api/health` 返回 `200`
- 对 `src/server/lib/diff/recipe-version-diff.ts` 做最小烟测，验证主料变化、标签新增、步骤数变化摘要正确
- 加载 `.env.local` 后执行 `node prisma/seed.mjs`
- 通过 `tsx` 执行 recipes service 烟测，验证 `createRecipe -> getRecipeDetail -> updateRecipe -> listRecipes -> deleteRecipe`
- 通过 `tsx` 执行 recipes 版本烟测，验证 `createRecipeVersion -> listRecipeVersions -> getRecipeVersionDetail -> compareRecipeVersions -> setCurrentRecipeVersion`
- `npm run prisma:seed` 自动加载 `.env.local`，并写入 1 条带 2 个版本的 recipes 演示数据
- `npm run dev -- --port 3146` 后通过真实 HTTP 请求验证 recipes API：未登录、列表、创建、详情、更新、版本列表、版本创建、版本详情、版本对比、切换当前版本、删除
- 新增 media / storage 相关改动后再次执行 `npm run typecheck` 与 `npm run lint`，均通过

## 已完成基础能力

- 初始化 `Next.js` App Router 工程与 `app/api/v1` 路由结构
- 建立 `src/server/modules`、`src/server/lib`、`src/server/db` 后端目录骨架
- 建立统一模块模板约定：`service / repository / schema / mapper / types`
- 增加环境变量模板和 `env` 统一校验入口
- 接入 Prisma Client 单例与事务封装
- 建立统一成功 / 失败响应格式和错误码
- 建立 `PageResult<T>` 类型
- 建立 Route Handler 包装器，统一处理 `requestId`、参数校验、会话和错误转换
- 接入请求级 `requestId` 与 Pino 结构化日志
- 落地微信登录、刷新、退出、当前会话 4 个基础鉴权接口
- 落地 taxonomy 模块：分类 / 标签的列表、新建、更新、软删除、重排和名称唯一校验
- 落地 recipes 域数据库模型：媒体资源、菜谱主表、版本、步骤、食材、标签映射
- 通过 Prisma relation 显式处理 `recipes.current_version_id` 与 `recipe_versions.recipe_id` 的双向关系
- 在 migration 中补齐部分 SQL 级约束：`slug` 软删除唯一索引、版本号合法性、计数字段非负
- 落地 recipes 模块基础抽象：`types / schema / mapper / repository / service`
- 在 `src/server/lib/diff` 下补齐版本差异摘要 helper
- 预留基于 taxonomy 的分类 / 标签复用 helper，为“顺手新建分类 / 标签”做准备
- 已实现 recipes service 主链路：列表、详情、创建菜谱自动生成 `V1`、更新基础信息、软删除
- 已实现 recipes 版本主链路：版本列表、版本详情、创建版本、版本对比、切换当前版本
- 已开放 recipes API：`/api/v1/recipes`、`/api/v1/recipes/:id`、`/api/v1/recipes/:id/versions`、`/api/v1/recipes/:id/compare`
- 已实现对象存储适配层：支持 COS/S3 兼容预签名上传、对象存在校验和公开 URL 生成
- 已开放 media API：`/api/v1/media/upload-token`、`/api/v1/media/assets`
- 已补充前端接口文档：`docs/frontend-integration/recipe-cover-upload-apis.md`
- 预留 pg-boss worker 启动结构
- 增加 `/api/health` 健康检查接口

## 菜谱封面上传设计

当前菜谱封面上传采用“后端签发上传授权、前端直传对象存储、上传成功后登记资源、最后绑定菜谱封面”的四段式链路。

### 方案概览

```text
前端选图
  -> POST /api/v1/media/upload-token
  <- uploadUrl / headers / assetKey

前端直传 COS
  -> PUT uploadUrl

前端登记资源
  -> POST /api/v1/media/assets
  <- mediaAssetId / assetUrl

前端绑定菜谱封面
  -> PATCH /api/v1/recipes/:id
     { coverImageId, coverSource: "custom" }
```

### 这样设计的原因

- 贴合现有数据模型：数据库已经有 `media_assets` 和 `recipes.cover_image_id`，无需新增表即可完成封面图关联。
- 减少后端流量压力：图片二进制不经过业务服务，上传流量直接进入 COS，更适合图片场景。
- 贴合当前代码结构：项目已抽象 `storage.adapter`，采用预签名 URL 可以在现有分层上平滑接入。
- 权限边界更清晰：对象 key 由后端统一生成，前端不能任意写路径；登记阶段再通过 `HeadObject` 校验对象确实存在、类型和大小匹配。
- 便于后续扩展：后面接 moments、share 图或其他媒体资源时，可以复用同一套存储和登记链路。

### 为什么不走“后端代理上传”

- 代理上传会让应用服务承担全部文件带宽和内存开销，不适合图片直传场景。
- 当前项目并没有围绕 multipart 代理上传建链路，强行改成代理上传会比直传方案改动更大。
- 菜谱封面本质上是静态资源，放到对象存储更自然。

### 为什么当前不走“STS 临时密钥直传”

- STS 更适合大文件分片、复杂上传控制或客户端深度接入。
- 当前只做单张封面，预签名 PUT URL 足够覆盖需求，前端接入也更简单。
- 先用更轻的方案完成上线，后续若有多图、分片、视频再升级成本更低。

### 当前边界

- 本期只支持菜谱封面，不支持多图或相册。
- `purpose` 当前只开放 `cover`。
- 仅支持 `jpg / png / webp`。
- 面向“公开读、私有写”的对象存储配置。
- 替换封面时暂不自动删除旧对象，后续再补孤儿资源清理。

### 对象 key 约定

```text
households/{householdId}/recipes/covers/{yyyy}/{mm}/{uuid}.{ext}
```

这样做的目的是：

- household 级资源隔离
- 路径业务含义明确
- 便于后续清理、审计和统计

### 相关代码位置

- 存储适配：`src/server/lib/storage/s3-storage.adapter.ts`
- 上传授权接口：`src/app/api/v1/media/upload-token/route.ts`
- 资源登记接口：`src/app/api/v1/media/assets/route.ts`
- media 模块服务：`src/server/modules/media/media.service.ts`
- 前端对接文档：`docs/frontend-integration/recipe-cover-upload-apis.md`

## 本地使用

1. 准备 PostgreSQL，并创建可访问的数据库。
2. 复制环境变量模板。
3. 执行 Prisma migration。
4. 初始化基础 seed 数据。
5. 启动开发服务器。

```bash
copy .env.example .env.local
npx prisma migrate dev --schema prisma/schema.prisma
npm run prisma:seed
npm run dev
```

说明：

- `npm run prisma:seed` 会自动加载 `.env.local`。
- seed 会补齐默认家庭、管理员、分类、标签，以及 1 条带 2 个版本的演示菜谱，便于直接联调阶段 3 recipes 接口。

常用检查命令：

```bash
npx prisma validate --schema prisma/schema.prisma
npx prisma generate --schema prisma/schema.prisma
npm run typecheck
npm run lint
npm run build
```

对象存储相关环境变量示例（统一按真实 COS 联调）：

```bash
CLOUD_VENDOR=cos
S3_ENDPOINT=https://cos.ap-guangzhou.myqcloud.com
S3_REGION=ap-guangzhou
S3_BUCKET=menu-time-1310659978
S3_PUBLIC_BASE_URL=https://menu-time-1310659978.cos.ap-guangzhou.myqcloud.com
S3_ACCESS_KEY=replace-me
S3_SECRET_KEY=replace-me
S3_SIGNED_URL_TTL_SECONDS=900
MEDIA_MAX_IMAGE_SIZE_BYTES=52428800
MEDIA_ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp
```

说明：

- 当前开发、测试、生产示例都统一使用真实 COS，不再保留 `localhost:9000` 这类本地对象存储模板。
- `CLOUD_VENDOR=cos` 时，如果误配了本地 `localhost` endpoint，代码会回退到 COS 默认域名，避免再次签出错误的本地上传地址。
- 生产环境请使用新的、未泄露的子账号密钥，并通过密钥管理系统注入，不要提交到仓库。

## 已提供的接口

- `GET /api/health`
- `GET /api/openapi`
- `POST /api/v1/auth/wechat-login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/session`
- `GET /api/v1/categories`
- `POST /api/v1/categories`
- `PATCH /api/v1/categories/:id`
- `DELETE /api/v1/categories/:id`
- `POST /api/v1/categories/reorder`
- `GET /api/v1/tags`
- `POST /api/v1/tags`
- `PATCH /api/v1/tags/:id`
- `DELETE /api/v1/tags/:id`
- `GET /api/v1/recipes`
- `POST /api/v1/recipes`
- `GET /api/v1/recipes/:id`
- `PATCH /api/v1/recipes/:id`
- `DELETE /api/v1/recipes/:id`
- `GET /api/v1/recipes/:id/versions`
- `POST /api/v1/recipes/:id/versions`
- `GET /api/v1/recipes/:id/versions/:versionId`
- `POST /api/v1/recipes/:id/versions/:versionId/set-current`
- `GET /api/v1/recipes/:id/compare`
- `POST /api/v1/media/upload-token`
- `POST /api/v1/media/assets`

文档入口：

- Swagger UI：`/docs`
- OpenAPI JSON：`/api/openapi`
- 前端封面上传对接文档：`docs/frontend-integration/recipe-cover-upload-apis.md`

说明：

- 所有 `recipes` 接口均复用统一 `createRouteHandler`、`requestId` 透传、Zod 校验、统一响应和错误映射。
- 所有 `recipes` 接口默认要求登录。
- `media` 接口默认要求登录，推荐调用顺序为“申请上传授权 -> 直传 COS -> 登记资源 -> 绑定菜谱封面”。

## 联调示例请求

```bash
# 1) 登录（开发环境 mock code）
curl -X POST http://127.0.0.1:3000/api/v1/auth/wechat-login ^
  -H "Content-Type: application/json" ^
  -d "{\"code\":\"mock:demo-user\",\"nickname\":\"DevUser\"}"

# 2) 使用 accessToken 调用受保护接口（以下 TOKEN 请替换）
curl -X GET "http://127.0.0.1:3000/api/v1/categories?includeArchived=false" ^
  -H "Authorization: Bearer TOKEN"

# 3) 新建分类
curl -X POST http://127.0.0.1:3000/api/v1/categories ^
  -H "Authorization: Bearer TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Home Style\",\"color\":\"#E07A5F\"}"

# 4) 新建标签
curl -X POST http://127.0.0.1:3000/api/v1/tags ^
  -H "Authorization: Bearer TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Quick\"}"

# 5) 获取菜谱列表
curl -X GET "http://127.0.0.1:3000/api/v1/recipes?page=1&pageSize=10" ^
  -H "Authorization: Bearer TOKEN"

# 6) 新建菜谱并自动生成 V1
curl -X POST http://127.0.0.1:3000/api/v1/recipes ^
  -H "Authorization: Bearer TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"清炒西兰花\",\"slug\":\"demo-stir-fried-broccoli\",\"versionName\":\"V1 清爽版\",\"ingredientsText\":\"西兰花 1 颗、蒜 3 瓣、盐 少许\",\"ingredients\":[{\"rawText\":\"西兰花 1 颗\",\"normalizedName\":\"西兰花\",\"amountText\":\"1\",\"unit\":\"颗\"},{\"rawText\":\"蒜 3 瓣\",\"normalizedName\":\"蒜\",\"amountText\":\"3\",\"unit\":\"瓣\",\"isSeasoning\":true}],\"steps\":[{\"content\":\"西兰花切小朵洗净。\"},{\"content\":\"热锅下油爆香蒜末，放入西兰花翻炒断生。\"}],\"newCategoryName\":\"快手菜\",\"newTagNames\":[\"清淡\",\"10分钟\"]}"

# 7) 对比某菜谱 V1 和 V2
curl -X GET "http://127.0.0.1:3000/api/v1/recipes/RECIPE_ID/compare?base=1&target=2" ^
  -H "Authorization: Bearer TOKEN"
```

开发环境下可以使用 `mock:<openid>` 形式的 `code` 走微信登录模拟链路，例如：

```json
{
  "code": "mock:demo-user",
  "nickname": "本地测试用户"
}
```

## 目录结构

当前目录结构和职责如下：

```text
backend/
  .env.example                     # 通用环境变量模板
  .env.local                       # 本地开发环境变量
  package.json                     # 脚本与依赖定义
  tsconfig.json                    # TypeScript 配置
  eslint.config.mjs                # ESLint 配置
  next.config.ts                   # Next.js 配置
  prisma/
    schema.prisma                  # Prisma 数据模型与关系定义
    seed.mjs                       # 初始化 seed 数据
    migrations/
      20260409150000_init_taxonomy/
        migration.sql              # 首次建库：auth + taxonomy
      20260409171000_add_recipe_domain_stage3/
        migration.sql              # 阶段3里程碑A：recipes 域表结构
      migration_lock.toml          # Prisma migration 锁文件
  public/                          # 静态资源目录
  src/
    app/
      favicon.ico                  # 站点图标
      globals.css                  # 全局样式
      layout.tsx                   # 根布局
      page.tsx                     # 根页面
      api/
        health/
          route.ts                 # 健康检查接口
        v1/
          auth/
            wechat-login/
              route.ts             # 微信登录
            refresh/
              route.ts             # access token 刷新
            logout/
              route.ts             # 退出登录
            session/
              route.ts             # 当前会话
          categories/
            route.ts               # 分类列表 / 新建
            reorder/
              route.ts             # 分类重排
            [id]/
              route.ts             # 分类更新 / 删除
          tags/
            route.ts               # 标签列表 / 新建
            [id]/
              route.ts             # 标签更新 / 删除
    server/
      db/
        client.ts                  # Prisma Client 单例
        transactions.ts            # 事务封装
      lib/
        api/
          response.ts              # 统一响应格式
          route-handler.ts         # Route Handler 包装器
        auth/
          duration.ts              # token 生命周期配置
          jwt.ts                   # access / refresh token 签发与校验
          session.ts               # 会话解析
          wechat.ts                # 微信登录适配
        env/
          index.ts                 # 环境变量读取与校验
        errors/
          app-error.ts             # 业务异常定义
          error-codes.ts           # 错误码枚举
          index.ts                 # 错误导出入口
        diff/
          index.ts                 # diff helper 导出入口
          recipe-version-diff.ts   # 版本差异摘要生成
        jobs/
          client.ts                # pg-boss client 预留
          job-names.ts             # 异步任务名常量
          worker.ts                # worker 启动预留
        logger/
          index.ts                 # Pino 日志封装
        request/
          context.ts               # requestId / householdId 上下文工具
          request-id.ts            # requestId 生成与注入
        storage/
          storage.adapter.ts       # 对象存储适配层入口
          s3-storage.adapter.ts    # COS/S3 兼容上传与对象校验
          storage.types.ts         # 存储相关类型
      modules/
        README.md                  # 模块目录约定说明
        auth/
          auth.types.ts            # 鉴权模块类型
          auth.schema.ts           # 鉴权参数校验
          auth.mapper.ts           # 鉴权 DTO 映射
          auth.repository.ts       # 鉴权数据访问
          auth.service.ts          # 鉴权业务逻辑
        taxonomy/
          README.md                # taxonomy 模块说明
          taxonomy.types.ts        # 分类 / 标签类型定义
          taxonomy.schema.ts       # 分类 / 标签参数校验
          taxonomy.mapper.ts       # 分类 / 标签 DTO 映射
          taxonomy.repository.ts   # household-scoped 数据访问
          taxonomy.service.ts      # 分类 / 标签业务规则
        recipes/
          README.md                # recipes 模块说明
          recipes.types.ts         # recipes DTO、输入类型、写入 helper 类型
          recipes.schema.ts        # recipes Zod schema
          recipes.mapper.ts        # Prisma -> DTO 映射
          recipes.repository.ts    # household-scoped 查询与版本写入 helper
          recipes.service.ts       # recipes 服务层基础能力
        media/
          README.md                # 媒体模块说明
          media.types.ts           # 媒体 DTO 与输入类型
          media.schema.ts          # 上传授权 / 资源登记参数校验
          media.mapper.ts          # 媒体 DTO 映射
          media.repository.ts      # media_assets 数据访问
          media.service.ts         # 媒体上传与登记业务逻辑
        moments/
          README.md                # 时光记录模块占位
        plans/
          README.md                # 周菜单模块占位
        shopping/
          README.md                # 购物清单模块占位
        random/
          README.md                # 随机点菜模块占位
  docs/
    frontend-integration/
      recipe-cover-upload-apis.md # 菜谱封面上传前端接口文档
```

## 目录说明

- `src/app/api`：对外 HTTP 接口入口，只负责接参、鉴权、参数校验、响应转换。
- `src/server/modules`：业务模块目录，按 `types / schema / mapper / repository / service` 分层。
- `src/server/lib`：跨模块公共能力，包含鉴权、日志、错误、请求上下文、对象存储和任务封装。
- `src/server/db`：数据库访问基础设施，统一管理 Prisma Client 和事务。
- `prisma/schema.prisma`：数据库模型真源，所有表结构变更先改这里。
- `prisma/migrations`：数据库演进历史，必须和 `schema.prisma` 保持一致。
- `prisma/seed.mjs`：本地联调和新环境初始化用的演示数据入口。

## 后续开发方向

- 阶段 4：实现时光记录、媒体登记、封面回填与首页动态链路
- 阶段 5：实现周菜单与点菜台
- 阶段 6：实现购物清单快照生成与导出
