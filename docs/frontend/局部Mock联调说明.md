# 小程序局部 Mock 联调说明

## 1. 目的

当前后端已完成：

- `auth`
- `taxonomy`
- `recipes`

但 `meal-plan` 等能力仍未完成。

因此前端不适合再使用“全局 mock 开 / 关”模式，而应该改为“按业务域局部 mock”，这样已完成的域可以切真接口，未完成的域继续走 mock。

## 2. 当前默认行为

在 [env.ts](/Users/xychen/Documents/MyCode/menu-time/miniapp/src/constants/env.ts) 中，当前默认策略如下：

- 如果 `TARO_APP_API_BASE_URL` 还是占位地址或本地默认地址未明确配置：
  - 默认所有域都走 mock
- 如果 `TARO_APP_API_BASE_URL` 已配置为真实联调地址：
  - 默认只保留 `meal-plan` mock
  - `auth / taxonomy / recipes` 默认走真实接口

## 3. 可用环境变量

### `TARO_APP_API_BASE_URL`

示例：

```bash
TARO_APP_API_BASE_URL=http://127.0.0.1:3000
```

### `TARO_APP_ENABLE_MOCK`

可选值：

- `true`
- `false`

说明：

- 这是总开关
- 即使开启，也会继续受 `TARO_APP_MOCK_SCOPES` 控制

### `TARO_APP_MOCK_SCOPES`

可选值：

- `all`
- `none`
- 逗号分隔作用域列表

当前支持的作用域：

- `auth`
- `taxonomy`
- `recipes`
- `meal-plan`

示例：

```bash
TARO_APP_MOCK_SCOPES=meal-plan
```

表示：

- `meal-plan` 继续走 mock
- `auth / taxonomy / recipes` 走真实接口

再例如：

```bash
TARO_APP_MOCK_SCOPES=all
```

表示全部走 mock。

## 4. 推荐联调配置

针对当前阶段，推荐：

```bash
TARO_APP_API_BASE_URL=http://127.0.0.1:3000
TARO_APP_ENABLE_MOCK=true
TARO_APP_MOCK_SCOPES=meal-plan
```

这样可以保证：

- 登录、分类、标签、菜谱、版本走真实后端
- 点菜台仍然可以正常使用 mock 数据

## 5. 如何确认当前状态

可以在小程序“设置”页查看：

- API 地址
- Mock 开关
- Mock 范围

对应页面：

- [index.tsx](/Users/xychen/Documents/MyCode/menu-time/miniapp/src/packages/profile/settings/index.tsx)

## 6. 真机登录刷新辅助

开发环境下，设置页还提供了“联调调试面板”，用于缩短真机验收路径：

- 重新执行微信登录
- 伪造 access token 失效
- 伪造 refresh 失败场景
- 清空本地登录态

推荐用法：

1. 先确认 `Mock 范围` 不包含 `auth`
2. 点击“重新执行微信登录”，拿到真实 `session + tokens`
3. 点击“伪造 access token 失效”，再回首页或菜谱库触发真实请求，验证 `401 -> refresh -> retry`
4. 点击“伪造 refresh 失败场景”，再触发真实请求，验证页面是否回到匿名态

对应页面：

- [index.tsx](/Users/xychen/Documents/MyCode/menu-time/miniapp/src/packages/profile/settings/index.tsx)
