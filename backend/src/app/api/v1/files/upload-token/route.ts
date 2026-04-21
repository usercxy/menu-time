import { createRouteHandler } from "@/server/lib/api/route-handler";
import { fileUploadTokenBodySchema } from "@/server/modules/files/files.schema";
import * as filesService from "@/server/modules/files/files.service";

export const POST = createRouteHandler({
  schemas: {
    body: fileUploadTokenBodySchema,
  },
  handler: async ({ session, body }) =>
    filesService.createUploadToken({
      session,
      data: body,
    }),
});
