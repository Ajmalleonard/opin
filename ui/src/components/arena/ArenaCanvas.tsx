"use client";

import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Node,
  type Edge,
  type NodeTypes,
  BackgroundVariant,
  type NodeChange,
  type EdgeChange,
} from "@xyflow/react";
import { useCallback, useMemo, type FC } from "react";
import "@xyflow/react/dist/style.css";
import type { ArenaGraph, ArenaNodeRun } from "./ArenaGatewayClient";
import ArenaNode from "./ArenaNode";

const nodeTypes: NodeTypes = {
  arenaNode: ArenaNode,
};

// ── Convert ArenaGraph → React Flow nodes/edges ────────────────────────────

function graphToReactFlow(
  graph: ArenaGraph,
  nodeStatuses: Map<string, ArenaNodeRun>,
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = graph.nodes.map((n) => {
    const run = nodeStatuses.get(n.id);
    const status: string =
      run?.status === "running"
        ? "running"
        : run?.status === "completed"
          ? "completed"
          : run?.status === "failed"
            ? "failed"
            : "idle";

    return {
      id: n.id,
      type: "arenaNode",
      position: n.position,
      data: {
        ...n.data,
        nodeType: n.type,
        status,
      },
    };
  });

  const edges: Edge[] = graph.edges.map((e) => {
    let strokeColor = "var(--accent, #000)";
    if (e.sourceHandle === "success") {
      strokeColor = "#22c55e"; // Green for True/Success
    } else if (e.sourceHandle === "failure") {
      strokeColor = "#ef4444"; // Red for False/Failure
    }

    return {
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
      label: e.label,
      animated: nodeStatuses.get(e.source)?.status === "completed",
      style: {
        stroke: strokeColor,
        strokeWidth: 3,
      },
    };
  });

  return { nodes, edges };
}

// ── Props ───────────────────────────────────────────────────────────────────

interface ArenaCanvasProps {
  graph: ArenaGraph | null;
  nodeStatuses: Map<string, ArenaNodeRun>;
  onNodesChange?: (nodes: Node[]) => void;
  onEdgesChange?: (edges: Edge[]) => void;
  onConnect?: (connection: Connection) => void;
  onNodeClick?: (nodeId: string) => void;
  readOnly?: boolean;
}

const ArenaCanvas: FC<ArenaCanvasProps> = ({
  graph,
  nodeStatuses,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  readOnly = false,
}) => {
  // Convert graph to React Flow format
  const initial = useMemo(() => {
    if (!graph) {
      return { nodes: [], edges: [] };
    }
    return graphToReactFlow(graph, nodeStatuses);
  }, [graph, nodeStatuses]);

  const [nodes, setNodes, onNodesChangeInternal] = useNodesState(initial.nodes);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState(initial.edges);

  // Sync when initial changes
  useMemo(() => {
    setNodes(initial.nodes);
    setEdges(initial.edges);
  }, [initial.nodes, initial.edges]);

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (readOnly) {
        return;
      }
      setEdges((eds) => addEdge(connection, eds));
      onConnect?.(connection);
    },
    [readOnly, setEdges, onConnect],
  );

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      if (readOnly) {
        return;
      }
      onNodesChangeInternal(changes);
      // Notify parent of new positions
      onNodesChange?.(nodes);
    },
    [readOnly, onNodesChangeInternal, nodes, onNodesChange],
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      if (readOnly) {
        return;
      }
      onEdgesChangeInternal(changes);
      onEdgesChange?.(edges);
    },
    [readOnly, onEdgesChangeInternal, edges, onEdgesChange],
  );

  if (!graph) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <h2 className="text-lg font-semibold text-foreground uppercase tracking-wider">
            No Graph Selected
          </h2>
          <p className="text-xs text-muted max-w-sm leading-normal">
            Create a new graph, select one from the sidebar, or use Prompt to Nodes to generate one
            automatically.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onNodeClick={(_evt, node) => onNodeClick?.(node.id)}
        nodeTypes={nodeTypes}
        fitView
        deleteKeyCode={readOnly ? null : ["Backspace", "Delete"]}
        multiSelectionKeyCode="Shift"
        className="bg-background"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="var(--separator, #e5e5e5)"
        />
        <Controls
          className="!bg-surface !border-none !rounded-lg"
          position="bottom-right"
          showInteractive={false}
        />
        <MiniMap
          className="!bg-surface !border-none !rounded-lg"
          nodeColor={(n) => {
            const type = n.data?.nodeType as string;
            switch (type) {
              case "goal":
                return "#3b82f6";
              case "skill":
                return "#10b981";
              case "agent":
                return "#8b5cf6";
              case "condition":
                return "#f59e0b";
              case "output":
                return "#64748b";
              default:
                return "#555";
            }
          }}
        />
      </ReactFlow>
    </div>
  );
};

export default ArenaCanvas;
