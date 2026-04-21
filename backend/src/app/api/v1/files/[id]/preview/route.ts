import { createRouteHandler } from "@/server/lib/api/route-handler";
import { fileIdParamSchema } from "@/server/modules/files/files.schema";
import * as filesService from "@/server/modules/files/files.service";

export const GET = createRouteHandler({
  schemas: {
    params: fileIdParamSchema,
  },
  handler: async ({ session, params }) =>
    filesService.createPreviewUrl({
      session,
      data: {
        id: params.id,
        disposition: "inline",
      },
    }),
});
