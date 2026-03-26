# Module Template

每个业务模块默认包含以下文件：

- `*.service.ts`：业务规则、事务边界、跨仓储编排
- `*.repository.ts`：Prisma 查询与写入封装
- `*.schema.ts`：Zod 输入校验与 DTO 结构
- `*.mapper.ts`：输出 DTO 映射
- `*.types.ts`：模块内复用类型

阶段 0 先完成 `auth` 模块实现，其余业务目录保留骨架待后续阶段扩展。
