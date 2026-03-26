# Menu Time Backend

食光记后端阶段 0 工程底座，基于 `Next.js App Router + TypeScript + PostgreSQL + Prisma`。

## 阶段 0 已完成

- 初始化 `Next.js` App Router 工程与 `app/api/v1` 路由结构
- 建立 `src/server/modules`、`src/server/lib`、`src/server/db` 后端目录骨架
- 建立统一模块模板约定：`service / repository / schema / mapper / types`
- 增加环境变量模板和 `env` 统一校验入口
- 接入 Prisma Client 单例与事务封装
- 建立统一成功/失败响应格式和错误码
- 建立 `PageResult<T>` 类型
- 建立 Route Handler 包装器，统一处理 `requestId`、参数校验、会话和错误转换
- 接入请求级 `requestId` 与 Pino 结构化日志
- 落地微信登录、刷新、退出、当前会话 4 个基础鉴权接口
- 预留对象存储适配层与 pg-boss worker 启动结构
- 增加 `/api/health` 健康检查接口

## 本地使用

1. 准备 PostgreSQL。
2. 复制环境变量模板。
3. 生成 Prisma Client。
4. 启动开发服务器。

```bash
copy .env.example .env.local
npx prisma generate
npm run dev
```

## 已提供的接口

- `GET /api/health`
- `POST /api/v1/auth/wechat-login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/session`

开发环境下可以使用 `mock:<openid>` 形式的 `code` 走微信登录模拟链路，例如：

```json
{
  "code": "mock:demo-user",
  "nickname": "本地测试用户"
}
```

## 目录结构

```text
src/
  app/
    api/
      health/
      v1/
        auth/
  server/
    db/
    lib/
    modules/
prisma/
```
