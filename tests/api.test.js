import assert from "node:assert/strict";
import { spawn } from "node:child_process";

const port = 4187;
const child = spawn(process.execPath, ["backend/server.ts"], {
  cwd: new URL("..", import.meta.url),
  env: { ...process.env, PORT: String(port) },
  stdio: ["ignore", "pipe", "pipe"],
});
let serverError = "";
child.stderr.on("data", (chunk) => { serverError += chunk.toString(); });

const base = `http://localhost:${port}/api`;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function ready() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(`${base}/health`);
      if (response.ok) return;
    } catch {}
    await wait(100);
  }
  throw new Error(`Server did not start.${serverError ? `\n${serverError}` : ""}`);
}

try {
  await ready();
  const health = await fetch(`${base}/health`).then((response) => response.json());
  assert.equal(health.ok, true);

  const created = await fetch(`${base}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "API test concept" }),
  }).then((response) => response.json());
  assert.equal(created.status, "draft");

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
  assert.equal(finalized.status, "processing");

  await wait(2200);
  const complete = await fetch(`${base}/sessions/${created.id}`).then((response) => response.json());
  assert.equal(complete.status, "done");
  assert.ok(complete.aiOutput.summary.includes("API test concept"));
  assert.equal(complete.aiOutput.keyIdeas.length, 4);
  const removed = await fetch(`${base}/sessions/${created.id}`, { method: "DELETE" }).then((response) => response.json());
  assert.equal(removed.deleted, true);
  console.log("API flow passed: create → update → process → results");
} finally {
  child.kill();
}
