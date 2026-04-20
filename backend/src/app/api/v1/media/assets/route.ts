import { createRouteHandler } from "@/server/lib/api/route-handler";
import { mediaAssetRegisterBodySchema } from "@/server/modules/media/media.schema";
import * as mediaService from "@/server/modules/media/media.service";

export const POST = createRouteHandler({
  schemas: {
    body: mediaAssetRegisterBodySchema,
  },
  handler: async ({ session, body }) =>
    mediaService.registerAsset({
      session,
      data: body,
    }),
});
