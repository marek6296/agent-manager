export type AgentStatus = 'running' | 'stopped' | 'error';
export type AgentType = 'email_summarizer' | 'email_auto_reply' | 'data_analyzer' | 'custom';
export type WorkflowRunStatus = 'pending' | 'running' | 'completed' | 'failed';
export type LogLevel = 'info' | 'warning' | 'error' | 'success' | 'pending_reply' | 'sent' | 'rejected';
export type IntegrationProvider = 'gmail' | 'instagram' | 'telegram' | 'discord' | 'whatsapp';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Agent {
  id: string;
  user_id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  config_json: Record<string, unknown>;
  prompt: string;
  schedule: string;
  integration_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Integration {
  id: string;
  user_id: string;
  provider: IntegrationProvider;
  access_token?: string;
  refresh_token?: string;
  token_expiry?: string;
  scopes?: string[];
  metadata: Record<string, unknown>;
  connected: boolean;
  created_at: string;
  updated_at: string;
}

export interface Workflow {
  id: string;
  user_id: string;
  name: string;
  description: string;
  nodes_json: WorkflowNode[];
  edges_json: WorkflowEdge[];
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    config?: Record<string, unknown>;
    [key: string]: unknown;
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
}

export interface WorkflowRun {
  id: string;
  workflow_id: string;
  status: WorkflowRunStatus;
  logs: WorkflowRunLog[];
  started_at: string;
  completed_at?: string;
  created_at: string;
}

export interface WorkflowRunLog {
  node_id: string;
  message: string;
  timestamp: string;
  data?: unknown;
}

export interface AgentLog {
  id: string;
  agent_id: string;
  level: LogLevel;
  message: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

// Dashboard metrics
export interface DashboardMetrics {
  agentsRunning: number;
  totalAgents: number;
  integrationsConnected: number;
  workflowsActive: number;
  totalWorkflows: number;
  recentExecutions: WorkflowRun[];
}
