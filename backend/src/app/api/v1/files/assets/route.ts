import { createRouteHandler } from "@/server/lib/api/route-handler";
import { fileAssetRegisterBodySchema } from "@/server/modules/files/files.schema";
import * as filesService from "@/server/modules/files/files.service";

export const POST = createRouteHandler({
  schemas: {
    body: fileAssetRegisterBodySchema,
  },
  handler: async ({ session, body }) =>
    filesService.registerAsset({
      session,
      data: body,
    }),
});
