"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { memo, type FC } from "react";
import type { ArenaNodeData, ArenaNodeType } from "./ArenaGatewayClient";

// ── Style configurations per node type (Zero Emojis, Zero Borders, Zero Shadows) ─────────────────────────────

const NODE_STYLE: Record<ArenaNodeType, { badge: string; badgeBg: string }> = {
  goal: {
    badge: "text-blue-200",
    badgeBg: "bg-blue-500/20",
  },
  skill: {
    badge: "text-emerald-200",
    badgeBg: "bg-emerald-500/20",
  },
  agent: {
    badge: "text-purple-200",
    badgeBg: "bg-purple-500/20",
  },
  condition: {
    badge: "text-amber-200",
    badgeBg: "bg-amber-500/20",
  },
  output: {
    badge: "text-slate-200",
    badgeBg: "bg-slate-500/20",
  },
};

const NODE_LABEL: Record<ArenaNodeType, string> = {
  goal: "Goal",
  skill: "Skill",
  agent: "Agent",
  condition: "Condition",
  output: "Output",
};

// ── Status helpers ──────────────────────────────────────────────────────────

type NodeStatus = "idle" | "running" | "completed" | "failed";

function statusClasses(status: NodeStatus): string {
  switch (status) {
    case "running":
      return "animate-pulse ring-2 ring-blue-400/60";
    case "completed":
      return "ring-1 ring-emerald-400/40";
    case "failed":
      return "ring-2 ring-red-400/60";
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
    default:
      return null;
  }
}

// ── Component ───────────────────────────────────────────────────────────────

type ArenaNodeProps = NodeProps & {
  data: ArenaNodeData & {
    nodeType?: ArenaNodeType;
    status?: NodeStatus;
  };
};

const ArenaNode: FC<ArenaNodeProps> = ({ data, selected }) => {
  const nodeType = (data.nodeType as ArenaNodeType) ?? "goal";
  const style = NODE_STYLE[nodeType] ?? NODE_STYLE.goal;
  const label = NODE_LABEL[nodeType] ?? nodeType;
  const status = (data.status as NodeStatus) ?? "idle";

  const isCondition = nodeType === "condition";

  return (
    <div
      className={`relative min-w-[220px] max-w-[320px] rounded-xl bg-surface/90 backdrop-blur-sm transition-all ${statusClasses(status)} ${selected ? "ring-2 ring-accent" : ""}`}
    >
      {/* Input handle (left side) */}
      {nodeType !== "goal" && (
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3 !h-3 !bg-muted !border-none hover:!bg-accent transition-colors"
          id="input"
        />
      )}

      {/* Output handle (right side) */}
      {nodeType !== "output" && !isCondition && (
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !bg-accent !border-none hover:!bg-accent/80 transition-colors"
          id="output"
        />
      )}

      {/* Condition outputs: success (top-right) and failure (bottom-right) */}
      {isCondition && (
        <>
          <Handle
            type="source"
            position={Position.Right}
            className="!w-3 !h-3 !bg-emerald-500 !border-none"
            id="success"
            title="Success"
          />
          <Handle
            type="source"
            position={Position.Bottom}
            className="!w-3 !h-3 !bg-red-500 !border-none"
            id="failure"
            title="Failure"
          />
        </>
      )}

      {/* Node body */}
      <div className="p-3 space-y-2">
        {/* Header: badge + label */}
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full ${style.badgeBg} ${style.badge}`}
          >
            {label}
          </span>
          {statusText(status) && (
            <span className="text-[10px] uppercase font-bold tracking-wider ml-auto text-muted">
              {statusText(status)}
            </span>
          )}
        </div>

        {/* Title */}
        <div className="text-sm font-medium text-foreground leading-tight">
          {data.prompt?.slice(0, 80) ??
            data.skillName ??
            data.conditionExpr?.slice(0, 60) ??
            data.outputTemplate?.slice(0, 60) ??
            label}
        </div>

        {/* Subtle field previews */}
        {nodeType === "skill" && data.skillName && (
          <div className="text-[10px] text-muted font-mono truncate">skill: {data.skillName}</div>
        )}
        {nodeType === "condition" && data.conditionExpr && (
          <div className="text-[10px] text-muted font-mono truncate">if: {data.conditionExpr}</div>
        )}
        {(nodeType === "goal" || nodeType === "agent") && data.model && (
          <div className="text-[10px] text-muted truncate">model: {data.model}</div>
        )}
      </div>
    </div>
  );
};

export default memo(ArenaNode);
