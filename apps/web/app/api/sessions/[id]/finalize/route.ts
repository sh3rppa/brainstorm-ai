import { NextResponse } from "next/server";

import { jsonError, noStoreHeaders, readRequestJson } from "@/lib/http";
import { finalizeSession, normalizeFinalizeInput } from "@/lib/sessions";

type FinalizeRouteContext = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request, context: FinalizeRouteContext): Promise<NextResponse> {
  try {
    const { id } = await context.params;
    const body = await readRequestJson(request);
    const session = await finalizeSession(id, normalizeFinalizeInput(body));

    if (!session) return jsonError(404, "Session not found");

    return NextResponse.json(session, { status: 200, headers: noStoreHeaders() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return jsonError(message.includes("valid JSON") ? 400 : 500, message);
  }
}
