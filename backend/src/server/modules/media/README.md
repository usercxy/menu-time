media 模块当前提供菜谱封面上传所需的基础能力，包含：

- `media.schema.ts`：上传授权与资源登记接口的 Zod schema
- `media.service.ts`：上传授权签发、对象校验、媒体资源登记
- `media.repository.ts`：`media_assets` 查询与 upsert 封装
- `media.mapper.ts`：媒体资源 DTO 映射
- `media.types.ts`：模块内复用类型
