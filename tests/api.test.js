import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const port = 4187;
const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const nextBin = join(projectRoot, "node_modules", "next", "dist", "bin", "next");
const testDatabaseUrl = process.env.BRAINSTORM_TEST_DATABASE_URL;

if (!testDatabaseUrl) {
  console.log("API flow skipped: set BRAINSTORM_TEST_DATABASE_URL to run database integration tests.");
  process.exit(0);
}

const child = spawn(process.execPath, [nextBin, "dev", "apps/web", "-p", String(port)], {
  cwd: projectRoot,
  env: {
    ...process.env,
    DATABASE_URL: testDatabaseUrl,
    POSTGRES_PRISMA_URL: testDatabaseUrl,
  },
  stdio: ["ignore", "pipe", "pipe"],
});
let serverError = "";
let serverOutput = "";
child.stderr.on("data", (chunk) => { serverError += chunk.toString(); });
child.stdout.on("data", (chunk) => { serverOutput += chunk.toString(); });

const origin = `http://localhost:${port}`;
const base = `${origin}/api`;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function ready() {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    try {
      const response = await fetch(`${base}/health`);
      if (response.ok) return;
    } catch {}
    await wait(100);
  }
  throw new Error(`Next server did not start.${serverError || serverOutput ? `\n${serverError}\n${serverOutput}` : ""}`);
}

try {
  await ready();
  const home = await fetch(origin).then((response) => response.text());
  assert.match(home, /Brainstorm AI/);
  assert.equal((await fetch(`${origin}/sessions`)).status, 200);
  assert.equal((await fetch(`${origin}/team`)).status, 200);
  assert.equal((await fetch(`${origin}/settings`)).status, 200);

  const health = await fetch(`${base}/health`).then((response) => response.json());
  assert.equal(health.ok, true);

  const missingId = "missing-session-api-test";
  assert.equal((await fetch(`${base}/sessions/${missingId}`)).status, 404);
  assert.equal((await fetch(`${base}/sessions/${missingId}`, { method: "PATCH" })).status, 404);
  assert.equal((await fetch(`${base}/sessions/${missingId}/finalize`, { method: "POST" })).status, 404);
  assert.equal((await fetch(`${origin}/session/${missingId}`)).status, 404);
  assert.equal((await fetch(`${origin}/processing/${missingId}`)).status, 404);
  assert.equal((await fetch(`${origin}/results/${missingId}`)).status, 404);

  const created = await fetch(`${base}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "API test concept" }),
  }).then((response) => response.json());
  assert.equal(created.status, "draft");
  assert.equal((await fetch(`${origin}/session/${created.id}`)).status, 200);

  const patched = await fetch(`${base}/sessions/${created.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notes: ["Help people focus on one useful outcome."], durationSeconds: 42 }),
  }).then((response) => response.json());
  assert.equal(patched.notes.length, 1);
  assert.equal(patched.durationSeconds, 42);

  const finalized = await fetch(`${base}/sessions/${created.id}/finalize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ notes: patched.notes, durationSeconds: 42 }),
  }).then((response) => response.json());
  assert.equal(finalized.status, "done");

  await wait(2200);
  const complete = await fetch(`${base}/sessions/${created.id}`).then((response) => response.json());
  assert.equal(complete.status, "done");
  assert.ok(complete.aiOutput.summary.includes("API test concept"));
  assert.equal(complete.aiOutput.keyIdeas.length, 4);
  assert.equal((await fetch(`${origin}/processing/${created.id}`)).status, 200);
  assert.equal((await fetch(`${origin}/results/${created.id}`)).status, 200);
  const removed = await fetch(`${base}/sessions/${created.id}`, { method: "DELETE" }).then((response) => response.json());
  assert.equal(removed.deleted, true);
  assert.equal((await fetch(`${base}/sessions/${created.id}`)).status, 404);
  console.log("API flow passed: create -> update -> process -> results -> delete");
} finally {
  child.kill();
}

