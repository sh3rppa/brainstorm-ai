"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { CanvasBoard } from "@/components/CanvasBoard";
import { NotesPanel } from "@/components/NotesPanel";
import { showToast } from "@/components/toast";
import { apiJson } from "@/lib/api-client";
import { formatClock } from "@/lib/format";
import type { BrainstormSession } from "@/types/domain";

type CaptureWorkspaceProps = {
  session: BrainstormSession;
};

export function CaptureWorkspace({ session }: CaptureWorkspaceProps) {
  const router = useRouter();
  const [title, setTitle] = useState(session.title);
  const [notes, setNotes] = useState<string[]>(session.notes);
  const [noteDraft, setNoteDraft] = useState("");
  const [seconds, setSeconds] = useState(session.durationSeconds);
  const [recording, setRecording] = useState(false);
  const [canvasData, setCanvasData] = useState<string | null>(session.canvasData);
  const [busy, setBusy] = useState(false);
  const timerRef = useRef<number | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => stopRecording(false);
  }, []);

  function stopRecording(withToast = true): void {
    setRecording(false);
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    recorderRef.current = null;
    streamRef.current = null;
    if (withToast) showToast("Recording stopped. Your session is ready to process.");
  }

  async function toggleRecording(): Promise<void> {
    if (recording) {
      stopRecording();
      return;
    }

    setRecording(true);
    timerRef.current = window.setInterval(() => setSeconds((current) => current + 1), 1000);

    if (!navigator.mediaDevices?.getUserMedia) {
      showToast("Microphone unavailable. The session timer is still running.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      recorderRef.current = new MediaRecorder(stream);
      recorderRef.current.start();
      showToast("Microphone connected. Recording started.");
    } catch {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      recorderRef.current = null;
      showToast("Microphone unavailable. The session timer is still running.");
    }
  }

  function addNote(): void {
    const value = noteDraft.trim();
    if (!value) return;
    setNotes((current) => [...current, value]);
    setNoteDraft("");
  }

  function removeNote(index: number): void {
    setNotes((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  async function saveTitle(): Promise<void> {
    const nextTitle = title.trim() || "Untitled brainstorm";
    setTitle(nextTitle);
    try {
      await apiJson<BrainstormSession>(`/sessions/${session.id}`, {
        method: "PATCH",
        body: JSON.stringify({ title: nextTitle }),
      });
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not save the title.");
    }
  }

  async function finishSession(): Promise<void> {
    const nextTitle = title.trim() || "Untitled brainstorm";
    if (recording) stopRecording(false);
    setBusy(true);

    try {
      const updated = await apiJson<BrainstormSession>(`/sessions/${session.id}`, {
        method: "PATCH",
        body: JSON.stringify({ title: nextTitle, notes, durationSeconds: seconds, canvasData }),
      });
      await apiJson<BrainstormSession>(`/sessions/${updated.id}/finalize`, {
        method: "POST",
        body: JSON.stringify({ notes, durationSeconds: seconds, canvasData }),
      });
      router.push(`/processing/${updated.id}`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Could not finish this session.");
      setBusy(false);
    }
  }

  return (
    <section className="capture-layout">
      <div className="capture-left">
        <div className="session-bar">
          <div className="record-state">
            <span className={`record-dot ${recording ? "live" : ""}`} />
            <span>{recording ? "Recording session" : "Ready when you are"}</span>
          </div>
          <div className="timer" id="timer">
            {formatClock(seconds)}
          </div>
        </div>
        <CanvasBoard initialCanvasData={session.canvasData} onCanvasDataChange={setCanvasData} />
      </div>
      <NotesPanel
        busy={busy}
        noteDraft={noteDraft}
        notes={notes}
        onAddNote={addNote}
        onFinish={finishSession}
        onNoteDraftChange={setNoteDraft}
        onRemoveNote={removeNote}
        onTitleBlur={saveTitle}
        onTitleChange={setTitle}
        onToggleRecording={toggleRecording}
        recording={recording}
        title={title}
      />
    </section>
  );
}

