import { createRouteHandler } from "@/server/lib/api/route-handler";
import {
  fileDownloadQuerySchema,
  fileIdParamSchema,
} from "@/server/modules/files/files.schema";
import * as filesService from "@/server/modules/files/files.service";

export const GET = createRouteHandler({
  schemas: {
    params: fileIdParamSchema,
    query: fileDownloadQuerySchema,
  },
  handler: async ({ session, params, query }) =>
    filesService.createDownloadUrl({
      session,
      data: {
        id: params.id,
        disposition: "attachment",
        fileName: query.filename,
      },
    }),
});
