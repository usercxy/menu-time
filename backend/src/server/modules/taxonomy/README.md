taxonomy 模块已用于分类与标签能力，包含以下文件：

- `taxonomy.types.ts`：模块内输入输出类型
- `taxonomy.schema.ts`：Zod 参数校验
- `taxonomy.repository.ts`：带 `householdId` 约束的数据访问
- `taxonomy.mapper.ts`：分类/标签 DTO 映射
- `taxonomy.service.ts`：业务规则、冲突校验、重排和软删除逻辑
