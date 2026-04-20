import { createRouteHandler } from "@/server/lib/api/route-handler";
import { mediaUploadTokenBodySchema } from "@/server/modules/media/media.schema";
import * as mediaService from "@/server/modules/media/media.service";

export const POST = createRouteHandler({
  schemas: {
    body: mediaUploadTokenBodySchema,
  },
  handler: async ({ session, body }) =>
    mediaService.createUploadToken({
      session,
      data: body,
    }),
});
