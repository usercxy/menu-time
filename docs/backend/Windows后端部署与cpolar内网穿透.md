# Windows 后端部署与 cpolar 内网穿透指南

## 1. 文档目标

本文档用于在一台 Windows 电脑上部署 `menu-time` 后端服务，并通过 cpolar 将本地后端暴露为公网 HTTPS 地址，供微信小程序、开发者工具或其他外部客户端联调访问。

适用项目路径：

```text
menu-time/backend
```

后端技术栈：

```text
Next.js + TypeScript + PostgreSQL + Prisma
```

默认后端端口建议使用：

```text
3141
```

最终访问形态：

```text
本地后端: http://127.0.0.1:3141
公网地址: https://你的-cpolar-域名
健康检查: https://你的-cpolar-域名/api/health
接口文档: https://你的-cpolar-域名/docs
```

## 2. 部署前准备

### 2.1 Windows 环境

需要安装：

- Node.js：建议 Node 20 LTS 或 22 LTS。
- Git。
- PostgreSQL。
- cpolar。
- 可选：NSSM，用于把后端注册为 Windows 后台服务。

可以使用 `winget` 安装基础工具：

```powershell
winget install OpenJS.NodeJS.LTS
winget install Git.Git
winget install PostgreSQL.PostgreSQL
```

安装后确认版本：

```powershell
node -v
npm -v
git --version
psql --version
```

### 2.2 获取项目代码

```powershell
git clone https://github.com/usercxy/menu-time.git
cd menu-time\backend
npm ci
```

如果代码已经在 Windows 电脑上，直接进入后端目录即可：

```powershell
cd C:\path\to\menu-time\backend
npm ci
```

## 3. PostgreSQL 数据库准备

### 3.1 创建数据库和用户

进入 PostgreSQL：

```powershell
psql -U postgres
```

执行：

```sql
CREATE USER menu_time_user WITH PASSWORD '请替换成强密码';
CREATE DATABASE menu_time OWNER menu_time_user;
GRANT ALL PRIVILEGES ON DATABASE menu_time TO menu_time_user;
```

退出：

```sql
\q
```

后续 `DATABASE_URL` 使用类似格式：

```text
postgresql://menu_time_user:请替换成强密码@127.0.0.1:5432/menu_time
```

如果密码中包含 `@`、`#`、`:`、`/` 等特殊字符，需要进行 URL 编码，或者换一个只包含字母、数字和常见安全符号的密码。

## 4. 后端环境变量配置

### 4.1 复制生产环境模板

在 `backend` 目录执行：

```powershell
copy .env.production.example .env
notepad .env
```

### 4.2 关键环境变量

先按下面内容修改 `.env`。其中 `APP_BASE_URL` 可以先临时填写本地地址，等 cpolar 域名生成后再改成公网 HTTPS 地址。

```env
NODE_ENV=production
APP_NAME=menu-time-backend
APP_BASE_URL=http://127.0.0.1:3141
API_PREFIX=/api/v1
LOG_LEVEL=info
REQUEST_ID_HEADER=x-request-id

DATABASE_URL=postgresql://menu_time_user:请替换成强密码@127.0.0.1:5432/menu_time

AUTH_ACCESS_TOKEN_SECRET=请替换成至少16位以上随机字符串
AUTH_REFRESH_TOKEN_SECRET=请替换成另一个至少16位以上随机字符串
AUTH_ACCESS_TOKEN_TTL=15m
AUTH_REFRESH_TOKEN_TTL=30d

WECHAT_APP_ID=你的小程序AppID
WECHAT_APP_SECRET=你的小程序AppSecret
WECHAT_API_BASE_URL=https://api.weixin.qq.com
MVP_DEFAULT_HOUSEHOLD_NAME=默认家庭

CLOUD_VENDOR=cos
S3_ENDPOINT=https://cos.ap-guangzhou.myqcloud.com
S3_REGION=ap-guangzhou
S3_BUCKET=你的COS桶名
S3_ACCESS_KEY=你的COS-SecretId
S3_SECRET_KEY=你的COS-SecretKey
S3_PUBLIC_BASE_URL=https://你的COS桶名.cos.ap-guangzhou.myqcloud.com
S3_SIGNED_URL_TTL_SECONDS=900
MEDIA_MAX_IMAGE_SIZE_BYTES=5242880
MEDIA_ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp

PG_BOSS_SCHEMA=pgboss
ENABLE_JOB_WORKER=true
SENTRY_DSN=
```

说明：

- `.env` 不要提交到 Git。
- `APP_BASE_URL` 最终需要改为 cpolar 提供的公网 HTTPS 地址。
- 当前环境变量校验要求 COS/S3 相关变量存在。即使暂时不联调图片上传，也需要填入可用或占位但格式正确的值；正式联调图片时必须使用真实 COS 配置。
- 微信登录接口依赖 `WECHAT_APP_ID` 和 `WECHAT_APP_SECRET`，真机联调时需要使用真实小程序配置。

### 4.3 生成 JWT Secret

可以在 PowerShell 中执行下面命令生成随机密钥：

```powershell
$bytes=New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Fill($bytes); [Convert]::ToBase64String($bytes)
```

执行两次，分别填入：

```env
AUTH_ACCESS_TOKEN_SECRET=
AUTH_REFRESH_TOKEN_SECRET=
```

## 5. 初始化数据库与构建后端

在 `backend` 目录执行：

```powershell
npx prisma validate --schema prisma/schema.prisma
npx prisma generate --schema prisma/schema.prisma
npx prisma migrate deploy --schema prisma/schema.prisma
npm run build
```

如果需要初始化演示数据：

```powershell
node --env-file=.env prisma/seed.mjs
```

启动后端：

```powershell
npm run start -- -H 0.0.0.0 -p 3141
```

本机验证：

```powershell
curl http://127.0.0.1:3141/api/health
```

浏览器验证：

```text
http://127.0.0.1:3141/api/health
http://127.0.0.1:3141/docs
```

## 6. Windows 防火墙放行

如果只通过 cpolar 从本机转发，通常不需要额外开放公网入站端口。为了方便局域网设备直接访问，可以放行 `3141`：

```powershell
New-NetFirewallRule -DisplayName "Menu Time Backend 3141" -Direction Inbound -LocalPort 3141 -Protocol TCP -Action Allow
```

局域网内其他设备可以通过下面地址验证：

```text
http://Windows电脑局域网IP:3141/api/health
```

## 7. cpolar 内网穿透配置

### 7.1 安装 cpolar

推荐从 cpolar 官网下载 Windows 版本并安装：

```text
https://www.cpolar.com/download
```

安装完成后，cpolar 通常会提供本地 Web UI：

```text
http://127.0.0.1:9200
```

打开后使用 cpolar 账号登录。

### 7.2 使用 Web UI 创建 HTTP 隧道

在 cpolar Web UI 中创建隧道：

```text
隧道管理 -> 创建隧道
```

建议配置：

| 配置项 | 建议值 |
| --- | --- |
| 隧道名称 | `menu-time-backend` |
| 协议 | `http` |
| 本地地址 | `127.0.0.1:3141` 或 `localhost:3141` |
| 地区 | 优先选择国内可用节点 |
| 二级子域名 / 自定义域名 | 长期联调建议使用固定域名 |

创建后进入：

```text
状态 -> 在线隧道列表
```

复制 cpolar 生成的公网 HTTPS 地址，例如：

```text
https://xxxx.cpolar.top
```

实际域名以 cpolar 控制台显示为准。

### 7.3 使用命令行创建临时隧道

也可以使用命令行快速启动：

```powershell
cpolar http 3141
```

启动后终端会输出公网访问地址。复制其中的 HTTPS 地址。

如果需要绑定账号 token，按 cpolar 控制台提供的 token 执行：

```powershell
cpolar authtoken 你的cpolar-authtoken
```

然后再启动：

```powershell
cpolar http 3141
```

### 7.4 更新后端 APP_BASE_URL

拿到 cpolar HTTPS 地址后，修改 `backend\.env`：

```env
APP_BASE_URL=https://xxxx.cpolar.top
```

重启后端：

```powershell
npm run start -- -H 0.0.0.0 -p 3141
```

验证公网访问：

```text
https://xxxx.cpolar.top/api/health
https://xxxx.cpolar.top/docs
```

## 8. 小程序端接入公网后端

小程序端接口基础地址来自 `TARO_APP_API_BASE_URL`。

生产配置文件：

```text
miniapp/config/prod.ts
```

开发配置文件：

```text
miniapp/config/dev.ts
```

将其中的接口地址改成 cpolar HTTPS 地址：

```ts
TARO_APP_API_BASE_URL: '"https://xxxx.cpolar.top"'
```

开发调试阶段，可以在微信开发者工具中临时勾选：

```text
不校验合法域名、web-view、TLS 版本以及 HTTPS 证书
```

体验版或正式版需要在微信公众平台配置合法域名：

- `request` 合法域名：后端 cpolar HTTPS 域名。
- 如果联调图片上传，还需要按实际 COS 域名配置 `uploadFile` / `downloadFile` / `request` 合法域名。

注意：

- 免费或临时 cpolar 域名可能变化，变化后需要同步更新后端 `.env` 的 `APP_BASE_URL` 和小程序 `TARO_APP_API_BASE_URL`。
- 长期联调建议使用 cpolar 固定域名或自定义域名。
- 微信小程序正式版通常不适合依赖随机变化的临时域名。

## 9. 后台常驻运行

### 9.1 临时运行

保持两个 PowerShell 窗口：

后端窗口：

```powershell
cd C:\path\to\menu-time\backend
npm run start -- -H 0.0.0.0 -p 3141
```

cpolar 窗口：

```powershell
cpolar http 3141
```

### 9.2 使用 NSSM 注册后端服务

安装 NSSM：

```powershell
winget install NSSM.NSSM
```

创建服务：

```powershell
nssm install MenuTimeBackend
```

弹窗中填写：

```text
Path: C:\Program Files\nodejs\npm.cmd
Startup directory: C:\path\to\menu-time\backend
Arguments: run start -- -H 0.0.0.0 -p 3141
```

启动服务：

```powershell
nssm start MenuTimeBackend
```

查看状态：

```powershell
nssm status MenuTimeBackend
```

停止服务：

```powershell
nssm stop MenuTimeBackend
```

cpolar 也建议配置为开机自启或使用其内置服务能力，避免 Windows 重启后公网访问中断。

## 10. 验证清单

部署完成后逐项验证：

```text
[ ] PostgreSQL 服务已启动
[ ] backend/.env 已配置真实 DATABASE_URL
[ ] backend/.env 已配置 APP_BASE_URL 为 cpolar HTTPS 地址
[ ] npx prisma migrate deploy 执行成功
[ ] npm run build 执行成功
[ ] 本地 http://127.0.0.1:3141/api/health 可访问
[ ] 公网 https://xxxx.cpolar.top/api/health 可访问
[ ] 公网 https://xxxx.cpolar.top/docs 可访问
[ ] 小程序 TARO_APP_API_BASE_URL 已改为 cpolar HTTPS 地址
[ ] 微信开发者工具调试设置或微信公众平台合法域名已配置
[ ] 如使用图片上传，COS 相关域名已加入微信合法域名
```

## 11. 常见问题

### 11.1 `Invalid environment variables`

说明 `.env` 中缺少必填变量或格式不正确。

重点检查：

- `APP_BASE_URL` 必须是合法 URL。
- `DATABASE_URL` 不能为空。
- `AUTH_ACCESS_TOKEN_SECRET` 和 `AUTH_REFRESH_TOKEN_SECRET` 至少 16 位。
- `WECHAT_API_BASE_URL` 必须是合法 URL。
- `S3_BUCKET`、`S3_ACCESS_KEY`、`S3_SECRET_KEY` 不能为空。

### 11.2 数据库连接失败

检查：

```powershell
psql -U menu_time_user -d menu_time -h 127.0.0.1 -p 5432
```

如果无法连接：

- 确认 PostgreSQL 服务已启动。
- 确认用户名、密码、库名正确。
- 确认 `DATABASE_URL` 中的特殊字符已经 URL 编码。

### 11.3 本地能访问，cpolar 公网不能访问

检查：

- 后端是否正在监听 `3141`。
- cpolar 隧道本地地址是否填 `127.0.0.1:3141`。
- cpolar 在线隧道列表是否显示正常。
- 访问的是 HTTPS 地址，而不是错误的 TCP 地址。

### 11.4 小程序请求失败

检查：

- `TARO_APP_API_BASE_URL` 是否为 cpolar HTTPS 地址。
- 小程序是否重新编译。
- 微信开发者工具是否开启“不校验合法域名”。
- 体验版或正式版是否已经在微信公众平台配置 request 合法域名。
- 后端接口是否要求登录，当前是否已经完成微信登录。

### 11.5 cpolar 域名变化导致接口不可用

如果使用免费或临时域名，cpolar 地址可能变化。变化后需要同步更新：

- `backend/.env` 的 `APP_BASE_URL`。
- `miniapp/config/dev.ts` 或 `miniapp/config/prod.ts` 的 `TARO_APP_API_BASE_URL`。
- 微信公众平台合法域名配置，若该域名用于体验版或正式版。

长期联调建议使用固定域名。

## 12. 推荐部署组合

### 12.1 临时联调

```text
Windows PostgreSQL
+ npm run start -- -H 0.0.0.0 -p 3141
+ cpolar 临时 HTTP 隧道
+ 微信开发者工具关闭域名校验
```

### 12.2 长期联调

```text
Windows PostgreSQL 自动启动
+ 后端注册为 NSSM 服务
+ cpolar 固定 HTTPS 域名
+ 小程序配置固定 TARO_APP_API_BASE_URL
+ 微信公众平台配置合法域名
```

### 12.3 更正式的生产部署

如果后续从家庭/内测走向正式生产，建议迁移到：

```text
云服务器 / 云数据库 PostgreSQL
+ 固定备案域名
+ HTTPS 证书
+ 进程守护与日志采集
+ 数据库定期备份
```

cpolar 更适合内测、演示、家庭服务器或开发联调，不建议作为高可用生产入口。

## 13. 命令速查

本节汇总部署、启动、排障时最常用的命令，执行目录默认是 Windows PowerShell。

### 13.1 安装与版本检查

```powershell
winget install OpenJS.NodeJS.LTS
winget install Git.Git
winget install PostgreSQL.PostgreSQL

node -v
npm -v
git --version
psql --version
```

### 13.2 获取代码与安装依赖

```powershell
git clone https://github.com/usercxy/menu-time.git
cd menu-time\backend
npm ci
```

已有代码时：

```powershell
cd C:\path\to\menu-time\backend
npm ci
```

### 13.3 PostgreSQL 数据库命令

进入 PostgreSQL：

```powershell
psql -U postgres
```

创建用户和数据库：

```sql
CREATE USER menu_time_user WITH PASSWORD '请替换成强密码';
CREATE DATABASE menu_time OWNER menu_time_user;
GRANT ALL PRIVILEGES ON DATABASE menu_time TO menu_time_user;
```

退出 PostgreSQL：

```sql
\q
```

测试业务用户连接：

```powershell
psql -U menu_time_user -d menu_time -h 127.0.0.1 -p 5432
```

### 13.4 环境变量与密钥

复制环境变量模板：

```powershell
copy .env.production.example .env
notepad .env
```

生成 JWT 随机密钥，执行两次，分别填入 `AUTH_ACCESS_TOKEN_SECRET` 和 `AUTH_REFRESH_TOKEN_SECRET`：

```powershell
$bytes=New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Fill($bytes); [Convert]::ToBase64String($bytes)
```

### 13.5 Prisma 与构建命令

```powershell
npx prisma validate --schema prisma/schema.prisma
npx prisma generate --schema prisma/schema.prisma
npx prisma migrate deploy --schema prisma/schema.prisma
npx prisma migrate status --schema prisma/schema.prisma
npm run build
```

写入演示数据：

```powershell
node --env-file=.env prisma/seed.mjs
```

### 13.6 启动与验证后端

启动生产服务：

```powershell
npm run start -- -H 0.0.0.0 -p 3141
```

本地健康检查：

```powershell
curl http://127.0.0.1:3141/api/health
```

查看接口文档：

```text
http://127.0.0.1:3141/docs
```

### 13.7 Windows 防火墙

放行后端端口：

```powershell
New-NetFirewallRule -DisplayName "Menu Time Backend 3141" -Direction Inbound -LocalPort 3141 -Protocol TCP -Action Allow
```

查看相关防火墙规则：

```powershell
Get-NetFirewallRule -DisplayName "Menu Time Backend 3141"
```

如需删除规则：

```powershell
Remove-NetFirewallRule -DisplayName "Menu Time Backend 3141"
```

### 13.8 cpolar 命令

绑定 cpolar 账号 token：

```powershell
cpolar authtoken 你的cpolar-authtoken
```

创建临时 HTTP 隧道：

```powershell
cpolar http 3141
```

如果需要显式指定本地地址：

```powershell
cpolar http http://127.0.0.1:3141
```

打开 cpolar 本地管理界面：

```text
http://127.0.0.1:9200
```

拿到公网 HTTPS 地址后，验证：

```powershell
curl https://xxxx.cpolar.top/api/health
```

### 13.9 NSSM 后台服务命令

安装 NSSM：

```powershell
winget install NSSM.NSSM
```

创建后端服务：

```powershell
nssm install MenuTimeBackend
```

启动、查看、停止服务：

```powershell
nssm start MenuTimeBackend
nssm status MenuTimeBackend
nssm stop MenuTimeBackend
```

删除服务：

```powershell
nssm remove MenuTimeBackend confirm
```

### 13.10 常用排障命令

检查端口是否被监听：

```powershell
netstat -ano | findstr :3141
```

根据 PID 查看进程：

```powershell
tasklist /FI "PID eq 进程PID"
```

终止占用端口的进程：

```powershell
taskkill /PID 进程PID /F
```

检查 PostgreSQL 端口：

```powershell
netstat -ano | findstr :5432
```

重新安装依赖：

```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
```

如果不希望更新锁文件，优先使用：

```powershell
Remove-Item -Recurse -Force node_modules
npm ci
```
