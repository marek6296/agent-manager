"use client";

import { useCallback, useState, useRef, useMemo } from "react";
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  Panel,
  type Connection,
  type Node,
  type Edge,
  type NodeTypes,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, Play, ArrowLeft, Workflow } from "lucide-react";
import { TriggerNode } from "./nodes/trigger-node";
import { ActionNode } from "./nodes/action-node";
import { AiNode } from "./nodes/ai-node";
import { NodeSidebar } from "./node-sidebar";
import { NodeConfigPanel } from "./node-config-panel";

const nodeTypes: NodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  ai: AiNode,
};

interface WorkflowBuilderInnerProps {
  workflowId?: string;
  initialName?: string;
  initialNodes?: Node[];
  initialEdges?: Edge[];
}

function WorkflowBuilderInner({
  workflowId,
  initialName = "Untitled Workflow",
  initialNodes = [],
  initialEdges = [],
}: WorkflowBuilderInnerProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [workflowName, setWorkflowName] = useState(initialName);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [saving, setSaving] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, type: "smoothstep", animated: true }, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow-type");
      const label = event.dataTransfer.getData("application/reactflow-label");
      const category = event.dataTransfer.getData("application/reactflow-category");

      if (!type || !reactFlowWrapper.current) return;

      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = {
        x: event.clientX - bounds.left - 100,
        y: event.clientY - bounds.top - 25,
      };

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type: category,
        position,
        data: { label, nodeType: type, config: {} },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  const updateNodeConfig = useCallback(
    (nodeId: string, config: Record<string, unknown>) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, config } }
            : node
        )
      );
      if (selectedNode?.id === nodeId) {
        setSelectedNode((prev) =>
          prev ? { ...prev, data: { ...prev.data, config } } : null
        );
      }
    },
    [setNodes, selectedNode]
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (workflowId) {
        await supabase.from("workflows").update({
          name: workflowName,
          nodes_json: nodes,
          edges_json: edges,
          updated_at: new Date().toISOString(),
        }).eq("id", workflowId);
      } else {
        const { data } = await supabase.from("workflows").insert({
          user_id: user.id,
          name: workflowName,
          nodes_json: nodes,
          edges_json: edges,
        }).select().single();
        if (data) {
          router.push(`/workflows/${data.id}`);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-full" ref={reactFlowWrapper}>
      {/* Node Sidebar */}
      <NodeSidebar />

      {/* Flow Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          onDragOver={onDragOver}
          onDrop={onDrop}
          nodeTypes={nodeTypes}
          fitView
          className="bg-zinc-950"
          defaultEdgeOptions={{ type: "smoothstep", animated: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#27272a" />
          <Controls className="!bg-zinc-900 !border-zinc-800 !rounded-lg" />

          {/* Top Bar */}
          <Panel position="top-left" className="flex items-center gap-3">
            <button
              onClick={() => router.push("/workflows")}
              className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-zinc-400" />
            </button>
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5">
              <Workflow className="w-4 h-4 text-violet-400" />
              <Input
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                className="border-0 bg-transparent h-7 px-0 text-sm font-medium focus-visible:ring-0 w-48"
                placeholder="Workflow name..."
              />
            </div>
          </Panel>

          <Panel position="top-right" className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="border-zinc-800 bg-zinc-900"
            >
              <Save className="w-3.5 h-3.5 mr-1.5" />
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button
              size="sm"
              className="bg-violet-600 hover:bg-violet-700"
              disabled={nodes.length === 0}
            >
              <Play className="w-3.5 h-3.5 mr-1.5" />
              Run
            </Button>
          </Panel>
        </ReactFlow>
      </div>

      {/* Config Panel */}
      {selectedNode && (
        <NodeConfigPanel
          node={selectedNode}
          onUpdateConfig={(config) => updateNodeConfig(selectedNode.id, config)}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
}

export function WorkflowBuilder(props: WorkflowBuilderInnerProps) {
  return (
    <ReactFlowProvider>
      <WorkflowBuilderInner {...props} />
    </ReactFlowProvider>
  );
}
