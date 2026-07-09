"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { memo, type FC } from "react";
import type { ArenaNodeData, ArenaNodeType } from "./ArenaGatewayClient";

const NODE_LABEL: Record<ArenaNodeType, string> = {
  goal: "Schedule trigger",
  skill: "HTTP API Request",
  agent: "Agent Executor",
  condition: "Conditional",
  output: "Output Template",
};

const NODE_ICON: Record<ArenaNodeType, string> = {
  goal: "✶",
  skill: "<>",
  agent: "⌘",
  condition: "⌥",
  output: "✓",
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
  const label = NODE_LABEL[nodeType] ?? nodeType;
  const icon = NODE_ICON[nodeType] ?? "*";
  const status = (data.status as NodeStatus) ?? "idle";

  const isCondition = nodeType === "condition";

  // Build key-value rows matching reference design
  const rows: { key: string; value: string; isStatus?: boolean }[] = [];

  if (nodeType === "goal") {
    rows.push({ key: "Cadence", value: "Every 5 min" });
    rows.push({ key: "Prompt", value: data.prompt ?? "Enter task..." });
    if (data.model) {
      rows.push({ key: "Model", value: data.model });
    }
  } else if (nodeType === "skill") {
    rows.push({ key: "Method and endpoint", value: data.skillName ?? "None" });
    if (data.prompt) {
      rows.push({ key: "Prompt", value: data.prompt });
    }
  } else if (nodeType === "agent") {
    rows.push({ key: "Agent model", value: data.model ?? "Default" });
    rows.push({ key: "Prompt", value: data.prompt ?? "Enter task..." });
    if (data.thinking) {
      rows.push({ key: "Thinking", value: data.thinking });
    }
  } else if (nodeType === "condition") {
    rows.push({ key: "Condition", value: data.conditionExpr ?? "None" });
  } else if (nodeType === "output") {
    rows.push({ key: "Template", value: data.outputTemplate ?? "None" });
  }

  if (status !== "idle") {
    rows.push({ key: "Status", value: statusText(status) ?? "Idle", isStatus: true });
  }

  return (
    <div
      className={`relative min-w-[240px] max-w-[320px] rounded-2xl bg-overlay p-4 text-foreground transition-all ${statusClasses(status)} ${selected ? "ring-2 ring-accent" : ""}`}
    >
      {/* Optional Start label above Goal node */}
      {nodeType === "goal" && (
        <div className="absolute -top-5 left-0 text-[10px] font-bold text-foreground/60 uppercase tracking-wider">
          Start
        </div>
      )}

      {/* Input handle (left side) - ring shape */}
      {nodeType !== "goal" && (
        <Handle
          type="target"
          position={Position.Left}
          className="!w-2.5 !h-2.5 !bg-white !border-2 !border-black hover:!bg-black transition-colors"
          id="input"
        />
      )}

      {/* Output handle (right side) - ring shape */}
      {nodeType !== "output" && !isCondition && (
        <Handle
          type="source"
          position={Position.Right}
          className="!w-2.5 !h-2.5 !bg-white !border-2 !border-black hover:!bg-black transition-colors"
          id="output"
        />
      )}

      {/* Condition outputs: success (top-right, green ring) and failure (bottom-right, red ring) */}
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

      {/* Node Content */}
      <div className="space-y-3">
        {/* Header: icon + title + ... */}
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <span className="text-muted/80 font-mono text-sm font-semibold">{icon}</span>
            <span className="font-bold text-sm text-foreground">{label}</span>
          </div>
          <span className="text-muted/40 text-xs font-bold tracking-widest cursor-pointer select-none">
            ...
          </span>
        </div>

        {/* Properties table */}
        <div className="space-y-2 text-xs">
          {rows.map((row, i) => (
            <div key={i} className="flex justify-between items-start gap-4">
              <span className="text-muted/60 font-medium shrink-0">{row.key}</span>
              <span
                className={`font-semibold text-right break-all max-w-[150px] ${
                  row.isStatus
                    ? status === "completed"
                      ? "text-emerald-500"
                      : status === "failed"
                        ? "text-red-500"
                        : "text-blue-500"
                    : "text-foreground"
                }`}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default memo(ArenaNode);
