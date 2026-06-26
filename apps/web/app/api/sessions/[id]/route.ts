import { NextResponse } from "next/server";

import { jsonError, noStoreHeaders, readRequestJson } from "@/lib/http";
import { deleteSession, getSession, normalizeUpdateInput, updateSession } from "@/lib/sessions";

type SessionRouteContext = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request: Request, context: SessionRouteContext): Promise<NextResponse> {
  const { id } = await context.params;
  const session = await getSession(id);
  if (!session) return jsonError(404, "Session not found");
  return NextResponse.json(session, { headers: noStoreHeaders() });
}

export async function PATCH(request: Request, context: SessionRouteContext): Promise<NextResponse> {
  try {
    const { id } = await context.params;
    const body = await readRequestJson(request);
    const session = await updateSession(id, normalizeUpdateInput(body));
    if (!session) return jsonError(404, "Session not found");
    return NextResponse.json(session, { headers: noStoreHeaders() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return jsonError(message.includes("valid JSON") ? 400 : 500, message);
  }
}

export async function DELETE(_request: Request, context: SessionRouteContext): Promise<NextResponse> {
  const { id } = await context.params;
  const deleted = await deleteSession(id);
  if (!deleted) return jsonError(404, "Session not found");
  return NextResponse.json({ deleted: true }, { headers: noStoreHeaders() });
}
