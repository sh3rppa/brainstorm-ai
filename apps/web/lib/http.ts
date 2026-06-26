import { NextResponse } from "next/server";

export async function readRequestJson(request: Request): Promise<Record<string, unknown>> {
  const text = await request.text();
  if (!text.trim()) return {};

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Request body must be valid JSON.");
  }

  return isRecord(parsed) ? parsed : {};
}

export function jsonError(status: number, message: string): NextResponse<{ error: string }> {
  return NextResponse.json({ error: message }, { status });
}

export function noStoreHeaders(): HeadersInit {
  return { "Cache-Control": "no-store" };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
