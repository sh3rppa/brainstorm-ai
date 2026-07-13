import { Prisma, type Session as SessionRecord } from "@prisma/client";

import { getPrisma } from "@/lib/prisma";
import type { AiOutput, BrainstormSession, Idea, IdeaPriority, SessionStatus } from "@/types/domain";

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

export async function listSessions(): Promise<BrainstormSession[]> {
  const sessions = await getPrisma().session.findMany({
    orderBy: { updatedAt: "desc" },
  });
  return sessions.map(toBrainstormSession);
}

export async function getSession(id: string): Promise<BrainstormSession | null> {
  const session = await getPrisma().session.findUnique({ where: { id } });
  return session ? toBrainstormSession(session) : null;
}

export async function createSession(input: CreateSessionInput): Promise<BrainstormSession> {
  const session = await getPrisma().session.create({
    data: {
      title: sanitizeText(input.title, "Untitled brainstorm") || "Untitled brainstorm",
      status: "draft",
      durationSeconds: 0,
      notes: [],
      canvasData: null,
      transcript: "",
    },
  });
  return toBrainstormSession(session);
}

export async function updateSession(id: string, input: UpdateSessionInput): Promise<BrainstormSession | null> {
  const data: Prisma.SessionUpdateInput = {};

  if (input.title !== undefined) {
    data.title = sanitizeText(input.title, "Untitled brainstorm") || "Untitled brainstorm";
  }
  if (input.durationSeconds !== undefined) data.durationSeconds = sanitizeDuration(input.durationSeconds);
  if (input.status && validStatuses.has(input.status)) data.status = input.status;
  if (input.notes) data.notes = sanitizeNotes(input.notes) as Prisma.InputJsonValue;
  if (input.canvasData !== undefined) {
    data.canvasData = typeof input.canvasData === "string" ? input.canvasData.slice(0, 4_000_000) : null;
  }

  try {
    const session = await getPrisma().session.update({
      where: { id },
      data,
    });
    return toBrainstormSession(session);
  } catch (error) {
    if (isRecordNotFound(error)) return null;
    throw error;
  }
}

export async function deleteSession(id: string): Promise<boolean> {
  const result = await getPrisma().session.deleteMany({ where: { id } });
  return result.count > 0;
}

export async function finalizeSession(
  id: string,
  input: FinalizeSessionInput,
): Promise<BrainstormSession | null> {
  return getPrisma().$transaction(async (tx) => {
    const current = await tx.session.findUnique({ where: { id } });
    if (!current) return null;

    const currentSession = toBrainstormSession(current);
    const notes = input.notes ? sanitizeNotes(input.notes) : currentSession.notes;
    const durationSeconds =
      input.durationSeconds === undefined ? currentSession.durationSeconds : sanitizeDuration(input.durationSeconds);
    const canvasData =
      input.canvasData === undefined
        ? currentSession.canvasData
        : typeof input.canvasData === "string"
          ? input.canvasData.slice(0, 4_000_000)
          : null;

    const session = await tx.session.update({
      where: { id },
      data: {
        notes: notes as Prisma.InputJsonValue,
        durationSeconds,
        canvasData,
        transcript: notes.length > 0 ? notes.join(" ") : `Brainstorming session for ${currentSession.title}.`,
        aiOutput: buildOutput(currentSession.title, notes) as unknown as Prisma.InputJsonValue,
        status: "done",
      },
    });

    return toBrainstormSession(session);
  });
}

export async function completeProcessingSession(id: string): Promise<void> {
  await wait(1800);
  const current = await getPrisma().session.findUnique({ where: { id } });
  if (!current || current.status !== "processing") return;

  const session = toBrainstormSession(current);
  await getPrisma().session.update({
    where: { id },
    data: {
      aiOutput: buildOutput(session.title, session.notes) as unknown as Prisma.InputJsonValue,
      status: "done",
    },
  });
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

function toBrainstormSession(session: SessionRecord): BrainstormSession {
  return {
    id: session.id,
    title: session.title,
    status: statusFromDatabase(session.status),
    durationSeconds: session.durationSeconds,
    notes: notesFromJsonValue(session.notes),
    canvasData: session.canvasData,
    transcript: session.transcript,
    aiOutput: aiOutputFromJsonValue(session.aiOutput),
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
  };
}

function statusFromDatabase(value: string): SessionStatus {
  return validStatuses.has(value as SessionStatus) ? (value as SessionStatus) : "draft";
}

function notesFromJsonValue(value: Prisma.JsonValue): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function aiOutputFromJsonValue(value: Prisma.JsonValue | null): AiOutput | null {
  if (!isRecord(value)) return null;

  const summary = typeof value.summary === "string" ? value.summary : null;
  const keyIdeas = Array.isArray(value.keyIdeas)
    ? value.keyIdeas.map(ideaFromJsonValue).filter((idea): idea is Idea => idea !== null)
    : null;
  const actionItems = stringArrayFromJsonValue(value.actionItems);
  const diagram = diagramFromJsonValue(value.diagram);
  const code = typeof value.code === "string" ? value.code : null;
  const projectBrief = typeof value.projectBrief === "string" ? value.projectBrief : null;
  const suggestedNextSteps = stringArrayFromJsonValue(value.suggestedNextSteps);

  if (!summary || !keyIdeas || !actionItems || !diagram || !code || !projectBrief || !suggestedNextSteps) return null;

  return {
    summary,
    keyIdeas,
    actionItems,
    diagram,
    code,
    projectBrief,
    suggestedNextSteps,
  };
}

function ideaFromJsonValue(value: unknown): Idea | null {
  if (!isRecord(value)) return null;
  const priority = value.priority;
  if (priority !== "High" && priority !== "Medium" && priority !== "Low") return null;
  if (typeof value.title !== "string" || typeof value.detail !== "string") return null;
  return { title: value.title, detail: value.detail, priority: priority as IdeaPriority };
}

function diagramFromJsonValue(value: unknown): AiOutput["diagram"] | null {
  if (!isRecord(value)) return null;
  const nodes = stringArrayFromJsonValue(value.nodes);
  const edges = Array.isArray(value.edges)
    ? value.edges
        .map((edge) =>
          Array.isArray(edge) && edge.length === 2 && typeof edge[0] === "number" && typeof edge[1] === "number"
            ? ([edge[0], edge[1]] as [number, number])
            : null,
        )
        .filter((edge): edge is [number, number] => edge !== null)
    : null;
  return nodes && edges ? { nodes, edges } : null;
}

function stringArrayFromJsonValue(value: unknown): string[] | null {
  return Array.isArray(value) && value.every((item) => typeof item === "string") ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isRecordNotFound(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025";
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
