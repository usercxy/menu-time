recipes 模块当前已完成阶段 3 里程碑 B 的基础抽象，包含以下文件：

- `recipes.types.ts`：菜谱、版本、对比、写入 helper 所需类型与 DTO
- `recipes.schema.ts`：列表、详情、创建菜谱、更新菜谱、创建版本、版本对比的 Zod schema
- `recipes.mapper.ts`：将 Prisma 查询结果映射为 recipes DTO
- `recipes.repository.ts`：household-scoped 查询、列表聚合、版本写入 helper
- `recipes.service.ts`：recipes 域服务层基础能力、taxonomy 复用和 diff 写入准备

说明：

- 当前尚未接入 `/api/v1/recipes` 路由。
- 当前已具备里程碑 C / D 所需的大部分内部抽象，可直接继续实现 CRUD 与版本管理。
