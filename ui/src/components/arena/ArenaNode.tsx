"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { memo, useState, type FC } from "react";
import type { ArenaNodeData, ArenaNodeType } from "./ArenaGatewayClient";
import { Markdown } from "../control-ui/markdown";

const NODE_LABEL: Record<ArenaNodeType, string> = {
  goal: "Goal",
  skill: "Skill",
  agent: "Agent",
  condition: "Condition",
  output: "Output",
};

const NODE_ICON: Record<ArenaNodeType, string> = {
  goal: "✦", // start marker
  skill: "⚙", // gear
  agent: "◆", // agent
  condition: "⑂", // branch
  output: "✓",
};

// ── Status helpers ──────────────────────────────────────────────────────────

type NodeStatus = "idle" | "running" | "completed" | "failed" | "skipped";

function statusClasses(status: NodeStatus): string {
  switch (status) {
    case "running":
      return "animate-pulse ring-2 ring-blue-400/60";
    case "completed":
      return "ring-1 ring-emerald-400/40";
    case "failed":
      return "ring-2 ring-red-400/60";
    case "skipped":
      return "opacity-60";
    default:
      return "";
  }
}

function statusText(status: NodeStatus): string | null {
  switch (status) {
    case "running":
      return "Running";
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
    case "skipped":
      return "Skipped";
    default:
      return null;
  }
}

/** The one-line summary shown on the compact node card, per node type. */
function summaryFor(nodeType: ArenaNodeType, data: ArenaNodeData): string {
  switch (nodeType) {
    case "goal":
    case "agent":
      return data.prompt?.trim() || "No task set";
    case "skill":
      return data.skillName?.trim() || "No skill set";
    case "condition":
      return data.conditionExpr?.trim() || "No condition set";
    case "output":
      return data.outputTemplate?.trim() || "No template set";
    default:
      return "";
  }
}

// ── Component ───────────────────────────────────────────────────────────────

type ArenaNodeProps = NodeProps & {
  data: ArenaNodeData & {
    nodeType?: ArenaNodeType;
    status?: NodeStatus;
    label?: string;
  };
};

const ArenaNode: FC<ArenaNodeProps> = ({ data, selected }) => {
  const [hovered, setHovered] = useState(false);
  const nodeType = (data.nodeType as ArenaNodeType) ?? "goal";
  const label = data.label?.trim() || NODE_LABEL[nodeType] || nodeType;
  const icon = NODE_ICON[nodeType] ?? "*";
  const status = (data.status as NodeStatus) ?? "idle";
  const isCondition = nodeType === "condition";
  const summary = summaryFor(nodeType, data);
  const detail = data.detail?.trim();
  // Hover preview: full task spec if set, otherwise fall back to the summary
  // so there's always something useful to show on hover.
  const previewMarkdown = detail || summary;

  return (
    <div
      className={`relative min-w-[220px] max-w-[300px] rounded-2xl bg-overlay border border-border p-4 text-foreground transition-all ${statusClasses(status)} ${selected ? "ring-2 ring-accent" : ""}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {nodeType === "goal" && (
        <div className="absolute -top-5 left-0 text-[10px] font-bold text-foreground/60 uppercase tracking-wider">
          Start
        </div>
      )}

      {/* Input handle (left side) */}
      {nodeType !== "goal" && (
        <Handle
          type="target"
          position={Position.Left}
          className="!w-2.5 !h-2.5 !bg-white !border-2 !border-black hover:!bg-black transition-colors"
          id="input"
        />
      )}

      {/* Output handle (right side) */}
      {nodeType !== "output" && !isCondition && (
        <Handle
          type="source"
          position={Position.Right}
          className="!w-2.5 !h-2.5 !bg-white !border-2 !border-black hover:!bg-black transition-colors"
          id="output"
        />
      )}

      {/* Condition outputs: success (top-right, green) and failure (bottom-right, red) */}
      {isCondition && (
        <>
          <Handle
            type="source"
            position={Position.Right}
            className="!w-2.5 !h-2.5 !bg-white !border-2 !border-emerald-500 hover:!bg-emerald-500 transition-colors"
            id="success"
            title="Success"
          />
          <Handle
            type="source"
            position={Position.Bottom}
            className="!w-2.5 !h-2.5 !bg-white !border-2 !border-red-500 hover:!bg-red-500 transition-colors"
            id="failure"
            title="Failure"
          />
        </>
      )}

      {/* Node content */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-muted/80 font-mono text-sm font-semibold shrink-0">{icon}</span>
            <span className="font-bold text-sm text-foreground truncate">{label}</span>
          </div>
          {detail && (
            <span
              className="text-[10px] text-muted/60 border border-border rounded-full px-1.5 py-0.5 shrink-0 select-none"
              title="Has a full task spec — hover to preview, click to edit"
            >
              detail
            </span>
          )}
        </div>

        <div className="text-xs text-foreground/80 truncate" title={summary}>
          {summary}
        </div>

        {data.capabilities && data.capabilities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {data.capabilities.slice(0, 3).map((capability) => (
              <span
                key={capability}
                className="rounded-full bg-accent/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-accent"
              >
                {capability}
              </span>
            ))}
            {data.capabilities.length > 3 && (
              <span className="text-[9px] text-muted">+{data.capabilities.length - 3}</span>
            )}
          </div>
        )}

        {status !== "idle" && (
          <div
            className={`text-[10px] font-semibold uppercase tracking-wider ${
              status === "completed"
                ? "text-emerald-500"
                : status === "failed"
                  ? "text-red-500"
                  : status === "skipped"
                    ? "text-muted"
                    : "text-blue-500"
            }`}
          >
            {statusText(status)}
          </div>
        )}
      </div>

      {/* Hover preview: full markdown task spec (or fallback summary) */}
      {hovered && previewMarkdown && (
        <div
          className="nodrag nopan absolute left-0 top-[calc(100%+8px)] z-50 w-[340px] max-h-[280px] overflow-y-auto rounded-xl bg-surface border border-border p-3 shadow-xl"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-1.5">
            {detail ? "Task detail" : "Summary"}
          </div>
          <Markdown content={previewMarkdown} className="prose prose-sm max-w-none text-xs" />
        </div>
      )}
    </div>
  );
};

export default memo(ArenaNode);
