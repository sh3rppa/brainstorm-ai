"use client";

import { useState } from "react";

import { showToast } from "@/components/toast";

type SettingsRowProps =
  | {
      description: string;
      title: string;
      type: "toggle";
    }
  | {
      actionLabel: string;
      description: string;
      title: string;
      toast: string;
      type: "button";
    };

export function SettingsRow(props: SettingsRowProps) {
  const [enabled, setEnabled] = useState(true);

  if (props.type === "toggle") {
    return (
      <div className="setting-row">
        <div>
          <strong>{props.title}</strong>
          <p>{props.description}</p>
        </div>
        <button
          aria-label={`Toggle ${props.title}`}
          aria-pressed={enabled}
          className={`switch ${enabled ? "on" : ""}`}
          onClick={() => setEnabled((current) => !current)}
          type="button"
        />
      </div>
    );
  }

  return (
    <div className="setting-row">
      <div>
        <strong>{props.title}</strong>
        <p>{props.description}</p>
      </div>
      <button className="btn small" onClick={() => showToast(props.toast)} type="button">
        {props.actionLabel}
      </button>
    </div>
  );
}

