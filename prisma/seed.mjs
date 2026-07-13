import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const databaseUrl =
  process.env.DATABASE_URL_UNPOOLED ??
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.DIRECT_URL ??
  process.env.POSTGRES_DIRECT_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.DATABASE_URL ??
  process.env.POSTGRES_URL;

if (!databaseUrl) {
  throw new Error("Database URL is not configured for seed.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

function lowercaseFirst(value) {
  return value ? value[0].toLowerCase() + value.slice(1) : value;
}

function buildOutput(title, notes) {
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

const sampleSessions = [
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
    createdAt: new Date("2026-06-12T09:15:00.000Z"),
    updatedAt: new Date("2026-06-12T09:41:00.000Z"),
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
    createdAt: new Date("2026-06-10T14:20:00.000Z"),
    updatedAt: new Date("2026-06-10T14:37:00.000Z"),
  },
];

for (const session of sampleSessions) {
  await prisma.session.upsert({
    where: { id: session.id },
    create: session,
    update: session,
  });
}

await prisma.$disconnect();
