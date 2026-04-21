import { z, type ZodTypeAny } from "zod";

import { errorCodes } from "@/server/lib/errors";
import { getEnv } from "@/server/lib/env";
import {
  logoutBodySchema,
  refreshTokenBodySchema,
  wechatLoginBodySchema,
} from "@/server/modules/auth/auth.schema";
import {
  fileAssetRegisterBodySchema,
  fileDownloadQuerySchema,
  fileIdParamSchema,
  fileUploadTokenBodySchema,
} from "@/server/modules/files/files.schema";
import {
  recipeCompareQuerySchema,
  recipeCreateBodySchema,
  recipeIdParamSchema,
  recipeListQuerySchema,
  recipeUpdateBodySchema,
  recipeVersionCreateBodySchema,
  recipeVersionParamsSchema,
  recipeVersionsListQuerySchema,
} from "@/server/modules/recipes/recipes.schema";
import {
  categoryCreateBodySchema,
  categoryUpdateBodySchema,
  tagCreateBodySchema,
  tagUpdateBodySchema,
  taxonomyIdParamSchema,
  taxonomyListQuerySchema,
  taxonomyReorderBodySchema,
} from "@/server/modules/taxonomy/taxonomy.schema";

type HttpMethod = "get" | "post" | "patch" | "delete";
type AuthMode = "public" | "required";

type OperationDefinition = {
  method: HttpMethod;
  path: string;
  tag: string;
  summary: string;
  description?: string;
  auth?: AuthMode;
  successStatus?: number;
  bodySchema?: ZodTypeAny;
  querySchema?: ZodTypeAny;
  paramsSchema?: ZodTypeAny;
};

type JsonSchema = Record<string, unknown>;
type OpenApiParameter = {
  name: string;
  in: "path" | "query";
  required: boolean;
  description?: string;
  schema: JsonSchema;
};

const successEnvelopeSchema = {
  type: "object",
  required: ["success", "data", "requestId"],
  properties: {
    success: {
      type: "boolean",
      enum: [true],
    },
    data: {
      description: "接口返回数据。当前先以宽松结构展示，便于逐步补齐精确响应模型。",
      oneOf: [
        { type: "object", additionalProperties: true },
        { type: "array", items: { type: "object", additionalProperties: true } },
        { type: "string" },
        { type: "number" },
        { type: "integer" },
        { type: "boolean" },
        { type: "null" },
      ],
    },
    requestId: {
      type: "string",
    },
  },
} satisfies JsonSchema;

const errorEnvelopeSchema = {
  type: "object",
  required: ["success", "error", "requestId"],
  properties: {
    success: {
      type: "boolean",
      enum: [false],
    },
    error: {
      type: "object",
      required: ["code", "message"],
      properties: {
        code: {
          type: "string",
          enum: Object.values(errorCodes),
        },
        message: {
          type: "string",
        },
        details: {},
      },
    },
    requestId: {
      type: "string",
    },
  },
} satisfies JsonSchema;

const operations: OperationDefinition[] = [
  {
    method: "post",
    path: "/api/v1/auth/wechat-login",
    tag: "Auth",
    summary: "微信登录",
    auth: "public",
    bodySchema: wechatLoginBodySchema,
  },
  {
    method: "post",
    path: "/api/v1/auth/refresh",
    tag: "Auth",
    summary: "刷新会话",
    auth: "public",
    bodySchema: refreshTokenBodySchema,
  },
  {
    method: "post",
    path: "/api/v1/auth/logout",
    tag: "Auth",
    summary: "退出登录",
    auth: "public",
    bodySchema: logoutBodySchema,
  },
  {
    method: "get",
    path: "/api/v1/auth/session",
    tag: "Auth",
    summary: "获取当前会话",
    auth: "required",
  },
  {
    method: "get",
    path: "/api/v1/categories",
    tag: "Categories",
    summary: "获取分类列表",
    auth: "required",
    querySchema: taxonomyListQuerySchema,
  },
  {
    method: "post",
    path: "/api/v1/categories",
    tag: "Categories",
    summary: "创建分类",
    auth: "required",
    bodySchema: categoryCreateBodySchema,
  },
  {
    method: "patch",
    path: "/api/v1/categories/{id}",
    tag: "Categories",
    summary: "更新分类",
    auth: "required",
    paramsSchema: taxonomyIdParamSchema,
    bodySchema: categoryUpdateBodySchema,
  },
  {
    method: "delete",
    path: "/api/v1/categories/{id}",
    tag: "Categories",
    summary: "删除分类",
    auth: "required",
    paramsSchema: taxonomyIdParamSchema,
  },
  {
    method: "post",
    path: "/api/v1/categories/reorder",
    tag: "Categories",
    summary: "重排分类",
    auth: "required",
    bodySchema: taxonomyReorderBodySchema,
  },
  {
    method: "get",
    path: "/api/v1/tags",
    tag: "Tags",
    summary: "获取标签列表",
    auth: "required",
    querySchema: taxonomyListQuerySchema,
  },
  {
    method: "post",
    path: "/api/v1/tags",
    tag: "Tags",
    summary: "创建标签",
    auth: "required",
    bodySchema: tagCreateBodySchema,
  },
  {
    method: "patch",
    path: "/api/v1/tags/{id}",
    tag: "Tags",
    summary: "更新标签",
    auth: "required",
    paramsSchema: taxonomyIdParamSchema,
    bodySchema: tagUpdateBodySchema,
  },
  {
    method: "delete",
    path: "/api/v1/tags/{id}",
    tag: "Tags",
    summary: "删除标签",
    auth: "required",
    paramsSchema: taxonomyIdParamSchema,
  },
  {
    method: "get",
    path: "/api/v1/recipes",
    tag: "Recipes",
    summary: "获取菜谱列表",
    auth: "required",
    querySchema: recipeListQuerySchema,
  },
  {
    method: "post",
    path: "/api/v1/recipes",
    tag: "Recipes",
    summary: "创建菜谱",
    auth: "required",
    successStatus: 201,
    bodySchema: recipeCreateBodySchema,
  },
  {
    method: "get",
    path: "/api/v1/recipes/{id}",
    tag: "Recipes",
    summary: "获取菜谱详情",
    auth: "required",
    paramsSchema: recipeIdParamSchema,
  },
  {
    method: "patch",
    path: "/api/v1/recipes/{id}",
    tag: "Recipes",
    summary: "更新菜谱",
    auth: "required",
    paramsSchema: recipeIdParamSchema,
    bodySchema: recipeUpdateBodySchema,
  },
  {
    method: "delete",
    path: "/api/v1/recipes/{id}",
    tag: "Recipes",
    summary: "删除菜谱",
    auth: "required",
    paramsSchema: recipeIdParamSchema,
  },
  {
    method: "get",
    path: "/api/v1/recipes/{id}/versions",
    tag: "Recipe Versions",
    summary: "获取菜谱版本列表",
    auth: "required",
    paramsSchema: recipeIdParamSchema,
    querySchema: recipeVersionsListQuerySchema,
  },
  {
    method: "post",
    path: "/api/v1/recipes/{id}/versions",
    tag: "Recipe Versions",
    summary: "创建菜谱版本",
    auth: "required",
    successStatus: 201,
    paramsSchema: recipeIdParamSchema,
    bodySchema: recipeVersionCreateBodySchema,
  },
  {
    method: "get",
    path: "/api/v1/recipes/{id}/versions/{versionId}",
    tag: "Recipe Versions",
    summary: "获取菜谱版本详情",
    auth: "required",
    paramsSchema: recipeVersionParamsSchema,
  },
  {
    method: "post",
    path: "/api/v1/recipes/{id}/versions/{versionId}/set-current",
    tag: "Recipe Versions",
    summary: "切换当前版本",
    auth: "required",
    paramsSchema: recipeVersionParamsSchema,
  },
  {
    method: "get",
    path: "/api/v1/recipes/{id}/compare",
    tag: "Recipe Versions",
    summary: "比较两个版本",
    auth: "required",
    paramsSchema: recipeIdParamSchema,
    querySchema: recipeCompareQuerySchema,
  },
  {
    method: "post",
    path: "/api/v1/files/upload-token",
    tag: "Files",
    summary: "创建文件上传授权",
    auth: "required",
    bodySchema: fileUploadTokenBodySchema,
  },
  {
    method: "post",
    path: "/api/v1/files/assets",
    tag: "Files",
    summary: "登记已上传文件资源",
    auth: "required",
    bodySchema: fileAssetRegisterBodySchema,
  },
  {
    method: "get",
    path: "/api/v1/files/{id}/preview",
    tag: "Files",
    summary: "获取文件预览链接",
    auth: "required",
    paramsSchema: fileIdParamSchema,
  },
  {
    method: "get",
    path: "/api/v1/files/{id}/download",
    tag: "Files",
    summary: "获取文件下载链接",
    auth: "required",
    paramsSchema: fileIdParamSchema,
    querySchema: fileDownloadQuerySchema,
  },
];

function toOpenApiSchema(schema: ZodTypeAny) {
  return z.toJSONSchema(schema, {
    io: "input",
    unrepresentable: "any",
  }) as JsonSchema;
}

function schemaToParameters(
  schema: ZodTypeAny | undefined,
  location: "path" | "query",
) {
  if (!schema) {
    return [] as OpenApiParameter[];
  }

  const jsonSchema = toOpenApiSchema(schema);
  const properties =
    "properties" in jsonSchema && typeof jsonSchema.properties === "object" && jsonSchema.properties
      ? (jsonSchema.properties as Record<string, JsonSchema>)
      : {};
  const required =
    "required" in jsonSchema && Array.isArray(jsonSchema.required) ? jsonSchema.required : [];

  return Object.entries(properties).map(([name, propertySchema]) => ({
    name,
    in: location,
    required: location === "path" ? true : required.includes(name),
    description:
      typeof propertySchema.description === "string" ? propertySchema.description : undefined,
    schema: propertySchema,
  }));
}

function createOperation(operation: OperationDefinition) {
  const parameters = [
    ...schemaToParameters(operation.paramsSchema, "path"),
    ...schemaToParameters(operation.querySchema, "query"),
  ];

  const responses: Record<string, { description: string; content?: Record<string, unknown> }> = {
    [String(operation.successStatus ?? 200)]: {
      description: "请求成功",
      content: {
        "application/json": {
          schema: successEnvelopeSchema,
        },
      },
    },
    400: {
      description: "请求参数校验失败",
      content: {
        "application/json": {
          schema: errorEnvelopeSchema,
        },
      },
    },
    401: {
      description: "未登录或令牌失效",
      content: {
        "application/json": {
          schema: errorEnvelopeSchema,
        },
      },
    },
    404: {
      description: "资源不存在",
      content: {
        "application/json": {
          schema: errorEnvelopeSchema,
        },
      },
    },
    409: {
      description: "资源冲突",
      content: {
        "application/json": {
          schema: errorEnvelopeSchema,
        },
      },
    },
    500: {
      description: "服务器内部错误",
      content: {
        "application/json": {
          schema: errorEnvelopeSchema,
        },
      },
    },
  };

  const requestBody = operation.bodySchema
    ? {
        required: true,
        content: {
          "application/json": {
            schema: toOpenApiSchema(operation.bodySchema),
          },
        },
      }
    : undefined;

  return {
    tags: [operation.tag],
    summary: operation.summary,
    description: operation.description,
    ...(parameters.length > 0 ? { parameters } : {}),
    ...(requestBody ? { requestBody } : {}),
    responses,
    ...(operation.auth === "required" ? { security: [{ bearerAuth: [] }] } : {}),
  };
}

export function buildOpenApiDocument() {
  const env = getEnv();
  const paths: Record<string, Record<string, unknown>> = {};

  for (const operation of operations) {
    if (!paths[operation.path]) {
      paths[operation.path] = {};
    }

    paths[operation.path][operation.method] = createOperation(operation);
  }

  return {
    openapi: "3.1.0",
    info: {
      title: `${env.APP_NAME} API`,
      version: "0.1.0",
      description: "Menu Time backend OpenAPI 文档。",
    },
    servers: [
      {
        url: env.APP_BASE_URL,
      },
    ],
    tags: [
      { name: "Auth" },
      { name: "Categories" },
      { name: "Tags" },
      { name: "Recipes" },
      { name: "Recipe Versions" },
      { name: "Files" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    paths,
  };
}
