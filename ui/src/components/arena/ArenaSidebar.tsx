"use client";

import { useState, type FC } from "react";
import type { ArenaGraph, ArenaNodeType } from "./ArenaGatewayClient";

const NODE_PALETTE: { type: ArenaNodeType; label: string; color: string }[] = [
  { type: "goal", label: "Goal", color: "bg-blue-500/10 text-blue-200" },
  { type: "skill", label: "Skill", color: "bg-emerald-500/10 text-emerald-200" },
  { type: "agent", label: "Agent", color: "bg-purple-500/10 text-purple-200" },
  { type: "condition", label: "Condition", color: "bg-amber-500/10 text-amber-200" },
  { type: "output", label: "Output", color: "bg-slate-500/10 text-slate-200" },
];

interface ArenaSidebarProps {
  graphs: ArenaGraph[];
  activeGraphId: string | null;
  isRunning: boolean;
  onSelectGraph: (id: string) => void;
  onDeleteGraph: (id: string) => void;
  onAddNode: (type: ArenaNodeType) => void;
}

const ArenaSidebar: FC<ArenaSidebarProps> = ({
  graphs,
  activeGraphId,
  isRunning,
  onSelectGraph,
  onDeleteGraph,
  onAddNode,
}) => {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  return (
    <aside className="w-[252px] bg-surface flex flex-col h-full shrink-0">
      {/* Node Palette */}
      <div className="p-3">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted px-1 mb-2">
          Add Node
        </div>
        <div className="space-y-1">
          {NODE_PALETTE.map((item) => (
            <button
              key={item.type}
              onClick={() => onAddNode(item.type)}
              disabled={isRunning}
              className={`w-full flex items-center px-3 py-2 text-xs rounded-lg ${item.color} hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </div>
        <div className="text-[9px] text-muted/60 mt-2 px-1">
          Click a node type to add it to the canvas. Connect nodes by dragging from handles.
        </div>
      </div>

      {/* Graph List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            Saved Graphs
          </div>
          <span className="text-[10px] text-muted">{graphs.length}</span>
        </div>

        {graphs.length === 0 ? (
          <div className="text-xs text-muted/70 text-center py-8">
            No saved graphs yet.
            <br />
            Create one with <span className="text-purple-300">Prompt to Nodes</span>
          </div>
        ) : (
          <div className="space-y-1">
            {graphs.map((graph) => {
              const isActive = graph.id === activeGraphId;
              return (
                <div key={graph.id} className="group relative">
                  {confirmDelete === graph.id ? (
                    <div className="flex items-center gap-1 p-2 rounded-lg bg-red-500/10">
                      <span className="text-[10px] text-red-300 flex-1">Delete?</span>
                      <button
                        onClick={() => {
                          onDeleteGraph(graph.id);
                          setConfirmDelete(null);
                        }}
                        className="text-[10px] font-semibold text-red-300 px-2 py-0.5 hover:bg-red-500/20 rounded"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="text-[10px] text-muted px-2 py-0.5 hover:bg-default rounded"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => onSelectGraph(graph.id)}
                      className={`w-full text-left p-2.5 rounded-lg transition-all ${
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-default text-foreground/70"
                      }`}
                    >
                      <div className="text-xs font-medium truncate">{graph.name}</div>
                      <div className="text-[10px] text-muted/70 mt-0.5">
                        {graph.nodes.length} nodes ·{" "}
                        {new Date(graph.updatedAtMs).toLocaleDateString()}
                      </div>
                    </button>
                  )}
                  {/* Delete button (hover) */}
                  {!confirmDelete && !isActive && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDelete(graph.id);
                      }}
                      className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 text-[10px] text-red-400 hover:text-red-300 p-1 rounded transition-all"
                      title="Delete graph"
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Run Log (compact) */}
      <div className="p-3">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-2">
          Tips
        </div>
        <div className="text-[10px] text-muted/70 space-y-1 leading-relaxed">
          <p>• Drag nodes from the handles to connect</p>
          <p>• Click a node to edit its properties</p>
          <p>• Use ⌘Z to undo, ⌘S to save</p>
          <p>• Condition nodes branch on success/failure</p>
        </div>
      </div>
    </aside>
  );
};

export default ArenaSidebar;
