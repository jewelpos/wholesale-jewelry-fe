import React, { useState } from "react";

/**
 * Custom AG Grid sidebar tool panel — third tab alongside the built-in "Columns"
 * and "Filters" panels, added specifically for manual column-layout save/reset
 * (requested 2026-09-12, see project_grid_column_persistence memory for the full
 * "layout resets itself" investigation this followed).
 *
 * Deliberately placed in the sidebar rather than as a button above/inside the grid
 * wrapper — the sidebar's tab strip already exists on every persisted grid (54
 * across the app), so this adds zero extra layout space to any page. An earlier
 * attempt added a small button row above the grid instead; that required
 * restructuring POSGrid's wrapper div into a flex column, which silently broke an
 * unrelated page's status/date pill filters (their layout math assumed POSGrid's
 * single-div structure). This panel needs none of that — it only renders inside
 * the sidebar's own content area, which every page's surrounding layout already
 * treats as part of the grid's own space.
 *
 * `onSave`/`onReset` are threaded in via AG Grid's `toolPanelParams` from
 * POSGrid/POSGridClient, which already own the Apollo mutation/query and the
 * storeid/gridkey context — this component stays a dumb presentational shell.
 */
interface GridLayoutToolPanelProps {
  onSave: () => Promise<void> | void;
  onReset: () => Promise<void> | void;
}

export default function GridLayoutToolPanel({ onSave, onReset }: GridLayoutToolPanelProps) {
  const [savingState, setSavingState] = useState<"idle" | "saving" | "saved">("idle");
  const [resettingState, setResettingState] = useState<"idle" | "resetting" | "done">("idle");

  const handleSave = async () => {
    setSavingState("saving");
    try {
      await onSave();
      setSavingState("saved");
      setTimeout(() => setSavingState("idle"), 1800);
    } catch {
      setSavingState("idle");
    }
  };

  const handleReset = async () => {
    setResettingState("resetting");
    try {
      await onReset();
      setResettingState("done");
      setTimeout(() => setResettingState("idle"), 1800);
    } catch {
      setResettingState("idle");
    }
  };

  return (
    <div className="p-3 d-flex flex-column gap-2" style={{ fontSize: 13 }}>
      <div className="text-muted mb-1" style={{ fontSize: 12 }}>
        Your column order, widths and visibility are saved automatically. Use these
        if you want to save right now, or undo unsaved changes.
      </div>
      <button
        type="button"
        className="btn btn-sm btn-primary"
        onClick={handleSave}
        disabled={savingState === "saving"}
      >
        {savingState === "saved" ? "Saved ✓" : savingState === "saving" ? "Saving…" : "Save Current Layout"}
      </button>
      <button
        type="button"
        className="btn btn-sm btn-outline-secondary"
        onClick={handleReset}
        disabled={resettingState === "resetting"}
      >
        {resettingState === "done" ? "Restored ✓" : resettingState === "resetting" ? "Restoring…" : "Reset to My Saved Layout"}
      </button>
    </div>
  );
}
