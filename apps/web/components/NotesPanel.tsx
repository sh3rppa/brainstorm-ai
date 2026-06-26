import { Icon } from "@/components/icons";

type NotesPanelProps = {
  busy: boolean;
  notes: string[];
  noteDraft: string;
  recording: boolean;
  title: string;
  onAddNote: () => void;
  onFinish: () => void;
  onNoteDraftChange: (value: string) => void;
  onRemoveNote: (index: number) => void;
  onTitleBlur: () => void;
  onTitleChange: (value: string) => void;
  onToggleRecording: () => void;
};

export function NotesPanel({
  busy,
  notes,
  noteDraft,
  recording,
  title,
  onAddNote,
  onFinish,
  onNoteDraftChange,
  onRemoveNote,
  onTitleBlur,
  onTitleChange,
  onToggleRecording,
}: NotesPanelProps) {
  return (
    <aside className="notes-panel">
      <div>
        <p className="eyebrow">Quick notes</p>
        <h2>Catch the words, too.</h2>
        <p>Short fragments are perfect. The analysis will connect them later.</p>
      </div>
      <div className="note-form">
        <input
          aria-label="Quick note"
          id="note-input"
          maxLength={220}
          onChange={(event) => onNoteDraftChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") onAddNote();
          }}
          placeholder="Add a thought..."
          value={noteDraft}
        />
        <button className="btn small primary" onClick={onAddNote} type="button">
          Add
        </button>
      </div>
      <div className="notes-list">
        {notes.length > 0 ? (
          notes.map((note, index) => (
            <div className="note" key={`${note}-${index}`}>
              {note}
              <button aria-label="Remove note" onClick={() => onRemoveNote(index)} type="button">
                x
              </button>
            </div>
          ))
        ) : (
          <div className="empty note-empty">Your quick notes will collect here.</div>
        )}
      </div>
      <div className="notes-footer">
        <input
          aria-label="Session title"
          className="title-input"
          maxLength={100}
          onBlur={onTitleBlur}
          onChange={(event) => onTitleChange(event.target.value)}
          value={title}
        />
        <button className={`btn ${recording ? "danger" : "primary"}`} onClick={onToggleRecording} type="button">
          {recording ? "Stop recording" : "Start recording"}
        </button>
        <button className="btn acid" disabled={busy} onClick={onFinish} type="button">
          Finish & process
          <Icon name="arrowRight" />
        </button>
        <div className="privacy-note">
          Audio capture stays in memory for this local MVP and is never stored. Production adapters enforce the 72-hour
          retention rule.
        </div>
      </div>
    </aside>
  );
}

