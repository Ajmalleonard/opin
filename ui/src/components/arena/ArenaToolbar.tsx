"use client";

import { type FC } from "react";

interface ArenaToolbarProps {
  graphName: string;
  isDirty: boolean;
  isRunning: boolean;
  isReadOnly: boolean;
  onSave: () => void;
  onRun: () => void;
  onStop: () => void;
  onPromptToNodes: () => void;
  onNew: () => void;
  onExport: () => void;
}

const ArenaToolbar: FC<ArenaToolbarProps> = ({
  graphName,
  isDirty,
  isRunning,
  isReadOnly,
  onSave,
  onRun,
  onStop,
  onPromptToNodes,
  onNew,
  onExport,
}) => {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 bg-surface shrink-0">
      {/* Left: graph name + dirty indicator */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground truncate max-w-[220px]">
            {graphName || "Untitled"}
          </h2>
          {isDirty && (
            <span className="w-2 h-2 rounded-full bg-amber-500" title="Unsaved changes" />
          )}
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1.5">
        {/* Prompt to Nodes */}
        <button
          onClick={onPromptToNodes}
          disabled={isRunning}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-purple-500/10 text-purple-200 hover:bg-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          title="Generate graph from prompt"
        >
          <span>Prompt to Nodes</span>
        </button>

        {/* New */}
        <button
          onClick={onNew}
          disabled={isRunning}
          className="px-3 py-1.5 text-xs font-medium text-foreground/70 hover:text-foreground hover:bg-default rounded-full transition-colors disabled:opacity-50"
        >
          New
        </button>

        {/* Save */}
        <button
          onClick={onSave}
          disabled={isReadOnly}
          className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
            isDirty
              ? "bg-accent text-accent-foreground hover:opacity-90"
              : "text-foreground/70 hover:text-foreground hover:bg-default"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isDirty ? "Save *" : "Save"}
        </button>

        {/* Export */}
        <button
          onClick={onExport}
          className="px-3 py-1.5 text-xs font-medium text-foreground/70 hover:text-foreground hover:bg-default rounded-full transition-colors"
          title="Export as JSON"
        >
          Export
        </button>

        {/* Run / Stop */}
        {isRunning ? (
          <button
            onClick={onStop}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-full bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all"
          >
            <span>Stop</span>
          </button>
        ) : (
          <button
            onClick={onRun}
            disabled={isReadOnly}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>Run</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ArenaToolbar;
