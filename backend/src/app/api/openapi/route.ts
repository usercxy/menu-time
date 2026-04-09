import { NextResponse } from "next/server";

import { buildOpenApiDocument } from "@/server/lib/openapi/spec";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(buildOpenApiDocument());
}
