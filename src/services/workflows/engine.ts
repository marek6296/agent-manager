// Workflow Execution Engine
// Traverses a workflow graph and executes nodes sequentially

import { createClient } from "@supabase/supabase-js";
import { generateText, summarize, classify, generateReply } from "@/lib/ai";
import { getInboxMessages, sendEmail, refreshAccessToken } from "@/lib/integrations/gmail";
import type { WorkflowNode, WorkflowEdge, WorkflowRunLog } from "@/lib/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface ExecutionContext {
  workflowId: string;
  runId: string;
  userId: string;
  nodeOutputs: Map<string, unknown>;
  logs: WorkflowRunLog[];
}

function getStartNodes(nodes: WorkflowNode[], edges: WorkflowEdge[]): WorkflowNode[] {
  const targetIds = new Set(edges.map((e) => e.target));
  return nodes.filter((n) => !targetIds.has(n.id));
}

function getNextNodes(nodeId: string, nodes: WorkflowNode[], edges: WorkflowEdge[]): WorkflowNode[] {
  const outgoing = edges.filter((e) => e.source === nodeId);
  return outgoing.map((e) => nodes.find((n) => n.id === e.target)).filter(Boolean) as WorkflowNode[];
}

async function executeNode(
  node: WorkflowNode,
  context: ExecutionContext,
  previousOutput: unknown
): Promise<unknown> {
  const nodeType = node.data.config?.nodeType || node.type;
  const config = (node.data.config || {}) as Record<string, string>;

  context.logs.push({
    node_id: node.id,
    message: `Executing node: ${node.data.label}`,
    timestamp: new Date().toISOString(),
  });

  try {
    switch (nodeType) {
      case "new_email": {
        // Fetch emails from Gmail
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { data: integration } = await supabase
          .from("integrations")
          .select("*")
          .eq("user_id", context.userId)
          .eq("provider", "gmail")
          .eq("connected", true)
          .single();

        if (!integration) {
          throw new Error("Gmail not connected");
        }

        let accessToken = integration.access_token;
        if (new Date(integration.token_expiry) < new Date()) {
          const tokens = await refreshAccessToken(integration.refresh_token);
          accessToken = tokens.access_token;
          await supabase.from("integrations").update({
            access_token: tokens.access_token,
            token_expiry: new Date(tokens.expiry_date).toISOString(),
          }).eq("id", integration.id);
        }

        const messages = await getInboxMessages(accessToken, parseInt(config["Max Messages"] || "5"));
        return messages;
      }

      case "summarize": {
        const text = typeof previousOutput === "string" ? previousOutput : JSON.stringify(previousOutput);
        const result = await summarize(text);
        return result;
      }

      case "classify": {
        const text = typeof previousOutput === "string" ? previousOutput : JSON.stringify(previousOutput);
        const categories = (config["Categories"] || "").split(",").map((c: string) => c.trim());
        const result = await classify(text, categories);
        return result;
      }

      case "generate_reply": {
        const text = typeof previousOutput === "string" ? previousOutput : JSON.stringify(previousOutput);
        const instructions = config["Instructions"] || "Generate a professional reply";
        const result = await generateReply(text, instructions);
        return result;
      }

      case "generate_text": {
        const prompt = (config["Prompt Template"] || "").replace("{{input}}", String(previousOutput || ""));
        const result = await generateText(prompt);
        return result;
      }

      case "send_email": {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { data: integration } = await supabase
          .from("integrations")
          .select("*")
          .eq("user_id", context.userId)
          .eq("provider", "gmail")
          .eq("connected", true)
          .single();

        if (!integration) throw new Error("Gmail not connected");

        const to = config["To"] || "";
        const subject = config["Subject"] || "Automated Email";
        const body = (config["Body Template"] || "").replace("{{input}}", String(previousOutput || ""));

        await sendEmail(integration.access_token, to, subject, body);
        return { sent: true, to, subject };
      }

      case "notification": {
        const message = (config["Message Template"] || "").replace("{{input}}", String(previousOutput || ""));
        console.log(`[Notification] ${message}`);
        return { notified: true, message };
      }

      case "store_data": {
        return { stored: true, data: previousOutput };
      }

      case "schedule":
      case "webhook":
        return previousOutput || { triggered: true };

      default:
        return previousOutput;
    }
  } catch (error) {
    context.logs.push({
      node_id: node.id,
      message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

export async function executeWorkflow(
  workflowId: string,
  userId: string,
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): Promise<WorkflowRunLog[]> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Create a workflow run record
  const { data: run } = await supabase.from("workflow_runs").insert({
    workflow_id: workflowId,
    status: "running",
    logs: [],
  }).select().single();

  if (!run) throw new Error("Failed to create workflow run");

  const context: ExecutionContext = {
    workflowId,
    runId: run.id,
    userId,
    nodeOutputs: new Map(),
    logs: [],
  };

  try {
    // Find start nodes (triggers)
    const startNodes = getStartNodes(nodes, edges);

    // Execute graph BFS
    const queue = [...startNodes];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const node = queue.shift()!;
      if (visited.has(node.id)) continue;
      visited.add(node.id);

      // Get input from parent nodes
      const parentEdges = edges.filter((e) => e.target === node.id);
      const previousOutput = parentEdges.length > 0
        ? context.nodeOutputs.get(parentEdges[0].source)
        : undefined;

      const output = await executeNode(node, context, previousOutput);
      context.nodeOutputs.set(node.id, output);

      context.logs.push({
        node_id: node.id,
        message: `Completed: ${node.data.label}`,
        timestamp: new Date().toISOString(),
        data: output,
      });

      // Add next nodes to queue
      const nextNodes = getNextNodes(node.id, nodes, edges);
      queue.push(...nextNodes);
    }

    // Update run status
    await supabase.from("workflow_runs").update({
      status: "completed",
      logs: context.logs,
      completed_at: new Date().toISOString(),
    }).eq("id", run.id);
  } catch (error) {
    await supabase.from("workflow_runs").update({
      status: "failed",
      logs: context.logs,
      completed_at: new Date().toISOString(),
    }).eq("id", run.id);
  }

  return context.logs;
}
