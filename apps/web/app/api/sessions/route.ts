import { NextResponse } from "next/server";

import { jsonError, noStoreHeaders, readRequestJson } from "@/lib/http";
import { createSession, listSessions, normalizeCreateInput } from "@/lib/sessions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(await listSessions(), { headers: noStoreHeaders() });
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await readRequestJson(request);
    const session = await createSession(normalizeCreateInput(body));
    return NextResponse.json(session, { status: 201, headers: noStoreHeaders() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return jsonError(message.includes("valid JSON") ? 400 : 500, message);
  }
}
