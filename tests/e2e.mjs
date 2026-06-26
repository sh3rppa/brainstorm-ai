import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";

const playwrightPath = process.env.PLAYWRIGHT_MODULE;
if (!playwrightPath) throw new Error("Set PLAYWRIGHT_MODULE to Playwright's index.mjs path.");
const { chromium } = await import(pathToFileURL(playwrightPath).href);

const port = 4190;
const origin = `http://localhost:${port}`;
const server = spawn(process.execPath, ["server.ts"], {
  cwd: fileURLToPath(new URL("..", import.meta.url)),
  env: { ...process.env, PORT: String(port) },
  stdio: ["ignore", "pipe", "pipe"],
});
let serverError = "";
let serverOutput = "";
server.stderr.on("data", (chunk) => { serverError += chunk.toString(); });
server.stdout.on("data", (chunk) => { serverOutput += chunk.toString(); });
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (serverOutput.includes("Brainstorm AI is running")) return;
    try {
      if ((await fetch(`${origin}/api/health`)).ok) return;
    } catch {}
    await wait(100);
  }
  throw new Error(`E2E server did not start.\n${serverError || serverOutput}`);
}

let browser;
let createdSessionId = "";
try {
  await waitForServer();
  browser = await chromium.launch({
    headless: true,
    executablePath: process.env.BROWSER_EXECUTABLE,
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto(origin);
  await page.getByRole("heading", { name: "Your thinking space" }).waitFor();
  assert.match(await page.textContent("body"), /Make room for the messy first draft/);

  await page.getByRole("button", { name: /Start a new session/ }).click();
  await page.waitForURL(/#session\//);
  createdSessionId = new URL(page.url()).hash.split("/")[1];
  await page.getByLabel("Session title").fill("Headless user journey");
  await page.getByLabel("Quick note").fill("Turn a rough idea into one confident next step.");
  await page.getByRole("button", { name: "Add" }).click();
  assert.equal(await page.getByLabel("Session title").inputValue(), "Headless user journey");

  const canvas = page.getByLabel("Free drawing canvas");
  const box = await canvas.boundingBox();
  assert.ok(box);
  await page.mouse.move(box.x + 80, box.y + 100);
  await page.mouse.down();
  await page.mouse.move(box.x + 220, box.y + 180, { steps: 8 });
  await page.mouse.up();
  await page.getByLabel("Use #7164f4").click();
  assert.equal(await page.getByLabel("Session title").inputValue(), "Headless user journey");
  await mkdir(new URL("../qa", import.meta.url), { recursive: true });
  await page.screenshot({ path: fileURLToPath(new URL("../qa/capture.png", import.meta.url)), fullPage: true });

  await page.getByRole("button", { name: /Start recording/ }).click();
  await page.waitForTimeout(1100);
  assert.match(await page.locator("#timer").textContent(), /00:0[1-9]/);
  await page.getByRole("button", { name: /Stop recording/ }).click();

  await page.getByRole("button", { name: /Finish & process/ }).click();
  await page.getByRole("heading", { name: "Connecting the useful dots." }).waitFor();
  await page.getByRole("heading", { name: "What this session is really about" }).waitFor({ timeout: 7000 });
  await page.getByRole("tab", { name: "Priority ideas" }).click();
  await page.getByRole("heading", { name: "The strongest ideas" }).waitFor();
  await page.getByRole("tab", { name: "Diagram" }).click();
  await page.getByText("Raw idea", { exact: true }).waitFor();
  await page.getByRole("tab", { name: "Generated code" }).click();
  assert.match(await page.locator(".code-block").textContent(), /type Experiment/);
  await page.getByRole("tab", { name: "Project brief" }).click();
  await page.getByRole("heading", { name: "A clear starting point" }).waitFor();

  await page.waitForTimeout(2600);
  await page.screenshot({ path: fileURLToPath(new URL("../qa/desktop.png", import.meta.url)), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${origin}/#home`);
  await page.getByRole("heading", { name: "Your thinking space" }).waitFor();
  await page.screenshot({ path: fileURLToPath(new URL("../qa/mobile.png", import.meta.url)), fullPage: true });
  assert.equal(await page.locator(".sidebar").isVisible(), true);
  const deleted = await page.evaluate(async (id) => {
    const response = await fetch(`/api/sessions/${id}`, { method: "DELETE" });
    return response.ok ? response.json() : { deleted: false };
  }, createdSessionId);
  assert.equal(deleted.deleted, true);
  console.log("Browser flow passed: home → capture → draw → record → process → all results → mobile");
} finally {
  await browser?.close();
  server.kill();
}
