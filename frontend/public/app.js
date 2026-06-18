const state = {
  route: location.hash.slice(1) || "home",
  sessions: [],
  activeSession: null,
  notes: [],
  recording: false,
  seconds: 0,
  timerId: null,
  recorder: null,
  stream: null,
  resultTab: "summary",
  canvas: { tool: "pen", color: "#181815", size: 3, drawing: false, hasMarks: false, snapshot: null },
};

const icons = { home: "⌂", sessions: "◫", team: "◉", settings: "⚙" };
const app = document.querySelector("#app");
const toast = document.querySelector("#toast");

async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!response.ok) {
    const detail = await response.json().catch(() => ({ error: "The request failed." }));
    throw new Error(detail.error || "The request failed.");
  }
  return response.json();
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2400);
}

function navigate(route) {
  if (!route.startsWith("session/") && state.recording) stopRecordingSilently();
  location.hash = route;
}

function shell(content, title = "Your thinking space", eyebrow = "Brainstorm AI") {
  const current = state.route.split("/")[0];
  return `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand"><span class="brand-mark">✦</span><span class="brand-name">Brainstorm AI</span></div>
        <nav class="nav" aria-label="Primary navigation">
          ${navButton("home", "Home", current === "home")}
          ${navButton("sessions", "Sessions", current === "sessions" || current === "session" || current === "results" || current === "processing")}
          ${navButton("team", "Team", current === "team")}
          ${navButton("settings", "Settings", current === "settings")}
        </nav>
        <div class="sidebar-foot">
          <div class="plan-row"><strong>FREE PLAN</strong><span>3 / 5</span></div>
          <div class="meter"><span></span></div>
          <div class="plan-row"><span>Sessions this month</span></div>
        </div>
      </aside>
      <main class="main">
        <header class="topbar">
          <div><p class="eyebrow">${escapeHtml(eyebrow)}</p><h1>${escapeHtml(title)}</h1></div>
          <div class="top-actions"><button class="btn ghost" data-route="sessions">Browse sessions</button><div class="avatar" title="Alex Morgan">AM</div></div>
        </header>
        <div class="page">${content}</div>
      </main>
    </div>`;
}

function navButton(route, label, active) {
  return `<button class="nav-button ${active ? "active" : ""}" data-route="${route}"><span class="nav-icon">${icons[route]}</span><span class="nav-label">${label}</span></button>`;
}

function sessionCard(session) {
  const status = session.status === "done" ? "Ready" : session.status;
  const summary = session.aiOutput?.summary || (session.notes?.[0] ?? "A fresh space for the next useful idea.");
  return `
    <article class="session-card" data-open-session="${escapeHtml(session.id)}" tabindex="0" role="button" aria-label="Open ${escapeHtml(session.title)}">
      <div class="card-top"><span class="status ${session.status}"><i class="dot"></i>${escapeHtml(status)}</span><span class="card-date">${formatDate(session.updatedAt)}</span></div>
      <h3>${escapeHtml(session.title)}</h3>
      <p>${escapeHtml(summary.slice(0, 105))}${summary.length > 105 ? "…" : ""}</p>
      <div class="card-foot"><span>${formatDuration(session.durationSeconds)}</span><span>${session.notes?.length || 0} notes&nbsp; →</span></div>
    </article>`;
}

function formatDate(value) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
}

function formatDuration(seconds = 0) {
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, "0")}s`;
}

function clock(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

async function loadSessions() {
  state.sessions = await api("/sessions");
}

async function renderHome() {
  await loadSessions();
  const recent = state.sessions.slice(0, 3).map(sessionCard).join("");
  app.innerHTML = shell(`
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">From idea to something real</p>
        <h2>Make room for the messy first draft.</h2>
        <p>Speak, sketch, and write without stopping to organize. Brainstorm AI turns the session into a clear, actionable starting point.</p>
        <button class="btn primary" data-new-session>＋ Start a new session</button>
      </div>
      <aside class="insight-card">
        <div class="spark">✦</div>
        <div><p class="eyebrow" style="color:#d8ff52">Today’s prompt</p><h3>What would become possible if the first version took one week?</h3><p>Start with the outcome. Let the details arrive later.</p></div>
      </aside>
    </section>
    <div class="section-head"><div><h2>Recent sessions</h2><p>Pick up where your thinking left off.</p></div><button class="btn small" data-route="sessions">View all</button></div>
    <section class="session-grid">${recent || `<div class="empty">Your completed sessions will appear here.</div>`}</section>
  `);
}

async function renderSessions() {
  await loadSessions();
  app.innerHTML = shell(`
    <div class="section-head" style="margin-top:0"><div><h2>All sessions</h2><p>${state.sessions.length} ideas captured and ready to revisit.</p></div><button class="btn acid" data-new-session>＋ New session</button></div>
    <section class="session-grid">${state.sessions.map(sessionCard).join("") || `<div class="empty">Start your first session to see it here.</div>`}</section>
  `, "Session library", "Your work");
}

async function createSession() {
  const session = await api("/sessions", { method: "POST", body: JSON.stringify({ title: "Untitled brainstorm" }) });
  state.activeSession = session;
  state.notes = [];
  state.seconds = 0;
  state.canvas.snapshot = null;
  state.canvas.hasMarks = false;
  navigate(`session/${session.id}`);
}

async function loadSession(id) {
  const changedSession = state.activeSession?.id !== id;
  state.activeSession = await api(`/sessions/${id}`);
  state.notes = [...(state.activeSession.notes || [])];
  state.seconds = state.activeSession.durationSeconds || 0;
  if (changedSession) {
    state.canvas.snapshot = state.activeSession.canvasData;
    state.canvas.hasMarks = Boolean(state.activeSession.canvasData);
  }
  return state.activeSession;
}

async function openSession(id) {
  const session = await loadSession(id);
  if (session.status === "done") navigate(`results/${id}`);
  else if (session.status === "processing") navigate(`processing/${id}`);
  else navigate(`session/${id}`);
}

async function renderCapture(id) {
  const session = state.activeSession?.id === id ? state.activeSession : await loadSession(id);
  app.innerHTML = shell(`
    <section class="capture-layout">
      <div class="canvas-panel">
        <div class="session-bar">
          <div class="record-state"><span class="record-dot ${state.recording ? "live" : ""}"></span><span>${state.recording ? "Recording session" : "Ready when you are"}</span></div>
          <div class="timer" id="timer">${clock(state.seconds)}</div>
        </div>
        <div class="canvas-wrap">
          <canvas id="brain-canvas" tabindex="0" aria-label="Free drawing canvas"></canvas>
          <div class="canvas-hint ${state.canvas.hasMarks || session.canvasData ? "hidden" : ""}"><span>Draw the thought before it disappears.<br><small>Use a pen, shape, or color below.</small></span></div>
        </div>
        <div class="toolbar" aria-label="Canvas tools">
          ${toolButton("pen", "✎", "Pen")}
          ${toolButton("line", "╱", "Line")}
          ${toolButton("rectangle", "□", "Rectangle")}
          ${toolButton("eraser", "⌫", "Eraser")}
          <span class="toolbar-separator"></span>
          ${["#181815", "#7164f4", "#ff8e51", "#89b93f"].map((color) => `<button class="color-button ${state.canvas.color === color ? "active" : ""}" style="background:${color}" data-color="${color}" aria-label="Use ${color}"></button>`).join("")}
          <span class="toolbar-separator"></span>
          <button class="tool-button" data-clear-canvas title="Clear canvas" aria-label="Clear canvas">↺</button>
        </div>
      </div>
      <aside class="notes-panel">
        <div><p class="eyebrow">Quick notes</p><h2>Catch the words, too.</h2><p>Short fragments are perfect. The analysis will connect them later.</p></div>
        <div class="note-form"><input id="note-input" placeholder="Add a thought…" maxlength="220" aria-label="Quick note"><button class="btn small primary" data-add-note>Add</button></div>
        <div class="notes-list">${renderNotes()}</div>
        <div class="notes-footer">
          <input id="title-input" class="title-input" value="${escapeHtml(session.title)}" maxlength="100" aria-label="Session title">
          <button class="btn ${state.recording ? "danger" : "primary"}" data-record>${state.recording ? "■ Stop recording" : "● Start recording"}</button>
          <button class="btn acid" data-finish>Finish & process <span>→</span></button>
          <div class="privacy-note">Audio capture stays in memory for this local MVP and is never stored. Production adapters enforce the 72-hour retention rule.</div>
        </div>
      </aside>
    </section>
  `, "Live session", escapeHtml(session.title));
  setupCanvas(state.canvas.snapshot || session.canvasData);
}

function toolButton(tool, icon, label) {
  return `<button class="tool-button ${state.canvas.tool === tool ? "active" : ""}" data-tool="${tool}" title="${label}" aria-label="${label}">${icon}</button>`;
}

function renderNotes() {
  return state.notes.map((note, index) => `<div class="note">${escapeHtml(note)}<button data-remove-note="${index}" aria-label="Remove note">×</button></div>`).join("") || `<div class="empty" style="padding:24px 14px">Your quick notes will collect here.</div>`;
}

function setupCanvas(savedImage) {
  const canvas = document.querySelector("#brain-canvas");
  const wrap = canvas.parentElement;
  const context = canvas.getContext("2d");
  const ratio = window.devicePixelRatio || 1;
  const rect = wrap.getBoundingClientRect();
  canvas.width = Math.round(rect.width * ratio);
  canvas.height = Math.round(rect.height * ratio);
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
  context.scale(ratio, ratio);
  context.lineCap = "round";
  context.lineJoin = "round";

  if (savedImage) {
    const image = new Image();
    image.onload = () => context.drawImage(image, 0, 0, rect.width, rect.height);
    image.src = savedImage;
    state.canvas.hasMarks = true;
  }

  let start = null;
  let base = null;
  const point = (event) => {
    const box = canvas.getBoundingClientRect();
    return { x: event.clientX - box.left, y: event.clientY - box.top };
  };

  canvas.addEventListener("pointerdown", (event) => {
    canvas.setPointerCapture(event.pointerId);
    state.canvas.drawing = true;
    start = point(event);
    base = context.getImageData(0, 0, canvas.width, canvas.height);
    if (state.canvas.tool === "pen" || state.canvas.tool === "eraser") {
      context.beginPath();
      context.moveTo(start.x, start.y);
    }
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!state.canvas.drawing || !start) return;
    const current = point(event);
    context.lineWidth = state.canvas.tool === "eraser" ? 22 : state.canvas.size;
    context.strokeStyle = state.canvas.tool === "eraser" ? "#fbfaf6" : state.canvas.color;
    if (state.canvas.tool === "pen" || state.canvas.tool === "eraser") {
      context.lineTo(current.x, current.y);
      context.stroke();
    } else {
      context.putImageData(base, 0, 0);
      context.beginPath();
      if (state.canvas.tool === "line") {
        context.moveTo(start.x, start.y);
        context.lineTo(current.x, current.y);
      } else {
        context.rect(start.x, start.y, current.x - start.x, current.y - start.y);
      }
      context.stroke();
    }
  });
  canvas.addEventListener("pointerup", () => {
    state.canvas.drawing = false;
    state.canvas.hasMarks = true;
    document.querySelector(".canvas-hint")?.classList.add("hidden");
    state.canvas.snapshot = canvas.toDataURL("image/png");
  });
}

async function toggleRecording() {
  if (state.recording) {
    state.recording = false;
    clearInterval(state.timerId);
    if (state.recorder?.state === "recording") state.recorder.stop();
    state.stream?.getTracks().forEach((track) => track.stop());
    showToast("Recording stopped. Your session is ready to process.");
  } else {
    state.recording = true;
    state.timerId = setInterval(() => {
      state.seconds += 1;
      const timer = document.querySelector("#timer");
      if (timer) timer.textContent = clock(state.seconds);
    }, 1000);
    updateRecordingControls();
    try {
      state.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      state.recorder = new MediaRecorder(state.stream);
      state.recorder.start();
      showToast("Microphone connected. Recording started.");
    } catch {
      state.stream?.getTracks().forEach((track) => track.stop());
      state.stream = null;
      state.recorder = null;
      showToast("Microphone unavailable. The session timer is still running.");
    }
  }
  updateRecordingControls();
}

function updateRecordingControls() {
  const button = document.querySelector("[data-record]");
  const dot = document.querySelector(".record-dot");
  const label = document.querySelector(".record-state span:last-child");
  if (button) {
    button.textContent = state.recording ? "■ Stop recording" : "● Start recording";
    button.classList.toggle("danger", state.recording);
    button.classList.toggle("primary", !state.recording);
  }
  dot?.classList.toggle("live", state.recording);
  if (label) label.textContent = state.recording ? "Recording session" : "Ready when you are";
}

function stopRecordingSilently() {
  state.recording = false;
  clearInterval(state.timerId);
  if (state.recorder?.state === "recording") state.recorder.stop();
  state.stream?.getTracks().forEach((track) => track.stop());
  state.recorder = null;
  state.stream = null;
}

async function finishSession() {
  const title = document.querySelector("#title-input")?.value.trim() || "Untitled brainstorm";
  if (state.recording) {
    stopRecordingSilently();
  }
  const canvas = document.querySelector("#brain-canvas");
  const canvasData = canvas?.toDataURL("image/png") || state.activeSession.canvasData;
  const updated = await api(`/sessions/${state.activeSession.id}`, {
    method: "PATCH",
    body: JSON.stringify({ title, notes: state.notes, durationSeconds: state.seconds, canvasData }),
  });
  state.activeSession = await api(`/sessions/${updated.id}/finalize`, {
    method: "POST",
    body: JSON.stringify({ notes: state.notes, durationSeconds: state.seconds, canvasData }),
  });
  navigate(`processing/${updated.id}`);
}

async function renderProcessing(id) {
  const session = await loadSession(id);
  if (session.status === "done") {
    navigate(`results/${id}`);
    return;
  }
  app.innerHTML = shell(`
    <section class="processing">
      <div class="processing-card">
        <div class="orb"></div>
        <p class="eyebrow">Multimodal analysis</p>
        <h2>Connecting the useful dots.</h2>
        <p>Brainstorm AI is organizing your notes and canvas into a focused summary, prioritized ideas, a diagram, starter code, and a project brief.</p>
        <div class="progress"><span></span></div>
        <small style="color:var(--muted)">This local demo usually takes about two seconds.</small>
      </div>
    </section>
  `, "Making sense of it", escapeHtml(session.title));
  setTimeout(async () => {
    if (state.route === `processing/${id}`) await renderProcessing(id);
  }, 900);
}

async function renderResults(id) {
  const session = await loadSession(id);
  if (!session.aiOutput) {
    navigate(`processing/${id}`);
    return;
  }
  const output = session.aiOutput;
  app.innerHTML = shell(`
    <div class="result-header">
      <div><p class="eyebrow">Session complete</p><h1>${escapeHtml(session.title)}</h1></div>
      <div class="top-actions"><button class="btn" data-copy-result>Copy brief</button><button class="btn acid" data-new-session>＋ New session</button></div>
    </div>
    <div class="result-tabs" role="tablist">
      ${tabButton("summary", "Executive summary")}
      ${tabButton("ideas", "Priority ideas")}
      ${tabButton("diagram", "Diagram")}
      ${tabButton("code", "Generated code")}
      ${tabButton("brief", "Project brief")}
    </div>
    <section class="result-card">${renderResultContent(output)}</section>
  `, "Your idea, organized", "AI results");
}

function tabButton(id, label) {
  return `<button class="tab ${state.resultTab === id ? "active" : ""}" role="tab" aria-selected="${state.resultTab === id}" data-result-tab="${id}">${label}</button>`;
}

function renderResultContent(output) {
  if (state.resultTab === "ideas") {
    return `<p class="eyebrow">Ordered by relevance</p><h2>The strongest ideas</h2><div class="idea-list">${output.keyIdeas.map((idea, index) => `
      <article class="idea-row"><div class="idea-number">${index + 1}</div><div><h3>${escapeHtml(idea.title)}</h3><p>${escapeHtml(idea.detail)}</p></div><span class="priority ${idea.priority}">${idea.priority}</span></article>`).join("")}</div>`;
  }
  if (state.resultTab === "diagram") {
    return `<p class="eyebrow">Generated flow</p><h2>From raw idea to next iteration</h2><div class="diagram"><div class="diagram-flow">${output.diagram.nodes.map((node, index) => `${index ? `<span class="arrow">→</span>` : ""}<div class="diagram-node">${escapeHtml(node)}</div>`).join("")}</div></div>`;
  }
  if (state.resultTab === "code") {
    return `<p class="eyebrow">Starter component</p><h2>A useful first building block</h2><pre class="code-block"><code>${escapeHtml(output.code)}</code></pre>`;
  }
  if (state.resultTab === "brief") {
    return `<div class="brief"><p class="eyebrow">Project brief</p><h2>A clear starting point</h2><div class="brief-meta"><div class="meta-card"><span>Stage</span><strong>Concept validation</strong></div><div class="meta-card"><span>Timebox</span><strong>Two weeks</strong></div><div class="meta-card"><span>Primary goal</span><strong>Complete core workflow</strong></div></div><p>${escapeHtml(output.projectBrief)}</p><h3>Suggested next steps</h3><ul class="list-clean">${output.suggestedNextSteps.map((item) => `<li><span class="check">→</span>${escapeHtml(item)}</li>`).join("")}</ul></div>`;
  }
  return `<p class="eyebrow">Executive summary</p><h2>What this session is really about</h2><p class="lead">${escapeHtml(output.summary)}</p><div class="split"><div><h3>Action items</h3><ul class="list-clean">${output.actionItems.map((item) => `<li><span class="check">✓</span>${escapeHtml(item)}</li>`).join("")}</ul></div><div><h3>Suggested next steps</h3><ul class="list-clean">${output.suggestedNextSteps.map((item) => `<li><span class="check">→</span>${escapeHtml(item)}</li>`).join("")}</ul></div></div>`;
}

function renderTeam() {
  app.innerHTML = shell(`
    <section class="simple-panel">
      <p class="eyebrow">Early access</p><h2>Think together, without losing the thread.</h2>
      <p style="color:var(--muted);max-width:680px;line-height:1.6">Team Mode keeps collaborators in the same session and gives everyone a clear role. Real-time presence and invitations are prepared for the production Liveblocks adapter.</p>
      <div class="section-head"><div><h2>Your team</h2><p>3 members · Pro trial</p></div><button class="btn primary" data-invite>＋ Invite member</button></div>
      <div class="team-grid">
        ${member("AM", "Alex Morgan", "Host · Product")}
        ${member("SK", "Sam Kim", "Contributor · Design")}
        ${member("JR", "Jamie Rivera", "Contributor · Engineering")}
      </div>
    </section>
  `, "Team space", "Collaborate");
}

function member(initials, name, role) {
  return `<div class="member"><div class="avatar">${initials}</div><div><strong>${name}</strong><small>${role}</small></div></div>`;
}

function renderSettings() {
  app.innerHTML = shell(`
    <section class="simple-panel">
      <p class="eyebrow">Preferences</p><h2>Settings</h2>
      ${setting("Local-first capture", "Keep session audio in memory until processing begins.")}
      ${setting("Processing notifications", "Show a notification when AI results are ready.")}
      ${setting("Weekly thinking recap", "Receive a concise summary of themes across your sessions.")}
      <div class="setting-row"><div><strong>Plan</strong><p>Free · 3 of 5 sessions used this month</p></div><button class="btn small">View plans</button></div>
      <div class="setting-row"><div><strong>Integrations</strong><p>Notion, GitHub, Figma, Slack, Google Drive, and Linear</p></div><button class="btn small" data-connect>Connect</button></div>
    </section>
  `, "Your preferences", "Account");
}

function setting(title, description) {
  return `<div class="setting-row"><div><strong>${title}</strong><p>${description}</p></div><button class="switch" aria-label="Toggle ${title}" data-toggle></button></div>`;
}

async function render() {
  const [route, id] = state.route.split("/");
  try {
    if (route === "home") await renderHome();
    else if (route === "sessions") await renderSessions();
    else if (route === "session" && id) await renderCapture(id);
    else if (route === "processing" && id) await renderProcessing(id);
    else if (route === "results" && id) await renderResults(id);
    else if (route === "team") renderTeam();
    else if (route === "settings") renderSettings();
    else navigate("home");
  } catch (error) {
    app.innerHTML = shell(`<div class="empty"><h2>We could not load this view.</h2><p>${escapeHtml(error.message)}</p><button class="btn primary" data-route="home">Back home</button></div>`, "Something needs attention", "Brainstorm AI");
  }
}

document.addEventListener("click", async (event) => {
  const target = event.target.closest("button, [data-open-session]");
  if (!target) return;
  if (target.dataset.route) navigate(target.dataset.route);
  else if (target.dataset.newSession !== undefined) await createSession();
  else if (target.dataset.openSession) await openSession(target.dataset.openSession);
  else if (target.dataset.record !== undefined) await toggleRecording();
  else if (target.dataset.addNote !== undefined) addNote();
  else if (target.dataset.removeNote !== undefined) {
    preserveCaptureInputs();
    state.notes.splice(Number(target.dataset.removeNote), 1);
    await renderCapture(state.activeSession.id);
  } else if (target.dataset.tool) {
    preserveCaptureInputs();
    state.canvas.tool = target.dataset.tool;
    await renderCapture(state.activeSession.id);
  } else if (target.dataset.color) {
    preserveCaptureInputs();
    state.canvas.color = target.dataset.color;
    await renderCapture(state.activeSession.id);
  } else if (target.dataset.clearCanvas !== undefined) {
    state.canvas.hasMarks = false;
    state.canvas.snapshot = null;
    state.activeSession.canvasData = null;
    await renderCapture(state.activeSession.id);
    showToast("Canvas cleared.");
  } else if (target.dataset.finish !== undefined) await finishSession();
  else if (target.dataset.resultTab) {
    state.resultTab = target.dataset.resultTab;
    await renderResults(state.activeSession.id);
  } else if (target.dataset.copyResult !== undefined) {
    await navigator.clipboard.writeText(state.activeSession.aiOutput.projectBrief).catch(() => {});
    showToast("Project brief copied.");
  } else if (target.dataset.invite !== undefined) showToast("Invitation workflow is ready for the production email adapter.");
  else if (target.dataset.connect !== undefined) showToast("Integration adapters are ready to configure.");
  else if (target.dataset.toggle !== undefined) {
    target.style.background = target.style.background ? "" : "#b9b7ae";
  }
});

document.addEventListener("keydown", async (event) => {
  if (event.key === "Enter" && event.target.id === "note-input") addNote();
  if ((event.key === "Enter" || event.key === " ") && event.target.dataset.openSession) await openSession(event.target.dataset.openSession);
});

function addNote() {
  const input = document.querySelector("#note-input");
  const value = input?.value.trim();
  if (!value) return;
  preserveCaptureInputs();
  state.notes.push(value);
  renderCapture(state.activeSession.id);
}

function preserveCaptureInputs() {
  const title = document.querySelector("#title-input")?.value.trim();
  if (title && state.activeSession) state.activeSession.title = title;
  const canvas = document.querySelector("#brain-canvas");
  if (canvas && state.canvas.hasMarks) state.canvas.snapshot = canvas.toDataURL("image/png");
}

window.addEventListener("hashchange", () => {
  state.route = location.hash.slice(1) || "home";
  render();
});

render();
