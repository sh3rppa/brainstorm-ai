import { randomUUID } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { join, sep } from "node:path";

import type { AiOutput, BrainstormSession, SessionStatus } from "@/types/domain";

export type CreateSessionInput = {
  title?: string;
};

export type UpdateSessionInput = {
  title?: string;
  status?: SessionStatus;
  durationSeconds?: number;
  notes?: string[];
  canvasData?: string | null;
};

export type FinalizeSessionInput = {
  notes?: string[];
  durationSeconds?: number;
  canvasData?: string | null;
};

const validStatuses = new Set<SessionStatus>(["draft", "recording", "processing", "done"]);
const root = process.cwd().endsWith(`${sep}apps${sep}web`) ? join(process.cwd(), "..", "..") : process.cwd();
const isVercel = Boolean(process.env.VERCEL);
const dataDir = process.env.BRAINSTORM_DATA_DIR ?? (isVercel ? "/tmp/brainstorm-ai-data" : join(root, "data"));
const dataFile = join(dataDir, "sessions.json");

const sampleSessions: BrainstormSession[] = [
  {
    id: "sample-product-launch",
    title: "Creator launch workspace",
    status: "done",
    durationSeconds: 1482,
    notes: [
      "Help small creator teams turn campaign ideas into a launch plan.",
      "Prioritize momentum and clear ownership.",
    ],
    canvasData: null,
    transcript:
      "A launch workspace for small creator teams. It should turn scattered campaign ideas into a clear plan with owners, milestones, and reusable launch templates.",
    aiOutput: buildOutput("Creator launch workspace", [
      "Help small creator teams turn campaign ideas into a launch plan.",
      "Prioritize momentum and clear ownership.",
    ]),
    createdAt: "2026-06-12T09:15:00.000Z",
    updatedAt: "2026-06-12T09:41:00.000Z",
  },
  {
    id: "sample-onboarding",
    title: "New customer onboarding",
    status: "done",
    durationSeconds: 956,
    notes: [
      "Reduce the time from signup to first successful workflow.",
      "Use a guided checklist with progress signals.",
    ],
    canvasData: null,
    transcript:
      "We need a calmer onboarding experience that guides a new customer to their first useful result without overwhelming them.",
    aiOutput: buildOutput("New customer onboarding", [
      "Reduce the time from signup to first successful workflow.",
      "Use a guided checklist with progress signals.",
    ]),
    createdAt: "2026-06-10T14:20:00.000Z",
    updatedAt: "2026-06-10T14:37:00.000Z",
  },
];

export async function listSessions(): Promise<BrainstormSession[]> {
  const sessions = await readSessions();
  return [...sessions].sort((first, second) => second.updatedAt.localeCompare(first.updatedAt));
}

export async function getSession(id: string): Promise<BrainstormSession | null> {
  const sessions = await readSessions();
  return sessions.find((session) => session.id === id) ?? null;
}

export async function createSession(input: CreateSessionInput): Promise<BrainstormSession> {
  const sessions = await readSessions();
  const now = new Date().toISOString();
  const session: BrainstormSession = {
    id: randomUUID(),
    title: sanitizeText(input.title, "Untitled brainstorm") || "Untitled brainstorm",
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
  return session;
}

export async function updateSession(id: string, input: UpdateSessionInput): Promise<BrainstormSession | null> {
  const sessions = await readSessions();
  const index = sessions.findIndex((session) => session.id === id);
  if (index < 0) return null;

  const current = sessions[index];
  const title = input.title === undefined ? current.title : sanitizeText(input.title, current.title) || current.title;
  const durationSeconds =
    input.durationSeconds === undefined ? current.durationSeconds : sanitizeDuration(input.durationSeconds);
  const status = input.status && validStatuses.has(input.status) ? input.status : current.status;
  const canvasData =
    input.canvasData === undefined
      ? current.canvasData
      : typeof input.canvasData === "string"
        ? input.canvasData.slice(0, 4_000_000)
        : null;

  sessions[index] = {
    ...current,
    title,
    status,
    durationSeconds,
    notes: input.notes ? sanitizeNotes(input.notes) : current.notes,
    canvasData,
    updatedAt: new Date().toISOString(),
  };

  await writeSessions(sessions);
  return sessions[index];
}

export async function deleteSession(id: string): Promise<boolean> {
  const sessions = await readSessions();
  const nextSessions = sessions.filter((session) => session.id !== id);
  if (nextSessions.length === sessions.length) return false;
  await writeSessions(nextSessions);
  return true;
}

export async function finalizeSession(
  id: string,
  input: FinalizeSessionInput,
): Promise<BrainstormSession | null> {
  const sessions = await readSessions();
  const index = sessions.findIndex((session) => session.id === id);
  if (index < 0) return null;

  const current = sessions[index];
  const notes = input.notes ? sanitizeNotes(input.notes) : current.notes;
  const durationSeconds =
    input.durationSeconds === undefined ? current.durationSeconds : sanitizeDuration(input.durationSeconds);
  const canvasData =
    input.canvasData === undefined
      ? current.canvasData
      : typeof input.canvasData === "string"
        ? input.canvasData.slice(0, 4_000_000)
        : null;

  sessions[index] = {
    ...current,
    notes,
    durationSeconds,
    canvasData,
    transcript: notes.length > 0 ? notes.join(" ") : `Brainstorming session for ${current.title}.`,
    status: "processing",
    updatedAt: new Date().toISOString(),
  };

  await writeSessions(sessions);
  return sessions[index];
}

export async function completeProcessingSession(id: string): Promise<void> {
  await wait(1800);
  const sessions = await readSessions();
  const index = sessions.findIndex((session) => session.id === id);
  if (index < 0 || sessions[index].status !== "processing") return;

  const current = sessions[index];
  sessions[index] = {
    ...current,
    aiOutput: buildOutput(current.title, current.notes),
    status: "done",
    updatedAt: new Date().toISOString(),
  };
  await writeSessions(sessions);
}

export function buildOutput(title: string, notes: string[]): AiOutput {
  const source = notes.filter(Boolean);
  const focus = source[0] ?? `Turn the ${title.toLowerCase()} concept into a focused, testable product.`;
  const supporting = source[1] ?? "Keep the first version simple, useful, and easy to validate.";

  return {
    summary: `${title} is a focused product concept built around one clear outcome: ${lowercaseFirst(
      focus,
    )} The strongest direction is to begin with a compact workflow, learn from real usage, and expand only after the core experience proves valuable.`,
    keyIdeas: [
      { title: "Lead with the core outcome", detail: focus, priority: "High" },
      { title: "Make progress visible", detail: supporting, priority: "High" },
      {
        title: "Validate before expanding",
        detail: "Test the smallest complete workflow with a focused group of early users.",
        priority: "Medium",
      },
      {
        title: "Build a repeatable loop",
        detail: "Capture feedback after every completed workflow and use it to improve the next iteration.",
        priority: "Low",
      },
    ],
    actionItems: [
      "Write the one-sentence product promise and success metric.",
      "Create a clickable first-flow prototype.",
      "Recruit five target users for a structured usability test.",
      "Review findings and commit to the next two-week milestone.",
    ],
    diagram: {
      nodes: ["Raw idea", "Focused brief", "Prototype", "User test", "Next iteration"],
      edges: [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 4],
        [4, 1],
      ],
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

export function normalizeCreateInput(body: Record<string, unknown>): CreateSessionInput {
  return { title: textFromUnknown(body.title) };
}

export function normalizeUpdateInput(body: Record<string, unknown>): UpdateSessionInput {
  return {
    title: textFromUnknown(body.title),
    status: statusFromUnknown(body.status),
    durationSeconds: numberFromUnknown(body.durationSeconds),
    notes: notesFromUnknown(body.notes),
    canvasData: canvasFromUnknown(body.canvasData),
  };
}

export function normalizeFinalizeInput(body: Record<string, unknown>): FinalizeSessionInput {
  return {
    notes: notesFromUnknown(body.notes),
    durationSeconds: numberFromUnknown(body.durationSeconds),
    canvasData: canvasFromUnknown(body.canvasData),
  };
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
  const parsed: unknown = JSON.parse(await readFile(dataFile, "utf8"));
  return Array.isArray(parsed) ? (parsed as BrainstormSession[]) : [];
}

async function writeSessions(sessions: BrainstormSession[]): Promise<void> {
  await mkdir(dataDir, { recursive: true });
  await writeFile(dataFile, JSON.stringify(sessions, null, 2), "utf8");
}

function sanitizeText(value: string | undefined, fallback = ""): string {
  return typeof value === "string" ? value.trim().slice(0, 2000) : fallback;
}

function sanitizeNotes(notes: string[]): string[] {
  return notes.map((note) => sanitizeText(note)).filter(Boolean).slice(0, 30);
}

function sanitizeDuration(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function lowercaseFirst(value: string): string {
  return value ? value[0].toLowerCase() + value.slice(1) : value;
}

function textFromUnknown(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function numberFromUnknown(value: unknown): number | undefined {
  const numeric = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isFinite(numeric) ? numeric : undefined;
}

function notesFromUnknown(value: unknown): string[] | undefined {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : undefined;
}

function canvasFromUnknown(value: unknown): string | null | undefined {
  if (typeof value === "string") return value;
  if (value === null) return null;
  return undefined;
}

function statusFromUnknown(value: unknown): SessionStatus | undefined {
  return typeof value === "string" && validStatuses.has(value as SessionStatus) ? (value as SessionStatus) : undefined;
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}
