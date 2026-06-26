import { NextResponse } from "next/server";

import { noStoreHeaders } from "@/lib/http";

export const dynamic = "force-dynamic";

export function GET(): NextResponse {
  return NextResponse.json(
    { ok: true, service: "brainstorm-ai", timestamp: new Date().toISOString() },
    { headers: noStoreHeaders() },
  );
}
