"use client";

import { useEffect, useState } from "react";

const toastEventName = "brainstorm-toast";

export function showToast(message: string): void {
  window.dispatchEvent(new CustomEvent<{ message: string }>(toastEventName, { detail: { message } }));
}

export function ToastHost() {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timer: number | undefined;
    const onToast = (event: Event): void => {
      if (!(event instanceof CustomEvent) || typeof event.detail?.message !== "string") return;
      window.clearTimeout(timer);
      setMessage(event.detail.message);
      setVisible(true);
      timer = window.setTimeout(() => setVisible(false), 2400);
    };

    window.addEventListener(toastEventName, onToast);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(toastEventName, onToast);
    };
  }, []);

  return (
    <div aria-live="polite" className={`toast ${visible ? "show" : ""}`} role="status">
      {message}
    </div>
  );
}

