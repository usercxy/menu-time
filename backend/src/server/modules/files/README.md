files 模块提供统一文件管理能力，包含：

- `files.schema.ts`：上传授权、资源登记、预览/下载查询的 Zod schema
- `files.service.ts`：上传授权签发、对象校验、文件资源登记、预览/下载签名链接生成
- `files.repository.ts`：`media_assets` 查询与 upsert 封装
- `files.mapper.ts`：文件资源 DTO 映射
- `files.types.ts`：模块内复用类型
