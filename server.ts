import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

type SessionStatus = "draft" | "recording" | "processing" | "done";

type Idea = {
  title: string;
  detail: string;
  priority: "High" | "Medium" | "Low";
};

type AiOutput = {
  summary: string;
  keyIdeas: Idea[];
  actionItems: string[];
  diagram: { nodes: string[]; edges: [number, number][] };
  code: string;
  projectBrief: string;
  suggestedNextSteps: string[];
};

type BrainstormSession = {
  id: string;
  title: string;
  status: SessionStatus;
  durationSeconds: number;
  notes: string[];
  canvasData: string | null;
  transcript: string;
  aiOutput: AiOutput | null;
  createdAt: string;
  updatedAt: string;
};

const root = fileURLToPath(new URL(".", import.meta.url));
const publicDir = join(root, "public");
const dataDir = join(root, "data");
const dataFile = join(dataDir, "sessions.local.json");const port = Number(process.env.PORT ?? 4173);

const mimeTypes: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

const sampleSessions: BrainstormSession[] = [
  {
    id: "sample-product-launch",
    title: "Creator launch workspace",
    status: "done",
    durationSeconds: 1482,
    notes: ["Help small creator teams turn campaign ideas into a launch plan.", "Prioritize momentum and clear ownership."],
    canvasData: null,
    transcript: "A launch workspace for small creator teams. It should turn scattered campaign ideas into a clear plan with owners, milestones, and reusable launch templates.",
    aiOutput: buildOutput("Creator launch workspace", ["Help small creator teams turn campaign ideas into a launch plan.", "Prioritize momentum and clear ownership."]),
    createdAt: "2026-06-12T09:15:00.000Z",
    updatedAt: "2026-06-12T09:41:00.000Z",
  },
  {
    id: "sample-onboarding",
    title: "New customer onboarding",
    status: "done",
    durationSeconds: 956,
    notes: ["Reduce the time from signup to first successful workflow.", "Use a guided checklist with progress signals."],
    canvasData: null,
    transcript: "We need a calmer onboarding experience that guides a new customer to their first useful result without overwhelming them.",
    aiOutput: buildOutput("New customer onboarding", ["Reduce the time from signup to first successful workflow.", "Use a guided checklist with progress signals."]),
    createdAt: "2026-06-10T14:20:00.000Z",
    updatedAt: "2026-06-10T14:37:00.000Z",
  },
];

function buildOutput(title: string, notes: string[]): AiOutput {
  const source = notes.filter(Boolean);
  const focus = source[0] ?? `Turn the ${title.toLowerCase()} concept into a focused, testable product.`;
  const supporting = source[1] ?? "Keep the first version simple, useful, and easy to validate.";
  return {
    summary: `${title} is a focused product concept built around one clear outcome: ${lowercaseFirst(focus)} The strongest direction is to begin with a compact workflow, learn from real usage, and expand only after the core experience proves valuable.`,
    keyIdeas: [
      { title: "Lead with the core outcome", detail: focus, priority: "High" },
      { title: "Make progress visible", detail: supporting, priority: "High" },
      { title: "Validate before expanding", detail: "Test the smallest complete workflow with a focused group of early users.", priority: "Medium" },
      { title: "Build a repeatable loop", detail: "Capture feedback after every completed workflow and use it to improve the next iteration.", priority: "Low" },
    ],
    actionItems: [
      "Write the one-sentence product promise and success metric.",
      "Create a clickable first-flow prototype.",
      "Recruit five target users for a structured usability test.",
      "Review findings and commit to the next two-week milestone.",
    ],
    diagram: {
      nodes: ["Raw idea", "Focused brief", "Prototype", "User test", "Next iteration"],
      edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 1]],
    },
    code: `type Experiment = {\n  hypothesis: string;\n  successMetric: string;\n  status: "planned" | "running" | "complete";\n};\n\nexport function prioritize(experiments: Experiment[]) {\n  return experiments.filter((item) => item.status !== "complete");\n}`,
    projectBrief: `Build an initial version of ${title} that helps the target user complete one meaningful workflow with confidence. The product should feel calm, direct, and easy to understand. The MVP will be considered successful when users can reach the core outcome without assistance and clearly understand what to do next.`,
    suggestedNextSteps: [
      "Confirm the primary user and their highest-friction moment.",
      "Turn the core workflow into a five-screen prototype.",
      "Define one behavior metric and one satisfaction metric.",
    ],
  };
}

function lowercaseFirst(value: string): string {
  return value ? value[0].toLowerCase() + value.slice(1) : value;
}

async function ensureData(): Promise<void> {
  await mkdir(dataDir, { recursive: true });
  try {
    await stat(dataFile);
  } catch {
    await writeSessions(sampleSessions);
  }
}

async function readSessions(): Promise<BrainstormSession[]> {
  await ensureData();
  return JSON.parse(await readFile(dataFile, "utf8")) as BrainstormSession[];
}

async function writeSessions(sessions: BrainstormSession[]): Promise<void> {
  await mkdir(dataDir, { recursive: true });
  await writeFile(dataFile, JSON.stringify(sessions, null, 2), "utf8");
}

async function readBody(request: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  if (chunks.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<string, unknown>;
  } catch {
    throw new Error("Request body must be valid JSON.");
  }
}

function sendJson(response: ServerResponse, status: number, value: unknown): void {
  response.writeHead(status, { "Content-Type": mimeTypes[".json"], "Cache-Control": "no-store" });
  response.end(JSON.stringify(value));
}

async function serveFile(response: ServerResponse, pathname: string): Promise<void> {
  const requested = pathname === "/" ? "index.html" : pathname.slice(1);
  const resolved = normalize(join(publicDir, requested));
  if (!resolved.startsWith(publicDir)) {
    sendJson(response, 403, { error: "Forbidden" });
    return;
  }
  try {
    const file = await readFile(resolved);
    response.writeHead(200, { "Content-Type": mimeTypes[extname(resolved)] ?? "application/octet-stream" });
    response.end(file);
  } catch {
    try {
      const index = await readFile(join(publicDir, "index.html"));
      response.writeHead(200, { "Content-Type": mimeTypes[".html"] });
      response.end(index);
    } catch {
      sendJson(response, 404, { error: "Not found" });
    }
  }
}

function sanitizeText(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim().slice(0, 2000) : fallback;
}

async function handleApi(request: IncomingMessage, response: ServerResponse, pathname: string): Promise<void> {
  const method = request.method ?? "GET";
  const sessions = await readSessions();
  const parts = pathname.split("/").filter(Boolean);
  const sessionId = parts[2];
  const action = parts[3];

  if (pathname === "/api/health" && method === "GET") {
    sendJson(response, 200, { ok: true, service: "brainstorm-ai", timestamp: new Date().toISOString() });
    return;
  }

  if (pathname === "/api/sessions" && method === "GET") {
    sendJson(response, 200, sessions.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    return;
  }

  if (pathname === "/api/sessions" && method === "POST") {
    const body = await readBody(request);
    const now = new Date().toISOString();
    const session: BrainstormSession = {
      id: randomUUID(),
      title: sanitizeText(body.title, "Untitled brainstorm") || "Untitled brainstorm",
      status: "draft",
      durationSeconds: 0,
      notes: [],
      canvasData: null,
      transcript: "",
      aiOutput: null,
      createdAt: now,
      updatedAt: now,
    };
    sessions.push(session);
    await writeSessions(sessions);
    sendJson(response, 201, session);
    return;
  }

  const index = sessions.findIndex((session) => session.id === sessionId);
  if (index < 0) {
    sendJson(response, 404, { error: "Session not found" });
    return;
  }

  if (parts.length === 3 && method === "GET") {
    sendJson(response, 200, sessions[index]);
    return;
  }

  if (parts.length === 3 && method === "DELETE") {
    sessions.splice(index, 1);
    await writeSessions(sessions);
    sendJson(response, 200, { deleted: true });
    return;
  }

  if (parts.length === 3 && method === "PATCH") {
    const body = await readBody(request);
    const current = sessions[index];
    sessions[index] = {
      ...current,
      title: sanitizeText(body.title, current.title) || current.title,
      status: ["draft", "recording", "processing", "done"].includes(String(body.status)) ? String(body.status) as SessionStatus : current.status,
      durationSeconds: Number.isFinite(body.durationSeconds) ? Math.max(0, Number(body.durationSeconds)) : current.durationSeconds,
      notes: Array.isArray(body.notes) ? body.notes.map((note) => sanitizeText(note)).filter(Boolean).slice(0, 30) : current.notes,
      canvasData: typeof body.canvasData === "string" ? body.canvasData.slice(0, 4_000_000) : current.canvasData,
      updatedAt: new Date().toISOString(),
    };
    await writeSessions(sessions);
    sendJson(response, 200, sessions[index]);
    return;
  }

  if (action === "audio" && method === "POST") {
    sendJson(response, 202, { accepted: true, retainedUntil: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString() });
    return;
  }

  if (action === "canvas" && method === "POST") {
    const body = await readBody(request);
    sessions[index].canvasData = typeof body.canvasData === "string" ? body.canvasData.slice(0, 4_000_000) : sessions[index].canvasData;
    sessions[index].updatedAt = new Date().toISOString();
    await writeSessions(sessions);
    sendJson(response, 200, { saved: true });
    return;
  }

  if (action === "finalize" && method === "POST") {
    const body = await readBody(request);
    const current = sessions[index];
    current.notes = Array.isArray(body.notes) ? body.notes.map((note) => sanitizeText(note)).filter(Boolean).slice(0, 30) : current.notes;
    current.canvasData = typeof body.canvasData === "string" ? body.canvasData.slice(0, 4_000_000) : current.canvasData;
    current.durationSeconds = Number.isFinite(body.durationSeconds) ? Math.max(0, Number(body.durationSeconds)) : current.durationSeconds;
    current.transcript = current.notes.length > 0 ? current.notes.join(" ") : `Brainstorming session for ${current.title}.`;
    current.status = "processing";
    current.updatedAt = new Date().toISOString();
    await writeSessions(sessions);
    setTimeout(async () => {
      const latest = await readSessions();
      const processing = latest.find((session) => session.id === sessionId);
      if (!processing || processing.status !== "processing") return;
      processing.aiOutput = buildOutput(processing.title, processing.notes);
      processing.status = "done";
      processing.updatedAt = new Date().toISOString();
      await writeSessions(latest);
    }, 1800);
    sendJson(response, 202, current);
    return;
  }

  sendJson(response, 404, { error: "Endpoint not found" });
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
    if (url.pathname.startsWith("/api/")) {
      await handleApi(request, response, url.pathname);
    } else {
      await serveFile(response, url.pathname);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    sendJson(response, message.includes("valid JSON") ? 400 : 500, { error: message });
  }
});

await ensureData();
server.listen(port, () => {
  console.log(`Brainstorm AI is running at http://localhost:${port}`);
});
